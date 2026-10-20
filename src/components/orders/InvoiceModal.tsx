"use client";

import React, { useRef } from "react";
import { Invoice } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { exportInvoiceToPDF } from "@/lib/invoicePdfExport";
import {
  X,
  Download,
  Printer,
  FileText,
  Store,
  Calendar,
  Phone,
  Mail,
  ShieldCheck,
} from "lucide-react";

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoice: Invoice | null;
}

export function InvoiceModal({ isOpen, onClose, invoice }: InvoiceModalProps) {
  const printRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = () => {
    exportInvoiceToPDF(invoice);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white print:fixed-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Modal Header Actions (Hidden in Print) */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80 print:hidden">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                Invoice {invoice.invoiceNumber}
              </h2>
              <p className="text-[11px] text-slate-500">
                A4 Official Commercial Wholesale Invoice
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
              title="Print Invoice"
            >
              <Printer className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Print</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors"
              title="Download PDF Invoice"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors ml-1"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable A4 Document Sheet */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100/50 print:bg-white print:p-0">
          <div
            ref={printRef}
            className="bg-white rounded-xl shadow-xs border border-slate-200/90 p-6 sm:p-8 max-w-[210mm] mx-auto space-y-6 text-slate-800 print:shadow-none print:border-none print:p-0"
          >
            {/* Top Bar with Accent */}
            <div className="h-1.5 bg-blue-600 rounded-full mb-4 print:hidden" />

            {/* Document Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-5">
              <div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white font-extrabold flex items-center justify-center text-sm">
                    BS
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                    {invoice.businessName}
                  </h1>
                </div>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {invoice.businessAddress}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 mt-2">
                  {invoice.businessPhone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {invoice.businessPhone}
                    </span>
                  )}
                  {invoice.businessEmail && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="w-3 h-3 text-slate-400" />
                      {invoice.businessEmail}
                    </span>
                  )}
                  {invoice.businessGstin && (
                    <span className="inline-flex items-center gap-1 font-mono font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                      GSTIN: {invoice.businessGstin}
                    </span>
                  )}
                </div>
              </div>

              {/* Right: Invoice Meta */}
              <div className="sm:text-right flex flex-col sm:items-end">
                <span className="inline-block text-xs font-black uppercase tracking-wider text-blue-600 bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200/60 mb-2">
                  COMMERCIAL INVOICE
                </span>
                <div className="font-mono text-base sm:text-lg font-black text-slate-900">
                  {invoice.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Invoice Date:{" "}
                  <span className="font-semibold text-slate-800">
                    {new Date(invoice.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                </div>
                <div className="text-xs text-slate-500">
                  Order Ref:{" "}
                  <span className="font-mono font-semibold text-slate-800">
                    {invoice.orderNumber}
                  </span>
                </div>
              </div>
            </div>

            {/* Billed To / Order Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Store className="w-3.5 h-3.5 text-blue-600" />
                  Billed To (Retail Shop)
                </span>
                <div className="text-sm font-bold text-slate-900 pt-0.5">
                  {invoice.shopName}
                </div>
                <div className="text-xs text-slate-600 space-y-0.5">
                  {invoice.shopAddress && <div>{invoice.shopAddress}</div>}
                  {invoice.shopPhone && <div>Phone: {invoice.shopPhone}</div>}
                  {invoice.shopGstin && (
                    <div className="font-mono text-[11px] text-slate-700">
                      GSTIN: {invoice.shopGstin}
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  Dispatch & Order Record
                </span>
                <div className="text-xs text-slate-700 space-y-1 pt-0.5">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order ID:</span>
                    <span className="font-mono text-slate-800">{invoice.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Order Placed:</span>
                    <span className="font-medium text-slate-800">
                      {formatDateTime(invoice.orderDate)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Status:</span>
                    <span className="font-bold text-emerald-700">Official / Active</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Itemized Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100/90 text-slate-700 uppercase tracking-wider text-[10px] font-bold border-b border-slate-200">
                    <th className="py-2.5 px-3 text-center w-10">#</th>
                    <th className="py-2.5 px-3">Product Description</th>
                    <th className="py-2.5 px-3 text-center">Unit</th>
                    <th className="py-2.5 px-3 text-right">Selling Price</th>
                    <th className="py-2.5 px-3 text-center">Qty</th>
                    <th className="py-2.5 px-3 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-800">
                  {invoice.items.map((item, idx) => (
                    <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className="font-semibold text-slate-900 block">
                          {item.productName}
                        </span>
                        <span className="font-mono text-[10px] text-slate-400">
                          SKU: {item.sku}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium text-slate-600">
                        {item.unit}
                      </td>
                      <td className="py-2.5 px-3 text-right font-medium text-slate-700 whitespace-nowrap">
                        {formatCurrency(item.unitPrice)}
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-900">
                        {item.quantity}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(item.lineTotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals & Notes Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
              <div className="space-y-3">
                {invoice.notes && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200/70 text-xs text-slate-600 space-y-1">
                    <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400 block">
                      Order Notes & Delivery Terms:
                    </span>
                    <p className="leading-relaxed">{invoice.notes}</p>
                  </div>
                )}

                {invoice.footerNotes && (
                  <div className="text-[11px] text-slate-400 leading-relaxed italic">
                    {invoice.footerNotes}
                  </div>
                )}

                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 pt-2">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Generated from verified historical order snapshots. No retroactive price mutations.
                  </span>
                </div>
              </div>

              {/* Financial Calculation Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-semibold text-slate-900">
                    {formatCurrency(invoice.subtotal)}
                  </span>
                </div>

                {(invoice.discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Discount:</span>
                    <span>- {formatCurrency(invoice.discountAmount ?? 0)}</span>
                  </div>
                )}

                {(invoice.taxAmount ?? 0) > 0 ? (
                  <div className="flex justify-between text-slate-600">
                    <span>Taxes:</span>
                    <span>{formatCurrency(invoice.taxAmount ?? 0)}</span>
                  </div>
                ) : (
                  <div className="flex justify-between text-[11px] text-slate-400 italic">
                    <span>Taxes:</span>
                    <span>Non-taxable / Standard wholesale pricing</span>
                  </div>
                )}

                <div className="border-t border-slate-200 pt-2 flex justify-between items-baseline">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Grand Total:
                  </span>
                  <span className="text-xl font-extrabold text-blue-700">
                    {formatCurrency(invoice.grandTotal)}
                  </span>
                </div>
              </div>
            </div>

            {/* Signature Area */}
            <div className="pt-8 border-t border-slate-200/80 grid grid-cols-2 gap-8 text-center text-xs text-slate-500">
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 mx-auto max-w-[160px]" />
                <span className="block mt-1 font-medium text-[11px]">Authorized Signatory</span>
                <span className="text-[10px] text-slate-400">{invoice.businessName}</span>
              </div>
              <div>
                <div className="h-10 border-b border-dashed border-slate-300 mx-auto max-w-[160px]" />
                <span className="block mt-1 font-medium text-[11px]">Customer Acceptance</span>
                <span className="text-[10px] text-slate-400">{invoice.shopName}</span>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
