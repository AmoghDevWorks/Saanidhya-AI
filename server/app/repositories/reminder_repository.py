from typing import Any, Dict, List, Optional

from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError


class ReminderRepository:
    def __init__(self, reminders: Collection, occurrences: Collection):
        self.reminders = reminders
        self.occurrences = occurrences

    def get(self, user_id: str, reminder_id: str):
        return self.reminders.find_one({"_id": reminder_id, "user_id": user_id})

    def list(self, user_id: str):
        return list(self.reminders.find({"user_id": user_id}).sort("next_occurrence", 1))

    def create_occurrence(self, document: Dict[str, Any]) -> bool:
        try:
            self.occurrences.insert_one(document)
            return True
        except DuplicateKeyError:
            return False

    def occurrence(self, user_id: str, occurrence_id: str):
        return self.occurrences.find_one({"_id": occurrence_id, "user_id": user_id})
