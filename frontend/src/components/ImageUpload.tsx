"use client";

import React, { useState, useRef } from "react";
import { UploadCloud, Camera, Trash2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageToBackend } from "@/services/upload.service";
import { useTranslations } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export interface ImageUploadProps {
  label?: string;
  value?: string;
  onChange: (url: string) => void;
  folder?: string;
  maxSizeMb?: number;
  accept?: string;
  aspectRatio?: "card" | "video" | "square" | "auto";
  disabled?: boolean;
  required?: boolean;
  error?: string;
  helperText?: string;
  className?: string;
  containerClassName?: string;
  onError?: (errorMessage: string) => void;
}

export function ImageUpload({
  label,
  value,
  onChange,
  folder = "dormio/uploads",
  maxSizeMb = 10,
  accept = "image/png,image/jpeg,image/webp",
  aspectRatio = "card",
  disabled = false,
  required = false,
  error: externalError,
  helperText,
  className,
  containerClassName,
  onError,
}: ImageUploadProps) {
  const tGuest = useTranslations("guest");
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);

  const activeError = externalError || internalError;

  const aspectRatioClass = {
    card: "aspect-[16/10]",
    video: "aspect-video",
    square: "aspect-square",
    auto: "min-h-[140px]",
  }[aspectRatio];

  const handleProcessFile = async (file: File) => {
    if (disabled || isUploading) return;

    setInternalError(null);

    // Validate mime type
    if (!file.type.startsWith("image/")) {
      const err = tGuest("guestDepositImageUploadError") || "Tệp đã chọn không phải định dạng hình ảnh.";
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

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = e.target?.result as string;
        if (!base64) return;

        // Instant local preview
        onChange(base64);

        // Upload to backend Cloudinary storage
        try {
          const res = await uploadImageToBackend(base64, folder);
          if (res?.url) {
            onChange(res.url);
          }
        } catch (uploadErr: any) {
          console.warn("Backend image upload deferred or failed, using local preview:", uploadErr);
        } finally {
          setIsUploading(false);
        }
      };

      reader.onerror = () => {
        const err = tGuest("guestDepositImageUploadError") || "Không thể đọc tệp hình ảnh.";
        setInternalError(err);
        onError?.(err);
        setIsUploading(false);
      };

      reader.readAsDataURL(file);
    } catch {
      const err = tGuest("guestDepositImageUploadError") || "Không thể tải ảnh lên. Vui lòng thử lại.";
      setInternalError(err);
      onError?.(err);
      setIsUploading(false);
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
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleProcessFile(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    onChange("");
    setInternalError(null);
  };

  return (
    <div className={cn("space-y-1.5 w-full", containerClassName)}>
      {label && (
        <label className="block text-xs font-bold text-zinc-700 select-none">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <input
        type="file"
        ref={fileInputRef}
        accept={accept}
        onChange={handleFileChange}
        disabled={disabled || isUploading}
        className="hidden"
      />

      {value ? (
        /* Image Preview Box */
        <div
          className={cn(
            "relative group rounded-2xl overflow-hidden border border-zinc-200 bg-zinc-100 shadow-xs transition-all",
            aspectRatioClass,
            className
          )}
        >
          <img
            src={value}
            alt={label || "Uploaded image"}
            className="w-full h-full object-cover"
          />

          {isUploading && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-1.5 animate-in fade-in">
              <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
              <span className="text-[11px] font-bold">
                {tGuest("guestDepositUploading")}
              </span>
            </div>
          )}

          {!isUploading && !disabled && (
            <div className="absolute inset-0 bg-zinc-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 px-2.5 text-xs font-bold bg-white/90 hover:bg-white text-zinc-900 rounded-lg shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 mr-1" />
                {tGuest("guestDepositChangeImage")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleRemove}
                className="h-8 px-2.5 text-xs font-bold rounded-lg shadow-sm"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                {tGuest("guestDepositRemoveImage")}
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload Dropzone */
        <div
          onDragOver={(e) => {
            e.preventDefault();
            if (!disabled && !isUploading) setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isUploading) fileInputRef.current?.click();
          }}
          className={cn(
            "flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all duration-200",
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
          {isUploading ? (
            <div className="flex flex-col items-center space-y-2 text-[#2AC1BC]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="text-xs font-bold">
                {tGuest("guestDepositUploading")}
              </span>
            </div>
          ) : (
            <div className="flex flex-col items-center space-y-1.5 text-center">
              <div className="w-9 h-9 rounded-full bg-white shadow-xs border border-zinc-200/60 flex items-center justify-center text-zinc-500 group-hover:text-[#2AC1BC]">
                <UploadCloud className="w-5 h-5 text-[#2AC1BC]" />
              </div>
              <p className="text-[11px] font-bold text-zinc-700 leading-tight">
                {tGuest("guestDepositUploadClickOrDrag")}
              </p>
              <p className="text-[9px] text-zinc-400 font-medium">
                {tGuest("guestDepositUploadLimit")}
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
