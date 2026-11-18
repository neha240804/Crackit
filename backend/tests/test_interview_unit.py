"""Unit tests for interview logic that doesn't need an LLM."""

from app.agents.interview.graph import answered_pairs, route_after_listen
from app.services.speech_metrics import answer_metrics, overall_metrics


def test_answered_pairs_skips_question_cut_off_by_end():
    msgs = [
        {"role": "interviewer", "text": "Intro?", "kind": "opening"},
        {"role": "candidate", "text": "I am A."},
        {"role": "interviewer", "text": "What is bias?", "kind": "question"},
        {"role": "candidate", "text": "Error from assumptions."},
        {"role": "interviewer", "text": "Why?", "kind": "follow_up"},  # ended before answering
        {"role": "interviewer", "text": "Bye", "kind": "closing"},
    ]
    pairs = answered_pairs(msgs)
    assert [(q["text"], a["text"]) for q, a in pairs] == [
        ("Intro?", "I am A."), ("What is bias?", "Error from assumptions.")]


def test_speech_metrics():
    m = answer_metrics("Um so basically I like built the um API", 6)
    assert m["words"] == 9 and m["wpm"] == 90
    assert m["filler_count"] == 4  # um, basically, like, um ("so" is not counted)
    total = overall_metrics([{"text": "one two three four", "duration_sec": 2},
                             {"text": "um five six", "duration_sec": 2}])
    assert total["total_words"] == 7 and total["avg_wpm"] == 105
    assert total["top_fillers"] == ["um"]


def test_route_closes_when_time_is_up_or_user_ends():
    import time
    assert route_after_listen({"deadline": time.time() + 300}) == "interviewer"
    assert route_after_listen({"deadline": time.time() + 10}) == "closing"
    assert route_after_listen({"deadline": time.time() + 300, "ended_by_user": True}) == "closing"


def test_thread_info_tracks_depth_and_struggling_streak():
    from app.agents.interview.graph import thread_info

    msgs = [
        {"role": "interviewer", "text": "Intro?", "kind": "opening", "focus_area": "introduction"},
        {"role": "candidate", "text": "...", "assessment": "not_applicable"},
        {"role": "interviewer", "text": "Bias?", "kind": "question", "focus_area": "Bias"},
        {"role": "candidate", "text": "...", "assessment": "correct"},
        {"role": "interviewer", "text": "Why?", "kind": "follow_up", "focus_area": "Bias"},
        {"role": "candidate", "text": "...", "assessment": "incorrect"},
        # the label is reworded, but it's still the same thread (no new_topic move)
        {"role": "interviewer", "text": "Simpler?", "kind": "follow_up", "focus_area": "Bias basics"},
        {"role": "candidate", "text": "...", "assessment": "unclear"},
    ]
    topic, depth, covered, misses = thread_info(msgs)
    assert (topic, depth, misses) == ("Bias", 2, 2)
    assert covered == ["introduction", "Bias", "Bias basics"]
    assert thread_info([]) == ("introduction", 0, [], 0)


def test_thread_rule_moves_on_after_repeated_misses_but_digs_when_correct():
    from app.agents.interview.graph import thread_rule

    assert "MUST be new_topic now" in thread_rule(depth=1, misses=2)  # struggling twice
    assert "ALSO incorrect" in thread_rule(depth=1, misses=1)  # one more miss -> move on
    assert thread_rule(depth=2, misses=0) == ""  # doing well: keep exploring
    assert "follow-ups on this thread" in thread_rule(depth=3, misses=0)  # depth cap


def test_speech_text_normalisation():
    from app.services.tts import normalize_for_speech

    assert normalize_for_speech("train‑validation gap—right?") == "train-validation gap, right?"
    assert normalize_for_speech("you’re  “close”") == "you're \"close\""


