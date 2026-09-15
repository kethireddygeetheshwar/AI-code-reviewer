import json

import pytest

from app.reviewer import _parse_json


def _valid_payload():
    return {
        "summary": "ok",
        "score": 80,
        "metrics": {
            "maintainability": 80,
            "readability": 80,
            "efficiency": 80,
            "security": 80,
            "best_practices": 80,
        },
        "bugs": [],
        "optimizations": [],
        "explanation": {"purpose": "p", "functions": [], "logic": []},
        "security": [],
        "complexity": {"time": "O(n)", "space": "O(1)", "explanation": "e"},
        "improved_code": "pass",
        "improvements": [],
    }


def test_parse_json_rejects_boolean_score():
    payload = _valid_payload()
    payload["score"] = True
    with pytest.raises(ValueError, match="invalid score"):
        _parse_json(json.dumps(payload))


def test_parse_json_rejects_boolean_metric():
    payload = _valid_payload()
    payload["metrics"]["security"] = False
    with pytest.raises(ValueError, match="invalid metric"):
        _parse_json(json.dumps(payload))


def test_parse_json_rejects_missing_metric():
    payload = _valid_payload()
    del payload["metrics"]["security"]
    with pytest.raises(ValueError, match="incomplete metrics"):
        _parse_json(json.dumps(payload))


def test_parse_json_accepts_boundary_scores():
    for score in (0, 100):
        payload = _valid_payload()
        payload["score"] = score
        assert _parse_json(json.dumps(payload))["score"] == score
