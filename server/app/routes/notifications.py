from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.collection import Collection
from pymongo import ReturnDocument

from app.database import (
    get_alerts_collection,
    get_invitations_collection,
    get_notifications_collection,
    get_relationships_collection,
    get_users_collection,
)
from app.repositories.notification_repository import NotificationRepository
from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.notifications import (
    AcceptInvitationRequest,
    AlertResponse,
    AlertStatusRequest,
    ConsentResponse,
    InvitationRequest,
    NotificationListResponse,
    NotificationResponse,
    RelationshipResponse,
    SharingPreferences,
)
from app.services.family_link_service import accept_invitation, create_invitation
from app.services.family_authorization import linked_senior_ids

router = APIRouter(tags=["Notifications and Family Access"])


def require_family(current_user: UserResponse) -> None:
    if current_user.account_type.value != "family":
        raise HTTPException(status_code=403, detail="Family account required.")


def require_elderly(current_user: UserResponse) -> None:
    if current_user.account_type.value != "elderly":
        raise HTTPException(status_code=403, detail="Elderly account required.")


def repository(
    relationships: Collection,
    alerts: Collection,
    notifications: Collection,
) -> NotificationRepository:
    return NotificationRepository(relationships, alerts, notifications)


def alert_response(document):
    return AlertResponse(
        id=str(document["_id"]),
        elderly_user_id=str(document["elderly_user_id"]),
        category=document["category"],
        severity=document["severity"],
        title=document["title"],
        message=document["message"],
        source=document.get("source", "system"),
        status=document.get("status", "new"),
        created_at=document["created_at"],
        updated_at=document["updated_at"],
        resolution_note=document.get("resolution_note"),
    )


def relationship_response(document):
    return RelationshipResponse(
        id=str(document["_id"]),
        elderly_user_id=str(document["elderly_user_id"]),
        family_user_id=str(document["family_user_id"]),
        relationship_type=document["relationship_type"],
        status=document["status"],
        permissions=document.get("permissions", {}),
        created_at=document["created_at"],
        accepted_at=document.get("accepted_at"),
    )


def notification_response(document):
    return NotificationResponse(
        id=str(document["_id"]),
        alert_id=str(document["alert_id"]) if document.get("alert_id") else None,
        category=document["category"],
        severity=document["severity"],
        title=document["title"],
        message=document["message"],
        read=document.get("read", False),
        created_at=document["created_at"],
    )


@router.post("/api/family/invitations")
async def invite_family(
    payload: InvitationRequest,
    current_user: UserResponse = Depends(get_current_user),
    users: Collection = Depends(get_users_collection),
    invitations: Collection = Depends(get_invitations_collection),
    relationships: Collection = Depends(get_relationships_collection),
):
    return create_invitation(
        current_user,
        payload.family_email,
        payload.relationship_type,
        users,
        invitations,
        relationships,
    )


@router.post("/api/family/invitations/accept", response_model=RelationshipResponse)
async def accept_family_invitation(
    payload: AcceptInvitationRequest,
    current_user: UserResponse = Depends(get_current_user),
    invitations: Collection = Depends(get_invitations_collection),
    relationships: Collection = Depends(get_relationships_collection),
):
    require_family(current_user)
    return accept_invitation(current_user, payload.token, invitations, relationships)


@router.get("/api/family/relationships", response_model=List[RelationshipResponse])
async def list_relationships(
    current_user: UserResponse = Depends(get_current_user),
    relationships: Collection = Depends(get_relationships_collection),
):
    query = {
        "$or": [
            {"elderly_user_id": current_user.id},
            {"family_user_id": current_user.id},
        ],
        "status": "accepted",
    }
    return [relationship_response(item) for item in relationships.find(query)]


@router.delete("/api/family/relationships/{relationship_id}", status_code=204)
async def revoke_relationship(
    relationship_id: str,
    current_user: UserResponse = Depends(get_current_user),
    relationships: Collection = Depends(get_relationships_collection),
):
    result = relationships.update_one(
        {
            "_id": relationship_id,
            "$or": [
                {"elderly_user_id": current_user.id},
                {"family_user_id": current_user.id},
            ],
            "status": "accepted",
        },
        {"$set": {"status": "revoked"}},
    )
    if not result.modified_count:
        raise HTTPException(status_code=404, detail="Relationship not found.")


@router.get("/api/family/consent", response_model=ConsentResponse)
async def get_family_consent(
    current_user: UserResponse = Depends(get_current_user),
    users: Collection = Depends(get_users_collection),
):
    require_elderly(current_user)
    user = users.find_one({"_id": current_user.id}) or {}
    return ConsentResponse(
        enabled=user.get("family_sharing_enabled", False),
        preferences=SharingPreferences(**user.get("family_preferences", {})),
    )


