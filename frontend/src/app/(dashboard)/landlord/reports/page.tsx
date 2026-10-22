'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import {
  TrendingUp,
  Users,
  DollarSign,
  FileSpreadsheet,
  Calendar,
  Building2,
  ChevronDown,
  CheckCircle2,
  ArrowUpRight,
  ShieldCheck,
  MessageSquare,
  Eye,
  Sparkles,
  Flame,
  Rocket,
  Award,
  Clock,
  Compass,
  Lightbulb,
  Zap,
  HelpCircle,
  Share2,
  MapPin,
  CheckCircle,
  BarChart3,
  PieChart,
  Home,
  Loader2,
  Wrench,
  Inbox,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertTriangle,
  RefreshCw,
  X,
  ArrowDownRight,
  Layers,
  Target,
} from 'lucide-react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  BarChart,
  Bar,
} from 'recharts'
import { useAuth } from '@/context/AuthContext'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { formatCurrency, formatVND } from '@/utils'
import { Button, SelectInput, NumberInput, Pagination, ViewModeToggle, TableRow } from '@/components/ui'
import { LandlordPageHeader } from '@/components/landlord'
import {
  getBoardingHouseOverview,
  getMultiPropertyOverview,
  generateMultiPropertyAiStrategy,
  type BoardingHouseOverview,
  type MultiPropertyOverview,
  type MultiPropertyBreakdown,
  type AiStrategyResponse,
} from '@/services/boarding-house.service'

