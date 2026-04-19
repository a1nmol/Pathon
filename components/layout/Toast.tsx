"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface ToastData {
  id: string;
  message: string;
  action?: { label: string; href: string };
  duration?: number;
}

let toastHandler: ((toast: ToastData) => void) | null = null;

export function showToast(toast: Omit<ToastData, "id">) {
  if (toastHandler) {
    toastHandler({ ...toast, id: Math.random().toString(36).slice(2) });
  }
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: ToastData) => {
    setToasts((prev) => [...prev.slice(-2), toast]); // max 3 at once
  }, []);

  useEffect(() => {
    toastHandler = addToast;
    return () => { toastHandler = null; };
  }, [addToast]);

  function dismiss(id: string) {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div
      style={{
        position: "fixed",
        bottom: "2rem",
        right: "2rem",
        zIndex: 9000,
        display: "flex",
        flexDirection: "column",
        gap: "0.75rem",
        pointerEvents: "none",
      }}
    >
      <AnimatePresence>
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), toast.duration ?? 5000);
    return () => clearTimeout(t);
  }, [toast.id, toast.duration, onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, x: 8 }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, y: 8, scale: 0.96 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      style={{
        background: "#111113",
        border: "1px solid #2a2826",
        borderLeft: "3px solid #c4a882",
        padding: "1rem 1.25rem",
        maxWidth: "340px",
        pointerEvents: "all",
        display: "flex",
        flexDirection: "column",
        gap: "0.6rem",
      }}
    >
      <p style={{
        fontFamily: "Georgia, serif",
        fontSize: "0.82rem",
        color: "#c4bfb8",
        lineHeight: 1.6,
        margin: 0,
      }}>
        <span style={{ color: "#c4a882", marginRight: "0.4rem", fontSize: "0.7rem" }}>✦</span>
        {toast.message}
      </p>
      {toast.action && (
        <a
          href={toast.action.href}
          style={{
            fontFamily: "Georgia, serif",
            fontSize: "0.72rem",
            color: "#c4a882",
            textDecoration: "none",
            letterSpacing: "0.04em",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            transition: "opacity 0.2s ease",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
        >
          {toast.action.label} →
        </a>
      )}
    </motion.div>
  );
}
