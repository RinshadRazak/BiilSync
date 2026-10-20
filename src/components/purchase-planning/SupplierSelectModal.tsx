"use client";

import React from "react";
import Link from "next/link";
import { Modal } from "@/components/common/Modal";
import { PlannedPurchaseItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import {
  Truck,
  AlertTriangle,
  ExternalLink,
  Check,
  Building2,
  Tag,
  Ban,
} from "lucide-react";

interface SupplierSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: PlannedPurchaseItem | null;
  onSelectSupplier: (productId: string, supplierId?: string) => void;
}

export function SupplierSelectModal({
  isOpen,
  onClose,
  item,
  onSelectSupplier,
}: SupplierSelectModalProps) {
  if (!item) return null;

  const { demand, selectedSupplier, isStaleSupplier } = item;
  const mappings = demand.availableMappings;

  const handleSelect = (supplierId: string) => {
    onSelectSupplier(demand.productId, supplierId);
    onClose();
  };

  const handleClear = () => {
    onSelectSupplier(demand.productId, undefined);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Select Procurement Supplier"
      subtitle={`Choose the wholesale vendor to supply ${demand.productName}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        {/* Product Demand Snapshot Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-900 text-sm">{demand.productName}</span>
              <span className="text-[11px] font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                {demand.sku}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Unit Packaging: <span className="font-medium text-slate-700">{demand.unit}</span>
            </p>
          </div>
          <div className="text-left sm:text-right shrink-0">
            <span className="text-xs text-slate-500 block">Total Demand:</span>
            <span className="text-sm font-bold text-blue-700">
              {demand.demandQuantity} {demand.unit}s
            </span>
          </div>
        </div>

        {/* Stale Supplier Warning if needed */}
        {isStaleSupplier && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Previously Selected Supplier Unavailable:</span> The
              supplier originally chosen for this product is either no longer mapped or has been
              deactivated. Please select an active mapped vendor below.
            </div>
          </div>
        )}

        {/* Warning if Master Record is Missing or Inactive */}
        {demand.isMasterMissing && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-rose-900">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Product Master Missing:</span> This item exists in
              submitted shop orders via snapshot, but its master product record cannot be found.
              Supplier mappings cannot be linked until the product is restored.
            </div>
          </div>
        )}

        {/* Mappings List */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Available Mapped Suppliers ({mappings.length})
          </h4>

          {mappings.length === 0 ? (
            <div className="border border-dashed border-slate-300 rounded-xl p-5 text-center space-y-3 bg-white">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Truck className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-semibold text-slate-800">
                  No Active Supplier Mappings Configured
                </p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  To procure this product, map one or more wholesale suppliers with negotiated
                  purchase prices in the Product Management module.
                </p>
              </div>
              <div className="pt-1">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-800 underline decoration-blue-300 underline-offset-4"
                >
                  <span>Open Products Management to Add Suppliers</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {mappings.map((mapping) => {
                const isSelected = selectedSupplier?.id === mapping.supplierId;
                const estimatedCost = item.plannedQuantity * mapping.supplierPrice;

                return (
                  <div
                    key={mapping.supplierId}
                    onClick={() => handleSelect(mapping.supplierId)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-blue-50/80 border-blue-400 shadow-xs ring-1 ring-blue-400"
                        : "bg-white border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
                        <span className="font-semibold text-slate-900 text-sm">
                          {mapping.supplierName}
                        </span>
                        {isSelected && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-blue-600 text-white px-2 py-0.5 rounded-full">
                            <Check className="w-3 h-3" />
                            <span>Selected</span>
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
                        {mapping.supplierProductCode && (
                          <span className="flex items-center gap-1">
                            <Tag className="w-3 h-3 text-slate-400" />
                            <span>Vendor SKU: {mapping.supplierProductCode}</span>
                          </span>
                        )}
                        {mapping.notes && (
                          <span className="italic text-slate-400">&ldquo;{mapping.notes}&rdquo;</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                      <div className="text-right">
                        <span className="text-[11px] text-slate-500 block">Negotiated Cost</span>
                        <span className="text-sm font-bold text-slate-900">
                          {formatCurrency(mapping.supplierPrice)}
                          <span className="text-[10px] text-slate-500 font-normal ml-0.5">
                            /{demand.unit}
                          </span>
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          Est: {formatCurrency(estimatedCost)}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSelect(mapping.supplierId);
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-blue-600 text-white"
                            : "bg-slate-100 text-slate-700 hover:bg-blue-600 hover:text-white"
                        }`}
                      >
                        {isSelected ? "Active" : "Select"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          {selectedSupplier ? (
            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-1.5 text-xs text-rose-600 hover:text-rose-800 font-medium py-1.5 px-2.5 rounded-lg hover:bg-rose-50 transition-colors"
            >
              <Ban className="w-3.5 h-3.5" />
              <span>Unassign Supplier</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
