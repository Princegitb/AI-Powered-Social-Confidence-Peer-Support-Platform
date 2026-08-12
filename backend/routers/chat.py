"""
SAATHI Chat Router
Handles AI Companion conversation with Safety Shield integration.
"""

from fastapi import APIRouter
from pydantic import BaseModel
from services.llm_service import get_companion_response
from services.safety_shield import check_message

router = APIRouter()


class ChatMessage(BaseModel):
    role: str  # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages: list[ChatMessage]


class ChatResponse(BaseModel):
    reply: str
    safety: dict
    suggestions: list[str] = []


@router.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    AI Companion chat endpoint.
    Every message passes through the Safety Shield before processing.
    """
    messages = [m.model_dump() for m in request.messages]
    user_message = messages[-1]["content"] if messages else ""

    # Safety Shield: check user's message
    safety_result = await check_message(user_message, deep_check=True)

    if not safety_result["is_safe"]:
        if safety_result.get("crisis"):
            # Crisis response — supportive, non-diagnostic
            return ChatResponse(
                reply=(
                    "It sounds like you might be going through something difficult right now. "
                    "You're not alone, and there are people who can help. 💛\n\n"
                    "Would you like to:\n"
                    "• Talk to a trusted person in your life\n"
                    "• Find professional support resources\n"
                    "• Continue our conversation\n\n"
                    "Remember: SAATHI is here to support your practice, "
                    "and real help is always available when you need it."
                ),
                safety=safety_result,
                suggestions=["Find support resources", "Continue talking"],
            )

        if safety_result["action"] == "block":
            return ChatResponse(
                reply="I want to keep our conversation supportive and safe. Let's talk about something else — what would you like to practice today?",
                safety=safety_result,
                suggestions=["Practice a conversation", "Try a roleplay"],
            )

    # Get AI response
    reply = await get_companion_response(messages)

    # Safety Shield: also check AI's response (catch LLM misbehavior)
    ai_safety = await check_message(reply, deep_check=False)
    if not ai_safety["is_safe"]:
        reply = "I'd love to help you practice! What kind of conversation would you like to work on today?"

    # Generate contextual suggestions
    suggestions = _generate_suggestions(user_message, reply)

    return ChatResponse(
        reply=reply,
        safety=safety_result,
        suggestions=suggestions,
    )


def _generate_suggestions(user_msg: str, ai_reply: str) -> list[str]:
    """Generate contextual action suggestions based on conversation."""
    suggestions = []
    lower = user_msg.lower()

    if any(word in lower for word in ["interview", "job", "hiring", "resume"]):
        suggestions.append("Practice job interview")
    if any(word in lower for word in ["meet", "new people", "friends", "talk to"]):
        suggestions.append("Practice meeting someone new")
    if any(word in lower for word in ["nervous", "scared", "anxious", "worried"]):
        suggestions.append("Try a roleplay scenario")
    if any(word in lower for word in ["practice", "better", "improve"]):
        suggestions.append("Start a practice session")

    if not suggestions:
        suggestions = ["Try a roleplay scenario", "View practice tips"]

    return suggestions[:3]
