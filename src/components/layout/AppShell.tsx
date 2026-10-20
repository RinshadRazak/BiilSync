"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { X, LayoutDashboard, PlusCircle, ClipboardList, Store, MoreHorizontal } from "lucide-react";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:w-64 lg:block">
        <Sidebar />
      </div>

      {/* Mobile Drawer Backdrop & Slide-out */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
            onClick={closeMobileMenu}
            aria-hidden="true"
          />

          {/* Slide-out Menu */}
          <div className="relative w-4/5 max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
            <div className="absolute top-3.5 right-3.5">
              <button
                type="button"
                onClick={closeMobileMenu}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                aria-label="Close navigation menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <Sidebar onNavigate={closeMobileMenu} />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="lg:pl-64 flex flex-col flex-1 pb-16 lg:pb-0">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />

        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 py-1.5 px-3 flex items-center justify-around shadow-lg"
      >
        <Link
          href="/"
          onClick={closeMobileMenu}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            pathname === "/" ? "text-blue-600 font-semibold" : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          <span>Home</span>
        </Link>

        <Link
          href="/orders"
          onClick={closeMobileMenu}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            pathname.startsWith("/orders") && pathname !== "/orders/new"
              ? "text-blue-600 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <ClipboardList className="w-5 h-5 mb-0.5" />
          <span>Orders</span>
        </Link>

        {/* Center Prominent New Order Button */}
        <Link
          href="/orders/new"
          onClick={closeMobileMenu}
          className="flex flex-col items-center justify-center -mt-4 bg-blue-600 text-white rounded-full p-2.5 shadow-md hover:bg-blue-700 transition-colors"
          aria-label="Create New Order"
        >
          <PlusCircle className="w-6 h-6" />
        </Link>

        <Link
          href="/shops"
          onClick={closeMobileMenu}
          className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium transition-colors ${
            pathname.startsWith("/shops")
              ? "text-blue-600 font-semibold"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          <Store className="w-5 h-5 mb-0.5" />
          <span>Shops</span>
        </Link>

        <button
          type="button"
          onClick={() => setMobileMenuOpen(true)}
          className="flex flex-col items-center justify-center py-1 px-2 rounded-lg text-[10px] font-medium text-slate-600 hover:text-slate-900"
        >
          <MoreHorizontal className="w-5 h-5 mb-0.5" />
          <span>More</span>
        </button>
      </nav>
    </div>
  );
}
