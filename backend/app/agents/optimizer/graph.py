"""Resume Optimizer graph.

    START -> analyze_jd (if JD) -> ats_audit -> gap_analysis (if JD)
          --mode=analyze--> END
          --mode=optimize--> rewrite -> verify --issues & attempts left--> rewrite (loop)
                                              --clean or out of retries--> finalize -> END

LLM nodes: analyze_jd, gap_analysis, rewrite, verify (judge).
Code nodes: ats_audit, the code half of verify, finalize. Code enforces the hard rules
(exact numbers, real source ids, unchanged titles/dates, no new skills); the LLM judge
catches softer exaggerations ("helped" -> "led").
"""

from typing import Literal, TypedDict

from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import END, START, StateGraph

from app.agents.common.llm import get_structured_llm
from app.agents.optimizer.prompts import GAP_PROMPT, JD_PROMPT, REWRITE_PROMPT, VERIFY_PROMPT
from app.agents.optimizer.sources import (
    build_sources,
    expand_ids,
    format_sources,
    unsupported_numbers,
)
from app.schemas.optimizer import (
    GapAnalysis,
    JDAnalysis,
    KeywordMatch,
    OptimizedEntry,
    OptimizedResume,
    VerificationIssue,
    VerificationReport,
)
from app.schemas.profile import CandidateProfile
from app.services.ats_rules import audit_resume
from app.services.keyword_match import match_keywords, normalize

MAX_ATTEMPTS = 3  # first rewrite + up to 2 corrections


class OptimizerState(TypedDict, total=False):
    # inputs
    mode: Literal["analyze", "optimize"]
    profile: dict
    raw_text: str
    jd_text: str | None
    # analysis
    jd: dict | None
    ats: dict
    match: dict | None
    gaps: dict | None
    sources: dict[str, str]
    # rewrite loop
    draft: dict
    issues: list[dict]
    attempts: int
    issue_history: list[dict]  # [{"attempt": 1, "issues": [...]}, ...]
    # output
    final: dict
    verification: dict


def _profile(state: OptimizerState) -> CandidateProfile:
    return CandidateProfile.model_validate(state["profile"])


# ------------------------------------------------------------------ analysis nodes
async def analyze_jd_node(state: OptimizerState) -> dict:
    llm = get_structured_llm(JDAnalysis, tier="strong", temperature=0)  # extraction: be repeatable
    jd: JDAnalysis = await llm.ainvoke(
        [SystemMessage(JD_PROMPT), HumanMessage(f"JOB DESCRIPTION:\n\n{state['jd_text']}")]
    )
    return {"jd": jd.model_dump()}


def ats_audit_node(state: OptimizerState) -> dict:
    profile = _profile(state)
    update: dict = {
        "ats": audit_resume(profile, state["raw_text"]).model_dump(),
        "sources": build_sources(profile),
        "match": None,
    }
    if state.get("jd"):
        jd = JDAnalysis.model_validate(state["jd"])
        update["match"] = match_keywords(jd, profile, state["raw_text"]).model_dump()
    return update


async def gap_analysis_node(state: OptimizerState) -> dict:
    jd = JDAnalysis.model_validate(state["jd"])
    match = KeywordMatch.model_validate(state["match"])
    unfound = match.missing_must + match.missing_nice
    prompt = (
        f"SOURCES:\n{format_sources(state['sources'])}\n\n"
        f"JOB: {jd.title or 'Unknown title'} ({jd.seniority})\n"
        f"Must-have: {', '.join(jd.must_have_skills) or 'none listed'}\n"
        f"Nice-to-have: {', '.join(jd.nice_to_have_skills) or 'none listed'}\n"
        f"Responsibilities: {'; '.join(jd.responsibilities)}\n\n"
        f"SKILLS NOT FOUND BY KEYWORD SCAN: {', '.join(unfound) or 'none'}"
    )
    llm = get_structured_llm(GapAnalysis, tier="strong")
    gaps: GapAnalysis = await llm.ainvoke([SystemMessage(GAP_PROMPT), HumanMessage(prompt)])
    # Keep only gaps for skills we actually asked about, and evidence ids that exist.
    asked = {normalize(s) for s in unfound}
    gaps.gaps = [g for g in gaps.gaps if normalize(g.skill) in asked]
    for g in gaps.gaps:
        g.evidence_source_ids = [s for s in g.evidence_source_ids if s in state["sources"]]
        if g.status == "implied" and not g.evidence_source_ids:
            g.status = "missing"  # "implied" without valid evidence is not implied
    return {"gaps": gaps.model_dump()}


