"""Conservative extraction of explicit, user-provided conversational facts."""

import re
import logging
from typing import Any, Dict, List

from app.repositories.memory_repository import MemoryRepository

logger = logging.getLogger("saanidhya.memory_extraction")


_PATTERNS = (
    ("wellness_context", "discomfort", r"\b(?:my|I have|I am having)\s+([^.!?]*(?:pain|ache|hurt|stiff|discomfort)[^.!?]*)"),
    ("wellness_context", "sleep", r"\bI\s+(slept|sleep)\s+([^.!?]+)"),
    ("interests", "hobby", r"\bI\s+(?:like|love|enjoy)\s+([^.!?]+)"),
    ("personal_information", "preferred_name", r"\b(?:call me|my name is)\s+([A-Za-z][A-Za-z -]{1,60})"),
    ("important_context", "follow_up", r"\b(?:remind me|please follow up|I need help with)\s+([^.!?]+)"),
)


def extract_candidate_memories(messages: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    candidates = []
    for message in messages:
        if message.get("speaker") != "user":
            continue
        text = str(message.get("text", "")).strip()
        for category, key, pattern in _PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                value = " ".join(match.group(0).split())
                candidates.append(
                    {
                        "category": category,
                        "key": key,
                        "value": value[:500],
                        "source": "checkin",
                        "confidence": 1.0,
                    }
                )
    unique = {}
    for candidate in candidates:
        unique[(candidate["category"], candidate["key"], candidate["value"])] = candidate
    return list(unique.values())


def extract_and_store_memories(
    repository: MemoryRepository,
    user_id: str,
    messages: List[Dict[str, Any]],
) -> int:
    candidates = extract_candidate_memories(messages)
    stored = 0
    for candidate in candidates:
        existing = repository.collection.find_one(
            {
                "user_id": user_id,
                "category": candidate["category"],
                "key": candidate["key"],
                "value": candidate["value"],
            }
        )
        if not existing:
            repository.create(user_id, candidate)
            stored += 1
    return stored


def safely_extract_and_store_memories(
    repository: MemoryRepository,
    user_id: str,
    messages: List[Dict[str, Any]],
) -> None:
    """Run post-check-in extraction without affecting the completed check-in."""
    try:
        extract_and_store_memories(repository, user_id, messages)
    except Exception:
        logger.exception("Memory extraction failed after check-in")
