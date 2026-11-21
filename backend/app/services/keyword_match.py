"""Deterministic keyword matching between a job description and a resume.

An ATS mostly does literal matching: if the JD says "PostgreSQL" and your resume says
"Postgres", a naive ATS may miss it. We normalise common aliases, then check each JD
term against (1) the parsed skills and (2) the full resume text.
"""

import re

from app.schemas.optimizer import JDAnalysis, KeywordMatch
from app.schemas.profile import CandidateProfile

# Variants -> one canonical form (all lowercase).
ALIASES = {
    "postgres": "postgresql", "psql": "postgresql",
    "js": "javascript", "es6": "javascript",
    "ts": "typescript",
    "reactjs": "react", "react.js": "react",
    "nodejs": "node.js", "node": "node.js",
    "expressjs": "express.js", "express": "express.js",
    "nextjs": "next.js",
    "k8s": "kubernetes",
    "golang": "go",
    "py": "python", "python3": "python",
    "ml": "machine learning", "dl": "deep learning",
    "genai": "generative ai", "gen ai": "generative ai",
    "llm": "llms", "large language models": "llms",
    "rest": "rest apis", "rest api": "rest apis", "restful apis": "rest apis",
    "restful": "rest apis",
    "amazon web services": "aws", "google cloud": "gcp", "google cloud platform": "gcp",
    "ci/cd": "ci/cd", "cicd": "ci/cd", "ci cd": "ci/cd",
    "sklearn": "scikit-learn", "scikit learn": "scikit-learn",
    "tensorflow/keras": "tensorflow",
    "mongo": "mongodb",
    "github actions": "github actions",
}


def normalize(term: str) -> str:
    t = term.lower().strip()
    t = re.sub(r"\s+", " ", t)
    t = t.strip(" .,;:()")
    return ALIASES.get(t, t)


def _in_text(term: str, text: str) -> bool:
    """Whole-word/phrase match, so 'go' doesn't match 'google' and 'c' doesn't match 'react'."""
    pattern = r"(?<![a-z0-9+#])" + re.escape(term) + r"(?![a-z0-9+#])"
    return re.search(pattern, text) is not None


def _split(terms: list[str], skills: set[str], text: str) -> tuple[list[str], list[str]]:
    matched, missing = [], []
    for term in dict.fromkeys(terms):  # dedupe, keep order
        n = normalize(term)
        found = n in skills or _in_text(n, text) or _in_text(term.lower().strip(), text)
        (matched if found else missing).append(term)
    return matched, missing


def _coverage(matched: list[str], missing: list[str]) -> float:
    total = len(matched) + len(missing)
    return len(matched) / total if total else 1.0


def match_keywords(jd: JDAnalysis, profile: CandidateProfile, raw_text: str) -> KeywordMatch:
    skills = {normalize(s) for s in profile.skills}
    # Normalise the resume text too, so "Postgres" in a bullet counts for "PostgreSQL".
    text = raw_text.lower()
    text_normalized = " ".join(normalize(w) for w in re.split(r"\s+", text))
    haystack = text + "\n" + text_normalized

    matched_must, missing_must = _split(jd.must_have_skills, skills, haystack)
    matched_nice, missing_nice = _split(jd.nice_to_have_skills, skills, haystack)
    matched_kw, missing_kw = _split(jd.keywords, skills, haystack)

    score = 100 * (
        0.65 * _coverage(matched_must, missing_must)
        + 0.20 * _coverage(matched_nice, missing_nice)
        + 0.15 * _coverage(matched_kw, missing_kw)
    )
    return KeywordMatch(
        score=round(score, 1),
        matched_must=matched_must, missing_must=missing_must,
        matched_nice=matched_nice, missing_nice=missing_nice,
        matched_keywords=matched_kw, missing_keywords=missing_kw,
    )


def overall_score(ats_score: float, match: KeywordMatch | None) -> float:
    """With a JD, relevance matters most; without one, only format can be judged."""
    if match is None:
        return ats_score
    return round(0.35 * ats_score + 0.65 * match.score, 1)
