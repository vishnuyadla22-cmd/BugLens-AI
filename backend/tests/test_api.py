import pytest
from fastapi.testclient import TestClient
try:
    from backend.app.main import app
except ImportError:
    from app.main import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["app_name"] == "BugLens AI"
    assert data["sandbox_available"] is True
    assert "timestamp" in data


def test_ai_status_endpoint():
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert "connected" in data
    assert "service_url" in data
    assert "configured_model" in data
    assert "available_models" in data


def test_execute_endpoint_python():
    payload = {
        "language": "python",
        "code": "print('BugLens Test')",
        "expected_output": "BugLens Test\n",
    }
    response = client.post("/api/execute", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "BugLens Test" in data["stdout"]
    assert data["comparison"]["is_match"] is True


def test_execute_endpoint_invalid_code():
    # Empty code should trigger validation error
    payload = {
        "language": "python",
        "code": "",
    }
    response = client.post("/api/execute", json=payload)
    assert response.status_code == 422


def test_analyze_endpoint_validation_error():
    # Missing required code
    payload = {
        "language": "python",
        "problem_statement": "Solve Two Sum",
        "code": "   ",
    }
    response = client.post("/api/analyze", json=payload)
    assert response.status_code == 422
