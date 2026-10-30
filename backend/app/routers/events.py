from fastapi import APIRouter, HTTPException, Path
from typing import List, Dict, Any
from datetime import datetime
from ..models.schemas import EventRequirements, EventPlan
from ..engine.assistant import create_event_plan, DEMO_PRESETS
from ..database import save_event_record, get_event_record, list_event_records, delete_event_record

router = APIRouter(prefix="/api/events", tags=["events"])

@router.get("/presets", response_model=List[Dict[str, Any]])
def get_presets():
    """Returns curated demo presets for instant exploration without typing."""
    return DEMO_PRESETS

@router.get("", response_model=List[Dict[str, Any]])
def list_events():
    """Lists saved celebration plans."""
    return list_event_records()

@router.post("/plan", response_model=EventPlan)
def plan_event(reqs: EventRequirements):
    """
    Core planning endpoint: Takes user requirements, executes context-aware
    deterministic planning engine, and returns a comprehensive personalized EventPlan.
    """
    try:
        plan = create_event_plan(reqs)
        save_event_record(
            event_id=plan.id,
            title=plan.requirements.title,
            celebration_type=plan.requirements.celebration_type,
            created_at=plan.created_at,
            updated_at=plan.updated_at,
            data=plan.model_dump()
        )
        return plan
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail="Planning engine encountered an unexpected error.")

@router.get("/{event_id}", response_model=EventPlan)
def get_event(event_id: str = Path(...)):
    """Retrieves a full saved event plan by ID."""
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")
    return EventPlan.model_validate(record)

@router.put("/{event_id}", response_model=EventPlan)
def update_event(event_id: str, plan_update: EventPlan):
    """Updates and persists a celebration plan."""
    existing = get_event_record(event_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")
    
    plan_update.id = event_id
    plan_update.updated_at = datetime.now().isoformat()
    save_event_record(
        event_id=event_id,
        title=plan_update.requirements.title,
        celebration_type=plan_update.requirements.celebration_type,
        created_at=plan_update.created_at,
        updated_at=plan_update.updated_at,
        data=plan_update.model_dump()
    )
    return plan_update

@router.delete("/{event_id}")
def delete_event(event_id: str):
    """Deletes a celebration plan from persistence."""
    success = delete_event_record(event_id)
    if not success:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")
    return {"status": "deleted", "event_id": event_id}
