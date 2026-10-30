import React, { useState } from 'react';
import {
  Clock, Plus, Trash2, Edit2, AlertCircle, CheckCircle2,
  Calendar, Flag, ChevronRight, Music, Utensils, Sparkles
} from 'lucide-react';
import { TimelineItem } from '../types/event';
import { api } from '../api/client';

interface TimelineViewProps {
  eventId: string;
  timeline: TimelineItem[];
  startTime: string;
  onTimelineUpdated: (updatedTimeline: TimelineItem[]) => void;
}

const CATEGORY_STYLES: Record<string, { bg: string; text: string; icon: any }> = {
  setup: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
  arrival: { bg: 'bg-emerald-100', text: 'text-emerald-800', icon: Calendar },
  dining: { bg: 'bg-orange-100', text: 'text-orange-800', icon: Utensils },
  highlight: { bg: 'bg-rose-100', text: 'text-rose-800', icon: Sparkles },
  entertainment: { bg: 'bg-purple-100', text: 'text-purple-800', icon: Music },
  departure: { bg: 'bg-amber-100', text: 'text-amber-800', icon: Flag },
  cleanup: { bg: 'bg-slate-100', text: 'text-slate-700', icon: Clock },
};

export const TimelineView: React.FC<TimelineViewProps> = ({
  eventId,
  timeline,
  startTime,
  onTimelineUpdated,
}) => {
  const [items, setItems] = useState<TimelineItem[]>(timeline);
  const [validationMessages, setValidationMessages] = useState<string[]>([]);
  const [isValid, setIsValid] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Edit / Add Modal state
  const [editingItem, setEditingItem] = useState<TimelineItem | null>(null);
  const [isNew, setIsNew] = useState(false);

  React.useEffect(() => {
    setItems(timeline);
  }, [timeline]);

  const saveTimeline = async (updated: TimelineItem[]) => {
    setIsSaving(true);
    try {
      const res = await api.updateTimeline(eventId, updated);
      setItems(res.timeline);
      setIsValid(res.is_valid);
      setValidationMessages(res.validation_messages);
      onTimelineUpdated(res.timeline);
    } catch (err: any) {
      alert(`Timeline update error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteItem = (itemId: string) => {
    if (items.length <= 1) {
      alert('Must retain at least one schedule item.');
      return;
    }
    const updated = items.filter((it) => it.id !== itemId);
    saveTimeline(updated);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;

    let updated: TimelineItem[];
    if (isNew) {
      updated = [...items, editingItem].sort((a, b) => a.time_offset_minutes - b.time_offset_minutes);
    } else {
      updated = items
        .map((it) => (it.id === editingItem.id ? editingItem : it))
        .sort((a, b) => a.time_offset_minutes - b.time_offset_minutes);
    }

    saveTimeline(updated);
    setEditingItem(null);
  };

  const openNewItemModal = () => {
    const newItem: TimelineItem = {
      id: `time-${Date.now()}`,
      time_offset_minutes: 60,
      display_time: '19:00',
      duration_minutes: 30,
      title: '',
      description: '',
      category: 'entertainment',
      is_milestone: false,
    };
    setEditingItem(newItem);
    setIsNew(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar with Status and Action */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-slate-900">Chronological Event Timeline</h2>
            {isValid ? (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Sequence Verified</span>
              </span>
            ) : (
              <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Schedule Clash Detected</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Calculated from start time <span className="font-semibold text-slate-700">{startTime}</span> with setup, dining, highlights, and pack down.
          </p>
        </div>

        <button
          id="btn-add-milestone"
          onClick={openNewItemModal}
          className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add Activity</span>
        </button>
      </div>

      {/* Validation Clash Warnings */}
      {validationMessages.length > 0 && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-xs text-xs space-y-1"
        >
          <div className="font-bold flex items-center space-x-1.5 text-amber-950">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Timeline Advisory Notes:</span>
          </div>
          <ul className="pl-5 list-disc space-y-0.5">
            {validationMessages.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Chronological Timeline Cards */}
      <div className="relative pl-6 sm:pl-8 space-y-4 before:content-[''] before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
        {items.map((it) => {
          const catStyle = CATEGORY_STYLES[it.category] || CATEGORY_STYLES.setup;
          const Icon = catStyle.icon;

          return (
            <div
              key={it.id}
              className={`relative bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition-all hover:shadow-sm ${
                it.is_milestone ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
              }`}
            >
              {/* Timeline marker */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-5 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center ${
                  it.is_milestone ? 'bg-amber-500 text-white' : 'bg-slate-400 text-white'
                }`}
              >
                <div className="w-2 h-2 rounded-full bg-white" />
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-extrabold text-slate-900 font-mono tracking-tight">
                      {it.display_time}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-md font-semibold bg-slate-100 text-slate-600">
                      {it.duration_minutes} mins
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.text}`}>
                      {it.category}
                    </span>
                    {it.is_milestone && (
                      <span className="text-[10px] px-2 py-0.5 rounded-md font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        Milestone
                      </span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 pt-0.5">{it.title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{it.description}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={() => {
                      setEditingItem(it);
                      setIsNew(false);
                    }}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-slate-100 transition-colors"
                    title="Edit activity"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(it.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete activity"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Edit / Add Activity Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {isNew ? 'Add Timeline Activity' : 'Edit Timeline Activity'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Set activity title, start offset, duration, and category.</p>

            <form onSubmit={handleSaveModal} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Activity Title</label>
                <input
                  type="text"
                  required
                  value={editingItem.title}
                  onChange={(e) => setEditingItem({ ...editingItem, title: e.target.value })}
                  placeholder="e.g., Welcome Remarks or Cake Cutting"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clock Time (HH:MM)
                  </label>
                  <input
                    type="time"
                    required
                    value={editingItem.display_time}
                    onChange={(e) => setEditingItem({ ...editingItem, display_time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="360"
                    step="5"
                    required
                    value={editingItem.duration_minutes}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, duration_minutes: parseInt(e.target.value) || 15 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={editingItem.category}
                  onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="setup">Setup & Prep</option>
                  <option value="arrival">Guest Arrival</option>
                  <option value="dining">Dining & Food</option>
                  <option value="highlight">Highlight & Toasts</option>
                  <option value="entertainment">Entertainment & Dance</option>
                  <option value="departure">Farewell</option>
                  <option value="cleanup">Cleanup</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editingItem.description}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  placeholder="Brief coordination instructions for helpers or vendors."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="checkbox-milestone"
                  type="checkbox"
                  checked={editingItem.is_milestone}
                  onChange={(e) => setEditingItem({ ...editingItem, is_milestone: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
                <label htmlFor="checkbox-milestone" className="text-xs text-slate-700 font-semibold">
                  Highlight as key event milestone
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700"
                >
                  Save Activity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
