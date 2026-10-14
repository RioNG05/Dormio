'use client'

import React from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Building2, CheckCircle2, Star } from 'lucide-react'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { formatCurrency } from '@/utils'
import { Text } from '@/components/ui/Text'
import { Button } from '@/components/ui/Button'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations('auth')
  const { currentLocale } = useLanguage()

  return (
    <div className="flex h-screen max-h-screen overflow-hidden bg-white">
      {/* Cột Trái: Form Auth (Flex 1 - Responsive Padding, cố định layout, chỉ cuộn nội dung form/chính sách) */}
      <div className="flex flex-1 flex-col justify-between h-full max-h-full overflow-hidden px-4 py-5 sm:px-8 sm:py-6 lg:px-12 xl:px-14 bg-white z-10 max-w-xl mx-auto w-full lg:max-w-2xl min-h-0">
        {/* Header Brand Logo & Language Switcher */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 shrink-0">
          <Logo size="lg" />

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <Link href="/">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-xs font-extrabold text-zinc-500 hover:text-[#2AC1BC] px-2.5 py-1.5 rounded-xl h-auto"
              >
                {t('authLayoutBackHome')}
              </Button>
            </Link>
          </div>
        </div>

        {/* Dynamic Form Content: Có scroll nội bộ, không làm phình vỡ layout trang */}
        <div className="flex-1 overflow-y-auto min-h-0 py-3 pr-0.5 custom-scrollbar">
          {children}
        </div>

        {/* Footer Legal Note */}
        <div className="pt-3 border-t border-zinc-100 text-center sm:text-left shrink-0">
          <Text variant="caption" size="2xs" color="subtle">
            {t('authLayoutFooterLegal', { year: new Date().getFullYear() })}
          </Text>
        </div>
      </div>

      {/* Cột Phải: Visual Interactive Dashboard Mockup Showcase (Cố định toàn màn hình, không bị kéo dài) */}
      <div className="hidden lg:flex flex-1 bg-[#090d12] relative flex-col items-center justify-center p-12 overflow-hidden border-l border-zinc-800 h-full max-h-full">
        {/* Ambient Glowing Orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2AC1BC]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#FF6B35]/15 rounded-full blur-[130px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />

        {/* Showcase Glassmorphism Container */}
        <div className="relative max-w-lg w-full space-y-6">
          {/* Main Dashboard Room Card */}
          <div className="bg-zinc-900/90 backdrop-blur-2xl border border-zinc-800 p-7 rounded-3xl shadow-2xl space-y-6 text-white relative">
            {/* Room Status Header */}
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2AC1BC]/20 text-[#2AC1BC] flex items-center justify-center font-black">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <Text as="h3" variant="heading" size="sm" className="text-white">
                    {t('authLayoutShowcaseRoomTitle')}
                  </Text>
                  <Text variant="caption" size="2xs" color="subtle">
                    {t('authLayoutShowcaseRoomAddress')}
                  </Text>
                </div>
              </div>
              <Text
                as="span"
                variant="caption"
                size="3xs"
                weight="black"
                className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full border border-emerald-500/30"
              >
                {t('authLayoutShowcaseStatusActive')}
              </Text>
            </div>

            {/* 3 Metric Stat Boxes */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  size="2xs"
                  weight="bold"
                  color="subtle"
                  className="block"
                >
                  {t('authLayoutShowcaseMetricRent')}
                </Text>
                <Text as="div" variant="heading" size="base" className="text-white">
                  {formatCurrency(4500000, currentLocale)}
                </Text>
                <Text
                  as="span"
                  variant="caption"
                  size="3xs"
                  weight="black"
                  className="text-emerald-400 block"
                >
                  {t('authLayoutShowcaseMetricCollected')}
                </Text>
              </div>

              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  size="2xs"
                  weight="bold"
                  color="subtle"
                  className="block"
                >
                  {t('authLayoutShowcaseMetricUtilities')}
                </Text>
                <Text as="div" variant="heading" size="base" className="text-white">
                  {formatCurrency(680000, currentLocale)}
                </Text>
                <Text
                  as="span"
                  variant="caption"
                  size="3xs"
                  weight="black"
                  className="text-[#2AC1BC] block"
                >
                  {t('authLayoutShowcaseMetricAutoOcr')}
                </Text>
              </div>

              <div className="bg-zinc-950/80 p-3.5 rounded-2xl border border-zinc-800/80 space-y-1">
                <Text
                  as="span"
                  variant="caption"
                  size="2xs"
                  weight="bold"
                  color="subtle"
                  className="block"
                >
                  {t('authLayoutShowcaseMetricOccupancy')}
                </Text>
                <Text as="div" variant="heading" size="base" className="text-white">
                  98.5%
                </Text>
                <Text
                  as="span"
                  variant="caption"
                  size="3xs"
                  weight="black"
                  className="text-[#FF6B35] block"
                >
                  {t('authLayoutShowcaseMetricOccupancyGrowth')}
                </Text>
              </div>
            </div>

            {/* VietQR Auto Reconciliation Banner */}
            <div className="p-4 bg-gradient-to-r from-[#2AC1BC]/15 via-zinc-900 to-zinc-900 rounded-2xl border border-[#2AC1BC]/30 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-[#2AC1BC] text-white flex items-center justify-center font-black shrink-0">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <Text as="h4" variant="heading" size="xs" className="text-white">
                    {t('authLayoutShowcaseVietQrTitle')}
                  </Text>
                  <Text variant="caption" size="2xs" color="subtle">
                    {t('authLayoutShowcaseVietQrDesc')}
                  </Text>
                </div>
              </div>
              <Text
                as="span"
                variant="caption"
                size="3xs"
                weight="black"
                className="px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg shrink-0"
              >
                {t('authLayoutShowcaseVietQrSuccess')}
              </Text>
            </div>

            {/* Floating Verified Landlord Testimonial Overlay */}
            <div className="absolute -bottom-6 -right-6 bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/80 p-4 rounded-2xl shadow-2xl flex items-center gap-3 max-w-xs animate-in fade-in duration-500">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#FF7B44] text-white flex items-center justify-center font-black text-xs shrink-0 shadow-md">
                NQ
              </div>
              <div className="space-y-0.5">
                <Text as="h5" variant="heading" size="xs" className="text-white">
                  {t('authLayoutTestimonialAuthor')}
                </Text>
                <Text variant="caption" size="2xs" color="subtle">
                  {t('authLayoutTestimonialRole')}
                </Text>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-black pt-0.5">
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Star className="w-3 h-3 fill-amber-400" />
                  <Text as="span" variant="caption" size="2xs" className="text-zinc-300 ml-1">
                    {t('authLayoutTestimonialQuote')}
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
