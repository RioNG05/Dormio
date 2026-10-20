'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building,
  Users,
  FileText,
  TrendingUp,
  Plus,
  Building2,
  Sparkles,
  CheckCircle2,
  Wrench,
  QrCode,
  Clock,
  Shield,
  Home,
  BarChart2,
  ChevronRight,
  Inbox,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { formatCurrency, formatVND } from '@/utils'
import { Button, Text } from '@/components/ui'
import { LandlordPageHeader } from '@/components/landlord'
import { cn } from '@/lib/utils'
import {
  getBoardingHouseOverview,
  type BoardingHouseOverview,
} from '@/services/boarding-house.service'

export default function LandlordDashboardPage() {
  const router = useRouter()
  const { buildings, isBuildingsLoading, activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { currentLocale } = useLanguage()

  const [overview, setOverview] = useState<BoardingHouseOverview | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [rangeMode, setRangeMode] = useState<'6m' | '12m'>('6m')
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const [speedDialOpen, setSpeedDialOpen] = useState(false)

  // Gated access. Users with 0 properties must be directed to /landlord/setup
  useEffect(() => {
    if (!isBuildingsLoading && buildings.length === 0) {
      router.replace('/landlord/setup')
    }
  }, [isBuildingsLoading, buildings.length, router])

  const fetchOverview = useCallback(async (buildingId: string) => {
    if (!buildingId) return
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(buildingId)) return

    try {
      setIsLoading(true)
      const data = await getBoardingHouseOverview(buildingId)
      setOverview(data)
    } catch {
      // Fallback: If API fails or building has no records yet, keep null or empty
      setOverview(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (activeBuilding?.id) {
      fetchOverview(activeBuilding.id)
    }
  }, [activeBuilding?.id, fetchOverview])

  // Derived revenue chart calculation
  const chartData = useMemo(() => {
    if (!overview?.revenueChart || overview.revenueChart.length === 0) return []
    const raw = overview.revenueChart
    const sliceCount = rangeMode === '6m' ? 6 : 12
    const sliced = raw.slice(-sliceCount)

    const maxVal = Math.max(...sliced.map(d => d.val), 10)
    const count = sliced.length

    return sliced.map((pt, i) => {
      const x = count > 1 ? (i / (count - 1)) * 600 : 300
      const y = 90 - (pt.val / maxVal) * 75 // leave margin top and bottom
      return {
        ...pt,
        x,
        y,
      }
    })
  }, [overview?.revenueChart, rangeMode])

  const linePathD = useMemo(() => {
    if (chartData.length === 0) return ''
    return chartData.map((pt, i) => `${i === 0 ? 'M' : 'L'} ${pt.x},${pt.y}`).join(' ')
  }, [chartData])

  // Gating check: if no buildings yet, show loading spinner while redirecting to /landlord/setup
  if (isBuildingsLoading || buildings.length === 0 || !activeBuilding?.id) {
    return (
      <div className="py-24 text-center text-muted space-y-3">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
        <Text size="xs" weight="semibold" color="subtle">
          {buildings.length === 0
            ? t('landlordOverviewRedirectingSetup')
            : t('landlordOverviewLoadingOverview')}
        </Text>
      </div>
    )
  }

  // ─── SCENARIO 2: LANDLORD WITH AT LEAST 1 PROPERTY ──────────────────────────
  const rooms = overview?.rooms ?? {
    totalRooms: activeBuilding.totalRooms || 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    depositRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: '0%',
  }

  const financial = overview?.financial ?? {
    currentMonthRevenue: '0.00',
    unpaidDebt: '0.00',
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
  }

  const collection = overview?.collectionStatus ?? {
    paidCount: 0,
    paidAmount: '0.00',
    unpaidCount: 0,
    unpaidAmount: '0.00',
    overdueCount: 0,
    overdueAmount: '0.00',
    totalBilledAmount: '0.00',
    collectionRate: '0%',
  }

  const depositNotifications = overview?.depositNotifications ?? []
  const maintenanceRequests = overview?.maintenanceRequests ?? []
  const expiringContracts = overview?.expiringContracts ?? []

  return (
    <div className="flex flex-col gap-6 pb-16 animate-in fade-in duration-500">
      {/* Top Header Title & Create Building Button */}
      <LandlordPageHeader
        title={t('landlordOverviewHeaderTitle', { name: activeBuilding.name })}
        subtitle={activeBuilding.address || t('landlordOverviewNoAddress')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/landlord/setup')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('landlordOverviewBtnCreateHouse')}
          </Button>
        }
      />

      {isLoading && !overview ? (
        <div className="py-16 text-center text-muted space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2AC1BC]" />
          <Text size="xs" weight="semibold" color="subtle">{t('landlordOverviewLoadingOverview')}</Text>
        </div>
      ) : (
        <>
          {/* 5 COLOR-CODED ROOM METRIC CARDS */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {/* 1. TỔNG SỐ PHÒNG */}
            <div className="px-3.5 py-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <Text as="span" variant="overline" size="3xs" weight="black" className="text-rose-600 tracking-wider block">
                  {t('landlordOverviewStatTotalRooms')}
                </Text>
                <Text as="div" size="lg" weight="black" className="text-rose-600 leading-tight mt-0.5">
                  {rooms.totalRooms} {t('landlordOverviewRoomUnitCapital')}
                </Text>
                <Text as="span" size="3xs" weight="bold" className="text-rose-500/80 block">
                  {t('landlordOverviewStatOccupancy', { rate: rooms.occupancyRate })}
                </Text>
              </div>
              <Building className="w-5 h-5 text-rose-500 shrink-0 opacity-80" />
            </div>

            {/* 2. OCCUPIED ROOMS */}
            <div className="px-3.5 py-3 bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <Text as="span" variant="overline" size="3xs" weight="black" color="brand" className="tracking-wider block">
                  {t('landlordOverviewStatOccupied')}
                </Text>
                <Text as="div" size="lg" weight="black" color="brand" className="leading-tight mt-0.5">
                  {rooms.occupiedRooms} {t('landlordOverviewRoomUnitCapital')}
                </Text>
                <Text as="span" size="3xs" weight="bold" className="text-[#2AC1BC]/80 block">
                  {rooms.occupiedRooms > 0
                    ? t('landlordOverviewStatActiveContract')
                    : t('landlordOverviewNoTenant')}
                </Text>
              </div>
              <Users className="w-5 h-5 text-[#2AC1BC] shrink-0 opacity-80" />
            </div>

            {/* 3. PHÒNG TRỐNG */}
            <div className="px-3.5 py-3 bg-blue-500/10 border border-blue-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <Text as="span" variant="overline" size="3xs" weight="black" className="text-blue-600 tracking-wider block">
                  {t('landlordOverviewStatVacant')}
                </Text>
                <Text as="div" size="lg" weight="black" className="text-blue-600 leading-tight mt-0.5">
                  {rooms.vacantRooms} {t('landlordOverviewRoomUnitCapital')}
                </Text>
                <Text as="span" size="3xs" weight="bold" className="text-blue-500/80 block">
                  {t('landlordOverviewStatReady')}
                </Text>
              </div>
              <Home className="w-5 h-5 text-blue-500 shrink-0 opacity-80" />
            </div>

            {/* 4. BẢO TRÌ */}
            <div className="px-3.5 py-3 bg-[#FF6B35]/10 border border-[#FF6B35]/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs">
              <div>
                <Text as="span" variant="overline" size="3xs" weight="black" className="text-[#FF6B35] tracking-wider block">
                  {t('landlordOverviewStatMaintenance')}
                </Text>
                <Text as="div" size="lg" weight="black" className="text-[#FF6B35] leading-tight mt-0.5">
                  {rooms.maintenanceRooms} {t('landlordOverviewRoomUnitCapital')}
                </Text>
                <Text as="span" size="3xs" weight="bold" className="text-[#FF6B35]/80 block">
                  {rooms.maintenanceRooms > 0
                    ? t('landlordOverviewHandlingIssues')
                    : t('landlordOverviewNoIssues')}
                </Text>
              </div>
              <Wrench className="w-5 h-5 text-[#FF6B35] shrink-0 opacity-80" />
            </div>

            {/* 5. RESERVED DEPOSITS */}
            <div className="px-3.5 py-3 bg-purple-500/10 border border-purple-500/30 rounded-2xl flex items-center justify-between transition-all hover:shadow-xs col-span-2 sm:col-span-1">
              <div>
                <Text as="span" variant="overline" size="3xs" weight="black" className="text-purple-600 tracking-wider block">
                  {t('landlordOverviewStatDeposit')}
                </Text>
                <Text as="div" size="lg" weight="black" className="text-purple-600 leading-tight mt-0.5">
                  {rooms.depositRooms} {t('landlordOverviewRoomUnitCapital')}
                </Text>
                <Text as="span" size="3xs" weight="bold" className="text-purple-500/80 block">
                  {rooms.depositRooms > 0
                    ? t('landlordOverviewHoldingDeposit')
                    : t('landlordOverviewNoDeposit')}
                </Text>
              </div>
              <Shield className="w-5 h-5 text-purple-500 shrink-0 opacity-80" />
            </div>
          </div>

          {/* 2-COLUMN LAYOUT: REVENUE CHART & CASHFLOW KPI */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* REVENUE LINE CHART (2/3 WIDTH) */}
            <div className="lg:col-span-2 bg-card rounded-3xl p-5 border border-line shadow-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-2.5">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-4 h-4 text-[#2AC1BC]" />
                    <Text as="h2" variant="heading" size="sm" weight="black" className="sm:text-base">
                      {t('landlordOverviewMonthlyRevenueTitle')}
                    </Text>
                    <div className="flex items-center bg-card-hover p-0.5 rounded-lg border border-line ml-1">
                      <Button
                        type="button"
                        variant={rangeMode === '6m' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setRangeMode('6m')}
                      >
                        {t('landlordOverviewRange6m')}
                      </Button>
                      <Button
                        type="button"
                        variant={rangeMode === '12m' ? 'primary' : 'ghost'}
                        size="sm"
                        onClick={() => setRangeMode('12m')}
                      >
                        {t('landlordOverviewRange12m')}
                      </Button>
                    </div>
                  </div>
                  <Text size="xs" color="secondary" weight="medium">
                    {t('landlordOverviewCashflowFluctuation', { name: activeBuilding.name })}
                  </Text>
                </div>

                <div className="text-left sm:text-right">
                  <Text as="span" variant="overline" size="3xs" weight="extrabold" color="subtle" className="block">
                    {t('landlordOverviewThisMonth')}
                  </Text>
                  <Text as="span" size="base" weight="black" color="brand" className="tracking-tight">
                    {formatCurrency(Number(financial.currentMonthRevenue) || 0, currentLocale)}
                  </Text>
                </div>
              </div>

              {/* Chart Content or Empty State */}
              {chartData.length === 0 ? (
                <div className="py-14 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-card-hover flex items-center justify-center text-muted">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <Text size="xs" weight="bold" color="default">
                    {t('landlordOverviewNoRevenueData')}
                  </Text>
                  <Text size="2xs" color="subtle" className="max-w-xs">
                    {t('landlordOverviewNoRevenueDataDesc')}
                  </Text>
                </div>
              ) : (
                <div className="pt-1">
                  <div className="flex gap-2.5">
                    {/* SVG Canvas Container */}
                    <div className="flex-1 space-y-1.5 relative">
                      {hoveredIndex !== null && chartData[hoveredIndex] && (
                        <div
                          className="absolute z-20 -top-8 bg-zinc-900/95 backdrop-blur-md text-white px-3 py-1.5 rounded-xl text-xs shadow-xl border border-white/20 transition-all duration-150 animate-in fade-in zoom-in-95 pointer-events-none"
                          style={{
                            left: `${Math.max(12, Math.min(88, (chartData[hoveredIndex].x / 600) * 100))}%`,
                            transform: 'translateX(-50%)',
                          }}
                        >
                          <Text size="3xs" weight="bold" color="subtle" uppercase className="tracking-wider">
                            {t('landlordOverviewTooltipMonth', {
                              month: chartData[hoveredIndex].month,
                            })}
                          </Text>
                          <Text size="xs" weight="black" color="brand">
                            {formatCurrency(
                              Number(chartData[hoveredIndex].fullAmount) || 0,
                              currentLocale,
                            )}
                          </Text>
                        </div>
                      )}

                      <div className="h-36 w-full relative flex items-end">
                        <svg
                          className="w-full h-full overflow-visible"
                          viewBox="0 0 600 100"
                          preserveAspectRatio="none"
                        >
                          <line
                            x1="0"
                            y1="15"
                            x2="600"
                            y2="15"
                            stroke="#f1f5f9"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                          />
                          <line
                            x1="0"
                            y1="50"
                            x2="600"
                            y2="50"
                            stroke="#f1f5f9"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                          />
                          <line
                            x1="0"
                            y1="85"
                            x2="600"
                            y2="85"
                            stroke="#f1f5f9"
                            strokeDasharray="3 3"
                            strokeWidth="1"
                          />
                          <path
                            d={linePathD}
                            fill="none"
                            stroke="#2AC1BC"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          {chartData.map((pt, i) => (
                            <circle
                              key={i}
                              cx={pt.x}
                              cy={pt.y}
                              r={hoveredIndex === i ? 4.5 : 3}
                              fill={hoveredIndex === i ? '#2AC1BC' : '#ffffff'}
                              stroke="#2AC1BC"
                              strokeWidth={2}
                              className="cursor-pointer transition-all"
                              onMouseEnter={() => setHoveredIndex(i)}
                              onMouseLeave={() => setHoveredIndex(null)}
                            />
                          ))}
                        </svg>
                      </div>

                      {/* Month Labels */}
                      <div className="flex justify-between items-center text-xs font-bold text-muted pt-1.5 border-t border-line">
                        {chartData.map((d, i) => (
                          <div key={i} className="text-center">
                            <Text as="span" size="3xs" weight="bold" className="block text-muted">
                              {d.month}
                            </Text>
                            <Text as="span" size="3xs" weight="bold" color="brand" className="block text-[8px]">
                              {d.val}M
                            </Text>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* FINANCIAL SUMMARY KPI CARD (1/3 WIDTH) */}
            <div className="bg-card rounded-3xl p-5 border border-line shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between border-b border-line pb-2.5">
                  <Text as="span" size="xs" weight="black" color="default" className="flex items-center gap-1.5">
                    <BarChart2 className="w-4 h-4 text-[#2AC1BC]" />{' '}
                    {t('landlordOverviewCashflowOverview')}
                  </Text>
                  <Text as="span" variant="badge" size="3xs" weight="black" color="brand" className="px-2 py-0.5 bg-[#2AC1BC]/10 rounded-full">
                    {t('landlordOverviewCollectionRate', { rate: collection.collectionRate })}
                  </Text>
                </div>

                <div className="space-y-3 mt-3">
                  <div className="p-3.5 bg-[#2AC1BC]/5 rounded-2xl border border-[#2AC1BC]/15 space-y-1">
                    <Text as="span" variant="overline" size="3xs" weight="extrabold" color="subtle" className="block">
                      {t('landlordOverviewCurrentMonthRevenue')}
                    </Text>
                    <Text as="div" size="xl" weight="black" color="brand">
                      {formatCurrency(Number(financial.currentMonthRevenue) || 0, currentLocale)}
                    </Text>
                    <Text as="span" size="3xs" weight="bold" color="success" className="block">
                      {financial.paidInvoicesCount > 0
                        ? t('landlordOverviewPaidInvoicesCount', {
                          count: financial.paidInvoicesCount,
                        })
                        : t('landlordOverviewNoPaidInvoicesThisMonth')}
                    </Text>
                  </div>

                  <div className="p-3.5 bg-rose-500/5 rounded-2xl border border-rose-500/15 space-y-1">
                    <Text as="span" variant="overline" size="3xs" weight="extrabold" color="subtle" className="block">
                      {t('landlordOverviewUnpaidDebt')}
                    </Text>
                    <Text as="div" size="xl" weight="black" color="danger">
                      {formatCurrency(Number(financial.unpaidDebt) || 0, currentLocale)}
                    </Text>
                    <Text as="span" size="3xs" weight="bold" color="secondary" className="block">
                      {financial.unpaidInvoicesCount > 0
                        ? t('landlordOverviewUnpaidInvoicesCount', {
                          count: financial.unpaidInvoicesCount,
                        })
                        : t('landlordOverviewNoOverdueDebt')}
                    </Text>
                  </div>
                </div>
              </div>

              <Link href="/landlord/invoices" className="block pt-2 border-t border-line">
                <Text as="span" size="xs" weight="bold" color="brand" className="hover:underline flex items-center justify-between">
                  {t('landlordOverviewViewInvoicesList')}
                </Text>
              </Link>
            </div>
          </div>

          {/* 3 NOTIFICATION / DETAIL CARDS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* 1. DEPOSIT NOTIFICATIONS */}
            <div
              onClick={() => router.push('/landlord/deposits')}
              className="bg-card rounded-3xl p-5 border border-line shadow-xs hover:border-purple-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-purple-600 shrink-0" />
                  <Text as="h3" variant="heading" size="sm" weight="black" className="group-hover:text-purple-600 transition-colors">
                    {t('landlordOverviewDepositNotifTitle')}
                  </Text>
                </div>
                <Text as="span" variant="badge" size="3xs" weight="black" className="px-2 py-0.5 bg-purple-500/10 text-purple-600 rounded-full">
                  {t('landlordOverviewNewCount', { count: depositNotifications.length })}
                </Text>
              </div>

              {depositNotifications.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-deposit-soft text-purple-400 flex items-center justify-center mx-auto">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <Text size="xs" weight="bold" color="default">
                    {t('landlordOverviewNoDeposits')}
                  </Text>
                  <Text size="2xs" color="subtle">
                    {t('landlordOverviewNoDepositsDesc')}
                  </Text>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {depositNotifications.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-purple-500/5 hover:bg-purple-500/10 rounded-2xl border border-purple-500/15 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Text as="span" weight="black" color="default">
                            {item.room} — {item.tenant}
                          </Text>
                        </div>
                        <Text as="span" size="3xs" weight="bold" className="text-purple-600 block">
                          {item.type}: {formatCurrency(item.amount, currentLocale)}
                        </Text>
                      </div>
                      <ChevronRight className="w-4 h-4 text-purple-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-line">
                <Text as="span" size="xs" weight="bold" className="text-purple-600">
                  {t('landlordOverviewViewAllDepositsSimple')}
                </Text>
              </div>
            </div>

            {/* 2. YÊU CẦU BẢO TRÌ */}
            <div
              onClick={() => router.push('/landlord/complaints')}
              className="bg-card rounded-3xl p-5 border border-line shadow-xs hover:border-[#FF6B35]/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4 h-4 text-[#FF6B35] shrink-0" />
                  <Text as="h3" variant="heading" size="sm" weight="black" className="group-hover:text-[#FF6B35] transition-colors">
                    {t('landlordOverviewMaintRequestTitle')}
                  </Text>
                </div>
                <Text as="span" variant="badge" size="3xs" weight="black" color="orange" className="px-2 py-0.5 bg-[#FF6B35]/10 rounded-full">
                  {t('landlordOverviewIssuesCount', { count: maintenanceRequests.length })}
                </Text>
              </div>

              {maintenanceRequests.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-warning-soft text-amber-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <Text size="xs" weight="bold" color="default">
                    {t('landlordOverviewNoMaintenance')}
                  </Text>
                  <Text size="2xs" color="subtle">
                    {t('landlordOverviewNoMaintenanceDesc')}
                  </Text>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {maintenanceRequests.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-[#FF6B35]/5 hover:bg-[#FF6B35]/10 rounded-2xl border border-[#FF6B35]/15 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Text as="span" weight="black" color="default">
                            {item.room} — {item.issue}
                          </Text>
                        </div>
                        <Text
                          as="span"
                          size="3xs"
                          weight="extrabold"
                          color={
                            item.priority === 'high'
                              ? 'danger'
                              : item.priority === 'medium'
                                ? 'warning'
                                : 'success'
                          }
                          className="block"
                        >
                          {item.priority === 'high'
                            ? t('landlordOverviewPrioHigh')
                            : item.priority === 'medium'
                              ? t('landlordOverviewPrioMedium')
                              : t('landlordOverviewPrioLow')}
                        </Text>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#FF6B35] group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-line">
                <Text as="span" size="xs" weight="bold" color="orange">
                  {t('landlordOverviewViewAllMaintSimple')}
                </Text>
              </div>
            </div>

            {/* 3. CONTRACT RENEWALS */}
            <div
              onClick={() => router.push('/landlord/contracts')}
              className="bg-card rounded-3xl p-5 border border-line shadow-xs hover:border-amber-500/40 transition-all cursor-pointer group space-y-3"
            >
              <div className="flex items-center justify-between border-b border-line pb-2.5">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500 shrink-0" />
                  <Text as="h3" variant="heading" size="sm" weight="black" className="group-hover:text-amber-600 transition-colors">
                    {t('landlordOverviewContractExtensionTitle')}
                  </Text>
                </div>
                <Text as="span" variant="badge" size="3xs" weight="black" color="warning" className="px-2 py-0.5 bg-amber-500/10 rounded-full">
                  {t('landlordOverviewWarningsCount', { count: expiringContracts.length })}
                </Text>
              </div>

              {expiringContracts.length === 0 ? (
                <div className="py-10 text-center space-y-2">
                  <div className="w-10 h-10 rounded-2xl bg-warning-soft text-amber-500 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <Text size="xs" weight="bold" color="default">
                    {t('landlordOverviewNoExpiringContracts')}
                  </Text>
                  <Text size="2xs" color="subtle">
                    {t('landlordOverviewNoExpiringContractsDesc')}
                  </Text>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto space-y-2 pr-1">
                  {expiringContracts.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-amber-500/5 hover:bg-amber-500/10 rounded-2xl border border-amber-500/15 flex items-center justify-between text-xs transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <Text as="span" weight="black" color="default">
                            {item.room} — {item.tenant}
                          </Text>
                        </div>
                        <Text as="span" size="3xs" weight="bold" color="warning" className="block">
                          {t('landlordOverviewDaysLeftText', {
                            days: item.daysLeft,
                            date: item.endDate,
                          })}
                        </Text>
                      </div>
                      <ChevronRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1 border-t border-line">
                <Text as="span" size="xs" weight="bold" color="warning">
                  {t('landlordOverviewViewAllContractsSimple')}
                </Text>
              </div>
            </div>
          </div>
        </>
      )}

      {/* FLOATING QUICK ACTION SPEED DIAL BAR */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {speedDialOpen && (
          <div className="flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-5 duration-200">
            <Button rounded="full"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/landlord/rooms')}
              className="group"
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordOverviewAddRoomBtn')}
              </Text>
              <span className="p-1 bg-[#2AC1BC]/10 text-[#2AC1BC] group-hover:bg-white/20 group-hover:text-white rounded-full">
                <Plus className="w-3.5 h-3.5" />
              </span>
            </Button>

            <Button rounded="full"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/landlord/contracts')}
              className="group"
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordOverviewCreatePdfContractBtn')}
              </Text>
              <span className="p-1 bg-amber-500/10 text-amber-600 group-hover:bg-white/20 group-hover:text-white rounded-full">
                <FileText className="w-3.5 h-3.5" />
              </span>
            </Button>

            <Button rounded="full"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => router.push('/landlord/invoices')}
              className="group"
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordOverviewCreateVietqrInvoiceBtn')}
              </Text>
              <span className="p-1 bg-emerald-500/10 text-emerald-600 group-hover:bg-white/20 group-hover:text-white rounded-full">
                <QrCode className="w-3.5 h-3.5" />
              </span>
            </Button>
          </div>
        )}

        <Button
          type="button"
          variant={speedDialOpen ? 'dark' : 'primary'}
          size="icon-lg"
          rounded="full"
          onClick={() => setSpeedDialOpen(!speedDialOpen)}
          className={speedDialOpen ? 'rotate-45' : ''}
          title={t('landlordOverviewQuickActions')}
        >
          <Plus className="w-6 h-6" />
        </Button>
      </div>
    </div>
  )
}
