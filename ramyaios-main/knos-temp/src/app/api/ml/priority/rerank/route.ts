import { NextResponse } from "next/server";
import { loadRestaurantMlState, persistPriorityResults, priorityPayload } from "@/lib/firestore-ml";
import { MlServiceError, mlClient } from "@/lib/ml-client";
import { requireUserId } from "@/lib/ml-mappers";

export const runtime = "nodejs";

function errorResponse(error: unknown) {
  if (error instanceof MlServiceError) {
    const status = error.code === "ML_REQUEST_FAILED" ? error.status ?? 502 : 503;
    return NextResponse.json({ error: error.message, code: error.code }, { status });
  }
  return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to rerank restaurant tasks." }, { status: 400 });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = requireUserId(body.userId);
    const state = await loadRestaurantMlState(userId);
    const payload = priorityPayload(state, typeof body.trigger === "string" ? body.trigger : undefined);
    const defaultTasks = [
      {
        task_id: "order-1046-T7",
        order_id: "#1046",
        table_id: "Table 7",
        task_type: "delivery",
        waiting_time_minutes: 30,
        food_age_minutes: 25,
        food_temperature_c: 44,
        distance_m: 14,
        robot_battery_percent: 85,
        urgency_flag: true,
        order_delay_minutes: 15,
        robot_available: true,
      },
      {
        task_id: "order-1044-T12",
        order_id: "#1044",
        table_id: "Table 12",
        task_type: "delivery",
        waiting_time_minutes: 18,
        food_age_minutes: 14,
        food_temperature_c: 52,
        distance_m: 9,
        robot_battery_percent: 85,
        urgency_flag: false,
        order_delay_minutes: 6,
        robot_available: true,
      },
      {
        task_id: "order-1045-T2",
        order_id: "#1045",
        table_id: "Table 2",
        task_type: "delivery",
        waiting_time_minutes: 5,
        food_age_minutes: 3,
        food_temperature_c: 68,
        distance_m: 4,
        robot_battery_percent: 85,
        urgency_flag: false,
        order_delay_minutes: 0,
        robot_available: true,
      },
    ];
    const tasksToRank = payload.tasks.length ? payload.tasks : defaultTasks;
    const result = await mlClient.rerank({ tasks: tasksToRank, trigger: payload.trigger });
    const nextTaskId = result.next_best_task?.task_id;
    const assignedRobotId = nextTaskId && payload.robot ? payload.robot.id : (nextTaskId ? "Nexus-01" : undefined);

    if (state.pendingRecords.length > 0) {
      await persistPriorityResults(state.pendingRecords, result.ranked_tasks ?? [], nextTaskId, assignedRobotId);
    }

    return NextResponse.json({
      ranked_tasks: result.ranked_tasks ?? [],
      next_best_task: result.next_best_task ?? null,
      assignedRobot: assignedRobotId ?? null,
      trigger: result.trigger ?? payload.trigger,
      sourceCounts: { pendingTasks: state.pendingRecords.length, robots: state.robots.length },
      warnings: state.warnings,
    });
  } catch (error) {
    return errorResponse(error);
  }
}
