from __future__ import annotations

from typing import Any

from data_sources import feedback_sentiment_reference


POSITIVE_WORDS = {
    "amazing",
    "awesome",
    "excellent",
    "great",
    "good",
    "loved",
    "love",
    "fresh",
    "fast",
    "friendly",
    "delicious",
    "perfect",
}
NEGATIVE_WORDS = {
    "bad",
    "cold",
    "late",
    "slow",
    "terrible",
    "awful",
    "poor",
    "rude",
    "wrong",
    "stale",
    "delay",
    "unhappy",
}


def analyze_sentiment(payload: dict[str, Any] | str) -> dict[str, Any]:
    text = payload if isinstance(payload, str) else str(payload.get("message", ""))
    tokens = {token.strip(".,!?;:").lower() for token in text.split()}
    positive = len(tokens & POSITIVE_WORDS)
    negative = len(tokens & NEGATIVE_WORDS)
    raw_score = positive - negative

    if raw_score > 0:
        label = "POSITIVE"
    elif raw_score < 0:
        label = "NEGATIVE"
    else:
        label = "NEUTRAL"

    return {
        "sentiment": label,
        "score": raw_score,
        "algorithm": "lexicon-rule-based",
        "reasons": [f"Positive matches: {positive}", f"Negative matches: {negative}"],
        "dataset_reference": feedback_sentiment_reference(),
    }
