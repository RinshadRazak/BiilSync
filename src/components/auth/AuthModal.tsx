"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { useAuth } from "@/lib/firebase/auth";
import { UserRole } from "@/types";
import {
  ShieldCheck,
  User,
  Mail,
  Lock,
  AlertCircle,
  CheckCircle2,
  Cloud,
  HardDrive,
  Users,
} from "lucide-react";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const { user, role, isAdmin, isCloudAuth, signIn, signUp, signOut, switchLocalRole } =
    useAuth();

  const [mode, setMode] = useState<"switch" | "signin" | "signup">("switch");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("sales_staff");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signIn(email, password);
      if (res.success) {
        setSuccessMsg(`Welcome, ${res.user?.displayName || "User"}!`);
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
        }, 1200);
      } else {
        setError(res.error || "Sign in failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await signUp(email, password, displayName, selectedRole);
      if (res.success) {
        setSuccessMsg(`Account created for ${displayName || email} with role ${selectedRole}!`);
        setTimeout(() => {
          onClose();
          setSuccessMsg(null);
        }, 1200);
      } else {
        setError(res.error || "Registration failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickSwitch = (newRole: UserRole) => {
    switchLocalRole(newRole);
    setSuccessMsg(`Switched active role to ${newRole === "admin" ? "Warehouse Admin" : "Sales Representative"}.`);
    setTimeout(() => {
      onClose();
      setSuccessMsg(null);
    }, 900);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="User Authentication & Roles"
      subtitle="Manage role-based access control, sign in with Firebase, or switch testing roles."
      maxWidth="md"
    >
      <div className="space-y-4 pt-1">
        {/* Cloud Status Banner */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs">
          <div className="flex items-center gap-2">
            {isCloudAuth ? (
              <Cloud className="w-4 h-4 text-blue-600 shrink-0" />
            ) : (
              <HardDrive className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span className="text-slate-700 font-medium">
              {isCloudAuth
                ? "Connected to Firebase Cloud"
                : "Local Mode (Offline / Simulated Auth)"}
            </span>
          </div>
          <span
            className={`font-semibold px-2 py-0.5 rounded-full text-[10px] ${
              isAdmin
                ? "bg-purple-100 text-purple-800"
                : "bg-emerald-100 text-emerald-800"
            }`}
          >
            Current: {role === "admin" ? "Admin" : "Sales Staff"}
          </span>
        </div>

        {/* Success / Error Messages */}
        {successMsg && (
          <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex border-b border-slate-200 gap-2">
          <button
            type="button"
            onClick={() => setMode("switch")}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              mode === "switch"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Quick Role Switch
          </button>
          <button
            type="button"
            onClick={() => setMode("signin")}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              mode === "signin"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Email Sign In
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`pb-2 text-xs font-semibold border-b-2 transition-colors ${
              mode === "signup"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            Register Staff
          </button>
        </div>

        {/* Mode: Quick Role Switch */}
        {mode === "switch" && (
          <div className="space-y-3 pt-2">
            <p className="text-xs text-slate-500">
              Instantly simulate different permissions to verify role-based security rules
              and UI restrictions:
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleQuickSwitch("admin")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  isAdmin
                    ? "border-blue-500 bg-blue-50/70 ring-2 ring-blue-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>Admin</span>
                  </div>
                  {isAdmin && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Full control: Master pricing, supplier costs, image uploads, business settings, and invoices.
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch("sales_staff")}
                className={`p-3.5 rounded-xl border text-left transition-all ${
                  !isAdmin
                    ? "border-emerald-500 bg-emerald-50/70 ring-2 ring-emerald-500/20"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900">
                    <Users className="w-4 h-4 text-emerald-600" />
                    <span>Sales Staff</span>
                  </div>
                  {!isAdmin && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Operational view: Can create and submit orders. Cannot edit master product prices or company settings.
                </p>
              </button>
            </div>
          </div>
        )}

        {/* Mode: Email Sign In */}
        {mode === "signin" && (
          <form onSubmit={handleSignIn} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="admin@billsync.com or staff@billsync.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                {loading ? "Signing in..." : "Sign In"}
              </button>
            </div>
          </form>
        )}

        {/* Mode: Register New Staff */}
        {mode === "signup" && (
          <form onSubmit={handleSignUp} className="space-y-3 pt-2">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Full Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Kumar"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <User className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Email Address
              </label>
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder="staff@billsync.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type="password"
                  required
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <Lock className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1">
                Assigned Role
              </label>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value as UserRole)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              >
                <option value="sales_staff">Sales Representative (Restricted Access)</option>
                <option value="admin">Warehouse Admin (Full Authorization)</option>
              </select>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
              >
                {loading ? "Creating..." : "Create Account"}
              </button>
            </div>
          </form>
        )}

        {/* Current Active Account Section */}
        {user && (
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600">
            <div>
              <span className="text-slate-400">Signed in as: </span>
              <span className="font-semibold text-slate-800">{user.displayName || user.email}</span>
            </div>
            <button
              type="button"
              onClick={() => {
                signOut();
                onClose();
              }}
              className="text-rose-600 hover:text-rose-700 font-semibold"
            >
              Sign Out
            </button>
          </div>
        )}
      </div>
    </Modal>
  );
}
