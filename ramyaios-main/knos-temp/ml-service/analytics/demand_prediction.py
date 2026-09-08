from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import numpy as np
import pandas as pd

from data_sources import demand_training_data
from model_store import load_joblib_model, save_joblib_model

try:
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import mean_absolute_error
    from sklearn.model_selection import train_test_split

    SKLEARN_AVAILABLE = True
except Exception:
    RandomForestRegressor = None
    mean_absolute_error = None
    train_test_split = None
    SKLEARN_AVAILABLE = False


ITEMS = ["burger", "pizza", "noodles", "salad", "beverage", "fries"]


def synthetic_demand_data() -> pd.DataFrame:
    """Clearly labelled development dataset used until real historical orders exist."""
    rows: list[dict[str, Any]] = []
    for day in range(28):
        day_of_week = day % 7
        is_weekend = int(day_of_week in {5, 6})
        month = 9
        for hour in range(9, 23):
            lunch_peak = 18 if 12 <= hour <= 14 else 0
            dinner_peak = 24 if 19 <= hour <= 21 else 0
            weekend_boost = 8 if is_weekend and 18 <= hour <= 22 else 0
            for item_index, item in enumerate(ITEMS):
                item_bias = [10, 12, 9, 5, 14, 8][item_index]
                recent = item_bias + lunch_peak * 0.35 + dinner_peak * 0.45 + weekend_boost
                orders = max(0, round(item_bias + lunch_peak + dinner_peak + weekend_boost + (item_index % 3) - 3))
                rows.append(
                    {
                        "hour": hour,
                        "day_of_week": day_of_week,
                        "month": month,
                        "is_weekend": is_weekend,
                        "item": item,
                        "recent_demand": recent,
                        "orders": orders,
                    }
                )
    return pd.DataFrame(rows)


@dataclass
class DemandPredictor:
    model: Any = None
    columns: list[str] | None = None
    mae: float | None = None
    training_label: str = "not-trained"

    def train(self, data: pd.DataFrame | None = None) -> "DemandPredictor":
        real_data = demand_training_data() if data is None else None
        cache_name = "demand_model.joblib" if real_data is not None else "demand_model_synthetic.joblib"
        cached = load_joblib_model(cache_name) if data is None else None
        if cached:
            self.model = cached["model"]
            self.columns = cached["columns"]
            self.mae = cached["mae"]
            self.training_label = cached.get("training_label", "restaurant_analytics_csv")
            return self

        data = data.copy() if data is not None else real_data if real_data is not None else synthetic_demand_data()
        self.training_label = "restaurant_analytics_csv" if real_data is not None else "synthetic/demo"
        if SKLEARN_AVAILABLE:
            encoded = pd.get_dummies(data.drop(columns=["orders"]), columns=["item"])
            self.columns = list(encoded.columns)
            y = data["orders"]
            x_train, x_test, y_train, y_test = train_test_split(encoded, y, test_size=0.2, random_state=42)
            self.model = RandomForestRegressor(n_estimators=80, random_state=42, min_samples_leaf=2)
            self.model.fit(x_train, y_train)
            predictions = self.model.predict(x_test)
            self.mae = round(float(mean_absolute_error(y_test, predictions)), 2)
            save_joblib_model(
                cache_name,
                {"model": self.model, "columns": self.columns, "mae": self.mae, "training_label": self.training_label},
            )
        else:
            self.model = data
            self.mae = round(float(data.groupby("hour")["orders"].std().fillna(0).mean()), 2)
        return self

    def predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.model is None:
            self.train()

        hour = int(payload.get("hour", 13))
        day_of_week = int(payload.get("day_of_week", payload.get("dayOfWeek", 5)))
        month = int(payload.get("month", 9))
        item = str(payload.get("item", "burger")).lower()
        is_weekend = int(payload.get("is_weekend", payload.get("isWeekend", day_of_week in {5, 6})))
        recent = float(payload.get("recent_demand", payload.get("recentDemand", 12)))

        row = pd.DataFrame(
            [{"hour": hour, "day_of_week": day_of_week, "month": month, "is_weekend": is_weekend, "item": item, "recent_demand": recent}]
        )
        if SKLEARN_AVAILABLE and self.columns is not None:
            encoded = pd.get_dummies(row, columns=["item"])
            encoded = encoded.reindex(columns=self.columns, fill_value=0)
            predicted = float(self.model.predict(encoded)[0])
            algorithm = "RandomForestRegressor"
        else:
            data: pd.DataFrame = self.model
            matches = data[(data["hour"] == hour) & (data["day_of_week"] == day_of_week) & (data["item"] == item)]
            if matches.empty:
                matches = data[(data["hour"] == hour) & (data["item"] == item)]
            predicted = float(matches["orders"].mean() if not matches.empty else data["orders"].mean())
            algorithm = "HistoricalAverageFallback"

        reasons = []
        if 12 <= hour <= 14:
            reasons.append("Lunch peak hour")
        if 19 <= hour <= 21:
            reasons.append("Dinner peak hour")
        if is_weekend:
            reasons.append("Weekend demand uplift")
        if recent >= 20:
            reasons.append("Recent demand is high")
        if not reasons:
            reasons.append("Normal demand period")

        return {
            "predicted_orders": max(0, round(predicted, 2)),
            "prediction_horizon_minutes": int(payload.get("horizon_minutes", payload.get("horizonMinutes", 60))),
            "confidence_metric": {"mae_orders": self.mae, "training_data": self.training_label},
            "algorithm": algorithm,
            "reasons": reasons,
        }


_PREDICTOR = DemandPredictor()


def predict_demand(payload: dict[str, Any]) -> dict[str, Any]:
    return _PREDICTOR.predict(payload)
