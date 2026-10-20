"use client";

import React, { useState, useMemo, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useShops, useProducts } from "@/lib/storage";
import { saveOrder, getOrderById } from "@/lib/orderStorage";
import { formatCurrency } from "@/lib/formatters";
import { ProductImage } from "@/components/products/ProductImage";
import { Shop, Product, OrderItem } from "@/types";
import {
  Store,
  Package,
  Plus,
  Minus,
  Trash2,
  ArrowLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Send,
  Navigation,
} from "lucide-react";

function NewOrderContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get("draftId");

  const allShops = useShops();
  const allProducts = useProducts();

  // Active filters
  const activeShops = useMemo(() => allShops.filter((s) => s.isActive), [allShops]);
  const activeProducts = useMemo(() => allProducts.filter((p) => p.isActive), [allProducts]);

  // Load existing draft if editing
  const existingDraft = useMemo(() => {
    if (!draftId) return null;
    const order = getOrderById(draftId);
    if (order && order.status === "Draft") {
      return order;
    }
    return null;
  }, [draftId]);

  // Form states
  const [selectedShop, setSelectedShop] = useState<Shop | null>(() => {
    if (existingDraft) {
      const match = allShops.find((s) => s.id === existingDraft.shopId);
      if (match) return match;
      return {
        id: existingDraft.shopId,
        name: existingDraft.shopName,
        ownerName: "",
        phone: existingDraft.shopPhone || "",
        address: "",
        area: existingDraft.shopArea || "",
        isActive: true,
        createdAt: "",
        updatedAt: "",
      };
    }
    return null;
  });

  const [orderItems, setOrderItems] = useState<OrderItem[]>(() => {
    if (existingDraft) {
      return existingDraft.items.map((item) => ({ ...item }));
    }
    return [];
  });

  const [notes, setNotes] = useState(() => existingDraft?.notes || "");

  // Shop selector modal/search state
  const [shopSearch, setShopSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Filtered shops for selector
  const filteredShops = useMemo(() => {
    const q = shopSearch.toLowerCase().trim();
    if (!q) return activeShops;
    return activeShops.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.id.toLowerCase().includes(q) ||
        s.area.toLowerCase().includes(q) ||
        s.phone.toLowerCase().includes(q)
    );
  }, [activeShops, shopSearch]);

  // Filtered products for selector
  const filteredProducts = useMemo(() => {
    const q = productSearch.toLowerCase().trim();
    if (!q) return activeProducts;
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
    );
  }, [activeProducts, productSearch]);

  // Totals
  const grandTotal = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.lineTotal, 0);
  }, [orderItems]);

  const totalQuantity = useMemo(() => {
    return orderItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [orderItems]);

  // Handle adding product
  const handleAddProduct = (product: Product) => {
    setErrorMessage(null);

    // Check if product is already in the order
    const existingIndex = orderItems.findIndex((item) => item.productId === product.id);

    if (existingIndex !== -1) {
      // Merge / Increment quantity
      const updated = [...orderItems];
      const existing = updated[existingIndex];
      const newQty = existing.quantity + 1;
      const lineTotal = Math.round((existing.sellingPrice * newQty + Number.EPSILON) * 100) / 100;
      updated[existingIndex] = {
        ...existing,
        quantity: newQty,
        lineTotal,
      };
      setOrderItems(updated);
    } else {
      // Snapshot price and details from active product
      const lineTotal = Math.round((product.sellingPrice * 1 + Number.EPSILON) * 100) / 100;
      const newItem: OrderItem = {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        unit: product.unit,
        sellingPrice: product.sellingPrice,
        quantity: 1,
        lineTotal,
      };
      setOrderItems([...orderItems, newItem]);
    }
    setProductSearch("");
  };

  const handleUpdateQuantity = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) return;
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.productId === productId) {
          const lineTotal = Math.round((item.sellingPrice * newQuantity + Number.EPSILON) * 100) / 100;
          return {
            ...item,
            quantity: newQuantity,
            lineTotal,
          };
        }
        return item;
      })
    );
  };

  const handleRemoveItem = (productId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== productId));
  };

  const handleSaveOrder = (targetStatus: "Draft" | "Submitted") => {
    if (isSubmitting) return;
    setErrorMessage(null);

    if (!selectedShop) {
      setErrorMessage("Please select a retail shop account for this wholesale order.");
      return;
    }

    if (orderItems.length === 0) {
      setErrorMessage("Please add at least one product item to the order.");
      return;
    }

    // Validate quantities
    for (const item of orderItems) {
      if (!item.quantity || item.quantity <= 0) {
        setErrorMessage(`Quantity for "${item.productName}" must be at least 1.`);
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const result = saveOrder({
        id: existingDraft?.id,
        shopId: selectedShop.id,
        shopName: selectedShop.name,
        shopArea: selectedShop.area,
        shopPhone: selectedShop.phone,
        status: targetStatus,
        items: orderItems,
        notes: notes.trim(),
      });

      if (result.success && result.order) {
        router.push(`/orders/${result.order.id}`);
      } else {
        setErrorMessage(result.error || "Failed to save order.");
        setIsSubmitting(false);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      setErrorMessage(message);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Back button */}
      <div className="flex items-center justify-between">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Wholesale Orders</span>
        </Link>

        {existingDraft && (
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            Editing Draft: {existingDraft.orderNumber}
          </span>
        )}
      </div>

      {/* Page Title */}
      <div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
          {existingDraft ? `Edit Draft Order: ${existingDraft.orderNumber}` : "Create New Wholesale Order"}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Select client retail shop, pick catalog products with locked historical price snapshots, and dispatch order.
        </p>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs sm:text-sm text-rose-800 flex items-start gap-3 animate-in fade-in">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{errorMessage}</div>
        </div>
      )}

      {/* STEP 1: Select Retail Shop */}
      <section className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              1
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Retail Shop Account <span className="text-rose-500">*</span>
            </h3>
          </div>

          {selectedShop && (
            <button
              type="button"
              onClick={() => setSelectedShop(null)}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline"
            >
              Change Shop
            </button>
          )}
        </div>

        {selectedShop ? (
          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm sm:text-base">
                    {selectedShop.name}
                  </h4>
                  <span className="text-[10px] font-mono bg-white text-blue-700 font-semibold px-1.5 py-0.5 rounded border border-blue-200">
                    {selectedShop.id}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-slate-600">
                  {selectedShop.ownerName && <span>Owner: {selectedShop.ownerName}</span>}
                  {selectedShop.phone && <span>Phone: {selectedShop.phone}</span>}
                  <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                    <Navigation className="w-3 h-3 text-blue-500" />
                    {selectedShop.area}
                  </span>
                </div>
              </div>
            </div>

            <div className="self-end sm:self-center">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Active Account
              </span>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={shopSearch}
                onChange={(e) => setShopSearch(e.target.value)}
                placeholder="Search active shops by name, ID, phone, or route..."
                className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {filteredShops.length === 0 ? (
              <p className="text-xs text-slate-500 italic p-3 text-center bg-slate-50 rounded-lg">
                No active retail shops found matching &quot;{shopSearch}&quot;.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
                {filteredShops.map((shop) => (
                  <button
                    key={shop.id}
                    type="button"
                    onClick={() => {
                      setSelectedShop(shop);
                      setShopSearch("");
                    }}
                    className="p-3 text-left rounded-lg border border-slate-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 group-hover:text-blue-700 truncate">
                          {shop.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {shop.id}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                        {shop.area}
                      </p>
                    </div>
                    {shop.phone && (
                      <span className="text-[10px] text-slate-400 mt-2 block">
                        {shop.phone}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </section>

      {/* STEP 2: Add Products */}
      <section className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
              2
            </div>
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Order Products & Items <span className="text-rose-500">*</span>
            </h3>
          </div>
          <span className="text-xs text-slate-500 font-medium">
            {orderItems.length} lines • {totalQuantity} total units
          </span>
        </div>

        {/* Product Search Box */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Search & Add Active Catalog Products:
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search product name, SKU, or category to add to order..."
              className="w-full pl-9 pr-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Product Quick-picker Dropdown / List */}
          {productSearch.trim().length > 0 && (
            <div className="border border-slate-200 rounded-xl bg-white shadow-lg max-h-60 overflow-y-auto divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No active products match &quot;{productSearch}&quot;.
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 flex items-center justify-between hover:bg-blue-50/50 transition-colors gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <ProductImage src={p.imageUrl} alt={p.name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                          {p.name}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                          <span className="font-mono text-slate-400">{p.sku}</span>
                          <span>•</span>
                          <span>{p.category}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-700">Per {p.unit}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="font-bold text-xs sm:text-sm text-blue-600 block">
                          {formatCurrency(p.sellingPrice)}
                        </span>
                        <span className="text-[10px] text-slate-400">selling price</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddProduct(p)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Current Order Items Table / Cards */}
        {orderItems.length === 0 ? (
          <div className="border border-dashed border-slate-200 rounded-xl p-8 text-center text-slate-400 text-xs sm:text-sm space-y-2">
            <Package className="w-8 h-8 text-slate-300 mx-auto" />
            <p>No products added to this order yet.</p>
            <p className="text-[11px] text-slate-400">
              Use the search box above to pick products from the active catalog.
            </p>
          </div>
        ) : (
          <div className="border border-slate-200 rounded-xl overflow-hidden bg-white">
            {/* Desktop Table View */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-left text-xs sm:text-sm border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3 px-4">Item & SKU</th>
                    <th className="py-3 px-4 text-center">Unit</th>
                    <th className="py-3 px-4 text-right">Selling Price (₹)</th>
                    <th className="py-3 px-4 text-center">Quantity</th>
                    <th className="py-3 px-4 text-right">Line Total (₹)</th>
                    <th className="py-3 px-4 text-center">Remove</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {orderItems.map((item) => (
                    <tr key={item.productId} className="hover:bg-slate-50/60">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <ProductImage
                            src={allProducts.find((p) => p.id === item.productId)?.imageUrl}
                            alt={item.productName}
                            size="xs"
                          />
                          <div>
                            <span className="font-semibold text-slate-900 block">{item.productName}</span>
                            <span className="font-mono text-[11px] text-slate-400">{item.sku}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap text-slate-600 font-medium">
                        {item.unit}
                      </td>
                      <td className="py-3 px-4 text-right whitespace-nowrap font-medium text-slate-700">
                        {formatCurrency(item.sellingPrice)}
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                            disabled={item.quantity <= 1}
                            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-slate-700"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val) && val > 0) {
                                handleUpdateQuantity(item.productId, val);
                              }
                            }}
                            className="w-14 text-center py-1 bg-white border border-slate-300 rounded text-xs font-bold text-slate-900"
                          />
                          <button
                            type="button"
                            onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                            className="w-7 h-7 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.lineTotal)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.productId)}
                          className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                          title="Remove item from order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Touch Cards View (Screen < 640px) */}
            <div className="sm:hidden divide-y divide-slate-100">
              {orderItems.map((item) => (
                <div key={item.productId} className="p-3 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-semibold text-slate-900 text-xs block leading-tight">
                        {item.productName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400">
                        {item.sku} • {item.unit}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-500 font-medium">
                      Rate: {formatCurrency(item.sellingPrice)}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity - 1)}
                        disabled={item.quantity <= 1}
                        className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="font-bold text-slate-900 w-8 text-center">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.productId, item.quantity + 1)}
                        className="w-7 h-7 rounded bg-slate-100 flex items-center justify-center"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <span className="font-bold text-slate-900 text-xs">
                      {formatCurrency(item.lineTotal)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Totals Summary Footer */}
            <div className="bg-slate-50/90 border-t border-slate-200 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs text-slate-500">
                Line total = saved selling price snapshot × quantity. No hidden taxes or surcharge.
              </div>
              <div className="flex items-baseline justify-between sm:justify-end gap-4 text-right">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Grand Total (INR):
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-blue-700">
                  {formatCurrency(grandTotal)}
                </span>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* STEP 3: Delivery Notes */}
      <section className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs space-y-2">
        <label className="block text-xs font-semibold text-slate-800">
          Delivery Instructions & Wholesale Order Notes (Optional)
        </label>
        <textarea
          rows={2}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Deliver before 11 AM; check seal on bags; credit period 15 days..."
          className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        />
      </section>

      {/* STEP 4: Actions Bar */}
      <div className="p-4 bg-white rounded-xl border border-slate-200/90 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <Link
          href="/orders"
          className="w-full sm:w-auto px-4 py-2.5 text-center text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl transition-colors"
        >
          Cancel
        </Link>

        <div className="flex flex-col sm:flex-row items-center gap-2.5 w-full sm:w-auto">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveOrder("Draft")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs sm:text-sm font-semibold transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4 text-slate-600" />
            <span>Save as Draft</span>
          </button>

          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSaveOrder("Submitted")}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>Submit Wholesale Order</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default function NewOrderPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-500 text-sm">
          Loading order creation form...
        </div>
      }
    >
      <NewOrderContent />
    </Suspense>
  );
}
