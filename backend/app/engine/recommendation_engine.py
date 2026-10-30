import uuid
from typing import List
from ..models.schemas import EventRequirements, Recommendation

def generate_recommendations(reqs: EventRequirements) -> List[Recommendation]:
    """
    Produces context-aware recommendations for theme, decor, food, and activities,
    with clear explanations based on the user's specific inputs and constraints.
    """
    recs: List[Recommendation] = []
    c_type = reqs.celebration_type.lower()
    budget = reqs.budget
    guest_count = max(reqs.guest_count, 1)
    per_guest = budget / guest_count if guest_count > 0 else 0
    is_outdoor = reqs.venue_preference.lower() == "outdoor"
    is_virtual = reqs.venue_preference.lower() == "virtual"
    has_children = reqs.children_attending
    diy_pref = reqs.diy_preference

    # 1. Theme & Styling Recommendation
    if c_type == "birthday":
        theme_title = "Modern Golden Hour & Warm Terracotta"
        theme_desc = "Warm champagne, desert terracotta, and cream accents with fairy lights and botanical greenery."
        theme_reason = f"Provides a celebratory, photogenic aesthetic that scales effortlessly for {guest_count} guests without requiring lavish stage sets."
    elif c_type == "anniversary":
        theme_title = "Timeless Silver & Pearl Elegance"
        theme_desc = "Soft pearl white, metallic silver/gold accents, delicate white florals, and ambient candlelight."
        theme_reason = "Highlights the romantic milestone with classic sophistication suitable for intimate dinner speeches and memory sharing."
    elif c_type == "wedding":
        theme_title = "Romantic Ethereal Botanical"
        theme_desc = "Eucalyptus greens, blush pink, soft ivory linens, and romantic filament bulb lighting."
        theme_reason = "Provides an organic, timeless backdrop that works beautifully in both photos and varying venue halls."
    elif c_type == "graduation":
        theme_title = "Future Bright & Academy Midnight"
        theme_desc = "Navy blue, metallic gold/silver, custom milestone banners, and graduation cap photo elements."
        theme_reason = "Proudly celebrates academic achievement with vibrant energy and plenty of photo-ready corners."
    elif c_type == "baby_shower":
        theme_title = "Whimsical Woodland & Pastel Meadow"
        theme_desc = "Sage green, soft peach, cream, and rustic natural wooden crates with plush accents."
        theme_reason = "Warm, gender-neutral, and calming atmosphere that feels cozy for daytime socializing."
    else:
        theme_title = "Vibrant Joy & Warm Festivity"
        theme_desc = "Curated jewel tones, warm ambient lighting, and personalized chalkboard signs."
        theme_reason = "Adaptable and welcoming for mixed generations and varied party sizes."

    recs.append(Recommendation(
        id=f"rec-{uuid.uuid4().hex[:8]}",
        category="theme",
        title=theme_title,
        description=theme_desc,
        reason=theme_reason,
        estimated_cost_tier="$" if diy_pref == "diy_heavy" else "$$",
        is_diy_friendly=True
    ))

    # 2. Food & Beverage Approach
    if is_virtual:
        fb_title = "Curated Celebration Treat Box"
        fb_desc = "Mail artisanal cookie, gourmet snack, and specialty tea/cocktail mixer boxes to guests prior to the event."
        fb_reason = "Unifies remote attendees around a shared sensory tasting experience during the virtual call."
        fb_tier = "$$"
    elif per_guest < 25.0:
        fb_title = "Gourmet Grazing Table & Slider Bar"
        fb_desc = "Artfully styled charcuterie, gourmet slider rolls, pasta salads, fruit skewers, and batch celebration punch."
        fb_reason = f"Given a budget of {reqs.currency} {per_guest:.1f}/guest, a grazing table maximizes visual abundance and guest satisfaction at 40% less cost than full seated catering."
        fb_tier = "$"
    elif per_guest < 60.0:
        fb_title = "Interactive Food Stations / Hot Buffet"
        fb_desc = "Two warm entrée selections (e.g., roasted chicken breast and artisan pasta) accompanied by fresh seasonal salads and signature mocktail/cocktail."
        fb_reason = f"At {reqs.currency} {per_guest:.1f}/guest, buffet service delivers hot, substantial meals while allowing easy accommodation of dietary preferences."
        fb_tier = "$$"
    else:
        fb_title = "Plated Multi-Course Dining Experience"
        fb_desc = "Individual plated appetizer, choice of seasonal entrée, and custom plated dessert with paired beverages."
        fb_reason = f"Ample budget tier ({reqs.currency} {per_guest:.1f}/guest) permits personalized table service and an elevated gourmet presentation."
        fb_tier = "$$$"

    # Mention dietary accommodation if requested
    if reqs.dietary_requirements:
        fb_desc += f" [Specially customized for: {', '.join(reqs.dietary_requirements)}]."

    recs.append(Recommendation(
        id=f"rec-{uuid.uuid4().hex[:8]}",
        category="food_drink",
        title=fb_title,
        description=fb_desc,
        reason=fb_reason,
        estimated_cost_tier=fb_tier,
        is_diy_friendly=(per_guest < 25.0)
    ))

    # 3. Decoration Concepts
    if diy_pref == "diy_heavy":
        decor_title = "High-Impact DIY Organic Balloon Garland & Greenery"
        decor_desc = "Kit-assembled matte balloon arch, sheer backdrop curtains, fairy warm lights, and thrifted glass cylinder vases."
        decor_reason = f"With a DIY preference, this creates a centerpiece focal area for under {reqs.currency} 100 while looking professionally staged."
        decor_tier = "$"
    else:
        decor_title = "Statement Welcome Arch & Coordinated Tablescapes"
        decor_desc = "Professional floral arch, custom laser-cut name sign, satin table runners, and low-profile floral centerpieces."
        decor_reason = "Creates an unforgettable first impression as guests enter the venue, with zero setup stress on event morning."
        decor_tier = "$$"

    recs.append(Recommendation(
        id=f"rec-{uuid.uuid4().hex[:8]}",
        category="decorations",
        title=decor_title,
        description=decor_desc,
        reason=decor_reason,
        estimated_cost_tier=decor_tier,
        is_diy_friendly=(diy_pref == "diy_heavy")
    ))

    # 4. Interactive Activities & Entertainment
    if is_virtual:
        act_title = "Interactive Virtual Trivia & Rapid-Fire Quiz"
        act_desc = "Screen-shared multimedia trivia with custom rounds celebrating the guest of honor, plus collaborative Spotify queue."
        act_reason = "Eliminates awkward video silences and keeps all remote participants actively engaged."
        act_tier = "$"
    elif has_children:
        act_title = "All-Ages Lawn & Interactive Party Games"
        act_desc = "Giant Jenga, cornhole, photo-booth prop contest, plus a supervised coloring/puzzle lounge for kids."
        act_reason = "Keeps children entertained safely while enabling adult guests to relax, socialize, and participate together."
        act_tier = "$"
    else:
        act_title = "Curated Memory Timeline & Crowd-Pleaser Music"
        act_desc = "Interactive Polaroid guestbook with personalized notes, custom celebration trivia, and a transition to high-energy dance floor."
        act_reason = "Builds emotional connection and creates lasting tangible mementos of the celebration."
        act_tier = "$$"

    recs.append(Recommendation(
        id=f"rec-{uuid.uuid4().hex[:8]}",
        category="activities",
        title=act_title,
        description=act_desc,
        reason=act_reason,
        estimated_cost_tier=act_tier,
        is_diy_friendly=True
    ))

    # 5. Safety & Accessibility Best Practices
    if reqs.accessibility_requirements:
        recs.append(Recommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="safety",
            title="Accessibility-First Layout Plan",
            description="Ensure 36-inch minimum pathways between all banquet tables, confirm elevator/ramp access, and provide reserved seating near exits.",
            reason=f"Directly supports requested accommodations: {', '.join(reqs.accessibility_requirements)}.",
            estimated_cost_tier="$",
            is_diy_friendly=True
        ))

    # 6. Outdoor Weather Contingency (if outdoor)
    if is_outdoor:
        recs.append(Recommendation(
            id=f"rec-{uuid.uuid4().hex[:8]}",
            category="safety",
            title="Weather Resilience Strategy (Plan B)",
            description="Reserve an emergency pop-up canopy tent, supply heavy table weights against wind, and prepare insect repellent/sunscreen station.",
            reason="Outdoor venues are vulnerable to sudden rain or excessive sun; proactive prep prevents celebration disruption.",
            estimated_cost_tier="$",
            is_diy_friendly=True
        ))

    return recs
