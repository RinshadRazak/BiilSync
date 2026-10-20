import {
  Order,
  Product,
  Supplier,
  ProductDemand,
  PurchasePlanStorage,
  PlannedPurchaseItem,
  SupplierPurchaseSummary,
  ProductSupplierMapping,
} from "@/types";
import { roundToTwoDecimals } from "./orderStorage";

/**
 * Aggregates product demand from all eligible Submitted wholesale orders.
 * Draft and Cancelled orders are strictly excluded.
 */
export function aggregateDemand(
  orders: Order[],
  products: Product[],
  suppliers: Supplier[]
): ProductDemand[] {
  // Only consider orders that are Submitted
  const submittedOrders = orders.filter((o) => o.status === "Submitted");

  const demandMap = new Map<
    string,
    {
      productId: string;
      productName: string;
      sku: string;
      unit: string;
      totalQuantity: number;
      orderIds: Set<string>;
      orderNumbers: Set<string>;
      shopIds: Set<string>;
    }
  >();

  for (const order of submittedOrders) {
    if (!order.items || !Array.isArray(order.items)) continue;

    for (const item of order.items) {
      if (!item.productId) continue;

      const existing = demandMap.get(item.productId);
      if (existing) {
        existing.totalQuantity = roundToTwoDecimals(existing.totalQuantity + item.quantity);
        existing.orderIds.add(order.id);
        existing.orderNumbers.add(order.orderNumber);
        existing.shopIds.add(order.shopId);
      } else {
        demandMap.set(item.productId, {
          productId: item.productId,
          productName: item.productName || "Unknown Product",
          sku: item.sku || "N/A",
          unit: item.unit || "Piece",
          totalQuantity: roundToTwoDecimals(item.quantity),
          orderIds: new Set([order.id]),
          orderNumbers: new Set([order.orderNumber]),
          shopIds: new Set([order.shopId]),
        });
      }
    }
  }

  // Create map of products and active suppliers for quick lookup
  const productMap = new Map(products.map((p) => [p.id, p]));
  const activeSupplierMap = new Map(suppliers.filter((s) => s.isActive).map((s) => [s.id, s]));

  const result: ProductDemand[] = [];

  for (const [productId, demandData] of demandMap.entries()) {
    const productMaster = productMap.get(productId);

    let isMasterMissing = false;
    let isMasterInactive = false;
    let availableMappings: ProductSupplierMapping[] = [];

    if (!productMaster) {
      isMasterMissing = true;
    } else {
      if (!productMaster.isActive) {
        isMasterInactive = true;
      }
      // Filter product supplier mappings to only include active suppliers
      if (productMaster.supplierMappings && Array.isArray(productMaster.supplierMappings)) {
        availableMappings = productMaster.supplierMappings.filter((m) =>
          activeSupplierMap.has(m.supplierId)
        );
      }
    }

    result.push({
      productId,
      productName: productMaster ? productMaster.name : demandData.productName,
      sku: productMaster ? productMaster.sku : demandData.sku,
      unit: productMaster ? productMaster.unit : demandData.unit,
      demandQuantity: demandData.totalQuantity,
      orderCount: demandData.orderIds.size,
      shopCount: demandData.shopIds.size,
      orderNumbers: Array.from(demandData.orderNumbers),
      isMasterMissing,
      isMasterInactive,
      availableMappings,
    });
  }

  // Sort by product name for consistent presentation
  return result.sort((a, b) => a.productName.localeCompare(b.productName));
}

export interface PurchasePlanCalculationResult {
  plannedItems: PlannedPurchaseItem[];
  supplierSummaries: SupplierPurchaseSummary[];
  unassignedItems: PlannedPurchaseItem[];
  grandEstimatedTotal: number;
  totalProductsWithDemand: number;
  totalAssignedProducts: number;
  totalUnassignedProducts: number;
}

/**
 * Builds the consolidated planned purchases and supplier summaries
 * based on aggregated demand and stored user planning decisions.
 */
