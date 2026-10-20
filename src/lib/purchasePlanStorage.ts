import { useSyncExternalStore } from "react";
import { PurchasePlanStorage, PurchasePlanItemState } from "@/types";

const PURCHASE_PLAN_KEY = "billsync_purchase_plan_v1";

const defaultPlanStorage: PurchasePlanStorage = {
  version: 1,
  items: {},
  updatedAt: new Date().toISOString(),
};

// In-memory cache for referential stability with useSyncExternalStore
let cachedPlan: PurchasePlanStorage | null = null;

function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.items && typeof parsed.items === "object") {
      return parsed as T;
    }
    return defaultValue;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage:`, error);
    return defaultValue;
  }
}

function safeSet<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    cachedPlan = value as unknown as PurchasePlanStorage;
    window.dispatchEvent(new Event("billsync_purchase_plan_storage_update"));
    return true;
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage:`, error);
    return false;
  }
}

export function subscribeToPurchasePlan(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cachedPlan = safeGet<PurchasePlanStorage>(PURCHASE_PLAN_KEY, defaultPlanStorage);
    callback();
  };

  window.addEventListener("billsync_purchase_plan_storage_update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("billsync_purchase_plan_storage_update", handler);
    window.removeEventListener("storage", handler);
  };
}

export function getPurchasePlanStorage(): PurchasePlanStorage {
  if (cachedPlan === null) {
    cachedPlan = safeGet<PurchasePlanStorage>(PURCHASE_PLAN_KEY, defaultPlanStorage);
  }
  return cachedPlan;
}

export function usePurchasePlanStorage(): PurchasePlanStorage {
  return useSyncExternalStore(
    subscribeToPurchasePlan,
    getPurchasePlanStorage,
    () => defaultPlanStorage
  );
}

/**
 * Assign or remove the chosen supplier for a product demand line
 */
export function setProductSupplier(productId: string, supplierId?: string): boolean {
  const current = getPurchasePlanStorage();
  const existingItem: PurchasePlanItemState = current.items[productId] || { productId };

  const updatedItem: PurchasePlanItemState = {
    ...existingItem,
    productId,
    selectedSupplierId: supplierId || undefined,
  };

  const updatedStorage: PurchasePlanStorage = {
    ...current,
    items: {
      ...current.items,
      [productId]: updatedItem,
    },
    updatedAt: new Date().toISOString(),
  };

  return safeSet(PURCHASE_PLAN_KEY, updatedStorage);
}

/**
 * Set custom planned purchase quantity for a product.
 * If null or undefined, resets to using the default calculated demand quantity.
 */
export function setProductPlannedQuantity(productId: string, quantity: number | null): boolean {
  const current = getPurchasePlanStorage();
  const existingItem: PurchasePlanItemState = current.items[productId] || { productId };

  const updatedItem: PurchasePlanItemState = {
    ...existingItem,
    productId,
    customQuantity: quantity !== null && quantity !== undefined && !isNaN(quantity) && quantity >= 0 ? quantity : undefined,
  };

  const updatedStorage: PurchasePlanStorage = {
    ...current,
    items: {
      ...current.items,
      [productId]: updatedItem,
    },
    updatedAt: new Date().toISOString(),
  };

  return safeSet(PURCHASE_PLAN_KEY, updatedStorage);
}

/**
 * Reset a product's plan state (removes supplier selection and custom quantity)
 */
export function resetProductPlan(productId: string): boolean {
  const current = getPurchasePlanStorage();
  if (!current.items[productId]) return true;

  const nextItems = { ...current.items };
  delete nextItems[productId];

  const updatedStorage: PurchasePlanStorage = {
    ...current,
    items: nextItems,
    updatedAt: new Date().toISOString(),
  };

  return safeSet(PURCHASE_PLAN_KEY, updatedStorage);
}

/**
 * Clear the entire purchase plan storage
 */
export function clearPurchasePlan(): boolean {
  const fresh: PurchasePlanStorage = {
    version: 1,
    items: {},
    updatedAt: new Date().toISOString(),
  };
  return safeSet(PURCHASE_PLAN_KEY, fresh);
}
