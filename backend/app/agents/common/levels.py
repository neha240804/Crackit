"""What each experience level means, and what real interview questions look like.

Shared by the interview plan, the interviewer, the topic switch and question prep, so they all
pitch questions the same way.

Why this exists (measured, Nov 2026): the interviewer only ever saw the label "Fresher". With
the plan told to "start with fundamentals" and the switch prompt asking for "a simple, basic
question", sampled interviews opened with "what does CRUD stand for?" (SQL, to a student who
had just described their own schema and indexes), "explain props vs state" (React, to a
developer with two years' experience) and "explain Ohm's law" (power systems, to a student
whose project was Newton-Raphson load flow). Real interviews almost never quiz definitions:
they ask how and why, what-if, how you would solve or debug something, and about your own
work. The label alone reads as "beginner"; this text says what the level actually expects.
"""

LEVEL_GUIDE = {
    "fresher": (
        "Fresher = a graduate interviewing for a first job (campus placements, PSUs, core and "
        "product companies), NOT a beginner. Assume they know the syllabus basics. Never ask "
        "them to define a term, expand an acronym or state a law or formula. Ask how and why "
        "things work, what happens when a condition changes, how they would solve a small "
        "realistic problem, and about the projects they mention."
    ),
    "1-3": (
        "1-3 years = has shipped real work. Ask about decisions in their own projects, debugging "
        "real problems, choosing between approaches, and production concerns such as "
        "performance, correctness and testing. Never ask beginner definitions."
    ),
    "3-5": (
        "3-5 years = owns features end to end. Ask about design and trade-offs, failure modes, "
        "scaling, and technical decisions they led. Expect depth and justification."
    ),
    "5+": (
        "5+ years = senior. Ask about architecture and trade-offs at scale, incidents and what "
        "they changed afterwards, and leading or mentoring others. Expect depth."
    ),
}

# Illustrations drawn from different subjects on purpose, so the model copies the SHAPE of a
# good question rather than the topic.
REAL_QUESTION_STYLE = """Real interviewers ask questions like these (shape, not topic):
- About the candidate's own work: "In your library app, how did you decide which columns to index?"
- A realistic scenario: "A query got slow once the table hit ten million rows. What do you check first?"
- Why/how and what-if: "Why does Newton-Raphson converge faster than Gauss-Seidel, and when can it fail?"
- Compare and choose: "When would you keep state in a component instead of a global store?"
- Debug or estimate: "Users see stale data after an update. Where would you look?"
They do NOT quiz definitions ("What is CRUD?", "What are props?", "State Ohm's law")."""


def level_guide(experience: str) -> str:
    return LEVEL_GUIDE.get(experience, LEVEL_GUIDE["fresher"])
