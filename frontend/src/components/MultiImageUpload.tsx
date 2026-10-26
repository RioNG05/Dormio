'use client'

import React, { useState, useRef, useCallback, useEffect } from 'react'
import Image from 'next/image'
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
} from 'lucide-react'
import { Button, Text, Modal } from '@/components/ui'
import { uploadImageToBackend } from '@/services/upload.service'
import { useTranslations } from '@/context/LanguageContext'
import { cn } from '@/lib/utils'

export interface MultiImageUploadProps {
  values: string[]
  onChange: (urls: string[]) => void
  folder?: string
  maxImages?: number
  maxSizeMb?: number
  disabled?: boolean
  error?: string | null
  label?: string
  helperText?: string
  containerClassName?: string
  onDirty?: () => void
}

interface UploadingQueueItem {
  id: string
  previewUrl: string
  isUploading: boolean
  error?: string | null
  file?: File
}

export function MultiImageUpload({
  values = [],
  onChange,
  folder = 'dormio/posts',
  maxImages = 10,
  maxSizeMb = 15,
  disabled = false,
  error: externalError,
  label,
  helperText,
  containerClassName,
  onDirty,
}: MultiImageUploadProps) {
  const t = useTranslations('guest')

  const deviceInputRef = useRef<HTMLInputElement | null>(null)
  const cameraInputRef = useRef<HTMLInputElement | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)

  const [isDragging, setIsDragging] = useState(false)
  const [internalError, setInternalError] = useState<string | null>(null)
  const [uploadingItems, setUploadingItems] = useState<UploadingQueueItem[]>([])

  // Camera modal state
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false)
  const [cameraLoading, setCameraLoading] = useState(false)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment')

  // Inspect / preview zoomed photo
  const [inspectedImageUrl, setInspectedImageUrl] = useState<string | null>(null)

  const activeError = externalError || internalError
  const isAtMaxImages = values.length + uploadingItems.length >= maxImages

  // ─── File Processing & Upload Pipeline ──────────────────────────────────────
  const processAndUploadFiles = useCallback(
    async (files: File[]) => {
      if (disabled) return
      setInternalError(null)

      const availableSlots = maxImages - (values.length + uploadingItems.length)
      if (availableSlots <= 0) {
        setInternalError(
          t('guestPostsCreateMaxImagesReached', { max: maxImages }) ||
            `Đã đạt tối đa ${maxImages} ảnh.`,
        )
        return
      }

      const filesToProcess = files.slice(0, availableSlots)

      for (const file of filesToProcess) {
        if (!file.type.startsWith('image/')) {
          setInternalError('Chỉ chấp nhận tệp định dạng hình ảnh (JPG, PNG, WEBP).')
          continue
        }

        if (file.size > maxSizeMb * 1024 * 1024) {
          setInternalError(`Ảnh "${file.name}" vượt quá kích thước cho phép (${maxSizeMb}MB).`)
          continue
        }

        const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`

        // Read local base64 for instant optimistic preview
        const reader = new FileReader()
        reader.onload = async e => {
          const base64Data = e.target?.result as string
          if (!base64Data) return

          // Add to uploading queue
          const queueItem: UploadingQueueItem = {
            id: tempId,
            previewUrl: base64Data,
            isUploading: true,
            file,
          }

          setUploadingItems(prev => [...prev, queueItem])
          onDirty?.()

          // Upload to backend Cloudinary storage
          try {
            const res = await uploadImageToBackend(base64Data, folder)
            const uploadedUrl = res?.url || base64Data

            // Remove from uploading queue and append to final values
            setUploadingItems(prev => prev.filter(item => item.id !== tempId))
            onChange([...values, uploadedUrl])
          } catch (uploadErr: any) {
            console.error('Failed to upload image to Cloudinary:', uploadErr)
            setUploadingItems(prev =>
              prev.map(item =>
                item.id === tempId
                  ? {
                      ...item,
                      isUploading: false,
                      error:
                        uploadErr?.message ||
                        t('guestPostsCreateUploadFailed') ||
                        'Tải ảnh thất bại',
                    }
                  : item,
              ),
            )
          }
        }

        reader.readAsDataURL(file)
      }
    },
    [disabled, maxImages, values, uploadingItems.length, maxSizeMb, t, folder, onChange, onDirty],
  )

  // ─── Input Handlers ────────────────────────────────────────────────────────
  const handleDeviceInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleCameraCaptureChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processAndUploadFiles(Array.from(e.target.files))
      e.target.value = ''
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled && !isAtMaxImages) {
      setIsDragging(true)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (disabled || isAtMaxImages) return

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processAndUploadFiles(Array.from(e.dataTransfer.files))
    }
  }

  // ─── Reorder & Delete Actions ──────────────────────────────────────────────
  const handleRemoveImage = (indexToRemove: number) => {
    if (disabled) return
    const newValues = values.filter((_, idx) => idx !== indexToRemove)
    onChange(newValues)
    onDirty?.()
  }

  const handleSetCoverPhoto = (indexToCover: number) => {
    if (disabled || indexToCover === 0) return
    const item = values[indexToCover]
    const remaining = values.filter((_, idx) => idx !== indexToCover)
    onChange([item, ...remaining])
    onDirty?.()
  }

  const handleRemoveUploadingItem = (idToRemove: string) => {
    setUploadingItems(prev => prev.filter(item => item.id !== idToRemove))
  }

  // ─── Web Camera Live Stream Modal ──────────────────────────────────────────
  const startCamera = async (mode: 'user' | 'environment') => {
    stopCamera()
    setCameraLoading(true)
    setCameraError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraError(
        t('guestPostsCreateCameraPermissionDenied') ||
          'Trình duyệt không hỗ trợ trực tiếp mở camera webcam.',
      )
      setCameraLoading(false)
      return
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play().catch(() => {})
      }
      setCameraLoading(false)
    } catch (err: any) {
      console.warn('Could not start camera live stream:', err)
      setCameraLoading(false)
      setCameraError(
        t('guestPostsCreateCameraPermissionDenied') ||
          'Không thể truy cập camera. Vui lòng cấp quyền hoặc tải ảnh từ thiết bị.',
      )
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  const openCamera = () => {
    // Check if on touch/mobile device: use native capture for best mobile OS camera experience
    const isMobileDevice =
      typeof window !== 'undefined' &&
      (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
        window.matchMedia('(pointer:coarse)').matches)

    if (isMobileDevice && cameraInputRef.current) {
      cameraInputRef.current.click()
      return
    }

    setIsCameraModalOpen(true)
    startCamera(facingMode)
  }

  const closeCamera = () => {
    stopCamera()
    setIsCameraModalOpen(false)
    setCameraError(null)
  }

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const handleSnapPhoto = () => {
    if (!videoRef.current) return
    const video = videoRef.current

    try {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth || 1280
      canvas.height = video.videoHeight || 720
      const ctx = canvas.getContext('2d')

      if (ctx) {
        // Draw video frame to canvas
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.92)

        // Convert base64 dataUrl to File
        fetch(dataUrl)
          .then(res => res.blob())
          .then(blob => {
            const snappedFile = new File([blob], `camera-${Date.now()}.jpg`, {
              type: 'image/jpeg',
            })
            processAndUploadFiles([snappedFile])
          })
      }
    } catch (err) {
      console.error('Failed to capture video snapshot:', err)
    } finally {
      closeCamera()
    }
  }

  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  return (
    <div className={cn('space-y-4 w-full', containerClassName)}>
      {/* Label & Counter */}
      {label && (
        <div className="flex items-center justify-between">
          <Text as="label" size="xs" weight="bold" color="default" className="block select-none">{label}</Text>
          <Text as="span" size="2xs" weight="semibold" color="subtle">
            {t('guestPostsCreateImageCount', {
              count: values.length,
              max: maxImages,
            }) || `Đã chọn: ${values.length}/${maxImages} ảnh`}
          </Text>
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
          variant="secondary"
          disabled={disabled || isAtMaxImages}
          onClick={() => deviceInputRef.current?.click()}
          leftIcon={<UploadCloud className="text-primary shrink-0" />}
        >
          <Text as="span" size="xs" weight="medium" color="inherit">
            {t('guestPostsCreateUploadDevice') || 'Tải ảnh từ máy'}
          </Text>
        </Button>

        <Button
          variant="secondary"
          disabled={disabled || isAtMaxImages}
          onClick={openCamera}
          leftIcon={<Camera className="text-accent shrink-0" />}
        >
          <Text as="span" size="xs" weight="medium" color="inherit">
            {t('guestPostsCreateCaptureCamera') || 'Chụp ảnh camera'}
          </Text>
        </Button>

        {isAtMaxImages && (
          <Text as="span" size="xs" weight="medium" color="warning" className="ml-auto flex items-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            <Text as="span" color="inherit">
              {t('guestPostsCreateMaxImagesReached', { max: maxImages }) ||
                `Đã đạt giới hạn tối đa ${maxImages} ảnh`}
            </Text>
          </Text>
        )}
      </div>

      {/* Drag & Drop Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!disabled && !isAtMaxImages) {
            deviceInputRef.current?.click()
          }
        }}
        className={cn(
          'relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl transition-all duration-200 select-none',
          isDragging
            ? 'border-primary bg-primary/5 scale-[0.99]'
            : 'border-line hover:border-primary bg-surface/60 hover:bg-card-hover',
          disabled || isAtMaxImages ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer',
        )}
      >
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="w-12 h-12 rounded-2xl bg-card shadow-xs border border-line flex items-center justify-center text-muted group-hover:text-primary transition-colors">
            <UploadCloud className="w-6 h-6 text-primary" />
          </div>
          <div>
            <Text size="xs" weight="bold" color="default">
              {t('guestPostsCreateDropzonePrompt') || 'Kéo thả ảnh vào đây hoặc nhấp để tải từ máy'}
            </Text>
            <Text size="2xs" color="subtle" weight="medium" className="mt-0.5">
              {t('guestPostsCreateDropzoneSub', { max: maxImages, size: maxSizeMb }) ||
                `Hỗ trợ JPG, PNG, WEBP (tối đa ${maxImages} ảnh, mỗi ảnh tối đa ${maxSizeMb}MB)`}
            </Text>
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
              className="relative group rounded-2xl overflow-hidden border border-line aspect-video bg-card-hover shadow-xs transition-all hover:shadow-md"
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
                <div className="absolute top-2 left-2 px-2.5 py-1 bg-primary text-white text-[10px] font-black rounded-lg shadow-sm flex items-center gap-1 z-10">
                  <Star className="w-3 h-3 fill-current" />
                  <span>{t('guestPostsCreateCoverBadge') || 'Ảnh bìa'}</span>
                </div>
              )}

              {/* Action Overlay */}
              <div className="absolute inset-0 bg-zinc-950/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-20">
                {/* Inspect Button */}
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setInspectedImageUrl(url)}
                  title="Xem ảnh phóng to"
                >
                  <Eye />
                </Button>

                {/* Make Cover Button (if not already cover) */}
                {idx > 0 && !disabled && (
                  <Button
                    variant="secondary"
                    size="icon"
                    onClick={() => handleSetCoverPhoto(idx)}
                    title={t('guestPostsCreateSetCoverTooltip') || 'Đặt làm ảnh bìa'}
                  >
                    <Star />
                  </Button>
                )}

                {/* Delete Button */}
                {!disabled && (
                  <Button
                    variant="danger"
                    size="icon"
                    onClick={() => handleRemoveImage(idx)}
                    title="Xóa ảnh"
                  >
                    <Trash2 />
                  </Button>
                )}
              </div>
            </div>
          ))}

          {/* Uploading Queue Cards */}
          {uploadingItems.map(item => (
            <div
              key={item.id}
              className="relative rounded-2xl overflow-hidden border border-line aspect-video bg-card-hover shadow-xs flex items-center justify-center"
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
                    <Loader2 className="w-6 h-6 text-primary animate-spin" />
                    <Text as="span" size="3xs" weight="bold" color="white" className="tracking-wide">
                      {t('guestPostsCreateUploadingText') || 'Đang tải ảnh...'}
                    </Text>
                  </>
                ) : item.error ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-400" />
                    <Text as="span" size="3xs" weight="bold" color="danger">{item.error}</Text>
                    <Button
                      variant="danger"
                      onClick={() => handleRemoveUploadingItem(item.id)}
                      className="mt-1"
                    >
                      <Text as="span" size="xs" weight="medium" color="inherit">
                        {t('guestPostsCreateUploadRetry') || 'Bỏ qua'}
                      </Text>
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
        <Text size="2xs" weight="semibold" color="danger" className="flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <Text as="span" color="inherit">{activeError}</Text>
        </Text>
      )}
      {!activeError && helperText && (
        <Text size="2xs" color="subtle" weight="medium">{helperText}</Text>
      )}

      {/* ─── Webcam Modal for Desktop Direct Capture ─────────────────────────── */}
      <Modal
        isOpen={isCameraModalOpen}
        onClose={closeCamera}
        size="lg"
        header={
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/10 flex items-center justify-center text-accent">
              <Camera className="w-4 h-4" />
            </div>
            <Text as="h3" size="sm" weight="bold" color="default">
              {t('guestPostsCreateCameraModalTitle') || 'Chụp ảnh từ Camera'}
            </Text>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Video Viewport */}
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-800">
            {cameraLoading && (
              <div className="flex flex-col items-center space-y-2 text-zinc-300">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
                <Text as="span" size="xs" weight="semibold" className="text-zinc-300">Đang kết nối camera...</Text>
              </div>
            )}

            {cameraError ? (
              <div className="p-4 text-center space-y-2 text-rose-400">
                <AlertCircle className="w-8 h-8 mx-auto text-danger" />
                <Text size="xs" weight="medium" color="danger">{cameraError}</Text>
                <Button
                  variant="outline"
                  onClick={() => {
                    closeCamera()
                    cameraInputRef.current?.click()
                  }}
                  className="mt-2"
                >
                  <Text as="span" size="xs" weight="medium" color="inherit">
                    Dùng tệp ảnh thay thế
                  </Text>
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
              variant="outline"
              onClick={handleToggleFacingMode}
              leftIcon={<RotateCcw />}
              title="Đổi camera trước/sau"
            >
              <Text as="span" size="xs" weight="medium" color="inherit">
                {t('guestPostsCreateCameraModalSwitch') || 'Đổi camera'}
              </Text>
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={closeCamera}
              >
                <Text as="span" size="xs" weight="medium" color="inherit">
                  {t('guestPostsCreateCameraModalClose') || 'Đóng'}
                </Text>
              </Button>
              <Button
                disabled={cameraLoading || !!cameraError}
                onClick={handleSnapPhoto}
                leftIcon={<Camera />}
              >
                <Text as="span" size="xs" weight="medium" color="white">
                  {t('guestPostsCreateCameraModalSnap') || 'Chụp ảnh'}
                </Text>
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ─── Zoom Image Lightbox Modal ────────────────────────────────────────── */}
      <Modal
        isOpen={Boolean(inspectedImageUrl)}
        onClose={() => setInspectedImageUrl(null)}
        size="3xl"
        className="bg-black border-zinc-800 p-0 overflow-hidden"
      >
        <div className="relative w-full aspect-video flex items-center justify-center">
          {inspectedImageUrl && (
            <Image
              src={inspectedImageUrl}
              alt="Enlarged photo"
              fill
              unoptimized
              className="object-contain"
            />
          )}
        </div>
      </Modal>
    </div>
  )
}
