'use client'

import React, { useState, useRef } from 'react'
import {
  UploadCloud,
  ImageIcon,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import { uploadImageToBackend } from '@/services/upload.service'
import { Button, TextInput, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'

interface CoverPhotoUploadProps {
  value?: string
  onChange: (url: string) => void
  onFileChange?: (file: File | null) => void
  label?: string
  hint?: string
  maxSizeMb?: number
}

export function CoverPhotoUpload({
  value,
  onChange,
  onFileChange,
  label,
  hint,
  maxSizeMb = 10,
}: CoverPhotoUploadProps) {
  const t = useTranslations('landlord')
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string>(value || '')
  const [fileName, setFileName] = useState<string>('')
  const [fileSize, setFileSize] = useState<string>('')
  const [isUploading, setIsUploading] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const resolvedLabel = label || t('landlordSetupThumbnailLabel')
  const resolvedHint = hint || t('landlordSetupThumbnailUploadHint')

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
  }

  const handleFile = async (file: File) => {
    setErrorMessage(null)

    // Validate type
    if (!file.type.startsWith('image/')) {
      setErrorMessage(t('landlordSetupThumbnailFormatError') || 'Vui lòng chỉ tải lên tệp định dạng hình ảnh (JPG, PNG, WEBP).')
      return
    }

    // Validate size: 15MB
    if (file.size > maxSizeMb * 1024 * 1024) {
      setErrorMessage(t('landlordSetupThumbnailSizeError'))
      return
    }

    const localUrl = URL.createObjectURL(file)
    setPreviewUrl(localUrl)
    setFileName(file.name)
    setFileSize(formatBytes(file.size))
    onFileChange?.(file)

    // Convert file to base64 data URL and delegate upload to backend
    setIsUploading(true)
    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string
        const result = await uploadImageToBackend(base64Data, 'dormio/buildings')
        if (result?.url) {
          onChange(result.url)
        }
      } catch (err: any) {
        console.error('Backend upload error:', err)
        setErrorMessage(t('landlordSetupThumbnailUploadFailed') || 'Không thể tải ảnh lên máy chủ. Đang sử dụng bản xem trước.')
      } finally {
        setIsUploading(false)
      }
    }
    reader.onerror = () => {
      setIsUploading(false)
      setErrorMessage(t('landlordSetupThumbnailReadError') || 'Lỗi khi đọc tệp ảnh.')
    }
    reader.readAsDataURL(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleRemove = () => {
    setPreviewUrl('')
    setFileName('')
    setFileSize('')
    setErrorMessage(null)
    onChange('')
    onFileChange?.(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Text as="label" size="xs" weight="bold" color="default" uppercase className="tracking-wide">
          {resolvedLabel}
        </Text>
        {resolvedHint && <Text as="span" size="2xs" color="subtle">{resolvedHint}</Text>}
      </div>

      <TextInput
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        containerClassName="hidden"
        className="hidden"
      />

      {/* When an image is selected */}
      {previewUrl ? (
        <div className="relative overflow-hidden rounded-2xl border border-line bg-surface p-3">
          <div className="relative h-48 w-full overflow-hidden rounded-xl bg-zinc-900/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Thumbnail preview" className="h-full w-full object-cover" />

            {isUploading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 text-white backdrop-blur-xs">
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
                <Text as="span" size="xs" weight="semibold" color="white" className="mt-2">
                  {t('landlordSetupThumbnailUploading')}
                </Text>
              </div>
            )}
          </div>

          <div className="mt-3 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ImageIcon className="h-4 w-4" />
              </div>
              <div className="truncate text-xs">
                <Text size="xs" weight="semibold" color="default" truncate>
                  {fileName || resolvedLabel}
                </Text>
                {fileSize && <Text size="2xs" color="subtle">{fileSize}</Text>}
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                leftIcon={<RefreshCw />}
              >
                <Text as="span" size="xs" weight="medium" color="inherit">
                  {t('landlordSetupThumbnailChange')}
                </Text>
              </Button>

              <Button
                variant="danger"
                onClick={handleRemove}
                disabled={isUploading}
                leftIcon={<X />}
              >
                <Text as="span" size="xs" weight="medium" color="inherit">
                  {t('landlordSetupThumbnailRemove')}
                </Text>
              </Button>
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
              ? 'border-primary bg-primary/5 scale-[0.99]'
              : 'border-line bg-surface/50 hover:border-primary/60 hover:bg-card-hover'
          }`}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-xs">
            <UploadCloud className="h-6 w-6" />
          </div>

          <div className="mt-3 space-y-1">
            <Text size="sm" weight="bold" color="default">
              {t('landlordSetupThumbnailUploadPrompt')}
            </Text>
            <Text size="xs" color="subtle">
              {resolvedHint}
            </Text>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs font-medium text-danger pt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <Text as="span" size="xs" weight="medium" color="danger">
            {errorMessage}
          </Text>
        </div>
      )}
    </div>
  )
}
