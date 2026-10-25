import pytest
from unittest.mock import patch
import httpx
from fastapi import HTTPException
from app.schemas.analysis import (
    AnalysisMode,
    AnalyzeRequest,
    SupportedLanguage,
)
from app.services.ai_service import AIService


@pytest.fixture
def ai_service_instance():
    return AIService()


@pytest.mark.asyncio
async def test_check_status_offline(ai_service_instance):
    def mock_handler(request: httpx.Request):
        raise httpx.ConnectError("Connection refused")

    transport = httpx.MockTransport(mock_handler)
    with patch.object(
        ai_service_instance,
        "_get_client",
        side_effect=lambda timeout=None: httpx.AsyncClient(transport=transport),
    ):
        status = await ai_service_instance.check_status()
        assert status.connected is False
        assert status.model_available is False
        assert status.setup_instructions is not None
        assert any("ollama serve" in s.lower() for s in status.setup_instructions)


@pytest.mark.asyncio
async def test_check_status_model_available(ai_service_instance):
    def mock_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={"models": [{"name": "qwen2.5-coder:7b"}, {"name": "llama3:latest"}]},
        )

    transport = httpx.MockTransport(mock_handler)
    with patch.object(
        ai_service_instance,
        "_get_client",
        side_effect=lambda timeout=None: httpx.AsyncClient(transport=transport),
    ):
        status = await ai_service_instance.check_status()
        assert status.connected is True
        assert status.model_available is True
        assert "qwen2.5-coder:7b" in status.available_models


@pytest.mark.asyncio
async def test_check_status_model_missing(ai_service_instance):
    def mock_handler(request: httpx.Request):
        return httpx.Response(
            200,
            json={"models": [{"name": "mistral:latest"}]},
        )

    transport = httpx.MockTransport(mock_handler)
    with patch.object(
        ai_service_instance,
        "_get_client",
        side_effect=lambda timeout=None: httpx.AsyncClient(transport=transport),
    ):
        status = await ai_service_instance.check_status()
        assert status.connected is True
        assert status.model_available is False
        assert status.setup_instructions is not None
        assert any("ollama pull" in s.lower() for s in status.setup_instructions)


@pytest.mark.asyncio
async def test_analyze_when_ollama_offline(ai_service_instance):
    req = AnalyzeRequest(
        language=SupportedLanguage.PYTHON,
        problem_statement="Calculate factorial of N",
        code="def fact(n): return n * fact(n-1)",
        analysis_mode=AnalysisMode.FIND_ERROR,
    )

    def mock_handler(request: httpx.Request):
        raise httpx.ConnectError("Connection refused")

    transport = httpx.MockTransport(mock_handler)
    with patch.object(
        ai_service_instance,
        "_get_client",
        side_effect=lambda timeout=None: httpx.AsyncClient(transport=transport),
    ):
        with pytest.raises(HTTPException) as exc_info:
            await ai_service_instance.analyze(req)
        assert exc_info.value.status_code == 503
        assert exc_info.value.detail["error"] == "OLLAMA_DISCONNECTED"


