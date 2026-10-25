import pytest
from unittest.mock import AsyncMock, MagicMock, patch
import httpx
from fastapi import HTTPException
from groq import AuthenticationError, RateLimitError

from backend.app.schemas.analysis import (
    AnalysisMode,
    AnalyzeRequest,
    SupportedLanguage,
)
from backend.app.services.ai_service import AIService


@pytest.fixture
def ai_service_instance():
    return AIService()


@pytest.mark.asyncio
async def test_check_status_no_api_key(ai_service_instance):
    with patch.object(ai_service_instance, "_get_api_key", return_value=None):
        status = await ai_service_instance.check_status()
        assert status.connected is False
        assert status.model_available is False
        assert status.setup_instructions is not None
        assert any("GROQ_API_KEY" in s for s in status.setup_instructions)


@pytest.mark.asyncio
async def test_check_status_connected_model_available(ai_service_instance):
    mock_client = AsyncMock()
    mock_model1 = MagicMock()
    mock_model1.id = "llama-3.3-70b-versatile"
    mock_model2 = MagicMock()
    mock_model2.id = "llama-3.1-8b-instant"

    mock_models_response = MagicMock()
    mock_models_response.data = [mock_model1, mock_model2]
    mock_client.models.list.return_value = mock_models_response

    with patch.object(ai_service_instance, "_get_api_key", return_value="gsk_valid_key"):
        with patch.object(ai_service_instance, "_get_client", return_value=mock_client):
            status = await ai_service_instance.check_status()
            assert status.connected is True
            assert status.model_available is True
            assert "llama-3.3-70b-versatile" in status.available_models
            assert "connected and ready" in status.message


@pytest.mark.asyncio
async def test_check_status_connected_model_missing(ai_service_instance):
    mock_client = AsyncMock()
    mock_model = MagicMock()
    mock_model.id = "different-model-only"

    mock_models_response = MagicMock()
    mock_models_response.data = [mock_model]
    mock_client.models.list.return_value = mock_models_response

    with patch.object(ai_service_instance, "_get_api_key", return_value="gsk_valid_key"):
        with patch.object(ai_service_instance, "_get_client", return_value=mock_client):
            status = await ai_service_instance.check_status()
            assert status.connected is True
            assert status.model_available is False
            assert status.setup_instructions is not None


@pytest.mark.asyncio
async def test_check_status_auth_error(ai_service_instance):
    req = httpx.Request("GET", "https://api.groq.com/openai/v1/models")
    resp = httpx.Response(401, request=req)
    auth_err = AuthenticationError("Invalid API key", response=resp, body={"error": "invalid_api_key"})

    mock_client = AsyncMock()
    mock_client.models.list.side_effect = auth_err

    with patch.object(ai_service_instance, "_get_api_key", return_value="gsk_bad_key"):
        with patch.object(ai_service_instance, "_get_client", return_value=mock_client):
            status = await ai_service_instance.check_status()
            assert status.connected is False
            assert status.model_available is False
            assert "authentication failed" in status.message.lower()


@pytest.mark.asyncio
async def test_analyze_when_disconnected(ai_service_instance):
    req = AnalyzeRequest(
        language=SupportedLanguage.PYTHON,
        problem_statement="Calculate factorial of N",
        code="def fact(n): return n * fact(n-1)",
        analysis_mode=AnalysisMode.FIND_ERROR,
    )

    with patch.object(ai_service_instance, "_get_api_key", return_value=None):
        with pytest.raises(HTTPException) as exc_info:
            await ai_service_instance.analyze(req)
        assert exc_info.value.status_code == 503
        assert exc_info.value.detail["error"] == "GROQ_DISCONNECTED"


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

    mock_client = AsyncMock()
    mock_model = MagicMock()
    mock_model.id = "llama-3.3-70b-versatile"
    mock_models_response = MagicMock()
    mock_models_response.data = [mock_model]
    mock_client.models.list.return_value = mock_models_response

    mock_choice = MagicMock()
    mock_choice.message.content = ai_json_output
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_completion

    with patch.object(ai_service_instance, "_get_api_key", return_value="gsk_valid_key"):
        with patch.object(ai_service_instance, "_get_client", return_value=mock_client):
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
            assert res.model_used == "llama-3.3-70b-versatile"


@pytest.mark.asyncio
async def test_analyze_markdown_wrapped_json(ai_service_instance):
    """Test when Groq wraps json in ```json ... ``` code fence."""
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

    mock_client = AsyncMock()
    mock_model = MagicMock()
    mock_model.id = "llama-3.3-70b-versatile"
    mock_models_response = MagicMock()
    mock_models_response.data = [mock_model]
    mock_client.models.list.return_value = mock_models_response

    mock_choice = MagicMock()
    mock_choice.message.content = wrapped_content
    mock_completion = MagicMock()
    mock_completion.choices = [mock_choice]
    mock_client.chat.completions.create.return_value = mock_completion

    with patch.object(ai_service_instance, "_get_api_key", return_value="gsk_valid_key"):
        with patch.object(ai_service_instance, "_get_client", return_value=mock_client):
            res = await ai_service_instance.analyze(req)
            assert "Potential Edge-Case Failure" in res.error_classifications
            assert res.suggested_fixes[0].fixed_snippet == "int mid = l + (r - l) / 2;"


@pytest.mark.asyncio
async def test_analyze_rate_limit(ai_service_instance):
    req = AnalyzeRequest(
        language=SupportedLanguage.PYTHON,
        problem_statement="Problem statement",
        code="x = 1",
        analysis_mode=AnalysisMode.FIND_ERROR,
    )

    h_req = httpx.Request("POST", "https://api.groq.com/openai/v1/chat/completions")
    h_resp = httpx.Response(429, request=h_req)
    rate_err = RateLimitError("Rate limit reached", response=h_resp, body={"error": "rate_limit"})

    mock_client = AsyncMock()
    mock_model = MagicMock()
    mock_model.id = "llama-3.3-70b-versatile"
    mock_models_response = MagicMock()
    mock_models_response.data = [mock_model]
    mock_client.models.list.return_value = mock_models_response
    mock_client.chat.completions.create.side_effect = rate_err

    with patch.object(ai_service_instance, "_get_api_key", return_value="gsk_valid_key"):
        with patch.object(ai_service_instance, "_get_client", return_value=mock_client):
            with pytest.raises(HTTPException) as exc_info:
                await ai_service_instance.analyze(req)
            assert exc_info.value.status_code == 429
            assert exc_info.value.detail["error"] == "GROQ_RATE_LIMIT"
