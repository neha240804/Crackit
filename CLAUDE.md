# Crackit (repo: MockInterviewAI)

**Brand:** the product is called **Crackit**, tagline *"Practice out loud, crack the real one."*
(renamed from "MockInterview AI"). Use Crackit in anything users see. Internal identifiers keep
the old name on purpose: storage keys `mockinterview_token` / `mockinterview_prep_v1` (renaming
logs users out and drops saved prep sets), the database, containers and package names.

Real-time **voice mock interviews**. Split out of the CareerPilot AI project
(`C:/Users/Neha/code/CareerPilotAI`) so this repo contains only the interview product:
landing page, accounts, the interview room and feedback reports, plus an **ATS resume
check** (ported from CareerPilot's optimizer). Resumes have a `purpose`: **interview**
resumes (uploaded on the New Interview page for resume-/JD-based interviews) and **ats**
resumes (the ATS checker) are separate lists by design. **Question prep** (`/prep`) gives
students study sets of interview questions with model answers, grounded in the question bank.

**Audience: mainly electrical engineering students** (core companies and PSUs). The question
bank's six electrical tracks come from `reports/Electrical fresher interview questions.md`
(questions candidates reported at NTPC, POWERGRID, BHEL, Tata Power, L&T, Siemens, Schneider,
ABB, Adani and others, tagged "Reported: company"); they are listed first on the Prep page.

**But the site reads as a general mock-interview site** (product decision, Nov 2026): no
user-visible text names electrical engineering, core companies or PSUs (landing, auth,
dashboard, prep headings "Popular tracks" / "More tracks", meta description, HR prep prompts,
whose answers users see verbatim, use "[your branch]" / "your field"). Electrical topics stay
only as suggestions: track names, one-tap topics, placeholders. The landing sample is a
resume-based exchange so it fits any field.

## Main goal

A realistic, **real-time voice mock interview** that feels like talking to an experienced
interviewer, not a chatbot reading predefined questions:

- The interviewer **speaks** (natural neural voice), **listens** (speech-to-text), and replies
  **contextually**: praises correct answers, corrects mistakes in one sentence, digs deeper
  when answers are good, and **moves on** when the candidate is struggling.
- Interview types: **topic** (any subject), **resume-based**, **job-description-based**,
  **HR & behavioral**. Difficulty: easy, intermediate, hard (was experience bands; the API field
  is still `experience`, old values map: fresher→easy, 1-3→intermediate, 3-5/5+→hard). Durations: 5/10/15 min.
  Interviewers: Maya, Arjun, Sara (own names, illustrated faceless portraits, no real people).
- Time-boxed, resumable after a refresh, and ends with a **scored feedback report**
  (per question + communication metrics).
- **Free to run**: Groq free tier for LLM + Whisper, on **each user's own key** (bring-your-own-key
  only: no server key, no free allowance); voice generated locally with Kokoro.
- **No numerical questions anywhere**: nothing that needs a calculation (bank, interviewer,
  switch, prep). Ask for the reasoning behind it instead.
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
/resume (ATS check)─ POST /resumes ────────────────► profile graph: extract → parse → chunk to Qdrant
                     POST /optimizer/analyze ──────► optimizer graph (mode=analyze): ATS rules + keyword match + gaps
                     POST /optimizer/optimize ─────► … → rewrite → verify (loop ≤3) → finalize; saves version + DOCX
/interviews/new ──── POST /interviews ─────────────► start(): prepare→plan→opening→listen ⏸
Room: Start ──────── POST /interviews/{id}/begin ──► clock starts (started_at in DB)
speak()  ◄────────── POST /interviews/tts (chunks) ─ Kokoro (pre-generated in background)
listen: AnswerRecorder (VAD) + LiveCaptions
  ~0.9 s silence ─── POST /{id}/transcribe ────────► Whisper only (speculative, no state change)
  2.0 s silence  ─── POST /{id}/answer (text|audio) ► graph resumes: listen → interviewer → listen ⏸
