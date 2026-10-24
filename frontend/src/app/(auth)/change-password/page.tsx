'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  KeyRound,
  Lock,
  Eye,
  EyeOff,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  LogOut,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { userService } from '@/services/user.service'
import { getHighestRoleRedirect, resolveErrorMessage } from '@/utils'
import { TextInput, Button, Form, Text } from '@/components/ui'

const DEFAULT_INITIAL_PASSWORD = '88888888'

export default function ChangePasswordPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const { user, isLoggedIn, isHydrating, logout, updateUserProfile } = useAuth()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  // Redirect unauthenticated guests to login
  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      router.replace('/login')
    }
  }, [isHydrating, isLoggedIn, router])

  const isMinLength = newPassword.length >= 8
  const isDifferent = Boolean(newPassword && newPassword !== DEFAULT_INITIAL_PASSWORD)
  const isMatching = Boolean(newPassword && confirmPassword && newPassword === confirmPassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!newPassword || !confirmPassword) {
      return
    }

    if (!isMinLength) {
      setError(t('authChangePassErrLength'))
      return
    }

    if (newPassword === DEFAULT_INITIAL_PASSWORD) {
      setError(t('authChangePassErrSame'))
      return
    }

    if (newPassword !== confirmPassword) {
      setError(t('authChangePassErrMatch'))
      return
    }

    setIsLoading(true)

    try {
      await userService.changePassword({
        currentPassword: DEFAULT_INITIAL_PASSWORD,
        newPassword,
      })

      // Update user state so guards allow dashboard access
      updateUserProfile({ mustChangePassword: false })
      setIsSuccess(true)

      // Determine redirect path based on user roles
      const { redirectPath } = getHighestRoleRedirect(user)
      const targetUrl = redirectPath && redirectPath.length > 1 ? redirectPath : '/landlord'

      setTimeout(() => {
        router.replace(targetUrl)
      }, 1000)
    } catch (err: unknown) {
      const message = resolveErrorMessage(err, tErrors, t('authLoginErrGeneric'))
      setError(message)
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    logout()
    router.replace('/login')
  }

  if (isHydrating) {
    return (
      <div className="min-h-[300px] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header & Security Badge */}
      <div className="space-y-2">
        <Text
          as="span"
          variant="caption"
          size="3xs"
          weight="black"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-warning-soft text-warning rounded-full border border-warning-subtle uppercase tracking-wider"
        >
          <ShieldAlert className="w-3.5 h-3.5 text-warning" />
          {t('authChangePassBadge')}
        </Text>

        <Text as="h1" variant="heading" size="2xl" className="text-foreground tracking-tight">
          {t('authChangePassTitle')}
        </Text>
        <Text variant="body" size="xs" color="subtle" className="leading-relaxed">
          {t('authChangePassSubtitle')}
        </Text>
      </div>

      {/* Security Informational Notice Box */}
      <div className="bg-warning-soft border border-warning-subtle rounded-2xl p-4 flex gap-3 text-start">
        <KeyRound className="w-5 h-5 text-warning shrink-0 mt-0.5" />
        <div className="space-y-1">
          <Text variant="body" size="xs" className="text-foreground font-medium leading-relaxed">
            {t('authChangePassNotice')}
          </Text>
          {user?.name && (
            <Text variant="caption" size="2xs" color="subtle">
              {user.name} {user.phone ? `(${user.phone})` : ''}
            </Text>
          )}
        </div>
      </div>

      {/* Success Notification Banner */}
      {isSuccess && (
        <div className="bg-success-soft border border-success-subtle rounded-2xl p-4 flex items-center gap-3 text-success animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-success" />
          <Text variant="body" size="xs" weight="bold" color="success">
            {t('authChangePassSuccess')}
          </Text>
        </div>
      )}

      {/* Error Alert Box */}
      {error && !isSuccess && (
        <div className="bg-danger-soft border border-danger-subtle rounded-2xl p-3.5 text-danger text-xs font-semibold animate-in fade-in">
          {error}
        </div>
      )}

      {/* Main Password Form */}
      <Form onSubmit={handleSubmit} className="space-y-4">
        {/* New Password Field */}
        <TextInput
          label={t('authChangePassNewLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type={showNewPassword ? 'text' : 'password'}
          required
          disabled={isLoading || isSuccess}
          placeholder={t('authChangePassNewPlaceholder')}
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowNewPassword(!showNewPassword)}
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
              title={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? <EyeOff /> : <Eye />}
            </Button>
          }
          className="rounded-2xl py-3 border-line focus:border-primary"
        />

        {/* Confirm Password Field */}
        <TextInput
          label={t('authChangePassConfirmLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          disabled={isLoading || isSuccess}
          placeholder={t('authChangePassConfirmPlaceholder')}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <Button
              size="icon-xs"
              variant="ghost"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
              title={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? <EyeOff /> : <Eye />}
            </Button>
          }
          className="rounded-2xl py-3 border-line focus:border-primary"
        />

        {/* Password Quality Checklist */}
        <div className="bg-surface/50 border border-line rounded-2xl p-3.5 space-y-2">
          <div className="flex items-center gap-2 text-xs">
            {isMinLength ? (
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-line flex items-center justify-center text-muted shrink-0 text-[10px]">
                •
              </div>
            )}
            <Text
              as="span"
              size="2xs"
              weight="medium"
              color={isMinLength ? 'success' : 'secondary'}
              className={isMinLength ? 'font-semibold' : undefined}
            >
              {t('authChangePassRuleLength')}
            </Text>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isDifferent ? (
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-line flex items-center justify-center text-muted shrink-0 text-[10px]">
                •
              </div>
            )}
            <Text
              as="span"
              size="2xs"
              weight="medium"
              color={isDifferent ? 'success' : 'secondary'}
              className={isDifferent ? 'font-semibold' : undefined}
            >
              {t('authChangePassRuleDiff')}
            </Text>
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isMatching ? (
              <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            ) : (
              <div className="w-4 h-4 rounded-full border border-line flex items-center justify-center text-muted shrink-0 text-[10px]">
                •
              </div>
            )}
            <Text
              as="span"
              size="2xs"
              weight="medium"
              color={isMatching ? 'success' : 'secondary'}
              className={isMatching ? 'font-semibold' : undefined}
            >
              {t('authChangePassRuleMatch')}
            </Text>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          size="lg"
          fullWidth
          isLoading={isLoading}
          disabled={!newPassword || !confirmPassword || isSuccess}
          rightIcon={<ArrowRight />}
          className="rounded-2xl py-3.5 shadow-lg shadow-primary/20 font-bold"
        >
          {isLoading ? t('authChangePassLoading') : t('authChangePassSubmitBtn')}
        </Button>
      </Form>

      {/* Alternative Action: Logout and Return to Login */}
      <div className="pt-2 text-center">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleLogout}
          leftIcon={<LogOut />}
          className="text-muted hover:text-foreground text-xs"
        >
          {t('authChangePassLogout')}
        </Button>
      </div>
    </div>
  )
}
