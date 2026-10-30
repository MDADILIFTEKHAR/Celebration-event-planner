import uuid
from datetime import datetime, timedelta
from typing import List
from ..models.schemas import EventRequirements, ChecklistItem

def calculate_due_date(event_date_str: str, days_before: int) -> str:
    """Calculates due date string YYYY-MM-DD from event_date and days offset."""
    try:
        e_date = datetime.strptime(event_date_str, "%Y-%m-%d")
        due = e_date - timedelta(days=days_before)
        return due.strftime("%Y-%m-%d")
    except Exception:
        return f"{days_before} days prior"

def generate_initial_checklist(reqs: EventRequirements) -> List[ChecklistItem]:
    """Generates an actionable, prioritized planning checklist tailored to event requirements."""
    c_type = reqs.celebration_type.lower()
    event_date = reqs.event_date

    tasks_spec = [
        # (days_before, task, category, priority, notes)
        (45, "Finalize guest list and confirm maximum capacity with venue", "guests", "high", "Ensure room for seated dining and active zones."),
        (40, f"Book {reqs.venue_preference} venue space and confirm reservation deposit", "venue", "high", "Ask for access hours, power outlets, and cleanup rules."),
        (35, "Design and dispatch digital or printed celebration invitations", "guests", "high", "Include RSVP deadline (at least 2 weeks before event) and dietary prompt."),
        (30, "Review catering menu options and accommodate dietary preferences", "catering", "high", "Confirm vegetarian, vegan, and allergy safety accommodations."),
        (25, "Order celebration centerpiece cake and dessert assortments", "catering", "medium", "Specify theme design, cake flavors, and pickup/delivery window."),
        (21, "Curate celebration music playlist or confirm performer/DJ details", "entertainment", "medium", "Select arrival, dining, toast, and high-energy dance tracks."),
        (14, "Audit RSVPs and compile final headcount & seating chart", "guests", "high", "Directly follow up with any outstanding pending invitees."),
        (10, "Purchase themed decorations, table runners, and lighting supplies", "decor", "medium", f"Match atmosphere '{reqs.atmosphere}' and color accents."),
        (7, "Send final guaranteed attendance number to catering team", "catering", "high", "Prevent food shortage or costly over-ordering."),
        (3, "Assemble guest favor bags, photo props, and print schedule notes", "logistics", "low", "Designate a secure storage box for event transport."),
        (1, "Pack celebration emergency kit (scissors, tape, chargers, safety pins)", "logistics", "medium", "Essential for quick troubleshooting on event day."),
        (0, "Execute event day timeline: supervise setup, welcome guests, enjoy!", "logistics", "high", "Assign trusted co-host to help manage timings.")
    ]

    # Add dietary-specific tasks if needed
    if reqs.dietary_requirements:
        tasks_spec.insert(4, (
            28,
            f"Prepare labeled buffet signs for dietary needs: {', '.join(reqs.dietary_requirements)}",
            "catering",
            "medium",
            "Clear signage gives guests peace of mind regarding ingredients."
        ))

    # Add child-friendly tasks if children attending
    if reqs.children_attending:
        tasks_spec.insert(5, (
            20,
            "Prepare children's activity pack (coloring sheets, crayons, safe games)",
            "entertainment",
            "medium",
            "Keep young attendees engaged during toasts and dining."
        ))

    items: List[ChecklistItem] = []
    for days, task, cat, prio, notes in tasks_spec:
        items.append(ChecklistItem(
            id=f"task-{uuid.uuid4().hex[:8]}",
            task=task,
            category=cat,
            priority=prio,
            due_offset_days=days,
            due_date=calculate_due_date(event_date, days),
            status="todo",
            notes=notes
        ))

    return items
