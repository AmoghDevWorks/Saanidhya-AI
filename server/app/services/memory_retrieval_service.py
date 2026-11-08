from datetime import datetime, timezone
from typing import Any, Dict, List

from app.repositories.memory_repository import MemoryRepository


def retrieve_relevant_memories(
    repository: MemoryRepository, user_id: str, limit: int = 6
) -> List[Dict[str, Any]]:
    memories = repository.list_for_user(user_id, limit=50)
    now = datetime.now(timezone.utc)

    def score(memory: Dict[str, Any]) -> tuple:
        unresolved = memory.get("category") == "important_context"
        referenced = memory.get("last_referenced_at") or memory.get("created_at")
        age_seconds = max(0, (now - referenced).total_seconds()) if referenced else 0
        return (unresolved, -age_seconds, memory.get("confidence", 0))

    selected = sorted(memories, key=score, reverse=True)[:limit]
    repository.mark_referenced(user_id, [str(item["_id"]) for item in selected])
    return selected
