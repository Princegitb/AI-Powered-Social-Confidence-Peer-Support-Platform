"""
SAATHI Roleplay Router
Handles roleplay scenario sessions with Safety Shield integration.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import get_roleplay_response, get_roleplay_feedback
from services.safety_shield import check_message

router = APIRouter()


class RoleplayMessage(BaseModel):
    role: str
    content: str


class RoleplayStartRequest(BaseModel):
    scenario: str  # "job_interview" | "meeting_new_person"


class RoleplayMessageRequest(BaseModel):
    scenario: str
    messages: list[RoleplayMessage]


class RoleplayEndRequest(BaseModel):
    scenario: str
    messages: list[RoleplayMessage]


class RoleplayResponse(BaseModel):
    reply: str
    safety: dict
    turn_count: int = 0
    should_end: bool = False


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
}

SCENARIO_LABELS = {
    "job_interview": "Job Interview",
    "meeting_new_person": "Meeting a New Person",
}


@router.post("/roleplay/start", response_model=RoleplayResponse)
async def start_roleplay(request: RoleplayStartRequest):
    """Start a new roleplay scenario with an AI opening line."""
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
    )


@router.post("/roleplay/message", response_model=RoleplayResponse)
async def roleplay_message(request: RoleplayMessageRequest):
    """Continue a roleplay conversation. Safety Shield checks every message."""
    messages = [m.model_dump() for m in request.messages]
    user_message = messages[-1]["content"] if messages else ""

    # Safety Shield: check user message
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
            )

        return RoleplayResponse(
            reply="Let's keep our practice focused and positive. Shall we continue with the scenario?",
            safety=safety_result,
            turn_count=len(messages),
            should_end=False,
        )

    # Count user turns (only user messages)
    user_turns = sum(1 for m in messages if m["role"] == "user")
    should_end = user_turns >= 6

    # Get AI response
    reply = await get_roleplay_response(request.scenario, messages)

    # Safety check AI response too
    ai_safety = await check_message(reply, deep_check=False)
    if not ai_safety["is_safe"]:
        reply = "That's a great point! Tell me more about that."

    return RoleplayResponse(
        reply=reply,
        safety=safety_result,
        turn_count=len(messages),
        should_end=should_end,
    )


@router.post("/roleplay/feedback", response_model=RoleplayFeedbackResponse)
async def roleplay_feedback(request: RoleplayEndRequest):
    """Generate end-of-session feedback summary for a completed roleplay."""
    messages = [m.model_dump() for m in request.messages]
    feedback = await get_roleplay_feedback(request.scenario, messages)

    return RoleplayFeedbackResponse(
        feedback=feedback,
        scenario=SCENARIO_LABELS.get(request.scenario, request.scenario),
    )
