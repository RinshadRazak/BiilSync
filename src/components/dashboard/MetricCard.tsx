import React from "react";
import type { LucideIcon } from "lucide-react";

export interface MetricCardProps {
  title: string;
  value: string;
  subtext: string;
  icon: LucideIcon;
  badge?: {
    text: string;
    variant: "positive" | "warning" | "neutral" | "info";
  };
  accentColor?: "blue" | "emerald" | "amber" | "indigo";
}

export function MetricCard({
  title,
  value,
  subtext,
  icon: Icon,
  badge,
  accentColor = "blue",
}: MetricCardProps) {
  const iconColorStyles = {
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  }[accentColor];

  const badgeStyles = {
    positive: "bg-emerald-50 text-emerald-700 border-emerald-200/60",
    warning: "bg-amber-50 text-amber-700 border-amber-200/60",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    info: "bg-blue-50 text-blue-700 border-blue-200/60",
  }[badge?.variant || "neutral"];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            {title}
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              {value}
            </span>
            <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              (Sample)
            </span>
          </div>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${iconColorStyles}`}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span className="truncate pr-2">{subtext}</span>
        {badge && (
          <span
            className={`shrink-0 inline-flex items-center text-[11px] font-medium px-2 py-0.5 rounded-full border ${badgeStyles}`}
          >
            {badge.text}
          </span>
        )}
      </div>
    </div>
  );
}
