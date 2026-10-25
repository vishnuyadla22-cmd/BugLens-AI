from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, status

try:
    from backend.app.core.config import settings
    from backend.app.schemas.analysis import AnalyzeRequest, AnalyzeResponse
    from backend.app.schemas.execution import ExecuteRequest, ExecuteResponse
    from backend.app.schemas.status import AIStatusResponse, HealthResponse
    from backend.app.services.ai_service import ai_service
    from backend.app.services.sandbox_service import sandbox_service
except ImportError:
    from app.core.config import settings
    from app.schemas.analysis import AnalyzeRequest, AnalyzeResponse
    from app.schemas.execution import ExecuteRequest, ExecuteResponse
    from app.schemas.status import AIStatusResponse, HealthResponse
    from app.services.ai_service import ai_service
    from app.services.sandbox_service import sandbox_service

router = APIRouter()


@router.get("/health", response_model=HealthResponse, tags=["Health"])
async def get_health():
    """Return backend health and capability status."""
    return HealthResponse(
        status="ok",
        app_name=settings.PROJECT_NAME,
        version=settings.VERSION,
        timestamp=datetime.now(timezone.utc).isoformat(),
        sandbox_available=True,
        cpp_compiler_available=sandbox_service.is_cpp_available(),
    )


@router.get("/api/ai/status", response_model=AIStatusResponse, tags=["AI Engine"])
async def get_ai_status():
    """Inspect Groq API connectivity and model availability."""
    return await ai_service.check_status()


@router.post("/api/analyze", response_model=AnalyzeResponse, tags=["AI Engine"])
async def analyze_code(request: AnalyzeRequest):
    """Analyze code against problem statement using configured Groq model."""
    # Enforce reasonable input size constraints to prevent memory abuse
    if len(request.code) > settings.MAX_CODE_LENGTH_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Submitted code exceeds maximum allowed length of {settings.MAX_CODE_LENGTH_CHARS} characters.",
        )
    if len(request.problem_statement) > settings.MAX_PROBLEM_LENGTH_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Problem statement exceeds maximum allowed length of {settings.MAX_PROBLEM_LENGTH_CHARS} characters.",
        )

    return await ai_service.analyze(request)


@router.post("/api/execute", response_model=ExecuteResponse, tags=["Sandbox Execution"])
async def execute_code(request: ExecuteRequest):
    """Run submitted code in isolated sandbox and optionally compare with expected output."""
    if len(request.code) > settings.MAX_CODE_LENGTH_CHARS:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"Submitted code exceeds maximum allowed length of {settings.MAX_CODE_LENGTH_CHARS} characters.",
        )

    return sandbox_service.execute(
        language=request.language,
        code=request.code,
        custom_input=request.custom_input or "",
        expected_output=request.expected_output,
    )
