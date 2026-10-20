"use client";

import React, { useState, useMemo } from "react";
import { Shop, DEFAULT_DELIVERY_AREAS } from "@/types";
import { useShops, toggleShopStatus } from "@/lib/storage";
import { ShopFormModal } from "@/components/shops/ShopFormModal";
import { ShopDetailsModal } from "@/components/shops/ShopDetailsModal";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StorageNoticeBanner } from "@/components/common/StorageNoticeBanner";
import {
  Store,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Power,
  Phone,
  MapPin,
  Navigation,
} from "lucide-react";

export default function ShopsPage() {
  const shops = useShops();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedArea, setSelectedArea] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [shopToEdit, setShopToEdit] = useState<Shop | null>(null);

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Status toggle confirmation
  const [shopToToggle, setShopToToggle] = useState<Shop | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Unique areas across shops
  const availableAreas = useMemo(() => {
    const list = new Set<string>(DEFAULT_DELIVERY_AREAS);
    shops.forEach((s) => {
      if (s.area) list.add(s.area);
    });
    return Array.from(list);
  }, [shops]);

  // Filtered shops
  const filteredShops = useMemo(() => {
    return shops.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        q === "" ||
        s.name.toLowerCase().includes(q) ||
        (s.id && s.id.toLowerCase().includes(q)) ||
        (s.ownerName && s.ownerName.toLowerCase().includes(q)) ||
        (s.area && s.area.toLowerCase().includes(q));

      const matchesArea =
        selectedArea === "ALL" || s.area === selectedArea;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && s.isActive) ||
        (statusFilter === "INACTIVE" && !s.isActive);

      return matchesSearch && matchesArea && matchesStatus;
    });
  }, [shops, searchQuery, selectedArea, statusFilter]);

  // KPI Metrics
  const totalShops = shops.length;
  const activeShops = shops.filter((s) => s.isActive).length;
  const inactiveShops = totalShops - activeShops;

  const handleOpenAdd = () => {
    setShopToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (shop: Shop) => {
    setShopToEdit(shop);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (shop: Shop) => {
    setSelectedShop(shop);
    setIsDetailsOpen(true);
  };

  const promptToggleStatus = (shop: Shop) => {
    setShopToToggle(shop);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = () => {
    if (shopToToggle) {
      toggleShopStatus(shopToToggle.id);
      setShopToToggle(null);
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
            Retail Shop Accounts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage client retail outlets, assigned delivery routes, contact persons, and ordering eligibility.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Shop</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Client Accounts
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalShops}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Accounts
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{activeShops}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inactive / Paused
          </span>
          <div className="text-2xl font-extrabold text-slate-500 mt-1">{inactiveShops}</div>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search shops by name, ID, owner, or route..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="sm:w-56">
          <select
            value={selectedArea}
            onChange={(e) => setSelectedArea(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Delivery Routes</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:w-36">
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

      {/* Shop Listing */}
      {filteredShops.length === 0 ? (
        <EmptyState
          icon={Store}
          title={shops.length === 0 ? "No Retail Shops Registered Yet" : "No Matching Shops Found"}
          description={
            shops.length === 0
              ? "Start onboarding retail stores and grocery clients, or load optional demonstration records."
              : "Try adjusting your search criteria or delivery route filter."
          }
          actionLabel={shops.length === 0 ? "Add Shop" : undefined}
          onAction={handleOpenAdd}
        />
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-3.5 px-4 sm:px-6">Shop Name & ID</th>
                    <th className="py-3.5 px-4">Contact / Owner</th>
                    <th className="py-3.5 px-4">Phone</th>
                    <th className="py-3.5 px-4">Delivery Route</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredShops.map((shop) => (
                    <tr
                      key={shop.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {shop.name}
                        </div>
                        <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                          {shop.id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-800 font-medium">
                        {shop.ownerName || "-"}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600">
                        {shop.phone ? (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            {shop.phone}
                          </span>
                        ) : (
                          "-"
                        )}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-xs">
                        <span className="inline-flex items-center gap-1 text-slate-700">
                          <Navigation className="w-3 h-3 text-slate-400" />
                          <span className="truncate max-w-[180px]">{shop.area}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {shop.isActive ? (
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
                            onClick={() => handleOpenDetails(shop)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View shop details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(shop)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit shop"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => promptToggleStatus(shop)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              shop.isActive
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={shop.isActive ? "Deactivate shop" : "Reactivate shop"}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="p-3 bg-slate-50/50 border-t border-slate-100 text-xs text-slate-500">
              Showing {filteredShops.length} of {shops.length} retail client accounts
            </div>
          </div>

          {/* Mobile-Friendly Cards View */}
          <div className="md:hidden space-y-3">
            {filteredShops.map((shop) => (
              <div
                key={shop.id}
                className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-sm">{shop.name}</h3>
                      <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded">
                        {shop.id}
                      </span>
                    </div>
                    {shop.ownerName && (
                      <p className="text-xs text-slate-500 mt-0.5">Contact: {shop.ownerName}</p>
                    )}
                  </div>

                  {shop.isActive ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Inactive
                    </span>
                  )}
                </div>

                <div className="text-xs space-y-1 pt-1 text-slate-600 border-t border-slate-100">
                  <div className="flex items-center gap-1.5 text-blue-700">
                    <Navigation className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{shop.area}</span>
                  </div>

                  {shop.phone && (
                    <div className="flex items-center gap-1.5 pt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <a href={`tel:${shop.phone}`} className="text-blue-600 underline">
                        {shop.phone}
                      </a>
                    </div>
                  )}

                  {shop.address && (
                    <div className="flex items-start gap-1.5 pt-0.5 text-slate-500">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{shop.address}</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleOpenDetails(shop)}
                    className="flex-1 py-1.5 text-xs font-semibold text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-center"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(shop)}
                    className="flex-1 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg text-center"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => promptToggleStatus(shop)}
                    className={`p-1.5 rounded-lg border text-xs ${
                      shop.isActive
                        ? "text-rose-600 bg-rose-50 border-rose-200"
                        : "text-emerald-700 bg-emerald-50 border-emerald-200"
                    }`}
                    title={shop.isActive ? "Deactivate" : "Reactivate"}
                  >
                    <Power className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Modals */}
      <ShopFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        shopToEdit={shopToEdit}
        onSaved={() => {}}
      />

      <ShopDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        shop={selectedShop}
        onEdit={handleOpenEdit}
      />

      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={shopToToggle?.isActive ? "Deactivate Shop Account" : "Reactivate Shop Account"}
        message={
          shopToToggle?.isActive
            ? `Are you sure you want to deactivate "${shopToToggle.name}" (${shopToToggle.id})? New orders cannot be booked for inactive shops.`
            : `Reactivate "${shopToToggle?.name}" for ordering and delivery?`
        }
        confirmLabel={shopToToggle?.isActive ? "Deactivate" : "Reactivate"}
        variant={shopToToggle?.isActive ? "danger" : "primary"}
      />
    </div>
  );
}
