import React from 'react';
import { Sparkles, PlusCircle, FolderOpen, Upload, Printer, Cpu } from 'lucide-react';
import { EventPlan } from '../types/event';

interface NavbarProps {
  currentPlan: EventPlan | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewEvent: () => void;
  onOpenSaved: () => void;
  onImportClick: () => void;
  aiStatus: { provider: string; is_configured: boolean; mode: string; message: string } | null;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentPlan,
  activeTab,
  setActiveTab,
  onNewEvent,
  onOpenSaved,
  onImportClick,
  aiStatus,
}) => {
  const tabs = [
    { id: 'overview', label: 'Overview & Recommendations' },
    { id: 'budget', label: 'Budget Planner' },
    { id: 'timeline', label: 'Timeline & Schedule' },
    { id: 'guests', label: 'Guests & Seating' },
    { id: 'checklist', label: 'Action Checklist' },
    { id: 'summary', label: 'Print / Export' },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-linear-to-tr from-amber-500 via-rose-500 to-amber-600 flex items-center justify-center text-white shadow-sm">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-lg font-bold tracking-tight text-slate-900">Celebration Planner</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                  AI MVP
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Intelligent, Context-Aware Event Orchestration</p>
            </div>
          </div>

          {/* AI Status Badge & Actions */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {aiStatus && (
              <div
                className={`hidden md:flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                  aiStatus.is_configured
                    ? 'bg-purple-50 text-purple-700 border-purple-200'
                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                }`}
                title={aiStatus.message}
              >
                <Cpu className="w-3.5 h-3.5 text-emerald-600" />
                <span>{aiStatus.is_configured ? `AI (${aiStatus.provider})` : 'Local Intelligence (Active)'}</span>
              </div>
            )}

            <button
              id="btn-saved-plans"
              onClick={onOpenSaved}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="View saved celebration plans"
            >
              <FolderOpen className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Saved Plans</span>
            </button>

            <button
              id="btn-import-plan"
              onClick={onImportClick}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
              title="Import JSON plan"
            >
              <Upload className="w-4 h-4 text-slate-600" />
              <span className="hidden sm:inline">Import</span>
            </button>

            <button
              id="btn-new-event"
              onClick={onNewEvent}
              className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold text-white bg-linear-to-r from-amber-600 to-rose-600 hover:from-amber-700 hover:to-rose-700 shadow-xs transition-all"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Plan</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation if plan loaded */}
        {currentPlan && (
          <nav className="flex space-x-1 overflow-x-auto py-2 border-t border-slate-100 no-scrollbar">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs sm:text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-amber-500 text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </nav>
        )}
      </div>
    </header>
  );
};
