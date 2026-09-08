from __future__ import annotations

from dataclasses import dataclass, field
from typing import Any

from .thermal_decay import thermal_risk


@dataclass(frozen=True)
class PriorityConfig:
    waiting_weight: float = 0.22
    thermal_weight: float = 0.22
    urgency_weight: float = 0.18
    delay_weight: float = 0.15
    food_age_weight: float = 0.12
    task_type_weight: float = 0.08
    distance_penalty_weight: float = 0.09
    low_battery_penalty_weight: float = 0.18
    waiting_cap_minutes: float = 45.0
    food_age_cap_minutes: float = 60.0
    delay_cap_minutes: float = 45.0
    distance_cap_m: float = 30.0
    minimum_battery_percent: float = 20.0
    low_battery_percent: float = 35.0
    task_type_boosts: dict[str, float] = field(
        default_factory=lambda: {
            "delivery": 0.55,
            "serve_food": 0.65,
            "staff_assistance": 0.75,
            "cleanup": 0.25,
            "billing": 0.35,
            "return_to_base": 0.05,
        }
    )


def _num(value: Any, default: float = 0.0) -> float:
    if value is None:
        return default
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def _bool(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "y", "urgent", "high"}
    return bool(value)


def _normalize(value: Any, cap: float) -> float:
    return max(0.0, min(_num(value) / max(cap, 1.0), 1.0))


def priority_level(score: float, assignable: bool) -> str:
    if not assignable:
        return "LOW"
    if score >= 78:
        return "CRITICAL"
    if score >= 55:
        return "HIGH"
    if score >= 30:
        return "MEDIUM"
    return "LOW"


def score_task(task: dict[str, Any], config: PriorityConfig | None = None) -> dict[str, Any]:
    """Score one pending restaurant/robot task with deterministic safety gates."""
    cfg = config or PriorityConfig()
    waiting = _num(task.get("waiting_time_minutes", task.get("waitingTime")))
    food_age = _num(task.get("food_age_minutes", task.get("foodAge")))
    order_delay = _num(task.get("order_delay_minutes", task.get("orderDelay")))
    distance = _num(task.get("distance_m", task.get("distance")))
    battery = _num(task.get("robot_battery_percent", task.get("battery")), 100.0)
    robot_available = _bool(task.get("robot_available", task.get("robotAvailability", True)))
    urgency = _bool(task.get("urgency_flag", task.get("urgency", False)))
    task_type = str(task.get("task_type", task.get("taskType", "delivery"))).strip().lower()
    food_temp = task.get("food_temperature_c", task.get("foodTemperature"))
    food_temp_c = None if food_temp is None else _num(food_temp)

    thermal, thermal_reasons = thermal_risk(food_temp_c, food_age)
    task_type_boost = cfg.task_type_boosts.get(task_type, 0.35)
    battery_penalty = 0.0
    if battery < cfg.low_battery_percent:
        battery_penalty = (cfg.low_battery_percent - battery) / max(cfg.low_battery_percent, 1.0)

    positive = (
        cfg.waiting_weight * _normalize(waiting, cfg.waiting_cap_minutes)
        + cfg.thermal_weight * thermal
        + cfg.urgency_weight * (1.0 if urgency else 0.0)
        + cfg.delay_weight * _normalize(order_delay, cfg.delay_cap_minutes)
        + cfg.food_age_weight * _normalize(food_age, cfg.food_age_cap_minutes)
        + cfg.task_type_weight * task_type_boost
    )
    penalties = (
        cfg.distance_penalty_weight * _normalize(distance, cfg.distance_cap_m)
        + cfg.low_battery_penalty_weight * min(max(battery_penalty, 0.0), 1.0)
    )
    score = round(max(0.0, min((positive - penalties) * 100.0, 100.0)), 2)

    assignable = True
    safety_flags: list[str] = []
    if not robot_available:
        assignable = False
        safety_flags.append("Robot is not currently available")
    if battery < cfg.minimum_battery_percent:
        assignable = False
        safety_flags.append(
            f"Robot battery {round(battery)}% is below minimum {round(cfg.minimum_battery_percent)}%"
        )

    reasons: list[str] = []
    if waiting >= 15:
        reasons.append(f"Customer has waited {round(waiting)} minutes")
    if order_delay >= 10:
        reasons.append(f"Order is delayed by {round(order_delay)} minutes")
    if urgency:
        reasons.append("Urgency flag is active")
    reasons.extend(thermal_reasons)
    if distance >= cfg.distance_cap_m * 0.6:
        reasons.append(f"Table is relatively far at {round(distance, 1)} m")
    if battery < cfg.low_battery_percent:
        reasons.append(f"Battery penalty applied at {round(battery)}%")
    if not reasons:
        reasons.append("Balanced waiting time, distance, food age, and robot state")

    return {
        "task_id": task.get("task_id", task.get("taskId")),
        "order_id": task.get("order_id", task.get("orderId")),
        "table_id": task.get("table_id", task.get("tableId")),
        "task_type": task_type,
        "priority_score": score,
        "priority_level": priority_level(score, assignable),
        "assignable": assignable,
        "safety_flags": safety_flags,
        "reasons": reasons,
        "feature_scores": {
            "waiting": round(_normalize(waiting, cfg.waiting_cap_minutes), 3),
            "thermal": round(thermal, 3),
            "urgency": 1.0 if urgency else 0.0,
            "order_delay": round(_normalize(order_delay, cfg.delay_cap_minutes), 3),
            "food_age": round(_normalize(food_age, cfg.food_age_cap_minutes), 3),
            "task_type": round(task_type_boost, 3),
            "distance_penalty": round(_normalize(distance, cfg.distance_cap_m), 3),
            "battery_penalty": round(min(max(battery_penalty, 0.0), 1.0), 3),
        },
        "input": task,
    }