@router.patch("/api/family/consent", response_model=ConsentResponse)
async def update_family_consent(
    payload: ConsentResponse,
    current_user: UserResponse = Depends(get_current_user),
    users: Collection = Depends(get_users_collection),
):
    require_elderly(current_user)
    users.update_one(
        {"_id": current_user.id},
        {
            "$set": {
                "family_sharing_enabled": payload.enabled,
                "family_preferences": payload.preferences.model_dump(),
            }
        },
    )
    return payload


@router.get("/api/family/preferences", response_model=ConsentResponse)
async def get_family_preferences(
    current_user: UserResponse = Depends(get_current_user),
    users: Collection = Depends(get_users_collection),
):
    return await get_family_consent(current_user, users)


@router.patch("/api/family/preferences", response_model=ConsentResponse)
async def update_family_preferences(
    payload: ConsentResponse,
    current_user: UserResponse = Depends(get_current_user),
    users: Collection = Depends(get_users_collection),
):
    return await update_family_consent(payload, current_user, users)


@router.get("/api/notifications", response_model=NotificationListResponse)
async def list_notifications(
    current_user: UserResponse = Depends(get_current_user),
    notifications: Collection = Depends(get_notifications_collection),
    users: Collection = Depends(get_users_collection),
):
    require_family(current_user)
    items = list(
        notifications.find({"recipient_user_id": current_user.id})
        .sort("created_at", -1)
        .limit(50)
    )
    return NotificationListResponse(
        items=[notification_response(item) for item in items],
        unread_count=sum(1 for item in items if not item.get("read", False)),
    )


@router.get("/api/notifications/unread-count")
async def unread_notifications(
    current_user: UserResponse = Depends(get_current_user),
    notifications: Collection = Depends(get_notifications_collection),
):
    require_family(current_user)
    return {"unread_count": notifications.count_documents(
        {"recipient_user_id": current_user.id, "read": False}
    )}


@router.patch("/api/notifications/{notification_id}/read", status_code=204)
async def mark_notification_read(
    notification_id: str,
    current_user: UserResponse = Depends(get_current_user),
    notifications: Collection = Depends(get_notifications_collection),
):
    require_family(current_user)
    result = notifications.update_one(
        {"_id": notification_id, "recipient_user_id": current_user.id},
        {"$set": {"read": True}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Notification not found.")


@router.patch("/api/notifications/read-all", status_code=204)
async def mark_all_notifications_read(
    current_user: UserResponse = Depends(get_current_user),
    notifications: Collection = Depends(get_notifications_collection),
):
    require_family(current_user)
    notifications.update_many(
        {"recipient_user_id": current_user.id, "read": False},
        {"$set": {"read": True}},
    )


@router.get("/api/alerts", response_model=List[AlertResponse])
async def list_alerts(
    current_user: UserResponse = Depends(get_current_user),
    relationships: Collection = Depends(get_relationships_collection),
    alerts: Collection = Depends(get_alerts_collection),
    notifications: Collection = Depends(get_notifications_collection),
    users: Collection = Depends(get_users_collection),
):
    require_family(current_user)
    elderly_ids = linked_senior_ids(
        relationships, users, current_user.id, "notifications_enabled"
    )
    return [alert_response(item) for item in alerts.find(
        {"elderly_user_id": {"$in": elderly_ids}}
    ).sort("created_at", -1).limit(50)]


@router.get("/api/alerts/{alert_id}", response_model=AlertResponse)
async def get_alert(
    alert_id: str,
    current_user: UserResponse = Depends(get_current_user),
    relationships: Collection = Depends(get_relationships_collection),
    alerts: Collection = Depends(get_alerts_collection),
    notifications: Collection = Depends(get_notifications_collection),
    users: Collection = Depends(get_users_collection),
):
    require_family(current_user)
    elderly_ids = linked_senior_ids(
        relationships, users, current_user.id, "notifications_enabled"
    )
    alert = alerts.find_one({"_id": alert_id, "elderly_user_id": {"$in": elderly_ids}})
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return alert_response(alert)


@router.patch("/api/alerts/{alert_id}/status", response_model=AlertResponse)
async def update_alert_status(
    alert_id: str,
    payload: AlertStatusRequest,
    current_user: UserResponse = Depends(get_current_user),
    relationships: Collection = Depends(get_relationships_collection),
    alerts: Collection = Depends(get_alerts_collection),
    notifications: Collection = Depends(get_notifications_collection),
    users: Collection = Depends(get_users_collection),
):
    require_family(current_user)
    elderly_ids = linked_senior_ids(
        relationships, users, current_user.id, "notifications_enabled"
    )
    changes = {"status": payload.status}
    if payload.resolution_note is not None:
        changes["resolution_note"] = payload.resolution_note
    result = alerts.find_one_and_update(
        {"_id": alert_id, "elderly_user_id": {"$in": elderly_ids}},
        {"$set": changes},
        return_document=ReturnDocument.AFTER,
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found.")
    return alert_response(result)
