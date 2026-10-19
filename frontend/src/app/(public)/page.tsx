'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button, Text, TextInput, SelectInput, ChipGroup } from '@/components/ui'
import {
  Search,
  MapPin,
  ShieldCheck,
  ArrowRight,
  Banknote,
  Sparkles,
  Receipt,
  FileText,
  Users,
  BarChart3,
  CheckCircle2,
} from 'lucide-react'
import { formatVND } from '@/utils'
import { useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { postService, type PublicPostListing } from '@/services/post.service'

// Helper: build address string from structured fields
function buildAddressString(listing: PublicPostListing): string {
  const addr = listing.address
  if (!addr) return listing.room?.boardingHouseName ?? ''
  const parts = [addr.houseNumber, addr.street, addr.ward, addr.district, addr.province].filter(
    Boolean,
  )
  return parts.join(', ')
}

export default function HomePage() {
  const t = useTranslations('guest')
  const router = useRouter()

  const [activeTab, setActiveTab] = useState<'phong' | 'studio' | 'nguyencan'>('phong')
  const [processTab, setProcessTab] = useState<'tenant' | 'landlord'>('landlord')
  const [searchQuery, setSearchQuery] = useState('')
  const [priceFilter, setPriceFilter] = useState('')
  const [selectedCityFilter] = useState<'all' | 'hcm' | 'hanoi'>('all')

  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!FEATURE_FLAGS.ENABLE_BHRP) return
    const params = new URLSearchParams()
    const trimmed = searchQuery.trim()
    if (trimmed) {
      params.set('search', trimmed)
    }
    if (activeTab) {
      params.set('type', activeTab)
    }
    if (priceFilter === 'under3') {
      params.set('maxPrice', '3000000')
    } else if (priceFilter === '3to5') {
      params.set('minPrice', '3000000')
      params.set('maxPrice', '5000000')
    } else if (priceFilter === 'above5') {
      params.set('minPrice', '5000000')
    }
    const query = params.toString()
    router.push(query ? `/rooms?${query}` : '/rooms')
  }

  const [featuredRooms, setFeaturedRooms] = useState<PublicPostListing[]>([])
  const [isLoadingFeatured, setIsLoadingFeatured] = useState(FEATURE_FLAGS.ENABLE_BHRP)

  // Fetch real featured rooms from backend API if BHRP is enabled
  useEffect(() => {
    if (!FEATURE_FLAGS.ENABLE_BHRP) {
      setIsLoadingFeatured(false)
      return
    }

    let isMounted = true
    setIsLoadingFeatured(true)

    const params: { province?: string; limit: number } = { limit: 6 }
    if (selectedCityFilter === 'hcm') {
      params.province = 'Hồ Chí Minh'
    } else if (selectedCityFilter === 'hanoi') {
      params.province = 'Hà Nội'
    }

    postService
      .browsePosts(params)
      .then(res => {
        if (isMounted) {
          setFeaturedRooms(res.data || [])
        }
      })
      .catch(err => {
        console.error('Failed to load featured rooms:', err)
        if (isMounted) setFeaturedRooms([])
      })
      .finally(() => {
        if (isMounted) setIsLoadingFeatured(false)
      })

    return () => {
      isMounted = false
    }
  }, [selectedCityFilter])

  const processSteps =
    processTab === 'tenant' && FEATURE_FLAGS.ENABLE_BHRP
      ? [
        {
          num: '01',
          title: t('guestHomeTenantStep1Title'),
          desc: t('guestHomeTenantStep1Desc'),
          accent: 'brand' as const,
        },
        {
          num: '02',
          title: t('guestHomeTenantStep2Title'),
          desc: t('guestHomeTenantStep2Desc'),
          accent: 'orange' as const,
        },
        {
          num: '03',
          title: t('guestHomeTenantStep3Title'),
          desc: t('guestHomeTenantStep3Desc'),
          accent: 'brand' as const,
        },
      ]
      : [
        {
          num: '01',
          title: t('guestHomeLandlordStep1Title'),
          desc: t('guestHomeLandlordStep1Desc'),
          accent: 'brand' as const,
        },
        {
          num: '02',
          title: t('guestHomeLandlordStep2Title'),
          desc: t('guestHomeLandlordStep2Desc'),
          accent: 'orange' as const,
        },
        {
          num: '03',
          title: t('guestHomeLandlordStep3Title'),
          desc: t('guestHomeLandlordStep3Desc'),
          accent: 'brand' as const,
        },
      ]

  return (
    <div className="flex flex-col min-h-screen bg-white">
      {/* High-End Professional Hero Section (Fit Screen Height & Seamless Section Transition Divider) */}
      <section className="relative min-h-[calc(100vh-80px)] lg:h-[calc(100vh-80px)] flex flex-col justify-center items-center py-12 sm:py-16 px-4 sm:px-6 lg:px-8 text-center bg-[url('https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=80')] bg-cover bg-center overflow-hidden border-b border-zinc-800">
        {/* Dark Radial Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/95 via-zinc-950/85 to-zinc-950/98 backdrop-blur-[2px] z-0" />

        {/* Soft Ambient Glow Orbs behind text */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#2AC1BC]/20 rounded-full blur-[140px] pointer-events-none z-0" />
        <div className="absolute top-1/3 right-1/4 w-[400px] h-[300px] bg-[#FF6B35]/15 rounded-full blur-[120px] pointer-events-none z-0" />

        <div className="relative z-10 max-w-4xl mx-auto flex flex-col items-center">
          {/* Glowing Glassmorphism Pill Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#2AC1BC]/40 bg-zinc-900/70 px-4 sm:px-5 py-1.5 sm:py-2 mb-4 sm:mb-6 shadow-[0_0_25px_rgba(42,193,188,0.25)] backdrop-blur-xl transition-transform hover:scale-105">
            <ShieldCheck className="w-4 h-4 text-[#2AC1BC]" />
            <Text
              as="span"
              variant="badge"
              size="xs"
              weight="extrabold"
              color="brand"
              className="text-[10px] sm:text-xs"
            >
              {t('guestHomeBadge')}
            </Text>
          </div>

          {/* Headline with Single Continuous Gradient from Teal to Orange on 'dễ dàng, tiện lợi' */}
          <div>
            <Text
              as="h1"
              variant="heading"
              weight="black"
              color="white" className="sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md inline-block whitespace-nowrap">
              {t('guestHomeTitleLine1')}
            </Text>{' '}
            <br />
            <Text
              as="h1"
              variant="heading"
              weight="black"
              className="sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md bg-gradient-to-r from-[#2AC1BC] via-[#36D7D1] to-[#6BEAE6] bg-clip-text text-transparent inline-block whitespace-nowrap"
            >
              {t('guestHomeTitleLine2')}
            </Text>{' '}
            <br />
            <Text
              as="h1"
              variant="heading"
              weight="black"
              className="sm:text-5xl lg:text-6xl leading-[1.18] drop-shadow-md bg-gradient-to-r from-[#2AC1BC] via-[#3BDAC8] via-[#FFAE42] to-[#FF6B35] bg-clip-text text-transparent inline-block whitespace-nowrap"
            >
              {t('guestHomeTitleLine3')}
            </Text>
          </div>

          {/* Sub-headline */}
          <Text
            as="p"
            variant="subtitle"
            size="xs"
            weight="medium"
            className="sm:text-sm text-zinc-300 max-w-2xl mx-auto leading-relaxed mt-4 sm:mt-5 tracking-wide text-balance"
          >
            {t('guestHomeSubtitle')}
          </Text>

          {/* Hero Content / Actions */}
          {FEATURE_FLAGS.ENABLE_BHRP ? (
            /* Floating Search Card Widget with Premium Shadows */
            <div className="mt-6 sm:mt-8 w-full max-w-3xl bg-white/95 backdrop-blur-xl rounded-[28px] p-5 sm:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.45)] text-zinc-900 border border-white/80 animate-in fade-in duration-700">
              {/* Category Tabs */}
              <ChipGroup
                value={activeTab}
                onChange={setActiveTab}
                size="md"
                options={[
                  { value: 'phong', label: t('guestHomeTabRent') },
                  { value: 'studio', label: t('guestHomeTabStudio') },
                  { value: 'nguyencan', label: t('guestHomeTabWhole') },
                ]}
                className="justify-center sm:justify-start gap-2 mb-3.5 border-b border-zinc-100 pb-3"
              />

              {/* Inputs Row */}
              <form
                onSubmit={handleSearch}
                className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-left items-end"
              >
                <TextInput
                  label={t('guestHomeKeywordLabel')}
                  labelClassName="text-[10px] font-black text-zinc-400 uppercase tracking-wider"
                  leftIcon={<Search className="w-4 h-4" />}
                  placeholder={t('guestHomeKeywordPlaceholder')}
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleSearch()
                    }
                  }}
                  containerClassName="sm:col-span-5"
                  className="h-11 bg-zinc-50/80 border-zinc-200/90 rounded-2xl focus:bg-white"
                />

                <SelectInput
                  label={t('guestHomePriceLabel')}
                  labelClassName="text-[10px] font-black text-zinc-400 uppercase tracking-wider"
                  leftIcon={<Banknote className="w-4 h-4" />}
                  value={priceFilter}
                  onChange={e => setPriceFilter(e.target.value)}
                  options={[
                    { value: '', label: t('guestHomeAllPrices') },
                    { value: 'under3', label: t('guestHomeUnder3m') },
                    { value: '3to5', label: t('guestHomeFrom3to5m') },
                    { value: 'above5', label: t('guestHomeAbove5m') },
                  ]}
                  containerClassName="sm:col-span-4"
                  className="h-11 bg-zinc-50/80 border-zinc-200/90 rounded-2xl"
                />

                <div className="sm:col-span-3 space-y-1.5">
                  <Text
                    as="span"
                    size="3xs"
                    weight="black"
                    uppercase
                    className="text-transparent select-none tracking-wider hidden sm:block"
                  >
                    &nbsp;
                  </Text>
                  <Button
                    type="submit"
                    variant="accent"
                    fullWidth
                    leftIcon={<Search className="w-3.5 h-3.5" />}
                    className="h-11 rounded-2xl text-xs font-extrabold shadow-md shadow-[#FF6B35]/25 hover:scale-[1.02]"
                  >
                    {t('guestHomeSearchNow')}
                  </Button>
                </div>
              </form>
            </div>
          ) : (
            <div className="mt-8 sm:mt-10 flex flex-col items-center gap-6 w-full max-w-2xl animate-in fade-in duration-700">
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 w-full sm:w-auto">
                <Link href="/landlord" className="w-full sm:w-auto">
                  <Button
                    variant="primary"
                    size="lg"
                    rounded="full"
                    leftIcon={<Sparkles className="w-4 h-4" />}
                    className="w-full sm:w-auto px-8 py-3.5 shadow-lg shadow-[#2AC1BC]/25 hover:shadow-[#2AC1BC]/40 hover:scale-105 transition-all duration-300"
                  >
                    {t('guestHomeTrialBtn')}
                  </Button>
                </Link>
                <Link href="/pricing" className="w-full sm:w-auto">
                  <Button
                    variant="ghost"
                    size="lg"
                    rounded="full"
                    rightIcon={<ArrowRight className="w-4 h-4 text-[#2AC1BC]" />}
                    className="w-full sm:w-auto px-8 py-3.5 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/40 backdrop-blur-md hover:scale-105 transition-all duration-300"
                  >
                    {t('guestFeaturesViewPricingBtn')}
                  </Button>
                </Link>
              </div>

              {/* Value Badges */}
              <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
                {[
                  t('guestHomeBadgeFreeTrial'),
                  t('guestHomeBadgeNoCard'),
                  t('guestHomeBadgeSupport'),
                ].map(badgeText => (
                  <div key={badgeText} className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#2AC1BC]" />
                    <Text as="span" size="xs" weight="semibold" className="text-zinc-300">
                      {badgeText}
                    </Text>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons Below Search (only when BHRP enabled) */}
          {FEATURE_FLAGS.ENABLE_BHRP && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
              <Link href="#features">
                <Button
                  variant="dark"
                  rounded="full"
                  className="px-7 py-3 bg-zinc-900/80 hover:bg-[#FF6B35] text-white font-black text-xs sm:text-sm border border-zinc-700/80 hover:border-[#FF6B35] backdrop-blur-md shadow-xs hover:shadow-[0_10px_25px_rgba(255,107,53,0.35)] hover:scale-105 transition-all duration-300"
                >
                  {t('guestHomeExploreBtn')}
                </Button>
              </Link>
            </div>
          )}

          {/* Social Proof Stars */}
          <div className="flex items-center justify-center gap-2 mt-5 sm:mt-6">
            <Text as="div" size="sm" className="flex text-amber-400 tracking-widest">
              ★★★★★
            </Text>
            <Text as="span" size="xs" weight="medium" className="text-zinc-300">
              {t('guestHomeTrustedBy')}
            </Text>
          </div>
        </div>
      </section>

      {/* Process 3 Steps Section */}
      <section
        id="features"
        className="py-20 bg-zinc-50/50 border-b border-zinc-100 animate-in fade-in duration-500"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          {/* Top Pill Badge */}
          <Text
            as="div"
            variant="badge"
            color="brand"
            className="inline-flex items-center gap-1.5 px-4 py-1 rounded-full bg-[#2AC1BC]/10 mb-3 border border-[#2AC1BC]/20"
          >
            {t('guestHomeProcessBadge')}
          </Text>

          {/* Main Headline */}
          <Text
            as="h2"
            variant="heading"
            size="2xl"
            className="sm:text-4xl leading-snug"
          >
            <Text as="span" color="inherit" className="block sm:inline">
              {t('guestHomeProcessTitle1')}{' '}
            </Text>
            <Text as="span" color="inherit" className="block sm:inline">
              {t('guestHomeProcessTitle2')}
            </Text>
          </Text>
          <Text
            as="p"
            variant="subtitle"
            size="xs"
            className="sm:text-sm max-w-xl mx-auto mt-2 mb-8"
          >
            {t('guestHomeProcessSubtitle')}
          </Text>

          {/* Interactive Role Switcher Pill Tabs (only when BHRP enabled) */}
          {FEATURE_FLAGS.ENABLE_BHRP && (
            <div className="inline-flex items-center p-1 sm:p-1.5 bg-white border border-zinc-200/80 rounded-full shadow-xs mb-12 max-w-full overflow-x-auto">
              <Button
                variant={processTab === 'tenant' ? 'primary' : 'ghost'}
                rounded="full"
                onClick={() => setProcessTab('tenant')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 font-bold text-xs whitespace-nowrap shrink-0 ${processTab === 'tenant'
                  ? 'shadow-md shadow-[#2AC1BC]/25'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                {t('guestHomeForTenant')}
              </Button>
              <Button
                variant={processTab === 'landlord' ? 'primary' : 'ghost'}
                rounded="full"
                onClick={() => setProcessTab('landlord')}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 font-bold text-xs whitespace-nowrap shrink-0 ${processTab === 'landlord'
                  ? 'shadow-md shadow-[#2AC1BC]/25'
                  : 'text-zinc-500 hover:text-zinc-900'
                  }`}
              >
                {t('guestHomeForLandlord')}
              </Button>
            </div>
          )}

          {/* 3 Step Cards Grid */}
          <div
            className={`grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto text-left ${!FEATURE_FLAGS.ENABLE_BHRP ? 'mt-10' : ''}`}
          >
            {processSteps.map(step => (
              <div
                key={step.num}
                className={`bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 ${step.accent === 'orange'
                  ? 'hover:border-[#FF6B35]/30'
                  : 'hover:border-[#2AC1BC]/30'
                  }`}
              >
                <Text
                  as="div"
                  size="sm"
                  weight="black"
                  color={step.accent}
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center ${step.accent === 'orange' ? 'bg-[#FF6B35]/10' : 'bg-[#2AC1BC]/10'
                    }`}
                >
                  {step.num}
                </Text>
                <div className="space-y-2">
                  <Text as="h3" variant="heading" size="lg" weight="extrabold">
                    {step.title}
                  </Text>
                  <Text
                    as="p"
                    variant="body"
                    size="xs"
                    weight="medium"
                    color="secondary"
                    className="leading-relaxed"
                  >
                    {step.desc}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Rooms Section */}
      <section className="py-20 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between mb-10 gap-4">
          <div>
            <Text as="h2" variant="heading" size="3xl">
              {t('guestHomeFeaturedRoomsTitle')}
            </Text>
            <Text as="p" variant="subtitle" size="xs" weight="semibold" className="mt-1">
              {t('guestHomeFeaturedRoomsSub')}
            </Text>
          </div>
        </div>

        {FEATURE_FLAGS.ENABLE_BHRP ? (
          <>
            {/* Room Grid / Loading Skeleton / Empty State */}
            {isLoadingFeatured ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    className="rounded-3xl bg-white shadow-sm border border-zinc-200 overflow-hidden animate-pulse"
                  >
                    <div className="aspect-video w-full bg-zinc-200" />
                    <div className="p-6 space-y-3">
                      <div className="h-5 bg-zinc-200 rounded w-3/4" />
                      <div className="h-3 bg-zinc-200 rounded w-1/2" />
                      <div className="pt-4 border-t border-zinc-100 flex justify-between items-center">
                        <div className="h-6 w-24 bg-zinc-200 rounded" />
                        <div className="h-8 w-24 bg-zinc-200 rounded-xl" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : featuredRooms.length === 0 ? (
              <div className="rounded-3xl bg-zinc-50 border border-zinc-200 p-12 text-center space-y-3">
                <Text as="p" size="sm" weight="bold" color="secondary">
                  {t('guestHomeNoRooms')}
                </Text>
                <Link href="/rooms">
                  <Button variant="primary" size="md" className="px-5 py-2.5 text-xs">
                    {t('guestHomeExploreAllRooms')}
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                {featuredRooms.map(room => {
                  const image =
                    room.images?.[0]?.url ||
                    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
                  const address = buildAddressString(room)
                  return (
                    <div
                      key={room.id}
                      className="group flex flex-col overflow-hidden rounded-3xl bg-white shadow-sm border border-zinc-200 hover:shadow-xl transition-all duration-300"
                    >
                      <div className="relative aspect-video w-full overflow-hidden bg-zinc-100">
                        <img
                          src={image}
                          alt={room.title}
                          className="h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
                        />
                        <div className="absolute top-3 left-3 bg-zinc-900/80 backdrop-blur-md px-3 py-1 rounded-full shadow-sm flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-[#2AC1BC]" />
                          <Text as="span" size="2xs" weight="black" color="white">
                            {t('guestHomeVerified')}
                          </Text>
                        </div>
                        {room.room?.roomTypeName && (
                          <Text
                            as="div"
                            size="2xs"
                            weight="bold"
                            className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-zinc-700 shadow-sm"
                          >
                            {room.room.roomTypeName}
                          </Text>
                        )}
                      </div>

                      <div className="flex flex-1 flex-col p-6 gap-3">
                        <Text
                          as="h3"
                          variant="heading"
                          size="base"
                          weight="extrabold"
                          clamp={2}
                          className="leading-snug group-hover:text-[#2AC1BC] transition-colors"
                        >
                          {room.title}
                        </Text>
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-zinc-400 shrink-0" />
                          <Text as="span" size="xs" weight="semibold" color="secondary" truncate>
                            {address || t('guestHomeDefaultCountry')}
                          </Text>
                        </div>

                        <div className="mt-auto pt-4 border-t border-zinc-100 flex items-center justify-between">
                          <div>
                            <Text as="span" size="lg" weight="black" color="danger">
                              {formatVND(room.depositAmount)}
                            </Text>
                            <Text as="span" size="xs" color="subtle">
                              {t('guestHomeMonth')}
                            </Text>
                          </div>
                          <Link href={`/rooms/${room.id}`}>
                            <Button
                              variant="dark"
                              size="xs"
                              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                              className="px-4 py-2 rounded-xl"
                            >
                              {t('guestHomeViewDetail')}
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}

            {featuredRooms.length > 0 && (
              <div className="mt-12 text-center">
                <Link href="/rooms">
                  <Button
                    variant="white"
                    size="lg"
                    rounded="full"
                    rightIcon={<ArrowRight className="w-3.5 h-3.5 text-[#2AC1BC]" />}
                    className="px-8 py-3.5 font-extrabold text-xs hover:shadow-md"
                  >
                    {t('guestHomeExploreMoreRooms')}
                  </Button>
                </Link>
              </div>
            )}
          </>
        ) : (
          /* BHMS Core Features Grid */
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                {
                  icon: Receipt,
                  title: t('guestHomeBhmsFeature1Title'),
                  desc: t('guestHomeBhmsFeature1Desc'),
                  accent: 'brand' as const,
                },
                {
                  icon: FileText,
                  title: t('guestHomeBhmsFeature2Title'),
                  desc: t('guestHomeBhmsFeature2Desc'),
                  accent: 'orange' as const,
                },
                {
                  icon: Users,
                  title: t('guestHomeBhmsFeature3Title'),
                  desc: t('guestHomeBhmsFeature3Desc'),
                  accent: 'brand' as const,
                },
                {
                  icon: BarChart3,
                  title: t('guestHomeBhmsFeature4Title'),
                  desc: t('guestHomeBhmsFeature4Desc'),
                  accent: 'orange' as const,
                },
              ].map((feature, idx) => {
                const Icon = feature.icon
                const isOrange = feature.accent === 'orange'
                return (
                  <div
                    key={idx}
                    className={`group rounded-3xl bg-white p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6 ${isOrange ? 'hover:border-[#FF6B35]/40' : 'hover:border-[#2AC1BC]/40'
                      }`}
                  >
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform ${isOrange
                        ? 'bg-[#FF6B35]/10 text-[#FF6B35]'
                        : 'bg-[#2AC1BC]/10 text-[#2AC1BC]'
                        }`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div className="space-y-3">
                      <Text
                        as="h3"
                        variant="heading"
                        size="xl"
                        weight="extrabold"
                        className={`transition-colors ${isOrange
                          ? 'group-hover:text-[#FF6B35]'
                          : 'group-hover:text-[#2AC1BC]'
                          }`}
                      >
                        {feature.title}
                      </Text>
                      <Text
                        as="p"
                        variant="body"
                        size="sm"
                        weight="medium"
                        color="secondary"
                        className="leading-relaxed"
                      >
                        {feature.desc}
                      </Text>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="text-center pt-4">
              <Link href="/pricing">
                <Button
                  variant="white"
                  size="lg"
                  rounded="full"
                  rightIcon={<ArrowRight className="w-4 h-4 text-[#2AC1BC]" />}
                  className="px-8 py-3.5 font-extrabold text-xs sm:text-sm hover:shadow-md"
                >
                  {t('guestHomeBhmsViewDetails')}
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Verified Tenant Reviews & Social Proof Section */}
      <section className="py-20 bg-zinc-50 border-y border-zinc-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14 space-y-2">
            <Text as="span" variant="overline" size="xs" weight="extrabold" color="brand" className="block">
              {t('guestHomeReviewsBadge')}
            </Text>
            <Text as="h2" variant="heading" size="3xl">
              {t('guestHomeReviewsTitle')}
            </Text>
            <Text
              as="p"
              variant="subtitle"
              size="xs"
              weight="semibold"
              className="sm:text-sm max-w-xl mx-auto"
            >
              {t('guestHomeReviewsSub')}
            </Text>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: t('guestHomeReview1Name'),
                role: t('guestHomeReview1Role'),
                avatar:
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                text: t('guestHomeReview1Text'),
                rating: 5,
              },
              {
                name: t('guestHomeReview2Name'),
                role: t('guestHomeReview2Role'),
                avatar:
                  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=200&q=80',
                text: t('guestHomeReview2Text'),
                rating: 5,
              },
              {
                name: t('guestHomeReview3Name'),
                role: t('guestHomeReview3Role'),
                avatar:
                  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
                text: t('guestHomeReview3Text'),
                rating: 5,
              },
            ].map((review, idx) => (
              <div
                key={idx}
                className="bg-white rounded-3xl p-8 border border-zinc-200/80 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-6"
              >
                <div className="space-y-4">
                  <Text as="div" size="sm" className="flex text-amber-400 tracking-widest">
                    {'★'.repeat(review.rating)}
                  </Text>
                  <Text
                    as="p"
                    variant="body"
                    size="xs"
                    weight="semibold"
                    color="secondary"
                    className="leading-relaxed italic"
                  >
                    &ldquo;{review.text}&rdquo;
                  </Text>
                </div>

                <div className="pt-4 border-t border-zinc-100 flex items-center gap-3">
                  <img
                    src={review.avatar}
                    alt={review.name}
                    className="w-10 h-10 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <Text as="h4" size="xs" weight="extrabold">
                      {review.name}
                    </Text>
                    <Text as="span" variant="caption" weight="bold" color="brand" className="block">
                      {review.role}
                    </Text>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="relative my-16 mx-4 sm:mx-6 lg:mx-auto max-w-7xl rounded-3xl overflow-hidden bg-zinc-900 text-white shadow-2xl border border-zinc-800">
        <div className="px-8 py-14 md:px-16 flex flex-col lg:flex-row items-center justify-between gap-8">
          <div className="space-y-2 text-center lg:text-left">
            <Text as="h2" variant="heading" size="2xl" color="white" className="sm:text-4xl">
              {t('guestHomeCtaTitle')}
            </Text>
            <Text as="p" variant="subtitle" size="xs" weight="semibold" color="subtle" className="sm:text-sm">
              {t('guestHomeCtaSub')}
            </Text>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
            <Link href="/register">
              <Button
                variant="primary"
                size="lg"
                className="px-8 py-3.5 bg-gradient-to-r from-[#2AC1BC] to-[#209F9B] hover:from-[#23B3AE] hover:to-[#1B8E8A] rounded-xl text-xs font-bold shadow-lg shadow-[#2AC1BC]/20"
              >
                {t('guestHomeCtaTrialBtn')}
              </Button>
            </Link>
            <Link href="/contact">
              <Button
                variant="dark"
                size="lg"
                className="px-8 py-3.5 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-xs font-bold"
              >
                {t('guestHomeCtaConsultBtn')}
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
