from typing import Dict, Any, List, Tuple
from ..models.schemas import EventRequirements

CELEBRATION_CONFIGS: Dict[str, Dict[str, Any]] = {
    "birthday": {
        "title_default": "Birthday Celebration",
        "min_per_guest_usd": 15.0,
        "recommended_per_guest_usd": 35.0,
        "essential_categories": ["venue", "food_beverage", "cake_dessert"],
        "default_allocations": {
            "venue": 0.22,
            "food_beverage": 0.35,
            "decorations": 0.10,
            "cake_dessert": 0.08,
            "entertainment": 0.10,
            "photography": 0.05,
            "invitations_favors": 0.02,
            "contingency": 0.08,
        },
        "key_activities": ["Welcome drinks & mingling", "Party games & music", "Cake cutting & birthday toast", "Dance & celebration highlight"],
    },
    "anniversary": {
        "title_default": "Anniversary Celebration",
        "min_per_guest_usd": 25.0,
        "recommended_per_guest_usd": 55.0,
        "essential_categories": ["venue", "food_beverage", "cake_dessert", "photography"],
        "default_allocations": {
            "venue": 0.25,
            "food_beverage": 0.36,
            "decorations": 0.09,
            "cake_dessert": 0.06,
            "entertainment": 0.08,
            "photography": 0.08,
            "invitations_favors": 0.03,
            "contingency": 0.05,
        },
        "key_activities": ["Memory lane photo exhibit", "Champagne toast & speeches", "Special couple dance", "Dinner & dessert showcase"],
    },
    "wedding": {
        "title_default": "Wedding Celebration",
        "min_per_guest_usd": 50.0,
        "recommended_per_guest_usd": 110.0,
        "essential_categories": ["venue", "food_beverage", "cake_dessert", "photography"],
        "default_allocations": {
            "venue": 0.30,
            "food_beverage": 0.35,
            "decorations": 0.08,
            "cake_dessert": 0.04,
            "entertainment": 0.08,
            "photography": 0.08,
            "invitations_favors": 0.02,
            "contingency": 0.05,
        },
        "key_activities": ["Ceremony & vows", "Cocktail hour", "Grand entrance", "Dinner banquet", "Cake cutting & first dance", "Open dance floor"],
    },
    "graduation": {
        "title_default": "Graduation Party",
        "min_per_guest_usd": 15.0,
        "recommended_per_guest_usd": 30.0,
        "essential_categories": ["venue", "food_beverage", "cake_dessert"],
        "default_allocations": {
            "venue": 0.18,
            "food_beverage": 0.40,
            "decorations": 0.12,
            "cake_dessert": 0.08,
            "entertainment": 0.10,
            "photography": 0.04,
            "invitations_favors": 0.03,
            "contingency": 0.05,
        },
        "key_activities": ["Graduation cap photo zone", "Achievement speeches & toast", "Buffet or barbecue dining", "Music & backyard/party games"],
    },
    "baby_shower": {
        "title_default": "Baby Shower Gathering",
        "min_per_guest_usd": 15.0,
        "recommended_per_guest_usd": 28.0,
        "essential_categories": ["venue", "food_beverage", "decorations", "cake_dessert"],
        "default_allocations": {
            "venue": 0.20,
            "food_beverage": 0.35,
            "decorations": 0.16,
            "cake_dessert": 0.10,
            "entertainment": 0.06,
            "photography": 0.05,
            "invitations_favors": 0.03,
            "contingency": 0.05,
        },
        "key_activities": ["Welcome mocktails & appetizers", "Baby shower games & trivia", "Gift opening ceremony", "Dessert table & photo station"],
    },
    "family_gathering": {
        "title_default": "Family Reunion & Gathering",
        "min_per_guest_usd": 12.0,
        "recommended_per_guest_usd": 25.0,
        "essential_categories": ["venue", "food_beverage"],
        "default_allocations": {
            "venue": 0.15,
            "food_beverage": 0.48,
            "decorations": 0.06,
            "cake_dessert": 0.06,
            "entertainment": 0.12,
            "photography": 0.05,
            "invitations_favors": 0.02,
            "contingency": 0.06,
        },
        "key_activities": ["Family check-in & catch up", "Group activities & lawn/board games", "Family potluck or barbecue feast", "Group photo session"],
    },
    "retirement": {
        "title_default": "Retirement Celebration",
        "min_per_guest_usd": 20.0,
        "recommended_per_guest_usd": 40.0,
        "essential_categories": ["venue", "food_beverage", "cake_dessert"],
        "default_allocations": {
            "venue": 0.22,
            "food_beverage": 0.38,
            "decorations": 0.08,
            "cake_dessert": 0.08,
            "entertainment": 0.08,
            "photography": 0.06,
            "invitations_favors": 0.04,
            "contingency": 0.06,
        },
        "key_activities": ["Cocktail reception", "Retiree tribute video/speeches", "Formal dinner or tapas buffet", "Gift presentation & toast"],
    },
    "dinner_party": {
        "title_default": "Celebration Dinner Party",
        "min_per_guest_usd": 25.0,
        "recommended_per_guest_usd": 50.0,
        "essential_categories": ["venue", "food_beverage"],
        "default_allocations": {
            "venue": 0.15,
            "food_beverage": 0.55,
            "decorations": 0.10,
            "cake_dessert": 0.08,
            "entertainment": 0.04,
            "photography": 0.02,
            "invitations_favors": 0.01,
            "contingency": 0.05,
        },
        "key_activities": ["Aperitif & hors d'oeuvres", "Multi-course seated dining", "Conversation & curated music", "Dessert & digestif"],
    },
    "holiday_party": {
        "title_default": "Festive Holiday Party",
        "min_per_guest_usd": 18.0,
        "recommended_per_guest_usd": 38.0,
        "essential_categories": ["venue", "food_beverage", "entertainment"],
        "default_allocations": {
            "venue": 0.20,
            "food_beverage": 0.40,
            "decorations": 0.14,
            "cake_dessert": 0.06,
            "entertainment": 0.10,
            "photography": 0.04,
            "invitations_favors": 0.01,
            "contingency": 0.05,
        },
        "key_activities": ["Holiday punch & bites", "Gift exchange (Secret Santa)", "Holiday music & festive games", "Celebration toast & treats"],
    },
    "custom": {
        "title_default": "Special Celebration",
        "min_per_guest_usd": 15.0,
        "recommended_per_guest_usd": 35.0,
        "essential_categories": ["venue", "food_beverage"],
        "default_allocations": {
            "venue": 0.20,
            "food_beverage": 0.38,
            "decorations": 0.10,
            "cake_dessert": 0.07,
            "entertainment": 0.10,
            "photography": 0.05,
            "invitations_favors": 0.03,
            "contingency": 0.07,
        },
        "key_activities": ["Guest reception", "Main celebration event", "Food & beverage service", "Music & highlights"],
    },
}

