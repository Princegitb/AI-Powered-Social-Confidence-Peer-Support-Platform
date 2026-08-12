"""
SAATHI Speech Practice Router
Provides communication feedback based on a transcript + duration.
Text-only — for the demo we don't pull in STT (browser-side transcription
is a stretch goal per PRD §5.2). All analysis is heuristic.
"""

import logging
import re
from datetime import datetime

from fastapi import APIRouter
from pydantic import BaseModel

from database import get_or_create_user, log_progress

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

router = APIRouter()


class SpeechRequest(BaseModel):
    user_id: str
    transcript: str
    duration_seconds: float  # how long the user "spoke"


class SpeechFeedback(BaseModel):
    pace: str            # "Slow" | "Moderate" | "Fast"
    wpm: int
    filler_count: int
    long_pauses: int
    clarity: str         # "Good" | "Fair" | "Practise more"
    clarity_score: int   # 0-100
    suggestion: str
    transcript: str


FILLER_WORDS = [
    "um", "uh", "er", "ah", "like", "you know", "i mean",
    "kinda", "sort of", "so", "well", "actually", "basically",
]


def _word_count(text: str) -> int:
    return len([w for w in re.findall(r"\b\w+\b", text) if w.strip()])


def _count_fillers(text: str) -> int:
    lower = text.lower()
    count = 0
    for f in FILLER_WORDS:
        # word-boundary match for single words; substring for multi-word phrases
        if " " in f:
            count += len(re.findall(re.escape(f), lower))
        else:
            count += len(re.findall(rf"\b{re.escape(f)}\b", lower))
    return count


def _estimate_pauses(text: str, duration: float) -> int:
    """
    Heuristic only — we don't have audio. Approximate "long pauses" as
    sentence count vs duration.
    """
    sentences = max(1, len(re.findall(r"[.!?]+", text)))
    # If average time per sentence is > 4s, assume some long pauses.
    avg = duration / sentences
    if avg > 5:
        return int(duration / 5) - sentences
    return 0


@router.post("/speech/feedback", response_model=SpeechFeedback)
async def speech_feedback(req: SpeechRequest):
    """Generate non-clinical communication-practice feedback."""
    await get_or_create_user(req.user_id, "Friend")

    text = (req.transcript or "").strip()
    duration = max(1.0, float(req.duration_seconds or 1.0))
    words = _word_count(text)

    wpm = int(round(words / (duration / 60.0))) if duration > 0 else 0

    if wpm == 0:
        pace = "Slow"
    elif wpm < 110:
        pace = "Slow"
    elif wpm < 160:
        pace = "Moderate"
    else:
        pace = "Fast"

    filler_count = _count_fillers(text)
    long_pauses = _estimate_pauses(text, duration)

    # Clarity score is a non-clinical heuristic — drops with filler density.
    filler_rate = filler_count / max(words, 1)
    clarity_score = max(0, min(100, int(100 - (filler_rate * 1000) - (long_pauses * 5))))
    if clarity_score >= 75:
        clarity = "Good"
    elif clarity_score >= 50:
        clarity = "Fair"
    else:
        clarity = "Practise more"

    # Non-clinical suggestion (always framed as PRACTICE feedback).
    if pace == "Fast":
        s = "Try slowing down slightly — comfortable pauses make you feel more grounded and sound more confident."
    elif pace == "Slow":
        s = "A slightly brisker pace can keep your listener engaged. Try a quick breath before each sentence."
    elif filler_count > 5:
        s = "Watch out for filler words like 'um' and 'like'. A short pause is more confident than a filler."
    elif long_pauses > 2:
        s = "Try to bridge your pauses with a soft breath rather than a long silence — it keeps the flow natural."
    else:
        s = "Nice flow! Keep practising to lock in this comfortable rhythm."

    # Persist
    await log_progress(req.user_id, "speech_practice", {
        "wpm": wpm,
        "filler_count": filler_count,
        "clarity_score": clarity_score,
    })

    return SpeechFeedback(
        pace=pace,
        wpm=wpm,
        filler_count=filler_count,
        long_pauses=long_pauses,
        clarity=clarity,
        clarity_score=clarity_score,
        suggestion=s,
        transcript=text,
    )
