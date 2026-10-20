"use client";

import React, { useState, useMemo } from "react";
import { Supplier } from "@/types";
import { PurchasePlanCalculationResult } from "@/lib/purchasePlanning";
import { formatCurrency } from "@/lib/formatters";
import { exportMasterPurchaseToExcel } from "@/lib/excelExport";
import { exportMasterPurchaseToPDF } from "@/lib/pdfExport";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Package,
  Search,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

interface MasterPurchaseReportViewProps {
  calculationResult: PurchasePlanCalculationResult;
  suppliers: Supplier[];
}

export function MasterPurchaseReportView({
  calculationResult,
  suppliers,
}: MasterPurchaseReportViewProps) {
  const { plannedItems, totalAssignedProducts, totalUnassignedProducts } =
    calculationResult;

  // Filters State
  const [statusFilter, setStatusFilter] = useState<string>("ALL"); // "ALL" | "ASSIGNED" | "UNASSIGNED"
  const [supplierFilter, setSupplierFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Export State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Active Filter Description
  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (statusFilter === "ASSIGNED") parts.push("Assigned to Vendor Only");
    else if (statusFilter === "UNASSIGNED") parts.push("Needs Vendor Assignment Only");
    else parts.push("All Allocation Statuses");

    if (supplierFilter !== "ALL") {
      const supp = suppliers.find((s) => s.id === supplierFilter);
      parts.push(`Supplier: ${supp ? supp.name : supplierFilter}`);
    }

    if (searchTerm.trim()) {
      parts.push(`Search: "${searchTerm.trim()}"`);
    }

    return parts.join(" • ");
  }, [statusFilter, supplierFilter, searchTerm, suppliers]);

  // Filtered Items
  const filteredItems = useMemo(() => {
    return plannedItems.filter((item) => {
      // 1. Status Filter
      if (statusFilter === "ASSIGNED" && !item.hasSupplier) return false;
      if (statusFilter === "UNASSIGNED" && item.hasSupplier) return false;

      // 2. Supplier Filter
      if (supplierFilter !== "ALL") {
        if (!item.hasSupplier || item.selectedSupplier?.id !== supplierFilter) {
          return false;
        }
      }

      // 3. Search Term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesName = item.demand.productName.toLowerCase().includes(query);
        const matchesSku = item.demand.sku.toLowerCase().includes(query);
        const matchesSupplier =
          item.selectedSupplier?.name.toLowerCase().includes(query) || false;
        if (!matchesName && !matchesSku && !matchesSupplier) return false;
      }

      return true;
    });
  }, [plannedItems, statusFilter, supplierFilter, searchTerm]);

  // Subtotal for filtered view
  const filteredTotal = useMemo(() => {
    return filteredItems.reduce((acc, item) => acc + (item.estimatedTotal || 0), 0);
  }, [filteredItems]);

  const handleResetFilters = () => {
    setStatusFilter("ALL");
    setSupplierFilter("ALL");
    setSearchTerm("");
    setExportError(null);
  };

  // Excel Export Handler
  const handleExportExcel = async () => {
    if (filteredItems.length === 0 || isExportingExcel || isExportingPDF) return;
    try {
      setIsExportingExcel(true);
      setExportError(null);
      await new Promise((r) => setTimeout(r, 80));
      exportMasterPurchaseToExcel(filteredItems, filteredTotal);
    } catch (err) {
      console.error("Master purchase Excel export error:", err);
      setExportError(
        err instanceof Error ? err.message : "Failed to generate Excel report. Please try again."
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (filteredItems.length === 0 || isExportingExcel || isExportingPDF) return;
    try {
      setIsExportingPDF(true);
      setExportError(null);
      await new Promise((r) => setTimeout(r, 80));
      exportMasterPurchaseToPDF(filteredItems, filteredTotal, filterDescription);
    } catch (err) {
      console.error("Master purchase PDF export error:", err);
      setExportError(
        err instanceof Error ? err.message : "Failed to generate PDF document. Please try again."
      );
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Description & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Master Purchase List Report
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {filteredItems.length} {filteredItems.length === 1 ? "Product" : "Products"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Consolidated procurement requisition calculated strictly from Submitted orders.
            Separates retail shop demand from planned purchase buffer and highlights unassigned SKUs.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="download-master-excel-btn"
            onClick={handleExportExcel}
            disabled={filteredItems.length === 0 || isExportingExcel || isExportingPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              filteredItems.length === 0 || isExportingExcel || isExportingPDF
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/10 active:scale-98"
            }`}
          >
            {isExportingExcel ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            )}
            <span>{isExportingExcel ? "Generating Excel..." : "Download Excel (.xlsx)"}</span>
          </button>

          <button
            type="button"
            id="download-master-pdf-btn"
            onClick={handleExportPDF}
            disabled={filteredItems.length === 0 || isExportingExcel || isExportingPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              filteredItems.length === 0 || isExportingExcel || isExportingPDF
                ? "bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/10 active:scale-98"
            }`}
          >
            {isExportingPDF ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <FileText className="w-4 h-4 text-blue-100" />
            )}
            <span>{isExportingPDF ? "Generating PDF..." : "Download PDF (.pdf)"}</span>
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {exportError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Export Failed</p>
            <p className="text-rose-700 mt-0.5">{exportError}</p>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-semibold">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Procurement Filters</span>
          </div>

          {(statusFilter !== "ALL" || supplierFilter !== "ALL" || searchTerm) && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-800 font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Supplier Assignment Status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Vendor Assignment Status
            </label>
            <select
              id="master-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Products ({plannedItems.length})</option>
              <option value="ASSIGNED">Assigned to Supplier ({totalAssignedProducts})</option>
              <option value="UNASSIGNED">Needs Supplier Assignment ({totalUnassignedProducts})</option>
            </select>
          </div>

          {/* Assigned Supplier Filter */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Assigned Supplier
            </label>
            <select
              id="master-filter-supplier"
              value={supplierFilter}
              onChange={(e) => setSupplierFilter(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Mapped Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Search Term */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Product Search
            </label>
            <div className="relative">
              <input
                type="text"
                id="master-filter-search"
                placeholder="Product name, SKU, vendor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Scope:</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
            {filterDescription}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Grand Purchase Estimate
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(filteredTotal)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Based on negotiated supplier costs</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Demand SKUs
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {plannedItems.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Strictly from Submitted orders</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Vendor Assigned SKUs
          </p>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{totalAssignedProducts}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Priced and ready for procurement</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Unassigned SKUs
          </p>
          <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{totalUnassignedProducts}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Visible in exports for action</p>
        </div>
      </div>

      {/* Preview Table or Empty State */}
      {filteredItems.length === 0 ? (
        <EmptyState
          icon={Package}
          title="No purchase requisitions found"
          description={
            plannedItems.length === 0
              ? "There is no demand from Submitted wholesale orders yet. Place or submit orders to see consolidated procurement items."
              : "No procurement items match your chosen filters. Adjust your status or supplier selection."
          }
          actionLabel={plannedItems.length > 0 ? "Reset Filters" : undefined}
          onAction={plannedItems.length > 0 ? handleResetFilters : undefined}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Master Purchase List Preview ({filteredItems.length} items)
            </h3>
            <span className="text-xs text-slate-500">
              Demand separate from planned buffer
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product Name & SKU</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3 text-right">Shop Demand</th>
                  <th className="px-4 py-3 text-right">Planned Purchase</th>
                  <th className="px-4 py-3">Assigned Supplier</th>
                  <th className="px-4 py-3 text-right">Supplier Cost</th>
                  <th className="px-4 py-3 text-right">Estimated Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => (
                  <tr
                    key={item.demand.productId}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">
                        {item.demand.productName}
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {item.demand.sku}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {item.demand.unit}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-slate-700 whitespace-nowrap">
                      {item.demand.demandQuantity}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700 whitespace-nowrap">
                      {item.plannedQuantity}
                    </td>
                    <td className="px-4 py-3">
                      {item.hasSupplier && item.selectedSupplier ? (
                        <div className="font-medium text-slate-800">
                          {item.selectedSupplier.name}
                        </div>
                      ) : (
                        <span className="text-amber-600 font-medium italic flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 shrink-0" /> Unassigned
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                      {item.supplierPrice !== null ? formatCurrency(item.supplierPrice) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                      {item.estimatedTotal !== null ? formatCurrency(item.estimatedTotal) : "Unpriced"}
                    </td>
                    <td className="px-4 py-3 text-center whitespace-nowrap">
                      {item.hasSupplier ? (
                        <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                          Assigned
                        </span>
                      ) : (
                        <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/80">
                          Needs Vendor
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold text-slate-900 text-xs sm:text-sm">
                <tr>
                  <td className="px-4 py-3" colSpan={4}>
                    Grand Estimated Purchase Total ({filteredItems.length} products)
                  </td>
                  <td className="px-4 py-3" colSpan={2}></td>
                  <td className="px-4 py-3 text-right text-blue-700 font-bold">
                    {formatCurrency(filteredTotal)}
                  </td>
                  <td className="px-4 py-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
