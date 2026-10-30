import React, { useState, useEffect } from 'react';
import { FolderOpen, X, Trash2, Calendar, Users, DollarSign, ArrowRight } from 'lucide-react';
import { api } from '../api/client';
import { EventPlan } from '../types/event';

interface SavedEventsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectEvent: (plan: EventPlan) => void;
}

export const SavedEventsModal: React.FC<SavedEventsModalProps> = ({
  isOpen,
  onClose,
  onSelectEvent,
}) => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const list = await api.listEvents();
      setEvents(list);
    } catch (err) {
      console.error('Failed to list events', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchEvents();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleOpen = async (id: string) => {
    try {
      const plan = await api.getEvent(id);
      onSelectEvent(plan);
      onClose();
    } catch (err: any) {
      alert(`Failed to load event: ${err.message}`);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved event?')) return;
    try {
      await api.deleteEvent(id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 animate-fade-in flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5 text-amber-600" />
            <h3 className="text-base font-bold text-slate-900">Saved Celebration Plans</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="overflow-y-auto py-4 space-y-3 flex-1 no-scrollbar">
          {loading ? (
            <div className="p-8 text-center text-xs text-slate-400">Loading saved celebrations...</div>
          ) : events.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              No saved celebration plans found yet. Create or load a demo to get started!
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                onClick={() => handleOpen(ev.id)}
                className="p-4 rounded-2xl border border-slate-200 hover:border-amber-400 hover:shadow-xs transition-all cursor-pointer bg-white group flex items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-slate-900 group-hover:text-amber-700 transition-colors">
                    {ev.title}
                  </h4>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                    <span className="flex items-center space-x-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.event_date || 'Date TBD'}</span>
                    </span>
                    <span>•</span>
                    <span className="flex items-center space-x-1">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ev.guest_count} guests</span>
                    </span>
                    <span>•</span>
                    <span className="font-semibold text-slate-700">
                      {ev.currency} {ev.total_budget?.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 shrink-0">
                  <button
                    onClick={(e) => handleDelete(ev.id, e)}
                    className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    title="Delete saved plan"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <div className="p-2 text-slate-400 group-hover:text-amber-600 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
