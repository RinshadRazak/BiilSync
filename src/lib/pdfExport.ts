import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Order, PlannedPurchaseItem, SupplierPurchaseSummary } from "@/types";
import { getReportFilename } from "./exportUtils";

function formatPdfCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rs. 0.00";
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Common header and footer decorator for Bill Sync PDF reports
 */
function addPdfBrandingHeader(
  doc: jsPDF,
  title: string,
  filterSummary: string
) {
  const pageWidth = doc.internal.pageSize.getWidth();

  // Top Accent Bar
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 4, "F");

  // Brand Name
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text("Bill Sync", 14, 13);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139); // Slate-500
  doc.text("B2B Wholesale Distribution Order Management", 42, 13);

  // Document Title
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.text(title, 14, 21);

  // Generation timestamp and active filter info
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const nowStr = `Generated: ${new Date().toLocaleString("en-IN")} • ${filterSummary}`;
  doc.text(nowStr, 14, 27);

  // Horizontal divider
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.setLineWidth(0.4);
  doc.line(14, 29, pageWidth - 14, 29);
}

/**
 * Decorates all pages with page numbers and confidential footer notice
 */
function addPdfPageNumbers(doc: jsPDF) {
  const totalPages = doc.getNumberOfPages();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184); // Slate-400

    doc.text(
      "Bill Sync Wholesale Management • Confidential Commercial Report",
      14,
      pageHeight - 8
    );

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 8);
  }
}

/**
 * Generates and downloads PDF for Orders Report.
 */
export function exportOrdersToPDF(orders: Order[], filterDescription: string = "All orders"): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addPdfBrandingHeader(doc, "Wholesale Orders Sales & Audit Report", filterDescription);

  // Flatten orders into line items
  const tableRows: Array<Array<string>> = [];
  let totalVolume = 0;
  let totalUnits = 0;

  for (const order of orders) {
    for (const item of order.items) {
      tableRows.push([
        order.orderNumber,
        new Date(order.createdAt).toLocaleDateString("en-IN"),
        order.shopName,
        item.productName,
        item.sku,
        item.unit,
        item.quantity.toString(),
        formatPdfCurrency(item.sellingPrice),
        formatPdfCurrency(item.lineTotal),
        order.status,
      ]);
      totalUnits += item.quantity;
      totalVolume += item.lineTotal;
    }
  }

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "Order #",
        "Date",
        "Retail Shop",
        "Product Name",
        "SKU",
        "Packaging",
        "Qty",
        "Selling Price",
        "Line Total",
        "Status",
      ],
    ],
    body: tableRows,
    foot: [
      [
        "Total",
        "",
        `${orders.length} order(s)`,
        "",
        "",
        "",
        totalUnits.toString(),
        "",
        formatPdfCurrency(totalVolume),
        "",
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Deep blue
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
      halign: "left",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 26 }, // Order #
      1: { cellWidth: 20 }, // Date
      2: { cellWidth: 40 }, // Shop Name
      3: { cellWidth: 50 }, // Product Name
      4: { cellWidth: 24 }, // SKU
      5: { cellWidth: 20 }, // Packaging
      6: { cellWidth: 16, halign: "right" }, // Qty
      7: { cellWidth: 26, halign: "right" }, // Price
      8: { cellWidth: 26, halign: "right" }, // Line Total
      9: { cellWidth: 20, halign: "center" }, // Status
    },
    margin: { top: 32, bottom: 14, left: 14, right: 14 },
    showHead: "everyPage",
  });

  addPdfPageNumbers(doc);
  doc.save(getReportFilename("Orders", "pdf"));
}

/**
 * Generates and downloads PDF for Master Purchase List Report.
 */
