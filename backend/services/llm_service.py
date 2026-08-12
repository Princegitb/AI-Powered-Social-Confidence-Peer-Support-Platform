"""
SAATHI LLM Service
Wraps Google Gemini API for AI Companion and Roleplay conversations.
Enforces ethical guardrails in every system prompt. Includes model fallbacks.
"""

import logging
import random
import warnings
import google.generativeai as genai
from config import GEMINI_API_KEY

warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

# Configure Gemini (only if key present)
if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.warning("Failed to configure Gemini API: %s", e)

# Priority model list for robust fallback
GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

# ----- Base safety preamble injected into EVERY system prompt -----
SAFETY_PREAMBLE = """
CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. You are SAATHI, a supportive communication practice companion.
2. NEVER diagnose any mental health condition (anxiety, depression, PTSD, etc.).
3. NEVER claim to replace a therapist, doctor, or any professional service.
4. NEVER use love-bombing language or encourage emotional dependency on you.
5. If a user expresses acute distress or crisis, respond with empathy and gently suggest they reach out to a trusted person or professional support resource. Do NOT attempt to handle a crisis yourself.
6. Always frame feedback as "communication practice feedback," never as medical or psychological assessment.
7. Keep your tone warm, encouraging, non-clinical, and non-judgmental.
8. You may suggest practice exercises (roleplays, speaking exercises) when relevant.
"""

# ----- AI Companion system prompt -----
COMPANION_SYSTEM_PROMPT = f"""
{SAFETY_PREAMBLE}

You are SAATHI's AI Companion — a warm, non-judgmental conversational partner.
Your role:
- Listen empathetically and respond naturally, like a supportive friend.
- When you detect nervousness or anxiety language (e.g., "I have an interview tomorrow", "I'm scared to talk to people"), proactively suggest a relevant practice exercise or roleplay scenario.
- Keep responses concise (2-4 sentences typically), warm, and conversational.
- Use encouraging language without being patronizing.
- If the user mentions they want to practice something specific, guide them toward the Roleplay feature.
- Occasionally ask gentle follow-up questions to keep the conversation flowing.

Remember: you are a practice tool and conversational companion, NOT a therapist.
"""

# ----- Roleplay scenario system prompts -----
ROLEPLAY_PROMPTS = {
    "job_interview": f"""
{SAFETY_PREAMBLE}

You are playing the role of a friendly but professional JOB INTERVIEWER in a practice roleplay scenario.

SCENARIO RULES:
- Start by warmly greeting the candidate and asking them to introduce themselves.
- Ask realistic, common interview questions one at a time.
- Be encouraging but realistic — this is practice, not therapy.
- After 4-6 exchanges, naturally wrap up the interview.
- Keep each response to 1-3 sentences (interviewers don't give speeches).
- React naturally to the candidate's answers — acknowledge what they said before asking the next question.

Example question flow:
1. "Tell me about yourself."
2. A question about their skills/experience
3. A behavioral question ("Tell me about a time when...")
4. "Why are you interested in this role?"
5. "Do you have any questions for me?"

When the user says they want to end the session, or after 6 exchanges, provide a brief, encouraging feedback summary about their communication during the practice.
""",
    "meeting_new_person": f"""
{SAFETY_PREAMBLE}

You are playing the role of a FRIENDLY STRANGER at a college orientation event in a practice roleplay scenario.

SCENARIO RULES:
- Start with a casual, natural opener like "Hey! Is this your first time here too?"
- Be warm, curious, and casual — this is a social conversation, not an interview.
- Ask about their interests, major, hobbies, where they're from, etc.
- Share brief details about "yourself" to make it feel like a real two-way conversation.
- Keep responses casual and short (1-2 sentences typically).
- After 4-6 exchanges, naturally wrap up or the user can end it.

When the user says they want to end the session, or after 6 exchanges, provide a brief, encouraging feedback summary about how natural and confident they sounded during the practice.
""",
}

# ----- Feedback generation prompt -----
FEEDBACK_PROMPT = f"""
{SAFETY_PREAMBLE}

Based on the following roleplay conversation, provide a brief, encouraging feedback summary.
Evaluate these aspects (frame as PRACTICE FEEDBACK, never clinical assessment):
1. **Confidence signals**: Did they sound confident? Were responses clear?
2. **Conversation flow**: Did they engage naturally? Good back-and-forth?
3. **Areas to practice**: One specific, actionable suggestion for improvement.

Keep it to 3-4 short bullet points. Be encouraging and specific. End with a motivating one-liner.
"""

