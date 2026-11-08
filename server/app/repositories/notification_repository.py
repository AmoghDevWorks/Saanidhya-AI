import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError


class NotificationRepository:
    def __init__(
        self,
        relationships: Collection,
        alerts: Collection,
        notifications: Collection,
        users: Collection | None = None,
    ):
        self.relationships = relationships
        self.alerts = alerts
        self.notifications = notifications
        self.users = users

    def relationship_for_family(self, family_id: str, elderly_id: str):
        return self.relationships.find_one(
            {"family_user_id": family_id, "elderly_user_id": elderly_id, "status": "accepted"}
        )

    def linked_elderly_ids(self, family_id: str, permission: str | None = None) -> List[str]:
        ids = []
        for item in self.relationships.find(
            {"family_user_id": family_id, "status": "accepted"}
        ):
            if permission and not item.get("permissions", {}).get(permission, False):
                continue
            senior_id = item["elderly_user_id"]
            if self.users is not None:
                senior = self.users.find_one({"_id": senior_id}) or {}
                if not senior.get("family_sharing_enabled", False):
                    continue
                if permission and not senior.get("family_preferences", {}).get(permission, False):
                    continue
            ids.append(senior_id)
        return ids

    def family_ids_for_elderly(self, elderly_id: str, permission: str) -> List[str]:
        family_ids = []
        for relationship in self.relationships.find(
            {"elderly_user_id": elderly_id, "status": "accepted"}
        ):
            if not relationship.get("permissions", {}).get(permission, False):
                continue
            if self.users is not None:
                senior = self.users.find_one({"_id": elderly_id}) or {}
                if not senior.get("family_sharing_enabled", False):
                    continue
                if not senior.get("family_preferences", {}).get(permission, False):
                    continue
            family_ids.append(relationship["family_user_id"])
        return family_ids

    def create_alert(self, elderly_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        document = {
            "_id": str(uuid.uuid4()),
            "elderly_user_id": elderly_id,
            "created_at": now,
            "updated_at": now,
            "status": "new",
            "active_key": f"{elderly_id}:{data['category']}:{data['dedupe_key']}",
            **data,
        }
        try:
            self.alerts.insert_one(document)
        except DuplicateKeyError:
            return self.find_open_alert(elderly_id, data["category"], data["dedupe_key"])
        return document

    def find_open_alert(self, elderly_id: str, category: str, key: str):
        return self.alerts.find_one(
            {
                "elderly_user_id": elderly_id,
                "category": category,
                "dedupe_key": key,
                "status": {"$in": ["new", "acknowledged", "in_progress"]},
            }
        )

    def create_notification(self, family_id: str, alert: Dict[str, Any]):
        document = {
            "_id": str(uuid.uuid4()),
            "recipient_user_id": family_id,
            "alert_id": alert["_id"],
            "category": alert["category"],
            "severity": alert["severity"],
            "title": alert["title"],
            "message": alert["message"],
            "read": False,
            "created_at": datetime.now(timezone.utc),
        }
        try:
            self.notifications.insert_one(document)
            return document
        except DuplicateKeyError:
            return self.notifications.find_one(
                {"recipient_user_id": family_id, "alert_id": alert["_id"]}
            )

    def unread_count(self, family_id: str) -> int:
        return self.notifications.count_documents(
            {"recipient_user_id": family_id, "read": False}
        )
