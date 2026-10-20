"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useOrders, cancelOrder, submitDraftOrder } from "@/lib/orderStorage";
import { useProducts } from "@/lib/storage";
import { useOrderInvoice, generateInvoiceForOrder } from "@/lib/invoiceStorage";
import { exportInvoiceToPDF } from "@/lib/invoicePdfExport";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { ProductImage } from "@/components/products/ProductImage";
import { InvoiceModal } from "@/components/orders/InvoiceModal";
import { Invoice } from "@/types";
import {
  ArrowLeft,
  FileText,
  Store,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Edit3,
  Send,
  Navigation,
  Phone,
  Ban,
  Download,
  Receipt,
  Loader2,
} from "lucide-react";

interface OrderDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function OrderDetailsPage({ params }: OrderDetailsPageProps) {
  const router = useRouter();
  const { id } = React.use(params);
  const orders = useOrders();
  const products = useProducts();
  const existingInvoice = useOrderInvoice(id);

  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isInvoiceModalOpen, setIsInvoiceModalOpen] = useState(false);
  const [isGeneratingInvoice, setIsGeneratingInvoice] = useState(false);

  const order = orders.find((o) => o.id === id);

  if (!order) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4 text-center space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          Wholesale Order Not Found
        </h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
          The requested order ID does not exist or may have been removed from local storage.
        </p>
        <div className="pt-2">
          <Link
            href="/orders"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Orders List</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    const res = cancelOrder(order.id);
    if (res.success) {
      setActionFeedback("Order has been successfully cancelled.");
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleSubmitDraft = () => {
    const res = submitDraftOrder(order.id);
    if (res.success) {
      setActionFeedback("Draft order successfully submitted!");
      setTimeout(() => setActionFeedback(null), 3000);
    }
  };

  const handleViewInvoice = async () => {
    if (existingInvoice) {
      setSelectedInvoice(existingInvoice);
      setIsInvoiceModalOpen(true);
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const res = await generateInvoiceForOrder(order);
      if (res.success && res.invoice) {
        setSelectedInvoice(res.invoice);
        setIsInvoiceModalOpen(true);
      } else {
        setActionFeedback(res.error || "Failed to generate invoice.");
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const handleDownloadInvoicePdf = async () => {
    if (existingInvoice) {
      exportInvoiceToPDF(existingInvoice);
      return;
    }

    setIsGeneratingInvoice(true);
    try {
      const res = await generateInvoiceForOrder(order);
      if (res.success && res.invoice) {
        exportInvoiceToPDF(res.invoice);
      } else {
        setActionFeedback(res.error || "Failed to generate invoice PDF.");
        setTimeout(() => setActionFeedback(null), 4000);
      }
    } finally {
      setIsGeneratingInvoice(false);
    }
  };

  const getStatusBadge = () => {
    switch (order.status) {
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-4 h-4" />
            Submitted Order
          </span>
        );
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-4 h-4" />
            Draft (Editable)
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600 border border-slate-300">
            <XCircle className="w-4 h-4" />
            Cancelled
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Top Navigation & Feedback */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          href="/orders"
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-blue-600 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Orders</span>
        </Link>

        {actionFeedback && (
          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 animate-in fade-in">
            {actionFeedback}
          </div>
        )}
      </div>

      {/* Main Order Header Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="font-mono text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {order.orderNumber}
              </span>
              {getStatusBadge()}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Internal ID: <span className="font-mono">{order.id}</span>
            </p>
          </div>

          {/* Action Buttons based on status */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            {order.status === "Draft" && (
              <>
                <button
                  type="button"
                  onClick={() => router.push(`/orders/new?draftId=${order.id}`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors shadow-2xs"
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                  <span>Edit Draft</span>
                </button>

                <button
                  type="button"
                  onClick={handleSubmitDraft}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-colors shadow-xs"
                >
                  <Send className="w-4 h-4" />
                  <span>Submit Order</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(true)}
                  className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-medium transition-colors"
                  title="Cancel Draft Order"
                >
                  <Ban className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            )}

            {order.status === "Submitted" && (
              <>
                <button
                  type="button"
                  onClick={handleViewInvoice}
                  disabled={isGeneratingInvoice}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-colors disabled:opacity-50"
                  title="View Official Invoice"
                >
                  {isGeneratingInvoice ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                  <span>View Invoice</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadInvoicePdf}
                  disabled={isGeneratingInvoice}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50"
                  title="Download PDF Invoice"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsCancelConfirmOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Cancel</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Shop and Order Meta Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] flex items-center gap-1.5">
              <Store className="w-3.5 h-3.5 text-blue-600" />
              Retail Client Shop
            </span>
            <div className="text-sm font-bold text-slate-900">
              {order.shopName}
            </div>
            <div className="text-slate-600 flex flex-col gap-0.5 pt-0.5">
              <span>Shop ID: {order.shopId}</span>
              {order.shopArea && (
                <span className="inline-flex items-center gap-1 text-blue-700 font-medium">
                  <Navigation className="w-3 h-3 text-blue-500" />
                  {order.shopArea}
                </span>
              )}
              {order.shopPhone && (
                <span className="inline-flex items-center gap-1 text-slate-500">
                  <Phone className="w-3 h-3" />
                  {order.shopPhone}
                </span>
              )}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-1.5">
            <span className="font-semibold uppercase tracking-wider text-slate-400 text-[10px] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Timestamp & Audit
            </span>
            <div className="text-slate-700 space-y-1 pt-0.5">
              <div>
                <span className="text-slate-400">Created:</span>{" "}
                <span className="font-medium text-slate-900">{formatDateTime(order.createdAt)}</span>
              </div>
              <div>
                <span className="text-slate-400">Last Updated:</span>{" "}
                <span className="font-medium text-slate-900">{formatDateTime(order.updatedAt)}</span>
              </div>
              <div>
                <span className="text-slate-400">Total Items:</span>{" "}
                <span className="font-semibold text-slate-900">
                  {order.items.length} line items ({order.items.reduce((s, i) => s + i.quantity, 0)} units)
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Lines Snapshot Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 tracking-tight">
              Order Product Line Snapshots
            </h3>
          </div>
          <span className="text-xs text-slate-400 italic">
            Historical prices preserved
          </span>
        </div>

        {/* Table View */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Product & SKU</th>
                <th className="py-3 px-4 text-center">Packaging Unit</th>
                <th className="py-3 px-4 text-right">Saved Selling Price (₹)</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 sm:px-6 text-right">Line Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {order.items.map((item, idx) => {
                const product = products.find((p) => p.id === item.productId);
                return (
                  <tr key={`${item.productId}-${idx}`} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <ProductImage
                          src={product?.imageUrl}
                          alt={item.productName}
                          size="sm"
                        />
                        <div>
                          <span className="font-semibold text-slate-900 block leading-tight">
                            {item.productName}
                          </span>
                          <span className="font-mono text-[11px] text-slate-400">
                            {item.sku}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap text-slate-600 font-medium">
                      {item.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-medium text-slate-700">
                      {formatCurrency(item.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap font-bold text-slate-900">
                      {item.quantity}
                    </td>
                    <td className="py-3.5 px-4 sm:px-6 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatCurrency(item.lineTotal)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Total Summary Footer */}
        <div className="bg-slate-50/90 border-t border-slate-200 p-4 sm:p-5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-slate-500 text-center sm:text-left">
            Total of {order.items.length} line item(s). Calculated from preserved price snapshots.
          </div>
          <div className="flex items-baseline gap-4 text-right">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Grand Total:
            </span>
            <span className="text-xl sm:text-2xl font-extrabold text-blue-700">
              {formatCurrency(order.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Order Notes (if present) */}
      {order.notes && (
        <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-xs space-y-1.5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
            Delivery Instructions & Notes
          </h4>
          <p className="text-xs sm:text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-200/60">
            {order.notes}
          </p>
        </div>
      )}

      {/* Cancel Order Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isCancelConfirmOpen}
        onClose={() => setIsCancelConfirmOpen(false)}
        onConfirm={handleCancel}
        title="Cancel Wholesale Order"
        message={`Are you sure you want to cancel Order "${order.orderNumber}" for ${order.shopName}? The order will be marked as Cancelled and historical records will be preserved.`}
        confirmLabel="Cancel Order"
        variant="danger"
      />

      {/* Official Commercial Invoice Modal */}
      <InvoiceModal
        isOpen={isInvoiceModalOpen}
        onClose={() => setIsInvoiceModalOpen(false)}
        invoice={selectedInvoice}
      />
    </div>
  );
}
