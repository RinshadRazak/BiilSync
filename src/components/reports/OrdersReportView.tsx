"use client";

import React, { useState, useMemo } from "react";
import { Order, Shop } from "@/types";
import { formatCurrency, formatDate } from "@/lib/formatters";
import { exportOrdersToExcel } from "@/lib/excelExport";
import { exportOrdersToPDF } from "@/lib/pdfExport";
import { EmptyState } from "@/components/common/EmptyState";
import {
  FileSpreadsheet,
  FileText,
  Filter,
  RotateCcw,
  ShoppingBag,
  Search,
  CheckCircle2,
  Clock,
  Ban,
  AlertCircle,
  Loader2,
} from "lucide-react";

interface OrdersReportViewProps {
  orders: Order[];
  shops: Shop[];
}

export function OrdersReportView({ orders, shops }: OrdersReportViewProps) {
  // Filters State
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [shopFilter, setShopFilter] = useState<string>("ALL");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Export State
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isExportingPDF, setIsExportingPDF] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Active Filter Description
  const filterDescription = useMemo(() => {
    const parts: string[] = [];
    if (startDate && endDate) {
      parts.push(`Date: ${startDate} to ${endDate}`);
    } else if (startDate) {
      parts.push(`From: ${startDate}`);
    } else if (endDate) {
      parts.push(`Until: ${endDate}`);
    } else {
      parts.push("Date: All time");
    }

    if (statusFilter !== "ALL") {
      parts.push(`Status: ${statusFilter}`);
    } else {
      parts.push("Status: All (Draft, Submitted, Cancelled)");
    }

    if (shopFilter !== "ALL") {
      const foundShop = shops.find((s) => s.id === shopFilter);
      parts.push(`Shop: ${foundShop ? foundShop.name : shopFilter}`);
    }

    if (searchTerm.trim()) {
      parts.push(`Search: "${searchTerm.trim()}"`);
    }

    return parts.join(" • ");
  }, [startDate, endDate, statusFilter, shopFilter, searchTerm, shops]);

  // Filtered Orders Calculation
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // 1. Status Filter
      if (statusFilter !== "ALL" && order.status !== statusFilter) {
        return false;
      }

      // 2. Shop Filter
      if (shopFilter !== "ALL" && order.shopId !== shopFilter) {
        return false;
      }

      // 3. Date Filters
      const orderDateStr = order.createdAt.slice(0, 10); // YYYY-MM-DD
      if (startDate && orderDateStr < startDate) {
        return false;
      }
      if (endDate && orderDateStr > endDate) {
        return false;
      }

      // 4. Search Filter (orderNumber, shopName, or item product name)
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchesNumber = order.orderNumber.toLowerCase().includes(query);
        const matchesShop = order.shopName.toLowerCase().includes(query);
        const matchesProduct = order.items.some(
          (it) =>
            it.productName.toLowerCase().includes(query) ||
            it.sku.toLowerCase().includes(query)
        );
        if (!matchesNumber && !matchesShop && !matchesProduct) {
          return false;
        }
      }

      return true;
    });
  }, [orders, statusFilter, shopFilter, startDate, endDate, searchTerm]);

  // Summary Metrics
  const metrics = useMemo(() => {
    let grandRevenue = 0;
    let totalItemsCount = 0;
    let draftCount = 0;
    let submittedCount = 0;
    let cancelledCount = 0;

    for (const order of filteredOrders) {
      grandRevenue += order.grandTotal;
      for (const item of order.items) {
        totalItemsCount += item.quantity;
      }
      if (order.status === "Draft") draftCount++;
      if (order.status === "Submitted") submittedCount++;
      if (order.status === "Cancelled") cancelledCount++;
    }

    return {
      totalOrders: filteredOrders.length,
      grandRevenue,
      totalItemsCount,
      draftCount,
      submittedCount,
      cancelledCount,
    };
  }, [filteredOrders]);

  // Reset Filters
  const handleResetFilters = () => {
    setStartDate("");
    setEndDate("");
    setStatusFilter("ALL");
    setShopFilter("ALL");
    setSearchTerm("");
    setExportError(null);
  };

  // Export to Excel Handler
  const handleExportExcel = async () => {
    if (filteredOrders.length === 0 || isExportingExcel || isExportingPDF) return;
    try {
      setIsExportingExcel(true);
      setExportError(null);
      // Small tick to ensure UI renders spinner
      await new Promise((r) => setTimeout(r, 80));
      exportOrdersToExcel(filteredOrders);
    } catch (err) {
      console.error("Orders Excel export error:", err);
      setExportError(
        err instanceof Error
          ? err.message
          : "Failed to generate Excel report. Please try again."
      );
    } finally {
      setIsExportingExcel(false);
    }
  };

  // Export to PDF Handler
  const handleExportPDF = async () => {
    if (filteredOrders.length === 0 || isExportingExcel || isExportingPDF) return;
    try {
      setIsExportingPDF(true);
      setExportError(null);
      // Small tick to ensure UI renders spinner
      await new Promise((r) => setTimeout(r, 80));
      exportOrdersToPDF(filteredOrders, filterDescription);
    } catch (err) {
      console.error("Orders PDF export error:", err);
      setExportError(
        err instanceof Error
          ? err.message
          : "Failed to generate PDF document. Please try again."
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
              Wholesale Orders Sales & Audit Report
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
              {filteredOrders.length} {filteredOrders.length === 1 ? "Order" : "Orders"}
            </span>
          </div>
          <p className="mt-1 text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
            Consolidated historical sales ledger with shop accounts, delivery details,
            product-level quantity breakdowns, and pricing snapshots.
          </p>
        </div>

        {/* Download Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            id="download-orders-excel-btn"
            onClick={handleExportExcel}
            disabled={filteredOrders.length === 0 || isExportingExcel || isExportingPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              filteredOrders.length === 0 || isExportingExcel || isExportingPDF
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
            id="download-orders-pdf-btn"
            onClick={handleExportPDF}
            disabled={filteredOrders.length === 0 || isExportingExcel || isExportingPDF}
            className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-xs ${
              filteredOrders.length === 0 || isExportingExcel || isExportingPDF
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
            <span>Report Filters</span>
          </div>

          {(startDate || endDate || statusFilter !== "ALL" || shopFilter !== "ALL" || searchTerm) && (
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

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* Start Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="orders-filter-start-date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* End Date */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="orders-filter-end-date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Order Status */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Order Status
            </label>
            <select
              id="orders-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Statuses (Draft, Submitted, Cancelled)</option>
              <option value="Submitted">Submitted (Confirmed)</option>
              <option value="Draft">Draft (Incomplete)</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>

          {/* Shop Account */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Retail Shop Account
            </label>
            <select
              id="orders-filter-shop"
              value={shopFilter}
              onChange={(e) => setShopFilter(e.target.value)}
              className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white px-3 py-2 text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            >
              <option value="ALL">All Retail Shops</option>
              {shops.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.id})
                </option>
              ))}
            </select>
          </div>

          {/* Keyword Search */}
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
              Search Text
            </label>
            <div className="relative">
              <input
                type="text"
                id="orders-filter-search"
                placeholder="Order #, shop, SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs sm:text-sm rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-3" />
            </div>
          </div>
        </div>

        {/* Active Filter Scope Notice */}
        <div className="pt-2 text-xs text-slate-500 flex flex-wrap items-center gap-2">
          <span className="font-semibold text-slate-700">Filter Scope:</span>
          <span className="bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono text-[11px]">
            {filterDescription}
          </span>
        </div>
      </div>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Sales Volume
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {formatCurrency(metrics.grandRevenue)}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Across {metrics.totalOrders} matching order(s)
          </p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Total Units Sold
          </p>
          <p className="text-lg sm:text-xl font-bold text-slate-900 mt-1">
            {metrics.totalItemsCount.toLocaleString("en-IN")}
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Product line items</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Submitted / Confirmed
          </p>
          <p className="text-lg sm:text-xl font-bold text-emerald-600 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span>{metrics.submittedCount}</span>
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">Active wholesale orders</p>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Drafts & Cancelled
          </p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-sm font-bold text-amber-600 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {metrics.draftCount} Draft
            </span>
            <span className="text-sm font-bold text-slate-400 flex items-center gap-1">
              <Ban className="w-3.5 h-3.5" /> {metrics.cancelledCount} Cancelled
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5">Excluded from procurement</p>
        </div>
      </div>

      {/* Preview Table or Empty State */}
      {filteredOrders.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="No orders found"
          description="No orders match your chosen filters. Adjust your date range, status, or retail shop selection to see preview records."
          actionLabel="Reset Filters"
          onAction={handleResetFilters}
        />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-200 bg-slate-50/50 flex items-center justify-between">
            <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">
              Orders Report Preview ({filteredOrders.length} records)
            </h3>
            <span className="text-xs text-slate-500">
              Showing historical snapshot pricing
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Retail Shop</th>
                  <th className="px-4 py-3">Items Summary</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Grand Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredOrders.map((order) => {
                  const statusColors =
                    order.status === "Submitted"
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200/80"
                      : order.status === "Draft"
                      ? "bg-amber-50 text-amber-700 border-amber-200/80"
                      : "bg-slate-100 text-slate-600 border-slate-200";

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/80 transition-colors group"
                    >
                      <td className="px-4 py-3 font-mono font-medium text-blue-700">
                        {order.orderNumber}
                      </td>
                      <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-slate-900">{order.shopName}</div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          ID: {order.shopId} {order.shopArea ? `• ${order.shopArea}` : ""}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div className="line-clamp-1 max-w-xs text-xs">
                          {order.items.map((it) => `${it.quantity}× ${it.productName}`).join(", ")}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {order.items.length} line item(s)
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center whitespace-nowrap">
                        <span
                          className={`inline-block text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColors}`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(order.grandTotal)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/80 border-t-2 border-slate-200 font-bold text-slate-900 text-xs sm:text-sm">
                <tr>
                  <td className="px-4 py-3" colSpan={3}>
                    Grand Total ({filteredOrders.length} orders)
                  </td>
                  <td className="px-4 py-3 text-slate-600">
                    {metrics.totalItemsCount.toLocaleString("en-IN")} units
                  </td>
                  <td className="px-4 py-3"></td>
                  <td className="px-4 py-3 text-right text-blue-700 font-bold">
                    {formatCurrency(metrics.grandRevenue)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
