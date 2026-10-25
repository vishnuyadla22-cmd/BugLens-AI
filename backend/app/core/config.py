import os
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Search for .env in current dir, parent dir, or project root
current_dir = Path(__file__).resolve().parent
candidates = [
    current_dir / ".env",
    current_dir.parent / ".env",
    current_dir.parent.parent / ".env",
    current_dir.parent.parent.parent / ".env",
]
for p in candidates:
    if p.exists():
        load_dotenv(p)
        break


class Settings:
    PROJECT_NAME: str = "BugLens AI"
    VERSION: str = "1.0.0"
    TAGLINE: str = "See the Bug. Understand the Cause. Fix with Confidence."

    BACKEND_HOST: str = os.getenv("BACKEND_HOST", "127.0.0.1")
    BACKEND_PORT: int = int(os.getenv("BACKEND_PORT", "8000"))
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")

    # CORS
    _cors_raw: str = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000,http://127.0.0.1:3000",
    )
    CORS_ORIGINS: List[str] = [origin.strip() for origin in _cors_raw.split(",") if origin.strip()]

    # Ollama Local AI Configuration
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
    OLLAMA_MODEL: str = os.getenv("OLLAMA_MODEL", "qwen2.5-coder:7b")
    OLLAMA_TIMEOUT_SECONDS: float = float(os.getenv("OLLAMA_TIMEOUT_SECONDS", "120.0"))

    # Sandbox Configuration
    SANDBOX_EXECUTION_TIMEOUT_SECONDS: float = float(os.getenv("SANDBOX_EXECUTION_TIMEOUT_SECONDS", "5.0"))
    SANDBOX_MAX_OUTPUT_BYTES: int = int(os.getenv("SANDBOX_MAX_OUTPUT_BYTES", "65536"))
    MAX_CODE_LENGTH_CHARS: int = 50000
    MAX_PROBLEM_LENGTH_CHARS: int = 50000


settings = Settings()
