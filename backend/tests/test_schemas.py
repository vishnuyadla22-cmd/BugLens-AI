import pytest
from pydantic import ValidationError
try:
    from backend.app.schemas.analysis import (
        AnalysisMode,
        AnalyzeRequest,
        AnalyzeResponse,
        ComplexityAnalysis,
        ErrorLocation,
        SuggestedFix,
        SupportedLanguage,
        TestCaseSuggestion,
    )
    from backend.app.schemas.execution import (
        ExecuteRequest,
        ExecuteResponse,
        ExecutionStatus,
        OutputComparison,
    )
except ImportError:
    from app.schemas.analysis import (
        AnalysisMode,
        AnalyzeRequest,
        AnalyzeResponse,
        ComplexityAnalysis,
        ErrorLocation,
        SuggestedFix,
        SupportedLanguage,
        TestCaseSuggestion,
    )
    from app.schemas.execution import (
        ExecuteRequest,
        ExecuteResponse,
        ExecutionStatus,
        OutputComparison,
    )


def test_analyze_request_valid():
    req = AnalyzeRequest(
        language=SupportedLanguage.PYTHON,
        problem_statement="Find maximum in an array",
        code="def solve(arr): return max(arr)",
        analysis_mode=AnalysisMode.FIND_ERROR,
    )
    assert req.language == SupportedLanguage.PYTHON
    assert req.analysis_mode == AnalysisMode.FIND_ERROR
    assert req.code == "def solve(arr): return max(arr)"


def test_analyze_request_empty_code():
    with pytest.raises(ValidationError):
        AnalyzeRequest(
            language=SupportedLanguage.PYTHON,
            problem_statement="Problem statement here",
            code="   ",  # whitespace only
        )


def test_analyze_request_empty_problem():
    with pytest.raises(ValidationError):
        AnalyzeRequest(
            language=SupportedLanguage.CPP,
            problem_statement="",
            code="int main() { return 0; }",
        )


def test_analyze_request_invalid_language():
    with pytest.raises(ValidationError):
        AnalyzeRequest(
            language="java",  # unsupported
            problem_statement="Valid problem",
            code="System.out.println(1);",
        )


def test_analyze_response_serialization():
    resp = AnalyzeResponse(
        overall_assessment="Array index out of bounds detected.",
        error_classifications=["Runtime Error"],
        error_locations=[
            ErrorLocation(line_number=5, snippet="arr[i]", explanation="Accesses index i which exceeds len(arr)")
        ],
        explanation="The loop counter runs up to i <= len(arr), causing an IndexError on the last iteration.",
        suggested_fixes=[
            SuggestedFix(
                target_line_start=5,
                target_line_end=5,
                original_snippet="for i in range(len(arr) + 1):",
                fixed_snippet="for i in range(len(arr)):",
                explanation="Fix upper bound to prevent index overflow",
            )
        ],
        corrected_code="def solve(arr):\n    for i in range(len(arr)):\n        print(arr[i])",
        test_suggestions=[
            TestCaseSuggestion(
                input="[1, 2, 3]",
                expected_output="1\n2\n3",
                reason="Standard array to check bounds",
                is_edge_case=False,
            )
        ],
        complexity_analysis=ComplexityAnalysis(
            time_complexity="O(N)",
            space_complexity="O(1)",
            verdict="Optimal",
            explanation="Single linear loop traversal",
        ),
        learning_tip="Python ranges are half-open intervals [0, N). Never add +1 when traversing indices.",
        confidence="high",
        model_used="qwen2.5-coder:7b",
        analysis_mode=AnalysisMode.FIND_ERROR,
    )

    data = resp.model_dump()
    assert data["confidence"] == "high"
    assert len(data["error_locations"]) == 1
    assert data["complexity_analysis"]["time_complexity"] == "O(N)"


def test_execute_request_and_response():
    req = ExecuteRequest(
        language=SupportedLanguage.PYTHON,
        code="print('Hello World')",
        expected_output="Hello World\n",
    )
    assert req.language == SupportedLanguage.PYTHON

    resp = ExecuteResponse(
        status=ExecutionStatus.SUCCESS,
        exit_code=0,
        stdout="Hello World\n",
        stderr="",
        execution_time_ms=12.5,
        comparison=OutputComparison(
            is_match=True,
            is_exact_match=True,
            is_formatting_difference_only=False,
            details="Exact match",
            actual_trimmed="Hello World\n",
            expected_trimmed="Hello World\n",
        ),
    )
    assert resp.status == ExecutionStatus.SUCCESS
    assert resp.comparison.is_exact_match is True
