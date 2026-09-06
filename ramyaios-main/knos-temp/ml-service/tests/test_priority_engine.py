import unittest

from priority.priority_engine import score_task
from priority.ranking import rerank_tasks, select_next_best_task


class PriorityEngineTests(unittest.TestCase):
    def test_normal_task_scores_low_or_medium(self):
        result = score_task(
            {
                "task_id": "t1",
                "waiting_time_minutes": 5,
                "food_age_minutes": 2,
                "distance_m": 4,
                "robot_battery_percent": 90,
            }
        )
        self.assertTrue(result["assignable"])
        self.assertIn(result["priority_level"], {"LOW", "MEDIUM"})

    def test_urgent_old_food_scores_high(self):
        result = score_task(
            {
                "task_id": "t2",
                "waiting_time_minutes": 24,
                "food_age_minutes": 22,
                "food_temperature_c": 44,
                "distance_m": 8,
                "robot_battery_percent": 80,
                "urgency_flag": True,
                "order_delay_minutes": 16,
            }
        )
        self.assertGreaterEqual(result["priority_score"], 55)
        self.assertIn(result["priority_level"], {"HIGH", "CRITICAL"})
        self.assertTrue(any("temperature" in reason.lower() for reason in result["reasons"]))

    def test_low_battery_robot_is_not_assignable(self):
        result = score_task({"task_id": "t3", "waiting_time_minutes": 30, "robot_battery_percent": 12})
        self.assertFalse(result["assignable"])
        self.assertEqual(result["priority_level"], "LOW")
        self.assertTrue(result["safety_flags"])

    def test_far_table_gets_distance_penalty(self):
        near = score_task({"task_id": "near", "waiting_time_minutes": 10, "distance_m": 2})
        far = score_task({"task_id": "far", "waiting_time_minutes": 10, "distance_m": 28})
        self.assertGreater(near["priority_score"], far["priority_score"])

    def test_reranking_places_urgent_task_first(self):
        tasks = [
            {"task_id": "new-close", "waiting_time_minutes": 3, "distance_m": 2},
            {
                "task_id": "old-food",
                "waiting_time_minutes": 20,
                "food_age_minutes": 21,
                "food_temperature_c": 45,
                "distance_m": 8,
                "urgency_flag": True,
            },
        ]
        result = rerank_tasks(tasks)
        self.assertEqual(result["ranked_tasks"][0]["task_id"], "old-food")
        self.assertEqual(select_next_best_task(tasks)["task_id"], "old-food")

    def test_reranking_changes_when_waiting_time_changes(self):
        tasks = [
            {"task_id": "a", "waiting_time_minutes": 4, "distance_m": 4},
            {"task_id": "b", "waiting_time_minutes": 6, "distance_m": 4},
        ]
        before = select_next_best_task(tasks)
        tasks[0]["waiting_time_minutes"] = 35
        after = select_next_best_task(tasks)
        self.assertEqual(before["task_id"], "b")
        self.assertEqual(after["task_id"], "a")


if __name__ == "__main__":
    unittest.main()
