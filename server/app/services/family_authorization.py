from fastapi import HTTPException
from pymongo.collection import Collection


def get_shared_senior(
    relationships: Collection,
    users: Collection,
    family_user_id: str,
    permission: str | None = None,
):
    relationship = relationships.find_one(
        {"family_user_id": family_user_id, "status": "accepted"}
    )
    if not relationship:
        raise HTTPException(status_code=403, detail="No active family relationship exists.")
    if permission and not relationship.get("permissions", {}).get(permission, False):
        raise HTTPException(status_code=403, detail="This family relationship does not allow that action.")
    senior_id = relationship["elderly_user_id"]
    senior = users.find_one({"_id": senior_id, "account_type": "elderly"})
    if not senior:
        raise HTTPException(status_code=404, detail="Linked elderly account not found.")
    if not senior.get("family_sharing_enabled", False):
        raise HTTPException(status_code=403, detail="Family sharing consent is disabled.")
    preferences = senior.get("family_preferences", {})
    if permission and not preferences.get(permission, False):
        raise HTTPException(status_code=403, detail="The elderly user has not consented to this information.")
    return relationship, senior


def linked_senior_ids(
    relationships: Collection,
    users: Collection,
    family_user_id: str,
    permission: str | None = None,
):
    ids = []
    for relationship in relationships.find(
        {"family_user_id": family_user_id, "status": "accepted"}
    ):
        try:
            senior_id = relationship["elderly_user_id"]
            senior = users.find_one({"_id": senior_id, "account_type": "elderly"})
            if (
                senior
                and senior.get("family_sharing_enabled", False)
                and (not permission or relationship.get("permissions", {}).get(permission, False))
                and senior.get("family_preferences", {}).get(permission, False)
            ):
                ids.append(senior_id)
        except KeyError:
            continue
    return ids
