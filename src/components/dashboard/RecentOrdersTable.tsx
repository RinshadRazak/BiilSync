"use client";

import React from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  ExternalLink,
  PlusCircle,
  Package,
} from "lucide-react";
import { useOrders } from "@/lib/orderStorage";
import { formatCurrency, formatDateTime } from "@/lib/formatters";

export function RecentOrdersTable() {
  const realOrders = useOrders();
  const hasRealOrders = realOrders.length > 0;
  const recentOrders = realOrders.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Submitted":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Submitted
          </span>
        );
      case "Draft":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <Clock className="w-3.5 h-3.5" />
            Draft
          </span>
        );
      case "Cancelled":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-300">
            <XCircle className="w-3.5 h-3.5" />
            Cancelled
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <section className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
      {/* Table Header */}
      <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Recent Wholesale Orders
            </h2>
            {hasRealOrders ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                Live Records ({realOrders.length})
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200">
                Awaiting First Order
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time wholesale orders booked for retail shops with preserved pricing
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/orders/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-2xs transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Order</span>
          </Link>

          <Link
            href="/orders"
            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
          >
            <span>View all</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Content */}
      {!hasRealOrders ? (
        <div className="p-8 text-center text-slate-500 space-y-3">
          <Package className="w-8 h-8 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-800">
            No wholesale orders recorded yet.
          </p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Create your first wholesale order using active client shops and catalog products.
          </p>
          <div className="pt-2">
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create Order</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-150 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4 sm:px-6">Order Number</th>
                <th className="py-3 px-4">Retail Shop</th>
                <th className="py-3 px-4 hidden md:table-cell">Ordered At</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Grand Total (₹)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 sm:px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {recentOrders.map((order) => (
                <tr
                  key={order.id}
                  className="hover:bg-slate-50/80 transition-colors group"
                >
                  <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900 whitespace-nowrap">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex items-center gap-2 group-hover:text-blue-600 font-mono"
                    >
                      <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-colors shrink-0" />
                      <span>{order.orderNumber}</span>
                    </Link>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-slate-900 truncate max-w-[180px] sm:max-w-xs">
                      {order.shopName}
                    </div>
                    {order.shopArea && (
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px] sm:max-w-xs">
                        {order.shopArea}
                      </div>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap hidden md:table-cell text-xs">
                    {formatDateTime(order.createdAt)}
                  </td>

                  <td className="py-3.5 px-4 text-center font-medium whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs">
                      {order.items.length} lines ({order.items.reduce((s, i) => s + i.quantity, 0)} units)
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                    {formatCurrency(order.grandTotal)}
                  </td>

                  <td className="py-3.5 px-4 text-center whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>

                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <Link
                      href={`/orders/${order.id}`}
                      className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer */}
      {hasRealOrders && (
        <div className="p-3.5 bg-slate-50/50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>
            Showing {recentOrders.length} of {realOrders.length} orders from localStorage.
          </span>
          <span className="font-semibold text-slate-700">
            Recent Orders Volume: {formatCurrency(recentOrders.reduce((sum, o) => sum + o.grandTotal, 0))}
          </span>
        </div>
      )}
    </section>
  );
}
