from __future__ import annotations

from statistics import mean, pstdev
from typing import Any


def detect_stuck_order(order: dict[str, Any], threshold_multiplier: float = 1.8) -> dict[str, Any] | None:
    status = str(order.get("status", "")).lower()
    elapsed = float(order.get("elapsed_minutes", order.get("elapsedMinutes", 0)))
    expected = float(order.get("expected_minutes", order.get("expectedMinutes", 15)))
    if status in {"preparing", "accepted", "ready"} and elapsed > max(expected * threshold_multiplier, expected + 10):
        return {
            "type": "STUCK_ORDER",
            "severity": "HIGH" if elapsed > expected * 2.5 else "MEDIUM",
            "message": "Order has remained in one state longer than expected.",
            "reasons": [f"Current time: {round(elapsed, 1)} min", f"Expected time: {round(expected, 1)} min"],
            "entity": order.get("order_id", order.get("orderId")),
        }
    return None


def detect_idle_robot(robot: dict[str, Any], pending_tasks: int, idle_threshold_minutes: float = 5.0) -> dict[str, Any] | None:
    status = str(robot.get("status", "")).lower()
    idle_minutes = float(robot.get("idle_minutes", robot.get("idleMinutes", 0)))
    battery = float(robot.get("battery", robot.get("battery_percent", robot.get("batteryPercent", 100))))
    if pending_tasks > 0 and status == "idle" and idle_minutes >= idle_threshold_minutes and battery >= 20:
        return {
            "type": "IDLE_ROBOT",
            "severity": "MEDIUM",
            "message": "Robot is idle while pending tasks exist.",
            "reasons": [f"Pending tasks: {pending_tasks}", f"Idle duration: {round(idle_minutes, 1)} min"],
            "entity": robot.get("robot_id", robot.get("robotId")),
        }
    return None


def detect_unusual_delay(delay: dict[str, Any], z_threshold: float = 2.0) -> dict[str, Any] | None:
    current = float(delay.get("current_minutes", delay.get("currentMinutes", 0)))
    history = [float(x) for x in delay.get("historical_minutes", delay.get("historicalMinutes", []))]
    if len(history) >= 3:
        avg = mean(history)
        std = pstdev(history) or 1.0
        z_score = (current - avg) / std
    else:
        avg = float(delay.get("normal_average_minutes", delay.get("normalAverageMinutes", 15)))
        std = float(delay.get("normal_std_minutes", delay.get("normalStdMinutes", 5))) or 1.0
        z_score = (current - avg) / std

    if z_score >= z_threshold:
        return {
            "type": "UNUSUAL_DELAY",
            "severity": "HIGH" if z_score >= 3 else "MEDIUM",
            "message": "Current service or delivery delay is statistically unusual.",
            "reasons": [
                f"Current service time: {round(current, 1)} min",
                f"Normal average: {round(avg, 1)} min",
                f"Z-score: {round(z_score, 2)}",
            ],
            "entity": delay.get("order_id", delay.get("orderId")),
        }
    return None


def check_anomalies(payload: dict[str, Any]) -> dict[str, Any]:
    alerts: list[dict[str, Any]] = []
    pending_tasks = int(payload.get("pending_tasks", payload.get("pendingTasks", 0)))

    for order in payload.get("orders", []):
        alert = detect_stuck_order(order)
        if alert:
            alerts.append(alert)

    for robot in payload.get("robots", []):
        alert = detect_idle_robot(robot, pending_tasks)
        if alert:
            alerts.append(alert)

    for delay in payload.get("delays", []):
        alert = detect_unusual_delay(delay)
        if alert:
            alerts.append(alert)

    return {"alerts": alerts, "alert_count": len(alerts), "explainable": True}
