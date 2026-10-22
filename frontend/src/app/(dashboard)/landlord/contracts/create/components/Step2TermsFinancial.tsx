'use client'

import React from 'react'
import { AlertCircle, Calendar, DollarSign, X } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, DateInput, NumberInput, SelectInput, TextareaInput } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'
import { ContractWizardFooter } from './ContractWizardFooter'

export function Step2TermsFinancial() {
  const t = useTranslations('landlord')
  const {
    flowType,
    rentPrice,
    setRentPrice,
    depositAmount,
    setDepositAmount,
    monthlyPaymentDate,
    setMonthlyPaymentDate,
    rentPaymentCycle,
    setRentPaymentCycle,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    note,
    setNote,
    errorMessage,
    setErrorMessage,
  } = useContractCreate()

  return (
    <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
      <div className="border-b border-line pb-3">
        <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-primary" />
          {t('landlordContractsCreateStep2Btn')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Rent Price */}
        <NumberInput
          label={t('landlordContractsCreateRentPriceLabel')}
          required
          min={0}
          step={50000}
          suffixText="VNĐ/tháng"
          helperText={`${Number(rentPrice || 0).toLocaleString('vi-VN')} ₫`}
          value={rentPrice}
          onChange={e => setRentPrice(Number(e.target.value))}
        />

        {/* Deposit Amount */}
        <NumberInput
          label={t('landlordContractsCreateDepositLabel')}
          required
          min={0}
          disabled={flowType === 'platform'}
          suffixText="VNĐ"
          helperText={
            flowType === 'platform'
              ? t('landlordContractsCreateDepositInheritedNote')
              : `${Number(depositAmount || 0).toLocaleString('vi-VN')} ₫`
          }
          value={depositAmount}
          onChange={e => setDepositAmount(Number(e.target.value))}
        />

        {/* Monthly Payment Date */}
        <NumberInput
          label={t('landlordContractsCreatePaymentDateLabel')}
          required
          min={1}
          max={31}
          suffixText={t('landlordContractsCreatePaymentDateSuffix')}
          helperText={t('landlordContractDetailPaymentDayValue', { day: monthlyPaymentDate })}
          value={monthlyPaymentDate}
          onChange={e => setMonthlyPaymentDate(Number(e.target.value))}
        />

        {/* Payment Cycle */}
        <SelectInput
          label={t('landlordContractsCreatePaymentCycleLabel')}
          required
          value={rentPaymentCycle}
          onChange={e => setRentPaymentCycle(Number(e.target.value))}
        >
          <option value={1}>{t('landlordContractsCreateCycle1M')}</option>
          <option value={3}>{t('landlordContractsCreateCycle3M')}</option>
          <option value={6}>{t('landlordContractsCreateCycle6M')}</option>
          <option value={12}>{t('landlordContractsCreateCycle12M')}</option>
        </SelectInput>
      </div>

      <div className="border-b border-line pb-3 pt-2">
        <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
          <Calendar className="w-4 h-4 text-primary" />
          {t('landlordContractDetailTimelineSection')}
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <DateInput
          label={t('landlordContractsCreateStartDateLabel')}
          required
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
        />

        <DateInput
          label={t('landlordContractsCreateEndDateLabel')}
          required
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />

        <div className="col-span-full">
          <TextareaInput
            label={t('landlordContractsCreateNoteLabel')}
            placeholder={t('landlordContractsCreateNotePlaceholder')}
            rows={3}
            value={note}
            onChange={e => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* Error Alert if any */}
      {errorMessage && (
        <div className="flex items-center gap-3 p-4 bg-danger-soft border border-danger-subtle text-danger rounded-2xl text-xs font-bold animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0 text-danger" />
          <span>{errorMessage}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setErrorMessage(null)}
            className="ml-auto"
          >
            <X />
          </Button>
        </div>
      )}

      {/* Navigation Footer */}
      <ContractWizardFooter />
    </div>
  )
}

