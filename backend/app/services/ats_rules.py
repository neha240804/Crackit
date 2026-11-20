"""Deterministic ATS checks: plain code, no LLM.

Why code instead of asking an LLM "score this resume"? An LLM score changes between
runs and can't explain itself precisely. Rules give the same answer every time, each
point lost has a concrete reason, and they're unit-testable.

The rules reflect common ATS/recruiter guidance: parseable contact info, standard
section headings, quantified achievements, action-verb bullets, sensible length.
"""

import re

from app.schemas.optimizer import AtsReport, AtsRuleResult
from app.schemas.profile import CandidateProfile

ACTION_VERBS = {
    "achieved", "analyzed", "analysed", "architected", "automated", "boosted", "built",
    "collaborated", "configured", "created", "cut", "decreased", "delivered", "deployed",
    "designed", "developed", "drove", "engineered", "enhanced", "established", "evaluated",
    "executed", "expanded", "fine-tuned", "generated", "grew", "implemented", "improved",
    "increased", "integrated", "introduced", "launched", "led", "maintained", "managed",
    "mentored", "migrated", "modernized", "monitored", "optimized", "optimised", "orchestrated",
    "owned", "partnered", "performed", "pioneered", "planned", "presented", "produced",
    "prototyped", "published", "reduced", "refactored", "resolved", "revamped", "scaled",
    "secured", "shipped", "simplified", "spearheaded", "streamlined", "tested", "trained",
    "transformed", "upgraded", "wrote", "researched", "coordinated", "conducted", "leveraged",
    "utilized", "applied", "authored", "curated", "devised", "facilitated", "formulated",
    "identified", "initiated", "modeled", "modelled", "programmed", "validated", "visualized",
}
PRONOUN_RE = re.compile(r"\b(i|me|my|mine|we|our)\b", re.IGNORECASE)
NUMBER_RE = re.compile(r"\d")
HEADINGS = {
    "experience": re.compile(r"^\s*(work\s+)?(experience|employment|work history|internships?)\b", re.IGNORECASE | re.MULTILINE),
    # Indian resumes often put education in a table headed "Examination | University/Board |
    # Institute | Year | CPI/%" (or "Qualification...") with no "Education" title above it:
    # such a resume once scored 0 here although every degree was parsed.
    "education": re.compile(r"^\s*(education|academic|qualifications?\b|examination\b|scholastic)", re.IGNORECASE | re.MULTILINE),
    "skills": re.compile(r"^\s*(technical\s+)?skills\b", re.IGNORECASE | re.MULTILINE),
}


def all_bullets(profile: CandidateProfile) -> list[str]:
    return [h for item in [*profile.experience, *profile.projects] for h in item.highlights]


def _share(items: list[str], predicate) -> float:
    return sum(1 for i in items if predicate(i)) / len(items) if items else 0.0


def audit_resume(profile: CandidateProfile, raw_text: str) -> AtsReport:
    bullets = all_bullets(profile)
    words = len(raw_text.split())
    rules: list[AtsRuleResult] = []

    def rule(id_: str, label: str, passed: bool, weight: int, detail: str) -> None:
        rules.append(AtsRuleResult(id=id_, label=label, passed=passed, weight=weight, detail=detail))

    c = profile.contact
    rule("email", "Email address", bool(c.email), 10,
         "Found." if c.email else "No email found. Recruiters and ATS need it to contact you.")
    rule("phone", "Phone number", bool(c.phone), 5,
         "Found." if c.phone else "No phone number found.")

    found = [name for name, rx in HEADINGS.items() if rx.search(raw_text)]
    has_work = "experience" in found or bool(profile.projects)
    missing = [n for n in ("education", "skills") if n not in found]
    if not has_work:
        missing.insert(0, "experience/projects")
    # Say WHY a heading counts as missing: when the content itself was read (e.g. degrees in an
    # untitled table), "missing education" reads as "your education is lost", which is wrong.
    read_anyway = [n for n, has in (("education", bool(profile.education)), ("skills", bool(profile.skills)))
                   if n in missing and has]
    detail = ("Experience/Projects, Education and Skills headings found." if not missing
              else f"Missing or unrecognised headings: {', '.join(missing)}. Use standard names "
                   "so the ATS can sort your content.")
    if read_anyway:
        detail += (f" Your {' and '.join(read_anyway)} details were read, but some ATS software "
                   f"files content by heading: add a clear title such as \"{read_anyway[0].upper()}\" above it.")
    rule("sections", "Standard section headings", not missing, 15, detail)

    rule("length", "Resume length", 250 <= words <= 1000, 10,
         f"{words} words." + ("" if 250 <= words <= 1000 else
                              " Aim for 250-1000 words (about 1-2 pages)."))

    if not bullets:
        for id_, label, weight in [("metrics", "Quantified achievements", 15),
                                   ("verbs", "Action-verb bullets", 10),
                                   ("bullet_length", "Bullet length", 10)]:
            rule(id_, label, False, weight, "No bullet points found under experience or projects.")
    else:
        quantified = _share(bullets, lambda b: bool(NUMBER_RE.search(b)))
        rule("metrics", "Quantified achievements", quantified >= 0.4, 15,
             f"{quantified:.0%} of bullets include a number. Aim for at least 40% "
             "(%, time saved, users, scale).")
        verbs = _share(bullets, lambda b: b.split()[0].lower().strip("-•*,.") in ACTION_VERBS)
        rule("verbs", "Action-verb bullets", verbs >= 0.6, 10,
             f"{verbs:.0%} of bullets start with a strong action verb (Built, Led, Reduced...). "
             "Aim for at least 60%.")
        good_len = _share(bullets, lambda b: 8 <= len(b.split()) <= 35)
        rule("bullet_length", "Bullet length", good_len >= 0.8, 10,
             f"{good_len:.0%} of bullets are 8-35 words. Very short bullets lack impact; very "
             "long ones get skimmed.")

    pronoun_bullets = [b for b in bullets if PRONOUN_RE.search(b)]
    rule("pronouns", "No first-person pronouns", not pronoun_bullets, 5,
         "None found." if not pronoun_bullets else
         f"{len(pronoun_bullets)} bullet(s) use I/me/my/we. Start with the verb instead.")

    undated = [e.company for e in profile.experience if not e.start_date]
    rule("dates", "Dates on every role", not undated, 10,
         "All roles have dates." if not undated else f"Missing dates for: {', '.join(undated)}.")

    rule("skills_count", "Skills listed", len(profile.skills) >= 6, 10,
         f"{len(profile.skills)} skills listed." + ("" if len(profile.skills) >= 6 else
                                                    " List at least 6 relevant skills."))

    total = sum(r.weight for r in rules)
    score = 100 * sum(r.weight for r in rules if r.passed) / total
    return AtsReport(score=round(score, 1), rules=rules)
