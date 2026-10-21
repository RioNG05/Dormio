'use client'

import React from 'react'
import { AlertTriangle } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'

export function CancelConfirmModal() {
  const t = useTranslations('landlord')
  const { showConfirmClose, setShowConfirmClose, handleConfirmClose } = useContractCreate()

  if (!showConfirmClose) return null

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in"
      onMouseDown={e => {
        if (e.target === e.currentTarget) setShowConfirmClose(false)
      }}
    >
      <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95 border border-line">
        <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
          <AlertTriangle className="w-6 h-6" />
        </div>

        <div className="text-center space-y-1">
          <h3 className="text-base font-black text-foreground">
            {t('landlordContractsCreateConfirmCloseTitle')}
          </h3>
          <p className="text-xs text-muted font-medium">
            {t('landlordContractsCreateConfirmCloseDesc')}
          </p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            size="sm"
            type="button"
            variant="secondary"
            onClick={() => setShowConfirmClose(false)}
            className="flex-1"
          >
            {t('landlordContractsCreateConfirmCloseKeep')}
          </Button>
          <Button
            size="sm"
            type="button"
            variant="danger"
            onClick={handleConfirmClose}
            className="flex-1"
          >
            {t('landlordContractsCreateConfirmCloseDiscard')}
          </Button>
        </div>
      </div>
    </div>
  )
}

