from __future__ import annotations

from typing import Any

from .priority_engine import PriorityConfig, score_task


def rerank_tasks(tasks: list[dict[str, Any]], config: PriorityConfig | None = None) -> dict[str, Any]:
    ranked = [score_task(task, config) for task in tasks]
    ranked.sort(key=lambda item: (item["assignable"], item["priority_score"]), reverse=True)
    return {
        "ranked_tasks": ranked,
        "next_best_task": next((task for task in ranked if task["assignable"]), None),
        "count": len(ranked),
    }


def select_next_best_task(tasks: list[dict[str, Any]], config: PriorityConfig | None = None) -> dict[str, Any] | None:
    return rerank_tasks(tasks, config)["next_best_task"]
