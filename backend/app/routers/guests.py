import uuid
from fastapi import APIRouter, HTTPException, Path, Body
from typing import List, Dict, Any
from datetime import datetime
from ..models.schemas import Guest, EventPlan
from ..database import get_event_record, save_event_record

router = APIRouter(prefix="/api/events/{event_id}/guests", tags=["guests"])

def compute_guest_metrics(guests: List[Guest]) -> Dict[str, Any]:
    total_invited = len(guests)
    attending = 0
    tentative = 0
    declined = 0
    children = 0
    dietary_counts: Dict[str, int] = {}

    for g in guests:
        headcount = 1 + g.plus_ones
        if g.is_child:
            children += headcount

        for d in g.dietary_requirements:
            dietary_counts[d] = dietary_counts.get(d, 0) + headcount

        status = g.rsvp_status.lower()
        if status == "attending":
            attending += headcount
        elif status == "tentative":
            tentative += headcount
        elif status == "declined":
            declined += headcount

    expected_attendance = int(attending + round(tentative * 0.5))
    tables_needed = max(1, (expected_attendance + 7) // 8)  # 8 guests per round table

    return {
        "total_guest_entries": total_invited,
        "confirmed_attending": attending,
        "tentative": tentative,
        "declined": declined,
        "expected_attendance": expected_attendance,
        "children_count": children,
        "dietary_breakdown": dietary_counts,
        "recommended_tables": tables_needed,
        "catering_advice": (
            f"Based on RSVPs, prepare meals for {expected_attendance} guests across ~{tables_needed} tables. "
            f"Include {dietary_counts.get('Vegetarian', 0)} vegetarian portions."
            if expected_attendance > 0
            else "Awaiting RSVP responses."
        )
    }

@router.get("/summary", response_model=Dict[str, Any])
def get_guests_summary(event_id: str = Path(...)):
    """Returns guest attendance statistics, dietary breakdown, and table seating guidance."""
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    plan = EventPlan.model_validate(record)
    metrics = compute_guest_metrics(plan.guests)
    return {
        "guests": plan.guests,
        "metrics": metrics
    }

@router.post("", response_model=Guest)
def add_guest(event_id: str = Path(...), guest: Guest = Body(...)):
    """Adds a guest to the event plan."""
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    plan = EventPlan.model_validate(record)
    if not guest.id:
        guest.id = f"guest-{uuid.uuid4().hex[:8]}"

    plan.guests.append(guest)
    plan.updated_at = datetime.now().isoformat()

    save_event_record(
        event_id=event_id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )
    return guest

@router.put("/{guest_id}", response_model=Guest)
def update_guest(event_id: str = Path(...), guest_id: str = Path(...), updated_guest: Guest = Body(...)):
    """Updates RSVP status or dietary preferences of a specific guest."""
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    plan = EventPlan.model_validate(record)
    found = False
    for i, g in enumerate(plan.guests):
        if g.id == guest_id:
            updated_guest.id = guest_id
            plan.guests[i] = updated_guest
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Guest record not found.")

    plan.updated_at = datetime.now().isoformat()
    save_event_record(
        event_id=event_id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )
    return updated_guest

@router.delete("/{guest_id}")
def delete_guest(event_id: str = Path(...), guest_id: str = Path(...)):
    """Removes a guest from the event plan."""
    record = get_event_record(event_id)
    if not record:
        raise HTTPException(status_code=404, detail="Celebration plan not found.")

    plan = EventPlan.model_validate(record)
    orig_count = len(plan.guests)
    plan.guests = [g for g in plan.guests if g.id != guest_id]
    if len(plan.guests) == orig_count:
        raise HTTPException(status_code=404, detail="Guest record not found.")

    plan.updated_at = datetime.now().isoformat()
    save_event_record(
        event_id=event_id,
        title=plan.requirements.title,
        celebration_type=plan.requirements.celebration_type,
        created_at=plan.created_at,
        updated_at=plan.updated_at,
        data=plan.model_dump()
    )
    return {"status": "deleted", "guest_id": guest_id}
