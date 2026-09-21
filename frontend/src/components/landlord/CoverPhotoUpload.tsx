'use client';

import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  ImageIcon,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { uploadImageToBackend } from '@/services/upload.service';

interface CoverPhotoUploadProps {
  value?: string;
  onChange: (url: string) => void;
  onFileChange?: (file: File | null) => void;
  label?: string;
  hint?: string;
}

export function CoverPhotoUpload({
  value,
  onChange,
  onFileChange,
  label = 'Ảnh đại diện tòa nhà',
  hint = 'Định dạng JPG, PNG, WEBP tối đa 5MB',
}: CoverPhotoUploadProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(value || '');
  const [fileName, setFileName] = useState<string>('');
  const [fileSize, setFileSize] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFile = async (file: File) => {
    setErrorMessage(null);

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage('Vui lòng chỉ tải lên tệp định dạng hình ảnh (JPG, PNG, WEBP).');
      return;
    }

    // Validate size: 5MB
    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Kích thước ảnh vượt quá 5MB. Vui lòng chọn ảnh nhỏ hơn.');
      return;
    }

    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setFileName(file.name);
    setFileSize(formatBytes(file.size));
    onFileChange?.(file);

    // Convert file to base64 data URL and delegate upload to backend
    setIsUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string;
        const result = await uploadImageToBackend(base64Data, 'dormio/buildings');
        if (result?.url) {
          onChange(result.url);
        }
      } catch (err: any) {
        console.error('Backend upload error:', err);
        setErrorMessage('Không thể tải ảnh lên máy chủ. Đang sử dụng bản xem trước.');
      } finally {
        setIsUploading(false);
      }
    };
    reader.onerror = () => {
      setIsUploading(false);
      setErrorMessage('Lỗi khi đọc tệp ảnh.');
    };
    reader.readAsDataURL(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  const handleRemove = () => {
    setPreviewUrl('');
    setFileName('');
    setFileSize('');
    setErrorMessage(null);
    onChange('');
    onFileChange?.(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-zinc-700 tracking-wide uppercase">
          {label}
        </label>
        {hint && <span className="text-[11px] text-zinc-400">{hint}</span>}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
      />

      {/* When an image is selected */}
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-3">
          <div className="relative h-48 w-full overflow-hidden rounded-xl bg-zinc-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={previewUrl}
              alt="Thumbnail preview"
              className="h-full w-full object-cover"
            />

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-xs">
                <Loader2 className="h-7 w-7 animate-spin text-[#2AC1BC]" />
                <span className="mt-2 text-xs font-semibold">Đang tải ảnh lên đám mây...</span>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#2AC1BC]/10 text-[#2AC1BC]">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="truncate text-xs">
                <p className="font-semibold text-zinc-800 truncate">{fileName || 'Ảnh đại diện đã chọn'}</p>
                {fileSize && <p className="text-zinc-400 text-[11px]">{fileSize}</p>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 bg-white text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Đổi ảnh</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                disabled={isUploading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 bg-red-50 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
                <span>Xóa</span>
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Empty Drag & Drop Zone */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-[#2AC1BC] bg-[#2AC1BC]/5 scale-[0.99]'
              : 'border-zinc-200 bg-zinc-50/50 hover:border-[#2AC1BC]/60 hover:bg-zinc-50'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2AC1BC]/10 text-[#2AC1BC] shadow-xs">
            <UploadCloud className="h-6 w-6" />
          </div>

          <div className="mt-3 space-y-1">
            <p className="text-sm font-bold text-zinc-800">
              Kéo thả ảnh vào đây hoặc <span className="text-[#2AC1BC] hover:underline">chọn tệp từ máy</span>
            </p>
            <p className="text-xs text-zinc-400">
              Hỗ trợ định dạng PNG, JPG, WEBP (dung lượng tối đa 5MB)
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 pt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
