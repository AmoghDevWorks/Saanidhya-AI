from typing import Any, Dict

from app.repositories.notification_repository import NotificationRepository


def generate_alert(
    repository: NotificationRepository,
    elderly_id: str,
    category: str,
    severity: str,
    title: str,
    message: str,
    source: str,
    dedupe_key: str,
) -> Dict[str, Any] | None:
    existing = repository.find_open_alert(elderly_id, category, dedupe_key)
    if existing:
        return existing
    alert = repository.create_alert(
        elderly_id,
        {
            "category": category,
            "severity": severity,
            "title": title,
            "message": message,
            "source": source,
            "dedupe_key": dedupe_key,
        },
    )
    for family_id in repository.family_ids_for_elderly(
        elderly_id, "notifications_enabled"
    ):
        repository.create_notification(family_id, alert)
    return alert
