"use client";

import React, { useState } from "react";
import { Package } from "lucide-react";

interface ProductImageProps {
  src?: string | null;
  alt: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeClasses = {
  xs: "w-7 h-7 text-xs rounded-lg",
  sm: "w-9 h-9 text-xs rounded-lg",
  md: "w-12 h-12 text-sm rounded-xl",
  lg: "w-16 h-16 text-base rounded-xl",
  xl: "w-24 h-24 text-lg rounded-2xl",
};

const iconSizes = {
  xs: "w-3.5 h-3.5",
  sm: "w-4 h-4",
  md: "w-5 h-5",
  lg: "w-7 h-7",
  xl: "w-9 h-9",
};

export function ProductImage({
  src,
  alt,
  size = "md",
  className = "",
}: ProductImageProps) {
  const [hasError, setHasError] = useState(false);

  const containerSize = sizeClasses[size];
  const iconSize = iconSizes[size];

  if (!src || hasError) {
    return (
      <div
        className={`${containerSize} bg-slate-100 border border-slate-200/80 text-slate-400 flex items-center justify-center shrink-0 select-none shadow-2xs ${className}`}
        title={alt}
        aria-label={alt}
      >
        <Package className={iconSize} />
      </div>
    );
  }

  return (
    <div
      className={`${containerSize} relative overflow-hidden bg-slate-50 border border-slate-200/80 shrink-0 shadow-2xs ${className}`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className="w-full h-full object-cover"
      />
    </div>
  );
}
