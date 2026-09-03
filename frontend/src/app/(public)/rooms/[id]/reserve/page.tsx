"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, ShieldCheck, CreditCard, CheckCircle2, Lock } from "lucide-react";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";

export default function ReserveRoomPage() {
  const params = useParams();
  const roomId = params?.id || "1";
  const router = useRouter();
  const t = useTranslations("reserve");
  const { locale } = useLanguage();
  const [agreed, setAgreed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const holdingDeposit = 1000000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-[75vh] bg-zinc-50/50 py-12 px-4 sm:px-6 lg:px-8 animate-in fade-in">
      <div className="mx-auto max-w-2xl space-y-6">
        <Link
          href={`/rooms/${roomId}`}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {locale === "en" ? "Back to room details" : "Quay lại chi tiết phòng"}
        </Link>

        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-black uppercase tracking-wider mb-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Dormio Escrow Guarantee</span>
            </div>
            <h1 className="text-2xl font-black text-zinc-900">{t("title")}</h1>
            <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
              {t("subtitle")}
            </p>
          </div>

          {isSuccess ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900">
                {locale === "en" ? "Reservation Request Submitted!" : "Yêu Cầu Giữ Chỗ Đã Gửi Thành Công!"}
              </h2>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                {locale === "en"
                  ? "Landlord will contact you within 2 business hours. Your deposit is held securely by Dormio Escrow."
                  : "Chủ nhà sẽ liên hệ với bạn trong vòng 2 giờ làm việc. Tiền cọc được bảo vệ an toàn qua Dormio Escrow."}
              </p>
              <div className="pt-4">
                <Link
                  href="/rooms"
                  className="px-6 py-2.5 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl shadow-sm"
                >
                  {locale === "en" ? "Explore More Rooms" : "Khám phá thêm phòng khác"}
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="p-4 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500 font-medium">{t("depositAmount")}</div>
                  <div className="text-xl font-black text-[#2AC1BC] mt-0.5">
                    {formatCurrency(holdingDeposit, locale)}
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  <Lock className="w-3.5 h-3.5" />
                  <span>{locale === "en" ? "Safe Deposit" : "Cọc an toàn"}</span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    {locale === "en" ? "Full Name *" : "Họ và tên người thuê *"}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nguyễn Văn A"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-zinc-700">
                    {locale === "en" ? "Phone Number *" : "Số điện thoại liên hệ *"}
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="0912 345 678"
                    className="w-full px-4 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
                  />
                </div>
              </div>

              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-zinc-600 font-medium pt-1">
                <input
                  type="checkbox"
                  required
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-0.5 w-4 h-4 rounded accent-[#2AC1BC]"
                />
                <span>{t("agreeTerms")}</span>
              </label>

              <button
                type="submit"
                disabled={!agreed || isSubmitting}
                className={`w-full py-3.5 text-xs sm:text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-sm transition-all ${
                  agreed && !isSubmitting
                    ? "bg-[#2AC1BC] hover:bg-[#23a8a3] text-white cursor-pointer hover:scale-[1.01]"
                    : "bg-zinc-200 text-zinc-400 cursor-not-allowed"
                }`}
              >
                <CreditCard className="w-4 h-4" />
                <span>
                  {isSubmitting
                    ? locale === "en"
                      ? "Processing..."
                      : "Đang xử lý..."
                    : t("confirmReserveBtn")}
                </span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}