import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Invoice } from "@/types";

function formatPdfCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return "Rs. 0.00";
  return `Rs. ${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function exportInvoiceToPDF(invoice: Invoice): void {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Top Accent Bar
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 0, pageWidth, 5, "F");

  // Company Brand / Header
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42); // Slate-900
  doc.text(invoice.businessName, 14, 18);

  doc.setFontSize(8.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105); // Slate-600
  doc.text(invoice.businessAddress, 14, 23);

  const headerY = 27;
  const contactParts: string[] = [];
  if (invoice.businessPhone) contactParts.push(`Phone: ${invoice.businessPhone}`);
  if (invoice.businessEmail) contactParts.push(`Email: ${invoice.businessEmail}`);
  if (invoice.businessGstin) contactParts.push(`GSTIN: ${invoice.businessGstin}`);
  doc.text(contactParts.join("  |  "), 14, headerY);

  // Invoice Title Badge on Right
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 58, 138); // Deep blue
  const titleText = "COMMERCIAL INVOICE";
  doc.text(titleText, pageWidth - 14 - doc.getTextWidth(titleText), 18);

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(15, 23, 42);
  const invNumText = `Invoice #: ${invoice.invoiceNumber}`;
  doc.text(invNumText, pageWidth - 14 - doc.getTextWidth(invNumText), 24);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 116, 139);
  const invDateText = `Date: ${new Date(invoice.createdAt).toLocaleDateString("en-IN")}`;
  doc.text(invDateText, pageWidth - 14 - doc.getTextWidth(invDateText), 28);

  // Horizontal divider
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.4);
  doc.line(14, 32, pageWidth - 14, 32);

  // Bill To (Customer) Block vs Order Meta Block
  const blockY = 37;

  // Left Box: Bill To
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, blockY, 86, 28, 2, 2, "F");

  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("BILLED TO (RETAIL SHOP):", 18, blockY + 5);

  doc.setFontSize(9.5);
  doc.text(invoice.shopName, 18, blockY + 11);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Shop Account ID: ${invoice.shopId}`, 18, blockY + 16);
  if (invoice.shopArea) doc.text(`Delivery Route: ${invoice.shopArea}`, 18, blockY + 20);
  if (invoice.shopPhone) doc.text(`Phone: ${invoice.shopPhone}`, 18, blockY + 24);

  // Right Box: Order Metadata
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(pageWidth - 14 - 86, blockY, 86, 28, 2, 2, "F");

  const rightX = pageWidth - 14 - 82;
  doc.setFontSize(8);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(30, 41, 59);
  doc.text("ORDER & DISPATCH DETAILS:", rightX, blockY + 5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(71, 85, 105);
  doc.text(`Order Reference #: ${invoice.orderNumber}`, rightX, blockY + 11);
  doc.text(`Order Placed: ${new Date(invoice.orderDate).toLocaleDateString("en-IN")}`, rightX, blockY + 16);
  doc.text(`Fulfillment Status: Confirmed / Submitted`, rightX, blockY + 20);
  doc.text(`Invoice Status: ${invoice.status}`, rightX, blockY + 24);

  // Itemized Product Table
  const tableRows: Array<Array<string>> = invoice.items.map((item, idx) => [
    (idx + 1).toString(),
    item.productName,
    item.sku,
    item.unit,
    item.quantity.toString(),
    formatPdfCurrency(item.unitPrice),
    formatPdfCurrency(item.lineTotal),
  ]);

  autoTable(doc, {
    startY: 70,
    head: [["S.No", "Product Description", "SKU", "Unit", "Qty", "Unit Price", "Line Total"]],
    body: tableRows,
    foot: [
      ["", "Total Units & Subtotal", "", "", invoice.items.reduce((acc, i) => acc + i.quantity, 0).toString(), "", formatPdfCurrency(invoice.subtotal)],
    ],
    theme: "striped",
    headStyles: {
      fillColor: [30, 58, 138], // Deep blue
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    bodyStyles: {
      fontSize: 8,
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
      0: { cellWidth: 12, halign: "center" }, // S.No
      1: { cellWidth: 70 }, // Product Description
      2: { cellWidth: 26 }, // SKU
      3: { cellWidth: 20 }, // Unit
      4: { cellWidth: 16, halign: "right" }, // Qty
      5: { cellWidth: 24, halign: "right" }, // Unit Price
      6: { cellWidth: 24, halign: "right" }, // Line Total
    },
    margin: { top: 70, bottom: 35, left: 14, right: 14 },
    showHead: "everyPage",
  });

  const finalY =
    (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 180;

  // Financial Grand Total Box
  const summaryBoxY = finalY + 6;
  if (summaryBoxY < pageHeight - 45) {
    const sumWidth = 75;
    const sumX = pageWidth - 14 - sumWidth;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(sumX, summaryBoxY, sumWidth, 24, 2, 2, "FD");

    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("Subtotal:", sumX + 4, summaryBoxY + 6);
    doc.text(formatPdfCurrency(invoice.subtotal), sumX + sumWidth - 4, summaryBoxY + 6, { align: "right" });

    doc.text("Applicable GST / Tax:", sumX + 4, summaryBoxY + 12);
    doc.text(invoice.taxAmount ? formatPdfCurrency(invoice.taxAmount) : "N/A (Exempt)", sumX + sumWidth - 4, summaryBoxY + 12, { align: "right" });

    doc.setFontSize(9.5);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 58, 138);
    doc.text("Grand Total (INR):", sumX + 4, summaryBoxY + 19);
    doc.text(formatPdfCurrency(invoice.grandTotal), sumX + sumWidth - 4, summaryBoxY + 19, { align: "right" });

    // Optional Order Notes on Left
    if (invoice.notes) {
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(71, 85, 105);
      doc.text("Order Dispatch Notes:", 14, summaryBoxY + 6);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(100, 116, 139);
      doc.text(invoice.notes, 14, summaryBoxY + 11, { maxWidth: 95 });
    }
  }

  // Footer on all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.4);
    doc.line(14, pageHeight - 16, pageWidth - 14, pageHeight - 16);

    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(148, 163, 184);

    const footerText = invoice.footerNotes || "Thank you for your business. Generated by Bill Sync Wholesale Distribution System.";
    doc.text(footerText, 14, pageHeight - 11, { maxWidth: pageWidth - 45 });

    const pageStr = `Page ${i} of ${totalPages}`;
    doc.text(pageStr, pageWidth - 14 - doc.getTextWidth(pageStr), pageHeight - 11);
  }

  const filename = `BillSync_Invoice_${invoice.invoiceNumber}.pdf`;
  doc.save(filename);
}
