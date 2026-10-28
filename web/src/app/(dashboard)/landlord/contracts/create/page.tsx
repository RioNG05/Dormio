'use client'

import React, { Suspense } from 'react'
import { Building2, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { ToastContainer, Breadcrumb } from '@/components/ui'
import { ContractCreateProvider, useContractCreate } from './context/ContractCreateContext'
import { ContractWizardProgress } from './components/ContractWizardProgress'
import { Step1RoomTenant } from './components/Step1RoomTenant'
import { Step2TermsFinancial } from './components/Step2TermsFinancial'
import { Step3ReviewSubmit } from './components/Step3ReviewSubmit'
import { CancelConfirmModal } from './components/CancelConfirmModal'
import { IdImagePreviewModal } from './components/IdImagePreviewModal'

export default function CreateContractPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      }
    >
      <ContractCreateProvider>
        <CreateContractPage />
      </ContractCreateProvider>
    </Suspense>
  )
}

function CreateContractPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { step, toasts, dismissToast } = useContractCreate()

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        backHref="/landlord/contracts"
        backLabel={t('landlordContractDetailBack')}
        current={t('landlordContractsCreateTitle')}
      />

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-line shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-primary" />
            <span>{activeBuilding?.name || t('landlordContractsCreatePropertyFallback')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {t('landlordContractsCreateTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {t('landlordContractsCreateSubtitle')}
          </p>
        </div>
      </div>

      {/* Progress Wizard */}
      <ContractWizardProgress />

      {/* Dynamic Step Display */}
      {step === 1 && <Step1RoomTenant />}
      {step === 2 && <Step2TermsFinancial />}
      {step === 3 && <Step3ReviewSubmit />}

      {/* RULE 10: Custom Pop-up Confirmation Modal for Unsaved Changes */}
      <CancelConfirmModal />

      {/* Full Image Preview Modal */}
      <IdImagePreviewModal />

      {/* Centralized Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
