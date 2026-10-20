"use client";

import React, { useState, useRef } from "react";
import { Modal } from "@/components/common/Modal";
import { Product, ProductSupplierMapping, Supplier, DEFAULT_UNITS, DEFAULT_CATEGORIES } from "@/types";
import { saveProduct, isSkuUnique, getSuppliers } from "@/lib/storage";
import { useAuth } from "@/lib/firebase/auth";
import { uploadProductImage, validateProductImage, deleteProductImage } from "@/lib/firebase/storage";
import { ProductImage } from "./ProductImage";
import {
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  Camera,
  Loader2,
  X,
  ShieldAlert,
} from "lucide-react";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onSaved: (product: Product) => void;
}

interface ProductFormContentProps {
  productToEdit?: Product | null;
  onClose: () => void;
  onSaved: (product: Product) => void;
}

function ProductFormContent({
  productToEdit,
  onClose,
  onSaved,
}: ProductFormContentProps) {
  const { isAdmin } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [name, setName] = useState(productToEdit?.name || "");
  const [sku, setSku] = useState(productToEdit?.sku || "");

  const initialCat = productToEdit?.category;
  const isDefaultCat = initialCat ? DEFAULT_CATEGORIES.includes(initialCat) : true;
  const [category, setCategory] = useState(isDefaultCat ? initialCat || DEFAULT_CATEGORIES[0] : "Custom");
  const [customCategory, setCustomCategory] = useState(isDefaultCat ? "" : initialCat || "");

  const initialUnit = productToEdit?.unit;
  const isDefaultUnit = initialUnit ? DEFAULT_UNITS.includes(initialUnit) : true;
  const [unit, setUnit] = useState<string>(isDefaultUnit ? initialUnit || DEFAULT_UNITS[0] : "Custom");
  const [customUnit, setCustomUnit] = useState(isDefaultUnit ? "" : initialUnit || "");

  const [purchasePrice, setPurchasePrice] = useState<string>(
    productToEdit ? productToEdit.purchasePrice.toString() : ""
  );
  const [sellingPrice, setSellingPrice] = useState<string>(
    productToEdit ? productToEdit.sellingPrice.toString() : ""
  );
  const [isActive, setIsActive] = useState(productToEdit ? productToEdit.isActive : true);
  const [supplierMappings, setSupplierMappings] = useState<ProductSupplierMapping[]>(
    productToEdit?.supplierMappings ? [...productToEdit.supplierMappings] : []
  );

  // Image Upload States
  const [imageUrl, setImageUrl] = useState<string>(productToEdit?.imageUrl || "");
  const [imageStoragePath, setImageStoragePath] = useState<string | undefined>(
    productToEdit?.imageStoragePath
  );
  const [previousStoragePath] = useState<string | undefined>(productToEdit?.imageStoragePath);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [availableSuppliers] = useState<Supplier[]>(() => {
    const all = getSuppliers();
    return all.filter((s) => s.isActive || productToEdit);
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Supplier mapping sub-form states
  const [selectedSupplierId, setSelectedSupplierId] = useState("");
  const [supplierCustomPrice, setSupplierCustomPrice] = useState("");
  const [supplierProdCode, setSupplierProdCode] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadError(null);
    const validation = validateProductImage(file);
    if (!validation.isValid) {
      setUploadError(validation.error || "Invalid image.");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    try {
      setIsUploadingImage(true);
      setUploadProgress(10);
      const tempId = productToEdit?.id || `temp-${Date.now()}`;
      const result = await uploadProductImage(file, tempId, (percent) => {
        setUploadProgress(percent);
      });

      setImageUrl(result.imageUrl);
      if (result.imageStoragePath) {
        setImageStoragePath(result.imageStoragePath);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      setUploadError(err instanceof Error ? err.message : "Image upload failed.");
    } finally {
      setIsUploadingImage(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = () => {
    setImageUrl("");
    setImageStoragePath(undefined);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleAddSupplierMapping = () => {
    if (!selectedSupplierId) return;
    const sup = availableSuppliers.find((s) => s.id === selectedSupplierId);
    if (!sup) return;

    const price = parseFloat(supplierCustomPrice);
    if (isNaN(price) || price < 0) {
      setErrorMessage("Please enter a valid non-negative negotiated price for this supplier.");
      return;
    }

    if (supplierMappings.some((m) => m.supplierId === selectedSupplierId)) {
      setErrorMessage("This supplier is already mapped to this product.");
      return;
    }

    const newMapping: ProductSupplierMapping = {
      supplierId: sup.id,
      supplierName: sup.name,
      supplierPrice: price,
      supplierProductCode: supplierProdCode.trim() || undefined,
    };

    setSupplierMappings([...supplierMappings, newMapping]);
    setSelectedSupplierId("");
    setSupplierCustomPrice("");
    setSupplierProdCode("");
    setErrorMessage(null);
  };

  const handleRemoveSupplierMapping = (supplierId: string) => {
    setSupplierMappings(supplierMappings.filter((m) => m.supplierId !== supplierId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!isAdmin) {
      setErrorMessage("Permission Denied: Only Warehouse Administrators can save products or update pricing.");
      return;
    }

    const trimmedName = name.trim();
    const trimmedSku = sku.trim();

    if (!trimmedName) {
      setErrorMessage("Product name is required.");
      return;
    }

    if (!trimmedSku) {
      setErrorMessage("SKU / Product Code is required.");
      return;
    }

    if (!isSkuUnique(trimmedSku, productToEdit?.id)) {
      setErrorMessage(`SKU "${trimmedSku}" is already taken by another product.`);
      return;
    }

    const pPrice = parseFloat(purchasePrice);
    if (isNaN(pPrice) || pPrice < 0) {
      setErrorMessage("Default purchase price must be a valid non-negative number.");
      return;
    }

    const sPrice = parseFloat(sellingPrice);
    if (isNaN(sPrice) || sPrice < 0) {
      setErrorMessage("Default wholesale selling price must be a valid non-negative number.");
      return;
    }

    const finalCategory = category === "Custom" ? customCategory.trim() || "General Wholesale" : category;
    const finalUnit = unit === "Custom" ? customUnit.trim() || "Piece" : unit;

    const result = saveProduct({
      id: productToEdit?.id,
      name: trimmedName,
      sku: trimmedSku,
      category: finalCategory,
      unit: finalUnit,
      purchasePrice: pPrice,
      sellingPrice: sPrice,
      supplierMappings,
      imageUrl: imageUrl.trim() || undefined,
      imageStoragePath: imageStoragePath || undefined,
      imageUpdatedAt: imageUrl ? new Date().toISOString() : undefined,
      isActive,
    });

    if (result.success && result.product) {
      // Safe replacement: if previous image was replaced by a new one, delete old cloud image
      if (previousStoragePath && previousStoragePath !== imageStoragePath) {
        deleteProductImage(previousStoragePath).catch((err) =>
          console.warn("Could not delete old storage image:", err)
        );
      }
      onSaved(result.product);
      onClose();
    } else {
      setErrorMessage(result.error || "Failed to save product.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Role Notice if Sales Staff */}
      {!isAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-800 flex items-start gap-2.5">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold">Sales Staff Access (View-Only)</p>
            <p className="mt-0.5 text-amber-700">
              Only authorized Administrators can create or update product catalog details, master prices, and product images.
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Product Image Upload Section */}
      <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3">
        <label className="block text-xs font-semibold text-slate-800">
          Product Image
        </label>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          {/* Image Preview */}
          <div className="relative group">
            <ProductImage
              src={imageUrl}
              alt={name || "Product preview"}
              size="xl"
              className="border-slate-300"
            />
            {imageUrl && isAdmin && (
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-xs transition-colors"
                title="Remove image"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Upload Controls */}
          <div className="flex-1 space-y-2 text-center sm:text-left">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              id="product-image-file-input"
              disabled={!isAdmin || isUploadingImage}
            />

            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isAdmin || isUploadingImage}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                  !isAdmin || isUploadingImage
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-100"
                }`}
              >
                {isUploadingImage ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                ) : (
                  <Upload className="w-3.5 h-3.5 text-blue-600" />
                )}
                <span>{imageUrl ? "Replace Image" : "Upload Image"}</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={!isAdmin || isUploadingImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-200/60 transition-colors"
              >
                <Camera className="w-3.5 h-3.5 text-slate-500" />
                <span>Gallery / Camera</span>
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              Supported formats: JPEG, PNG, WebP • Max 5 MB • Automatically optimized for high-speed mobile loading
            </p>

            {/* Progress Bar */}
            {isUploadingImage && (
              <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-1.5 rounded-full transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}

            {uploadError && (
              <p className="text-xs text-rose-600 font-medium">{uploadError}</p>
            )}
          </div>
        </div>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Product Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={!isAdmin}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Royal Basmati Rice 5kg"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            SKU / Product Code <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            required
            disabled={!isAdmin}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. RBR-5KG-01"
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg font-mono text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 uppercase disabled:bg-slate-100 disabled:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Category
          </label>
          <select
            value={category}
            disabled={!isAdmin}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {DEFAULT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
            <option value="Custom">+ Other (Custom)</option>
          </select>
          {category === "Custom" && (
            <input
              type="text"
              disabled={!isAdmin}
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              placeholder="Enter custom category"
              className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Packaging Unit
          </label>
          <select
            value={unit}
            disabled={!isAdmin}
            onChange={(e) => setUnit(e.target.value)}
            className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
          >
            {DEFAULT_UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
            <option value="Custom">+ Custom Unit</option>
          </select>
          {unit === "Custom" && (
            <input
              type="text"
              disabled={!isAdmin}
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value)}
              placeholder="Enter unit (e.g. Roll, Bundle, Tray)"
              className="mt-2 w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          )}
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-800 mb-1">
            Active Status
          </label>
          <div className="flex items-center gap-3 pt-2">
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isActive"
                disabled={!isAdmin}
                checked={isActive}
                onChange={() => setIsActive(true)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">Active (Available for Orders)</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="isActive"
                disabled={!isAdmin}
                checked={!isActive}
                onChange={() => setIsActive(false)}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs text-slate-700 font-medium">Deactivated</span>
            </label>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="p-4 rounded-xl bg-blue-50/40 border border-blue-100 space-y-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900">
          Standard Pricing (INR ₹)
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Default Purchase Cost (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              disabled={!isAdmin}
              value={purchasePrice}
              onChange={(e) => setPurchasePrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Standard cost estimate per unit.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-800 mb-1">
              Wholesale Selling Price (₹) <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              required
              disabled={!isAdmin}
              value={sellingPrice}
              onChange={(e) => setSellingPrice(e.target.value)}
              placeholder="0.00"
              className="w-full px-3 py-2 text-xs sm:text-sm bg-white border border-slate-300 rounded-lg text-slate-900 font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Standard rate charged to retail accounts.
            </p>
          </div>
        </div>
      </div>

      {/* Supplier Mappings Section */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Supplier Sources ({supplierMappings.length})
            </h4>
            <p className="text-[11px] text-slate-500">
              Link authorized vendors and negotiated purchase costs for this product.
            </p>
          </div>
        </div>

        {/* Existing Mappings List */}
        {supplierMappings.length > 0 && (
          <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden bg-white">
            {supplierMappings.map((mapping) => (
              <div
                key={mapping.supplierId}
                className="px-3 py-2.5 flex items-center justify-between gap-3 text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{mapping.supplierName}</span>
                  {mapping.supplierProductCode && (
                    <span className="ml-2 font-mono text-[11px] text-slate-400">
                      [{mapping.supplierProductCode}]
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-800">
                    ₹{mapping.supplierPrice.toFixed(2)}
                  </span>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => handleRemoveSupplierMapping(mapping.supplierId)}
                      className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                      title="Remove Mapping"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Supplier Mapping Form */}
        {isAdmin && (
          <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl space-y-2">
            <span className="text-[11px] font-semibold text-slate-700 block">
              + Map Another Vendor
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select
                value={selectedSupplierId}
                onChange={(e) => setSelectedSupplierId(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
              >
                <option value="">Select Vendor...</option>
                {availableSuppliers
                  .filter((s) => !supplierMappings.some((m) => m.supplierId === s.id))
                  .map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
              </select>

              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="Negotiated Cost (₹)"
                value={supplierCustomPrice}
                onChange={(e) => setSupplierCustomPrice(e.target.value)}
                className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
              />

              <div className="flex gap-1.5">
                <input
                  type="text"
                  placeholder="Supplier SKU (opt)"
                  value={supplierProdCode}
                  onChange={(e) => setSupplierProdCode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-md text-slate-900"
                />
                <button
                  type="button"
                  onClick={handleAddSupplierMapping}
                  className="px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Form Actions */}
      <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
        >
          Cancel
        </button>
        {isAdmin && (
          <button
            type="submit"
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors"
          >
            {productToEdit ? "Save Changes" : "Create Product"}
          </button>
        )}
      </div>
    </form>
  );
}

export function ProductFormModal({
  isOpen,
  onClose,
  productToEdit,
  onSaved,
}: ProductFormModalProps) {
  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={productToEdit ? `Edit Product: ${productToEdit.name}` : "Create New Wholesale Product"}
      subtitle="Define wholesale catalog SKU, packaging unit, standard pricing, product image, and supplier source mappings."
      maxWidth="lg"
    >
      <ProductFormContent
        key={productToEdit?.id ?? "new"}
        productToEdit={productToEdit}
        onClose={onClose}
        onSaved={onSaved}
      />
    </Modal>
  );
}
