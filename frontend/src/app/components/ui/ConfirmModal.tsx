"use client";

import { AlertTriangle, Loader2 } from "lucide-react";
import Button from "./Button";

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  description,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  isLoading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[34px] border border-border-app bg-white p-7 shadow-premium">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-[20px] bg-danger-red/10">
          <AlertTriangle className="h-6 w-6 text-danger-red" />
        </div>
        <h3 className="mt-5 text-center text-xl font-black text-text-primary">{title}</h3>
        <p className="mt-2 text-center text-sm font-medium text-text-secondary">{description}</p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            variant="danger"
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-3"
          >
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : confirmLabel}
          </Button>
          <Button
            variant="secondary"
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-3"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
