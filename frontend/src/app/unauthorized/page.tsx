'use client'

import React from 'react'
import Link from 'next/link'
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-50 px-4 py-12">
      {/* Card */}
      <div className="max-w-md w-full text-center bg-white rounded-2xl shadow-sm border border-zinc-100 px-8 py-10 space-y-6">
        {/* Badge */}
        <Text
          as="div"
          variant="badge"
          size="2xs"
          weight="black"
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-50 border border-red-200 text-red-500 tracking-widest"
        >
          <ShieldOff className="w-3.5 h-3.5" />
          {t('unauthorizedTagCode')}
        </Text>

        {/* Icon */}
        <div className="mx-auto w-20 h-20 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-sm">
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
        <div className="h-px bg-zinc-100" />

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Row: Go Back + Back to Home */}
          <div className="grid grid-cols-2 gap-2.5">
            <Button
              type="button"
              variant="primary"
              size="md"
              fullWidth
              onClick={handleGoBack}
              leftIcon={<ArrowLeft className="w-4 h-4" strokeWidth={2.5} />}
              className="font-semibold text-sm"
            >
              {t('unauthorizedBtnBack')}
            </Button>

            <Link href="/" className="w-full">
              <Button
                type="button"
                variant="white"
                size="md"
                fullWidth
                leftIcon={<Home className="w-4 h-4" strokeWidth={2} />}
                className="font-semibold text-sm text-zinc-700"
              >
                {t('unauthorizedBtnHome')}
              </Button>
            </Link>
          </div>

          {/* Secondary: Log in (keep session, just navigate) */}
          <Link href="/login" className="w-full">
            <Button
              type="button"
              variant="white"
              size="md"
              fullWidth
              leftIcon={<LogIn className="w-4 h-4" />}
              className="font-semibold text-sm text-zinc-700"
            >
              {t('unauthorizedBtnLogin')}
            </Button>
          </Link>

          {/* Tertiary: Logout and switch account */}
          <Button
            type="button"
            variant="ghost"
            size="md"
            fullWidth
            onClick={handleSwitchAccount}
            leftIcon={<LogOut className="w-4 h-4" />}
            className="bg-red-50 border border-red-100 text-red-500 font-semibold text-sm hover:bg-red-100 hover:text-red-600"
          >
            {t('unauthorizedBtnSwitchAcc')}
          </Button>
        </div>
      </div>

      {/* Footer branding */}
      <Text variant="caption" size="xs" weight="medium" color="subtle" className="mt-8">
        Dormio
        <Text as="span" variant="caption" size="xs" weight="medium" className="text-[#FF6B35]">
          .
        </Text>
      </Text>
    </div>
  )
}
