"""
SAATHI Progress Router
Aggregates user progress from the various collections for the dashboard
and Progress page.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter
from pydantic import BaseModel

from database import (
    get_progress_summary,
    get_recent_activity,
    log_progress,
    progress_logs_collection,
)

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()


@router.get("/progress")
async def get_progress(user_id: str):
    """Overall progress summary for the dashboard."""
    summary = await get_progress_summary(user_id)
    return summary


@router.get("/progress/recent")
async def get_recent(user_id: str, limit: int = 8):
    """Recent activity feed for the dashboard practice-log list."""
    items = await get_recent_activity(user_id, limit=limit)
    return {"items": items}


class LogRequest(BaseModel):
    user_id: str
    kind: str
    payload: dict | None = None


@router.post("/progress/log")
async def log_event(req: LogRequest):
    """Log a generic activity (e.g. challenge completion)."""
    await log_progress(req.user_id, req.kind, req.payload or {})
    return {"ok": True}
