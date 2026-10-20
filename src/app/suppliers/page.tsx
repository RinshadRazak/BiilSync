"use client";

import React, { useState, useMemo } from "react";
import { Supplier } from "@/types";
import { useSuppliers, useProducts, toggleSupplierStatus } from "@/lib/storage";
import { SupplierFormModal } from "@/components/suppliers/SupplierFormModal";
import { SupplierDetailsModal } from "@/components/suppliers/SupplierDetailsModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StorageNoticeBanner } from "@/components/common/StorageNoticeBanner";
import {
  Truck,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Power,
  Package,
  Phone,
  MapPin,
} from "lucide-react";

export default function SuppliersPage() {
  const suppliers = useSuppliers();
  const products = useProducts();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [supplierToEdit, setSupplierToEdit] = useState<Supplier | null>(null);

  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Status toggle confirmation
  const [supplierToToggle, setSupplierToToggle] = useState<Supplier | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Map how many products each supplier supplies
  const supplierProductCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const p of products) {
      if (p.supplierMappings) {
        for (const m of p.supplierMappings) {
          counts[m.supplierId] = (counts[m.supplierId] || 0) + 1;
        }
      }
    }
    return counts;
  }, [products]);

  // Filtered suppliers
  const filteredSuppliers = useMemo(() => {
    return suppliers.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        (s.contactPerson && s.contactPerson.toLowerCase().includes(q)) ||
        (s.phone && s.phone.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "INACTIVE" && !s.isActive);

      return matchesSearch && matchesStatus;
    });
  }, [suppliers, searchQuery, statusFilter]);

  // KPI Metrics
  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter((s) => s.isActive).length;
  const inactiveSuppliers = totalSuppliers - activeSuppliers;

  const handleOpenAdd = () => {
    setSupplierToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (sup: Supplier) => {
    setSupplierToEdit(sup);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (sup: Supplier) => {
    setSelectedSupplier(sup);
    setIsDetailsOpen(true);
  };

  const promptToggleStatus = (sup: Supplier) => {
    setSupplierToToggle(sup);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = () => {
    if (supplierToToggle) {
      toggleSupplierStatus(supplierToToggle.id);
      setSupplierToToggle(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Storage Mode Notice */}
      <StorageNoticeBanner />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Wholesale Suppliers & Vendors
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Directory of manufacturing partners, primary FMCG vendors, contact details, and SKU mappings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Supplier</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Vendors
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalSuppliers}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active for Procurement
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{activeSuppliers}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inactive / On Hold
          </span>
          <div className="text-2xl font-extrabold text-slate-500 mt-1">{inactiveSuppliers}</div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search suppliers by name, contact person, or phone..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:w-44">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as "ALL" | "ACTIVE" | "INACTIVE")}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active Only</option>
            <option value="INACTIVE">Inactive Only</option>
          </select>
        </div>
      </div>

      {/* Supplier List */}
      {filteredSuppliers.length === 0 ? (
        <EmptyState
          icon={Truck}
          title={suppliers.length === 0 ? "No Suppliers Registered Yet" : "No Matching Suppliers Found"}
          description={
            suppliers.length === 0
              ? "Start by adding your primary manufacturers or FMCG distributors, or load optional demo data."
              : "Try adjusting your search criteria or status filter."
          }
          actionLabel={suppliers.length === 0 ? "Add Supplier" : undefined}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Supplier & ID</th>
                  <th className="py-3.5 px-4">Contact Person</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4 hidden lg:table-cell">Facility Location</th>
                  <th className="py-3.5 px-4 text-center">Linked SKUs</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSuppliers.map((supplier) => {
                  const productCount = supplierProductCounts[supplier.id] || 0;
                  return (
                    <tr
                      key={supplier.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {supplier.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {supplier.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                        {supplier.contactPerson || "-"}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {supplier.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {supplier.phone}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 max-w-xs truncate hidden lg:table-cell text-xs">
                        {supplier.address ? (
                          <span className="inline-flex items-center gap-1 truncate">
                            <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="truncate">{supplier.address}</span>
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                          <Package className="w-3 h-3" />
                          {productCount} SKUs
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {supplier.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                            <XCircle className="w-3.5 h-3.5" />
                            Inactive
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenDetails(supplier)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View supplier profile"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(supplier)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit supplier"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => promptToggleStatus(supplier)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              supplier.isActive
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={supplier.isActive ? "Deactivate supplier" : "Reactivate supplier"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
            Showing {filteredSuppliers.length} of {suppliers.length} registered vendors
          </div>
        </div>
      )}

      {/* Modals */}
      <SupplierFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        supplierToEdit={supplierToEdit}
        onSaved={() => {}}
      />

      <SupplierDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        supplier={selectedSupplier}
        onEdit={handleOpenEdit}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={supplierToToggle?.isActive ? "Deactivate Supplier" : "Reactivate Supplier"}
        message={
          supplierToToggle?.isActive
            ? `Are you sure you want to deactivate "${supplierToToggle.name}"? It will be paused for new purchase order allocations.`
            : `Reactivate "${supplierToToggle?.name}" for purchasing?`
        }
        confirmLabel={supplierToToggle?.isActive ? "Deactivate" : "Reactivate"}
        variant={supplierToToggle?.isActive ? "danger" : "primary"}
      />
    </div>
  );
}
