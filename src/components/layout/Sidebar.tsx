"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { navigationItems } from "./navItems";
import { useOrders } from "@/lib/orderStorage";
import { useProducts, useSuppliers } from "@/lib/storage";
import { aggregateDemand } from "@/lib/purchasePlanning";
import { Boxes, ShieldCheck } from "lucide-react";

interface SidebarProps {
  onNavigate?: () => void;
}

export function Sidebar({ onNavigate }: SidebarProps) {
  const pathname = usePathname();
  const orders = useOrders();
  const products = useProducts();
  const suppliers = useSuppliers();

  const demandCount = useMemo(() => {
    const demands = aggregateDemand(orders, products, suppliers);
    return demands.length;
  }, [orders, products, suppliers]);

  const isItemActive = (href: string) => {
    if (href === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex flex-col h-full bg-white border-r border-slate-200 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-100 gap-3">
        <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
          <Boxes className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-slate-900 tracking-tight text-base">Bill Sync</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200/60">
              B2B
            </span>
          </div>
          <span className="text-xs text-slate-500 font-medium leading-none">
            Wholesale Distribution
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        <div className="px-3 pb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Main Menu
        </div>
        {navigationItems.map((item) => {
          const active = isItemActive(item.href);
          const Icon = item.icon;

          const dynamicBadge =
            item.href === "/orders"
              ? orders.length > 0
                ? orders.length.toString()
                : undefined
              : item.href === "/purchase-planning"
              ? demandCount > 0
                ? `${demandCount} SKUs`
                : undefined
              : item.badge;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              prefetch={true}
              className={`group flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-blue-50 text-blue-700 font-semibold"
                  : item.isSpecial
                  ? "text-blue-600 hover:bg-blue-50/60 hover:text-blue-700"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-colors ${
                    active
                      ? "text-blue-600"
                      : item.isSpecial
                      ? "text-blue-600"
                      : "text-slate-400 group-hover:text-slate-600"
                  }`}
                />
                <span className="truncate">{item.title}</span>
              </div>

              {dynamicBadge && (
                <span
                  className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                    active
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-600 group-hover:bg-slate-200"
                  }`}
                >
                  {dynamicBadge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer Info Box */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2.5 p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-xs">
          <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-slate-800 truncate">Central Distribution</p>
            <p className="text-[11px] text-slate-500 truncate">Phase 3 • Orders Live</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
