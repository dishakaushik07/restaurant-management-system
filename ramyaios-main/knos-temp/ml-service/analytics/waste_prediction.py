from __future__ import annotations

from dataclasses import dataclass
from typing import Any

import pandas as pd

from data_sources import waste_training_data
from model_store import load_joblib_model, save_joblib_model

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.metrics import accuracy_score
    from sklearn.model_selection import train_test_split

    SKLEARN_AVAILABLE = True
except Exception:
    RandomForestClassifier = None
    accuracy_score = None
    train_test_split = None
    SKLEARN_AVAILABLE = False


def synthetic_waste_data() -> pd.DataFrame:
    rows: list[dict[str, Any]] = []
    for item in ["lettuce", "paneer", "mushroom", "dough", "milk", "sauce"]:
        for days in range(0, 8):
            for stock in [5, 15, 30, 60]:
                demand = {"lettuce": 8, "paneer": 12, "mushroom": 7, "dough": 16, "milk": 10, "sauce": 6}[item]
                unsold = max(0, stock - demand * max(days, 1) * 0.35)
                usage_ratio = demand / max(stock, 1)
                if days <= 1 and unsold > demand:
                    risk = "HIGH"
                elif days <= 3 and usage_ratio < 0.45:
                    risk = "MEDIUM"
                else:
                    risk = "LOW"
                rows.append(
                    {
                        "item": item,
                        "stock_quantity": stock,
                        "historical_daily_demand": demand,
                        "daily_usage": demand * 0.8,
                        "days_to_expiry": days,
                        "unsold_quantity": unsold,
                        "risk": risk,
                    }
                )
    return pd.DataFrame(rows)


@dataclass
class WastePredictor:
    model: Any = None
    columns: list[str] | None = None
    accuracy: float | None = None
    training_label: str = "not-trained"

    def train(self, data: pd.DataFrame | None = None) -> "WastePredictor":
        real_data = waste_training_data() if data is None else None
        cache_name = "waste_model.joblib" if real_data is not None else "waste_model_synthetic.joblib"
        cached = load_joblib_model(cache_name) if data is None else None
        if cached:
            self.model = cached["model"]
            self.columns = cached["columns"]
            self.accuracy = cached["accuracy"]
            self.training_label = cached.get("training_label", "restaurant_analytics_csv")
            return self

        data = data.copy() if data is not None else real_data if real_data is not None else synthetic_waste_data()
        self.training_label = "restaurant_analytics_csv" if real_data is not None else "synthetic/demo"
        if SKLEARN_AVAILABLE:
            encoded = pd.get_dummies(data.drop(columns=["risk"]), columns=["item"])
            self.columns = list(encoded.columns)
            y = data["risk"]
            x_train, x_test, y_train, y_test = train_test_split(encoded, y, test_size=0.2, random_state=11)
            self.model = RandomForestClassifier(n_estimators=80, random_state=11, min_samples_leaf=2)
            self.model.fit(x_train, y_train)
            self.accuracy = round(float(accuracy_score(y_test, self.model.predict(x_test))), 2)
            save_joblib_model(
                cache_name,
                {
                    "model": self.model,
                    "columns": self.columns,
                    "accuracy": self.accuracy,
                    "training_label": self.training_label,
                },
            )
        else:
            self.model = data
            self.accuracy = None
        return self

    def predict(self, payload: dict[str, Any]) -> dict[str, Any]:
        if self.model is None:
            self.train()

        item = str(payload.get("item", payload.get("ingredient", "unknown"))).lower()
        stock = float(payload.get("stock_quantity", payload.get("stockQuantity", 0)))
        demand = float(payload.get("historical_daily_demand", payload.get("historicalDemand", 1)))
        usage = float(payload.get("daily_usage", payload.get("dailyUsage", demand)))
        days = float(payload.get("days_to_expiry", payload.get("daysToExpiry", 99)))
        unsold = float(payload.get("unsold_quantity", payload.get("unsoldQuantity", max(stock - usage, 0))))

        row = pd.DataFrame(
            [
                {
                    "item": item,
                    "stock_quantity": stock,
                    "historical_daily_demand": demand,
                    "daily_usage": usage,
                    "days_to_expiry": days,
                    "unsold_quantity": unsold,
                }
            ]
        )
        if SKLEARN_AVAILABLE and self.columns is not None:
            encoded = pd.get_dummies(row, columns=["item"]).reindex(columns=self.columns, fill_value=0)
            risk = str(self.model.predict(encoded)[0])
            probabilities = getattr(self.model, "predict_proba", lambda _: [[0.34, 0.33, 0.33]])(encoded)[0]
            score = round(float(max(probabilities)), 2)
            algorithm = "RandomForestClassifier"
        else:
            risk = None
            score = None
            if hasattr(self.model, "columns") and "item" in self.model.columns:
                matches = self.model[self.model["item"] == item]
                if not matches.empty:
                    risk_counts = matches["risk"].value_counts(normalize=True)
                    risk = str(risk_counts.index[0])
                    score = round(float(risk_counts.iloc[0]), 2)
                    algorithm = "RealDatasetRiskFrequencyFallback"
            if risk is None:
                algorithm = "ExplainableRuleFallback"
            demand_cover_days = stock / max(demand, 1.0)
            if days <= 1 and unsold > demand * 0.8:
                risk = "HIGH"
                score = max(float(score or 0), 0.88)
            elif days <= 3 and demand_cover_days > days + 1 and risk != "HIGH":
                risk = "MEDIUM"
                score = max(float(score or 0), 0.67)
            elif risk is None:
                risk = "LOW"
                score = 0.42

        reasons = [
            f"Days to expiry: {round(days, 1)}",
            f"Stock quantity: {round(stock, 1)}",
            f"Historical daily demand: {round(demand, 1)}",
            f"Unsold quantity: {round(unsold, 1)}",
        ]
        return {
            "waste_risk": risk,
            "risk_score": score,
            "algorithm": algorithm,
            "confidence_metric": {"accuracy": self.accuracy, "training_data": self.training_label},
            "reasons": reasons,
        }


_PREDICTOR = WastePredictor()


def predict_waste_risk(payload: dict[str, Any]) -> dict[str, Any]:
    return _PREDICTOR.predict(payload)
