from __future__ import annotations

from dataclasses import dataclass
from typing import Any

from model_store import load_joblib_model, save_joblib_model

try:
    from sklearn.feature_extraction.text import TfidfVectorizer
    from sklearn.linear_model import LogisticRegression
    from sklearn.pipeline import Pipeline

    SKLEARN_AVAILABLE = True
except Exception:
    TfidfVectorizer = None
    LogisticRegression = None
    Pipeline = None
    SKLEARN_AVAILABLE = False


TRAINING_EXAMPLES = [
    ("Where is my order?", "ORDER_STATUS"),
    ("When will my food arrive?", "ORDER_STATUS"),
    ("How long for table seven order?", "ORDER_STATUS"),
    ("Is my pizza ready?", "ORDER_STATUS"),
    ("Track my food please", "ORDER_STATUS"),
    ("Please call a waiter", "CALL_STAFF"),
    ("I need assistance", "CALL_STAFF"),
    ("Can someone come to my table?", "CALL_STAFF"),
    ("Call staff now", "CALL_STAFF"),
    ("We need help with the bill", "CALL_STAFF"),
    ("What time do you open?", "FAQ"),
    ("Do you have vegetarian food?", "FAQ"),
    ("What is the wifi password?", "FAQ"),
    ("Do you accept UPI?", "FAQ"),
    ("Are there vegan options?", "FAQ"),
    ("The food was amazing", "FEEDBACK"),
    ("Service was very slow", "FEEDBACK"),
    ("I loved the pasta", "FEEDBACK"),
    ("The soup was cold", "FEEDBACK"),
    ("Great ambience and staff", "FEEDBACK"),
    ("Do you have burgers?", "MENU_QUERY"),
    ("Show me spicy dishes", "MENU_QUERY"),
    ("Is paneer available?", "MENU_QUERY"),
    ("What can the robot do?", "ROBOT_HELP"),
    ("How do I use robot service?", "ROBOT_HELP"),
]


KEYWORDS = {
    "ORDER_STATUS": {"order", "ready", "arrive", "where", "track", "status"},
    "CALL_STAFF": {"waiter", "staff", "help", "assistance", "come", "bill"},
    "FAQ": {"time", "open", "wifi", "vegetarian", "vegan", "accept", "upi"},
    "FEEDBACK": {"amazing", "slow", "loved", "cold", "great", "bad", "service"},
    "MENU_QUERY": {"menu", "available", "dish", "burger", "spicy", "paneer"},
    "ROBOT_HELP": {"robot", "use", "serve", "service"},
}


@dataclass
class IntentClassifier:
    model: Any = None

    def train(self) -> "IntentClassifier":
        if SKLEARN_AVAILABLE:
            cached = load_joblib_model("intent_model.joblib")
            if cached:
                self.model = cached
                return self

            self.model = Pipeline(
                [
                    ("tfidf", TfidfVectorizer(ngram_range=(1, 2), lowercase=True)),
                    ("clf", LogisticRegression(max_iter=500, random_state=42)),
                ]
            )
            texts = [text for text, _ in TRAINING_EXAMPLES]
            labels = [label for _, label in TRAINING_EXAMPLES]
            self.model.fit(texts, labels)
            save_joblib_model("intent_model.joblib", self.model)
        else:
            self.model = "keyword-fallback"
        return self

    def classify(self, text: str) -> dict[str, Any]:
        if not text or not text.strip():
            return {"intent": "UNKNOWN", "confidence": 0.0, "reasons": ["Empty message"]}
        if self.model is None:
            self.train()

        message = text.strip()
        if SKLEARN_AVAILABLE and self.model != "keyword-fallback":
            predicted = str(self.model.predict([message])[0])
            proba = getattr(self.model, "predict_proba", None)
            confidence = 0.75
            if proba:
                confidence = round(float(max(self.model.predict_proba([message])[0])), 2)
            intent = predicted if confidence >= 0.35 else "UNKNOWN"
            return {
                "intent": intent,
                "confidence": confidence,
                "algorithm": "TF-IDF + LogisticRegression",
                "reasons": [f"Matched guest message to {intent} intent"],
            }

        tokens = {token.strip(".,!?;:").lower() for token in message.split()}
        scores = {intent: len(tokens & words) for intent, words in KEYWORDS.items()}
        lower_message = message.lower()
        if "where is my order" in lower_message or "when will" in lower_message:
            scores["ORDER_STATUS"] += 2
        if "vegetarian food" in lower_message or "vegan" in lower_message:
            scores["FAQ"] += 2
        if any(word in lower_message for word in ("amazing", "loved", "slow", "cold", "great")):
            scores["FEEDBACK"] += 2
        intent, score = max(scores.items(), key=lambda item: item[1])
        if score == 0:
            return {
                "intent": "UNKNOWN",
                "confidence": 0.0,
                "algorithm": "KeywordFallback",
                "reasons": ["No known intent keywords matched"],
            }
        return {
            "intent": intent,
            "confidence": round(min(0.95, 0.45 + score * 0.18), 2),
            "algorithm": "KeywordFallback",
            "reasons": [f"Matched keywords for {intent}"],
        }


_CLASSIFIER = IntentClassifier()


def classify_intent(payload: dict[str, Any] | str) -> dict[str, Any]:
    text = payload if isinstance(payload, str) else str(payload.get("message", ""))
    return _CLASSIFIER.classify(text)