# ------------------------------------------------------------------ rewrite loop
def _implied_skills(state: OptimizerState) -> list[str]:
    gaps = (state.get("gaps") or {}).get("gaps", [])
    return [g["skill"] for g in gaps if g["status"] == "implied"]


async def rewrite_node(state: OptimizerState) -> dict:
    jd = JDAnalysis.model_validate(state["jd"]) if state.get("jd") else None
    parts = [f"SOURCES:\n{format_sources(state['sources'])}"]
    if jd:
        parts.append(
            f"TARGET JOB: {jd.title or 'Unknown'}\nMust-have: {', '.join(jd.must_have_skills)}\n"
            f"Nice-to-have: {', '.join(jd.nice_to_have_skills)}\n"
            f"Keywords: {', '.join(jd.keywords)}\nResponsibilities: {'; '.join(jd.responsibilities)}"
        )
    else:
        parts.append("TARGET JOB: none given. Improve clarity, impact and ATS-friendliness.")
    implied = _implied_skills(state)
    parts.append(f"IMPLIED SKILLS (may be named, cite evidence): {', '.join(implied) or 'none'}")

    if state.get("issues"):  # feedback from the verifier on the previous attempt
        feedback = "\n".join(f"- {i['location']}: {i['problem']}" for i in state["issues"])
        parts.append(
            "YOUR PREVIOUS DRAFT HAD THESE UNSUPPORTED CLAIMS. Fix every one by removing or "
            f"correcting the claim; keep the rest:\n{feedback}"
        )

    llm = get_structured_llm(OptimizedResume, tier="strong", temperature=0.3)
    draft: OptimizedResume = await llm.ainvoke(
        [SystemMessage(REWRITE_PROMPT), HumanMessage("\n\n".join(parts))]
    )
    return {"draft": draft.model_dump(), "attempts": state.get("attempts", 0) + 1}


def _items(draft: OptimizedResume) -> list[tuple[str, str, list[str]]]:
    """Every checkable line as (location, text, cited ids)."""
    items = [("summary", draft.summary, draft.summary_source_ids)]
    for entry in [*draft.experience, *draft.projects]:
        for k, b in enumerate(entry.bullets):
            items.append((f"{entry.source_id}.bullet{k}", b.text, b.source_ids))
    return items


def code_checks(draft: OptimizedResume, sources: dict[str, str]) -> list[VerificationIssue]:
    """Hard rules, checked exactly: cited ids exist, and no number appears that isn't in
    the cited sources."""
    issues = []
    for location, text, ids in _items(draft):
        bad_ids = [i for i in ids if i not in sources]
        if not ids or bad_ids:
            problem = "cites no sources" if not ids else f"cites unknown ids {bad_ids}"
            issues.append(VerificationIssue(location=location, text=text, problem=problem))
            continue
        invented = unsupported_numbers(text, expand_ids(ids, sources), sources)
        if invented:
            issues.append(VerificationIssue(
                location=location, text=text,
                problem=f"numbers {sorted(invented)} do not appear in the cited sources",
            ))
    return issues


async def verify_node(state: OptimizerState) -> dict:
    draft = OptimizedResume.model_validate(state["draft"])
    sources = state["sources"]
    issues = code_checks(draft, sources)
    flagged = {i.location for i in issues}

    # LLM judge for the lines code can't judge (meaning, scope, exaggeration).
    lines = [
        f"[{loc}] REWRITTEN: {text}\n    SOURCES: "
        + " | ".join(f"({i}) {sources[i]}" for i in expand_ids(ids, sources))
        for loc, text, ids in _items(draft)
        if loc not in flagged
    ]
    if lines:
        judge = get_structured_llm(VerificationReport, tier="strong", reasoning_effort="medium")
        report: VerificationReport = await judge.ainvoke(
            [SystemMessage(VERIFY_PROMPT), HumanMessage("\n\n".join(lines))]
        )
        valid = {loc for loc, _, _ in _items(draft)}
        issues += [i for i in report.issues if i.location in valid and i.location not in flagged]

    found = [i.model_dump() for i in issues]
    # Keep what was caught on every attempt (not just the count): it shows the user and us
    # exactly which claims the rewriter tried to make and the verifier rejected.
    history = [*state.get("issue_history", []), {"attempt": state["attempts"], "issues": found}]
    return {"issues": found, "issue_history": history}


def route_after_verify(state: OptimizerState) -> str:
    if state["issues"] and state["attempts"] < MAX_ATTEMPTS:
        return "rewrite"
    return "finalize"


