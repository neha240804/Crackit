"""Automated evaluation of Crackit's AI components (see docs/EVALS.md).

Four suites, each a labelled dataset in evals/data/ plus a runner that scores the real code
against it:
  judgement  - does the interviewer judge answers right? (assessment of each answer)
  report     - are the feedback report's scores in the expected band, stable and grounded?
  behaviour  - do whole simulated interviews follow the rules (hints, no answers, no calculations)?
  retrieval  - does search by meaning find the right question-bank sections, and nothing for
               subjects the bank doesn't cover?

Run from backend/:  uv run python -m evals.run --suite all
"""
