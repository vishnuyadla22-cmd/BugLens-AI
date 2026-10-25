# BugLens AI 🔍🐞
> **See the Bug. Understand the Cause. Fix with Confidence.**

[![Hacktoberfest](https://img.shields.io/badge/Hacktoberfest-2024%20Week%203-FF8C00?style=for-the-badge&logo=hacktoberfest&logoColor=white)](https://hacktoberfest.com/)
[![Local AI](https://img.shields.io/badge/Inference-Local%20Ollama%20Open--Weight-6366f1?style=for-the-badge&logo=ollama&logoColor=white)](https://ollama.com/)
[![Frontend](https://img.shields.io/badge/Frontend-React%2019%20%2B%20Vite%208%20%2B%20Tailwind-06b6d4?style=for-the-badge&logo=react&logoColor=white)](https://react.dev/)
[![Backend](https://img.shields.io/badge/Backend-FastAPI%20%2B%20Pydantic%20v2-10b981?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=for-the-badge)](LICENSE)

**BugLens AI** is a complete, modern, open-source AI debugging workbench built for software engineers, students, and competitive programmers. It transforms opaque runtime exceptions, syntax errors, and "Wrong Answer" verdicts into structured, beginner-friendly diagnostic reports with surgical code corrections and sandboxed execution verification.

Developed for the **Hacktoberfest Open-Source AI Challenge Week 3: Slow and Steady**, BugLens AI uses **100% local open-weight coding models** via [Ollama](https://ollama.com/) (e.g., `qwen2.5-coder:7b`, `deepseek-coder:6.7b`, `codellama:7b`). Your source code and problem statements never leave your machine—no paid cloud AI API keys required.

---

## 📑 Table of Contents
- [1. Key Features](#1-key-features)
- [2. Architecture](#2-architecture)
- [3. Technology Stack](#3-technology-stack)
- [4. Dual Analysis Modes](#4-dual-analysis-modes)
- [5. Sandboxed Code Execution & Smart Diff](#5-sandboxed-code-execution--smart-diff)
- [6. Prerequisites & Hardware Requirements](#6-prerequisites--hardware-requirements)
- [7. Installation & Quick Start](#7-installation--quick-start)
  - [Step 1: Install Ollama & Pull Coding Model](#step-1-install-ollama--pull-coding-model)
  - [Step 2: Clone and Configure](#step-2-clone-and-configure)
  - [Step 3: Setup Backend](#step-3-setup-backend)
  - [Step 4: Setup Frontend](#step-4-setup-frontend)
- [8. API Reference](#8-api-reference)
- [9. Testing](#9-testing)
- [10. Offline Operation & Privacy](#10-offline-operation--privacy)
- [11. Security & Sandbox Guardrails](#11-security--sandbox-guardrails)
- [12. Known Limitations & Roadmap](#12-known-limitations--roadmap)
- [13. License](#13-license)

---

## 1. Key Features

- **Mandatory Language Selection First**: Prominent selection cards for **C++** and **Python**. The editor, execution engine, and prompt engineering adapt dynamically to the chosen language.
- **Monaco Code Editor**: Professional developer editor with syntax highlighting, line numbers, dark theme (`vs-dark`), clear/copy shortcuts, and expandable canvas.
- **Interactive Line Highlighting**: When the AI detects a bug, it highlights the exact problematic line inside Monaco Editor with hover diagnostics.
- **Dual Analysis Modes**:
  - `Find My Error`: Targets compilation bugs, syntax mistakes, unhandled exceptions, and runtime crashes.
  - `Why Is My Answer Wrong?`: Targets algorithmic misconceptions, edge-case failures, 32-bit overflow, and requirement mismatches.
- **Comprehensive Diagnostic Results**:
  - **Error Classification Badges**: Categorizes issues into *Syntax*, *Compilation*, *Runtime*, *Logical*, *Complexity*, or *Edge-Case*.
  - **Error Location & Snippet**: Exact line reference with code snippet preview and jump-to-line action.
  - **Beginner-Friendly Explanation**: Plain-English root cause explanation without unneeded jargon.
  - **Surgical Fix with "Apply Fix"**: Side-by-side minimal snippet diff with an interactive **"Apply Fix"** button that updates the editor only upon explicit approval.
  - **Full Corrected Solution**: Formatted, copyable corrected solution for complete clarity.
  - **Insightful Test Cases**: Generated edge cases with a 1-click **"Execute in Sandbox"** button.
  - **Complexity Analysis**: Big-O Time and Space estimates with performance verdict (*Optimal*, *Acceptable*, *May TLE*).
  - **Learning Tip**: Core computer science takeaways to prevent repeating the mistake.
- **Sandboxed Code Execution Engine**:
  - Run Python 3 and C++ (MinGW `g++`) in isolated temporary environments.
  - Output comparison engine: distinguishes **Exact Matches**, **Presentation/Formatting Differences** (e.g. trailing whitespaces/newlines), and **Genuine Mismatches**.
- **Local AI Health & Diagnostics Modal**: Live connection indicator, model status, and copyable CLI instructions when Ollama is offline.
- **Preset Buggy Code Samples**: Instant 1-click loader for classic bugs (Two Sum dictionary lookup, Fibonacci recursion depth, Binary Search integer overflow, and Palindrome underflow).

---

## 2. Architecture

```
+--------------------------------------------------------------------------------+
|                        BugLens AI Modern Web UI (Vite + React)                  |
|  - Language Selector: C++ / Python (Cards with icons)                         |
|  - Problem Statement Input & Monaco Editor (C++ / Python syntax & line decor)  |
|  - Expandable Debugging Panel (Custom Input, Actual, Expected, Error Msg)     |
|  - Two Analysis Modes: [Find My Error] & [Why Is My Answer Wrong?]            |
|  - Sandboxed Runner Test Tab (Run Code, Diff Actual vs Expected)              |
|  - Results Engine: Error Badges, Snippet Line Highlights, Fix Diff,           |
|    "Apply Fix", Test Suggestions, Complexity Analysis, Learning Tips           |
|  - Ollama Status Pill & Setup Modal (Live model status & diagnostic guides)    |
+--------------------------------------------------------------------------------+
                                       |
                   REST API (FastAPI / Pydantic v2)
                                       v
+----------------------------------+   +-----------------------------------------+
|     FastAPI Backend Services     |   |       Isolated Sandbox Runner           |
| - Health Check: GET /health      |   | - POST /api/execute                     |
| - AI Status: GET /api/ai/status  |-->| - Python Runner (subprocess + limits)   |
| - AI Engine: POST /api/analyze   |   | - C++ MinGW g++ Runner (compile + exec) |
| - Structured JSON Prompt & Parse |   | - Output comparison (Formatting diff vs |
| - Fallback & Graceful Error Logs |   |   genuine mismatch)                     |
+----------------------------------+   +-----------------------------------------+
                  |
        Local HTTP (REST)
                  v
+--------------------------------------------------------------------------------+
|                       Local Ollama Service (Port 11434)                        |
|  - Open-weight code LLMs (qwen2.5-coder:7b / deepseek-coder / codellama)       |
|  - Zero external cloud API dependencies; 100% privacy and local execution      |
+--------------------------------------------------------------------------------+
```

---

## 3. Technology Stack

### Frontend
- **Framework**: React 19 with Vite 8 & TypeScript
- **Styling**: Tailwind CSS v4 with custom dark developer palette
- **Code Editor**: `@monaco-editor/react` (Monaco Editor)
- **Icons**: `lucide-react`

### Backend
- **Framework**: FastAPI (Python 3.10+)
- **Data Validation**: Pydantic v2
- **Server**: Uvicorn
- **HTTP Client**: HTTPX (async client with connection pooling)
- **Testing**: Pytest & pytest-asyncio

### Local AI Inference
- **Inference Server**: [Ollama](https://ollama.com/)
- **Default Recommended Model**: `qwen2.5-coder:7b` (Configurable via `OLLAMA_MODEL`)
- **Alternative Lightweight Model**: `qwen2.5-coder:1.5b` (For machines with 4GB-8GB RAM)

### Execution Sandbox
- **Python**: Subprocess runner with isolated flags (`-I -B -s`), strict timeouts, and environment scrubbing.
- **C++**: MinGW `g++` (`-std=c++14 -O2 -Wall`) compiler and process runner.

---

## 4. Dual Analysis Modes

| Mode | Purpose | Primary Triggers |
| :--- | :--- | :--- |
| **Find My Error** | Syntax, compilation, and runtime crashes | Syntax errors, unhandled exceptions, index out of bounds, null pointer dereferences, type errors, infinite recursion. |
| **Why Is My Answer Wrong?** | Algorithmic logic and edge cases | Incorrect answers (WA), failed boundary conditions (0, 1, negatives), integer overflow, large input causing TLE, and problem constraint violations. |

---

## 5. Sandboxed Code Execution & Smart Diff

BugLens AI keeps AI analysis and real code execution distinct:
1. **Isolated Execution**: Code runs in a clean temporary directory with sanitized environment variables (preventing server secret leakage).
2. **Resource Constraints**: Strict process timeout (default: 5.0 seconds) and output buffer limits (64 KB).
3. **Smart Output Normalizer**:
   - **Exact Match**: Byte-for-byte identical output.
   - **Formatting Difference Only**: Identifies when outputs match logically but differ in trailing spaces or newlines (common in competitive programming).
   - **Genuine Mismatch**: Highlights the first line of deviation between actual and expected outputs.

> **Disclaimer**: Passing sample test cases in the sandbox verifies specific behavior but does not constitute formal algorithmic proof of correctness across all possible test inputs.

---

## 6. Prerequisites & Hardware Requirements

### Minimum Requirements
- **OS**: Windows 10/11, macOS, or Linux
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Python**: 3.10 or higher (tested on Python 3.14)
- **Ollama**: Installed from [ollama.com](https://ollama.com)

### RAM & Model Sizing
| Model Name | Size | RAM / VRAM Recommended | Best For |
| :--- | :--- | :--- | :--- |
| **`qwen2.5-coder:7b`** (Default) | 4.7 GB | 8 GB RAM / 6 GB VRAM | High-accuracy syntax & competitive logic |
| **`qwen2.5-coder:1.5b`** | 1.0 GB | 4 GB RAM | Low-spec laptops & ultra-fast inference |
| **`deepseek-coder:6.7b`** | 3.8 GB | 8 GB RAM / 6 GB VRAM | Competitive programming problems |
| **`codellama:7b`** | 3.8 GB | 8 GB RAM / 6 GB VRAM | General code comprehension |

---

## 7. Installation & Quick Start

### Step 1: Install Ollama & Pull Coding Model
1. Download Ollama from [https://ollama.com/download](https://ollama.com/download) and run the installer.
2. In your terminal, start the Ollama daemon (if not already running):
   ```bash
   ollama serve
   ```
3. Pull the recommended open-weight coding model:
   ```bash
   ollama pull qwen2.5-coder:7b
   ```
   *(For low-RAM machines, use `ollama pull qwen2.5-coder:1.5b`)*

### Step 2: Clone and Configure
```bash
git clone https://github.com/your-username/buglens-ai.git
cd buglens-ai
```

Copy the example environment configuration:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Review `.env`:
```env
BACKEND_HOST=127.0.0.1
BACKEND_PORT=8000
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5-coder:7b
OLLAMA_TIMEOUT_SECONDS=120
SANDBOX_EXECUTION_TIMEOUT_SECONDS=5.0
```

### Step 3: Setup Backend
```bash
# Navigate to backend directory or run from root
python -m pip install -r backend/requirements.txt

# Start backend server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The FastAPI backend will start at `http://127.0.0.1:8000`. You can inspect interactive API documentation at `http://127.0.0.1:8000/docs`.

### Step 4: Setup Frontend
In a separate terminal:
```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 8. API Reference

### `GET /health`
Returns backend health status, timestamp, and sandbox compiler availability.

**Response (200 OK):**
```json
{
  "status": "ok",
  "app_name": "BugLens AI",
  "version": "1.0.0",
  "timestamp": "2026-10-25T05:00:00Z",
  "sandbox_available": true,
  "cpp_compiler_available": true
}
```

### `GET /api/ai/status`
Checks whether Ollama daemon is reachable and whether the configured model is installed locally.

**Response (200 OK):**
```json
{
  "connected": true,
  "service_url": "http://localhost:11434",
  "configured_model": "qwen2.5-coder:7b",
  "model_available": true,
  "available_models": ["qwen2.5-coder:7b", "llama3.2:latest"],
  "message": "Ollama is connected and ready. Active model: 'qwen2.5-coder:7b'."
}
```

### `POST /api/analyze`
Submits code and problem statement for AI analysis.

**Request Body:**
```json
{
  "language": "python",
  "problem_statement": "Find two numbers in array that sum to target.",
  "code": "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]",
  "custom_input": "3 2 4\n6",
  "actual_output": "0 0",
  "expected_output": "1 2",
  "analysis_mode": "why_wrong"
}
```

**Response (200 OK):**
```json
{
  "overall_assessment": "The inner loop uses the same element twice (i == j), returning index 0 twice for target 6.",
  "error_classifications": ["Logical Error", "Potential Edge-Case Failure"],
  "error_locations": [
    {
      "line_number": 3,
      "snippet": "for j in range(len(nums)):",
      "explanation": "Inner loop starts from index 0 instead of i + 1, allowing an element to pair with itself."
    }
  ],
  "explanation": "When target is twice the value of an element (nums[0] = 3, target = 6), the condition nums[0] + nums[0] == 6 evaluates to True because i and j are both 0.",
  "suggested_fixes": [
    {
      "target_line_start": 3,
      "target_line_end": 3,
      "original_snippet": "for j in range(len(nums)):",
      "fixed_snippet": "for j in range(i + 1, len(nums)):",
      "explanation": "Start j from i + 1 to consider only distinct pairs."
    }
  ],
  "corrected_code": "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(i + 1, len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]\n    return []",
  "test_suggestions": [
    {
      "input": "3 3\n6",
      "expected_output": "0 1",
      "reason": "Verify handling of identical values at distinct indices.",
      "is_edge_case": true
    }
  ],
  "complexity_analysis": {
    "time_complexity": "O(N^2)",
    "space_complexity": "O(1)",
    "verdict": "Acceptable for small N; use hash map for O(N)",
    "explanation": "Nested loops examine all distinct pairs."
  },
  "learning_tip": "When searching for pairs in an array, ensure loop boundaries enforce i < j to avoid self-pairing.",
  "verification_status": "AI Analysis (Unverified - Run in Sandbox to verify execution)",
  "confidence": "high",
  "model_used": "qwen2.5-coder:7b",
  "analysis_mode": "why_wrong"
}
```

### `POST /api/execute`
Executes code inside the isolated sandbox.

**Request Body:**
```json
{
  "language": "python",
  "code": "nums = list(map(int, input().split()))\nprint(sum(nums))",
  "custom_input": "10 20 30",
  "expected_output": "60\n"
}
```

**Response (200 OK):**
```json
{
  "status": "success",
  "exit_code": 0,
  "stdout": "60\n",
  "stderr": "",
  "execution_time_ms": 14.8,
  "timed_out": false,
  "comparison": {
    "is_match": true,
    "is_exact_match": true,
    "is_formatting_difference_only": false,
    "details": "Exact match! Actual output matches expected output character-for-character.",
    "actual_trimmed": "60",
    "expected_trimmed": "60"
  },
  "disclaimer": "Execution in isolated sandbox. Passing sample test cases does not guarantee complete algorithmic correctness."
}
```

---

## 9. Testing

BugLens AI includes a comprehensive automated test suite verifying schemas, input validation, execution timeouts, error capturing, g++ compilation, and AI response resilience.

Run all tests:
```bash
python -m pytest backend/tests -v
```

### Test Coverage Highlights
- ✅ **API Request & Schema Validation**: Rejects empty code, empty problem statements, and unsupported languages with HTTP 422.
- ✅ **Python Sandbox Execution**: Verified normal execution, runtime error capture (`IndexError`, `ZeroDivisionError`), and timeout killing (`while True: pass`).
- ✅ **C++ MinGW Execution**: Verified compilation with `g++ -std=c++14`, stdout/stdin piping, and compilation error capturing.
- ✅ **Smart Output Diff**: Verifies exact matches, whitespace/newline formatting differences, and line mismatch detection.
- ✅ **Ollama Offline Handling**: Returns structured HTTP 503 with setup instructions when Ollama daemon is unreachable.
- ✅ **Markdown JSON Resiliency**: Strips Markdown code blocks (````json ... ````) and normalizes partial outputs.

---

## 10. Offline Operation & Privacy

BugLens AI is built on the philosophy of **Slow and Steady, Local and Private**:
1. **Zero External Telemetry**: No source code, problem descriptions, or outputs are ever transmitted to OpenAI, Anthropic, Google, or any cloud API.
2. **True Air-Gapped Operation**: Once you run `npm install`, `pip install -r requirements.txt`, and `ollama pull qwen2.5-coder:7b`, BugLens AI operates **entirely without an internet connection**.
3. **No Account or API Keys**: There is no subscription, login, or billing token required.

---

## 11. Security & Sandbox Guardrails

To prevent malicious or unsafe code from damaging the host system:
- **Environment Variable Scrubbing**: Submitted child processes run with a sanitized environment containing only essential OS variables (`PATH`, `SYSTEMROOT`, `TEMP`). Host secrets, API keys, and auth credentials are not exposed to executed code.
- **Strict Timeouts**: Subprocesses are killed automatically after `SANDBOX_EXECUTION_TIMEOUT_SECONDS` (default: 5.0s) to prevent infinite loops or CPU exhaustion.
- **Output Truncation**: Standard output and error buffers are capped at 64 KB to prevent memory exhaustion from infinite print loops.
- **Ephemeral Temp Directories**: Code is compiled and executed inside transient directories created with `tempfile.TemporaryDirectory` and cleaned up immediately upon completion.
- **No Automatic AI Code Execution**: AI-generated corrected code is never run without the user explicitly reviewing and triggering sandbox execution.

---

## 12. Known Limitations & Roadmap

### Current Limitations
- **Supported Languages**: The initial version focuses exclusively on C++ and Python 3.
- **Host Compiler Dependency for C++**: C++ compilation requires `g++` (MinGW on Windows or GCC/Clang on Linux/macOS) in the host `PATH`. If missing, Python sandbox execution continues to work and AI analysis remains fully functional.
- **Single Process Execution**: Interactive GUI programs or multithreaded network listeners are not supported in the competitive programming sandbox.

### Planned Improvements
- [ ] Add Docker-based containerized sandbox execution for multi-tenant deployments.
- [ ] Support additional languages: Java, Rust, and Go.
- [ ] Visual AST / Call Stack step-through visualizer.
- [ ] Direct import from Codeforces, LeetCode, and AtCoder URLs.

---

## 13. License

This project is licensed under the **MIT License**. See the [LICENSE](LICENSE) file for details.

---

*Crafted with precision for Hacktoberfest 2024 Week 3: Slow and Steady.*
