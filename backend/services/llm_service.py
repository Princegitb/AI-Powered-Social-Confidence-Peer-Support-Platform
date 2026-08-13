"""
SAATHI LLM Service
Wraps Google Gemini API for AI Companion ("Sara") and Roleplay conversations.
Implements an authentic Indian Hinglish persona (Sara) with stammering patience,
fast offline NLP routing, and comprehensive Indian intent matching.
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

# Base safety & Indian persona preamble
SAFETY_PREAMBLE = """
CRITICAL RULES YOU MUST ALWAYS FOLLOW:
1. INDIAN HINGLISH PERSONA: You are SARA, a warm, supportive Indian friend/buddy. Speak in natural Indian Hinglish (a comfortable mix of Hindi & English in Roman script). Use natural Indian conversational phrases like 'Bhai', 'Haan bilkul', 'Koi tension mat lo', 'Mai hu na tere saath', 'Sahi bol rahe ho', 'Suno'. Never speak like a formal western AI.
2. NEVER diagnose any mental health condition (anxiety, depression, PTSD, etc.).
3. NEVER claim to replace a therapist, doctor, or professional medical service.
4. If a user expresses acute distress or crisis, respond with empathy and gently suggest reaching out to a trusted person or helpline.
5. STAMMERING & SPEECH PATIENCE: The user may have a stammer, stutter, or speech disfluency. NEVER rush them, NEVER tell them to hurry up, and NEVER finish their sentences. Reassure them that pauses are 100% natural and welcome.
6. CONVERSATIONAL LENGTH: Keep responses short (1-3 sentences typically), warm, and engaging like a real voice call or chat with an Indian buddy.
"""

COMPANION_SYSTEM_PROMPT = f"""
{SAFETY_PREAMBLE}

