# Resume notes: measured improvements in Crackit

Notes for writing resume bullets later. Every number below was measured by the eval harness
in `backend/evals/` (see `docs/EVALS.md`); dates and dataset sizes are given so each claim can
be backed up in an interview.

## 1. Retrieval (RAG over the interview question bank): precision and recall

**Problem.** Interviews and question prep look up relevant sections of a curated question bank
(84 sections, Qdrant + FastEmbed `bge-small-en-v1.5` embeddings) before the LLM writes
questions. Short topics like "Transformers" (one of the topics suggested in the app) scored
0.57 similarity against the ~1,100-character sections, below the 0.65 relevance cut-off. So
those interviews ran with **no** grounding material, and the LLM wrote questions from memory.

**What changed (in order).**

1. **Relevance cut-off (`RELEVANT_SCORE = 0.65`)**, set earlier from measured scores.
   A plain top-k search always returns k results: for "power system" it returned SQL and
   backend sections, and the LLM wrote SQL questions in a power-systems interview. Measured
   then: covered topics 0.61-0.79, uncovered 0.49-0.63; 0.65 rejected all 12 uncovered subjects
   tested. This is a **precision** fix: no unrelated "syllabus" reaches the LLM.
2. **Subject line embedded with every section** (front-matter `subject:` text prepended), so
   broad queries ("electrical machines") find their sections. Before, the closest match was a
   metering section.
3. **Hybrid retrieval: keyword matching on section headings** (`keyword_matches()` in
   `backend/app/rag/knowledge_base.py`, Nov 21, 2026). A short topic (≤ 6 content words) also
   matches a section whose subject line + heading contain every one of its words. Matches in
   the heading itself rank first, then by embedding similarity to the heading. Tried first and
   rejected, because measurement showed they didn't fix it: query rephrasing (BGE instruction
   prefix, "interview questions about …") and extra title vectors. The best variant still
   missed "Transformers", and covered and uncovered subjects stayed only ~0.04 apart in score.
   The heading rule added no false matches: all 10 uncovered subjects still return nothing.
   This is a **recall** fix.

**Measured effect of change 3**, on 35 labelled covered-topic queries and 10 uncovered subjects:

| Retrieval suite (no LLM) | Before | After |
|---|---|---|
| Covered topics found (recall) | 91% | **100%** |
| Best result is the right subject | 97% | **100%** |
| Precision of what is kept | 93% | **94%** |
| Right section among results | 91% | **100%** |
| Uncovered subjects rejected | 100% | **100%** |

| DeepEval, LLM-judged (judge: `qwen3.8-27b`, a different model family than the app's) | Before | After |
|---|---|---|
| Contextual precision, 33 queries | 0.89 | **0.98** |
| Contextual recall, 33 queries | 0.76 | **0.87** |
| Contextual recall, 22 queries with a labelled best section | 0.91 | **1.00** |
| Topics retrieving nothing | 3 | **0** |

Caveats to remember: the DeepEval "after" run scored 33 of 35 queries (the judge's free daily
token quota ran out). Recall on broad topics is understated by the test design: the
expected output lists every theme of a subject, but only 4 sections are retrieved. The
datasets are small, so treat the numbers as a before/after comparison on the same data, not
as a general benchmark.

## 2. The eval harness itself (built Nov 2026)

- Four automated suites against the real production code, with labelled datasets: answer
  judgement (41 human-labelled answers), feedback-report scoring (8 transcripts with expected
  score bands, run twice each, with an LLM groundedness check), whole-interview behaviour
  (6 simulated interviews: a candidate simulator plus code checks plus an LLM judge), and
  retrieval (35 + 10 queries, plus a cut-off sweep).
- DeepEval (`ContextualPrecisionMetric`, `ContextualRecallMetric`) wired to a Groq judge
  through a custom `DeepEvalBaseLLM`.
- Pass/fail targets per metric, and exit code 1 on a miss, so a run can gate a release.

**First measurements (baseline, Nov 20, 2026):**

- Interviewer's right/wrong call on 41 labelled answers: **90% agreement** on the miss
  decision; as a "needs a hint" detector, **precision 95% (19/20), recall 86% (19/22)**; 82%
  exact-label agreement. Weak spot found: half-right answers judged fully correct (3 of 8).
- Feedback reports: **100%** of overall scores inside the expected band (16 reports); strong
  and weak transcripts always ranked correctly. Found: scores move up to 13 points between
  runs, and 5 of 8 reports credited the candidate with something they didn't say.
  These are the next things to improve and re-measure.

## Draft resume bullets

- Built a voice mock-interview platform (FastAPI, LangGraph, Groq LLMs, Whisper, Kokoro TTS,
  Qdrant RAG) with an automated evaluation harness (4 suites + DeepEval) that gates releases
  on per-metric targets.
- Improved RAG retrieval with hybrid heading-keyword + embedding search: recall 91% → 100%
  and contextual precision 0.89 → 0.98 (DeepEval), with zero false matches on uncovered
  subjects. Removed every case where an interview ran without grounding material.
- Measured the LLM interviewer's answer judgement against 41 human-labelled answers (90%
  agreement; 95% precision, 86% recall at flagging answers that need a hint), and used the
  evals to find report-scoring variance and hallucinated strengths to fix next.
