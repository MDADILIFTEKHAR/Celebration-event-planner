import uuid
from datetime import datetime, timedelta
from typing import List, Tuple
from ..models.schemas import EventRequirements, TimelineItem
from .rules import CELEBRATION_CONFIGS

def format_time_from_start(start_time_str: str, offset_minutes: int) -> str:
    """Calculates formatted 24-hr or 12-hr time string from start_time HH:MM and offset in minutes."""
    try:
        parts = start_time_str.split(":")
        hour = int(parts[0])
        minute = int(parts[1]) if len(parts) > 1 else 0
        base_time = datetime(2026, 1, 1, hour, minute)
        target_time = base_time + timedelta(minutes=offset_minutes)
        return target_time.strftime("%H:%M")
    except Exception:
        return f"{offset_minutes:+d}m"

def generate_initial_timeline(reqs: EventRequirements) -> List[TimelineItem]:
    """
    Generates a context-aware chronological schedule based on celebration type,
    start time, and total duration.
    """
    c_type = reqs.celebration_type.lower()
    config = CELEBRATION_CONFIGS.get(c_type, CELEBRATION_CONFIGS["custom"])
    duration_minutes = int(reqs.duration_hours * 60)
    start_time = reqs.start_time or "18:00"

    items: List[TimelineItem] = []

    # 1. Setup / Vendor load-in (Before start)
    setup_offset = -90 if reqs.duration_hours >= 4 else -60
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=setup_offset,
        display_time=format_time_from_start(start_time, setup_offset),
        duration_minutes=abs(setup_offset) - 30,
        title="Venue Access & Setup Phase",
        description="Host and setup team arrive. Arrange tables, place settings, balloon arches, and backdrop.",
        category="setup",
        is_milestone=False
    ))

    # 2. Final check & music test (-30 min)
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=-30,
        display_time=format_time_from_start(start_time, -30),
        duration_minutes=30,
        title="Audio & Vendor Readiness Check",
        description="Test sound system, verify catering arrival, chill beverages, and light decorative candles.",
        category="setup",
        is_milestone=False
    ))

    # 3. Guest Arrival (0 min)
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=0,
        display_time=format_time_from_start(start_time, 0),
        duration_minutes=30,
        title="Guest Arrival & Welcome Refreshments",
        description="Welcome guests at entrance, direct to coat area/guestbook, serve welcome drinks and light canapés.",
        category="arrival",
        is_milestone=True
    ))

    # 4. Icebreaker & Social Mingling (30 min)
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=30,
        display_time=format_time_from_start(start_time, 30),
        duration_minutes=45,
        title="Opening Welcome & Social Mingling",
        description="Warm welcome toast by the host, introductory group activities or photo-booth photo rounds.",
        category="entertainment",
        is_milestone=False
    ))

    # 5. Main Dining Service (75 min)
    dining_duration = 60 if duration_minutes >= 240 else 45
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=75,
        display_time=format_time_from_start(start_time, 75),
        duration_minutes=dining_duration,
        title="Main Meal & Catering Service",
        description="Buffet, plated dinner or party food stations open. Accommodate special dietary preferences.",
        category="dining",
        is_milestone=True
    ))

    # 6. Celebration Climax: Cake Cutting & Toasts
    highlight_offset = 75 + dining_duration + 15
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=highlight_offset,
        display_time=format_time_from_start(start_time, highlight_offset),
        duration_minutes=30,
        title="Celebration Highlight, Cake Cutting & Speeches",
        description="Gather all guests around the centerpiece. Deliver heartwarming toasts and cut the celebration cake.",
        category="highlight",
        is_milestone=True
    ))

    # 7. Entertainment, Dance, or Party Games
    activity_offset = highlight_offset + 30
    activity_duration = max(duration_minutes - activity_offset - 30, 30)
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=activity_offset,
        display_time=format_time_from_start(start_time, activity_offset),
        duration_minutes=activity_duration,
        title="High-Energy Music, Dancing & Games",
        description="Curated playlist, group games, open dance floor, or guest mingling with desserts and coffee.",
        category="entertainment",
        is_milestone=False
    ))

    # 8. Farewell & Guest Departure
    farewell_offset = duration_minutes - 20
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=farewell_offset,
        display_time=format_time_from_start(start_time, farewell_offset),
        duration_minutes=20,
        title="Farewell Remarks & Favor Distribution",
        description="Host thanks guests for coming, distribute celebration favors and keepsake photo prints.",
        category="departure",
        is_milestone=True
    ))

    # 9. Pack down & Cleanup (After event ends)
    cleanup_offset = duration_minutes
    items.append(TimelineItem(
        id=f"time-{uuid.uuid4().hex[:8]}",
        time_offset_minutes=cleanup_offset,
        display_time=format_time_from_start(start_time, cleanup_offset),
        duration_minutes=45,
        title="Cleanup & Venue Handover",
        description="Pack up personal decor, collect gifts, clear trash, and complete venue inspection with manager.",
        category="cleanup",
        is_milestone=False
    ))

    return items

def validate_timeline(items: List[TimelineItem]) -> Tuple[bool, List[str]]:
    """
    Validates chronological integrity, non-negative durations, and flags potential schedule clashes.
    Returns: (is_valid, list_of_errors_or_warnings)
    """
    errors: List[str] = []
    if not items:
        return False, ["Timeline cannot be empty."]

    # Sort items by offset to check sequence
    sorted_items = sorted(items, key=lambda x: x.time_offset_minutes)

    for i, it in enumerate(sorted_items):
        if it.duration_minutes <= 0:
            errors.append(f"Activity '{it.title}' has invalid duration ({it.duration_minutes} mins). Must be positive.")

        # Check overlapping activities in the same critical category
        if i > 0:
            prev = sorted_items[i - 1]
            prev_end = prev.time_offset_minutes + prev.duration_minutes
            if it.time_offset_minutes < prev_end:
                # Warning for overlapping
                if prev.category in ["dining", "highlight"] and it.category in ["dining", "highlight"]:
                    errors.append(f"Clash: '{it.title}' overlaps with preceding priority milestone '{prev.title}'.")

    is_valid = len(errors) == 0
    return is_valid, errors
