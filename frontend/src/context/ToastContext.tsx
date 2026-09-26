"use client";

import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import { ToastItem, ToastType, ToastContainer } from "@/components/ui/Toast";

export interface ToastOptions {
  title?: string;
  description?: string;
  duration?: number;
}

export interface ToastCaller {
  (message: string, options?: ToastOptions & { type?: ToastType }): string;
  success: (message: string, options?: ToastOptions) => string;
  error: (message: string, options?: ToastOptions) => string;
  warning: (message: string, options?: ToastOptions) => string;
  info: (message: string, options?: ToastOptions) => string;
  dismiss: (id: string) => void;
  clear: () => void;
}

export interface ToastContextValue {
  toasts: ToastItem[];
  addToast: (item: Omit<ToastItem, "id"> & { id?: string }) => string;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  toast: ToastCaller;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const MAX_TOASTS = 5;

let counter = 0;
function generateToastId(): string {
  counter = (counter + 1) % 10000;
  return `toast_${Date.now()}_${counter}_${Math.random().toString(36).substring(2, 7)}`;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  const addToast = useCallback(
    (item: Omit<ToastItem, "id"> & { id?: string }): string => {
      const id = item.id || generateToastId();
      const newToast: ToastItem = {
        id,
        type: item.type,
        message: item.message,
        title: item.title,
        description: item.description,
        duration: item.duration ?? 5000,
      };

      setToasts((prev) => {
        // Keep at most MAX_TOASTS - 1 and append new toast
        const trimmed = prev.length >= MAX_TOASTS ? prev.slice(prev.length - (MAX_TOASTS - 1)) : prev;
        return [...trimmed, newToast];
      });

      return id;
    },
    []
  );

  const toastCaller = useMemo<ToastCaller>(() => {
    const fn = (message: string, options?: ToastOptions & { type?: ToastType }): string => {
      return addToast({
        type: options?.type || "info",
        message,
        title: options?.title,
        description: options?.description,
        duration: options?.duration,
      });
    };

    fn.success = (message: string, options?: ToastOptions) =>
      addToast({
        type: "success",
        message,
        title: options?.title,
        description: options?.description,
        duration: options?.duration,
      });

    fn.error = (message: string, options?: ToastOptions) =>
      addToast({
        type: "error",
        message,
        title: options?.title,
        description: options?.description,
        duration: options?.duration,
      });

    fn.warning = (message: string, options?: ToastOptions) =>
      addToast({
        type: "warning",
        message,
        title: options?.title,
        description: options?.description,
        duration: options?.duration,
      });

    fn.info = (message: string, options?: ToastOptions) =>
      addToast({
        type: "info",
        message,
        title: options?.title,
        description: options?.description,
        duration: options?.duration,
      });

    fn.dismiss = (id: string) => removeToast(id);
    fn.clear = () => clearToasts();

    return fn;
  }, [addToast, removeToast, clearToasts]);

  const value = useMemo(
    () => ({
      toasts,
      addToast,
      removeToast,
      clearToasts,
      toast: toastCaller,
    }),
    [toasts, addToast, removeToast, clearToasts, toastCaller]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