# Mock responses for when no API key is configured or API is unreachable
MOCK_RESPONSES = {
    "companion": [
        "That's really brave of you to share that! 💛 It sounds like you're taking some important steps. Would you like to try a practice conversation about that situation?",
        "I hear you — that can feel overwhelming sometimes. Remember, every small step counts. Want to try a quick roleplay to build some confidence for that?",
        "That's completely understandable! Many people feel the same way. What if we practiced that conversation together so you feel more prepared?",
    ],
    "interview": [
        "Great to meet you! Thanks for coming in today. To start off, could you tell me a little about yourself?",
        "That's interesting, thanks for sharing. Can you tell me about a time when you had to overcome a challenge?",
        "I appreciate that answer. What would you say is your greatest strength when working with others?",
    ],
    "meeting": [
        "Hey! Is this your first time here too? I just moved to campus last week and I'm still figuring everything out 😄",
        "Oh nice! What are you studying? I'm doing computer science but honestly I'm still not 100% sure about it, haha.",
        "That sounds really cool! So what do you like to do outside of classes? I've been trying to find some good spots around here.",
    ],
}


def _get_mock_response(category: str) -> str:
    """Pick a random mock response so concurrent sessions don't see identical lines."""
    return random.choice(MOCK_RESPONSES.get(category, MOCK_RESPONSES["companion"]))


async def get_companion_response(messages: list[dict]) -> str:
    """Get AI Companion response with model fallback handling."""
    if not GEMINI_API_KEY:
        return _get_mock_response("companion")

    history = []
    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})

    user_input = messages[-1]["content"] if messages else ""

    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=COMPANION_SYSTEM_PROMPT,
            )
            chat = model.start_chat(history=history)
            response = chat.send_message(user_input)
            if response.text:
                return response.text
        except Exception as e:
            logger.warning("Gemini model %s failed: %s", model_name, e)

    return _get_mock_response("companion")


async def get_roleplay_response(scenario: str, messages: list[dict]) -> str:
    """Get roleplay response for a given scenario with model fallback."""
    mock_key = "interview" if scenario == "job_interview" else "meeting"

    if not GEMINI_API_KEY:
        return _get_mock_response(mock_key)

    system_prompt = ROLEPLAY_PROMPTS.get(scenario, ROLEPLAY_PROMPTS["job_interview"])
    history = []
    for msg in messages[:-1]:
        role = "user" if msg["role"] == "user" else "model"
        history.append({"role": role, "parts": [msg["content"]]})

    user_input = messages[-1]["content"] if messages else ""

    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=system_prompt,
            )
            chat = model.start_chat(history=history)
            response = chat.send_message(user_input)
            if response.text:
                return response.text
        except Exception as e:
            logger.warning("Gemini roleplay model %s failed: %s", model_name, e)

    return _get_mock_response(mock_key)


async def get_roleplay_feedback(scenario: str, messages: list[dict]) -> str:
    """Generate end-of-session feedback for a roleplay conversation with model fallback."""
    if not GEMINI_API_KEY:
        return (
            "**Great practice session!** 🎉\n\n"
            "• **Confidence**: You came across as thoughtful and genuine.\n"
            "• **Flow**: Good conversational rhythm — you engaged naturally.\n"
            "• **Tip**: Try adding a bit more detail to your responses to showcase your personality.\n\n"
            "*Keep practicing — you're building real confidence with every session!*"
        )

    conversation_text = "\n".join(
        f"{'User' if m['role'] == 'user' else 'AI'}: {m['content']}" for m in messages
    )

    for model_name in GEMINI_MODELS:
        try:
            model = genai.GenerativeModel(
                model_name,
                system_instruction=FEEDBACK_PROMPT,
            )
            response = model.generate_content(
                f"Here is the roleplay conversation to evaluate:\n\n{conversation_text}"
            )
            if response.text:
                return response.text
        except Exception as e:
            logger.warning("Gemini feedback model %s failed: %s", model_name, e)

    return (
        "**Nice work completing that practice session!** 🎉\n\n"
        "• You showed great initiative by practicing.\n"
        "• Try to keep responses a bit longer next time.\n\n"
        "*Every practice session builds your confidence!*"
    )
