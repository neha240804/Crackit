"""Communication metrics computed in code from transcripts + audio durations.

Exact measurements (not LLM guesses): the report's communication feedback quotes these.
"""

import re

FILLERS = ["um", "uh", "erm", "hmm", "like", "you know", "basically", "actually",
           "literally", "i mean", "sort of", "kind of"]
FILLER_RE = re.compile(r"\b(" + "|".join(re.escape(f) for f in FILLERS) + r")\b", re.IGNORECASE)


def answer_metrics(text: str, duration_sec: float | None) -> dict:
    words = len(text.split())
    fillers = [m.group(1).lower() for m in FILLER_RE.finditer(text)]
    wpm = round(words / (duration_sec / 60)) if duration_sec and duration_sec > 1 else None
    return {
        "words": words,
        "duration_sec": round(duration_sec, 1) if duration_sec else None,
        "wpm": wpm,
        "filler_count": len(fillers),
        "fillers_per_100_words": round(100 * len(fillers) / words, 1) if words else 0.0,
    }


def overall_metrics(answers: list[dict]) -> dict:
    """answers: [{"text": ..., "duration_sec": ...}, ...]"""
    per = [answer_metrics(a["text"], a.get("duration_sec")) for a in answers]
    words = sum(p["words"] for p in per)
    seconds = sum(p["duration_sec"] or 0 for p in per)
    fillers = sum(p["filler_count"] for p in per)
    all_fillers = [m.group(1).lower() for a in answers for m in FILLER_RE.finditer(a["text"])]
    top = sorted({f: all_fillers.count(f) for f in all_fillers}.items(), key=lambda x: -x[1])[:3]
    return {
        "answers": len(per),
        "total_words": words,
        "speaking_seconds": round(seconds),
        "avg_wpm": round(words / (seconds / 60)) if seconds > 1 else None,
        "avg_answer_words": round(words / len(per)) if per else 0,
        "fillers_per_100_words": round(100 * fillers / words, 1) if words else 0.0,
        "top_fillers": [f for f, _ in top],
        "per_answer": per,
    }
