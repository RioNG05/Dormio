"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Mail,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  MessageSquare,
  Lock,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Home,
  Maximize2,
  Building,
  AlertCircle,
  CheckCircle2,
  Info,
  X,
} from "lucide-react";
import { formatVND } from "@/utils";
import { useTranslations } from "@/context/LanguageContext";
import { useAuth } from "@/context/AuthContext";
import {
  postService,
  type PosterProfileResponse,
  type PublicPostListing,
} from "@/services/post.service";
import { api } from "@/services/api";

const DEFAULT_ROOM_IMAGE = "/house-placeholder.jpg";

function buildAddressString(listing: PublicPostListing): string {
  const addr = listing.address;
  if (!addr) return listing.room?.boardingHouseName ?? "";
  const parts = [
    addr.houseNumber,
    addr.street,
    addr.ward,
    addr.district,
    addr.province,
  ].filter(Boolean);
  return parts.join(", ");
}

export default function LandlordProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const posterId = resolvedParams.id;

  const t = useTranslations("guest");
  const router = useRouter();
  const { isLoggedIn, user: currentUser } = useAuth();

  const [profile, setProfile] = useState<PosterProfileResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [copiedPhone, setCopiedPhone] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
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

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    postService
      .getPosterProfile(posterId)
      .then((data) => {
        if (isMounted) {
          setProfile(data);
        }
      })
      .catch(() => {
        if (isMounted) {
          setError(t("guestPosterProfileErrorFetch"));
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [posterId, t]);

  const handleCopy = (text: string, type: "phone" | "email") => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(text);
      if (type === "phone") {
        setCopiedPhone(true);
        setTimeout(() => setCopiedPhone(false), 2000);
      } else {
        setCopiedEmail(true);
        setTimeout(() => setCopiedEmail(false), 2000);
      }
    }
  };

  const handleStartChat = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/landlords/${posterId}`);
      return;
    }
    if (!profile) return;

    // Check if current user and poster are the same
    if (currentUser?.id === profile.id || currentUser?.id === posterId) {
      setToastMessage({
        type: "error",
        text: t("guestPosterProfileCannotMessageSelf"),
      });
      return;
    }

    try {
      setIsChatLoading(true);
      // Call create/find conversation endpoint
      const res: any = await api.post("/v1/messages/conversations", {
        participantId: profile.id,
      });
      const convId = res?.id || res?.data?.id;
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
      setIsChatLoading(false);
    }
  };

  const isSelf = currentUser?.id === profile?.id;
  const canSeeContact =
    Boolean(profile?.phoneNumber || profile?.email) &&
    (profile?.hasActiveConversation || isSelf);

  const formattedJoinedDate = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("vi-VN", {
      month: "numeric",
      year: "numeric",
    })
    : "";

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50/60 pb-24 animate-in fade-in duration-300">
      {/* Top Banner / Breadcrumbs */}
      <div className="bg-white border-b border-zinc-200/80 sticky top-0 z-20 backdrop-blur-md bg-white/90">
        <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8 flex items-center justify-between">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-2 text-xs font-bold text-zinc-500 hover:text-zinc-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-[#2AC1BC]" />
            <span>{t("guestPosterProfileBackToRooms")}</span>
          </Link>
          <div className="flex items-center gap-2 text-[11px] font-bold text-zinc-400">
            <Link href="/" className="hover:text-zinc-700">
              Trang chủ
            </Link>
            <span>/</span>
            <Link href="/rooms" className="hover:text-zinc-700">
              Phòng trọ
            </Link>
            <span>/</span>
            <span className="text-zinc-700">
              {profile?.username ?? t("guestPosterProfileTitle")}
            </span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full space-y-8">
        {/* Loading State */}
        {isLoading && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-xs animate-pulse flex flex-col md:flex-row gap-6 items-center">
              <div className="w-28 h-28 rounded-full bg-zinc-200 shrink-0" />
              <div className="flex-1 space-y-3 w-full">
                <div className="h-6 bg-zinc-200 rounded w-1/3" />
                <div className="h-4 bg-zinc-200 rounded w-1/4" />
                <div className="h-4 bg-zinc-200 rounded w-2/3" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-white rounded-3xl p-4 border border-zinc-200/80 h-72 animate-pulse"
                />
              ))}
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="bg-white rounded-3xl p-12 border border-zinc-200/80 text-center space-y-4 max-w-lg mx-auto shadow-xs">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h3 className="font-extrabold text-lg text-zinc-900">{error}</h3>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-zinc-900 text-white rounded-xl text-xs font-bold hover:bg-zinc-800 transition-colors cursor-pointer"
            >
              {t("guestRoomsRetry")}
            </button>
          </div>
        )}

        {/* Profile Content */}
        {!isLoading && !error && profile && (
          <>
            {/* Poster Header Hero Card */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-zinc-200/80 shadow-xs overflow-hidden relative">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                {/* Avatar */}
                <div className="relative shrink-0">
                  {profile.avatarUrl ? (
                    <img
                      src={profile.avatarUrl}
                      alt={profile.username ?? "Poster Avatar"}
                      className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl object-cover border-4 border-white shadow-xl shadow-zinc-950/10"
                    />
                  ) : (
                    <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-br from-[#2AC1BC] to-[#20928e] text-white flex items-center justify-center font-black text-3xl shadow-xl shadow-[#2AC1BC]/20">
                      {profile.username?.charAt(0)?.toUpperCase() ?? "P"}
                    </div>
                  )}
                  <span className="absolute -bottom-1.5 -right-1.5 p-1.5 bg-emerald-500 text-white rounded-full shadow-md">
                    <ShieldCheck className="w-4 h-4" />
                  </span>
                </div>

                {/* Info Column */}
                <div className="flex-1 text-center md:text-left space-y-3">
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-2.5">
                    <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
                      {profile.username ?? t("guestRoomsDefaultLandlord")}
                    </h1>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-extrabold rounded-full">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>{t("guestPosterProfileVerified")}</span>
                    </span>
                  </div>

                  {/* Metadata Chips */}
                  <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-xs font-semibold text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-[#2AC1BC]" />
                      {t("guestPosterProfileMemberSince", {
                        date: formattedJoinedDate,
                      })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Building className="w-4 h-4 text-[#2AC1BC]" />
                      {t("guestPosterProfileTotalListings", {
                        count: profile.postCount,
                      })}
                    </span>
                  </div>

                  {/* Bio Description */}
                  <div className="pt-2">
                    <p className="text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed max-w-2xl bg-zinc-50 p-3.5 rounded-2xl border border-zinc-100">
                      {profile.bio || t("guestPosterProfileDefaultBio")}
                    </p>
                  </div>
                </div>

                {/* Actions / Contact Status Card */}
                <div className="w-full md:w-80 shrink-0 bg-zinc-50/80 rounded-2xl p-5 border border-zinc-200/70 space-y-3.5">
                  <span className="text-xs font-extrabold text-zinc-900 block border-b border-zinc-200/60 pb-2">
                    {t("guestPosterProfileContactTitle")}
                  </span>

                  {/* If Contact IS visible (authorized with active conversation or self) */}
                  {canSeeContact ? (
                    <div className="space-y-3">
                      {profile.phoneNumber && (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-zinc-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 truncate">
                            <Phone className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                            <span className="truncate">
                              {profile.phoneNumber}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <a
                              href={`tel:${profile.phoneNumber}`}
                              className="px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white text-[11px] font-bold rounded-lg transition-colors cursor-pointer"
                            >
                              {t("guestPosterProfileCall")}
                            </a>
                            <button
                              onClick={() =>
                                handleCopy(profile.phoneNumber!, "phone")
                              }
                              className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer"
                              title={t("guestPosterProfileCopy")}
                            >
                              {copiedPhone ? (
                                <Check className="w-3.5 h-3.5 text-emerald-500" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      )}

                      {profile.email && (
                        <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-zinc-200/80">
                          <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 truncate">
                            <Mail className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                            <span className="truncate">{profile.email}</span>
                          </div>
                          <button
                            onClick={() => handleCopy(profile.email!, "email")}
                            className="p-1.5 text-zinc-400 hover:text-zinc-700 rounded-lg hover:bg-zinc-100 transition-colors cursor-pointer shrink-0"
                            title={t("guestPosterProfileCopy")}
                          >
                            {copiedEmail ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      )}

                      {!isSelf && (
                        <button
                          onClick={handleStartChat}
                          disabled={isChatLoading}
                          className="w-full py-2.5 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-[#2AC1BC]" />
                          <span>
                            {isChatLoading
                              ? t("guestPosterProfileChatLoading")
                              : t("guestPosterProfileStartChatBtn")}
                          </span>
                        </button>
                      )}
                    </div>
                  ) : (
                    /* Contact IS PROTECTED (No active conversation yet or anonymous) */
                    <div className="space-y-3">
                      <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl space-y-1.5">
                        <div className="flex items-center gap-1.5 text-amber-700 font-extrabold text-[11px]">
                          <Lock className="w-3.5 h-3.5 text-amber-600" />
                          <span>
                            {t("guestPosterProfileContactProtectedTitle")}
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-800/80 font-medium leading-relaxed">
                          {t("guestPosterProfileContactProtectedDesc")}
                        </p>
                      </div>

                      {isLoggedIn ? (
                        <button
                          onClick={handleStartChat}
                          disabled={isChatLoading}
                          className="w-full py-3 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white text-xs font-extrabold rounded-xl transition-all cursor-pointer shadow-md shadow-[#2AC1BC]/20 flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>
                            {isChatLoading
                              ? t("guestPosterProfileChatLoading")
                              : t("guestPosterProfileStartChatBtn")}
                          </span>
                        </button>
                      ) : (
                        <Link
                          href={`/login?redirect=/landlords/${posterId}`}
                          className="w-full py-3 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-extrabold rounded-xl transition-all flex items-center justify-center gap-2 shadow-md cursor-pointer"
                        >
                          <Lock className="w-3.5 h-3.5 text-[#2AC1BC]" />
                          <span>{t("guestPosterProfileLoginToContact")}</span>
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Active Rental Listings Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-3.5">
                <h2 className="text-lg sm:text-xl font-black text-zinc-900 flex items-center gap-2.5">
                  <Home className="w-5 h-5 text-[#2AC1BC]" />
                  <span>{t("guestPosterProfileActiveListingsTitle")}</span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 bg-zinc-200 text-zinc-700 rounded-full">
                    {profile.activeListings.length}
                  </span>
                </h2>
              </div>

              {/* Listings Grid */}
              {profile.activeListings.length === 0 ? (
                <div className="bg-white rounded-3xl p-12 border border-zinc-200/80 text-center space-y-3">
                  <Home className="w-10 h-10 text-zinc-300 mx-auto" />
                  <p className="text-xs sm:text-sm font-semibold text-zinc-500">
                    {t("guestPosterProfileNoListings")}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {profile.activeListings.map((listing) => {
                    const imageUrl =
                      listing.images?.[0]?.url || DEFAULT_ROOM_IMAGE;
                    const address = buildAddressString(listing);

                    return (
                      <div
                        key={listing.id}
                        onClick={(e) => {
                          if (e.ctrlKey || e.metaKey) {
                            window.open(`/rooms/${listing.id}`, "_blank");
                          } else {
                            router.push(`/rooms/${listing.id}`);
                          }
                        }}
                        className="bg-white rounded-3xl border border-zinc-200/80 shadow-xs hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col group cursor-pointer"
                      >
                        {/* Image banner */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-zinc-100">
                          <img
                            src={imageUrl}
                            alt={listing.title}
                            onError={(e) => {
                              (
                                e.currentTarget as HTMLImageElement
                              ).src = DEFAULT_ROOM_IMAGE;
                            }}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                          <span className="absolute top-3 left-3 px-3 py-1 bg-zinc-950/80 backdrop-blur-md text-white font-extrabold text-[11px] rounded-full shadow-md pointer-events-none">
                            {listing.room?.roomTypeName ??
                              t("guestRoomsBadgeAvailable")}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="p-5 flex-1 flex flex-col justify-between space-y-3.5">
                          <div className="space-y-1.5">
                            <h3 className="font-extrabold text-zinc-900 text-sm leading-snug group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                              <Link
                                href={`/rooms/${listing.id}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-[#2AC1BC] transition-colors"
                              >
                                {listing.title}
                              </Link>
                            </h3>

                            {address && (
                              <p className="flex items-center text-xs text-zinc-400 font-semibold gap-1 truncate">
                                <MapPin className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                                <span className="truncate">{address}</span>
                              </p>
                            )}

                            {listing.room?.area && (
                              <span className="text-[11px] text-zinc-400 font-medium flex items-center gap-1">
                                <Maximize2 className="w-3 h-3 text-[#2AC1BC] shrink-0" />
                                {listing.room.area} m²
                              </span>
                            )}
                          </div>

                          {/* Price and button */}
                          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                            <div>
                              <span className="text-lg font-black text-rose-500">
                                {formatVND(listing.depositAmount)}
                              </span>
                              <span className="text-[11px] text-zinc-400 font-normal">
                                {" "}
                                {t("guestRoomsMonth")}
                              </span>
                            </div>
                            <span className="px-3 py-1.5 bg-zinc-900 group-hover:bg-[#2AC1BC] text-white text-[11px] font-bold rounded-xl transition-all shrink-0">
                              {t("guestRoomsDetailBtn")}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ─── Toast Feedback Notification ──────────────────────────────────── */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${toastMessage.type === "success"
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