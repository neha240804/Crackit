"""Write docs/PROMPTS.md: every LLM prompt in the app, copied from the source constants.

Generated (not hand-written) so the document is always exactly what the models receive.
Run from backend/:  uv run python scripts/export_prompts.py
"""

from pathlib import Path

from app.agents.interview import prompts as interview
from app.agents.interview.graph import MAX_FOLLOW_UPS, MAX_MISSES, thread_rule
from app.agents.optimizer import prompts as optimizer
from app.agents.profile.graph import PARSE_PROMPT
from app.schemas.interview import PERSONAS
from app.services.prep_service import LEVEL_MIX, PREP_PROMPT, RESUME_PREP_PROMPT

OUT = Path(__file__).resolve().parents[2] / "docs" / "PROMPTS.md"


def block(text: str) -> str:
    return f"```text\n{text.strip()}\n```\n"


def section(title: str, where: str, used_for: str, model: str, text: str, notes: str = "") -> str:
    out = f"### {title}\n\n- **File:** `{where}`\n- **Used for:** {used_for}\n- **Model:** {model}\n"
    if notes:
        out += f"- **Notes:** {notes}\n"
    return out + "\n" + block(text) + "\n"


parts = [
    "# LLM prompts\n\n",
    ("Every prompt the app sends to an LLM, generated from the source by "
    "`backend/scripts/export_prompts.py` (re-run it after changing a prompt). `{placeholders}` "
    "are filled in by code at run time. All structured calls use Groq strict JSON-schema output "
    "(`get_structured_llm`), so the response *shape* is enforced by the schema, not the prompt.\n\n"
    "Models: **fast** = `openai/gpt-oss-20b`, **strong** = `openai/gpt-oss-120b`; each falls back "
    "to the other on rate limits or errors.\n\n"),

    "## 1. Mock interview (`app/agents/interview/`)\n\n",
    section("PLAN_PROMPT", "agents/interview/prompts.py", "Plans the interview once at the start: "
            "title, focus areas and opening question.", "fast", interview.PLAN_PROMPT),
    section("INTERVIEWER_PROMPT", "agents/interview/prompts.py", "Every interviewer turn: judge the "
            "last answer, react, and choose the next move and question.", "fast (temperature 0.6)",
            interview.INTERVIEWER_PROMPT,
            "`{thread_rule}` is filled by code (topic control) with one of the rules below. The human "
            "message is the last 10 transcript lines followed by \"Your turn.\""),
    section("SWITCH_PROMPT", "agents/interview/prompts.py", "Moving to a new topic that CODE picked "
            "(`next_focus_area()`), when the candidate is struggling or a thread is exhausted.",
            "fast", interview.SWITCH_PROMPT),
    section("REPORT_PROMPT", "agents/interview/prompts.py", "The feedback report after the interview "
            "(scores, strengths, improvements, model answers).", "strong (reasoning medium)", interview.REPORT_PROMPT,
            "`{rubrics}` is the scoring rubric from `knowledge_base/rubrics/`. Pace and filler words "
            "are computed in code, not by the LLM."),

    "### Topic-control rules (inserted as `{thread_rule}`)\n\n"
    f"Decided in code (`thread_rule()` in `graph.py`). MAX_MISSES = {MAX_MISSES}, "
    f"MAX_FOLLOW_UPS = {MAX_FOLLOW_UPS}.\n\n"
    "**Struggling: must switch now**\n\n" + block(thread_rule(0, MAX_MISSES)) +
    "\n**Thread exhausted: must switch now**\n\n" + block(thread_rule(MAX_FOLLOW_UPS, 0)) +
    "\n**One miss already: switch if this answer is also weak**\n\n" + block(thread_rule(0, MAX_MISSES - 1)) +
    "\n**Added in the one-miss case (draft the switch in the same call)**\n\n" + block(
        "ALSO fill switch_reaction (the correct idea in one short sentence, then 'Let's move on.') "
        "and switch_question (ONE simple, basic question about '{target}', a single idea). They are "
        "used if you have to move on.") + "\n",

    "### Interviewer personas (inserted as `{name}` / `{style}`)\n\n"
    + "".join(f"- **{p['name']}**: {p['style']}\n" for p in PERSONAS.values()) + "\n",

    "## 2. Resume parsing (`app/agents/profile/`)\n\n",
    section("PARSE_PROMPT", "agents/profile/graph.py", "Turns an uploaded resume's text into a "
            "structured candidate profile.", "strong", PARSE_PROMPT,
            "Human message: \"RESUME:\" followed by the extracted text."),

    "## 3. ATS check and optimizer (`app/agents/optimizer/`)\n\n",
    section("JD_PROMPT", "agents/optimizer/prompts.py", "Extracts requirements from a job "
            "description.", "strong (temperature 0)", optimizer.JD_PROMPT),
    section("GAP_PROMPT", "agents/optimizer/prompts.py", "Honest skill-gap analysis: implied vs "
            "missing skills, strengths, fit summary.", "strong", optimizer.GAP_PROMPT,
            "Format score and keyword match are computed in code before this call."),
    section("REWRITE_PROMPT", "agents/optimizer/prompts.py", "Tailored resume rewrite (backend "
            "only; no UI button at present).", "strong (temperature 0.3)", optimizer.REWRITE_PROMPT),
    section("VERIFY_PROMPT", "agents/optimizer/prompts.py", "LLM fact-checker for the rewrite "
            "(after code checks numbers and source ids).", "strong (reasoning medium)", optimizer.VERIFY_PROMPT),

    "## 4. Question prep (`app/services/prep_service.py`)\n\n",
    section("PREP_PROMPT", "services/prep_service.py", "Study sets by topic: questions with model "
            "answers, key points and a tip.", "fast (temperature 0.5)", PREP_PROMPT,
            "`{mix}` depends on the level (below). The human message carries the topic, 2-3 curated "
            "question-bank sections (RAG) and the already-asked questions. Reworded repeats are "
            "also dropped in code (`is_repeat()`)."),
    "**Level mix (`{mix}`)**\n\n" + "".join(f"- `{k}`: {v}\n" for k, v in LEVEL_MIX.items()) + "\n",
    section("RESUME_PREP_PROMPT", "services/prep_service.py", "Questions an interviewer is likely to "
            "ask about the user's own resume, with first-person answers.", "fast (temperature 0.5)",
            RESUME_PREP_PROMPT,
            "The human message carries the resume as numbered sources (`exp0.b1 …`), the optional "
            "focus and the already-asked questions."),

    ("## 5. Speech-to-text hint (not an LLM prompt)\n\n"
    "Whisper (`app/services/stt.py`) gets a short vocabulary hint so technical terms are spelled "
    "right: the interview's topic and sub-topics joined with commas (max 400 characters), e.g. "
    "`Bias-Variance, Overfitting, Validation curves`.\n"),
]

OUT.parent.mkdir(exist_ok=True)
OUT.write_text("".join(parts), encoding="utf-8")
print(f"Wrote {OUT} ({OUT.stat().st_size // 1024} KB)")
