"""How much of a free Groq account does one interview use? (tokens per model, requests, audio)

Runs a full interview through the real code, in-process (the same steps the LangGraph graph
runs: prepare -> plan -> opening -> interviewer after every answer -> build_report), on your
own key, and reads the `usage` block Groq returns on every chat completion. The candidate's
answers come from a small simulator whose own calls are NOT counted (a real student speaks).

Speech-to-text is limited in audio SECONDS, not tokens: estimated from each answer's length
at ~140 words a minute (Groq bills at least 10 s per request).

From backend/:   PYTHONPATH=. uv run python scripts/measure_interview_quota.py --turns 16
Needs a Groq key (CRACKIT_EVAL_GROQ_KEY, or GROQ_API_KEY in .env) and Qdrant running.
"""

import argparse
import asyncio
import json
import time
from contextvars import ContextVar

from app.agents.interview.graph import (
    build_report,
    interviewer_node,
    opening_node,
    plan_node,
    prepare_node,
)
from app.core.http import groq_http_client
from evals.behaviour import simulate
from evals.common import use_groq_key

counting: ContextVar[bool] = ContextVar("counting", default=True)
step: ContextVar[str] = ContextVar("step", default="?")
calls: list[dict] = []
WORDS_PER_SECOND = 140 / 60
WHISPER_MIN_SECONDS = 10

STYLES = ["strong", "strong", "partial", "strong", "weak", "weak", "strong", "partial"]
INTRO = ("Hi, I'm Asha, a final-year electrical engineering student. My project was a load flow study of "
         "our campus distribution network in Python, and I interned at a 132 kV substation last summer.")


async def on_response(response) -> None:
    if not counting.get() or "chat/completions" not in str(response.request.url):
        return
    await response.aread()
    entry = {"step": step.get(), "status": response.status_code}
    try:
        body = response.json()
        usage = body.get("usage", {})
        cached = (usage.get("prompt_tokens_details") or {}).get("cached_tokens", 0) or 0
        entry.update(model=body.get("model", "?"), prompt=usage.get("prompt_tokens", 0),
                     completion=usage.get("completion_tokens", 0), total=usage.get("total_tokens", 0),
                     cached=cached, raw_usage=usage if len(calls) < 2 else None)
    except ValueError:
        entry.update(model="?", prompt=0, completion=0, total=0, cached=0)
    calls.append(entry)


async def main(turns: int, pace: float) -> None:
    use_groq_key()
    groq_http_client().event_hooks["response"].append(on_response)
    cfg = {"interview_type": "topic", "topic": "Power systems", "subtopics": [], "experience": "intermediate",
           "duration_minutes": 15, "interviewer": "maya"}
    state: dict = {"config": cfg, "context": ""}
    state.update(prepare_node(state))
    step.set("plan")
    state.update(await plan_node(state))
    state.update(opening_node(state))
    answer_seconds = []
    t0 = time.time()
    for i in range(turns):
        question = state["messages"][-1]["text"]
        if i == 0:
            text = INTRO
        else:
            token = counting.set(False)  # the simulated candidate doesn't count
            try:
                text = await simulate({"id": "quota", "type": "topic", "topic": "Power systems", "level": "intermediate"},
                                      STYLES[i % len(STYLES)], question)
            finally:
                counting.reset(token)
        seconds = max(3.0, len(text.split()) / WORDS_PER_SECOND)
        answer_seconds.append(seconds)
        state["messages"] = [*state["messages"], {"role": "candidate", "text": text, "kind": "answer",
                                                  "duration_sec": round(seconds, 1)}]
        step.set("interviewer")
        state.update(await interviewer_node(state))
        last = calls[-1] if calls else {}
        print(f"  turn {i + 1:>2}/{turns}: {last.get('model', '?'):<22} {last.get('total', 0):>5} tokens, "
              f"{last.get('cached', 0):>5} cached", flush=True)
        await asyncio.sleep(pace)  # stay under 8,000 tokens a minute, like real speaking time does
    step.set("report")
    report = await build_report(state)
    print(f"  report: overall {report['overall_score']}, {calls[-1].get('model')} {calls[-1].get('total')} tokens", flush=True)

    by_model: dict[str, dict] = {}
    for c in calls:
        m = by_model.setdefault(c["model"], {"requests": 0, "tokens": 0, "prompt": 0, "completion": 0,
                                             "cached": 0, "counted": 0})
        m["requests"] += 1
        m["cached"] += c.get("cached", 0)
        # Groq: "Cached tokens do not count towards your rate limits."
        m["counted"] += c["total"] - c.get("cached", 0)
        m["tokens"] += c["total"]
        m["prompt"] += c["prompt"]
        m["completion"] += c["completion"]
    by_step: dict[str, int] = {}
    for c in calls:
        by_step[c["step"]] = by_step.get(c["step"], 0) + c["total"]
    billed_audio = sum(max(WHISPER_MIN_SECONDS, s) for s in answer_seconds)
    result = {"turns": turns, "minutes_of_answers": round(sum(answer_seconds) / 60, 1),
              "by_model": by_model, "by_step": by_step,
              "interviewer_tokens_per_turn": round(by_step.get("interviewer", 0) / turns),
              "rate_limited_retries": sum(c["status"] == 429 for c in calls),
              "sample_usage": [c["raw_usage"] for c in calls if c.get("raw_usage")],
              "whisper_requests": turns, "whisper_billed_seconds": round(billed_audio),
              "wall_minutes": round((time.time() - t0) / 60, 1)}
    print("RESULT " + json.dumps(result))


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--turns", type=int, default=16, help="interviewer turns (~16 fit in 15 minutes)")
    p.add_argument("--pace", type=float, default=10.0)
    args = p.parse_args()
    asyncio.run(main(args.turns, args.pace))
