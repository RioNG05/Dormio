"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  UploadCloud,
  Camera,
  Trash2,
  Loader2,
  AlertCircle,
  Eye,
  Star,
  X,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadImageToBackend } from "@/services/upload.service";
import { useTranslations } from "@/context/LanguageContext";
import { cn } from "@/lib/utils";

export interface MultiImageUploadProps {
  values: string[];
  onChange: (urls: string[]) => void;
  folder?: string;
  maxImages?: number;
  maxSizeMb?: number;
  disabled?: boolean;
  error?: string | null;
  label?: string;
  helperText?: string;
  containerClassName?: string;
  onDirty?: () => void;
}

interface UploadingQueueItem {
  id: string;
  previewUrl: string;
  isUploading: boolean;
  error?: string | null;
  file?: File;
}

export function MultiImageUpload({
  values = [],
  onChange,
  folder = "dormio/posts",
  maxImages = 10,
  maxSizeMb = 10,
  disabled = false,
  error: externalError,
  label,
  helperText,
  containerClassName,
  onDirty,
}: MultiImageUploadProps) {
  const t = useTranslations("guest");

  const deviceInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [internalError, setInternalError] = useState<string | null>(null);
  const [uploadingItems, setUploadingItems] = useState<UploadingQueueItem[]>([]);

  // Camera modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [cameraLoading, setCameraLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("environment");

  // Inspect / preview zoomed photo
  const [inspectedImageUrl, setInspectedImageUrl] = useState<string | null>(null);

  const activeError = externalError || internalError;
  const isAtMaxImages = values.length + uploadingItems.length >= maxImages;

  // ─── File Processing & Upload Pipeline ──────────────────────────────────────
  const processAndUploadFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return;
      setInternalError(null);

      const availableSlots = maxImages - (values.length + uploadingItems.length);
      if (availableSlots <= 0) {
        setInternalError(
          t("guestPostsCreateMaxImagesReached", { max: maxImages }) ||
            `Đã đạt tối đa ${maxImages} ảnh.`
        );
        return;
      }

      const filesToProcess = files.slice(0, availableSlots);

      for (const file of filesToProcess) {
        if (!file.type.startsWith("image/")) {
          setInternalError("Chỉ chấp nhận tệp định dạng hình ảnh (JPG, PNG, WEBP).");
          continue;
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
          setInternalError(
            `Ảnh "${file.name}" vượt quá kích thước cho phép (${maxSizeMb}MB).`
          );
          continue;
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

        // Read local base64 for instant optimistic preview
        const reader = new FileReader();
        reader.onload = async (e) => {
          const base64Data = e.target?.result as string;
          if (!base64Data) return;

          // Add to uploading queue
          const queueItem: UploadingQueueItem = {
            id: tempId,
            previewUrl: base64Data,
            isUploading: true,
            file,
          };

          setUploadingItems((prev) => [...prev, queueItem]);
          onDirty?.();

          // Upload to backend Cloudinary storage
          try {
            const res = await uploadImageToBackend(base64Data, folder);
            const uploadedUrl = res?.url || base64Data;

            // Remove from uploading queue and append to final values
            setUploadingItems((prev) => prev.filter((item) => item.id !== tempId));
            onChange([...values, uploadedUrl]);
          } catch (uploadErr: any) {
            console.error("Failed to upload image to Cloudinary:", uploadErr);
            setUploadingItems((prev) =>
              prev.map((item) =>
                item.id === tempId
                  ? {
                      ...item,
                      isUploading: false,
                      error:
                        uploadErr?.message ||
                        t("guestPostsCreateUploadFailed") ||
                        "Tải ảnh thất bại",
                    }
                  : item
              )
            );
          }
        };

        reader.readAsDataURL(file);
      }
    },
    [disabled, maxImages, values, uploadingItems.length, maxSizeMb, t, folder, onChange, onDirty]
  );

  // ─── Input Handlers ────────────────────────────────────────────────────────
  const handleDeviceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleCameraCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFiles(Array.from(e.target.files));
      e.target.value = "";
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && !isAtMaxImages) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isAtMaxImages) return;

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFiles(Array.from(e.dataTransfer.files));
    }
  };

  // ─── Reorder & Delete Actions ──────────────────────────────────────────────
  const handleRemoveImage = (indexToRemove: number) => {
    if (disabled) return;
    const newValues = values.filter((_, idx) => idx !== indexToRemove);
    onChange(newValues);
    onDirty?.();
  };

  const handleSetCoverPhoto = (indexToCover: number) => {
    if (disabled || indexToCover === 0) return;
    const item = values[indexToCover];
    const remaining = values.filter((_, idx) => idx !== indexToCover);
    onChange([item, ...remaining]);
    onDirty?.();
  };

  const handleRemoveUploadingItem = (idToRemove: string) => {
    setUploadingItems((prev) => prev.filter((item) => item.id !== idToRemove));
  };

  // ─── Web Camera Live Stream Modal ──────────────────────────────────────────
  const startCamera = async (mode: "user" | "environment") => {
    stopCamera();
    setCameraLoading(true);
    setCameraError(null);

    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        t("guestPostsCreateCameraPermissionDenied") ||
          "Trình duyệt không hỗ trợ trực tiếp mở camera webcam."
      );
      setCameraLoading(false);
      return;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        await videoRef.current.play().catch(() => {});
      }
      setCameraLoading(false);
    } catch (err: any) {
      console.warn("Could not start camera live stream:", err);
      setCameraLoading(false);
      setCameraError(
        t("guestPostsCreateCameraPermissionDenied") ||
          "Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh từ thiết bị."
      );
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const openCamera = () => {
    // Check if on touch/mobile device: use native capture for best mobile OS camera experience
    const isMobileDevice =
      typeof window !== "undefined" &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) ||
        window.matchMedia("(pointer:coarse)").matches);

    if (isMobileDevice && cameraInputRef.current) {
      cameraInputRef.current.click();
      return;
    }

    setIsCameraModalOpen(true);
    startCamera(facingMode);
  };

  const closeCamera = () => {
    stopCamera();
    setIsCameraModalOpen(false);
    setCameraError(null);
  };

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === "user" ? "environment" : "user";
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSnapPhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;

    try {
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext("2d");

      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

        // Convert base64 dataUrl to File
        fetch(dataUrl)
          .then((res) => res.blob())
          .then((blob) => {
            const snappedFile = new File([blob], `camera-${Date.now()}.jpg`, {
              type: "image/jpeg",
            });
            processAndUploadFiles([snappedFile]);
          });
      }
    } catch (err) {
      console.error("Failed to capture video snapshot:", err);
    } finally {
      closeCamera();
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <div className={cn("space-y-4 w-full", containerClassName)}>
      {/* Label & Counter */}
      {label && (
        <div className="flex items-center justify-between">
          <label className="block text-xs font-bold text-zinc-700 select-none">
            {label}
          </label>
          <span className="text-[11px] font-semibold text-zinc-400">
            {t("guestPostsCreateImageCount", {
              count: values.length,
              max: maxImages,
            }) || `Đã chọn: ${values.length}/${maxImages} ảnh`}
          </span>
        </div>
      )}

      {/* Hidden Inputs */}
      <input
        ref={deviceInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/*"
        multiple
        disabled={disabled || isAtMaxImages}
        onChange={handleDeviceInputChange}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        disabled={disabled || isAtMaxImages}
        onChange={handleCameraCaptureChange}
        className="hidden"
      />

      {/* Action Buttons: Device Upload & Camera Capture */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isAtMaxImages}
          onClick={() => deviceInputRef.current?.click()}
          className="h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 border border-zinc-200 hover:bg-zinc-100 transition-colors"
        >
          <UploadCloud className="w-4 h-4 text-[#2AC1BC] shrink-0" />
          <span>{t("guestPostsCreateUploadDevice") || "Tải ảnh từ máy"}</span>
        </Button>

        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled || isAtMaxImages}
          onClick={openCamera}
          className="h-9 px-3.5 text-xs font-bold rounded-xl flex items-center gap-2 border border-zinc-200 hover:bg-zinc-100 transition-colors"
        >
          <Camera className="w-4 h-4 text-[#FF6B35] shrink-0" />
          <span>{t("guestPostsCreateCaptureCamera") || "Chụp ảnh camera"}</span>
        </Button>

        {isAtMaxImages && (
          <span className="text-xs text-amber-600 font-medium ml-auto flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {t("guestPostsCreateMaxImagesReached", { max: maxImages }) ||
              `Đã đạt giới hạn tối đa ${maxImages} ảnh`}
          </span>
        )}
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isAtMaxImages) {
            deviceInputRef.current?.click();
          }
        }}
        className={cn(
          "relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all duration-200 select-none",
          isDragging
            ? "border-[#2AC1BC] bg-[#2AC1BC]/5 scale-[0.99]"
            : "border-zinc-200 hover:border-[#2AC1BC] bg-zinc-50/60 hover:bg-zinc-50",
          disabled || isAtMaxImages ? "opacity-60 cursor-not-allowed" : "cursor-pointer"
        )}
      >
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-white shadow-xs border border-zinc-200/80 flex items-center justify-center text-zinc-400 group-hover:text-[#2AC1BC] transition-colors">
            <UploadCloud className="w-6 h-6 text-[#2AC1BC]" />
          </div>
          <div>
            <p className="text-xs font-bold text-zinc-800">
              {t("guestPostsCreateDropzonePrompt") ||
                "Kéo thả ảnh vào đây hoặc nhấp để tải từ máy"}
            </p>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
              {t("guestPostsCreateDropzoneSub", { max: maxImages, size: maxSizeMb }) ||
                `Hỗ trợ JPG, PNG, WEBP (tối đa ${maxImages} ảnh, mỗi ảnh tối đa ${maxSizeMb}MB)`}
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Uploaded Images & Uploading Queue */}
      {(values.length > 0 || uploadingItems.length > 0) && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pt-2">
          {/* Successfully Uploaded Images */}
          {values.map((url, idx) => (
            <div
              key={idx}
              className="relative group rounded-2xl overflow-hidden border border-zinc-200/90 aspect-video bg-zinc-100 shadow-xs transition-all hover:shadow-md"
            >
              <Image
                src={url}
                alt={`Photo ${idx + 1}`}
                fill
                unoptimized
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />

              {/* Cover Photo Badge */}
              {idx === 0 && (
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-[#2AC1BC] text-white text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1 z-10">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{t("guestPostsCreateCoverBadge") || "Ảnh bìa"}</span>
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                {/* Inspect Button */}
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  onClick={() => setInspectedImageUrl(url)}
                  className="h-8 w-8 bg-white/90 hover:bg-white text-zinc-800 rounded-xl shadow-sm"
                  title="Xem ảnh phóng to"
                >
                  <Eye className="w-4 h-4" />
                </Button>

                {/* Make Cover Button (if not already cover) */}
                {idx > 0 && !disabled && (
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    onClick={() => handleSetCoverPhoto(idx)}
                    className="h-8 w-8 bg-white/90 hover:bg-white text-amber-500 rounded-xl shadow-sm"
                    title={t("guestPostsCreateSetCoverTooltip") || "Đặt làm ảnh bìa"}
                  >
                    <Star className="w-4 h-4" />
                  </Button>
                )}

                {/* Delete Button */}
                {!disabled && (
                  <Button
                    type="button"
                    variant="danger"
                    size="icon"
                    onClick={() => handleRemoveImage(idx)}
                    className="h-8 w-8 rounded-xl shadow-sm"
                    title="Xóa ảnh"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Uploading Queue Cards */}
          {uploadingItems.map((item) => (
            <div
              key={item.id}
              className="relative rounded-2xl overflow-hidden border border-zinc-200 aspect-video bg-zinc-100 shadow-xs flex items-center justify-center"
            >
              <Image
                src={item.previewUrl}
                alt="Uploading..."
                fill
                unoptimized
                className="w-full h-full object-cover filter blur-[2px]"
              />

              <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex flex-col items-center justify-center text-white space-y-1.5 p-2 text-center z-10">
                {item.isUploading ? (
                  <>
                    <Loader2 className="w-6 h-6 text-[#2AC1BC] animate-spin" />
                    <span className="text-[10px] font-bold tracking-wide">
                      {t("guestPostsCreateUploadingText") || "Đang tải ảnh..."}
                    </span>
                  </>
                ) : item.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <span className="text-[10px] font-bold text-rose-300">
                      {item.error}
                    </span>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => handleRemoveUploadingItem(item.id)}
                      className="h-6 px-2 text-[10px] font-bold rounded-lg mt-1"
                    >
                      {t("guestPostsCreateUploadRetry") || "Bỏ qua"}
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Error or Helper text */}
      {activeError && (
        <p className="text-[11px] text-rose-500 font-semibold flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{activeError}</span>
        </p>
      )}
      {!activeError && helperText && (
        <p className="text-[11px] text-zinc-400 font-medium">{helperText}</p>
      )}

      {/* ─── Webcam Modal for Desktop Direct Capture ─────────────────────────── */}
      {isCameraModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-lg w-full shadow-2xl border border-zinc-200 space-y-5 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-zinc-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
                  <Camera className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-zinc-900">
                  {t("guestPostsCreateCameraModalTitle") || "Chụp ảnh từ Camera"}
                </h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeCamera}
                className="h-8 w-8 rounded-xl text-zinc-400 hover:text-zinc-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Video Viewport */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800">
              {cameraLoading && (
                <div className="flex flex-col items-center space-y-2 text-zinc-300">
                  <Loader2 className="w-8 h-8 text-[#FF6B35] animate-spin" />
                  <span className="text-xs font-semibold">Đang kết nối camera...</span>
                </div>
              )}

              {cameraError ? (
                <div className="p-4 text-center space-y-2 text-rose-400">
                  <AlertCircle className="w-8 h-8 mx-auto text-rose-500" />
                  <p className="text-xs font-medium">{cameraError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      closeCamera();
                      cameraInputRef.current?.click();
                    }}
                    className="mt-2 text-xs border-zinc-600 text-white hover:bg-zinc-800"
                  >
                    Dùng tệp ảnh thay thế
                  </Button>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  playsInline
                  autoPlay
                  muted
                  className="w-full h-full object-cover"
                />
              )}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-between pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleToggleFacingMode}
                className="h-9 px-3 text-xs font-bold rounded-xl flex items-center gap-1.5"
                title="Đổi camera trước/sau"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t("guestPostsCreateCameraModalSwitch") || "Đổi camera"}</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={closeCamera}
                  className="h-9 px-4 text-xs font-bold rounded-xl text-zinc-600 hover:bg-zinc-100"
                >
                  {t("guestPostsCreateCameraModalClose") || "Đóng"}
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={cameraLoading || !!cameraError}
                  onClick={handleSnapPhoto}
                  className="h-9 px-5 text-xs font-bold rounded-xl bg-[#FF6B35] hover:bg-[#ff5518] text-white flex items-center gap-1.5 shadow-md shadow-[#FF6B35]/25"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t("guestPostsCreateCameraModalSnap") || "Chụp ảnh"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Zoom Image Lightbox Modal ────────────────────────────────────────── */}
      {inspectedImageUrl && (
        <div
          onClick={() => setInspectedImageUrl(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-3xl w-full max-h-[85vh] rounded-3xl overflow-hidden bg-black shadow-2xl border border-zinc-800"
          >
            <div className="relative w-full aspect-video">
              <Image
                src={inspectedImageUrl}
                alt="Enlarged photo"
                fill
                unoptimized
                className="object-contain"
              />
            </div>
            <Button
              type="button"
              variant="secondary"
              size="icon"
              onClick={() => setInspectedImageUrl(null)}
              className="absolute top-4 right-4 h-9 w-9 bg-black/60 hover:bg-black/80 text-white rounded-xl shadow-md cursor-pointer"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