export function calculatePurchasePlan(
  demands: ProductDemand[],
  planStorage: PurchasePlanStorage,
  suppliers: Supplier[]
): PurchasePlanCalculationResult {
  const supplierMap = new Map(suppliers.map((s) => [s.id, s]));
  const plannedItems: PlannedPurchaseItem[] = [];
  const supplierGrouping = new Map<string, PlannedPurchaseItem[]>();
  const unassignedItems: PlannedPurchaseItem[] = [];
  let grandEstimatedTotal = 0;

  for (const demand of demands) {
    const storedItem = planStorage.items[demand.productId];
    const customQty = storedItem?.customQuantity;
    const selectedSupplierId = storedItem?.selectedSupplierId;

    // Planned quantity defaults to demandQuantity unless user explicitly set a non-negative override
    const plannedQuantity =
      customQty !== undefined && customQty !== null && !isNaN(customQty) && customQty >= 0
        ? roundToTwoDecimals(customQty)
        : demand.demandQuantity;

    let selectedSupplier: Supplier | undefined = undefined;
    let selectedMapping: ProductSupplierMapping | undefined = undefined;
    let isStaleSupplier = false;

    if (selectedSupplierId) {
      const supp = supplierMap.get(selectedSupplierId);
      const mapping = demand.availableMappings.find((m) => m.supplierId === selectedSupplierId);

      // Verify supplier is still active and mapping is still valid
      if (supp && supp.isActive && mapping) {
        selectedSupplier = supp;
        selectedMapping = mapping;
      } else {
        // The previously selected supplier is either deleted, deactivated, or unmapped from this product
        isStaleSupplier = true;
      }
    }

    const hasSupplier = !!selectedSupplier && !!selectedMapping;
    const supplierPrice = selectedMapping ? selectedMapping.supplierPrice : null;
    const estimatedTotal =
      hasSupplier && supplierPrice !== null
        ? roundToTwoDecimals(plannedQuantity * supplierPrice)
        : null;

    if (estimatedTotal !== null) {
      grandEstimatedTotal = roundToTwoDecimals(grandEstimatedTotal + estimatedTotal);
    }

    const plannedItem: PlannedPurchaseItem = {
      demand,
      selectedSupplier,
      selectedMapping,
      plannedQuantity,
      supplierPrice,
      estimatedTotal,
      hasSupplier,
      hasMappingsAvailable: demand.availableMappings.length > 0,
      isStaleSupplier,
    };

    plannedItems.push(plannedItem);

    if (hasSupplier && selectedSupplier) {
      const list = supplierGrouping.get(selectedSupplier.id) || [];
      list.push(plannedItem);
      supplierGrouping.set(selectedSupplier.id, list);
    } else {
      unassignedItems.push(plannedItem);
    }
  }

  // Build supplier summaries
  const supplierSummaries: SupplierPurchaseSummary[] = [];

  for (const [supplierId, items] of supplierGrouping.entries()) {
    const supplier = supplierMap.get(supplierId);
    if (!supplier) continue;

    let totalCost = 0;
    const unitBreakdown: Record<string, number> = {};

    for (const it of items) {
      if (it.estimatedTotal !== null) {
        totalCost = roundToTwoDecimals(totalCost + it.estimatedTotal);
      }
      const u = it.demand.unit || "Units";
      unitBreakdown[u] = roundToTwoDecimals((unitBreakdown[u] || 0) + it.plannedQuantity);
    }

    supplierSummaries.push({
      supplier,
      items,
      totalEstimatedCost: totalCost,
      unitBreakdown,
    });
  }

  // Sort supplier summaries by supplier name
  supplierSummaries.sort((a, b) => a.supplier.name.localeCompare(b.supplier.name));

  const totalAssignedProducts = plannedItems.length - unassignedItems.length;

  return {
    plannedItems,
    supplierSummaries,
    unassignedItems,
    grandEstimatedTotal,
    totalProductsWithDemand: demands.length,
    totalAssignedProducts,
    totalUnassignedProducts: unassignedItems.length,
  };
}
