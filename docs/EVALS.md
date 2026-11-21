# Evaluating Crackit's AI

The code tests (`uv run pytest`) check the rules around the AI. These evals check the AI
itself: does it judge answers right, score reports fairly, follow the interview rules, and
find the right study material? Each suite is a labelled dataset plus a script that runs the
**real** production code on it and compares the result with what a person expects.

| Suite | Question it answers | AI calls | Time (free tier) |
|---|---|---|---|
| `retrieval` | Does search by meaning find the right question-bank sections, and nothing for uncovered subjects? | none (local) | ~30 s |
| `judgement` | Does the interviewer judge each answer right (correct / partial / wrong / unclear)? | 41 | ~10 min |
| `report` | Are report scores in the right band, stable between runs, ranked right, and free of invented claims? | ~24 | ~20 min |
| `behaviour` | Do whole simulated interviews follow the rules (hint first, never give the answer, no calculations, on topic)? | ~80 | ~20 min |

Everything lives in `backend/evals/`: the datasets in `evals/data/`, one module per suite,
and `evals/run.py` to run them. Results go to `backend/evals/results/` (git-ignored).

## 1. Before you start

1. Docker Desktop running with the dev containers (`docker compose up -d` from the repo root):
   the suites search the real Qdrant question bank.
2. A Groq key. The app has no server key, so the evals read one from, in order:
   the `CRACKIT_EVAL_GROQ_KEY` environment variable, `GROQ_API_KEY`, or `GROQ_API_KEY=` in the
   repo's `.env`. Use your own free key; a full run uses roughly 150k tokens.
3. Run commands from `backend/`.

## 2. Run the suites

```powershell
uv run python -m evals.run --suite retrieval
```

```powershell
uv run python -m evals.run --suite judgement
```

```powershell
uv run python -m evals.run --suite report
```

```powershell
uv run python -m evals.run --suite behaviour
```

Or everything (~50 min):

```powershell
uv run python -m evals.run --suite all
```

Useful options:

| Option | Use |
|---|---|
| `--limit 5` | Only the first 5 cases: a quick smoke test after a change |
| `--repeats 3` | judgement: judge every case 3 times and measure consistency |
| `--runs 3` | report: build each report 3 times (more reliable spread) |
| `--pace 20` | Wait longer between AI calls if you hit rate limits |
| `--no-grounding` | report: skip the invented-claims check (saves strong-model tokens) |
| `--no-reindex` | retrieval: search the current index without rebuilding it |

The run prints progress, then a table per suite, and exits with code 1 if any metric missed
its target, so it can gate a release.

## 3. Read the results

Each suite writes two files to `backend/evals/results/`:

- `<suite>-<time>.md`: the summary to read. Metrics table with PASS / FAIL, what each metric
  means, then the cases that went wrong, with the candidate's answer and the AI's reply.
- `<suite>-<time>.json`: every case in full, for digging deeper or comparing runs.

### What each number means and its target

**retrieval**

| Metric | Target | Meaning |
|---|---|---|
| Covered subjects found | ≥ 90% | For a subject the bank covers, a right section passes the relevance cut-off |
| Best result is the right subject | ≥ 90% | The top-scoring section comes from the right question-bank file |
| Precision of what is kept | ≥ 85% | Of the sections handed to the AI, the share that are on-subject |
| Right section among results | ≥ 80% | The specific best section (e.g. "Load flow…") is returned |
| Uncovered subjects rejected | 100% | Subjects the bank doesn't cover return nothing. A miss here makes the AI treat unrelated sections as the syllabus |

The `.md` also has a **cut-off sweep**: how "found" and "rejected" change as the relevance
cut-off (`RELEVANT_SCORE`, now 0.65) moves. Pick the lowest cut-off that still rejects 100%.

**judgement**

| Metric | Target | Meaning |
|---|---|---|
| Miss decision agrees with label | ≥ 90% | The headline number: right vs not-right, which decides follow-up, hint or topic change |
| Exact label agrees | ≥ 75% | Same label as the human (or an accepted alternative) |
| Lenient errors | ≤ 10% | Wrong answers the AI let pass. The worst error: the candidate never learns |
| Harsh errors | ≤ 10% | Good answers marked wrong. Frustrating, but the candidate gets another go |
| Same label on every repeat | ≥ 85% | Only with `--repeats`: consistency |

The `.md` has a confusion matrix (rows = human label, columns = AI label) and every
disagreement with the interviewer's reply.

**report**

| Metric | Target | Meaning |
|---|---|---|
| Overall score in expected band | ≥ 80% | Score inside the band an experienced interviewer would give |
| Mean distance outside the band | ≤ 5 pts | How far off the misses are |
| Per-question limits respected | ≥ 85% | E.g. "I don't know" scores at most 2/10; a complete answer at least 7/10 |
| Strong vs weak ranked correctly | 100% | A strong interview always scores above a weak one on the same topic |
| Largest score spread across runs | ≤ 10 pts | The same transcript scored twice gives nearly the same score |
| Reports with no invented claims | ≥ 75% | A strong-model check finds no strength the candidate never showed |

