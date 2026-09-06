from __future__ import annotations

from math import exp


def estimate_temperature(
    initial_temp_c: float,
    elapsed_minutes: float,
    ambient_temp_c: float = 26.0,
    cooling_rate: float = 0.032,
) -> float:
    """Estimate current food temperature using Newton-style cooling."""
    elapsed = max(0.0, float(elapsed_minutes))
    return ambient_temp_c + (float(initial_temp_c) - ambient_temp_c) * exp(-cooling_rate * elapsed)


def thermal_risk(
    current_temp_c: float | None,
    food_age_minutes: float,
    target_temp_c: float = 60.0,
    min_serving_temp_c: float = 50.0,
) -> tuple[float, list[str]]:
    """Return normalized thermal risk in [0, 1] and explainable reasons."""
    age = max(0.0, float(food_age_minutes))
    reasons: list[str] = []

    if current_temp_c is None:
        risk = min(age / 45.0, 1.0)
        if age >= 20:
            reasons.append(f"Food has been ready for {round(age)} minutes without live temperature input")
        return risk, reasons

    temp = float(current_temp_c)
    if temp >= target_temp_c:
        risk = min(age / 90.0, 0.25)
    elif temp <= min_serving_temp_c:
        risk = 0.75 + min((min_serving_temp_c - temp) / 20.0, 0.25)
    else:
        risk = (target_temp_c - temp) / max(target_temp_c - min_serving_temp_c, 1.0)

    age_risk = min(age / 60.0, 1.0) * 0.25
    risk = max(0.0, min(1.0, risk + age_risk))

    if temp < min_serving_temp_c:
        reasons.append(f"Food temperature is below serving threshold at {round(temp, 1)} C")
    elif temp < target_temp_c:
        reasons.append(f"Food is cooling from ideal serving temperature at {round(temp, 1)} C")
    if age >= 15:
        reasons.append(f"Food age is {round(age)} minutes")

    return risk, reasons
