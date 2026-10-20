"use client";

import React, { useState } from "react";
import { Database, Sparkles, Trash2, Check } from "lucide-react";
import { loadSampleDemoData, clearAllData } from "@/lib/storage";

interface StorageNoticeBannerProps {
  onDataChanged?: () => void;
}

export function StorageNoticeBanner({ onDataChanged }: StorageNoticeBannerProps) {
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleLoadDemo = () => {
    loadSampleDemoData();
    setFeedback("Loaded 5 Demo Products, 3 Suppliers & 3 Shops.");
    setTimeout(() => setFeedback(null), 3500);
    if (onDataChanged) onDataChanged();
  };

  const handleClear = () => {
    if (window.confirm("Are you sure you want to clear all local records? This cannot be undone.")) {
      clearAllData();
      setFeedback("Cleared all local storage records.");
      setTimeout(() => setFeedback(null), 3500);
      if (onDataChanged) onDataChanged();
    }
  };

  return (
    <div className="bg-slate-100/90 border border-slate-200/90 rounded-xl p-3 sm:p-4 text-xs text-slate-700 shadow-2xs space-y-2.5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 mt-0.5">
            <Database className="w-4 h-4" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5 font-semibold text-slate-900">
              <span>Local Storage Persistence (Phase 2)</span>
              <span className="text-[10px] font-medium bg-amber-100 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded">
                Temporary Browser Store
              </span>
            </div>
            <p className="text-slate-500 text-[11px] mt-0.5 max-w-3xl leading-relaxed">
              Records are stored locally in this browser session. Data persists across reloads and tab navigations. Multi-user cloud synchronization and Firebase Firestore will be introduced in subsequent phases.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto shrink-0">
          <button
            type="button"
            onClick={handleLoadDemo}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>Load Demo Data</span>
          </button>

          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-white text-xs font-medium transition-colors"
            title="Reset and clear all records"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Clear Data</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md animate-in fade-in duration-150">
          <Check className="w-3.5 h-3.5" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
