import { useSyncExternalStore } from "react";
import { Product, Supplier, Shop } from "@/types";

const PRODUCTS_KEY = "billsync_products_v1";
const SUPPLIERS_KEY = "billsync_suppliers_v1";
const SHOPS_KEY = "billsync_shops_v1";

// In-memory cache for referential stability with useSyncExternalStore
let cachedProducts: Product[] | null = null;
let cachedSuppliers: Supplier[] | null = null;
let cachedShops: Shop[] | null = null;

const emptyProducts: Product[] = [];
const emptySuppliers: Supplier[] = [];
const emptyShops: Shop[] = [];

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
    if (key === PRODUCTS_KEY) cachedProducts = value as unknown as Product[];
    if (key === SUPPLIERS_KEY) cachedSuppliers = value as unknown as Supplier[];
    if (key === SHOPS_KEY) cachedShops = value as unknown as Shop[];

    window.dispatchEvent(new Event("billsync_storage_update"));
    return true;
  } catch (error) {
    console.error(`Failed to write ${key} to localStorage:`, error);
    return false;
  }
}

export function subscribeToStorage(callback: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  const handler = () => {
    // Refresh memory cache from disk
    cachedProducts = safeGet<Product[]>(PRODUCTS_KEY, []);
    cachedSuppliers = safeGet<Supplier[]>(SUPPLIERS_KEY, []);
    cachedShops = safeGet<Shop[]>(SHOPS_KEY, []);
    callback();
  };

  window.addEventListener("billsync_storage_update", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("billsync_storage_update", handler);
    window.removeEventListener("storage", handler);
  };
}

/* ==========================================================
   PRODUCT OPERATIONS & HOOK
   ========================================================== */

export function getProducts(): Product[] {
  if (cachedProducts === null) {
    cachedProducts = safeGet<Product[]>(PRODUCTS_KEY, []);
  }
  return cachedProducts;
}

export function useProducts(): Product[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getProducts,
    () => emptyProducts
  );
}

export function getProductById(id: string): Product | undefined {
  const products = getProducts();
  return products.find((p) => p.id === id);
}

export function isSkuUnique(sku: string, excludeProductId?: string): boolean {
  const normalized = sku.trim().toLowerCase();
  const products = getProducts();
  return !products.some(
    (p) => p.sku.trim().toLowerCase() === normalized && p.id !== excludeProductId
  );
}

export function saveProduct(productData: Omit<Product, "id" | "createdAt" | "updatedAt"> & { id?: string }): {
  success: boolean;
  product?: Product;
  error?: string;
} {
  const products = [...getProducts()];

  // Validate Name
  if (!productData.name || productData.name.trim().length === 0) {
    return { success: false, error: "Product name is required." };
  }

  // Validate SKU
  if (!productData.sku || productData.sku.trim().length === 0) {
    return { success: false, error: "SKU / Product Code is required." };
  }

  // Check unique SKU
  if (!isSkuUnique(productData.sku, productData.id)) {
    return { success: false, error: `SKU "${productData.sku.trim()}" is already assigned to another product.` };
  }

  // Validate Prices
  if (typeof productData.purchasePrice !== "number" || isNaN(productData.purchasePrice) || productData.purchasePrice < 0) {
    return { success: false, error: "Purchase price must be a valid non-negative number." };
  }

  if (typeof productData.sellingPrice !== "number" || isNaN(productData.sellingPrice) || productData.sellingPrice < 0) {
    return { success: false, error: "Selling price must be a valid non-negative number." };
  }

  const now = new Date().toISOString();

  if (productData.id) {
    const index = products.findIndex((p) => p.id === productData.id);
    if (index === -1) {
      return { success: false, error: "Product not found to update." };
    }

    const updatedProduct: Product = {
      ...products[index],
      ...productData,
      id: productData.id,
      updatedAt: now,
    };

    products[index] = updatedProduct;
    safeSet(PRODUCTS_KEY, products);
    return { success: true, product: updatedProduct };
  } else {
    const nextNum = products.length + 1;
    const newId = `PRD-${1000 + nextNum}`;

    const newProduct: Product = {
      ...productData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    products.push(newProduct);
    safeSet(PRODUCTS_KEY, products);
    return { success: true, product: newProduct };
  }
}

export function toggleProductStatus(id: string): { success: boolean; product?: Product; error?: string } {
  const products = [...getProducts()];
  const index = products.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, error: "Product not found." };
  }

  products[index] = {
    ...products[index],
    isActive: !products[index].isActive,
    updatedAt: new Date().toISOString(),
  };

  safeSet(PRODUCTS_KEY, products);
  return { success: true, product: products[index] };
}

