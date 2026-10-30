from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Dict, Any
from enum import Enum

class CelebrationType(str, Enum):
    BIRTHDAY = "birthday"
    ANNIVERSARY = "anniversary"
    WEDDING = "wedding"
    GRADUATION = "graduation"
    BABY_SHOWER = "baby_shower"
    FAMILY_GATHERING = "family_gathering"
    RETIREMENT = "retirement"
    DINNER_PARTY = "dinner_party"
    HOLIDAY_PARTY = "holiday_party"
    CUSTOM = "custom"

class VenuePreference(str, Enum):
    INDOOR = "indoor"
    OUTDOOR = "outdoor"
    VIRTUAL = "virtual"
    HYBRID = "hybrid"

class EventRequirements(BaseModel):
    title: str = Field(..., max_length=150, description="Title or celebration headline")
    celebration_type: str = Field(default="birthday", description="Type of celebration")
    event_date: str = Field(..., description="Event date in YYYY-MM-DD")
    start_time: str = Field(default="18:00", description="Start time in HH:MM")
    duration_hours: float = Field(default=4.0, ge=0.5, le=24.0, description="Event duration in hours")
    location: str = Field(default="", max_length=120, description="City, region or venue location")
    guest_count: int = Field(default=25, ge=0, le=10000, description="Expected total guest count")
    budget: float = Field(default=1500.0, ge=0.0, description="Total budget amount")
    currency: str = Field(default="USD", max_length=10, description="Currency code (USD, EUR, GBP, etc.)")
    venue_preference: str = Field(default="indoor", description="indoor, outdoor, or virtual")
    theme_colors: List[str] = Field(default_factory=list, description="Preferred colors or theme style")
    atmosphere: str = Field(default="festive and joyful", max_length=100, description="Desired ambiance")
    dietary_requirements: List[str] = Field(default_factory=list, description="Dietary needs (vegetarian, vegan, gluten-free, etc.)")
    accessibility_requirements: List[str] = Field(default_factory=list, description="Accessibility needs (wheelchair, step-free, etc.)")
    children_attending: bool = Field(default=False, description="Whether children are attending")
    diy_preference: str = Field(default="balanced", description="diy_heavy, balanced, or professional")
    special_notes: Optional[str] = Field(default="", max_length=1000, description="Special requests or constraints")

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Event title cannot be empty")
        return v

    @field_validator("budget")
    @classmethod
    def validate_budget(cls, v: float) -> float:
        if v < 0:
            raise ValueError("Budget cannot be negative")
        return round(v, 2)

    @field_validator("guest_count")
    @classmethod
    def validate_guest_count(cls, v: int) -> int:
        if v < 0:
            raise ValueError("Guest count cannot be negative")
        return v

class BudgetItem(BaseModel):
    id: str
    category: str  # venue, food_beverage, decorations, cake_dessert, entertainment, photography, invitations_favors, transportation, contingency
    name: str
    estimated_cost: float
    actual_cost: Optional[float] = None
    is_mandatory: bool = False
    assumption: str = ""
    notes: Optional[str] = ""

class BudgetSummary(BaseModel):
    total_budget: float
    total_allocated: float
    remaining_budget: float
    utilization_percentage: float
    contingency_amount: float
    contingency_percentage: float = 10.0
    is_overrun: bool
    overrun_amount: float
    category_totals: Dict[str, float]
    items: List[BudgetItem]
    assumptions: List[str] = Field(default_factory=list)

class TimelineItem(BaseModel):
    id: str
    time_offset_minutes: int  # minutes relative to event start (e.g. -60 for 1 hr before)
    display_time: str
    duration_minutes: int
    title: str
    description: str
    category: str  # setup, arrival, dining, highlight, entertainment, departure, cleanup
    is_milestone: bool = False

class ChecklistItem(BaseModel):
    id: str
    task: str
    category: str
    priority: str  # high, medium, low
    due_offset_days: int  # days before event
    due_date: str
    status: str = "todo"  # todo, in_progress, completed
    notes: Optional[str] = ""

class Guest(BaseModel):
    id: str
    name: str
    rsvp_status: str = "invited"  # invited, attending, tentative, declined
    plus_ones: int = 0
    dietary_requirements: List[str] = Field(default_factory=list)
    accessibility_needs: Optional[str] = ""
    is_child: bool = False

class Recommendation(BaseModel):
    id: str
    category: str  # theme, decorations, food_drink, activities, vendor_tips, safety
    title: str
    description: str
    reason: str
    estimated_cost_tier: str = "$$"  # $, $$, $$$
    is_diy_friendly: bool = True

class EventPlan(BaseModel):
    id: str
    requirements: EventRequirements
    budget: BudgetSummary
    timeline: List[TimelineItem]
    checklist: List[ChecklistItem]
    guests: List[Guest]
    recommendations: List[Recommendation]
    identified_constraints: List[str] = Field(default_factory=list)
    feasibility_flags: List[str] = Field(default_factory=list)
    alternatives: List[str] = Field(default_factory=list)
    ai_mode_used: str = "deterministic_engine"  # deterministic_engine or llm_augmented
    created_at: str
    updated_at: str

class PlanAdjustmentRequest(BaseModel):
    prompt: Optional[str] = None
    structured_updates: Optional[Dict[str, Any]] = None

class PlanAdjustmentResponse(BaseModel):
    updated_plan: EventPlan
    changes_summary: List[str]
    rationale: str

class QuestionOption(BaseModel):
    value: str
    label: str

class AssistantQuestion(BaseModel):
    id: str
    field: str
    question: str
    explanation: str
    suggested_options: Optional[List[QuestionOption]] = None
    current_assumption: str
    is_essential: bool = False

class ChatMessage(BaseModel):
    role: str  # user, assistant, system
    content: str
    timestamp: str
    suggested_actions: Optional[List[str]] = None
