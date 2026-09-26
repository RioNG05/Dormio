"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Loader2, AlertCircle,
  UserCheck, QrCode, CheckCircle2, Copy, Check, Info,
  AlertTriangle, MessageSquare, CreditCard, ArrowRight,
  Clock, RefreshCw,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import {
  Button,
  TextInput,
  DateInput,
  NumberInput,
  SelectInput,
  TextareaInput,
} from "@/components/ui";
import { ImageUpload } from "@/components/ImageUpload";
import { postService,
  type PublicPostListing,
  type PlatformDepositInstruction,
} from "@/services/post.service";
import { userService, type UserIdentification } from "@/services/user.service";
import { getOrCreateConversation } from "@/services/message.service";
import IdentityGuard from "@/components/IdentityGuard";

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function SkeletonDeposit() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-start justify-center p-4 pt-10 animate-pulse">
      <div className="w-full max-w-lg space-y-4">
        <div className="h-6 w-40 bg-zinc-200 rounded" />
        <div className="h-32 bg-zinc-200 rounded-3xl" />
        <div className="h-12 bg-zinc-200 rounded-2xl" />
        <div className="h-64 bg-zinc-200 rounded-3xl" />
      </div>
    </div>
  );
}

// ─── Exported page wrapped with IdentityGuard ─────────────────────────────────
export default function DepositPage() {
  return (
    <IdentityGuard>
      <DepositPageInner />
    </IdentityGuard>
  );
}

// ─── Step types ───────────────────────────────────────────────────────────────
const STEPS = ["identity_gate", "confirm_amount", "qr_payment", "success"] as const;
type DepositStep =
  | "loading"
  | "login_required"
  | "check_identity"
  | "identity_gate"
  | "confirm_amount"
  | "qr_payment"
  | "success";

// ─── Phone validation ─────────────────────────────────────────────────────────
const PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;
const isPhoneValid = (p: string) => PHONE_REGEX.test(p.replace(/\s/g, ""));

