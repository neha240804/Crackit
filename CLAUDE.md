# MockInterview AI

Real-time **voice mock interviews**. Split out of the CareerPilot AI project
(`C:/Users/Neha/code/CareerPilotAI`) so this repo contains only the interview product:
landing page, accounts, an optional resume (to personalise interviews), the interview room
and feedback reports.

## Main goal

A realistic, **real-time voice mock interview** that feels like talking to an experienced
interviewer, not a chatbot reading predefined questions:

- The interviewer **speaks** (natural neural voice), **listens** (speech-to-text), and replies
  **contextually**: praises correct answers, corrects mistakes in one sentence, digs deeper
  when answers are good, and **moves on** when the candidate is struggling.
- Interview types: **topic** (any subject), **resume-based**, **job-description-based**,
  **HR & behavioral**. Levels: fresher, 1-3, 3-5, 5+ years. Durations: 5/10/15 min.
  Interviewers: Maya, Arjun, Sara (own names, initials avatars, no real people).
- Time-boxed, resumable after a refresh, and ends with a **scored feedback report**
  (per question + communication metrics).
- **Free to run**: Groq free tier for LLM + Whisper; voice generated locally with Kokoro.
- Built as a learning project: keep code readable and explain *why* in comments.

## Tech stack

| Layer | Tech |
|---|---|
| Frontend | React 19 + TypeScript + Vite + Tailwind v4, TanStack Query, react-router. Light app pages, dark interview room |
| Backend | FastAPI (async), SQLAlchemy 2.0 async + Alembic, PostgreSQL |
| Agent | LangGraph graph with `interrupt()` + **Postgres checkpointer** (`langgraph-checkpoint-postgres`, psycopg) |
| LLM | Groq `openai/gpt-oss-20b` (interviewer, plan: "fast") / `gpt-oss-120b` (resume parsing, report: "strong"), strict JSON-schema output, each falls back to the other |
| Speech-to-text | Groq `whisper-large-v3-turbo` |
| Text-to-speech | **Kokoro-82M via `kokoro-onnx`**, local CPU, full fp32 model (int8 measured ~5x slower here) |
| RAG | Qdrant + FastEmbed (`BAAI/bge-small-en-v1.5`, 384-dim): question banks + rubrics in `knowledge_base/`, resume chunks |
| Tracing | LangSmith (env vars in `.env`, project `mock-interview-ai`) |

## Architecture

```
Browser                                              FastAPI backend (:8001)
───────                                              ───────────────────────
/register, /login ── /auth/* ──────────────────────► JWT auth (bcrypt)
/resume (optional) ─ POST /resumes ────────────────► profile graph: extract → parse → chunk to Qdrant
/interviews/new ──── POST /interviews ─────────────► start(): prepare→plan→opening→listen ⏸
Room: Start ──────── POST /interviews/{id}/begin ──► clock starts (started_at in DB)
speak()  ◄────────── POST /interviews/tts (chunks) ─ Kokoro (pre-generated in background)
listen: AnswerRecorder (VAD) + LiveCaptions
  ~0.9 s silence ─── POST /{id}/transcribe ────────► Whisper only (speculative, no state change)
  2.0 s silence  ─── POST /{id}/answer (text|audio) ► graph resumes: listen → interviewer → listen ⏸
End ─────────────── POST /{id}/end ────────────────► closing → END
Report page ─────── POST /{id}/report ─────────────► build_report (strong LLM + code metrics), cached
```

### Database (5 tables)

`users`, `resumes` (parsed profile JSONB), `job_descriptions`, `interview_sessions`
(config JSONB incl. `started_at`, `thread_id`, `report` JSONB), `interview_turns`.
LangGraph creates its own `checkpoint*` tables (Alembic ignores them).

### LangGraph interview graph (`backend/app/agents/interview/graph.py`)

```
START → prepare (RAG question bank) → plan (LLM, once) → opening (template) → listen ⏸
listen ─(time left & not ended)→ interviewer (1 LLM call) → listen ⏸
listen ─(time up / End pressed)→ closing (template) → END
build_report(): separate function, called after the interview
```

- `listen` calls `interrupt()`; the API resumes with `Command(resume={"text", "duration_sec", "deadline"})`.
- State lives in Postgres (`thread_id` = session id): refreshes and server restarts lose nothing.
- **Interviewer turn** = structured output `InterviewerTurn`: `assessment` (correct /
  partially_correct / incorrect / unclear / not_applicable), `reaction`, `next_move`
  (dig_deeper / clarify / correct_and_probe / new_topic), `question`, `focus_area`.
