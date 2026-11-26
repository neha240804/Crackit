# Crackit

**Practice out loud, crack the real one.**

Crackit is an AI interview-practice platform. A voice interviewer asks you questions, listens
to your spoken answers, follows up like a real panel, and ends with a scored feedback report.
It also writes study sets of likely interview questions with model answers, and checks your
resume against a job description.

**Live:** [lets-crackit.duckdns.org](https://lets-crackit.duckdns.org) (free; bring your own
free [Groq](https://console.groq.com) API key, about 2 minutes to set up)

[![CI](https://github.com/neha240804/Crackit/actions/workflows/ci.yml/badge.svg)](https://github.com/neha240804/Crackit/actions/workflows/ci.yml)

---

## Features

| Tool | What it does |
|---|---|
| **Mock interviews** | Real-time voice interviews: topic-based, from your resume, from a job description, or HR & behavioral. Easy / intermediate / hard, 5 to 15 minutes, three interviewer personas. The interviewer judges each answer, digs deeper on good ones, gives a hint on a weak one and moves on when you're stuck, without ever giving the answer away. |
| **Feedback report** | Per-question scores, strengths, improvements and a model answer, plus speaking pace and filler words measured from your audio. |
| **Question prep** | Study sets of interview questions with model answers, by topic or generated from your own resume (including HR questions answered with your real experience). Star questions to revise later. |
| **ATS check** | Scores a resume against a job description: format checks, keyword match, gaps and an action plan. Scores are computed by rules, so the same resume always gets the same score. |

## How it works

```
Browser (React)                                   FastAPI backend
───────────────                                   ───────────────
mic → voice-activity detection ── audio ──────► Whisper speech-to-text (Groq)
                                                  │
answer text ──────────────────────────────────► LangGraph interview agent
                                                  prepare → plan → opening → listen ⏸
                                                  listen → interviewer (1 LLM call) → listen ⏸
                                                  listen → closing   (state checkpointed in Postgres)
                                                  │
browser speech (Web Speech API) ◄── reply ───── question bank via RAG (Qdrant + FastEmbed)
                                                  │
report page ◄───────────────────────────────── report: strong LLM + metrics computed in code
```

Design choices that matter:

- **Rules in code, judgement in the LLM.** Topic switching (one hint, then move on), follow-up
  limits, report scores and speech metrics are deterministic code; the LLM judges answers and
  writes the questions. This made behaviour testable instead of prompt-dependent.
- **Resumable interviews.** The LangGraph state lives in Postgres, so a refresh or a server
  restart loses nothing.
- **Free to run.** Every AI call uses the student's own free Groq key (sent per request, never
  stored on the server), and the interviewer speaks with the browser's own voice. No AI bill
  for the operator, no shared quota between users.
- **Grounded output.** Interviewer and prep questions are built on a curated question bank
  (hybrid embedding + heading-keyword retrieval with a relevance threshold); the report may
  only claim what the transcript and measured metrics support.

## Measured results

| What | Result |
|---|---|
| Question-bank retrieval (hybrid RAG) | Recall 91% → **100%**; DeepEval contextual precision 0.89 → **0.98**, recall 0.76 → **0.87**; 100% of uncovered subjects correctly rejected |
| Interviewer's answer judgement (41 human-labelled answers) | **90%** agreement; flagging answers that need a hint: **95%** precision, **86%** recall |
| Feedback reports | Overall scores within the expected band; invented claims cut from 5 of 8 reports to 1–2 minor ones |
| Prompt cost | Tokens per interviewer turn 3,010 → **2,479 (−17.6%)**, so 5 fifteen-minute interviews fit a free Groq key per day |
| Load test (live 2 GB server) | **75 concurrent simulated users, 0 errors**, ~0.5 s median response, stable memory |

Quality is checked continuously: offline eval suites on labelled datasets before releases, and
**online evaluation** of every finished real interview (code checks on all, an AI judge on a
sample), shown on an admin-only quality page. See [docs/EVALS.md](docs/EVALS.md).

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, TanStack Query, React Router |
| Backend | Python, FastAPI (async), SQLAlchemy 2 + Alembic, PostgreSQL |
| Agent | LangGraph with `interrupt()` and a Postgres checkpointer |
| AI | Groq: `gpt-oss-20b` (interviewer), `gpt-oss-120b` (reports, resume parsing), `whisper-large-v3-turbo` (speech-to-text); strict JSON-schema outputs with model fallback |
| RAG | Qdrant + FastEmbed (`bge-small-en-v1.5`) |
| Evals & tracing | Custom eval harness, DeepEval, LangSmith (timings-only in production) |
| Deployment | Docker Compose, Caddy (automatic HTTPS, security headers), nightly backups, GitHub Actions CI |

## Run it locally

Requirements: Docker Desktop, Python with [uv](https://docs.astral.sh/uv/), Node.js 20+, and a
free [Groq API key](https://console.groq.com/keys).

```bash
cp .env.example .env              # defaults work for local development
docker compose up -d              # Postgres (port 5434) + Qdrant (port 6335)

cd backend
uv sync
uv run alembic upgrade head
uv run uvicorn app.main:app --reload --reload-dir app --port 8001
# on Windows add: --loop asyncio:SelectorEventLoop

cd ../frontend
npm install
npm run dev                       # http://localhost:5174
```

Register an account, open **Settings** and add your Groq key, then start an interview.
Chrome or Edge with a microphone works best.

## Tests and evals

```bash
cd backend && uv run pytest && uv run ruff check app tests evals
cd frontend && npm run build && npm run lint
cd backend && uv run python -m evals.run --suite all     # needs a Groq key, see docs/EVALS.md
```

## Deploying

One small Linux server runs everything with
`docker compose -f docker-compose.prod.yml up -d --build` (web + HTTPS, backend, Postgres,
Qdrant, backups). Step-by-step guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Privacy

The camera never leaves the browser. Spoken answers are sent once for transcription and not
stored as audio. Each user's Groq key stays encrypted in their own browser. Accounts can be
deleted with all their data. Details are on the site's privacy page.

## Project layout

```
backend/
  app/agents/       LangGraph agents: interview, resume parsing, ATS optimizer
  app/services/     interview, prep, ATS, speech-to-text, email, ...
  app/quality/      online evaluation of real interviews
  evals/            offline eval suites and labelled datasets
frontend/src/       React app (pages, features, components)
knowledge_base/     question banks and scoring rubrics used for RAG
deploy/             Caddyfile, backup script
docs/               deployment guide, evals guide, prompt reference
```
