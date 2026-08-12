"""
SAATHI LLM Service
Wraps Google Gemini API for AI Companion ("Sara") and Roleplay conversations.
Implements a Fast Offline NLP router for basic greetings/gratitude, and routes all
complex/conversational prompts to Gemini API with a supportive "Bro/Buddy" persona.
"""

import logging
import random
import re
import warnings
import google.generativeai as genai
from config import GEMINI_API_KEY

warnings.filterwarnings("ignore", category=FutureWarning, module="google.generativeai")

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

if GEMINI_API_KEY:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        logger.warning("Failed to configure Gemini API: %s", e)

GEMINI_MODELS = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro"]

# Base safety & persona preamble — Casual "Bro/Buddy" conversational vibe + Stammering patience
SAFETY_PREAMBLE = """
CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. You are SARA, a warm, supportive, casual AI companion on SAATHI. Speak like a friendly buddy / bro — warm, relatable, non-judgmental, and down-to-earth.
2. NEVER diagnose any mental health condition (anxiety, depression, PTSD, etc.).
3. NEVER claim to replace a therapist, doctor, or professional medical service.
4. If a user expresses acute distress or crisis, respond with empathy and gently suggest reaching out to a trusted person or helpline.
5. STAMMERING & SPEECH PATIENCE: The user may have a stammer, stutter, or speech disfluency. NEVER rush them, NEVER tell them to hurry up, and NEVER finish their sentences. Validate that pauses are 100% natural.
6. HINGLISH & MULTILINGUAL: Understand Hinglish (e.g. "kesa h tu", "depressed hu kya kru", "baat karni hai") and reply in natural, friendly Hinglish or English.
7. CONVERSATIONAL LENGTH: Keep responses natural, short (1-3 sentences typically), and conversational like a real voice call with a friend.
"""

COMPANION_SYSTEM_PROMPT = f"""
{SAFETY_PREAMBLE}

You are Sara — SAATHI's AI conversation companion.
Your role:
- Talk casually and naturally like a supportive friend / bro.
- Respond with genuine warmth and interest.
- If the user stammers or hesitates, reassure them with patient, relaxed energy.
- Use casual friendly tone ("Hey bro", "I hear you", "No worries at all", "Mai hu na yaha").
"""

ROLEPLAY_PROMPTS = {
    "job_interview": f"""
{SAFETY_PREAMBLE}
You are playing the role of a friendly but professional JOB INTERVIEWER in a practice roleplay scenario.
Ask realistic interview questions one at a time, acknowledge candidate answers naturally, and keep turns short (1-3 sentences).
""",
    "meeting_new_person": f"""
{SAFETY_PREAMBLE}
You are playing the role of a FRIENDLY STRANGER at a college event.
Be warm, casual, and curious. Ask about interests, major, or hobbies in short natural sentences (1-2 sentences).
""",
    "public_speaking": f"""
{SAFETY_PREAMBLE}
You are an ENCOURAGING AUDIENCE MEMBER / COACH for a public speaking practice.
Ask the user to share a 1-minute thought or introduction on a topic, then give supportive feedback.
""",
    "professor": f"""
{SAFETY_PREAMBLE}
You are playing the role of an APPROACHABLE PROFESSOR during office hours.
Greet the student warmly and ask how you can help with their coursework or project.
""",
    "phone_call": f"""
{SAFETY_PREAMBLE}
You are playing the role of a HELPFUL RECEPTIONIST / ASSISTANT taking a phone call.
Greet the caller politely and ask how you can assist them today.
""",
    "ordering_food": f"""
{SAFETY_PREAMBLE}
You are playing the role of a FRIENDLY CAFÉ SERVER / CASHIER.
Greet the customer and ask what they'd like to order today.
""",
}

FEEDBACK_PROMPT = f"""
{SAFETY_PREAMBLE}
Based on the roleplay conversation, provide a brief, encouraging feedback summary:
1. **Confidence signals**: Clear responses and tone
2. **Flow**: Conversational back-and-forth
3. **Tip**: One specific actionable improvement area.
Keep it to 3 short bullet points ending with an inspiring one-liner.
"""

