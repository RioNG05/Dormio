'use client'

import React from 'react'
import { AlertCircle, FileSignature, X } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button } from '@/components/ui'
import { useContractCreate } from '../context/ContractCreateContext'
import { ContractWizardFooter } from './ContractWizardFooter'

export function Step3ReviewSubmit() {
  const t = useTranslations('landlord')
  const {
    flowType,
    selectedRoomObj,
    tenantFullName,
    tenantPhone,
    identification,
    startDate,
    endDate,
    monthlyPaymentDate,
    rentPaymentCycle,
    rentPrice,
    depositAmount,
    initialMeterReadings,
    note,
    errorMessage,
    setErrorMessage,
  } = useContractCreate()

  return (
    <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs">
      <div className="text-center max-w-md mx-auto space-y-2">
        <div className="w-12 h-12 rounded-full bg-primary-soft text-primary flex items-center justify-center mx-auto mb-2">
          <FileSignature className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-black text-foreground">
          {t('landlordContractsCreateStep3Header')}
        </h2>
        <p className="text-xs text-muted">{t('landlordContractsCreateStep3Desc')}</p>
      </div>

      {/* Summary Card */}
      <div className="bg-surface border border-line rounded-2xl p-5 space-y-4 text-xs">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <span className="font-bold text-muted">{t('landlordContractDetailStatus')}:</span>
          <span
            className={`px-3 py-1 rounded-full font-black text-[11px] ${
              flowType === 'platform'
                ? 'bg-deposit-soft text-deposit'
                : 'bg-success-soft text-success'
            }`}
          >
            {flowType === 'platform'
              ? t('landlordContractsCreateFlowPlatformBadge')
              : t('landlordContractsCreateFlowDirectBadge')}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractDetailRoom')}:
            </span>
            <span className="font-black text-foreground text-sm">
              {t('landlordContractDetailRoomPrefix')} {selectedRoomObj?.roomNumber} (
              {t('landlordRoomDetailFloor')} {selectedRoomObj?.floor})
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractDetailTenant')}:
            </span>
            <span className="font-black text-foreground text-sm block">
              {tenantFullName} ({tenantPhone})
            </span>
            {identification.identityNumber && (
              <span className="text-[11px] text-muted font-mono block mt-0.5">
                CCCD: {identification.identityNumber}
              </span>
            )}
          </div>

          <div>
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractDetailDuration')}:
            </span>
            <span className="font-bold text-foreground">
              {startDate} &rarr; {endDate}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractsCreatePaymentCycleLabel')}:
            </span>
            <span className="font-bold text-foreground">
              {t('landlordContractDetailPaymentDayValue', { day: monthlyPaymentDate })} &bull;{' '}
              {rentPaymentCycle} {t('landlordContractsPaymentCycleLabel')}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractDetailRentPrice')}:
            </span>
            <span className="font-black text-primary text-sm">
              {Number(rentPrice).toLocaleString('vi-VN')} ₫ {t('landlordContractsPerMonth')}
            </span>
          </div>

          <div>
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractDetailDeposit')}:
            </span>
            <span className="font-black text-deposit text-sm">
              {Number(depositAmount).toLocaleString('vi-VN')} ₫
            </span>
          </div>
        </div>

        {initialMeterReadings.length > 0 &&
          initialMeterReadings.some(r => r.readingValue !== '') && (
            <div className="pt-3 border-t border-line">
              <span className="text-muted block text-[11px] font-semibold mb-2">
                {t('landlordContractsReviewHandoverTitle')}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {initialMeterReadings
                  .filter(r => r.readingValue !== '')
                  .map(r => (
                    <div
                      key={r.serviceId}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-background border border-line text-xs"
                    >
                      <span className="font-semibold text-foreground">{r.serviceName}</span>
                      <span className="font-bold text-primary font-mono">
                        {r.readingValue} {r.unit}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          )}

        {note && (
          <div className="pt-2 border-t border-line">
            <span className="text-muted block text-[11px] font-semibold">
              {t('landlordContractsCreateNoteLabel')}:
            </span>
            <p className="text-foreground/90 italic">{note}</p>
          </div>
        )}
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

