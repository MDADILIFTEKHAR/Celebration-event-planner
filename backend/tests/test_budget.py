import pytest
from backend.app.models.schemas import EventRequirements, BudgetItem
from backend.app.engine.budget_allocator import (
    allocate_initial_budget, recalculate_budget, reallocate_budget_for_target
)

def test_budget_totals_and_remaining_balance():
    reqs = EventRequirements(
        title="Test Birthday",
        celebration_type="birthday",
        event_date="2026-11-20",
        guest_count=30,
        budget=1500.0,
        currency="USD"
    )
    summary = allocate_initial_budget(reqs)

    assert summary.total_budget == 1500.0
    assert summary.total_allocated == round(sum(item.estimated_cost for item in summary.items), 2)
    assert summary.remaining_budget == round(summary.total_budget - summary.total_allocated, 2)
    assert not summary.is_overrun
    assert summary.overrun_amount == 0.0
    assert summary.contingency_amount > 0

def test_invalid_and_edge_case_budget_values():
    # Negative budget should be rejected by model validation
    with pytest.raises(ValueError):
        EventRequirements(
            title="Invalid Budget",
            event_date="2026-11-20",
            budget=-500.0
        )

    # Zero budget edge case
    reqs_zero = EventRequirements(
        title="Zero Budget Gathering",
        celebration_type="birthday",
        event_date="2026-11-20",
        guest_count=20,
        budget=0.0
    )
    summary_zero = allocate_initial_budget(reqs_zero)
    assert summary_zero.total_budget == 0.0
    assert summary_zero.total_allocated == 0.0
    assert summary_zero.remaining_budget == 0.0
    assert not summary_zero.is_overrun

def test_budget_overrun_detection():
    items = [
        BudgetItem(id="1", category="venue", name="Venue", estimated_cost=800.0, is_mandatory=True),
        BudgetItem(id="2", category="food_beverage", name="Catering", estimated_cost=500.0, is_mandatory=True),
        BudgetItem(id="3", category="decorations", name="Decor", estimated_cost=300.0, is_mandatory=False),
    ]
    # Total allocated = 1600, but budget = 1200
    summary = recalculate_budget(items=items, total_budget=1200.0)

    assert summary.is_overrun is True
    assert summary.overrun_amount == 400.0
    assert summary.remaining_budget == -400.0
    assert summary.utilization_percentage > 100.0

def test_contingency_reserve_calculation():
    reqs = EventRequirements(
        title="Safety Reserve Test",
        event_date="2026-11-20",
        budget=2000.0,
        guest_count=40
    )
    summary = allocate_initial_budget(reqs)

    # Contingency buffer is typically 8% of total budget
    expected_contingency = round(2000.0 * 0.08, 2)
    assert summary.contingency_amount == expected_contingency
    contingency_item = next(it for it in summary.items if it.category == "contingency")
    assert contingency_item.is_mandatory is True

def test_budget_reallocation_preserves_mandatory_expenses():
    reqs = EventRequirements(
        title="Reallocation Test",
        event_date="2026-11-20",
        budget=2000.0,
        guest_count=25
    )
    summary = allocate_initial_budget(reqs)

    # Find a mandatory item cost before reallocation
    venue_item = next(it for it in summary.items if it.category == "venue")
    initial_venue_cost = venue_item.estimated_cost
    assert venue_item.is_mandatory is True

    # Reduce budget by 30% (from 2000 to 1400)
    reduced_summary = reallocate_budget_for_target(summary, 1400.0)

    # Check that mandatory venue cost was strictly preserved
    reduced_venue_item = next(it for it in reduced_summary.items if it.category == "venue")
    assert reduced_venue_item.estimated_cost == initial_venue_cost

    # Check that optional decor item was scaled down to fit
    initial_decor = next(it for it in summary.items if it.category == "decorations")
    reduced_decor = next(it for it in reduced_summary.items if it.category == "decorations")
    assert reduced_decor.estimated_cost < initial_decor.estimated_cost
    assert reduced_summary.total_budget == 1400.0
