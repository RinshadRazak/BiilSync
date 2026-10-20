"use client";

import React, { useState } from "react";
import Link from "next/link";
import { PlannedPurchaseItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import {
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Building2,
  ExternalLink,
  Store,
  FileText,
  Truck,
  HelpCircle,
} from "lucide-react";

interface DemandSummaryTableProps {
  items: PlannedPurchaseItem[];
  onOpenSupplierModal: (item: PlannedPurchaseItem) => void;
}

export function DemandSummaryTable({
  items,
  onOpenSupplierModal,
}: DemandSummaryTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "assigned" | "unassigned" | "has_mappings" | "no_mappings"
  >("all");

  const filteredItems = items.filter((item) => {
    const { demand, hasSupplier, hasMappingsAvailable } = item;

    // Search query matching
    const q = searchQuery.trim().toLowerCase();
    const matchesSearch =
      q === "" ||
      demand.productName.toLowerCase().includes(q) ||
      demand.sku.toLowerCase().includes(q);

    if (!matchesSearch) return false;

    // Filter type matching
    if (filterType === "assigned") return hasSupplier;
    if (filterType === "unassigned") return !hasSupplier;
    if (filterType === "has_mappings") return hasMappingsAvailable;
    if (filterType === "no_mappings") return !hasMappingsAvailable;

    return true;
  });

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            type="button"
            onClick={() => setFilterType("all")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === "all"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            All Demand ({items.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("assigned")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === "assigned"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            Assigned ({items.filter((i) => i.hasSupplier).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("unassigned")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === "unassigned"
                ? "bg-amber-600 text-white"
                : "bg-amber-50 text-amber-700 hover:bg-amber-100"
            }`}
          >
            Needs Supplier ({items.filter((i) => !i.hasSupplier).length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("no_mappings")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
              filterType === "no_mappings"
                ? "bg-rose-600 text-white"
                : "bg-rose-50 text-rose-700 hover:bg-rose-100"
            }`}
          >
            No Mappings ({items.filter((i) => !i.hasMappingsAvailable).length})
          </button>
        </div>
      </div>

      {/* Main Demand List / Table */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Filter className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-slate-800">No Matching Product Demand</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No product demand records match your current filter and search query. Try clearing or
              changing filters.
            </p>
          </div>
          {(searchQuery || filterType !== "all") && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery("");
                setFilterType("all");
              }}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold underline underline-offset-4"
            >
              Reset Search & Filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View (hidden on small screens) */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product Details</th>
                    <th className="py-3 px-3">Packaging</th>
                    <th className="py-3 px-3 text-right">Required Demand</th>
                    <th className="py-3 px-3 text-center">Orders / Shops</th>
                    <th className="py-3 px-4">Mapped Suppliers</th>
                    <th className="py-3 px-4">Assigned Vendor</th>
                    <th className="py-3 px-3 text-right">Est. Unit Cost</th>
                    <th className="py-3 px-4 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredItems.map((item) => {
                    const { demand, selectedSupplier, selectedMapping, hasSupplier, isStaleSupplier } =
                      item;

                    return (
                      <tr
                        key={demand.productId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Product Name & SKU */}
                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="font-semibold text-slate-900 text-sm">
                                {demand.productName}
                              </span>
                              {demand.isMasterMissing && (
                                <span
                                  title="Product removed from master catalog; rendered from order snapshot"
                                  className="px-1.5 py-0.5 rounded bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold"
                                >
                                  Missing Master
                                </span>
                              )}
                              {demand.isMasterInactive && (
                                <span
                                  title="Product master is deactivated"
                                  className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-600 text-[10px] font-medium"
                                >
                                  Catalog Inactive
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-slate-400 block">
                              SKU: {demand.sku}
                            </span>
                          </div>
                        </td>

                        {/* Packaging Unit */}
                        <td className="py-3.5 px-3">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
                            {demand.unit}
                          </span>
                        </td>

                        {/* Total Demand Quantity */}
                        <td className="py-3.5 px-3 text-right">
                          <span className="text-sm font-bold text-blue-700">
                            {demand.demandQuantity}{" "}
                            <span className="text-xs font-medium text-slate-500">
                              {demand.unit}s
                            </span>
                          </span>
                        </td>

                        {/* Orders & Shops count */}
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-2 text-[11px] text-slate-500">
                            <span
                              title={`Submitted Orders: ${demand.orderNumbers.join(", ")}`}
                              className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded"
                            >
                              <FileText className="w-3 h-3 text-slate-400" />
                              <span>{demand.orderCount} ord</span>
                            </span>
                            <span
                              title="Unique Shops Requesting"
                              className="flex items-center gap-0.5 bg-slate-100 px-1.5 py-0.5 rounded"
                            >
                              <Store className="w-3 h-3 text-slate-400" />
                              <span>{demand.shopCount} shp</span>
                            </span>
                          </div>
                        </td>

                        {/* Available Mappings */}
                        <td className="py-3.5 px-4">
                          {demand.availableMappings.length > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs text-slate-600 font-medium">
                              <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              <span>{demand.availableMappings.length} mapped vendor(s)</span>
                            </span>
                          ) : (
                            <Link
                              href="/products"
                              className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 font-medium group"
                            >
                              <AlertCircle className="w-3.5 h-3.5" />
                              <span className="underline decoration-rose-300">Map supplier</span>
                              <ExternalLink className="w-3 h-3 opacity-70 group-hover:opacity-100" />
                            </Link>
                          )}
                        </td>

                        {/* Assigned Vendor */}
                        <td className="py-3.5 px-4">
                          {hasSupplier && selectedSupplier ? (
                            <div className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-slate-900 text-xs">
                                {selectedSupplier.name}
                              </span>
                            </div>
                          ) : isStaleSupplier ? (
                            <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Vendor Stale</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              <HelpCircle className="w-3 h-3" />
                              <span>Unassigned</span>
                            </span>
                          )}
                        </td>

                        {/* Negotiated Unit Cost */}
                        <td className="py-3.5 px-3 text-right">
                          {selectedMapping ? (
                            <div>
                              <span className="font-bold text-slate-900 text-xs">
                                {formatCurrency(selectedMapping.supplierPrice)}
                              </span>
                              <span className="text-[10px] text-slate-400 block">
                                per {demand.unit}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic text-xs">-</span>
                          )}
                        </td>

                        {/* Action: Select / Change Supplier */}
                        <td className="py-3.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenSupplierModal(item)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                              hasSupplier
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                : "bg-blue-600 hover:bg-blue-700 text-white"
                            }`}
                          >
                            {hasSupplier ? "Change Vendor" : "Select Vendor"}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout (Visible on small & tablet screens) */}
          <div className="lg:hidden space-y-3">
            {filteredItems.map((item) => {
              const { demand, selectedSupplier, selectedMapping, hasSupplier, isStaleSupplier } = item;

              return (
                <div
                  key={demand.productId}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
                >
                  {/* Header: Product & SKU */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-bold text-slate-900 text-sm">{demand.productName}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-mono text-slate-400">
                          SKU: {demand.sku}
                        </span>
                        <span className="text-[11px] text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded font-medium">
                          {demand.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Demand
                      </span>
                      <span className="text-sm font-extrabold text-blue-700">
                        {demand.demandQuantity} {demand.unit}s
                      </span>
                    </div>
                  </div>

                  {/* Warnings if any */}
                  {demand.isMasterMissing && (
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-2 flex items-center gap-1.5 text-xs text-rose-800">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      <span>Product record missing in catalog (order snapshot used).</span>
                    </div>
                  )}

                  {isStaleSupplier && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-2 flex items-center gap-1.5 text-xs text-amber-800">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>Previously selected supplier is no longer mapped or active.</span>
                    </div>
                  )}

                  {/* Order / Shop Breadcrumb Info */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                    <span className="flex items-center gap-1">
                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                      <span>{demand.orderCount} orders</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Store className="w-3.5 h-3.5 text-slate-400" />
                      <span>{demand.shopCount} unique retail shops</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-400" />
                      <span>{demand.availableMappings.length} mapped</span>
                    </span>
                  </div>

                  {/* Assigned Supplier Banner */}
                  <div className="bg-slate-50 rounded-lg p-2.5 flex items-center justify-between gap-2">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                        Procurement Vendor
                      </span>
                      {hasSupplier && selectedSupplier ? (
                        <div className="flex items-center gap-1 text-xs font-semibold text-slate-900 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{selectedSupplier.name}</span>
                          {selectedMapping && (
                            <span className="text-slate-500 font-normal">
                              ({formatCurrency(selectedMapping.supplierPrice)}/{demand.unit})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 font-medium block mt-0.5">
                          {demand.availableMappings.length === 0
                            ? "No mappings configured"
                            : "Needs vendor selection"}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenSupplierModal(item)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold shrink-0 transition-colors ${
                        hasSupplier
                          ? "bg-white border border-slate-200 text-slate-700"
                          : "bg-blue-600 text-white"
                      }`}
                    >
                      {hasSupplier ? "Change" : "Select"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
