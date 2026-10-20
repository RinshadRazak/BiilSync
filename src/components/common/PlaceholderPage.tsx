import React from "react";
import Link from "next/link";
import { type LucideIcon, ArrowLeft, Layers, ShieldAlert } from "lucide-react";

interface PlaceholderPageProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  phase?: string;
  plannedFeatures: string[];
}

export function PlaceholderPage({
  title,
  subtitle,
  icon: Icon,
  phase = "Phase 2 / Phase 3",
  plannedFeatures,
}: PlaceholderPageProps) {
  return (
    <div className="space-y-6 max-w-4xl">
      {/* Back button */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      {/* Main Placeholder Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-start gap-5">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center shrink-0">
            <Icon className="w-7 h-7" />
          </div>

          <div className="space-y-2 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {title}
              </h2>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/80">
                {phase}
              </span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          </div>
        </div>

        {/* Planned Features List */}
        <div className="mt-8 pt-6 border-t border-slate-100">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-4 h-4 text-slate-500" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Planned Scope & Capabilities
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {plannedFeatures.map((feat) => (
              <div
                key={feat}
                className="flex items-start gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200/60 text-xs text-slate-700"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 shrink-0" />
                <span>{feat}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prototype Notice Banner */}
        <div className="mt-8 p-4 rounded-lg bg-amber-50/70 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Phase 1B Prototype Notice:</span> This route is part of the initial application shell and navigation structure. Forms, database transactions, and backend business logic will be integrated in subsequent phases.
          </div>
        </div>
      </div>
    </div>
  );
}
