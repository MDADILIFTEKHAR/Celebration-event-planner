import React, { useState } from 'react';
import { Sparkles, Calendar, Clock, MapPin, Users, DollarSign, Heart, AlertCircle, Check, Compass } from 'lucide-react';
import { EventRequirements, DemoPreset } from '../types/event';

interface EventWizardProps {
  onPlanCreated: (reqs: EventRequirements) => Promise<void>;
  presets: DemoPreset[];
  onSelectPreset: (preset: DemoPreset) => void;
  isLoading: boolean;
}

export const EventWizard: React.FC<EventWizardProps> = ({
  onPlanCreated,
  presets,
  onSelectPreset,
  isLoading,
}) => {
  const [formData, setFormData] = useState<EventRequirements>({
    title: '',
    celebration_type: 'birthday',
    event_date: '2026-11-21',
    start_time: '18:00',
    duration_hours: 4.0,
    location: '',
    guest_count: 30,
    budget: 1500.0,
    currency: 'USD',
    venue_preference: 'indoor',
    theme_colors: ['Warm Terracotta', 'Champagne Gold'],
    atmosphere: 'Festive and joyful',
    dietary_requirements: [],
    accessibility_requirements: [],
    children_attending: false,
    diy_preference: 'balanced',
    special_notes: '',
  });

  const [validationError, setValidationError] = useState<string | null>(null);

  const celebrationTypes = [
    { value: 'birthday', label: '🎂 Birthday Party' },
    { value: 'anniversary', label: '🥂 Anniversary' },
    { value: 'wedding', label: '💍 Wedding Celebration' },
    { value: 'graduation', label: '🎓 Graduation Party' },
    { value: 'baby_shower', label: '🍼 Baby Shower' },
    { value: 'family_gathering', label: '🏡 Family Gathering' },
    { value: 'retirement', label: '🌟 Retirement Milestone' },
    { value: 'dinner_party', label: '🍷 Dinner Party' },
    { value: 'holiday_party', label: '🎄 Holiday Party' },
    { value: 'custom', label: '✨ Custom Special Occasion' },
  ];

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Gluten-Free', 'Halal', 'Kosher', 'Nut-Free'];
  const accessibilityOptions = ['Wheelchair Accessible', 'Step-Free Entry', 'Elevator Access', 'Quiet Zone'];

  const handleDietaryToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.dietary_requirements.includes(item);
      return {
        ...prev,
        dietary_requirements: exists
          ? prev.dietary_requirements.filter((d) => d !== item)
          : [...prev.dietary_requirements, item],
      };
    });
  };

  const handleAccessibilityToggle = (item: string) => {
    setFormData((prev) => {
      const exists = prev.accessibility_requirements.includes(item);
      return {
        ...prev,
        accessibility_requirements: exists
          ? prev.accessibility_requirements.filter((a) => a !== item)
          : [...prev.accessibility_requirements, item],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!formData.title.trim()) {
      setValidationError('Please give your celebration a name or headline.');
      return;
    }

    if (!formData.event_date) {
      setValidationError('Please specify a celebration date.');
      return;
    }

    if (formData.budget < 0) {
      setValidationError('Budget amount cannot be negative.');
      return;
    }

    if (formData.guest_count < 0) {
      setValidationError('Guest count cannot be negative.');
      return;
    }

    await onPlanCreated(formData);
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Header Banner */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span>Interactive Context-Aware Event Orchestrator</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Let’s Plan Your Celebration
        </h1>
        <p className="mt-2 text-base text-slate-600 max-w-2xl mx-auto">
          From budget optimization to chronological schedules and tailored recommendations, our engine crafts an actionable, personalized plan for your special day.
        </p>
      </div>

      {/* Demo Presets Bar */}
      {presets.length > 0 && (
        <div className="mb-8 p-5 rounded-2xl bg-gradient-to-r from-amber-50 via-rose-50 to-orange-50 border border-amber-200/80 shadow-xs">
          <div className="flex items-center space-x-2 mb-3">
            <Compass className="w-4 h-4 text-amber-700" />
            <h2 className="text-sm font-bold text-amber-900 uppercase tracking-wider">
              Quick Start with Curated Demo Presets
            </h2>
          </div>
          <p className="text-xs text-amber-800/80 mb-3">
            Explore ready-to-test scenarios instantly without configuring an API key.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {presets.map((preset) => (
              <button
                key={preset.id}
                id={`preset-${preset.id}`}
                type="button"
                onClick={() => onSelectPreset(preset)}
                className="text-left p-3.5 rounded-xl bg-white/90 hover:bg-white border border-amber-200 hover:border-amber-400 hover:shadow-sm transition-all group"
              >
                <div className="text-xs font-bold text-slate-900 group-hover:text-amber-700 flex items-center justify-between">
                  <span>{preset.name}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-100 text-amber-800">
                    {preset.requirements.currency} {preset.requirements.budget}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main Creation Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
        {validationError && (
          <div
            role="alert"
            className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start space-x-3 text-sm"
          >
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Check required input:</p>
              <p className="mt-0.5">{validationError}</p>
            </div>
          </div>
        )}

        <div className="space-y-6">
          {/* Section 1: Basics */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-1 border-b border-slate-100">
              1. Event Basics & Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="input-title" className="block text-xs font-semibold text-slate-700 mb-1">
                  Celebration Name / Headline *
                </label>
                <input
                  id="input-title"
                  type="text"
                  required
                  placeholder="e.g., Sarah's 30th Birthday Bash or Elena's Golden Anniversary"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                />
              </div>

              <div>
                <label htmlFor="select-celebration-type" className="block text-xs font-semibold text-slate-700 mb-1">
                  Celebration Type *
                </label>
                <select
                  id="select-celebration-type"
                  value={formData.celebration_type}
                  onChange={(e) => setFormData({ ...formData, celebration_type: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                >
                  {celebrationTypes.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="input-location" className="block text-xs font-semibold text-slate-700 mb-1">
                  City or General Venue Location
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-location"
                    type="text"
                    placeholder="e.g., Chicago, IL or Downtown Loft"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="input-date" className="block text-xs font-semibold text-slate-700 mb-1">
                  Date of Event *
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-date"
                    type="date"
                    required
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label htmlFor="input-start-time" className="block text-xs font-semibold text-slate-700 mb-1">
                    Start Time
                  </label>
                  <div className="relative">
                    <Clock className="w-4 h-4 text-slate-400 absolute left-2.5 top-3" />
                    <input
                      id="input-start-time"
                      type="time"
                      value={formData.start_time}
                      onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                      className="w-full pl-8 pr-2 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="input-duration" className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Hours)
                  </label>
                  <input
                    id="input-duration"
                    type="number"
                    step="0.5"
                    min="1"
                    max="18"
                    value={formData.duration_hours}
                    onChange={(e) => setFormData({ ...formData, duration_hours: parseFloat(e.target.value) || 4 })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Scale & Budget */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-1 border-b border-slate-100">
              2. Budget & Attendance
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label htmlFor="input-guest-count" className="block text-xs font-semibold text-slate-700 mb-1">
                  Expected Guests
                </label>
                <div className="relative">
                  <Users className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-guest-count"
                    type="number"
                    min="1"
                    max="5000"
                    value={formData.guest_count}
                    onChange={(e) => setFormData({ ...formData, guest_count: parseInt(e.target.value) || 1 })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="input-budget" className="block text-xs font-semibold text-slate-700 mb-1">
                  Total Budget Amount
                </label>
                <div className="relative">
                  <DollarSign className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    id="input-budget"
                    type="number"
                    min="0"
                    step="50"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: parseFloat(e.target.value) || 0 })}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="select-currency" className="block text-xs font-semibold text-slate-700 mb-1">
                  Currency
                </label>
                <select
                  id="select-currency"
                  value={formData.currency}
                  onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="CAD">CAD ($)</option>
                  <option value="AUD">AUD ($)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
            </div>

            {formData.budget > 0 && formData.guest_count > 0 && (
              <p className="mt-2 text-xs text-slate-500">
                Estimated allowance: <span className="font-semibold text-slate-800">{formData.currency} {(formData.budget / formData.guest_count).toFixed(2)}</span> per guest.
              </p>
            )}
          </div>

          {/* Section 3: Preferences & Atmosphere */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-1 border-b border-slate-100">
              3. Venue & Atmosphere Preferences
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Venue Setting</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['indoor', 'outdoor', 'virtual'] as const).map((setting) => (
                    <button
                      key={setting}
                      type="button"
                      id={`venue-pref-${setting}`}
                      onClick={() => setFormData({ ...formData, venue_preference: setting })}
                      className={`py-2 px-3 rounded-xl border text-xs font-semibold capitalize transition-all ${
                        formData.venue_preference === setting
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {setting}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">Planning Style</label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { val: 'diy_heavy', label: 'DIY Heavy' },
                    { val: 'balanced', label: 'Balanced' },
                    { val: 'professional', label: 'Turnkey Pro' },
                  ].map((style) => (
                    <button
                      key={style.val}
                      type="button"
                      id={`diy-pref-${style.val}`}
                      onClick={() => setFormData({ ...formData, diy_preference: style.val })}
                      className={`py-2 px-2 rounded-xl border text-xs font-semibold transition-all ${
                        formData.diy_preference === style.val
                          ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {style.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="input-atmosphere" className="block text-xs font-semibold text-slate-700 mb-1">
                  Desired Atmosphere & Mood
                </label>
                <input
                  id="input-atmosphere"
                  type="text"
                  placeholder="e.g., Energetic & vibrant, Cozy candlelit dinner, or Relaxed family picnic"
                  value={formData.atmosphere}
                  onChange={(e) => setFormData({ ...formData, atmosphere: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-200 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Dietary & Accessibility Safeguards */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4 pb-1 border-b border-slate-100">
              4. Dietary & Accessibility Safeguards
            </h3>

            {/* Dietary */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Dietary Requirements to Accommodate
              </label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((opt) => {
                  const isSelected = formData.dietary_requirements.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleDietaryToggle(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                        isSelected
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accessibility */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Accessibility Requirements
              </label>
              <div className="flex flex-wrap gap-2">
                {accessibilityOptions.map((opt) => {
                  const isSelected = formData.accessibility_requirements.includes(opt);
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => handleAccessibilityToggle(opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border flex items-center space-x-1.5 transition-all ${
                        isSelected
                          ? 'bg-indigo-50 text-indigo-800 border-indigo-300 font-semibold'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600" />}
                      <span>{opt}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Children toggle */}
            <div className="flex items-center space-x-3 pt-2">
              <input
                id="checkbox-children"
                type="checkbox"
                checked={formData.children_attending}
                onChange={(e) => setFormData({ ...formData, children_attending: e.target.checked })}
                className="w-4 h-4 text-amber-600 rounded border-slate-300 focus:ring-amber-500"
              />
              <label htmlFor="checkbox-children" className="text-xs font-semibold text-slate-800">
                Children will be attending (include kid-friendly activities & safety checks)
              </label>
            </div>
          </div>
        </div>

        {/* Submit Action */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-end space-x-3">
          <button
            id="btn-generate-plan"
            type="submit"
            disabled={isLoading}
            className="w-full sm:w-auto px-6 py-3 rounded-xl font-bold text-sm text-white bg-linear-to-r from-amber-600 via-rose-600 to-amber-700 hover:from-amber-700 hover:to-rose-700 shadow-md hover:shadow-lg disabled:opacity-50 transition-all flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>{isLoading ? 'Generating Contextual Plan...' : 'Generate Full Event Plan'}</span>
          </button>
        </div>
      </form>
    </div>
  );
};
