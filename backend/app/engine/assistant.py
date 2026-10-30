import uuid
from datetime import datetime
from typing import List, Dict, Any, Optional
from ..models.schemas import (
    EventRequirements, EventPlan, AssistantQuestion, QuestionOption, Guest
)
from .rules import analyze_constraints, CELEBRATION_CONFIGS
from .budget_allocator import allocate_initial_budget
from .timeline_generator import generate_initial_timeline
from .checklist_generator import generate_initial_checklist
from .recommendation_engine import generate_recommendations
from ..ai.llm_client import AIProviderStatus

DEMO_PRESETS: List[Dict[str, Any]] = [
    {
        "id": "demo-birthday",
        "name": "Sarah's 30th Birthday Bash",
        "description": "Vibrant indoor gathering with friends, cocktail buffet, and custom birthday cake.",
        "requirements": {
            "title": "Sarah's 30th Golden Hour Birthday Bash",
            "celebration_type": "birthday",
            "event_date": "2026-11-14",
            "start_time": "18:30",
            "duration_hours": 4.5,
            "location": "Downtown Arts Loft, Metro City",
            "guest_count": 35,
            "budget": 1600.0,
            "currency": "USD",
            "venue_preference": "indoor",
            "theme_colors": ["Warm Terracotta", "Champagne Gold", "Cream"],
            "atmosphere": "Energetic, warm, and photogenic",
            "dietary_requirements": ["Vegetarian", "Gluten-Free"],
            "accessibility_requirements": ["Step-free entry"],
            "children_attending": False,
            "diy_preference": "balanced",
            "special_notes": "Spotlight toast at 20:30 followed by dessert bar."
        }
    },
    {
        "id": "demo-anniversary",
        "name": "Golden 50th Wedding Anniversary",
        "description": "Elegant seated celebration with family, memory slideshow, and romantic floral styling.",
        "requirements": {
            "title": "Elena & Marco's 50th Golden Anniversary",
            "celebration_type": "anniversary",
            "event_date": "2026-12-05",
            "start_time": "17:00",
            "duration_hours": 5.0,
            "location": "Lakeside Pavilion & Garden",
            "guest_count": 50,
            "budget": 3500.0,
            "currency": "USD",
            "venue_preference": "indoor",
            "theme_colors": ["Metallic Gold", "Ivory Silk", "Sage Green"],
            "atmosphere": "Heartwarming, elegant, and nostalgic",
            "dietary_requirements": ["Vegetarian"],
            "accessibility_requirements": ["Wheelchair accessible", "Close parking"],
            "children_attending": True,
            "diy_preference": "professional",
            "special_notes": "Tribute video playback and couple's slow dance."
        }
    },
    {
        "id": "demo-graduation",
        "name": "Alex's University Graduation Party",
        "description": "Lawn games, gourmet barbecue buffet, cap-throw photo backdrop, and upbeat music.",
        "requirements": {
            "title": "Alex's Engineering Graduation Milestone",
            "celebration_type": "graduation",
            "event_date": "2026-11-28",
            "start_time": "15:00",
            "duration_hours": 4.0,
            "location": "Sunset Community Park Pavilion",
            "guest_count": 40,
            "budget": 1200.0,
            "currency": "USD",
            "venue_preference": "outdoor",
            "theme_colors": ["Navy Blue", "Bright Gold", "White"],
            "atmosphere": "Proud, festive, and relaxed celebration",
            "dietary_requirements": ["Halal", "Vegetarian"],
            "accessibility_requirements": ["Paved pathways"],
            "children_attending": True,
            "diy_preference": "diy_heavy",
            "special_notes": "Backyard games and personalized diploma cake."
        }
    }
]

def generate_sample_guests(guest_count: int, dietary_reqs: List[str]) -> List[Guest]:
    """Generates realistic fictional sample guests for demonstration and RSVP planning."""
    sample_names = [
        ("Maya Lin", "attending", 1, False),
        ("Carlos Rivera", "attending", 0, False),
        ("Aisha Khan", "attending", 1, False),
        ("Liam & Noah O'Connor", "attending", 2, True),
        ("Sophie Dubois", "tentative", 0, False),
        ("Jordan Smith", "attending", 0, False),
        ("Elena Rostova", "invited", 1, False),
        ("Marcus Vance", "declined", 0, False),
    ]

    guests: List[Guest] = []
    count = min(guest_count, len(sample_names))
    for i in range(count):
        name, status, plus, is_kid = sample_names[i]
        diet = [dietary_reqs[0]] if (dietary_reqs and i % 2 == 0) else []
        guests.append(Guest(
            id=f"guest-{uuid.uuid4().hex[:8]}",
            name=name,
            rsvp_status=status,
            plus_ones=plus,
            dietary_requirements=diet,
            accessibility_needs="Prefers ground-floor seating" if i == 0 else "",
            is_child=is_kid
        ))
    return guests