def test_speech_chunks_split_only_at_sentence_or_clause_boundaries():
    from app.services.tts import speech_chunks

    chunks = speech_chunks(
        "Not quite. More data mainly helps variance—not bias. "
        "What does high bias look like on a learning curve?"
    )
    assert chunks == ["Not quite.", "More data mainly helps variance, not bias.",
                      "What does high bias look like on a learning curve?"]
    long = speech_chunks("word " * 40 + "end, and then a final clause that goes on for a while.")
    # A 200+ char sentence is split only at its comma, never between two words.
    assert len(long) == 2 and long[0].endswith("end,")


def test_next_focus_area_skips_covered_and_reworded_topics():
    from app.agents.interview.graph import next_focus_area

    plan = ["Bias vs variance fundamentals", "Overfitting vs underfitting detection",
            "Regularisation techniques", "Cross-validation"]
    # "Bias-variance basics" is a rewording of the first area: it counts as covered.
    assert next_focus_area(plan, ["introduction", "Bias-variance basics"],
                           "Bias-variance basics") == "Overfitting vs underfitting detection"
    everything = ["Bias vs variance", "Overfitting detection", "Regularisation", "Cross-validation"]
    assert next_focus_area(plan, everything, "Regularisation techniques") == "Cross-validation"


def test_strict_llm_schemas_have_no_optional_fields():
    """Groq's strict JSON-schema mode treats EVERY field as required: an optional field the
    model leaves out makes Groq reject the whole reply (400 json_validate_failed). That
    broke a live interview, so interview LLM schemas must not have optional fields."""
    from app.schemas.interview import InterviewerTurn, InterviewerTurnWithSwitch

    for schema in (InterviewerTurn, InterviewerTurnWithSwitch):
        optional = [name for name, f in schema.model_fields.items() if not f.is_required()]
        assert optional == [], f"{schema.__name__} has optional fields: {optional}"


def test_trim_silence_replaces_edge_silence_with_a_fixed_pause():
    """Kokoro clips carry ~0.3 s of silence across each seam; played back to back that
    sounded robotic. Edges are trimmed and a deliberate, consistent pause is appended."""
    import numpy as np

    from app.services.tts import pause_after, trim_silence

    sr = 24000
    tone = (0.5 * np.sin(np.linspace(0, 2000, sr))).astype(np.float32)  # 1 s of "speech"
    clip = np.concatenate([np.zeros(int(0.05 * sr)), tone, np.zeros(int(0.3 * sr))]).astype(np.float32)
    out = trim_silence(clip, sr, pause_s=0.18)
    assert abs(len(out) / sr - (1.0 + 0.015 + 0.18)) < 0.02
    assert pause_after("How would you check it?") > pause_after("First, the data,")


def test_prep_schema_is_strict_safe_and_tracks_come_from_the_question_bank():
    """Prep output goes through Groq strict mode: no optional fields allowed. Tracks are
    read from knowledge_base/questions, so every track has subtopics to pick from."""
    from app.schemas.prep import PrepQuestion, PrepSet
    from app.services.prep_service import list_tracks

    for schema in (PrepQuestion, PrepSet):
        optional = [name for name, f in schema.model_fields.items() if not f.is_required()]
        assert optional == [], f"{schema.__name__} has optional fields: {optional}"
    tracks = {t.id: t for t in list_tracks()}
    assert {"backend", "hr", "machine_learning"} <= tracks.keys()
    assert all(t.topics for t in tracks.values())


def test_prep_repeat_filter_catches_rewordings_but_keeps_new_angles():
    """Measured on real "More questions" output for a resume."""
    from app.services.prep_service import is_repeat

    assert is_repeat(
        "Looking at your entire career, if you could revisit any project, which one would you change and why?",
        "Looking back at your entire career, what would you change about one of your projects if you had the chance?",
    )
    assert not is_repeat(
        "Your Resume Matcher project indexed 50k job postings using Qdrant. What was the hardest part?",
        "Can you walk me through the Resume Matcher project you built at DataNest Labs?",
    )
    assert not is_repeat("What makes an API RESTful?", "How would you design pagination for a public API?")