End ─────────────── POST /{id}/end ────────────────► closing → END
/prep ────────────── GET /prep/tracks ─────────────► tracks + subtopics parsed from knowledge_base/questions
                     POST /prep/questions ─────────► RAG (question bank) + 1 fast-LLM call → questions with answers
                     POST /prep/questions {resume_id} ► resume sources → likely questions about YOUR resume
                                                        (first-person answers from resume facts, [placeholders] for gaps)
Report page ─────── POST /{id}/report ─────────────► build_report (strong LLM + code metrics), cached
```

### Database (8 tables)

`users`, `resumes` (parsed profile JSONB, `purpose` interview|ats, one primary per purpose), `job_descriptions`, `resume_versions`
(optimized rewrite + analysis JSONB + DOCX path), `interview_sessions`
(config JSONB incl. `started_at`, `thread_id`, `report` JSONB), `interview_turns`,
`starred_questions` (Prep stars, full question copy, unique per user + normalised text) and
`prep_current_sets` (the Prep page's current study set incl. marks, JSONB, one per user).
No table stores a Groq API key (a test enforces it). `usage_counters` (the old daily
allowance) was dropped in migration `b7c1d2e3f4a5`.
LangGraph creates its own `checkpoint*` tables (Alembic ignores them).

### ATS optimizer graph (`backend/app/agents/optimizer/graph.py`)

```
START → analyze_jd (LLM, if JD) → ats_audit (code) → gap_analysis (LLM, if JD)
      --analyze--> END
      --optimize--> rewrite (LLM) → verify (code + LLM judge) --issues, attempts left--> rewrite
                                                              --clean / out of tries--> finalize (code) → END
