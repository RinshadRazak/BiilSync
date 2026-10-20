"use client";

import React, { useMemo } from "react";
import Link from "next/link";
import {
  Store,
  Package,
  ShoppingBag,
  Layers,
  Sparkles,
  Info,
  PlusCircle,
  Truck,
} from "lucide-react";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { StorageNoticeBanner } from "@/components/common/StorageNoticeBanner";
import { useProducts, useShops, useSuppliers } from "@/lib/storage";
import { useOrders } from "@/lib/orderStorage";
import { usePurchasePlanStorage } from "@/lib/purchasePlanStorage";
import { aggregateDemand, calculatePurchasePlan } from "@/lib/purchasePlanning";
import { formatCurrency } from "@/lib/formatters";

export default function DashboardPage() {
  const products = useProducts();
  const shops = useShops();
  const suppliers = useSuppliers();
  const orders = useOrders();
  const planStorage = usePurchasePlanStorage();

  const productCount = products.length;
  const shopCount = shops.length;

  // Calculate today's orders
  const { todayCount, todayVolume, todaySubmittedCount } = useMemo(() => {
    const now = new Date();
    const today = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    const submitted = today.filter((o) => o.status === "Submitted");
    const vol = submitted.reduce((sum, o) => sum + o.grandTotal, 0);
    return {
      todayCount: today.length,
      todayVolume: vol,
      todaySubmittedCount: submitted.length,
    };
  }, [orders]);

  // Calculate live purchase plan metrics
  const purchasePlanMetrics = useMemo(() => {
    const demands = aggregateDemand(orders, products, suppliers);
    return calculatePurchasePlan(demands, planStorage, suppliers);
  }, [orders, products, suppliers, planStorage]);

  return (
    <div className="space-y-6">
      {/* Storage Mode Notice */}
      <StorageNoticeBanner />

      {/* Demonstration Prototype Alert Banner */}
      <div className="rounded-xl bg-blue-50/80 border border-blue-200/90 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-blue-900 shadow-2xs">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-blue-600 text-white shrink-0">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <span className="font-semibold text-blue-950">
              Phase 4 Live:
            </span>{" "}
            <span>
              Purchase Planning, Demand Aggregation, and Supplier Allocation are active based on real submitted shop orders.
            </span>
          </div>
        </div>

        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-blue-200 text-blue-700 font-medium whitespace-nowrap self-stretch sm:self-auto justify-center">
          <Info className="w-3.5 h-3.5" />
          <span>Procurement Engine Online</span>
        </div>
      </div>

      {/* Hero Welcome & Quick Stats Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Distribution Operations Overview
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Real-time status of wholesale accounts, product catalogs, and order dispatching.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            href="/orders/new"
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Order</span>
          </Link>
          <Link
            href="/purchase-planning"
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-lg bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 text-xs sm:text-sm font-medium transition-colors"
          >
            <Truck className="w-4 h-4 text-slate-500" />
            <span className="hidden sm:inline">Purchase Plan</span>
          </Link>
        </div>
      </div>

      {/* 1. Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Shops"
          value={shopCount > 0 ? shopCount.toString() : "142"}
          subtext={
            shopCount > 0
              ? `${shopCount} registered retail accounts`
              : "Active retail store clients"
          }
          icon={Store}
          accentColor="blue"
          badge={{
            text: shopCount > 0 ? "Local Records" : "+8 this month",
            variant: "positive",
          }}
        />
        <MetricCard
          title="Total Products"
          value={productCount > 0 ? productCount.toString() : "1,850"}
          subtext={
            productCount > 0
              ? `${productCount} catalog SKUs in database`
              : "Catalog SKUs (8 categories)"
          }
          icon={Package}
          accentColor="indigo"
          badge={{
            text: productCount > 0 ? "Local Records" : "42 low stock",
            variant: "warning",
          }}
        />
        <MetricCard
          title="Today's Orders"
          value={orders.length > 0 ? todayCount.toString() : "38"}
          subtext={
            orders.length > 0
              ? `${formatCurrency(todayVolume)} volume today`
              : "₹24,850 wholesale volume"
          }
          icon={ShoppingBag}
          accentColor="emerald"
          badge={{
            text: orders.length > 0 ? `${todaySubmittedCount} submitted` : "29 packed",
            variant: "info",
          }}
        />
        <MetricCard
          title="Procurement Demand"
          value={
            purchasePlanMetrics.totalProductsWithDemand > 0
              ? purchasePlanMetrics.totalProductsWithDemand.toString()
              : "0"
          }
          subtext={
            purchasePlanMetrics.totalProductsWithDemand > 0
              ? `${formatCurrency(purchasePlanMetrics.grandEstimatedTotal)} est. (${
                  purchasePlanMetrics.supplierSummaries.length
                } vendors)`
              : "No submitted order demand"
          }
          icon={Layers}
          accentColor="amber"
          badge={{
            text:
              purchasePlanMetrics.totalUnassignedProducts > 0
                ? `${purchasePlanMetrics.totalUnassignedProducts} unassigned`
                : purchasePlanMetrics.totalProductsWithDemand > 0
                ? "Fully allocated"
                : "Standby",
            variant:
              purchasePlanMetrics.totalUnassignedProducts > 0
                ? "warning"
                : purchasePlanMetrics.totalProductsWithDemand > 0
                ? "positive"
                : "neutral",
          }}
        />
      </div>

      {/* 2. Quick Actions Section */}
      <QuickActions />

      {/* 3. Recent Orders Table */}
      <RecentOrdersTable />
    </div>
  );
}