def analyze_constraints(reqs: EventRequirements) -> Tuple[List[str], List[str], List[str]]:
    """
    Identifies mandatory constraints, feasibility flags, and smart alternatives.
    Returns: (identified_constraints, feasibility_flags, alternatives)
    """
    constraints: List[str] = []
    flags: List[str] = []
    alternatives: List[str] = []

    c_type = reqs.celebration_type.lower()
    config = CELEBRATION_CONFIGS.get(c_type, CELEBRATION_CONFIGS["custom"])

    # 1. Budget realism check
    guest_count = max(reqs.guest_count, 1)
    per_guest_budget = reqs.budget / guest_count if guest_count > 0 else 0
    min_required = config["min_per_guest_usd"]

    if reqs.budget <= 0:
        flags.append("Total budget is set to 0. A self-catered DIY or community-hosted model is required.")
        alternatives.append("Host at a home, community hall, or public park to eliminate venue fees.")
        alternatives.append("Organize a coordinated potluck style or bring-your-own celebration feast.")
    elif per_guest_budget < min_required:
        flags.append(
            f"Budget of {reqs.currency} {reqs.budget:.2f} for {reqs.guest_count} guests works out to "
            f"{reqs.currency} {per_guest_budget:.2f}/guest, which is below the benchmark of "
            f"{reqs.currency} {min_required:.2f}/guest for a {c_type}."
        )
        alternatives.append(f"Consider hosting at home, an apartment clubhouse, or public park to save on venue rental.")
        alternatives.append(f"Opt for high-impact buffet or cocktail-style finger foods rather than a plated banquet.")
        alternatives.append(f"Adjust guest count to ~{int(reqs.budget / min_required)} guests to maintain standard catering comfort.")

    # 2. Venue preference constraints
    if reqs.venue_preference.lower() == "outdoor":
        constraints.append("Mandatory outdoor weather contingency plan (canopy tent or indoor rain backup option).")
        flags.append("Outdoor venue requires power access, restroom verification, and weather shielding.")
        alternatives.append("Reserve an open-air park pavilion with covered shelter for built-in rain insurance.")
    elif reqs.venue_preference.lower() == "virtual":
        constraints.append("Virtual celebration: eliminate physical venue and in-person food logistics; invest in interactive digital entertainment and mailed celebration kits.")

    # 3. Dietary requirements
    if reqs.dietary_requirements:
        for diet in reqs.dietary_requirements:
            d_clean = diet.strip()
            if d_clean:
                constraints.append(f"Dietary constraint: Must accommodate {d_clean} options with cross-contamination prevention and clear labeling.")

    # 4. Accessibility requirements
    if reqs.accessibility_requirements:
        for acc in reqs.accessibility_requirements:
            a_clean = acc.strip()
            if a_clean:
                constraints.append(f"Accessibility requirement: Venue must provide {a_clean} (ramps, wide doors, step-free access).")

    # 5. Children attending
    if reqs.children_attending:
        constraints.append("Family-friendly: Ensure venue childproofing, non-alcoholic specialty drink options, and safe activity zone.")
        alternatives.append("Designate a supervised crafts/games corner or lawn area to keep young guests engaged.")

    # 6. DIY preference
    if reqs.diy_preference == "diy_heavy":
        constraints.append("DIY focus: Allocate budget toward quality raw materials, self-setup decor, and personal touch items rather than agency service fees.")
    elif reqs.diy_preference == "professional":
        constraints.append("Turnkey preference: Prioritize vetted full-service vendors for setup, cleanup, and coordination.")

    return constraints, flags, alternatives
