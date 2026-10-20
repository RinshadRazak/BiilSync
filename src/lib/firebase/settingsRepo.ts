"use client";

import { useSyncExternalStore } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db, isFirebaseConfigured } from "./config";
import { BusinessSettings } from "@/types";

const SETTINGS_KEY = "billsync_business_settings_v1";

export const defaultBusinessSettings: BusinessSettings = {
  businessName: "Bill Sync Wholesale Distribution",
  businessAddress: "Plot No. 42, Wholesale Mandi, Industrial Area Phase II, New Delhi - 110020",
  phone: "+91 98765 43210",
  email: "billing@billsync.local",
  gstin: "07AAAAA0000A1Z5",
  invoiceFooterText: "Thank you for your business. Payment due within 7 days. Goods once sold are covered under wholesale warranty.",
  updatedAt: new Date().toISOString(),
};

let cachedSettings: BusinessSettings | null = null;
const listeners = new Set<() => void>();

function notify() {
  for (const listener of listeners) {
    listener();
  }
}

function safeGet(): BusinessSettings {
  if (typeof window === "undefined") return defaultBusinessSettings;
  if (cachedSettings) return cachedSettings;

  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      cachedSettings = JSON.parse(raw);
      return cachedSettings!;
    }
  } catch (err) {
    console.warn("Error reading business settings:", err);
  }

  cachedSettings = defaultBusinessSettings;
  return defaultBusinessSettings;
}

function safeSet(settings: BusinessSettings): void {
  if (typeof window === "undefined") return;
  cachedSettings = settings;
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn("Error writing business settings:", err);
  }
  notify();
}

export function subscribeToBusinessSettings(callback: () => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

export function getBusinessSettings(): BusinessSettings {
  return safeGet();
}

export async function saveBusinessSettings(
  input: Partial<BusinessSettings>
): Promise<{ success: boolean; error?: string }> {
  const current = getBusinessSettings();
  const updated: BusinessSettings = {
    ...current,
    ...input,
    updatedAt: new Date().toISOString(),
  };

  // 1. Save locally
  safeSet(updated);

  // 2. Save to Firestore if configured
  if (isFirebaseConfigured() && db) {
    try {
      await setDoc(doc(db, "business_settings", "main"), updated, { merge: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sync settings to cloud.";
      console.warn("Cloud settings sync warning:", err);
      // Return success true since local persistence succeeded, but log error
      return { success: true, error: msg };
    }
  }

  return { success: true };
}

export function useBusinessSettings(): BusinessSettings {
  return useSyncExternalStore(
    subscribeToBusinessSettings,
    getBusinessSettings,
    () => defaultBusinessSettings
  );
}
