from datetime import datetime, timezone

from app.repositories.memory_repository import MemoryRepository
from app.services.memory_extraction_service import (
    extract_candidate_memories,
    extract_and_store_memories,
)
from app.services.memory_retrieval_service import retrieve_relevant_memories


class Cursor:
    def __init__(self, values):
        self.values = values

    def sort(self, *_args):
        return self

    def limit(self, count):
        self.values = self.values[:count]
        return self

    def __iter__(self):
        return iter(self.values)


class MemoryCollection:
    def __init__(self):
        self.values = []

    def find(self, query):
        user_id = query["user_id"]
        return Cursor([item for item in self.values if item["user_id"] == user_id])

    def find_one(self, query):
        for item in self.values:
            if all(item.get(key) == value for key, value in query.items()):
                return item
        return None

    def insert_one(self, document):
        self.values.append(document)

    def update_one(self, query, update):
        for item in self.values:
            if all(item.get(key) == value for key, value in query.items()):
                item.update(update["$set"])
        return type("Result", (), {"deleted_count": 0})()

    def update_many(self, query, update):
        for item in self.values:
            if item.get("user_id") == query["user_id"]:
                item.update(update["$set"])

    def delete_one(self, query):
        before = len(self.values)
        self.values[:] = [
            item
            for item in self.values
            if not all(item.get(key) == value for key, value in query.items())
        ]
        return type("Result", (), {"deleted_count": before - len(self.values)})()

    def delete_many(self, query):
        before = len(self.values)
        self.values[:] = [
            item for item in self.values if item.get("user_id") != query["user_id"]
        ]
        return type("Result", (), {"deleted_count": before - len(self.values)})()


def test_extracts_only_explicit_user_information():
    messages = [
        {"speaker": "saanidhya", "text": "You may have knee pain."},
        {"speaker": "user", "text": "My knees have been hurting for two days."},
        {"speaker": "user", "text": "I enjoy old Kannada songs."},
    ]
    memories = extract_candidate_memories(messages)
    assert len(memories) == 2
    assert all(item["confidence"] == 1.0 for item in memories)


def test_storage_and_retrieval_are_user_scoped():
    collection = MemoryCollection()
    repository = MemoryRepository(collection)
    extract_and_store_memories(
        repository, "user-a", [{"speaker": "user", "text": "I enjoy gardening."}]
    )
    extract_and_store_memories(
        repository, "user-b", [{"speaker": "user", "text": "I enjoy painting."}]
    )

    memories = retrieve_relevant_memories(repository, "user-a")
    assert len(memories) == 1
    assert memories[0]["user_id"] == "user-a"
    assert repository.get_for_user("user-a", memories[0]["_id"]) is not None
    assert repository.get_for_user("user-b", memories[0]["_id"]) is None


def test_unresolved_context_is_ranked_before_older_memory():
    collection = MemoryCollection()
    repository = MemoryRepository(collection)
    repository.create(
        "user-a",
        {
            "category": "interests",
            "key": "hobby",
            "value": "gardening",
            "source": "checkin",
            "confidence": 1.0,
            "created_at": datetime(2020, 1, 1, tzinfo=timezone.utc),
        },
    )
    repository.create(
        "user-a",
        {
            "category": "important_context",
            "key": "follow_up",
            "value": "help with appointment",
            "source": "checkin",
            "confidence": 1.0,
        },
    )
    memories = retrieve_relevant_memories(repository, "user-a")
    assert memories[0]["category"] == "important_context"
