from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field
from backend.app.schemas.analysis import SupportedLanguage


class ExecutionStatus(str, Enum):
    SUCCESS = "success"
    COMPILATION_ERROR = "compilation_error"
    RUNTIME_ERROR = "runtime_error"
    TIMEOUT = "timeout"
    SANDBOX_ERROR = "error"


class OutputComparison(BaseModel):
    is_match: bool = Field(..., description="Whether actual matches expected exactly or within whitespace normalization")
    is_exact_match: bool = Field(..., description="Strict character-by-character match")
    is_formatting_difference_only: bool = Field(
        default=False,
        description="True if output differs only in trailing whitespaces, newlines, or line ending style"
    )
    details: str = Field(..., description="Human explanation of match or discrepancy")
    actual_trimmed: str = Field(..., description="Actual output trimmed for preview")
    expected_trimmed: str = Field(..., description="Expected output trimmed for preview")


class ExecuteRequest(BaseModel):
    language: SupportedLanguage = Field(..., description="Programming language: cpp or python")
    code: str = Field(..., min_length=1, description="Source code to execute in sandbox")
    custom_input: Optional[str] = Field(default="", description="Standard input (stdin) to provide")
    expected_output: Optional[str] = Field(default=None, description="Optional expected output to compare against")


class ExecuteResponse(BaseModel):
    status: ExecutionStatus = Field(..., description="Overall execution status")
    exit_code: Optional[int] = Field(default=None, description="Process exit code (0 = success)")
    stdout: str = Field(default="", description="Standard output captured from the program")
    stderr: str = Field(default="", description="Standard error or compiler error message")
    execution_time_ms: float = Field(..., description="Execution time in milliseconds")
    timed_out: bool = Field(default=False, description="Whether execution was terminated due to timeout")
    comparison: Optional[OutputComparison] = Field(default=None, description="Comparison against expected output if provided")
    disclaimer: str = Field(
        default="Execution in isolated sandbox. Passing sample test cases does not guarantee complete algorithmic correctness.",
        description="Educational disclaimer"
    )
