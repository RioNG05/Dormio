'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ExternalLink } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { userService } from '@/services/user.service'
import { TextInput, Button, Form, Text } from '@/components/ui'
import { resolveErrorMessage } from '@/utils'

export default function SecurityTab() {
  const t = useTranslations('guest')
  const tErrors = useTranslations('errors')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [passwordSavedSuccess, setPasswordSavedSuccess] = useState(false)

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMessage(null)
    setPasswordSavedSuccess(false)

    if (newPassword.length < 8) {
      setErrorMessage(t('guestProfilePasswordErrorMinLength'))
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(t('guestProfileAlertPasswordMismatch'))
      return
    }

    if (currentPassword === newPassword) {
      setErrorMessage(t('guestProfilePasswordErrorMustDiffer'))
      return
    }

    try {
      setIsSubmitting(true)
      await userService.changePassword({
        currentPassword,
        newPassword,
      })

      setPasswordSavedSuccess(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSavedSuccess(false), 4000)
    } catch (err) {
      setErrorMessage(resolveErrorMessage(err, tErrors, t('guestProfilePasswordErrorGeneral')))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Password Toast Success */}
      {passwordSavedSuccess && (
        <Form.Alert
          variant="success"
          message={t('guestProfilePasswordSuccess')}
          onClose={() => setPasswordSavedSuccess(false)}
        />
      )}

      {/* Password Error Alert */}
      {errorMessage && (
        <Form.Alert variant="error" message={errorMessage} onClose={() => setErrorMessage(null)} />
      )}

      {/* Password Change Form using base Form component */}
      <Form variant="card" onSubmit={handleSavePassword} isLoading={isSubmitting}>
        <Form.Header
          title={t('guestProfilePasswordSectionTitle')}
          description={t('guestProfilePasswordSectionSub')}
          actions={
            <Link
              href="/forgot-password"
              className="inline-flex items-center gap-1 underline transition-colors text-muted hover:text-foreground"
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('guestProfilePasswordForgotLink')}
              </Text>
              <ExternalLink className="w-3 h-3" />
            </Link>
          }
        />

        <TextInput
          label={t('guestProfilePasswordCurrentLabel')}
          type={showCurrentPassword ? 'text' : 'password'}
          required
          disabled={isSubmitting}
          placeholder="••••••••"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          rightIcon={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              tabIndex={-1}
            >
              {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          }
        />

        <div className="space-y-1.5">
          <TextInput
            label={t('guestProfilePasswordNewLabel')}
            type={showNewPassword ? 'text' : 'password'}
            required
            disabled={isSubmitting}
            minLength={8}
            placeholder="••••••••"
            value={newPassword}
            onChange={e => setNewPassword(e.target.value)}
            rightIcon={
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setShowNewPassword(!showNewPassword)}
                tabIndex={-1}
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            }
          />

          {/* Password Strength Indicator */}
          {newPassword && (
            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 h-1.5 bg-line rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    newPassword.length >= 10 &&
                    /[A-Z]/.test(newPassword) &&
                    /[0-9]/.test(newPassword)
                      ? 'bg-emerald-500 w-full'
                      : newPassword.length >= 8
                        ? 'bg-amber-500 w-2/3'
                        : 'bg-rose-500 w-1/3'
                  }`}
                />
              </div>
              <Text
                as="span"
                variant="caption"
                size="3xs"
                weight="extrabold"
                color="secondary"
                className="whitespace-nowrap"
              >
                {newPassword.length >= 10 && /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword)
                  ? t('guestProfilePasswordStrengthStrong')
                  : t('guestProfilePasswordStrengthMedium')}
              </Text>
            </div>
          )}
        </div>

        <TextInput
          label={t('guestProfilePasswordConfirmLabel')}
          type={showConfirmPassword ? 'text' : 'password'}
          required
          disabled={isSubmitting}
          minLength={8}
          placeholder="••••••••"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          rightIcon={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              tabIndex={-1}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          }
        />

        <Form.Actions>
          <Button
            fullWidth
            size="xs"
            type="submit"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            rightIcon={<span>&rarr;</span>}
          >
            {t('guestProfilePasswordBtnSave')}
          </Button>
        </Form.Actions>
      </Form>
    </div>
  )
}
