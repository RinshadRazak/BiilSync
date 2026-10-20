"use client";

import React, { useState } from "react";
import { useAuth, switchDemoRole } from "@/lib/firebase/auth";
import { useBusinessSettings, saveBusinessSettings } from "@/lib/firebase/settingsRepo";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  getLocalMigrationSummary,
  downloadLocalStorageBackup,
  migrateLocalStorageToFirestore,
  MigrationSummary,
  MigrationResult,
} from "@/lib/firebase/migration";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import {
  Building2,
  Cloud,
  Database,
  Download,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Shield,
  Phone,
  Mail,
  Save,
  Loader2,
  Server,
  RefreshCw,
} from "lucide-react";

export default function SettingsPage() {
  const { user, isAdmin, role } = useAuth();
  const currentSettings = useBusinessSettings();
  const cloudActive = isFirebaseConfigured();

  // Form state initialized from current settings
  const [formData, setFormData] = useState({
    businessName: currentSettings.businessName,
    businessAddress: currentSettings.businessAddress,
    phone: currentSettings.phone,
    email: currentSettings.email || "",
    gstin: currentSettings.gstin || "",
    invoiceFooterText: currentSettings.invoiceFooterText || "",
  });

  const [saveStatus, setSaveStatus] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Migration state initialized lazily
  const [summary, setSummary] = useState<MigrationSummary>(() => getLocalMigrationSummary());
  const [isConfirmMigrationOpen, setIsConfirmMigrationOpen] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState<string | null>(null);
  const [migrationResult, setMigrationResult] = useState<MigrationResult | null>(null);
  const [backupMessage, setBackupMessage] = useState<string | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const res = await saveBusinessSettings(formData);
      if (res.success) {
        setSaveStatus("Business settings and invoice profile saved successfully!");
        setTimeout(() => setSaveStatus(null), 3500);
      } else {
        setSaveStatus(`Failed to save: ${res.error}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadBackup = () => {
    const res = downloadLocalStorageBackup();
    if (res.success) {
      setBackupMessage(`Backup successfully downloaded: ${res.filename}`);
      setTimeout(() => setBackupMessage(null), 4000);
    } else {
      setBackupMessage(`Backup failed: ${res.error}`);
    }
  };

  const handleExecuteMigration = async () => {
    setIsConfirmMigrationOpen(false);
    setIsMigrating(true);
    setMigrationProgress("Preparing records for Firestore sync...");
    try {
      const result = await migrateLocalStorageToFirestore((status) => {
        setMigrationProgress(status);
      });
      setMigrationResult(result);
      setSummary(getLocalMigrationSummary());
    } finally {
      setIsMigrating(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16">
      {/* Page Title & Status */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            System & Business Settings
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage commercial invoicing profiles, Firebase cloud integration, user permissions, and LocalStorage data migration.
          </p>
        </div>

        {/* Cloud Connection Badge */}
        <div
          className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold self-start sm:self-auto border ${
            cloudActive
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-amber-50 text-amber-800 border-amber-200"
          }`}
        >
          <Cloud className="w-3.5 h-3.5" />
          <span>{cloudActive ? "Firebase Cloud Connected" : "Local Storage Mode"}</span>
        </div>
      </div>

      {/* Role-Based Notice if non-admin */}
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs text-amber-800">
          <Lock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong className="font-bold">Sales Staff Access (Read-Only Settings):</strong>{" "}
            You are signed in as Sales Staff. Modifying business invoice information, changing pricing parameters, and executing database migrations are strictly restricted to Administrators.
          </div>
        </div>
      )}

      {/* Grid: Business Settings Form & Cloud Migration Center */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left 2 Cols: Business Profile & Invoicing Details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Business & Commercial Invoicing Profile
                </h2>
              </div>
              <span className="text-[11px] text-slate-400">
                Printed on all wholesale invoices
              </span>
            </div>

            <form onSubmit={handleSaveSettings} className="p-5 space-y-4">
              {saveStatus && (
                <div
                  className={`p-3 rounded-lg text-xs font-medium border ${
                    saveStatus.startsWith("Failed")
                      ? "bg-rose-50 text-rose-800 border-rose-200"
                      : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  {saveStatus}
                </div>
              )}

              {/* Business Name */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Business Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!isAdmin || isSaving}
                  value={formData.businessName}
                  onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                  placeholder="e.g. Bill Sync Wholesale Distribution"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Address */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Full Business Address <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  disabled={!isAdmin || isSaving}
                  value={formData.businessAddress}
                  onChange={(e) => setFormData({ ...formData, businessAddress: e.target.value })}
                  placeholder="Plot/Shop No., Wholesale Market, City, State - PIN"
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Phone & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Contact Phone <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      required
                      disabled={!isAdmin || isSaving}
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Email Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="email"
                      disabled={!isAdmin || isSaving}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="billing@wholesale.example.com"
                      className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>
                </div>
              </div>

              {/* GSTIN */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  GSTIN / Tax Registration <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  maxLength={15}
                  disabled={!isAdmin || isSaving}
                  value={formData.gstin}
                  onChange={(e) => setFormData({ ...formData, gstin: e.target.value.toUpperCase() })}
                  placeholder="e.g. 07AAAAA0000A1Z5"
                  className="w-full px-3.5 py-2 font-mono bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500 uppercase"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Leave blank if your wholesale firm is unregistered or operates under composite tax exemption.
                </p>
              </div>

              {/* Invoice Footer Terms */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Invoice Footer Terms / Declarations
                </label>
                <textarea
                  rows={2}
                  disabled={!isAdmin || isSaving}
                  value={formData.invoiceFooterText}
                  onChange={(e) => setFormData({ ...formData, invoiceFooterText: e.target.value })}
                  placeholder="Terms of payment, delivery condition notes, warranty notices..."
                  className="w-full px-3.5 py-2 bg-white border border-slate-300 rounded-lg text-xs sm:text-sm text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                />
              </div>

              {/* Submit Button */}
              {isAdmin && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
                  >
                    {isSaving ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                    <span>Save Business Settings</span>
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* User Role & Staff Access Info */}
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Shield className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Staff Role Architecture & Session
              </h3>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/70">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Active Operator
                </span>
                <span className="font-bold text-sm text-slate-900">
                  {user.displayName} ({user.email})
                </span>
                <span className="text-xs text-slate-500 block">
                  Current Session Privilege:{" "}
                  <strong className={isAdmin ? "text-blue-700 uppercase" : "text-emerald-700 uppercase"}>
                    {role.replace("_", " ")}
                  </strong>
                </span>
              </div>

              {/* Quick Switch for local development/testing */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => switchDemoRole("admin")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                    role === "admin"
                      ? "bg-blue-600 text-white border-blue-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  Admin Mode
                </button>
                <button
                  type="button"
                  onClick={() => switchDemoRole("sales_staff")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors border ${
                    role === "sales_staff"
                      ? "bg-emerald-600 text-white border-emerald-600"
                      : "bg-white text-slate-700 border-slate-300 hover:bg-slate-100"
                  }`}
                >
                  Sales Staff Mode
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Role permissions are enforced via server-side <strong>firestore.rules</strong> and <strong>storage.rules</strong>. Sales staff are strictly prohibited by Firestore rules from modifying product master prices, supplier purchasing costs, and business settings.
            </p>
          </div>
        </div>

        {/* Right Col: Local Data & Cloud Migration Center */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Data Migration Center
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSummary(getLocalMigrationSummary())}
                className="text-slate-400 hover:text-slate-600"
                title="Refresh counts"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Summary Cards */}
            <div className="space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                Local Storage Inventory
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block">Products</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {summary.productsCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block">Suppliers</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {summary.suppliersCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block">Retail Shops</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {summary.shopsCount}
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70">
                  <span className="text-slate-500 block">Orders</span>
                  <span className="text-sm font-extrabold text-slate-900">
                    {summary.ordersCount}
                  </span>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/70 text-xs flex justify-between items-center">
                <span className="text-slate-500">Official Invoices:</span>
                <span className="text-sm font-extrabold text-slate-900">
                  {summary.invoicesCount}
                </span>
              </div>
            </div>

            {backupMessage && (
              <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-medium">
                {backupMessage}
              </div>
            )}

            {/* Step 1: Backup Before Migration */}
            <div className="pt-2 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 block">
                Step 1: Save Local Backup
              </span>
              <button
                type="button"
                onClick={handleDownloadBackup}
                className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Download Full JSON Backup</span>
              </button>
              <p className="text-[11px] text-slate-400 leading-tight">
                Download a recoverable JSON file of your entire database prior to cloud sync.
              </p>
            </div>

            {/* Step 2: Migrate to Cloud Firestore */}
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 block">
                Step 2: Sync to Cloud Firestore
              </span>

              {isMigrating ? (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg space-y-1.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-800">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                    <span>Migrating Records...</span>
                  </div>
                  <p className="text-[11px] text-blue-700">{migrationProgress}</p>
                </div>
              ) : (
                <button
                  type="button"
                  disabled={!isAdmin || summary.totalRecords === 0}
                  onClick={() => setIsConfirmMigrationOpen(true)}
                  className="w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                >
                  <UploadCloud className="w-4 h-4" />
                  <span>Migrate to Cloud Firestore</span>
                </button>
              )}

              {migrationResult && (
                <div
                  className={`p-3 rounded-lg text-xs space-y-1 border ${
                    migrationResult.success
                      ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                      : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  <div className="font-bold flex items-center gap-1.5">
                    {migrationResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                    )}
                    <span>{migrationResult.message}</span>
                  </div>
                  <div className="text-[11px] opacity-90 pl-5">
                    Synced: {migrationResult.totalMigrated} | Skipped: {migrationResult.skippedCount}
                  </div>
                  {migrationResult.errors.length > 0 && (
                    <ul className="text-[11px] text-rose-700 list-disc pl-5 pt-1 space-y-0.5">
                      {migrationResult.errors.map((e, idx) => (
                        <li key={idx}>{e}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              <p className="text-[11px] text-slate-400 leading-tight">
                Uses stable document IDs to prevent duplicate creation on retries. Does not automatically delete local data.
              </p>
            </div>
          </div>

          {/* Cloud Setup Manual Reference */}
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 space-y-2 text-xs text-slate-600">
            <div className="flex items-center gap-1.5 font-bold text-slate-800 text-xs">
              <Server className="w-3.5 h-3.5 text-blue-600" />
              <span>Firebase Deployment Setup</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              To connect a live Firebase project, copy <strong>.env.example</strong> to <strong>.env.local</strong> with your Firebase Console API keys, then deploy <strong>firestore.rules</strong> and <strong>storage.rules</strong> using the Firebase CLI.
            </p>
          </div>
        </div>

      </div>

      {/* Migration Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmMigrationOpen}
        onClose={() => setIsConfirmMigrationOpen(false)}
        onConfirm={handleExecuteMigration}
        title="Confirm Firestore Cloud Migration"
        message={`Are you sure you want to migrate ${summary.totalRecords} local record(s) (${summary.productsCount} products, ${summary.suppliersCount} suppliers, ${summary.shopsCount} shops, ${summary.ordersCount} orders, ${summary.invoicesCount} invoices) to Cloud Firestore? Existing matching documents will not be duplicated.`}
        confirmLabel="Start Migration"
        variant="primary"
      />
    </div>
  );
}
