import unittest

from data_sources import (
    demand_training_data,
    feedback_sentiment_reference,
    restaurant_dataset_available,
    service_time_training_data,
    waste_training_data,
)


class RestaurantDatasetTests(unittest.TestCase):
    def test_restaurant_dataset_available(self):
        self.assertTrue(restaurant_dataset_available())

    def test_demand_training_data_uses_real_csv_shape(self):
        data = demand_training_data()
        self.assertIsNotNone(data)
        self.assertGreater(len(data), 1000)
        self.assertEqual(
            list(data.columns),
            ["hour", "day_of_week", "month", "is_weekend", "item", "recent_demand", "orders"],
        )

    def test_service_time_training_data_uses_real_csv_shape(self):
        data = service_time_training_data()
        self.assertIsNotNone(data)
        self.assertGreater(len(data), 1000)
        self.assertIn("service_minutes", data.columns)
        self.assertIn("kitchen_load", data.columns)

    def test_waste_training_data_uses_real_csv_shape(self):
        data = waste_training_data()
        self.assertIsNotNone(data)
        self.assertGreater(len(data), 1000)
        self.assertIn("risk", data.columns)
        self.assertTrue(set(data["risk"].unique()).issubset({"LOW", "MEDIUM", "HIGH"}))

    def test_feedback_sentiment_reference_uses_ratings(self):
        reference = feedback_sentiment_reference()
        self.assertIsNotNone(reference)
        self.assertGreater(reference["rows"], 1000)
        self.assertIn("POSITIVE", reference["rating_sentiment_distribution"])


if __name__ == "__main__":
    unittest.main()
