import {
  EventRequirements, EventPlan, BudgetSummary, BudgetItem, TimelineItem,
  Guest, AssistantQuestion, PlanAdjustmentResponse, DemoPreset
} from '../types/event';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!res.ok) {
    let errorMsg = `Server error (${res.status})`;
    try {
      const errorData = await res.json();
      errorMsg = errorData.detail || errorMsg;
    } catch {
      // fallback to status text
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }

  return res.json();
}

export const api = {
  getAiStatus: () => fetchJson<{ provider: string; is_configured: boolean; mode: string; message: string }>(`${API_BASE}/planner/status`),

  getPresets: () => fetchJson<DemoPreset[]>(`${API_BASE}/events/presets`),

  listEvents: () => fetchJson<Array<{ id: string; title: string; celebration_type: string; event_date: string; guest_count: number; total_budget: number; currency: string }>>(`${API_BASE}/events`),

  getEvent: (id: string) => fetchJson<EventPlan>(`${API_BASE}/events/${id}`),

  planEvent: (reqs: EventRequirements) => fetchJson<EventPlan>(`${API_BASE}/events/plan`, {
    method: 'POST',
    body: JSON.stringify(reqs),
  }),

  updateEvent: (id: string, plan: EventPlan) => fetchJson<EventPlan>(`${API_BASE}/events/${id}`, {
    method: 'PUT',
    body: JSON.stringify(plan),
  }),

  deleteEvent: (id: string) => fetchJson<{ status: string; event_id: string }>(`${API_BASE}/events/${id}`, {
    method: 'DELETE',
  }),

  adjustPlan: (id: string, prompt?: string, structuredUpdates?: Record<string, any>) =>
    fetchJson<PlanAdjustmentResponse>(`${API_BASE}/planner/adjust/${id}`, {
      method: 'POST',
      body: JSON.stringify({ prompt, structured_updates: structuredUpdates }),
    }),

  getQuestions: (currentReqs: Partial<EventRequirements>) =>
    fetchJson<AssistantQuestion[]>(`${API_BASE}/planner/questions`, {
      method: 'POST',
      body: JSON.stringify(currentReqs),
    }),

  updateBudgetItems: (id: string, items: BudgetItem[]) =>
    fetchJson<BudgetSummary>(`${API_BASE}/events/${id}/budget/items`, {
      method: 'PUT',
      body: JSON.stringify(items),
    }),

  reallocateBudget: (id: string, newBudget: number) =>
    fetchJson<BudgetSummary>(`${API_BASE}/events/${id}/budget/reallocate`, {
      method: 'POST',
      body: JSON.stringify({ new_budget: newBudget }),
    }),

  updateTimeline: (id: string, items: TimelineItem[]) =>
    fetchJson<{ timeline: TimelineItem[]; is_valid: boolean; validation_messages: string[] }>(`${API_BASE}/events/${id}/timeline`, {
      method: 'PUT',
      body: JSON.stringify(items),
    }),

  getGuestsSummary: (id: string) =>
    fetchJson<{ guests: Guest[]; metrics: any }>(`${API_BASE}/events/${id}/guests/summary`),

  addGuest: (id: string, guest: Partial<Guest>) =>
    fetchJson<Guest>(`${API_BASE}/events/${id}/guests`, {
      method: 'POST',
      body: JSON.stringify(guest),
    }),

  updateGuest: (id: string, guestId: string, guest: Guest) =>
    fetchJson<Guest>(`${API_BASE}/events/${id}/guests/${guestId}`, {
      method: 'PUT',
      body: JSON.stringify(guest),
    }),

  deleteGuest: (id: string, guestId: string) =>
    fetchJson<{ status: string; guest_id: string }>(`${API_BASE}/events/${id}/guests/${guestId}`, {
      method: 'DELETE',
    }),

  getPlanSummaryMarkdown: (id: string) =>
    fetchJson<{ summary_markdown: string }>(`${API_BASE}/events/${id}/export/summary`),

  importPlanJson: (payload: Record<string, any>) =>
    fetchJson<EventPlan>(`${API_BASE}/events/import/json`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};
