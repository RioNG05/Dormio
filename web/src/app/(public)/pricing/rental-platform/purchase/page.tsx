'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams, redirect } from 'next/navigation'
import { FEATURE_FLAGS } from '@/config/features'
import {
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
  Package,
  Star,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Button } from '@/components/ui/Button'
import { addCustomNotification } from '@/services/notification.service'
import IdentityGuard from '@/components/IdentityGuard'

// ─── Bank name map ─────────────────────────────────────────────────────────────
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

// ─── Pack definitions ──────────────────────────────────────────────────────────
type PackKey = '1' | '10' | '100'

interface TurnPack {
  key: PackKey
  name: string
  nameEn: string
  turns: number
  price: number
  pricePerTurn: number
  badge: string
  accentColor: string
  iconColor: string
  features: string[]
  featuresEn: string[]
  popular: boolean
}

const TURN_PACKS: TurnPack[] = [
  {
    key: '1',
    name: 'Theo lượt',
    nameEn: 'Per turn',
    turns: 1,
    price: 20000,
    pricePerTurn: 20000,
    badge: 'MỚI',
    accentColor: '#F59E0B',
    iconColor: '#FBBF24',
    features: [],
    featuresEn: [],
    popular: false,
  },
  {
    key: '10',
    name: 'Gói 10 tin',
    nameEn: '10 turns pack',
    turns: 10,
    price: 170000,
    pricePerTurn: 17000,
    badge: 'PHỔ BIẾN',
    accentColor: '#F59E0B',
    iconColor: '#FBBF24',
    features: [],
    featuresEn: [],
    popular: true,
  },
  {
    key: '100',
    name: 'Gói 100 tin',
    nameEn: '100 turns pack',
    turns: 100,
    price: 1690000,
    pricePerTurn: 16900,
    badge: 'GIÁ TRỊ NHẤT',
    accentColor: '#2AC1BC',
    iconColor: '#5EEAD4',
    features: [],
    featuresEn: [],
    popular: false,
  },
]

