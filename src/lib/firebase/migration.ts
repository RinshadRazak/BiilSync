"use client";

import { db, isFirebaseConfigured } from "./config";
import { doc, getDoc, writeBatch } from "firebase/firestore";
import { Product, Supplier, Shop, Order, Invoice } from "@/types";
import { getBusinessSettings } from "./settingsRepo";

export interface MigrationSummary {
  productsCount: number;
  suppliersCount: number;
  shopsCount: number;
  ordersCount: number;
  invoicesCount: number;
  hasSettings: boolean;
  totalRecords: number;
}

export interface MigrationResult {
  success: boolean;
  message: string;
  totalMigrated: number;
  skippedCount: number;
  errors: string[];
  counts: {
    products: number;
    suppliers: number;
    shops: number;
    orders: number;
    invoices: number;
    settings: boolean;
  };
}

/**
 * Scan LocalStorage and calculate record counts available for cloud migration
 */
export function getLocalMigrationSummary(): MigrationSummary {
  if (typeof window === "undefined") {
    return {
      productsCount: 0,
      suppliersCount: 0,
      shopsCount: 0,
      ordersCount: 0,
      invoicesCount: 0,
      hasSettings: false,
      totalRecords: 0,
    };
  }

  const parseCount = (key: string) => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return 0;
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.length : 0;
    } catch {
      return 0;
    }
  };

  const productsCount = parseCount("billsync_products_v1");
  const suppliersCount = parseCount("billsync_suppliers_v1");
  const shopsCount = parseCount("billsync_shops_v1");
  const ordersCount = parseCount("billsync_orders_v1");
  const invoicesCount = parseCount("billsync_invoices_v1");
  const hasSettings = !!window.localStorage.getItem("billsync_business_settings_v1");

  return {
    productsCount,
    suppliersCount,
    shopsCount,
    ordersCount,
    invoicesCount,
    hasSettings,
    totalRecords: productsCount + suppliersCount + shopsCount + ordersCount + invoicesCount,
  };
}

/**
 * Export and trigger download of complete LocalStorage snapshot JSON
 */