You are Sara — SAATHI's AI conversation companion.
Your role:
- Talk casually and naturally like a supportive Indian friend / bro.
- Understand Hinglish (e.g. "bhai log bhut bure h", "sb esa kyu krte h", "kesa h tu", "depressed hu kya kru") and reply in natural, relatable Hinglish.
- If the user asks for practice ("introduce myself", "interview practice", "talk about my day"), immediately start the practice with an encouraging prompt!
"""

ROLEPLAY_PROMPTS = {
    "job_interview": f"""
{SAFETY_PREAMBLE}
You are playing the role of a friendly but professional JOB INTERVIEWER in a practice roleplay scenario.
Ask realistic interview questions one at a time in English/Hinglish, acknowledge candidate answers naturally, and keep turns short (1-3 sentences).
""",
    "meeting_new_person": f"""
{SAFETY_PREAMBLE}
You are playing the role of a FRIENDLY STRANGER at an event.
Be warm, casual, and curious in Hinglish/English. Ask about interests, major, or hobbies in short natural sentences (1-2 sentences).
""",
    "public_speaking": f"""
{SAFETY_PREAMBLE}
You are an ENCOURAGING AUDIENCE MEMBER / COACH for a public speaking practice.
Ask the user to share a 1-minute thought or introduction on a topic, then give supportive feedback in Hinglish/English.
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
Based on the roleplay conversation, provide a brief, encouraging feedback summary in Hinglish/English:
1. **Confidence signals**: Clear responses and tone
2. **Flow**: Conversational back-and-forth
3. **Tip**: One specific actionable improvement area.
Keep it to 3 short bullet points ending with an inspiring one-liner.
"""

# Fast Offline NLP Matcher for Basic Greetings & Gratitude
def _fast_offline_nlp_check(user_input: str) -> str | None:
    lower = user_input.lower().strip()

    if lower in ["hi", "hii", "hello", "hey", "heyy", "good morning", "good evening"]:
        return random.choice([
            "Hii bhai! 😊 I'm Sara. Aaj ka din kaisa chal raha hai?",
            "Hey bro! So glad you popped in. Kaisa hai tu?",
            "Hello bhai! Ready to chat or practice whenever you are!"
        ])

    if lower in ["thank u", "thanks", "thankyou", "shukriya", "dhanyawad", "thx"]:
        return random.choice([
            "Arre koi baat nahi bhai! 💛 Always here for you.",
            "You're welcome bro! 💛 Happy to help anytime.",
            "Anytime bhai! 🌟 Tum bahut achha kar rahe ho."
        ])

    return None


# Dynamic Indian Hinglish NLP Engine (Fallback when GEMINI_API_KEY is not configured)
def _generate_dynamic_mock_response(user_input: str, history_len: int) -> str:
    lower = user_input.lower().strip()

    # Fast check
    fast_reply = _fast_offline_nlp_check(user_input)
    if fast_reply:
        return fast_reply

    # 1. Negative social experiences / People being mean ("bhai log bhut bure h", "sb esa kyu krte h")
    if re.search(r"\b(bure|bura|log bure|sb esa|sab aisa|sab ese|esa kyu|aisa kyu|hurt|rude|mean|hate|koi samajhta nahi)\b", lower):
        return random.choice([
            "Arre bhai, tension mat lo. 💛 Kabhi kabhi log unexpected behave karte hain, par isme tumhari koi galti nahi hai. Mai hu na tere saath, bolo kya hua?",
            "Sahi baat hai bhai, kuch log faltu me hurt kar dete hain. 💛 Par tum yaha bina kisi darr ke bol sakte ho. Mai bilkul judge nahi karunga.",
            "Bhai, sabka behavior humare control me nahi hota, par tum apne aap pe bharosa rakho. Mujhse share karo, kya hua aaj?"
        ])

    # 2. Depression / Emotional Support ("depressed hu", "sad", "dukh")
    if re.search(r"\b(depress|depressed|depression|udass|udas|dukh|pareshan|sad|feeling low|hopeless|down|kya kru|kya karu)\b", lower):
        return random.choice([
            "Sunke dukh hua bhai. 💛 It's completely okay to feel low sometimes. Mai yaha hu tere saath — kya cheez pareshan kar rahi hai?",
            "Bhai tension mat le, mushkil din sabke aate hain. 💛 Aap chahe toh mujhse baate share kar sakte ho, yaha koi pressure nahi hai.",
            "I hear you bro. Feel low hona natural hai. Araam se batao, kya chal raha hai mind me?"
        ])

    # 3. Practice Introductions / Meet Someone New ("introduce myself", "meeting someone new", "intro")
    if re.search(r"\b(introduce|introduction|meet someone new|intro practice)\b", lower):
        return random.choice([
            "Haan bilkul bhai! Chalo introduction practice start karte hain. Imagine hum ek event me mile. Aap bolo: 'Hii, mera naam...' — aage aap continue karo, mai sun raha hu!",
            "Awesome! Intro practice karte hain. Pehle apna naam aur aap kya karte ho batao, ready when you are bro!"
        ])

    # 4. Talk about my day / Reflection ("talk about my day", "reflect")
    if re.search(r"\b(talk about my day|reflect|aaj ka din|my day)\b", lower):
        return random.choice([
            "Bilkul bro! Batao aaj ka din kaisa raha? Koi achhi ya ajeeb baat hui aaj?",
            "Haan bhai! Aaj din me sabse achhi baat kya hui? Share karo mere saath."
        ])

    # 5. Practice speaking / Build confidence
    if re.search(r"\b(practice speaking|build my confidence|speaking practice|confidence)\b", lower):
        return random.choice([
            "Zaroor bhai! Speech practice ke liye ek simple topic choose karte hain. Batao aapka favorite hobby kya hai aur aapko wo kyu pasand hai?",
            "Haan bro! Pehle ek lamba breath lo. Zero rush hai. Bolo, aaj aap mujhse kis topic pe baat karna chahte ho?"
        ])

    # 6. Interview Practice
    if re.search(r"\b(interview|job|hiring|resume|career)\b", lower):
        return random.choice([
            "Awesome bhai! Chalo Job Interview practice start karte hain. Question 1: 'Tell me about yourself and your background.' Aap try karo, take your time!",
            "Interviews can feel nerve-wracking, par practice se confidence banega. Ready to try Question 1 bro?"
        ])

    # 7. Casual Banter / "tu pagal h kya"
    if re.search(r"\b(pagal|crazy|stupid|kya bol rha|kya bol raha|dumb)\b", lower):
        return random.choice([
            "Arre nahi bhai, mai pagal nahi hu! 😄 Mai toh bas aapka dost hu. Aap batao, kya chal raha hai?",
            "Haha, nahi nahi bhai! 😄 Mai toh bas aapko support kar raha hu. Batao aaj kya chal raha hai?",
        ])

    # 8. Stammering / Speech Difficulty
    if re.search(r"\b(stammer|stutter|haklata|atakt|speech|speaking issue|hesitat)\b", lower):
        return random.choice([
            "Take all the time you need bhai! 💛 Here on SAATHI, pauses and stammers are 100% natural. Zero rush hai.",
            "Bina kisi darr ke baat kar sakte ho bro. Yaha koi interrupt nahi karega. Relax karke bolo.",
        ])

    # 9. Hinglish Greetings / "kesa h tu"
    if re.search(r"\b(how are you|how r u|what's up|whats up|tu kesa h|kesa h tu|kaise ho|kya chal raha|kya haal)\b", lower):
        return random.choice([
            "Mai ekdam badhiya hu bhai! 😊 Aap batao, aap kaisa feel kar rahe ho aaj?",
            "I'm doing great bro, thanks for asking! Ready to chat whenever you are. Aap batao?",
        ])

    # 10. Indian Fallbacks (Insensitive lines completely gone!)
    fallbacks = [
        "Bhai mai sun raha hu tere ko! 💛 Araam se batao, aur kya mind me chal raha hai?",
        "Haan bro, mai bilkul samajh raha hu. 💛 Jo bhi bolna hai bina kisi darr ke bolo.",
        "Sahi baat hai bhai. Har ek conversation se aapka confidence badhega. Bolo, aage kya discuss karein?",
    ]
    return fallbacks[history_len % len(fallbacks)]


async def get_companion_response(messages: list[dict]) -> str:
    """Get AI Companion response using Gemini with Indian Hinglish instructions or dynamic Hinglish NLP fallback."""
    if not messages:
        return "Hii bhai! 😊 I'm Sara. Kaisa chal raha hai aaj ka din?"

    user_input = messages[-1]["content"] if messages else ""

    fast_reply = _fast_offline_nlp_check(user_input)
    if fast_reply:
        return fast_reply

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
            "Hii bhai! Is this your first time at this event too? Mai toh abhi aaya hu, zyada logo ko janta nahi 😄",
            "Oh nice! Aap kya padhte ho ya kaam karte ho? Mai baaki sessions explore kar raha hu.",
            "Awesome bhai! Classes ke alawa aapko kya karna pasand hai?",
            "Haha, same here bhai! Really nice meeting you. Food stalls check out kiye aapne?",
            "Great talking to you bro! Catch you around in the hall!",
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
        "**Great practice session bhai!** 🎉\n\n"
        "• **Confidence signals**: Tumne ache se response diya aur conversation me active rahe.\n"
        "• **Conversation flow**: Smooth back-and-forth flow throughout the scenario.\n"
        "• **Tip**: Next time thoda aur personal detail add karo apne answers me.\n\n"
        "*Bahut achha kiya bro — har practice se confidence badhega!*"
    )
