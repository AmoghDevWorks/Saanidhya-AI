import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from pymongo.collection import Collection


class NotificationRepository:
    def __init__(
        self,
        relationships: Collection,
        alerts: Collection,
        notifications: Collection,
    ):
        self.relationships = relationships
        self.alerts = alerts
        self.notifications = notifications

    def relationship_for_family(self, family_id: str, elderly_id: str):
        return self.relationships.find_one(
            {"family_user_id": family_id, "elderly_user_id": elderly_id, "status": "accepted"}
        )

    def linked_elderly_ids(self, family_id: str) -> List[str]:
        return [
            item["elderly_user_id"]
            for item in self.relationships.find(
                {"family_user_id": family_id, "status": "accepted"}
            )
        ]

    def create_alert(self, elderly_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        now = datetime.now(timezone.utc)
        document = {
            "_id": str(uuid.uuid4()),
            "elderly_user_id": elderly_id,
            "created_at": now,
            "updated_at": now,
            "status": "new",
            **data,
        }
        self.alerts.insert_one(document)
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
        self.notifications.insert_one(document)
        return document

    def unread_count(self, family_id: str) -> int:
        return self.notifications.count_documents(
            {"recipient_user_id": family_id, "read": False}
        )
