import json
import os
from types import SimpleNamespace
from unittest.mock import patch

os.environ["DATABASE_URL"] = "sqlite:///./test_reviews.db"

import pytest

from app.reviewer import _parse_json, fallback_review, generate_tests, review_code

VALID = {
    "summary": "Looks good",
    "score": 80,
    "metrics": {
        "maintainability": 80,
        "readability": 76,
        "efficiency": 74,
        "security": 72,
        "best_practices": 77,
    },
    "bugs": [],
    "optimizations": ["Use type hints."],
    "explanation": {"purpose": "p", "functions": ["f"], "logic": ["l"]},
    "security": [],
    "complexity": {"time": "O(n)", "space": "O(1)", "explanation": "e"},
    "improved_code": "pass",
    "improvements": ["Add tests."],
}

NO_PROVIDER = SimpleNamespace(
    ai_provider="groq",
    groq_api_key=None,
    openai_api_key=None,
    groq_model="x",
    openai_model="x",
)


def test_parse_json_strips_markdown_fence():
    payload = f"```json\n{json.dumps(VALID)}\n```"
    assert _parse_json(payload) == VALID


def test_parse_json_strips_plain_fence():
    payload = f"```\n{json.dumps(VALID)}\n```"
    assert _parse_json(payload) == VALID


def test_parse_json_rejects_incomplete_response():
    incomplete = dict(VALID)
    del incomplete["bugs"]
    with pytest.raises(ValueError):
        _parse_json(json.dumps(incomplete))


def test_parse_json_rejects_invalid_json():
    with pytest.raises(json.JSONDecodeError):
        _parse_json("not json at all")


def test_fallback_review_flags_dangerous_patterns():
    code = 'x = eval("1 + 1")\npassword = "hunter2"\nwhile True:\n    pass'
    result = fallback_review(code, "python")
    titles = [bug["title"] for bug in result["bugs"]]
    assert "Dangerous eval()" in titles
    assert "Hardcoded secret" in titles
    assert "Potential infinite loop" in titles
    assert any("eval()" in item for item in result["security"])
    assert result["score"] < 92


def test_fallback_review_clean_code_scores_high():
    result = fallback_review("def add(a, b):\n    return a + b", "python")
    assert result["bugs"] == []
    assert result["score"] == 92


def test_fallback_review_reports_correct_line_number():
    result = fallback_review("print('ok')\neval('1')", "python")
    assert result["bugs"][0]["line"] == 2


def test_review_code_falls_back_without_provider():
    with patch("app.reviewer.get_settings", return_value=NO_PROVIDER):
        result = review_code("print('hi')", "python")
    assert result["score"] == 92
    assert "provider_notice" not in result


def test_generate_tests_python_template_without_provider():
    with patch("app.reviewer.get_settings", return_value=NO_PROVIDER):
        tests = generate_tests("def add(a, b):\n    return a + b", "python")
    assert "def test_" in tests
    assert "pytest" in tests