// ─── Main Page ─────────────────────────────────────────────────────────────────
function DepositPageInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentLocale } = useLanguage();
  const { isLoggedIn, user } = useAuth();
  const tGuest = useTranslations("guest");

  // Keep a stable ref for tGuest so effects do NOT re-run on language change
  const tGuestRef = useRef(tGuest);
  tGuestRef.current = tGuest;

  const [post, setPost] = useState<PublicPostListing | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [hasPostError, setHasPostError] = useState(false);

  const [depositStep, setDepositStep] = useState<DepositStep>("loading");
  const [verifiedIdData, setVerifiedIdData] = useState<UserIdentification | null>(null);

  // Identity Form State
  const [idNumber, setIdNumber] = useState("");
  const [idFullName, setIdFullName] = useState("");
  const [idDob, setIdDob] = useState("");
  const [idGender, setIdGender] = useState<"male" | "female">("male");
  const [idNationality, setIdNationality] = useState("Việt Nam");
  const [idPlaceOfOrigin, setIdPlaceOfOrigin] = useState("");
  const [idPlaceOfResidence, setIdPlaceOfResidence] = useState("");
  const [idIssueDate, setIdIssueDate] = useState("");
  const [idExpiryDate, setIdExpiryDate] = useState("");
  const [idCardFrontUrl, setIdCardFrontUrl] = useState("");
  const [idCardBackUrl, setIdCardBackUrl] = useState("");
  const [isSavingIdentity, setIsSavingIdentity] = useState(false);
  const [identityError, setIdentityError] = useState("");

  // Deposit Form State
  const [depositAmountInput, setDepositAmountInput] = useState<number>(0);
  const [depositNote, setDepositNote] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [depositInstruction, setDepositInstruction] = useState<PlatformDepositInstruction | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositErrorMsg, setDepositErrorMsg] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // PayOS Polling & Countdown Timer States
  const [countdown, setCountdown] = useState<number>(0);
  const [isExpired, setIsExpired] = useState(false);
  const isPollingRef = useRef(false);

  // Prevent re-initialization on language switch
  const hasInitializedRef = useRef(false);

  // Rule 10: Discard confirmation modal
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const { toast } = useToast();

  // ─── 1. Load post (Depends ONLY on id, NEVER on language) ───────────────────
  useEffect(() => {
    if (!id) return;
    let isCancelled = false;

    setIsLoadingPost(true);
    setHasPostError(false);

    postService
      .getPublicPostById(id)
      .then((data) => {
        if (!isCancelled) {
          setPost(data);
        }
      })
      .catch(() => {
        if (!isCancelled) {
          setHasPostError(true);
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoadingPost(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [id]);

  const [isCheckingIdentity, setIsCheckingIdentity] = useState(true);
  const [identityCheckResult, setIdentityCheckResult] = useState<{
    checked: boolean;
    hasId: boolean;
    idData: UserIdentification | null;
  }>({ checked: false, hasId: false, idData: null });

  // Auto-advance from check_identity to confirm_amount if verified
  useEffect(() => {
    if (depositStep === "check_identity" && identityCheckResult.checked && identityCheckResult.hasId) {
      const timer = setTimeout(() => {
        setDepositStep("confirm_amount");
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [depositStep, identityCheckResult.checked, identityCheckResult.hasId]);

  // ─── 2. Init deposit flow (Runs ONCE per post load) ─────────────────────────
  const initDepositFlow = useCallback(
    async (loadedPost: PublicPostListing) => {
      if (!isLoggedIn) {
        setDepositStep("login_required");
        return;
      }

      // If already initialized for this session, DO NOT wipe user's input!
      if (hasInitializedRef.current) return;
      hasInitializedRef.current = true;

      setDepositStep("check_identity");
      setIsCheckingIdentity(true);
      try {
        const idRes = await userService.getIdentification();
        const idData = idRes?.userIdentification || idRes?.identification;
        if (idRes?.hasIdentification && idData) {
          setVerifiedIdData(idData);
          setTenantName(idData.fullName || user?.name || (user as any)?.username || "");
          setTenantPhone(user?.phone || (user as any)?.phoneNumber || "");
          setDepositAmountInput(Number(loadedPost.depositAmount ?? 0));
          setIdentityCheckResult({ checked: true, hasId: true, idData });
        } else {
          const fallbackName = user?.name || (user as any)?.username || "";
          setIdFullName(fallbackName);
          setTenantName(fallbackName);
          setTenantPhone(user?.phone || (user as any)?.phoneNumber || "");
          setDepositAmountInput(Number(loadedPost.depositAmount ?? 0));
          setIdentityCheckResult({ checked: true, hasId: false, idData: null });
        }
      } catch {
        setDepositAmountInput(Number(loadedPost.depositAmount ?? 0));
        setIdentityCheckResult({ checked: true, hasId: false, idData: null });
      } finally {
        setIsCheckingIdentity(false);
      }
    },
    [isLoggedIn, user]
  );

  useEffect(() => {
    if (post && !isLoadingPost) {
      if (!post.room) {
        router.replace(`/rooms/${id}`);
        return;
      }
      if (post.room.status === "deposited" || post.room.status === "occupied") {
        router.replace(`/rooms/${id}`);
        return;
      }
      initDepositFlow(post);
    }
  }, [post?.id, isLoadingPost, id, router, initDepositFlow]);

  // ─── 3. Countdown Timer ────────────────────────────────────────────────────
  useEffect(() => {
    if (depositStep !== "qr_payment" || !depositInstruction?.orderCode) return;
    if (countdown <= 0) {
      setIsExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [depositStep, depositInstruction?.orderCode, countdown]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  // ─── 4. Automated PayOS Polling Loop (Every 3 seconds) ──────────────────────
  useEffect(() => {
    const orderCode = depositInstruction?.orderCode;
    if (depositStep !== "qr_payment" || !orderCode || isExpired) return;

    const checkOrderStatus = async () => {
      if (isPollingRef.current) return;
      isPollingRef.current = true;
      try {
        const statusRes = await postService.getDepositOrderStatus(id, orderCode);
        if (statusRes.isPaid || statusRes.status === "PAID" || statusRes.status === "paid") {
          setDepositStep("success");
          toast.success(tGuestRef.current("guestDepositSuccessToast"));
        }
      } catch {
        // Silent polling failure
      } finally {
        isPollingRef.current = false;
      }
    };

    const interval = setInterval(checkOrderStatus, 3000);
    return () => clearInterval(interval);
  }, [depositStep, depositInstruction?.orderCode, isExpired, id]);

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleCopy = (text: string, fieldKey: string) => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2000);
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTenantPhone(val);
    if (phoneError && val.length < 3) setPhoneError("");
  };

  const handlePhoneBlur = () => {
    if (!tenantPhone) return;
    if (!isPhoneValid(tenantPhone)) {
      setPhoneError(tGuestRef.current("guestDepositIdPhoneError"));
    } else {
      setPhoneError("");
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{12}$/.test(idNumber.trim())) {
      setIdentityError(tGuestRef.current("guestDepositIdCccdError"));
      return;
    }
    if (!idFullName.trim()) {
      setIdentityError(tGuestRef.current("guestDepositIdNameError"));
      return;
    }
    if (!idDob) {
      setIdentityError(tGuestRef.current("guestDepositIdDobError"));
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (idDob > today) {
      setIdentityError(tGuestRef.current("guestDepositIdDobFutureError"));
      return;
    }
    setIdentityError("");
    setIsSavingIdentity(true);
    try {
      const saved = await userService.upsertIdentification({
        identityNumber: idNumber.trim(),
        fullName: idFullName.trim(),
        dateOfBirth: idDob,
        gender: idGender,
        nationality: idNationality.trim() || "Việt Nam",
        placeOfOrigin: idPlaceOfOrigin.trim() || undefined,
        placeOfResidence: idPlaceOfResidence.trim() || undefined,
        issueDate: idIssueDate || undefined,
        expiryDate: idExpiryDate || undefined,
        cardFrontUrl: idCardFrontUrl.trim() || undefined,
        cardBackUrl: idCardBackUrl.trim() || undefined,
      });
      setVerifiedIdData(saved);
      setTenantName(saved.fullName || idFullName || user?.name || (user as any)?.username || "");
      setTenantPhone(user?.phone || (user as any)?.phoneNumber || "");
      setDepositStep("confirm_amount");
      toast.success(tGuestRef.current("guestDepositIdentityPassedBadge"));
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || tGuestRef.current("guestRoomDetailSaveError");
      setIdentityError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleInitiateDeposit = async () => {
    if (!post || isSubmittingDeposit) return;
    if (tenantPhone && !isPhoneValid(tenantPhone)) {
      setPhoneError(tGuestRef.current("guestDepositIdPhoneError"));
      return;
    }
    setIsSubmittingDeposit(true);
    setDepositErrorMsg("");
    setIsExpired(false);
    try {
      const instruction = await postService.initiatePlatformDeposit(id, {
        amount: depositAmountInput > 0 ? depositAmountInput : Number(post.depositAmount ?? 0),
        tenantName: (tenantName || "").trim(),
        tenantPhone: (tenantPhone || "").trim(),
        note: (depositNote || "").trim() || undefined,
      });
      setDepositInstruction(instruction);
      setCountdown(instruction.expiresIn || 900);
      setDepositStep("qr_payment");
      if (instruction.isReused) {
        toast.info(tGuestRef.current("guestDepositResumeSession"));
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || tGuestRef.current("guestPricingCheckoutGenerateQrError");
      setDepositErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (depositStep === "success" || depositStep === "check_identity") return false;
    if (depositStep === "identity_gate") {
      return !!(
        idNumber ||
        idFullName ||
        idDob ||
        idPlaceOfOrigin ||
        idPlaceOfResidence ||
        idCardFrontUrl ||
        idCardBackUrl
      );
    }
    if (depositStep === "confirm_amount") {
      return !!(depositNote || ((tenantName || "").trim() && tenantName !== verifiedIdData?.fullName));
    }
    if (depositStep === "qr_payment") return true;
    return false;
  };

  const handleBack = () => {
    if (depositStep === "success") {
      router.push(`/rooms/${id}`);
      return;
    }
    if (depositStep === "identity_gate" && verifiedIdData) {
      setDepositStep("confirm_amount");
      return;
    }
    if (hasUnsavedChanges()) {
      setIsDiscardConfirmOpen(true);
    } else {
      router.push(`/rooms/${id}`);
    }
  };

  const handleStartChat = async () => {
    if (!post?.poster) return;
    try {
      const conv = await getOrCreateConversation(
        post.poster.id,
        `Xin chào, tôi vừa đặt cọc giữ chỗ phòng "${post.title}". Mong được liên hệ sớm ạ!`
      );
      router.push(conv?.id ? `/messages?conversationId=${conv.id}` : "/messages");
    } catch {
      toast.error(tGuestRef.current("guestRoomDetailSaveError"));
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const depositAmount = Number(post?.depositAmount ?? 0);
  const isIdentityPassed = !!verifiedIdData;
  const activeStepIndex =
    depositStep === "check_identity"
      ? (identityCheckResult.hasId ? 1 : 0)
      : STEPS.indexOf(depositStep as typeof STEPS[number]);

  const genderOptions = [
    { value: "male", label: tGuest("guestDepositGenderMale") },
    { value: "female", label: tGuest("guestDepositGenderFemale") },
  ];

  // ─── Render guards ─────────────────────────────────────────────────────────
  if (isLoadingPost) return <SkeletonDeposit />;

  if (hasPostError || !post) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-10 h-10 text-zinc-400" />
        <p className="text-zinc-600 font-semibold text-sm">
          {tGuest("guestRoomsErrorFetch")}
        </p>
        <Link href={`/rooms/${id}`}>
          <Button
            variant="primary"
            size="sm"
            className="bg-[#2AC1BC] hover:bg-[#23a9a4] text-white rounded-xl shadow-md"
          >
            {tGuest("guestRoomDetailBackToList")}
          </Button>
        </Link>
      </div>
    );
  }

  const stepLabels: Record<typeof STEPS[number], string> = {
    identity_gate: tGuest("guestDepositStepIdentity"),
    confirm_amount: tGuest("guestDepositStepConfirm"),
    qr_payment: tGuest("guestDepositStepPayment"),
    success: tGuest("guestDepositStepSuccess"),
  };

  return (
    <div className="min-h-screen bg-zinc-50 animate-in fade-in duration-500 pb-20">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 w-full space-y-5">

        {/* Top Navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
            {tGuest("guestRoomDetailBackToList")}
          </button>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
            {tGuest("guestDepositEscrowBadge")}
          </span>
        </div>

        {/* Post Summary */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 flex items-start gap-3">
          {post.images?.[0] ? (
            <img
              src={post.images[0].url}
              alt={post.title}
              className="w-16 h-16 rounded-xl object-cover border border-zinc-100 shrink-0"
            />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-zinc-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-zinc-900 line-clamp-1">{post.title}</p>
            {post.room && (
              <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                {tGuest("guestDepositRoomPrefix")} {post.room.roomNumber} · {post.room.boardingHouseName}
              </p>
            )}
            <p className="text-sm font-black text-rose-500 mt-1">
              {formatCurrency(depositAmount, currentLocale)}
              <span className="text-xs text-zinc-400 font-normal"> {tGuest("guestRoomDetailMonth")}</span>
            </p>
          </div>
        </div>

        {/* Step Progress Bar */}
        {activeStepIndex >= 0 && (
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done =
                i < activeStepIndex ||
                (s === "identity_gate" && isIdentityPassed && depositStep !== "identity_gate");
              const active = i === activeStepIndex && !done;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`w-6 h-6 rounded-full text-[10px] font-black inline-flex items-center justify-center transition-colors ${done
                          ? "bg-[#2AC1BC] text-white"
                          : active
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-200 text-zinc-400"
                        }`}
                    >
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span
                      className={`text-[9px] font-bold text-center leading-tight w-14 ${i <= activeStepIndex || done ? "text-zinc-700" : "text-zinc-300"
                        }`}
                    >
                      {stepLabels[s]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`h-px flex-1 mb-4 mx-1 transition-colors ${i < activeStepIndex || done ? "bg-[#2AC1BC]" : "bg-zinc-200"
                        }`}
                    />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        )}

        {/* Main Card */}
        <div className="bg-white rounded-3xl border border-zinc-200/80 shadow-xl p-6 space-y-5">
          {/* Card Header */}
          <div className="flex items-center gap-2 pb-3 border-b border-zinc-100">
            <div className="w-8 h-8 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-black text-zinc-900">{tGuest("guestRoomDetailModalTitle")}</h1>
              <span className="text-[10px] font-bold text-[#2AC1BC] uppercase tracking-wider block">
                {tGuest("guestDepositEscrowBadge")}
              </span>
            </div>
          </div>

          {/* Check Identity Step */}
          {depositStep === "check_identity" && (
            <div className="space-y-4">
              {isCheckingIdentity ? (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC] mx-auto" />
                  <p className="text-xs font-bold text-zinc-700">{tGuest("guestDepositCheckingIdentity")}</p>
                  <p className="text-[11px] text-zinc-400">{tGuest("guestDepositCheckingIdentitySub")}</p>
                </div>
              ) : identityCheckResult.hasId && identityCheckResult.idData ? (
                /* User already has valid citizen identification */
                <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto">
                    <ShieldCheck className="w-9 h-9" />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-800 text-[11px] font-black rounded-full mb-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{tGuest("guestDepositIdentityPassedBadge")}</span>
                    </div>
                    <h2 className="text-base font-black text-zinc-900">
                      {tGuest("guestDepositIdentityPassedTitle")}
                    </h2>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                      {tGuest("guestDepositIdentityPassedDesc")}
                    </p>
                  </div>

                  <div className="bg-zinc-50 rounded-2xl border border-zinc-200/80 p-4 text-xs text-left space-y-2.5">
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200/80">
                      <span className="text-zinc-500 font-bold">{tGuest("guestDepositTenantFullName")}</span>
                      <span className="font-extrabold text-zinc-900 uppercase">
                        {identityCheckResult.idData.fullName}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-zinc-200/80">
                      <span className="text-zinc-500 font-bold">{tGuest("guestDepositIdCardNumber")}</span>
                      <span className="font-mono font-black text-emerald-700">
                        •••• •••• {identityCheckResult.idData.identityNumber.slice(-4)}
                      </span>
                    </div>
                    {identityCheckResult.idData.dateOfBirth && (
                      <div className="flex justify-between items-center pb-2 border-b border-zinc-200/80">
                        <span className="text-zinc-500 font-bold">{tGuest("guestDepositDob")}</span>
                        <span className="font-semibold text-zinc-700">
                          {new Date(identityCheckResult.idData.dateOfBirth).toLocaleDateString(
                            currentLocale === "en" ? "en-US" : "vi-VN"
                          )}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span className="text-zinc-500 font-bold">{tGuest("guestDepositEscrowStandard")}</span>
                      <span className="font-black text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> {tGuest("guestDepositEscrowPassed")}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <Button
                      onClick={() => setDepositStep("confirm_amount")}
                      className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-[#2AC1BC]/25 flex items-center justify-center gap-2"
                    >
                      <span>{tGuest("guestDepositIdentityPassedBtn")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={() => {
                        if (identityCheckResult.idData) {
                          setIdNumber(identityCheckResult.idData.identityNumber || "");
                          setIdFullName(identityCheckResult.idData.fullName || "");
                          if (identityCheckResult.idData.dateOfBirth) {
                            setIdDob(identityCheckResult.idData.dateOfBirth.slice(0, 10));
                          }
                          setIdGender(identityCheckResult.idData.gender || "male");
                          setIdNationality(identityCheckResult.idData.nationality || "Việt Nam");
                        }
                        setDepositStep("identity_gate");
                      }}
                      className="text-[11px] text-zinc-400 hover:text-zinc-700 font-semibold underline block mx-auto cursor-pointer"
                    >
                      {tGuest("guestDepositIdentityViewOrUpdate")}
                    </button>
                  </div>
                </div>
              ) : (
                /* User does NOT have identification -> must complete Step 1 */
                <div className="space-y-4 text-center py-2 animate-in fade-in duration-300">
                  <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 border-2 border-amber-200 flex items-center justify-center mx-auto">
                    <AlertTriangle className="w-8 h-8" />
                  </div>

                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 text-amber-800 text-[11px] font-black rounded-full mb-1">
                      <span>{tGuest("guestDepositIdentityMissingBadge")}</span>
                    </div>
                    <h2 className="text-base font-black text-zinc-900">
                      {tGuest("guestDepositIdentityMissingTitle")}
                    </h2>
                    <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                      {tGuest("guestDepositIdentityMissingDesc")}
                    </p>
                  </div>

                  <div className="bg-amber-50/60 rounded-2xl border border-amber-200 p-4 text-xs text-left space-y-1.5 text-amber-900">
                    <div className="font-extrabold flex items-center gap-1.5 text-amber-800">
                      <Info className="w-4 h-4 text-amber-600 shrink-0" />
                      <span>{tGuest("guestDepositIdentityBenefitsTitle")}</span>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-700">
                      <li>{tGuest("guestDepositIdentityBenefit1")}</li>
                      <li>{tGuest("guestDepositIdentityBenefit2")}</li>
                      <li>{tGuest("guestDepositIdentityBenefit3")}</li>
                    </ul>
                  </div>

                  <div className="pt-2">
                    <Button
                      onClick={() => setDepositStep("identity_gate")}
                      className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white font-extrabold text-xs sm:text-sm rounded-xl shadow-md shadow-[#2AC1BC]/25 flex items-center justify-center gap-2"
                    >
                      <span>{tGuest("guestDepositIdentityMissingBtn")}</span>
                      <ArrowRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Identity Gate Form (Reusing Base Components + ImageUpload) */}
          {depositStep === "identity_gate" && (
            <form onSubmit={handleSaveIdentity} className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#2AC1BC] font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{tGuest("guestDepositIdentityGateTitle")}</span>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                  {tGuest("guestDepositIdentityGateDesc")}
                </p>
              </div>

              {identityError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{identityError}</span>
                </div>
              )}

              <div className="space-y-3">
                <TextInput
                  label={tGuest("guestDepositIdNumberLabel")}
                  required
                  maxLength={12}
                  inputMode="numeric"
                  placeholder="001202012345 (12 số)"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))}
                  className="font-mono font-bold"
                />

                <TextInput
                  label={tGuest("guestDepositFullNameLabel")}
                  required
                  placeholder="NGUYEN VAN A"
                  value={idFullName}
                  onChange={(e) => setIdFullName(e.target.value)}
                  className="font-bold uppercase"
                />

                <div className="grid grid-cols-2 gap-3">
                  <DateInput
                    label={tGuest("guestDepositDobLabel")}
                    required
                    maxDate="today"
                    value={idDob}
                    onChange={(e) => setIdDob(e.target.value)}
                  />

                  <SelectInput
                    label={tGuest("guestDepositGenderLabel")}
                    required
                    value={idGender}
                    onChange={(e) => setIdGender(e.target.value as "male" | "female")}
                    options={genderOptions}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label={tGuest("guestDepositNationalityLabel")}
                    value={idNationality}
                    onChange={(e) => setIdNationality(e.target.value)}
                  />

                  <TextInput
                    label={tGuest("guestDepositPlaceOfOriginLabel")}
                    placeholder="Hà Nội / Nam Định..."
                    value={idPlaceOfOrigin}
                    onChange={(e) => setIdPlaceOfOrigin(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <TextInput
                    label={tGuest("guestDepositPlaceOfResidenceLabel")}
                    placeholder="Nơi thường trú..."
                    value={idPlaceOfResidence}
                    onChange={(e) => setIdPlaceOfResidence(e.target.value)}
                  />

                  <DateInput
                    label={tGuest("guestDepositIssueDateLabel")}
                    maxDate="today"
                    value={idIssueDate}
                    onChange={(e) => setIdIssueDate(e.target.value)}
                  />
                </div>

                <DateInput
                  label={tGuest("guestDepositExpiryDateLabel")}
                  value={idExpiryDate}
                  onChange={(e) => setIdExpiryDate(e.target.value)}
                />

                {/* Standalone ImageUpload Component for CCCD Front & Back */}
                <div className="grid grid-cols-2 gap-3 pt-1">
                  <ImageUpload
                    label={tGuest("guestDepositCardFrontLabel")}
                    value={idCardFrontUrl}
                    onChange={setIdCardFrontUrl}
                    folder="dormio/identifications"
                    aspectRatio="card"
                  />

                  <ImageUpload
                    label={tGuest("guestDepositCardBackLabel")}
                    value={idCardBackUrl}
                    onChange={setIdCardBackUrl}
                    folder="dormio/identifications"
                    aspectRatio="card"
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={
                  isSavingIdentity ||
                  idNumber.length !== 12 ||
                  !idFullName.trim() ||
                  !idDob
                }
                className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#22a9a4] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {isSavingIdentity ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tGuest("guestDepositSavingIdentity")}</span>
                  </>
                ) : (
                  <span>{tGuest("guestDepositSaveIdBtn")} →</span>
                )}
              </Button>
            </form>
          )}

          {/* Confirm Amount Step (Reusing Base Components) */}
          {depositStep === "confirm_amount" && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5 text-emerald-800">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-black text-emerald-950">
                        {tGuest("guestDepositVerifiedNotice")} {verifiedIdData?.fullName || tenantName}
                      </span>
                    </div>
                    {verifiedIdData?.identityNumber && (
                      <span className="text-[10px] text-emerald-700 font-mono">
                        CCCD: •••• •••• {verifiedIdData.identityNumber.slice(-4)}
                      </span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black text-[10px]">
                  {tGuest("guestDepositIdentityPassedBadge")}
                </span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1.5">
                <span className="text-[10px] font-bold text-[#2AC1BC] uppercase">
                  {tGuest("guestRoomDetailSelectedRoomLabel")}
                </span>
                <h2 className="font-extrabold text-xs text-zinc-900 line-clamp-1">{post.title}</h2>
                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600">
                  {post.room?.roomNumber && (
                    <span>
                      {tGuest("guestDepositRoomPrefix")}: <strong className="text-zinc-900">{post.room.roomNumber}</strong>
                    </span>
                  )}
                  {post.room?.boardingHouseName && (
                    <span>
                      {tGuest("guestDepositBoardingHousePrefix")}: <strong className="text-zinc-900">{post.room.boardingHouseName}</strong>
                    </span>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <NumberInput
                  label={tGuest("guestDepositAmountLabel")}
                  required
                  min={100000}
                  step={50000}
                  value={depositAmountInput || Number(post.depositAmount ?? 0)}
                  onChange={(e) => setDepositAmountInput(Number(e.target.value))}
                  suffixText="VND"
                  helperText={`${tGuest("guestRoomDetailLandlordDepositLabel")} ${formatCurrency(
                    Number(post.depositAmount ?? 0),
                    currentLocale
                  )}`}
                  className="font-mono font-black text-rose-600 text-sm"
                />

                <TextInput
                  label={tGuest("guestRoomDetailTenantNameLabel")}
                  placeholder={tGuest("guestRoomDetailTenantNamePlaceholder")}
                  value={tenantName}
                  onChange={(e) => setTenantName(e.target.value)}
                  className="font-bold"
                />

                <TextInput
                  label={tGuest("guestRoomDetailTenantPhoneLabel")}
                  placeholder={tGuest("guestRoomDetailTenantPhonePlaceholder")}
                  value={tenantPhone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  error={phoneError}
                  className="font-bold"
                />

                <TextareaInput
                  label={tGuest("guestDepositNoteLabel")}
                  placeholder={tGuest("guestDepositNotePlaceholder")}
                  value={depositNote}
                  onChange={(e) => setDepositNote(e.target.value)}
                  rows={2}
                  className="resize-none text-xs"
                />
              </div>

              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-3.5 rounded-2xl text-white space-y-1.5 border border-zinc-800">
                <span className="text-[10px] font-black text-[#2AC1BC] uppercase block">
                  {tGuest("guestDepositEscrowNoticeTitle")}
                </span>
                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                  {tGuest("guestRoomDetailEscrowModalDesc")}
                </p>
              </div>

              {depositErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{depositErrorMsg}</span>
                </div>
              )}

              <Button
                onClick={handleInitiateDeposit}
                disabled={
                  isSubmittingDeposit ||
                  !(tenantName || "").trim() ||
                  !tenantPhone ||
                  !!phoneError ||
                  !isPhoneValid(tenantPhone)
                }
                className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF7B44] hover:from-[#ff5518] hover:to-[#ff6d31] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {isSubmittingDeposit ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{tGuest("guestDepositCreatingOrder")}</span>
                  </>
                ) : (
                  <>
                    <QrCode className="w-4 h-4" />
                    <span>{tGuest("guestRoomDetailConfirmQrBtn")}</span>
                  </>
                )}
              </Button>
            </div>
          )}

          {/* QR Payment Step */}
          {depositStep === "qr_payment" && depositInstruction && (
            <div className="space-y-4 text-center">

              {/* Countdown Timer Banner */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-50 border border-zinc-200/80">
                <div className="flex items-center gap-2">
                  <Clock className={`w-4 h-4 ${countdown < 120 ? "text-rose-500 animate-pulse" : "text-[#2AC1BC]"}`} />
                  <span className="text-xs font-bold text-zinc-600">
                    {tGuest("guestDepositQrCountdown")}
                  </span>
                </div>
                <span
                  className={`font-mono font-black text-sm px-2.5 py-1 rounded-lg ${countdown < 120
                      ? "bg-rose-100 text-rose-700 animate-pulse"
                      : "bg-zinc-900 text-white"
                    }`}
                >
                  {formatTimer(countdown)}
                </span>
              </div>

              {/* QR Code Container */}
              <div className="relative p-4 bg-zinc-50 border border-zinc-200 rounded-3xl inline-block max-w-xs mx-auto shadow-xs">
                <img
                  src={depositInstruction.qrCodeUrl}
                  alt="PayOS VietQR Payment Code"
                  className={`w-56 h-auto mx-auto rounded-2xl border border-zinc-100 shadow-sm transition-all duration-300 ${
                    isExpired ? "blur-md grayscale opacity-40" : ""
                  }`}
                  onError={(e) => {
                    const target = e.currentTarget;
                    const bin = depositInstruction?.bin || depositInstruction?.bankCode || "970422";
                    const acc = depositInstruction?.accountNumber;
                    if (acc) {
                      const fallbackUrl = `https://api.vietqr.io/image/${bin}-${acc}-compact2.png?amount=${depositInstruction.amount}&addInfo=${encodeURIComponent(
                        depositInstruction.transferContent || ""
                      )}&accountName=${encodeURIComponent(depositInstruction.accountName || "")}`;
                      if (target.src !== fallbackUrl) {
                        target.src = fallbackUrl;
                      }
                    }
                  }}
                />

                {/* Expired Overlay */}
                {isExpired && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-4 bg-zinc-900/80 rounded-3xl text-white space-y-3 animate-in fade-in duration-300">
                    <AlertTriangle className="w-8 h-8 text-amber-400" />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black">{tGuest("guestDepositQrExpired")}</p>
                      <p className="text-[10px] text-zinc-300">{tGuest("guestDepositQrExpiredDesc")}</p>
                    </div>
                    <Button
                      onClick={handleInitiateDeposit}
                      disabled={isSubmittingDeposit}
                      size="sm"
                      className="bg-[#2AC1BC] hover:bg-[#23a9a4] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isSubmittingDeposit ? "animate-spin" : ""}`} />
                      <span>{tGuest("guestDepositGenerateNewQr")}</span>
                    </Button>
                  </div>
                )}

                <span className="text-[10px] text-zinc-500 font-semibold mt-2 block">
                  {tGuest("guestDepositScanNotice")}
                </span>
              </div>

              {/* Bank Transfer Details Table */}
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs text-left space-y-2.5">
                {[
                  {
                    label: tGuest("guestDepositBankPartnerLabel"),
                    value: `MBBank (${depositInstruction.bankCode || "970422"})`,
                    copyKey: null,
                  },
                  {
                    label: tGuest("guestDepositAccountNumLabel"),
                    value: depositInstruction.accountNumber,
                    copyKey: "accountNumber",
                  },
                  {
                    label: tGuest("guestDepositAccountNameLabel"),
                    value: depositInstruction.accountName,
                    copyKey: null,
                  },
                  {
                    label: tGuest("guestRoomDetailTransferAmountLabel"),
                    value: formatCurrency(depositInstruction.amount, currentLocale),
                    copyKey: "amount",
                  },
                  {
                    label: tGuest("guestRoomDetailTransferContentLabel"),
                    value: depositInstruction.transferContent,
                    copyKey: "transferContent",
                  },
                ].map(({ label, value, copyKey }) => (
                  <div
                    key={label}
                    className="flex justify-between items-center pb-2 last:pb-0 border-b last:border-0 border-zinc-200/70"
                  >
                    <span className="text-zinc-500 font-bold shrink-0">{label}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span
                        className={`font-mono font-black text-zinc-900 ${copyKey === "amount" ? "text-rose-600 text-base" : ""
                          }`}
                      >
                        {value}
                      </span>
                      {copyKey && (
                        <button
                          onClick={() =>
                            handleCopy(
                              copyKey === "amount"
                                ? depositInstruction.amount.toString()
                                : (depositInstruction as any)[copyKey],
                              copyKey
                            )
                          }
                          className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors cursor-pointer shrink-0"
                          title={tGuest("guestRoomDetailCopy")}
                        >
                          {copiedField === copyKey ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Automated PayOS Verification Status Banner */}
              <div className="p-3.5 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl flex items-center justify-between text-left">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-[#2AC1BC] animate-ping" />
                  <div>
                    <p className="text-xs font-bold text-zinc-800">
                      {tGuest("guestDepositWaitingTransfer")}
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium">
                      {tGuest("guestDepositInstantReconcile")}
                    </p>
                  </div>
                </div>
                <Loader2 className="w-4 h-4 animate-spin text-[#2AC1BC] shrink-0" />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 font-semibold text-left flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>{tGuest("guestDepositTransferNotice")}</span>
              </div>

              {depositErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-semibold flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{depositErrorMsg}</span>
                </div>
              )}
            </div>
          )}

          {/* Success Step */}
          {depositStep === "success" && (
            <div className="text-center space-y-4 py-2 animate-in zoom-in-95 duration-400">
              <div className="w-16 h-16 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto border-2 border-[#2AC1BC]/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-zinc-900">
                  {tGuest("guestRoomDetailSuccessTitle")}
                </h2>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {tGuest("guestDepositSuccessDesc")}
                </p>
              </div>

              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs text-left space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 font-bold">{tGuest("guestDepositDepositIdLabel")}</span>
                  <span className="font-mono font-bold text-zinc-800 text-[11px]">
                    {depositInstruction?.depositId ?? "DEP-" + post.id.slice(0, 8)}
                  </span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 font-bold">{tGuest("guestDepositRoomNumberLabel")}</span>
                  <span className="font-extrabold text-zinc-800">
                    {post.room?.roomNumber || post.title}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">{tGuest("guestDepositAmountDeposited")}</span>
                  <span className="font-black text-rose-600 text-sm">
                    {formatCurrency(depositInstruction?.amount ?? depositAmount, currentLocale)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {post.poster && (
                  <Button
                    onClick={handleStartChat}
                    className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span>{tGuest("guestDepositChatWithLandlord")}</span>
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={() => router.push(`/rooms/${id}`)}
                  className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-xs rounded-xl transition-all"
                >
                  {tGuest("guestRoomDetailBackToList")}
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rule 10: Discard Confirmation Modal */}
      {isDiscardConfirmOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsDiscardConfirmOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-200 text-center cursor-default">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-zinc-900">
                {tGuest("guestDepositDiscardConfirmTitle")}
              </h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                {tGuest("guestDepositDiscardConfirmDesc")}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <Button
                variant="secondary"
                onClick={() => setIsDiscardConfirmOpen(false)}
                className="py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs rounded-xl"
              >
                {tGuest("guestDepositContinueEditing")}
              </Button>
              <Button
                variant="danger"
                onClick={() => {
                  setIsDiscardConfirmOpen(false);
                  router.push(`/rooms/${id}`);
                }}
                className="py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md"
              >
                {tGuest("guestDepositDiscardAndClose")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
