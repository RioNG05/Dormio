"use client";

import React, { useState, useEffect, useCallback, useRef, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Calendar,
  Lock,
  ExternalLink,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/button";
import {
  subscriptionService,
  SubscriptionPlanItem,
  TierStatusResponse,
  SubscriptionCheckoutResponse,
} from "@/services/subscription.service";
import IdentityGuard from "@/components/IdentityGuard";

const BANK_NAMES: Record<string, string> = {
  "970422": "MB Bank (Quân Đội)",
  "970415": "VietinBank",
  "970436": "Vietcombank",
  "970407": "Techcombank",
  "970423": "TPBank",
  "970432": "VPBank",
  "970418": "BIDV",
  "970405": "Agribank",
  "970416": "ACB",
  "970441": "VIB",
  "970403": "Sacombank",
  "970448": "OCB",
  "970452": "KienlongBank",
};

/**
 * Helper to ensure a valid QR image URL is always provided.
 * PayOS returns a raw VietQR EMVCo text payload (starts with 000201...) rather than an image URL.
 */
function getQrImageUrl(data: SubscriptionCheckoutResponse | null): string {
  if (!data?.qrCode) return "";
  if (
    data.qrCode.startsWith("http://") ||
    data.qrCode.startsWith("https://") ||
    data.qrCode.startsWith("data:image")
  ) {
    return data.qrCode;
  }
  // Convert EMVCo payload string into a standard QR image
  return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(
    data.qrCode
  )}`;
}

interface PageProps {
  params: Promise<{
    plan: string;
  }>;
}

function PricingCheckoutPageInner({ params }: PageProps) {
  const resolvedParams = use(params);
  const planParam = resolvedParams.plan?.toLowerCase() as "plus" | "pro";
  const router = useRouter();
  const { user, isLoggedIn, isHydrating } = useAuth();
  const { locale } = useLanguage();
  const t = useTranslations("guest");

  // Data states
  const [currentPlan, setCurrentPlan] = useState<SubscriptionPlanItem | null>(null);
  const [tierStatus, setTierStatus] = useState<TierStatusResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCycle, setSelectedCycle] = useState<"monthly" | "quarterly" | "yearly">("monthly");

  // Checkout states
  const [checkoutData, setCheckoutData] = useState<SubscriptionCheckoutResponse | null>(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const [countdown, setCountdown] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isCopiedAcc, setIsCopiedAcc] = useState(false);
  const [isCopiedSyntax, setIsCopiedSyntax] = useState(false);

  // Toast notification hook
  const { toast } = useToast();

  const showToast = useCallback(
    (type: "success" | "error", text: string) => {
      if (type === "success") {
        toast.success(text);
      } else {
        toast.error(text);
      }
    },
    [toast]
  );

  // Auth requirement check: Must be logged in to checkout
  useEffect(() => {
    if (!isHydrating && !isLoggedIn) {
      router.push(`/login?redirect=/pricing/${planParam}`);
    }
  }, [isHydrating, isLoggedIn, planParam, router]);

  // Format currency
  const formatVnd = (num: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(num);
  };

  // Format date helper
  const formatDateDisplay = (dateStr: string | null) => {
    if (!dateStr) return "—";
    const d = new Date(dateStr);
    return d.toLocaleDateString(locale === "en" ? "en-US" : "vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Billing cycle label helpers
  const getCycleName = (cycle: "monthly" | "quarterly" | "yearly") => {
    if (cycle === "monthly") return t("guestPricingCheckoutCycleMonthly");
    if (cycle === "quarterly") return t("guestPricingCheckoutCycleQuarterly");
    return t("guestPricingCheckoutCycleYearly");
  };

  // 1. Fetch Plan Details and Tier Status
  const loadPageData = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const allPlans = await subscriptionService.getPlans();
      const targetPlan = allPlans.find(
        (p) => p.planName.toLowerCase() === planParam
      );
      if (targetPlan) {
        setCurrentPlan(targetPlan);
      }

      // Check current tier status for consecutive extension
      const status = await subscriptionService.getTierStatus(planParam);
      setTierStatus(status);
    } catch (err: any) {
      console.error("Failed to load subscription checkout data", err);
      showToast("error", t("guestPricingCheckoutLoadError"));
    } finally {
      setIsLoading(false);
    }
  }, [planParam, user, t, showToast]);

  useEffect(() => {
    if (user) {
      loadPageData();
    }
  }, [user, loadPageData]);

  // 2. Countdown timer effect (clean interval without recreating on every tick)
  useEffect(() => {
    if (!checkoutData || isSuccess) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [checkoutData?.orderCode, isSuccess]);

  // Format seconds to MM:SS
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // 3. Initiate or Refresh PayOS Checkout
  const handleGenerateCheckout = async (cycleToUse = selectedCycle) => {
    setIsGeneratingQr(true);
    setIsExpired(false);
    try {
      const res = await subscriptionService.createCheckout(planParam, cycleToUse);
      setCheckoutData(res);
      setCountdown(res.expiresIn || 900);

      if (res.isReused) {
        showToast("success", t("guestPricingCheckoutResumeSession"));
      }
    } catch (err: any) {
      console.error("Error creating checkout", err);
      showToast(
        "error",
        err.message || t("guestPricingCheckoutGenerateQrError")
      );
    } finally {
      setIsGeneratingQr(false);
    }
  };

  // 4. Polling for payment status while QR is active
  const isPollingRef = useRef(false);

  useEffect(() => {
    const orderCode = checkoutData?.orderCode;
    if (!orderCode || isSuccess || isExpired) return;

    const checkStatus = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const orderStatus = await subscriptionService.getOrderStatus(orderCode);
        if (orderStatus.isPaid) {
          setIsSuccess(true);
          const planTitle = planParam.toUpperCase();
          showToast(
            "success",
            t("guestPricingCheckoutSuccessToast", { plan: planTitle })
          );
        }
      } catch (err) {
        // Silent poll error
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(checkStatus, 3000);
    return () => clearInterval(interval);
  }, [checkoutData?.orderCode, isSuccess, isExpired, planParam, t, showToast]);

  // Copy helper
  const handleCopy = (text: string, type: "acc" | "syntax") => {
    navigator.clipboard.writeText(text);
    if (type === "acc") {
      setIsCopiedAcc(true);
      setTimeout(() => setIsCopiedAcc(false), 2000);
    } else {
      setIsCopiedSyntax(true);
      setTimeout(() => setIsCopiedSyntax(false), 2000);
    }
  };

  // Calculate pricing values based on selected cycle
  const getCyclePrice = (cycle: "monthly" | "quarterly" | "yearly") => {
    if (!currentPlan) return 0;
    if (cycle === "monthly") return currentPlan.priceMonthly;
    if (cycle === "quarterly")
      return currentPlan.priceQuarterly || Math.round(currentPlan.priceMonthly * 3 * 0.9);
    return currentPlan.priceYearly;
  };

  const getCycleSavings = (cycle: "monthly" | "quarterly" | "yearly") => {
    if (!currentPlan || cycle === "monthly") return null;
    const base = currentPlan.priceMonthly * (cycle === "quarterly" ? 3 : 12);
    const actual = getCyclePrice(cycle);
    const saved = base - actual;
    if (saved <= 0) return null;
    const percent = Math.round((saved / base) * 100);
    return { saved, percent };
  };

  if (isHydrating || (!isLoggedIn && !isSuccess)) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3 text-zinc-500">
        <Lock className="w-8 h-8 text-[#2AC1BC] animate-pulse" />
        <p className="text-sm font-semibold">
          {t("guestPricingCheckoutAuthVerifying")}
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 min-h-screen pb-28 animate-in fade-in duration-300">
      {/* Header bar */}
      <div className="mb-8">
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>{t("guestPricingCheckoutBackToPricing")}</span>
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black tracking-widest uppercase text-[#2AC1BC] mb-1">
              <Sparkles className="w-4 h-4" />
              <span>{t("guestPricingCheckoutBadge")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight flex items-center gap-3">
              <span>{t("guestPricingCheckoutTitle")}</span>
              <span className="uppercase px-3 py-1 text-xs rounded-xl font-black tracking-wide bg-gradient-to-r from-[#2AC1BC] to-teal-600 text-white shadow-sm">
                {planParam}
              </span>
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-zinc-100 border border-zinc-200/80 px-3.5 py-1.5 rounded-full text-xs font-medium text-zinc-600">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>{t("guestPricingCheckoutGatewayBadge")}</span>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-16 flex flex-col items-center justify-center gap-4 text-zinc-400">
          <RefreshCw className="w-8 h-8 animate-spin text-[#2AC1BC]" />
          <p className="text-sm font-medium">
            {t("guestPricingCheckoutLoading")}
          </p>
        </div>
      ) : !currentPlan ? (
        <div className="bg-white rounded-3xl border border-zinc-200 p-12 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold text-zinc-900 mb-1">
            {t("guestPricingCheckoutNotFound")}
          </h2>
          <p className="text-sm text-zinc-500 mb-6">
            {t("guestPricingCheckoutNotFoundDesc")}
          </p>
          <Link href="/pricing">
            <Button className="px-5 py-2.5 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition h-auto">
              {t("guestPricingCheckoutBackToPlansBtn")}
            </Button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─── CỘT TRÁI: THÔNG TIN GÓI & CHỌN THỜI HẠN ─── */}
          <div className="lg:col-span-6 space-y-6">
            {/* Edge Case Alert: Consecutive Extension Banner */}
            {tierStatus?.hasActiveSameTier && (
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 flex items-start gap-3.5 shadow-sm">
                <Calendar className="w-5 h-5 text-sky-600 shrink-0 mt-0.5" />
                <div className="text-xs sm:text-sm text-sky-900 leading-relaxed">
                  <div className="font-bold text-sky-950 mb-0.5">
                    {t("guestPricingCheckoutExtensionActive")}
                  </div>
                  <span>
                    {t("guestPricingCheckoutExtensionDesc", {
                      plan: planParam.toUpperCase(),
                      date: formatDateDisplay(tierStatus.currentEndDate),
                      startDate: formatDateDisplay(tierStatus.effectiveStartDate),
                    })}
                  </span>
                </div>
              </div>
            )}

            {/* Plan Card Detail */}
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 space-y-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">
                    {t("guestPricingCheckoutLabelPlan")}
                  </span>
                  <div className="text-2xl font-black text-zinc-900 flex items-center gap-2.5 mt-0.5">
                    <Crown className="w-6 h-6 text-amber-500 fill-amber-500/20" />
                    <span>Dormio {currentPlan.planName.toUpperCase()}</span>
                  </div>
                  <p className="text-xs sm:text-sm text-zinc-500 mt-1">
                    {currentPlan.description || t("guestPricingProPlanDesc")}
                  </p>
                </div>
              </div>

              {/* Cycle Selector Buttons (Tháng / Quý / Năm) */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-2.5">
                  {t("guestPricingCheckoutSelectCycle")}
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {(["monthly", "quarterly", "yearly"] as const).map((cycle) => {
                    const isSelected = selectedCycle === cycle;
                    const savings = getCycleSavings(cycle);
                    return (
                      <button
                        key={cycle}
                        type="button"
                        onClick={() => {
                          setSelectedCycle(cycle);
                          if (checkoutData && checkoutData.billingCycle !== cycle) {
                            setCheckoutData(null);
                            setIsExpired(false);
                          }
                        }}
                        className={`relative p-3 sm:p-4 rounded-2xl border text-left transition-all flex flex-col justify-between cursor-pointer ${isSelected
                            ? "bg-zinc-900 text-white border-zinc-900 shadow-md ring-2 ring-zinc-900/10"
                            : "bg-zinc-50/70 hover:bg-zinc-100/80 text-zinc-700 border-zinc-200"
                          }`}
                      >
                        {savings && (
                          <span className="absolute -top-2.5 right-2 px-1.5 py-0.5 text-[10px] font-black uppercase tracking-tight rounded-md bg-rose-500 text-white shadow-xs">
                            {t("guestPricingCheckoutSaveBadge", { percent: savings.percent })}
                          </span>
                        )}
                        <div className="text-xs font-bold">
                          {getCycleName(cycle)}
                        </div>
                        <div
                          className={`text-sm sm:text-base font-black mt-2 ${isSelected ? "text-[#2AC1BC]" : "text-zinc-900"
                            }`}
                        >
                          {formatVnd(getCyclePrice(cycle))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Feature Checklist */}
              <div className="pt-2 border-t border-zinc-100">
                <span className="block text-xs font-bold uppercase tracking-wider text-zinc-500 mb-3">
                  {t("guestPricingCheckoutFeaturesTitle")}
                </span>
                <ul className="space-y-2.5">
                  <li className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      {t("guestPricingCheckoutMaxRooms", { count: currentPlan.maxRoom })}
                    </span>
                  </li>
                  <li className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 font-medium">
                    <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <Check className="w-3.5 h-3.5" />
                    </div>
                    <span>
                      {t("guestPricingCheckoutDailyPosts", { count: currentPlan.dailyPostQuote })}
                    </span>
                  </li>
                  {currentPlan.features?.map((f, idx) => (
                    <li
                      key={idx}
                      className="flex items-center gap-3 text-xs sm:text-sm text-zinc-700 font-medium"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Action Button: Đăng ký theo [thời hạn] */}
              <div className="pt-4 border-t border-zinc-100">
                <Button
                  type="button"
                  disabled={isGeneratingQr || isSuccess}
                  onClick={() => handleGenerateCheckout(selectedCycle)}
                  className={`w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wide flex items-center justify-center gap-2.5 shadow-lg transition-all active:scale-[0.99] h-auto ${isSuccess
                      ? "bg-emerald-600 text-white cursor-default hover:bg-emerald-600"
                      : "bg-[#2AC1BC] hover:bg-[#25aba6] text-white shadow-teal-500/25 cursor-pointer"
                    }`}
                >
                  {isGeneratingQr ? (
                    <>
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{t("guestPricingCheckoutPayBtnLoading")}</span>
                    </>
                  ) : isSuccess ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>{t("guestPricingCheckoutSuccessTitle")}</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-5 h-5" />
                      <span>
                        {t("guestPricingCheckoutPayBtn")} — {getCycleName(selectedCycle)} ({formatVnd(getCyclePrice(selectedCycle))})
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* ─── CỘT PHẢI: KHU VỰC THANH TOÁN (IN-PAGE - KHÔNG MODAL) ─── */}
          <div className="lg:col-span-6">
            <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-sm p-6 sm:p-8 relative overflow-hidden">
              {/* TRƯỜNG HỢP 1: ĐÃ THANH TOÁN THÀNH CÔNG */}
              {isSuccess ? (
                <div className="py-8 text-center space-y-6 animate-in zoom-in-95 duration-400">
                  <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                    <CheckCircle2 className="w-12 h-12" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-zinc-900 tracking-tight">
                      {t("guestPricingCheckoutSuccessTitle")}
                    </h2>
                    <p className="text-sm text-zinc-600 mt-2 max-w-md mx-auto leading-relaxed">
                      {t("guestPricingCheckoutSuccessDesc", {
                        plan: planParam.toUpperCase(),
                      })}
                    </p>
                  </div>

                  {checkoutData && (
                    <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 max-w-sm mx-auto text-left text-xs space-y-1.5 font-medium text-zinc-600">
                      <div className="flex justify-between">
                        <span>{t("guestPricingCheckoutLabelPlan")}</span>
                        <strong className="text-zinc-900 uppercase">{planParam}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("guestPricingCheckoutLabelCycle")}</span>
                        <strong className="text-zinc-900 capitalize">
                          {checkoutData.billingCycle}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>{t("guestPricingCheckoutLabelValidUntil")}</span>
                        <strong className="text-emerald-700">
                          {formatDateDisplay(checkoutData.endDate)}
                        </strong>
                      </div>
                    </div>
                  )}

                  <div className="pt-2">
                    <Link href="/landlord/reports">
                      <Button className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl font-black text-sm bg-zinc-900 text-white hover:bg-zinc-800 transition shadow-lg shadow-zinc-900/20 active:scale-95 h-auto">
                        <span>{t("guestPricingCheckoutGoToDashboard")}</span>
                        <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : checkoutData ? (
                /* TRƯỜNG HỢP 2: ĐANG HIỂN THỊ MÃ QR IN-PAGE VỚI COUNTDOWN */
                <div className="space-y-6">
                  {/* Top Bar with Countdown Timer */}
                  <div className="flex items-center justify-between gap-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-amber-900">
                    <div className="flex items-center gap-2 text-xs font-bold">
                      <Clock className="w-4 h-4 text-amber-600" />
                      <span>{t("guestPricingCheckoutQrExpiryCountdown")}</span>
                    </div>
                    <div
                      className={`text-sm font-black font-mono tracking-wider px-3 py-1 rounded-xl ${isExpired
                          ? "bg-rose-600 text-white"
                          : countdown < 120
                            ? "bg-rose-500 text-white animate-pulse"
                            : "bg-amber-600 text-white"
                        }`}
                    >
                      {isExpired ? "00:00" : formatTimer(countdown)}
                    </div>
                  </div>

                  {/* QR Image Frame with Expired Overlay */}
                  <div className="relative mx-auto w-64 h-64 sm:w-72 sm:h-72 p-3 bg-white rounded-2xl border-2 border-zinc-200/80 shadow-inner flex items-center justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={getQrImageUrl(checkoutData)}
                      alt="VietQR PayOS"
                      className={`w-full h-full object-contain rounded-xl transition-all ${isExpired ? "blur-xs opacity-20" : ""
                        }`}
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (checkoutData?.bin && checkoutData?.accountNumber) {
                          const fallbackUrl = `https://api.vietqr.io/image/${checkoutData.bin}-${checkoutData.accountNumber}-qr_only.png?amount=${checkoutData.amount}&addInfo=${encodeURIComponent(
                            checkoutData.description
                          )}&accountName=${encodeURIComponent(checkoutData.accountName)}`;
                          if (target.src !== fallbackUrl) {
                            target.src = fallbackUrl;
                          }
                        }
                      }}
                    />

                    {isExpired && (
                      <div className="absolute inset-0 bg-white/90 backdrop-blur-xs rounded-2xl flex flex-col items-center justify-center p-4 text-center">
                        <AlertTriangle className="w-10 h-10 text-rose-500 mb-2" />
                        <div className="text-sm font-black text-zinc-900">
                          {t("guestPricingCheckoutQrExpired")}
                        </div>
                        <p className="text-xs text-zinc-500 mt-1 mb-4">
                          {t("guestPricingCheckoutQrExpiredDesc")}
                        </p>
                        <Button
                          type="button"
                          onClick={() => handleGenerateCheckout(selectedCycle)}
                          className="px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold hover:bg-zinc-800 transition flex items-center gap-2 cursor-pointer h-auto"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          <span>{t("guestPricingCheckoutGenerateNewQr")}</span>
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Bank Transfer Details with Copy buttons */}
                  <div className="space-y-2.5 pt-2 text-xs">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <span className="text-zinc-500">{t("guestPricingCheckoutBank")}</span>
                      <strong className="text-zinc-900 font-bold">
                        {BANK_NAMES[checkoutData.bin] || `Ngân hàng (BIN: ${checkoutData.bin})`}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <span className="text-zinc-500">{t("guestPricingCheckoutAccountNumber")}</span>
                      <div className="flex items-center gap-2">
                        <strong className="text-zinc-900 font-mono font-bold">
                          {checkoutData.accountNumber}
                        </strong>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(checkoutData.accountNumber, "acc")}
                          className="w-7 h-7 p-1 rounded-md text-zinc-400 hover:text-zinc-800 hover:bg-zinc-200/60 transition cursor-pointer"
                          title="Copy"
                        >
                          {isCopiedAcc ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <span className="text-zinc-500">{t("guestPricingCheckoutAccountName")}</span>
                      <strong className="text-zinc-900 font-bold uppercase">
                        {checkoutData.accountName}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-50 border border-zinc-200/70">
                      <span className="text-zinc-500">{t("guestPricingCheckoutAmount")}</span>
                      <strong className="text-emerald-600 font-black text-sm">
                        {formatVnd(checkoutData.amount)}
                      </strong>
                    </div>

                    <div className="flex items-center justify-between p-3 rounded-xl bg-amber-50/70 border border-amber-200/60">
                      <span className="text-amber-800 font-medium">
                        {t("guestPricingCheckoutTransferContent")}
                      </span>
                      <div className="flex items-center gap-2">
                        <strong className="text-amber-950 font-mono font-black">
                          {checkoutData.description}
                        </strong>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(checkoutData.description, "syntax")}
                          className="w-7 h-7 p-1 rounded-md text-amber-600 hover:text-amber-950 hover:bg-amber-100 transition cursor-pointer"
                          title="Copy"
                        >
                          {isCopiedSyntax ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Realtime Waiting Indicator */}
                  <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200/60 flex items-center justify-center gap-3 text-xs font-semibold text-teal-800">
                    <RefreshCw className="w-4 h-4 text-[#2AC1BC] animate-spin shrink-0" />
                    <span>
                      {t("guestPricingCheckoutWaitingTransfer")}
                    </span>
                  </div>
                </div>
              ) : (
                /* TRƯỜNG HỢP 3: CHƯA BẤM TẠO QR - PLACEHOLDER HƯỚNG DẪN */
                <div className="py-14 px-4 text-center space-y-4 text-zinc-400">
                  <div className="w-16 h-16 rounded-3xl bg-zinc-100 border border-zinc-200 text-zinc-400 flex items-center justify-center mx-auto">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-zinc-800">
                      {t("guestPricingCheckoutReadyTitle")}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto leading-relaxed">
                      {t("guestPricingCheckoutReadyDesc")}
                    </p>
                  </div>
                  <div className="pt-2 flex items-center justify-center gap-2 text-xs font-bold text-[#2AC1BC]">
                    <Zap className="w-4 h-4" />
                    <span>{t("guestPricingCheckoutInstantReconcile")}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Exported page wrapped with IdentityGuard ─────────────────────────────────
export default function PricingCheckoutPage({ params }: PageProps) {
  return (
    <IdentityGuard>
      <PricingCheckoutPageInner params={params} />
    </IdentityGuard>
  );
}
