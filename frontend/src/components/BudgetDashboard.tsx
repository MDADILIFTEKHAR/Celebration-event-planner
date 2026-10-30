import React, { useState } from 'react';
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import {
  DollarSign, AlertTriangle, ShieldCheck, Lock, Unlock, Plus, Trash2,
  TrendingDown, RefreshCw, CheckCircle, Info
} from 'lucide-react';
import { BudgetSummary, BudgetItem } from '../types/event';
import { api } from '../api/client';

interface BudgetDashboardProps {
  eventId: string;
  budget: BudgetSummary;
  currency: string;
  onBudgetUpdated: (updatedBudget: BudgetSummary) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  venue: '#3b82f6',
  food_beverage: '#f97316',
  decorations: '#ec4899',
  cake_dessert: '#eab308',
  entertainment: '#8b5cf6',
  photography: '#06b6d4',
  invitations_favors: '#10b981',
  transportation: '#64748b',
  contingency: '#6366f1',
};

export const BudgetDashboard: React.FC<BudgetDashboardProps> = ({
  eventId,
  budget,
  currency,
  onBudgetUpdated,
}) => {
  const [items, setItems] = useState<BudgetItem[]>(budget.items);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showReallocateModal, setShowReallocateModal] = useState(false);
  const [targetBudgetInput, setTargetBudgetInput] = useState(budget.total_budget.toString());

  // New Item State
  const [newItemCategory, setNewItemCategory] = useState('entertainment');
  const [newItemName, setNewItemName] = useState('');
  const [newItemCost, setNewItemCost] = useState('100');
  const [newItemMandatory, setNewItemMandatory] = useState(false);
  const [newItemAssumption, setNewItemAssumption] = useState('');

  // Keep local items in sync if prop changes
  React.useEffect(() => {
    setItems(budget.items);
    setTargetBudgetInput(budget.total_budget.toString());
  }, [budget]);

  // Recalculate and persist budget item changes
  const saveItems = async (updatedItems: BudgetItem[]) => {
    setIsSaving(true);
    try {
      const newSummary = await api.updateBudgetItems(eventId, updatedItems);
      setItems(newSummary.items);
      onBudgetUpdated(newSummary);
    } catch (err: any) {
      alert(`Budget update failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCostChange = (itemId: string, newCostStr: string) => {
    const cost = Math.max(parseFloat(newCostStr) || 0, 0);
    const updated = items.map((it) => (it.id === itemId ? { ...it, estimated_cost: cost } : it));
    setItems(updated);
  };

  const handleBlurCost = () => {
    saveItems(items);
  };

  const toggleMandatory = (itemId: string) => {
    const updated = items.map((it) =>
      it.id === itemId ? { ...it, is_mandatory: !it.is_mandatory } : it
    );
    saveItems(updated);
  };

  const handleDeleteItem = (itemId: string) => {
    if (items.length <= 1) {
      alert('Must retain at least one budget item.');
      return;
    }
    const updated = items.filter((it) => it.id !== itemId);
    saveItems(updated);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    const newItem: BudgetItem = {
      id: `item-${Date.now()}`,
      category: newItemCategory,
      name: newItemName.trim(),
      estimated_cost: Math.max(parseFloat(newItemCost) || 0, 0),
      is_mandatory: newItemMandatory,
      assumption: newItemAssumption.trim() || 'Custom user expense item.',
    };

    const updated = [...items, newItem];
    saveItems(updated);
    setShowAddModal(false);
    setNewItemName('');
    setNewItemCost('100');
    setNewItemAssumption('');
  };

  const handleReallocate = async (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(targetBudgetInput);
    if (isNaN(val) || val < 0) {
      alert('Please enter a valid positive target budget.');
      return;
    }

    setIsSaving(true);
    try {
      const summary = await api.reallocateBudget(eventId, val);
      onBudgetUpdated(summary);
      setShowReallocateModal(false);
    } catch (err: any) {
      alert(`Reallocation error: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Prepare chart data from actual category totals
  const pieData = Object.entries(budget.category_totals).map(([category, amount]) => ({
    name: category.replace('_', ' ').toUpperCase(),
    value: amount,
    color: CATEGORY_COLORS[category] || '#94a3b8',
  }));

  const barData = Object.entries(budget.category_totals).map(([category, amount]) => ({
    category: category.replace('_', ' '),
    amount: amount,
  }));

  return (
    <div className="space-y-6">
      {/* Overrun Warning Banner */}
      {budget.is_overrun && (
        <div
          role="alert"
          className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 flex items-start space-x-3 shadow-xs animate-fade-in"
        >
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-bold">Budget Overrun Detected</h4>
            <p className="text-xs mt-0.5">
              Total estimated expenditures exceed your set budget by{' '}
              <span className="font-extrabold text-rose-700">
                {currency} {budget.overrun_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              . Consider scaling down optional categories or adjusting the total budget.
            </p>
          </div>
          <button
            onClick={() => setShowReallocateModal(true)}
            className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shrink-0"
          >
            Auto-Rebalance
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Total Budget */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Total Budget</span>
            <DollarSign className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
            {currency} {budget.total_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1">
            <button
              onClick={() => setShowReallocateModal(true)}
              className="text-[11px] text-amber-700 hover:text-amber-800 font-semibold underline"
            >
              Adjust Target
            </button>
          </div>
        </div>

        {/* Total Allocated */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Allocated Expenses</span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className={`mt-2 text-xl sm:text-2xl font-black ${budget.is_overrun ? 'text-rose-600' : 'text-slate-900'}`}>
            {currency} {budget.total_allocated.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Across {items.length} itemized costs
          </div>
        </div>

        {/* Remaining Budget */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Remaining Funds</span>
            <CheckCircle className={`w-4 h-4 ${budget.remaining_budget >= 0 ? 'text-emerald-500' : 'text-rose-500'}`} />
          </div>
          <div
            className={`mt-2 text-xl sm:text-2xl font-black ${
              budget.remaining_budget >= 0 ? 'text-emerald-700' : 'text-rose-600'
            }`}
          >
            {currency} {budget.remaining_budget.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {budget.remaining_budget >= 0 ? 'Unallocated reserve' : 'Over budget'}
          </div>
        </div>

        {/* Utilization % */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs">
          <div className="text-slate-500 text-xs font-medium flex items-center justify-between">
            <span>Budget Utilization</span>
            <span className="text-xs font-bold text-slate-700">{budget.utilization_percentage}%</span>
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-slate-900">
            {budget.utilization_percentage}%
          </div>
          <div className="mt-2 w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full ${
                budget.utilization_percentage > 100
                  ? 'bg-rose-500'
                  : budget.utilization_percentage > 85
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(budget.utilization_percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Contingency Reserve */}
        <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-200 shadow-xs col-span-2 lg:col-span-1">
          <div className="text-indigo-900 text-xs font-semibold flex items-center justify-between">
            <span>Safety Reserve</span>
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-xl sm:text-2xl font-black text-indigo-950">
            {currency} {budget.contingency_amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <div className="mt-1 text-[11px] text-indigo-700">
            {budget.contingency_percentage}% buffer for surprise fees
          </div>
        </div>
      </div>

      {/* Visual Charts: Donut & Category Bars */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Donut Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Category Spending Breakdown</h3>
          <p className="text-xs text-slate-500 mb-4">Proportional allocation of celebration budget</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(value: any) => [`${currency} ${Number(value).toFixed(2)}`, 'Allocated']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-2 justify-center mt-2">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-1.5 text-[11px] text-slate-600">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span>{item.name.toLowerCase()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 mb-2">Category Comparisons ({currency})</h3>
          <p className="text-xs text-slate-500 mb-4">Total estimated amounts per category</p>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: 0, bottom: 25 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="category" tick={{ fontSize: 10 }} angle={-25} textAnchor="end" />
                <YAxis tick={{ fontSize: 10 }} />
                <RechartsTooltip
                  formatter={(val: any) => [`${currency} ${Number(val).toFixed(2)}`, 'Amount']}
                />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Editable Itemized Expenses Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Itemized Cost Breakdown</h3>
            <p className="text-xs text-slate-500">
              Edit amounts directly, lock mandatory expenses, or add custom budget items.
            </p>
          </div>
          <div className="flex items-center space-x-2">
            {isSaving && (
              <span className="text-xs text-slate-400 flex items-center space-x-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Updating...</span>
              </span>
            )}
            <button
              id="btn-add-expense"
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 transition-colors shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Priority / Lock</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Item & Assumptions</th>
                <th className="py-3 px-4 text-right">Cost ({currency})</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-slate-50/80 transition-colors">
                  {/* Mandatory Lock */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => toggleMandatory(it.id)}
                      className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-md text-[11px] font-semibold transition-colors ${
                        it.is_mandatory
                          ? 'bg-amber-100 text-amber-900 border border-amber-200'
                          : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                      title={it.is_mandatory ? 'Mandatory expense (protected during budget cuts)' : 'Optional expense'}
                    >
                      {it.is_mandatory ? <Lock className="w-3 h-3 text-amber-700" /> : <Unlock className="w-3 h-3 text-slate-400" />}
                      <span>{it.is_mandatory ? 'Locked' : 'Optional'}</span>
                    </button>
                  </td>

                  {/* Category */}
                  <td className="py-3 px-4 whitespace-nowrap">
                    <span
                      className="px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider text-white"
                      style={{ backgroundColor: CATEGORY_COLORS[it.category] || '#64748b' }}
                    >
                      {it.category.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Item Name & Assumptions */}
                  <td className="py-3 px-4 max-w-md">
                    <div className="font-semibold text-slate-900">{it.name}</div>
                    {it.assumption && (
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center space-x-1">
                        <Info className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>{it.assumption}</span>
                      </div>
                    )}
                  </td>

                  {/* Editable Cost */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center space-x-1">
                      <span className="text-slate-400">{currency}</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={it.estimated_cost}
                        onChange={(e) => handleCostChange(it.id, e.target.value)}
                        onBlur={handleBlurCost}
                        className="w-24 px-2 py-1 text-right text-xs font-semibold rounded-lg border border-slate-200 focus:border-amber-500 focus:ring-1 focus:ring-amber-200 bg-white"
                      />
                    </div>
                  </td>

                  {/* Actions */}
                  <td className="py-3 px-4 text-center whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => handleDeleteItem(it.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Remove expense"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Custom Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">Add Expense Item</h3>
            <p className="text-xs text-slate-500 mb-4">Add a custom expense line with transparent assumptions.</p>
            <form onSubmit={handleAddItem} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="venue">Venue</option>
                  <option value="food_beverage">Food & Beverages</option>
                  <option value="decorations">Decorations</option>
                  <option value="cake_dessert">Cake & Desserts</option>
                  <option value="entertainment">Entertainment</option>
                  <option value="photography">Photography</option>
                  <option value="invitations_favors">Invitations & Favors</option>
                  <option value="transportation">Transportation</option>
                  <option value="contingency">Contingency</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Live Acoustic Musician or Floral Arch"
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Estimated Cost ({currency})</label>
                <input
                  type="number"
                  min="0"
                  step="10"
                  required
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assumption or Note</label>
                <input
                  type="text"
                  placeholder="e.g., Quote from local vendor for 2 hours performance"
                  value={newItemAssumption}
                  onChange={(e) => setNewItemAssumption(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex items-center space-x-2 pt-1">
                <input
                  id="new-item-mandatory"
                  type="checkbox"
                  checked={newItemMandatory}
                  onChange={(e) => setNewItemMandatory(e.target.checked)}
                  className="w-4 h-4 text-amber-600 rounded border-slate-300"
                />
                <label htmlFor="new-item-mandatory" className="text-xs text-slate-700 font-semibold">
                  Mark as mandatory priority (won't be stripped on budget cut)
                </label>
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Reallocation Modal */}
      {showReallocateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 animate-fade-in">
            <h3 className="text-base font-bold text-slate-900 mb-1">Reallocate to Target Budget</h3>
            <p className="text-xs text-slate-500 mb-4">
              Enter a new total budget. Optional expenses will be scaled proportionally while protecting all locked mandatory expenses!
            </p>
            <form onSubmit={handleReallocate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  New Total Budget ({currency})
                </label>
                <input
                  type="number"
                  min="0"
                  step="50"
                  required
                  value={targetBudgetInput}
                  onChange={(e) => setTargetBudgetInput(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-bold rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
                <p className="font-semibold">Guaranteed Safety:</p>
                <p className="mt-0.5">
                  Items marked as <span className="font-bold">Locked</span> will retain their exact allocations. Only optional categories will be scaled.
                </p>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowReallocateModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-amber-600 hover:bg-amber-700"
                >
                  Apply Reallocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
