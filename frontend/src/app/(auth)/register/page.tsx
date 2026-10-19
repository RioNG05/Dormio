'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Phone, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { api } from '@/services/api'
import { getHighestRoleRedirect, resolveErrorMessage } from '@/utils'
import { TextInput, Button, Checkbox, Form, Text } from '@/components/ui'

export default function RegisterPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const { loginWithToken } = useAuth()

  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Form states
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [agreed, setAgreed] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedPhone = phone.trim()
    if (!trimmedPhone) {
      setError(t('authRegisterErrPhoneRequired'))
      return
    }

    // Validate phone number format (starts with 0, 10 digits)
    const phoneRegex = /^0[0-9]{9}$/
    if (!phoneRegex.test(trimmedPhone)) {
      setError(t('authRegisterErrPhoneInvalid'))
      return
    }

    const trimmedEmail = email.trim()
    if (trimmedEmail) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(trimmedEmail)) {
        setError(t('authRegisterErrEmailInvalid'))
        return
      }
    }

    if (password !== confirmPassword) {
      setError(t('authRegisterErrPassMismatch'))
      return
    }

    if (password.length < 8) {
      setError(t('authRegisterErrPassLength'))
      return
    }

    if (!agreed) {
      setError(t('authRegisterErrTermsRequired'))
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const payload: {
        phoneNumber: string
        password: string
        fullName?: string
        email?: string
      } = {
        phoneNumber: trimmedPhone,
        password,
      }

      if (fullName.trim()) {
        payload.fullName = fullName.trim()
      }
      if (trimmedEmail) {
        payload.email = trimmedEmail
      }

      const response = await api.post<any>('/v1/auth/register', payload)

      const authData = response?.data || response
      const { token, user } = authData || {}

      if (!token || !user) {
        throw new Error(t('authRegisterErrCannotCreate'))
      }

      // Determine highest achieved role and target redirect path
      const { role: displayRole, redirectPath } = getHighestRoleRedirect(user)

      loginWithToken(token, {
        id: user.id,
        name: user.username || fullName || trimmedPhone,
        email: user.email || trimmedEmail || '',
        phone: user.phoneNumber,
        role: displayRole,
        mustChangePassword: false,
      })

      router.push(redirectPath)
    } catch (err: unknown) {
      const message = resolveErrorMessage(err, tErrors, t('authLoginErrGeneric'))
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="space-y-2">
        <Text as="h1" variant="heading" size="2xl" className="text-foreground tracking-tight">
          {t('authRegisterTitle')}
        </Text>
        <Text variant="body" size="xs" color="subtle" className="leading-relaxed">
          {t('authRegisterSubtitle')}
        </Text>
      </div>

      {/* Main Registration Form reusing Base Form Component */}
      <Form onSubmit={handleSubmit} isLoading={isLoading} className="space-y-4">
        {/* 1. Phone Number (Required) */}
        <TextInput
          label={t('authLoginPhoneLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type="tel"
          required
          placeholder={t('authRegisterPhonePlaceholder')}
          value={phone}
          onChange={e => setPhone(e.target.value)}
          leftIcon={<Phone className="w-4 h-4 text-muted" />}
          className="rounded-2xl py-3 border-line focus:border-[#2AC1BC]"
        />

        {/* 2. Full Name (Optional) */}
        <TextInput
          label={t('authRegisterFullNameLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type="text"
          required={false}
          placeholder={t('authRegisterFullNamePlaceholder')}
          value={fullName}
          onChange={e => setFullName(e.target.value)}
          leftIcon={<User className="w-4 h-4 text-muted" />}
          className="rounded-2xl py-3 border-line focus:border-[#2AC1BC]"
        />

        {/* 3. Email (Optional) */}
        <TextInput
          label={t('authRegisterEmailOptionalLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type="email"
          required={false}
          placeholder={t('authRegisterEmailPlaceholder')}
          value={email}
          onChange={e => setEmail(e.target.value)}
          leftIcon={<Mail className="w-4 h-4 text-muted" />}
          className="rounded-2xl py-3 border-line focus:border-[#2AC1BC]"
        />

        {/* 4. Password (Required) */}
        <TextInput
          label={t('authLoginPasswordLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type={showPassword ? 'text' : 'password'}
          required
          placeholder={t('authRegisterPassPlaceholder')}
          value={password}
          onChange={e => setPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <Button size="icon"
              type="button"
              variant="ghost"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          }
          className="rounded-2xl py-3 border-line focus:border-[#2AC1BC]"
        />

        {/* 5. Confirm Password (Required) */}
        <TextInput
          label={t('authRegisterConfirmPassLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type={showConfirmPassword ? 'text' : 'password'}
          required
          placeholder={t('authRegisterConfirmPassPlaceholder')}
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          leftIcon={<Lock className="w-4 h-4 text-muted" />}
          rightIcon={
            <Button size="icon"
              type="button"
              variant="ghost"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
            >
              {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          }
          className="rounded-2xl py-3 border-line focus:border-[#2AC1BC]"
        />

        {/* 6. Terms Checkbox using Base Checkbox & Text Component */}
        <div className="pt-1">
          <Checkbox
            id="register-terms"
            size="sm"
            checked={agreed}
            onChange={e => setAgreed(e.target.checked)}
            label={
              <Text variant="body" size="xs" color="secondary" className="select-none font-medium">
                {t('authRegisterTermsAgree')}{' '}
                <Link href="/terms">
                  <Text
                    as="span"
                    variant="body"
                    size="xs"
                    weight="extrabold"
                    className="text-[#2AC1BC] hover:underline"
                  >
                    {t('authRegisterTermsLink')}
                  </Text>
                </Link>{' '}
                {t('authRegisterTermsAnd')}{' '}
                <Link href="/privacy">
                  <Text
                    as="span"
                    variant="body"
                    size="xs"
                    weight="extrabold"
                    className="text-[#2AC1BC] hover:underline"
                  >
                    {t('authRegisterPrivacyLink')}
                  </Text>
                </Link>{' '}
                {t('authRegisterTermsSuffix')}
              </Text>
            }
          />
        </div>

        {/* Error alert reusing Form.Alert */}
        {error && <Form.Alert variant="error" message={error} onClose={() => setError(null)} />}

        {/* Submit Button using Base Form.Actions & Button Component */}
        <Form.Actions align="center" stackedOnMobile={false} className="pt-2">
          <Button fullWidth
            type="submit"
            variant="primary"
            size="lg"
            disabled={!agreed || isLoading}
            isLoading={isLoading}
            rightIcon={<ArrowRight  />}
            className="sm:text-sm"
          >
            {t('authRegisterSubmitBtn')}
          </Button>
        </Form.Actions>
      </Form>

      {/* Bottom Auth Navigation Link */}
      <div className="text-center pt-2">
        <Text variant="body" size="xs" color="subtle">
          {t('authRegisterAlreadyAccount')}{' '}
          <Link href="/login">
            <Text
              as="span"
              variant="body"
              size="xs"
              weight="extrabold"
              className="text-[#2AC1BC] hover:underline"
            >
              {t('authRegisterLoginLink')}
            </Text>
          </Link>
        </Text>
      </div>
    </div>
  )
}
