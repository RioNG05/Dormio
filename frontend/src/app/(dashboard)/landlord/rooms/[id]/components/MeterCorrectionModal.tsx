'use client'

import React, { useState } from 'react'
import { Edit, AlertTriangle } from 'lucide-react'
import { Button, NumberInput, TextareaInput, Form, Text, Modal } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'

interface MeterCorrectionModalProps {
  isOpen: boolean
  period: string
  oldElec: number
  newElec: number
  oldWater: number
  newWater: number
  reason: string
  error?: string
  isSubmitting?: boolean
  onClose: () => void
  onSave: () => void
  onChangeNewElec: (val: number) => void
  onChangeNewWater: (val: number) => void
  onChangeReason: (val: string) => void
}

export const MeterCorrectionModal: React.FC<MeterCorrectionModalProps> = ({
  isOpen,
  period,
  oldElec,
  newElec,
  oldWater,
  newWater,
  reason,
  error,
  isSubmitting = false,
  onClose,
  onSave,
  onChangeNewElec,
  onChangeNewWater,
  onChangeReason,
}) => {
  const t = useTranslations('landlord')
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)

  const handleRequestClose = () => {
    if (reason.trim() !== '') {
      setShowDiscardConfirm(true)
    } else {
      onClose()
    }
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    onClose()
  }

  return (
    <>
      <Modal isOpen={isOpen} onClose={handleRequestClose} size="lg">
        <Modal.Header
          title={t('landlordRoomDetailModalCorrectTitle').replace('{period}', period)}
          description={t('landlordRoomDetailModalCorrectDesc')}
          icon={
            <div className="p-2 bg-amber-500/10 text-warning rounded-xl">
              <Edit className="w-5 h-5" />
            </div>
          }
          className="bg-warning-soft"
        />

        <Modal.Body className="space-y-4">
          {error && <Form.Alert variant="error" message={error} />}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <NumberInput
                label={t('landlordRoomDetailNewElecLabel')}
                helperText={t('landlordRoomDetailOldIndexLabel').replace('{index}', String(oldElec))}
                value={newElec}
                onChange={e => onChangeNewElec(parseInt(e.target.value) || 0)}
              />
            </div>

            <div className="p-3 bg-vacant/5 rounded-xl border border-vacant/20">
              <NumberInput
                label={t('landlordRoomDetailNewWaterLabel')}
                helperText={t('landlordRoomDetailOldIndexLabel').replace('{index}', String(oldWater))}
                value={newWater}
                onChange={e => onChangeNewWater(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          <div>
            <TextareaInput
              label={t('landlordRoomDetailReasonRequiredLabel')}
              required
              rows={3}
              value={reason}
              onChange={e => onChangeReason(e.target.value)}
              placeholder={t('landlordRoomDetailReasonPlaceholder')}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="outline" onClick={handleRequestClose}>
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailModalCancelBtn')}
            </Text>
          </Button>
          <Button variant="orange" onClick={onSave} isLoading={isSubmitting}>
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailSaveAndUpdateInvoice')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* UNSAVED CHANGES CONFIRMATION MODAL (RULE 10) */}
      <Modal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <div className="p-3 bg-warning-soft rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <Text as="h3" weight="black" color="default" size="base">
                {t('landlordRoomDetailConfirmCloseTitle')}
              </Text>
              <Text size="xs" color="secondary" weight="medium">
                {t('landlordRoomDetailConfirmCloseDesc')}
              </Text>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button variant="outline" onClick={() => setShowDiscardConfirm(false)}>
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailConfirmCloseContinue')}
              </Text>
            </Button>
            <Button variant="danger" onClick={handleConfirmDiscard}>
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailConfirmCloseDiscard')}
              </Text>
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </>
  )
}

