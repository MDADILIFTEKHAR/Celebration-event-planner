import React, { useState } from 'react';
import {
  CheckSquare, Square, Plus, Trash2, Calendar, AlertCircle,
  Clock, CheckCircle, Tag, Filter
} from 'lucide-react';
import { ChecklistItem } from '../types/event';

interface ChecklistViewProps {
  checklist: ChecklistItem[];
  onChecklistUpdated: (updatedChecklist: ChecklistItem[]) => void;
}

const PRIORITY_BADGES: Record<string, { bg: string; text: string; border: string }> = {
  high: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  medium: { bg: 'bg-amber-50', text: 'text-amber-800', border: 'border-amber-200' },
  low: { bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200' },
};

export const ChecklistView: React.FC<ChecklistViewProps> = ({
  checklist,
  onChecklistUpdated,
}) => {
  const [tasks, setTasks] = useState<ChecklistItem[]>(checklist);
  const [filter, setFilter] = useState<'all' | 'todo' | 'completed' | 'high'>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  // New task form state
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState('logistics');
  const [newTaskPriority, setNewTaskPriority] = useState<'high' | 'medium' | 'low'>('medium');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');

  React.useEffect(() => {
    setTasks(checklist);
  }, [checklist]);

  const toggleTask = (taskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const nextStatus: 'todo' | 'completed' = t.status === 'completed' ? 'todo' : 'completed';
        return { ...t, status: nextStatus };
      }
      return t;
    });
    setTasks(updated);
    onChecklistUpdated(updated);
  };

  const deleteTask = (taskId: string) => {
    const updated = tasks.filter((t) => t.id !== taskId);
    setTasks(updated);
    onChecklistUpdated(updated);
  };

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    const newTask: ChecklistItem = {
      id: `task-${Date.now()}`,
      task: newTaskName.trim(),
      category: newTaskCategory,
      priority: newTaskPriority,
      due_offset_days: 7,
      due_date: newTaskDueDate || 'Event Day',
      status: 'todo',
      notes: newTaskNotes.trim(),
    };

    const updated = [newTask, ...tasks];
    setTasks(updated);
    onChecklistUpdated(updated);

    setShowAddModal(false);
    setNewTaskName('');
    setNewTaskNotes('');
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const progressPct = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  const filteredTasks = tasks.filter((t) => {
    if (filter === 'todo') return t.status !== 'completed';
    if (filter === 'completed') return t.status === 'completed';
    if (filter === 'high') return t.priority === 'high';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Progress & Actions Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Actionable Planning Checklist</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Prioritized tasks and vendor milestones mapped to celebration date.
            </p>
          </div>
          <button
            id="btn-add-task"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Add Task</span>
          </button>
        </div>

        {/* Progress bar */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1.5">
            <span>Overall Readiness Progress</span>
            <span className="text-amber-800 font-bold">
              {completedCount} of {tasks.length} tasks completed ({progressPct}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-linear-to-r from-amber-500 to-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-2 mt-4 pt-3 border-t border-slate-100 overflow-x-auto no-scrollbar">
          <span className="text-xs text-slate-400 font-semibold flex items-center space-x-1 mr-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {[
            { id: 'all', label: `All (${tasks.length})` },
            { id: 'todo', label: `Pending (${tasks.length - completedCount})` },
            { id: 'completed', label: `Done (${completedCount})` },
            { id: 'high', label: `High Priority (${tasks.filter((t) => t.priority === 'high').length})` },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id as any)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === f.id
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-2.5">
        {filteredTasks.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
            No tasks found in this view.
          </div>
        ) : (
          filteredTasks.map((t) => {
            const isDone = t.status === 'completed';
            const prioStyle = PRIORITY_BADGES[t.priority] || PRIORITY_BADGES.medium;

            return (
              <div
                key={t.id}
                className={`p-4 rounded-2xl border transition-all flex items-start justify-between gap-3 ${
                  isDone
                    ? 'bg-slate-50/70 border-slate-200 opacity-70'
                    : 'bg-white border-slate-200 hover:border-amber-300 shadow-xs'
                }`}
              >
                <div className="flex items-start space-x-3">
                  <button
                    type="button"
                    onClick={() => toggleTask(t.id)}
                    className="mt-0.5 text-slate-400 hover:text-amber-600 transition-colors shrink-0"
                    title={isDone ? 'Mark as todo' : 'Mark as completed'}
                  >
                    {isDone ? (
                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <Square className="w-5 h-5 text-slate-400" />
                    )}
                  </button>

                  <div className="space-y-1">
                    <p
                      className={`text-sm font-semibold text-slate-900 ${
                        isDone ? 'line-through text-slate-500' : ''
                      }`}
                    >
                      {t.task}
                    </p>
                    {t.notes && <p className="text-xs text-slate-500">{t.notes}</p>}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="inline-flex items-center space-x-1 text-[11px] font-mono text-slate-500">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        <span>Due {t.due_date}</span>
                      </span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider border ${prioStyle.bg} ${prioStyle.text} ${prioStyle.border}`}
                      >
                        {t.priority}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold uppercase tracking-wider">
                        {t.category}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => deleteTask(t.id)}
                  className="p-1.5 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors shrink-0"
                  title="Delete task"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Add Custom Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Planning Task</h3>
            <p className="text-xs text-slate-500 mb-4">Set task details, priority, and due target.</p>
            <form onSubmit={handleAddTask} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Task Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Finalize signature cocktail ingredients"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="venue">Venue</option>
                    <option value="catering">Catering</option>
                    <option value="decor">Decor</option>
                    <option value="guests">Guests</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="logistics">Logistics</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="high">High</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={newTaskDueDate}
                  onChange={(e) => setNewTaskDueDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Notes</label>
                <input
                  type="text"
                  placeholder="e.g., Assigned to sister or vendor coordinator"
                  value={newTaskNotes}
                  onChange={(e) => setNewTaskNotes(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700"
                >
                  Save Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
