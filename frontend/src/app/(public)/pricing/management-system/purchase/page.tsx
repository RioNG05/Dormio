'use client'

import React, { useState, useEffect, useCallback, useRef, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Crown,
  Check,
  ShieldCheck,
  Sparkles,
  Clock,
  QrCode,
  ArrowRight,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  Zap,
  Lock,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Button, Form, Text } from '@/components/ui'
import {
  subscriptionService,
  SubscriptionPlanItem,
  TierStatusResponse,
  SubscriptionCheckoutResponse,
} from '@/services/subscription.service'
import { formatCurrency, formatDate, resolveErrorMessage } from '@/utils'
import IdentityGuard from '@/components/IdentityGuard'

const BANK_NAMES: Record<string, string> = {
  '970422': 'MB Bank (Quân Đội)',
  '970415': 'VietinBank',
  '970436': 'Vietcombank',
  '970407': 'Techcombank',
  '970423': 'TPBank',
  '970432': 'VPBank',
  '970418': 'BIDV',
  '970405': 'Agribank',
  '970416': 'ACB',
  '970441': 'VIB',
  '970403': 'Sacombank',
  '970448': 'OCB',
  '970452': 'KienlongBank',
}

/**
 * Helper to ensure a valid QR image URL is always provided.
 * PayOS returns a raw VietQR EMVCo text payload (starts with 000201...) rather than an image URL.
 */
