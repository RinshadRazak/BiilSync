export type StandardUnit =
  | "Piece"
  | "Packet"
  | "Box"
  | "Case"
  | "Kilogram"
  | "Gram"
  | "Litre"
  | "Bottle"
  | "Carton"
  | string;

export const DEFAULT_UNITS: StandardUnit[] = [
  "Piece",
  "Packet",
  "Box",
  "Case",
  "Kilogram",
  "Gram",
  "Litre",
  "Bottle",
  "Carton",
];

export const DEFAULT_CATEGORIES: string[] = [
  "Beverages",
  "Snacks & Biscuits",
  "Grains & Pulses",
  "Spices & Masalas",
  "Edible Oils & Ghee",
  "Dairy & Packaged Goods",
  "Personal Care",
  "Cleaning & Hygiene",
  "Confectionery",
  "General Wholesale",
];

export interface ProductSupplierMapping {
  supplierId: string;
  supplierName: string;
  supplierPrice: number; // Negotiated purchase price from this specific supplier
  supplierProductCode?: string; // Optional supplier SKU
  notes?: string;
}

export interface Product {
  id: string; // e.g., PRD-1001
  name: string;
  sku: string; // Unique SKU/code
  category: string;
  unit: StandardUnit;
  purchasePrice: number; // Default purchase cost (in INR)
  sellingPrice: number; // Default wholesale selling price (in INR)
  supplierMappings: ProductSupplierMapping[];
  imageUrl?: string; // Downloadable / display URL for product image
  imageStoragePath?: string; // Firebase Storage bucket path e.g. "products/PRD-1001/..."
  imageUpdatedAt?: string; // ISO string
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Supplier {
  id: string; // e.g., SUP-2001
  name: string;
  contactPerson: string;
  phone: string;
  address: string;
  notes?: string;
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export interface Shop {
  id: string; // e.g., SHP-3001 (Unique shop identifier)
  name: string;
  ownerName: string;
  phone: string;
  address: string;
  area: string; // Delivery route / area
  notes?: string;
  isActive: boolean;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
}

export const DEFAULT_DELIVERY_AREAS: string[] = [
  "Route 1 — Central Downtown",
  "Route 2 — East Industrial Hub",
  "Route 3 — North Suburbs & Market",
  "Route 4 — South Commercial Belt",
  "Route 5 — West Highway Corridor",
];

/* ==========================================================
   ORDER DATA MODEL (PHASE 3)
   ========================================================== */

export type OrderStatus = "Draft" | "Submitted" | "Cancelled";

export interface OrderItem {
  productId: string;
  productName: string; // Snapshot at time of order creation
  sku: string; // Snapshot
  unit: StandardUnit; // Snapshot
  sellingPrice: number; // Snapshot (in INR)
  quantity: number; // Positive number (> 0)
  lineTotal: number; // sellingPrice * quantity
}

export interface Order {
  id: string; // Unique internal ID, e.g. ORD-1792391000-abcd
  orderNumber: string; // Human-readable, e.g. BS-20261019-001
  shopId: string;
  shopName: string; // Snapshot
  shopArea?: string; // Route snapshot
  shopPhone?: string; // Phone snapshot
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number; // in INR
  grandTotal: number; // in INR (equal to subtotal)
  notes?: string; // Delivery / wholesale notes
}

/* ==========================================================
   PURCHASE PLANNING & DEMAND AGGREGATION (PHASE 4)
   ========================================================== */

export interface ProductDemand {
  productId: string;
  productName: string; // From master if available, else from order snapshot
  sku: string; // From master if available, else from order snapshot
  unit: StandardUnit; // From master if available, else from order snapshot
  demandQuantity: number; // Total quantity requested across Submitted orders
  orderCount: number; // Number of distinct Submitted orders
  shopCount: number; // Number of distinct retail shops requesting this
  orderNumbers: string[]; // Order reference numbers e.g. ["BS-20261019-001"]
  isMasterMissing: boolean; // True if product ID does not exist in master catalog
  isMasterInactive: boolean; // True if product exists but is marked inactive
  availableMappings: ProductSupplierMapping[]; // Mapped suppliers for this product
}

export interface PurchasePlanItemState {
  productId: string;
  selectedSupplierId?: string; // Stored user supplier choice
  customQuantity?: number; // Custom purchase quantity override (if adjusted)
}

export interface PurchasePlanStorage {
  version: number;
  items: Record<string, PurchasePlanItemState>; // keyed by productId
  updatedAt: string;
}

export interface PlannedPurchaseItem {
  demand: ProductDemand;
  selectedSupplier?: Supplier;
  selectedMapping?: ProductSupplierMapping;
  plannedQuantity: number; // customQuantity ?? demand.demandQuantity
  supplierPrice: number | null; // from selectedMapping.supplierPrice or null
  estimatedTotal: number | null; // plannedQuantity * supplierPrice or null
  hasSupplier: boolean;
  hasMappingsAvailable: boolean;
  isStaleSupplier: boolean; // Selected supplier is no longer mapped or inactive
}

export interface SupplierPurchaseSummary {
  supplier: Supplier;
  items: PlannedPurchaseItem[];
  totalEstimatedCost: number;
  unitBreakdown: Record<string, number>; // Packaging unit -> total count e.g. "Kilogram": 25
}

/* ==========================================================
   AUTHENTICATION & USER ROLES (PHASE 6)
   ========================================================== */

export type UserRole = "admin" | "sales_staff";

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthUserSession {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  isAnonymous?: boolean;
}

/* ==========================================================
   INVOICE DATA MODEL (PHASE 6)
   ========================================================== */

export type InvoiceStatus = "Issued" | "Cancelled";

export interface InvoiceItem {
  productId: string;
  productName: string;
  sku: string;
  unit: StandardUnit;
  quantity: number;
  unitPrice: number; // sellingPrice snapshot in INR
  lineTotal: number;
}

export interface Invoice {
  id: string; // e.g. INV-1792391000-abcd
  invoiceNumber: string; // Human-readable sequence: INV-YYYYMMDD-XXX
  orderId: string;
  orderNumber: string;
  orderDate: string; // ISO string of order
  createdAt: string; // ISO string of invoice generation
  updatedAt: string;
  status: InvoiceStatus;

  // Business Snapshot
  businessName: string;
  businessAddress: string;
  businessPhone: string;
  businessEmail?: string;
  businessGstin?: string;
  businessLogoUrl?: string;

  // Customer / Shop Snapshot
  shopId: string;
  shopName: string;
  shopAddress?: string;
  shopArea?: string;
  shopPhone?: string;
  shopGstin?: string;

  // Items & Calculations
  items: InvoiceItem[];
  subtotal: number;
  discountAmount?: number;
  taxAmount?: number; // 0 if non-tax/unregistered
  grandTotal: number;

  notes?: string;
  footerNotes?: string;
}

/* ==========================================================
   BUSINESS SETTINGS (PHASE 6)
   ========================================================== */

export interface BusinessSettings {
  businessName: string;
  businessAddress: string;
  phone: string;
  email: string;
  gstin?: string;
  logoUrl?: string;
  invoiceFooterText?: string;
  updatedAt: string;
}

/* ==========================================================
   DATA MIGRATION (PHASE 6)
   ========================================================== */

export interface MigrationSummary {
  productsCount: number;
  suppliersCount: number;
  shopsCount: number;
  ordersCount: number;
  hasLocalData: boolean;
}

