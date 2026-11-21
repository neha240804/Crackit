"""Voice load test: how many simultaneous interviews can one server voice?

The interviewer's voice (Kokoro) is generated on the server CPU, one chunk at a time for
everyone (tts._lock), so it is the capacity limit. This simulates N interviews running at
once with the real tts module: each turn the interviewer says a realistic line (generated
chunk by chunk, as presynthesize() does), then the candidate answers for 20-35 s.

Measured per turn: the START DELAY, i.e. how long the interviewer must stay silent before the
whole line can play without a gap (playback starting at S needs chunk i ready by S + the
audio before it). That comes on top of the LLM's ~1-2 s. The browser waits at most 3 s
before speaking anyway, so delays above 3 s mean audible gaps between sentences.

Run inside the backend image (it has the model in /srv/data):
    docker cp backend/scripts/load_test_voice.py <container>:/tmp/
    docker exec <container> python /tmp/load_test_voice.py --interviews 1 4 8
Options: --turns 3 (per interview), --parallel 2 (let 2 generations run at once instead of
the app's 1, to test whether that would raise throughput).
"""

import argparse
import asyncio
import io
import json
import os
import random
import statistics
import sys
import threading
import time
import wave

sys.path.insert(0, os.environ.get("BACKEND_DIR", "/srv/backend"))

from app.services import tts

# Real interviewer turns from scripted interviews (35-45 words: the prompt's turn limit).
LINES = [
    ("Nice to meet you, Rahul. Your internship sounds interesting. During the oil testing you did, "
    "what key parameters did you check to judge the health of the winding insulation?"),
    ("Not quite, but you're on the right track. Think about what the oil actually does in a "
    "transformer. What property of the oil tells you whether it can still carry heat away?"),
    ("Right, and you measured before changing anything, which is the key habit. What did caching "
    "cost you in memory, and how did you check the results stayed correct afterwards?"),
    ("No worries, that one's worth revising later. Let's try something different. When would you "
    "choose a variable frequency drive over a star delta starter for a pump motor?"),
    ("Good point about the reactive power flow. So when you looked at the far buses, how did you "
    "decide where a capacitor bank would help most, and what would you watch out for?"),
    ("I see where you're heading, but let's focus on the core at no load. So when the transformer "
    "is idle, what happens to the flux in the core and to the losses?"),
    ("That's a clear answer, and the trade-off you named is exactly right. If the load on that "
    "feeder doubled next year, what would you change first in the protection settings?"),
    ("Let's switch gears to databases. Your library project used Postgres, so tell me how you "
    "decided which columns to index, and what you would do if inserts became slow."),
    ("Nice, you caught the inrush current part. Why does a differential relay see that current as "
    "a fault, and how do modern relays stop it from tripping on energisation?"),
    ("Thanks for walking me through that. Looking back at the project, what is one decision you "
    "would make differently today, and what did that teach you about working in a team?"),
]
NAMES = ["Rahul", "Asha", "Meera", "Karan", "Priya", "Dev", "Anil", "Sana", "Ravi", "Neel"]


def wav_seconds(data: bytes) -> float:
    with wave.open(io.BytesIO(data)) as w:
        return w.getnframes() / w.getframerate()


async def interview(i: int, turns: int, delay_start: float, out: list[dict]) -> None:
    await asyncio.sleep(delay_start)
    rng = random.Random(i)
    for turn in range(turns):
        line = LINES[(i * 3 + turn) % len(LINES)]
        line = line.replace("Rahul", NAMES[i % len(NAMES)])  # vary the text a little
        chunks = tts.speech_chunks(line)
        tts.allow(chunks)
        t0 = time.perf_counter()
        start_needed, audio_before = 0.0, 0.0
        for chunk in chunks:
            wav = await tts.synthesize(chunk, ["maya", "arjun", "sara"][i % 3])
            ready = time.perf_counter() - t0
            start_needed = max(start_needed, ready - audio_before)
            audio_before += wav_seconds(wav)
        out.append({"interview": i, "turn": turn, "start_delay": start_needed,
                    "audio": audio_before, "generated_in": time.perf_counter() - t0})
        # The interviewer speaks (from the start delay), then the candidate answers.
        speaking_left = max(0.0, start_needed + audio_before - (time.perf_counter() - t0))
        await asyncio.sleep(speaking_left + rng.uniform(20, 35))


def pct(xs: list[float], q: float) -> float:
    xs = sorted(xs)
    return xs[min(len(xs) - 1, round(q * (len(xs) - 1)))]


async def level(n: int, turns: int) -> dict:
    out: list[dict] = []
    t0 = time.perf_counter()
    # Interviews start spread over the first 20 s (people don't start in the same second).
    await asyncio.gather(*(interview(i, turns, random.Random(100 + i).uniform(0, 20), out)
                           for i in range(n)))
    delays = [r["start_delay"] for r in out]
    audio = sum(r["audio"] for r in out)
    return {
        "interviews": n, "turns": len(out), "minutes": round((time.perf_counter() - t0) / 60, 1),
        "median_delay": round(statistics.median(delays), 2), "p95_delay": round(pct(delays, 0.95), 2),
        "max_delay": round(max(delays), 2),
        "over_3s": round(100 * sum(d > 3 for d in delays) / len(delays)),
        "over_6s": round(100 * sum(d > 6 for d in delays) / len(delays)),
        "gen_per_audio": tts.gen_per_audio(), "audio_seconds": round(audio),
    }


async def main(args) -> None:
    tts.load_model()
    if tts._model is None:
        sys.exit(f"Voice model not loaded: {tts._load_error}")
    tts._CACHE_SIZE = 0  # every line must really be generated (no cache hits)
    if args.parallel > 1:
        tts._lock = threading.Semaphore(args.parallel)
    print(f"cpus={os.cpu_count()} parallel={args.parallel} turns={args.turns}", flush=True)
    results = []
    for n in args.interviews:
        r = await level(n, args.turns)
        results.append(r)
        print(json.dumps(r), flush=True)
    print("RESULTS " + json.dumps({"cpus": os.cpu_count(), "parallel": args.parallel,
                                    "levels": results}), flush=True)


if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--interviews", type=int, nargs="+", default=[1, 2, 4, 6, 8])
    p.add_argument("--turns", type=int, default=3)
    p.add_argument("--parallel", type=int, default=1)
    asyncio.run(main(p.parse_args()))
