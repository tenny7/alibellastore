"use client";

import { Toaster } from "react-hot-toast";

export function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          borderRadius: "8px",
          border: "1px solid #E2E8F0",
          padding: "12px 16px",
          fontSize: "14px",
        },
        success: {
          style: { color: "#16A34A" },
        },
        error: {
          style: { color: "#DC2626" },
        },
      }}
    />
  );
}
