'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter, redirect } from 'next/navigation'
import { FEATURE_FLAGS } from '@/config/features'
import Link from 'next/link'
import {
  ArrowLeft,
  MapPin,
  Minimize2,
  Phone,
  QrCode,
  CheckCircle2,
  AlertCircle,
  Info,
  X,
  Sparkles,
  Lock,
  Calculator,
  Heart,
  Share2,
  Copy,
  Check,
  ExternalLink,
  User,
  Building2,
  ChevronLeft,
  ChevronRight,
  ImageIcon,
  MessageSquare,
  Loader2,
  ShieldCheck,
  AlertTriangle,
  FileText,
  CreditCard,
  UserCheck,
  ArrowRight,
} from 'lucide-react'
import { formatCurrency } from '@/utils'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { postService, type PublicPostListing } from '@/services/post.service'
import { getOrCreateConversation } from '@/services/message.service'
import { Avatar } from '@/components/ui'

const DEFAULT_ROOM_IMAGE = '/house-placeholder.jpg'

// ─── Helper: build full address string from structured fields ─────────────────
function buildAddressString(listing: PublicPostListing): string {
  const addr = listing.address
  if (!addr) return listing.room?.boardingHouseName ?? ''
  const parts = [addr.houseNumber, addr.street, addr.ward, addr.district, addr.province].filter(
    Boolean,
  )
  return parts.join(', ')
}

