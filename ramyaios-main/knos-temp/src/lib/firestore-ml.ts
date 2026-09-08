import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { elapsedMinutes, isPendingRecord, itemCount, itemName, selectEligibleRobot, timestampToDate, toPriorityTask } from "@/lib/ml-mappers";

type FirestoreRecord = Record<string, any>;

export type MlStateRecord = FirestoreRecord & {
  taskId: string;
  orderId: string;
  tableId: string | null;
  taskType: string;
  sourceCollection: string;
  sourceDocumentId: string;
};

export type RestaurantMlState = {
  pendingRecords: MlStateRecord[];
  activeOrders: MlStateRecord[];
  robots: FirestoreRecord[];
  inventory: FirestoreRecord[];
  warnings: string[];
};

async function readUserCollection(collectionName: string, userId: string, warnings: string[]): Promise<FirestoreRecord[]> {
  try {
    const snapshot = await getDocs(query(collection(db, collectionName), where("userId", "==", userId)));
    return snapshot.docs.map((snapshotDoc): FirestoreRecord => ({ id: snapshotDoc.id, ...snapshotDoc.data() }));
  } catch {
    warnings.push(`Unable to read ${collectionName} from Firestore.`);
    return [];
  }
}

function orderRecord(sourceCollection: string, order: FirestoreRecord): MlStateRecord {
  return {
    ...order,
    taskId: `${sourceCollection}-${order.id}`,
    orderId: order.id,
    tableId: order.tableId ?? order.tableNo?.toString() ?? null,
    taskType: "delivery",
    sourceCollection,
    sourceDocumentId: order.id,
  };
}

function taskRecord(task: FirestoreRecord): MlStateRecord {
  return {
    ...task,
    taskId: task.id,
    orderId: task.orderId ?? task.id,
    tableId: task.tableId?.toString() ?? task.tableNo?.toString() ?? null,
    taskType: task.taskType ?? "staff_assistance",
    sourceCollection: "restaurant_tasks",
    sourceDocumentId: task.id,
  };
}

export async function loadRestaurantMlState(userId: string): Promise<RestaurantMlState> {
  const warnings: string[] = [];
  const [qrOrders, apiOrders, tasks, robots, ingredients, inventory] = await Promise.all([
    readUserCollection("qr_orders", userId, warnings),
    readUserCollection("api_orders", userId, warnings),
    readUserCollection("restaurant_tasks", userId, warnings),
    readUserCollection("robots", userId, warnings),
    readUserCollection("ingredients", userId, warnings),
    readUserCollection("inventory", userId, warnings),
  ]);

  const activeOrders = [...qrOrders.map((order) => orderRecord("qr_orders", order)), ...apiOrders.map((order) => orderRecord("api_orders", order))]
    .filter(isPendingRecord);
  const pendingRecords = [...activeOrders, ...tasks.map(taskRecord).filter(isPendingRecord)];

  return { pendingRecords, activeOrders, robots, inventory: [...ingredients, ...inventory], warnings };
}

export function priorityPayload(state: RestaurantMlState, trigger?: string) {
  const robot = selectEligibleRobot(state.robots);
  return {
    trigger: trigger ?? "manual_refresh",
    tasks: state.pendingRecords.map((record) => toPriorityTask(record, robot)),
    robot,
  };
}

export async function persistPriorityResults(
  records: MlStateRecord[],
  rankedTasks: Array<{ task_id?: string; priority_score?: number; priority_level?: string; reasons?: string[] }>,
  nextTaskId: string | undefined,
  assignedRobotId: string | undefined,
) {
  const byTaskId = new Map(records.map((record) => [record.taskId, record]));
  const writes = rankedTasks.flatMap((result) => {
    const record = result.task_id ? byTaskId.get(result.task_id) : undefined;
    if (!record) return [];
    const update: FirestoreRecord = {
      priorityScore: result.priority_score ?? null,
      priorityLevel: result.priority_level ?? "LOW",
      priorityReasons: Array.isArray(result.reasons) ? result.reasons : [],
      priorityUpdatedAt: new Date().toISOString(),
    };
    if (record.taskId === nextTaskId && assignedRobotId) update.assignedRobot = assignedRobotId;
    return [updateDoc(doc(db, record.sourceCollection, record.sourceDocumentId), update)];
  });
  await Promise.allSettled(writes);
}

