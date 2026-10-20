"use client";

import React, { useState, useMemo } from "react";
import { useOrders } from "@/lib/orderStorage";
import { useProducts, useSuppliers, useShops } from "@/lib/storage";
import { usePurchasePlanStorage } from "@/lib/purchasePlanStorage";
import { aggregateDemand, calculatePurchasePlan } from "@/lib/purchasePlanning";
import { OrdersReportView } from "@/components/reports/OrdersReportView";
import { MasterPurchaseReportView } from "@/components/reports/MasterPurchaseReportView";
import { SupplierPurchaseReportView } from "@/components/reports/SupplierPurchaseReportView";
import {
  ClipboardList,
  Package,
  Truck,
  BarChart3,
  FileSpreadsheet,
  FileText,
} from "lucide-react";

type ReportTab = "orders" | "master-purchase" | "supplier-purchase";

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("orders");

  // Live Storage Hooks
  const orders = useOrders();
  const products = useProducts();
  const suppliers = useSuppliers();
  const shops = useShops();
  const planStorage = usePurchasePlanStorage();

  // Pure Derived Calculations (No Mutations)
  const demands = useMemo(() => {
    return aggregateDemand(orders, products, suppliers);
  }, [orders, products, suppliers]);

  const calculationResult = useMemo(() => {
    return calculatePurchasePlan(demands, planStorage, suppliers);
  }, [demands, planStorage, suppliers]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <BarChart3 className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Reports & Document Exports
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 font-medium">
                Phase 5 • Auditable Excel spreadsheets (.xlsx) and commercial PDF reports
              </p>
            </div>
          </div>
        </div>

        {/* Format Indicator Badges */}
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-semibold shadow-2xs">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Multi-Sheet Excel</span>
          </div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-semibold shadow-2xs">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Commercial PDF</span>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5">
          {/* 1. Orders Report Tab */}
          <button
            type="button"
            id="tab-orders-report"
            onClick={() => setActiveTab("orders")}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "orders"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <ClipboardList className="w-4 h-4 shrink-0" />
            <span className="truncate">Orders Report</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                activeTab === "orders"
                  ? "bg-blue-700/60 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {orders.length}
            </span>
          </button>

          {/* 2. Master Purchase List Tab */}
          <button
            type="button"
            id="tab-master-purchase"
            onClick={() => setActiveTab("master-purchase")}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "master-purchase"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Package className="w-4 h-4 shrink-0" />
            <span className="truncate">Master Purchase List</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                activeTab === "master-purchase"
                  ? "bg-blue-700/60 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {demands.length} SKUs
            </span>
          </button>

          {/* 3. Supplier-wise Purchase Report Tab */}
          <button
            type="button"
            id="tab-supplier-purchase"
            onClick={() => setActiveTab("supplier-purchase")}
            className={`flex items-center justify-center sm:justify-start gap-2.5 px-4 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
              activeTab === "supplier-purchase"
                ? "bg-blue-600 text-white shadow-xs"
                : "text-slate-600 hover:text-slate-900 hover:bg-slate-50"
            }`}
          >
            <Truck className="w-4 h-4 shrink-0" />
            <span className="truncate">Supplier-wise Purchase Report</span>
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                activeTab === "supplier-purchase"
                  ? "bg-blue-700/60 text-white"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {calculationResult.supplierSummaries.length} Vendors
            </span>
          </button>
        </div>
      </div>

      {/* Active Tab Report View */}
      {activeTab === "orders" && <OrdersReportView orders={orders} shops={shops} />}

      {activeTab === "master-purchase" && (
        <MasterPurchaseReportView
          calculationResult={calculationResult}
          suppliers={suppliers}
        />
      )}

      {activeTab === "supplier-purchase" && (
        <SupplierPurchaseReportView
          supplierSummaries={calculationResult.supplierSummaries}
          unassignedItems={calculationResult.unassignedItems}
          allSuppliers={suppliers}
        />
      )}
    </div>
  );
}
