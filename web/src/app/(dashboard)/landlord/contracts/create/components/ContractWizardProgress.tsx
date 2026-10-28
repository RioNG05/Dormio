'use client'

import React from 'react'
import { Check, ChevronRight, DollarSign, FileSignature, Home } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'

export function ContractWizardProgress() {
  const t = useTranslations('landlord')
  const { step, goToStep } = useContractCreate()

  return (
    <div className="flex items-center justify-between sm:justify-center gap-1.5 sm:gap-3 bg-card p-2 sm:p-3 rounded-2xl border border-line shadow-2xs overflow-x-auto">
      <Button
        variant={step === 1 ? 'primary' : 'ghost'}
        onClick={() => goToStep(1)}
        size="sm"
        leftIcon={step > 1 ? <Check className="text-emerald-500 w-4 h-4" /> : <Home className="w-4 h-4" />}
        className={`text-xs sm:text-sm shrink-0 ${step > 1 ? 'text-foreground' : ''}`}
      >
        <span className="hidden sm:inline">{t('landlordContractsCreateStep1Btn')}</span>
        <span className="inline sm:hidden">1. {t('landlordContractDetailRoom')}</span>
      </Button>

      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted shrink-0" />

      <Button
        variant={step === 2 ? 'primary' : 'ghost'}
        onClick={() => goToStep(2)}
        size="sm"
        leftIcon={step > 2 ? <Check className="text-emerald-500 w-4 h-4" /> : <DollarSign className="w-4 h-4" />}
        className={`text-xs sm:text-sm shrink-0 ${step > 2 ? 'text-foreground' : ''}`}
      >
        <span className="hidden sm:inline">{t('landlordContractsCreateStep2Btn')}</span>
        <span className="inline sm:hidden">2. {t('landlordContractDetailDeposit')}</span>
      </Button>

      <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted shrink-0" />

      <Button
        variant={step === 3 ? 'primary' : 'ghost'}
        onClick={() => goToStep(3)}
        size="sm"
        leftIcon={<FileSignature className="w-4 h-4" />}
        className="text-xs sm:text-sm shrink-0"
      >
        <span className="hidden sm:inline">{t('landlordContractsCreateStep3Header')}</span>
        <span className="inline sm:hidden">3. {t('landlordContractsCreateConfirmTitle')}</span>
      </Button>
    </div>
  )
}
