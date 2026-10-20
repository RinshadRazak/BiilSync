"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  CalendarRange,
  ClipboardList,
  PlusCircle,
  Truck,
  RotateCcw,
  CheckCircle2,
  Info,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { useOrders } from "@/lib/orderStorage";
import { useProducts, useSuppliers } from "@/lib/storage";
import {
  usePurchasePlanStorage,
  setProductSupplier,
  setProductPlannedQuantity,
  clearPurchasePlan,
} from "@/lib/purchasePlanStorage";
import { aggregateDemand, calculatePurchasePlan } from "@/lib/purchasePlanning";
import { PlannedPurchaseItem } from "@/types";
import { PurchasePlanningStats } from "@/components/purchase-planning/PurchasePlanningStats";
import { DemandSummaryTable } from "@/components/purchase-planning/DemandSummaryTable";
import { MasterPurchaseList } from "@/components/purchase-planning/MasterPurchaseList";
import { SupplierBreakdownView } from "@/components/purchase-planning/SupplierBreakdownView";
import { SupplierSelectModal } from "@/components/purchase-planning/SupplierSelectModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { StorageNoticeBanner } from "@/components/common/StorageNoticeBanner";

export default function PurchasePlanningPage() {
  const orders = useOrders();
  const products = useProducts();
  const suppliers = useSuppliers();
  const planStorage = usePurchasePlanStorage();

  // Active view tab
  const [activeTab, setActiveTab] = useState<"demand_summary" | "master_list" | "supplier_summary">(
    "demand_summary"
  );

  // Modal item for supplier selection
  const [modalItem, setModalItem] = useState<PlannedPurchaseItem | null>(null);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((cur) => (cur === msg ? null : cur));
    }, 3000);
  };

  // 1. Demand Aggregation from Submitted Orders only
  const demands = useMemo(() => {
    return aggregateDemand(orders, products, suppliers);
  }, [orders, products, suppliers]);

  // Count submitted orders
  const submittedOrdersCount = useMemo(() => {
    return orders.filter((o) => o.status === "Submitted").length;
  }, [orders]);

  // 2. Calculate complete Purchase Plan (demands + saved planning choices)
  const calculationResult = useMemo(() => {
    return calculatePurchasePlan(demands, planStorage, suppliers);
  }, [demands, planStorage, suppliers]);

  // Keep modal item updated with latest calculations if open
  const currentModalItem = useMemo(() => {
    if (!modalItem) return null;
    return (
      calculationResult.plannedItems.find(
        (i) => i.demand.productId === modalItem.demand.productId
      ) || modalItem
    );
  }, [modalItem, calculationResult.plannedItems]);

  const handleSelectSupplier = (productId: string, supplierId?: string) => {
    setProductSupplier(productId, supplierId);
    if (supplierId) {
      const supp = suppliers.find((s) => s.id === supplierId);
      showToast(supp ? `Assigned to ${supp.name}` : "Supplier choice saved");
    } else {
      showToast("Supplier unassigned");
    }
  };

  const handleUpdatePlannedQuantity = (productId: string, qty: number | null) => {
    setProductPlannedQuantity(productId, qty);
    if (qty === null) {
      showToast("Reset to shop order demand quantity");
    } else {
      showToast(`Planned purchase quantity set to ${qty}`);
    }
  };

  const handleResetAllPlanning = () => {
    clearPurchasePlan();
    setIsResetConfirmOpen(false);
    showToast("Purchase plan reset to default order demand");
  };

  const hasSubmittedOrders = submittedOrdersCount > 0 && demands.length > 0;

  return (
    <div className="space-y-6">
      {/* Storage Banner */}
      <StorageNoticeBanner />

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-18 lg:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-2 duration-200">
          <div className="bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 border border-slate-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}

      {/* Header & Planning Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              Purchase Planning & Demand Aggregation
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200/60 shrink-0">
              Phase 4 Live
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Aggregated stock demand derived automatically from active submitted wholesale orders.
          </p>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {hasSubmittedOrders && (
            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 text-xs font-semibold shadow-2xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Plan</span>
            </button>
          )}

          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Order</span>
          </Link>
        </div>
      </div>

      {/* Overview KPI Cards */}
      <PurchasePlanningStats
        totalProductsWithDemand={calculationResult.totalProductsWithDemand}
        totalSubmittedOrders={submittedOrdersCount}
        grandEstimatedTotal={calculationResult.grandEstimatedTotal}
        totalAssignedProducts={calculationResult.totalAssignedProducts}
        totalUnassignedProducts={calculationResult.totalUnassignedProducts}
      />

      {/* Empty State when no submitted demand exists */}
      {!hasSubmittedOrders ? (
        <div className="bg-white rounded-2xl border border-slate-200/90 p-8 sm:p-12 text-center shadow-2xs space-y-4 max-w-2xl mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
            <CalendarRange className="w-8 h-8" />
          </div>

          <div className="space-y-1.5">
            <h3 className="text-lg font-bold text-slate-900">
              No Submitted Orders for Demand Aggregation
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
              Purchase planning calculates stock requirements strictly from orders with status{" "}
              <strong className="text-slate-700 font-semibold">&ldquo;Submitted&rdquo;</strong>.
              Draft and Cancelled orders are excluded to ensure procurement accuracy.
            </p>
          </div>

          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 text-xs text-slate-600 text-left max-w-md mx-auto space-y-1.5">
            <div className="flex items-center gap-2 font-semibold text-slate-800">
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
              <span>How Demand Aggregation Works:</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-slate-500 text-[11px] pl-1">
              <li>Create wholesale orders for retail shops at <strong>/orders/new</strong></li>
              <li>Submit the orders (or edit and submit existing draft orders)</li>
              <li>This engine aggregates product quantities and organizes by supplier</li>
            </ul>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/orders/new"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Wholesale Order</span>
            </Link>
            <Link
              href="/orders"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
            >
              <ClipboardList className="w-4 h-4 text-slate-500" />
              <span>Review Existing Orders</span>
            </Link>
          </div>
        </div>
      ) : (
        /* Main Interactive Tabs */
        <div className="space-y-4">
          {/* Tabs Switcher Navigation */}
          <div className="border-b border-slate-200 flex items-center gap-1 sm:gap-4 overflow-x-auto select-none">
            <button
              type="button"
              onClick={() => setActiveTab("demand_summary")}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "demand_summary"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Demand Summary</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {demands.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("master_list")}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "master_list"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>Master Purchase List</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-blue-50 text-blue-700">
                Adjust Quantities
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("supplier_summary")}
              className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-semibold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
                activeTab === "supplier_summary"
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span>Supplier Breakdown</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-600">
                {calculationResult.supplierSummaries.length} Vendors
              </span>
            </button>
          </div>

          {/* Active Tab Content */}
          {activeTab === "demand_summary" && (
            <DemandSummaryTable
              items={calculationResult.plannedItems}
              onOpenSupplierModal={(item) => setModalItem(item)}
            />
          )}

          {activeTab === "master_list" && (
            <MasterPurchaseList
              items={calculationResult.plannedItems}
              grandEstimatedTotal={calculationResult.grandEstimatedTotal}
              onUpdatePlannedQuantity={handleUpdatePlannedQuantity}
              onOpenSupplierModal={(item) => setModalItem(item)}
            />
          )}

          {activeTab === "supplier_summary" && (
            <SupplierBreakdownView
              supplierSummaries={calculationResult.supplierSummaries}
              unassignedItems={calculationResult.unassignedItems}
              grandEstimatedTotal={calculationResult.grandEstimatedTotal}
              onOpenSupplierModal={(item) => setModalItem(item)}
            />
          )}
        </div>
      )}

      {/* Supplier Selection Modal */}
      <SupplierSelectModal
        isOpen={!!modalItem}
        onClose={() => setModalItem(null)}
        item={currentModalItem}
        onSelectSupplier={handleSelectSupplier}
      />

      {/* Reset Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleResetAllPlanning}
        title="Reset Purchase Plan Decisions?"
        message="This will clear your customized planned quantities and vendor assignments for this procurement cycle, returning all quantities to match current shop order demand. Existing shop orders will not be affected."
        confirmLabel="Reset Plan"
        variant="warning"
      />
    </div>
  );
}
