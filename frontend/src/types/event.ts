export type CelebrationType =
  | 'birthday'
  | 'anniversary'
  | 'wedding'
  | 'graduation'
  | 'baby_shower'
  | 'family_gathering'
  | 'retirement'
  | 'dinner_party'
  | 'holiday_party'
  | 'custom';

export type VenuePreference = 'indoor' | 'outdoor' | 'virtual' | 'hybrid';

export interface EventRequirements {
  title: string;
  celebration_type: string;
  event_date: string;
  start_time: string;
  duration_hours: number;
  location: string;
  guest_count: number;
  budget: number;
  currency: string;
  venue_preference: string;
  theme_colors: string[];
  atmosphere: string;
  dietary_requirements: string[];
  accessibility_requirements: string[];
  children_attending: boolean;
  diy_preference: string;
  special_notes?: string;
}

export interface BudgetItem {
  id: string;
  category: string;
  name: string;
  estimated_cost: number;
  actual_cost?: number | null;
  is_mandatory: boolean;
  assumption: string;
  notes?: string;
}

export interface BudgetSummary {
  total_budget: number;
  total_allocated: number;
  remaining_budget: number;
  utilization_percentage: number;
  contingency_amount: number;
  contingency_percentage: number;
  is_overrun: boolean;
  overrun_amount: number;
  category_totals: Record<string, number>;
  items: BudgetItem[];
  assumptions: string[];
}

export interface TimelineItem {
  id: string;
  time_offset_minutes: number;
  display_time: string;
  duration_minutes: number;
  title: string;
  description: string;
  category: string;
  is_milestone: boolean;
}

export interface ChecklistItem {
  id: string;
  task: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  due_offset_days: number;
  due_date: string;
  status: 'todo' | 'in_progress' | 'completed';
  notes?: string;
}

export interface Guest {
  id: string;
  name: string;
  rsvp_status: 'attending' | 'tentative' | 'declined' | 'invited';
  plus_ones: number;
  dietary_requirements: string[];
  accessibility_needs?: string;
  is_child: boolean;
}

export interface Recommendation {
  id: string;
  category: 'theme' | 'decorations' | 'food_drink' | 'activities' | 'vendor_tips' | 'safety';
  title: string;
  description: string;
  reason: string;
  estimated_cost_tier: string;
  is_diy_friendly: boolean;
}

export interface EventPlan {
  id: string;
  requirements: EventRequirements;
  budget: BudgetSummary;
  timeline: TimelineItem[];
  checklist: ChecklistItem[];
  guests: Guest[];
  recommendations: Recommendation[];
  identified_constraints: string[];
  feasibility_flags: string[];
  alternatives: string[];
  ai_mode_used: string;
  created_at: string;
  updated_at: string;
}

export interface AssistantQuestion {
  id: string;
  field: string;
  question: string;
  explanation: string;
  suggested_options?: { value: string; label: string }[];
  current_assumption: string;
  is_essential: boolean;
}

export interface PlanAdjustmentResponse {
  updated_plan: EventPlan;
  changes_summary: string[];
  rationale: string;
}

export interface DemoPreset {
  id: string;
  name: string;
  description: string;
  requirements: EventRequirements;
}
