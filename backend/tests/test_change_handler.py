import pytest
from backend.app.models.schemas import EventRequirements
from backend.app.engine.assistant import create_event_plan
from backend.app.engine.change_handler import apply_plan_changes

def test_budget_percentage_decrease_adaptation():
    reqs = EventRequirements(
        title="Custom 40th Party",
        celebration_type="birthday",
        event_date="2026-11-20",
        budget=2000.0,
        guest_count=30,
        special_notes="Do not forget custom retro playlist."
    )
    initial_plan = create_event_plan(reqs)

    # Apply 20% budget cut
    updated_plan, changes, rationale = apply_plan_changes(
        current_plan=initial_plan,
        prompt="My budget has decreased by 20%."
    )

    # Budget should now be 1600.0
    assert updated_plan.requirements.budget == 1600.0
    assert updated_plan.budget.total_budget == 1600.0
    assert any("Reduced total budget by 20.0%" in c for c in changes)
    assert len(rationale) > 0

    # Unrelated user decisions preserved
    assert updated_plan.requirements.special_notes == "Do not forget custom retro playlist."
    assert updated_plan.requirements.title == "Custom 40th Party"

def test_guest_count_increase_adaptation():
    reqs = EventRequirements(
        title="Expanding Party",
        celebration_type="birthday",
        event_date="2026-11-20",
        guest_count=30,
        budget=1500.0
    )
    initial_plan = create_event_plan(reqs)

    updated_plan, changes, rationale = apply_plan_changes(
        current_plan=initial_plan,
        prompt="Increase the guest count from 30 to 50."
    )

    assert updated_plan.requirements.guest_count == 50
    assert any("Updated guest count from 30 to 50" in c for c in changes)

def test_switch_venue_to_indoors():
    reqs = EventRequirements(
        title="Weather Change Event",
        celebration_type="birthday",
        event_date="2026-11-20",
        venue_preference="outdoor",
        budget=1500.0
    )
    initial_plan = create_event_plan(reqs)

    updated_plan, changes, rationale = apply_plan_changes(
        current_plan=initial_plan,
        prompt="Move the event indoors."
    )

    assert updated_plan.requirements.venue_preference == "indoor"
    assert any("Moved event venue preference to Indoor" in c for c in changes)

def test_add_vegetarian_requirement():
    reqs = EventRequirements(
        title="Catering Dietary Adjustment",
        celebration_type="dinner_party",
        event_date="2026-11-20",
        budget=1800.0,
        dietary_requirements=[]
    )
    initial_plan = create_event_plan(reqs)

    updated_plan, changes, rationale = apply_plan_changes(
        current_plan=initial_plan,
        prompt="I need vegetarian food for some guests."
    )

    assert "Vegetarian" in updated_plan.requirements.dietary_requirements
    assert any("Added dietary requirement: Vegetarian" in c for c in changes)

def test_swap_photography_for_entertainment():
    reqs = EventRequirements(
        title="Entertainment Focus Party",
        celebration_type="birthday",
        event_date="2026-11-20",
        budget=2000.0
    )
    initial_plan = create_event_plan(reqs)

    initial_photo = next(it for it in initial_plan.budget.items if it.category == "photography").estimated_cost
    initial_ent = next(it for it in initial_plan.budget.items if it.category == "entertainment").estimated_cost

    updated_plan, changes, rationale = apply_plan_changes(
        current_plan=initial_plan,
        prompt="Remove photography and add more entertainment."
    )

    updated_photo = next(it for it in updated_plan.budget.items if it.category == "photography").estimated_cost
    updated_ent = next(it for it in updated_plan.budget.items if it.category == "entertainment").estimated_cost

    assert updated_photo == 0.0
    assert updated_ent == initial_ent + initial_photo
    assert any("Transferred" in c for c in changes)
