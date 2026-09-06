from __future__ import annotations

from typing import Any

from fastapi import FastAPI
from pydantic import BaseModel, Field

from analytics.anomaly_detection import check_anomalies
from analytics.demand_prediction import predict_demand
from analytics.kitchen_load import estimate_kitchen_load
from analytics.service_time import predict_service_time
from analytics.waste_prediction import predict_waste_risk
from data_sources import restaurant_dataset_available
from nlp.intent_classifier import classify_intent
from nlp.sentiment import analyze_sentiment
from priority.priority_engine import score_task
from priority.ranking import rerank_tasks


class StrictModel(BaseModel):
    class Config:
        extra = "forbid"


class PriorityTask(StrictModel):
    task_id: str | None = None
    order_id: str | None = None
    table_id: str | None = None
    task_type: str = "delivery"
    waiting_time_minutes: float = Field(default=0, ge=0)
    food_age_minutes: float = Field(default=0, ge=0)
    food_temperature_c: float | None = None
    distance_m: float = Field(default=0, ge=0)
    robot_battery_percent: float = Field(default=100, ge=0, le=100)
    urgency_flag: bool = False
    order_delay_minutes: float = Field(default=0, ge=0)
    robot_available: bool = True


class PriorityRequest(StrictModel):
    task: PriorityTask


class RerankRequest(StrictModel):
    tasks: list[PriorityTask]
    trigger: str | None = None


class DemandRequest(StrictModel):
    hour: int = Field(ge=0, le=23)
    day_of_week: int = Field(ge=0, le=6)
    month: int = Field(ge=1, le=12)
    is_weekend: bool | None = None
    item: str = "mixed"
    recent_demand: float = Field(default=10, ge=0)
    horizon_minutes: int = Field(default=60, ge=1)


class KitchenLoadRequest(StrictModel):
    predicted_orders: float = Field(ge=0)
    active_orders: float = Field(default=0, ge=0)
    capacity_per_30_min: float = Field(default=28, gt=0)


class ServiceTimeRequest(StrictModel):
    item_count: int = Field(default=1, ge=1)
    dish_type: str = "mixed"
    kitchen_load: float = Field(default=0.5, ge=0)
    active_orders: int = Field(default=0, ge=0)
    hour: int = Field(default=13, ge=0, le=23)
    historical_prep_time: float | None = Field(default=None, ge=0)
    robot_available: bool = True
    distance_m: float = Field(default=5, ge=0)


class WasteRequest(StrictModel):
    item: str
    stock_quantity: float = Field(ge=0)
    historical_daily_demand: float = Field(ge=0)
    daily_usage: float = Field(default=0, ge=0)
    days_to_expiry: float = Field(ge=0)
    unsold_quantity: float = Field(default=0, ge=0)


class AnomalyRequest(StrictModel):
    pending_tasks: int = Field(default=0, ge=0)
    orders: list[dict[str, Any]] = Field(default_factory=list)
    robots: list[dict[str, Any]] = Field(default_factory=list)
    delays: list[dict[str, Any]] = Field(default_factory=list)


class TextRequest(StrictModel):
    message: str = Field(min_length=1)
    table_id: str | None = None
    user_id: str | None = None
    order_id: str | None = None


app = FastAPI(
    title="RAMYA ML Intelligence Service",
    version="0.1.0",
    description="Independent FastAPI service for task priority, analytics, anomalies, and guest NLP.",
)


@app.get("/api/ml/health")
def health() -> dict[str, Any]:
    return {
        "status": "ok",
        "service": "ramya-ml-service",
        "version": "0.1.0",
        "simulation_mode_supported": True,
        "restaurant_dataset_available": restaurant_dataset_available(),
    }


@app.post("/api/ml/priority")
def priority(request: PriorityRequest) -> dict[str, Any]:
    return score_task(request.task.model_dump())


@app.post("/api/ml/priority/rerank")
def priority_rerank(request: RerankRequest) -> dict[str, Any]:
    result = rerank_tasks([task.model_dump() for task in request.tasks])
    result["trigger"] = request.trigger
    return result


@app.post("/api/ml/demand/predict")
def demand_predict(request: DemandRequest) -> dict[str, Any]:
    return predict_demand(request.model_dump())


@app.post("/api/ml/kitchen-load/predict")
def kitchen_load_predict(request: KitchenLoadRequest) -> dict[str, Any]:
    return estimate_kitchen_load(request.model_dump())


@app.post("/api/ml/service-time/predict")
def service_time_predict(request: ServiceTimeRequest) -> dict[str, Any]:
    return predict_service_time(request.model_dump())


@app.post("/api/ml/waste/predict")
def waste_predict(request: WasteRequest) -> dict[str, Any]:
    return predict_waste_risk(request.model_dump())


@app.post("/api/ml/anomaly/check")
def anomaly_check(request: AnomalyRequest) -> dict[str, Any]:
    return check_anomalies(request.model_dump())


@app.post("/api/ml/intent")
def intent(request: TextRequest) -> dict[str, Any]:
    result = classify_intent(request.model_dump())
    result["context"] = {
        "table_id": request.table_id,
        "user_id": request.user_id,
        "order_id": request.order_id,
    }
    return result


@app.post("/api/ml/sentiment")
def sentiment(request: TextRequest) -> dict[str, Any]:
    return analyze_sentiment(request.model_dump())