export function deleteProduct(id: string): boolean {
  const products = getProducts();
  const filtered = products.filter((p) => p.id !== id);
  if (filtered.length !== products.length) {
    return safeSet(PRODUCTS_KEY, filtered);
  }
  return false;
}

/* ==========================================================
   SUPPLIER OPERATIONS & HOOK
   ========================================================== */

export function getSuppliers(): Supplier[] {
  if (cachedSuppliers === null) {
    cachedSuppliers = safeGet<Supplier[]>(SUPPLIERS_KEY, []);
  }
  return cachedSuppliers;
}

export function useSuppliers(): Supplier[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getSuppliers,
    () => emptySuppliers
  );
}

export function getSupplierById(id: string): Supplier | undefined {
  const suppliers = getSuppliers();
  return suppliers.find((s) => s.id === id);
}

export function saveSupplier(supplierData: Omit<Supplier, "id" | "createdAt" | "updatedAt"> & { id?: string }): {
  success: boolean;
  supplier?: Supplier;
  error?: string;
} {
  const suppliers = [...getSuppliers()];

  if (!supplierData.name || supplierData.name.trim().length === 0) {
    return { success: false, error: "Supplier name is required." };
  }

  const now = new Date().toISOString();

  if (supplierData.id) {
    const index = suppliers.findIndex((s) => s.id === supplierData.id);
    if (index === -1) {
      return { success: false, error: "Supplier not found to update." };
    }

    const updatedSupplier: Supplier = {
      ...suppliers[index],
      ...supplierData,
      id: supplierData.id,
      updatedAt: now,
    };

    suppliers[index] = updatedSupplier;
    safeSet(SUPPLIERS_KEY, suppliers);
    return { success: true, supplier: updatedSupplier };
  } else {
    const nextNum = suppliers.length + 1;
    const newId = `SUP-${2000 + nextNum}`;

    const newSupplier: Supplier = {
      ...supplierData,
      id: newId,
      createdAt: now,
      updatedAt: now,
    };

    suppliers.push(newSupplier);
    safeSet(SUPPLIERS_KEY, suppliers);
    return { success: true, supplier: newSupplier };
  }
}

export function toggleSupplierStatus(id: string): { success: boolean; supplier?: Supplier; error?: string } {
  const suppliers = [...getSuppliers()];
  const index = suppliers.findIndex((s) => s.id === id);
  if (index === -1) {
    return { success: false, error: "Supplier not found." };
  }

  suppliers[index] = {
    ...suppliers[index],
    isActive: !suppliers[index].isActive,
    updatedAt: new Date().toISOString(),
  };

  safeSet(SUPPLIERS_KEY, suppliers);
  return { success: true, supplier: suppliers[index] };
}

export function deleteSupplier(id: string): boolean {
  const suppliers = getSuppliers();
  const filtered = suppliers.filter((s) => s.id !== id);
  if (filtered.length !== suppliers.length) {
    return safeSet(SUPPLIERS_KEY, filtered);
  }
  return false;
}

/* ==========================================================
   SHOP OPERATIONS & HOOK
   ========================================================== */

export function getShops(): Shop[] {
  if (cachedShops === null) {
    cachedShops = safeGet<Shop[]>(SHOPS_KEY, []);
  }
  return cachedShops;
}

