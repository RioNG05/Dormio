'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Modal } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'

export function CancelConfirmModal() {
  const t = useTranslations('landlord')
  const { showConfirmClose, setShowConfirmClose, handleConfirmClose } = useContractCreate()

  return (
    <Modal
      isOpen={showConfirmClose}
      onClose={() => setShowConfirmClose(false)}
      size="sm"
      title={t('landlordContractsCreateConfirmCloseTitle')}
      description={t('landlordContractsCreateConfirmCloseDesc')}
      icon={
        <div className="w-10 h-10 rounded-xl bg-warning-soft text-warning flex items-center justify-center">
          <AlertTriangle className="w-5 h-5 text-warning" />
        </div>
      }
      footer={
        <div className="flex flex-col-reverse sm:flex-row items-center gap-2.5 w-full">
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowConfirmClose(false)}
            className="w-full sm:flex-1"
          >
            {t('landlordContractsCreateConfirmCloseKeep')}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={handleConfirmClose}
            className="w-full sm:flex-1"
          >
            {t('landlordContractsCreateConfirmCloseDiscard')}
          </Button>
        </div>
      }
    >
      <p className="text-xs text-muted leading-relaxed">
        {t('landlordContractsCreateConfirmCloseDesc')}
      </p>
    </Modal>
  )
}