export default function ReportsPage() {
  const { activeBuilding, buildings, selectBuilding } = useAuth()
  const { locale } = useLanguage()
  const t = useTranslations('landlord')
  const isEn = locale === 'en'

  const [mounted, setMounted] = useState(false)

  // Mode: "portfolio" ( Multi-Property) or "single" ( Single-Property)
  const [reportMode, setReportMode] = useState<'portfolio' | 'single'>('portfolio')

  // Single Property State
  const [singleOverview, setSingleOverview] = useState<BoardingHouseOverview | null>(null)
  const [isSingleLoading, setIsSingleLoading] = useState(false)

  // Multi-Property Portfolio State
  const [portfolioOverview, setPortfolioOverview] = useState<MultiPropertyOverview | null>(null)
  const [isPortfolioLoading, setIsPortfolioLoading] = useState(false)

  // AI Marketing Strategy State
  const [isAiGenerating, setIsAiGenerating] = useState(false)
  const [aiStrategy, setAiStrategy] = useState<AiStrategyResponse | null>(null)
  const [showAiModal, setShowAiModal] = useState(false)

  // Rule #9: Grid & Table parallel view mode for Property Comparison (Default: grid)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6)

  // Toast feedback state
  const [toast, setToast] = useState<{
    message: string
    type: 'success' | 'info' | 'error'
  } | null>(null)
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  // Fetch Single Property Overview
  const fetchSingleOverview = useCallback(async (buildingId: string) => {
    if (!buildingId) return
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(buildingId)) return

    try {
      setIsSingleLoading(true)
      const data = await getBoardingHouseOverview(buildingId)
      setSingleOverview(data)
    } catch {
      setSingleOverview(null)
    } finally {
      setIsSingleLoading(false)
    }
  }, [])

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  // Fetch Multi-Property Portfolio Overview
  const fetchPortfolioOverview = useCallback(async () => {
    try {
      setIsPortfolioLoading(true)
      const data = await getMultiPropertyOverview()
      setPortfolioOverview(data)
    } catch {
      setPortfolioOverview(null)
      showToast(tRef.current('landlordReportsToastFetchError'), 'error')
    } finally {
      setIsPortfolioLoading(false)
    }
  }, [])

  useEffect(() => {
    setMounted(true)
    fetchPortfolioOverview()
  }, [fetchPortfolioOverview])

  useEffect(() => {
    if (activeBuilding?.id) {
      fetchSingleOverview(activeBuilding.id)
    }
  }, [activeBuilding?.id, fetchSingleOverview])

  // Handle AI Marketing Strategy Generation
  const handleGenerateAiStrategy = async () => {
    try {
      setIsAiGenerating(true)
      const res = await generateMultiPropertyAiStrategy()
      setAiStrategy(res)
      setShowAiModal(true)
      showToast(t('landlordReportsToastAiSuccess'), 'success')
    } catch (err: any) {
      showToast(err?.message || t('landlordReportsToastAiError'), 'error')
    } finally {
      setIsAiGenerating(false)
    }
  }

  // Pagination for Properties Breakdown (Rule #9)
  const propertiesList = portfolioOverview?.propertiesBreakdown ?? []
  const totalItems = propertiesList.length
  const displayedProperties = useMemo(() => {
    const start = (page - 1) * pageSize
    return propertiesList.slice(start, start + pageSize)
  }, [propertiesList, page, pageSize])

  // Export CSV Data
  const handleExportCsv = () => {
    if (reportMode === 'portfolio' && portfolioOverview) {
      const headers = [
        t('landlordReportsCsvId'),
        t('landlordReportsCsvName'),
        t('landlordReportsCsvAddress'),
        t('landlordReportsCsvTotalRooms'),
        t('landlordReportsCsvOccupied'),
        t('landlordReportsCsvVacant'),
        t('landlordReportsCsvOccupancyRate'),
        t('landlordReportsCsvRevenue'),
        t('landlordReportsCsvExpenses'),
        t('landlordReportsCsvNetProfit'),
        t('landlordReportsCsvDebt'),
        t('landlordReportsCsvExpiring'),
      ]
      const rows = (portfolioOverview.propertiesBreakdown ?? []).map(p => [
        `"${p.id}"`,
        `"${p.name}"`,
        `"${p.address}"`,
        p.totalRooms,
        p.occupiedRooms,
        p.vacantRooms,
        `"${p.occupancyRate}"`,
        p.currentMonthRevenue,
        p.currentMonthExpenses,
        p.netProfit,
        p.unpaidDebt,
        p.expiringContractsCount,
      ])

      const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.setAttribute('href', url)
      link.setAttribute(
        'download',
        `Bao_Cao_Chuoi_Nha_Tro_${new Date().toISOString().slice(0, 10)}.csv`,
      )
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showToast(t('landlordReportsExportSuccess'))
    } else if (singleOverview) {
      showToast(t('landlordReportsExportSingleStarting'))
    }
  }

  if (!mounted) return null

  // Single Property Stats
  const singleRooms = singleOverview?.rooms ?? {
    totalRooms: activeBuilding?.totalRooms || 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    depositRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: '0%',
  }

  const singleFinancial = singleOverview?.financial ?? {
    currentMonthRevenue: '0.00',
    unpaidDebt: '0.00',
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
  }

  const singleCollection = singleOverview?.collectionStatus ?? {
    paidCount: 0,
    paidAmount: '0.00',
    unpaidCount: 0,
    unpaidAmount: '0.00',
    overdueCount: 0,
    overdueAmount: '0.00',
    totalBilledAmount: '0.00',
    collectionRate: '0%',
  }

  // Multi-Property Portfolio Summary
  const portfolioSummary = portfolioOverview?.portfolioSummary ?? {
    totalProperties: 0,
    totalRooms: 0,
    occupiedRooms: 0,
    vacantRooms: 0,
    depositRooms: 0,
    maintenanceRooms: 0,
    occupancyRate: '0%',
    currentMonthRevenue: '0.00',
    currentMonthExpenses: '0.00',
    netProfit: '0.00',
    unpaidDebt: '0.00',
    unpaidInvoicesCount: 0,
    paidInvoicesCount: 0,
    collectionRate: '0%',
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-70 bg-zinc-900 text-white px-5 py-3 rounded-2xl shadow-2xl border border-zinc-700 flex items-center gap-3 animate-in slide-in-from-bottom-3 duration-200">
          <CheckCircle2 className="w-5 h-5 text-primary" />
          <span className="text-xs sm:text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Header Bar */}
      <LandlordPageHeader
        title={t('landlordReportsTitle')}
        subtitle={
          reportMode === 'portfolio'
            ? t('landlordReportsSubtitlePortfolio')
            : activeBuilding?.address || t('landlordReportsSubtitleSingle')
        }
        actions={
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Mode Switcher Tabs */}
            <div className="bg-card-hover p-1 rounded-xl flex items-center gap-1 border border-line shadow-2xs">
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setReportMode('portfolio')}
                className="text-xs font-bold"
              >
                <Layers className="w-3.5 h-3.5 text-primary" />
                <span>{t('landlordReportsTabPortfolio')}</span>
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="md"
                onClick={() => setReportMode('single')}
                className="text-xs font-bold"
              >
                <Building2 className="w-3.5 h-3.5 text-vacant" />
                <span>{t('landlordReportsTabSingle')}</span>
              </Button>
            </div>

            {/* Dynamic Building Selector (When in single mode) */}
            {reportMode === 'single' && (
              <SelectInput
                value={activeBuilding?.id || ''}
                onChange={e => selectBuilding(e.target.value)}
                containerClassName="w-auto space-y-0"
                className="pl-8.5 pr-8 py-2 text-xs font-bold text-foreground/90 bg-card border border-line rounded-xl focus:outline-none focus:border-primary transition-colors cursor-pointer shadow-2xs"
                leftIcon={<Building2 className="w-3.5 h-3.5 text-muted" />}
                options={buildings.map(b => ({
                  value: b.id,
                  label: b.name,
                }))}
              />
            )}

            {/* AI Strategy Generation Button */}
            {reportMode === 'portfolio' && (
              <Button
                size="md"
                type="button"
                disabled={isAiGenerating}
                onClick={handleGenerateAiStrategy}
                className="from-primary to-teal-600 hover:opacity-95"
              >
                {isAiGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                )}
                <span>
                  {isAiGenerating ? t('landlordReportsAiAnalyzing') : t('landlordReportsAiButton')}
                </span>
              </Button>
            )}

            {/* Export Excel / CSV Button */}
            <Button
              size="md"
              type="button"
              variant="outline"
              onClick={handleExportCsv}
            >
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              <span>{t('landlordReportsExportCsv')}</span>
            </Button>
          </div>
        }
      />

      {/* ========================================================================= */}
      {/* MODE 1: MULTI-PROPERTY PORTFOLIO */}
      {/* ========================================================================= */}
      {reportMode === 'portfolio' && (
        <>
          {isPortfolioLoading ? (
            <div className="py-20 text-center text-muted space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs font-semibold">{t('landlordReportsPortfolioLoading')}</p>
            </div>
          ) : (
            <>
              {/* AI Marketing Strategy Banner Card */}
              <div className="bg-linear-to-r from-teal-900 via-zinc-900 to-indigo-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl relative overflow-hidden border border-teal-800/40">
                <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
                  <div className="space-y-1.5 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> {t('landlordReportsAiBannerBadge')}
                      </span>
                      <span className="text-xs text-zinc-300">
                        {t('landlordReportsAiBannerTag')}
                      </span>
                    </div>
                    <h3 className="text-lg sm:text-xl font-black tracking-tight text-white">
                      {t('landlordReportsAiBannerTitle')}
                    </h3>
                    <p className="text-xs text-zinc-300 leading-relaxed">
                      {t('landlordReportsAiBannerDesc', {
                        count: portfolioSummary.totalProperties,
                      })}
                    </p>
                  </div>
                  <Button size="xs" variant="dark"
                    type="button"
                    disabled={isAiGenerating}
                    onClick={handleGenerateAiStrategy}
                    className="shrink-0"
                  >
                    {isAiGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-primary" />
                        <span>{t('landlordReportsAiBannerCalculating')}</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>
                          {aiStrategy
                            ? t('landlordReportsAiBannerReview')
                            : t('landlordReportsAiBannerGenerate')}
                        </span>
                      </>
                    )}
                  </Button>
                </div>
              </div>

              {/* 4 Real Portfolio KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* KPI 1: Chain-wide Net Profit */}
                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsKpiNetProfit')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-success-soft text-success flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-success tracking-tight">
                      {formatCurrency(portfolioSummary.netProfit)}
                    </span>
                    <div className="flex items-center justify-between text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsKpiRevenueSub', {
                          amount: formatCurrency(portfolioSummary.currentMonthRevenue),
                        })}
                      </span>
                      <span>
                        {t('landlordReportsKpiExpensesSub', {
                          amount: formatCurrency(portfolioSummary.currentMonthExpenses),
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI 2: Chain-wide Occupancy Rate */}
                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsKpiOccupancyRate')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {portfolioSummary.occupancyRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsKpiOccupancyRoomsSub', {
                          occupied: portfolioSummary.occupiedRooms,
                          total: portfolioSummary.totalRooms,
                          properties: portfolioSummary.totalProperties,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI 3: Outstanding Debt */}
                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsKpiTotalDebt')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-danger-soft text-danger flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-danger tracking-tight">
                      {formatCurrency(portfolioSummary.unpaidDebt)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsKpiUnpaidInvoicesSub', {
                          count: portfolioSummary.unpaidInvoicesCount,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KPI 4: Collection Progress */}
                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsKpiCollectionRate')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-deposit-soft text-deposit flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-deposit tracking-tight">
                      {portfolioSummary.collectionRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsKpiPaidInvoicesSub', {
                          count: portfolioSummary.paidInvoicesCount,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Combined 6-Month Trends: Revenue & Occupancy */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 6-Month Revenue Trend */}
                <div className="bg-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <span>{t('landlordReportsRevenueChartTitle')}</span>
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {t('landlordReportsRevenueChartDesc')}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-primary/10 text-primary">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>

                  {!portfolioOverview?.revenueChart ||
                  portfolioOverview.revenueChart.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-muted">
                        {t('landlordReportsChartEmptyTransactions')}
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(portfolioOverview.revenueChart ?? []).map(p => ({
                            name: `T${p.month}`,
                            revenue: p.val,
                            fullAmount: p.fullAmount,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip
                            formatter={(val: any) => [
                              `${val}M ₫`,
                              t('landlordReportsChartRevenueTooltip'),
                            ]}
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name={t('landlordReportsChartRevenueLegend')}
                            stroke="#2AC1BC"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* 6-Month Occupancy Trend */}
                <div className="bg-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <span>{t('landlordReportsOccupancyChartTitle')}</span>
                        <span className="w-2 h-2 rounded-full bg-vacant animate-pulse" />
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {t('landlordReportsOccupancyChartDesc')}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-info-soft text-info">
                      <Home className="w-4 h-4" />
                    </span>
                  </div>

                  {!portfolioOverview?.occupancyChart ||
                  portfolioOverview.occupancyChart.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-muted">
                        {t('landlordReportsChartEmptyRooms')}
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={(portfolioOverview.occupancyChart ?? []).map(o => ({
                            name: `T${o.month}`,
                            rate: o.occupied,
                            total: o.total,
                            count: o.count,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis
                            domain={[0, 100]}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip
                            formatter={(val: any) => [
                              `${val}%`,
                              t('landlordReportsChartOccupancyTooltip'),
                            ]}
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="rate"
                            name={t('landlordReportsChartOccupancyLegend')}
                            stroke="#3b82f6"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              {/* Cross-Property Breakdown Table / Grid (Rule #9 Compliant) */}
              <div className="bg-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>{t('landlordReportsCompareTitle')}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-card-hover text-muted">
                        {t('landlordReportsCompareCount', { count: totalItems })}
                      </span>
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {t('landlordReportsCompareDesc')}
                    </p>
                  </div>

                  {/* Rule #9 View Toggle Buttons: Grid & Table */}
                  <ViewModeToggle
                    value={viewMode}
                    onChange={setViewMode}
                  />
                </div>

                {displayedProperties.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                    <p className="text-xs font-bold text-muted">
                      {t('landlordReportsCompareEmpty')}
                    </p>
                  </div>
                ) : viewMode === 'grid' ? (
                  /* Grid View (Default) */
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayedProperties.map(p => {
                      const occNum = parseFloat(p.occupancyRate) || 0
                      return (
                        <div
                          key={p.id}
                          className="bg-card p-4 sm:p-5 rounded-2xl border border-line shadow-2xs hover:border-primary/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 space-y-3.5"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-sm font-bold text-foreground">{p.name}</h4>
                              <p className="text-[11px] text-muted line-clamp-1 mt-0.5">
                                {p.address}
                              </p>
                            </div>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                occNum >= 80
                                  ? 'bg-success-soft text-success border border-success-subtle'
                                  : occNum >= 50
                                    ? 'bg-warning-soft text-warning border border-warning-subtle'
                                    : 'bg-danger-soft text-danger border border-danger-subtle'
                              }`}
                            >
                              {p.occupancyRate}
                            </span>
                          </div>

                          {/* Room Breakdown Pills */}
                          <div className="grid grid-cols-3 gap-1.5 text-center text-[11px] font-bold">
                            <div className="p-1.5 bg-surface rounded-lg">
                              <span className="text-muted block text-[10px]">
                                {t('landlordReportsCardTotalRooms')}
                              </span>
                              <span className="text-foreground">{p.totalRooms}</span>
                            </div>
                            <div className="p-1.5 bg-success-soft rounded-lg text-success">
                              <span className="text-success block text-[10px]">
                                {t('landlordReportsCardOccupied')}
                              </span>
                              <span>{p.occupiedRooms}</span>
                            </div>
                            <div className="p-1.5 bg-info-soft rounded-lg text-info">
                              <span className="text-info block text-[10px]">
                                {t('landlordReportsCardVacant')}
                              </span>
                              <span>{p.vacantRooms}</span>
                            </div>
                          </div>

                          {/* Financial Breakdown */}
                          <div className="space-y-1.5 text-xs pt-1 border-t border-line font-medium">
                            <div className="flex items-center justify-between">
                              <span className="text-muted">
                                {t('landlordReportsCardMonthlyRevenue')}
                              </span>
                              <span className="font-bold text-foreground">
                                {formatCurrency(p.currentMonthRevenue)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted">
                                {t('landlordReportsCardMonthlyExpenses')}
                              </span>
                              <span className="font-bold text-foreground/90">
                                {formatCurrency(p.currentMonthExpenses)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span className="text-muted font-bold">
                                {t('landlordReportsCardNetProfit')}
                              </span>
                              <span className="font-extrabold text-success">
                                {formatCurrency(p.netProfit)}
                              </span>
                            </div>
                            <div className="flex items-center justify-between text-danger text-[11px]">
                              <span>{t('landlordReportsCardUnpaidDebt')}</span>
                              <span className="font-bold">{formatCurrency(p.unpaidDebt)}</span>
                            </div>
                          </div>

                          {/* Expiring contracts tag */}
                          {p.expiringContractsCount > 0 && (
                            <div className="p-2 bg-warning-soft rounded-xl text-warning text-[11px] font-bold flex items-center justify-between">
                              <span>{t('landlordReportsCardExpiringSoon')}</span>
                              <span className="px-1.5 py-0.5 bg-amber-200/60 rounded-md">
                                {t('landlordReportsCardExpiringCount', {
                                  count: p.expiringContractsCount,
                                })}
                              </span>
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  /* Table View */
                  <div className="overflow-x-auto rounded-2xl border border-line">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-surface border-b border-line text-muted font-bold">
                        <tr>
                          <th className="p-3">{t('landlordReportsThProperty')}</th>
                          <th className="p-3 text-center">{t('landlordReportsThRooms')}</th>
                          <th className="p-3 text-center">{t('landlordReportsThOccupancy')}</th>
                          <th className="p-3 text-right">{t('landlordReportsThRevenue')}</th>
                          <th className="p-3 text-right">{t('landlordReportsThExpenses')}</th>
                          <th className="p-3 text-right">{t('landlordReportsThNetProfit')}</th>
                          <th className="p-3 text-right">{t('landlordReportsThDebt')}</th>
                          <th className="p-3 text-center">{t('landlordReportsThExpiring')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-line font-medium">
                        {displayedProperties.map(p => {
                          const occNum = parseFloat(p.occupancyRate) || 0
                          return (
                            <TableRow key={p.id} className="group">
                              <td className="p-3 font-bold text-foreground">
                                <div>{p.name}</div>
                                <div className="text-[10px] text-muted font-normal">
                                  {p.address}
                                </div>
                              </td>
                              <td className="p-3 text-center">
                                <span className="text-success font-bold">
                                  {p.occupiedRooms}
                                </span>{' '}
                                / <span className="text-info font-bold">{p.vacantRooms}</span> /{' '}
                                <span>{p.totalRooms}</span>
                              </td>
                              <td className="p-3 text-center">
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                    occNum >= 80
                                      ? 'bg-success-soft text-success'
                                      : occNum >= 50
                                        ? 'bg-warning-soft text-warning'
                                        : 'bg-danger-soft text-danger'
                                  }`}
                                >
                                  {p.occupancyRate}
                                </span>
                              </td>
                              <td className="p-3 text-right font-bold text-foreground">
                                {formatCurrency(p.currentMonthRevenue)}
                              </td>
                              <td className="p-3 text-right text-muted">
                                {formatCurrency(p.currentMonthExpenses)}
                              </td>
                              <td className="p-3 text-right font-extrabold text-success">
                                {formatCurrency(p.netProfit)}
                              </td>
                              <td className="p-3 text-right font-bold text-danger">
                                {formatCurrency(p.unpaidDebt)}
                              </td>
                              <td className="p-3 text-center">
                                {p.expiringContractsCount > 0 ? (
                                  <span className="px-2 py-0.5 bg-warning-soft text-warning rounded-full font-bold text-[11px]">
                                    {p.expiringContractsCount}
                                  </span>
                                ) : (
                                  <span className="text-muted">—</span>
                                )}
                              </td>
                            </TableRow>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Rule #9 Standardized Pagination */}
                <Pagination
                  currentPage={page}
                  totalItems={totalItems}
                  pageSize={pageSize}
                  onPageChange={setPage}
                  onPageSizeChange={setPageSize}
                  pageSizeMax={100}
                  className="pt-4 border-t border-line"
                />
              </div>

              {/* Expiring Contracts Across All Properties */}
              <div className="bg-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                      <span>{t('landlordReportsExpiringTitle')}</span>
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-black bg-warning-soft text-warning">
                        {t('landlordReportsExpiringBadge', {
                          count: portfolioOverview?.expiringContracts?.length || 0,
                        })}
                      </span>
                    </h3>
                    <p className="text-xs text-muted mt-0.5">
                      {t('landlordReportsExpiringDesc')}
                    </p>
                  </div>
                  <Calendar className="w-5 h-5 text-amber-500" />
                </div>

                {!portfolioOverview?.expiringContracts ||
                portfolioOverview.expiringContracts.length === 0 ? (
                  <div className="py-8 text-center text-muted text-xs font-semibold">
                    {t('landlordReportsExpiringEmpty')}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {(portfolioOverview.expiringContracts ?? []).map(c => (
                      <div
                        key={c.id}
                        className="p-4 rounded-2xl border border-warning-subtle bg-warning-soft flex items-start justify-between gap-3 text-xs"
                      >
                        <div className="space-y-1">
                          <div className="font-bold text-foreground">
                            {c.propertyName} — {c.room}
                          </div>
                          <div className="text-muted font-medium">
                            {t('landlordReportsExpiringTenant')} {c.tenant}{' '}
                            {c.phone && `(${c.phone})`}
                          </div>
                          <div className="text-[11px] text-muted">
                            {t('landlordReportsExpiringEndDate')} {c.endDate}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className="px-2 py-1 bg-amber-200/80 text-warning rounded-lg font-black text-[11px] block">
                            {t('landlordReportsExpiringDaysLeft', { days: c.daysLeft })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: SINGLE PROPERTY */}
      {/* ========================================================================= */}
      {reportMode === 'single' && (
        <>
          {isSingleLoading ? (
            <div className="py-20 text-center text-muted space-y-3">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
              <p className="text-xs font-semibold">{t('landlordReportsSingleLoading')}</p>
            </div>
          ) : (
            <>
              {/* 4 Real Single-Property KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsSingleKpiOccupancy')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-info-soft text-info flex items-center justify-center">
                      <Home className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                      {singleRooms.occupancyRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsSingleKpiOccupancySub', {
                          occupied: singleRooms.occupiedRooms,
                          total: singleRooms.totalRooms,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsSingleKpiRevenue')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-primary/15 text-primary flex items-center justify-center">
                      <DollarSign className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-primary tracking-tight">
                      {formatVND(Number(singleFinancial.currentMonthRevenue) || 0)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsSingleKpiRevenueSub', {
                          count: singleFinancial.paidInvoicesCount,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsSingleKpiDebt')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-danger-soft text-danger flex items-center justify-center">
                      <Flame className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-danger tracking-tight">
                      {formatVND(Number(singleFinancial.unpaidDebt) || 0)}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsSingleKpiDebtSub', {
                          count: singleFinancial.unpaidInvoicesCount,
                        })}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bg-card p-5 rounded-3xl border border-line shadow-xs hover:shadow-md transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordReportsSingleKpiCollection')}
                    </span>
                    <div className="w-9 h-9 rounded-2xl bg-deposit-soft text-deposit flex items-center justify-center">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3">
                    <span className="text-2xl sm:text-3xl font-black text-deposit tracking-tight">
                      {singleCollection.collectionRate}
                    </span>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-muted mt-1">
                      <span>
                        {t('landlordReportsSingleKpiCollectionSub', {
                          count: singleOverview?.depositNotifications?.length || 0,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Single Property Charts & Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <div className="lg:col-span-2 bg-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-foreground flex items-center gap-2">
                        <span>{t('landlordReportsSingleChartTitle')}</span>
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {t('landlordReportsSingleChartDesc', { name: activeBuilding?.name || '' })}
                      </p>
                    </div>
                    <span className="p-2 rounded-xl bg-primary/10 text-primary">
                      <TrendingUp className="w-4 h-4" />
                    </span>
                  </div>

                  {!singleOverview?.revenueChart || singleOverview.revenueChart.length === 0 ? (
                    <div className="py-16 text-center space-y-2">
                      <Inbox className="w-8 h-8 text-zinc-300 mx-auto" />
                      <p className="text-xs font-bold text-muted">
                        {t('landlordReportsChartEmptyTransactions')}
                      </p>
                    </div>
                  ) : (
                    <div className="h-64 sm:h-72 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart
                          data={singleOverview.revenueChart.map(pt => ({
                            name: `T${pt.month}`,
                            revenue: pt.val,
                          }))}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="name"
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <Tooltip
                            formatter={(val: any) => [
                              `${val}M ₫`,
                              t('landlordReportsChartRevenueTooltip'),
                            ]}
                            contentStyle={{
                              backgroundColor: '#0f172a',
                              borderRadius: '12px',
                              border: 'none',
                              color: '#fff',
                              fontSize: '12px',
                            }}
                          />
                          <Line
                            type="monotone"
                            dataKey="revenue"
                            name={t('landlordReportsChartRevenueTooltip')}
                            stroke="#2AC1BC"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="bg-card p-5 sm:p-6 rounded-3xl border border-line shadow-xs flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-foreground mb-1">
                      {t('landlordReportsSingleRoomStatusTitle')}
                    </h3>
                    <p className="text-xs text-muted mb-4">
                      {t('landlordReportsSingleRoomStatusDesc')}
                    </p>

                    <div className="space-y-3">
                      <div className="p-3 bg-primary/10 rounded-2xl flex items-center justify-between text-xs font-bold text-[#138e89]">
                        <span>{t('landlordReportsSingleRoomOccupied')}</span>
                        <span className="text-sm font-black">
                          {t('landlordReportsSingleRoomCount', {
                            count: singleRooms.occupiedRooms,
                          })}
                        </span>
                      </div>
                      <div className="p-3 bg-info-soft rounded-2xl flex items-center justify-between text-xs font-bold text-info">
                        <span>{t('landlordReportsSingleRoomVacant')}</span>
                        <span className="text-sm font-black">
                          {t('landlordReportsSingleRoomCount', { count: singleRooms.vacantRooms })}
                        </span>
                      </div>
                      <div className="p-3 bg-deposit-soft rounded-2xl flex items-center justify-between text-xs font-bold text-deposit">
                        <span>{t('landlordReportsSingleRoomDeposit')}</span>
                        <span className="text-sm font-black">
                          {t('landlordReportsSingleRoomCount', { count: singleRooms.depositRooms })}
                        </span>
                      </div>
                      <div className="p-3 bg-warning-soft rounded-2xl flex items-center justify-between text-xs font-bold text-warning">
                        <span>{t('landlordReportsSingleRoomMaintenance')}</span>
                        <span className="text-sm font-black">
                          {t('landlordReportsSingleRoomCount', {
                            count: singleRooms.maintenanceRooms,
                          })}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-line flex items-center justify-between text-xs text-muted">
                    <span>
                      {t('landlordReportsSingleTotalLabel')}{' '}
                      <strong className="text-foreground font-bold">
                        {t('landlordReportsSingleTotalRooms', { count: singleRooms.totalRooms })}
                      </strong>
                    </span>
                    <span className="text-primary font-extrabold">
                      {t('landlordReportsSingleOccupancySuffix', {
                        rate: singleRooms.occupancyRate,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* ========================================================================= */}
      {/* AI MARKETING STRATEGY MODAL ( & ) */}
      {/* ========================================================================= */}
      {showAiModal && aiStrategy && (
        <div className="fixed inset-0 z-80 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-line animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-line flex items-center justify-between sticky top-0 bg-card z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-primary to-teal-700 text-white flex items-center justify-center shadow-md">
                  <Sparkles className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-foreground">
                    {aiStrategy.title}
                  </h3>
                  <p className="text-xs text-muted">
                    {t('landlordReportsAiCreatedAt', {
                      date: new Date(aiStrategy.createdAt).toLocaleString(isEn ? 'en-US' : 'vi-VN'),
                    })}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAiModal(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Content */}
            <div className="p-5 sm:p-6 space-y-5">
              {/* Executive Summary */}
              <div className="p-4 rounded-2xl bg-primary-soft border border-primary-subtle text-primary space-y-1.5">
                <div className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-[#138e89]">
                  <Compass className="w-3.5 h-3.5" />
                  <span>{t('landlordReportsAiSummaryHeader')}</span>
                </div>
                <p className="text-xs sm:text-sm leading-relaxed">{aiStrategy.executiveSummary}</p>
              </div>

              {/* 3 Strategic Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Pillar 1: Pricing */}
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <DollarSign className="w-4 h-4 text-success" />
                    <span>{t('landlordReportsAiPillarPricing')}</span>
                  </div>
                  <ul className="text-xs text-muted space-y-1.5 list-disc pl-4">
                    {aiStrategy.pricingRecommendations.map((rec, i) => (
                      <li key={i}>{rec}</li>
                    ))}
                  </ul>
                </div>

                {/* Pillar 2: Marketing */}
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Rocket className="w-4 h-4 text-info" />
                    <span>{t('landlordReportsAiPillarMarketing')}</span>
                  </div>
                  <ul className="text-xs text-muted space-y-1.5 list-disc pl-4">
                    {aiStrategy.marketingCampaigns.map((camp, i) => (
                      <li key={i}>{camp}</li>
                    ))}
                  </ul>
                </div>

                {/* Pillar 3: Operations */}
                <div className="p-4 rounded-2xl bg-surface border border-line space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
                    <Zap className="w-4 h-4 text-warning" />
                    <span>{t('landlordReportsAiPillarOperations')}</span>
                  </div>
                  <ul className="text-xs text-muted space-y-1.5 list-disc pl-4">
                    {aiStrategy.operationalOptimizations.map((op, i) => (
                      <li key={i}>{op}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* 30-Day Action Plan Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-primary" />
                  <span>{t('landlordReportsAiActionPlanTitle')}</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {aiStrategy.actionPlan30Days.map((step, i) => (
                    <div
                      key={i}
                      className="p-3.5 rounded-2xl border border-line bg-card hover:border-primary/60 hover:shadow-xs transition-all space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-primary/15 text-[#138e89]">
                          {step.dayRange}
                        </span>
                        <span className="text-[10px] text-muted font-bold">
                          {t('landlordReportsAiStepPrefix', { step: i + 1 })}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-foreground">{step.title}</div>
                      <p className="text-[11px] text-muted leading-normal">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-line flex items-center justify-end gap-2.5 bg-surface/50">
              <Button size="xs"
                type="button"
                variant="ghost"
                onClick={() => setShowAiModal(false)}
              >
                {t('landlordReportsAiCloseBtn')}
              </Button>
              <Button size="xs"
                type="button"
                onClick={() => {
                  setShowAiModal(false)
                  showToast(t('landlordReportsToastAiPlanSaved'))
                }}
              >
                {t('landlordReportsAiSavePlanBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
