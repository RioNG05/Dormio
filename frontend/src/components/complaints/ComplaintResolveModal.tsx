'use client'

import React, { useState } from 'react'
import { AlertCircle, AlertTriangle, CheckCircle2, Clock, Wrench } from 'lucide-react'
import { Modal, Button, Text, TextareaInput } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { grievanceService } from '@/services/grievance.service'
import { ComplaintResolveModalProps } from './types'

export function ComplaintResolveModal({
  isOpen,
  item,
  role,
  onClose,
  onResolved,
}: ComplaintResolveModalProps) {
  const t = useTranslations('tenantPortal')

  const [status, setStatus] = useState<'in_progress' | 'resolved'>('resolved')
  const [resolutionNote, setResolutionNote] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const isFormDirty = resolutionNote.trim() !== ''

  const handleClose = () => {
    if (isFormDirty) {
      setShowExitConfirm(true)
    } else {
      resetForm()
      onClose()
    }
  }

  const resetForm = () => {
    setStatus('resolved')
    setResolutionNote('')
    setFormError(null)
    setShowExitConfirm(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!item) return

    if (status === 'resolved' && resolutionNote.trim().length < 5) {
      setFormError(t('complaintResolutionMinLengthError'))
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      let updatedItem: any
      if (status === 'in_progress') {
        if (role === 'landlord') {
          updatedItem = await grievanceService.updateLandlordGrievanceInProgress(item.id)
        } else {
          updatedItem = await grievanceService.updateStaffGrievanceInProgress(item.id)
        }
      } else {
        if (role === 'landlord') {
          updatedItem = await grievanceService.resolveLandlordGrievance(item.id, {
            resolutionNote: resolutionNote.trim(),
          })
        } else {
          updatedItem = await grievanceService.resolveStaffGrievance(item.id, {
            resolutionNote: resolutionNote.trim(),
          })
        }
      }

      onResolved(updatedItem)
      resetForm()
      onClose()
    } catch (err: unknown) {
      console.error('Resolve error:', err)
      const errorMsg = err instanceof Error ? err.message : t('complaintResolveError')
      setFormError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!item) return null

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleClose} size="lg" asForm onSubmit={handleSubmit}>
        <Modal.Header
          icon={
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Wrench className="w-5 h-5" />
            </div>
          }
          title={t('complaintResolveModalTitle')}
          description={t('complaintResolveModalSubtitle')}
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

          {/* Issue summary */}
          <div className="p-3.5 bg-card rounded-2xl border border-line space-y-1">
            <Text size="xs" weight="bold" color="default" className="line-clamp-1">
              {item.title}
            </Text>
            <Text size="2xs" color="secondary" className="line-clamp-2">
              {item.description}
            </Text>
          </div>

          {/* Status Choice */}
          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-1.5">
              {t('complaintFieldStatusLabel')}
            </Text>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant={status === 'in_progress' ? 'primary' : 'secondary'}
                onClick={() => setStatus('in_progress')}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                {t('complaintStatusOptionInProgress')}
              </Button>
              <Button
                type="button"
                variant={status === 'resolved' ? 'primary' : 'secondary'}
                onClick={() => setStatus('resolved')}
                leftIcon={<CheckCircle2 className="w-4 h-4" />}
              >
                {t('complaintStatusOptionResolved')}
              </Button>
            </div>
          </div>

          {/* Resolution notes textarea */}
          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-1.5">
              {t('complaintFieldResolutionLabel')}{' '}
              {status === 'resolved' && <span className="text-danger">*</span>}
            </Text>
            <TextareaInput
              rows={4}
              value={resolutionNote}
              onChange={e => setResolutionNote(e.target.value)}
              placeholder={t('complaintFieldResolutionPlaceholder')}
              containerClassName="space-y-0"
              className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:outline-none focus:border-primary text-xs leading-relaxed"
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="flex items-center justify-end gap-2.5">
          <Button size="md" variant="secondary" onClick={handleClose}>
            {t('tenantBtnCancel')}
          </Button>
          <Button size="md" type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
            {t('complaintBtnSubmitResolution')}
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
