"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Product } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { ProductImage } from "./ProductImage";
import { Truck, Edit3, CheckCircle2, XCircle } from "lucide-react";

interface ProductDetailsModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (product: Product) => void;
}

export function ProductDetailsModal({
  product,
  isOpen,
  onClose,
  onEdit,
}: ProductDetailsModalProps) {
  if (!product) return null;

  const marginAmount = product.sellingPrice - product.purchasePrice;
  const marginPercent =
    product.sellingPrice > 0 ? ((marginAmount / product.sellingPrice) * 100).toFixed(1) : "0.0";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Product Details"
      subtitle={`SKU: ${product.sku} • ID: ${product.id}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Header Summary */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-start gap-3">
            <ProductImage
              src={product.imageUrl}
              alt={product.name}
              size="md"
            />
            <div>
              <h3 className="text-base font-bold text-slate-900">{product.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Category: <span className="font-semibold text-slate-700">{product.category}</span> • Unit:{" "}
                <span className="font-semibold text-slate-700">{product.unit}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {product.isActive ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <XCircle className="w-3.5 h-3.5" />
                Inactive
              </span>
            )}
          </div>
        </div>

        {/* Pricing Metrics */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Purchase Cost
            </span>
            <span className="text-base sm:text-lg font-bold text-slate-900 mt-1 block">
              {formatCurrency(product.purchasePrice)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">per {product.unit}</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Wholesale Price
            </span>
            <span className="text-base sm:text-lg font-bold text-blue-600 mt-1 block">
              {formatCurrency(product.sellingPrice)}
            </span>
            <span className="text-[10px] text-slate-400 block mt-0.5">default selling rate</span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
              Gross Margin
            </span>
            <span
              className={`text-base sm:text-lg font-bold mt-1 block ${
                marginAmount >= 0 ? "text-emerald-600" : "text-rose-600"
              }`}
            >
              {formatCurrency(marginAmount)}
            </span>
            <span className="text-[10px] font-semibold text-emerald-700 block mt-0.5">
              {marginPercent}% margin
            </span>
          </div>
        </div>

        {/* Supplier Mappings */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-slate-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
              Supplier Sources ({product.supplierMappings?.length || 0})
            </h4>
          </div>

          {!product.supplierMappings || product.supplierMappings.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              No specific suppliers linked to this product yet.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 overflow-hidden bg-white">
              {product.supplierMappings.map((mapping) => (
                <div
                  key={mapping.supplierId}
                  className="p-3 flex items-center justify-between text-xs hover:bg-slate-50/60"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      {mapping.supplierName}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Supplier ID: {mapping.supplierId}
                      {mapping.supplierProductCode && ` • SKU: ${mapping.supplierProductCode}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(mapping.supplierPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500">negotiated cost</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Audit Dates */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Created: {formatDateTime(product.createdAt)}</span>
          <span>Last Updated: {formatDateTime(product.updatedAt)}</span>
        </div>

        {/* Footer Actions */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => {
              onClose();
              onEdit(product);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Product</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
