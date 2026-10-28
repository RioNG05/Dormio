'use client'

import React from 'react'
import { Modal, Button } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { ComplaintLightboxModalProps } from './types'

export function ComplaintLightboxModal({ imageUrl, onClose }: ComplaintLightboxModalProps) {
  const t = useTranslations('tenantPortal')

  return (
    <Modal
      isOpen={Boolean(imageUrl)}
      onClose={onClose}
      title={t('tenantEvidencePhotoTitle')}
      size="lg"
    >
      <Modal.Body className="p-0">
        <div className="max-h-[70vh] overflow-hidden rounded-2xl bg-zinc-950 flex items-center justify-center">
          {imageUrl && (
            <img src={imageUrl} alt="Preview" className="w-full h-full object-contain" />
          )}
        </div>
      </Modal.Body>
      <Modal.Footer className="flex justify-end">
        <Button size="md" variant="secondary" onClick={onClose}>
          {t('tenantBtnClose')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
