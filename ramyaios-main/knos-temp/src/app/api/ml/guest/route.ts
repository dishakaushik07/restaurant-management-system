import { NextResponse } from "next/server";
import { createStaffAssistanceTask, findFaqAnswer, findOrderForAssistant, storeFeedback } from "@/lib/firestore-ml";
import { MlServiceError, mlClient } from "@/lib/ml-client";
import { requireUserId } from "@/lib/ml-mappers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = requireUserId(body.userId);
    const message = typeof body.message === "string" ? body.message.trim() : "";
    if (!message) return NextResponse.json({ error: "message is required." }, { status: 400 });
    const tableId = typeof body.tableId === "string" ? body.tableId.trim() || undefined : undefined;
    const orderId = typeof body.orderId === "string" ? body.orderId.trim() || undefined : undefined;
    const [intent, sentiment] = await Promise.all([
      mlClient.intent({ message, user_id: userId, table_id: tableId, order_id: orderId }),
      mlClient.sentiment({ message, user_id: userId, table_id: tableId, order_id: orderId }),
    ]);

    if (intent.intent === "ORDER_STATUS") {
      const order = await findOrderForAssistant(userId, orderId, tableId);
      if (!order) return NextResponse.json({ intent, sentiment, action: "ORDER_NOT_FOUND", response: "No matching active order was found in Firestore." });
      return NextResponse.json({
        intent,
        sentiment,
        action: "ORDER_STATUS",
        order: { id: order.id, tableId: order.tableNo ?? order.tableId ?? null, status: order.status ?? "pending" },
        response: `Order ${order.id} is currently ${order.status ?? "pending"}.`,
      });
    }

    if (intent.intent === "CALL_STAFF") {
      const taskId = await createStaffAssistanceTask(userId, message, tableId, orderId);
      return NextResponse.json({ intent, sentiment, action: "STAFF_TASK_CREATED", taskId, response: "A staff-assistance task has been created." });
    }

    if (intent.intent === "FEEDBACK") {
      const feedbackId = await storeFeedback(userId, message, sentiment, tableId, orderId);
      return NextResponse.json({ intent, sentiment, action: "FEEDBACK_STORED", feedbackId, response: "Feedback has been recorded." });
    }

    if (intent.intent === "FAQ") {
      const answer = await findFaqAnswer(userId, message);
      return NextResponse.json({
        intent,
        sentiment,
        action: answer ? "FAQ_ANSWER" : "FAQ_UNAVAILABLE",
        response: answer ?? "No matching FAQ answer is configured in Firestore.",
      });
    }

    return NextResponse.json({ intent, sentiment, action: "NO_DATABASE_ACTION", response: "The message was classified, but no configured action is available for this intent." });
  } catch (error) {
    if (error instanceof MlServiceError) return NextResponse.json({ error: error.message, code: error.code }, { status: 503 });
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to process assistant message." }, { status: 400 });
  }
}