export function useShops(): Shop[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getShops,
    () => emptyShops
  );
}

export function getShopById(id: string): Shop | undefined {
  const shops = getShops();
  return shops.find((s) => s.id === id);
}

export function isShopIdUnique(shopId: string, currentShopInternalId?: string): boolean {
  const normalized = shopId.trim().toUpperCase();
  const shops = getShops();
  return !shops.some(
    (s) => s.id.trim().toUpperCase() === normalized && s.id !== currentShopInternalId
  );
}

export function saveShop(shopData: Omit<Shop, "createdAt" | "updatedAt"> & { isNew?: boolean }): {
  success: boolean;
  shop?: Shop;
  error?: string;
} {
  const shops = [...getShops()];

  if (!shopData.id || shopData.id.trim().length === 0) {
    return { success: false, error: "Shop ID is required and must be unique." };
  }

  if (!shopData.name || shopData.name.trim().length === 0) {
    return { success: false, error: "Shop name is required." };
  }

  const normalizedId = shopData.id.trim().toUpperCase();
  const now = new Date().toISOString();

  if (shopData.isNew) {
    if (!isShopIdUnique(normalizedId)) {
      return { success: false, error: `Shop ID "${normalizedId}" already exists. Please choose a unique ID.` };
    }

    const newShop: Shop = {
      ...shopData,
      id: normalizedId,
      createdAt: now,
      updatedAt: now,
    };

    shops.push(newShop);
    safeSet(SHOPS_KEY, shops);
    return { success: true, shop: newShop };
  } else {
    const index = shops.findIndex((s) => s.id === shopData.id);
    if (index === -1) {
      return { success: false, error: "Shop record not found to update." };
    }

    const updatedShop: Shop = {
      ...shops[index],
      ...shopData,
      id: shopData.id,
      updatedAt: now,
    };

    shops[index] = updatedShop;
    safeSet(SHOPS_KEY, shops);
    return { success: true, shop: updatedShop };
  }
}

export function toggleShopStatus(id: string): { success: boolean; shop?: Shop; error?: string } {
  const shops = [...getShops()];
  const index = shops.findIndex((p) => p.id === id);
  if (index === -1) {
    return { success: false, error: "Shop not found." };
  }

  shops[index] = {
    ...shops[index],
    isActive: !shops[index].isActive,
    updatedAt: new Date().toISOString(),
  };

  safeSet(SHOPS_KEY, shops);
  return { success: true, shop: shops[index] };
}

export function deleteShop(id: string): boolean {
  const shops = getShops();
  const filtered = shops.filter((s) => s.id !== id);
  if (filtered.length !== shops.length) {
    return safeSet(SHOPS_KEY, filtered);
  }
  return false;
}

/* ==========================================================
   OPTIONAL DEMO SAMPLE DATA (Explicit User Action Only)
   ========================================================== */

