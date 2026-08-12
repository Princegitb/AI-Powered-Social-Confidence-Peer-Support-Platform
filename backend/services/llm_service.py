"""
SAATHI LLM Service
Wraps Google Gemini API for AI Companion ("Sara") and Roleplay conversations.
Enforces ethical guardrails in every prompt and provides an intelligent, compassionate,
Hinglish-aware Intent NLP Engine when running in mock mode or when Gemini API key is not set.
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

# Base safety preamble
SAFETY_PREAMBLE = """
CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. You are SARA, a warm, supportive communication practice companion on SAATHI.
2. NEVER diagnose any mental health condition (anxiety, depression, PTSD, etc.).
3. NEVER claim to replace a therapist, doctor, or professional medical service.
4. NEVER use love-bombing language or encourage emotional dependency on you.
5. If a user expresses acute distress or crisis, respond with empathy and gently suggest reaching out to a trusted person or professional support resource.
6. Always frame feedback as "communication practice feedback," never as medical assessment.
7. Keep your tone warm, encouraging, non-clinical, and conversational.
8. Understand Hinglish, Hindi, and English fluently.
9. If the user stammers or expresses speech disfluency, BE PATIENT, NEVER RUSH, and reassure them that pauses are natural.
"""

COMPANION_SYSTEM_PROMPT = f"""
{SAFETY_PREAMBLE}

You are Sara — SAATHI's AI conversation companion.
Your role:
- Listen empathetically and respond naturally like a supportive friend.
- Understand Hinglish (e.g. "kesa h tu", "depressed hu kya kru", "baat karni hai") and reply in warm, relatable Hinglish/English.
- Keep responses concise (2-4 sentences typically), warm, and engaging.
- If the user is feeling low or stressed, give gentle emotional comfort without medical diagnosis.
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

# Smart, highly empathetic NLP Intent Processor for Mock Mode / Keyless operations
def _generate_dynamic_mock_response(user_input: str, history_len: int) -> str:
    lower = user_input.lower().strip()

    # 1. Depression / Sadness / Feeling Low Intent
    if re.search(r"\b(depress|depressed|depression|udass|udas|dukh|pareshan|sad|feeling low|hopeless|down|kya kru|kya karu)\b", lower):
        return random.choice([
            "I'm so sorry you're feeling this way. 💛 It's completely valid to feel low sometimes. I'm right here to listen — do you want to talk about what's been weighing on your mind, or just take things slow?",
            "Sunke dukh hua ki aap aisa feel kar rahe ho. 💛 It's okay to have tough days. Aap chahe toh mujhse baate share kar sakte ho, yaha koi pressure nahi hai.",
            "I hear you. Feeling depressed or overwhelmed is really heavy. Remember you don't have to carry it all at once. What's been making you feel this way lately?"
        ])

    # 2. Casual Banter / Teasing / "tu pagal h kya" Intent
    if re.search(r"\b(pagal|pagal h|crazy|stupid|kya bol rha|kya bol raha|dumb|madv)\b", lower):
        return random.choice([
            "Arre nahi, mai pagal nahi hu! 😄 Mai toh bas aapki baat sunne aur practice me help karne ke liye yaha hu. Aap batao, kya chal raha hai?",
            "Haha, nahi nahi! 😄 Just trying my best to support you. Batao, aaj kaisa raha din?",
            "Arre aisa mat bolo! 😄 I'm just your friend Sara. What's on your mind today?"
        ])

    # 3. Gratitude / Thanks Intent
    if re.search(r"\b(thank|thanks|thank u|thankyou|shukriya|dhanyawad|thx)\b", lower):
        return random.choice([
            "You're so welcome! 💛 Always here for you whenever you want to talk or practice.",
            "Arre koi baat nahi! 💛 I'm really glad I could help. Anytime you need to chat, I'm right here.",
            "Anytime! 🌟 Keep taking small steps, you're doing great."
        ])

    # 4. Stammering / Speech Difficulty Intent
    if re.search(r"\b(stammer|stutter|haklata|atakt|speech|speaking issue|hesitat)\b", lower):
        return random.choice([
            "Take all the time you need! 💛 Here on SAATHI, pauses and stammers are 100% natural. There is zero rush. What would you like to practice today?",
            "Aap bilkul bina kisi darr ke baat kar sakte ho. Yaha koi interrupt nahi karega. Breathe comfortably and share whatever is on your mind."
        ])

    # 5. Greetings
    if re.search(r"\b(hi|hii|hello|hey|heyy|greetings|good morning|good evening)\b", lower):
        return random.choice([
            "Hii! 😊 I'm Sara. How are you doing today?",
            "Hey there! So glad you popped in. How has your day been going?",
            "Hello! I'm Sara, your practice partner. What's on your mind today?"
        ])

    # 6. "How are you" / "Kesa h tu" / "What's up"
    if re.search(r"\b(how are you|how r u|what's up|whats up|tu kesa h|kesa h tu|kaise ho|kya chal raha|kya haal)\b", lower):
        return random.choice([
            "Mai ekdam badhiya hu! 😊 Aap batao, aap kaisa feel kar rahe ho aaj?",
            "I'm doing great, thank you for asking! Ready to practice or chat whenever you are. How are you feeling?",
            "Doing wonderful! What's up on your side today?"
        ])

    # 7. Interview / Job search
    if re.search(r"\b(interview|job|hiring|resume|work|career)\b", lower):
        return random.choice([
            "Interviews can feel nerve-wracking, but you're doing the best thing by practicing beforehand! Would you like to launch our Job Interview roleplay scenario?",
            "That's a big opportunity! Practice helps build muscle memory for your answers. Want to try a 3-minute mock interview together?",
        ])

    # 8. Small talk / Meeting people
    if re.search(r"\b(meet|friend|people|talk|social|party|small talk)\b", lower):
        return random.choice([
            "Making conversation with new people gets easier the more you rehearse low-stakes intros. Want to try the 'Meeting Someone New' practice scenario?",
            "That's super relatable. Starting a simple 'Hey, how's it going?' is often all it takes. Let me know if you'd like to practice an introduction!"
        ])

    # 9. Public speaking / Presentations
    if re.search(r"\b(speak|speech|presentation|present|stage|crowd|class)\b", lower):
        return random.choice([
            "Public speaking is all about pacing and taking calm breaths before key points. Would you like to practice a 1-minute intro with me?",
            "That sounds like a great skill to sharpen! We can practice your key points right here."
        ])

    # 10. Empathetic, warm fallbacks (Insensitive lines removed!)
    fallbacks = [
        "I hear you! Taking small steps in practice makes a big difference over time. What would you like to talk about next?",
        "I'm right here with you. 💛 Tell me a bit more about what's on your mind today.",
        "That's really meaningful to share. Every time you express your thoughts here, you're building real confidence.",
        "I'm listening. Take your time and share whatever feels comfortable for you.",
    ]
    return fallbacks[history_len % len(fallbacks)]


