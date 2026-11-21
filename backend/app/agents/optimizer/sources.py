"""Fact-checking helpers on top of the numbered resume "sources".

The sources themselves (one fact per id, e.g. "exp0.b1") are built in
`app.agents.profile.sources` and shared with the interviewer. For the optimizer they are
the ONLY facts the rewriter may use: every rewritten bullet cites ids, so each claim can be
traced back and checked.
"""

import re

from app.agents.profile.sources import build_sources, format_sources

__all__ = ["build_sources", "expand_ids", "format_sources", "numbers_in", "unsupported_numbers"]

NUMBER_RE = re.compile(r"\d+(?:[.,]\d+)?")


def numbers_in(text: str) -> set[str]:
    """'Cut time by 65% for 5M users in 2.5s' -> {'65', '5', '2.5'}"""
    return {n.replace(",", "") for n in NUMBER_RE.findall(text)}


def unsupported_numbers(text: str, source_ids: list[str], sources: dict[str, str]) -> set[str]:
    """Numbers in a rewritten line that appear in none of its cited sources.
    An invented metric is the most common way a rewrite fabricates, and this catches it
    without an LLM."""
    cited = " ".join(sources.get(sid, "") for sid in source_ids)
    return numbers_in(text) - numbers_in(cited)


def expand_ids(source_ids: list[str], sources: dict[str, str]) -> list[str]:
    """Add each cited bullet's parent entry context.

    A bullet under a job/project may rely on that entry's heading line ("proj0":
    name + description) and tech list ("proj0.tech"). Without this, a TRUE claim
    whose citation only named the bullet ("proj0.b0") looked unsupported to the
    verifier and got reverted (seen in testing). Facts from *other* entries are
    still not allowed.
    """
    expanded = list(source_ids)
    for sid in source_ids:
        parent = sid.split(".")[0]  # "proj0.b0" -> "proj0"
        for extra in (parent, f"{parent}.tech"):
            if extra in sources and extra not in expanded:
                expanded.append(extra)
    return expanded
