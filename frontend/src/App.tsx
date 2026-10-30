import React, { useState, useEffect } from 'react';
import {
  Calendar, MapPin, Users, DollarSign, Sparkles, ArrowRight,
  CheckCircle2, Clock, ShieldCheck, Compass
} from 'lucide-react';
import { EventPlan, EventRequirements, DemoPreset, BudgetSummary, TimelineItem, ChecklistItem } from './types/event';
import { api } from './api/client';
import { Navbar } from './components/Navbar';
import { EventWizard } from './components/EventWizard';
import { AssistantChat } from './components/AssistantChat';
import { BudgetDashboard } from './components/BudgetDashboard';
import { TimelineView } from './components/TimelineView';
import { GuestManager } from './components/GuestManager';
import { ChecklistView } from './components/ChecklistView';
import { RecommendationsView } from './components/RecommendationsView';
import { PlanSummary } from './components/PlanSummary';
import { SavedEventsModal } from './components/SavedEventsModal';
import { ImportModal } from './components/ImportModal';

export const App: React.FC = () => {
  const [currentPlan, setCurrentPlan] = useState<EventPlan | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [presets, setPresets] = useState<DemoPreset[]>([]);
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [recentChanges, setRecentChanges] = useState<{ changes: string[]; rationale: string } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  // Initialize app: fetch status, presets, and load initial demo plan
  useEffect(() => {
    async function init() {
      try {
        const [statusRes, presetsRes] = await Promise.all([
          api.getAiStatus(),
          api.getPresets(),
        ]);
        setAiStatus(statusRes);
        setPresets(presetsRes);

        // Check if there is an existing saved plan to load
        const savedList = await api.listEvents();
        if (savedList && savedList.length > 0) {
          const plan = await api.getEvent(savedList[0].id);
          setCurrentPlan(plan);
        } else if (presetsRes && presetsRes.length > 0) {
          // Quick initialize with the premier demo preset
          const firstPreset = presetsRes[0];
          const plan = await api.planEvent(firstPreset.requirements);
          setCurrentPlan(plan);
        }
      } catch (err) {
        console.error('Initialization error:', err);
      }
    }
    init();
  }, []);

  const handleCreatePlan = async (reqs: EventRequirements) => {
    setIsLoading(true);
    try {
      const plan = await api.planEvent(reqs);
      setCurrentPlan(plan);
      setShowWizard(false);
      setActiveTab('overview');
      setRecentChanges(null);
    } catch (err: any) {
      alert(`Planning error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectPreset = async (preset: DemoPreset) => {
    setIsLoading(true);
    try {
      const plan = await api.planEvent(preset.requirements);
      setCurrentPlan(plan);
      setShowWizard(false);
      setActiveTab('overview');
      setRecentChanges({
        changes: [`Loaded curated demo scenario: "${preset.name}".`],
        rationale: 'Populated with balanced budget allocation, milestone timeline, and sample guests.',
      });
    } catch (err: any) {
      alert(`Failed to load preset: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlanUpdated = (updatedPlan: EventPlan, changes: string[], rationale: string) => {
    setCurrentPlan(updatedPlan);
    setRecentChanges({ changes, rationale });
  };

  const handleBudgetUpdated = (updatedBudget: BudgetSummary) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, budget: updatedBudget };
    setCurrentPlan(updated);
  };

  const handleTimelineUpdated = (updatedTimeline: TimelineItem[]) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, timeline: updatedTimeline };
    setCurrentPlan(updated);
  };

  const handleChecklistUpdated = (updatedChecklist: ChecklistItem[]) => {
    if (!currentPlan) return;
    const updated: EventPlan = { ...currentPlan, checklist: updatedChecklist };
    setCurrentPlan(updated);
  };

  // Compute Next Recommended Action for dashboard
  const getNextRecommendedAction = () => {
    if (!currentPlan) return null;
    const b = currentPlan.budget;
    const incompleteTasks = currentPlan.checklist.filter((t) => t.status !== 'completed');

    if (b.is_overrun) {
      return {
        label: `Budget overrun of ${currentPlan.requirements.currency} ${b.overrun_amount.toFixed(2)}. Rebalance optional categories in Budget Dashboard.`,
        tab: 'budget',
        cta: 'Fix Budget',
      };
    }
    if (incompleteTasks.length > 0) {
      const urgent = incompleteTasks.find((t) => t.priority === 'high') || incompleteTasks[0];
      return {
        label: `Next priority: "${urgent.task}" (Due ${urgent.due_date})`,
        tab: 'checklist',
        cta: 'View Task',
      };
    }
    return {
      label: 'All essential milestones organized. Review run of show or print final plan.',
      tab: 'summary',
      cta: 'View Plan Document',
    };
  };

  const nextAction = getNextRecommendedAction();

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      <Navbar
        currentPlan={currentPlan}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewEvent={() => setShowWizard(true)}
        onOpenSaved={() => setShowSavedModal(true)}
        onImportClick={() => setShowImportModal(true)}
        aiStatus={aiStatus}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {showWizard || !currentPlan ? (
          <EventWizard
            onPlanCreated={handleCreatePlan}
            presets={presets}
            onSelectPreset={handleSelectPreset}
            isLoading={isLoading}
          />
        ) : (
          <div className="space-y-6">
            {/* Header Plan Banner with Next Action */}
            <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-amber-100 text-amber-900 border border-amber-200">
                    {currentPlan.requirements.celebration_type.replace('_', ' ')}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-slate-100 text-slate-700 capitalize">
                    {currentPlan.requirements.venue_preference}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                  {currentPlan.requirements.title}
                </h1>
                <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentPlan.requirements.event_date} at {currentPlan.requirements.start_time}</span>
                  </span>
                  <span>•</span>
                  <span className="flex items-center space-x-1">
                    <Users className="w-3.5 h-3.5 text-slate-400" />
                    <span>{currentPlan.requirements.guest_count} guests</span>
                  </span>
                  <span>•</span>
                  <span className="font-semibold text-slate-900">
                    {currentPlan.requirements.currency} {currentPlan.budget.total_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Next Recommended Action Banner */}
              {nextAction && (
                <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 md:max-w-md">
                  <div className="text-xs">
                    <span className="font-bold block text-amber-900 uppercase tracking-wider text-[10px]">
                      Recommended Next Step:
                    </span>
                    <span className="text-slate-800 font-medium">{nextAction.label}</span>
                  </div>
                  <button
                    onClick={() => setActiveTab(nextAction.tab)}
                    className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-950 bg-amber-200/80 hover:bg-amber-300 transition-colors shrink-0"
                  >
                    <span>{nextAction.cta}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Dynamic Assistant Chat / Prompt Bar */}
            <AssistantChat
              currentPlan={currentPlan}
              onPlanUpdated={handlePlanUpdated}
              recentChanges={recentChanges}
            />

            {/* Active Tab View */}
            <div>
              {activeTab === 'overview' && (
                <RecommendationsView
                  requirements={currentPlan.requirements}
                  recommendations={currentPlan.recommendations}
                  identifiedConstraints={currentPlan.identified_constraints}
                  feasibilityFlags={currentPlan.feasibility_flags}
                  alternatives={currentPlan.alternatives}
                />
              )}

              {activeTab === 'budget' && (
                <BudgetDashboard
                  eventId={currentPlan.id}
                  budget={currentPlan.budget}
                  currency={currentPlan.requirements.currency}
                  onBudgetUpdated={handleBudgetUpdated}
                />
              )}

              {activeTab === 'timeline' && (
                <TimelineView
                  eventId={currentPlan.id}
                  timeline={currentPlan.timeline}
                  startTime={currentPlan.requirements.start_time}
                  onTimelineUpdated={handleTimelineUpdated}
                />
              )}

              {activeTab === 'guests' && (
                <GuestManager
                  eventId={currentPlan.id}
                  initialGuests={currentPlan.guests}
                  onGuestsUpdated={(newGuests) => {
                    setCurrentPlan({ ...currentPlan, guests: newGuests });
                  }}
                />
              )}

              {activeTab === 'checklist' && (
                <ChecklistView
                  checklist={currentPlan.checklist}
                  onChecklistUpdated={handleChecklistUpdated}
                />
              )}

              {activeTab === 'summary' && (
                <PlanSummary plan={currentPlan} />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-6 text-center text-xs text-slate-500 bg-white no-print">
        <p>Celebration Event Planner AI • Reliable Local Intelligence Engine + Context-Aware Dynamic Adaptation</p>
        <p className="mt-1 text-[11px] text-slate-400">All calculations performed deterministically from actual application state.</p>
      </footer>

      {/* Modals */}
      <SavedEventsModal
        isOpen={showSavedModal}
        onClose={() => setShowSavedModal(false)}
        onSelectEvent={(plan) => {
          setCurrentPlan(plan);
          setShowWizard(false);
          setActiveTab('overview');
        }}
      />

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={(plan) => {
          setCurrentPlan(plan);
          setShowWizard(false);
          setActiveTab('overview');
          setRecentChanges({
            changes: ['Successfully imported celebration plan from JSON.'],
            rationale: 'All items, budget calculations, and schedules restored.',
          });
        }}
      />
    </div>
  );
};

export default App;
