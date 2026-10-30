import React from 'react';
import {
  Sparkles, Palette, Utensils, Scissors, Music, ShieldAlert,
  Lightbulb, AlertCircle, CheckCircle2, DollarSign
} from 'lucide-react';
import { Recommendation, EventRequirements } from '../types/event';

interface RecommendationsViewProps {
  requirements: EventRequirements;
  recommendations: Recommendation[];
  identifiedConstraints: string[];
  feasibilityFlags: string[];
  alternatives: string[];
}

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  theme: { label: 'Theme & Aesthetic', icon: Palette, color: 'text-amber-700 bg-amber-50 border-amber-200' },
  food_drink: { label: 'Food & Beverage Approach', icon: Utensils, color: 'text-orange-700 bg-orange-50 border-orange-200' },
  decorations: { label: 'Decor Concepts', icon: Scissors, color: 'text-rose-700 bg-rose-50 border-rose-200' },
  activities: { label: 'Activities & Entertainment', icon: Music, color: 'text-purple-700 bg-purple-50 border-purple-200' },
  safety: { label: 'Safety & Accessibility', icon: ShieldAlert, color: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
};

export const RecommendationsView: React.FC<RecommendationsViewProps> = ({
  requirements,
  recommendations,
  identifiedConstraints,
  feasibilityFlags,
  alternatives,
}) => {
  return (
    <div className="space-y-6">
      {/* Top Banner: Overview and Identified Safeguards */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center space-x-2 mb-2">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <h2 className="text-base font-bold text-slate-900">Tailored Celebration Architecture</h2>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">
          Based on your celebration type (<span className="font-semibold text-slate-900">{requirements.celebration_type}</span>),{' '}
          budget tier (<span className="font-semibold text-slate-900">{requirements.currency} {(requirements.budget / Math.max(requirements.guest_count, 1)).toFixed(1)}/person</span>),{' '}
          and venue setting (<span className="font-semibold text-slate-900">{requirements.venue_preference}</span>).
        </p>

        {/* Color Palette Display */}
        {requirements.theme_colors && requirements.theme_colors.length > 0 && (
          <div className="mt-3 pt-3 border-t border-slate-100 flex items-center space-x-2">
            <span className="text-xs font-semibold text-slate-500">Curated Colors:</span>
            <div className="flex flex-wrap gap-1.5">
              {requirements.theme_colors.map((c, i) => (
                <span
                  key={i}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-900 border border-amber-200/80 shadow-2xs"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Feasibility Warnings & Smart Alternatives */}
      {(feasibilityFlags.length > 0 || alternatives.length > 0) && (
        <div className="p-5 rounded-2xl bg-amber-50/70 border border-amber-300 text-amber-950 space-y-3 shadow-xs">
          <div className="flex items-center space-x-2 font-bold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>Feasibility Insights & Strategic Alternatives:</span>
          </div>
          {feasibilityFlags.map((flag, i) => (
            <p key={i} className="text-xs text-amber-900 pl-6">
              • {flag}
            </p>
          ))}
          {alternatives.length > 0 && (
            <div className="pt-2 border-t border-amber-200/60 pl-6 space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-900">
                Recommended Adaptations:
              </span>
              <ul className="list-disc pl-4 text-xs space-y-0.5 text-amber-900">
                {alternatives.map((alt, i) => (
                  <li key={i}>{alt}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Mandatory Identified Constraints */}
      {identifiedConstraints.length > 0 && (
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center space-x-2 font-bold text-xs text-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Mandatory Event Constraints Enforced:</span>
          </div>
          <div className="flex flex-wrap gap-1.5 pl-6">
            {identifiedConstraints.map((c, i) => (
              <span
                key={i}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-medium"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {recommendations.map((rec) => {
          const meta = CATEGORY_META[rec.category] || CATEGORY_META.theme;
          const Icon = meta.icon;

          return (
            <div
              key={rec.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-amber-300 transition-all space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold border ${meta.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                  <span>{meta.label}</span>
                </span>
                <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                  <span className="font-mono font-bold text-slate-700">{rec.estimated_cost_tier}</span>
                  {rec.is_diy_friendly && (
                    <span className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                      DIY Friendly
                    </span>
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-slate-900">{rec.title}</h4>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">{rec.description}</p>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-600">
                <span className="font-semibold text-slate-800">Why this fits your plan: </span>
                <span>{rec.reason}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
