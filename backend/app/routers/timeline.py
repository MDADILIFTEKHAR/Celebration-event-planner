from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Dict, Any
from datetime import datetime
from ..models.schemas import TimelineItem, EventPlan
from ..engine.timeline_generator import validate_timeline
from ..database import get_event_record, save_event_record

router = APIRouter(prefix="/api/events/{event_id}/timeline", tags=["timeline"])

@router.put("", response_model=Dict[str, Any])
def update_timeline(event_id: str = Path(...), items: List[TimelineItem] = Body(...)):
    """
    Updates schedule timeline, checking chronological order and flagging overlapping milestones.
    """
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    is_valid, validation_messages = validate_timeline(items)

    plan = EventPlan.model_validate(record)
    plan.timeline = items
    plan.updated_at = datetime.now().isoformat()

    save_event_record(
        event_id=event_id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )

    return {
        "timeline": items,
        "is_valid": is_valid,
        "validation_messages": validation_messages
    }
