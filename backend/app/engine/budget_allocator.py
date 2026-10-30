import uuid
from typing import List, Dict, Any
from ..models.schemas import EventRequirements, BudgetItem, BudgetSummary
from .rules import CELEBRATION_CONFIGS

def allocate_initial_budget(reqs: EventRequirements) -> BudgetSummary:
    """
    Generates a realistic itemized budget allocation based on celebration requirements,
    guest count, and industry benchmarks with transparent assumptions.
    """
    c_type = reqs.celebration_type.lower()
    config = CELEBRATION_CONFIGS.get(c_type, CELEBRATION_CONFIGS["custom"])
    allocations = config["default_allocations"]
    essential_categories = set(config["essential_categories"])

    total_budget = max(reqs.budget, 0.0)
    guest_count = max(reqs.guest_count, 1)
    currency = reqs.currency

    # Contingency reserve is determined first (8-10%)
    contingency_pct = allocations.get("contingency", 0.08)
    contingency_amount = round(total_budget * contingency_pct, 2)
    distributable_budget = max(total_budget - contingency_amount, 0.0)

    # Calculate itemized breakdown
    items: List[BudgetItem] = []
    assumptions: List[str] = []

    # 1. Venue
    venue_share = allocations.get("venue", 0.20)
    venue_budget = round(distributable_budget * venue_share, 2)
    is_virtual = reqs.venue_preference.lower() == "virtual"
    if is_virtual:
        venue_budget = 0.0
        venue_assumption = "Virtual event: no venue space rental fee."
    elif reqs.venue_preference.lower() == "outdoor":
        venue_assumption = f"Park pavilion / outdoor space permit & setup (~{currency} {venue_budget:.0f})."
    else:
        venue_assumption = f"Hall / private dining room / venue rental with tables & chairs (~{currency} {venue_budget:.0f})."

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="venue",
        name="Venue Space Rental & Access Permit",
        estimated_cost=venue_budget,
        is_mandatory="venue" in essential_categories and not is_virtual,
        assumption=venue_assumption,
        notes="Confirm standard duration, load-in time, and trash disposal policies."
    ))

    # 2. Food & Beverages
    food_share = allocations.get("food_beverage", 0.38)
    # If virtual, we redistribute part of venue to custom favor/care packs
    if is_virtual:
        food_share += 0.10
    food_budget = round(distributable_budget * food_share, 2)
    per_guest_food = food_budget / guest_count if guest_count > 0 else 0
    food_assumption = f"{currency} {per_guest_food:.2f}/guest x {guest_count} guests (main fare, appetizers & refreshments)."
    assumptions.append(f"Catering is estimated at {currency} {per_guest_food:.2f} per person.")

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="food_beverage",
        name="Catering, Meals & Refreshments",
        estimated_cost=food_budget,
        is_mandatory="food_beverage" in essential_categories,
        assumption=food_assumption,
        notes="Includes accommodations for dietary requirements (vegetarian, allergies)."
    ))

    # 3. Cake & Desserts
    cake_share = allocations.get("cake_dessert", 0.07)
    cake_budget = round(distributable_budget * cake_share, 2)
    cake_assumption = f"Custom celebration cake or dessert buffet (~{currency} {cake_budget:.0f})."

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="cake_dessert",
        name="Celebration Cake & Specialty Desserts",
        estimated_cost=cake_budget,
        is_mandatory="cake_dessert" in essential_categories,
        assumption=cake_assumption,
        notes="Tiered cake or cupcakes with custom theme toppers."
    ))

    # 4. Decorations & Styling
    decor_share = allocations.get("decorations", 0.10)
    decor_budget = round(distributable_budget * decor_share, 2)
    diy_note = "DIY balloon arch and table centerpieces" if reqs.diy_preference == "diy_heavy" else "Floral arrangements and themed backdrops"
    decor_assumption = f"{diy_note} with thematic accents (~{currency} {decor_budget:.0f})."

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="decorations",
        name="Atmosphere Decor, Centerpieces & Backdrops",
        estimated_cost=decor_budget,
        is_mandatory=False,
        assumption=decor_assumption,
        notes="Palette coordinated with event theme and atmospheric lighting."
    ))

    # 5. Entertainment & Music
    ent_share = allocations.get("entertainment", 0.10)
    ent_budget = round(distributable_budget * ent_share, 2)
    ent_assumption = f"Sound system / DJ playlist / interactive group party games (~{currency} {ent_budget:.0f})."

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="entertainment",
        name="Sound, Music & Interactive Entertainment",
        estimated_cost=ent_budget,
        is_mandatory=False,
        assumption=ent_assumption,
        notes="Custom curated playlist or live performer/entertainer."
    ))

    # 6. Photography & Keepsakes
    photo_share = allocations.get("photography", 0.06)
    photo_budget = round(distributable_budget * photo_share, 2)
    photo_assumption = f"Event photographer or Polaroid instant memory station (~{currency} {photo_budget:.0f})."

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="photography",
        name="Photography & Memory Keepsakes",
        estimated_cost=photo_budget,
        is_mandatory="photography" in essential_categories,
        assumption=photo_assumption,
        notes="High-resolution digital gallery and guestbook."
    ))

    # 7. Invitations & Favors
    inv_share = allocations.get("invitations_favors", 0.03)
    inv_budget = round(distributable_budget * inv_share, 2)
    inv_assumption = f"Digital RSVP stationery & departure party favors (~{currency} {inv_budget:.0f})."

    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="invitations_favors",
        name="Invitations, Stationery & Guest Favors",
        estimated_cost=inv_budget,
        is_mandatory=False,
        assumption=inv_assumption,
        notes="Custom designed digital invitations and token guest favors."
    ))

    # 8. Contingency Reserve Item
    items.append(BudgetItem(
        id=f"item-{uuid.uuid4().hex[:8]}",
        category="contingency",
        name="Contingency Reserve & Unforeseen Needs",
        estimated_cost=contingency_amount,
        is_mandatory=True,
        assumption=f"Safety buffer allocated at {contingency_pct*100:.0f}% of total budget.",
        notes="Reserved for unexpected last-minute additions, delivery fees, or gratuity."
    ))

    assumptions.append(f"Contingency buffer set to {contingency_pct*100:.0f}% ({currency} {contingency_amount:.2f}).")
    assumptions.append(f"Costs are calculated transparently and can be edited anytime.")

    return recalculate_budget(items=items, total_budget=total_budget, assumptions=assumptions)