# ------------------------------------------------------------------ finalize (pure code)
def finalize_node(state: OptimizerState) -> dict:
    """Last line of defence. Whatever the LLM wrote:
    - titles, companies and dates are copied back from the original resume,
    - entries that don't map to a real job/project are dropped,
    - skills not in the profile (or implied with evidence) are removed,
    - any line still flagged is replaced by the original text it cites.
    """
    profile = _profile(state)
    sources = state["sources"]
    draft = OptimizedResume.model_validate(state["draft"])
    flagged = {i["location"] for i in state.get("issues", [])}
    reverted: list[dict] = []

    def original_text(ids: list[str]) -> str | None:
        for i in ids:
            if ".b" in i and i in sources:  # prefer an original bullet
                return sources[i]
        return None

    def fix_entries(entries: list[OptimizedEntry], kind: str) -> list[OptimizedEntry]:
        originals = profile.experience if kind == "exp" else profile.projects
        fixed = []
        for entry in entries:
            if not entry.source_id.startswith(kind) or not entry.source_id[len(kind):].isdigit():
                continue
            idx = int(entry.source_id[len(kind):])
            if idx >= len(originals):
                continue
            orig = originals[idx]
            if kind == "exp":
                entry.heading = orig.title
                dates = " - ".join(d for d in [orig.start_date, orig.end_date] if d)
                entry.subheading = " | ".join(x for x in [orig.company, orig.location, dates] if x)
            else:
                entry.heading = orig.name
                entry.subheading = ", ".join(orig.technologies) or None
            bullets = []
            for k, b in enumerate(entry.bullets):
                loc = f"{entry.source_id}.bullet{k}"
                if loc in flagged:
                    original = original_text(b.source_ids)
                    reverted.append({"location": loc, "rewritten": b.text, "replaced_with": original})
                    if original is None:
                        continue  # nothing safe to fall back to: drop the line
                    b.text = original
                bullets.append(b)
            entry.bullets = bullets
            fixed.append(entry)
        # Make sure no real job silently disappeared from the resume.
        present = {e.source_id for e in fixed}
        for idx, orig in enumerate(originals):
            sid = f"{kind}{idx}"
            if sid not in present and kind == "exp":
                fixed.append(OptimizedEntry(
                    source_id=sid, heading=orig.title, subheading=orig.company,
                    bullets=[{"text": h, "source_ids": [f"{sid}.b{j}"]}
                             for j, h in enumerate(orig.highlights)],
                ))
        return fixed

    draft.experience = fix_entries(draft.experience, "exp")
    draft.projects = fix_entries(draft.projects, "proj")

    allowed = {normalize(s) for s in profile.skills} | {normalize(s) for s in _implied_skills(state)}
    removed_skills = [s for s in draft.skills if normalize(s) not in allowed]
    draft.skills = [s for s in dict.fromkeys(draft.skills) if normalize(s) in allowed]

    if "summary" in flagged:
        reverted.append({"location": "summary", "rewritten": draft.summary,
                         "replaced_with": profile.summary})
        draft.summary = profile.summary or ""
        draft.summary_source_ids = ["summary"] if profile.summary else []

    verification = {
        "attempts": state["attempts"],
        "issues_per_attempt": [len(h["issues"]) for h in state.get("issue_history", [])],
        "history": state.get("issue_history", []),
        "remaining_issues": state.get("issues", []),
        "reverted": reverted,
        "removed_skills": removed_skills,
        "verified": not state.get("issues"),
    }
    return {"final": draft.model_dump(), "verification": verification}


# ------------------------------------------------------------------ routing + graph
def route_start(state: OptimizerState) -> str:
    return "analyze_jd" if state.get("jd_text") else "ats_audit"


def route_after_audit(state: OptimizerState) -> str:
    if state.get("jd"):
        return "gap_analysis"
    return END if state["mode"] == "analyze" else "rewrite"


def route_after_gaps(state: OptimizerState) -> str:
    return END if state["mode"] == "analyze" else "rewrite"


def build_optimizer_graph():
    g = StateGraph(OptimizerState)
    g.add_node("analyze_jd", analyze_jd_node)
    g.add_node("ats_audit", ats_audit_node)
    g.add_node("gap_analysis", gap_analysis_node)
    g.add_node("rewrite", rewrite_node)
    g.add_node("verify", verify_node)
    g.add_node("finalize", finalize_node)

    g.add_conditional_edges(START, route_start, ["analyze_jd", "ats_audit"])
    g.add_edge("analyze_jd", "ats_audit")
    g.add_conditional_edges("ats_audit", route_after_audit, ["gap_analysis", "rewrite", END])
    g.add_conditional_edges("gap_analysis", route_after_gaps, ["rewrite", END])
    g.add_edge("rewrite", "verify")
    g.add_conditional_edges("verify", route_after_verify, ["rewrite", "finalize"])
    g.add_edge("finalize", END)
    return g.compile()


optimizer_graph = build_optimizer_graph()
