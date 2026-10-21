'use client'

import React from 'react'
import { Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'

export function ContractWizardFooter() {
  const t = useTranslations('landlord')
  const { step, isPending, goToStep, handleAttemptClose, handleSubmitContract } =
    useContractCreate()

  return (
    <div className="flex justify-between items-center pt-4 border-t border-line">
      {step === 1 ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAttemptClose}
          disabled={isPending}
        >
          {t('landlordContractsCreateCancelBtn')}
        </Button>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => goToStep((step - 1) as 1 | 2)}
          disabled={isPending}
          leftIcon={<ChevronLeft />}
        >
          {t('landlordContractsCreatePrevStep')}
        </Button>
      )}

      {step === 1 && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => goToStep(2)}
          disabled={isPending}
          rightIcon={<ChevronRight />}
        >
          {t('landlordContractsCreateNextStep')}
        </Button>
      )}

      {step === 2 && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={() => goToStep(3)}
          disabled={isPending}
          rightIcon={<ChevronRight />}
        >
          {t('landlordContractsCreateNextStep')}
        </Button>
      )}

      {step === 3 && (
        <Button
          type="button"
          variant="primary"
          size="sm"
          disabled={isPending}
          isLoading={isPending}
          onClick={handleSubmitContract}
          leftIcon={<Check />}
        >
          {isPending
            ? t('landlordContractsCreateSubmitting')
            : t('landlordContractsCreateSubmitBtn')}
        </Button>
      )}
    </div>
  )
}