export function downloadLocalStorageBackup(): { success: boolean; filename?: string; error?: string } {
  if (typeof window === "undefined") {
    return { success: false, error: "Cannot access window in SSR context" };
  }

  try {
    const backupData = {
      system: "Bill Sync Wholesale Distribution",
      version: "1.0.0",
      exportedAt: new Date().toISOString(),
      data: {
        products: JSON.parse(window.localStorage.getItem("billsync_products_v1") || "[]"),
        suppliers: JSON.parse(window.localStorage.getItem("billsync_suppliers_v1") || "[]"),
        shops: JSON.parse(window.localStorage.getItem("billsync_shops_v1") || "[]"),
        orders: JSON.parse(window.localStorage.getItem("billsync_orders_v1") || "[]"),
        invoices: JSON.parse(window.localStorage.getItem("billsync_invoices_v1") || "[]"),
        purchasePlan: JSON.parse(window.localStorage.getItem("billsync_purchase_plan_v1") || "{}"),
        businessSettings: JSON.parse(window.localStorage.getItem("billsync_business_settings_v1") || "null"),
      },
    };

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const now = new Date();
    const dateStamp = now.toISOString().split("T")[0];
    const timeStamp = now.toTimeString().split(" ")[0].replace(/:/g, "-");
    const filename = `billsync_backup_${dateStamp}_${timeStamp}.json`;

    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", jsonString);
    downloadAnchor.setAttribute("download", filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();

    return { success: true, filename };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate backup";
    return { success: false, error: message };
  }
}

/**
 * Safely migrate LocalStorage records to Cloud Firestore.
 * - Requires explicit admin invocation
 * - Idempotent: checks for existing documents by ID to prevent duplicate imports
 * - Uses Firestore batched writes
 * - Does not delete local records automatically
 */
export async function migrateLocalStorageToFirestore(
  onProgress?: (status: string) => void
): Promise<MigrationResult> {
  const result: MigrationResult = {
    success: false,
    message: "",
    totalMigrated: 0,
    skippedCount: 0,
    errors: [],
    counts: {
      products: 0,
      suppliers: 0,
      shops: 0,
      orders: 0,
      invoices: 0,
      settings: false,
    },
  };

  if (!isFirebaseConfigured() || !db) {
    result.message =
      "Firebase is not configured with live credentials in .env.local. Migration requires an active Firebase Cloud project.";
    result.errors.push("Missing NEXT_PUBLIC_FIREBASE_* environment variables.");
    return result;
  }

  try {
    onProgress?.("Reading local records...");
    const products: Product[] = JSON.parse(window.localStorage.getItem("billsync_products_v1") || "[]");
    const suppliers: Supplier[] = JSON.parse(window.localStorage.getItem("billsync_suppliers_v1") || "[]");
    const shops: Shop[] = JSON.parse(window.localStorage.getItem("billsync_shops_v1") || "[]");
    const orders: Order[] = JSON.parse(window.localStorage.getItem("billsync_orders_v1") || "[]");
    const invoices: Invoice[] = JSON.parse(window.localStorage.getItem("billsync_invoices_v1") || "[]");
    const settings = getBusinessSettings();

    onProgress?.("Initiating Firestore transaction batch...");
    let batch = writeBatch(db);
    let opCount = 0;

    const commitBatchIfNeeded = async () => {
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db!);
        opCount = 0;
      }
    };

    // 1. Migrate Products
    onProgress?.(`Checking ${products.length} products...`);
    for (const prod of products) {
      try {
        const ref = doc(db, "products", prod.id);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          result.skippedCount++;
        } else {
          batch.set(ref, {
            ...prod,
            migratedAt: new Date().toISOString(),
          });
          opCount++;
          result.counts.products++;
          result.totalMigrated++;
          await commitBatchIfNeeded();
        }
      } catch (err: unknown) {
        result.errors.push(`Product ${prod.name} (${prod.sku}): ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 2. Migrate Suppliers
    onProgress?.(`Checking ${suppliers.length} suppliers...`);
    for (const sup of suppliers) {
      try {
        const ref = doc(db, "suppliers", sup.id);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          result.skippedCount++;
        } else {
          batch.set(ref, {
            ...sup,
            migratedAt: new Date().toISOString(),
          });
          opCount++;
          result.counts.suppliers++;
          result.totalMigrated++;
          await commitBatchIfNeeded();
        }
      } catch (err: unknown) {
        result.errors.push(`Supplier ${sup.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 3. Migrate Shops
    onProgress?.(`Checking ${shops.length} shops...`);
    for (const sh of shops) {
      try {
        const ref = doc(db, "shops", sh.id);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          result.skippedCount++;
        } else {
          batch.set(ref, {
            ...sh,
            migratedAt: new Date().toISOString(),
          });
          opCount++;
          result.counts.shops++;
          result.totalMigrated++;
          await commitBatchIfNeeded();
        }
      } catch (err: unknown) {
        result.errors.push(`Shop ${sh.name}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 4. Migrate Orders
    onProgress?.(`Checking ${orders.length} orders...`);
    for (const ord of orders) {
      try {
        const ref = doc(db, "orders", ord.id);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          result.skippedCount++;
        } else {
          batch.set(ref, {
            ...ord,
            migratedAt: new Date().toISOString(),
          });
          opCount++;
          result.counts.orders++;
          result.totalMigrated++;
          await commitBatchIfNeeded();
        }
      } catch (err: unknown) {
        result.errors.push(`Order ${ord.orderNumber}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 5. Migrate Invoices
    onProgress?.(`Checking ${invoices.length} invoices...`);
    for (const inv of invoices) {
      try {
        const ref = doc(db, "invoices", inv.id);
        const existing = await getDoc(ref);
        if (existing.exists()) {
          result.skippedCount++;
        } else {
          batch.set(ref, {
            ...inv,
            migratedAt: new Date().toISOString(),
          });
          opCount++;
          result.counts.invoices++;
          result.totalMigrated++;
          await commitBatchIfNeeded();
        }
      } catch (err: unknown) {
        result.errors.push(`Invoice ${inv.invoiceNumber}: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // 6. Migrate Business Settings
    try {
      const ref = doc(db, "settings", "business");
      batch.set(ref, {
        ...settings,
        migratedAt: new Date().toISOString(),
      }, { merge: true });
      opCount++;
      result.counts.settings = true;
      result.totalMigrated++;
    } catch (err: unknown) {
      result.errors.push(`Business Settings: ${err instanceof Error ? err.message : String(err)}`);
    }

    // Commit remaining operations
    if (opCount > 0) {
      onProgress?.("Committing batch writes to Firestore...");
      await batch.commit();
    }

    result.success = result.errors.length === 0;
    result.message = result.success
      ? `Migration complete: ${result.totalMigrated} record(s) synced to cloud, ${result.skippedCount} already existed.`
      : `Migration completed with ${result.errors.length} error(s). ${result.totalMigrated} record(s) synced.`;

    onProgress?.(result.message);
    return result;
  } catch (err: unknown) {
    result.success = false;
    result.message = err instanceof Error ? err.message : "Fatal error during cloud migration.";
    result.errors.push(result.message);
    return result;
  }
}
