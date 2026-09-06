from __future__ import annotations

from typing import Any


def estimate_kitchen_load(payload: dict[str, Any]) -> dict[str, Any]:
    expected_orders = float(payload.get("expected_orders", payload.get("predicted_orders", 0)))
    active_orders = float(payload.get("active_orders", payload.get("activeOrders", 0)))
    capacity = max(float(payload.get("capacity_per_30_min", payload.get("capacityPer30Min", 28))), 1.0)
    load_ratio = (expected_orders + active_orders) / capacity

    if load_ratio >= 1.25:
        level = "OVERLOAD_RISK"
        recommendation = "High kitchen load predicted; prepare staff and batch prep high-demand items."
    elif load_ratio >= 0.85:
        level = "HIGH"
        recommendation = "High kitchen load predicted in the next planning window."
    elif load_ratio >= 0.55:
        level = "MEDIUM"
        recommendation = "Kitchen load is manageable with active monitoring."
    else:
        level = "LOW"
        recommendation = "Kitchen load is low; no action required."

    return {
        "expected_orders": round(expected_orders, 2),
        "active_orders": round(active_orders, 2),
        "capacity_per_30_min": capacity,
        "load_ratio": round(load_ratio, 2),
        "load_level": level,
        "recommendation": recommendation,
        "reasons": [
            f"Expected orders: {round(expected_orders, 2)}",
            f"Active orders: {round(active_orders, 2)}",
            f"Capacity per 30 min: {round(capacity, 2)}",
        ],
    }