// ─── QR image helper ──────────────────────────────────────────────────────────
function getQrImageUrl(qrCode: string | undefined): string {
  if (!qrCode) return ''
  if (
    qrCode.startsWith('http://') ||
    qrCode.startsWith('https://') ||
    qrCode.startsWith('data:image')
  ) {
    return qrCode
  }
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(qrCode)}`
}

// ─── Checkout response shape ──────────────────────────────────────────────────
interface BhrpCheckoutResponse {
  orderCode: number
  qrCode: string
  bin: string
  accountNumber: string
  accountName: string
  amount: number
  description: string
  expiresIn: number
  isReused?: boolean
}

// ─── Inner page ───────────────────────────────────────────────────────────────
function BuyTurnsPageInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const packParam = (searchParams.get('pack') ?? '10') as PackKey

  const { isLoggedIn, isHydrating } = useAuth()
  const { locale } = useLanguage()
  const t = useTranslations('guest')
  const { toast } = useToast()

  const isVi = locale === 'vi'

  const [selectedPack, setSelectedPack] = useState<PackKey>(
    TURN_PACKS.some(p => p.key === packParam) ? packParam : '10',
  )
  const pack = TURN_PACKS.find(p => p.key === selectedPack)!

  const [checkoutData, setCheckoutData] = useState<BhrpCheckoutResponse | null>(null)
  const [isGeneratingQr, setIsGeneratingQr] = useState(false)
  const [countdown, setCountdown] = useState<number>(0)
  const [isExpired, setIsExpired] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [isCopiedAcc, setIsCopiedAcc] = useState(false)
  const [isCopiedSyntax, setIsCopiedSyntax] = useState(false)

  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      router.push(`/login?redirect=/pricing/rental-platform/purchase?pack=${selectedPack}`)
    }
  }, [isHydrating, isLoggedIn, router, selectedPack])

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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formatVnd = (num: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(num)

  const handleGenerateCheckout = async () => {
    setIsGeneratingQr(true)
    setIsExpired(false)
    try {
      // NOTE: replace with actual postTurnsService.createCheckout when backend is ready
      const res = await fetch(`/api/posts/buy-turns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pack: selectedPack }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data: BhrpCheckoutResponse = await res.json()
      setCheckoutData(data)
      setCountdown(data.expiresIn || 900)
      if (data.isReused) {
        toast.success(t('guestPricingCheckoutResumeSession'))
      }
    } catch (err: any) {
      console.error('Error creating buy-turns checkout', err)
      toast.error(err.message || t('guestPricingCheckoutGenerateQrError'))
    } finally {
      setIsGeneratingQr(false)
    }
  }

  const isPollingRef = useRef(false)
  useEffect(() => {
    const orderCode = checkoutData?.orderCode
    if (!orderCode || isSuccess || isExpired) return

    const checkStatus = async () => {
      if (isPollingRef.current) return
      isPollingRef.current = true
      try {
        const res = await fetch(`/api/posts/buy-turns/status?orderCode=${orderCode}`)
        if (!res.ok) return
        const data = await res.json()
        if (data.isPaid) {
          setIsSuccess(true)
          toast.success(
            isVi
              ? `Mua thành công ${pack.turns} lượt đăng tin ${pack.name}!`
              : `Successfully purchased ${pack.turns} ${pack.nameEn} listing turns!`,
          )
          addCustomNotification({
            title: isVi ? 'Mua lượt đăng tin thành công' : 'Listing Turns Purchased',
            content: isVi
              ? `Mua thành công ${pack.turns} lượt đăng tin ${pack.name}! Gói cước của bạn đã sẵn sàng sử dụng.`
              : `Successfully purchased ${pack.turns} ${pack.nameEn} listing turns! Ready to post.`,
            type: 'package_payment_success',
            targetUrl: '/posts/create',
          })
        }
      } catch {
        // silent
      } finally {
        isPollingRef.current = false
      }
    }

    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [checkoutData?.orderCode, isSuccess, isExpired, pack, isVi, toast])

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

  const handleSelectPack = (key: PackKey) => {
    setSelectedPack(key)
    setCheckoutData(null)
    setIsExpired(false)
    setIsSuccess(false)
  }

  if (isHydrating || (!isLoggedIn && !isSuccess)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-muted">
        <Lock className="w-8 h-8 text-accent animate-pulse" />
        <p className="text-sm font-semibold">{t('guestPricingCheckoutAuthVerifying')}</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen pb-28 animate-in fade-in duration-300">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="mb-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-muted hover:text-foreground transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t('guestPricingCheckoutBackToPricing')}</span>
        </Link>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-accent mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{isVi ? 'MUA LƯỢT ĐĂNG TIN VIP' : 'BUY VIP LISTING TURNS'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {isVi ? 'Mua lượt đăng tin nổi bật' : 'Purchase VIP Listing Turns'}
            </h1>
            <p className="text-sm text-muted font-medium mt-1">
              {isVi
                ? 'Không đăng ký định kỳ · Mua theo lượt · Sử dụng linh hoạt'
                : 'No subscription · Pay per pack · Use anytime'}
            </p>
          </div>
          <div className="flex items-center gap-2 bg-card-hover border border-line px-3.5 py-1.5 rounded-full text-xs font-medium text-muted">
            <ShieldCheck className="w-4 h-4 text-success" />
            <span>{t('guestPricingCheckoutGatewayBadge')}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* ── LEFT: Pack selector + features ─────────────────────────── */}
        <div className="lg:col-span-6 space-y-6">
          {/* Pack selector cards */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-muted mb-2">
              {isVi ? 'Chọn gói lượt muốn mua:' : 'Select a pack:'}
            </label>
            {TURN_PACKS.map(p => {
              const isSelected = selectedPack === p.key
              return (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => handleSelectPack(p.key)}
                  className={`w-full relative text-left p-5 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4 ${
                    isSelected
                      ? 'border-accent bg-accent/5 shadow-md'
                      : 'border-line bg-card hover:border-line hover:bg-card-hover'
                  }`}
                >
                  {p.popular && (
                    <span className="absolute -top-2.5 left-4 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-full bg-accent text-white shadow-sm">
                      {isVi ? p.badge : 'POPULAR'}
                    </span>
                  )}

                  <div
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${p.accentColor}1A` }}
                  >
                    <Star className="w-6 h-6" style={{ color: p.iconColor }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2 flex-wrap">
                      <span className="font-black text-foreground text-sm">
                        {isVi ? p.name : p.nameEn}
                      </span>
                      <span className="text-lg font-black" style={{ color: p.accentColor }}>
                        {formatVnd(p.price)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span
                        className="text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: `${p.accentColor}1A`, color: p.accentColor }}
                      >
                        {p.turns} {isVi ? 'lượt' : 'turns'}
                      </span>
                      <span className="text-[11px] text-muted font-medium">
                        ≈ {formatVnd(p.pricePerTurn)} / {isVi ? 'lượt' : 'turn'}
                      </span>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                      isSelected ? 'border-accent bg-accent' : 'border-line bg-card'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Feature checklist */}
          <div className="bg-card rounded-3xl border border-line shadow-sm p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-accent" />
              <span className="text-xs font-bold uppercase tracking-wider text-muted">
                {isVi ? 'Quyền lợi khi dùng lượt' : 'Benefits per turn'}
              </span>
            </div>
            <ul className="space-y-2.5">
              {(isVi ? pack.features : pack.featuresEn).map((f, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-xs sm:text-sm text-foreground/90 font-medium"
                >
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${pack.accentColor}1A` }}
                  >
                    <Check className="w-3.5 h-3.5" style={{ color: pack.accentColor }} />
                  </div>
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="pt-4 border-t border-line">
              <Button
                fullWidth
                size="lg"
                variant="orange"
                disabled={isGeneratingQr || isSuccess}
                isLoading={isGeneratingQr}
                onClick={handleGenerateCheckout}
                leftIcon={isSuccess ? <CheckCircle2 /> : <QrCode />}
                rightIcon={!isSuccess ? <ArrowRight /> : undefined}
              >
                {isGeneratingQr
                  ? t('guestPricingCheckoutPayBtnLoading')
                  : isSuccess
                    ? t('guestPricingCheckoutSuccessTitle')
                    : isVi
                      ? `Thanh toán ${formatVnd(pack.price)} — ${pack.turns} lượt`
                      : `Pay ${formatVnd(pack.price)} — ${pack.turns} turns`}
              </Button>
            </div>
          </div>
        </div>

        {/* ── RIGHT: QR Payment area ──────────────────────────────────── */}
        <div className="lg:col-span-6">
          <div className="bg-card rounded-3xl border border-line shadow-sm p-6 sm:p-8 relative overflow-hidden">
            {/* SUCCESS STATE */}
            {isSuccess ? (
              <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-400">
                <div className="w-20 h-20 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-foreground tracking-tight">
                    {t('guestPricingCheckoutSuccessTitle')}
                  </h2>
                  <p className="text-sm text-muted mt-2 max-w-md mx-auto leading-relaxed">
                    {isVi
                      ? `Bạn đã mua thành công ${pack.turns} lượt đăng tin ${pack.name}.`
                      : `You've successfully purchased ${pack.turns} ${pack.nameEn} listing turns.`}
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-surface border border-line max-w-sm mx-auto text-left text-xs space-y-1.5 font-medium text-muted">
                  <div className="flex justify-between">
                    <span>{isVi ? 'Gói đã mua:' : 'Pack:'}</span>
                    <strong className="text-foreground">{isVi ? pack.name : pack.nameEn}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Số lượt:' : 'Turns:'}</span>
                    <strong className="text-accent">
                      +{pack.turns} {isVi ? 'lượt' : 'turns'}
                    </strong>
                  </div>
                  <div className="flex justify-between">
                    <span>{isVi ? 'Số tiền:' : 'Amount:'}</span>
                    <strong className="text-foreground">{formatVnd(pack.price)}</strong>
                  </div>
                </div>
                <div className="pt-2 flex gap-3 justify-center flex-wrap">
                  <Button href="/posts/create" size="md" variant="orange" rightIcon={<ArrowRight />}>
                    {isVi ? 'Đăng tin ngay' : 'Post Now'}
                  </Button>
                  <Button href="/pricing" size="lg" variant="dark">
                    {isVi ? 'Bảng giá' : 'Pricing'}
                  </Button>
                </div>
              </div>
            ) : checkoutData ? (
              /* QR ACTIVE STATE */
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-warning-soft border border-warning-subtle text-warning">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Clock className="w-4 h-4 text-warning" />
                    <span>{t('guestPricingCheckoutQrExpiryCountdown')}</span>
                  </div>
                  <div
                    className={`text-sm font-black font-mono tracking-wider px-3 py-1 rounded-xl ${
                      isExpired
                        ? 'bg-danger text-white'
                        : countdown < 120
                          ? 'bg-danger text-white animate-pulse'
                          : 'bg-warning text-white'
                    }`}
                  >
                    {isExpired ? '00:00' : formatTimer(countdown)}
                  </div>
                </div>

                <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 p-3 bg-white rounded-2xl border-2 border-line shadow-inner flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={getQrImageUrl(checkoutData.qrCode)}
                    alt="VietQR PayOS"
                    className={`w-full h-full object-contain rounded-xl transition-all ${isExpired ? 'blur-xs opacity-20' : ''}`}
                    onError={e => {
                      const target = e.currentTarget
                      if (checkoutData?.bin && checkoutData?.accountNumber) {
                        const fallbackUrl = `https://api.vietqr.io/image/${checkoutData.bin}-${checkoutData.accountNumber}-qr_only.png?amount=${checkoutData.amount}&addInfo=${encodeURIComponent(checkoutData.description)}&accountName=${encodeURIComponent(checkoutData.accountName)}`
                        if (target.src !== fallbackUrl) target.src = fallbackUrl
                      }
                    }}
                  />
                  {isExpired && (
                    <div className="absolute inset-0 bg-card/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                      <AlertTriangle className="w-10 h-10 text-danger mb-2" />
                      <div className="text-sm font-black text-foreground">
                        {t('guestPricingCheckoutQrExpired')}
                      </div>
                      <p className="text-xs text-muted mt-1 mb-4">
                        {t('guestPricingCheckoutQrExpiredDesc')}
                      </p>
                      <Button
                        size="xs"
                        variant="dark"
                        onClick={handleGenerateCheckout}
                        leftIcon={<RefreshCw />}
                      >
                        {t('guestPricingCheckoutGenerateNewQr')}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2.5 pt-2 text-xs">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                    <span className="text-muted">{t('guestPricingCheckoutBank')}</span>
                    <strong className="text-foreground font-bold">
                      {BANK_NAMES[checkoutData.bin] || `Ngân hàng (BIN: ${checkoutData.bin})`}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                    <span className="text-muted">{t('guestPricingCheckoutAccountNumber')}</span>
                    <div className="flex items-center gap-2">
                      <strong className="text-foreground font-mono font-bold">
                        {checkoutData.accountNumber}
                      </strong>
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
                    <span className="text-muted">{t('guestPricingCheckoutAccountName')}</span>
                    <strong className="text-foreground font-bold uppercase">
                      {checkoutData.accountName}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-surface border border-line">
                    <span className="text-muted">{t('guestPricingCheckoutAmount')}</span>
                    <strong className="text-success font-black text-sm">
                      {formatVnd(checkoutData.amount)}
                    </strong>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-warning-soft border border-warning-subtle">
                    <span className="text-warning font-medium">
                      {t('guestPricingCheckoutTransferContent')}
                    </span>
                    <div className="flex items-center gap-2">
                      <strong className="text-warning font-mono font-black">
                        {checkoutData.description}
                      </strong>
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

                <div className="p-3.5 rounded-2xl bg-accent-soft border border-accent-subtle flex items-center justify-center gap-3 text-xs font-semibold text-accent">
                  <RefreshCw className="w-4 h-4 text-accent animate-spin shrink-0" />
                  <span>{t('guestPricingCheckoutWaitingTransfer')}</span>
                </div>
              </div>
            ) : (
              /* PLACEHOLDER STATE */
              <div className="py-14 px-4 text-center space-y-4 text-muted">
                <div className="w-16 h-16 rounded-3xl bg-card-hover border border-line text-muted flex items-center justify-center mx-auto">
                  <QrCode className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">
                    {t('guestPricingCheckoutReadyTitle')}
                  </h3>
                  <p className="text-xs text-muted mt-1 max-w-sm mx-auto leading-relaxed">
                    {isVi
                      ? "Chọn gói lượt bên trái và nhấn nút 'Thanh toán VietQR' để hiển thị mã QR."
                      : 'Select a pack on the left then click to show your payment QR code.'}
                  </p>
                </div>
                <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-accent">
                  <Zap className="w-4 h-4" />
                  <span>{t('guestPricingCheckoutInstantReconcile')}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Exported page wrapped with IdentityGuard ─────────────────────────────────
export default function RentalPlatformPurchasePage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect('/pricing')
  }
  return (
    <IdentityGuard>
      <React.Suspense
        fallback={
          <div className="min-h-screen flex items-center justify-center text-xs font-bold text-muted">
            Loading...
          </div>
        }
      >
        <BuyTurnsPageInner />
      </React.Suspense>
    </IdentityGuard>
  )
}