- **Topic control is enforced in code**, not left to the prompt:
  - `thread_info()` defines a thread by moves (since the last `new_topic`), not by label.
  - Struggling streak: 2 answers in a row incorrect/unclear/partial (`MAX_MISSES = 2`) → switch.
  - Good answers may go up to `MAX_FOLLOW_UPS = 3` follow-ups before switching.
  - **Code picks the next topic** (`next_focus_area()` from the plan) and uses `SWITCH_PROMPT`.
  - When already 1 miss in, the same call uses `InterviewerTurnWithSwitch` to draft the
    switch, so moving on costs no extra LLM call.
- Resume-/JD-based interviews pass the candidate's resume as compact numbered "sources"
  (`app/agents/profile/sources.py`) and the JD text as context.

### Key backend files

| File | Responsibility |
|---|---|
| `backend/app/agents/interview/graph.py` | Graph nodes, thread/topic rules, `build_report` |
| `backend/app/agents/interview/prompts.py` | `PLAN_PROMPT`, `INTERVIEWER_PROMPT`, `SWITCH_PROMPT`, `REPORT_PROMPT` |
| `backend/app/agents/interview/runtime.py` | psycopg pool + `AsyncPostgresSaver` + compiled graph (FastAPI lifespan) |
| `backend/app/services/interview_service.py` | start / begin / transcribe / answer / end / report / history; error mapping and stuck-state recovery |
| `backend/app/services/stt.py` | Whisper (vocab prompt, silence-hallucination guard) |
| `backend/app/services/tts.py` | Kokoro: `speech_chunks()`, in-flight dedupe, cache, `presynthesize()` |
| `backend/app/services/speech_metrics.py` | WPM, filler words (computed in code, not by the LLM) |
| `backend/app/schemas/interview.py` | API + LLM schemas, `PERSONAS` (maya / arjun / sara) |
| `backend/app/agents/profile/graph.py`, `sources.py` | Resume parsing graph; resume → numbered sources for the interviewer |
| `backend/app/services/resume_service.py`, `api/v1/resumes.py` | Resume upload / list / primary / reparse / delete |
| `backend/app/agents/common/llm.py` | `get_llm` / `get_structured_llm` (strict json_schema, model fallback) |
| `backend/app/core/http.py` | Shared Groq HTTP pool (120 s keep-alive) |
| `backend/app/rag/knowledge_base.py` + `knowledge_base/` | Question banks and rubrics, re-indexed at startup |

### Key frontend files

| File | Responsibility |
|---|---|
| `frontend/src/App.tsx` | Routes: `/` landing, `/login`, `/register`; logged in: `/dashboard`, `/resume`, `/interviews/new`, `/interviews/:id/report` (light, `AppShell` top bar); `/interviews/:id` room (dark, full screen) |
| `frontend/src/pages/LandingPage.tsx` | Public page: hero with an HTML conversation preview, features, how it works, interviewers |
| `frontend/src/pages/DashboardPage.tsx` | Stats, unfinished interviews, recent reports, quick-start topics (`/interviews/new?topic=…`) |
| `frontend/src/pages/NewInterviewPage.tsx` | Device checks, mic level test, interview settings (full page) |
| `frontend/src/pages/InterviewRoomPage.tsx` | Full-screen room; phase machine `ready → speaking → listening → processing → …` |
| `frontend/src/pages/InterviewReportPage.tsx` | Feedback report |
| `frontend/src/pages/ResumePage.tsx` | Optional resume upload for resume-/JD-based interviews |
| `frontend/src/features/interview/media.ts` | Camera/mic, `AnswerRecorder` (VAD), `LiveCaptions`, `speak()` (server voice + adaptive buffering, browser fallback) |
| `frontend/src/features/interview/api.ts` | API calls; converts `remaining_seconds` to `deadline_ms` outside render |
| `frontend/src/components/AppShell.tsx`, `Brand.tsx` | Top bar layout, logo, score card |
| `frontend/src/index.css` | Design tokens: `brand-*` (indigo), `accent-*` (violet), `ink-*` (slate) |

### Voice pipeline (latency-critical)

- **Turn-taking:** VAD in `AnswerRecorder`: speech-band filter (90-4000 Hz), hysteresis
  (150 ms to start), adaptive noise floor, steady-noise guard (fans). Auto-submit after
  **2.0 s** silence (`SILENCE_MS`); manual "I'm done" button as fallback.
- **Speculative transcription:** at **0.9 s** silence the audio-so-far goes to `/transcribe`;
  if the candidate stays silent, `/answer` gets text directly (Whisper is off the waiting path).
