import logging
from typing import Optional
from pymongo import MongoClient, ASCENDING
from pymongo.database import Database
from pymongo.collection import Collection
from pymongo.errors import ConnectionFailure, ConfigurationError
from app.config import settings

logger = logging.getLogger("saanidhya.database")

_mongo_client: Optional[MongoClient] = None


def is_placeholder_uri(uri: str) -> bool:
    """Check if MongoDB URI is still a template placeholder."""
    return (
        not uri
        or "your_mongodb" in uri.lower()
        or uri.strip() == "your_mongodb_connection_string"
    )


def get_client() -> MongoClient:
    """Get or create singleton MongoDB client."""
    global _mongo_client
    if _mongo_client is None:
        uri = settings.MONGODB_URI
        if is_placeholder_uri(uri):
            raise ConnectionFailure(
                "MongoDB connection string is unconfigured (still set to placeholder in .env)."
            )
        try:
            _mongo_client = MongoClient(
                uri,
                serverSelectionTimeoutMS=2000,
                connectTimeoutMS=2000,
            )
        except ConfigurationError as e:
            logger.error(f"MongoDB Configuration Error: {e}")
            raise
    return _mongo_client


def get_database() -> Database:
    """Dependency injection helper to get the application database."""
    client = get_client()
    return client[settings.DATABASE_NAME]


def get_users_collection() -> Collection:
    """Dependency injection helper to get the users collection."""
    db = get_database()
    return db["users"]


def get_checkins_collection() -> Collection:
    """Dependency injection helper to get the checkins collection."""
    db = get_database()
    return db["checkins"]


def get_alerts_collection() -> Collection:
    """Dependency injection helper to get the family alerts collection."""
    db = get_database()
    return db["alerts"]


def get_reminders_collection() -> Collection:
    """Dependency injection helper to get the reminders collection."""
    db = get_database()
    return db["reminders"]


def get_memories_collection() -> Collection:
    """Dependency injection helper for private conversational memories."""
    db = get_database()
    return db["memories"]


def get_relationships_collection() -> Collection:
    return get_database()["family_relationships"]


def get_invitations_collection() -> Collection:
    return get_database()["family_invitations"]


def get_notifications_collection() -> Collection:
    return get_database()["notifications"]


def get_reminder_occurrences_collection() -> Collection:
    return get_database()["reminder_occurrences"]


def get_checkin_schedules_collection() -> Collection:
    return get_database()["checkin_schedules"]


def get_checkin_executions_collection() -> Collection:
    return get_database()["checkin_executions"]


def init_indexes():
    """Initialize database indexes on startup (e.g. unique email index)."""
    if is_placeholder_uri(settings.MONGODB_URI):
        logger.info(
            "Skipping MongoDB index initialization: MONGODB_URI is currently set to placeholder."
        )
        return

    try:
        users = get_users_collection()
        # Create unique ascending index on email
        users.create_index([("email", ASCENDING)], unique=True, background=True)
        logger.info("Successfully created/verified unique index on users.email")
        memories = get_memories_collection()
        memories.create_index(
            [("user_id", ASCENDING), ("created_at", -1)], background=True
        )
        memories.create_index(
            [("user_id", ASCENDING), ("category", ASCENDING)], background=True
        )
        relationships = get_relationships_collection()
        relationships.create_index(
            [("family_user_id", ASCENDING), ("elderly_user_id", ASCENDING)],
            unique=True,
            background=True,
        )
        get_invitations_collection().create_index(
            [("token", ASCENDING)], unique=True, background=True
        )
        get_notifications_collection().create_index(
            [("recipient_user_id", ASCENDING), ("read", ASCENDING)],
            background=True,
        )
        get_reminder_occurrences_collection().create_index(
            [("user_id", ASCENDING), ("scheduled_for", ASCENDING)],
            unique=True,
            background=True,
        )
        get_checkin_schedules_collection().create_index(
            [("user_id", ASCENDING), ("enabled", ASCENDING)], background=True
        )
        get_checkin_executions_collection().create_index(
            [("schedule_id", ASCENDING), ("scheduled_for", ASCENDING)],
            unique=True,
            background=True,
        )
    except Exception as e:
        logger.warning(
            f"Could not initialize MongoDB indexes (will retry on active connection): {e}"
        )


def close_mongo_connection():
    """Close the MongoDB connection pool."""
    global _mongo_client
    if _mongo_client is not None:
        try:
            _mongo_client.close()
        except Exception:
            pass
        _mongo_client = None
        logger.info("Closed MongoDB connection pool.")
