from fastapi import APIRouter, HTTPException, Path
from typing import Dict, Any, List
from datetime import datetime
from ..models.schemas import (
    PlanAdjustmentRequest, PlanAdjustmentResponse, EventPlan, AssistantQuestion
)
from ..engine.change_handler import apply_plan_changes
from ..engine.assistant import get_progressive_questions
from ..ai.llm_client import AIProviderStatus
from ..database import get_event_record, save_event_record

router = APIRouter(prefix="/api/planner", tags=["planner"])

@router.get("/status")
def get_ai_status():
    """Returns dual-mode AI engine status and provider configuration."""
    return AIProviderStatus.get_status()

@router.post("/questions", response_model=List[AssistantQuestion])
def get_questions(current_reqs: Dict[str, Any]):
    """Returns progressive questions targeting only missing details without user fatigue."""
    return get_progressive_questions(current_reqs)

@router.post("/adjust/{event_id}", response_model=PlanAdjustmentResponse)
def adjust_plan(event_id: str = Path(...), request: PlanAdjustmentRequest = ...):
    """
    Intelligently adapts an existing celebration plan to changing user instructions
    (e.g., 'budget decreased by 20%', 'move indoors', 'add vegetarian option'),
    while strictly preserving unrelated choices and outputting a clear explanation diff.
    """
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    current_plan = EventPlan.model_validate(record)

    updated_plan, changes_summary, rationale = apply_plan_changes(
        current_plan=current_plan,
        prompt=request.prompt,
        structured_updates=request.structured_updates
    )

    updated_plan.updated_at = datetime.now().isoformat()

    # Persist updated plan
    save_event_record(
        event_id=event_id,
        title=updated_plan.requirements.title,
        celebration_type=updated_plan.requirements.celebration_type,
        created_at=updated_plan.created_at,
        updated_at=updated_plan.updated_at,
        data=updated_plan.model_dump()
    )

    return PlanAdjustmentResponse(
        updated_plan=updated_plan,
        changes_summary=changes_summary,
        rationale=rationale
    )
