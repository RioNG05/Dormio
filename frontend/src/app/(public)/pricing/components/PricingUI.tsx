'use client'

import React, { useState } from 'react'
import {
  Check,
  X,
  Building2,
  QrCode,
  HelpCircle,
  ChevronDown,
  CreditCard,
  Cpu,
  FileText,
  Users,
  BarChart3,
  Smartphone,
  Scale,
  MapPin,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'
import { FEATURE_FLAGS } from '@/config/features'
import { formatCurrency } from '@/utils'

export default function PricingUI({ initialTab }: { initialTab: 'bhms' | 'bhrp' }) {
  const router = useRouter()
  const { currentLocale } = useLanguage()
  const t = useTranslations('guest')

  const isBhrp = FEATURE_FLAGS.ENABLE_BHRP && initialTab === 'bhrp'
  const activeSection: 'bhms' | 'bhrp' = isBhrp ? 'bhrp' : 'bhms'

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly')
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  const discountRate = billingCycle === 'yearly' ? 0.8 : 1.0

  // ── Feature data ──────────────────────────────────────────────────────────
  const bhmsFeatures = [
    {
      icon: CreditCard,
      title: t('guestFeaturesBhms1Title'),
      desc: t('guestFeaturesBhms1Desc'),
      tag: t('guestFeaturesBhms1Tag'),
    },
    {
      icon: Cpu,
      title: t('guestFeaturesBhms2Title'),
      desc: t('guestFeaturesBhms2Desc'),
      tag: t('guestFeaturesBhms2Tag'),
    },
    {
      icon: FileText,
      title: t('guestFeaturesBhms3Title'),
      desc: t('guestFeaturesBhms3Desc'),
      tag: t('guestFeaturesBhms3Tag'),
    },
    {
      icon: Users,
      title: t('guestFeaturesBhms4Title'),
      desc: t('guestFeaturesBhms4Desc'),
      tag: t('guestFeaturesBhms4Tag'),
    },
    {
      icon: BarChart3,
      title: t('guestFeaturesBhms5Title'),
      desc: t('guestFeaturesBhms5Desc'),
      tag: t('guestFeaturesBhms5Tag'),
    },
    {
      icon: Smartphone,
      title: t('guestFeaturesBhms6Title'),
      desc: t('guestFeaturesBhms6Desc'),
      tag: t('guestFeaturesBhms6Tag'),
    },
  ]

  const bhrpFeatures = [
    {
      icon: QrCode,
      title: t('guestFeaturesBhrp1Title'),
      desc: t('guestFeaturesBhrp1Desc'),
      tag: t('guestFeaturesBhrp1Tag'),
    },
    {
      icon: Scale,
      title: t('guestFeaturesBhrp2Title'),
      desc: t('guestFeaturesBhrp2Desc'),
      tag: t('guestFeaturesBhrp2Tag'),
    },
    {
      icon: MapPin,
      title: t('guestFeaturesBhrp3Title'),
      desc: t('guestFeaturesBhrp3Desc'),
      tag: t('guestFeaturesBhrp3Tag'),
    },
    {
      icon: ShieldCheck,
      title: t('guestFeaturesBhrp4Title'),
      desc: t('guestFeaturesBhrp4Desc'),
      tag: t('guestFeaturesBhrp4Tag'),
    },
  ]

  // ── Pricing plan data ─────────────────────────────────────────────────────
  const bhmsPlans = [
    {
      name: t('guestPricingFreePlanName'),
      priceMonthly: 0,
      description: t('guestPricingFreePlanDesc'),
      features: [
        t('guestPricingFreeF1'),
        t('guestPricingFreeF2'),
        t('guestPricingFreeF3'),
        t('guestPricingFreeF4'),
        t('guestPricingFreeF5'),
        t('guestPricingFreeF6'),
        t('guestPricingFreeF7'),
        t('guestPricingFreeF8'),
      ],
      notIncluded: [],
      cta: t('guestPricingFreeCta'),
      popular: false,
    },
    {
      name: t('guestPricingProPlanName'),
      priceMonthly: 199000,
      description: t('guestPricingProPlanDesc'),
      features: [
        t('guestPricingProF1'),
        t('guestPricingProF2'),
        t('guestPricingProF3'),
        t('guestPricingProF4'),
        t('guestPricingProF5'),
        t('guestPricingProF6'),
        t('guestPricingProF7'),
        t('guestPricingProF8'),
        t('guestPricingProF9'),
      ],
      notIncluded: [],
      cta: t('guestPricingProCta'),
      popular: true,
    },
    {
      name: t('guestPricingEntPlanName'),
      priceMonthly: 499000,
      description: t('guestPricingEntPlanDesc'),
      features: [
        t('guestPricingEntF1'),
        t('guestPricingEntF2'),
        t('guestPricingEntF3'),
        t('guestPricingEntF4'),
        t('guestPricingEntF5'),
        t('guestPricingEntF6'),
      ],
      notIncluded: [],
      cta: t('guestPricingEntCta'),
      popular: false,
    },
  ]

  // BHRP plans: per-turn purchase (not subscription)
  const bhrpPlans = [
    {
      name: t('guestPricingBhrpPlan1Name'),
      price: 0,
      turns: 0,
      description: t('guestPricingBhrpPlan1Desc'),
      features: [],
      notIncluded: [],
      cta: t('guestPricingBhrpPlan1Cta'),
      href: '/posts/create',
      popular: false,
    },
    {
      name: t('guestPricingBhrpPlan2Name'),
      price: 20000,
      turns: 1,
      description: t('guestPricingBhrpPlan2Desc'),
      features: [],
      notIncluded: [],
      cta: t('guestPricingBhrpPlan2Cta'),
      href: '/pricing/rental-platform/purchase?pack=1',
      popular: false,
    },
    {
      name: t('guestPricingBhrpPlan3Name'),
      price: 170000,
      turns: 10,
      description: t('guestPricingBhrpPlan3Desc'),
      features: [],
      notIncluded: [],
      cta: t('guestPricingBhrpPlan3Cta'),
      href: '/pricing/rental-platform/purchase?pack=10',
      popular: true,
    },
    {
      name: t('guestPricingBhrpPlan4Name'),
      price: 1690000,
      turns: 100,
      description: t('guestPricingBhrpPlan4Desc'),
      features: [],
      notIncluded: [],
      cta: t('guestPricingBhrpPlan4Cta'),
      href: '/pricing/rental-platform/purchase?pack=100',
      popular: false,
    },
  ]

  const faqs = [
    { q: t('guestPricingFaq1Q'), a: t('guestPricingFaq1A') },
    { q: t('guestPricingFaq2Q'), a: t('guestPricingFaq2A') },
    { q: t('guestPricingFaq3Q'), a: t('guestPricingFaq3A') },
  ]

  // Derived helpers
  const isBhms = activeSection === 'bhms'
  const accentColor = isBhms ? '#2AC1BC' : '#FF6B35'

  const currentFeatures = isBhms ? bhmsFeatures : bhrpFeatures
  const currentPlans = isBhms ? bhmsPlans : bhrpPlans

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">
      {/* ── Hero Banner ─────────────────────────────────────────────────────── */}
      <section className="relative w-full py-16 sm:py-20 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center border-b border-zinc-800">
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />
        <div className="relative z-10 max-w-4xl mx-auto space-y-4">
          <div>
            <Text
              as="h1" variant='heading' weight='extrabold' color="white"
              className='text-3xl sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md'
            >
              {t('guestPricingTitle1')}
            </Text>{' '}
            <br className="hidden sm:inline" />
            <Text
              as="h1" variant='heading' weight='extrabold'
              className='text-3xl sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent'
            >
              {t('guestPricingTitle2')}
            </Text>
          </div>

          <Text
            variant="subtitle"
            size="xs"
            weight="medium"
            className="sm:text-sm text-zinc-300 leading-relaxed max-w-xl mx-auto text-balance"
          >
            {t('guestPricingSubtitle')}
          </Text>
        </div>
      </section>

      {/* ── Main Content ─────────────────────────────────────────────────────── */}
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 w-full space-y-20">
        {/* ── Shared Tab Switcher (Chỉ hiển thị khi sàn BHRP được mở) ───────── */}
        {FEATURE_FLAGS.ENABLE_BHRP && (
          <div className="flex justify-center w-full">
            <div className="flex flex-col sm:flex-row p-2 sm:p-1.5 bg-zinc-100 rounded-3xl border border-zinc-200/80 max-w-xl w-full gap-2 sm:gap-0">
              <Button
                id="tab-bhms"
                size="sm"
                variant={isBhms ? 'primary' : 'ghost'}
                leftIcon={<Building2 className="w-4 h-4" />}
                onClick={() => router.push('/pricing/management-system', { scroll: false })}
                className="flex-1 rounded-2xl"
              >
                {t('guestFeaturesBhmsTab')}
              </Button>

              <Button
                id="tab-bhrp"
                size="sm"
                variant={!isBhms ? 'accent' : 'ghost'}
                leftIcon={<QrCode className="w-4 h-4" />}
                onClick={() => router.push('/pricing/rental-platform', { scroll: false })}
                className="flex-1 rounded-2xl"
              >
                {t('guestFeaturesBhrpTab')}
              </Button>
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 1 — PRICING
        ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8 animate-in fade-in duration-300">
          {/* Section header + billing toggle */}
          <div className="flex flex-col items-center gap-6">
            <div className="text-center max-w-2xl space-y-2">
              <Text
                as="span"
                variant="badge"
                size="xs"
                weight="black"
                uppercase
                className="px-3.5 py-1 rounded-full border whitespace-nowrap"
                style={{
                  backgroundColor: `${accentColor}1A`,
                  color: accentColor,
                  borderColor: `${accentColor}33`,
                }}
              >
                {isBhms ? t('guestPricingBhmsBadge') : t('guestPricingBhrpBadge')}
              </Text>
              <Text as="h2" variant="heading" size="2xl" weight="black" className="sm:text-3xl leading-snug">
                {isBhms ? (
                  <>
                    <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                      {t('guestPricingBhmsTitle1')}
                    </Text>{' '}
                    <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                      {t('guestPricingBhmsTitle2')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                      {t('guestPricingBhrpTitle1')}
                    </Text>{' '}
                    <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                      {t('guestPricingBhrpTitle2')}
                    </Text>
                  </>
                )}
              </Text>
            </div>

            {/* Billing cycle toggle — only shown for BHMS (management system) */}
            {isBhms && (
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-1.5 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200/80 w-full sm:w-auto">
                <Button
                  id="billing-monthly"
                  size="sm"
                  variant={billingCycle === 'monthly' ? 'dark' : 'ghost'}
                  onClick={() => setBillingCycle('monthly')}
                  className="w-full sm:w-auto"
                >
                  {t('guestPricingPayMonthly')}
                </Button>
                <Button
                  id="billing-yearly"
                  size="sm"
                  variant={billingCycle === 'yearly' ? 'dark' : 'ghost'}
                  onClick={() => setBillingCycle('yearly')}
                  className="w-full sm:w-auto"
                >
                  <Text as="span" color="inherit">
                    {t('guestPricingPayYearly')}
                  </Text>
                  <Text
                    as="span"
                    variant="badge"
                    size="3xs"
                    weight="black"
                    color="white"
                    uppercase
                    className="px-2 py-0.5 bg-rose-500 rounded-full"
                  >
                    {t('guestPricingSave20')}
                  </Text>
                </Button>
              </div>
            )}
            {/* BHRP: per-turn badge */}
            {!isBhms && (
              <Text
                as="div"
                size="xs"
                weight="bold"
                color="orange"
                className="flex items-center gap-2 px-4 py-2 bg-[#FF6B35]/10 rounded-2xl border border-[#FF6B35]/30"
              >
                <QrCode className="w-4 h-4" />
                <Text as="span" color="inherit">
                  {t('guestPricingBhrpTurnLabel')}
                </Text>
              </Text>
            )}
          </div>

          {/* Plan cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
            {currentPlans.map((plan, idx) => {
              // BHMS: monthly/yearly price; BHRP: flat per-turn price
              const bhmsPrice = Math.round((plan as any).priceMonthly * discountRate)
              const bhrpPrice = (plan as any).price ?? 0
              const bhrpTurns = (plan as any).turns ?? 0
              const planHref = (plan as any).href

              return (
                <div
                  key={idx}
                  className={`bg-white rounded-3xl p-8 border transition-all duration-300 flex flex-col justify-between space-y-6 relative cursor-pointer ${plan.popular ? '-translate-y-2' : 'hover:shadow-md'
                    }`}
                  style={
                    plan.popular
                      ? {
                        borderColor: accentColor,
                        boxShadow: `0 20px 40px ${accentColor}26`,
                        outline: `2px solid ${accentColor}33`,
                      }
                      : { borderColor: '#e4e4e7' }
                  }
                >
                  {plan.popular && (
                    <Text
                      as="span"
                      variant="badge"
                      size="3xs"
                      weight="black"
                      color="white"
                      uppercase
                      className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full tracking-wider shadow-md whitespace-nowrap"
                      style={{ backgroundColor: accentColor }}
                    >
                      {isBhms ? t('guestPricingMostPopular') : t('guestPricingBhrp3xViews')}
                    </Text>
                  )}

                  <div className="space-y-4">
                    <div>
                      <Text as="h3" variant="heading" size="xl" weight="black">
                        {plan.name}
                      </Text>
                      <Text variant="subtitle" size="xs" weight="medium" className="mt-1 leading-relaxed">
                        {plan.description}
                      </Text>
                    </div>

                    <div className="py-2 border-y border-zinc-100">
                      {isBhms ? (
                        // BHMS: monthly price with yearly toggle
                        <>
                          <div className="flex items-baseline gap-1">
                            <Text
                              as="span"
                              variant="heading"
                              size="3xl"
                              weight="black"
                              style={{ color: accentColor }}
                            >
                              {bhmsPrice === 0 ? '0 ₫' : formatCurrency(bhmsPrice, currentLocale)}
                            </Text>
                            <Text as="span" size="xs" weight="bold" color="subtle">
                              {t('guestPricingMonth')}
                            </Text>
                          </div>
                          {billingCycle === 'yearly' && bhmsPrice > 0 && (
                            <Text
                              as="span"
                              variant="caption"
                              size="3xs"
                              weight="bold"
                              color="success"
                              className="block mt-0.5"
                            >
                              {t('guestPricingYearlyPayNote')}:{' '}
                              {formatCurrency(bhmsPrice * 12, currentLocale)} {t('guestPricingYear')}
                            </Text>
                          )}
                        </>
                      ) : (
                        // BHRP: per-turn purchase
                        <>
                          <div className="flex items-baseline gap-1">
                            <Text
                              as="span"
                              variant="heading"
                              size="3xl"
                              weight="black"
                              style={{ color: accentColor }}
                            >
                              {bhrpPrice === 0 ? '0 ₫' : formatCurrency(bhrpPrice, currentLocale)}
                            </Text>
                          </div>
                          {bhrpTurns > 0 && (
                            <Text
                              as="span"
                              variant="caption"
                              size="3xs"
                              weight="bold"
                              color="orange"
                              className="block mt-0.5"
                            >
                              {t('guestPricingBhrpTurns', { count: bhrpTurns })}
                            </Text>
                          )}
                          {bhrpTurns > 0 && (
                            <Text
                              as="span"
                              variant="caption"
                              size="3xs"
                              weight="medium"
                              color="subtle"
                              className="block mt-0.5"
                            >
                              ≈ {formatCurrency(Math.round(bhrpPrice / bhrpTurns), currentLocale)} /{' '}
                              {t('guestPricingBhrpPerTurn')}
                            </Text>
                          )}
                        </>
                      )}
                    </div>

                    {(plan.features.length > 0 || plan.notIncluded.length > 0) && (
                      <div className="space-y-3 pt-2">
                        <Text
                          as="span"
                          variant="overline"
                          size="xs"
                          weight="extrabold"
                          color="subtle"
                          className="block"
                        >
                          {isBhms ? t('guestPricingIncluded') : t('guestPricingBhrpIncluded')}
                        </Text>
                        {plan.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-2">
                            <Check
                              className="w-4 h-4 shrink-0 mt-0.5"
                              style={{ color: accentColor }}
                            />
                            <Text as="span" size="xs" weight="semibold" color="secondary">
                              {feat}
                            </Text>
                          </div>
                        ))}
                        {plan.notIncluded.map((feat, nIdx) => (
                          <div key={nIdx} className="flex items-start gap-2 opacity-60">
                            <X className="w-4 h-4 text-zinc-300 shrink-0 mt-0.5" />
                            <Text as="span" size="xs" weight="medium" color="subtle" strikethrough>
                              {feat}
                            </Text>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <Link
                    href={
                      isBhms
                        ? idx === 1
                          ? '/pricing/management-system/purchase?pack=plus'
                          : idx === 2
                            ? '/pricing/management-system/purchase?pack=pro'
                            : '/register/landlord'
                        : (planHref ?? '/register')
                    }
                    className="pt-4"
                  >
                    <Button
                      fullWidth
                      size="md"
                      variant={plan.popular ? (isBhms ? 'primary' : 'accent') : 'dark'}
                      rightIcon={<span>&rarr;</span>}
                    >
                      {plan.cta}
                    </Button>
                  </Link>
                </div>
              )
            })}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            SECTION 2 — FEATURES
        ════════════════════════════════════════════════════════════════════ */}
        <section className="space-y-8 animate-in fade-in duration-300">
          {/* Section header */}
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <Text
              as="span"
              variant="badge"
              size="xs"
              weight="black"
              uppercase
              className="px-3.5 py-1 rounded-full border whitespace-nowrap"
              style={{
                backgroundColor: `${accentColor}1A`,
                color: accentColor,
                borderColor: `${accentColor}33`,
              }}
            >
              {isBhms ? t('guestFeaturesBhmsBadge') : t('guestFeaturesBhrpBadge')}
            </Text>
            <Text as="h2" variant="heading" size="2xl" weight="black" className="sm:text-3xl leading-snug">
              {isBhms ? (
                <>
                  <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                    {t('guestFeaturesBhmsTitle1')}
                  </Text>{' '}
                  <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                    {t('guestFeaturesBhmsTitle2')}
                  </Text>
                </>
              ) : (
                <>
                  <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                    {t('guestFeaturesBhrpTitle1')}
                  </Text>{' '}
                  <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
                    {t('guestFeaturesBhrpTitle2')}
                  </Text>
                </>
              )}
            </Text>
          </div>

          {/* Feature cards grid */}
          <div
            className={`grid grid-cols-1 gap-6 sm:gap-8 ${isBhms ? 'md:grid-cols-2 lg:grid-cols-3' : 'md:grid-cols-2 max-w-5xl mx-auto'}`}
          >
            {currentFeatures.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-7 sm:p-8 border shadow-xs hover:-translate-y-1.5 transition-all duration-300 flex flex-col justify-between space-y-6 group"
                  style={{
                    borderColor: `${accentColor}33`,
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = accentColor)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = `${accentColor}33`)}
                >
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-black group-hover:scale-110 transition-transform"
                        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
                      >
                        <Icon className="w-6 h-6" />
                      </div>
                      <Text
                        as="span"
                        variant="badge"
                        size="3xs"
                        weight="black"
                        className="px-3 py-1 rounded-full whitespace-nowrap"
                        style={{ backgroundColor: `${accentColor}1A`, color: accentColor }}
                      >
                        {feat.tag}
                      </Text>
                    </div>

                    <Text
                      as="h3"
                      variant="heading"
                      size="lg"
                      weight="black"
                      className="transition-colors leading-snug group-hover:text-current"
                      style={{ '--hover-color': accentColor } as React.CSSProperties}
                    >
                      {feat.title}
                    </Text>

                    <Text variant="body" size="xs" weight="medium" color="secondary" className="leading-relaxed">
                      {feat.desc}
                    </Text>
                  </div>
                </div>
              )
            })}
          </div>
        </section>

        {/* ── FAQ Accordion ────────────────────────────────────────────────── */}
        <section className="bg-zinc-50 rounded-3xl p-8 sm:p-12 border border-zinc-200/80 space-y-6">
          <div className="text-center space-y-2 max-w-xl mx-auto">
            <Text
              as="h3"
              variant="heading"
              size="xl"
              weight="black"
              className="flex items-center justify-center gap-2"
            >
              <HelpCircle className="w-5 h-5 text-[#2AC1BC]" />
              <Text as="span" color="inherit">
                {t('guestPricingFaqTitle')}
              </Text>
            </Text>
            <Text variant="subtitle" size="xs" weight="medium">
              {t('guestPricingFaqSubtitle')}
            </Text>
          </div>

          <div className="max-w-3xl mx-auto space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx
              return (
                <div
                  key={idx}
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="bg-white rounded-2xl p-4 sm:p-5 border border-zinc-200/80 shadow-xs cursor-pointer space-y-2 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <Text as="span" size="xs" weight="bold" className="sm:text-sm">
                      {faq.q}
                    </Text>
                    <ChevronDown
                      className={`w-4 h-4 text-zinc-400 transition-transform ${isOpen ? 'rotate-180 text-[#2AC1BC]' : ''}`}
                    />
                  </div>
                  {isOpen && (
                    <Text
                      variant="body"
                      size="xs"
                      weight="medium"
                      color="secondary"
                      className="leading-relaxed pt-2 border-t border-zinc-100 animate-in fade-in duration-200"
                    >
                      {faq.a}
                    </Text>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
        <section className="bg-zinc-900 rounded-3xl p-8 sm:p-12 text-white text-center space-y-6 shadow-2xl border border-zinc-800">
          <Text
            as="h2"
            variant="heading"
            size="2xl"
            weight="black"
            color="white"
            className="sm:text-4xl leading-snug"
          >
            <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
              {t('guestPricingCtaTitle1')}
            </Text>{' '}
            <Text as="span" color="inherit" className="inline-block whitespace-nowrap">
              {t('guestPricingCtaTitle2')}
            </Text>
          </Text>
          <Text
            variant="subtitle"
            size="xs"
            weight="medium"
            color="subtle"
            className="sm:text-sm max-w-lg mx-auto"
          >
            {t('guestPricingCtaSubtitle')}
          </Text>
          <div className="flex justify-center">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<span>&rarr;</span>}
                className="rounded-2xl shadow-lg shadow-[#2AC1BC]/30 hover:scale-105"
              >
                {t('guestPricingCtaBtn')}
              </Button>
            </Link>
          </div>
        </section>
      </div>
    </div>
  )
}
