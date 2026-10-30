import pytest
from backend.app.models.schemas import Guest
from backend.app.routers.guests import compute_guest_metrics

def test_guest_attendance_and_metrics_calculation():
    guests = [
        Guest(id="g1", name="Alice", rsvp_status="attending", plus_ones=1, dietary_requirements=["Vegetarian"]),
        Guest(id="g2", name="Bob", rsvp_status="attending", plus_ones=0, is_child=True),
        Guest(id="g3", name="Charlie", rsvp_status="tentative", plus_ones=1, dietary_requirements=["Gluten-Free"]),
        Guest(id="g4", name="David", rsvp_status="declined", plus_ones=0),
    ]

    metrics = compute_guest_metrics(guests)

    # Alice (1+1=2) + Bob (1+0=1) = 3 confirmed
    assert metrics["confirmed_attending"] == 3
    # Charlie (1+1=2 tentative)
    assert metrics["tentative"] == 2
    # David (1 declined)
    assert metrics["declined"] == 1
    # Expected attendance = 3 confirmed + round(2 * 0.5) = 4
    assert metrics["expected_attendance"] == 4
    # Children count (Bob = 1)
    assert metrics["children_count"] == 1
    # Dietary breakdown
    assert metrics["dietary_breakdown"]["Vegetarian"] == 2
    assert metrics["dietary_breakdown"]["Gluten-Free"] == 2
    # Recommended tables (4 guests / 8 seats per table -> 1 table)
    assert metrics["recommended_tables"] == 1
    assert "prepare meals for 4 guests" in metrics["catering_advice"]

def test_empty_guest_list_handling():
    metrics = compute_guest_metrics([])
    assert metrics["total_guest_entries"] == 0
    assert metrics["confirmed_attending"] == 0
    assert metrics["expected_attendance"] == 0
    assert metrics["recommended_tables"] == 1
    assert "Awaiting RSVP responses" in metrics["catering_advice"]