export function analyticsInputs(state: RestaurantMlState, now = new Date()) {
  const recentDemand = state.activeOrders.filter((order) => elapsedMinutes(order.timestamp ?? order.createdAt ?? order.orderTime, now) <= 60).length;
  const firstItem = state.activeOrders.map((order) => itemName(order.items)).find(Boolean) ?? "mixed";
  const totalItems = state.activeOrders.reduce((total, order) => total + itemCount(order.items), 0);
  const robot = selectEligibleRobot(state.robots);
  return {
    hour: now.getHours(),
    day_of_week: (now.getDay() + 6) % 7,
    month: now.getMonth() + 1,
    is_weekend: now.getDay() === 0 || now.getDay() === 6,
    item: firstItem,
    recent_demand: recentDemand,
    activeOrders: state.activeOrders.length,
    averageItemCount: state.activeOrders.length ? Math.max(1, Math.round(totalItems / state.activeOrders.length)) : 0,
    robot,
  };
}

export function anomalyPayload(state: RestaurantMlState, expectedMinutes?: number, now = new Date()) {
  const orders = state.activeOrders
    .filter((order) => expectedMinutes || Number.isFinite(Number(order.expectedPreparationTime)))
    .map((order) => ({
      order_id: order.orderId,
      status: order.status ?? "pending",
      elapsed_minutes: elapsedMinutes(order.preparingTime ?? order.timestamp ?? order.createdAt, now),
      expected_minutes: Number(order.expectedPreparationTime) || expectedMinutes,
    }));
  const robots = state.robots.map((robot) => ({
    robot_id: robot.id,
    status: robot.status,
    battery: robot.battery ?? robot.batteryPercent ?? robot.battery_percent,
    idle_minutes: elapsedMinutes(robot.idleSince ?? robot.lastTaskCompletedAt, now),
  }));
  const delays = state.activeOrders.flatMap((order) => {
    const history = Array.isArray(order.historicalServiceMinutes) ? order.historicalServiceMinutes : [];
    return history.length >= 3 ? [{
      order_id: order.orderId,
      current_minutes: elapsedMinutes(order.timestamp ?? order.createdAt, now),
      historical_minutes: history,
    }] : [];
  });
  return { pending_tasks: state.pendingRecords.length, orders, robots, delays };
}

export async function findOrderForAssistant(userId: string, orderId?: string, tableId?: string) {
  const collections = ["qr_orders", "api_orders"];
  if (orderId) {
    for (const collectionName of collections) {
      const snapshot = await getDoc(doc(db, collectionName, orderId));
      if (snapshot.exists() && snapshot.data().userId === userId) return { id: snapshot.id, source: collectionName, ...snapshot.data() };
    }
  }
  if (!tableId) return null;
  for (const collectionName of collections) {
    const rows = await readUserCollection(collectionName, userId, []);
    const matching = rows.filter((row) => String(row.tableNo ?? row.tableId) === String(tableId) && isPendingRecord(row));
    if (matching.length) return matching.sort((a, b) => (timestampToDate(b.timestamp)?.getTime() ?? 0) - (timestampToDate(a.timestamp)?.getTime() ?? 0))[0];
  }
  return null;
}

export async function createStaffAssistanceTask(userId: string, message: string, tableId?: string, orderId?: string) {
  const createdAt = new Date().toISOString();
  const task = await addDoc(collection(db, "restaurant_tasks"), {
    userId,
    taskType: "staff_assistance",
    status: "pending",
    urgency: true,
    tableId: tableId ?? null,
    orderId: orderId ?? null,
    message,
    source: "guest_assistant",
    createdAt,
  });
  return task.id;
}

export async function storeFeedback(userId: string, message: string, sentiment: FirestoreRecord, tableId?: string, orderId?: string) {
  const feedback = await addDoc(collection(db, "guest_feedback"), {
    userId,
    tableId: tableId ?? null,
    orderId: orderId ?? null,
    message,
    sentiment: sentiment.sentiment ?? "NEUTRAL",
    sentimentScore: sentiment.score ?? null,
    sentimentAlgorithm: sentiment.algorithm ?? null,
    source: "guest_assistant",
    createdAt: new Date().toISOString(),
  });
  return feedback.id;
}

export async function findFaqAnswer(userId: string, message: string) {
  const faqs = await readUserCollection("restaurant_faqs", userId, []);
  const words = new Set(message.toLowerCase().match(/[a-z0-9]+/g) ?? []);
  const match = faqs.find((faq) => {
    const searchable = [faq.question, ...(Array.isArray(faq.keywords) ? faq.keywords : [])].join(" ").toLowerCase();
    return [...words].some((word) => word.length > 2 && searchable.includes(word));
  });
  return match?.answer ? String(match.answer) : null;
}
