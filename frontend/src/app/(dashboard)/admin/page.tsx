'use client'

import React from 'react'
import Link from 'next/link'
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
} from 'lucide-react'
import { adminAnalyticsService, AdminOverviewResponse } from '@/services/admin-analytics.service'
import { Text } from '@/components/ui/Text'

export default function AdminDashboardPage() {
  const { locale } = useLanguage()
  const t = useTranslations('admin')

  const [liveOverview, setLiveOverview] = React.useState<AdminOverviewResponse | null>(null)

  React.useEffect(() => {
    adminAnalyticsService
      .getAdminOverview()
      .then(data => setLiveOverview(data))
      .catch(err => console.warn('Failed to fetch live admin overview, using fallback:', err))
  }, [])

  const numberLocale = locale === 'en' ? 'en-US' : 'vi-VN'

  const totalUsersVal = liveOverview
    ? new Intl.NumberFormat(numberLocale).format(liveOverview.totalUsers)
    : '12,480'

  const userSubtext = liveOverview
    ? t('adminStatUserSubtext', {
        tenants: new Intl.NumberFormat(numberLocale).format(liveOverview.userRoles?.tenant || 0),
        landlords: new Intl.NumberFormat(numberLocale).format(liveOverview.userRoles?.landlord || 0),
        staff: new Intl.NumberFormat(numberLocale).format(liveOverview.userRoles?.employee || 0),
      })
    : t('adminStatUserSubtext', {
        tenants: '8,920',
        landlords: '3,140',
        staff: '420',
      })

  const userGrowth = liveOverview
    ? `${liveOverview.userGrowthRate >= 0 ? '+' : ''}${liveOverview.userGrowthRate}%`
    : '+14.2%'

  const totalHousesVal = liveOverview
    ? new Intl.NumberFormat(numberLocale).format(liveOverview.totalHouses)
    : '1,850'

  const propSubtext = liveOverview
    ? t('adminStatPropSubtext', {
        rooms: new Intl.NumberFormat(numberLocale).format(liveOverview.totalRooms),
        occupancy: liveOverview.occupancyRate,
      })
    : t('adminStatPropSubtext', {
        rooms: '24,600',
        occupancy: '88.5',
      })

  const propGrowth = liveOverview
    ? `${liveOverview.propertyGrowthRate >= 0 ? '+' : ''}${liveOverview.propertyGrowthRate}%`
    : '+8.6%'

  const revenueVal = liveOverview
    ? new Intl.NumberFormat(numberLocale).format(liveOverview.platformRevenue)
    : '148.500.000'

  const revenueGrowth = liveOverview
    ? `${liveOverview.revenueGrowthRate >= 0 ? '+' : ''}${liveOverview.revenueGrowthRate}%`
    : '+22.4%'

  const pendingGrv = liveOverview ? String(liveOverview.pendingGrievancesCount) : '7'

  const urgentGrvText = liveOverview
    ? t('adminStatUrgentGrvText', { count: liveOverview.urgentGrievancesCount })
    : t('adminStatUrgentGrvText', { count: 3 })

  const reportedItemsVal = liveOverview ? String(liveOverview.reportedItemsCount) : '12'

  // Dynamic quick stats from live API with fallbacks
  const stats = [
    {
      id: 'users',
      label: t('adminStatTotalUsers'),
      value: totalUsersVal,
      subtext: userSubtext,
      growth: userGrowth,
      isPositive: true,
      icon: Users,
      color: 'text-blue-600 bg-blue-50 border-blue-100',
      link: '/admin/users',
    },
    {
      id: 'properties',
      label: t('adminStatHousesRooms'),
      value: totalHousesVal,
      subtext: propSubtext,
      growth: propGrowth,
      isPositive: true,
      icon: Building2,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-100',
      link: '/admin/boarding-houses',
    },
    {
      id: 'revenue',
      label: t('adminStatPlatformRevenue'),
      value: revenueVal,
      unit: '₫',
      subtext: t('adminStatRevenueSubtext'),
      growth: revenueGrowth,
      isPositive: true,
      icon: Wallet,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
      link: '/admin/analytics',
    },
    {
      id: 'grievances',
      label: t('adminStatPendingGrievances'),
      value: pendingGrv,
      subtext: urgentGrvText,
      growth: t('adminStatActionNeeded'),
      isPositive: false,
      icon: AlertTriangle,
      color: 'text-orange-600 bg-orange-50 border-orange-100',
      badge: liveOverview
        ? t('adminStatUrgentBadge', { count: liveOverview.urgentGrievancesCount })
        : t('adminStatUrgentBadge', { count: 3 }),
      link: '/admin/grievances',
    },
    {
      id: 'moderation',
      label: t('adminStatReportedItems'),
      value: reportedItemsVal,
      subtext: t('adminStatReportedSubtext'),
      growth: t('adminStatNeedsReview'),
      isPositive: false,
      icon: ShieldAlert,
      color: 'text-amber-600 bg-amber-50 border-amber-100',
      badge: t('adminStatItemsBadge', { count: reportedItemsVal }),
      link: '/admin/blogs',
    },
  ]

  // Urgent Grievances Quick Queue
  const urgentGrievances = [
    {
      id: 'GRV-1092',
      tenant: 'Nguyễn Thị Mai',
      tenantPhone: '0912.345.678',
      house: 'Dormio Sunrise (Phòng 302)',
      landlord: 'Trần Đức Nam',
      category: t('adminGrvCatDeposit'),
      priority: 'urgent',
      time: t('adminGrvTime25m'),
    },
    {
      id: 'GRV-1088',
      tenant: 'Lê Hoàng Phúc',
      tenantPhone: '0988.112.233',
      house: 'Ký túc xá Cao Lỗ (Phòng 104)',
      landlord: 'Võ Thị Bích',
      category: t('adminGrvCatPower'),
      priority: 'urgent',
      time: t('adminGrvTime1h'),
    },
    {
      id: 'GRV-1085',
      tenant: 'Phạm Hải Đăng',
      tenantPhone: '0909.876.543',
      house: 'Nhà trọ Thảo Điền Garden (Phòng 201)',
      landlord: 'Đặng Quốc Cường',
      category: t('adminGrvCatMisleading'),
      priority: 'high',
      time: t('adminGrvTime3h'),
    },
  ]

  // Flagged Listings Quick Queue
  const flaggedListings = [
    {
      id: 'LST-8904',
      title: t('adminLst1Title'),
      landlord: 'Lê Minh Tuấn',
      reason: t('adminLst1Reason'),
      reportsCount: 8,
      status: 'active',
      flaggedDate: t('adminLst1Date'),
    },
    {
      id: 'LST-8891',
      title: t('adminLst2Title'),
      landlord: 'Nguyễn Văn Hùng',
      reason: t('adminLst2Reason'),
      reportsCount: 4,
      status: 'active',
      flaggedDate: t('adminLst2Date'),
    },
    {
      id: 'LST-8876',
      title: t('adminLst3Title'),
      landlord: 'Phạm Thu Thảo',
      reason: t('adminLst3Reason'),
      reportsCount: 11,
      status: 'active',
      flaggedDate: t('adminLst3Date'),
    },
  ]

  return (
    <div className="space-y-8 pb-12">
      {/* Top Hero Banner & Title */}
      <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-zinc-950 via-zinc-900 to-zinc-950 border border-zinc-800/90 text-white p-6 sm:p-8 shadow-xl">
        {/* Ambient Decorative Glow */}
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

            <Text as="h1" variant="heading" size="2xl" weight="black" className="text-white sm:text-3xl tracking-tight">
              {t('adminPageTitle')}
            </Text>
            <Text as="p" size="sm" className="text-zinc-300 leading-relaxed max-w-2xl">
              {t('adminPageSubtitle')}
            </Text>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <Link
              href="/admin/notifications"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Megaphone className="w-4 h-4 text-orange-400" />
              <span>{t('adminActionSendBroadcast')}</span>
            </Link>
            <Link
              href="/admin/blogs"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs border border-white/15 transition-all shadow-xs cursor-pointer whitespace-nowrap"
            >
              <Newspaper className="w-4 h-4 text-amber-400" />
              <span>{t('adminActionNewBlog')}</span>
            </Link>
            <Link
              href="/admin/analytics"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-all shadow-md shadow-orange-600/30 cursor-pointer whitespace-nowrap"
            >
              <TrendingUp className="w-4 h-4" />
              <span>{t('adminActionFullAnalytics')}</span>
            </Link>
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards - Bulletproof against text-dropping & overflow */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-5">
        {stats.map(item => {
          const Icon = item.icon
          return (
            <div
              key={item.id}
              className="group relative bg-white rounded-2xl border border-zinc-200/90 p-5 shadow-xs hover:shadow-md hover:border-orange-300/80 transition-all duration-200 flex flex-col justify-between"
            >
              <div>
                {/* Top row: Icon on left, Growth/Status badge on right */}
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

                {/* Card Title Label (Full width, no truncation) */}
                <Text
                  as="span"
                  size="xs"
                  weight="bold"
                  color="secondary"
                  className="block uppercase tracking-wider mb-1.5"
                >
                  {item.label}
                </Text>

                {/* Main Metric Value (Bound inline with unit, NEVER drops lines) */}
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

                {/* Informative Subtext */}
                <Text as="p" size="2xs" color="secondary" className="mt-2.5 leading-relaxed font-medium">
                  {item.subtext}
                </Text>
              </div>

              {/* Card Footer Link */}
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
                  <Text as="h2" variant="heading" size="base" weight="black" className="text-zinc-900">
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
                <span>{t('adminViewAllWithCount', { count: 7 })}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {urgentGrievances.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-orange-50/30 hover:border-orange-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-orange-600 text-white uppercase tracking-wider">
                        {item.priority === 'urgent'
                          ? t('adminPriorityUrgent')
                          : t('adminPriorityHigh')}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-600">{item.id}</span>
                      <span className="text-[11px] text-zinc-400">• {item.time}</span>
                    </div>
                    <Text as="h3" size="sm" weight="bold" className="text-zinc-900 leading-snug">
                      {item.category}
                    </Text>
                    <p className="text-xs text-zinc-600 leading-relaxed">
                      <span className="font-semibold text-zinc-800">{item.tenant}</span> (
                      {item.tenantPhone}) <span className="text-zinc-400">→</span>{' '}
                      <span className="text-zinc-700 font-medium">{item.house}</span>
                    </p>
                  </div>

                  <Link
                    href="/admin/grievances"
                    className="shrink-0 px-4 py-2 rounded-xl bg-white hover:bg-orange-600 text-orange-700 hover:text-white border border-orange-200/90 hover:border-orange-600 text-xs font-bold transition-all shadow-2xs text-center cursor-pointer whitespace-nowrap"
                  >
                    {t('adminResolveNow')}
                  </Link>
                </div>
              ))}
            </div>
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
                  <Text as="h2" variant="heading" size="base" weight="black" className="text-zinc-900">
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
                <span>{t('adminInspectWithCount', { count: 12 })}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {flaggedListings.map(item => (
                <div
                  key={item.id}
                  className="p-4 rounded-2xl bg-zinc-50/70 border border-zinc-200/80 hover:bg-amber-50/30 hover:border-amber-200 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3.5"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-amber-100 text-amber-800 border border-amber-200 uppercase">
                        {t('adminReportsCountBadge', { count: item.reportsCount })}
                      </span>
                      <span className="text-xs font-mono font-bold text-zinc-600">{item.id}</span>
                      <span className="text-[11px] text-zinc-400">• {item.flaggedDate}</span>
                    </div>
                    <Text as="h3" size="sm" weight="bold" className="text-zinc-900 leading-snug">
                      {item.title}
                    </Text>
                    <div className="inline-flex items-center gap-1.5 text-xs text-amber-800 bg-amber-50 border border-amber-200/70 px-2.5 py-1 rounded-lg font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="line-clamp-1">{item.reason}</span>
                    </div>
                  </div>

                  <Link
                    href="/admin/blogs"
                    className="shrink-0 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-xs font-bold transition-all shadow-2xs hover:shadow-md text-center cursor-pointer whitespace-nowrap"
                  >
                    {t('adminInspectAndLock')}
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Direct Access to Admin Submodules */}
      <div className="bg-zinc-100/80 rounded-3xl p-6 sm:p-7 border border-zinc-200/80">
        <div className="flex items-center justify-between mb-4">
          <Text as="h2" size="xs" weight="black" color="secondary" className="uppercase tracking-wider sm:text-sm">
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
              <Text as="h3" size="sm" weight="bold" className="text-zinc-900 group-hover:text-orange-600 transition-colors">
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
              <Text as="h3" size="sm" weight="bold" className="text-zinc-900 group-hover:text-orange-600 transition-colors">
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
              <Text as="h3" size="sm" weight="bold" className="text-zinc-900 group-hover:text-orange-600 transition-colors">
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
              <Text as="h3" size="sm" weight="bold" className="text-zinc-900 group-hover:text-orange-600 transition-colors">
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
              <Text as="h3" size="sm" weight="bold" className="text-zinc-900 group-hover:text-orange-600 transition-colors">
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
