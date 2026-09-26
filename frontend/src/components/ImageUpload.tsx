"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Camera,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageToBackend } from "@/services/upload.service";
import { useTranslations } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  label?: string;
  value?: string | null;
  onChange?: (url: string) => void;
  onFileSelect?: (file: File) => void;
  onRemove?: () => void;
  onInspect?: (url: string) => void;
  onError?: (errorMessage: string) => void;

  // Loading & AI states
  isLoading?: boolean;
  loadingText?: string;

  // Configurations
  folder?: string;
  maxSizeMb?: number;
  accept?: string;
  aspectRatio?: "card" | "video" | "square" | "auto" | "full";
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
  alt?: string;

  // Display customizations
  hideActionButtons?: boolean;
  showInspectButton?: boolean;
  emptyPlaceholder?: React.ReactNode;
}

export function ImageUpload({
  label,
  value,
  onChange,
  onFileSelect,
  onRemove,
  onInspect,
  onError,
  isLoading = false,
  loadingText,
  folder = "dormio/uploads",
  maxSizeMb = 10,
  accept = "image/png,image/jpeg,image/webp,image/*",
  aspectRatio = "card",
  disabled = false,
  required = false,
  error: externalError,
  helperText,
  className,
  containerClassName,
  alt,
  hideActionButtons = false,
  showInspectButton = false,
  emptyPlaceholder,
}: ImageUploadProps) {
  const tGuest = useTranslations("guest");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isInternalUploading, setIsInternalUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const isBusy = isLoading || isInternalUploading;
  const activeError = externalError || internalError;

  const aspectRatioClass = {
    card: "aspect-[16/10]",
    video: "aspect-video",
    square: "aspect-square",
    full: "w-full h-full",
    auto: "min-h-[140px]",
  }[aspectRatio];

  const handleProcessFile = async (file: File) => {
    if (disabled || isBusy) return;

    setInternalError(null);

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      const err =
        tGuest("guestDepositImageUploadError") ||
        "Tệp đã chọn không phải định dạng hình ảnh.";
      setInternalError(err);
      onError?.(err);
      return;
    }

    // Validate file size
    if (file.size > maxSizeMb * 1024 * 1024) {
      const err =
        tGuest("guestDepositImageTooLarge") ||
        `Kích thước tệp vượt quá ${maxSizeMb}MB. Vui lòng chọn ảnh nhỏ hơn.`;
      setInternalError(err);
      onError?.(err);
      return;
    }

    // If caller provided custom onFileSelect (e.g. parent handles OCR & upload)
    if (onFileSelect) {
      onFileSelect(file);
      return;
    }

    // Default internal upload pipeline
    setIsInternalUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;

        // Instant local preview
        onChange?.(base64);

        // Upload to backend Cloudinary storage
        try {
          const res = await uploadImageToBackend(base64, folder);
          if (res?.url) {
            onChange?.(res.url);
          }
        } catch (uploadErr: any) {
          console.warn(
            "Backend image upload deferred or failed, using local preview:",
            uploadErr
          );
        } finally {
          setIsInternalUploading(false);
        }
      };

      reader.onerror = () => {
        const err =
          tGuest("guestDepositImageUploadError") ||
          "Không thể đọc tệp hình ảnh.";
        setInternalError(err);
        onError?.(err);
        setIsInternalUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      const err =
        tGuest("guestDepositImageUploadError") ||
        "Không thể tải ảnh lên. Vui lòng thử lại.";
      setInternalError(err);
      onError?.(err);
      setIsInternalUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleProcessFile(file);
      e.target.value = "";
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isBusy) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isBusy) return;
    onChange?.("");
    onRemove?.();
    setInternalError(null);
  };

  return (
    <div className={cn("space-y-1.5 w-full", containerClassName)}>
      {label && (
        <label className="block text-xs font-bold text-zinc-700 select-none">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      {/* Hidden file input for drag & drop or click */}
      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isBusy}
        className="hidden"
      />

      {value ? (
        /* Image Preview Box with Loading Overlay Support */
        <div
          className={cn(
            "relative group rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100/90 shadow-xs flex items-center justify-center transition-all",
            aspectRatioClass,
            className
          )}
        >
          {/* Next.js Image Component applying Cloudinary / Preview URL to src */}
          <Image
            src={value}
            alt={alt || label || "Uploaded image"}
            fill
            unoptimized
            className="w-full h-full object-cover"
          />

          {/* Inspect / Zoom Button */}
          {showInspectButton && onInspect && !isBusy && (
            <Button
              variant="secondary"
              size="icon"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onInspect(value);
              }}
              className="absolute top-2.5 right-2.5 h-8 w-8 bg-black/60 text-white hover:bg-black/80 rounded-xl cursor-pointer shadow-md z-10"
              title="Xem ảnh"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}

          {/* Loading Overlay while AI processes or file uploads */}
          {isBusy && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2.5 z-20 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-[#2AC1BC]/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-[#2AC1BC]" />
                </div>
                <Loader2 className="w-12 h-12 text-[#2AC1BC] animate-spin absolute inset-0 opacity-80" />
              </div>
              <div className="text-center px-4 space-y-0.5">
                <span className="text-xs font-black text-white tracking-wide block">
                  {loadingText || tGuest("guestDepositUploading") || "AI đang xử lý..."}
                </span>
                <span className="text-[10px] text-zinc-300 font-medium block">
                  Vui lòng chờ trong giây lát
                </span>
              </div>
            </div>
          )}

          {/* Action buttons overlay (Only if NOT hideActionButtons) */}
          {!isBusy && !disabled && !hideActionButtons && (
            <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-2.5 text-xs font-bold bg-white/90 hover:bg-white text-zinc-900 rounded-lg shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                {tGuest("guestDepositChangeImage") || "Đổi ảnh"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleRemove}
                className="h-8 px-2.5 text-xs font-bold rounded-lg shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {tGuest("guestDepositRemoveImage") || "Xóa ảnh"}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload State / Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isBusy) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isBusy) fileInputRef.current?.click();
          }}
          className={cn(
            "relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden",
            aspectRatioClass,
            isDragging
              ? "border-[#2AC1BC] bg-[#2AC1BC]/5"
              : activeError
              ? "border-rose-300 bg-rose-50/50 hover:border-rose-400"
              : "border-zinc-200/90 hover:border-[#2AC1BC] bg-zinc-50/70 hover:bg-zinc-50",
            disabled ? "opacity-60 cursor-not-allowed" : "cursor-pointer",
            className
          )}
        >
          {isBusy ? (
            /* Loading State in Empty Box */
            <div className="flex flex-col items-center space-y-2 text-[#2AC1BC] text-center p-4">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <span className="text-xs font-bold">
                {loadingText || tGuest("guestDepositUploading") || "Đang tải ảnh..."}
              </span>
            </div>
          ) : emptyPlaceholder ? (
            emptyPlaceholder
          ) : (
            <div className="flex flex-col items-center space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-500 group-hover:text-[#2AC1BC]">
                <Camera className="w-5 h-5 text-zinc-400 group-hover:text-[#2AC1BC]" />
              </div>
              <p className="text-xs font-bold text-zinc-700 leading-tight">
                {tGuest("guestDepositUploadClickOrDrag") || "Chụp hoặc chọn ảnh"}
              </p>
              <p className="text-[10px] text-zinc-400 font-medium">
                JPG, PNG, WEBP
              </p>
            </div>
          )}
        </div>
      )}

      {/* Error / Helper text */}
      {activeError && (
        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </p>
      )}
      {!activeError && helperText && (
        <p className="text-[10px] text-zinc-400 font-medium mt-1">
          {helperText}
        </p>
      )}
    </div>
  );
}
