'use client'

import React from 'react'
import { AlertCircle, Calendar, Camera, DollarSign, Gauge, Trash2, X, Zap } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, DateInput, NumberInput, SelectInput, TextareaInput } from '@/components/ui'
import { meterReadingService } from '@/services/meter-reading.service'
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
    initialMeterReadings,
    updateInitialMeterReading,
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
          suffixText={t('landlordContractsCreateRentPriceSuffix')}
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
          suffixText={t('landlordContractsCreateDepositSuffix')}
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

      {/* Handover Utility Meter Readings Section */}
      <div className="border-b border-line pb-3 pt-2">
        <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
          <Gauge className="w-4 h-4 text-primary" />
          {t('landlordContractsCreateHandoverSection')}
        </h2>
        <p className="text-xs text-muted mt-1">
          {t('landlordContractsCreateHandoverDesc')}
        </p>
      </div>

      {initialMeterReadings.length === 0 ? (
        <div className="p-4 rounded-xl bg-surface border border-line text-xs text-muted">
          {t('landlordContractsCreateNoMeteredServices')}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {initialMeterReadings.map(reading => (
            <div
              key={reading.serviceId}
              className="p-4 rounded-2xl bg-surface border border-line space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-foreground text-sm flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-primary" />
                  {reading.serviceName}
                </span>
                <span className="text-[11px] font-semibold text-muted px-2 py-0.5 rounded-md bg-background border border-line">
                  {reading.unit}
                </span>
              </div>

              <NumberInput
                label={t('landlordContractsCreateHandoverReadingLabel')}
                min={0}
                placeholder={t('landlordContractsCreateHandoverReadingPlaceholder')}
                suffixText={reading.unit}
                value={reading.readingValue}
                onChange={e =>
                  updateInitialMeterReading(reading.serviceId, {
                    readingValue: e.target.value === '' ? '' : Number(e.target.value),
                  })
                }
              />

              {/* Photo Upload / Camera with AI and Delete */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-medium text-muted block">
                  {t('landlordContractsCreateHandoverPhoto')}
                </span>
                {reading.imageUrl ? (
                  <div className="relative group rounded-xl overflow-hidden border border-line bg-background p-2 flex items-center justify-between">
                    <img
                      src={reading.imageUrl}
                      alt={reading.serviceName}
                      className="w-14 h-14 object-cover rounded-lg"
                    />
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="danger"
                        size="sm"
                        onClick={() =>
                          updateInitialMeterReading(reading.serviceId, { imageUrl: null })
                        }
                        className="gap-1.5 text-xs"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        {t('landlordMeterRecordDeletePhoto') || 'Xóa ảnh'}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id={`file-${reading.serviceId}`}
                      accept="image/*"
                      className="hidden"
                      onChange={async e => {
                        const file = e.target.files?.[0]
                        if (!file) return
                        const reader = new FileReader()
                        reader.onload = async () => {
                          const base64 = reader.result as string
                          updateInitialMeterReading(reading.serviceId, { imageUrl: base64 })
                          try {
                            const aiRes = await meterReadingService.scanMeterWithAi(
                              base64,
                              reading.serviceName,
                            )
                            if (aiRes?.success && aiRes.data?.isValid && aiRes.data.readingValue != null) {
                              updateInitialMeterReading(reading.serviceId, {
                                readingValue: aiRes.data.readingValue,
                                imageUrl: base64,
                              })
                            }
                          } catch {
                            // Non-blocking AI fallback
                          }
                        }
                        reader.readAsDataURL(file)
                      }}
                    />
                    <label
                      htmlFor={`file-${reading.serviceId}`}
                      className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-dashed border-line bg-background hover:bg-surface text-xs font-semibold text-muted hover:text-foreground cursor-pointer transition-colors"
                    >
                      <Camera className="w-4 h-4 text-primary" />
                      <span>{t('landlordMeterRecordTakePhoto', { name: reading.serviceName })}</span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

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

