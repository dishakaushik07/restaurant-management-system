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
    const result = await mlClient.rerank({ tasks: payload.tasks, trigger: payload.trigger });
    const nextTaskId = result.next_best_task?.task_id;
    const assignedRobotId = nextTaskId && payload.robot ? payload.robot.id : undefined;

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