@pytest.mark.asyncio
async def test_analyze_success_parsing(ai_service_instance):
    req = AnalyzeRequest(
        language=SupportedLanguage.PYTHON,
        problem_statement="Calculate factorial of N",
        code="def fact(n): return n * fact(n-1)",
        analysis_mode=AnalysisMode.FIND_ERROR,
    )

    ai_json_output = """
    {
      "overall_assessment": "Infinite recursion detected: missing base case for n <= 1.",
      "error_classifications": ["Runtime Error", "Logical Error"],
      "error_locations": [
        {
          "line_number": 1,
          "snippet": "def fact(n): return n * fact(n-1)",
          "explanation": "No termination condition when n reaches 0 or 1, causing RecursionError."
        }
      ],
      "explanation": "In recursive functions, you must always provide a base condition to terminate recursion.",
      "suggested_fixes": [
        {
          "target_line_start": 1,
          "target_line_end": 1,
          "original_snippet": "def fact(n): return n * fact(n-1)",
          "fixed_snippet": "def fact(n):\\n    if n <= 1: return 1\\n    return n * fact(n - 1)",
          "explanation": "Add base case when n <= 1"
        }
      ],
      "corrected_code": "def fact(n):\\n    if n <= 1:\\n        return 1\\n    return n * fact(n - 1)",
      "test_suggestions": [
        {
          "input": "0",
          "expected_output": "1",
          "reason": "Verify boundary base case for 0",
          "is_edge_case": true
        }
      ],
      "complexity_analysis": {
        "time_complexity": "O(N)",
        "space_complexity": "O(N)",
        "verdict": "Optimal",
        "explanation": "N recursive stack frames"
      },
      "learning_tip": "Always define base cases first before writing the recursive step.",
      "confidence": "high"
    }
    """

    def mock_handler(request: httpx.Request):
        url_str = str(request.url)
        if "/api/tags" in url_str:
            return httpx.Response(200, json={"models": [{"name": "qwen2.5-coder:7b"}]})
        elif "/api/chat" in url_str:
            return httpx.Response(200, json={"message": {"content": ai_json_output}})
        return httpx.Response(404)

    transport = httpx.MockTransport(mock_handler)
    with patch.object(
        ai_service_instance,
        "_get_client",
        side_effect=lambda timeout=None: httpx.AsyncClient(transport=transport),
    ):
        res = await ai_service_instance.analyze(req)
        assert res.overall_assessment.startswith("Infinite recursion")
        assert "Runtime Error" in res.error_classifications
        assert len(res.error_locations) == 1
        assert res.error_locations[0].line_number == 1
        assert len(res.suggested_fixes) == 1
        assert res.suggested_fixes[0].fixed_snippet is not None
        assert res.complexity_analysis is not None
        assert res.complexity_analysis.time_complexity == "O(N)"
        assert len(res.test_suggestions) == 1
        assert res.test_suggestions[0].is_edge_case is True


@pytest.mark.asyncio
async def test_analyze_markdown_wrapped_json(ai_service_instance):
    """Test when Ollama wraps json in ```json ... ``` code fence."""
    req = AnalyzeRequest(
        language=SupportedLanguage.CPP,
        problem_statement="Binary search in array",
        code="int mid = (l + r) / 2;",
        analysis_mode=AnalysisMode.WHY_WRONG,
    )

    wrapped_content = """```json
    {
      "overall_assessment": "Potential integer overflow on large indices.",
      "error_classifications": ["Potential Edge-Case Failure"],
      "error_locations": [
        {
          "line_number": 1,
          "snippet": "int mid = (l + r) / 2;",
          "explanation": "If l + r > INT_MAX, overflow occurs."
        }
      ],
      "explanation": "Use l + (r - l) / 2 to avoid overflow.",
      "suggested_fixes": [
        {
          "fixed_snippet": "int mid = l + (r - l) / 2;",
          "explanation": "Safe midpoint calculation"
        }
      ],
      "learning_tip": "Prevent integer overflow using subtraction arithmetic."
    }
    ```"""

    def mock_handler(request: httpx.Request):
        url_str = str(request.url)
        if "/api/tags" in url_str:
            return httpx.Response(200, json={"models": [{"name": "qwen2.5-coder:7b"}]})
        elif "/api/chat" in url_str:
            return httpx.Response(200, json={"message": {"content": wrapped_content}})
        return httpx.Response(404)

    transport = httpx.MockTransport(mock_handler)
    with patch.object(
        ai_service_instance,
        "_get_client",
        side_effect=lambda timeout=None: httpx.AsyncClient(transport=transport),
    ):
        res = await ai_service_instance.analyze(req)
        assert "Potential Edge-Case Failure" in res.error_classifications
        assert res.suggested_fixes[0].fixed_snippet == "int mid = l + (r - l) / 2;"
