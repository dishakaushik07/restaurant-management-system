from __future__ import annotations

from pathlib import Path
from typing import Any

try:
    import joblib

    JOBLIB_AVAILABLE = True
except Exception:
    joblib = None
    JOBLIB_AVAILABLE = False


MODELS_DIR = Path(__file__).resolve().parent / "models"


def load_joblib_model(filename: str) -> Any | None:
    if not JOBLIB_AVAILABLE:
        return None
    path = MODELS_DIR / filename
    if not path.exists():
        return None
    return joblib.load(path)


def save_joblib_model(filename: str, payload: Any) -> None:
    if not JOBLIB_AVAILABLE:
        return
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    joblib.dump(payload, MODELS_DIR / filename)
