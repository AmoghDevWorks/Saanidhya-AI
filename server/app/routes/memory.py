from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from pymongo.collection import Collection

from app.database import get_memories_collection, get_users_collection
from app.repositories.memory_repository import MemoryRepository
from app.routes.auth import get_current_user
from app.schemas.auth import UserResponse
from app.schemas.memory import (
    MemoryConsentRequest,
    MemoryConsentResponse,
    MemoryListResponse,
    MemoryResponse,
    MemoryUpdate,
)

router = APIRouter(tags=["Memory"])


def _response(document):
    return MemoryResponse(
        id=str(document["_id"]),
        category=document["category"],
        key=document["key"],
        value=document["value"],
        source=document.get("source", "checkin"),
        confidence=document.get("confidence", 1.0),
        created_at=document["created_at"],
        last_referenced_at=document.get("last_referenced_at"),
        expires_at=document.get("expires_at"),
    )


def _consent(users_collection: Collection, user_id: str) -> bool:
    user = users_collection.find_one({"_id": user_id}) or {}
    return bool(user.get("memory_consent", False))


@router.get("/api/memory", response_model=MemoryListResponse)
async def list_memories(
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
    users_collection: Collection = Depends(get_users_collection),
):
    repository = MemoryRepository(memories_collection)
    return MemoryListResponse(
        memories=[_response(item) for item in repository.list_for_user(current_user.id)],
        memory_consent=_consent(users_collection, current_user.id),
    )


@router.get("/api/memory/follow-ups", response_model=List[MemoryResponse])
async def list_follow_ups(
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
):
    repository = MemoryRepository(memories_collection)
    return [
        _response(item)
        for item in repository.list_for_user(current_user.id)
        if item.get("category") == "important_context"
    ]


@router.patch("/api/memory/preferences", response_model=MemoryConsentResponse)
async def update_memory_consent(
    payload: MemoryConsentRequest,
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
    users_collection: Collection = Depends(get_users_collection),
):
    deleted_count = 0
    if not payload.enabled:
        deleted_count = MemoryRepository(memories_collection).delete_all_for_user(
            current_user.id
        )
    users_collection.update_one(
        {"_id": current_user.id}, {"$set": {"memory_consent": payload.enabled}}
    )
    return MemoryConsentResponse(
        enabled=payload.enabled, deleted_count=deleted_count
    )


@router.get("/api/memory/{memory_id}", response_model=MemoryResponse)
async def get_memory(
    memory_id: str,
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
):
    memory = MemoryRepository(memories_collection).get_for_user(current_user.id, memory_id)
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return _response(memory)


@router.patch("/api/memory/{memory_id}", response_model=MemoryResponse)
async def update_memory(
    memory_id: str,
    payload: MemoryUpdate,
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
):
    changes = payload.model_dump(exclude_unset=True)
    memory = MemoryRepository(memories_collection).update_for_user(
        current_user.id, memory_id, changes
    )
    if not memory:
        raise HTTPException(status_code=404, detail="Memory not found.")
    return _response(memory)


@router.delete("/api/memory/{memory_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_memory(
    memory_id: str,
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
):
    deleted = MemoryRepository(memories_collection).delete_for_user(
        current_user.id, memory_id
    )
    if not deleted:
        raise HTTPException(status_code=404, detail="Memory not found.")


@router.delete("/api/memory", response_model=MemoryConsentResponse)
async def delete_all_memories(
    current_user: UserResponse = Depends(get_current_user),
    memories_collection: Collection = Depends(get_memories_collection),
    users_collection: Collection = Depends(get_users_collection),
):
    repository = MemoryRepository(memories_collection)
    deleted_count = repository.delete_all_for_user(current_user.id)
    users_collection.update_one(
        {"_id": current_user.id}, {"$set": {"memory_consent": False}}
    )
    return MemoryConsentResponse(enabled=False, deleted_count=deleted_count)

