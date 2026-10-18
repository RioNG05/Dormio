'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import {
  Users,
  Building2,
  Wallet,
  AlertTriangle,
  Megaphone,
  Newspaper,
  TrendingUp,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  ShieldAlert,
  ChevronRight,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { adminAnalyticsService, AdminOverviewResponse } from '@/services/admin-analytics.service'
import { grievanceService, AdminGrievanceItem } from '@/services/grievance.service'
import { postService, PublicPostListing } from '@/services/post.service'
import { Button, Text } from '@/components/ui'

function formatDisplayDate(dateStr: string, locale: string) {
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return dateStr
    return d.toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateStr
  }
}

export default function AdminDashboardPage() {
  const { locale } = useLanguage()
  const t = useTranslations('admin')
  const router = useRouter()

  const [overview, setOverview] = useState<AdminOverviewResponse | null>(null)
  const [urgentGrievances, setUrgentGrievances] = useState<AdminGrievanceItem[]>([])
  const [flaggedListings, setFlaggedListings] = useState<PublicPostListing[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const numberLocale = locale === 'en' ? 'en-US' : 'vi-VN'

  const fetchDashboardData = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setIsRefreshing(true)
      } else {
        setIsLoading(true)
      }
      setError(null)

      try {
        const [overviewRes, grievanceRes, postsRes] = await Promise.all([
          adminAnalyticsService.getAdminOverview().catch(err => {
            console.error('Failed to load admin overview:', err)
            return null
          }),
          grievanceService.getAdminGrievanceQueue({ limit: 4 }).catch(err => {
            console.error('Failed to load urgent grievances:', err)
            return null
          }),
          postService.browsePosts({ limit: 4 }).catch(err => {
            console.error('Failed to load moderation listings:', err)
            return null
          }),
        ])

        if (overviewRes) {
          setOverview(overviewRes)
        }
        if (grievanceRes?.items) {
          setUrgentGrievances(grievanceRes.items)
        }
        if (postsRes?.data) {
          setFlaggedListings(postsRes.data)
        }
      } catch (err: any) {
        console.error('Error fetching admin dashboard data:', err)
        setError(t('adminLoadError'))
      } finally {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    },
    [t],
  )

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  const stats = overview
    ? [
        {
          id: 'users',
          label: t('adminStatTotalUsers'),
          value: new Intl.NumberFormat(numberLocale).format(overview.totalUsers || 0),
          subtext: t('adminStatUserSubtext', {
            tenants: new Intl.NumberFormat(numberLocale).format(overview.userRoles?.tenant || 0),
            landlords: new Intl.NumberFormat(numberLocale).format(
              overview.userRoles?.landlord || 0,
            ),
            staff: new Intl.NumberFormat(numberLocale).format(overview.userRoles?.employee || 0),
          }),
          growth: `${overview.userGrowthRate >= 0 ? '+' : ''}${overview.userGrowthRate || 0}%`,
          isPositive: (overview.userGrowthRate || 0) >= 0,
          icon: Users,
          color: 'text-blue-600 bg-blue-50 border-blue-100',
          link: '/admin/users',
        },
        {
          id: 'properties',
          label: t('adminStatHousesRooms'),
          value: new Intl.NumberFormat(numberLocale).format(overview.totalHouses || 0),
          subtext: t('adminStatPropSubtext', {
            rooms: new Intl.NumberFormat(numberLocale).format(overview.totalRooms || 0),
            occupancy: overview.occupancyRate || 0,
          }),
          growth: `${overview.propertyGrowthRate >= 0 ? '+' : ''}${overview.propertyGrowthRate || 0}%`,
          isPositive: (overview.propertyGrowthRate || 0) >= 0,
          icon: Building2,
          color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
          link: '/admin/boarding-houses',
        },
        {
          id: 'revenue',
          label: t('adminStatPlatformRevenue'),
          value: new Intl.NumberFormat(numberLocale).format(overview.platformRevenue || 0),
          unit: '₫',
          subtext: t('adminStatRevenueSubtext'),
          growth: `${overview.revenueGrowthRate >= 0 ? '+' : ''}${overview.revenueGrowthRate || 0}%`,
          isPositive: (overview.revenueGrowthRate || 0) >= 0,
          icon: Wallet,
          color: 'text-orange-600 bg-orange-50 border-orange-100',
          link: '/admin/analytics',
        },
        {
          id: 'grievances',
          label: t('adminStatPendingGrievances'),
          value: String(overview.pendingGrievancesCount || 0),
          subtext: t('adminStatUrgentGrvText', { count: overview.urgentGrievancesCount || 0 }),
          growth: t('adminStatActionNeeded'),
          isPositive: false,
          icon: AlertTriangle,
          color: 'text-orange-600 bg-orange-50 border-orange-100',
          badge: t('adminStatUrgentBadge', { count: overview.urgentGrievancesCount || 0 }),
          link: '/admin/grievances',
        },
        {
          id: 'moderation',
          label: t('adminStatReportedItems'),
          value: String(overview.reportedItemsCount || 0),
          subtext: t('adminStatReportedSubtext'),
          growth: t('adminStatNeedsReview'),
          isPositive: false,
          icon: ShieldAlert,
          color: 'text-amber-600 bg-amber-50 border-amber-100',
          badge: t('adminStatItemsBadge', { count: overview.reportedItemsCount || 0 }),
          link: '/admin/blogs',
        },
      ]
    : []

  return (
    <div className="space-y-8 pb-12">
      {/* Top Hero Banner & Title */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 text-white p-6 sm:p-8 shadow-xl">
        <div className="absolute -right-16 -top-16 w-80 h-80 rounded-full bg-orange-500/15 blur-3xl pointer-events-none" />
        <div className="absolute -left-16 -bottom-16 w-80 h-80 rounded-full bg-amber-500/10 blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-6">
          <div className="space-y-2.5 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-orange-500/25 text-orange-300 border border-orange-500/40 tracking-wider uppercase">
                <ShieldAlert className="w-3.5 h-3.5 text-orange-400" />
                {t('adminHubBadge')}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                {t('adminServicesOnline')}
              </span>
            </div>

            <Text
              as="h1"
              variant="heading"
              size="2xl"
              weight="black"
              className="text-white sm:text-3xl tracking-tight"
            >
              {t('adminPageTitle')}
            </Text>
            <Text as="p" size="sm" className="text-zinc-300 leading-relaxed max-w-2xl">
              {t('adminPageSubtitle')}
            </Text>
          </div>

          {/* Quick Actions & Refresh */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchDashboardData(true)}
              disabled={isRefreshing}
              leftIcon={<RefreshCw  />}
            >
              {t('adminRefresh')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/notifications')}
              leftIcon={<Megaphone  />}
            >
              {t('adminActionSendBroadcast')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/admin/blogs')}
              leftIcon={<Newspaper  />}
            >
              {t('adminActionNewBlog')}
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => router.push('/admin/analytics')}
              leftIcon={<TrendingUp  />}
            >
              {t('adminActionFullAnalytics')}
            </Button>
          </div>
        </div>
      </div>

      {/* Error Banner with Retry */}
      {error && !isLoading && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <Text size="sm" weight="semibold">
              {error}
            </Text>
          </div>
          <Button
            variant="danger"
            size="sm"
            onClick={() => fetchDashboardData()}
            className="shrink-0"
          >
            {t('adminRetry')}
          </Button>
        </div>
      )}

      {/* 5 KPI Metric Cards */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
          {[1, 2, 3, 4, 5].map(i => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs animate-pulse space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="w-9 h-9 bg-zinc-200 rounded-xl" />
                <div className="w-16 h-5 bg-zinc-200 rounded-full" />
              </div>
              <div className="space-y-2">
                <div className="w-20 h-3 bg-zinc-200 rounded" />
                <div className="w-28 h-7 bg-zinc-200 rounded" />
                <div className="w-full h-3 bg-zinc-100 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
          {stats.map(item => {
            const Icon = item.icon
            return (
              <div
                key={item.id}
                className="group relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs hover:shadow-md hover:border-orange-300/80 transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3.5">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
                    >
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    {item.growth && (
                      <span
                        className={`inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border whitespace-nowrap ${
                          item.isPositive
                            ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                            : 'text-orange-700 bg-orange-50 border-orange-200/80'
                        }`}
                      >
                        {item.isPositive && <TrendingUp className="w-3 h-3 shrink-0" />}
                        {!item.isPositive && <AlertTriangle className="w-3 h-3 shrink-0" />}
                        {item.growth}
                      </span>
                    )}
                  </div>

                  <Text
                    as="span"
                    size="xs"
                    weight="bold"
                    color="secondary"
                    className="block uppercase tracking-wider mb-1.5"
                  >
                    {item.label}
                  </Text>

                  <div className="flex items-baseline gap-1 text-zinc-900 leading-none whitespace-nowrap">
                    <span className="text-2xl sm:text-[26px] font-black tracking-tight">
                      {item.value}
                    </span>
                    {item.unit && (
                      <span className="text-sm font-extrabold text-zinc-500 select-none">
                        {item.unit}
                      </span>
                    )}
                  </div>

                  <Text
                    as="p"
                    size="2xs"
                    color="secondary"
                    className="mt-2.5 leading-relaxed font-medium"
                  >
                    {item.subtext}
                  </Text>
                </div>

                {item.link ? (
                  <Link
                    href={item.link}
                    className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-xs font-bold text-orange-600 hover:text-orange-700 transition-colors cursor-pointer"
                  >
                    <span>{t('adminStatHandleNow')}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                ) : (
                  <div className="mt-4 pt-3 border-t border-zinc-100/70 flex items-center justify-between text-[11px] font-medium text-zinc-400">
                    <span>{t('adminStatVerified')}</span>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Operational Highlights Section (Grievance Queue & Moderation Queue) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Panel 1: Urgent Tenant Grievances */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-200/60 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <Text
                    as="h2"
                    variant="heading"
                    size="base"
                    weight="black"
                    className="text-zinc-900"
                  >
                    {t('adminUrgentGrievancesTitle')}
                  </Text>
                  <Text as="p" size="xs" color="secondary">
                    {t('adminUrgentGrievancesSubtitle')}
                  </Text>
                </div>
              </div>
              <Link
                href="/admin/grievances"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-orange-700 hover:text-orange-800 bg-orange-50 hover:bg-orange-100 border border-orange-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>
                  {isLoading
                    ? t('adminViewAll')
                    : t('adminViewAllWithCount', {
                        count: overview?.pendingGrievancesCount ?? urgentGrievances.length,
                      })}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="h-5 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : urgentGrievances.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mb-2.5" />
                <Text as="h3" size="sm" weight="bold" className="text-zinc-900">
                  {t('adminUrgentGrievancesEmpty')}
                </Text>
                <Text as="p" size="xs" color="secondary" className="mt-1 max-w-sm">
                  {t('adminUrgentGrievancesEmptyDesc')}
                </Text>
              </div>
            ) : (
              <div className="space-y-3">
                {urgentGrievances.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-orange-50/30 hover:border-orange-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                            item.priority === 'high'
                              ? 'bg-orange-600 text-white'
                              : item.priority === 'medium'
                                ? 'bg-amber-500 text-white'
                                : 'bg-zinc-600 text-white'
                          }`}
                        >
                          {item.priority === 'high'
                            ? t('adminPriorityHigh')
                            : item.priority === 'medium'
                              ? t('adminPriorityMedium')
                              : t('adminPriorityLow')}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-600">
                          {item.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          • {formatDisplayDate(item.createdAt, locale)}
                        </span>
                      </div>
                      <Text as="h3" size="sm" weight="bold" className="text-zinc-900 leading-snug">
                        {item.title}
                      </Text>
                      <p className="text-xs text-zinc-600 leading-relaxed">
                        <span className="font-semibold text-zinc-800">{item.tenantName}</span> (
                        {item.tenantPhone || t('adminNoPhone')}){' '}
                        <span className="text-zinc-400">→</span>{' '}
                        <span className="text-zinc-700 font-medium">
                          {item.boardingHouseName
                            ? `${item.boardingHouseName}${item.roomNumber ? ` (Phòng ${item.roomNumber})` : ''}`
                            : '---'}
                        </span>
                      </p>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/grievances?search=${encodeURIComponent(item.id)}`)
                      }
                      className="shrink-0 whitespace-nowrap"
                    >
                      {t('adminResolveNow')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Panel 2: Flagged / Reported Listings */}
        <div className="bg-white rounded-3xl border border-zinc-200/90 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 border border-amber-200/60 flex items-center justify-center shrink-0">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <Text
                    as="h2"
                    variant="heading"
                    size="base"
                    weight="black"
                    className="text-zinc-900"
                  >
                    {t('adminSuspiciousListingsTitle')}
                  </Text>
                  <Text as="p" size="xs" color="secondary">
                    {t('adminSuspiciousListingsSubtitle')}
                  </Text>
                </div>
              </div>
              <Link
                href="/admin/blogs"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-200/80 px-3 py-1.5 rounded-xl transition-colors cursor-pointer shrink-0 self-start sm:self-auto"
              >
                <span>
                  {isLoading
                    ? t('adminInspect')
                    : t('adminInspectWithCount', {
                        count: overview?.reportedItemsCount ?? flaggedListings.length,
                      })}
                </span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-zinc-50 border border-zinc-200/80 animate-pulse space-y-2"
                  >
                    <div className="h-4 bg-zinc-200 rounded w-1/3" />
                    <div className="h-5 bg-zinc-200 rounded w-3/4" />
                    <div className="h-3 bg-zinc-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : flaggedListings.length === 0 ? (
              <div className="p-8 text-center flex flex-col items-center justify-center bg-zinc-50/50 rounded-2xl border border-dashed border-zinc-200">
                <ShieldCheck className="w-10 h-10 text-emerald-500 mb-2.5" />
                <Text as="h3" size="sm" weight="bold" className="text-zinc-900">
                  {t('adminSuspiciousListingsEmpty')}
                </Text>
                <Text as="p" size="xs" color="secondary" className="mt-1 max-w-sm">
                  {t('adminSuspiciousListingsEmptyDesc')}
                </Text>
              </div>
            ) : (
              <div className="space-y-3">
                {flaggedListings.map(item => (
                  <div
                    key={item.id}
                    className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-amber-50/30 hover:border-amber-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                          {item.status}
                        </span>
                        <span className="text-xs font-mono font-bold text-zinc-600">
                          {item.id.slice(0, 8).toUpperCase()}
                        </span>
                        <span className="text-[11px] text-zinc-400">
                          • {formatDisplayDate(item.createdAt, locale)}
                        </span>
                      </div>
                      <Text as="h3" size="sm" weight="bold" className="text-zinc-900 leading-snug">
                        {item.title}
                      </Text>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        {item.room?.boardingHouseName && (
                          <span className="flex items-center gap-1 font-medium text-zinc-700">
                            <Building className="w-3.5 h-3.5 text-zinc-400" />
                            {item.room.boardingHouseName}
                            {item.room.roomNumber ? ` • P.${item.room.roomNumber}` : ''}
                          </span>
                        )}
                        <span className="text-zinc-300">|</span>
                        <span className="font-semibold text-orange-600">
                          {t('adminDepositAmountLabel', {
                            amount: `${new Intl.NumberFormat(numberLocale).format(item.depositAmount)} ₫`,
                          })}
                        </span>
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() =>
                        router.push(`/admin/blogs?search=${encodeURIComponent(item.id)}`)
                      }
                      className="shrink-0 hover:shadow-md whitespace-nowrap"
                    >
                      {t('adminInspectAndLock')}
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Direct Access to Admin Submodules */}
      <div className="bg-zinc-100/80 rounded-3xl p-6 sm:p-7 border border-zinc-200/80">
        <div className="flex items-center justify-between mb-4">
          <Text
            as="h2"
            size="xs"
            weight="black"
            color="secondary"
            className="uppercase tracking-wider sm:text-sm"
          >
            {t('adminSubmodulesTitle')}
          </Text>
          <Text as="span" size="xs" weight="semibold" color="secondary">
            {t('adminSubmodulesCount', { count: 5 })}
          </Text>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          <Link
            href="/admin/users"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Users className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <Text
                as="h3"
                size="sm"
                weight="bold"
                className="text-zinc-900 group-hover:text-orange-600 transition-colors"
              >
                {t('adminModUsersTitle')}
              </Text>
              <Text as="p" size="xs" color="secondary" className="mt-1.5 leading-relaxed">
                {t('adminModUsersDesc')}
              </Text>
            </div>
          </Link>

          <Link
            href="/admin/boarding-houses"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Building2 className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <Text
                as="h3"
                size="sm"
                weight="bold"
                className="text-zinc-900 group-hover:text-orange-600 transition-colors"
              >
                {t('adminModHousesTitle')}
              </Text>
              <Text as="p" size="xs" color="secondary" className="mt-1.5 leading-relaxed">
                {t('adminModHousesDesc')}
              </Text>
            </div>
          </Link>

          <Link
            href="/admin/grievances"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <Text
                as="h3"
                size="sm"
                weight="bold"
                className="text-zinc-900 group-hover:text-orange-600 transition-colors"
              >
                {t('adminModGrievancesTitle')}
              </Text>
              <Text as="p" size="xs" color="secondary" className="mt-1.5 leading-relaxed">
                {t('adminModGrievancesDesc')}
              </Text>
            </div>
          </Link>

          <Link
            href="/admin/notifications"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Megaphone className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <Text
                as="h3"
                size="sm"
                weight="bold"
                className="text-zinc-900 group-hover:text-orange-600 transition-colors"
              >
                {t('adminModBroadcastTitle')}
              </Text>
              <Text as="p" size="xs" color="secondary" className="mt-1.5 leading-relaxed">
                {t('adminModBroadcastDesc')}
              </Text>
            </div>
          </Link>

          <Link
            href="/admin/blogs"
            className="group p-5 rounded-2xl bg-white border border-zinc-200 hover:border-orange-400 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 border border-orange-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Newspaper className="w-5 h-5" />
                </div>
                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </div>
              <Text
                as="h3"
                size="sm"
                weight="bold"
                className="text-zinc-900 group-hover:text-orange-600 transition-colors"
              >
                {t('adminModBlogsTitle')}
              </Text>
              <Text as="p" size="xs" color="secondary" className="mt-1.5 leading-relaxed">
                {t('adminModBlogsDesc')}
              </Text>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