export function loadSampleDemoData(): void {
  const now = new Date().toISOString();

  const demoSuppliers: Supplier[] = [
    {
      id: "SUP-2001",
      name: "Apex FMCG Distributors",
      contactPerson: "Rajesh Kumar",
      phone: "+91 98201 44552",
      address: "Plot 42, Central Wholesale Market, Sector 18",
      notes: "Primary distributor for tea, coffee, and packaged snacks. 15-day credit period.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "SUP-2002",
      name: "Heritage Mills & Agro",
      contactPerson: "Anita Sharma",
      phone: "+91 98450 12389",
      address: "Warehouse 12, Industrial Grain Terminal, East Yard",
      notes: "Supplier of premium basmati rice, pulses, and wheat flour. Delivers on Tuesdays & Thursdays.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "SUP-2003",
      name: "Evergreen Beverage Bottlers",
      contactPerson: "Vikas Patil",
      phone: "+91 97112 88990",
      address: "Phase II Industrial Estate, GIDC Block D",
      notes: "Distributes mineral water, carbonated soft drinks, and tetra-pack juices.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const demoProducts: Product[] = [
    {
      id: "PRD-1001",
      name: "Royal Basmati Rice 5kg",
      sku: "RBR-5KG-01",
      category: "Grains & Pulses",
      unit: "Bag",
      purchasePrice: 420,
      sellingPrice: 495,
      supplierMappings: [
        {
          supplierId: "SUP-2002",
          supplierName: "Heritage Mills & Agro",
          supplierPrice: 415,
          supplierProductCode: "HMA-RBR-05",
          notes: "Tier 1 volume discount applied",
        },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PRD-1002",
      name: "Classic Masala Tea 500g",
      sku: "CMT-500G-02",
      category: "Beverages",
      unit: "Packet",
      purchasePrice: 180,
      sellingPrice: 225,
      supplierMappings: [
        {
          supplierId: "SUP-2001",
          supplierName: "Apex FMCG Distributors",
          supplierPrice: 175,
          supplierProductCode: "APX-TEA-500",
        },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PRD-1003",
      name: "Sparkle Spring Mineral Water 1L",
      sku: "SSW-1L-03",
      category: "Beverages",
      unit: "Bottle",
      purchasePrice: 11,
      sellingPrice: 16,
      supplierMappings: [
        {
          supplierId: "SUP-2003",
          supplierName: "Evergreen Beverage Bottlers",
          supplierPrice: 10.5,
          supplierProductCode: "EBB-WTR-01",
        },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PRD-1004",
      name: "Crispy Crunch Butter Biscuits 200g (Case of 24)",
      sku: "CCB-24C-04",
      category: "Snacks & Biscuits",
      unit: "Case",
      purchasePrice: 650,
      sellingPrice: 780,
      supplierMappings: [
        {
          supplierId: "SUP-2001",
          supplierName: "Apex FMCG Distributors",
          supplierPrice: 640,
        },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "PRD-1005",
      name: "Pure Mustard Oil 1L",
      sku: "PMO-1L-05",
      category: "Edible Oils & Ghee",
      unit: "Bottle",
      purchasePrice: 135,
      sellingPrice: 160,
      supplierMappings: [
        {
          supplierId: "SUP-2002",
          supplierName: "Heritage Mills & Agro",
          supplierPrice: 132,
        },
      ],
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const demoShops: Shop[] = [
    {
      id: "SHP-3001",
      name: "Metro Supermarket",
      ownerName: "Sunil Agarwal",
      phone: "+91 98220 55112",
      address: "Shop 4-6, Ground Floor, Central Plaza, Main Road",
      area: "Route 1 — Central Downtown",
      notes: "Largest retail client on Route 1. 30-day payment term. Receives morning deliveries.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "SHP-3002",
      name: "Sunrise Provision Store",
      ownerName: "Govind Mehra",
      phone: "+91 97654 33210",
      address: "14/B, Station Road, Near Old Bus Stand",
      area: "Route 2 — East Industrial Hub",
      notes: "Weekly Tuesday replenishment. Cash on delivery preference.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "SHP-3003",
      name: "Green Valley Mart",
      ownerName: "Pooja Deshmukh",
      phone: "+91 99881 22334",
      address: "Plot 88, Lake View Residency Gate, Subhash Nagar",
      area: "Route 3 — North Suburbs & Market",
      notes: "Focuses on grains, pulses, and packaged oils. Prompt online payments.",
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  safeSet(SUPPLIERS_KEY, demoSuppliers);
  safeSet(PRODUCTS_KEY, demoProducts);
  safeSet(SHOPS_KEY, demoShops);
}

export function clearAllData(): void {
  safeSet(PRODUCTS_KEY, []);
  safeSet(SUPPLIERS_KEY, []);
  safeSet(SHOPS_KEY, []);
  if (typeof window !== "undefined") {
    window.localStorage.removeItem("billsync_orders_v1");
    window.localStorage.removeItem("billsync_purchase_plan_v1");
    window.dispatchEvent(new Event("billsync_order_storage_update"));
    window.dispatchEvent(new Event("billsync_purchase_plan_storage_update"));
  }
}
