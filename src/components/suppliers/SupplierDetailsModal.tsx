"use client";

import React, { useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { Supplier } from "@/types";
import { getProducts } from "@/lib/storage";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { Truck, Phone, MapPin, FileText, Edit3, CheckCircle2, XCircle, Package } from "lucide-react";

interface SupplierDetailsModalProps {
  supplier: Supplier | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (supplier: Supplier) => void;
}

export function SupplierDetailsModal({
  supplier,
  isOpen,
  onClose,
  onEdit,
}: SupplierDetailsModalProps) {
  // Find products associated with this supplier
  const suppliedProducts = useMemo(() => {
    if (!supplier) return [];
    const allProducts = getProducts();
    return allProducts.flatMap((prod) => {
      const mapping = prod.supplierMappings?.find((m) => m.supplierId === supplier.id);
      if (mapping) {
        return [
          {
            product: prod,
            supplierPrice: mapping.supplierPrice,
            supplierProductCode: mapping.supplierProductCode,
          },
        ];
      }
      return [];
    });
  }, [supplier]);

  if (!supplier) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Supplier Profile"
      subtitle={`ID: ${supplier.id} • ${supplier.name}`}
      maxWidth="lg"
    >
      <div className="space-y-5">
        {/* Header Badge */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{supplier.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Contact: <span className="font-semibold text-slate-700">{supplier.contactPerson || "Not specified"}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {supplier.isActive ? (
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

        {/* Contact & Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone / Mobile
            </span>
            <span className="text-sm font-semibold text-slate-900 block pt-0.5">
              {supplier.phone || "No phone listed"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Facility Address
            </span>
            <span className="text-xs text-slate-700 block pt-0.5 leading-relaxed">
              {supplier.address || "No address entered"}
            </span>
          </div>
        </div>

        {/* Notes */}
        {supplier.notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5" />
              Terms & Vendor Notes
            </span>
            <p className="text-slate-700 leading-relaxed">{supplier.notes}</p>
          </div>
        )}

        {/* Supplied Products */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-slate-500" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Associated Wholesale Catalog Products ({suppliedProducts.length})
              </h4>
            </div>
          </div>

          {suppliedProducts.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-3 bg-slate-50 rounded-lg border border-slate-200/60">
              No products mapped to this supplier yet. You can link products in the Products module.
            </p>
          ) : (
            <div className="divide-y divide-slate-100 rounded-lg border border-slate-200/80 overflow-hidden bg-white text-xs">
              {suppliedProducts.map((item) => (
                <div
                  key={item.product.id}
                  className="p-3 flex items-center justify-between hover:bg-slate-50/60"
                >
                  <div>
                    <span className="font-semibold text-slate-900 block">
                      {item.product.name}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      SKU: {item.product.sku} • Unit: {item.product.unit}
                      {item.supplierProductCode && ` • Vendor SKU: ${item.supplierProductCode}`}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900 block">
                      {formatCurrency(item.supplierPrice)}
                    </span>
                    <span className="text-[10px] text-slate-500">negotiated rate</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dates */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Created: {formatDateTime(supplier.createdAt)}</span>
          <span>Last Updated: {formatDateTime(supplier.updatedAt)}</span>
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
              onEdit(supplier);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Supplier</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
