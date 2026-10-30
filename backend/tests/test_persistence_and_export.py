import pytest
import json
from backend.app.models.schemas import EventRequirements
from backend.app.engine.assistant import create_event_plan
from backend.app.database import (
    init_db, save_event_record, get_event_record, list_event_records, delete_event_record
)

@pytest.fixture(autouse=True)
def setup_database():
    init_db()

def test_database_persistence_lifecycle():
    reqs = EventRequirements(
        title="Persisted Celebration",
        celebration_type="anniversary",
        event_date="2026-12-15",
        guest_count=25,
        budget=1800.0
    )
    plan = create_event_plan(reqs)

    # 1. Save
    save_event_record(
        event_id=plan.id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )

    # 2. Retrieve
    retrieved = get_event_record(plan.id)
    assert retrieved is not None
    assert retrieved["requirements"]["title"] == "Persisted Celebration"
    assert retrieved["budget"]["total_budget"] == 1800.0

    # 3. List
    all_events = list_event_records()
    assert any(e["id"] == plan.id for e in all_events)

    # 4. Delete
    deleted = delete_event_record(plan.id)
    assert deleted is True
    assert get_event_record(plan.id) is None

def test_export_and_import_integrity():
    reqs = EventRequirements(
        title="Export Test Event",
        celebration_type="baby_shower",
        event_date="2026-11-30",
        guest_count=20,
        budget=900.0
    )
    plan = create_event_plan(reqs)
    plan_dict = plan.model_dump()

    # JSON roundtrip
    exported_str = json.dumps(plan_dict)
    imported_dict = json.loads(exported_str)

    assert imported_dict["id"] == plan.id
    assert imported_dict["requirements"]["title"] == "Export Test Event"
    assert len(imported_dict["budget"]["items"]) > 0
    assert len(imported_dict["timeline"]) > 0
