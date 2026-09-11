"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft, MapPin, Minimize2,
  Phone, QrCode, CheckCircle2, AlertCircle, Info, X, Sparkles, Lock, Calculator,
  Heart, Share2, Copy, Check, ExternalLink, User, Building2,
  ChevronLeft, ChevronRight, ImageIcon, MessageSquare, Loader2,
} from "lucide-react";
import { formatCurrency } from "@/utils";
import { useTranslations, useLanguage } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  postService,
  type PublicPostListing,
} from "@/services/post.service";
import { getOrCreateConversation } from "@/services/message.service";

const DEFAULT_ROOM_IMAGE = "/house-placeholder.jpg";

// ─── Helper: build full address string from structured fields ─────────────────
function buildAddressString(listing: PublicPostListing): string {
  const addr = listing.address;
  if (!addr) return listing.room?.boardingHouseName ?? "";
  const parts = [addr.houseNumber, addr.street, addr.ward, addr.district, addr.province].filter(Boolean);
  return parts.join(", ");
}

// ─── Image Gallery Component ──────────────────────────────────────────────────
function ImageGallery({ images, title }: { images: { id: string; url: string }[]; title: string }) {
  const [activeIdx, setActiveIdx] = useState(0);

  const allImages = images.length > 0 ? images : [{ id: "placeholder", url: DEFAULT_ROOM_IMAGE }];
  const mainImg = allImages[activeIdx] ?? allImages[0];

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-zinc-200 aspect-video bg-zinc-100 relative group">
        <img
          src={mainImg.url}
          alt={title}
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_ROOM_IMAGE; }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-4 left-4 px-3 py-1 bg-[#2AC1BC] text-white text-xs font-black rounded-full shadow-md">
          {activeIdx + 1} / {allImages.length}
        </span>
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx((i) => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md disabled:opacity-30 cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-zinc-800" />
            </button>
            <button
              onClick={() => setActiveIdx((i) => Math.min(allImages.length - 1, i + 1))}
              disabled={activeIdx === allImages.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-white/80 hover:bg-white rounded-full shadow-md disabled:opacity-30 cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4 text-zinc-800" />
            </button>
          </>
        )}
      </div>
      {/* Thumbnail strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, idx) => (
            <button
              key={img.id}
              onClick={() => setActiveIdx(idx)}
              className={`shrink-0 w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                idx === activeIdx ? "border-[#2AC1BC] shadow-md" : "border-zinc-200 hover:border-zinc-400"
              }`}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_ROOM_IMAGE; }}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="flex flex-col min-h-screen bg-white pb-20 animate-pulse">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="h-6 w-32 bg-zinc-200 rounded" />
        <div className="h-48 bg-zinc-200 rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-96 bg-zinc-200 rounded-3xl" />
            <div className="h-4 bg-zinc-200 rounded w-3/4" />
            <div className="h-4 bg-zinc-200 rounded w-1/2" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-zinc-200 rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoomDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { currentLocale } = useLanguage();
  const { isLoggedIn, user } = useAuth();
  const tGuest = useTranslations("guest");

  // Data state
  const [post, setPost] = useState<PublicPostListing | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [depositStep, setDepositStep] = useState<"form" | "qr" | "success">("form");
  const [tenantName, setTenantName] = useState("");
  const [tenantPhone, setTenantPhone] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [isSubmittingDeposit, setIsSubmittingDeposit] = useState(false);
  const [depositErrorMsg, setDepositErrorMsg] = useState("");
  const [isSaved, setIsSaved] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    type: "success" | "error" | "info";
    text: string;
  } | null>(null);

  // Auto-dismiss toast notification
  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  // Utility Calculator State
  const [peopleCount, setPeopleCount] = useState(1);
  const [electricityKwh, setElectricityKwh] = useState(0);
  const [waterM3, setWaterM3] = useState(0);
  const [isCalcOpen, setIsCalcOpen] = useState(false);

  // Load bookmark status for authenticated user
  useEffect(() => {
    if (!id || !isLoggedIn) {
      setIsSaved(false);
      return;
    }
    let isMounted = true;
    postService
      .isPostSaved(id)
      .then((saved) => {
        if (isMounted) setIsSaved(saved);
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [id, isLoggedIn]);

  // Fetch post data
  const fetchPost = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await postService.getPublicPostById(id);
      setPost(data);
    } catch {
      setError(tGuest("guestRoomsErrorFetch"));
    } finally {
      setIsLoading(false);
    }
  }, [id, tGuest]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleStartChat = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/rooms/${id}`);
      return;
    }
    if (!post?.poster) return;

    if (user?.id === post.poster.id) {
      setToastMessage({
        type: "error",
        text: tGuest("guestRoomDetailCannotMessageSelf"),
      });
      return;
    }

    try {
      setIsStartingChat(true);
      const initialMessage = `Xin chào, tôi quan tâm đến bài đăng "${post.title}". Phòng này còn trống không ạ?`;
      const conv = await getOrCreateConversation(post.poster.id, initialMessage);
      const convId = conv?.id;
      if (convId) {
        router.push(`/messages?conversationId=${convId}`);
      } else {
        router.push("/messages");
      }
    } catch (err: any) {
      const errMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Không thể tạo cuộc trò chuyện";
      setToastMessage({
        type: "error",
        text: errMsg,
      });
    } finally {
      setIsStartingChat(false);
    }
  };

  const handleToggleSave = async () => {
    if (!isLoggedIn) {
      setToastMessage({
        type: "info",
        text: tGuest("guestRoomDetailSaveLoginRequired"),
      });
      setTimeout(() => {
        router.push("/login");
      }, 1500);
      return;
    }
    if (!post) return;

    const nextSaved = !isSaved;
    setIsSaved(nextSaved);
    // Optimistic saved count update
    setPost((prev) =>
      prev
        ? {
            ...prev,
            savedCount: Math.max(0, prev.savedCount + (nextSaved ? 1 : -1)),
          }
        : null
    );

    try {
      const res = nextSaved
        ? await postService.savePost(post.id)
        : await postService.unsavePost(post.id);
      setPost((prev) =>
        prev ? { ...prev, savedCount: res.savedCount } : null
      );
      setToastMessage({
        type: "success",
        text: nextSaved
          ? tGuest("guestRoomDetailSaveSuccess")
          : tGuest("guestRoomDetailUnsaveSuccess"),
      });
    } catch (err: any) {
      // Revert optimistic update
      setIsSaved(!nextSaved);
      setPost((prev) =>
        prev
          ? {
              ...prev,
              savedCount: Math.max(0, prev.savedCount + (nextSaved ? -1 : 1)),
            }
          : null
      );
      const isAuthError =
        err?.message?.includes("401") ||
        err?.message?.includes("expired") ||
        err?.message?.includes("log in");
      if (isAuthError) {
        setToastMessage({
          type: "info",
          text: tGuest("guestRoomDetailSessionExpired"),
        });
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        setToastMessage({
          type: "error",
          text: err?.message || tGuest("guestRoomDetailSaveError"),
        });
      }
    }
  };

  // Vietnamese mobile phone validation: 10 digits starting with 03x/05x/07x/08x/09x
  const PHONE_REGEX = /^(03|05|07|08|09)[0-9]{8}$/;
  const isPhoneValid = (phone: string) => PHONE_REGEX.test(phone.replace(/\s/g, ""));

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTenantPhone(val);
    // Clear error while user is still typing (only show error once they've entered ≥ 3 chars)
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

  const handleConfirmDeposit = async () => {
    if (!post || isSubmittingDeposit) return;
    setIsSubmittingDeposit(true);
    setDepositErrorMsg("");
    try {
      await postService.submitPlatformDeposit(post.id, {
        tenantName: tenantName.trim(),
        tenantPhone: tenantPhone.trim(),
      });
      setDepositStep("success");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message ||
        err?.message ||
        "Đặt cọc thất bại. Vui lòng thử lại sau.";
      setDepositErrorMsg(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setIsSubmittingDeposit(false);
    }
  };

  // Utility Cost Calculator Math (defaults use 3800/kWh, 25000/m³, 150000 service/person)
  const electricityRate = 3800;
  const waterRate = 25000;
  const serviceFee = 150000;
  const depositAmount = Number(post?.depositAmount ?? 0);
  const totalElectricityCost = electricityKwh * electricityRate;
  const totalWaterCost = waterM3 * waterRate;
  const totalServiceCost = peopleCount * serviceFee;
  const totalEstimatedMonthly = depositAmount + totalElectricityCost + totalWaterCost + totalServiceCost;

  if (isLoading) return <SkeletonDetail />;

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-white items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-zinc-100 flex items-center justify-center mx-auto">
          <ImageIcon className="w-8 h-8 text-zinc-400" />
        </div>
        <h2 className="font-extrabold text-zinc-900 text-xl">
          {error ?? tGuest("guestRoomsEmptyTitle")}
        </h2>
        <Link href="/rooms">
          <button className="px-5 py-2.5 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer">
            {tGuest("guestRoomDetailBackToList")}
          </button>
        </Link>
      </div>
    );
  }

  const address = buildAddressString(post);
  const posterInitial = post.poster?.username?.charAt(0)?.toUpperCase() ?? "P";

  return (
    <div className="flex flex-col min-h-screen bg-white animate-in fade-in duration-500 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full space-y-6">

        {/* Top Header Trail & Action Bar */}
        <div className="flex items-center justify-between border-b border-zinc-100 pb-4">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-500 hover:text-[#2AC1BC] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {tGuest("guestRoomDetailBackToList")}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isSaved ? "bg-rose-500 text-white" : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? "fill-white" : ""}`} />
              {isSaved ? tGuest("guestRoomDetailSaved") : tGuest("guestRoomDetailSave")}
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="px-3.5 py-1.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#2AC1BC]" /> {tGuest("guestRoomDetailShare")}
            </button>
          </div>
        </div>

        {/* Room Title Header Block */}
        <div className="space-y-3 bg-zinc-50/80 p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {post.room?.roomTypeName && (
              <span className="px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-extrabold rounded-full">
                {post.room.roomTypeName}
              </span>
            )}
            <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-full border border-amber-200">
              {tGuest("guestRoomDetailVerifiedBadge")}
            </span>
            {post.room?.boardingHouseName && (
              <span className="px-3 py-1 bg-zinc-200/80 text-zinc-700 text-xs font-extrabold rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {post.room.boardingHouseName}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-zinc-900 leading-snug">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-zinc-200/60 text-xs font-semibold text-zinc-500">
            {address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-zinc-800 font-bold hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors group"
                title={tGuest("guestContactMaps")}
              >
                <MapPin className="h-4 w-4 text-[#2AC1BC]" />
                <span>{address}</span>
                <ExternalLink className="w-3 h-3 text-zinc-400 group-hover:text-[#2AC1BC]" />
              </a>
            ) : (
              <span className="text-zinc-400 italic">{tGuest("guestRoomsDefaultLandlord")}</span>
            )}

            {post.room?.area && (
              <div className="flex items-center gap-1 text-zinc-700">
                <Minimize2 className="h-4 w-4 text-zinc-400" />
                <span>{tGuest("guestRoomDetailAreaLabel")}: <strong>{post.room.area} m²</strong></span>
              </div>
            )}

            {post.room?.floor && (
              <span className="text-zinc-600 font-bold">
                {tGuest("guestRoomDetailAreaLabel") === "Diện tích" ? "Tầng" : "Floor"}: {post.room.floor}
              </span>
            )}
          </div>
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start pt-2">

          {/* Left Main Content */}
          <div className="lg:col-span-8 space-y-8">

            {/* Image Gallery */}
            <ImageGallery images={post.images} title={post.title} />

            {/* 1. Description Section */}
            <div className="space-y-3">
              <h2 className="text-xl font-extrabold text-zinc-900">{tGuest("guestRoomDetailDescTitle")}</h2>
              <div className="text-zinc-600 leading-relaxed whitespace-pre-line text-xs font-medium bg-zinc-50 p-6 rounded-3xl border border-zinc-200/80">
                {post.content || tGuest("guestRoomsEmptyDesc")}
              </div>
            </div>

            {/* 2. Room details chips */}
            {post.room && (
              <div className="space-y-4">
                <h2 className="text-xl font-extrabold text-zinc-900">{tGuest("guestRoomDetailFacilitiesTitle")}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {post.room.roomTypeName && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-white border border-zinc-200/80 rounded-2xl text-xs font-bold text-zinc-800 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{post.room.roomTypeName}</span>
                    </div>
                  )}
                  {post.room.area && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-white border border-zinc-200/80 rounded-2xl text-xs font-bold text-zinc-800 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{post.room.area} m²</span>
                    </div>
                  )}
                  {post.room.floor && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-white border border-zinc-200/80 rounded-2xl text-xs font-bold text-zinc-800 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>Floor {post.room.floor}</span>
                    </div>
                  )}
                  {post.room.boardingHouseName && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-white border border-zinc-200/80 rounded-2xl text-xs font-bold text-zinc-800 shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{post.room.boardingHouseName}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 3. Escrow Deposit Process Guarantee Box */}
            <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 p-6 rounded-3xl text-white space-y-4 shadow-xl border border-zinc-800">
              <span className="text-xs font-black text-[#2AC1BC] uppercase tracking-wider block">
                {tGuest("guestRoomDetailEscrowTitle")}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#2AC1BC] text-white font-black text-xs inline-flex items-center justify-center">1</span>
                  <h4 className="font-extrabold text-xs text-white">{tGuest("guestRoomDetailEscrowStep1Title")}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{tGuest("guestRoomDetailEscrowStep1Desc")}</p>
                </div>

                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-zinc-900 font-black text-xs inline-flex items-center justify-center">2</span>
                  <h4 className="font-extrabold text-xs text-white">{tGuest("guestRoomDetailEscrowStep2Title")}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{tGuest("guestRoomDetailEscrowStep2Desc")}</p>
                </div>

                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-zinc-900 font-black text-xs inline-flex items-center justify-center">3</span>
                  <h4 className="font-extrabold text-xs text-white">{tGuest("guestRoomDetailEscrowStep3Title")}</h4>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{tGuest("guestRoomDetailEscrowStep3Desc")}</p>
                </div>
              </div>
            </div>

            {/* 4. Interactive Rent & Utility Calculator Card Widget */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl text-zinc-900 shadow-md border border-zinc-200/80 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 pb-4">
                <div>
                  <h3 className="text-lg font-black text-zinc-900 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#2AC1BC]" /> {tGuest("guestRoomDetailCalcTitle")}
                  </h3>
                  <p className="text-xs text-zinc-500 font-medium mt-0.5">
                    {tGuest("guestRoomDetailCalcSub")}
                  </p>
                </div>
                <button
                  onClick={() => setIsCalcOpen(!isCalcOpen)}
                  className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer hover:bg-[#22a9a4] transition-colors shrink-0"
                >
                  {isCalcOpen ? tGuest("guestRoomDetailCalcClose") : tGuest("guestRoomDetailCalcOpen")}
                </button>
              </div>

              {isCalcOpen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{tGuest("guestRoomDetailPeopleCountLabel")}</span>
                      <span className="text-[#2AC1BC] font-black">{peopleCount} {tGuest("guestRoomDetailPeopleUnit")}</span>
                    </div>
                    <input
                      type="range" min="1" max="4" value={peopleCount}
                      onChange={(e) => setPeopleCount(Number(e.target.value))}
                      className="w-full accent-[#2AC1BC] cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 block">
                      {tGuest("guestRoomDetailServiceNote")} {formatCurrency(totalServiceCost, currentLocale)}
                    </span>
                  </div>

                  <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{tGuest("guestRoomDetailElectricityLabel")}</span>
                      <span className="text-amber-600 font-black">{electricityKwh} kWh</span>
                    </div>
                    <input
                      type="range" min="0" max="300" step="10" value={electricityKwh}
                      onChange={(e) => setElectricityKwh(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 block">
                      {tGuest("guestRoomDetailElectricityNote")} ({formatCurrency(totalElectricityCost, currentLocale)})
                    </span>
                  </div>

                  <div className="space-y-2 bg-zinc-50 p-4 rounded-2xl border border-zinc-200">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-zinc-500">{tGuest("guestRoomDetailWaterLabel")}</span>
                      <span className="text-cyan-600 font-black">{waterM3} m³</span>
                    </div>
                    <input
                      type="range" min="0" max="20" value={waterM3}
                      onChange={(e) => setWaterM3(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-400 block">
                      {tGuest("guestRoomDetailWaterNote")} ({formatCurrency(totalWaterCost, currentLocale)})
                    </span>
                  </div>
                </div>
              )}

              {/* Total Summary Breakdown Box */}
              <div className="p-5 bg-zinc-900 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-400 font-semibold block">{tGuest("guestRoomDetailTotalCalcTitle")}</span>
                  <span className="text-3xl font-black text-rose-500">{formatCurrency(totalEstimatedMonthly, currentLocale)}</span>
                </div>
                <div className="text-xs text-zinc-400 font-medium space-y-0.5">
                  <div>• {tGuest("guestRoomDetailRentPart")} <strong className="text-white">{formatCurrency(depositAmount, currentLocale)}</strong></div>
                  <div>• {tGuest("guestRoomDetailUtilPart")} <strong className="text-[#2AC1BC]">{formatCurrency(totalElectricityCost + totalWaterCost + totalServiceCost, currentLocale)}</strong></div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Sidebar Card: Booking & Poster Info */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">

            {/* Price & Deposit Action Box */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200/80 shadow-xl space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
                  {tGuest("guestRoomDetailListedPriceLabel")}
                </span>
                <div className="text-3xl font-black text-rose-500">
                  {formatCurrency(depositAmount, currentLocale)}{" "}
                  <span className="text-xs text-zinc-400 font-normal">{tGuest("guestRoomDetailMonth")}</span>
                </div>
                {depositAmount > 0 && (
                  <div className="p-3 bg-rose-50 rounded-2xl border border-rose-100 text-xs text-rose-700 font-bold mt-2">
                    {tGuest("guestRoomDetailDepositLabel")} {formatCurrency(depositAmount, currentLocale)}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                <button
                  onClick={() => { setIsDepositModalOpen(true); setDepositStep("form"); }}
                  className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF7B44] hover:from-[#ff5518] hover:to-[#ff6d31] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#FF6B35]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" /> {tGuest("guestRoomDetailDepositBtn")}
                </button>

                {post.poster && (
                  <button
                    onClick={handleStartChat}
                    disabled={isStartingChat}
                    className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#23A9A4] text-white font-extrabold text-xs rounded-2xl shadow-md shadow-[#2AC1BC]/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {isStartingChat ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <MessageSquare className="w-4 h-4" />
                    )}
                    {tGuest("guestRoomDetailChatBtn")}
                  </button>
                )}

                {post.poster && (
                  <button
                    onClick={() => alert(tGuest("guestRoomDetailCallBtn"))}
                    className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-800 font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-[#2AC1BC]" /> {tGuest("guestRoomDetailCallBtn")}
                  </button>
                )}
              </div>

              {/* Poster Profile Card */}
              {post.poster && (
                <div className="pt-6 border-t border-zinc-100 space-y-3">
                  <span className="text-xs font-extrabold text-zinc-400 uppercase tracking-wider block">
                    {tGuest("guestRoomDetailLandlordTitle")}
                  </span>
                  <Link
                    href={`/landlords/${post.poster.id}`}
                    className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-2xl hover:bg-zinc-50 border border-transparent hover:border-zinc-200/80 transition-all group cursor-pointer"
                    title="Xem hồ sơ người đăng"
                  >
                    {post.poster.avatarUrl ? (
                      <img
                        src={post.poster.avatarUrl}
                        alt={post.poster.username ?? ""}
                        className="w-12 h-12 rounded-full object-cover border border-zinc-200 group-hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-lg border border-[#2AC1BC]/20 group-hover:scale-105 transition-transform">
                        {posterInitial}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-zinc-900 group-hover:text-[#2AC1BC] transition-colors truncate">
                        {post.poster.username ?? tGuest("guestRoomsDefaultLandlord")}
                      </h4>
                      <span className="text-xs font-semibold text-zinc-500 block">
                        {tGuest("guestRoomDetailVerifiedBadge")}
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Post stats */}
            <div className="bg-zinc-50 rounded-2xl border border-zinc-200/80 p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-semibold">Lượt xem</span>
                <span className="font-extrabold text-zinc-900">{post.viewsCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-semibold">Đã lưu</span>
                <span className="font-extrabold text-zinc-900">{post.savedCount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-zinc-500 font-semibold">Ngày đăng</span>
                <span className="font-extrabold text-zinc-900">
                  {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                </span>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsShareOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-zinc-100 relative cursor-default">
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-zinc-100 rounded-full text-zinc-400 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2AC1BC]" /> {tGuest("guestRoomDetailShareTitle")}
            </h3>
            <p className="text-xs text-zinc-500 font-medium line-clamp-1">{post.title}</p>

            <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-2xl border border-zinc-200">
              <input
                type="text" readOnly
                value={typeof window !== "undefined" ? window.location.href : ""}
                className="w-full text-xs font-semibold text-zinc-600 bg-transparent px-2 focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? tGuest("guestRoomDetailCopied") : tGuest("guestRoomDetailCopy")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Deposit Modal */}
      {isDepositModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsDepositModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 border border-zinc-100 max-h-[90vh] overflow-y-auto cursor-default">
            <div className="flex justify-between items-center pb-3 border-b border-zinc-100">
              <h3 className="text-base font-black text-zinc-900 flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#2AC1BC]" /> {tGuest("guestRoomDetailModalTitle")}
              </h3>
              <button
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 hover:bg-zinc-100 rounded-xl text-zinc-400 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Escrow Explanation */}
            <div className="bg-gradient-to-br from-zinc-900 to-zinc-950 p-4 rounded-2xl text-white space-y-2 border border-zinc-800">
              <span className="text-[10px] font-black text-[#2AC1BC] uppercase block">
                {tGuest("guestRoomsEscrowTitle")}
              </span>
              <p className="text-[11px] text-zinc-300 font-medium leading-relaxed">
                {tGuest("guestRoomDetailEscrowModalDesc")}
              </p>
            </div>

            {depositStep === "form" && (
              <div className="space-y-4">
                <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
                  <span className="text-[10px] font-bold text-[#2AC1BC] uppercase">
                    {tGuest("guestRoomDetailSelectedRoomLabel")}
                  </span>
                  <h4 className="font-extrabold text-xs text-zinc-900 line-clamp-1">{post.title}</h4>
                  <div className="text-xs font-bold text-rose-500">
                    {tGuest("guestRoomDetailLandlordDepositLabel")} {formatCurrency(depositAmount, currentLocale)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 uppercase">
                      {tGuest("guestRoomDetailTenantNameLabel")}
                    </label>
                    <input
                      type="text"
                      placeholder={tGuest("guestRoomDetailTenantNamePlaceholder")}
                      value={tenantName}
                      onChange={(e) => setTenantName(e.target.value)}
                      className="w-full mt-1 px-4 py-2.5 text-xs font-semibold border border-zinc-200 rounded-xl focus:outline-none focus:border-[#2AC1BC]"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-zinc-700 uppercase">
                      {tGuest("guestRoomDetailTenantPhoneLabel")}
                    </label>
                    <input
                      type="tel"
                      placeholder={tGuest("guestRoomDetailTenantPhonePlaceholder")}
                      value={tenantPhone}
                      onChange={handlePhoneChange}
                      onBlur={handlePhoneBlur}
                      maxLength={11}
                      className={`w-full mt-1 px-4 py-2.5 text-xs font-semibold border rounded-xl focus:outline-none transition-colors ${
                        phoneError
                          ? "border-rose-400 bg-rose-50 focus:border-rose-500"
                          : tenantPhone && isPhoneValid(tenantPhone)
                          ? "border-emerald-400 bg-emerald-50 focus:border-emerald-500"
                          : "border-zinc-200 focus:border-[#2AC1BC]"
                      }`}
                    />
                    {phoneError && (
                      <p className="mt-1.5 text-[11px] text-rose-500 font-semibold flex items-start gap-1">
                        <span className="shrink-0 mt-0.5">⚠</span>
                        <span>{phoneError}</span>
                      </p>
                    )}
                    {!phoneError && tenantPhone && isPhoneValid(tenantPhone) && (
                      <p className="mt-1.5 text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        Số điện thoại hợp lệ
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (!isPhoneValid(tenantPhone)) {
                      setPhoneError("Số điện thoại không hợp lệ. Vui lòng nhập số di động Việt Nam (10 số, bắt đầu 03/05/07/08/09).");
                      return;
                    }
                    setDepositStep("qr");
                  }}
                  disabled={!tenantName.trim() || !tenantPhone || !!phoneError || !isPhoneValid(tenantPhone)}
                  className="w-full py-3 bg-[#FF6B35] disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#FF6B35]/25 hover:bg-[#ff5518] transition-all cursor-pointer mt-2"
                >
                  {tGuest("guestRoomDetailConfirmQrBtn")} →
                </button>
              </div>
            )}

            {depositStep === "qr" && (
              <div className="text-center space-y-4">
                <div className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl inline-block">
                  <QrCode className="w-44 h-44 mx-auto text-zinc-900" />
                </div>

                <div className="space-y-1">
                  <span className="text-xs text-zinc-500 font-semibold block">
                    {tGuest("guestRoomDetailTransferAmountLabel")}
                  </span>
                  <span className="text-2xl font-black text-rose-600">{formatCurrency(depositAmount, currentLocale)}</span>
                  <p className="text-[11px] text-zinc-400 font-medium">
                    {tGuest("guestRoomDetailTransferContentLabel")}{" "}
                    <span className="font-extrabold text-zinc-800">COC {tenantPhone} #{post.id.slice(0, 8)}</span>
                  </p>
                </div>

                {depositErrorMsg && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-600 font-semibold flex items-start gap-2">
                    <span className="shrink-0 mt-0.5">⚠</span>
                    <span>{depositErrorMsg}</span>
                  </div>
                )}

                <button
                  onClick={handleConfirmDeposit}
                  disabled={isSubmittingDeposit}
                  className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] disabled:opacity-60 text-white font-extrabold text-xs rounded-xl shadow-md shadow-[#2AC1BC]/25 transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingDeposit ? (
                    <>
                      <svg className="animate-spin w-4 h-4 shrink-0" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Đang xử lý...
                    </>
                  ) : (
                    tGuest("guestRoomDetailConfirmTransferBtn")
                  )}
                </button>
              </div>
            )}

            {depositStep === "success" && (
              <div className="text-center space-y-4 py-4">
                <div className="w-14 h-14 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-900">{tGuest("guestRoomDetailSuccessTitle")}</h4>
                  <p className="text-xs text-zinc-500 mt-1">
                    {tGuest("guestRoomDetailSuccessDesc", {
                      name: post.poster?.username ?? tGuest("guestRoomsDefaultLandlord"),
                    })}
                  </p>
                </div>
                <button
                  onClick={() => setIsDepositModalOpen(false)}
                  className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white font-extrabold text-xs rounded-xl transition-all cursor-pointer"
                >
                  {tGuest("guestRoomDetailCloseModal")}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── Toast Feedback Notification ──────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${
              toastMessage.type === "success"
                ? "bg-zinc-900/95 text-white border-zinc-700 shadow-zinc-950/25"
                : toastMessage.type === "error"
                ? "bg-rose-500 text-white border-rose-400 shadow-rose-950/25"
                : "bg-zinc-900/95 text-white border-zinc-700 shadow-zinc-950/25"
            }`}
          >
            {toastMessage.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 text-[#2AC1BC] shrink-0" />
            ) : toastMessage.type === "error" ? (
              <AlertCircle className="w-4 h-4 text-white shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-[#2AC1BC] shrink-0" />
            )}
            <span>{toastMessage.text}</span>
            <button
              onClick={() => setToastMessage(null)}
              className="ml-2 p-1 hover:bg-white/20 rounded-lg text-zinc-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
