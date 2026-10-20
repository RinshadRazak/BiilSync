"use client";

import React from "react";
import { Modal } from "./Modal";
import { AlertTriangle, CheckCircle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "primary";
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "warning",
}: ConfirmDialogProps) {
  const isDanger = variant === "danger";
  const isWarning = variant === "warning";

  const buttonStyle = isDanger
    ? "bg-rose-600 hover:bg-rose-700 text-white"
    : isWarning
    ? "bg-amber-600 hover:bg-amber-700 text-white"
    : "bg-blue-600 hover:bg-blue-700 text-white";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              isDanger
                ? "bg-rose-50 text-rose-600 border border-rose-100"
                : isWarning
                ? "bg-amber-50 text-amber-600 border border-amber-100"
                : "bg-blue-50 text-blue-600 border border-blue-100"
            }`}
          >
            {isDanger || isWarning ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
          </div>
          <p className="text-sm text-slate-600 leading-relaxed pt-1">{message}</p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition-colors ${buttonStyle}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
