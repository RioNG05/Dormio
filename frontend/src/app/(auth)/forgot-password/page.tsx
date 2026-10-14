'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Phone, Mail, Sparkles, ArrowRight, CheckCircle2 } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'
import { TextInput } from '@/components/ui/TextInput'

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
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-[#2AC1BC]" /> {t('authForgotPassBadge')}
        </span>

        <Text as="h1" variant="heading" size="2xl" className="text-zinc-900 tracking-tight">
          {t('authForgotPassword')}
        </Text>
        <Text variant="body" size="xs" color="subtle" className="leading-relaxed">
          {t('authForgotPassSubtitle')}
        </Text>
      </div>

      {submitted ? (
        <div className="bg-zinc-50 rounded-3xl p-6 border border-zinc-200 text-center space-y-4 animate-in fade-in duration-300">
          <div className="w-14 h-14 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <Text as="h3" variant="heading" size="base" className="text-zinc-900">
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
            className="px-6 py-2.5 rounded-xl font-extrabold text-xs"
          >
            {t('authForgotPassResendBtn')}
          </Button>
        </div>
      ) : (
        <>
          {/* Input Method Selector Tabs (Phone vs Email) using Button Component */}
          <div className="flex p-1 bg-zinc-100/80 rounded-2xl border border-zinc-200/60 gap-1">
            <Button
              type="button"
              variant={method === 'phone' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMethod('phone')}
              leftIcon={<Phone className="w-3.5 h-3.5" />}
              className={`flex-1 rounded-xl text-xs font-extrabold ${
                method === 'phone'
                  ? 'bg-white text-[#2AC1BC] hover:bg-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t('authLoginMethodPhone')}
            </Button>
            <Button
              type="button"
              variant={method === 'email' ? 'primary' : 'ghost'}
              size="sm"
              onClick={() => setMethod('email')}
              leftIcon={<Mail className="w-3.5 h-3.5" />}
              className={`flex-1 rounded-xl text-xs font-extrabold ${
                method === 'email'
                  ? 'bg-white text-[#2AC1BC] hover:bg-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-800'
              }`}
            >
              {t('authLoginMethodEmail')}
            </Button>
          </div>

          {/* Form using Base TextInput & Button */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <TextInput
              label={
                method === 'phone' ? t('authForgotPassPhoneLabel') : t('authForgotPassEmailLabel')
              }
              labelClassName="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider"
              type={method === 'phone' ? 'tel' : 'email'}
              required
              placeholder={method === 'phone' ? '0987 654 321' : 'nguyenvana@gmail.com'}
              value={accountIdentifier}
              onChange={e => setAccountIdentifier(e.target.value)}
              leftIcon={
                method === 'phone' ? (
                  <Phone className="w-4 h-4 text-zinc-400" />
                ) : (
                  <Mail className="w-4 h-4 text-zinc-400" />
                )
              }
              className="rounded-2xl py-3 border-zinc-200 focus:border-[#2AC1BC]"
            />

            {/* Submit Button */}
            <Button
              type="submit"
              variant="primary"
              size="lg"
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] mt-2"
            >
              {t('authForgotPassSubmitBtn')}
            </Button>
          </form>
        </>
      )}

      {/* Bottom Auth Navigation Link */}
      <div className="text-center pt-2">
        <Text variant="body" size="xs" color="subtle">
          {t('authForgotPassRememberPrompt')}{' '}
          <Link href="/login" className="font-extrabold text-[#2AC1BC] hover:underline">
            {t('authForgotPassBackToLogin')}
          </Link>
        </Text>
      </div>
    </div>
  )
}
