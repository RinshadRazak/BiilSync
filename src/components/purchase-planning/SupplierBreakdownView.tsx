"use client";

import React from "react";
import { SupplierPurchaseSummary, PlannedPurchaseItem } from "@/types";
import { formatCurrency } from "@/lib/formatters";
import { useProducts } from "@/lib/storage";
import { ProductImage } from "@/components/products/ProductImage";
import {
  Building2,
  Phone,
  MapPin,
  AlertTriangle,
  Truck,
} from "lucide-react";

interface SupplierBreakdownViewProps {
  supplierSummaries: SupplierPurchaseSummary[];
  unassignedItems: PlannedPurchaseItem[];
  grandEstimatedTotal: number;
  onOpenSupplierModal: (item: PlannedPurchaseItem) => void;
}

export function SupplierBreakdownView({
  supplierSummaries,
  unassignedItems,
  grandEstimatedTotal,
  onOpenSupplierModal,
}: SupplierBreakdownViewProps) {
  const products = useProducts();
  return (
    <div className="space-y-6">
      {/* Overview Reconciled Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Supplier-Wise Purchase Aggregation
            </h3>
            <p className="text-xs text-slate-500">
              Procurement breakdown organized by wholesale vendor. {supplierSummaries.length}{" "}
              supplier(s) with assigned products.
            </p>
          </div>
        </div>

        <div className="text-left sm:text-right shrink-0">
          <span className="text-[11px] font-medium text-slate-500 block">Total Plan Value</span>
          <span className="text-base sm:text-lg font-black text-slate-900">
            {formatCurrency(grandEstimatedTotal)}
          </span>
        </div>
      </div>

      {/* Supplier Groups List */}
      {supplierSummaries.length === 0 && unassignedItems.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200/90 p-8 text-center space-y-2 shadow-2xs">
          <p className="text-sm font-semibold text-slate-700">No active purchase requirements.</p>
          <p className="text-xs text-slate-400">
            Submit shop orders first to generate wholesale demand.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {supplierSummaries.map((summary) => {
            const { supplier, items, totalEstimatedCost, unitBreakdown } = summary;

            return (
              <div
                key={supplier.id}
                className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden"
              >
                {/* Supplier Header */}
                <div className="bg-slate-50/80 p-4 border-b border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-blue-600 shrink-0" />
                      <h4 className="font-bold text-slate-900 text-sm">{supplier.name}</h4>
                      <span className="text-[10px] font-semibold bg-blue-100/70 text-blue-800 px-2 py-0.5 rounded-full">
                        {items.length} {items.length === 1 ? "Product" : "Products"}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                      {supplier.contactPerson && (
                        <span>Contact: {supplier.contactPerson}</span>
                      )}
                      {supplier.phone && (
                        <span className="flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{supplier.phone}</span>
                        </span>
                      )}
                      {supplier.address && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          <span>{supplier.address}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Supplier Subtotal and Unit Breakdown */}
                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200/60">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Vendor PO Estimate
                    </span>
                    <span className="text-base sm:text-lg font-black text-blue-900">
                      {formatCurrency(totalEstimatedCost)}
                    </span>
                    {/* Packaging Units Breakdown */}
                    <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                      {Object.entries(unitBreakdown).map(([unit, qty], idx) => (
                        <span key={unit}>
                          {idx > 0 && " • "}
                          {qty} {unit}s
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Supplier Itemized Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 bg-white text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        <th className="py-2.5 px-4">Product Name & SKU</th>
                        <th className="py-2.5 px-3 text-center">Packaging</th>
                        <th className="py-2.5 px-3 text-right">Shop Demand</th>
                        <th className="py-2.5 px-3 text-right">Planned Purchase</th>
                        <th className="py-2.5 px-4 text-right">Negotiated Cost</th>
                        <th className="py-2.5 px-4 text-right">Estimated Line Total</th>
                        <th className="py-2.5 px-3 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {items.map((item) => (
                        <tr key={item.demand.productId} className="hover:bg-slate-50/50">
                          <td className="py-2.5 px-4">
                            <div className="flex items-center gap-3">
                              <ProductImage
                                src={products.find((p) => p.id === item.demand.productId)?.imageUrl}
                                alt={item.demand.productName}
                                size="sm"
                              />
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {item.demand.productName}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400">
                                  SKU: {item.demand.sku}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                              {item.demand.unit}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-right font-medium text-slate-500">
                            {item.demand.demandQuantity}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                            {item.plannedQuantity}
                          </td>
                          <td className="py-2.5 px-4 text-right font-semibold text-slate-800">
                            {item.supplierPrice !== null
                              ? formatCurrency(item.supplierPrice)
                              : "-"}
                          </td>
                          <td className="py-2.5 px-4 text-right font-bold text-slate-900">
                            {item.estimatedTotal !== null
                              ? formatCurrency(item.estimatedTotal)
                              : "-"}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={() => onOpenSupplierModal(item)}
                              className="text-[11px] text-blue-600 hover:text-blue-800 font-semibold"
                            >
                              Change
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}

          {/* Unassigned Products Section */}
          {unassignedItems.length > 0 && (
            <div className="bg-amber-50/60 rounded-xl border border-amber-200/90 shadow-2xs overflow-hidden">
              <div className="p-4 bg-amber-100/60 border-b border-amber-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <div>
                    <h4 className="font-bold text-amber-950 text-sm">
                      Unassigned Demand Lines ({unassignedItems.length})
                    </h4>
                    <p className="text-xs text-amber-800">
                      These products have active shop order demand but do not currently have an
                      assigned procurement vendor.
                    </p>
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto bg-white">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      <th className="py-2.5 px-4">Product Name & SKU</th>
                      <th className="py-2.5 px-3 text-center">Packaging</th>
                      <th className="py-2.5 px-3 text-right">Required Demand</th>
                      <th className="py-2.5 px-4">Mapping Status</th>
                      <th className="py-2.5 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {unassignedItems.map((item) => (
                      <tr key={item.demand.productId} className="hover:bg-amber-50/30">
                        <td className="py-2.5 px-4">
                          <div className="flex items-center gap-3">
                            <ProductImage
                              src={products.find((p) => p.id === item.demand.productId)?.imageUrl}
                              alt={item.demand.productName}
                              size="sm"
                            />
                            <div>
                              <span className="font-semibold text-slate-900 block">
                                {item.demand.productName}
                              </span>
                              <span className="text-[10px] font-mono text-slate-400">
                                SKU: {item.demand.sku}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[11px]">
                            {item.demand.unit}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-blue-700">
                          {item.demand.demandQuantity} {item.demand.unit}s
                        </td>
                        <td className="py-2.5 px-4">
                          {item.hasMappingsAvailable ? (
                            <span className="text-xs text-slate-600">
                              {item.demand.availableMappings.length} supplier mapping(s) ready
                            </span>
                          ) : (
                            <span className="text-xs text-rose-600 font-medium">
                              No suppliers mapped in catalog
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          <button
                            type="button"
                            onClick={() => onOpenSupplierModal(item)}
                            className="px-3 py-1 rounded-md bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs shadow-2xs transition-colors"
                          >
                            Assign Vendor
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
