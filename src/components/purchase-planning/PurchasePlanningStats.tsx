"use client";

import React from "react";
import { Package, ShoppingBag, IndianRupee, CheckCircle2, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/formatters";

interface PurchasePlanningStatsProps {
  totalProductsWithDemand: number;
  totalSubmittedOrders: number;
  grandEstimatedTotal: number;
  totalAssignedProducts: number;
  totalUnassignedProducts: number;
}

export function PurchasePlanningStats({
  totalProductsWithDemand,
  totalSubmittedOrders,
  grandEstimatedTotal,
  totalAssignedProducts,
  totalUnassignedProducts,
}: PurchasePlanningStatsProps) {
  const isFullyAssigned = totalProductsWithDemand > 0 && totalUnassignedProducts === 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Demand SKUs */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Products with Demand
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalProductsWithDemand}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Aggregated from shop orders
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
          <Package className="w-5 h-5" />
        </div>
      </div>

      {/* 2. Submitted Orders */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Contributing Orders
          </span>
          <span className="text-2xl font-black text-slate-900 mt-1 block">
            {totalSubmittedOrders}
          </span>
          <span className="text-[11px] text-emerald-600 font-medium mt-0.5 block">
            Only Submitted status
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
          <ShoppingBag className="w-5 h-5" />
        </div>
      </div>

      {/* 3. Estimated Purchase Total */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Est. Procurement Total
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 mt-1 block tracking-tight">
            {formatCurrency(grandEstimatedTotal)}
          </span>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            {totalAssignedProducts} assigned lines priced
          </span>
        </div>
        <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <IndianRupee className="w-5 h-5" />
        </div>
      </div>

      {/* 4. Assignment Progress */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex items-center justify-between">
        <div>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider block">
            Supplier Allocation
          </span>
          <div className="flex items-baseline gap-1.5 mt-1">
            <span className="text-2xl font-black text-slate-900">
              {totalAssignedProducts}
            </span>
            <span className="text-xs text-slate-400">/ {totalProductsWithDemand} lines</span>
          </div>
          <span
            className={`text-[11px] font-medium mt-0.5 flex items-center gap-1 ${
              isFullyAssigned
                ? "text-emerald-600"
                : totalUnassignedProducts > 0
                ? "text-amber-600"
                : "text-slate-400"
            }`}
          >
            {isFullyAssigned ? (
              "All demand mapped & assigned"
            ) : totalUnassignedProducts > 0 ? (
              <>
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{totalUnassignedProducts} need vendor assignment</span>
              </>
            ) : (
              "No active demand"
            )}
          </span>
        </div>
        <div
          className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
            isFullyAssigned
              ? "bg-emerald-50 text-emerald-600"
              : "bg-amber-50 text-amber-600"
          }`}
        >
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
