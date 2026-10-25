from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator


class SupportedLanguage(str, Enum):
    CPP = "cpp"
    PYTHON = "python"


class AnalysisMode(str, Enum):
    FIND_ERROR = "find_error"        # "Find My Error": Syntax, compilation, runtime, and logical bugs
    WHY_WRONG = "why_wrong"          # "Why Is My Answer Wrong?": WA, algorithmic mistakes, edge cases, requirement mismatches


class AnalyzeRequest(BaseModel):
    language: SupportedLanguage = Field(..., description="Programming language: cpp or python")
    problem_statement: str = Field(..., min_length=5, description="Full problem description")
    code: str = Field(..., min_length=1, description="Source code written by user")
    custom_input: Optional[str] = Field(default=None, description="Optional custom test input")
    actual_output: Optional[str] = Field(default=None, description="Optional actual program output received")
    expected_output: Optional[str] = Field(default=None, description="Optional expected output")
    error_message: Optional[str] = Field(default=None, description="Optional compiler or runtime error message")
    analysis_mode: AnalysisMode = Field(default=AnalysisMode.FIND_ERROR, description="Analysis mode")

    @field_validator("problem_statement")
    @classmethod
    def validate_problem_statement(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Problem statement cannot be empty or purely whitespace.")
        return trimmed

    @field_validator("code")
    @classmethod
    def validate_code(cls, v: str) -> str:
        trimmed = v.strip()
        if not trimmed:
            raise ValueError("Code cannot be empty or purely whitespace.")
        return trimmed


class ErrorClassification(str, Enum):
    SYNTAX_ERROR = "Syntax Error"
    COMPILATION_ERROR = "Compilation Error"
    RUNTIME_ERROR = "Runtime Error"
    LOGICAL_ERROR = "Logical Error"
    ALGORITHMIC_COMPLEXITY = "Algorithmic or Complexity Issue"
    EDGE_CASE_FAILURE = "Potential Edge-Case Failure"
    NO_OBVIOUS_ISSUE = "No Obvious Issue Found"
    INSUFFICIENT_INFORMATION = "Insufficient Information"


class ErrorLocation(BaseModel):
    line_number: Optional[int] = Field(default=None, description="Line number of error, 1-indexed, if identifiable")
    snippet: Optional[str] = Field(default=None, description="The specific code snippet containing the bug")
    explanation: str = Field(..., description="Why this specific line or block is problematic")


class SuggestedFix(BaseModel):
    target_line_start: Optional[int] = Field(default=None, description="Start line for minimal fix, 1-indexed")
    target_line_end: Optional[int] = Field(default=None, description="End line for minimal fix, 1-indexed")
    original_snippet: Optional[str] = Field(default=None, description="Current buggy snippet to replace")
    fixed_snippet: str = Field(..., description="Minimal corrected replacement snippet")
    explanation: str = Field(..., description="Why this fix resolves the issue")


class TestCaseSuggestion(BaseModel):
    input: str = Field(..., description="Test input data")
    expected_output: Optional[str] = Field(default=None, description="Expected program output if determinable")
    reason: str = Field(..., description="Why this test case is insightful or catches the bug")
    is_edge_case: bool = Field(default=False, description="Whether this is an edge case (e.g. empty, bounds, zeroes)")
    executed: bool = Field(default=False, description="Whether this test case was verified in sandbox execution")


class ComplexityAnalysis(BaseModel):
    time_complexity: str = Field(..., description="Estimated time complexity in Big-O notation, e.g., O(N log N)")
    space_complexity: str = Field(..., description="Estimated auxiliary space complexity, e.g., O(N)")
    verdict: str = Field(..., description="Suitability verdict, e.g. 'Optimal', 'Likely Time Limit Exceeded on N >= 10^5'")
    explanation: str = Field(..., description="Explanation of complexity and loop/memory structure")


class AnalyzeResponse(BaseModel):
    overall_assessment: str = Field(..., description="High-level summary of the analysis")
    error_classifications: List[str] = Field(..., description="List of detected error classification categories")
    error_locations: List[ErrorLocation] = Field(default_factory=list, description="Specific error locations identified")
    explanation: str = Field(..., description="Comprehensive beginner-friendly explanation of the issues")
    suggested_fixes: List[SuggestedFix] = Field(default_factory=list, description="Minimal surgical fixes")
    corrected_code: Optional[str] = Field(default=None, description="Full corrected code if enough information exists")
    test_suggestions: List[TestCaseSuggestion] = Field(default_factory=list, description="Insightful test cases")
    complexity_analysis: Optional[ComplexityAnalysis] = Field(default=None, description="Estimated time and space complexity")
    learning_tip: str = Field(..., description="Underlying concept and advice to prevent similar bugs")
    verification_status: str = Field(
        default="AI Analysis (Unverified - Run in Sandbox to verify execution)",
        description="Explicit notice stating whether this analysis is unverified AI output or verified by execution"
    )
    confidence: str = Field(default="high", description="Model confidence: 'high', 'medium', 'low', or 'uncertain'")
    model_used: str = Field(..., description="Name of the open-weight model that performed inference")
    analysis_mode: AnalysisMode = Field(..., description="The mode in which the analysis was conducted")
