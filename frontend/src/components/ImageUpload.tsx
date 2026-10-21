'use client'

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { UploadCloud, Camera, Trash2, Loader2, AlertCircle, Eye, Sparkles } from 'lucide-react'
import { Button, Text } from '@/components/ui'
import { uploadImageToBackend } from '@/services/upload.service'
import { useTranslations } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export interface ImageUploadProps {
  label?: string
  value?: string | null
  onChange?: (url: string) => void
  onFileSelect?: (file: File) => void
  onRemove?: () => void
  onInspect?: (url: string) => void
  onError?: (errorMessage: string) => void
  onUploadingChange?: (isUploading: boolean) => void

  // Loading & AI states
  isLoading?: boolean
  loadingText?: string

  // Configurations
  folder?: string
  maxSizeMb?: number
  accept?: string
  aspectRatio?: 'card' | 'video' | 'square' | 'auto' | 'full'
  disabled?: boolean
  required?: boolean
  error?: string
  helperText?: string
  className?: string
  containerClassName?: string
  alt?: string

  // Display customizations
  hideActionButtons?: boolean
  showInspectButton?: boolean
  emptyPlaceholder?: React.ReactNode
}

export function ImageUpload({
  label,
  value,
  onChange,
  onFileSelect,
  onRemove,
  onInspect,
  onError,
  onUploadingChange,
  isLoading = false,
  loadingText,
  folder = 'dormio/uploads',
  maxSizeMb = 10,
  accept = 'image/png,image/jpeg,image/webp,image/*',
  aspectRatio = 'card',
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
  const tGuest = useTranslations('guest')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [isInternalUploading, setIsInternalUploading] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)

  const isBusy = isLoading || isInternalUploading
  const activeError = externalError || internalError

  const onUploadingChangeRef = useRef(onUploadingChange)
  onUploadingChangeRef.current = onUploadingChange

  useEffect(() => {
    onUploadingChangeRef.current?.(isBusy)
  }, [isBusy])

  const aspectRatioClass = {
    card: 'aspect-[16/10]',
    video: 'aspect-video',
    square: 'aspect-square',
    full: 'w-full h-full',
    auto: 'min-h-[140px]',
  }[aspectRatio]

  const handleProcessFile = async (file: File) => {
    if (disabled || isBusy) return

    setInternalError(null)

    // Validate mime type
    if (!file.type.startsWith('image/')) {
      const err =
        tGuest('guestDepositImageUploadError') || 'Tệp đã chọn không phải định dạng hình ảnh.'
      setInternalError(err)
      onError?.(err)
      return
    }

    // Validate file size
    if (file.size > maxSizeMb * 1024 * 1024) {
      const err =
        tGuest('guestDepositImageTooLarge') ||
        `Kích thước tệp vượt quá ${maxSizeMb}MB. Vui lòng chọn ảnh nhỏ hơn.`
      setInternalError(err)
      onError?.(err)
      return
    }

    // If caller provided custom onFileSelect (e.g. parent handles OCR & upload)
    if (onFileSelect) {
      onFileSelect(file)
      return
    }

    // Default internal upload pipeline
    setIsInternalUploading(true)
    try {
      const reader = new FileReader()
      reader.onload = async e => {
        const base64 = e.target?.result as string
        if (!base64) return

        // Instant local preview
        onChange?.(base64)

        // Upload to backend Cloudinary storage
        try {
          const res = await uploadImageToBackend(base64, folder)
          if (res?.url) {
            onChange?.(res.url)
          }
        } catch (uploadErr: any) {
          console.warn('Backend image upload failed, using local preview:', uploadErr)
          const err =
            uploadErr?.response?.data?.message ||
            uploadErr?.message ||
            tGuest('guestDepositImageUploadError') ||
            'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.'
          setInternalError(err)
          onError?.(err)
          onChange?.('')
        } finally {
          setIsInternalUploading(false)
        }
      }

      reader.onerror = () => {
        const err = tGuest('guestDepositImageUploadError') || 'Không thể đọc tệp hình ảnh.'
        setInternalError(err)
        onError?.(err)
        setIsInternalUploading(false)
      }

      reader.readAsDataURL(file)
    } catch {
      const err =
        tGuest('guestDepositImageUploadError') || 'Không thể tải ảnh lên. Vui lòng thử lại.'
      setInternalError(err)
      onError?.(err)
      setIsInternalUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleProcessFile(file)
      e.target.value = ''
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isBusy) return

    const file = e.dataTransfer.files?.[0]
    if (file) {
      handleProcessFile(file)
    }
  }

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (disabled || isBusy) return
    onChange?.('')
    onRemove?.()
    setInternalError(null)
  }

  return (
    <div className={cn('space-y-1.5 w-full', containerClassName)}>
      {label && (
        <Text as="label" size="xs" weight="bold" color="default" className="block select-none">
          {label} {required && <Text as="span" color="danger">*</Text>}
        </Text>
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
            'relative group rounded-2xl overflow-hidden border border-line bg-card-hover/90 shadow-xs flex items-center justify-center transition-all',
            aspectRatioClass,
            className,
          )}
        >
          {/* Next.js Image Component applying Cloudinary / Preview URL to src */}
          <Image
            src={value}
            alt={alt || label || 'Uploaded image'}
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
              onClick={e => {
                e.stopPropagation()
                onInspect(value)
              }}
              className="absolute top-2.5 right-2.5 z-10"
              title="Xem ảnh"
            >
              <Eye className="w-4 h-4" />
            </Button>
          )}

          {/* Loading Overlay while AI processes or file uploads */}
          {isBusy && (
            <div className="absolute inset-0 bg-zinc-950/70 backdrop-blur-xs flex flex-col items-center justify-center text-white space-y-2.5 z-20 animate-in fade-in duration-200">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center animate-pulse">
                  <Sparkles className="w-6 h-6 text-primary" />
                </div>
                <Loader2 className="w-12 h-12 text-primary animate-spin absolute inset-0 opacity-80" />
              </div>
              <div className="text-center px-4 space-y-0.5">
                <Text as="span" size="xs" weight="black" color="white" className="tracking-wide block">
                  {loadingText || tGuest('guestDepositUploading') || 'AI đang xử lý...'}
                </Text>
                <Text as="span" size="3xs" weight="medium" className="text-zinc-300 block">
                  Vui lòng chờ trong giây lát
                </Text>
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
                leftIcon={<Camera className="w-3.5 h-3.5" />}
              >
                <Text as="span" size="xs" weight="medium" color="inherit">
                  {tGuest('guestDepositChangeImage') || 'Đổi ảnh'}
                </Text>
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={handleRemove}
                leftIcon={<Trash2 className="w-3.5 h-3.5" />}
              >
                <Text as="span" size="xs" weight="medium" color="inherit">
                  {tGuest('guestDepositRemoveImage') || 'Xóa ảnh'}
                </Text>
              </Button>
            </div>
          )}
        </div>
      ) : (
        /* Empty Upload State / Dropzone */
        <div
          onDragOver={e => {
            e.preventDefault()
            if (!disabled && !isBusy) setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          onClick={() => {
            if (!disabled && !isBusy) fileInputRef.current?.click()
          }}
          className={cn(
            'relative flex flex-col items-center justify-center p-4 border-2 border-dashed rounded-2xl transition-all duration-200 overflow-hidden',
            aspectRatioClass,
            isDragging
              ? 'border-primary bg-primary/5'
              : activeError
                ? 'border-rose-300 bg-danger-soft hover:border-rose-400'
                : 'border-line hover:border-primary bg-surface/70 hover:bg-card-hover',
            disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
            className,
          )}
        >
          {isBusy ? (
            /* Loading State in Empty Box */
            <div className="flex flex-col items-center space-y-2 text-primary text-center p-4">
              <div className="relative">
                <Loader2 className="w-8 h-8 animate-spin" />
              </div>
              <Text as="span" size="xs" weight="bold" color="brand">
                {loadingText || tGuest('guestDepositUploading') || 'Đang tải ảnh...'}
              </Text>
            </div>
          ) : emptyPlaceholder ? (
            emptyPlaceholder
          ) : (
            <div className="flex flex-col items-center space-y-1.5 text-center">
              <div className="w-10 h-10 rounded-2xl bg-card shadow-xs border border-line flex items-center justify-center text-muted group-hover:text-primary">
                <Camera className="w-5 h-5 text-muted group-hover:text-primary" />
              </div>
              <Text size="xs" weight="bold" color="default" className="leading-tight">
                {tGuest('guestDepositUploadClickOrDrag') || 'Chụp hoặc chọn ảnh'}
              </Text>
              <Text size="3xs" weight="medium" color="subtle">JPG, PNG, WEBP</Text>
            </div>
          )}
        </div>
      )}

      {/* Error / Helper text */}
      {activeError && (
        <Text size="2xs" weight="semibold" color="danger" className="flex items-center gap-1 mt-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <Text as="span" color="inherit">{activeError}</Text>
        </Text>
      )}
      {!activeError && helperText && (
        <Text size="3xs" weight="medium" color="subtle" className="mt-1">{helperText}</Text>
      )}
    </div>
  )
}
