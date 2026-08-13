"""
SAATHI Roleplay Router
Handles roleplay scenario sessions with Safety Shield integration,
persistence, and redaction of contact info.
"""

import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Header
from pydantic import BaseModel

from database import (
    get_or_create_user,
    log_progress,
    roleplay_sessions_collection,
)
from services.llm_service import get_roleplay_feedback, get_roleplay_response
from services.safety_shield import check_message, redact_text

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()


class RoleplayMessage(BaseModel):
    role: str
    content: str


class RoleplayStartRequest(BaseModel):
    scenario: str
    user_id: str | None = None


class RoleplayMessageRequest(BaseModel):
    scenario: str
    messages: list[RoleplayMessage]
    user_id: str | None = None


class RoleplayEndRequest(BaseModel):
    scenario: str
    messages: list[RoleplayMessage]
    user_id: str | None = None


class RoleplayResponse(BaseModel):
    reply: str
    safety: dict
    turn_count: int = 0
    should_end: bool = False
    redacted: bool = False


class RoleplayFeedbackResponse(BaseModel):
    feedback: str
    scenario: str


# Opening lines for each scenario
SCENARIO_OPENERS = {
    "job_interview": (
        "Welcome! Thanks for coming in today. I'm glad you could make it. "
        "Let's get started — could you tell me a little about yourself?"
    ),
    "meeting_new_person": (
        "Hey! Is this your first time at this event too? "
        "I just got here and don't really know anyone yet 😄"
    ),
    "apj_kalam": (
        "Greetings my young friend! It is wonderful to speak with you today. "
        "What dream or goal are you currently working on?"
    ),
    "steve_jobs": (
        "Hey there. Great ideas come from passion and extreme clarity. "
        "What project or product idea are you practicing to present today?"
    ),
}

SCENARIO_LABELS = {
    "job_interview": "Job Interview",
    "meeting_new_person": "Meeting a New Person",
    "apj_kalam": "Dr. APJ Abdul Kalam Practice",
    "steve_jobs": "Steve Jobs Rehearsal",
}


def _user_id_or_default(req_user_id: str | None, header_user_id: str | None) -> str:
    return req_user_id or header_user_id or "demo-user"


@router.post("/roleplay/start", response_model=RoleplayResponse)
async def start_roleplay(
    request: RoleplayStartRequest,
    x_user_id: str | None = Header(default=None),
):
    """Start a new roleplay scenario with an AI opening line."""
    user_id = _user_id_or_default(request.user_id, x_user_id)
    await get_or_create_user(user_id, "Friend")

    scenario = request.scenario
    opener = SCENARIO_OPENERS.get(
        scenario,
        "Hi there! Let's get started with our practice conversation.",
    )

    return RoleplayResponse(
        reply=opener,
        safety={"is_safe": True, "category": "safe"},
        turn_count=1,
        should_end=False,
        redacted=False,
    )


@router.post("/roleplay/message", response_model=RoleplayResponse)
async def roleplay_message(
    request: RoleplayMessageRequest,
    x_user_id: str | None = Header(default=None),
):
    """Continue a roleplay conversation. Safety Shield checks every message."""
    user_id = _user_id_or_default(request.user_id, x_user_id)
    await get_or_create_user(user_id, "Friend")

    messages = [m.model_dump() for m in request.messages]
    if not messages:
        return RoleplayResponse(
            reply="Let's keep our practice focused and positive. Shall we continue with the scenario?",
            safety={"is_safe": True, "category": "safe"},
            turn_count=0,
            should_end=False,
            redacted=False,
        )

    # Redact contact info before anything else
    user_message = messages[-1]["content"]
    redacted_text = redact_text(user_message)
    redacted = redacted_text != user_message
    messages[-1]["content"] = redacted_text
    user_message = redacted_text

    # Safety Shield check
    safety_result = await check_message(user_message, deep_check=True)

    if not safety_result["is_safe"]:
        if safety_result.get("crisis"):
            return RoleplayResponse(
                reply=(
                    "I notice this might be bringing up some difficult feelings. "
                    "That's okay — we can pause this practice anytime. 💛\n\n"
                    "Would you like to take a break, or continue when you're ready?"
                ),
                safety=safety_result,
                turn_count=len(messages),
                should_end=True,
                redacted=redacted,
            )

        if safety_result.get("action") == "block":
            return RoleplayResponse(
                reply="Let's keep our practice focused and positive. Shall we continue with the scenario?",
                safety=safety_result,
                turn_count=len(messages),
                should_end=False,
                redacted=redacted,
            )

    # Count USER turns only (this is the threshold the UX cares about)
    user_turns = sum(1 for m in messages if m["role"] == "user")
    should_end = user_turns >= 6

    # Get AI response
    try:
        reply = await get_roleplay_response(request.scenario, messages)
    except Exception as e:
        logger.exception("Roleplay response failed: %s", e)
        reply = "Sorry, I lost my train of thought — could you say that again?"

    # Safety check on AI reply too
    ai_safety = await check_message(reply, deep_check=False)
    if not ai_safety["is_safe"]:
        reply = "That's a great point! Tell me more about that."

    # Persist every turn
    await roleplay_sessions_collection.insert_one({
        "user_id": user_id,
        "scenario": request.scenario,
        "messages": messages,
        "reply": reply,
        "should_end": should_end,
        "completed": False,
        "created_at": datetime.now(timezone.utc),
    })

    return RoleplayResponse(
        reply=reply,
        safety=safety_result,
        turn_count=user_turns,  # report user turns, not total messages
        should_end=should_end,
        redacted=redacted,
    )


@router.post("/roleplay/feedback", response_model=RoleplayFeedbackResponse)
async def roleplay_feedback(
    request: RoleplayEndRequest,
    x_user_id: str | None = Header(default=None),
):
    """Generate end-of-session feedback summary for a completed roleplay."""
    user_id = _user_id_or_default(request.user_id, x_user_id)
    await get_or_create_user(user_id, "Friend")

    messages = [m.model_dump() for m in request.messages]
    feedback = await get_roleplay_feedback(request.scenario, messages)

    # Persist a final completion record
    await roleplay_sessions_collection.insert_one({
        "user_id": user_id,
        "scenario": request.scenario,
        "messages": messages,
        "feedback": feedback,
        "completed": True,
        "created_at": datetime.now(timezone.utc),
    })

    # Progress-log so the dashboard reflects it
    await log_progress(user_id, "roleplay_complete", {
        "scenario_id": request.scenario,
        "scenario_label": SCENARIO_LABELS.get(request.scenario, request.scenario),
    })

    return RoleplayFeedbackResponse(
        feedback=feedback,
        scenario=SCENARIO_LABELS.get(request.scenario, request.scenario),
    )
