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
    <div className="flex items-center justify-center gap-2 sm:gap-3 bg-card p-3 rounded-2xl border border-line shadow-2xs">
      <Button
        variant={step === 1 ? 'primary' : 'ghost'}
        type="button"
        onClick={() => goToStep(1)}
        size="md"
        leftIcon={step > 1 ? <Check className="w-4 h-4 text-emerald-500" /> : <Home className="w-4 h-4" />}
        className={step > 1 ? 'text-foreground' : undefined}
      >
        {t('landlordContractsCreateStep1Btn')}
      </Button>

      <ChevronRight className="w-4 h-4 text-muted shrink-0" />

      <Button
        variant={step === 2 ? 'primary' : 'ghost'}
        type="button"
        onClick={() => goToStep(2)}
        size="md"
        leftIcon={step > 2 ? <Check className="w-4 h-4 text-emerald-500" /> : <DollarSign className="w-4 h-4" />}
        className={step > 2 ? 'text-foreground' : undefined}
      >
        {t('landlordContractsCreateStep2Btn')}
      </Button>

      <ChevronRight className="w-4 h-4 text-muted shrink-0" />

      <Button
        variant={step === 3 ? 'primary' : 'ghost'}
        type="button"
        onClick={() => goToStep(3)}
        size="md"
        leftIcon={<FileSignature className="w-4 h-4" />}
      >
        {t('landlordContractsCreateStep3Header')}
      </Button>
    </div>
  )
}

