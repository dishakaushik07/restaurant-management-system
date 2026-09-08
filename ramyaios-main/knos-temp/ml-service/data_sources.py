from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any

import pandas as pd


SERVICE_ROOT = Path(__file__).resolve().parent
RESTAURANT_DATA_DIR = SERVICE_ROOT / "Resturant Analytics Dashboard" / "output"


@lru_cache(maxsize=16)
def load_csv(name: str) -> pd.DataFrame | None:
    path = RESTAURANT_DATA_DIR / name
    if not path.exists():
        return None
    return pd.read_csv(path)


def restaurant_dataset_available() -> bool:
    return (RESTAURANT_DATA_DIR / "fact_orders.csv").exists()


def demand_training_data() -> pd.DataFrame | None:
    orders = load_csv("fact_orders.csv")
    items = load_csv("fact_order_items.csv")
    menu = load_csv("dim_menu_items.csv")
    if orders is None:
        return None

    orders = orders.copy()
    orders["order_date"] = pd.to_datetime(orders["order_date"], errors="coerce")
    orders = orders.dropna(subset=["order_date", "order_hour"])

    if items is not None and menu is not None:
        merged = items.merge(
            orders[["order_id", "order_date", "order_hour"]],
            on="order_id",
            how="inner",
        ).merge(
            menu[["menu_item_id", "item_name"]],
            on="menu_item_id",
            how="left",
        )
        merged["item"] = merged["item_name"].fillna("unknown").astype(str).str.lower()
        grouped = (
            merged.groupby(["order_date", "order_hour", "item"], as_index=False)
            .agg(orders=("quantity", "sum"))
            .sort_values(["item", "order_date", "order_hour"])
        )
    else:
        grouped = (
            orders.groupby(["order_date", "order_hour"], as_index=False)
            .agg(orders=("order_id", "count"))
            .sort_values(["order_date", "order_hour"])
        )
        grouped["item"] = "all"

    grouped["hour"] = grouped["order_hour"].astype(int)
    grouped["day_of_week"] = grouped["order_date"].dt.dayofweek.astype(int)
    grouped["month"] = grouped["order_date"].dt.month.astype(int)
    grouped["is_weekend"] = grouped["day_of_week"].isin([5, 6]).astype(int)
    grouped["recent_demand"] = (
        grouped.groupby("item")["orders"]
        .transform(lambda series: series.shift(1).rolling(7, min_periods=1).mean())
        .fillna(grouped["orders"].median())
    )
    return grouped[["hour", "day_of_week", "month", "is_weekend", "item", "recent_demand", "orders"]]


