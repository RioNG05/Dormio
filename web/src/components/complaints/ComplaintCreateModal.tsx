'use client'

import React, { useState, useRef } from 'react'
import { AlertCircle, AlertTriangle, ShieldCheck, UploadCloud, X } from 'lucide-react'
import { Modal, Button, Text, TextInput, TextareaInput } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { GrievancePriority } from '@/services/grievance.service'
import { ComplaintCreateModalProps } from './types'

export function ComplaintCreateModal({
  isOpen,
  onClose,
  onSubmit,
}: ComplaintCreateModalProps) {
  const t = useTranslations('tenantPortal')

  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<GrievancePriority>('medium')
  const [description, setDescription] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const isFormDirty =
    title.trim() !== '' ||
    description.trim() !== '' ||
    uploadedImages.length > 0 ||
    priority !== 'medium'

  const resetForm = () => {
    setTitle('')
    setPriority('medium')
    setDescription('')
    setUploadedImages([])
    setFormError(null)
    setShowExitConfirm(false)
  }

  const handleClose = () => {
    if (isFormDirty) {
      setShowExitConfirm(true)
    } else {
      resetForm()
      onClose()
    }
  }

  const compressImageFile = (file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = readerEvent => {
        const image = new window.Image()
        image.onload = () => {
          const maxDim = 1280
          let { width, height } = image
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.82))
          } else {
            resolve(readerEvent.target?.result as string)
          }
        }
        image.onerror = () => resolve(readerEvent.target?.result as string)
        image.src = readerEvent.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (uploadedImages.length + files.length > 5) {
      setFormError(t('tenantMaxEvidenceImagesError'))
      return
    }

    const compressedList: string[] = []
    for (let i = 0; i < files.length; i++) {
      const base64 = await compressImageFile(files[i])
      compressedList.push(base64)
    }

    setUploadedImages(prev => [...prev, ...compressedList].slice(0, 5))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError(t('tenantTitleRequiredError'))
      return
    }
    if (description.trim().length < 10) {
      setFormError(t('tenantDescMinLengthError'))
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      await onSubmit({
        title: title.trim(),
        description: description.trim(),
        priority,
        imageUrls: uploadedImages,
      })
      resetForm()
      onClose()
    } catch (err: unknown) {
      console.error('Submit complaint error:', err)
      const errorMsg = err instanceof Error ? err.message : t('tenantSubmitFailedError')
      setFormError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="xl" asForm onSubmit={handleSubmit}>
        <Modal.Header
          icon={
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
          }
          title={t('tenantCreateGrievanceModalTitle')}
          description={t('tenantCreateGrievanceModalSubtitle')}
          onClose={handleClose}
        />

        <Modal.Body className="space-y-4">
          {formError && (
            <div className="p-3 rounded-xl bg-danger-soft border border-danger-subtle text-danger font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <Text size="xs" weight="bold" color="danger">
                {formError}
              </Text>
            </div>
          )}

          {/* Priority Selection */}
          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-1.5">
              {t('tenantFieldSeverityLabel')}
            </Text>
            <div className="grid grid-cols-3 gap-2">
              {[
                { key: 'low', label: t('tenantPriorityLowDesc') },
                { key: 'medium', label: t('tenantPriorityNormalDesc') },
                { key: 'high', label: t('tenantPriorityUrgentDesc') },
              ].map(p => (
                <Button
                  key={p.key}
                  type="button"
                  variant={priority === p.key ? 'primary' : 'secondary'}
                  onClick={() => setPriority(p.key as GrievancePriority)}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-1.5">
              {t('tenantFieldTitleLabel')} <span className="text-danger">*</span>
            </Text>
            <TextInput
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={t('tenantFieldTitlePlaceholder')}
              containerClassName="space-y-0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:outline-none focus:border-primary text-xs"
            />
          </div>

          {/* Description */}
          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-1.5">
              {t('tenantFieldDescLabel')} <span className="text-danger">*</span>
            </Text>
            <TextareaInput
              rows={4}
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('tenantFieldDescPlaceholder')}
              containerClassName="space-y-0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:outline-none focus:border-primary text-xs leading-relaxed"
            />
          </div>

          {/* Image attachments */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <Text as="label" size="xs" weight="bold" color="default">
                {t('tenantFieldPhotosLabel')}
              </Text>
              <Text size="xs" color="secondary">
                {uploadedImages.length}/5
              </Text>
            </div>

            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {uploadedImages.map((img, idx) => (
                <div
                  key={idx}
                  className="relative h-20 rounded-xl overflow-hidden border border-line group"
                >
                  <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    title="Xóa ảnh"
                    onClick={() => removeUploadedImage(idx)}
                    className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                  >
                    <X />
                  </Button>
                </div>
              ))}

              {uploadedImages.length < 5 && (
                <Button
                  type="button"
                  fullWidth
                  variant="ghost"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-col py-3"
                >
                  <UploadCloud className="w-5 h-5 mb-1" />
                  <span className="text-[10px] font-bold">{t('tenantAddPhotoBtn')}</span>
                </Button>
              )}
            </div>
            <TextInput
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileUpload}
              containerClassName="hidden"
              className="hidden"
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="flex items-center justify-end gap-2.5">
          <Button size="md" variant="secondary" onClick={handleClose}>
            {t('tenantBtnCancel')}
          </Button>
          <Button size="md" type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
            {t('tenantBtnSubmitOfficial')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Confirmation Modal on Exit Unsaved (Rule #10) */}
      <Modal isOpen={showExitConfirm} onClose={() => setShowExitConfirm(false)} size="sm">
        <Modal.Body className="pt-4 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <Text as="h3" size="base" weight="black" color="default">
              {t('tenantConfirmCloseFormTitle')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('tenantConfirmCloseFormDesc')}
            </Text>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex items-center gap-2">
          <Button
            size="md"
            variant="secondary"
            onClick={() => setShowExitConfirm(false)}
            className="flex-1"
          >
            {t('tenantBtnKeepEditing')}
          </Button>
          <Button
            size="md"
            variant="danger"
            onClick={() => {
              setShowExitConfirm(false)
              resetForm()
              onClose()
            }}
            className="flex-1"
          >
            {t('tenantBtnDiscardAndClose')}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}
