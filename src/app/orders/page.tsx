"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useOrders } from "@/lib/orderStorage";
import { formatCurrency, formatDateTime } from "@/lib/formatters";
import { OrderStatus } from "@/types";
import {
  ClipboardList,
  PlusCircle,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  Eye,
  FileText,
  Navigation,
  X,
} from "lucide-react";

export default function OrdersPage() {
  const orders = useOrders();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [dateFilter, setDateFilter] = useState<"ALL" | "TODAY" | "WEEK">("ALL");

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Search by order number or shop name
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        order.orderNumber.toLowerCase().includes(q) ||
        order.shopName.toLowerCase().includes(q) ||
        (order.shopArea && order.shopArea.toLowerCase().includes(q));

      // Status filter
      const matchesStatus =
        statusFilter === "ALL" || order.status === statusFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilter !== "ALL") {
        const orderDate = new Date(order.createdAt);
        const now = new Date();
        if (dateFilter === "TODAY") {
          matchesDate =
            orderDate.getFullYear() === now.getFullYear() &&
            orderDate.getMonth() === now.getMonth() &&
            orderDate.getDate() === now.getDate();
        } else if (dateFilter === "WEEK") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(now.getDate() - 7);
          matchesDate = orderDate >= sevenDaysAgo;
        }
      }

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [orders, searchQuery, statusFilter, dateFilter]);

  // Summary Metrics
  const totalOrdersCount = orders.length;
  const submittedOrders = orders.filter((o) => o.status === "Submitted");
  const draftOrders = orders.filter((o) => o.status === "Draft");
  const cancelledOrders = orders.filter((o) => o.status === "Cancelled");

  const totalSubmittedVolume = useMemo(() => {
    return submittedOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  }, [submittedOrders]);

  const clearAllFilters = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
    setDateFilter("ALL");
  };

  const isFiltered = searchQuery !== "" || statusFilter !== "ALL" || dateFilter !== "ALL";

  const getStatusBadge = (status: OrderStatus) => {
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
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Orders Management
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Track wholesale orders, draft bookings, and retail store deliveries with locked price snapshots.
          </p>
        </div>

        <Link
          href="/orders/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>New Order</span>
        </Link>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Orders
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalOrdersCount}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Submitted Orders
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{submittedOrders.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pending Drafts
          </span>
          <div className="text-2xl font-extrabold text-amber-600 mt-1">{draftOrders.length}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Submitted Volume
          </span>
          <div className="text-xl sm:text-2xl font-extrabold text-blue-700 mt-1 truncate">
            {formatCurrency(totalSubmittedVolume)}
          </div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col md:flex-row gap-3 items-stretch md:items-center">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by order number (BS-...), shop name, or route..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Status Filter */}
        <div className="sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | OrderStatus)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses ({totalOrdersCount})</option>
            <option value="Submitted">Submitted ({submittedOrders.length})</option>
            <option value="Draft">Draft ({draftOrders.length})</option>
            <option value="Cancelled">Cancelled ({cancelledOrders.length})</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className="sm:w-40">
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as "ALL" | "TODAY" | "WEEK")}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Dates</option>
            <option value="TODAY">Today Only</option>
            <option value="WEEK">Last 7 Days</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {isFiltered && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="inline-flex items-center justify-center gap-1 px-3 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Orders List Content */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 sm:p-12 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center mb-4 shadow-2xs">
            <ClipboardList className="w-7 h-7" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            {orders.length === 0 ? "No Wholesale Orders Placed Yet" : "No Orders Matching Filters"}
          </h3>
          <p className="mt-1.5 text-xs sm:text-sm text-slate-500 max-w-sm leading-relaxed">
            {orders.length === 0
              ? "Start booking wholesale orders for your retail shops to generate delivery slips and sales ledgers."
              : "Try clearing your search query or switching status filters."}
          </p>

          <div className="mt-6">
            <Link
              href="/orders/new"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Create New Order</span>
            </Link>
          </div>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Order Number</th>
                    <th className="py-3.5 px-4">Retail Shop</th>
                    <th className="py-3.5 px-4">Created Date</th>
                    <th className="py-3.5 px-4 text-center">Items</th>
                    <th className="py-3.5 px-4 text-right">Grand Total (₹)</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredOrders.map((order) => {
                    const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
                    return (
                      <tr
                        key={order.id}
                        className="hover:bg-slate-50/70 transition-colors group"
                      >
                        <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                          <Link
                            href={`/orders/${order.id}`}
                            className="font-mono font-bold text-slate-900 group-hover:text-blue-600 transition-colors flex items-center gap-2"
                          >
                            <FileText className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0" />
                            <span>{order.orderNumber}</span>
                          </Link>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-900 truncate max-w-xs">
                            {order.shopName}
                          </div>
                          {order.shopArea && (
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 truncate max-w-xs">
                              <Navigation className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate">{order.shopArea}</span>
                            </div>
                          )}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-xs">
                          {formatDateTime(order.createdAt)}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-xs font-medium">
                            {order.items.length} lines ({totalUnits} units)
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                          {formatCurrency(order.grandTotal)}
                        </td>

                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          {getStatusBadge(order.status)}
                        </td>

                        <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/orders/${order.id}`}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View</span>
                            </Link>

                            {order.status === "Draft" && (
                              <Link
                                href={`/orders/new?draftId=${order.id}`}
                                className="inline-flex items-center px-2 py-1 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                              >
                                Edit
                              </Link>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>
                Showing {filteredOrders.length} of {orders.length} wholesale orders
              </span>
              <span className="text-[11px] text-slate-400">
                Sorted by newest first
              </span>
            </div>
          </div>

          {/* Mobile Touch Cards View (Screen < 768px) */}
          <div className="md:hidden space-y-3">
            {filteredOrders.map((order) => {
              const totalUnits = order.items.reduce((s, i) => s + i.quantity, 0);
              return (
                <div
                  key={order.id}
                  className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <Link
                        href={`/orders/${order.id}`}
                        className="font-mono font-bold text-slate-900 text-sm hover:text-blue-600 block"
                      >
                        {order.orderNumber}
                      </Link>
                      <h4 className="font-semibold text-xs text-slate-700 mt-0.5">
                        {order.shopName}
                      </h4>
                    </div>

                    <div>{getStatusBadge(order.status)}</div>
                  </div>

                  <div className="text-xs space-y-1 pt-1 text-slate-600 border-t border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Date:</span>
                      <span>{formatDateTime(order.createdAt)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Items:</span>
                      <span>
                        {order.items.length} lines ({totalUnits} units)
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 font-bold">
                      <span className="text-slate-700">Grand Total:</span>
                      <span className="text-sm text-blue-700">
                        {formatCurrency(order.grandTotal)}
                      </span>
                    </div>
                  </div>

                  {/* Touch Action Buttons */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/orders/${order.id}`}
                      className="flex-1 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center"
                    >
                      View Details
                    </Link>

                    {order.status === "Draft" && (
                      <Link
                        href={`/orders/new?draftId=${order.id}`}
                        className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg text-center"
                      >
                        Edit Draft
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
