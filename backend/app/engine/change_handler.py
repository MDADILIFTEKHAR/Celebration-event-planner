import re
import uuid
from typing import Tuple, List, Dict, Any, Optional
from ..models.schemas import EventPlan, EventRequirements, BudgetItem
from .budget_allocator import reallocate_budget_for_target, recalculate_budget
from .recommendation_engine import generate_recommendations
from .rules import analyze_constraints

def apply_plan_changes(current_plan: EventPlan, prompt: Optional[str] = None, structured_updates: Optional[Dict[str, Any]] = None) -> Tuple[EventPlan, List[str], str]:
    """
    Applies changes to the event plan dynamically while strictly preserving
    unrelated decisions made by the user. Returns (updated_plan, changes_summary, rationale).
    """
    plan = current_plan.model_copy(deep=True)
    reqs = plan.requirements
    changes: List[str] = []
    rationale_points: List[str] = []

    text = (prompt or "").strip().lower()

    # 1. Budget Percentage Decreases or Increases
    # e.g., "my budget has decreased by 20%", "reduce budget by 15%", "budget increased by 25%"
    pct_match = re.search(r'(?:budget\s+)?(?:has\s+)?(?:decreased?|reduced?|cut|dropped?|lowered?)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%', text)
    if pct_match:
        pct = float(pct_match.group(1))
        new_budget = round(reqs.budget * (1.0 - (pct / 100.0)), 2)
        old_budget = reqs.budget
        reqs.budget = max(new_budget, 0.0)
        plan.budget = reallocate_budget_for_target(plan.budget, reqs.budget)
        changes.append(f"Reduced total budget by {pct}% (from {reqs.currency} {old_budget:.2f} to {reqs.currency} {reqs.budget:.2f}).")
        rationale_points.append("Scaled optional categories down while strictly preserving locked mandatory items and reserve.")

    pct_inc_match = re.search(r'(?:budget\s+)?(?:has\s+)?(?:increased?|raised?|boosted?|bumped?)\s+(?:by\s+)?(\d+(?:\.\d+)?)\s*%', text)
    if pct_inc_match:
        pct = float(pct_inc_match.group(1))
        new_budget = round(reqs.budget * (1.0 + (pct / 100.0)), 2)
        old_budget = reqs.budget
        reqs.budget = new_budget
        plan.budget = reallocate_budget_for_target(plan.budget, reqs.budget)
        changes.append(f"Increased total budget by {pct}% (from {reqs.currency} {old_budget:.2f} to {reqs.currency} {reqs.budget:.2f}).")
        rationale_points.append("Expanded optional and entertainment budgets while maintaining current contingency ratio.")

    # Direct budget amount: e.g. "budget is 2000", "set budget to 1800"
    abs_budget_match = re.search(r'(?:budget\s+(?:to|is|of|=)\s*|\$|€|£)\s*(\d+(?:\.\d+)?)', text)
    if abs_budget_match and not pct_match and not pct_inc_match:
        val = float(abs_budget_match.group(1))
        if val > 0:
            old_b = reqs.budget
            reqs.budget = val
            plan.budget = reallocate_budget_for_target(plan.budget, reqs.budget)
            changes.append(f"Updated total budget from {reqs.currency} {old_b:.2f} to {reqs.currency} {reqs.budget:.2f}.")
            rationale_points.append("Adjusted all allocations proportionally to match new target budget.")

    # 2. Guest Count Changes
    # e.g., "increase guest count from 30 to 50", "guest count to 40", "increase guests by 15"
    guest_from_to = re.search(r'(?:guest(?:s)?\s+(?:count\s+)?(?:from\s+\d+\s+)?to\s+(\d+))', text)
    if guest_from_to:
        new_guests = int(guest_from_to.group(1))
        old_g = reqs.guest_count
        reqs.guest_count = new_guests
        changes.append(f"Updated guest count from {old_g} to {new_guests} attendees.")
        rationale_points.append("Adjusted catering volume and seating expectations for the new attendance.")
    else:
        guest_inc = re.search(r'(?:add|increase\s+guests?\s+by)\s+(\d+)\s*(?:more\s+)?guests?', text)
        if guest_inc:
            added = int(guest_inc.group(1))
            old_g = reqs.guest_count
            reqs.guest_count += added
            changes.append(f"Added {added} guests (total: {reqs.guest_count}).")
            rationale_points.append(f"Expanded attendee list from {old_g} to {reqs.guest_count}.")

    # Update catering assumption if guest count changed
    if guest_from_to or 'guest_inc' in locals():
        for it in plan.budget.items:
            if it.category == "food_beverage":
                per_head = it.estimated_cost / max(reqs.guest_count, 1)
                it.assumption = f"{reqs.currency} {per_head:.2f}/guest x {reqs.guest_count} guests."

    # 3. Venue Preference Changes
    # e.g., "move the event indoors", "move outdoors", "make it virtual"
    if "indoors" in text or "indoor" in text:
        if reqs.venue_preference.lower() != "indoor":
            reqs.venue_preference = "indoor"
            changes.append("Moved event venue preference to Indoor.")
            rationale_points.append("Removed outdoor weather dependencies and adjusted venue checklist.")
    elif "outdoors" in text or "outdoor" in text:
        if reqs.venue_preference.lower() != "outdoor":
            reqs.venue_preference = "outdoor"
            changes.append("Moved event venue preference to Outdoor.")
            rationale_points.append("Added weather contingency requirements (rain canopy & outdoor permits).")
    elif "virtual" in text:
        if reqs.venue_preference.lower() != "virtual":
            reqs.venue_preference = "virtual"
            changes.append("Transferred celebration to Virtual format.")
            rationale_points.append("Eliminated physical venue costs and prioritized interactive digital activities.")

    # 4. Suitable for Children / Family Friendly
    if "child" in text or "kid" in text or "family" in text:
        if "no children" in text or "adults only" in text or "remove kids" in text:
            reqs.children_attending = False
            changes.append("Configured event for adults only (no children attending).")
            rationale_points.append("Removed children's games and childproofing requirements.")
        else:
            reqs.children_attending = True
            changes.append("Marked event as child-friendly with attending kids.")
            rationale_points.append("Added kids' activity stations and family safety checks.")

    # 5. Dietary Constraints
    # e.g., "i need vegetarian food", "add vegan", "gluten-free"
    diets_to_check = [
        ("vegetarian", "Vegetarian"),
        ("vegan", "Vegan"),
        ("gluten-free", "Gluten-Free"),
        ("halal", "Halal"),
        ("kosher", "Kosher"),
        ("nut-free", "Nut-Free / Allergen-Safe")
    ]
    for key, label in diets_to_check:
        if key in text:
            if label not in reqs.dietary_requirements:
                reqs.dietary_requirements.append(label)
                changes.append(f"Added dietary requirement: {label}.")
                rationale_points.append(f"Updated catering tasks to ensure certified {label} menu items with dedicated labeling.")

    # 6. Category Swaps
    # e.g., "remove photography and add more activities/entertainment"
    if ("remove photography" in text or "cut photography" in text) and ("entertainment" in text or "activities" in text):
        photo_items = [it for it in plan.budget.items if it.category == "photography"]
        ent_items = [it for it in plan.budget.items if it.category == "entertainment"]
        if photo_items and ent_items:
            released_fund = photo_items[0].estimated_cost
            photo_items[0].estimated_cost = 0.0
            photo_items[0].is_mandatory = False
            photo_items[0].assumption = "Removed per user request; funds transferred to entertainment."
            ent_items[0].estimated_cost += released_fund
            ent_items[0].assumption += f" + {reqs.currency} {released_fund:.2f} reallocated from photography."
            plan.budget = recalculate_budget(plan.budget.items, reqs.budget, plan.budget.assumptions)
            changes.append(f"Transferred {reqs.currency} {released_fund:.2f} from Photography to Entertainment & Music.")
            rationale_points.append("Amplified interactive group activities and live entertainment per preference.")

    # 7. Apply any structured direct updates if passed from forms
    if structured_updates:
        for k, v in structured_updates.items():
            if hasattr(reqs, k):
                old_val = getattr(reqs, k)
                if old_val != v:
                    setattr(reqs, k, v)
                    changes.append(f"Updated {k.replace('_', ' ')} from {old_val} to {v}.")

    # If no recognized keywords matched, provide general acknowledgment
    if not changes and prompt:
        changes.append(f"Reviewed instruction: '{prompt}'.")
        rationale_points.append("Verified plan against current parameters; preserved all existing budget and timeline specifications.")

    # Regenerate recommendations & constraint checks to reflect updated requirements
    plan.recommendations = generate_recommendations(reqs)
    plan.identified_constraints, plan.feasibility_flags, plan.alternatives = analyze_constraints(reqs)
    plan.requirements = reqs

    summary_text = "; ".join(changes) if changes else "No modifications required."
    rationale_text = " ".join(rationale_points) if rationale_points else "Plan parameters kept intact."

    return plan, changes, rationale_text
