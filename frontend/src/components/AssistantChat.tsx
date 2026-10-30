import React, { useState, useEffect } from 'react';
import { Send, Sparkles, RefreshCw, CheckCircle2, HelpCircle, ArrowRight, Lightbulb, Zap } from 'lucide-react';
import { EventPlan, AssistantQuestion } from '../types/event';
import { api } from '../api/client';

interface AssistantChatProps {
  currentPlan: EventPlan;
  onPlanUpdated: (updatedPlan: EventPlan, changes: string[], rationale: string) => void;
  recentChanges: { changes: string[]; rationale: string } | null;
}

export const AssistantChat: React.FC<AssistantChatProps> = ({
  currentPlan,
  onPlanUpdated,
  recentChanges,
}) => {
  const [instruction, setInstruction] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [questions, setQuestions] = useState<AssistantQuestion[]>([]);
  const [loadingQuestions, setLoadingQuestions] = useState(false);

  // Load progressive questions for missing/default fields
  useEffect(() => {
    async function loadQuestions() {
      setLoadingQuestions(true);
      try {
        const qList = await api.getQuestions(currentPlan.requirements);
        setQuestions(qList);
      } catch (err) {
        console.error('Failed to load progressive questions', err);
      } finally {
        setLoadingQuestions(false);
      }
    }
    loadQuestions();
  }, [currentPlan.requirements]);

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || instruction;
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const res = await api.adjustPlan(currentPlan.id, text);
      onPlanUpdated(res.updated_plan, res.changes_summary, res.rationale);
      setInstruction('');
    } catch (err: any) {
      alert(`Adjustment error: ${err.message || 'Failed to adjust plan'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAnswerQuestion = async (field: string, value: string) => {
    setIsSubmitting(true);
    try {
      let promptText = '';
      if (field === 'dietary_requirements') {
        promptText = `I need ${value} food accommodated for my guests.`;
      } else if (field === 'accessibility_requirements') {
        promptText = `Ensure the venue supports ${value}.`;
      } else if (field === 'children_attending') {
        promptText = value === 'true' ? 'Make it suitable for children.' : 'Adults only, no children.';
      } else if (field === 'diy_preference') {
        promptText = `Adjust planning style to ${value.replace('_', ' ')}.`;
      } else {
        promptText = `Update ${field} to ${value}.`;
      }

      const res = await api.adjustPlan(currentPlan.id, promptText);
      onPlanUpdated(res.updated_plan, res.changes_summary, res.rationale);
    } catch (err: any) {
      alert(`Error answering question: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickChips = [
    'My budget has decreased by 20%',
    'Increase the guest count from 30 to 50',
    'Move the event indoors',
    'Make it suitable for children',
    'I need vegetarian food',
    'Remove photography and add more entertainment',
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-100">
        <div className="flex items-center space-x-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-900">Dynamic Plan Assistant</h2>
            <p className="text-xs text-slate-500">
              Adapts budget, schedule & recommendations instantly while preserving your choices.
            </p>
          </div>
        </div>
      </div>

      {/* Input bar */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        className="flex items-center space-x-2 mb-3"
      >
        <div className="relative flex-1">
          <input
            id="input-assistant-prompt"
            type="text"
            placeholder="Tell the assistant what to adjust (e.g., 'Cut budget by 15%' or 'Move indoors')..."
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            disabled={isSubmitting}
            className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all placeholder:text-slate-400"
          />
        </div>
        <button
          id="btn-submit-assistant"
          type="submit"
          disabled={!instruction.trim() || isSubmitting}
          className="px-4 py-2.5 rounded-xl font-semibold text-xs sm:text-sm text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-40 transition-all flex items-center space-x-1.5 shadow-xs"
        >
          {isSubmitting ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <span>Adapt Plan</span>
              <Send className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Adjustment Chips */}
      <div className="mb-4">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
          <Lightbulb className="w-3 h-3 text-amber-500" />
          <span>Quick Contextual Adjustments:</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {quickChips.map((chip, idx) => (
            <button
              key={idx}
              id={`quick-chip-${idx}`}
              type="button"
              disabled={isSubmitting}
              onClick={() => handleSend(chip)}
              className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 transition-colors"
            >
              + "{chip}"
            </button>
          ))}
        </div>
      </div>

      {/* What Changed & Why Diff Alert */}
      {recentChanges && recentChanges.changes.length > 0 && (
        <div
          role="region"
          aria-label="Change Summary"
          className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/90 text-amber-900 mb-4 animate-fade-in"
        >
          <div className="flex items-center space-x-2 font-bold text-xs mb-1.5 text-amber-950">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Plan Successfully Adapted:</span>
          </div>
          <ul className="text-xs space-y-1 pl-5 list-disc text-amber-900">
            {recentChanges.changes.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
          {recentChanges.rationale && (
            <p className="text-xs mt-2 text-amber-800/90 italic border-t border-amber-200/50 pt-1.5">
              <span className="font-semibold not-italic">Rationale: </span>
              {recentChanges.rationale}
            </p>
          )}
        </div>
      )}

      {/* Progressive Missing Questions */}
      {questions.length > 0 && (
        <div className="pt-3 border-t border-slate-100">
          <div className="text-xs font-bold text-slate-700 mb-2 flex items-center space-x-1.5">
            <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
            <span>Missing Context Refinement (Optional):</span>
          </div>
          <div className="space-y-2">
            {questions.map((q) => (
              <div
                key={q.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <p className="font-semibold text-slate-800">{q.question}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {q.explanation}{' '}
                    <span className="italic text-slate-400">({q.current_assumption})</span>
                  </p>
                </div>
                {q.suggested_options && (
                  <div className="flex flex-wrap gap-1 shrink-0">
                    {q.suggested_options.slice(0, 3).map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isSubmitting}
                        onClick={() => handleAnswerQuestion(q.field, opt.value)}
                        className="px-2 py-1 rounded-md bg-white border border-slate-300 hover:border-amber-400 hover:text-amber-800 text-[11px] font-medium transition-all"
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
