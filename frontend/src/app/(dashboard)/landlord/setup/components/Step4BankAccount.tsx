'use client'

import React from 'react'
import { CreditCard, QrCode, Info, ChevronLeft, Check } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Form, Text, TextInput } from '@/components/ui'
import { POPULAR_BANKS, type BankInfoState } from '../types'

export interface Step4BankAccountProps {
  bankInfo: BankInfoState
  onChangeBankInfo: React.Dispatch<React.SetStateAction<BankInfoState>>
  isValid: boolean
  isSubmitting: boolean
  onBack: () => void
  onSubmit: () => void
}

export function Step4BankAccount({
  bankInfo,
  onChangeBankInfo,
  isValid,
  isSubmitting,
  onBack,
  onSubmit,
}: Step4BankAccountProps) {
  const t = useTranslations('landlord')

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Bank Account Input Form */}
        <div className="lg:col-span-7 rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-line pb-4">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" variant="heading">
                {t('landlordSetupSection4Title')}
              </Text>
              <Text as="p" variant="subtitle">
                {t('landlordSetupSection4Desc')}
              </Text>
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <TextInput
                label={t('landlordSetupBankNameLabel')}
                required
                value={bankInfo.bankName}
                onChange={e => onChangeBankInfo(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder={t('landlordSetupBankNamePlaceholder')}
              />
              <div className="space-y-1.5">
                <Text as="span" size="3xs" weight="bold" color="subtle">
                  {t('landlordSetupBankQuickSelectLabel')}
                </Text>
                <div className="flex flex-wrap gap-1.5">
                  {POPULAR_BANKS.map(bName => (
                    <Button
                      key={bName}
                      type="button"
                      size="sm"
                      variant={bankInfo.bankName === bName ? 'primary' : 'outline'}
                      onClick={() => onChangeBankInfo(prev => ({ ...prev, bankName: bName }))}
                    >
                      {bName}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <TextInput
              label={t('landlordSetupBankAccNumLabel')}
              required
              value={bankInfo.accountNumber}
              onChange={e =>
                onChangeBankInfo(prev => ({
                  ...prev,
                  accountNumber: e.target.value.replace(/[^0-9]/g, ''),
                }))
              }
              placeholder={t('landlordSetupBankAccNumPlaceholder')}
              className="font-mono"
            />

            <TextInput
              label={t('landlordSetupBankAccNameLabel')}
              required
              value={bankInfo.accountName}
              onChange={e =>
                onChangeBankInfo(prev => ({
                  ...prev,
                  accountName: e.target.value.toUpperCase(),
                }))
              }
              placeholder={t('landlordSetupBankAccNamePlaceholder')}
              className="uppercase font-bold"
            />

            <div className="p-3.5 rounded-2xl bg-surface border border-line text-xs text-muted space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-foreground">
                <Info className="w-4 h-4 text-primary shrink-0" />
                <Text as="span" size="xs" weight="bold" color="default">
                  {t('landlordSetupBankStepNote')}
                </Text>
              </div>
              <Text as="p" size="2xs" color="secondary" className="leading-relaxed">
                {t('landlordSetupBankAutoNotice')}
              </Text>
            </div>
          </div>
        </div>

        {/* Right Column: Live VietQR Card Preview */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-line bg-card p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 border-b border-line pb-3">
              <CreditCard className="w-4 h-4 text-primary" />
              <Text as="h3" size="sm" weight="black" color="default">
                {t('landlordSetupBankCardPreviewTitle')}
              </Text>
            </div>

            <div className="p-6 bg-gradient-to-br from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl border border-zinc-800 space-y-4 text-center shadow-xl relative overflow-hidden w-full">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-xl pointer-events-none" />
              <QrCode className="w-16 h-16 text-primary mx-auto relative z-10 animate-pulse" />
              <div className="relative z-10 space-y-1">
                <Text as="h4" size="sm" weight="black" color="white">
                  {bankInfo.bankName || 'MB Bank / Vietcombank'}
                </Text>
                <Text
                  as="p"
                  size="lg"
                  weight="black"
                  color="brand"
                  className="font-mono tracking-widest"
                >
                  {bankInfo.accountNumber || '0000000000'}
                </Text>
                <Text
                  as="p"
                  size="xs"
                  color="subtle"
                  weight="bold"
                  uppercase
                  className="tracking-wider"
                >
                  {bankInfo.accountName || 'NGUYEN VAN A'}
                </Text>
              </div>
              <Text
                as="span"
                variant="badge"
                color="success"
                className="inline-block px-3 py-1 bg-emerald-500/20 rounded-full border border-emerald-500/30 relative z-10 whitespace-nowrap"
              >
                {t('landlordSetupBankAutoNotice')}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4 Navigation / Final Submit */}
      <Form.Actions align="between" className="pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onBack}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          {t('landlordSetupBackToStep3')}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={isSubmitting || !isValid}
          isLoading={isSubmitting}
          onClick={onSubmit}
          leftIcon={<Check className="w-4 h-4" />}
        >
          {t('landlordSetupSubmit')}
        </Button>
      </Form.Actions>
    </section>
  )
}