def create_event_plan(reqs: EventRequirements) -> EventPlan:
    """Creates a complete, verified EventPlan from user requirements."""
    now_str = datetime.now().isoformat()
    plan_id = f"plan-{uuid.uuid4().hex[:8]}"

    constraints, flags, alternatives = analyze_constraints(reqs)
    budget_summary = allocate_initial_budget(reqs)
    timeline = generate_initial_timeline(reqs)
    checklist = generate_initial_checklist(reqs)
    recommendations = generate_recommendations(reqs)
    guests = generate_sample_guests(reqs.guest_count, reqs.dietary_requirements)

    ai_status = AIProviderStatus.get_status()

    return EventPlan(
        id=plan_id,
        requirements=reqs,
        budget=budget_summary,
        timeline=timeline,
        checklist=checklist,
        guests=guests,
        recommendations=recommendations,
        identified_constraints=constraints,
        feasibility_flags=flags,
        alternatives=alternatives,
        ai_mode_used=ai_status["mode"],
        created_at=now_str,
        updated_at=now_str
    )

def get_progressive_questions(current_reqs: Dict[str, Any]) -> List[AssistantQuestion]:
    """
    Returns only the most pertinent missing questions instead of overwhelming the user.
    Uses transparent assumptions when fields are skipped.
    """
    questions: List[AssistantQuestion] = []

    # 1. Dietary requirements check
    if not current_reqs.get("dietary_requirements"):
        questions.append(AssistantQuestion(
            id="q_dietary",
            field="dietary_requirements",
            question="Do any guests have dietary restrictions or food allergies?",
            explanation="Allows us to safely allocate specialized catering and cross-contamination prevention.",
            suggested_options=[
                QuestionOption(value="Vegetarian", label="Vegetarian"),
                QuestionOption(value="Vegan", label="Vegan"),
                QuestionOption(value="Gluten-Free", label="Gluten-Free"),
                QuestionOption(value="Halal", label="Halal"),
                QuestionOption(value="Kosher", label="Kosher"),
                QuestionOption(value="Nut-Free", label="Nut-Free / Allergen Sensitive"),
            ],
            current_assumption="Standard omnivore menu unless specified",
            is_essential=False
        ))

    # 2. Accessibility needs
    if not current_reqs.get("accessibility_requirements"):
        questions.append(AssistantQuestion(
            id="q_accessibility",
            field="accessibility_requirements",
            question="Are there any mobility or sensory accessibility requirements?",
            explanation="Ensures table spacing, step-free access, and quiet rest zones are budgeted.",
            suggested_options=[
                QuestionOption(value="Wheelchair Accessible", label="Wheelchair / Step-Free Access"),
                QuestionOption(value="Elevator Required", label="Elevator Access to Upper Floors"),
                QuestionOption(value="Quiet Space", label="Low-Sensory / Quiet Rest Zone"),
                QuestionOption(value="Close Parking", label="Accessible Parking Spaces"),
            ],
            current_assumption="Standard public accessibility assumptions",
            is_essential=False
        ))

    # 3. Children attendance
    if "children_attending" not in current_reqs:
        questions.append(AssistantQuestion(
            id="q_children",
            field="children_attending",
            question="Will children be attending this celebration?",
            explanation="Helps us include safe entertainment zones and non-alcoholic beverage options.",
            suggested_options=[
                QuestionOption(value="true", label="Yes, children attending"),
                QuestionOption(value="false", label="No, adults-only celebration"),
            ],
            current_assumption="Adult-focused event unless indicated",
            is_essential=False
        ))

    # 4. DIY vs Pro preference
    if not current_reqs.get("diy_preference"):
        questions.append(AssistantQuestion(
            id="q_diy",
            field="diy_preference",
            question="What is your preference for DIY vs professional vendor services?",
            explanation="Determines how we allocate budget between raw materials and service fees.",
            suggested_options=[
                QuestionOption(value="diy_heavy", label="DIY Heavy (Maximum budget savings)"),
                QuestionOption(value="balanced", label="Balanced (Key vendors + DIY touches)"),
                QuestionOption(value="professional", label="Turnkey Professional (Minimum host stress)"),
            ],
            current_assumption="Balanced approach",
            is_essential=False
        ))

    return questions[:2]  # Return at most 2 progressive questions to prevent fatigue
