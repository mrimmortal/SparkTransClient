import { useCallback, useEffect, useState } from "react";

export type ToastItem = {
  id: number;
  message: string;
  type: "success" | "warning";
};

export function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
}) {
  if (toasts.length === 0) return null;
  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: number) => void;
}) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  return (
    <div className={`toast-item ${toast.type}`}>
      <span className="toast-icon">{toast.type === "success" ? "\u2713" : "\u26A0"}</span>
      <span className="toast-message">{toast.message}</span>
      <button className="toast-close" onClick={() => onDismiss(toast.id)}>
        {"\u2715"}
      </button>
    </div>
  );
}

const SUCCESS_MESSAGE_MAP: Record<string, string> = {
  "Saving document": "Document saved",
  "Updating setting": "Setting updated",
  "Creating document": "Document created",
  "Creating document from template": "Document created",
  "Deleting document": "Document deleted",
  "Exporting PDF": "PDF exported",
  "Refreshing workspace": "Workspace refreshed",
  "Duplicating document": "Document duplicated",
  "Signing out": "Signed out",
  "Updating document": "Document updated",
};

export function getSuccessMessage(busyLabel: string): string {
  return SUCCESS_MESSAGE_MAP[busyLabel] || busyLabel.replace(/ing$/, "ed") || busyLabel;
}
