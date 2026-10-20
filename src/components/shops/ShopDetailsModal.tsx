"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Shop } from "@/types";
import { formatDateTime } from "@/lib/formatters";
import { Store, Phone, MapPin, Navigation, FileText, Edit3, CheckCircle2, XCircle } from "lucide-react";

interface ShopDetailsModalProps {
  shop: Shop | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (shop: Shop) => void;
}

export function ShopDetailsModal({
  shop,
  isOpen,
  onClose,
  onEdit,
}: ShopDetailsModalProps) {
  if (!shop) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Retail Shop Account"
      subtitle={`Shop ID: ${shop.id} • ${shop.name}`}
      maxWidth="md"
    >
      <div className="space-y-5">
        {/* Header Badge */}
        <div className="flex items-start justify-between gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Store className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{shop.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Proprietor: <span className="font-semibold text-slate-700">{shop.ownerName || "Not specified"}</span>
              </p>
            </div>
          </div>

          <div className="shrink-0">
            {shop.isActive ? (
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

        {/* Route Badge */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 flex items-center gap-2.5 text-xs text-blue-900">
          <Navigation className="w-4 h-4 text-blue-600 shrink-0" />
          <div>
            <span className="font-semibold block">Assigned Delivery Route:</span>
            <span className="text-blue-800">{shop.area}</span>
          </div>
        </div>

        {/* Contact & Address Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5" />
              Phone / Contact
            </span>
            <span className="text-sm font-semibold text-slate-900 block pt-0.5">
              {shop.phone || "No phone entered"}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-1">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Store Address
            </span>
            <span className="text-xs text-slate-700 block pt-0.5 leading-relaxed">
              {shop.address || "No address entered"}
            </span>
          </div>
        </div>

        {/* Notes */}
        {shop.notes && (
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 text-xs">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1 mb-1">
              <FileText className="w-3.5 h-3.5" />
              Delivery & Billing Instructions
            </span>
            <p className="text-slate-700 leading-relaxed">{shop.notes}</p>
          </div>
        )}

        {/* Audit Dates */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Registered: {formatDateTime(shop.createdAt)}</span>
          <span>Last Updated: {formatDateTime(shop.updatedAt)}</span>
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
              onEdit(shop);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit Shop</span>
          </button>
        </div>
      </div>
    </Modal>
  );
}
