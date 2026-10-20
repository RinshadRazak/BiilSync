"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  PlusCircle,
  ShieldCheck,
  Users,
} from "lucide-react";
import { navigationItems } from "./navItems";
import { useAuth } from "@/lib/firebase/auth";
import { AuthModal } from "@/components/auth/AuthModal";

interface HeaderProps {
  onOpenMobileMenu: () => void;
}

export function Header({ onOpenMobileMenu }: HeaderProps) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const currentItem =
    navigationItems.find((item) =>
      item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
    ) || { title: "Wholesale Distribution" };

  const initials = user?.displayName
    ? user.displayName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "WA";

  return (
    <>
      <header className="sticky top-0 z-20 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            aria-label="Open navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight truncate">
                {currentItem.title}
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Hub
              </span>
            </div>
            <p className="hidden md:block text-xs text-slate-500 truncate">
              Wholesale Operations & Inventory Distribution Management
            </p>
          </div>
        </div>

        {/* Middle: Search Field (Desktop) */}
        <div className="hidden xl:flex items-center flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              readOnly
              placeholder="Search orders, retail shops, SKUs (demo)..."
              className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-700 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-default"
            />
          </div>
        </div>

        {/* Right: Quick Actions & Profile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-medium shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">New Order</span>
          </Link>

          {/* Notifications */}
          <button
            type="button"
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            title="Notifications (2 unread)"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600 ring-2 ring-white" />
          </button>

          {/* Divider */}
          <div className="hidden sm:block h-6 w-[1px] bg-slate-200 mx-0.5" />

          {/* Interactive User Pill */}
          <button
            type="button"
            id="header-user-profile-btn"
            onClick={() => setIsAuthModalOpen(true)}
            className="flex items-center gap-2 pl-1 p-1 rounded-xl hover:bg-slate-100 transition-colors text-left group"
            title="Click to view account and switch roles"
          >
            <div
              className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${
                isAdmin
                  ? "bg-blue-100 border-blue-300 text-blue-800"
                  : "bg-emerald-100 border-emerald-300 text-emerald-800"
              }`}
            >
              {initials}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                {user?.displayName || "Warehouse Staff"}
              </span>
              <span className="text-[10px] text-slate-500 leading-tight flex items-center gap-1">
                {isAdmin ? (
                  <span className="text-blue-600 font-bold flex items-center gap-0.5">
                    <ShieldCheck className="w-3 h-3 inline" /> Admin
                  </span>
                ) : (
                  <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                    <Users className="w-3 h-3 inline" /> Sales Staff
                  </span>
                )}
                <span>• Main Facility</span>
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Auth & Role Switcher Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </>
  );
}
