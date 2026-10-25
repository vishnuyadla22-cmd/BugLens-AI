import json
import re
from typing import Any, Dict, List, Optional
import httpx
from fastapi import HTTPException

from backend.app.core.config import settings
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
from backend.app.schemas.status import AIStatusResponse


class AIService:
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.configured_model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT_SECONDS

    def _get_client(self, timeout: Optional[float] = None) -> httpx.AsyncClient:
        return httpx.AsyncClient(timeout=timeout or self.timeout)

    async def check_status(self) -> AIStatusResponse:
        """Inspect whether Ollama daemon is reachable and if the configured model is installed."""
        try:
            async with self._get_client(timeout=3.0) as client:
                res = await client.get(f"{self.base_url}/api/tags")
                if res.status_code == 200:
                    data = res.json()
                    models = [m.get("name", "") for m in data.get("models", [])]
                    # Check exact or prefix match (e.g. "qwen2.5-coder:7b" or "qwen2.5-coder:latest")
                    model_found = any(
                        self.configured_model == m
                        or self.configured_model.split(":")[0] == m.split(":")[0]
                        for m in models
                    )

                    if model_found:
                        message = f"Ollama is connected and ready. Active model: '{self.configured_model}'."
                        setup_inst = None
                    else:
                        message = (
                            f"Ollama is running, but configured model '{self.configured_model}' is not installed locally. "
                            f"Discovered models: {', '.join(models) if models else 'None'}."
                        )
                        setup_inst = [
                            f"Open your terminal and run: ollama pull {self.configured_model}",
                            "Or configure an already installed model name in .env (OLLAMA_MODEL=...)",
                            "Click 'Check Status' in the header once the download completes.",
                        ]

                    return AIStatusResponse(
                        connected=True,
                        service_url=self.base_url,
                        configured_model=self.configured_model,
                        model_available=model_found,
                        available_models=models,
                        message=message,
                        setup_instructions=setup_inst,
                    )
                else:
                    return AIStatusResponse(
                        connected=False,
                        service_url=self.base_url,
                        configured_model=self.configured_model,
                        model_available=False,
                        available_models=[],
                        message=f"Ollama returned HTTP {res.status_code}: {res.text[:100]}",
                        setup_instructions=[
                            "Ensure Ollama server is running with 'ollama serve'",
                            "Verify network accessibility at " + self.base_url,
                        ],
                    )
        except httpx.ConnectError:
            return AIStatusResponse(
                connected=False,
                service_url=self.base_url,
                configured_model=self.configured_model,
                model_available=False,
                available_models=[],
                message="Cannot connect to Ollama service at " + self.base_url,
                setup_instructions=[
                    "Install Ollama from https://ollama.com/download if not already installed.",
                    "Start the Ollama daemon: run 'ollama serve' in your terminal or start the Ollama desktop app.",
                    f"Pull the recommended coding model: 'ollama pull {self.configured_model}'.",
                    "Verify the service is active by refreshing or clicking 'Check Status'.",
                ],
            )
        except Exception as e:
            return AIStatusResponse(
                connected=False,
                service_url=self.base_url,
                configured_model=self.configured_model,
                model_available=False,
                available_models=[],
                message=f"Error contacting Ollama: {str(e)}",
                setup_instructions=[
                    "Check if the Ollama service is running.",
                    "Verify OLLAMA_BASE_URL setting in your .env file.",
                ],
            )

    def _build_system_prompt(self, mode: AnalysisMode, language: SupportedLanguage) -> str:
        lang_display = "C++ (C++14/17)" if language == SupportedLanguage.CPP else "Python 3"

        if mode == AnalysisMode.FIND_ERROR:
            focus_text = """
Focus on:
1. Syntax and compilation errors in the code.
2. Runtime exceptions (e.g. index out of bounds, null pointer / null dereference, division by zero, recursion depth, uninitialized memory).
3. Type mismatches, improper variable declarations, and syntax quirks in {lang_display}.
4. Immediate logical flaws causing runtime crashes or infinite loops.
""".replace("{lang_display}", lang_display)
        else:
            focus_text = """
Focus on:
1. Incorrect answers (WA) and logical/algorithmic flaws against the problem requirements.
2. Failed edge cases (e.g., minimum/maximum constraints, empty input, single element, negative numbers, zeroes, 32-bit integer overflow vs 64-bit long long).
3. Algorithmic complexity issues (Time Limit Exceeded / Memory Limit Exceeded risks).
4. Subtle discrepancies between what the problem asks and what the code computes.
""".replace("{lang_display}", lang_display)

        return f"""You are BugLens AI, an expert code analysis engine for competitive programmers and software engineers.
Your task is to analyze programming code written in {lang_display} against a problem statement.

{focus_text}

Rules you MUST strictly follow:
1. Provide accurate, beginner-friendly explanations. Explain any technical jargon simply.
2. Identify likely line numbers (1-indexed) only when you are reasonably confident. Do NOT hallucinate line numbers.
3. Suggest a minimal surgical fix (a few changed lines) first, before showing the full corrected code.
4. Provide full, working, properly formatted corrected code when enough information is available.
5. Provide realistic test cases (including edge cases), explaining WHY each test is valuable.
6. Estimate Time and Space complexity in Big-O notation.
7. Provide a practical Learning Tip explaining the underlying computer science or language concept to prevent future bugs.
8. If the problem cannot be diagnosed with certainty, state uncertainty clearly in the overall_assessment and confidence field. Never invent facts.

CRITICAL: You MUST respond ONLY with a single valid JSON object adhering strictly to this JSON structure:
{{
  "overall_assessment": "Short high-level summary of findings",
  "error_classifications": ["Syntax Error" | "Compilation Error" | "Runtime Error" | "Logical Error" | "Algorithmic or Complexity Issue" | "Potential Edge-Case Failure" | "No Obvious Issue Found" | "Insufficient Information"],
  "error_locations": [
    {{
      "line_number": 12,
      "snippet": "problematic line of code",
      "explanation": "why this line is buggy"
    }}
  ],
  "explanation": "Clear beginner-friendly paragraph explaining the root cause",
  "suggested_fixes": [
    {{
      "target_line_start": 12,
      "target_line_end": 12,
      "original_snippet": "...",
      "fixed_snippet": "...",
      "explanation": "why this replacement fixes the issue"
    }}
  ],
  "corrected_code": "Full corrected code here (string)",
  "test_suggestions": [
    {{
      "input": "sample input",
      "expected_output": "sample output",
      "reason": "why this test case is insightful",
      "is_edge_case": false
    }}
  ],
  "complexity_analysis": {{
    "time_complexity": "O(N log N)",
    "space_complexity": "O(N)",
    "verdict": "Optimal / Acceptable / May TLE",
    "explanation": "explanation of loops, recursion, and data structures used"
  }},
  "learning_tip": "Key takeaway lesson to avoid this bug in the future",
  "confidence": "high" | "medium" | "low" | "uncertain"
}}
"""

    def _build_user_prompt(self, req: AnalyzeRequest) -> str:
        parts = [
            f"=== PROGRAMMING LANGUAGE ===\n{req.language.value.upper()}",
            f"=== ANALYSIS MODE ===\n{'Find My Error (Syntax / Runtime / Crash)' if req.analysis_mode == AnalysisMode.FIND_ERROR else 'Why Is My Answer Wrong? (Algorithmic / Edge-case / WA)'}",
            f"=== PROBLEM STATEMENT ===\n{req.problem_statement}",
            f"=== SUBMITTED CODE ===\n{req.code}",
        ]

        if req.custom_input and req.custom_input.strip():
            parts.append(f"=== CUSTOM TEST INPUT ===\n{req.custom_input.strip()}")

        if req.actual_output and req.actual_output.strip():
            parts.append(f"=== ACTUAL PROGRAM OUTPUT ===\n{req.actual_output.strip()}")

        if req.expected_output and req.expected_output.strip():
            parts.append(f"=== EXPECTED OUTPUT ===\n{req.expected_output.strip()}")

        if req.error_message and req.error_message.strip():
            parts.append(f"=== COMPILER / RUNTIME ERROR MESSAGE ===\n{req.error_message.strip()}")

        parts.append("Analyze the submission according to instructions and output the complete JSON object.")
        return "\n\n".join(parts)

    def _extract_and_clean_json(self, raw_text: str) -> Dict[str, Any]:
        """Extract and parse JSON safely from model response text."""
        trimmed = raw_text.strip()

        # If wrapped in ```json ... ``` or ``` ... ```
        if "```" in trimmed:
            pattern = r"```(?:json)?\s*([\s\S]*?)\s*```"
            match = re.search(pattern, trimmed)
            if match:
                trimmed = match.group(1).strip()

        try:
            return json.loads(trimmed)
        except json.JSONDecodeError:
            # Fallback regex search for { ... }
            first_brace = trimmed.find("{")
            last_brace = trimmed.rfind("}")
            if first_brace != -1 and last_brace != -1 and last_brace > first_brace:
                substring = trimmed[first_brace : last_brace + 1]
                return json.loads(substring)
            raise ValueError(f"Could not parse valid JSON from AI response: {raw_text[:200]}")

    async def analyze(self, req: AnalyzeRequest) -> AnalyzeResponse:
        """Call Ollama local model and return structured validated response."""
        # Check Ollama connectivity first
        status = await self.check_status()
        if not status.connected:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "OLLAMA_DISCONNECTED",
                    "message": "Local AI service (Ollama) is not reachable at " + self.base_url,
                    "setup_instructions": status.setup_instructions,
                },
            )

        system_prompt = self._build_system_prompt(req.analysis_mode, req.language)
        user_prompt = self._build_user_prompt(req)

        # Call Ollama /api/chat with json format
        payload = {
            "model": self.configured_model,
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt},
            ],
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.2,  # Low temperature for precise code reasoning
                "top_p": 0.9,
            },
        }

        try:
            async with self._get_client(timeout=self.timeout) as client:
                res = await client.post(f"{self.base_url}/api/chat", json=payload)

                if res.status_code == 404:
                    raise HTTPException(
                        status_code=503,
                        detail={
                            "error": "MODEL_NOT_FOUND",
                            "message": f"Configured model '{self.configured_model}' not found in Ollama.",
                            "setup_instructions": [
                                f"Run: ollama pull {self.configured_model}",
                                "Wait for the download to finish, then retry.",
                            ],
                        },
                    )

                if res.status_code != 200:
                    raise HTTPException(
                        status_code=502,
                        detail={
                            "error": "OLLAMA_ERROR",
                            "message": f"Ollama returned HTTP error {res.status_code}: {res.text[:200]}",
                        },
                    )

                data = res.json()
                raw_content = data.get("message", {}).get("content", "")
                if not raw_content:
                    raise HTTPException(
                        status_code=502,
                        detail={
                            "error": "EMPTY_AI_RESPONSE",
                            "message": "AI model returned an empty response.",
                        },
                    )

        except HTTPException:
            raise
        except httpx.TimeoutException:
            raise HTTPException(
                status_code=504,
                detail={
                    "error": "AI_TIMEOUT",
                    "message": f"AI inference timed out after {self.timeout} seconds. The local machine might be under heavy load.",
                    "setup_instructions": [
                        "Consider using a lighter model (e.g. 'qwen2.5-coder:1.5b')",
                        "Increase OLLAMA_TIMEOUT_SECONDS in .env",
                    ],
                },
            )
        except httpx.ConnectError:
            raise HTTPException(
                status_code=503,
                detail={
                    "error": "OLLAMA_DISCONNECTED",
                    "message": "Failed to connect to Ollama during analysis call.",
                    "setup_instructions": status.setup_instructions,
                },
            )

        # Parse JSON
        try:
            parsed = self._extract_and_clean_json(raw_content)
        except Exception as e:
            raise HTTPException(
                status_code=502,
                detail={
                    "error": "MALFORMED_AI_RESPONSE",
                    "message": f"Failed to parse structured JSON from AI output: {str(e)}",
                    "raw_output": raw_content[:400],
                },
            )

        # Normalize and construct response
        error_classifications = parsed.get("error_classifications", [])
        if isinstance(error_classifications, str):
            error_classifications = [error_classifications]
        elif not isinstance(error_classifications, list):
            error_classifications = ["No Obvious Issue Found"]

        error_locations = []
        for loc in parsed.get("error_locations", []):
            if isinstance(loc, dict):
                error_locations.append(
                    ErrorLocation(
                        line_number=loc.get("line_number"),
                        snippet=loc.get("snippet"),
                        explanation=loc.get("explanation", ""),
                    )
                )

        suggested_fixes = []
        for fix in parsed.get("suggested_fixes", []):
            if isinstance(fix, dict) and fix.get("fixed_snippet"):
                suggested_fixes.append(
                    SuggestedFix(
                        target_line_start=fix.get("target_line_start"),
                        target_line_end=fix.get("target_line_end"),
                        original_snippet=fix.get("original_snippet"),
                        fixed_snippet=fix.get("fixed_snippet", ""),
                        explanation=fix.get("explanation", ""),
                    )
                )

        test_suggestions = []
        for ts in parsed.get("test_suggestions", []):
            if isinstance(ts, dict) and ts.get("input") is not None:
                test_suggestions.append(
                    TestCaseSuggestion(
                        input=str(ts.get("input")),
                        expected_output=str(ts.get("expected_output")) if ts.get("expected_output") is not None else None,
                        reason=str(ts.get("reason", "Suggested test case")),
                        is_edge_case=bool(ts.get("is_edge_case", False)),
                        executed=False,
                    )
                )

        complexity = None
        comp_dict = parsed.get("complexity_analysis")
        if isinstance(comp_dict, dict) and "time_complexity" in comp_dict:
            complexity = ComplexityAnalysis(
                time_complexity=str(comp_dict.get("time_complexity", "O(N)")),
                space_complexity=str(comp_dict.get("space_complexity", "O(1)")),
                verdict=str(comp_dict.get("verdict", "Acceptable")),
                explanation=str(comp_dict.get("explanation", "")),
            )

        return AnalyzeResponse(
            overall_assessment=parsed.get("overall_assessment", "Code analysis complete."),
            error_classifications=error_classifications,
            error_locations=error_locations,
            explanation=parsed.get("explanation", "No detailed explanation provided."),
            suggested_fixes=suggested_fixes,
            corrected_code=parsed.get("corrected_code"),
            test_suggestions=test_suggestions,
            complexity_analysis=complexity,
            learning_tip=parsed.get("learning_tip", "Review edge cases and variable initialization before running."),
            verification_status="AI Analysis (Unverified - Run in Sandbox to verify execution)",
            confidence=parsed.get("confidence", "high"),
            model_used=self.configured_model,
            analysis_mode=req.analysis_mode,
        )


ai_service = AIService()
