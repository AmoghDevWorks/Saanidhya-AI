import secrets
import uuid
from datetime import datetime, timedelta, timezone

from fastapi import HTTPException, status
from pymongo.collection import Collection


def create_invitation(
    current_user,
    family_email: str,
    relationship_type: str,
    users: Collection,
    invitations: Collection,
):
    if current_user.account_type.value != "elderly":
        raise HTTPException(status_code=403, detail="Only elderly users can send invitations.")
    family = users.find_one({"email": family_email.strip().lower(), "account_type": "family"})
    if not family:
        raise HTTPException(status_code=404, detail="Family account not found.")
    token = secrets.token_urlsafe(32)
    invitation = {
        "_id": str(uuid.uuid4()),
        "elderly_user_id": current_user.id,
        "family_user_id": str(family["_id"]),
        "relationship_type": relationship_type,
        "token": token,
        "status": "pending",
        "expires_at": datetime.now(timezone.utc) + timedelta(days=7),
        "created_at": datetime.now(timezone.utc),
    }
    invitations.insert_one(invitation)
    return {"invitation_id": invitation["_id"], "token": token, "expires_at": invitation["expires_at"]}


def accept_invitation(
    current_user, token: str, invitations: Collection, relationships: Collection
):
    if current_user.account_type.value != "family":
        raise HTTPException(status_code=403, detail="Only family users can accept invitations.")
    invitation = invitations.find_one({"token": token, "status": "pending"})
    if not invitation or invitation["expires_at"] <= datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Invitation is invalid or expired.")
    if str(invitation["family_user_id"]) != current_user.id:
        raise HTTPException(status_code=403, detail="Invitation does not belong to this account.")
    relationship = {
        "_id": str(uuid.uuid4()),
        "elderly_user_id": invitation["elderly_user_id"],
        "family_user_id": current_user.id,
        "relationship_type": invitation["relationship_type"],
        "status": "accepted",
        "permissions": {"wellness_summaries": True, "checkin_updates": True},
        "created_at": invitation["created_at"],
        "accepted_at": datetime.now(timezone.utc),
    }
    relationships.insert_one(relationship)
    invitations.update_one({"_id": invitation["_id"]}, {"$set": {"status": "accepted"}})
    return relationship
