'use client'

import React, { useState, useEffect } from 'react'
import { Edit3, X, Save, QrCode } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { userService } from '@/services/user.service'
import { Button, Form, Text, TextInput } from '@/components/ui'
import { resolveErrorMessage } from '@/utils'

export default function BankAccountTab() {
  const t = useTranslations('guest')
  const tErrors = useTranslations('errors')
  const { isLoggedIn } = useAuth()
  const { toast } = useToast()

  const [isEditingBank, setIsEditingBank] = useState(false)
  const [isSavingBank, setIsSavingBank] = useState(false)
  const [bankSaveError, setBankSaveError] = useState('')

  const [bankName, setBankName] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [bankAccountName, setBankAccountName] = useState('')
  const [isBankLoading, setIsBankLoading] = useState(false)
  const [bankLoadError, setBankLoadError] = useState('')

  const handleSaveBank = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!bankName.trim() || !bankAccount.trim() || !bankAccountName.trim()) {
      setBankSaveError(t('guestProfileBankErrorIncomplete'))
      return
    }
    setIsSavingBank(true)
    setBankSaveError('')
    try {
      await userService.upsertBankAccount({
        bankName: bankName.trim(),
        accountNumber: bankAccount.trim(),
        accountName: bankAccountName.trim().toUpperCase(),
      })
      setIsEditingBank(false)
      toast.success(t('guestProfileBankSuccess'))
    } catch (err) {
      setBankSaveError(resolveErrorMessage(err, tErrors, t('guestProfileBankErrorSaveFailed')))
    } finally {
      setIsSavingBank(false)
    }
  }

  useEffect(() => {
    if (!isLoggedIn) return
    setIsBankLoading(true)
    setBankLoadError('')
    userService
      .getBankAccount()
      .then(res => {
        if (res.bankAccount) {
          setBankName(res.bankAccount.bankName)
          setBankAccount(res.bankAccount.accountNumber)
          setBankAccountName(res.bankAccount.accountName)
        }
      })
      .catch(err => {
        setBankLoadError(resolveErrorMessage(err, tErrors, t('guestProfileBankErrorLoadFailed')))
      })
      .finally(() => {
        setIsBankLoading(false)
      })
  }, [isLoggedIn, t, tErrors])

  return (
    <Form onSubmit={handleSaveBank} isLoading={isSavingBank} className="space-y-6 animate-in fade-in duration-300">
      {/* Loading state */}
      {isBankLoading && (
        <div className="p-4 bg-card-hover border border-line rounded-2xl flex items-center gap-3 animate-in fade-in duration-200">
          <span className="w-4 h-4 border-2 border-zinc-400 border-t-transparent rounded-full animate-spin shrink-0" />
          <Text as="span" size="xs" weight="semibold" color="secondary">
            {t('guestProfileBankLoading')}
          </Text>
        </div>
      )}

      {/* Load error */}
      {bankLoadError && !isBankLoading && (
        <Form.Alert
          variant="warning"
          message={bankLoadError}
          onClose={() => setBankLoadError('')}
        />
      )}

      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-sm space-y-6">
        <Form.Header
          title={t('guestProfileBankSectionTitle')}
          description={t('guestProfileBankSectionSub')}
          actions={
            !isEditingBank ? (
              <Button
                onClick={() => setIsEditingBank(true)}
                leftIcon={<Edit3 />}
                className="w-full sm:w-auto rounded-2xl hover:scale-105"
              >
                {t('guestProfileBankEditBtn')}
              </Button>
            ) : (
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <Button
                  variant="secondary"
                  onClick={() => {
                    setIsEditingBank(false)
                    setBankSaveError('')
                  }}
                  leftIcon={<X />}
                >
                  {t('guestProfileBtnCancelShort')}
                </Button>

                <Button
                  type="submit"
                  isLoading={isSavingBank}
                  leftIcon={!isSavingBank ? <Save /> : undefined}
                  className="hover:scale-105"
                >
                  {t('guestProfileBankBtnSave')}
                </Button>
              </div>
            )
          }
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <TextInput
              label={t('guestProfileBankNameLabel')}
              disabled={!isEditingBank}
              value={bankName}
              onChange={e => setBankName(e.target.value)}
              className="py-3 bg-surface rounded-2xl"
            />

            <TextInput
              label={t('guestProfileBankAccNumLabel')}
              disabled={!isEditingBank}
              value={bankAccount}
              onChange={e => setBankAccount(e.target.value)}
              className="py-3 bg-surface rounded-2xl"
            />

            <TextInput
              label={t('guestProfileBankAccNameLabel')}
              disabled={!isEditingBank}
              value={bankAccountName}
              onChange={e => setBankAccountName(e.target.value.toUpperCase())}
              className="py-3 bg-surface rounded-2xl uppercase"
            />
          </div>

          {/* Live VietQR Card Preview */}
          <div className="p-6 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-3xl border border-zinc-800 space-y-4 text-center shadow-xl relative overflow-hidden w-full">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-xl" />
            <QrCode className="w-16 h-16 text-primary mx-auto relative z-10 animate-pulse" />
            <div className="relative z-10">
              <Text as="h4" variant="heading" size="sm" weight="black" color="white">
                {bankName || t('guestProfileBankCardNameDefault')}
              </Text>
              <Text
                variant="heading"
                size="lg"
                weight="black"
                color="brand"
                mono
                className="tracking-widest mt-1"
              >
                {bankAccount || '0000000000'}
              </Text>
              <Text
                variant="caption"
                size="xs"
                weight="bold"
                color="subtle"
                uppercase
                className="mt-1"
              >
                {bankAccountName || t('guestProfileBankCardHolderDefault')}
              </Text>
            </div>
            <Text
              as="span"
              variant="badge"
              size="3xs"
              weight="black"
              color="success"
              className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30 relative z-10 whitespace-nowrap"
            >
              {t('guestProfileBankAutoGenerated')}
            </Text>
          </div>
        </div>
      </div>

      {/* Bottom Save Action Button when Editing Bank */}
      {isEditingBank && (
        <div className="space-y-3 pt-2">
          {bankSaveError && (
            <Form.Alert
              variant="error"
              message={bankSaveError}
              onClose={() => setBankSaveError('')}
            />
          )}
          <Form.Actions>
            <Button
              variant="secondary"
              size="lg"
              disabled={isSavingBank}
              onClick={() => {
                setIsEditingBank(false)
                setBankSaveError('')
              }}
              className="w-full sm:w-auto rounded-2xl"
            >
              {t('guestProfileBtnCancel')}
            </Button>
            <Button
              type="submit"
              size="lg"
              disabled={isSavingBank}
              isLoading={isSavingBank}
              leftIcon={!isSavingBank ? <Save /> : undefined}
              rightIcon={!isSavingBank ? <span>&rarr;</span> : undefined}
              className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/25 hover:scale-105"
            >
              {isSavingBank ? t('guestProfileBankSaving') : t('guestProfileBankBtnSave')}
            </Button>
          </Form.Actions>
        </div>
      )}
    </Form>
  )
}
