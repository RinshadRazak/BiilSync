"use client";

import React, { useState } from "react";
import { PlannedPurchaseItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useProducts } from "@/lib/storage";
import { ProductImage } from "@/components/products/ProductImage";
import {
  RotateCcw,
  IndianRupee,
  HelpCircle,
  Search,
  Plus,
  Minus,
  Layers,
} from "lucide-react";

interface MasterPurchaseListProps {
  items: PlannedPurchaseItem[];
  grandEstimatedTotal: number;
  onUpdatePlannedQuantity: (productId: string, quantity: number | null) => void;
  onOpenSupplierModal: (item: PlannedPurchaseItem) => void;
}

export function MasterPurchaseList({
  items,
  grandEstimatedTotal,
  onUpdatePlannedQuantity,
  onOpenSupplierModal,
}: MasterPurchaseListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const products = useProducts();

  const filteredItems = items.filter((item) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      item.demand.productName.toLowerCase().includes(q) ||
      item.demand.sku.toLowerCase().includes(q) ||
      (item.selectedSupplier?.name.toLowerCase().includes(q) ?? false)
    );
  });

  return (
    <div className="space-y-4">
      {/* Top Controls & Grand Total Header */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search master list by product, SKU, or vendor..."
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>

        {/* Grand Total Summary Badge */}
        <div className="bg-blue-50/80 border border-blue-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between md:justify-end gap-3 self-stretch md:self-auto shrink-0">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Estimated Total Purchase Cost
            </span>
            <span className="text-lg sm:text-xl font-black text-blue-950 tracking-tight">
              {formatCurrency(grandEstimatedTotal)}
            </span>
          </div>
          <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Notice about Ordered Demand vs Planned Purchase Quantity */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3 flex items-start gap-2.5 text-xs text-slate-600">
        <Layers className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          <strong className="text-slate-800">Demand vs. Purchase Buffer:</strong>{" "}
          <span className="text-slate-500">
            &ldquo;Ordered Demand&rdquo; is locked from shop orders. Adjusting &ldquo;Planned Purchase Quantity&rdquo; below
            allows you to add buffer safety stock for procurement without mutating shop order
            records.
          </span>
        </p>
      </div>

      {/* Main Table / Card List */}
      {filteredItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-3 shadow-2xs">
          <p className="text-sm font-semibold text-slate-700">No items match your search.</p>
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="text-xs text-blue-600 underline font-medium"
            >
              Clear Search Query
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-3 text-center">Unit</th>
                    <th className="py-3 px-3 text-right">Shop Demand</th>
                    <th className="py-3 px-4 text-center">Planned Purchase Qty</th>
                    <th className="py-3 px-4">Selected Supplier</th>
                    <th className="py-3 px-3 text-right">Vendor Price</th>
                    <th className="py-3 px-4 text-right">Est. Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
                  {filteredItems.map((item) => {
                    const {
                      demand,
                      selectedSupplier,
                      plannedQuantity,
                      supplierPrice,
                      estimatedTotal,
                      hasSupplier,
                    } = item;

                    const isAdjusted = plannedQuantity !== demand.demandQuantity;

                    return (
                      <tr
                        key={demand.productId}
                        className="hover:bg-slate-50/70 transition-colors"
                      >
                        {/* Product & SKU */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={products.find((p) => p.id === demand.productId)?.imageUrl}
                              alt={demand.productName}
                              size="sm"
                            />
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-900 text-sm block">
                                {demand.productName}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400">
                                SKU: {demand.sku}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Packaging Unit */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium text-xs">
                            {demand.unit}
                          </span>
                        </td>

                        {/* Ordered Demand (Immutable) */}
                        <td className="py-3 px-3 text-right">
                          <span className="font-semibold text-slate-700 text-xs">
                            {demand.demandQuantity}
                          </span>
                        </td>

                        {/* Planned Purchase Quantity with Controls */}
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Decrement */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePlannedQuantity(
                                  demand.productId,
                                  Math.max(0, plannedQuantity - 1)
                                )
                              }
                              className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                              title="Decrease planned quantity"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>

                            {/* Direct Number Input */}
                            <input
                              type="number"
                              min="0"
                              step="1"
                              value={plannedQuantity}
                              onChange={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val) && val >= 0) {
                                  onUpdatePlannedQuantity(demand.productId, val);
                                }
                              }}
                              className={`w-18 text-center py-1 px-1 text-xs font-bold rounded border transition-colors ${
                                isAdjusted
                                  ? "bg-amber-50/70 border-amber-300 text-amber-900 ring-1 ring-amber-300"
                                  : "bg-white border-slate-200 text-slate-900"
                              }`}
                            />

                            {/* Increment */}
                            <button
                              type="button"
                              onClick={() =>
                                onUpdatePlannedQuantity(demand.productId, plannedQuantity + 1)
                              }
                              className="w-7 h-7 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 flex items-center justify-center transition-colors"
                              title="Increase planned quantity"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>

                            {/* Reset to Demand button if modified */}
                            {isAdjusted && (
                              <button
                                type="button"
                                onClick={() => onUpdatePlannedQuantity(demand.productId, null)}
                                title="Reset to original shop demand"
                                className="p-1 rounded-md text-amber-600 hover:text-amber-800 hover:bg-amber-100 transition-colors ml-0.5"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>

                        {/* Selected Supplier */}
                        <td className="py-3 px-4">
                          {hasSupplier && selectedSupplier ? (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-slate-900 text-xs">
                                {selectedSupplier.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => onOpenSupplierModal(item)}
                                className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                              >
                                Change
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenSupplierModal(item)}
                              className="inline-flex items-center gap-1 text-xs text-amber-700 hover:text-amber-900 font-semibold bg-amber-50 px-2.5 py-1 rounded-md border border-amber-200 hover:bg-amber-100 transition-colors"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Select Supplier</span>
                            </button>
                          )}
                        </td>

                        {/* Vendor Purchase Price */}
                        <td className="py-3 px-3 text-right">
                          {supplierPrice !== null ? (
                            <span className="font-bold text-slate-800 text-xs">
                              {formatCurrency(supplierPrice)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-xs">-</span>
                          )}
                        </td>

                        {/* Estimated Line Total */}
                        <td className="py-3 px-4 text-right">
                          {estimatedTotal !== null ? (
                            <span className="font-extrabold text-slate-900 text-sm">
                              {formatCurrency(estimatedTotal)}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400 italic">Unpriced</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Card Layout */}
          <div className="lg:hidden space-y-3">
            {filteredItems.map((item) => {
              const {
                demand,
                selectedSupplier,
                plannedQuantity,
                supplierPrice,
                estimatedTotal,
                hasSupplier,
              } = item;

              const isAdjusted = plannedQuantity !== demand.demandQuantity;

              return (
                <div
                  key={demand.productId}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
                >
                  {/* Product Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <ProductImage
                        src={products.find((p) => p.id === demand.productId)?.imageUrl}
                        alt={demand.productName}
                        size="sm"
                      />
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{demand.productName}</h4>
                        <span className="text-[11px] font-mono text-slate-400">
                          SKU: {demand.sku} • {demand.unit}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] text-slate-400 block uppercase tracking-wider">
                        Line Est.
                      </span>
                      <span className="text-sm font-extrabold text-slate-900">
                        {estimatedTotal !== null ? formatCurrency(estimatedTotal) : "Unpriced"}
                      </span>
                    </div>
                  </div>

                  {/* Quantities Comparison Grid */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">
                        Shop Demand
                      </span>
                      <span className="text-xs font-bold text-slate-700">
                        {demand.demandQuantity} {demand.unit}s
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] text-blue-700 font-semibold uppercase tracking-wider block">
                          Planned Purchase
                        </span>
                        {isAdjusted && (
                          <button
                            type="button"
                            onClick={() => onUpdatePlannedQuantity(demand.productId, null)}
                            className="text-[10px] text-amber-600 hover:underline flex items-center gap-0.5"
                          >
                            <RotateCcw className="w-2.5 h-2.5" />
                            <span>Reset</span>
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 mt-1">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePlannedQuantity(
                              demand.productId,
                              Math.max(0, plannedQuantity - 1)
                            )
                          }
                          className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="0"
                          value={plannedQuantity}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            if (!isNaN(val) && val >= 0) {
                              onUpdatePlannedQuantity(demand.productId, val);
                            }
                          }}
                          className="w-14 text-center py-0.5 text-xs font-extrabold bg-white border border-slate-200 rounded text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onUpdatePlannedQuantity(demand.productId, plannedQuantity + 1)
                          }
                          className="w-6 h-6 rounded bg-white border border-slate-200 text-slate-700 flex items-center justify-center text-xs font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Supplier Info & Action */}
                  <div className="flex items-center justify-between pt-1">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Assigned Vendor
                      </span>
                      {hasSupplier && selectedSupplier ? (
                        <div className="text-xs font-semibold text-slate-900">
                          {selectedSupplier.name}
                          {supplierPrice !== null && (
                            <span className="text-slate-500 font-normal ml-1">
                              ({formatCurrency(supplierPrice)})
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-amber-700 font-medium">
                          No vendor assigned
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenSupplierModal(item)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                    >
                      {hasSupplier ? "Change Vendor" : "Select Vendor"}
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
