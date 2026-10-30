import React, { useState, useEffect } from 'react';
import {
  Users, UserPlus, CheckCircle, Clock, XCircle, Mail,
  Utensils, LayoutGrid, Trash2, Edit2, ShieldAlert, Baby
} from 'lucide-react';
import { Guest } from '../types/event';
import { api } from '../api/client';

interface GuestManagerProps {
  eventId: string;
  initialGuests: Guest[];
  onGuestsUpdated?: (guests: Guest[]) => void;
}

export const GuestManager: React.FC<GuestManagerProps> = ({
  eventId,
  initialGuests,
  onGuestsUpdated,
}) => {
  const [guests, setGuests] = useState<Guest[]>(initialGuests);
  const [metrics, setMetrics] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Add/Edit Guest Modal
  const [showModal, setShowModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Partial<Guest>>({
    name: '',
    rsvp_status: 'attending',
    plus_ones: 0,
    dietary_requirements: [],
    accessibility_needs: '',
    is_child: false,
  });

  const dietaryChoices = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free'];

  // Refresh guest metrics from backend
  const fetchSummary = async () => {
    try {
      const data = await api.getGuestsSummary(eventId);
      setGuests(data.guests);
      setMetrics(data.metrics);
      if (onGuestsUpdated) onGuestsUpdated(data.guests);
    } catch (err) {
      console.error('Failed to load guest metrics', err);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [eventId]);

  const handleStatusChange = async (guest: Guest, newStatus: string) => {
    const updated: Guest = { ...guest, rsvp_status: newStatus as any };
    try {
      await api.updateGuest(eventId, guest.id, updated);
      fetchSummary();
    } catch (err: any) {
      alert(`Update error: ${err.message}`);
    }
  };

  const handleDelete = async (guestId: string) => {
    try {
      await api.deleteGuest(eventId, guestId);
      fetchSummary();
    } catch (err: any) {
      alert(`Delete error: ${err.message}`);
    }
  };

  const handleSaveGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGuest.name?.trim()) return;

    try {
      if (editingGuest.id) {
        await api.updateGuest(eventId, editingGuest.id, editingGuest as Guest);
      } else {
        await api.addGuest(eventId, editingGuest);
      }
      setShowModal(false);
      setEditingGuest({
        name: '',
        rsvp_status: 'attending',
        plus_ones: 0,
        dietary_requirements: [],
        accessibility_needs: '',
        is_child: false,
      });
      fetchSummary();
    } catch (err: any) {
      alert(`Save error: ${err.message}`);
    }
  };

  const toggleDietaryOption = (opt: string) => {
    setEditingGuest((prev) => {
      const current = prev.dietary_requirements || [];
      const exists = current.includes(opt);
      return {
        ...prev,
        dietary_requirements: exists ? current.filter((d) => d !== opt) : [...current, opt],
      };
    });
  };

  return (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Total Listed</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
            {metrics?.total_guest_entries ?? guests.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Recorded invitations</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Confirmed RSVPs</span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-emerald-700">
            {metrics?.confirmed_attending ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Including +1 companions</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Tentative / Maybe</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-amber-700">
            {metrics?.tentative ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Weighted at 50% likelihood</div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Expected Attendance</span>
            <LayoutGrid className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-indigo-900">
            {metrics?.expected_attendance ?? 0}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">Used for catering orders</div>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-indigo-900 text-xs font-semibold flex items-center justify-between">
            <span>Tables Needed</span>
            <LayoutGrid className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-indigo-950">
            {metrics?.recommended_tables ?? 1}
          </div>
          <div className="mt-1 text-[11px] text-indigo-700">8 guests per standard round table</div>
        </div>
      </div>

      {/* Dynamic Catering & Seating Guidance */}
      {metrics?.catering_advice && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/90 text-amber-950 flex items-start space-x-3 text-xs shadow-xs">
          <Utensils className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Catering & Seating Advice: </span>
            <span>{metrics.catering_advice}</span>
          </div>
        </div>
      )}

      {/* Guest Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Guest List & RSVPs</h3>
            <p className="text-xs text-slate-500">Track responses, plus-ones, and dietary preferences.</p>
          </div>
          <button
            id="btn-add-guest"
            onClick={() => {
              setEditingGuest({
                name: '',
                rsvp_status: 'attending',
                plus_ones: 0,
                dietary_requirements: [],
                accessibility_needs: '',
                is_child: false,
              });
              setShowModal(true);
            }}
            className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Guest</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Guest Name</th>
                <th className="py-3 px-4">RSVP Status</th>
                <th className="py-3 px-4 text-center">+1s</th>
                <th className="py-3 px-4">Dietary / Notes</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guests.map((g) => (
                <tr key={g.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    <div className="flex items-center space-x-1.5">
                      <span>{g.name}</span>
                      {g.is_child && (
                        <span className="inline-flex items-center space-x-0.5 text-[10px] px-1.5 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
                          <Baby className="w-2.5 h-2.5" />
                          <span>Child</span>
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <select
                      value={g.rsvp_status}
                      onChange={(e) => handleStatusChange(g, e.target.value)}
                      className={`px-2 py-1 rounded-lg text-xs font-bold border transition-colors bg-white ${
                        g.rsvp_status === 'attending'
                          ? 'text-emerald-700 border-emerald-300'
                          : g.rsvp_status === 'tentative'
                          ? 'text-amber-700 border-amber-300'
                          : g.rsvp_status === 'declined'
                          ? 'text-rose-700 border-rose-300'
                          : 'text-slate-600 border-slate-300'
                      }`}
                    >
                      <option value="attending">✓ Attending</option>
                      <option value="tentative">? Tentative</option>
                      <option value="declined">✕ Declined</option>
                      <option value="invited">✉ Invited</option>
                    </select>
                  </td>

                  <td className="py-3 px-4 text-center font-mono font-semibold text-slate-700">
                    {g.plus_ones > 0 ? `+${g.plus_ones}` : '0'}
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    <div className="flex flex-wrap gap-1">
                      {g.dietary_requirements && g.dietary_requirements.length > 0 ? (
                        g.dietary_requirements.map((d, idx) => (
                          <span
                            key={idx}
                            className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200"
                          >
                            {d}
                          </span>
                        ))
                      ) : (
                        <span className="text-slate-400 text-[11px]">Standard menu</span>
                      )}
                      {g.accessibility_needs && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-indigo-50 text-indigo-800 border border-indigo-200">
                          {g.accessibility_needs}
                        </span>
                      )}
                    </div>
                  </td>

                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingGuest(g);
                        setShowModal(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-amber-700 hover:bg-slate-100 transition-colors"
                      title="Edit guest"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(g.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove guest"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Guest Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              {editingGuest.id ? 'Edit Guest Details' : 'Add Guest to Celebration'}
            </h3>
            <p className="text-xs text-slate-500 mb-4">Record RSVP status and dietary preferences.</p>

            <form onSubmit={handleSaveGuest} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Sarah Johnson"
                  value={editingGuest.name || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">RSVP Status</label>
                  <select
                    value={editingGuest.rsvp_status || 'attending'}
                    onChange={(e) => setEditingGuest({ ...editingGuest, rsvp_status: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                  >
                    <option value="attending">Attending</option>
                    <option value="tentative">Tentative</option>
                    <option value="declined">Declined</option>
                    <option value="invited">Invited</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Plus-Ones</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={editingGuest.plus_ones ?? 0}
                    onChange={(e) =>
                      setEditingGuest({ ...editingGuest, plus_ones: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Dietary Accommodations
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {dietaryChoices.map((opt) => {
                    const isSelected = editingGuest.dietary_requirements?.includes(opt);
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => toggleDietaryOption(opt)}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          isSelected
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                            : 'bg-white text-slate-600 border-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Accessibility Note</label>
                <input
                  type="text"
                  placeholder="e.g., Needs step-free seating near front"
                  value={editingGuest.accessibility_needs || ''}
                  onChange={(e) => setEditingGuest({ ...editingGuest, accessibility_needs: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="guest-is-child"
                  type="checkbox"
                  checked={editingGuest.is_child || false}
                  onChange={(e) => setEditingGuest({ ...editingGuest, is_child: e.target.checked })}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
                <label htmlFor="guest-is-child" className="text-xs text-slate-700 font-semibold">
                  This attendee is a child
                </label>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700"
                >
                  Save Guest
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
