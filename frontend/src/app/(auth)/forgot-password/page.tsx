'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'
import { Form } from '@/components/ui/Form'

export default function ForgotPasswordPage() {
  const t = useTranslations('auth')
  const [method, setMethod] = useState<'phone' | 'email'>('phone')
  const [accountIdentifier, setAccountIdentifier] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountIdentifier) return
    setSubmitted(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header & Badge */}
      <div className="space-y-2">
        <Text
          as="span"
          variant="caption"
          size="3xs"
          weight="black"
          className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full border border-primary/30 uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5 fill-primary" /> {t('authForgotPassBadge')}
        </Text>

        <Text as="h1" variant="heading" size="2xl" className="text-foreground tracking-tight">
          {t('authForgotPassword')}
        </Text>
        <Text variant="body" size="xs" color="subtle" className="leading-relaxed">
          {t('authForgotPassSubtitle')}
        </Text>
      </div>

      {submitted ? (
        <div className="bg-surface rounded-3xl p-6 border border-line text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <Text as="h3" variant="heading" size="base" className="text-foreground">
              {t('authForgotPassSuccessTitle')}
            </Text>
            <Text variant="body" size="xs" color="subtle" className="mt-1 leading-relaxed">
              {t('authForgotPassSuccessMsg', { account: accountIdentifier })}
            </Text>
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            onClick={() => setSubmitted(false)}
          >
            {t('authForgotPassResendBtn')}
          </Button>
        </div>
      ) : (
        <>
          {/* Input Method Selector Tabs (Phone vs Email) using Button Component */}
          <div className="flex p-1 bg-card-hover/80 rounded-2xl border border-line gap-1">
            <Button
              type="button"
              variant={method === 'phone' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMethod('phone')}
              leftIcon={<Phone  />}
              className="flex-1"
            >
              {t('authLoginMethodPhone')}
            </Button>
            <Button
              type="button"
              variant={method === 'email' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMethod('email')}
              leftIcon={<Mail  />}
              className="flex-1"
            >
              {t('authLoginMethodEmail')}
            </Button>
          </div>

          {/* Form using Base Form Component */}
          <Form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label={
                method === 'phone' ? t('authForgotPassPhoneLabel') : t('authForgotPassEmailLabel')
              }
              labelClassName="text-[11px] font-extrabold text-muted uppercase tracking-wider"
              type={method === 'phone' ? 'tel' : 'email'}
              required
              placeholder={method === 'phone' ? '0987 654 321' : 'nguyenvana@gmail.com'}
              value={accountIdentifier}
              onChange={e => setAccountIdentifier(e.target.value)}
              leftIcon={
                method === 'phone' ? (
                  <Phone className="w-4 h-4 text-muted" />
                ) : (
                  <Mail className="w-4 h-4 text-muted" />
                )
              }
              className="rounded-2xl py-3 border-line focus:border-primary"
            />

            {/* Submit Button using Base Form.Actions & Button */}
            <Form.Actions align="center" stackedOnMobile={false} className="pt-2">
              <Button fullWidth
                type="submit"
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight  />}
                className="sm:text-sm"
              >
                {t('authForgotPassSubmitBtn')}
              </Button>
            </Form.Actions>
          </Form>
        </>
      )}

      {/* Bottom Auth Navigation Link */}
      <div className="text-center pt-2">
        <Text variant="body" size="xs" color="subtle">
          {t('authForgotPassRememberPrompt')}{' '}
          <Link href="/login">
            <Text
              as="span"
              variant="body"
              size="xs"
              weight="extrabold"
              className="text-primary hover:underline"
            >
              {t('authForgotPassBackToLogin')}
            </Text>
          </Link>
        </Text>
      </div>
    </div>
  )
}
