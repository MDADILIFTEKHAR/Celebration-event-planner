import pytest
from backend.app.models.schemas import EventRequirements, TimelineItem
from backend.app.engine.timeline_generator import (
    generate_initial_timeline, validate_timeline, format_time_from_start
)

def test_timeline_ordering_and_times():
    reqs = EventRequirements(
        title="Schedule Test",
        event_date="2026-11-20",
        start_time="17:00",
        duration_hours=4.0
    )
    timeline = generate_initial_timeline(reqs)

    assert len(timeline) >= 6
    # Offsets should increase chronologically
    offsets = [item.time_offset_minutes for item in timeline]
    assert offsets == sorted(offsets)

    # Starts with setup before 0
    assert timeline[0].time_offset_minutes < 0
    # Guest arrival at 0 min
    arrival = next(it for it in timeline if it.time_offset_minutes == 0)
    assert arrival.display_time == "17:00"

    is_valid, errors = validate_timeline(timeline)
    assert is_valid is True
    assert len(errors) == 0

def test_invalid_timeline_durations():
    invalid_items = [
        TimelineItem(
            id="1",
            time_offset_minutes=0,
            display_time="18:00",
            duration_minutes=0,  # Invalid zero duration
            title="Zero Duration Test",
            description="",
            category="arrival"
        ),
        TimelineItem(
            id="2",
            time_offset_minutes=30,
            display_time="18:30",
            duration_minutes=-15,  # Invalid negative duration
            title="Negative Duration Test",
            description="",
            category="dining"
        )
    ]
    is_valid, errors = validate_timeline(invalid_items)
    assert is_valid is False
    assert len(errors) == 2
    assert "invalid duration" in errors[0]

def test_overlapping_milestones_clash():
    clashing_items = [
        TimelineItem(
            id="1",
            time_offset_minutes=60,
            display_time="19:00",
            duration_minutes=90,  # ends at 150
            title="Banquet Dining",
            description="",
            category="dining",
            is_milestone=True
        ),
        TimelineItem(
            id="2",
            time_offset_minutes=120,  # starts before dining finishes
            display_time="20:00",
            duration_minutes=30,
            title="Cake Cutting & Toasts",
            description="",
            category="highlight",
            is_milestone=True
        )
    ]
    is_valid, errors = validate_timeline(clashing_items)
    assert is_valid is False
    assert any("overlaps" in err for err in errors)

def test_format_time_calculation():
    assert format_time_from_start("18:00", 60) == "19:00"
    assert format_time_from_start("18:00", -90) == "16:30"
    assert format_time_from_start("23:30", 60) == "00:30"
