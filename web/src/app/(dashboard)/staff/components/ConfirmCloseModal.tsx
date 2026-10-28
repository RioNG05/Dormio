'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Modal, Button, Text } from '@/components/ui'

interface ConfirmCloseModalProps {
  isOpen: boolean
  onContinueEditing: () => void
  onDiscardAndClose: () => void
}

export function ConfirmCloseModal({
  isOpen,
  onContinueEditing,
  onDiscardAndClose,
}: ConfirmCloseModalProps) {
  const t = useTranslations('staffPortal')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onContinueEditing}
      size="sm"
    >
      <Modal.Body className="p-6 space-y-5 text-center">
        <div className="w-12 h-12 rounded-2xl bg-warning-soft border border-warning-subtle text-warning flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>
        <div className="space-y-1.5">
          <Text as="h3" size="base" weight="black">
            {t('confirmCloseTitle')}
          </Text>
          <Text size="xs" color="secondary" className="leading-relaxed">
            {t('confirmCloseDesc')}
          </Text>
        </div>
      </Modal.Body>
      <Modal.Footer className="grid grid-cols-2 gap-2.5 p-6 pt-0 border-t-0">
        <Button
          variant="outline"
          size="md"
          onClick={onContinueEditing}
        >
          {t('btnContinueEditing')}
        </Button>
        <Button
          variant="danger"
          size="md"
          onClick={onDiscardAndClose}
        >
          {t('btnDiscardAndClose')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
