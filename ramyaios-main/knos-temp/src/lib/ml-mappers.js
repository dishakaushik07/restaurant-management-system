const FINISHED_ORDER_STATUSES = new Set(["completed", "delivered", "cancelled", "canceled", "billed", "paid"]);
const AVAILABLE_ROBOT_STATUSES = new Set(["idle", "available"]);

export function numberValue(value, fallback = 0) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

export function timestampToDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function elapsedMinutes(value, now = new Date()) {
  const timestamp = timestampToDate(value);
  return timestamp ? Math.max(0, (now.getTime() - timestamp.getTime()) / 60000) : 0;
}

export function isPendingRecord(record) {
  return !FINISHED_ORDER_STATUSES.has(String(record.status || "pending").toLowerCase());
}

export function isSafetyEligibleRobot(robot) {
  const status = String(robot.status || "").toLowerCase();
  const battery = numberValue(robot.battery ?? robot.batteryPercent ?? robot.battery_percent);
  return AVAILABLE_ROBOT_STATUSES.has(status) && battery >= 20 && robot.emergencyStop !== true && robot.obstacleDetected !== true;
}

export function selectEligibleRobot(robots) {
  return robots.filter(isSafetyEligibleRobot).sort((a, b) =>
    numberValue(b.battery ?? b.batteryPercent ?? b.battery_percent) - numberValue(a.battery ?? a.batteryPercent ?? a.battery_percent),
  )[0] || null;
}

export function itemCount(items) {
  if (!Array.isArray(items)) return 0;
  return items.reduce((total, item) => total + Math.max(0, numberValue(item.qty ?? item.quantity, 1)), 0);
}

export function itemName(items) {
  if (!Array.isArray(items) || !items[0]) return null;
  return String(items[0].name ?? items[0].itemName ?? items[0].title ?? "").trim() || null;
}

export function toPriorityTask(record, robot, now = new Date()) {
  const createdAt = record.createdAt ?? record.timestamp ?? record.orderTime;
  const readyAt = record.readyTime ?? record.foodReadyAt;
  const isReady = String(record.status || "").toLowerCase() === "ready";
  const battery = robot ? numberValue(robot.battery ?? robot.batteryPercent ?? robot.battery_percent) : 0;

  return {
    task_id: record.taskId,
    order_id: record.orderId || record.taskId,
    table_id: record.tableId ? String(record.tableId) : null,
    task_type: record.taskType || "delivery",
    waiting_time_minutes: elapsedMinutes(createdAt, now),
    food_age_minutes: isReady ? elapsedMinutes(readyAt || createdAt, now) : 0,
    food_temperature_c: Number.isFinite(Number(record.foodTemperatureC)) ? Number(record.foodTemperatureC) : null,
    distance_m: Math.max(0, numberValue(record.distanceM ?? record.distance_m)),
    robot_battery_percent: battery,
    urgency_flag: record.urgency === true || record.urgencyFlag === true,
    order_delay_minutes: Math.max(0, numberValue(record.orderDelayMinutes ?? record.order_delay_minutes)),
    robot_available: Boolean(robot),
  };
}

export function requireUserId(value) {
  if (typeof value !== "string" || !value.trim()) throw new Error("userId is required.");
  return value.trim();
}