function getQrImageUrl(data: SubscriptionCheckoutResponse | null): string {
  if (!data?.qrCode) return ''
  if (
    data.qrCode.startsWith('http://') ||
    data.qrCode.startsWith('https://') ||
    data.qrCode.startsWith('data:image')
  ) {
    return data.qrCode
  }
  // Convert EMVCo payload string into a standard QR image
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    data.qrCode,
  )}`
}

interface PageProps {
  searchParams: Promise<{
    pack?: string
  }>
}

function PricingCheckoutPageInner({ searchParams }: PageProps) {
  const resolvedParams = use(searchParams)
  const planParam = (resolvedParams.pack || '').toLowerCase() as 'plus' | 'pro'
  const router = useRouter()
  const { user, isLoggedIn, isHydrating } = useAuth()
  const { locale } = useLanguage()
  const t = useTranslations('guest')
  const tErrors = useTranslations('errors')

  // Data states
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanItem | null>(null)
  const [tierStatus, setTierStatus] = useState<TierStatusResponse | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly')

  // Checkout states
  const [checkoutData, setCheckoutData] = useState<SubscriptionCheckoutResponse | null>(null)
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [countdown, setCountdown] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isCopiedAcc, setIsCopiedAcc] = useState(false)
  const [isCopiedSyntax, setIsCopiedSyntax] = useState(false)

  // Toast notification hook
  const { toast } = useToast()

  const showToast = useCallback(
    (type: 'success' | 'error', text: string) => {
      if (type === 'success') {
        toast.success(text)
      } else {
        toast.error(text)
      }
    },
    [toast],
  )

  // Auth requirement check: Must be logged in to checkout
  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      router.push(`/login?redirect=/pricing/management-system/purchase?pack=${planParam}`)
    }
  }, [isHydrating, isLoggedIn, planParam, router])

  // Format currency reusing shared utility
  const formatVnd = (num: number) => formatCurrency(num, locale)

  // Format date reusing shared utility
  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return '—'
    return formatDate(dateStr, locale)
  }

  // Billing cycle label helpers
  const getCycleName = (cycle: 'monthly' | 'quarterly' | 'yearly') => {
    if (cycle === 'monthly') return t('guestPricingCheckoutCycleMonthly')
    if (cycle === 'quarterly') return t('guestPricingCheckoutCycleQuarterly')
    return t('guestPricingCheckoutCycleYearly')
  }

  // 1. Fetch Plan Details and Tier Status
  const loadPageData = useCallback(async () => {
    if (!user) return
    setIsLoading(true)
    try {
      const allPlans = await subscriptionService.getPlans()
      const targetPlan = allPlans.find(p => p.planName.toLowerCase() === planParam)
      if (targetPlan) {
        setCurrentPlan(targetPlan)
      }

      // Check current tier status for consecutive extension
      const status = await subscriptionService.getTierStatus(planParam)
      setTierStatus(status)
    } catch (err: unknown) {
      console.error('Failed to load subscription checkout data', err)
      showToast('error', resolveErrorMessage(err, tErrors, t('guestPricingCheckoutLoadError')))
    } finally {
      setIsLoading(false)
    }
  }, [planParam, user, t, tErrors, showToast])

  useEffect(() => {
    if (user) {
      loadPageData()
    }
  }, [user, loadPageData])

  // 2. Countdown timer effect (clean interval without recreating on every tick)
  useEffect(() => {
    if (!checkoutData || isSuccess) return

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer)
          setIsExpired(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [checkoutData?.orderCode, isSuccess])

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  // 3. Initiate or Refresh PayOS Checkout
  const handleGenerateCheckout = async (cycleToUse = selectedCycle) => {
    setIsGeneratingQr(true)
    setIsExpired(false)
    try {
      const res = await subscriptionService.createCheckout(planParam, cycleToUse)
      setCheckoutData(res)
      setCountdown(res.expiresIn || 900)

      if (res.isReused) {
        showToast('success', t('guestPricingCheckoutResumeSession'))
      }
    } catch (err: unknown) {
      console.error('Error creating checkout', err)
      showToast(
        'error',
        resolveErrorMessage(err, tErrors, t('guestPricingCheckoutGenerateQrError')),
      )
    } finally {
      setIsGeneratingQr(false)
    }
  }

  // 4. Polling for payment status while QR is active
  const isPollingRef = useRef(false)

  useEffect(() => {
    const orderCode = checkoutData?.orderCode
    if (!orderCode || isSuccess || isExpired) return

    const checkStatus = async () => {
      if (isPollingRef.current) return
      isPollingRef.current = true
      try {
        const orderStatus = await subscriptionService.getOrderStatus(orderCode)
        if (orderStatus.isPaid) {
          setIsSuccess(true)
          const planTitle = planParam.toUpperCase()
          showToast('success', t('guestPricingCheckoutSuccessToast', { plan: planTitle }))
        }
      } catch (err) {
        // Silent poll error
      } finally {
        isPollingRef.current = false
      }
    }

    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [checkoutData?.orderCode, isSuccess, isExpired, planParam, t, showToast])

  // Copy helper
  const handleCopy = (text: string, type: 'acc' | 'syntax') => {
    navigator.clipboard.writeText(text)
    if (type === 'acc') {
      setIsCopiedAcc(true)
      setTimeout(() => setIsCopiedAcc(false), 2000)
    } else {
      setIsCopiedSyntax(true)
      setTimeout(() => setIsCopiedSyntax(false), 2000)
    }
  }

  // Calculate pricing values based on selected cycle
  const getCyclePrice = (cycle: 'monthly' | 'quarterly' | 'yearly') => {
    if (!currentPlan) return 0
    if (cycle === 'monthly') return currentPlan.priceMonthly
    if (cycle === 'quarterly')
      return currentPlan.priceQuarterly || Math.round(currentPlan.priceMonthly * 3 * 0.9)
    return currentPlan.priceYearly
  }

  const getCycleSavings = (cycle: 'monthly' | 'quarterly' | 'yearly') => {
    if (!currentPlan || cycle === 'monthly') return null
    const base = currentPlan.priceMonthly * (cycle === 'quarterly' ? 3 : 12)
    const actual = getCyclePrice(cycle)
    const saved = base - actual
    if (saved <= 0) return null
    const percent = Math.round((saved / base) * 100)
    return { saved, percent }
  }

  if (isHydrating || (!isLoggedIn && !isSuccess)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
        <Lock className="w-8 h-8 text-primary animate-pulse" />
        <Text variant="body" size="sm" weight="semibold" color="secondary">
          {t('guestPricingCheckoutAuthVerifying')}
        </Text>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen pb-28 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="mb-8">
        <Link href="/pricing" className="inline-flex mb-4">
          <Button
            variant="ghost"
            size="xs"
            leftIcon={<ArrowLeft />}
            className="text-muted hover:text-foreground -ml-2.5"
          >
            {t('guestPricingCheckoutBackToPricing')}
          </Button>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Text
              as="div"
              variant="overline"
              size="xs"
              weight="black"
              color="brand"
              className="flex items-center gap-2 mb-1"
            >
              <Sparkles className="w-4 h-4" />
              <Text as="span" color="inherit">
                {t('guestPricingCheckoutBadge')}
              </Text>
            </Text>
            <Text
              as="h1"
              variant="heading"
              size="2xl"
              weight="black"
              className="sm:text-3xl flex items-center gap-3"
            >
              <Text as="span" variant="heading" size="2xl" weight="black" className="sm:text-3xl">
                {t('guestPricingCheckoutTitle')}
              </Text>
              <Text
                as="span"
                variant="badge"
                size="xs"
                weight="black"
                color="white"
                className="px-3 py-1 rounded-xl bg-gradient-to-r from-primary to-teal-600 shadow-sm"
              >
                {planParam}
              </Text>
            </Text>
          </div>
          <Text
            as="div"
            variant="caption"
            size="xs"
            weight="medium"
            color="secondary"
            className="flex items-center gap-2 bg-card-hover border border-line px-3.5 py-1.5 rounded-full"
          >
            <ShieldCheck className="w-4 h-4 text-success" />
            <Text as="span" color="inherit">
              {t('guestPricingCheckoutGatewayBadge')}
            </Text>
          </Text>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-card rounded-3xl border border-line p-16 flex flex-col items-center justify-center gap-4">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <Text variant="body" size="sm" weight="medium" color="subtle">
            {t('guestPricingCheckoutLoading')}
          </Text>
        </div>
      ) : !currentPlan ? (
        <div className="bg-card rounded-3xl border border-line p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <Text as="h2" variant="heading" size="lg" weight="bold" className="mb-1">
            {t('guestPricingCheckoutNotFound')}
          </Text>
          <Text variant="body" size="sm" color="secondary" className="mb-6">
            {t('guestPricingCheckoutNotFoundDesc')}
          </Text>
          <Link href="/pricing">
            <Button variant="dark">
              {t('guestPricingCheckoutBackToPlansBtn')}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── LEFT: PLAN INFO & BILLING CYCLE ─── */}
          <div className="lg:col-span-6 space-y-6">
            {/* Edge Case Alert: Consecutive Extension Banner using Form.Alert */}
            {tierStatus?.hasActiveSameTier && (
              <Form.Alert
                variant="info"
                title={t('guestPricingCheckoutExtensionActive')}
                message={t('guestPricingCheckoutExtensionDesc', {
                  plan: planParam.toUpperCase(),
                  date: formatDateDisplay(tierStatus.currentEndDate),
                  startDate: formatDateDisplay(tierStatus.effectiveStartDate),
                })}
              />
            )}

            {/* Plan Card Detail */}
            <div className="bg-card rounded-3xl border border-line shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Text as="span" variant="overline" size="xs" weight="bold" color="subtle">
                    {t('guestPricingCheckoutLabelPlan')}
                  </Text>
                  <Text
                    as="div"
                    variant="heading"
                    size="2xl"
                    weight="black"
                    className="flex items-center gap-2.5 mt-0.5"
                  >
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                    <Text as="span" variant="heading" size="2xl" weight="black">
                      Dormio {currentPlan.planName.toUpperCase()}
                    </Text>
                  </Text>
                  <Text variant="subtitle" size="xs" className="sm:text-sm mt-1">
                    {currentPlan.description || t('guestPricingProPlanDesc')}
                  </Text>
                </div>
              </div>

              {/* Cycle Selector Buttons using Form.Field */}
              <Form.Field
                label={t('guestPricingCheckoutSelectCycle')}
                labelClassName="uppercase tracking-wider text-muted mb-2.5"
              >
                <div className="grid grid-cols-3 gap-2.5">
                  {(['monthly', 'quarterly', 'yearly'] as const).map(cycle => {
                    const isSelected = selectedCycle === cycle
                    const savings = getCycleSavings(cycle)
                    return (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => {
                          setSelectedCycle(cycle)
                          if (checkoutData && checkoutData.billingCycle !== cycle) {
                            setCheckoutData(null)
                            setIsExpired(false)
                          }
                        }}
                        className={`relative p-3 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${
                          isSelected
                            ? 'bg-zinc-900 text-white border-zinc-900 shadow-md ring-2 ring-zinc-900/10'
                            : 'bg-surface/70 hover:bg-card-hover text-foreground/90 border-line'
                        }`}
                      >
                        {savings && (
                          <Text
                            as="span"
                            variant="badge"
                            weight="black"
                            color="white"
                            className="absolute -top-2.5 right-2 px-1.5 py-0.5 rounded-md bg-danger shadow-xs"
                          >
                            {t('guestPricingCheckoutSaveBadge', { percent: savings.percent })}
                          </Text>
                        )}
                        <Text
                          as="div"
                          size="xs"
                          weight="bold"
                          color={isSelected ? 'white' : 'default'}
                        >
                          {getCycleName(cycle)}
                        </Text>
                        <Text
                          as="div"
                          size="sm"
                          weight="black"
                          color={isSelected ? 'brand' : 'default'}
                          className="sm:text-base mt-2"
                        >
                          {formatVnd(getCyclePrice(cycle))}
                        </Text>
                      </button>
                    )
                  })}
                </div>
              </Form.Field>

              {/* Feature Checklist */}
              <div className="pt-2 border-t border-line">
                <Text as="span" variant="overline" size="xs" weight="bold" className="block mb-3">
                  {t('guestPricingCheckoutFeaturesTitle')}
                </Text>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-soft text-success flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <Text as="span" variant="body" size="xs" weight="medium" className="sm:text-sm">
                      {t('guestPricingCheckoutMaxRooms', { count: currentPlan.maxRoom })}
                    </Text>
                  </li>
                  <li className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-success-soft text-success flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <Text as="span" variant="body" size="xs" weight="medium" className="sm:text-sm">
                      {t('guestPricingCheckoutDailyPosts', { count: currentPlan.dailyPostQuote })}
                    </Text>
                  </li>
                  {currentPlan.features?.map((f, idx) => (
                    <li key={idx} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-success-soft text-success flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <Text
                        as="span"
                        variant="body"
                        size="xs"
                        weight="medium"
                        className="sm:text-sm"
                      >
                        {f}
                      </Text>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-line">
                <Button
                  fullWidth
                  size="lg"
                  variant="success"
                  isLoading={isGeneratingQr}
                  disabled={isGeneratingQr || isSuccess}
                  onClick={() => handleGenerateCheckout(selectedCycle)}
                  leftIcon={
                    isSuccess ? (
                      <CheckCircle2 />
                    ) : (
                      <QrCode />
                    )
                  }
                  rightIcon={!isSuccess ? <ArrowRight /> : undefined}
                >
                  {isGeneratingQr
                    ? t('guestPricingCheckoutPayBtnLoading')
                    : isSuccess
                      ? t('guestPricingCheckoutSuccessTitle')
                      : `${t('guestPricingCheckoutPayBtn')} — ${getCycleName(
                          selectedCycle,
                        )} (${formatVnd(getCyclePrice(selectedCycle))})`}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── RIGHT: QR PAYMENT AREA ─── */}
          <div className="lg:col-span-6">
            <div className="bg-card rounded-3xl border border-line shadow-sm p-6 sm:p-8 relative overflow-hidden">
              {/* SUCCESS STATE */}
              {isSuccess ? (
                <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-400">
                  <div className="w-20 h-20 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <Text as="h2" variant="heading" size="2xl" weight="black">
                      {t('guestPricingCheckoutSuccessTitle')}
                    </Text>
                    <Text
                      variant="body"
                      size="sm"
                      color="secondary"
                      className="mt-2 max-w-md mx-auto leading-relaxed"
                    >
                      {t('guestPricingCheckoutSuccessDesc', {
                        plan: planParam.toUpperCase(),
                      })}
                    </Text>
                  </div>

                  {checkoutData && (
                    <div className="p-4 rounded-2xl bg-surface border border-line max-w-sm mx-auto text-left space-y-1.5">
                      <div className="flex justify-between">
                        <Text as="span" size="xs" weight="medium" color="secondary">
                          {t('guestPricingCheckoutLabelPlan')}
                        </Text>
                        <Text as="strong" size="xs" weight="bold" color="default" uppercase>
                          {planParam}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text as="span" size="xs" weight="medium" color="secondary">
                          {t('guestPricingCheckoutLabelCycle')}
                        </Text>
                        <Text as="strong" size="xs" weight="bold" color="default" capitalize>
                          {checkoutData.billingCycle}
                        </Text>
                      </div>
                      <div className="flex justify-between">
                        <Text as="span" size="xs" weight="medium" color="secondary">
                          {t('guestPricingCheckoutLabelValidUntil')}
                        </Text>
                        <Text as="strong" size="xs" weight="bold" color="success">
                          {formatDateDisplay(checkoutData.endDate)}
                        </Text>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link href="/landlord/reports">
                      <Button
                        size="md"
                        variant="dark"
                        rightIcon={<ArrowRight />}
                      >
                        {t('guestPricingCheckoutGoToDashboard')}
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : checkoutData ? (
                /* QR ACTIVE STATE */
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-warning-soft border border-warning-subtle">
                    <Text
                      as="div"
                      size="xs"
                      weight="bold"
                      className="flex items-center gap-2 text-warning"
                    >
                      <Clock className="w-4 h-4 text-warning" />
                      <Text as="span" color="inherit">
                        {t('guestPricingCheckoutQrExpiryCountdown')}
                      </Text>
                    </Text>
                    <Text
                      as="div"
                      size="sm"
                      weight="black"
                      mono
                      color="white"
                      className={`tracking-wider px-3 py-1 rounded-xl ${
                        isExpired
                          ? 'bg-danger'
                          : countdown < 120
                            ? 'bg-danger animate-pulse'
                            : 'bg-warning'
                      }`}
                    >
                      {isExpired ? '00:00' : formatTimer(countdown)}
                    </Text>
                  </div>

                  <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 p-3 bg-white rounded-2xl border-2 border-line shadow-inner flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getQrImageUrl(checkoutData)}
                      alt="VietQR PayOS"
                      className={`w-full h-full object-contain rounded-xl transition-all ${
                        isExpired ? 'blur-xs opacity-20' : ''
                      }`}
                      onError={e => {
                        const target = e.currentTarget
                        if (checkoutData?.bin && checkoutData?.accountNumber) {
                          const fallbackUrl = `https://api.vietqr.io/image/${checkoutData.bin}-${checkoutData.accountNumber}-qr_only.png?amount=${checkoutData.amount}&addInfo=${encodeURIComponent(
                            checkoutData.description,
                          )}&accountName=${encodeURIComponent(checkoutData.accountName)}`
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl
                          }
                        }
                      }}
                    />

                    {isExpired && (
                      <div className="absolute inset-0 bg-card/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                        <AlertTriangle className="w-10 h-10 text-danger mb-2" />
                        <Text as="div" variant="heading" size="sm" weight="black">
                          {t('guestPricingCheckoutQrExpired')}
                        </Text>
                        <Text variant="subtitle" size="xs" className="mt-1 mb-4">
                          {t('guestPricingCheckoutQrExpiredDesc')}
                        </Text>
                        <Button
                          size="sm"
                          variant="dark"
                          isLoading={isGeneratingQr}
                          leftIcon={<RefreshCw />}
                          onClick={() => handleGenerateCheckout(selectedCycle)}
                        >
                          {t('guestPricingCheckoutGenerateNewQr')}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2.5 pt-2">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                      <Text as="span" size="xs" color="secondary">
                        {t('guestPricingCheckoutBank')}
                      </Text>
                      <Text as="strong" size="xs" weight="bold" color="default">
                        {BANK_NAMES[checkoutData.bin] || `Ngân hàng (BIN: ${checkoutData.bin})`}
                      </Text>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                      <Text as="span" size="xs" color="secondary">
                        {t('guestPricingCheckoutAccountNumber')}
                      </Text>
                      <div className="flex items-center gap-2">
                        <Text as="strong" size="xs" weight="bold" color="default" mono>
                          {checkoutData.accountNumber}
                        </Text>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopy(checkoutData.accountNumber, 'acc')}
                          title="Copy"
                        >
                          {isCopiedAcc ? (
                            <Check className="text-success" />
                          ) : (
                            <Copy />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                      <Text as="span" size="xs" color="secondary">
                        {t('guestPricingCheckoutAccountName')}
                      </Text>
                      <Text as="strong" size="xs" weight="bold" color="default" uppercase>
                        {checkoutData.accountName}
                      </Text>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                      <Text as="span" size="xs" color="secondary">
                        {t('guestPricingCheckoutAmount')}
                      </Text>
                      <Text as="strong" size="sm" weight="black" color="success">
                        {formatVnd(checkoutData.amount)}
                      </Text>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-warning-soft border border-warning-subtle">
                      <Text as="span" size="xs" weight="medium" className="text-warning">
                        {t('guestPricingCheckoutTransferContent')}
                      </Text>
                      <div className="flex items-center gap-2">
                        <Text as="strong" size="xs" weight="black" mono className="text-warning">
                          {checkoutData.description}
                        </Text>
                        <Button
                          variant="ghost"
                          size="icon-xs"
                          onClick={() => handleCopy(checkoutData.description, 'syntax')}
                          title="Copy"
                        >
                          {isCopiedSyntax ? (
                            <Check className="text-success" />
                          ) : (
                            <Copy />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-primary-soft border border-primary-subtle flex items-center justify-center gap-3">
                    <RefreshCw className="w-4 h-4 text-primary animate-spin shrink-0" />
                    <Text as="span" size="xs" weight="semibold" className="text-primary">
                      {t('guestPricingCheckoutWaitingTransfer')}
                    </Text>
                  </div>
                </div>
              ) : (
                /* PLACEHOLDER STATE */
                <div className="py-14 px-4 text-center space-y-4">
                  <div className="w-16 h-16 rounded-3xl bg-card-hover border border-line text-muted flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <Text as="h3" variant="heading" size="base" weight="bold">
                      {t('guestPricingCheckoutReadyTitle')}
                    </Text>
                    <Text
                      variant="subtitle"
                      size="xs"
                      className="mt-1 max-w-sm mx-auto leading-relaxed"
                    >
                      {t('guestPricingCheckoutReadyDesc')}
                    </Text>
                  </div>
                  <Text
                    as="div"
                    size="xs"
                    weight="bold"
                    color="brand"
                    className="pt-2 flex items-center justify-center gap-2"
                  >
                    <Zap className="w-4 h-4" />
                    <Text as="span" color="inherit">
                      {t('guestPricingCheckoutInstantReconcile')}
                    </Text>
                  </Text>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ─── Exported page wrapped with IdentityGuard ─────────────────────────────────
export default function PricingCheckoutPage({ searchParams }: PageProps) {
  return (
    <IdentityGuard>
      <PricingCheckoutPageInner searchParams={searchParams} />
    </IdentityGuard>
  )
}

