'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Phone, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { api } from '@/services/api'
import { getHighestRoleRedirect, resolveErrorMessage } from '@/utils'
import { TextInput, Button, Checkbox, Form, Text } from '@/components/ui'

export default function LoginPage() {
  const t = useTranslations('auth')
  const tErrors = useTranslations('errors')
  const router = useRouter()
  const { loginWithToken } = useAuth()

  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Form states
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountIdentifier || !password) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await api.post<any>('/v1/auth/login', {
        identifier: accountIdentifier.trim(),
        password,
      })

      const authData = response?.data || response
      const { token, user, mustChangePassword } = authData || {}

      if (!token || !user) {
        throw new Error(t('authLoginErrCannotVerify'))
      }

      // Determine highest achieved role and target redirect path:
      const { role: displayRole, redirectPath } = getHighestRoleRedirect(user)

      loginWithToken(token, {
        id: user.id,
        name: user.username || accountIdentifier,
        email: user.email || '',
        phone: user.phoneNumber,
        role: displayRole,
        mustChangePassword: !!mustChangePassword,
      })

      // Spec: if mustChangePassword → redirect to change-password page
      if (mustChangePassword) {
        router.push('/change-password')
      } else {
        const redirectQuery =
          typeof window !== 'undefined'
            ? new URLSearchParams(window.location.search).get('redirect')
            : null
        const targetUrl =
          redirectQuery && redirectQuery.startsWith('/') ? redirectQuery : redirectPath
        router.push(targetUrl)
      }
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
          {t('authLoginWelcomeTitle')}
        </Text>
        <Text variant="body" size="xs" color="subtle" className="leading-relaxed">
          {t('authLoginWelcomeDesc')}
        </Text>
      </div>

      {/* Input Method Selector Tabs (Phone vs Email) using Button Component */}
      <div className="flex p-1 bg-card-hover/80 rounded-2xl border border-line gap-1">
        <Button
          type="button"
          variant={method === 'phone' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setMethod('phone')
            setAccountIdentifier('')
            setError(null)
          }}
          leftIcon={<Phone  />}
          className="flex-1"
        >
          {t('authLoginMethodPhone')}
        </Button>
        <Button
          type="button"
          variant={method === 'email' ? 'primary' : 'ghost'}
          size="sm"
          onClick={() => {
            setMethod('email')
            setAccountIdentifier('')
            setError(null)
          }}
          leftIcon={<Mail  />}
          className="flex-1"
        >
          {t('authLoginMethodEmail')}
        </Button>
      </div>

      {/* Login Form reusing Base Form Component */}
      <Form onSubmit={handleSubmit} isLoading={isLoading} className="space-y-4">
        {/* Phone or Email input */}
        <TextInput
          label={method === 'phone' ? t('authLoginPhoneLabel') : t('authLoginEmailLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          type={method === 'phone' ? 'tel' : 'email'}
          required
          placeholder={
            method === 'phone' ? t('authLoginPhonePlaceholder') : t('authLoginEmailPlaceholder')
          }
          value={accountIdentifier}
          onChange={e => setAccountIdentifier(e.target.value)}
          leftIcon={
            method === 'phone' ? (
              <Phone className="w-4 h-4 text-muted" />
            ) : (
              <Mail className="w-4 h-4 text-muted" />
            )
          }
          className="rounded-2xl py-3 border-line focus:border-[#2AC1BC]"
        />

        {/* Password Field & Forgot Link */}
        <TextInput
          label={t('authLoginPasswordLabel')}
          labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
          labelRight={
            <Link href="/forgot-password">
              <Text
                as="span"
                variant="body"
                size="xs"
                weight="extrabold"
                className="text-[#2AC1BC] hover:underline cursor-pointer"
              >
                {t('authForgotPassword')}
              </Text>
            </Link>
          }
          type={showPassword ? 'text' : 'password'}
          required
          placeholder={t('authLoginPassPlaceholder')}
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

        {/* Remember me Checkbox */}
        <div className="flex items-center justify-between pt-0.5">
          <Checkbox
            size="sm"
            id="remember-me"
            checked={rememberMe}
            onChange={e => setRememberMe(e.target.checked)}
            label={
              <Text variant="body" size="xs" color="secondary">
                {t('authRememberMe')}
              </Text>
            }
          />
        </div>

        {/* Error alert reusing Form.Alert */}
        {error && <Form.Alert variant="error" message={error} onClose={() => setError(null)} />}

        {/* Submit Button reusing Base Form.Actions & Button */}
        <Form.Actions align="center" stackedOnMobile={false} className="pt-2">
          <Button fullWidth
            type="submit"
            variant="primary"
            size="lg"
            isLoading={isLoading}
            rightIcon={<ArrowRight  />}
            className="sm:text-sm"
          >
            {t('authLoginSubmitBtn')}
          </Button>
        </Form.Actions>
      </Form>

      {/* Bottom Auth Navigation Link */}
      <div className="text-center pt-2">
        <Text variant="body" size="xs" color="subtle">
          {t('authNoAccount')}{' '}
          <Link href="/register">
            <Text
              as="span"
              variant="body"
              size="xs"
              weight="extrabold"
              className="text-[#2AC1BC] hover:underline"
            >
              {t('authRegisterNow')}
            </Text>
          </Link>
        </Text>
      </div>
    </div>
  )
}
