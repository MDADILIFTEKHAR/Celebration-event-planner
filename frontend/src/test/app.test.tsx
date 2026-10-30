import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { BudgetDashboard } from '../components/BudgetDashboard';
import { ChecklistView } from '../components/ChecklistView';
import { TimelineView } from '../components/TimelineView';
import { GuestManager } from '../components/GuestManager';
import { BudgetSummary, ChecklistItem, TimelineItem, Guest } from '../types/event';

// Mock Recharts to avoid jsdom canvas/svg dimensions issues
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div data-testid="recharts-container">{children}</div>,
  PieChart: ({ children }: any) => <div>{children}</div>,
  Pie: () => <div data-testid="pie-chart" />,
  Cell: () => <div />,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: () => <div data-testid="bar-chart" />,
  XAxis: () => <div />,
  YAxis: () => <div />,
  CartesianGrid: () => <div />,
  Legend: () => <div />,
  Tooltip: () => <div />,
}));

describe('BudgetDashboard Component', () => {
  const sampleBudget: BudgetSummary = {
    total_budget: 2000.0,
    total_allocated: 1800.0,
    remaining_budget: 200.0,
    utilization_percentage: 90.0,
    contingency_amount: 160.0,
    contingency_percentage: 8.0,
    is_overrun: false,
    overrun_amount: 0.0,
    category_totals: {
      venue: 500.0,
      food_beverage: 800.0,
      contingency: 160.0,
    },
    items: [
      {
        id: '1',
        category: 'venue',
        name: 'Venue Space Rental',
        estimated_cost: 500.0,
        is_mandatory: true,
        assumption: 'Standard hall fee',
      },
      {
        id: '2',
        category: 'food_beverage',
        name: 'Buffet Catering',
        estimated_cost: 800.0,
        is_mandatory: false,
        assumption: '$40/guest x 20 guests',
      },
    ],
    assumptions: ['10% buffer included'],
  };

  it('renders budget KPI metrics correctly from state', () => {
    const handleUpdate = vi.fn();
    render(
      <BudgetDashboard
        eventId="test-plan"
        budget={sampleBudget}
        currency="USD"
        onBudgetUpdated={handleUpdate}
      />
    );

    expect(screen.getByText(/Total Budget/i)).toBeInTheDocument();
    expect(screen.getByText(/2,000.00/)).toBeInTheDocument();
    expect(screen.getByText(/1,800.00/)).toBeInTheDocument();
    expect(screen.getByText(/200.00/)).toBeInTheDocument();
    expect(screen.getByText(/Venue Space Rental/i)).toBeInTheDocument();
  });

  it('displays overrun banner when budget is exceeded', () => {
    const overrunBudget: BudgetSummary = {
      ...sampleBudget,
      total_allocated: 2400.0,
      remaining_budget: -400.0,
      is_overrun: true,
      overrun_amount: 400.0,
      utilization_percentage: 120.0,
    };

    render(
      <BudgetDashboard
        eventId="test-plan"
        budget={overrunBudget}
        currency="USD"
        onBudgetUpdated={vi.fn()}
      />
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Budget Overrun Detected');
    expect(screen.getByRole('alert')).toHaveTextContent('400.00');
  });
});

describe('ChecklistView Component', () => {
  const sampleTasks: ChecklistItem[] = [
    {
      id: 'task-1',
      task: 'Book venue space',
      category: 'venue',
      priority: 'high',
      due_offset_days: 30,
      due_date: '2026-11-01',
      status: 'todo',
      notes: 'Confirm deposit',
    },
    {
      id: 'task-2',
      task: 'Send invitations',
      category: 'guests',
      priority: 'medium',
      due_offset_days: 20,
      due_date: '2026-11-10',
      status: 'completed',
    },
  ];

  it('toggles task status upon clicking checkbox', () => {
    const handleUpdate = vi.fn();
    render(<ChecklistView checklist={sampleTasks} onChecklistUpdated={handleUpdate} />);

    expect(screen.getByText(/Book venue space/i)).toBeInTheDocument();
    expect(screen.getByText(/1 of 2 tasks completed/i)).toBeInTheDocument();

    const checkbox = screen.getAllByRole('button', { name: /Mark as/i })[0];
    fireEvent.click(checkbox);

    expect(handleUpdate).toHaveBeenCalledTimes(1);
    const updatedTasks = handleUpdate.mock.calls[0][0];
    expect(updatedTasks[0].status).toBe('completed');
  });
});

describe('TimelineView Component', () => {
  const sampleTimeline: TimelineItem[] = [
    {
      id: 'time-1',
      time_offset_minutes: -60,
      display_time: '17:00',
      duration_minutes: 60,
      title: 'Host & Vendor Setup',
      description: 'Prepare tables and decor',
      category: 'setup',
      is_milestone: false,
    },
    {
      id: 'time-2',
      time_offset_minutes: 0,
      display_time: '18:00',
      duration_minutes: 30,
      title: 'Guest Arrival',
      description: 'Welcome drinks',
      category: 'arrival',
      is_milestone: true,
    },
  ];

  it('renders chronological schedule items with milestones', () => {
    render(
      <TimelineView
        eventId="test-plan"
        timeline={sampleTimeline}
        startTime="18:00"
        onTimelineUpdated={vi.fn()}
      />
    );

    expect(screen.getByText(/Host & Vendor Setup/i)).toBeInTheDocument();
    expect(screen.getByText(/Guest Arrival/i)).toBeInTheDocument();
    expect(screen.getByText(/Milestone/i)).toBeInTheDocument();
    expect(screen.getByText(/Sequence Verified/i)).toBeInTheDocument();
  });
});
