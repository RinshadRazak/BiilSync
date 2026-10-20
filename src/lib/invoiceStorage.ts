"use client";

import { useSyncExternalStore } from "react";
import { Order, Invoice, InvoiceItem, BusinessSettings } from "@/types";
import { getBusinessSettings } from "./firebase/settingsRepo";
import { db, isFirebaseConfigured } from "./firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";

const INVOICES_KEY = "billsync_invoices_v1";

let cachedInvoices: Invoice[] | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function safeGet(): Invoice[] {
  if (typeof window === "undefined") return [];
  if (cachedInvoices) return cachedInvoices;

  try {
    const raw = window.localStorage.getItem(INVOICES_KEY);
    if (raw) {
      cachedInvoices = JSON.parse(raw);
      return cachedInvoices!;
    }
  } catch (err) {
    console.warn("Error reading invoices from localStorage:", err);
  }

  cachedInvoices = [];
  return [];
}

function safeSet(invoices: Invoice[]): void {
  if (typeof window === "undefined") return;
  cachedInvoices = invoices;
  try {
    window.localStorage.setItem(INVOICES_KEY, JSON.stringify(invoices));
  } catch (err) {
    console.warn("Error writing invoices to localStorage:", err);
  }
  notify();
}

export function subscribeToInvoices(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getInvoices(): Invoice[] {
  return safeGet();
}

export function getInvoiceByOrderId(orderId: string): Invoice | undefined {
  const invoices = getInvoices();
  return invoices.find((inv) => inv.orderId === orderId && inv.status !== "Cancelled");
}

export function getInvoiceById(id: string): Invoice | undefined {
  const invoices = getInvoices();
  return invoices.find((inv) => inv.id === id);
}

/**
 * Generate unique, collision-safe Invoice Number: INV-YYYYMMDD-XXX
 */
export function generateInvoiceNumber(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const datePrefix = `INV-${yyyy}${mm}${dd}-`;

  const invoices = getInvoices();
  let maxSeq = 0;

  for (const inv of invoices) {
    if (inv.invoiceNumber && inv.invoiceNumber.startsWith(datePrefix)) {
      const part = inv.invoiceNumber.slice(datePrefix.length);
      const seq = parseInt(part, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `${datePrefix}${nextSeq}`;
}

/**
 * Generates an immutable official invoice snapshot for a Submitted wholesale order.
 * Strictly idempotent: returns existing invoice if one was already issued for this order.
 */
export async function generateInvoiceForOrder(
  order: Order,
  customSettings?: BusinessSettings
): Promise<{ success: boolean; invoice?: Invoice; error?: string }> {
  // Only eligible Submitted orders can receive invoices
  if (order.status !== "Submitted") {
    return {
      success: false,
      error: `Invoices can only be generated for "Submitted" orders. Current order status: "${order.status}".`,
    };
  }

  // Idempotency: Check if an active invoice already exists locally
  const existing = getInvoiceByOrderId(order.id);
  if (existing) {
    return { success: true, invoice: existing };
  }

  // Idempotency: Check Firestore if cloud is configured
  if (isFirebaseConfigured() && db) {
    try {
      const snap = await getDoc(doc(db, "invoices", `inv_order_${order.id}`));
      if (snap.exists()) {
        const cloudInv = snap.data() as Invoice;
        const localList = getInvoices();
        if (!localList.some((i) => i.id === cloudInv.id)) {
          safeSet([...localList, cloudInv]);
        }
        return { success: true, invoice: cloudInv };
      }
    } catch (err) {
      console.warn("Could not check cloud invoice:", err);
    }
  }

  const settings = customSettings || getBusinessSettings();
  const now = new Date();
  const invoiceNumber = generateInvoiceNumber(now);
  const invoiceId = `INV-${now.getTime()}-${Math.random().toString(36).substring(2, 6)}`;

  // Create immutable item snapshots from order historical pricing
  const invoiceItems: InvoiceItem[] = order.items.map((item) => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.sku,
    unit: item.unit,
    quantity: item.quantity,
    unitPrice: item.sellingPrice,
    lineTotal: item.lineTotal,
  }));

  const invoice: Invoice = {
    id: invoiceId,
    invoiceNumber,
    orderId: order.id,
    orderNumber: order.orderNumber,
    orderDate: order.createdAt,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    status: "Issued",

    // Business Snapshot
    businessName: settings.businessName || "Bill Sync Wholesale Distribution",
    businessAddress: settings.businessAddress || "Central Wholesale Hub",
    businessPhone: settings.phone || "-",
    businessEmail: settings.email || undefined,
    businessGstin: settings.gstin || undefined,
    businessLogoUrl: settings.logoUrl || undefined,

    // Customer Snapshot
    shopId: order.shopId,
    shopName: order.shopName,
    shopAddress: order.shopArea || undefined,
    shopArea: order.shopArea || undefined,
    shopPhone: order.shopPhone || undefined,

    // Financial Calculation (Safe non-tax subtotal & grand total)
    items: invoiceItems,
    subtotal: order.subtotal,
    discountAmount: 0,
    taxAmount: 0, // Non-taxable unless configured with explicit tax audit workflow
    grandTotal: order.grandTotal,

    notes: order.notes || undefined,
    footerNotes: settings.invoiceFooterText || undefined,
  };

  // 1. Save locally
  const allInvoices = [...getInvoices(), invoice];
  safeSet(allInvoices);

  // 2. Sync to Firestore if cloud is configured
  if (isFirebaseConfigured() && db) {
    try {
      // Store using order-linked ID to prevent duplicate generation across multiple devices
      await setDoc(doc(db, "invoices", `inv_order_${order.id}`), invoice);
      await setDoc(doc(db, "invoices", invoice.id), invoice);
    } catch (err) {
      console.warn("Could not sync invoice to cloud:", err);
    }
  }

  return { success: true, invoice };
}

export function useInvoices(): Invoice[] {
  return useSyncExternalStore(
    subscribeToInvoices,
    getInvoices,
    () => []
  );
}

export function useOrderInvoice(orderId: string): Invoice | undefined {
  const invoices = useInvoices();
  return invoices.find((inv) => inv.orderId === orderId && inv.status !== "Cancelled");
}
