from typing import List, Optional
from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: str = Field(default="ok", description="Overall backend health status")
    app_name: str = Field(default="BugLens AI")
    version: str = Field(default="1.0.0")
    timestamp: str = Field(description="ISO timestamp")
    sandbox_available: bool = Field(default=True, description="Whether code execution sandbox is ready")
    cpp_compiler_available: bool = Field(description="Whether g++ or compatible C++ compiler is found")


class AIStatusResponse(BaseModel):
    connected: bool = Field(description="Whether Ollama daemon is reachable")
    service_url: str = Field(description="Configured Ollama base URL")
    configured_model: str = Field(description="Configured model name in settings")
    model_available: bool = Field(description="Whether the configured model is installed locally")
    available_models: List[str] = Field(default_factory=list, description="List of local models discovered")
    message: str = Field(description="User-friendly status or diagnostic message")
    setup_instructions: Optional[List[str]] = Field(
        default=None, description="Step-by-step instructions if offline or model missing"
    )