**behaviour**

| Metric | Target | Meaning |
|---|---|---|
| Coaching flow | ≥ 90% | Hint after a first miss; new topic after a second miss or 3 follow-ups |
| Non-answers judged as misses | 100% | "I don't know" / "tell me the answer" count as misses |
| No praise after a non-answer | 100% | No "great" or "nice" after "I don't know" |
| Never gives the answer | ≥ 95% | The interviewer doesn't state the answer to a missed question (judged by the strong model) |
| No calculation questions | 100% | Nothing needs a calculation (judged) |
| Stays on topic | ≥ 95% | Questions fit the chosen topic (judged) |
| One question per turn | ≥ 90% | Judged |
| No repeated questions | ≥ 95% | Except the one guided retry after a hint |
| Turns short enough to speak | ≥ 90% | Under 70 words |

### How far to trust the numbers

- **The datasets are small** (41 answers, 8 transcripts, 6 interviews, 45 queries). One case
  is 2-3 percentage points in judgement and much more in report and behaviour. Treat a change
  of a few points as noise; look at *which* cases failed.
- **AI output varies between runs.** Before deciding something got better or worse, run the
  suite twice (`--repeats 2` / `--runs 3`) or compare the failing cases.
- **Behaviour answers are simulated** by the fast model, so each run is a different
  conversation. Failures are real examples; the rate is approximate.
- **The judge is an AI too.** "Never gives the answer", "no calculations", "on topic", "one
  question" and "invented claims" are judged by the strong model. Read the failures: if the
  judge is wrong, that's a judge problem, not an app problem.
- **Rate limits.** On a free key the app may fall back to the other model when one is
  rate-limited (by design), and a fallback can change results. If a run shows many rate-limit
  waits, rerun with a larger `--pace`.

## 4. When to run them

| You changed… | Run |
|---|---|
| The interviewer prompt, level guide or `REAL_QUESTION_STYLE` | `judgement`, then `behaviour` |
| Topic control code (`thread_info`, `thread_rule`, `MAX_MISSES`) | `behaviour` |
| The report prompt or rubrics | `report` |
| The question bank, `RELEVANT_SCORE` or the embedding model | `retrieval` |
| The LLM models in `config.py` | all |
| Before a release | all, and compare with the last baseline |

## 5. Grow the datasets (this is what makes the evals trustworthy)

The datasets are plain files a non-programmer can edit. Add a case whenever a real interview
goes wrong: it then stays fixed.

- **`evals/data/judgement.jsonl`**, one answer per line: `id`, `type` (topic / hr), `topic`,
  `level`, `question`, `answer`, `expected` (correct, partially_correct, incorrect, unclear,
  not_applicable), optional `also_ok` (other labels a fair interviewer could give), `note`
  (why). Aim for 100+ answers with an even mix of labels and subjects. Have someone who knows
  the subject label them **without** looking at the AI's output.
- **`evals/data/report_transcripts.json`**: question/answer pairs, the expected `overall`
  band, optional `per_question` limits, and `order` pairs. Get the band by asking two people
  to score the transcript and taking the range they agree on.
- **`evals/data/behaviour_scenarios.json`**: an introduction and a list of answers: a style
  (`strong`, `partial`, `weak`) or literal text (e.g. "Can you just tell me the answer?").
- **`evals/data/retrieval_queries.json`**: `positive` queries with the expected
  question-bank files (`expect`) and optionally a `section` heading; `negative` subjects the
  bank doesn't cover. Add every topic you suggest in the app.

`tests/test_unit.py::test_eval_datasets_are_well_formed` checks the files whenever the code
tests run.

## 6. DeepEval: contextual precision and recall of the search

