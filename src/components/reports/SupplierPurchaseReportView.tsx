"use client";

import React, { useState, useMemo } from "react";
import {
  SupplierPurchaseSummary,
  PlannedPurchaseItem,
  Supplier,
} from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { exportSupplierPurchaseToExcel } from "@/lib/excelExport";
import { exportSupplierPurchaseToPDF } from "@/lib/pdfExport";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  Truck,
  Phone,
  User,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  AlertCircle,
} from "lucide-react";

interface SupplierPurchaseReportViewProps {
  supplierSummaries: SupplierPurchaseSummary[];
  unassignedItems: PlannedPurchaseItem[];
  allSuppliers: Supplier[];
}

export function SupplierPurchaseReportView({
  supplierSummaries,
  unassignedItems,
  allSuppliers,
}: SupplierPurchaseReportViewProps) {
  // Filters State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>("ALL");
  const [includeUnassigned, setIncludeUnassigned] = useState<boolean>(true);

  // Export State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Filtered Supplier Summaries
  const filteredSummaries = useMemo(() => {
    if (selectedSupplierId === "ALL") {
      return supplierSummaries;
    }
    return supplierSummaries.filter((s) => s.supplier.id === selectedSupplierId);
  }, [supplierSummaries, selectedSupplierId]);

  // Filtered Unassigned Items
  const filteredUnassigned = useMemo(() => {
    if (!includeUnassigned) return [];
    // If a specific supplier is selected, unassigned products are separate,
    // but if the user wants to see only that supplier, don't show unassigned.
    if (selectedSupplierId !== "ALL") return [];
    return unassignedItems;
  }, [includeUnassigned, selectedSupplierId, unassignedItems]);

  // Filtered Subtotal
  const filteredTotal = useMemo(() => {
    return filteredSummaries.reduce((acc, s) => acc + s.totalEstimatedCost, 0);
  }, [filteredSummaries]);

  // Filter Description
  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (selectedSupplierId !== "ALL") {
      const supp = allSuppliers.find((s) => s.id === selectedSupplierId);
      parts.push(`Supplier: ${supp ? supp.name : selectedSupplierId}`);
    } else {
      parts.push("All Assigned Suppliers");
    }

    if (includeUnassigned && selectedSupplierId === "ALL") {
      parts.push("Including Unassigned Demands");
    }

    return parts.join(" • ");
  }, [selectedSupplierId, allSuppliers, includeUnassigned]);

  const handleResetFilters = () => {
    setSelectedSupplierId("ALL");
    setIncludeUnassigned(true);
    setExportError(null);
  };

  // Excel Export Handler
  const handleExportExcel = async () => {
    if (filteredSummaries.length === 0 && filteredUnassigned.length === 0) return;
    if (isExportingExcel || isExportingPDF) return;
    try {
      setIsExportingExcel(true);
      setExportError(null);
      await new Promise((r) => setTimeout(r, 80));
      exportSupplierPurchaseToExcel(filteredSummaries, filteredUnassigned, filteredTotal);
    } catch (err) {
      console.error("Supplier purchase Excel export error:", err);
      setExportError(
        err instanceof Error ? err.message : "Failed to generate Excel report. Please try again."
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  // PDF Export Handler
  const handleExportPDF = async () => {
    if (filteredSummaries.length === 0 && filteredUnassigned.length === 0) return;
    if (isExportingExcel || isExportingPDF) return;
    try {
      setIsExportingPDF(true);
      setExportError(null);
      await new Promise((r) => setTimeout(r, 80));
      exportSupplierPurchaseToPDF(
        filteredSummaries,
        filteredUnassigned,
        filteredTotal,
        filterDescription
      );
    } catch (err) {
      console.error("Supplier purchase PDF export error:", err);
      setExportError(
        err instanceof Error ? err.message : "Failed to generate PDF document. Please try again."
      );
    } finally {
      setIsExportingPDF(false);
    }
  };

  const hasAnyData = filteredSummaries.length > 0 || filteredUnassigned.length > 0;

  return (
    <div className="space-y-6">
      {/* Description & Action Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Supplier-wise Purchase Report
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {filteredSummaries.length} {filteredSummaries.length === 1 ? "Supplier" : "Suppliers"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Procurement requisitions grouped by assigned vendor with contact details,
            unit packaging breakdowns, and vendor purchase order subtotal estimates.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="download-supplier-excel-btn"
            onClick={handleExportExcel}
            disabled={!hasAnyData || isExportingExcel || isExportingPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              !hasAnyData || isExportingExcel || isExportingPDF
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
            id="download-supplier-pdf-btn"
            onClick={handleExportPDF}
            disabled={!hasAnyData || isExportingExcel || isExportingPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              !hasAnyData || isExportingExcel || isExportingPDF
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

      {/* Filter Controls Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 text-slate-800 text-xs sm:text-sm font-semibold">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Supplier Filters</span>
          </div>

          {(selectedSupplierId !== "ALL" || !includeUnassigned) && (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Supplier Dropdown */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Select Vendor
            </label>
            <select
              id="supplier-filter-dropdown"
              value={selectedSupplierId}
              onChange={(e) => setSelectedSupplierId(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Assigned Vendors ({supplierSummaries.length})</option>
              {supplierSummaries.map((s) => (
                <option key={s.supplier.id} value={s.supplier.id}>
                  {s.supplier.name} ({s.items.length} items • {formatCurrency(s.totalEstimatedCost)})
                </option>
              ))}
            </select>
          </div>

          {/* Toggle Unassigned Demand */}
          <div className="flex items-end pb-1.5">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeUnassigned}
                onChange={(e) => setIncludeUnassigned(e.target.checked)}
                className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <span className="text-xs sm:text-sm text-slate-700 font-medium">
                Include unassigned demand in report ({unassignedItems.length} SKUs)
              </span>
            </label>
          </div>
        </div>

        <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Scope:</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
            {filterDescription}
          </span>
        </div>
      </div>

      {/* KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Selected Vendors Subtotal
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(filteredTotal)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Reconciled with master list</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Active Supplier Groups
          </p>
          <p className="text-lg sm:text-xl font-bold text-blue-700 mt-1">
            {filteredSummaries.length}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">With planned purchase items</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Assigned Products
          </p>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>
              {filteredSummaries.reduce((sum, s) => sum + s.items.length, 0)}
            </span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Ready for PO issuance</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Unassigned Products
          </p>
          <p className="text-lg sm:text-xl font-bold text-amber-600 mt-1 flex items-center gap-1.5">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <span>{unassignedItems.length}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Pending supplier selection</p>
        </div>
      </div>

      {/* Main Content: Supplier Cards & Tables */}
      {!hasAnyData ? (
        <EmptyState
          icon={Truck}
          title="No supplier purchase plans found"
          description="There are currently no products allocated to suppliers with submitted demand. Allocate suppliers in Purchase Planning to view vendor reports."
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="space-y-6">
          {filteredSummaries.map((s) => {
            const unitBreakdownStr = Object.entries(s.unitBreakdown)
              .map(([u, q]) => `${q} ${u}s`)
              .join(", ");

            return (
              <div
                key={s.supplier.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Supplier Header Box */}
                <div className="p-5 border-b border-slate-200 bg-slate-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <Truck className="w-4 h-4" />
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base">
                          {s.supplier.name}
                        </h3>
                        <p className="text-[11px] text-slate-500 font-mono">
                          Supplier ID: {s.supplier.id}
                        </p>
                      </div>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
                      {s.supplier.contactPerson && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.supplier.contactPerson}</span>
                        </span>
                      )}
                      {s.supplier.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{s.supplier.phone}</span>
                        </span>
                      )}
                      {s.supplier.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          <span className="truncate max-w-xs">{s.supplier.address}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="text-left sm:text-right shrink-0 bg-white sm:bg-transparent p-3 sm:p-0 rounded-xl border sm:border-0 border-slate-200">
                    <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Vendor PO Subtotal
                    </p>
                    <p className="text-lg sm:text-xl font-bold text-blue-700">
                      {formatCurrency(s.totalEstimatedCost)}
                    </p>
                    <p className="text-[11px] text-slate-500 font-medium">
                      {s.items.length} product(s) • {unitBreakdownStr}
                    </p>
                  </div>
                </div>

                {/* Items Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs sm:text-sm">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Product Name & SKU</th>
                        <th className="px-4 py-3">Packaging Unit</th>
                        <th className="px-4 py-3 text-right">Planned Purchase Qty</th>
                        <th className="px-4 py-3 text-right">Supplier Price</th>
                        <th className="px-4 py-3 text-right">Estimated Line Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {s.items.map((item) => (
                        <tr key={item.demand.productId} className="hover:bg-slate-50/80">
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
                          <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            {item.plannedQuantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-700 whitespace-nowrap">
                            {item.supplierPrice !== null ? formatCurrency(item.supplierPrice) : "—"}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-blue-700 whitespace-nowrap">
                            {item.estimatedTotal !== null
                              ? formatCurrency(item.estimatedTotal)
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50/60 font-semibold text-xs border-t border-slate-200">
                      <tr>
                        <td className="px-4 py-2.5 text-slate-600" colSpan={2}>
                          Packaging Breakdown: <span className="font-bold text-slate-800">{unitBreakdownStr}</span>
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-900" colSpan={2}>
                          Subtotal for {s.supplier.name}:
                        </td>
                        <td className="px-4 py-2.5 text-right text-blue-700 font-bold">
                          {formatCurrency(s.totalEstimatedCost)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Unassigned Section */}
          {filteredUnassigned.length > 0 && (
            <div className="bg-white rounded-2xl border border-amber-200/90 shadow-xs overflow-hidden">
              <div className="p-4 sm:p-5 bg-amber-50/70 border-b border-amber-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-950 text-sm sm:text-base">
                      Unassigned Products ({filteredUnassigned.length} SKUs)
                    </h3>
                    <p className="text-xs text-amber-700">
                      These products have demand but no supplier is assigned. They will appear on the Unassigned Demand worksheet.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-amber-50/40 text-amber-900 font-semibold border-b border-amber-100">
                    <tr>
                      <th className="px-4 py-3">Product Name & SKU</th>
                      <th className="px-4 py-3">Packaging Unit</th>
                      <th className="px-4 py-3 text-right">Shop Demand Qty</th>
                      <th className="px-4 py-3">Available Supplier Mappings</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-100/60">
                    {filteredUnassigned.map((u) => (
                      <tr key={u.demand.productId} className="hover:bg-amber-50/20">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-slate-900">
                            {u.demand.productName}
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {u.demand.sku}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {u.demand.unit}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                          {u.demand.demandQuantity}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {u.demand.availableMappings.length > 0 ? (
                            <span className="text-slate-700">
                              {u.demand.availableMappings.length} supplier option(s) available
                            </span>
                          ) : (
                            <span className="text-rose-600 italic">No supplier mapped</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center whitespace-nowrap">
                          <span className="inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                            Needs Supplier
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