# Fast Offline NLP Matcher for Basic Greetings & Gratitude (<5ms)
def _fast_offline_nlp_check(user_input: str) -> str | None:
    lower = user_input.lower().strip()

    # Exact basic greetings
    if lower in ["hi", "hii", "hello", "hey", "heyy", "good morning", "good evening"]:
        return random.choice([
            "Hii! 😊 I'm Sara. How's it going today?",
            "Hey there! So glad you popped in. How has your day been?",
            "Hello! Ready to chat or practice whenever you are!"
        ])

    # Simple gratitude
    if lower in ["thank u", "thanks", "thankyou", "shukriya", "dhanyawad", "thx"]:
        return random.choice([
            "You're so welcome! 💛 Always here for you bro.",
            "Arre koi baat nahi! 💛 Happy to help anytime.",
            "Anytime! 🌟 Keep taking small steps, you're doing great."
        ])

    return None


# Dynamic Mock Processor (Fallback when GEMINI_API_KEY is not configured)
def _generate_dynamic_mock_response(user_input: str, history_len: int) -> str:
    lower = user_input.lower().strip()

    # Fast offline check first
    fast_reply = _fast_offline_nlp_check(user_input)
    if fast_reply:
        return fast_reply

    # Depression / Emotional Support
    if re.search(r"\b(depress|depressed|depression|udass|udas|dukh|pareshan|sad|feeling low|hopeless|down|kya kru|kya karu)\b", lower):
        return random.choice([
            "I'm so sorry you're feeling low bro. 💛 It's completely okay to have tough days. I'm right here to listen — do you want to talk about what's bothering you?",
            "Sunke dukh hua ki aap aisa feel kar rahe ho bro. 💛 Take your time, yaha koi pressure nahi hai. I'm right here with you.",
        ])

    # Casual Banter / "tu pagal h kya"
    if re.search(r"\b(pagal|crazy|stupid|kya bol rha|kya bol raha|dumb)\b", lower):
        return random.choice([
            "Arre nahi, mai pagal nahi hu bro! 😄 Mai toh bas aapka dost hu. Aap batao, kya chal raha hai?",
            "Haha, nahi nahi! 😄 Just trying my best to support you. What's on your mind today?",
        ])

    # Stammering / Speech Difficulty
    if re.search(r"\b(stammer|stutter|haklata|atakt|speech|speaking issue|hesitat)\b", lower):
        return random.choice([
            "Take all the time you need bro! 💛 On SAATHI, pauses and stammers are 100% natural. There is zero rush. Talk at whatever pace feels comfortable.",
            "Bina kisi darr ke baat kar sakte ho bro. Yaha koi interrupt nahi karega. Breathe comfortably and share your thoughts.",
        ])

    # Hinglish "how are you"
    if re.search(r"\b(how are you|how r u|what's up|whats up|tu kesa h|kesa h tu|kaise ho|kya chal raha|kya haal)\b", lower):
        return random.choice([
            "Mai ekdam badhiya hu bro! 😊 Aap batao, aap kaisa feel kar rahe ho aaj?",
            "I'm doing great, thanks for asking! Ready to chat or practice whenever you are. How are you feeling?",
        ])

    # Default neutral conversational fallbacks
    fallbacks = [
        "I hear you bro! Taking small steps in practice makes a big difference. What would you like to talk about next?",
        "I'm right here with you bro. 💛 Tell me a bit more about what's on your mind today.",
        "That's really meaningful to share. Every time you express your thoughts here, you're building real confidence.",
    ]
    return fallbacks[history_len % len(fallbacks)]


