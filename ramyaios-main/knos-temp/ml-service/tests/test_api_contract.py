import importlib.util
import unittest


FASTAPI_AVAILABLE = importlib.util.find_spec("fastapi") is not None


@unittest.skipUnless(FASTAPI_AVAILABLE, "FastAPI is not installed in this Python environment")
class ApiContractTests(unittest.TestCase):
    def setUp(self):
        from fastapi.testclient import TestClient
        from app import app

        self.client = TestClient(app)

    def test_health(self):
        response = self.client.get("/api/ml/health")
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["status"], "ok")

    def test_priority_endpoint(self):
        response = self.client.post(
            "/api/ml/priority",
            json={
                "task": {
                    "task_id": "t1",
                    "waiting_time_minutes": 20,
                    "food_age_minutes": 12,
                    "food_temperature_c": 48,
                    "distance_m": 8,
                    "robot_battery_percent": 80,
                    "urgency_flag": True,
                    "order_delay_minutes": 10,
                    "robot_available": True,
                }
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertIn("priority_score", response.json())

    def test_intent_endpoint(self):
        response = self.client.post("/api/ml/intent", json={"message": "Please call a waiter", "table_id": "T7"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["intent"], "CALL_STAFF")


if __name__ == "__main__":
    unittest.main()
