"use client";

import React, { useState } from "react";
import { Modal } from "@/components/common/Modal";
import { Shop, DEFAULT_DELIVERY_AREAS } from "@/types";
import { saveShop, isShopIdUnique } from "@/lib/storage";
import { AlertCircle } from "lucide-react";

interface ShopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopToEdit?: Shop | null;
  onSaved: (shop: Shop) => void;
}

interface ShopFormContentProps {
  shopToEdit?: Shop | null;
  onClose: () => void;
  onSaved: (shop: Shop) => void;
}

function ShopFormContent({
  shopToEdit,
  onClose,
  onSaved,
}: ShopFormContentProps) {
  const [shopId, setShopId] = useState(() => {
    if (shopToEdit) return shopToEdit.id;
    const randomNum = Math.floor(100 + Math.random() * 900);
    return `SHP-${randomNum}`;
  });

  const [name, setName] = useState(shopToEdit?.name || "");
  const [ownerName, setOwnerName] = useState(shopToEdit?.ownerName || "");
  const [phone, setPhone] = useState(shopToEdit?.phone || "");
  const [address, setAddress] = useState(shopToEdit?.address || "");

  const initialArea = shopToEdit?.area;
  const isDefaultArea = initialArea ? DEFAULT_DELIVERY_AREAS.includes(initialArea) : true;
  const [area, setArea] = useState(isDefaultArea ? initialArea || DEFAULT_DELIVERY_AREAS[0] : "Custom");
  const [customArea, setCustomArea] = useState(isDefaultArea ? "" : initialArea || "");

  const [notes, setNotes] = useState(shopToEdit?.notes || "");
  const [isActive, setIsActive] = useState(shopToEdit ? shopToEdit.isActive : true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedId = shopId.trim().toUpperCase();
    const trimmedName = name.trim();

    if (!trimmedId) {
      setErrorMessage("Shop ID is required.");
      return;
    }

    if (!trimmedName) {
      setErrorMessage("Shop Name is required.");
      return;
    }

    if (!shopToEdit && !isShopIdUnique(trimmedId)) {
      setErrorMessage(`Shop ID "${trimmedId}" is already registered. Please provide a unique ID.`);
      return;
    }

    const finalArea = area === "Custom" ? customArea.trim() || "General Route" : area;

    const result = saveShop({
      id: trimmedId,
      name: trimmedName,
      ownerName: ownerName.trim(),
      phone: phone.trim(),
      address: address.trim(),
      area: finalArea,
      notes: notes.trim(),
      isActive,
      isNew: !shopToEdit,
    });

    if (result.success && result.shop) {
      onSaved(result.shop);
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to save shop.");
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

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-1">
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Shop ID <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={!!shopToEdit}
            value={shopId}
            onChange={(e) => setShopId(e.target.value)}
            placeholder="e.g. SHP-101"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg font-mono uppercase text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Shop Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Metro Supermarket"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Owner / Contact Person
          </label>
          <input
            type="text"
            value={ownerName}
            onChange={(e) => setOwnerName(e.target.value)}
            placeholder="e.g. Sunil Agarwal"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Mobile / WhatsApp Number
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. +91 98220 55112"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Area / Delivery Route
        </label>
        <select
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        >
          {DEFAULT_DELIVERY_AREAS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
          <option value="Custom">+ Other Delivery Route</option>
        </select>
        {area === "Custom" && (
          <input
            type="text"
            value={customArea}
            onChange={(e) => setCustomArea(e.target.value)}
            placeholder="Enter custom delivery area or route"
            className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        )}
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Store Address / Landmark
        </label>
        <textarea
          rows={2}
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Shop No, Street, Landmark for delivery driver..."
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-800 mb-1">
          Delivery Schedule & Billing Notes
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. 30-day payment term, morning drop-off before 11 AM..."
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <div className="flex items-center gap-2 pt-1">
          <input
            type="checkbox"
            id="shop-active-toggle"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="shop-active-toggle" className="text-xs text-slate-700 cursor-pointer">
            Active Client (Can place wholesale orders and receive dispatches)
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
          {shopToEdit ? "Save Changes" : "Register Shop"}
        </button>
      </div>
    </form>
  );
}

export function ShopFormModal({
  isOpen,
  onClose,
  shopToEdit,
  onSaved,
}: ShopFormModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={shopToEdit ? `Edit Shop: ${shopToEdit.name}` : "Register Retail Shop Account"}
      subtitle="Onboard a retail store, grocery, or convenience outlet for wholesale deliveries."
      maxWidth="md"
    >
      <ShopFormContent
        key={shopToEdit?.id ?? "new"}
        shopToEdit={shopToEdit}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
