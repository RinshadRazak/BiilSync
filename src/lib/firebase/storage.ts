"use client";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject,
} from "firebase/storage";
import { storage, isFirebaseConfigured } from "./config";

export interface ImageValidationResult {
  isValid: boolean;
  error?: string;
}

export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

/**
 * Validates file MIME type and size limit.
 */
export function validateProductImage(file: File): ImageValidationResult {
  if (!file) {
    return { isValid: false, error: "No image file provided." };
  }

  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return {
      isValid: false,
      error: `Unsupported format "${file.type || "unknown"}". Allowed formats: JPEG, PNG, WebP.`,
    };
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      isValid: false,
      error: `File size (${sizeMb} MB) exceeds maximum allowed limit of 5 MB.`,
    };
  }

  return { isValid: true };
}

/**
 * Resizes and compresses an image in browser canvas to max 800x800 @ 85% quality.
 * Reduces raw mobile photos (3-5 MB) to lightweight web assets (~60-120 KB).
 */
export async function compressProductImage(
  file: File,
  maxWidth: number = 800,
  maxHeight: number = 800,
  quality: number = 0.85
): Promise<{ blob: Blob; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed reading image file."));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error("Failed loading image into canvas."));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        if (!ctx) {
          return reject(new Error("Canvas context initialization failed."));
        }

        // Draw image resized
        ctx.drawImage(img, 0, 0, width, height);

        const mime = file.type === "image/png" ? "image/png" : "image/jpeg";
        const dataUrl = canvas.toDataURL(mime, quality);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return reject(new Error("Canvas to Blob conversion failed."));
            }
            resolve({ blob, dataUrl });
          },
          mime,
          quality
        );
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export interface UploadResult {
  imageUrl: string;
  imageStoragePath?: string;
}

/**
 * Uploads a product image.
 * Uses Firebase Storage if configured; otherwise returns compressed Base64 Data URL.
 */
export async function uploadProductImage(
  file: File,
  productId: string,
  onProgress?: (percent: number) => void
): Promise<UploadResult> {
  const validation = validateProductImage(file);
  if (!validation.isValid) {
    throw new Error(validation.error);
  }

  // 1. Compress image client-side
  const { blob, dataUrl } = await compressProductImage(file);

  // 2. If Firebase Storage is configured and online, upload to bucket
  if (isFirebaseConfigured() && storage) {
    const timestamp = Date.now();
    const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const storagePath = `products/${productId}/${timestamp}_${cleanName}`;
    const storageRef = ref(storage, storagePath);

    return new Promise((resolve, reject) => {
      const uploadTask = uploadBytesResumable(storageRef, blob, {
        contentType: blob.type,
      });

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          if (onProgress) onProgress(Math.round(progress));
        },
        (error) => {
          console.error("Firebase Storage upload error:", error);
          reject(new Error(error.message || "Failed uploading product image to cloud storage."));
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve({
              imageUrl: downloadUrl,
              imageStoragePath: storagePath,
            });
          } catch (err) {
            reject(err);
          }
        }
      );
    });
  }

  // Local / Offline fallback: simulate upload progress and return compressed dataUrl
  if (onProgress) {
    onProgress(50);
    await new Promise((r) => setTimeout(r, 60));
    onProgress(100);
  }

  return {
    imageUrl: dataUrl,
    imageStoragePath: undefined,
  };
}

/**
 * Deletes a previously stored product image from Firebase Storage.
 */
export async function deleteProductImage(storagePath?: string): Promise<void> {
  if (!storagePath) return;
  if (isFirebaseConfigured() && storage) {
    try {
      const storageRef = ref(storage, storagePath);
      await deleteObject(storageRef);
    } catch (err) {
      console.warn("Failed deleting previous image from storage:", err);
    }
  }
}
