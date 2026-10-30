from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Dict, Any
from datetime import datetime
from ..models.schemas import BudgetItem, BudgetSummary, EventPlan
from ..engine.budget_allocator import recalculate_budget, reallocate_budget_for_target
from ..database import get_event_record, save_event_record

router = APIRouter(prefix="/api/events/{event_id}/budget", tags=["budget"])

@router.put("/items", response_model=BudgetSummary)
def update_budget_items(event_id: str = Path(...), items: List[BudgetItem] = Body(...)):
    """
    Updates itemized expenses, recalculating category totals, remaining balance,
    and overrun flags from application state without hardcoded values.
    """
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    plan = EventPlan.model_validate(record)
    total_budget = plan.requirements.budget

    updated_summary = recalculate_budget(
        items=items,
        total_budget=total_budget,
        assumptions=plan.budget.assumptions
    )

    plan.budget = updated_summary
    plan.updated_at = datetime.now().isoformat()

    save_event_record(
        event_id=event_id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )

    return updated_summary

@router.post("/reallocate", response_model=BudgetSummary)
def reallocate_budget(event_id: str = Path(...), payload: Dict[str, float] = Body(...)):
    """
    Reallocates expenses toward a new total budget, preserving user-defined mandatory expenses.
    """
    new_budget = payload.get("new_budget")
    if new_budget is None or new_budget < 0:
        raise HTTPException(status_code=400, detail="Valid non-negative target budget is required.")

    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    plan = EventPlan.model_validate(record)
    plan.requirements.budget = new_budget
    updated_summary = reallocate_budget_for_target(plan.budget, new_budget)

    plan.budget = updated_summary
    plan.updated_at = datetime.now().isoformat()

    save_event_record(
        event_id=event_id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )

    return updated_summary
