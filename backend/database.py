"""
SAATHI MongoDB Connection
Uses Motor (async driver) for non-blocking DB access with FastAPI.
Swap MONGO_URI in .env to point to Atlas when ready.
"""

from motor.motor_asyncio import AsyncIOMotorClient
from config import MONGO_URI, DB_NAME

client = AsyncIOMotorClient(MONGO_URI)
db = client[DB_NAME]

# Collection references
users_collection = db["users"]
sessions_collection = db["sessions"]
roleplay_sessions_collection = db["roleplay_sessions"]
progress_collection = db["progress"]
reports_collection = db["reports"]


async def ping_db():
    """Verify MongoDB connection is alive."""
    try:
        await client.admin.command("ping")
        return True
    except Exception:
        return False
