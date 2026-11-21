"""Online evaluation (app/quality/): checks on real interviews, without AI calls or a database."""

import uuid

from app.quality import service
from app.quality.checks import interview_checks, replay_turns, report_checks


def _interview() -> list[dict]:
    """Opening, intro, a correct answer, "I don't know" (hint, wrongly praised), a wrong
    answer (moves on), then the closing: what the graph saves for a real interview."""
    return [
        {"role": "interviewer", "text": "Hello, please introduce yourself.", "kind": "opening",
         "focus_area": "introduction"},
        {"role": "candidate", "text": "I'm a final-year student who built a library app.",
         "kind": "answer", "assessment": "not_applicable"},
        {"role": "interviewer", "text": "Nice. How did you design the tables for loans?", "kind": "question",
         "focus_area": "SQL design", "next_move": "new_topic", "latency_ms": 900},
        {"role": "candidate", "text": "A loans table with foreign keys to books and members.",
         "kind": "answer", "assessment": "correct"},
        {"role": "interviewer", "text": "Good. How would you find overdue loans quickly?", "kind": "follow_up",
         "focus_area": "SQL design", "next_move": "dig_deeper", "latency_ms": 1100},
        {"role": "candidate", "text": "I don't know.", "kind": "answer", "assessment": "unclear"},
        {"role": "interviewer", "text": "Great effort! Think about what the database could look up fast.",
         "kind": "follow_up", "focus_area": "SQL design", "next_move": "hint", "latency_ms": 1300},
        {"role": "candidate", "text": "Sort the whole table every time.", "kind": "answer",
         "assessment": "incorrect"},
        {"role": "interviewer", "text": "Let's move on. How do transactions keep data safe?", "kind": "question",
         "focus_area": "Transactions", "next_move": "new_topic", "latency_ms": 1500},
        {"role": "candidate", "text": "They make a group of changes all-or-nothing.", "kind": "answer"},
        {"role": "interviewer", "text": "That's all the time we have.", "kind": "closing"},
    ]


def test_replay_rebuilds_every_interviewer_turn_with_its_thread_state():
    turns = replay_turns(_interview())
    assert [t["next_move"] for t in turns] == ["new_topic", "dig_deeper", "hint", "new_topic"]
    assert turns[3]["misses_before"] == 1  # the "I don't know" before the wrong answer
    assert [t["latency_ms"] for t in turns] == [900, 1100, 1300, 1500]
    hint, switch = turns[2], turns[3]
    assert hint["non_answer"] and hint["checks"]["flow"] and hint["checks"]["non_answer_is_miss"]
    assert hint["checks"]["no_praise_after_non_answer"] is False  # "Great effort!" to "I don't know"
    assert switch["checks"]["flow"]  # second miss -> new topic


def test_report_checks_compare_report_scores_with_the_live_verdicts():
    messages = _interview()
    good = {"questions": [{"question_index": i, "score": s, "ideal_answer": "word " * 12}
                          for i, s in enumerate([7, 8, 2, 3, 6], 1)]}
    assert report_checks(messages, good) == {"every_answer_scored": True, "model_answer_given": True,
                                             "report_agrees": True}
    # The report calls the "correct" answer 2/10 and the wrong one 9/10: they disagree.
    bad = {"questions": [{**q, "score": {2: 2, 4: 9}.get(q["question_index"], q["score"])}
                         for q in good["questions"][:4]]}
    checks = report_checks(messages, bad)
    assert checks["every_answer_scored"] is False and checks["report_agrees"] is False


def test_interview_checks_tally_and_keep_failing_examples():
    result = interview_checks(_interview(), {"questions": []})
    assert result["turns"] == 4 and result["latency_ms"] == [900, 1100, 1300, 1500]
    assert result["checks"]["no_praise_after_non_answer"] == {"passed": 0, "total": 1}
    assert result["failures"][0]["failed"] == ["no_praise_after_non_answer"]


async def test_no_judge_without_an_owner_key(monkeypatch):
    monkeypatch.setattr(service.settings, "online_eval_groq_key", "")
    monkeypatch.setattr(service.settings, "online_eval_sample_rate", 1.0)
    assert await service._judge_wanted(db=None) is False  # never touches the db or a user key


async def test_judge_runs_on_the_owner_key_and_leaves_the_student_key_alone(monkeypatch):
    from app.core.groq_key import current_groq_key, set_user_key

    owner, student = "gsk_" + "Own3r" * 6, "gsk_" + "Stud3nt" * 4
    seen = {}

    async def fake_judge(messages, cfg, report):
        seen["key"] = current_groq_key()
        return {"checks": {}, "notes": [], "unsupported": []}

    class FakeDb:
        row = type("Row", (), {"judge": None, "judge_status": "pending"})()

        async def __aenter__(self):
            return self

        async def __aexit__(self, *exc):
            return False

        async def get(self, _model, _id):
            return self.row

        async def commit(self):
            pass

    monkeypatch.setattr(service.settings, "online_eval_groq_key", owner)
    monkeypatch.setattr(service, "judge_interview", fake_judge)
    monkeypatch.setattr(service, "SessionLocal", FakeDb)
    set_user_key(student)  # the request that finished the interview
    import asyncio

    await asyncio.create_task(service._run_judge(uuid.uuid4(), [], {}, {}))  # as record() starts it
    assert seen["key"] == owner and FakeDb.row.judge_status == "done"
    assert current_groq_key() == student  # the student's request context is unchanged
    set_user_key(None)


async def test_quality_bookkeeping_never_breaks_the_report():
    class BrokenDb:
        rolled_back = False

        def add(self, _row):
            raise RuntimeError("database hiccup")

        async def scalar(self, _q):
            return 0

        async def rollback(self):
            BrokenDb.rolled_back = True

    await service.record(BrokenDb(), uuid.uuid4(), {"messages": _interview(), "config": {}}, {"questions": []})
    assert BrokenDb.rolled_back


# ---------------------------------------------------------------- admin page access
def test_only_admin_emails_get_the_quality_page(monkeypatch):
    import pytest
    from fastapi import HTTPException

    from app.api.deps import is_admin, require_admin
    from app.db.models import User

    monkeypatch.setattr(service.settings, "admin_emails", " Owner@Example.com, second@example.com ")
    owner = User(id=uuid.uuid4(), email="owner@example.com", name="O", password_hash="x")
    student = User(id=uuid.uuid4(), email="student@example.com", name="S", password_hash="x")
    assert is_admin(owner) and not is_admin(student)  # case and spaces don't matter

    import asyncio

    assert asyncio.run(require_admin(owner)) is owner
    with pytest.raises(HTTPException) as err:
        asyncio.run(require_admin(student))
    assert err.value.status_code == 404  # others can't even tell the page exists


def test_quality_route_is_admin_only():
    from fastapi.routing import APIRoute

    from app.api.deps import require_admin
    from app.api.v1 import admin

    routes = [r for r in admin.router.routes if isinstance(r, APIRoute)]
    assert routes and all(any(d.call is require_admin for d in r.dependant.dependencies) for r in routes)