def service_time_training_data() -> pd.DataFrame | None:
    orders = load_csv("fact_orders.csv")
    order_items = load_csv("fact_order_items.csv")
    menu = load_csv("dim_menu_items.csv")
    categories = load_csv("dim_menu_categories.csv")
    if orders is None:
        return None

    orders = orders.copy()
    orders = orders.dropna(subset=["completion_time_minutes", "order_hour"])
    item_counts: pd.DataFrame
    dish_types: pd.DataFrame

    if order_items is not None:
        item_counts = order_items.groupby("order_id", as_index=False).agg(item_count=("quantity", "sum"))
        if menu is not None:
            item_menu = order_items.merge(menu[["menu_item_id", "category_id"]], on="menu_item_id", how="left")
            if categories is not None:
                item_menu = item_menu.merge(categories, on="category_id", how="left")
                item_menu["dish_type"] = item_menu["category_name"].fillna("mixed").astype(str).str.lower()
            else:
                item_menu["dish_type"] = item_menu["category_id"].fillna("mixed").astype(str).str.lower()
            dish_types = (
                item_menu.groupby(["order_id", "dish_type"], as_index=False)
                .agg(quantity=("quantity", "sum"))
                .sort_values(["order_id", "quantity"], ascending=[True, False])
                .drop_duplicates("order_id")[["order_id", "dish_type"]]
            )
        else:
            dish_types = pd.DataFrame({"order_id": item_counts["order_id"], "dish_type": "mixed"})
    else:
        item_counts = pd.DataFrame({"order_id": orders["order_id"], "item_count": 1})
        dish_types = pd.DataFrame({"order_id": orders["order_id"], "dish_type": "mixed"})

    data = orders.merge(item_counts, on="order_id", how="left").merge(dish_types, on="order_id", how="left")
    data["order_date"] = pd.to_datetime(data["order_date"], errors="coerce")
    data["hour"] = data["order_hour"].astype(int)
    data["item_count"] = data["item_count"].fillna(1).clip(lower=1)
    hourly_counts = data.groupby(["order_date", "hour"])["order_id"].transform("count")
    data["active_orders"] = hourly_counts.fillna(0)
    data["kitchen_load"] = (data["active_orders"] / data["active_orders"].quantile(0.9)).clip(0, 1.5)
    data["robot_available"] = 1
    data["distance_m"] = 5.0
    data["historical_prep_time"] = data.groupby("dish_type")["completion_time_minutes"].transform("median")
    data = data.rename(columns={"completion_time_minutes": "service_minutes"})
    return data[
        [
            "hour",
            "dish_type",
            "item_count",
            "kitchen_load",
            "active_orders",
            "robot_available",
            "distance_m",
            "historical_prep_time",
            "service_minutes",
        ]
    ]


def waste_training_data() -> pd.DataFrame | None:
    consumption = load_csv("fact_ingredient_consumption.csv")
    ingredients = load_csv("dim_ingredients.csv")
    if consumption is None:
        return None

    data = consumption.copy()
    for column in ["quantity_used", "wastage_quantity", "stock_available"]:
        data[column] = pd.to_numeric(data[column], errors="coerce").fillna(0).clip(lower=0)
    if ingredients is not None:
        data = data.merge(ingredients[["ingredient_id", "ingredient_name"]], on="ingredient_id", how="left")
        data["item"] = data["ingredient_name"].fillna(data["ingredient_id"].astype(str)).astype(str).str.lower()
    else:
        data["item"] = data["ingredient_id"].astype(str)

    data["historical_daily_demand"] = data.groupby("ingredient_id")["quantity_used"].transform("mean")
    data["daily_usage"] = data["quantity_used"]
    data["stock_quantity"] = data["stock_available"]
    data["unsold_quantity"] = (data["stock_available"] - data["quantity_used"]).clip(lower=0)
    data["days_to_expiry"] = (data["stock_available"] / data["historical_daily_demand"].clip(lower=1)).clip(0, 14)
    waste_rate = (data["wastage_quantity"] / (data["quantity_used"] + data["wastage_quantity"]).clip(lower=1)).clip(0, 1)
    data["risk"] = pd.cut(
        waste_rate,
        bins=[-0.01, 0.03, 0.08, 1.0],
        labels=["LOW", "MEDIUM", "HIGH"],
    ).astype(str)
    return data[
        [
            "item",
            "stock_quantity",
            "historical_daily_demand",
            "daily_usage",
            "days_to_expiry",
            "unsold_quantity",
            "risk",
        ]
    ]


def feedback_sentiment_reference() -> dict[str, Any] | None:
    feedback = load_csv("fact_customer_feedback.csv")
    if feedback is None or "rating" not in feedback.columns:
        return None
    ratings = feedback["rating"].dropna()
    if ratings.empty:
        return None
    positive = int((ratings >= 4).sum())
    negative = int((ratings <= 2).sum())
    neutral = int(((ratings > 2) & (ratings < 4)).sum())
    return {
        "rows": int(len(feedback)),
        "average_rating": round(float(ratings.mean()), 2),
        "rating_sentiment_distribution": {
            "POSITIVE": positive,
            "NEGATIVE": negative,
            "NEUTRAL": neutral,
        },
    }
