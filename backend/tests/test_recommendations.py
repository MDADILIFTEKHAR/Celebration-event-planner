import pytest
from backend.app.models.schemas import EventRequirements
from backend.app.engine.recommendation_engine import generate_recommendations
from backend.app.engine.rules import analyze_constraints

def test_dietary_and_accessibility_constraints():
    reqs = EventRequirements(
        title="Inclusive Celebration",
        celebration_type="anniversary",
        event_date="2026-12-10",
        guest_count=40,
        budget=2500.0,
        dietary_requirements=["Vegetarian", "Gluten-Free"],
        accessibility_requirements=["Wheelchair Accessible", "Step-Free Entry"]
    )

    constraints, flags, alternatives = analyze_constraints(reqs)
    recs = generate_recommendations(reqs)

    # Verify constraints were identified
    assert any("Vegetarian" in c for c in constraints)
    assert any("Wheelchair" in c for c in constraints)

    # Verify recommendations include accessibility layout
    safety_rec = next((r for r in recs if r.category == "safety"), None)
    assert safety_rec is not None
    assert "Accessibility-First Layout Plan" in safety_rec.title
    assert "36-inch minimum pathways" in safety_rec.description

def test_outdoor_weather_contingency():
    reqs = EventRequirements(
        title="Outdoor Garden Party",
        celebration_type="birthday",
        event_date="2026-11-15",
        venue_preference="outdoor",
        budget=1200.0,
        guest_count=30
    )

    constraints, flags, alternatives = analyze_constraints(reqs)
    recs = generate_recommendations(reqs)

    assert any("weather contingency" in c.lower() for c in constraints)
    outdoor_rec = next((r for r in recs if "Weather Resilience" in r.title), None)
    assert outdoor_rec is not None
    assert outdoor_rec.is_diy_friendly is True

def test_budget_feasibility_flags_and_alternatives():
    # Extremely low budget: $200 for 50 guests = $4/guest (benchmark is $15+)
    reqs = EventRequirements(
        title="Tight Budget Gathering",
        celebration_type="birthday",
        event_date="2026-11-20",
        guest_count=50,
        budget=200.0
    )

    constraints, flags, alternatives = analyze_constraints(reqs)

    assert len(flags) > 0
    assert any("below the benchmark" in f for f in flags)
    assert len(alternatives) > 0
    assert any("potluck" in a.lower() or "home" in a.lower() or "park" in a.lower() for a in alternatives)
