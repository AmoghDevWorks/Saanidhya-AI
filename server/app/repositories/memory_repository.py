import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pymongo.collection import Collection


class MemoryRepository:
    """MongoDB access layer that always scopes operations to one user."""

    def __init__(self, collection: Collection):
        self.collection = collection

    def list_for_user(
        self, user_id: str, limit: int = 50
    ) -> List[Dict[str, Any]]:
        cursor = (
            self.collection.find(
                {
                    "user_id": user_id,
                    "$or": [
                        {"expires_at": None},
                        {"expires_at": {"$exists": False}},
                        {"expires_at": {"$gt": datetime.now(timezone.utc)}},
                    ],
                }
            )
            .sort([("last_referenced_at", -1), ("created_at", -1)])
            .limit(limit)
        )
        return list(cursor)

    def get_for_user(self, user_id: str, memory_id: str) -> Optional[Dict[str, Any]]:
        return self.collection.find_one({"_id": memory_id, "user_id": user_id})

    def create(self, user_id: str, memory: Dict[str, Any]) -> Dict[str, Any]:
        document = {
            "_id": str(uuid.uuid4()),
            "user_id": user_id,
            "created_at": datetime.now(timezone.utc),
            "last_referenced_at": None,
            **memory,
        }
        self.collection.insert_one(document)
        return document

    def update_for_user(
        self, user_id: str, memory_id: str, changes: Dict[str, Any]
    ) -> Optional[Dict[str, Any]]:
        self.collection.update_one(
            {"_id": memory_id, "user_id": user_id}, {"$set": changes}
        )
        return self.get_for_user(user_id, memory_id)

    def delete_for_user(self, user_id: str, memory_id: str) -> bool:
        result = self.collection.delete_one({"_id": memory_id, "user_id": user_id})
        return result.deleted_count > 0

    def delete_all_for_user(self, user_id: str) -> int:
        result = self.collection.delete_many({"user_id": user_id})
        return result.deleted_count

    def mark_referenced(self, user_id: str, memory_ids: List[str]) -> None:
        if memory_ids:
            self.collection.update_many(
                {"_id": {"$in": memory_ids}, "user_id": user_id},
                {"$set": {"last_referenced_at": datetime.now(timezone.utc)}},
            )