- **Live captions:** browser SpeechRecognition (Chrome/Edge), rebuilt from the full result list
  each event (no duplicated words); captions count as activity only near real speech.
- **Speech output:** the server splits lines **only at sentence/clause boundaries**
  (`speech_chunks`) and starts generating immediately (`presynthesize`); a newer line in the
  same interview cancels the stale backlog. The browser schedules chunks on one Web Audio
  timeline and starts only when `canStartGapless()` predicts no stall (≤ 0.6 s breath between
  sentences, max 3 s initial wait). Transcript text is revealed **as it is spoken**.

## Running locally (Windows)

Ports differ from CareerPilot AI (8000 / 5173 / 5433 / 6333) so both can run at once.

1. Start **Docker Desktop**, then from the repo root: `docker compose up -d`
   (containers `mockinterview-postgres` on **5434**, `mockinterview-qdrant` on **6335**).
2. First time only, from `backend/`: `uv sync` and `uv run alembic upgrade head`.
3. Backend, from `backend/`:
   `uv run uvicorn app.main:app --reload --reload-dir app --port 8001 --loop asyncio:SelectorEventLoop`
4. Frontend, from `frontend/`: `npm install` (first time), then `npm run dev` → http://localhost:5174
   (Vite proxies `/api` to :8001).
5. `.claude/launch.json` has `mi-backend` and `mi-frontend` configs with the same commands.

Required: `.env` at repo root (copy `.env.example`) with `GROQ_API_KEY` (and `LANGSMITH_*`).
Kokoro files in `data/models/kokoro/` (`kokoro-v1.0.onnx`, `voices-v1.0.bin`, git-ignored), from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1 (full fp32 model).

## Testing

- Backend: `uv run pytest` and `uv run ruff check app tests` (from `backend/`).
  Interview tests: `backend/tests/test_interview_unit.py`; auth/parsing/chunking: `test_unit.py`.
- Frontend: `npm run build` (type-check + bundle) and `npm run lint` (from `frontend/`).
- Behaviour checks are done by scripting real interviews over HTTP (answers spaced ~10-15 s
  apart, to stay realistic and under the free-tier per-minute limit).

## Gotchas (learned the hard way; keep these)

- **Windows event loop:** psycopg async fails on the default Proactor loop. Always run uvicorn
  with `--loop asyncio:SelectorEventLoop` (without `--reload` uvicorn would pick Proactor).
- **`--reload-dir app`:** watching all of `backend/` reloads on every package install in `.venv`
  and once left the server stuck mid-reload.
- **Groq strict JSON schema treats every field as required.** LLM output schemas must have **no
  optional fields** (a test enforces this). Optional fields caused `400 json_validate_failed`
  and broke live interviews. Use a separate schema when extra fields are needed.
- **Groq free tier:** ~8,000 tokens/minute and a daily token cap **per model**. `get_structured_llm`
  falls back to the other model on rate limit / 5xx / invalid JSON; keep `max_retries=1`
  (more retries meant ~8 s of silence). Keep the interviewer prompt small (2 KB sections,
  last 10 messages, ~1.8k tokens/turn).
- **Never label every failure "rate limit".** `_ai_error()` logs the real exception; a blanket
  message once hid a schema bug.
- **Stuck state:** if the interviewer step fails after the answer was recorded, the graph waits
  at `interviewer`, not `listen`. `answer()` replaces the last answer and retries; `end()` uses
  `aupdate_state(..., as_node="listen")`. Don't edit a paused graph's state any other way.
- **Clock starts at Start (`/begin`)**, not at creation; `started_at` is stored in the DB row and
  the deadline is passed into the graph with each answer.
- **Speech chunking:** never split between words (mid-phrase pauses). Kokoro on this laptop CPU
  runs ~0.4-0.9x real time; gaps are prevented by buffering, not by tiny chunks.
- **React:** no `Date.now()` during render (compute deadlines in API helpers); keep mutable
  loop state in refs; `useInterview` uses `staleTime: Infinity`, so invalidate the cache when
  the interview finishes.
- **Editing code with scripts:** shell/Python string escaping has turned `\n` into real newlines
  (and broke on `\U` in Windows paths) several times. Prefer direct file edits for code
  containing escapes, regexes or Windows paths.

## Conventions

- Deterministic rules in **code**, judgement in the **LLM** (metrics, topic control, report
  pairing are code).
- Comments explain *why*, including what was tried and measured.
- Measure before optimising: latency and token numbers drove most design decisions above.
- Design: light, friendly app pages; the interview room stays dark and focused. Original
  branding and wording only (don't copy other products' look or text).
- Privacy: the camera never leaves the browser; audio is sent only for transcription and not stored.
