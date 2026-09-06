import unittest

from nlp.intent_classifier import classify_intent
from nlp.sentiment import analyze_sentiment


class NLPTests(unittest.TestCase):
    def test_order_status_intent(self):
        self.assertEqual(classify_intent({"message": "Where is my order?"})["intent"], "ORDER_STATUS")

    def test_call_staff_intent(self):
        self.assertEqual(classify_intent({"message": "Please call a waiter"})["intent"], "CALL_STAFF")

    def test_faq_intent(self):
        self.assertEqual(classify_intent({"message": "Do you have vegetarian food?"})["intent"], "FAQ")

    def test_feedback_intent(self):
        self.assertEqual(classify_intent({"message": "The food was amazing"})["intent"], "FEEDBACK")

    def test_unknown_intent(self):
        self.assertEqual(classify_intent({"message": "blue triangle moon"})["intent"], "UNKNOWN")

    def test_sentiment_positive_negative_neutral(self):
        self.assertEqual(analyze_sentiment({"message": "Amazing and delicious food"})["sentiment"], "POSITIVE")
        self.assertEqual(analyze_sentiment({"message": "Slow and cold soup"})["sentiment"], "NEGATIVE")
        self.assertEqual(analyze_sentiment({"message": "I ate dinner"})["sentiment"], "NEUTRAL")


if __name__ == "__main__":
    unittest.main()
