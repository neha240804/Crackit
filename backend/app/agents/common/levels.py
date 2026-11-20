"""Difficulty levels (easy / intermediate / hard), and what real interview questions look like.

Shared by the interview plan, the interviewer, the topic switch and question prep, so they all
pitch questions the same way. The question bank tags every question with the same three levels.

Levels used to describe the CANDIDATE (fresher, 1-3, 3-5, 5+ years). Crackit's users are
mostly electrical students preparing for the same campus, core-company and PSU interviews, so
experience bands said little; what they choose is how hard the questions should be. Old values
still arrive from saved interviews and prep sets: normalize_level() maps them.

Why the guide text exists (measured, Nov 2026): given only a label ("Fresher"), the interviewer
read it as "beginner" and asked definitions: "what does CRUD stand for?" to a student who had
just described their schema, "explain Ohm's law" to one whose project was Newton-Raphson load
flow. Real interviews ask how and why, what-if, how you would solve or debug something, and
about your own work, at every difficulty.
"""

from typing import Literal

Level = Literal["easy", "intermediate", "hard"]

LEVEL_LABEL: dict[str, str] = {"easy": "Easy", "intermediate": "Intermediate", "hard": "Hard"}

# Saved interviews and prep sets from before the change store experience bands.
LEGACY_LEVELS = {"fresher": "easy", "1-3": "intermediate", "3-5": "hard", "5+": "hard"}

LEVEL_GUIDE = {
    "easy": (
        "Easy = the core questions a panel opens a topic with: how and why a standard thing "
        "works, its main parts, the reason behind a common practice (for example why a "
        "transformer is rated in kVA, why a star-delta starter is used). One idea per question, "
        "answerable in a few sentences. Still never a bare definition, an acronym to expand or a "
        "law to recite: ask how or why."
    ),
    "intermediate": (
        "Intermediate = applied questions: compare and choose, what happens when a condition "
        "changes, a realistic site or project situation, a short calculation, or a follow-up "
        "that links two ideas (for example what you give up with star-delta starting, why a CT "
        "secondary must never be left open)."
    ),
    "hard": (
        "Hard = deep reasoning: troubleshooting with several possible causes, design and "
        "selection decisions with trade-offs, numericals with the working, and edge cases (for "
        "example why a transformer differential relay can trip on energisation and how harmonic "
        "restraint prevents it, sizing a capacitor bank, relay coordination). Expect the "
        "candidate to justify each step."
    ),
}

# Illustrations drawn from different subjects on purpose, so the model copies the SHAPE of a
# good question rather than the topic.
REAL_QUESTION_STYLE = """Real interviewers ask questions like these (shape, not topic):
- About the candidate's own work: "In your project, how did you decide the transformer rating?"
- A realistic scenario: "A motor keeps tripping on start. What do you check first?"
- Why/how and what-if: "Why does Newton-Raphson converge faster than Gauss-Seidel, and when can it fail?"
- Compare and choose: "When would you choose a VFD over a star-delta starter?"
- Debug or estimate: "Users see stale data after an update. Where would you look?"
They do NOT quiz definitions ("What is CRUD?", "Define a relay", "State Ohm's law")."""


def normalize_level(value: object) -> object:
    """Map a legacy experience band to its difficulty; leave anything else for validation."""
    if isinstance(value, str):
        return LEGACY_LEVELS.get(value, value)
    return value


def level_label(value: str) -> str:
    return LEVEL_LABEL.get(str(normalize_level(value)), "Intermediate")


def level_guide(value: str) -> str:
    return LEVEL_GUIDE.get(str(normalize_level(value)), LEVEL_GUIDE["intermediate"])
