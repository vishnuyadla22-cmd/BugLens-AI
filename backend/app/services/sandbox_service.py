import os
import shutil
import subprocess
import sys
import tempfile
import time
from typing import Optional, Tuple
from backend.app.core.config import settings
from backend.app.schemas.analysis import SupportedLanguage
from backend.app.schemas.execution import (
    ExecutionStatus,
    ExecuteResponse,
    OutputComparison,
)


class SandboxService:
    def __init__(self):
        self._cpp_compiler_path = shutil.which("g++") or shutil.which("clang++")

    def is_cpp_available(self) -> bool:
        return self._cpp_compiler_path is not None

    def get_compiler_info(self) -> str:
        if not self._cpp_compiler_path:
            return "No C++ compiler detected on system PATH"
        try:
            res = subprocess.run(
                [self._cpp_compiler_path, "--version"],
                capture_output=True,
                text=True,
                timeout=3.0,
            )
            return res.stdout.splitlines()[0] if res.stdout else "g++ (available)"
        except Exception:
            return "g++ (detected)"

    def compare_outputs(
        self, actual: str, expected: Optional[str]
    ) -> Optional[OutputComparison]:
        if expected is None:
            return None

        # Exact match check
        if actual == expected:
            return OutputComparison(
                is_match=True,
                is_exact_match=True,
                is_formatting_difference_only=False,
                details="Exact match! Actual output matches expected output character-for-character.",
                actual_trimmed=actual[:200],
                expected_trimmed=expected[:200],
            )

        # Normalize line endings and strip trailing whitespaces per line
        actual_lines = [line.rstrip() for line in actual.replace("\r\n", "\n").rstrip().split("\n")]
        expected_lines = [line.rstrip() for line in expected.replace("\r\n", "\n").rstrip().split("\n")]

        normalized_actual = "\n".join(actual_lines)
        normalized_expected = "\n".join(expected_lines)

        if normalized_actual == normalized_expected:
            return OutputComparison(
                is_match=True,
                is_exact_match=False,
                is_formatting_difference_only=True,
                details=(
                    "Output logically matches! However, there is a minor formatting difference "
                    "(e.g., extra trailing space or trailing newline)."
                ),
                actual_trimmed=actual[:200],
                expected_trimmed=expected[:200],
            )

        # Genuine mismatch: find first mismatched line
        mismatch_line = 1
        for i, (act_l, exp_l) in enumerate(zip(actual_lines, expected_lines)):
            if act_l != exp_l:
                mismatch_line = i + 1
                break
        else:
            mismatch_line = min(len(actual_lines), len(expected_lines)) + 1

        return OutputComparison(
            is_match=False,
            is_exact_match=False,
            is_formatting_difference_only=False,
            details=f"Output mismatch detected at line {mismatch_line}.",
            actual_trimmed=actual[:200],
            expected_trimmed=expected[:200],
        )

    def _sanitize_env(self) -> dict:
        """Strip sensitive secrets from child process environment."""
        safe_keys = {
            "PATH",
            "SYSTEMROOT",
            "TEMP",
            "TMP",
            "COMSPEC",
            "PATHEXT",
            "WINDIR",
            "USERPROFILE",
        }
        return {k: v for k, v in os.environ.items() if k.upper() in safe_keys}

    def execute_python(
        self,
        code: str,
        custom_input: str = "",
        expected_output: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> ExecuteResponse:
        timeout_seconds = timeout or settings.SANDBOX_EXECUTION_TIMEOUT_SECONDS
        start_time = time.perf_counter()

        with tempfile.TemporaryDirectory(prefix="buglens_py_") as temp_dir:
            script_path = os.path.join(temp_dir, "solution.py")
            try:
                with open(script_path, "w", encoding="utf-8") as f:
                    f.write(code)
            except Exception as e:
                return ExecuteResponse(
                    status=ExecutionStatus.SANDBOX_ERROR,
                    exit_code=1,
                    stdout="",
                    stderr=f"Failed to prepare script: {str(e)}",
                    execution_time_ms=0.0,
                    timed_out=False,
                )

            # Python flags:
            # -I : Run in isolated mode (ignores PYTHONPATH and PYTHONHOME)
            # -B : Don't write .pyc files
            # -s : Don't add user site-packages
            cmd = [sys.executable, "-I", "-B", "-s", script_path]
            env = self._sanitize_env()

            try:
                proc = subprocess.run(
                    cmd,
                    input=custom_input,
                    capture_output=True,
                    text=True,
                    timeout=timeout_seconds,
                    cwd=temp_dir,
                    env=env,
                )
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0

                stdout = proc.stdout[: settings.SANDBOX_MAX_OUTPUT_BYTES]
                stderr = proc.stderr[: settings.SANDBOX_MAX_OUTPUT_BYTES]

                if proc.returncode == 0:
                    status = ExecutionStatus.SUCCESS
                else:
                    status = ExecutionStatus.RUNTIME_ERROR

                comparison = self.compare_outputs(stdout, expected_output)

                return ExecuteResponse(
                    status=status,
                    exit_code=proc.returncode,
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=False,
                    comparison=comparison,
                )

            except subprocess.TimeoutExpired:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return ExecuteResponse(
                    status=ExecutionStatus.TIMEOUT,
                    exit_code=-1,
                    stdout="",
                    stderr=f"Execution timed out after {timeout_seconds:.1f} seconds. Check for infinite loops or high complexity.",
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=True,
                    comparison=self.compare_outputs("", expected_output),
                )
            except Exception as e:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return ExecuteResponse(
                    status=ExecutionStatus.SANDBOX_ERROR,
                    exit_code=1,
                    stdout="",
                    stderr=f"Sandbox execution error: {str(e)}",
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=False,
                )

    def execute_cpp(
        self,
        code: str,
        custom_input: str = "",
        expected_output: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> ExecuteResponse:
        if not self._cpp_compiler_path:
            return ExecuteResponse(
                status=ExecutionStatus.SANDBOX_ERROR,
                exit_code=1,
                stdout="",
                stderr="C++ compiler ('g++') was not found on this server. Please install GCC or configure g++ in PATH.",
                execution_time_ms=0.0,
                timed_out=False,
            )

        timeout_seconds = timeout or settings.SANDBOX_EXECUTION_TIMEOUT_SECONDS
        start_time = time.perf_counter()

        with tempfile.TemporaryDirectory(prefix="buglens_cpp_") as temp_dir:
            src_path = os.path.join(temp_dir, "solution.cpp")
            exe_name = "solution.exe" if sys.platform == "win32" else "solution.out"
            exe_path = os.path.join(temp_dir, exe_name)

            try:
                with open(src_path, "w", encoding="utf-8") as f:
                    f.write(code)
            except Exception as e:
                return ExecuteResponse(
                    status=ExecutionStatus.SANDBOX_ERROR,
                    exit_code=1,
                    stdout="",
                    stderr=f"Failed to write C++ source file: {str(e)}",
                    execution_time_ms=0.0,
                    timed_out=False,
                )

            # Compilation step (allow up to 12s compile timeout)
            compile_cmd = [
                self._cpp_compiler_path,
                "-O2",
                "-std=c++14",
                "-Wall",
                src_path,
                "-o",
                exe_path,
            ]
            env = self._sanitize_env()

            try:
                compile_proc = subprocess.run(
                    compile_cmd,
                    capture_output=True,
                    text=True,
                    timeout=12.0,
                    cwd=temp_dir,
                    env=env,
                )
            except subprocess.TimeoutExpired:
                return ExecuteResponse(
                    status=ExecutionStatus.COMPILATION_ERROR,
                    exit_code=1,
                    stdout="",
                    stderr="Compilation timed out after 12 seconds. Check for extensive template expansions or macros.",
                    execution_time_ms=0.0,
                    timed_out=True,
                )
            except Exception as e:
                return ExecuteResponse(
                    status=ExecutionStatus.SANDBOX_ERROR,
                    exit_code=1,
                    stdout="",
                    stderr=f"Compilation error: {str(e)}",
                    execution_time_ms=0.0,
                    timed_out=False,
                )

            if compile_proc.returncode != 0:
                elapsed_ms = (time.perf_counter() - start_time) * 1000.0
                return ExecuteResponse(
                    status=ExecutionStatus.COMPILATION_ERROR,
                    exit_code=compile_proc.returncode,
                    stdout="",
                    stderr=compile_proc.stderr[: settings.SANDBOX_MAX_OUTPUT_BYTES],
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=False,
                )

            # Execution step
            exec_start = time.perf_counter()
            try:
                run_proc = subprocess.run(
                    [exe_path],
                    input=custom_input,
                    capture_output=True,
                    text=True,
                    timeout=timeout_seconds,
                    cwd=temp_dir,
                    env=env,
                )
                elapsed_ms = (time.perf_counter() - exec_start) * 1000.0

                stdout = run_proc.stdout[: settings.SANDBOX_MAX_OUTPUT_BYTES]
                stderr = run_proc.stderr[: settings.SANDBOX_MAX_OUTPUT_BYTES]

                if run_proc.returncode == 0:
                    status = ExecutionStatus.SUCCESS
                else:
                    status = ExecutionStatus.RUNTIME_ERROR

                comparison = self.compare_outputs(stdout, expected_output)

                return ExecuteResponse(
                    status=status,
                    exit_code=run_proc.returncode,
                    stdout=stdout,
                    stderr=stderr,
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=False,
                    comparison=comparison,
                )

            except subprocess.TimeoutExpired:
                elapsed_ms = (time.perf_counter() - exec_start) * 1000.0
                return ExecuteResponse(
                    status=ExecutionStatus.TIMEOUT,
                    exit_code=-1,
                    stdout="",
                    stderr=f"Execution timed out after {timeout_seconds:.1f} seconds. Check for infinite loops or excessive operations.",
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=True,
                    comparison=self.compare_outputs("", expected_output),
                )
            except Exception as e:
                elapsed_ms = (time.perf_counter() - exec_start) * 1000.0
                return ExecuteResponse(
                    status=ExecutionStatus.SANDBOX_ERROR,
                    exit_code=1,
                    stdout="",
                    stderr=f"Process execution error: {str(e)}",
                    execution_time_ms=round(elapsed_ms, 2),
                    timed_out=False,
                )

    def execute(
        self,
        language: SupportedLanguage,
        code: str,
        custom_input: str = "",
        expected_output: Optional[str] = None,
        timeout: Optional[float] = None,
    ) -> ExecuteResponse:
        if language == SupportedLanguage.PYTHON:
            return self.execute_python(code, custom_input, expected_output, timeout)
        elif language == SupportedLanguage.CPP:
            return self.execute_cpp(code, custom_input, expected_output, timeout)
        else:
            return ExecuteResponse(
                status=ExecutionStatus.SANDBOX_ERROR,
                exit_code=1,
                stdout="",
                stderr=f"Unsupported language: {language}",
                execution_time_ms=0.0,
                timed_out=False,
            )


sandbox_service = SandboxService()
