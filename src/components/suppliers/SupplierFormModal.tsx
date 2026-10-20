"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Supplier } from "@/types";
import { saveSupplier } from "@/lib/storage";
import { AlertCircle } from "lucide-react";

interface SupplierFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  supplierToEdit?: Supplier | null;
  onSaved: (supplier: Supplier) => void;
}

interface SupplierFormContentProps {
  supplierToEdit?: Supplier | null;
  onClose: () => void;
  onSaved: (supplier: Supplier) => void;
}

function SupplierFormContent({
  supplierToEdit,
  onClose,
  onSaved,
}: SupplierFormContentProps) {
  const [name, setName] = useState(supplierToEdit?.name || "");
  const [contactPerson, setContactPerson] = useState(supplierToEdit?.contactPerson || "");
  const [phone, setPhone] = useState(supplierToEdit?.phone || "");
  const [address, setAddress] = useState(supplierToEdit?.address || "");
  const [notes, setNotes] = useState(supplierToEdit?.notes || "");
  const [isActive, setIsActive] = useState(supplierToEdit ? supplierToEdit.isActive : true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Supplier company name is required.");
      return;
    }

    const result = saveSupplier({
      id: supplierToEdit?.id,
      name: trimmedName,
      contactPerson: contactPerson.trim(),
      phone: phone.trim(),
      address: address.trim(),
      notes: notes.trim(),
      isActive,
    });

    if (result.success && result.supplier) {
      onSaved(result.supplier);
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to save supplier.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Supplier Company Name <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Apex FMCG Distributors"
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Contact Person
          </label>
          <input
            type="text"
            value={contactPerson}
            onChange={(e) => setContactPerson(e.target.value)}
            placeholder="e.g. Rajesh Kumar"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Phone Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98201 44552"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Warehouse / Office Address
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Plot / Industrial Estate address..."
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Payment Terms & Notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 15-day credit, weekly Tuesday dispatches..."
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="supplier-active-toggle"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="supplier-active-toggle" className="text-xs text-slate-700 cursor-pointer">
            Active Supplier (Eligible for purchase orders and SKU sourcing)
          </label>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
        >
          {supplierToEdit ? "Save Changes" : "Create Supplier"}
        </button>
      </div>
    </form>
  );
}

export function SupplierFormModal({
  isOpen,
  onClose,
  supplierToEdit,
  onSaved,
}: SupplierFormModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={supplierToEdit ? `Edit Supplier: ${supplierToEdit.name}` : "Add Wholesale Supplier"}
      subtitle="Register primary manufacturer, importer, or FMCG vendor details."
      maxWidth="md"
    >
      <SupplierFormContent
        key={supplierToEdit?.id ?? "new"}
        supplierToEdit={supplierToEdit}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