// ─── Image Gallery Component ──────────────────────────────────────────────────
function ImageGallery({ images, title }: { images: { id: string; url: string }[]; title: string }) {
  const [activeIdx, setActiveIdx] = useState(0)

  const allImages = images.length > 0 ? images : [{ id: 'placeholder', url: DEFAULT_ROOM_IMAGE }]
  const mainImg = allImages[activeIdx] ?? allImages[0]

  return (
    <div className="space-y-3">
      {/* Main image */}
      <div className="rounded-3xl overflow-hidden shadow-lg border border-line aspect-video bg-card-hover relative group">
        <img
          src={mainImg.url}
          alt={title}
          onError={e => {
            ;(e.currentTarget as HTMLImageElement).src = DEFAULT_ROOM_IMAGE
          }}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <span className="absolute top-4 left-4 px-3 py-1 bg-[#2AC1BC] text-white text-xs font-black rounded-full shadow-md">
          {activeIdx + 1} / {allImages.length}
        </span>
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setActiveIdx(i => Math.max(0, i - 1))}
              disabled={activeIdx === 0}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-card rounded-full shadow-md disabled:opacity-30 cursor-pointer transition-all"
            >
              <ChevronLeft className="w-4 h-4 text-foreground" />
            </button>
            <button
              onClick={() => setActiveIdx(i => Math.min(allImages.length - 1, i + 1))}
              disabled={activeIdx === allImages.length - 1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-card/80 hover:bg-card rounded-full shadow-md disabled:opacity-30 cursor-pointer transition-all"
            >
              <ChevronRight className="w-4 h-4 text-foreground" />
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
                idx === activeIdx
                  ? 'border-[#2AC1BC] shadow-md'
                  : 'border-line hover:border-zinc-400'
              }`}
            >
              <img
                src={img.url}
                alt={`Thumbnail ${idx + 1}`}
                onError={e => {
                  ;(e.currentTarget as HTMLImageElement).src = DEFAULT_ROOM_IMAGE
                }}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonDetail() {
  return (
    <div className="flex flex-col min-h-screen bg-card pb-20 animate-pulse">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="h-6 w-32 bg-line rounded" />
        <div className="h-48 bg-line rounded-3xl" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <div className="h-96 bg-line rounded-3xl" />
            <div className="h-4 bg-line rounded w-3/4" />
            <div className="h-4 bg-line rounded w-1/2" />
          </div>
          <div className="lg:col-span-4">
            <div className="h-64 bg-line rounded-3xl" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function RoomDetailPage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect('/')
  }
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { currentLocale } = useLanguage()
  const { isLoggedIn, user } = useAuth()
  const tGuest = useTranslations('guest')

  // Data state
  const [post, setPost] = useState<PublicPostListing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const { toast } = useToast()
  const [isSaved, setIsSaved] = useState(false)
  const [isShareOpen, setIsShareOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isStartingChat, setIsStartingChat] = useState(false)

  // Utility Calculator State
  const [peopleCount, setPeopleCount] = useState(1)
  const [electricityKwh, setElectricityKwh] = useState(0)
  const [waterM3, setWaterM3] = useState(0)
  const [isCalcOpen, setIsCalcOpen] = useState(false)

  // Load bookmark status for authenticated user
  useEffect(() => {
    if (!id || !isLoggedIn) {
      setIsSaved(false)
      return
    }
    let isMounted = true
    postService
      .isPostSaved(id)
      .then(saved => {
        if (isMounted) setIsSaved(saved)
      })
      .catch(() => {})
    return () => {
      isMounted = false
    }
  }, [id, isLoggedIn])

  // Fetch post data
  const fetchPost = useCallback(async () => {
    if (!id) return
    setIsLoading(true)
    setError(null)
    try {
      const data = await postService.getPublicPostById(id)
      setPost(data)
    } catch {
      setError(tGuest('guestRoomsErrorFetch'))
    } finally {
      setIsLoading(false)
    }
  }, [id, tGuest])

  useEffect(() => {
    fetchPost()
  }, [fetchPost])

  const handleCopyLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStartChat = async () => {
    if (!isLoggedIn) {
      router.push(`/login?redirect=/rooms/${id}`)
      return
    }
    if (!post?.poster) return

    if (user?.id === post.poster.id) {
      toast.error(tGuest('guestRoomDetailCannotMessageSelf'))
      return
    }

    try {
      setIsStartingChat(true)
      const initialMessage = `Xin chào, tôi quan tâm đến bài đăng "${post.title}". Phòng này còn trống không ạ?`
      const conv = await getOrCreateConversation(post.poster.id, initialMessage)
      const convId = conv?.id
      if (convId) {
        router.push(`/messages?conversationId=${convId}`)
      } else {
        router.push('/messages')
      }
    } catch (err: any) {
      const errMsg = err?.response?.data?.message || err?.message || 'Không thể tạo cuộc trò chuyện'
      toast.error(errMsg)
    } finally {
      setIsStartingChat(false)
    }
  }

  const handleToggleSave = async () => {
    if (!isLoggedIn) {
      toast.info(tGuest('guestRoomDetailSaveLoginRequired'))
      setTimeout(() => {
        router.push('/login')
      }, 1500)
      return
    }
    if (!post) return

    const nextSaved = !isSaved
    setIsSaved(nextSaved)
    // Optimistic saved count update
    setPost(prev =>
      prev
        ? {
            ...prev,
            savedCount: Math.max(0, prev.savedCount + (nextSaved ? 1 : -1)),
          }
        : null,
    )

    try {
      const res = nextSaved
        ? await postService.savePost(post.id)
        : await postService.unsavePost(post.id)
      setPost(prev => (prev ? { ...prev, savedCount: res.savedCount } : null))
      toast.success(
        nextSaved ? tGuest('guestRoomDetailSaveSuccess') : tGuest('guestRoomDetailUnsaveSuccess'),
      )
    } catch (err: any) {
      // Revert optimistic update
      setIsSaved(!nextSaved)
      setPost(prev =>
        prev
          ? {
              ...prev,
              savedCount: Math.max(0, prev.savedCount + (nextSaved ? -1 : 1)),
            }
          : null,
      )
      const isAuthError =
        err?.message?.includes('401') ||
        err?.message?.includes('expired') ||
        err?.message?.includes('log in')
      if (isAuthError) {
        toast.info(tGuest('guestRoomDetailSessionExpired'))
        setTimeout(() => {
          router.push('/login')
        }, 1500)
      } else {
        toast.error(err?.message || tGuest('guestRoomDetailSaveError'))
      }
    }
  }

  // Utility Cost Calculator Math (defaults use 3800/kWh, 25000/m³, 150000 service/person)
  const electricityRate = 3800
  const waterRate = 25000
  const serviceFee = 150000
  const depositAmount = Number(post?.depositAmount ?? 0)
  const totalElectricityCost = electricityKwh * electricityRate
  const totalWaterCost = waterM3 * waterRate
  const totalServiceCost = peopleCount * serviceFee
  const totalEstimatedMonthly =
    depositAmount + totalElectricityCost + totalWaterCost + totalServiceCost

  if (isLoading) return <SkeletonDetail />

  if (error || !post) {
    return (
      <div className="flex flex-col min-h-screen bg-card items-center justify-center gap-4 p-8">
        <div className="w-16 h-16 rounded-full bg-card-hover flex items-center justify-center mx-auto">
          <ImageIcon className="w-8 h-8 text-muted" />
        </div>
        <h2 className="font-extrabold text-foreground text-xl">
          {error ?? tGuest('guestRoomsEmptyTitle')}
        </h2>
        <Link href="/rooms">
          <button className="px-5 py-2.5 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer">
            {tGuest('guestRoomDetailBackToList')}
          </button>
        </Link>
      </div>
    )
  }

  const address = buildAddressString(post)

  return (
    <div className="flex flex-col min-h-screen bg-card animate-in fade-in duration-500 pb-20">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 w-full space-y-6">
        {/* Top Header Trail & Action Bar */}
        <div className="flex items-center justify-between border-b border-line pb-4">
          <Link
            href="/rooms"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted hover:text-[#2AC1BC] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" /> {tGuest('guestRoomDetailBackToList')}
          </Link>

          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleSave}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                isSaved ? 'bg-rose-500 text-white' : 'bg-card-hover text-foreground/90 hover:bg-line'
              }`}
            >
              <Heart className={`w-3.5 h-3.5 ${isSaved ? 'fill-white' : ''}`} />
              {isSaved ? tGuest('guestRoomDetailSaved') : tGuest('guestRoomDetailSave')}
            </button>

            <button
              onClick={() => setIsShareOpen(true)}
              className="px-3.5 py-1.5 bg-card-hover hover:bg-line text-foreground/90 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
            >
              <Share2 className="w-3.5 h-3.5 text-[#2AC1BC]" /> {tGuest('guestRoomDetailShare')}
            </button>
          </div>
        </div>

        {/* Room Title Header Block */}
        <div className="space-y-3 bg-surface/80 p-6 sm:p-8 rounded-3xl border border-line shadow-xs">
          <div className="flex flex-wrap items-center gap-2">
            {post.room?.roomTypeName && (
              <span className="px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-xs font-extrabold rounded-full">
                {post.room.roomTypeName}
              </span>
            )}
            <span className="px-3 py-1 bg-warning-soft text-warning text-xs font-bold rounded-full border border-warning-subtle">
              {tGuest('guestRoomDetailVerifiedBadge')}
            </span>
            {post.room?.boardingHouseName && (
              <span className="px-3 py-1 bg-line/80 text-foreground/90 text-xs font-extrabold rounded-full flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {post.room.boardingHouseName}
              </span>
            )}
          </div>

          <h1 className="text-2xl sm:text-4xl font-black text-foreground leading-snug">
            {post.title}
          </h1>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-line text-xs font-semibold text-muted">
            {address ? (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 text-foreground font-bold hover:text-[#2AC1BC] hover:underline cursor-pointer transition-colors group"
                title={tGuest('guestContactMaps')}
              >
                <MapPin className="h-4 w-4 text-[#2AC1BC]" />
                <span>{address}</span>
                <ExternalLink className="w-3 h-3 text-muted group-hover:text-[#2AC1BC]" />
              </a>
            ) : (
              <span className="text-muted italic">{tGuest('guestRoomsDefaultLandlord')}</span>
            )}

            {post.room?.area && (
              <div className="flex items-center gap-1 text-foreground/90">
                <Minimize2 className="h-4 w-4 text-muted" />
                <span>
                  {tGuest('guestRoomDetailAreaLabel')}: <strong>{post.room.area} m²</strong>
                </span>
              </div>
            )}

            {post.room?.floor && (
              <span className="text-muted font-bold">
                {tGuest('guestRoomDetailFloorLabel')}: {post.room.floor}
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
              <h2 className="text-xl font-extrabold text-foreground">
                {tGuest('guestRoomDetailDescTitle')}
              </h2>
              <div className="text-muted leading-relaxed whitespace-pre-line text-xs font-medium bg-surface p-6 rounded-3xl border border-line">
                {post.content || tGuest('guestRoomsEmptyDesc')}
              </div>
            </div>

            {/* 2. Room details chips */}
            {post.room && (
              <div className="space-y-4">
                <h2 className="text-xl font-extrabold text-foreground">
                  {tGuest('guestRoomDetailFacilitiesTitle')}
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {post.room.roomTypeName && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-card border border-line rounded-2xl text-xs font-bold text-foreground shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{post.room.roomTypeName}</span>
                    </div>
                  )}
                  {post.room.area && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-card border border-line rounded-2xl text-xs font-bold text-foreground shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>{post.room.area} m²</span>
                    </div>
                  )}
                  {post.room.floor && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-card border border-line rounded-2xl text-xs font-bold text-foreground shadow-xs">
                      <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                      <span>
                        {tGuest('guestRoomDetailFloorLabel')}: {post.room.floor}
                      </span>
                    </div>
                  )}
                  {post.room.boardingHouseName && (
                    <div className="flex items-center gap-2.5 p-3.5 bg-card border border-line rounded-2xl text-xs font-bold text-foreground shadow-xs">
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
                {tGuest('guestRoomDetailEscrowTitle')}
              </span>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-[#2AC1BC] text-white font-black text-xs inline-flex items-center justify-center">
                    1
                  </span>
                  <h4 className="font-extrabold text-xs text-white">
                    {tGuest('guestRoomDetailEscrowStep1Title')}
                  </h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {tGuest('guestRoomDetailEscrowStep1Desc')}
                  </p>
                </div>

                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-amber-400 text-foreground font-black text-xs inline-flex items-center justify-center">
                    2
                  </span>
                  <h4 className="font-extrabold text-xs text-white">
                    {tGuest('guestRoomDetailEscrowStep2Title')}
                  </h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {tGuest('guestRoomDetailEscrowStep2Desc')}
                  </p>
                </div>

                <div className="bg-zinc-800/80 p-4 rounded-2xl border border-zinc-700/60 space-y-1.5">
                  <span className="w-6 h-6 rounded-full bg-emerald-400 text-foreground font-black text-xs inline-flex items-center justify-center">
                    3
                  </span>
                  <h4 className="font-extrabold text-xs text-white">
                    {tGuest('guestRoomDetailEscrowStep3Title')}
                  </h4>
                  <p className="text-[11px] text-muted leading-relaxed">
                    {tGuest('guestRoomDetailEscrowStep3Desc')}
                  </p>
                </div>
              </div>
            </div>

            {/* 4. Interactive Rent & Utility Calculator Card Widget */}
            <div className="bg-card p-6 sm:p-8 rounded-3xl text-foreground shadow-md border border-line space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-4">
                <div>
                  <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-[#2AC1BC]" />{' '}
                    {tGuest('guestRoomDetailCalcTitle')}
                  </h3>
                  <p className="text-xs text-muted font-medium mt-0.5">
                    {tGuest('guestRoomDetailCalcSub')}
                  </p>
                </div>
                <button
                  onClick={() => setIsCalcOpen(!isCalcOpen)}
                  className="px-4 py-2 bg-[#2AC1BC] text-white text-xs font-extrabold rounded-xl shadow-md cursor-pointer hover:bg-[#22a9a4] transition-colors shrink-0"
                >
                  {isCalcOpen
                    ? tGuest('guestRoomDetailCalcClose')
                    : tGuest('guestRoomDetailCalcOpen')}
                </button>
              </div>

              {isCalcOpen && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-300">
                  <div className="space-y-2 bg-surface p-4 rounded-2xl border border-line">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted">
                        {tGuest('guestRoomDetailPeopleCountLabel')}
                      </span>
                      <span className="text-[#2AC1BC] font-black">
                        {peopleCount} {tGuest('guestRoomDetailPeopleUnit')}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="4"
                      value={peopleCount}
                      onChange={e => setPeopleCount(Number(e.target.value))}
                      className="w-full accent-[#2AC1BC] cursor-pointer"
                    />
                    <span className="text-[10px] text-muted block">
                      {tGuest('guestRoomDetailServiceNote')}{' '}
                      {formatCurrency(totalServiceCost, currentLocale)}
                    </span>
                  </div>

                  <div className="space-y-2 bg-surface p-4 rounded-2xl border border-line">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted">
                        {tGuest('guestRoomDetailElectricityLabel')}
                      </span>
                      <span className="text-amber-600 font-black">{electricityKwh} kWh</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="300"
                      step="10"
                      value={electricityKwh}
                      onChange={e => setElectricityKwh(Number(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-muted block">
                      {tGuest('guestRoomDetailElectricityNote')} (
                      {formatCurrency(totalElectricityCost, currentLocale)})
                    </span>
                  </div>

                  <div className="space-y-2 bg-surface p-4 rounded-2xl border border-line">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="text-muted">{tGuest('guestRoomDetailWaterLabel')}</span>
                      <span className="text-cyan-600 font-black">{waterM3} m³</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      value={waterM3}
                      onChange={e => setWaterM3(Number(e.target.value))}
                      className="w-full accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-[10px] text-muted block">
                      {tGuest('guestRoomDetailWaterNote')} (
                      {formatCurrency(totalWaterCost, currentLocale)})
                    </span>
                  </div>
                </div>
              )}

              {/* Total Summary Breakdown Box */}
              <div className="p-5 bg-zinc-900 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-muted font-semibold block">
                    {tGuest('guestRoomDetailTotalCalcTitle')}
                  </span>
                  <span className="text-3xl font-black text-rose-500">
                    {formatCurrency(totalEstimatedMonthly, currentLocale)}
                  </span>
                </div>
                <div className="text-xs text-muted font-medium space-y-0.5">
                  <div>
                    • {tGuest('guestRoomDetailRentPart')}{' '}
                    <strong className="text-white">
                      {formatCurrency(depositAmount, currentLocale)}
                    </strong>
                  </div>
                  <div>
                    • {tGuest('guestRoomDetailUtilPart')}{' '}
                    <strong className="text-[#2AC1BC]">
                      {formatCurrency(
                        totalElectricityCost + totalWaterCost + totalServiceCost,
                        currentLocale,
                      )}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar Card: Booking & Poster Info */}
          <div className="lg:col-span-4 space-y-6 sticky top-24">
            {/* Price & Deposit Action Box */}
            <div className="bg-card p-6 sm:p-8 rounded-3xl border border-line shadow-xl space-y-6">
              <div className="space-y-1">
                <span className="text-xs text-muted font-bold uppercase tracking-wider block">
                  {tGuest('guestRoomDetailListedPriceLabel')}
                </span>
                <div className="text-3xl font-black text-rose-500">
                  {formatCurrency(depositAmount, currentLocale)}{' '}
                  <span className="text-xs text-muted font-normal">
                    {tGuest('guestRoomDetailMonth')}
                  </span>
                </div>
                {depositAmount > 0 && (
                  <div className="p-3 bg-danger-soft rounded-2xl border border-danger-subtle text-xs text-danger font-bold mt-2">
                    {tGuest('guestRoomDetailDepositLabel')}{' '}
                    {formatCurrency(depositAmount, currentLocale)}
                  </div>
                )}
              </div>

              <div className="space-y-3 pt-2">
                {post.room?.status === 'deposited' ? (
                  <div className="w-full py-3.5 px-4 bg-warning-soft border border-warning-subtle text-warning font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 text-center">
                    <Lock className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>{tGuest('guestRoomDetailRoomDeposited')}</span>
                  </div>
                ) : post.room?.status === 'occupied' ? (
                  <div className="w-full py-3.5 px-4 bg-card-hover border border-line text-muted font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 text-center">
                    <Lock className="w-4 h-4 text-muted shrink-0" />
                    <span>{tGuest('guestRoomDetailRoomOccupied')}</span>
                  </div>
                ) : !post.room ? (
                  <button
                    onClick={() => {
                      toast.info(tGuest('guestRoomDetailUnlinkedInfo'))
                    }}
                    className="w-full py-3.5 px-4 bg-card-hover hover:bg-line text-foreground/90 font-extrabold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <Info className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                    <span>{tGuest('guestRoomDetailContactLandlord')}</span>
                  </button>
                ) : (
                  <Link
                    href={`/rooms/${id}/deposit`}
                    className="w-full py-4 bg-gradient-to-r from-[#FF6B35] to-[#FF7B44] hover:from-[#ff5518] hover:to-[#ff6d31] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#FF6B35]/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4" /> {tGuest('guestRoomDetailDepositBtn')}
                  </Link>
                )}

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
                    {tGuest('guestRoomDetailChatBtn')}
                  </button>
                )}

                {post.poster && (
                  <button
                    onClick={() => alert(tGuest('guestRoomDetailCallBtn'))}
                    className="w-full py-3 bg-card-hover hover:bg-line text-foreground font-extrabold text-xs rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-[#2AC1BC]" /> {tGuest('guestRoomDetailCallBtn')}
                  </button>
                )}
              </div>

              {/* Poster Profile Card */}
              {post.poster && (
                <div className="pt-6 border-t border-line space-y-3">
                  <span className="text-xs font-extrabold text-muted uppercase tracking-wider block">
                    {tGuest('guestRoomDetailLandlordTitle')}
                  </span>
                  <Link
                    href={`/landlords/${post.poster.id}`}
                    className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-2xl hover:bg-card-hover border border-transparent hover:border-zinc-200/80 transition-all group cursor-pointer"
                    title="Xem hồ sơ người đăng"
                  >
                    <Avatar
                      src={post.poster.avatarUrl}
                      name={post.poster.username}
                      size="lg"
                      bordered
                      zoomOnHover
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-extrabold text-sm text-foreground group-hover:text-[#2AC1BC] transition-colors truncate">
                        {post.poster.username ?? tGuest('guestRoomsDefaultLandlord')}
                      </h4>
                      <span className="text-xs font-semibold text-muted block">
                        {tGuest('guestRoomDetailVerifiedBadge')}
                      </span>
                    </div>
                  </Link>
                </div>
              )}
            </div>

            {/* Post stats */}
            <div className="bg-surface rounded-2xl border border-line p-4 space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted font-semibold">
                  {tGuest('guestRoomDetailViewsLabel')}
                </span>
                <span className="font-extrabold text-foreground">
                  {post.viewsCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted font-semibold">
                  {tGuest('guestRoomDetailSavedCountLabel')}
                </span>
                <span className="font-extrabold text-foreground">
                  {post.savedCount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted font-semibold">
                  {tGuest('guestRoomDetailPostedDateLabel')}
                </span>
                <span className="font-extrabold text-foreground">
                  {new Date(post.createdAt).toLocaleDateString('vi-VN')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Share Modal */}
      {isShareOpen && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setIsShareOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-card rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 border border-line relative cursor-default">
            <button
              onClick={() => setIsShareOpen(false)}
              className="absolute top-4 right-4 p-1 hover:bg-card-hover rounded-full text-muted cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-base font-black text-foreground flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#2AC1BC]" /> {tGuest('guestRoomDetailShareTitle')}
            </h3>
            <p className="text-xs text-muted font-medium line-clamp-1">{post.title}</p>

            <div className="flex items-center gap-2 p-2 bg-surface rounded-2xl border border-line">
              <input
                type="text"
                readOnly
                value={typeof window !== 'undefined' ? window.location.href : ''}
                className="w-full text-xs font-semibold text-muted bg-transparent px-2 focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-3 py-1.5 bg-[#2AC1BC] hover:bg-[#22a9a4] text-white text-xs font-extrabold rounded-xl transition-colors cursor-pointer shrink-0 flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? tGuest('guestRoomDetailCopied') : tGuest('guestRoomDetailCopy')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