def recalculate_budget(items: List[BudgetItem], total_budget: float, assumptions: List[str] = None) -> BudgetSummary:
    """
    Recalculates budget summary from actual items state without hardcoded values.
    Handles zero, negative, and invalid values safely.
    """
    total_budget = max(float(total_budget), 0.0)

    category_totals: Dict[str, float] = {}
    total_allocated = 0.0
    contingency_amount = 0.0

    for item in items:
        cost = max(float(item.estimated_cost), 0.0)
        item.estimated_cost = round(cost, 2)
        total_allocated += cost
        cat = item.category
        category_totals[cat] = category_totals.get(cat, 0.0) + cost
        if cat == "contingency":
            contingency_amount += cost

    total_allocated = round(total_allocated, 2)
    remaining_budget = round(total_budget - total_allocated, 2)
    is_overrun = total_allocated > total_budget
    overrun_amount = round(total_allocated - total_budget, 2) if is_overrun else 0.0

    utilization_pct = round((total_allocated / total_budget * 100), 1) if total_budget > 0 else 0.0
    contingency_pct = round((contingency_amount / total_budget * 100), 1) if total_budget > 0 else 0.0

    return BudgetSummary(
        total_budget=round(total_budget, 2),
        total_allocated=total_allocated,
        remaining_budget=remaining_budget,
        utilization_percentage=utilization_pct,
        contingency_amount=contingency_amount,
        contingency_percentage=contingency_pct,
        is_overrun=is_overrun,
        overrun_amount=overrun_amount,
        category_totals={k: round(v, 2) for k, v in category_totals.items()},
        items=items,
        assumptions=assumptions or []
    )


def reallocate_budget_for_target(current_summary: BudgetSummary, new_target_budget: float) -> BudgetSummary:
    """
    Dynamically reallocates optional expenses when budget changes (e.g. reduced by 20%),
    while strictly preserving user-defined mandatory expenses!
    """
    new_target_budget = max(float(new_target_budget), 0.0)
    items = [item.model_copy() for item in current_summary.items]

    # Separate mandatory vs optional items
    mandatory_items = [it for it in items if it.is_mandatory and it.category != "contingency"]
    optional_items = [it for it in items if not it.is_mandatory]
    contingency_items = [it for it in items if it.category == "contingency"]

    mandatory_total = sum(it.estimated_cost for it in mandatory_items)

    # 10% contingency target for the new budget
    new_contingency = round(new_target_budget * 0.08, 2)
    if contingency_items:
        contingency_items[0].estimated_cost = new_contingency
        contingency_items[0].assumption = f"Adjusted safety reserve to 8% ({new_contingency:.2f})."

    available_for_optional = new_target_budget - mandatory_total - new_contingency
    current_optional_total = sum(it.estimated_cost for it in optional_items)

    if available_for_optional <= 0:
        # Budget cannot even cover mandatory items; scale optional items to 0
        for it in optional_items:
            it.estimated_cost = 0.0
            it.assumption = "Reduced to 0 to accommodate mandatory priorities within restricted budget."
    elif current_optional_total > 0:
        # Scale optional items proportionally
        scale_factor = available_for_optional / current_optional_total
        for it in optional_items:
            it.estimated_cost = round(it.estimated_cost * scale_factor, 2)
            it.assumption = f"Reallocated proportionally ({scale_factor*100:.0f}% of original)."

    assumptions = list(current_summary.assumptions)
    assumptions.append(f"Budget adjusted to {new_target_budget:.2f}. Mandatory expenses preserved.")

    return recalculate_budget(items=items, total_budget=new_target_budget, assumptions=assumptions)
