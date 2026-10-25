'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { ShieldOff, Home, LogIn, LogOut, ArrowLeft } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

/**
 * Unauthorized page — shown when a logged-in user attempts to access a route
 * their role is not permitted to view (HTTP 403 Forbidden).
 *
 * Provides recovery actions:
 *  1. Go back to previous page.
 *  2. Return to the public homepage.
 *  3. Go to the login page (without logging out) to log in as a different account.
 *  4. Log out and redirect to login (switch account).
 */
export default function UnauthorizedPage() {
  const t = useTranslations('auth')
  const { logout } = useAuth()
  const router = useRouter()

  const handleSwitchAccount = () => {
    logout()
    router.replace('/login')
  }

  const handleGoBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-surface px-4 py-12">
      {/* Card */}
      <div className="max-w-md w-full text-center bg-card rounded-2xl shadow-sm border border-line px-8 py-10 space-y-6">
        {/* Badge */}
        <Text
          as="div"
          variant="badge"
          size="2xs"
          weight="black"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-danger-soft border border-danger-subtle text-red-500 tracking-widest"
        >
          <ShieldOff className="w-3.5 h-3.5" />
          {t('unauthorizedTagCode')}
        </Text>

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-danger-soft border border-danger-subtle flex items-center justify-center shadow-sm">
          <ShieldOff className="w-10 h-10 text-red-400" strokeWidth={1.5} />
        </div>

        {/* Heading */}
        <div className="space-y-2">
          <Text as="h1" variant="heading" size="2xl" weight="extrabold">
            {t('unauthorizedTitle')}
          </Text>
          <Text variant="subtitle" size="sm" weight="semibold">
            {t('unauthorizedSubtitle')}
          </Text>
        </div>

        {/* Description */}
        <Text variant="body" size="sm" color="subtle">
          {t('unauthorizedDesc')}
        </Text>

        {/* Divider */}
        <div className="h-px bg-card-hover" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Row: Go Back + Back to Home */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              size="md"
              fullWidth
              onClick={handleGoBack}
              leftIcon={<ArrowLeft strokeWidth={2.5} />}
              className="font-semibold text-sm"
            >
              {t('unauthorizedBtnBack')}
            </Button>

            <Button
              href="/"
              variant="white"
              size="md"
              fullWidth
              leftIcon={<Home strokeWidth={2} />}
              className="font-semibold text-sm text-foreground/90 w-full"
            >
              {t('unauthorizedBtnHome')}
            </Button>
          </div>

          {/* Secondary: Log in (keep session, just navigate) */}
          <Button
            href="/login"
            variant="white"
            size="md"
            fullWidth
            leftIcon={<LogIn />}
            className="font-semibold text-sm text-foreground/90 w-full"
          >
            {t('unauthorizedBtnLogin')}
          </Button>

          {/* Tertiary: Logout and switch account */}
          <Button
            variant="ghost"
            size="md"
            fullWidth
            onClick={handleSwitchAccount}
            leftIcon={<LogOut />}
            className="bg-danger-soft border border-danger-subtle text-red-500 font-semibold text-sm hover:bg-red-100 hover:text-red-600"
          >
            {t('unauthorizedBtnSwitchAcc')}
          </Button>
        </div>
      </div>

      {/* Footer branding */}
      <Text variant="caption" size="xs" weight="medium" color="subtle" className="mt-8">
        Dormio
        <Text as="span" variant="caption" size="xs" weight="medium" className="text-accent">
          .
        </Text>
      </Text>
    </div>
  )
}
