import * as XLSX from "xlsx";
import { Order, PlannedPurchaseItem, SupplierPurchaseSummary } from "@/types";
import { sanitizeCellString, getReportFilename } from "./exportUtils";

/**
 * Generates and downloads an Excel workbook for Orders Report.
 * Includes two worksheets: "Orders Summary" and "Order Line Items".
 */
export function exportOrdersToExcel(orders: Order[]): void {
  const wb = XLSX.utils.book_new();

  // 1. Orders Summary Worksheet
  const summaryRows = orders.map((order) => ({
    "Order Number": sanitizeCellString(order.orderNumber),
    "Date & Time": new Date(order.createdAt).toLocaleString("en-IN"),
    "Shop ID": sanitizeCellString(order.shopId),
    "Shop Name": sanitizeCellString(order.shopName),
    "Delivery Area": sanitizeCellString(order.shopArea || "-"),
    "Contact Phone": sanitizeCellString(order.shopPhone || "-"),
    "Order Status": sanitizeCellString(order.status),
    "Item Lines": order.items.length,
    "Grand Total (INR)": order.grandTotal,
    "Order Notes": sanitizeCellString(order.notes || "-"),
  }));

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = [
    { wch: 18 }, // Order Number
    { wch: 22 }, // Date & Time
    { wch: 14 }, // Shop ID
    { wch: 25 }, // Shop Name
    { wch: 20 }, // Delivery Area
    { wch: 15 }, // Contact Phone
    { wch: 12 }, // Order Status
    { wch: 12 }, // Item Lines
    { wch: 18 }, // Grand Total
    { wch: 30 }, // Order Notes
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Orders Summary");

  // 2. Order Line Items Worksheet
  const lineItemRows: Array<Record<string, unknown>> = [];
  for (const order of orders) {
    for (const item of order.items) {
      lineItemRows.push({
        "Order Number": sanitizeCellString(order.orderNumber),
        "Order Date": new Date(order.createdAt).toLocaleDateString("en-IN"),
        "Shop ID": sanitizeCellString(order.shopId),
        "Shop Name": sanitizeCellString(order.shopName),
        "Product Name": sanitizeCellString(item.productName),
        "SKU": sanitizeCellString(item.sku),
        "Packaging Unit": sanitizeCellString(item.unit),
        "Quantity": item.quantity,
        "Selling Price (INR)": item.sellingPrice,
        "Line Total (INR)": item.lineTotal,
        "Status": sanitizeCellString(order.status),
      });
    }
  }

  const wsLineItems = XLSX.utils.json_to_sheet(lineItemRows);
  wsLineItems["!cols"] = [
    { wch: 18 }, // Order Number
    { wch: 14 }, // Order Date
    { wch: 14 }, // Shop ID
    { wch: 24 }, // Shop Name
    { wch: 28 }, // Product Name
    { wch: 16 }, // SKU
    { wch: 14 }, // Packaging Unit
    { wch: 10 }, // Quantity
    { wch: 18 }, // Selling Price
    { wch: 16 }, // Line Total
    { wch: 12 }, // Status
  ];
  XLSX.utils.book_append_sheet(wb, wsLineItems, "Order Line Items");

  // Download workbook
  const filename = getReportFilename("Orders", "xlsx");
  XLSX.writeFile(wb, filename);
}

/**
 * Generates and downloads an Excel workbook for Master Purchase List.
 * Includes two worksheets: "Master Purchase List" and "Unassigned Demand".
 */
export function exportMasterPurchaseToExcel(
  items: PlannedPurchaseItem[],
  grandTotal: number
): void {
  const wb = XLSX.utils.book_new();

  // 1. Master Purchase List Worksheet
  const masterRows: Array<Record<string, unknown>> = items.map((item) => ({
    "Product Name": sanitizeCellString(item.demand.productName),
    "SKU": sanitizeCellString(item.demand.sku),
    "Packaging Unit": sanitizeCellString(item.demand.unit),
    "Shop Demand Qty": item.demand.demandQuantity,
    "Planned Purchase Qty": item.plannedQuantity,
    "Assigned Supplier": item.hasSupplier && item.selectedSupplier
      ? sanitizeCellString(item.selectedSupplier.name)
      : "Unassigned",
    "Negotiated Unit Cost (INR)": item.supplierPrice !== null ? item.supplierPrice : "N/A",
    "Estimated Line Total (INR)": item.estimatedTotal !== null ? item.estimatedTotal : "Unpriced",
    "Allocation Status": item.hasSupplier ? "Assigned" : "Needs Supplier",
  }));

  if (items.length > 0) {
    masterRows.push({
      "Product Name": "GRAND TOTAL ESTIMATE",
      "SKU": "",
      "Packaging Unit": "",
      "Shop Demand Qty": "",
      "Planned Purchase Qty": "",
      "Assigned Supplier": "",
      "Negotiated Unit Cost (INR)": "",
      "Estimated Line Total (INR)": grandTotal,
      "Allocation Status": "",
    });
  }

  const wsMaster = XLSX.utils.json_to_sheet(masterRows);
  wsMaster["!cols"] = [
    { wch: 28 }, // Product Name
    { wch: 16 }, // SKU
    { wch: 14 }, // Packaging Unit
    { wch: 16 }, // Shop Demand Qty
    { wch: 20 }, // Planned Purchase Qty
    { wch: 25 }, // Assigned Supplier
    { wch: 24 }, // Negotiated Unit Cost
    { wch: 22 }, // Estimated Line Total
    { wch: 16 }, // Allocation Status
  ];
  XLSX.utils.book_append_sheet(wb, wsMaster, "Master Purchase List");

  // 2. Unassigned Demand Worksheet
  const unassignedItems = items.filter((i) => !i.hasSupplier);
  const unassignedRows = unassignedItems.map((item) => ({
    "Product Name": sanitizeCellString(item.demand.productName),
    "SKU": sanitizeCellString(item.demand.sku),
    "Packaging Unit": sanitizeCellString(item.demand.unit),
    "Shop Demand Qty": item.demand.demandQuantity,
    "Available Mappings": item.demand.availableMappings.length,
    "Master Record Status": item.demand.isMasterMissing
      ? "Missing in Catalog"
      : item.demand.isMasterInactive
      ? "Deactivated"
      : "Active in Catalog",
  }));

  const wsUnassigned = XLSX.utils.json_to_sheet(unassignedRows);
  wsUnassigned["!cols"] = [
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 16 },
    { wch: 18 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsUnassigned, "Unassigned Demand");

  // Download workbook
  const filename = getReportFilename("Master_Purchase", "xlsx");
  XLSX.writeFile(wb, filename);
}

/**
 * Generates and downloads an Excel workbook for Supplier-wise Purchase Report.
 * Includes three worksheets: "Supplier Summary", "Purchase Items", and "Unassigned Demand".
 */
export function exportSupplierPurchaseToExcel(
  summaries: SupplierPurchaseSummary[],
  unassigned: PlannedPurchaseItem[],
  grandTotal: number
): void {
  const wb = XLSX.utils.book_new();

  // 1. Supplier Summary Worksheet
  const summaryRows: Array<Record<string, unknown>> = summaries.map((s) => {
    const unitBreakdownStr = Object.entries(s.unitBreakdown)
      .map(([u, q]) => `${q} ${u}s`)
      .join(", ");

    return {
      "Supplier Name": sanitizeCellString(s.supplier.name),
      "Contact Person": sanitizeCellString(s.supplier.contactPerson || "-"),
      "Phone": sanitizeCellString(s.supplier.phone || "-"),
      "Address": sanitizeCellString(s.supplier.address || "-"),
      "Assigned Products": s.items.length,
      "Planned Packaging Breakdown": sanitizeCellString(unitBreakdownStr),
      "Vendor PO Estimate (INR)": s.totalEstimatedCost,
    };
  });

  if (summaries.length > 0) {
    summaryRows.push({
      "Supplier Name": "GRAND TOTAL ESTIMATE",
      "Contact Person": "",
      "Phone": "",
      "Address": "",
      "Assigned Products": summaries.reduce((acc, s) => acc + s.items.length, 0),
      "Planned Packaging Breakdown": "",
      "Vendor PO Estimate (INR)": grandTotal,
    });
  }

  const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
  wsSummary["!cols"] = [
    { wch: 26 }, // Supplier Name
    { wch: 18 }, // Contact Person
    { wch: 16 }, // Phone
    { wch: 28 }, // Address
    { wch: 18 }, // Assigned Products
    { wch: 30 }, // Packaging Breakdown
    { wch: 22 }, // Vendor PO Estimate
  ];
  XLSX.utils.book_append_sheet(wb, wsSummary, "Supplier Summary");

  // 2. Purchase Line Items Worksheet
  const lineItemRows: Array<Record<string, unknown>> = [];
  for (const s of summaries) {
    for (const item of s.items) {
      lineItemRows.push({
        "Supplier Name": sanitizeCellString(s.supplier.name),
        "Product Name": sanitizeCellString(item.demand.productName),
        "SKU": sanitizeCellString(item.demand.sku),
        "Packaging Unit": sanitizeCellString(item.demand.unit),
        "Planned Purchase Qty": item.plannedQuantity,
        "Negotiated Unit Cost (INR)": item.supplierPrice !== null ? item.supplierPrice : "N/A",
        "Estimated Line Total (INR)": item.estimatedTotal !== null ? item.estimatedTotal : "N/A",
      });
    }
  }

  const wsLineItems = XLSX.utils.json_to_sheet(lineItemRows);
  wsLineItems["!cols"] = [
    { wch: 26 },
    { wch: 28 },
    { wch: 16 },
    { wch: 14 },
    { wch: 20 },
    { wch: 22 },
    { wch: 22 },
  ];
  XLSX.utils.book_append_sheet(wb, wsLineItems, "Purchase Items");

  // 3. Unassigned Demand Worksheet
  if (unassigned.length > 0) {
    const unassignedRows = unassigned.map((u) => ({
      "Product Name": sanitizeCellString(u.demand.productName),
      "SKU": sanitizeCellString(u.demand.sku),
      "Packaging Unit": sanitizeCellString(u.demand.unit),
      "Shop Demand Qty": u.demand.demandQuantity,
      "Available Mappings": u.demand.availableMappings.length,
      "Status": "Needs Supplier Assignment",
    }));

    const wsUnassigned = XLSX.utils.json_to_sheet(unassignedRows);
    wsUnassigned["!cols"] = [
      { wch: 28 },
      { wch: 16 },
      { wch: 14 },
      { wch: 16 },
      { wch: 18 },
      { wch: 26 },
    ];
    XLSX.utils.book_append_sheet(wb, wsUnassigned, "Unassigned Demand");
  }

  // Download workbook
  const filename = getReportFilename("Supplier_Purchase", "xlsx");
  XLSX.writeFile(wb, filename);
}