[DeepEval](https://github.com/confident-ai/deepeval) is an open-source LLM evaluation library.
`evals/deepeval_rag.py` runs its two RAG retrieval metrics on the retrieval dataset:

```powershell
uv run python -m evals.deepeval_rag
```

| DeepEval field | What Crackit puts in it |
|---|---|
| `input` | The topic a user types ("Transformers") |
| `retrieval_context` | Exactly what the interview hands the AI: the top 4 question-bank sections at or above the 0.65 cut-off, in rank order (or "nothing retrieved") |
| `expected_output` | The ideal material: the labelled best section's text, or for broad topics, the themes of the expected question-bank file |

- **Contextual precision** (0-1): are the relevant sections ranked above irrelevant ones?
  1.0 = everything useful comes first.
- **Contextual recall** (0-1): how much of the expected material is in what was retrieved?
  1.0 = all of it reached the AI.

An LLM judges both, reading the actual text. The judge is `qwen/qwen3.8-27b` on Groq, from a
different family than the app's gpt-oss models, so it doesn't share their blind spots. Set
`DEEPEVAL_JUDGE_MODEL` to use another. DeepEval's telemetry is switched off in the script.
The same run also reports plain, non-LLM precision and recall against the labelled files, so
you can compare both. Uncovered subjects aren't part of this: DeepEval needs an expected
output. Their rejection rate is in the `retrieval` suite. About 140 judge calls, ~10 min.

**Reading recall on broad topics.** For a broad topic ("SQL", "Machine learning") the expected
output lists every theme of the question-bank file (up to 14), but the search returns at most
4 sections, so recall there can't reach 1.0. The judge also treats a themes list as one
sentence and scores it all-or-nothing, so these often score 0 even when what came back is
right. Compare queries that have a labelled best section (a fair recall test) separately.
First run (Nov 2026, 35 queries): precision 0.89, recall 0.72 overall. On the 22 queries with
a labelled section: precision 0.89, recall 0.91. On the 13 broad ones: precision 0.90, recall
0.39 (the artifact above). Real misses, where nothing reached the AI: "Transformers",
"current transformers and potential transformers" and "network theorems", all just under the
0.65 cut-off.

After the heading-keyword fix (Nov 21, 2026; 33 of 35 queries, the judge's daily quota ran out
before the last two): precision 0.98, recall 0.87 overall; labelled-section queries precision
0.98, recall **1.00**. "Transformers" and "network theorems" went from 0/0 to 1.0/1.0, and no
query retrieves nothing any more. The judge's free quota is 200k tokens a day and one full
run uses most of it: run DeepEval once a day at most, or set `DEEPEVAL_JUDGE_MODEL`. If the
quota runs out mid-run, the script saves the queries it finished.

## 7. Baseline (first full run)

Filled in from the first full run; compare later runs against these numbers.

## 8. Online evaluation (real interviews, while the site runs)

The suites above test the AI on fixed datasets before a release. Real students give answers no
dataset has, so every finished interview is also checked in production (`backend/app/quality/`).
It runs when the report is built, never slows the student down and never uses their key.

| Layer | When | Cost | What it checks |
|---|---|---|---|
| **Code checks** | every finished interview | free (pure Python, a few ms) | coaching flow (hint, then move on), "I don't know" judged as a miss and not praised, no repeated question, turns short enough to speak, no calculation wording, the report scores every answer and gives a model answer, the report's scores agree with the interviewer's live verdicts, interviewer reply time |
| **AI judge** | a sample: `ONLINE_EVAL_SAMPLE_RATE` (25%), at most `ONLINE_EVAL_DAILY_MAX` (25) per 24 h | ~4-6k tokens each, on **your** key (`ONLINE_EVAL_GROQ_KEY`) | never gives the answer, no calculation questions, stays on topic, one question per turn, report claims supported by the transcript |

The rules and judge prompts are the **same code** as the `behaviour` and `report` suites
(`app/quality/checks.py`, `app/quality/judge.py`), so a target means the same thing offline and
online. Results are stored per interview in the `interview_quality` table (deleted with the
interview), including short quotes of failing turns.

**Setup.** Nothing for the code checks. For the judge, put your own Groq key in the server's
`.env` as `ONLINE_EVAL_GROQ_KEY` and restart. Without it, interviews are marked "code checks only".

**Read the results in the app:** put your sign-up email in the server's `.env` as
`ADMIN_EMAILS=you@example.com` and restart. Your account then gets a **Quality** item in the top
bar (`/admin/quality`): pass rate per check with the target marked, reply time, students'
rating, the latest failures with the candidate's answer and the interviewer's reply quoted, and
the latest checked interviews; pick 24 hours, 7, 30 or 90 days. Everyone else gets a 404 there
(`GET /api/v1/admin/quality`, `require_admin`).

**Or in a terminal** (same numbers):

```bash
# on the server
docker compose -f docker-compose.prod.yml exec backend python -m app.quality.summary --days 7
# locally, from backend/
uv run python -m app.quality.summary --days 30        # add --json for machine-readable output
```

It prints each check's pass rate against its target (`BELOW TARGET` only with at least 5
samples), reply time (median and 90th percentile), the mean report score, the students' own
emoji rating, and the most recent failures with the quotes to read first. Exit code 1 when a
check is below target, so a daily cron job can email you:

```bash
0 8 * * * cd ~/crackit && docker compose -f docker-compose.prod.yml exec -T backend python -m app.quality.summary --days 1 || echo "Crackit quality below target" | mail -s "Crackit eval" you@example.com
```

**When a check fails online:** read the quoted failures, add the case to the matching offline
dataset (`evals/data/`, section 5), fix the prompt or rule, re-run that suite, deploy, and
watch the online rate over the next days. That loop is what makes production failures stop
recurring.

**First run (Nov 21, 2026, 17 dev-test interviews):** judge checks all at or above target
(answer never given 100%, no calculations 100%, on topic 100%, report claims grounded 92%);
coaching flow 31% and calculation wording 93% were low because most of those interviews were
recorded before the hint rule and the no-numericals change: a fresh baseline needs interviews
on the current version. Reply times exist only for interviews after this change.
