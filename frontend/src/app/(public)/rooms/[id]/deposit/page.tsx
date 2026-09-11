"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, ShieldCheck, Lock, Loader2, AlertCircle,
  UserCheck, QrCode, CheckCircle2, Copy, Check, Info,
  AlertTriangle, MessageSquare, CreditCard,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  postService,
  type PublicPostListing,
  type PlatformDepositInstruction,
} from "@/services/post.service";
import { userService, type UserIdentification } from "@/services/user.service";
import { getOrCreateConversation } from "@/services/message.service";

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

// ─── Step types ───────────────────────────────────────────────────────────────
const STEPS = ["identity_gate", "confirm_amount", "qr_payment", "success"] as const;
type DepositStep = "loading" | "login_required" | typeof STEPS[number];

// ─── Phone validation ─────────────────────────────────────────────────────────
const PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;
const isPhoneValid = (p: string) => PHONE_REGEX.test(p.replace(/\s/g, ""));

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function DepositPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentLocale } = useLanguage();
  const { isLoggedIn, user } = useAuth();
  const tGuest = useTranslations("guest");

  const [post, setPost] = useState<PublicPostListing | null>(null);
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);

  const [depositStep, setDepositStep] = useState<DepositStep>("loading");
  const [verifiedIdData, setVerifiedIdData] = useState<UserIdentification | null>(null);

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

  const [depositAmountInput, setDepositAmountInput] = useState<number>(0);
  const [depositNote, setDepositNote] = useState("");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [depositInstruction, setDepositInstruction] = useState<PlatformDepositInstruction | null>(null);
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositErrorMsg, setDepositErrorMsg] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  // Rule 10: discard confirmation for browser back
  const [isDiscardConfirmOpen, setIsDiscardConfirmOpen] = useState(false);

  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3500);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // ─── Load post ──────────────────────────────────────────────────────────────
  const fetchPost = useCallback(async () => {
    if (!id) return;
    setIsLoadingPost(true);
    setPostError(null);
    try {
      const data = await postService.getPublicPostById(id);
      setPost(data);
    } catch {
      setPostError(tGuest("guestRoomsErrorFetch"));
    } finally {
      setIsLoadingPost(false);
    }
  }, [id, tGuest]);

  useEffect(() => { fetchPost(); }, [fetchPost]);

  // ─── Init deposit flow ─────────────────────────────────────────────────────
  const initDepositFlow = useCallback(async (loadedPost: PublicPostListing) => {
    if (!isLoggedIn) {
      setDepositStep("login_required");
      return;
    }
    setDepositStep("loading");
    try {
      const idRes = await userService.getIdentification();
      if (idRes?.hasIdentification && idRes?.userIdentification) {
        setVerifiedIdData(idRes.userIdentification);
        setTenantName(idRes.userIdentification.fullName);
        setTenantPhone(user?.phone || "");
        setDepositAmountInput(Number(loadedPost.depositAmount ?? 0));
        setDepositStep("confirm_amount");
      } else {
        setIdFullName(user?.name || "");
        setDepositAmountInput(Number(loadedPost.depositAmount ?? 0));
        setDepositStep("identity_gate");
      }
    } catch {
      setDepositAmountInput(Number(loadedPost.depositAmount ?? 0));
      setDepositStep("identity_gate");
    }
  }, [isLoggedIn, user]);

  useEffect(() => {
    if (post && !isLoadingPost) {
      if (!post.room) { router.replace(`/rooms/${id}`); return; }
      if (post.room.status === "deposited" || post.room.status === "occupied") {
        router.replace(`/rooms/${id}`); return;
      }
      initDepositFlow(post);
    }
  }, [post, isLoadingPost, id, router, initDepositFlow]);

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
      setPhoneError("Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam (10 số, bắt đầu 03/05/07/08/09).");
    } else {
      setPhoneError("");
    }
  };

  const handleSaveIdentity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[0-9]{12}$/.test(idNumber.trim())) { setIdentityError("Số CCCD/CMND phải chứa đúng 12 chữ số."); return; }
    if (!idFullName.trim()) { setIdentityError("Vui lòng nhập họ và tên theo CCCD."); return; }
    if (!idDob) { setIdentityError("Vui lòng nhập ngày tháng năm sinh."); return; }
    setIdentityError("");
    setIsSavingIdentity(true);
    try {
      const saved = await userService.upsertIdentification({
        identityNumber: idNumber.trim(), fullName: idFullName.trim(), dateOfBirth: idDob,
        gender: idGender, nationality: idNationality.trim() || "Việt Nam",
        placeOfOrigin: idPlaceOfOrigin.trim() || undefined,
        placeOfResidence: idPlaceOfResidence.trim() || undefined,
        issueDate: idIssueDate || undefined, expiryDate: idExpiryDate || undefined,
        cardFrontUrl: idCardFrontUrl.trim() || undefined, cardBackUrl: idCardBackUrl.trim() || undefined,
      });
      setVerifiedIdData(saved);
      setTenantName(saved.fullName);
      setTenantPhone(user?.phone || "");
      setDepositStep("confirm_amount");
      setToastMessage({ type: "success", text: "Xác minh danh tính thành công!" });
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể lưu thông tin.";
      setIdentityError(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSavingIdentity(false);
    }
  };

  const handleInitiateDeposit = async () => {
    if (!post || isSubmittingDeposit) return;
    if (tenantPhone && !isPhoneValid(tenantPhone)) { setPhoneError("Số điện thoại không hợp lệ."); return; }
    setIsSubmittingDeposit(true);
    setDepositErrorMsg("");
    try {
      const instruction = await postService.initiatePlatformDeposit(post.id, {
        amount: depositAmountInput > 0 ? depositAmountInput : Number(post.depositAmount ?? 0),
        tenantName: tenantName.trim(), tenantPhone: tenantPhone.trim(),
        note: depositNote.trim() || undefined,
      });
      setDepositInstruction(instruction);
      setDepositStep("qr_payment");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Không thể khởi tạo lệnh đặt cọc.";
      setDepositErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const handleConfirmDeposit = async () => {
    if (!post || !depositInstruction || isSubmittingDeposit) return;
    setIsSubmittingDeposit(true);
    setDepositErrorMsg("");
    try {
      await postService.confirmPlatformDeposit(post.id, depositInstruction.depositId, depositInstruction.transactionRef);
      setDepositStep("success");
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || "Xác nhận chuyển khoản thất bại.";
      setDepositErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  const hasUnsavedChanges = () => {
    if (depositStep === "success") return false;
    if (depositStep === "identity_gate") return !!(idNumber || idFullName || idDob || idPlaceOfOrigin || idPlaceOfResidence);
    if (depositStep === "confirm_amount") return !!(depositNote || (tenantName && tenantName !== verifiedIdData?.fullName));
    if (depositStep === "qr_payment") return true;
    return false;
  };

  const handleBack = () => {
    if (depositStep === "success") { router.push(`/rooms/${id}`); return; }
    if (hasUnsavedChanges()) { setIsDiscardConfirmOpen(true); } else { router.push(`/rooms/${id}`); }
  };

  const handleStartChat = async () => {
    if (!post?.poster) return;
    try {
      const conv = await getOrCreateConversation(post.poster.id, `Xin chào, tôi vừa đặt cọc phòng "${post.title}". Mong được liên hệ sớm ạ!`);
      router.push(conv?.id ? `/messages?conversationId=${conv.id}` : "/messages");
    } catch {
      setToastMessage({ type: "error", text: "Không thể tạo cuộc trò chuyện." });
    }
  };

  // ─── Derived ──────────────────────────────────────────────────────────────
  const depositAmount = Number(post?.depositAmount ?? 0);
  const activeStepIndex = STEPS.indexOf(depositStep as typeof STEPS[number]);

  // ─── Render guards ─────────────────────────────────────────────────────────
  if (isLoadingPost) return <SkeletonDeposit />;

  if (postError || !post) {
    return (
      <div className="min-h-screen bg-zinc-50 flex flex-col items-center justify-center gap-4 p-8">
        <AlertCircle className="w-10 h-10 text-zinc-400" />
        <p className="text-zinc-600 font-semibold text-sm">{postError ?? tGuest("guestRoomsEmptyTitle")}</p>
        <Link href={`/rooms/${id}`}>
          <button className="px-5 py-2.5 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer">
            {tGuest("guestRoomDetailBackToList")}
          </button>
        </Link>
      </div>
    );
  }

  const stepLabels: Record<typeof STEPS[number], string> = {
    identity_gate: "Xác minh danh tính",
    confirm_amount: "Xác nhận cọc",
    qr_payment: "Quét VietQR",
    success: "Hoàn tất",
  };

  return (
    <div className="min-h-screen bg-zinc-50 animate-in fade-in duration-500 pb-20">
      <div className="mx-auto max-w-lg px-4 py-6 sm:px-6 w-full space-y-5">

        {/* Top Nav */}
        <div className="flex items-center justify-between">
          <button onClick={handleBack} className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] transition-colors cursor-pointer">
            <ArrowLeft className="h-4 w-4" />
            {tGuest("guestRoomDetailBackToList")}
          </button>
          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Dormio Escrow</span>
        </div>

        {/* Post Summary */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm p-4 flex items-start gap-3">
          {post.images?.[0] ? (
            <img src={post.images[0].url} alt={post.title} className="w-16 h-16 rounded-xl object-cover border border-zinc-100 shrink-0" />
          ) : (
            <div className="w-16 h-16 rounded-xl bg-zinc-100 flex items-center justify-center shrink-0">
              <CreditCard className="w-6 h-6 text-zinc-400" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-extrabold text-zinc-900 line-clamp-1">{post.title}</p>
            {post.room && (
              <p className="text-[11px] text-zinc-500 font-semibold mt-0.5">
                Phòng {post.room.roomNumber} · {post.room.boardingHouseName}
              </p>
            )}
            <p className="text-sm font-black text-rose-500 mt-1">
              {formatCurrency(depositAmount, currentLocale)}
              <span className="text-xs text-zinc-400 font-normal"> /tháng</span>
            </p>
          </div>
        </div>

        {/* Step Progress Bar */}
        {activeStepIndex >= 0 && (
          <div className="flex items-center">
            {STEPS.map((s, i) => {
              const done = i < activeStepIndex;
              const active = i === activeStepIndex;
              return (
                <React.Fragment key={s}>
                  <div className="flex flex-col items-center gap-1">
                    <span className={`w-6 h-6 rounded-full text-[10px] font-black inline-flex items-center justify-center transition-colors ${done ? "bg-[#2AC1BC] text-white" : active ? "bg-zinc-900 text-white" : "bg-zinc-200 text-zinc-400"}`}>
                      {done ? <Check className="w-3 h-3" /> : i + 1}
                    </span>
                    <span className={`text-[9px] font-bold text-center leading-tight w-14 ${i <= activeStepIndex ? "text-zinc-700" : "text-zinc-300"}`}>
                      {stepLabels[s]}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div className={`h-px flex-1 mb-4 mx-1 transition-colors ${i < activeStepIndex ? "bg-[#2AC1BC]" : "bg-zinc-200"}`} />
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
              <span className="text-[10px] font-bold text-[#2AC1BC] uppercase tracking-wider block">Dormio Escrow 100% Protected</span>
            </div>
          </div>

          {/* Loading */}
          {depositStep === "loading" && (
            <div className="py-12 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC] mx-auto" />
              <p className="text-xs font-bold text-zinc-600">Đang kiểm tra hồ sơ định danh công dân...</p>
            </div>
          )}

          {/* Login Required */}
          {depositStep === "login_required" && (
            <div className="py-6 text-center space-y-4">
              <div className="w-14 h-14 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto border border-amber-200">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h2 className="text-sm font-extrabold text-zinc-900">Yêu cầu đăng nhập</h2>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">{tGuest("guestDepositLoginRequired")}</p>
              </div>
              <button onClick={() => router.push(`/login?redirect=/rooms/${id}/deposit`)} className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer">
                {tGuest("guestDepositLoginBtn")} →
              </button>
            </div>
          )}

          {/* Identity Gate */}
          {depositStep === "identity_gate" && (
            <form onSubmit={handleSaveIdentity} className="space-y-4">
              <div className="p-4 bg-gradient-to-br from-zinc-900 to-zinc-950 text-white rounded-2xl border border-zinc-800 space-y-1.5">
                <div className="flex items-center gap-1.5 text-[#2AC1BC] font-extrabold text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>{tGuest("guestDepositIdentityGateTitle")}</span>
                </div>
                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">{tGuest("guestDepositIdentityGateDesc")}</p>
              </div>
              {identityError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{identityError}</span>
                </div>
              )}
              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositIdNumberLabel")}</label>
                  <input type="text" inputMode="numeric" maxLength={12} placeholder="001202012345 (12 số)" value={idNumber} onChange={(e) => setIdNumber(e.target.value.replace(/\D/g, ""))} className="w-full px-3.5 py-2.5 font-mono font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" required />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositFullNameLabel")}</label>
                  <input type="text" placeholder="NGUYEN VAN A" value={idFullName} onChange={(e) => setIdFullName(e.target.value)} className="w-full px-3.5 py-2.5 font-bold uppercase border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositDobLabel")}</label>
                    <input type="date" value={idDob} onChange={(e) => setIdDob(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" required />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositGenderLabel")}</label>
                    <select value={idGender} onChange={(e) => setIdGender(e.target.value as "male" | "female")} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] bg-white">
                      <option value="male">{tGuest("guestDepositGenderMale")}</option>
                      <option value="female">{tGuest("guestDepositGenderFemale")}</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositNationalityLabel")}</label>
                    <input type="text" value={idNationality} onChange={(e) => setIdNationality(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositPlaceOfOriginLabel")}</label>
                    <input type="text" placeholder="Hà Nội / Nam Định..." value={idPlaceOfOrigin} onChange={(e) => setIdPlaceOfOrigin(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositPlaceOfResidenceLabel")}</label>
                    <input type="text" placeholder="Nơi thường trú..." value={idPlaceOfResidence} onChange={(e) => setIdPlaceOfResidence(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositIssueDateLabel")}</label>
                    <input type="date" value={idIssueDate} onChange={(e) => setIdIssueDate(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositExpiryDateLabel")}</label>
                    <input type="date" value={idExpiryDate} onChange={(e) => setIdExpiryDate(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                  </div>
                  <div>
                    <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositCardFrontLabel")}</label>
                    <input type="url" placeholder="https://..." value={idCardFrontUrl} onChange={(e) => setIdCardFrontUrl(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                  </div>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 block mb-1">{tGuest("guestDepositCardBackLabel")}</label>
                  <input type="url" placeholder="https://..." value={idCardBackUrl} onChange={(e) => setIdCardBackUrl(e.target.value)} className="w-full px-3.5 py-2.5 font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                </div>
              </div>
              <button type="submit" disabled={isSavingIdentity || idNumber.length !== 12 || !idFullName.trim() || !idDob} className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2">
                {isSavingIdentity ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang lưu thông tin...</span></> : <span>{tGuest("guestDepositSaveIdBtn")} →</span>}
              </button>
            </form>
          )}

          {/* Confirm Amount */}
          {depositStep === "confirm_amount" && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200/80 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-black block">{tGuest("guestDepositVerifiedNotice")} {verifiedIdData?.fullName || tenantName}</span>
                    {verifiedIdData?.identityNumber && (
                      <span className="text-[10px] text-emerald-600 font-mono">CCCD: •••• •••• {verifiedIdData.identityNumber.slice(-4)}</span>
                    )}
                  </div>
                </div>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full font-black text-[10px]">ĐÃ XÁC THỰC</span>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1.5">
                <span className="text-[10px] font-bold text-[#2AC1BC] uppercase">{tGuest("guestRoomDetailSelectedRoomLabel")}</span>
                <h2 className="font-extrabold text-xs text-zinc-900 line-clamp-1">{post.title}</h2>
                <div className="flex items-center gap-4 text-xs font-semibold text-zinc-600">
                  {post.room?.roomNumber && <span>Phòng: <strong className="text-zinc-900">{post.room.roomNumber}</strong></span>}
                  {post.room?.boardingHouseName && <span>Nhà trọ: <strong className="text-zinc-900">{post.room.boardingHouseName}</strong></span>}
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="font-bold text-zinc-700 uppercase block mb-1">Số tiền đặt cọc giữ chỗ (VND) *</label>
                  <input type="number" min={100000} step={50000} value={depositAmountInput || Number(post.depositAmount ?? 0)} onChange={(e) => setDepositAmountInput(Number(e.target.value))} className="w-full px-4 py-2.5 font-mono font-black text-rose-600 text-sm border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" required />
                  <span className="text-[10px] text-zinc-400 mt-1 block">{tGuest("guestRoomDetailLandlordDepositLabel")} <strong className="text-zinc-700">{formatCurrency(Number(post.depositAmount ?? 0), currentLocale)}</strong></span>
                </div>
                <div>
                  <label className="font-bold text-zinc-700 uppercase block mb-1">{tGuest("guestRoomDetailTenantNameLabel")}</label>
                  <input type="text" placeholder={tGuest("guestRoomDetailTenantNamePlaceholder")} value={tenantName} onChange={(e) => setTenantName(e.target.value)} className="w-full px-4 py-2.5 font-bold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]" />
                </div>
                <div>
                  <label className="font-bold text-zinc-700 uppercase block mb-1">{tGuest("guestRoomDetailTenantPhoneLabel")}</label>
                  <input type="tel" maxLength={11} placeholder={tGuest("guestRoomDetailTenantPhonePlaceholder")} value={tenantPhone} onChange={handlePhoneChange} onBlur={handlePhoneBlur}
                    className={`w-full px-4 py-2.5 font-bold border rounded-xl focus:outline-none transition-colors ${phoneError ? "border-rose-400 bg-rose-50" : tenantPhone && isPhoneValid(tenantPhone) ? "border-emerald-400 bg-emerald-50" : "border-zinc-200 focus:border-[#2AC1BC]"}`} />
                  {phoneError && <p className="mt-1 text-[11px] text-rose-500 font-semibold flex items-center gap-1"><AlertCircle className="w-3.5 h-3.5 shrink-0" /><span>{phoneError}</span></p>}
                </div>
                <div>
                  <label className="font-bold text-zinc-700 uppercase block mb-1">{tGuest("guestDepositNoteLabel")}</label>
                  <textarea rows={2} placeholder={tGuest("guestDepositNotePlaceholder")} value={depositNote} onChange={(e) => setDepositNote(e.target.value)} className="w-full px-3.5 py-2 font-medium border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC] text-xs resize-none" />
                </div>
              </div>

              <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-3.5 rounded-2xl text-white space-y-1.5 border border-zinc-800">
                <span className="text-[10px] font-black text-[#2AC1BC] uppercase block">{tGuest("guestRoomsEscrowTitle")}</span>
                <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">{tGuest("guestRoomDetailEscrowModalDesc")}</p>
              </div>

              {depositErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-xs font-semibold rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{depositErrorMsg}</span>
                </div>
              )}

              <button onClick={handleInitiateDeposit} disabled={isSubmittingDeposit || !tenantName.trim() || !tenantPhone || !!phoneError || !isPhoneValid(tenantPhone)}
                className="w-full py-3.5 bg-gradient-to-r from-[#FF6B35] to-[#FF7B44] hover:from-[#ff5518] hover:to-[#ff6d31] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2 mt-2">
                {isSubmittingDeposit ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang tạo lệnh chuyển khoản...</span></> : <><QrCode className="w-4 h-4" /><span>{tGuest("guestRoomDetailConfirmQrBtn")}</span></>}
              </button>
            </div>
          )}

          {/* QR Payment */}
          {depositStep === "qr_payment" && depositInstruction && (
            <div className="space-y-4 text-center">
              <div className="p-3.5 bg-zinc-50 border border-zinc-200 rounded-3xl inline-block max-w-xs mx-auto shadow-xs">
                <img src={depositInstruction.qrCodeUrl} alt="VietQR Payment Code" className="w-56 h-auto mx-auto rounded-2xl border border-zinc-100 shadow-sm" />
                <span className="text-[10px] text-zinc-500 font-semibold mt-2 block">{tGuest("guestDepositScanNotice")}</span>
              </div>

              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-200 text-xs text-left space-y-2.5">
                {([
                  { label: tGuest("guestDepositBankPartnerLabel"), value: `MBBank (${depositInstruction.bankCode})`, copyKey: null as string | null },
                  { label: tGuest("guestDepositAccountNumLabel"), value: depositInstruction.accountNumber, copyKey: "accountNumber" as string | null },
                  { label: tGuest("guestDepositAccountNameLabel"), value: depositInstruction.accountName, copyKey: null as string | null },
                  { label: tGuest("guestRoomDetailTransferAmountLabel"), value: formatCurrency(depositInstruction.amount, currentLocale), copyKey: "amount" as string | null },
                  { label: tGuest("guestRoomDetailTransferContentLabel"), value: depositInstruction.transferContent, copyKey: "transferContent" as string | null },
                ]).map(({ label, value, copyKey }) => (
                  <div key={label} className="flex justify-between items-center pb-2 last:pb-0 border-b last:border-0 border-zinc-200/70">
                    <span className="text-zinc-500 font-bold shrink-0">{label}</span>
                    <div className="flex items-center gap-2 ml-2">
                      <span className={`font-mono font-black text-zinc-900 ${copyKey === "amount" ? "text-rose-600 text-base" : ""}`}>{value}</span>
                      {copyKey && (
                        <button onClick={() => handleCopy(copyKey === "amount" ? depositInstruction.amount.toString() : (depositInstruction as any)[copyKey], copyKey)} className="p-1 hover:bg-zinc-200 rounded-lg text-zinc-600 transition-colors cursor-pointer shrink-0">
                          {copiedField === copyKey ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-[11px] text-amber-800 font-semibold text-left flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <span>Vui lòng nhập <strong>chính xác nội dung chuyển khoản</strong> để hệ thống tự động ghi nhận phiếu cọc và kích hoạt bảo chứng Dormio Escrow.</span>
              </div>

              {depositErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-semibold flex items-start gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" /><span>{depositErrorMsg}</span>
                </div>
              )}

              <button onClick={handleConfirmDeposit} disabled={isSubmittingDeposit} className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#22a9a4] disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2">
                {isSubmittingDeposit ? <><Loader2 className="w-4 h-4 animate-spin" /><span>Đang kiểm tra thanh toán...</span></> : <><CheckCircle2 className="w-4 h-4" /><span>{tGuest("guestRoomDetailConfirmTransferBtn")}</span></>}
              </button>
            </div>
          )}

          {/* Success */}
          {depositStep === "success" && (
            <div className="text-center space-y-4 py-2">
              <div className="w-16 h-16 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto border-2 border-[#2AC1BC]/20">
                <CheckCircle2 className="w-9 h-9" />
              </div>
              <div className="space-y-1">
                <h2 className="text-base font-black text-zinc-900">{tGuest("guestRoomDetailSuccessTitle")}</h2>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                  {tGuest("guestRoomDetailSuccessDesc", { name: post.poster?.username ?? tGuest("guestRoomsDefaultLandlord") })}
                </p>
              </div>
              <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 text-xs text-left space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 font-bold">{tGuest("guestDepositDepositIdLabel")}</span>
                  <span className="font-mono font-bold text-zinc-800 text-[11px]">{depositInstruction?.depositId ?? "DEP-" + post.id.slice(0, 8)}</span>
                </div>
                <div className="flex justify-between items-center pb-1.5 border-b border-zinc-200">
                  <span className="text-zinc-500 font-bold">{tGuest("guestDepositRoomNumberLabel")}</span>
                  <span className="font-extrabold text-zinc-800">{post.room?.roomNumber || post.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 font-bold">Số tiền đã cọc:</span>
                  <span className="font-black text-rose-600 text-sm">{formatCurrency(depositInstruction?.amount ?? depositAmount, currentLocale)}</span>
                </div>
              </div>
              <div className="space-y-2 pt-2">
                {post.poster && (
                  <button onClick={handleStartChat} className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" /><span>{tGuest("guestDepositChatWithLandlord")}</span>
                  </button>
                )}
                <button onClick={() => router.push(`/rooms/${id}`)} className="w-full py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 font-extrabold text-xs rounded-xl transition-all cursor-pointer">
                  {tGuest("guestRoomDetailCloseModal")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rule 10: Discard Confirmation */}
      {isDiscardConfirmOpen && (
        <div onClick={(e) => { if (e.target === e.currentTarget) setIsDiscardConfirmOpen(false); }} className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-200 text-center cursor-default">
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto"><AlertTriangle className="w-6 h-6" /></div>
            <div className="space-y-1">
              <h3 className="text-sm font-black text-zinc-900">{tGuest("guestDepositDiscardConfirmTitle")}</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">{tGuest("guestDepositDiscardConfirmDesc")}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setIsDiscardConfirmOpen(false)} className="py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs rounded-xl cursor-pointer">{tGuest("guestDepositContinueEditing")}</button>
              <button onClick={() => { setIsDiscardConfirmOpen(false); router.push(`/rooms/${id}`); }} className="py-2.5 bg-rose-500 hover:bg-rose-600 text-white font-extrabold text-xs rounded-xl shadow-md cursor-pointer">{tGuest("guestDepositDiscardAndClose")}</button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${toastMessage.type === "error" ? "bg-rose-500 text-white border-rose-400" : "bg-zinc-900/95 text-white border-zinc-700"}`}>
            {toastMessage.type === "success" ? <CheckCircle2 className="w-4 h-4 text-[#2AC1BC] shrink-0" /> : toastMessage.type === "error" ? <AlertCircle className="w-4 h-4 text-white shrink-0" /> : <Info className="w-4 h-4 text-[#2AC1BC] shrink-0" />}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}
    </div>
  );
}