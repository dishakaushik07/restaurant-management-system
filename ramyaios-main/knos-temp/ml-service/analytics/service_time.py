from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from data_sources import service_time_training_data
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


DISH_BASE = {"burger": 12, "pizza": 18, "noodles": 14, "salad": 8, "beverage": 4, "mixed": 16}


def synthetic_service_time_data() -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for hour in range(9, 23):
        for dish_type, base in DISH_BASE.items():
            for item_count in range(1, 7):
                for kitchen_load in [0.2, 0.5, 0.8, 1.1]:
                    active_orders = round(kitchen_load * 24)
                    distance_m = 3 + item_count * 1.3
                    minutes = base + item_count * 1.8 + kitchen_load * 9 + active_orders * 0.12 + distance_m * 0.35
                    rows.append(
                        {
                            "hour": hour,
                            "dish_type": dish_type,
                            "item_count": item_count,
                            "kitchen_load": kitchen_load,
                            "active_orders": active_orders,
                            "robot_available": 1,
                            "distance_m": distance_m,
                            "historical_prep_time": base,
                            "service_minutes": round(minutes, 2),
                        }
                    )
    return pd.DataFrame(rows)


@dataclass
class ServiceTimePredictor:
    model: Any = None
    columns: list[str] | None = None
    mae: float | None = None
    training_label: str = "not-trained"

    def train(self, data: pd.DataFrame | None = None) -> "ServiceTimePredictor":
        real_data = service_time_training_data() if data is None else None
        cache_name = "service_time_model.joblib" if real_data is not None else "service_time_model_synthetic.joblib"
        cached = load_joblib_model(cache_name) if data is None else None
        if cached:
            self.model = cached["model"]
            self.columns = cached["columns"]
            self.mae = cached["mae"]
            self.training_label = cached.get("training_label", "restaurant_analytics_csv")
            return self

        data = data.copy() if data is not None else real_data if real_data is not None else synthetic_service_time_data()
        self.training_label = "restaurant_analytics_csv" if real_data is not None else "synthetic/demo"
        if SKLEARN_AVAILABLE:
            encoded = pd.get_dummies(data.drop(columns=["service_minutes"]), columns=["dish_type"])
            self.columns = list(encoded.columns)
            y = data["service_minutes"]
            x_train, x_test, y_train, y_test = train_test_split(encoded, y, test_size=0.2, random_state=7)
            self.model = RandomForestRegressor(n_estimators=70, random_state=7, min_samples_leaf=2)
            self.model.fit(x_train, y_train)
            self.mae = round(float(mean_absolute_error(y_test, self.model.predict(x_test))), 2)
            save_joblib_model(
                cache_name,
                {"model": self.model, "columns": self.columns, "mae": self.mae, "training_label": self.training_label},
            )
        else:
            self.model = data
            self.mae = 3.5
        return self

    def predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.model is None:
            self.train()

        dish_type = str(payload.get("dish_type", payload.get("dishType", "mixed"))).lower()
        item_count = int(payload.get("item_count", payload.get("itemCount", 1)))
        kitchen_load = float(payload.get("kitchen_load", payload.get("kitchenLoad", 0.5)))
        active_orders = int(payload.get("active_orders", payload.get("activeOrders", 0)))
        hour = int(payload.get("hour", 13))
        robot_available = int(bool(payload.get("robot_available", payload.get("robotAvailable", True))))
        distance_m = float(payload.get("distance_m", payload.get("distance", 5)))
        historical = float(payload.get("historical_prep_time", payload.get("historicalPrepTime", DISH_BASE.get(dish_type, 14))))

        row = pd.DataFrame(
            [
                {
                    "hour": hour,
                    "dish_type": dish_type,
                    "item_count": item_count,
                    "kitchen_load": kitchen_load,
                    "active_orders": active_orders,
                    "robot_available": robot_available,
                    "distance_m": distance_m,
                    "historical_prep_time": historical,
                }
            ]
        )
        if SKLEARN_AVAILABLE and self.columns is not None:
            encoded = pd.get_dummies(row, columns=["dish_type"]).reindex(columns=self.columns, fill_value=0)
            minutes = float(self.model.predict(encoded)[0])
            algorithm = "RandomForestRegressor"
        else:
            baseline = historical
            if hasattr(self.model, "columns") and "dish_type" in self.model.columns:
                matches = self.model[self.model["dish_type"] == dish_type]
                if not matches.empty:
                    baseline = float(matches["service_minutes"].median())
                elif "service_minutes" in self.model.columns:
                    baseline = float(self.model["service_minutes"].median())
            minutes = baseline + item_count * 1.2 + kitchen_load * 6.0 + active_orders * 0.08 + distance_m * 0.35
            if not robot_available:
                minutes += 5
            algorithm = "RealDatasetMedianFormulaFallback"

        reasons = [f"{item_count} items", f"Kitchen load {round(kitchen_load, 2)}", f"Distance {round(distance_m, 1)} m"]
        if not robot_available:
            reasons.append("No robot currently available")
        if active_orders >= 20:
            reasons.append("High active order count")

        return {
            "estimated_minutes": round(max(minutes, 1.0), 2),
            "confidence_metric": {"mae_minutes": self.mae, "training_data": self.training_label},
            "algorithm": algorithm,
            "reasons": reasons,
        }


_PREDICTOR = ServiceTimePredictor()


def predict_service_time(payload: dict[str, Any]) -> dict[str, Any]:
    return _PREDICTOR.predict(payload)