def _generate_dynamic_roleplay_mock(scenario: str, user_input: str, turn: int) -> str:
    lower = user_input.lower().strip()

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

    if scenario == "public_speaking":
        return "Thank you for sharing! Your delivery was clear and your main point came through well. Try taking a comfortable pause before your closing sentence."

    if scenario == "professor":
        return "Hello! Come on in. What questions do you have about the upcoming assignment or reading material?"

    if scenario == "phone_call":
        return "Thank you for calling! How can I assist you with your appointment or inquiry today?"

    if scenario == "ordering_food":
        return "Welcome in! What can I get started for you today — tea, coffee, or something to eat?"

    return "That's a great response! Tell me more."


async def get_companion_response(messages: list[dict]) -> str:
    """Get AI Companion response using Gemini with model fallback + dynamic mock fallback."""
    if not messages:
        return "Hii! 😊 I'm Sara. How are you doing today?"

    user_input = messages[-1]["content"] if messages else ""

    if not GEMINI_API_KEY:
        return _generate_dynamic_mock_response(user_input, len(messages))

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
            logger.warning("Gemini model %s failed: %s", model_name, e)

    return _generate_dynamic_mock_response(user_input, len(messages))


async def get_roleplay_response(scenario: str, messages: list[dict]) -> str:
    """Get roleplay response for a given scenario."""
    user_turns = sum(1 for m in messages if m["role"] == "user")
    user_input = messages[-1]["content"] if messages else ""

    if not GEMINI_API_KEY:
        return _generate_dynamic_roleplay_mock(scenario, user_input, user_turns)

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


async def get_roleplay_feedback(scenario: str, messages: list[dict]) -> str:
    """Generate end-of-session feedback summary."""
    if not GEMINI_API_KEY:
        return (
            "**Great practice session!** 🎉\n\n"
            "• **Confidence signals**: You expressed your ideas clearly and stayed engaged.\n"
            "• **Conversation flow**: Natural back-and-forth pacing throughout the scenario.\n"
            "• **Areas to practice**: Try adding a tiny bit more personal detail to make your answers stand out.\n\n"
            "*Keep practicing — you are building real confidence with every session!*"
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
            if response.text and len(response.text.strip()) > 0:
                return response.text.strip()
        except Exception as e:
            logger.warning("Gemini feedback model %s failed: %s", model_name, e)

    return (
        "**Nice work completing that practice session!** 🎉\n\n"
        "• **Confidence**: Great initiative in starting and finishing the practice.\n"
        "• **Pacing**: Steady answers and comfortable tone.\n\n"
        "*Every practice session builds real-world confidence!*"
    )
