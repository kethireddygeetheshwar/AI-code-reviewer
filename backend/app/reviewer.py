import json
from typing import Any
from .config import get_settings

SYSTEM_PROMPT = """You are ReviewLens, a rigorous yet encouraging senior software engineer. Review only the provided code. Return valid JSON with exactly these keys: summary (string), score (integer 0-100), metrics (object with maintainability, readability, efficiency, security, best_practices integers 0-100), bugs (array of {severity: Critical|Major|Minor, title, explanation, line}), optimizations (array of strings), explanation (object with purpose string, functions array of strings, logic array of strings), security (array of strings), complexity (object with time, space, explanation), improved_code (string), improvements (array of strings). Make useful beginner-friendly recommendations. Never include markdown fences in JSON values."""


def fallback_review(code: str, language: str) -> dict[str, Any]:
    flags, security, bugs = [], [], []
    checks = [("eval(", "Dangerous eval()", "Avoid eval(): it can execute arbitrary code.", "Critical"), ("password =", "Hardcoded secret", "Move credentials to environment variables.", "Major"), ("while True", "Potential infinite loop", "Ensure the loop has a reachable exit condition.", "Major")]
    for needle, title, detail, severity in checks:
        if needle in code:
            line = code[:code.index(needle)].count("\n") + 1
            bugs.append({"severity": severity, "title": title, "explanation": detail, "line": line})
            security.append(detail)
    score = max(45, 92 - len(bugs) * 12)
    return {"summary": "A local baseline review was generated. Configure an AI provider for a deeper, context-aware analysis.", "score": score, "metrics": {"maintainability": score, "readability": max(40, score - 4), "efficiency": max(40, score - 6), "security": max(30, score - len(security) * 8), "best_practices": max(40, score - 3)}, "bugs": bugs, "optimizations": ["Use descriptive names and small, single-purpose functions.", "Add type hints and tests for important paths."], "explanation": {"purpose": f"This {language} snippet is ready for an AI-assisted review.", "functions": ["Review the function inputs, outputs, and side effects."], "logic": ["Follow the control flow from top to bottom and handle invalid input early."]}, "security": security or ["No obvious insecure pattern was detected by the baseline checks."], "complexity": {"time": "Depends on the primary loop", "space": "Depends on stored collections", "explanation": "An AI provider can infer exact complexity from the code structure."}, "improved_code": code, "improvements": ["Add documentation and validation."]}


def _parse_json(value: str) -> dict[str, Any]:
    text = value.strip().removeprefix("```json").removeprefix("```").removesuffix("```").strip()
    data = json.loads(text)
    required = {"summary", "score", "metrics", "bugs", "optimizations", "explanation", "security", "complexity", "improved_code", "improvements"}
    if not required.issubset(data):
        raise ValueError("AI response was incomplete")
    return data


def review_code(code: str, language: str, focus: str = "balanced") -> dict[str, Any]:
    settings = get_settings()
    prompt = f"Review focus: {focus}. Adapt priorities accordingly.\nLanguage: {language}\n\nCode:\n{code}"
    try:
        if settings.ai_provider.lower() == "openai" and settings.openai_api_key:
            from openai import OpenAI
            response = OpenAI(api_key=settings.openai_api_key).chat.completions.create(model=settings.openai_model, response_format={"type": "json_object"}, messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}])
            return _parse_json(response.choices[0].message.content or "{}")
        if settings.groq_api_key:
            from groq import Groq
            response = Groq(api_key=settings.groq_api_key).chat.completions.create(model=settings.groq_model, response_format={"type": "json_object"}, messages=[{"role": "system", "content": SYSTEM_PROMPT}, {"role": "user", "content": prompt}])
            return _parse_json(response.choices[0].message.content or "{}")
    except Exception as exc:
        result = fallback_review(code, language)
        result["provider_notice"] = f"AI provider unavailable: {str(exc)[:120]}. Showing baseline review."
        return result
    return fallback_review(code, language)


def generate_tests(code: str, language: str) -> str:
    settings = get_settings()
    prompt = f"Generate a small, runnable test suite for this {language} code. Cover normal inputs, edge cases, and failure cases. Return only code, no markdown.\n\n{code}"
    if not (settings.groq_api_key or settings.openai_api_key):
        if language == "python":
            return "# Add pytest cases here\ndef test_happy_path():\n    # Arrange, Act, Assert\n    assert True\n\ndef test_edge_case():\n    assert True\n"
        return "// Configure an AI provider to generate language-specific tests.\n// Include happy-path, boundary, and failure cases."
    try:
        if settings.ai_provider.lower() == "openai" and settings.openai_api_key:
            from openai import OpenAI
            response = OpenAI(api_key=settings.openai_api_key).chat.completions.create(model=settings.openai_model, messages=[{"role":"system","content":"You are a testing expert. Return only runnable test code."},{"role":"user","content":prompt}])
        else:
            from groq import Groq
            response = Groq(api_key=settings.groq_api_key).chat.completions.create(model=settings.groq_model, messages=[{"role":"system","content":"You are a testing expert. Return only runnable test code."},{"role":"user","content":prompt}])
        return (response.choices[0].message.content or "").replace("```python", "").replace("```", "").strip()
    except Exception as exc:
        return f"# Test generation is temporarily unavailable: {str(exc)[:120]}"


def answer_question(question: str, code: str, language: str, context: dict | None) -> str:
    settings = get_settings()
    if not (settings.groq_api_key or settings.openai_api_key):
        return "Add GROQ_API_KEY or OPENAI_API_KEY to enable follow-up AI questions. The baseline review is still available."
    prompt = f"Language: {language}\nCode:\n{code}\n\nReview context: {json.dumps(context or {})}\n\nQuestion: {question}"
    try:
        if settings.ai_provider.lower() == "openai" and settings.openai_api_key:
            from openai import OpenAI
            r = OpenAI(api_key=settings.openai_api_key).chat.completions.create(model=settings.openai_model, messages=[{"role": "system", "content": "Answer code-review questions concisely and helpfully."}, {"role": "user", "content": prompt}])
        else:
            from groq import Groq
            r = Groq(api_key=settings.groq_api_key).chat.completions.create(model=settings.groq_model, messages=[{"role": "system", "content": "Answer code-review questions concisely and helpfully."}, {"role": "user", "content": prompt}])
        return r.choices[0].message.content or "I could not generate an answer."
    except Exception as exc:
        return f"The AI assistant is temporarily unavailable ({str(exc)[:100]})."