export function exportMasterPurchaseToPDF(
  items: PlannedPurchaseItem[],
  grandTotal: number,
  filterDescription: string = "All products with demand"
): void {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  addPdfBrandingHeader(
    doc,
    "Master Purchase Requisition Plan",
    filterDescription
  );

  const tableRows: Array<Array<string>> = items.map((item) => [
    item.demand.productName,
    item.demand.sku,
    item.demand.unit,
    item.demand.demandQuantity.toString(),
    item.plannedQuantity.toString(),
    item.hasSupplier && item.selectedSupplier ? item.selectedSupplier.name : "Unassigned",
    item.supplierPrice !== null ? formatPdfCurrency(item.supplierPrice) : "N/A",
    item.estimatedTotal !== null ? formatPdfCurrency(item.estimatedTotal) : "Unpriced",
    item.hasSupplier ? "Assigned" : "Needs Vendor",
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "Product Name",
        "SKU",
        "Unit",
        "Shop Demand",
        "Planned Purchase",
        "Assigned Vendor",
        "Negotiated Price",
        "Estimated Line Total",
        "Status",
      ],
    ],
    body: tableRows,
    foot: [
      [
        "Summary",
        "",
        `${items.length} product(s)`,
        "",
        "",
        "",
        "Grand Estimated Total:",
        formatPdfCurrency(grandTotal),
        "",
      ],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 7.5,
      textColor: [30, 41, 59],
      cellPadding: 2.2,
    },
    footStyles: {
      fillColor: [241, 245, 249],
      textColor: [15, 23, 42],
      fontSize: 8,
      fontStyle: "bold",
    },
    columnStyles: {
      0: { cellWidth: 55 }, // Product Name
      1: { cellWidth: 26 }, // SKU
      2: { cellWidth: 20 }, // Unit
      3: { cellWidth: 24, halign: "right" }, // Shop Demand
      4: { cellWidth: 26, halign: "right" }, // Planned Purchase
      5: { cellWidth: 45 }, // Assigned Vendor
      6: { cellWidth: 26, halign: "right" }, // Negotiated Price
      7: { cellWidth: 28, halign: "right" }, // Estimated Line Total
      8: { cellWidth: 22, halign: "center" }, // Status
    },
    margin: { top: 32, bottom: 14, left: 14, right: 14 },
    showHead: "everyPage",
  });

  addPdfPageNumbers(doc);
  doc.save(getReportFilename("Master_Purchase", "pdf"));
}

/**
 * Generates and downloads PDF for Supplier-wise Purchase Report.
 */
export function exportSupplierPurchaseToPDF(
  summaries: SupplierPurchaseSummary[],
  unassigned: PlannedPurchaseItem[],
  grandTotal: number,
  filterDescription: string = "All mapped suppliers"
): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  addPdfBrandingHeader(
    doc,
    "Supplier Purchase Requisitions Summary",
    filterDescription
  );

  let currentY = 32;

  // Render a block per supplier
  for (const s of summaries) {
    const unitBreakdownStr = Object.entries(s.unitBreakdown)
      .map(([u, q]) => `${q} ${u}s`)
      .join(", ");

    const bodyRows = s.items.map((item) => [
      item.demand.productName,
      item.demand.sku,
      item.demand.unit,
      item.plannedQuantity.toString(),
      item.supplierPrice !== null ? formatPdfCurrency(item.supplierPrice) : "-",
      item.estimatedTotal !== null ? formatPdfCurrency(item.estimatedTotal) : "-",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          {
            content: `Vendor: ${s.supplier.name}  |  Contact: ${s.supplier.contactPerson || "-"} (${s.supplier.phone || "-"})`,
            colSpan: 6,
            styles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
          },
        ],
        ["Product Name", "SKU", "Unit", "Planned Qty", "Vendor Unit Cost", "Line Total"],
      ],
      body: bodyRows,
      foot: [
        [
          `Units: ${unitBreakdownStr}`,
          "",
          "",
          "",
          "Vendor PO Subtotal:",
          formatPdfCurrency(s.totalEstimatedCost),
        ],
      ],
      theme: "striped",
      headStyles: {
        fillColor: [51, 65, 85], // Slate-700
        textColor: 255,
        fontSize: 7.5,
        fontStyle: "bold",
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
        cellPadding: 2,
      },
      footStyles: {
        fillColor: [241, 245, 249],
        textColor: [15, 23, 42],
        fontSize: 8,
        fontStyle: "bold",
      },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 26 },
        2: { cellWidth: 22 },
        3: { cellWidth: 22, halign: "right" },
        4: { cellWidth: 26, halign: "right" },
        5: { cellWidth: 26, halign: "right" },
      },
      margin: { top: 32, bottom: 14, left: 14, right: 14 },
    });

    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY;
    currentY = (finalY || currentY) + 8;

    // Check if new page needed
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    }
  }

  // Unassigned section if applicable
  if (unassigned.length > 0) {
    const unassignedRows = unassigned.map((u) => [
      u.demand.productName,
      u.demand.sku,
      u.demand.unit,
      u.demand.demandQuantity.toString(),
      `${u.demand.availableMappings.length} mappings ready`,
      "Needs Assignment",
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [
        [
          {
            content: `Unassigned Demand (${unassigned.length} products requiring supplier assignment)`,
            colSpan: 6,
            styles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold", fontSize: 8.5 },
          },
        ],
        ["Product Name", "SKU", "Unit", "Demand Qty", "Mappings Available", "Status"],
      ],
      body: unassignedRows,
      theme: "striped",
      headStyles: {
        fillColor: [180, 83, 9],
        textColor: 255,
        fontSize: 7.5,
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [30, 41, 59],
      },
      margin: { top: 32, bottom: 14, left: 14, right: 14 },
    });
  }

  addPdfPageNumbers(doc);
  doc.save(getReportFilename("Supplier_Purchase", "pdf"));
}
