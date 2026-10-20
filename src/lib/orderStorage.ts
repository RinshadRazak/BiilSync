import { useSyncExternalStore } from "react";
import { Order, OrderItem, OrderStatus } from "@/types";

const ORDERS_KEY = "billsync_orders_v1";

// In-memory cache for referential stability with useSyncExternalStore
let cachedOrders: Order[] | null = null;
const emptyOrders: Order[] = [];

/**
 * Safe local storage reader
 */
function safeGet<T>(key: string, defaultValue: T): T {
  if (typeof window === "undefined") {
    return defaultValue;
  }
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (error) {
    console.error(`Failed to read ${key} from localStorage:`, error);
    return defaultValue;
  }
}

/**
 * Safe local storage writer
 */
function safeSet<T>(key: string, value: T): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    cachedOrders = value as unknown as Order[];
    window.dispatchEvent(new Event("billsync_order_storage_update"));
    return true;
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage:`, error);
    return false;
  }
}

export function subscribeToOrders(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    cachedOrders = safeGet<Order[]>(ORDERS_KEY, []);
    callback();
  };

  window.addEventListener("billsync_order_storage_update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("billsync_order_storage_update", handler);
    window.removeEventListener("storage", handler);
  };
}

/**
 * Helper to round financial amounts in INR to 2 decimal places avoiding floating point imprecision
 */
export function roundToTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Generate human-readable, collision-safe Order Number: BS-YYYYMMDD-XXX
 */
export function generateOrderNumber(date: Date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const datePrefix = `BS-${yyyy}${mm}${dd}-`;

  const orders = getOrders();
  let maxSeq = 0;

  for (const o of orders) {
    if (o.orderNumber && o.orderNumber.startsWith(datePrefix)) {
      const part = o.orderNumber.slice(datePrefix.length);
      const seq = parseInt(part, 10);
      if (!isNaN(seq) && seq > maxSeq) {
        maxSeq = seq;
      }
    }
  }

  const nextSeq = String(maxSeq + 1).padStart(3, "0");
  return `${datePrefix}${nextSeq}`;
}

export function getOrders(): Order[] {
  if (cachedOrders === null) {
    cachedOrders = safeGet<Order[]>(ORDERS_KEY, []);
  }
  return cachedOrders;
}

export function useOrders(): Order[] {
  return useSyncExternalStore(
    subscribeToOrders,
    getOrders,
    () => emptyOrders
  );
}

export function getOrderById(id: string): Order | undefined {
  const orders = getOrders();
  return orders.find((o) => o.id === id);
}

export interface SaveOrderInput {
  id?: string; // If editing an existing Draft order
  shopId: string;
  shopName: string;
  shopArea?: string;
  shopPhone?: string;
  status: OrderStatus; // "Draft" or "Submitted"
  items: OrderItem[];
  notes?: string;
}

export function saveOrder(input: SaveOrderInput): {
  success: boolean;
  order?: Order;
  error?: string;
} {
  const orders = [...getOrders()];

  // Validate Shop
  if (!input.shopId || !input.shopName) {
    return { success: false, error: "A valid retail shop must be selected for the order." };
  }

  // Validate Items
  if (!input.items || input.items.length === 0) {
    return { success: false, error: "At least one product item is required in the order." };
  }

  // Validate each item
  const sanitizedItems: OrderItem[] = [];
  let calculatedSubtotal = 0;

  for (let i = 0; i < input.items.length; i++) {
    const item = input.items[i];
    if (!item.productId || !item.productName) {
      return { success: false, error: `Item #${i + 1} is missing valid product details.` };
    }

    if (typeof item.quantity !== "number" || isNaN(item.quantity) || item.quantity <= 0) {
      return { success: false, error: `Item "${item.productName}" must have a quantity greater than zero.` };
    }

    if (typeof item.sellingPrice !== "number" || isNaN(item.sellingPrice) || item.sellingPrice < 0) {
      return { success: false, error: `Item "${item.productName}" has an invalid selling price.` };
    }

    const lineTotal = roundToTwoDecimals(item.sellingPrice * item.quantity);
    calculatedSubtotal += lineTotal;

    sanitizedItems.push({
      productId: item.productId,
      productName: item.productName,
      sku: item.sku,
      unit: item.unit,
      sellingPrice: item.sellingPrice,
      quantity: item.quantity,
      lineTotal,
    });
  }

  const grandTotal = roundToTwoDecimals(calculatedSubtotal);
  const now = new Date().toISOString();

  if (input.id) {
    // Updating an existing order
    const index = orders.findIndex((o) => o.id === input.id);
    if (index === -1) {
      return { success: false, error: "Order record not found to update." };
    }

    const existing = orders[index];

    // Cannot edit a cancelled order or submitted order directly through draft editor
    if (existing.status === "Cancelled") {
      return { success: false, error: "Cancelled orders cannot be modified." };
    }

    const updatedOrder: Order = {
      ...existing,
      shopId: input.shopId,
      shopName: input.shopName,
      shopArea: input.shopArea || existing.shopArea,
      shopPhone: input.shopPhone || existing.shopPhone,
      items: sanitizedItems,
      subtotal: grandTotal,
      grandTotal,
      status: input.status,
      notes: input.notes !== undefined ? input.notes.trim() : existing.notes,
      updatedAt: now,
    };

    orders[index] = updatedOrder;
    safeSet(ORDERS_KEY, orders);
    return { success: true, order: updatedOrder };
  } else {
    // Creating new order
    const newId = `ORD-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const orderNumber = generateOrderNumber();

    const newOrder: Order = {
      id: newId,
      orderNumber,
      shopId: input.shopId,
      shopName: input.shopName,
      shopArea: input.shopArea,
      shopPhone: input.shopPhone,
      createdAt: now,
      updatedAt: now,
      status: input.status,
      items: sanitizedItems,
      subtotal: grandTotal,
      grandTotal,
      notes: input.notes ? input.notes.trim() : undefined,
    };

    // Prepend new orders so newest comes first
    orders.unshift(newOrder);
    safeSet(ORDERS_KEY, orders);
    return { success: true, order: newOrder };
  }
}

export function cancelOrder(id: string): {
  success: boolean;
  order?: Order;
  error?: string;
} {
  const orders = [...getOrders()];
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    return { success: false, error: "Order not found." };
  }

  if (orders[index].status === "Cancelled") {
    return { success: false, error: "Order is already cancelled." };
  }

  const updatedOrder: Order = {
    ...orders[index],
    status: "Cancelled",
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updatedOrder;
  safeSet(ORDERS_KEY, orders);
  return { success: true, order: updatedOrder };
}

export function submitDraftOrder(id: string): {
  success: boolean;
  order?: Order;
  error?: string;
} {
  const orders = [...getOrders()];
  const index = orders.findIndex((o) => o.id === id);
  if (index === -1) {
    return { success: false, error: "Order not found." };
  }

  if (orders[index].status !== "Draft") {
    return { success: false, error: "Only Draft orders can be submitted." };
  }

  const updatedOrder: Order = {
    ...orders[index],
    status: "Submitted",
    updatedAt: new Date().toISOString(),
  };

  orders[index] = updatedOrder;
  safeSet(ORDERS_KEY, orders);
  return { success: true, order: updatedOrder };
}

export function loadDemoOrders(): void {
  const now = new Date().toISOString();
  const demoOrders: Order[] = [
    {
      id: "ORD-DEMO-001",
      orderNumber: "BS-20261019-001",
      shopId: "SHP-3001",
      shopName: "Metro Supermarket",
      shopArea: "Route 1 — Central Downtown",
      shopPhone: "+91 98220 55112",
      createdAt: now,
      updatedAt: now,
      status: "Submitted",
      items: [
        {
          productId: "PRD-1001",
          productName: "Royal Basmati Rice 5kg",
          sku: "RBR-5KG-01",
          unit: "Bag",
          sellingPrice: 495,
          quantity: 10,
          lineTotal: 4950,
        },
        {
          productId: "PRD-1002",
          productName: "Classic Masala Tea 500g",
          sku: "CMT-500G-02",
          unit: "Packet",
          sellingPrice: 225,
          quantity: 20,
          lineTotal: 4500,
        },
      ],
      subtotal: 9450,
      grandTotal: 9450,
      notes: "Morning dock delivery before 10 AM. Invoice to Sunil Agarwal.",
    },
    {
      id: "ORD-DEMO-002",
      orderNumber: "BS-20261019-002",
      shopId: "SHP-3002",
      shopName: "Sunrise Provision Store",
      shopArea: "Route 2 — East Industrial Hub",
      shopPhone: "+91 97654 33210",
      createdAt: now,
      updatedAt: now,
      status: "Draft",
      items: [
        {
          productId: "PRD-1005",
          productName: "Pure Mustard Oil 1L",
          sku: "PMO-1L-05",
          unit: "Bottle",
          sellingPrice: 160,
          quantity: 15,
          lineTotal: 2400,
        },
      ],
      subtotal: 2400,
      grandTotal: 2400,
      notes: "Draft requisition awaiting phone confirmation from Govind.",
    },
  ];

  safeSet(ORDERS_KEY, demoOrders);
}

export function clearAllOrders(): void {
  safeSet(ORDERS_KEY, []);
}
