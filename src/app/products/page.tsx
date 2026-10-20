"use client";

import React, { useState, useMemo } from "react";
import { Product, DEFAULT_CATEGORIES } from "@/types";
import { useProducts, toggleProductStatus } from "@/lib/storage";
import { formatCurrency } from "@/lib/formatters";
import { ProductFormModal } from "@/components/products/ProductFormModal";
import { ProductDetailsModal } from "@/components/products/ProductDetailsModal";
import { ProductImage } from "@/components/products/ProductImage";
import { ConfirmDialog } from "@/components/common/ConfirmDialog";
import { EmptyState } from "@/components/common/EmptyState";
import { StorageNoticeBanner } from "@/components/common/StorageNoticeBanner";
import {
  Package,
  PlusCircle,
  Search,
  CheckCircle2,
  XCircle,
  Eye,
  Edit3,
  Power,
  Layers,
} from "lucide-react";

export default function ProductsPage() {
  const products = useProducts();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Status toggle confirmation
  const [productToToggle, setProductToToggle] = useState<Product | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Filtered and searched products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchQuery.trim() === "" ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "ALL" || p.category === selectedCategory;

      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" && p.isActive) ||
        (statusFilter === "INACTIVE" && !p.isActive);

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  // Metrics
  const totalProducts = products.length;
  const activeProducts = products.filter((p) => p.isActive).length;
  const inactiveProducts = totalProducts - activeProducts;
  const uniqueCategories = Array.from(new Set(products.map((p) => p.category))).length;

  const handleOpenAdd = () => {
    setProductToEdit(null);
    setIsFormOpen(true);
  };

  const handleOpenEdit = (prod: Product) => {
    setProductToEdit(prod);
    setIsFormOpen(true);
  };

  const handleOpenDetails = (prod: Product) => {
    setSelectedProduct(prod);
    setIsDetailsOpen(true);
  };

  const promptToggleStatus = (prod: Product) => {
    setProductToToggle(prod);
    setIsConfirmOpen(true);
  };

  const handleConfirmToggle = () => {
    if (productToToggle) {
      toggleProductStatus(productToToggle.id);
      setProductToToggle(null);
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
            Wholesale Products & SKUs
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage wholesale catalog, packaging units, base wholesale selling prices, and supplier cost mappings.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold shadow-xs transition-colors self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Total Catalog SKUs
          </span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalProducts}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active for Orders
          </span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{activeProducts}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Inactive / Discontinued
          </span>
          <div className="text-2xl font-extrabold text-slate-600 mt-1">{inactiveProducts}</div>
        </div>

        <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Active Categories
          </span>
          <div className="text-2xl font-extrabold text-indigo-600 mt-1">{uniqueCategories}</div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name or SKU..."
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:w-52">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="ALL">All Categories</option>
            {DEFAULT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
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

      {/* Product List Table / Cards */}
      {filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={products.length === 0 ? "No Products in Catalog Yet" : "No Matching Products Found"}
          description={
            products.length === 0
              ? "Start by adding your first wholesale product or load optional demonstration records."
              : "Try adjusting your search query, category filter, or status filter."
          }
          actionLabel={products.length === 0 ? "Add Product" : undefined}
          onAction={handleOpenAdd}
        />
      ) : (
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-4 sm:px-6">Product & SKU</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4 text-right">Purchase (₹)</th>
                  <th className="py-3.5 px-4 text-right">Selling (₹)</th>
                  <th className="py-3.5 px-4 text-center hidden md:table-cell">Suppliers</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((product) => {
                  const margin = product.sellingPrice - product.purchasePrice;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-slate-50/70 transition-colors group"
                    >
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={product.imageUrl}
                            alt={product.name}
                            size="sm"
                          />
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                              {product.name}
                            </div>
                            <div className="font-mono text-[11px] text-slate-400 mt-0.5">
                              {product.sku}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {product.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap text-slate-600 font-medium">
                        {product.unit}
                      </td>

                      <td className="py-3.5 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatCurrency(product.purchasePrice)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatCurrency(product.sellingPrice)}
                        <span className="block text-[10px] text-emerald-600 font-normal">
                          +{formatCurrency(margin)}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap hidden md:table-cell">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-blue-50 text-blue-700 font-medium">
                          <Layers className="w-3 h-3" />
                          {product.supplierMappings?.length || 0}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {product.isActive ? (
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
                            onClick={() => handleOpenDetails(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="View product details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-slate-100 transition-colors"
                            title="Edit product"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            type="button"
                            onClick={() => promptToggleStatus(product)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              product.isActive
                                ? "text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                                : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                            }`}
                            title={product.isActive ? "Deactivate product" : "Reactivate product"}
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

          <div className="p-3 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing {filteredProducts.length} of {products.length} catalog items
            </span>
            <span className="text-[11px] text-slate-400">
              Prices formatted in INR (₹)
            </span>
          </div>
        </div>
      )}

      {/* Product Form Modal (Add / Edit) */}
      <ProductFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        productToEdit={productToEdit}
        onSaved={() => {}}
      />

      {/* Product Details Modal */}
      <ProductDetailsModal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        product={selectedProduct}
        onEdit={handleOpenEdit}
      />

      {/* Deactivate/Reactivate Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={handleConfirmToggle}
        title={productToToggle?.isActive ? "Deactivate Product" : "Reactivate Product"}
        message={
          productToToggle?.isActive
            ? `Are you sure you want to deactivate "${productToToggle.name}" (${productToToggle.sku})? It will no longer be available for wholesale order entry.`
            : `Reactivate "${productToToggle?.name}"? It will become available again for order entry.`
        }
        confirmLabel={productToToggle?.isActive ? "Deactivate" : "Reactivate"}
        variant={productToToggle?.isActive ? "danger" : "primary"}
      />
    </div>
  );
}
