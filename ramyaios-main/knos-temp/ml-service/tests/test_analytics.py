import unittest

from analytics.anomaly_detection import check_anomalies
from analytics.demand_prediction import predict_demand
from analytics.kitchen_load import estimate_kitchen_load
from analytics.service_time import predict_service_time
from analytics.waste_prediction import predict_waste_risk


class AnalyticsTests(unittest.TestCase):
    def test_demand_prediction_response(self):
        result = predict_demand({"hour": 13, "day_of_week": 5, "month": 9, "item": "pizza", "recent_demand": 24})
        self.assertGreaterEqual(result["predicted_orders"], 0)
        self.assertIn("reasons", result)

    def test_kitchen_load_high(self):
        result = estimate_kitchen_load({"predicted_orders": 30, "active_orders": 8, "capacity_per_30_min": 28})
        self.assertIn(result["load_level"], {"HIGH", "OVERLOAD_RISK"})

    def test_service_time_changes_with_load(self):
        low = predict_service_time({"item_count": 2, "dish_type": "burger", "kitchen_load": 0.2, "active_orders": 3})
        high = predict_service_time({"item_count": 2, "dish_type": "burger", "kitchen_load": 1.1, "active_orders": 30})
        self.assertGreater(high["estimated_minutes"], low["estimated_minutes"])

    def test_waste_high_risk(self):
        result = predict_waste_risk(
            {
                "item": "lettuce",
                "stock_quantity": 40,
                "historical_daily_demand": 8,
                "daily_usage": 4,
                "days_to_expiry": 1,
                "unsold_quantity": 34,
            }
        )
        self.assertIn(result["waste_risk"], {"MEDIUM", "HIGH"})

    def test_anomaly_detection(self):
        result = check_anomalies(
            {
                "pending_tasks": 3,
                "orders": [{"order_id": "o1", "status": "preparing", "elapsed_minutes": 40, "expected_minutes": 15}],
                "robots": [{"robot_id": "r1", "status": "idle", "idle_minutes": 8, "battery": 75}],
                "delays": [{"order_id": "o2", "current_minutes": 32, "historical_minutes": [12, 14, 15, 13, 16]}],
            }
        )
        types = {alert["type"] for alert in result["alerts"]}
        self.assertIn("STUCK_ORDER", types)
        self.assertIn("IDLE_ROBOT", types)
        self.assertIn("UNUSUAL_DELAY", types)

    def test_normal_anomaly_input_has_no_alerts(self):
        result = check_anomalies(
            {
                "pending_tasks": 0,
                "orders": [{"order_id": "o1", "status": "preparing", "elapsed_minutes": 8, "expected_minutes": 15}],
                "robots": [{"robot_id": "r1", "status": "charging", "idle_minutes": 12, "battery": 10}],
                "delays": [{"order_id": "o2", "current_minutes": 16, "historical_minutes": [12, 14, 15, 13, 16]}],
            }
        )
        self.assertEqual(result["alert_count"], 0)


if __name__ == "__main__":
    unittest.main()