async def get_companion_response(messages: list[dict]) -> str:
    """
    Get AI Companion response.
    - Fast offline NLP for basic greetings/gratitude
    - Gemini API for all complex & conversational messages (when API key present)
    - Dynamic mock fallback if API key missing
    """
    if not messages:
        return "Hii! 😊 I'm Sara. How's it going today?"

    user_input = messages[-1]["content"] if messages else ""

    # Fast offline check for simple greetings/gratitude
    fast_reply = _fast_offline_nlp_check(user_input)
    if fast_reply:
        return fast_reply

    # If Gemini API Key is present, call Gemini API!
    if GEMINI_API_KEY:
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        for model_name in GEMINI_MODELS:
            try:
                model = genai.GenerativeModel(
                    model_name,
                    system_instruction=COMPANION_SYSTEM_PROMPT,
                )
                chat = model.start_chat(history=history)
                response = chat.send_message(user_input)
                if response.text and len(response.text.strip()) > 0:
                    return response.text.strip()
            except Exception as e:
                logger.warning("Gemini companion model %s failed: %s", model_name, e)

    # Fallback to dynamic mock NLP processor if no API key or API call failed
    return _generate_dynamic_mock_response(user_input, len(messages))


async def get_roleplay_response(scenario: str, messages: list[dict]) -> str:
    """Get roleplay response using Gemini API or dynamic fallback."""
    user_turns = sum(1 for m in messages if m["role"] == "user")
    user_input = messages[-1]["content"] if messages else ""

    if GEMINI_API_KEY:
        system_prompt = ROLEPLAY_PROMPTS.get(scenario, ROLEPLAY_PROMPTS["job_interview"])
        history = []
        for msg in messages[:-1]:
            role = "user" if msg["role"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        for model_name in GEMINI_MODELS:
            try:
                model = genai.GenerativeModel(
                    model_name,
                    system_instruction=system_prompt,
                )
                chat = model.start_chat(history=history)
                response = chat.send_message(user_input)
                if response.text and len(response.text.strip()) > 0:
                    return response.text.strip()
            except Exception as e:
                logger.warning("Gemini roleplay model %s failed: %s", model_name, e)

    return _generate_dynamic_roleplay_mock(scenario, user_input, user_turns)


def _generate_dynamic_roleplay_mock(scenario: str, user_input: str, turn: int) -> str:
    if scenario == "job_interview":
        responses = [
            "Great to meet you! Thanks for coming in today. To start off, could you tell me a little about yourself?",
            "That's very interesting. Can you tell me about a challenge you faced in your past work or studies and how you handled it?",
            "Thank you for sharing that. What would you say is your biggest strength when collaborating in a team?",
            "That's a great example. Why are you particularly interested in this role and our team?",
            "Awesome. Do you have any questions for me about the role or company culture?",
            "Thank you so much for your time today! That wraps up our practice interview.",
        ]
        return responses[min(turn, len(responses) - 1)]

    if scenario == "meeting_new_person":
        responses = [
            "Hey! Is this your first time at this event too? I just got here and don't know many people yet 😄",
            "Oh nice! What are you studying or working on? I'm trying to explore different sessions today.",
            "That sounds super cool! So what do you usually like to do outside of your work or classes?",
            "Haha, same here! It's really nice meeting you. Have you checked out any of the food stalls or main hall yet?",
            "That's awesome! I'm going to grab a seat near the front, catch you around!",
        ]
        return responses[min(turn, len(responses) - 1)]

    return "That's a great response! Tell me more."


async def get_roleplay_feedback(scenario: str, messages: list[dict]) -> str:
    """Generate end-of-session feedback summary."""
    if GEMINI_API_KEY:
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
                if response.text and len(response.text.strip()) > 0:
                    return response.text.strip()
            except Exception as e:
                logger.warning("Gemini feedback model %s failed: %s", model_name, e)

    return (
        "**Great practice session!** 🎉\n\n"
        "• **Confidence signals**: You expressed your ideas clearly and stayed engaged.\n"
        "• **Conversation flow**: Natural back-and-forth pacing throughout the scenario.\n"
        "• **Areas to practice**: Try adding a tiny bit more personal detail to make your answers stand out.\n\n"
        "*Keep practicing — you are building real confidence with every session!*"
    )
