import pytest
from starlette.testclient import TestClient
from backend.app.main import app
from backend.app.ai.llm_client import AIProviderStatus

client = TestClient(app)

def test_api_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "healthy"
    assert data["service"] == "Celebration Event Planner AI"

def test_api_plan_creation_and_validation():
    # Valid payload
    payload = {
        "title": "Graduation Gala",
        "celebration_type": "graduation",
        "event_date": "2026-11-25",
        "start_time": "16:00",
        "duration_hours": 4.0,
        "guest_count": 35,
        "budget": 1600.0,
        "currency": "USD",
        "venue_preference": "indoor"
    }
    res = client.post("/api/events/plan", json=payload)
    assert res.status_code == 200
    plan = res.json()
    assert plan["requirements"]["title"] == "Graduation Gala"
    assert plan["budget"]["total_budget"] == 1600.0
    assert len(plan["budget"]["items"]) > 0
    assert len(plan["timeline"]) > 0
    assert len(plan["checklist"]) > 0

    # Invalid empty title
    invalid_payload = dict(payload)
    invalid_payload["title"] = "   "
    res_err = client.post("/api/events/plan", json=invalid_payload)
    assert res_err.status_code == 422 or res_err.status_code == 400

    # Invalid negative budget
    invalid_budget = dict(payload)
    invalid_budget["budget"] = -200.0
    res_err2 = client.post("/api/events/plan", json=invalid_budget)
    assert res_err2.status_code == 422 or res_err2.status_code == 400

def test_api_ai_status_and_local_fallback():
    res = client.get("/api/planner/status")
    assert res.status_code == 200
    data = res.json()
    assert "mode" in data
    assert "message" in data
    # When no API key is supplied, defaults cleanly to local engine
    assert data["mode"] in ["deterministic_engine", "llm_augmented"]
    if not data["is_configured"]:
        assert "Local Intelligence" in data["message"]

def test_api_presets():
    res = client.get("/api/events/presets")
    assert res.status_code == 200
    presets = res.json()
    assert len(presets) >= 3
    assert presets[0]["requirements"]["title"] != ""