```

- **Scores are code** (`services/ats_rules.py`, `services/keyword_match.py`): same resume, same
  score, every lost point has a reason. Overall = 35% format + 65% job match when a JD is given.
- **Never fabricate:** every rewritten bullet cites source ids (`agents/profile/sources.py`);
  code rejects numbers not in the cited sources; `finalize` restores titles/dates, drops
  unknown skills and reverts still-flagged lines to the original text.

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
  (dig_deeper / clarify / hint / new_topic), `question`, `focus_area`.
- **Coaching, not answering:** the interviewer is encouraging and **never gives the answer**.
  1st weak answer → `hint` (a nudge in the reaction + the same question again, guided);
  2nd → moves on without revealing it (the report has model answers). After a non-answer
  ("I don't know", "tell me the answer") code replaces the model's switch line with a fixed
  honest one (`non_answer_reaction()`): the model kept saying "Great effort!" to "I don't know".
  Tests forbid "give the correct idea"-style wording in the interviewer prompts.
- **Topic control is enforced in code**, not left to the prompt:
  - `thread_info()` defines a thread by moves (since the last `new_topic`), not by label.
  - Struggling streak: 2 answers in a row incorrect/unclear/partial (`MAX_MISSES = 2`) → switch
    (= one hint, one retry).
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
| `backend/app/agents/optimizer/*`, `services/optimizer_service.py`, `api/v1/optimizer.py` | ATS check + fact-checked rewrite, versions, DOCX export (`services/docx_render.py`) |
| `backend/app/services/prep_service.py`, `api/v1/prep.py`, `schemas/prep.py` | Question prep: tracks from the KB, study-set generation (strict `PrepSet` schema), resume mode (`resume_id`), `is_repeat()` drops reworded repeats in code (word overlap ≥ 0.6; the prompt alone kept re-asking). Nothing stored server-side |
| `backend/app/agents/common/llm.py` | `get_llm` / `get_structured_llm` (strict json_schema, model fallback) |
| `backend/app/core/http.py` | Shared Groq HTTP pool (120 s keep-alive) |
| `backend/app/rag/knowledge_base.py` + `knowledge_base/` | Question banks and rubrics, re-indexed at startup. One `## section` = one chunk; front matter `doc_type`, `role_family` (= Prep track id) and optional `subject` (embedded with every section so broad queries like "electrical machines" find it). Electrical files: `electrical_machines`, `power_systems`, `protection_switchgear`, `earthing_testing_safety`, `power_electronics`, `circuits_control`; core/PSU HR in `hr_behavioral.md`. Keep sections under ~1.1k chars (the interviewer reads two per turn; a test enforces < 1.6k) |

### Key frontend files

| File | Responsibility |
|---|---|
| `frontend/src/App.tsx` | Routes: `/` landing, `/login`, `/register`; logged in: `/dashboard`, `/resume`, `/interviews/new`, `/interviews/:id/report` (light, `AppShell` top bar); `/interviews/:id` room (dark, full screen) |
| `frontend/src/features/product.ts` | **The three tools** (Mock interviews / Question prep / ATS check): one name, icon, colour, tagline and CTA each, shared by the landing page, app nav, dashboard and auth page. Change product wording here |
| `frontend/src/pages/LandingPage.tsx` | Public page, worded as a general mock-interview site: hero naming all three tools (+ jump links) with a resume-based sample exchange, "three tools" section, how a mock interview works, interview features, report sample, interviewers, closing CTA |
| `frontend/src/pages/DashboardPage.tsx` | Action first: unfinished interviews → the three tools (interview card holds the 4 formats, `/interviews/new?type=…`) → progress + history → habits and facts below the fold. No duplicate New-interview button (it's in the top bar) |
| `frontend/src/pages/NewInterviewPage.tsx` | Device checks (fixed column) + interview settings (only this card scrolls on lg); reads `?type=` and `?topic=`; resume/JD formats pick or upload an interview resume (`features/resume/InterviewResumePicker.tsx`) and send `resume_id` |
| `frontend/src/pages/InterviewRoomPage.tsx` | Full-screen "stage": interviewer centre, captions, small self-view, transcript drawer, bottom dock. Voice only (no typed answers). Phase machine `ready → speaking → listening → processing → …` |
| `frontend/src/pages/InterviewReportPage.tsx` | Feedback report |
| `frontend/src/pages/ResumePage.tsx` (`/resume`, nav "ATS check") | Check only: upload/select an ATS resume + optional JD → `POST /optimizer/analyze` → report (`features/ats/AtsReport.tsx`: score, action plan, missing keywords, gaps, format checks). The backend rewrite/DOCX endpoints still exist but have no UI |
| `frontend/src/pages/PrepPage.tsx` (`/prep`, nav "Question prep") | Dark hero band (`PrepHero`: title, the three steps as chips, live stats starred / got it / to review; the starred tile opens the list), mode tabs that light up in their own colour (By topic sage, From your resume clay, Starred honey), colour-filled selected track tiles, difficulty cards with signal bars (`LevelBars`; sage / honey / clay), summary chips beside the action, a track-coloured banner with a progress strip over the set, a solid sage "practise out loud" card. Mode switch ("By topic" / "From your resume"), numbered setup (colour-coded track tiles with icons → topic → level with a one-line meaning), live summary of what you will get, one action → study set (difficulty-coloured cards, progress ring); answers hidden until revealed, Got it / Review again marks, progress, "More questions", link to a mock interview. Every question in a set is at the chosen difficulty (enforced in `prep_service.generate`). Only the current set is kept (no "recent sets"), saved to the account (`/prep/current`, debounced); a star on each question saves it to the **Starred questions** tab (`/prep/starred`, full copy of question + answer, topic filter, optimistic toggle) for revision (`features/prep/api.ts`). Old localStorage data (`mockinterview_prep_v1`, `mockinterview_starred_v1`) moves to the first account that opens Prep in that browser, once |
| `frontend/src/features/interview/media.ts` | Camera/mic, `AnswerRecorder` (VAD), `LiveCaptions`, `speak()` (server voice + adaptive buffering, browser fallback) |
| `frontend/src/features/interview/api.ts` | API calls; converts `remaining_seconds` to `deadline_ms` outside render |
| `frontend/src/components/AppShell.tsx`, `Brand.tsx` | Top bar layout, logo, score card; `Avatar` = original faceless SVG portraits per interviewer (maya / arjun / sara) |
| `frontend/src/index.css` | Design tokens: `paper` (warm off-white), `brand-*` (sage), quiet `clay-*` / `mist-*` secondary tones (per-format `FORMAT_TONE` in `features/interview/constants.ts`), `teal-*` / `plum-*` (extra quiet tones for prep tracks), `ink-*` (warm neutrals), success/warning/danger; Fraunces serif headings + Inter. No gradients or glass effects |
| `frontend/src/components/PageHero.tsx`, `LevelPicker.tsx` | Shared look of every app page: `PageHero` = the dark band at the top (eyebrow, title, chips such as `HeroStep`, up to 4 live stat tiles with coloured icon badges; Dashboard, Prep, New interview, ATS check, Report, Settings). `LevelPicker` / `LevelBars` = difficulty cards with signal bars (colours in `DIFFICULTY`, `features/interview/constants.ts`). Selected options fill with their colour (sage default; per format `FORMAT_TONE`; per track on Prep), never an ink outline |
| `frontend/src/components/ui/styles.ts` | `buttonClass()` / `fieldClass` (kept out of `.tsx` so Fast Refresh works) |

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
  timeline and starts only when `canStartGapless()` predicts no stall (≤ 0.15 s extra wait
  between chunks, max 3 s initial wait). Transcript text is revealed **as it is spoken**.
- **Seams between sentences:** Kokoro clips carry ~0.3 s of edge silence across each seam
  (measured), which sounded robotic. `trim_silence()` cuts it and appends a fixed pause:
  0.18 s after a sentence, 0.07 s after a comma.
- **Generation speed comes from the server** (`X-Gen-Per-Audio` header, measured ~0.8 here).
  Estimating it from fetch times was wrong: pre-generated chunks return in ~50 ms, so the
  browser started too early and then stalled between sentences.

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

Required: `.env` at repo root (copy `.env.example`), with `LANGSMITH_*` if you want tracing.
There is no server Groq key: add your own in the app's Settings. Scripted HTTP checks send
it as the `X-Groq-Key` header (a `GROQ_API_KEY` left in `.env` is ignored by the app; it is
single-quoted there, so strip quotes when a script reads it).
Kokoro files in `data/models/kokoro/` (`kokoro-v1.0.onnx`, `voices-v1.0.bin`, git-ignored), from
https://github.com/thewh1teagle/kokoro-onnx/releases/tag/model-files-v1.1 (full fp32 model).

## Running in production

Step-by-step guide: **`docs/DEPLOYMENT.md`** (target: one Oracle Cloud Always Free Ampere A1
VM, ARM64; all images build on amd64 and arm64). `docker compose -f docker-compose.prod.yml up -d --build`:

| Service | What |
|---|---|
| `web` | `frontend/Dockerfile`: builds the React app, served by **Caddy** (`deploy/Caddyfile`): automatic HTTPS for `SITE_ADDRESS`, `/api/*` → backend, SPA fallback, CSP + security headers, 12 MB body limit, hashed assets cached a year |
| `backend` | `backend/Dockerfile` (python slim + uv, non-root uid 10001, code at `/srv/backend` so `ROOT_DIR` = `/srv`, `knowledge_base/` baked in, `./data` mounted). `docker-entrypoint.sh` runs `alembic upgrade head`, then ONE uvicorn process with `--proxy-headers` |
| `postgres`, `qdrant` | no published ports; Qdrant pinned to the dev version |
| `backup` | `deploy/backup.sh`: `pg_dump -Fc` into `./backups` at start and every 24 h, newest 7 kept (restore steps in the guide) |

CI: `.github/workflows/ci.yml` (backend pytest + ruff, frontend build + lint, both images + `caddy validate`).

Production gotchas:
- **Client IP behind the proxy:** per-IP limits read `request.client.host`; without
  `--proxy-headers` every visitor shares Caddy's IP (one shared login limit). `--forwarded-allow-ips="*"`
  is safe only because port 8001 is never published; Caddy overwrites a forged `X-Forwarded-For` (tested).
- **Logs must not hold the user's Groq key:** Caddy's error log includes request headers and hides only
  `Authorization`/`Cookie` by itself; the Caddyfile's global `log` filter deletes `X-Groq-Key` (tested with a 502).
- **Settings errors hide their input** (`hide_input_in_errors`): a production refusal once printed the
  tail of a secret into the container log. Test: `test_refusal_does_not_print_secrets`.
- Production mode refuses `localhost` CORS origins, so a local test of the prod stack uses
  `http://127.0.0.1:8088` (see the guide). HTTPS is required in production for the microphone and WebCrypto.

## Testing

- Backend: `uv run pytest` and `uv run ruff check app tests evals` (from `backend/`).
  Interview tests: `backend/tests/test_interview_unit.py`; auth/parsing/chunking: `test_unit.py`.
- Frontend: `npm run build` (type-check + bundle) and `npm run lint` (from `frontend/`).
- **Prompts reference:** `docs/PROMPTS.md` lists every LLM prompt, generated from the source by
  `uv run python scripts/export_prompts.py` (from `backend/`, with `PYTHONPATH=.`). Re-run it after editing a prompt.
- Behaviour checks are done by scripting real interviews over HTTP (answers spaced ~10-15 s
  apart, to stay realistic and under the free-tier per-minute limit).
- **AI evals (`backend/evals/`, guide: `docs/EVALS.md`):** labelled datasets in `evals/data/`
  run against the real code: `judgement` (interviewer's right/wrong call, 41 labelled answers),
  `report` (score bands, stability, ranking, invented claims), `behaviour` (simulated
  interviews checked for the coaching rules, no answers given, no calculations), `retrieval`
  (question-bank search incl. uncovered subjects; free, no AI calls). Run from `backend/`:
  `uv run python -m evals.run --suite all` (or one suite, `--limit N` for a smoke test). Needs
  a Groq key (`CRACKIT_EVAL_GROQ_KEY` or `GROQ_API_KEY` in `.env`); results in
  `evals/results/` (git-ignored); exit code 1 if a target is missed. The suites call the graph
  NODE functions directly (no checkpointer/DB), so keep them importable and side-effect free.
  Re-run the matching suite after changing a prompt, topic rules, the report or the bank.

## Gotchas (learned the hard way; keep these)

- **Windows event loop:** psycopg async fails on the default Proactor loop. Always run uvicorn
  with `--loop asyncio:SelectorEventLoop` (without `--reload` uvicorn would pick Proactor).
- **`--reload-dir app`:** watching all of `backend/` reloads on every package install in `.venv`
  and once left the server stuck mid-reload.
- **Reload can still hang** (seen twice: adding the optimizer, editing `tts.py`): the log ends
  at "Reloading..." with no "Application startup complete", and the OLD process keeps serving
  the old code. After backend edits, check the log; if stuck, stop and restart uvicorn.
- **Groq strict JSON schema treats every field as required.** LLM output schemas must have **no
  optional fields** (a test enforces this). Optional fields caused `400 json_validate_failed`
  and broke live interviews. Use a separate schema when extra fields are needed.
- **Groq free tier:** ~8,000 tokens/minute and a daily token cap **per model**. `get_structured_llm`
  falls back to the other model on rate limit / 5xx / invalid JSON; keep `max_retries=1`
  (more retries meant ~8 s of silence). Keep the interviewer prompt small (2 KB sections,
  last 10 messages, ~1.8k tokens/turn).
- **RAG always returns k results, even unrelated ones.** The question bank covers software,
  data, HR and managerial topics only; for "power system" a plain top-k returned backend/SQL
  sections, the model treated them as the syllabus and wrote SQL questions. Question-bank
  searches use `min_score=RELEVANT_SCORE` (0.65, measured in `rag/knowledge_base.py`); with no
  match the prompt says to use the subject's standard syllabus instead.
- **Short topics also match section headings word for word** (`keyword_matches()` in
  `rag/knowledge_base.py`, used by `search_with_scores()` / `search_knowledge_base()`). The
  retrieval eval found "Transformers" (a suggested topic!) at 0.57, "network theorems" at 0.62
  and "current transformers and potential transformers" never reaching the CT/PT section, so
  those interviews got no question bank. Query rephrasing and title vectors didn't fix it
  (covered vs uncovered scores only ~0.04 apart). Rule: a query of <= 6 content words matches
  a section whose subject line + heading contain every one of them (heading matches first);
  uncovered subjects share no heading words. Retrieval eval after: 100% found, 100% uncovered
  rejected. Test: `test_short_topics_match_section_headings_but_uncovered_subjects_do_not`.
- **"Fresher" means a graduate, not a beginner.** The old level text ("easy ... definitions")
  produced textbook one-liners for core subjects; it now asks for campus/PSU-level depth.
- **Pitch questions like a real interview, everywhere.** `agents/common/levels.py` holds
  the three difficulty levels (`Level`, `normalize_level()` for old saved values), `LEVEL_GUIDE`
  (what easy / intermediate / hard mean) and `REAL_QUESTION_STYLE` (own work, scenarios,
  why/what-if, compare, debug; never definitions). The plan, interviewer, switch and prep
  prompts all include them. Before this the interviewer saw only the label "Fresher", the plan
  said "start with fundamentals" and the switch asked for "a simple, basic question": sampled
  interviews asked "what does CRUD stand for?" and "explain Ohm's law". Don't reintroduce
  "basics"/"simple" wording in prompts or schema descriptions.
- **HR prep lives under "From your resume"** (Prep: What to practise > HR & behavioral; API
  `PrepRequest.kind = "hr"` with `resume_id`): `HR_RESUME_PREP_PROMPT` answers with the resume's
  real facts (name, college, projects, internship, activities) plus the curated HR list
  (`hr_bank()`), placeholders for anything the resume can't know (company facts, outcomes,
  family, weaknesses). The HR track is hidden from the topic tracks; the generic
  `HR_PREP_PROMPT` still serves `track="hr"` API requests. Residual risk: on a rate-limit
  fallback to the fast model, some story details get invented.
- **HR prep has its own prompt (`HR_PREP_PROMPT`, `HR_LEVEL`)** and uses the strong model: the
  technical prompt produced "suggestion" questions ("Why is teamwork important?"), team-lead
  scenarios and answers with invented facts ("your 500 MW plant in Gujarat", "saved 15%").
  HR questions are what panels say (short, one question); answers are first-person templates
  built on a fresher's real experiences with every specific as a [placeholder].
- **Prep uses the strong model for electrical tracks and for topics with no question-bank
  match**: the fast model invented terms ("4-pole vs 6-pole breaker") and, even with the
  electrical bank, wrote false premises ("adjust an MCCB beyond its breaking capacity", a CT
  ratio in kVA). Software/HR tracks and resume sets stay on the fast model (`ELECTRICAL_TRACKS`
  in `prep_service.py`). Prep must not assume projects without a resume. Prep builds each
  question on the bank (hard sets: at most two invented scenarios, which is where wrong
  premises appeared) and uses `max_retries=0` so a rate limit switches model at once (one retry
  waited out the per-minute window: 75 s). Medium reasoning was tried and dropped (no accuracy
  gain, hit the token limit).
- **Question bank lines are tagged `Easy:` / `Intermediate:` / `Hard:`** (by question
  difficulty, not experience); follow-ups carry `(follow-up)` inside the text. A test rejects
  the old Fresher/Mid/Senior tags.
- **No numericals (product decision, Nov 2026):** in a voice interview nobody can do the
  working, and the fast model got its own arithmetic wrong. The bank's `(numerical)` lines
  were rewritten as the reasoning behind them ("what decides a transformer's fault level?");
  `REAL_QUESTION_STYLE` (in every question-writing prompt) says NEVER, and so do the switch
  prompt, the level guide and the prep prompt. Test: `test_no_numerical_questions_anywhere`.
  Scenario questions may still mention values ("a 75 kW motor...") as long as nothing
  has to be computed.
- **Interviewer follows the candidate:** after the intro it picks the planned area that fits
  what they said (it once forced "DC motors" onto a substation internship), and when an answer
  goes somewhere relevant it follows that thread instead of re-asking.
- **PDF text can come out one word per line** (some Word-exported PDFs in pypdf's default mode).
  `document_text._fragmented()` detects it and re-extracts with `extraction_mode="layout"`, which
  keeps lines and table rows. The ATS education heading also accepts table headers
  ("Examination | University/Board | ... | CPI/%", "Qualifications"): such a resume scored 0 on
  headings although every degree was parsed. Tests in `test_optimizer_rules.py`.
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
- **Don't hold a DB connection across an AI call.** The first query of a request opens a
  transaction that keeps its pooled connection until commit; call `release_connection(db)`
  (`db/session.py`) before any Groq/Whisper call. Without it ~15 in-flight AI calls exhausted
  the pool. Pool sizes live in `config.py` (`db_pool_size`, `checkpoint_pool_size`).
- **CPU-heavy sync work goes to a thread** (`asyncio.to_thread`): bcrypt in an async route
  froze the event loop (20 logins: 6.7 s, unrelated requests waited 6.65 s; now ~2 s / 0.3 s).
  Passwords are capped at 72 bytes (bcrypt 5 raises above that: it was a 500).
- **Limits (abuse protection):** per-minute limits per user/IP live in memory
  (`core/rate_limit.py`, `per_user()` / `per_ip()` route dependencies; single process only).
  No daily quotas: every AI call runs on the user's own key, and Groq enforces its quota. `/tts` only
  voices chunks registered by `presynthesize()` (403 otherwise). LangSmith tracing is forced
  off when `APP_ENV=production` unless `TRACE_IN_PRODUCTION=true`.
- **Bring-your-own-key ONLY (product decision, Nov 2026): no server key, no free allowance.**
  Every AI route uses `KeyedUser` (`require_groq_key` in `api/deps.py`) and answers **428**
  "Add your free Groq API key in Settings" without one; `current_groq_key()` raises the same
  if anything slips past, and `ai_http_error()` passes it through. Not on AI routes: viewing
  a cached report, lists, TTS (local). Frontend: the Dashboard shows an "Add your free Groq
  key" card first when none is saved, and `ErrorAlert` adds an "Open Settings" link to any
  message ending "in Settings". Test: `test_every_ai_route_requires_a_key`.
- **The server never stores the key** (it used to be encrypted in Postgres, dropped in
  migration `300a976995e5`). `/settings` checks it with
  Groq (`POST /account/groq-key/check`, nothing saved), then the browser keeps it AES-GCM
  encrypted with a non-extractable WebCrypto device key in IndexedDB, ciphertext in
  localStorage per user id (`features/account/groqKey.ts`). `lib/api.ts` sends it as
  `X-Groq-Key`; `get_current_user` puts a well-formed one into a per-request ContextVar
  (`core/groq_key.py`); LLM and Whisper clients are built per call with `current_groq_key()`.
  Logout drops the decrypted copy from memory. Never log it, and never put it in graph
  state (it's checkpointed to Postgres). Key
  failures map to 400 + "update it in Settings" (`agents/common/errors.py`), never 401 (the
  frontend logs out on 401).
- **`APP_ENV=production`** makes startup fail on development defaults (SECRET_KEY, DB
  password, localhost/`*` CORS) and hides `/docs`. CORS origins come from
  `CORS_ORIGINS` in `.env`. Tests: `tests/test_hardening.py`.
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
