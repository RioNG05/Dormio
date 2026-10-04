"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Sparkles,
  Building2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Sparkle,
  Loader2,
  UserCheck,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "@/context/LanguageContext";
import { useToast } from "@/context/ToastContext";
import { postService, PostQuotaStatus } from "@/services/post.service";
import { TextInput } from "@/components/ui/TextInput";
import { TextareaInput } from "@/components/ui/TextareaInput";
import { NumberInput } from "@/components/ui/NumberInput";
import { Button } from "@/components/ui/button";
import { MultiImageUpload } from "@/components/MultiImageUpload";

export default function PublicCreatePostPage() {
  const t = useTranslations("guest");
  const router = useRouter();

  // Quota & loading state
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null);
  const [isLoadingQuota, setIsLoadingQuota] = useState(true);

  // Form fields
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [depositAmount, setDepositAmount] = useState<string>("2500000");
  const [imageUrls, setImageUrls] = useState<string[]>([]);

  // Submission & validation state
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Unsaved changes modal state
  const [isDirty, setIsDirty] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  useEffect(() => {
    async function fetchQuota() {
      try {
        setIsLoadingQuota(true);
        const data = await postService.getQuota();
        setQuota(data);
      } catch (err: any) {
        console.warn("Could not fetch quota from server, using fallback default:", err);
        setQuota({
          isLandlord: false,
          planName: "leasing_agent",
          baseDailyQuota: 3,
          bonusDailyQuota: 0,
          dailyPostQuota: 3,
          freePostsUsedToday: 0,
          freePostsRemainingToday: 3,
          purchasedCreditsAvailable: 0,
          canPublish: true,
        });
      } finally {
        setIsLoadingQuota(false);
      }
    }
    fetchQuota();
  }, []);

  const handleFieldChange = (setter: (val: any) => void, value: any) => {
    setter(value);
    setIsDirty(true);
    setErrorMessage(null);
  };

  const handleCancelClick = () => {
    if (isDirty) {
      setPendingNavigation("/");
      setShowConfirmModal(true);
    } else {
      router.push("/");
    }
  };

  const handleConfirmLeave = () => {
    setShowConfirmModal(false);
    setIsDirty(false);
    if (pendingNavigation) {
      router.push(pendingNavigation);
    }
  };

  const handleSubmit = async (e: React.FormEvent, status: "draft" | "posted" = "posted") => {
    e.preventDefault();
    setErrorMessage(null);

    if (!title.trim() || title.trim().length < 5) {
      setErrorMessage(t("guestPostsCreateValidationTitle"));
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      setErrorMessage(t("guestPostsCreateValidationContent"));
      return;
    }

    const parsedDeposit = Number(depositAmount);
    if (isNaN(parsedDeposit) || parsedDeposit < 0) {
      setErrorMessage(t("guestPostsCreateValidationDeposit"));
      return;
    }

    try {
      setIsSubmitting(true);
      await postService.createPost({
        title: title.trim(),
        content: content.trim(),
        depositAmount: parsedDeposit,
        imageUrls: imageUrls.filter((url) => url.trim().length > 0),
        status,
      });

      toast.success(
        status === "posted"
          ? t("guestPostsCreateSuccessPublish")
          : t("guestPostsCreateSuccessDraft")
      );

      setIsDirty(false);
      router.push("/posts/analytics");
    } catch (err: any) {
      console.error("Failed to create post:", err);
      setErrorMessage(
        err.message || t("guestPostsCreateErrorFallback")
      );
      toast.error(err.message || t("guestPostsCreateErrorFallback"));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 py-10 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancelClick}
            className="p-2.5 bg-white hover:bg-zinc-100 rounded-2xl border border-zinc-200 transition-colors shadow-xs text-zinc-600 hover:text-zinc-900 cursor-pointer"
            title={t("guestPostsCreateBackHome")}
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
              {t("guestPostsCreateTitle")}
            </h1>
            <p className="text-xs text-zinc-500 font-medium">
              {t("guestPostsCreateSubtitle")}
            </p>
          </div>
        </div>

        {/* Live Quota Pill Indicator */}
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-zinc-200 shadow-xs self-start sm:self-auto">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <div className="text-xs font-semibold text-zinc-700">
            {isLoadingQuota ? (
              <span className="text-zinc-400">Đang tải hạn mức...</span>
            ) : quota ? (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-zinc-900 font-bold">
                  {quota.isLandlord
                    ? t("guestPostsCreateQuotaLandlord", { plan: quota.planName })
                    : t("guestPostsCreateQuotaAgent")}
                  :
                </span>
                <span className="text-[#FF6B35] font-bold">
                  {t("guestPostsCreateRemainingFree", {
                    remaining: quota.freePostsRemainingToday,
                    total: quota.dailyPostQuota,
                  })}
                </span>
                {quota.purchasedCreditsAvailable > 0 && (
                  <span className="text-purple-600 font-bold ml-1">
                    · {t("guestPostsCreatePaidAvailable", { count: quota.purchasedCreditsAvailable })}
                  </span>
                )}
                {!quota.canPublish && (
                  <span className="text-rose-500 font-bold ml-1">
                    ({t("guestPostsCreateQuotaExhausted")})
                  </span>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Quota Encouragement Banner */}
      <div className="p-4 sm:p-5 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-transparent rounded-3xl border border-orange-200/60 flex items-start sm:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-[#FF6B35] text-white flex items-center justify-center shrink-0 shadow-md shadow-[#FF6B35]/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">
              {t("guestPostsCreateBannerTitle")}
            </h3>
            <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">
              {t("guestPostsCreateBannerDesc")}
            </p>
          </div>
        </div>
        <Link
          href="/pricing/rental-platform"
          className="shrink-0 px-3.5 py-2 text-xs font-bold text-[#FF6B35] hover:text-white bg-white hover:bg-[#FF6B35] border border-orange-200 rounded-xl transition-all shadow-xs"
        >
          Mua thêm lượt &rarr;
        </Link>
      </div>

      {/* Main Form */}
      <form onSubmit={(e) => handleSubmit(e, "posted")} className="space-y-6">
        {/* 1. Basic Information */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-[#FF6B35]/10 flex items-center justify-center text-[#FF6B35]">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {t("guestPostsCreateSectionBasic")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("guestPostsCreateSectionBasicSub")}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <TextInput
              label={t("guestPostsCreateTitleLabel")}
              required
              value={title}
              onChange={(e) => handleFieldChange(setTitle, e.target.value)}
              placeholder={t("guestPostsCreateTitlePlaceholder")}
              helperText={t("guestPostsCreateTitleMinLength")}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
              <NumberInput
                label={t("guestPostsCreateDepositLabel")}
                required
                min={0}
                step={100000}
                suffixText="₫"
                value={depositAmount}
                onChange={(e) => handleFieldChange(setDepositAmount, e.target.value)}
                placeholder="2500000"
                helperText={t("guestPostsCreateDepositHint")}
              />

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-zinc-700 select-none">
                  {t("guestPostsCreatePostType")}
                </label>
                <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-xl flex items-center gap-3 min-h-[42px]">
                  <Building2 className="w-5 h-5 text-zinc-400 shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-zinc-700">
                      {t("guestPostsCreatePostTypeMarketplace")}
                    </span>
                    <p className="text-[11px] text-zinc-500">
                      {t("guestPostsCreatePostTypeMarketplaceDesc")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 2. Detailed Description */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-[#2ac1bc]/10 flex items-center justify-center text-[#2ac1bc]">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {t("guestPostsCreateSectionDesc")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("guestPostsCreateSectionDescSub")}
              </p>
            </div>
          </div>

          <TextareaInput
            label={t("guestPostsCreateDescLabel")}
            required
            rows={6}
            value={content}
            onChange={(e) => handleFieldChange(setContent, e.target.value)}
            placeholder={t("guestPostsCreateDescPlaceholder")}
            helperText={t("guestPostsCreateDescMinLength")}
          />
        </div>

        {/* 3. Photos & Media with Reusable Base MultiImageUpload Component */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-xs space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600">
              <ImageIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-900">
                {t("guestPostsCreateSectionImages")}
              </h2>
              <p className="text-xs text-zinc-400">
                {t("guestPostsCreateSectionImagesSub")}
              </p>
            </div>
          </div>

          <MultiImageUpload
            values={imageUrls}
            onChange={(urls) => {
              setImageUrls(urls);
              setIsDirty(true);
            }}
            folder="dormio/posts"
            maxImages={10}
            maxSizeMb={10}
            onDirty={() => setIsDirty(true)}
          />
        </div>

        {/* Error Alert Message directly above Action Buttons */}
        {errorMessage && (
          <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-700 animate-in fade-in duration-200">
            <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold">{t("guestPostsCreateErrorTitle")}</h4>
              <p className="text-xs mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 4. Action Buttons reusing base Button component */}
        <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-zinc-200 shadow-xs">
          <Button
            type="button"
            variant="ghost"
            onClick={handleCancelClick}
            className="text-zinc-600 hover:text-zinc-900"
          >
            {t("guestPostsCreateBtnCancel")}
          </Button>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="secondary"
              disabled={isSubmitting}
              onClick={(e) => handleSubmit(e, "draft")}
            >
              {t("guestPostsCreateBtnDraft")}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
              className="bg-[#FF6B35] hover:bg-[#ff5518] text-white shadow-md shadow-[#FF6B35]/25 gap-2 px-6"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" /> {t("guestPostsCreateBtnProcessing")}
                </>
              ) : (
                <>
                  <Sparkle className="w-4 h-4" /> {t("guestPostsCreateBtnPublish")}
                </>
              )}
            </Button>
          </div>
        </div>
      </form>

      {/* Confirmation Modal when Leaving with Unsaved Changes */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-zinc-200 space-y-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600 shrink-0">
                <AlertCircle className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-zinc-900">
                  {t("guestPostsCreateConfirmTitle")}
                </h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  {t("guestPostsCreateConfirmDesc")}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirmModal(false)}
              >
                {t("guestPostsCreateConfirmContinue")}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmLeave}
              >
                {t("guestPostsCreateConfirmLeave")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
