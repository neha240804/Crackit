"""Online evaluation: quality checks on REAL interviews while the site is running.

The offline evals (backend/evals/, docs/EVALS.md) test the AI on labelled datasets before a
release. Real students say things no dataset has, so every finished interview is also checked:

- checks.py   rules checked in code on every interview (free, instant, no AI call)
- judge.py    a strong-model judge for what code can't see (did it give the answer away?
              are the report's claims true?), on a sample, on the SITE OWNER's Groq key
- service.py  runs both after the report is built and stores the result (interview_quality)
- summary.py  `python -m app.quality.summary`: pass rates against the targets, latency, ratings

The offline behaviour/report suites import the same rules and judge prompts from here, so
"passing the eval" and "passing in production" mean the same thing.
"""
