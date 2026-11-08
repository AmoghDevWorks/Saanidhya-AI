import hashlib
import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from pymongo.collection import Collection
from pymongo.errors import DuplicateKeyError


def _token_hash(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def create_invitation(
    current_user,
    family_email: str,
    relationship_type: str,
    users: Collection,
    invitations: Collection,
    relationships: Collection,
):
    if current_user.account_type.value != "elderly":
        raise HTTPException(status_code=403, detail="Only elderly users can send invitations.")
    family = users.find_one({"email": family_email.strip().lower(), "account_type": "family"})
    if not family:
        raise HTTPException(status_code=404, detail="Family account not found.")
    family_id = str(family["_id"])
    if family_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot link an account to itself.")
    active_relationship = relationships.find_one(
        {
            "elderly_user_id": current_user.id,
            "family_user_id": family_id,
            "status": {"$in": ["pending", "accepted"]},
        }
    )
    if active_relationship:
        raise HTTPException(status_code=409, detail="An active family relationship already exists.")
    token = secrets.token_urlsafe(32)
    now = datetime.now(timezone.utc)
    invitation = {
        "_id": str(uuid.uuid4()),
        "elderly_user_id": current_user.id,
        "family_user_id": family_id,
        "relationship_type": relationship_type,
        "token_hash": _token_hash(token),
        "status": "pending",
        "expires_at": now + timedelta(days=7),
        "created_at": now,
    }
    try:
        invitations.insert_one(invitation)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An active invitation already exists.") from exc
    return {"invitation_id": invitation["_id"], "token": token, "expires_at": invitation["expires_at"]}


def accept_invitation(
    current_user, token: str, invitations: Collection, relationships: Collection
):
    if current_user.account_type.value != "family":
        raise HTTPException(status_code=403, detail="Only family users can accept invitations.")
    now = datetime.now(timezone.utc)
    invitation = invitations.find_one(
        {
            "token_hash": _token_hash(token),
            "family_user_id": current_user.id,
            "status": "pending",
            "expires_at": {"$gt": now},
        },
    )
    if not invitation:
        raise HTTPException(status_code=400, detail="Invitation is invalid or expired.")
    existing = relationships.find_one(
        {
            "elderly_user_id": invitation["elderly_user_id"],
            "family_user_id": current_user.id,
            "status": {"$in": ["pending", "accepted"]},
        }
    )
    if existing:
        raise HTTPException(status_code=409, detail="An active family relationship already exists.")
    relationship = {
        "_id": str(uuid.uuid4()),
        "elderly_user_id": invitation["elderly_user_id"],
        "family_user_id": current_user.id,
        "relationship_type": invitation["relationship_type"],
        "status": "accepted",
        "permissions": {
            "wellness_summaries": True,
            "checkin_updates": True,
            "notifications_enabled": True,
            "view_reminders": True,
            "manage_reminders": False,
        },
        "created_at": invitation["created_at"],
        "accepted_at": now,
        "consent_enabled": False,
    }
    try:
        relationships.insert_one(relationship)
    except DuplicateKeyError as exc:
        raise HTTPException(status_code=409, detail="An active family relationship already exists.") from exc
    update = {"$set": {"status": "accepted", "accepted_at": now}}
    if hasattr(invitations, "update_one"):
        invitations.update_one({"_id": invitation["_id"], "status": "pending"}, update)
    else:
        invitations.find_one_and_update(
            {"_id": invitation["_id"], "status": "pending"}, update
        )
    return relationship


def reject_invitation(current_user, token: str, invitations: Collection) -> None:
    if current_user.account_type.value != "family":
        raise HTTPException(status_code=403, detail="Only family users can reject invitations.")
    result = invitations.update_one(
        {
            "token_hash": _token_hash(token),
            "family_user_id": current_user.id,
            "status": "pending",
        },
        {"$set": {"status": "rejected", "rejected_at": datetime.now(timezone.utc)}},
    )
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Invitation not found.")
