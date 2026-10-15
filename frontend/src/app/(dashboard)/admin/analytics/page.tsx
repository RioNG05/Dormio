'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import {
  adminAnalyticsService,
  RevenueAnalyticsResponse,
  UserAnalyticsResponse,
  PropertyAnalyticsResponse,
  ListingAnalyticsResponse,
  RevenuePeriod,
  TimeBucketPeriod,
} from '@/services/admin-analytics.service'
import {
  TrendingUp,
  Users,
  Building2,
  Wallet,
  Download,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Eye,
  Bookmark,
  FileText,
  Layers,
  Sparkles,
  AlertTriangle,
  Inbox,
} from 'lucide-react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts'
import { Button } from '@/components/ui/Button'
import { SelectInput } from '@/components/ui/SelectInput'

type ActiveTab = 'revenue' | 'users' | 'properties' | 'listings'

export default function AdminAnalyticsPage() {
  const { locale } = useLanguage()
  const t = useTranslations('admin')

  const [activeTab, setActiveTab] = useState<ActiveTab>('revenue')
  const [selectedYear, setSelectedYear] = useState<number>(2026)
  const [revenuePeriod, setRevenuePeriod] = useState<RevenuePeriod>('month')
  const [genericPeriod, setGenericPeriod] = useState<TimeBucketPeriod>('month')
  const [loading, setLoading] = useState<boolean>(true)
  const [refreshing, setRefreshing] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  // Analytics states
  const [revenueData, setRevenueData] = useState<RevenueAnalyticsResponse | null>(null)
  const [userData, setUserData] = useState<UserAnalyticsResponse | null>(null)
  const [propertyData, setPropertyData] = useState<PropertyAnalyticsResponse | null>(null)
  const [listingData, setListingData] = useState<ListingAnalyticsResponse | null>(null)

  const fetchAnalytics = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true)
      } else {
        setLoading(true)
      }
      setError(null)

      try {
        const [rev, usr, prop, list] = await Promise.all([
          adminAnalyticsService
            .getRevenueAnalytics({
              period: revenuePeriod,
              year: selectedYear,
            })
            .catch(() => null),
          adminAnalyticsService
            .getUserAnalytics({
              period: genericPeriod,
              year: selectedYear,
            })
            .catch(() => null),
          adminAnalyticsService
            .getPropertyAnalytics({
              period: genericPeriod,
              year: selectedYear,
            })
            .catch(() => null),
          adminAnalyticsService
            .getListingAnalytics({
              period: genericPeriod,
              year: selectedYear,
            })
            .catch(() => null),
        ])

        if (!rev && !usr && !prop && !list) {
          setError(t('adminAnalyticsLoadError'))
        }

        if (rev) setRevenueData(rev)
        if (usr) setUserData(usr)
        if (prop) setPropertyData(prop)
        if (list) setListingData(list)
      } catch (err) {
        console.error('Failed to load admin analytics:', err)
        setError(t('adminAnalyticsLoadError'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [revenuePeriod, genericPeriod, selectedYear, t],
  )

  useEffect(() => {
    fetchAnalytics()
  }, [fetchAnalytics])

  // Currency formatter
  const formatCurrency = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0 ₫'
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN').format(val) + ' ₫'
  }

  const formatNumber = (val: number | undefined) => {
    if (val === undefined || isNaN(val)) return '0'
    return new Intl.NumberFormat(locale === 'en' ? 'en-US' : 'vi-VN').format(val)
  }

  // Export JSON/CSV Report
  const handleExportReport = () => {
    const report = {
      exportedAt: new Date().toISOString(),
      year: selectedYear,
      activeTab,
      revenueSummary: revenueData?.summary,
      userSummary: userData?.summary,
      propertySummary: propertyData?.summary,
      listingSummary: listingData?.summary,
    }
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(report, null, 2))
    const downloadAnchor = document.createElement('a')
    downloadAnchor.setAttribute('href', dataStr)
    downloadAnchor.setAttribute(
      'download',
      `dormio-admin-analytics-${activeTab}-${selectedYear}.json`,
    )
    document.body.appendChild(downloadAnchor)
    downloadAnchor.click()
    downloadAnchor.remove()
  }

  // Pie chart palette
  const PIE_COLORS = ['#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899']

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-orange-100 text-orange-700 tracking-wide uppercase">
              <TrendingUp className="w-3.5 h-3.5" />
              {t('adminAnalyticsBadge')}
            </span>
            <span className="text-xs font-semibold text-zinc-400">
              • {t('adminAnalyticsRealtime')}
            </span>
          </div>
          <h1 className="text-2xl font-black text-zinc-900 tracking-tight mt-1">
            {t('adminAnalyticsTitle')}
          </h1>
          <p className="text-xs text-zinc-500 mt-0.5 max-w-3xl">
            {t('adminAnalyticsSubtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
          {/* Year selector */}
          <div className="w-32">
            <SelectInput
              value={selectedYear}
              onChange={e => setSelectedYear(Number(e.target.value))}
              options={[2024, 2025, 2026, 2027].map(y => ({
                value: y,
                label: t('adminAnalyticsYear', { year: y }),
              }))}
            />
          </div>

          {/* Refresh button */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchAnalytics(true)}
            isLoading={refreshing}
            leftIcon={<RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />}
            title={t('adminAnalyticsRefreshTooltip')}
          >
            <span className="hidden sm:inline">{t('adminAnalyticsRefresh')}</span>
          </Button>

          {/* Export button */}
          <Button
            variant="primary"
            size="sm"
            onClick={handleExportReport}
            leftIcon={<Download className="w-3.5 h-3.5" />}
          >
            <span>{t('adminAnalyticsExport')}</span>
          </Button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-center justify-between p-4 bg-rose-50 border border-rose-200 rounded-2xl text-rose-800 text-sm">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <Button variant="danger" size="sm" onClick={() => fetchAnalytics()}>
            {t('adminRetry')}
          </Button>
        </div>
      )}

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-200 pb-2 overflow-x-auto">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('revenue')}
          className={`flex items-center gap-2 px-4 py-2.5 h-auto rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'revenue'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-500 hover:text-white'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Wallet className="w-4 h-4" />
          <span>{t('adminAnalyticsTabRevenue')}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 h-auto rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-500 hover:text-white'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{t('adminAnalyticsTabUsers')}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('properties')}
          className={`flex items-center gap-2 px-4 py-2.5 h-auto rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'properties'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-500 hover:text-white'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>{t('adminAnalyticsTabProperties')}</span>
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setActiveTab('listings')}
          className={`flex items-center gap-2 px-4 py-2.5 h-auto rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'listings'
              ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20 hover:bg-orange-500 hover:text-white'
              : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{t('adminAnalyticsTabListings')}</span>
        </Button>
      </div>

      {/* TAB CONTENT */}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 1: PLATFORM REVENUE
         ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          {/* Sub-controls: Granularity Period Toggle */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-zinc-200/80 shadow-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span className="text-xs font-bold text-zinc-800">
                {t('adminAnalyticsRevModeLabel')}
              </span>
            </div>

            <div className="flex items-center p-1 bg-zinc-100 rounded-xl">
              {(
                [
                  { id: 'month' as const, label: t('adminAnalyticsRevModeMonth') },
                  { id: 'quarter' as const, label: t('adminAnalyticsRevModeQuarter') },
                  { id: 'year' as const, label: t('adminAnalyticsRevModeYear') },
                ] as const
              ).map(p => (
                <Button
                  key={p.id}
                  variant="ghost"
                  size="sm"
                  onClick={() => setRevenuePeriod(p.id)}
                  className={`px-3 py-1 h-auto text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    revenuePeriod === p.id
                      ? 'bg-white text-orange-600 shadow-xs hover:bg-white hover:text-orange-600'
                      : 'text-zinc-600 hover:text-zinc-900'
                  }`}
                >
                  {p.label}
                </Button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {[1, 2, 3].map(i => (
                  <div
                    key={i}
                    className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-zinc-100 rounded-md w-1/2" />
                    <div className="h-8 bg-zinc-100 rounded-md w-3/4" />
                    <div className="h-4 bg-zinc-100 rounded-md w-2/3" />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse h-80" />
                <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse h-80" />
              </div>
            </div>
          ) : (
            <>
              {/* Revenue KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {/* Card 1: Total Platform Revenue */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-orange-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {t('adminAnalyticsNetRevTitle')}
                    </span>
                    <div className="p-2.5 bg-orange-50 text-orange-600 rounded-xl">
                      <Wallet className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight">
                      {formatCurrency(revenueData?.summary.totalRevenue)}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-0.5 text-xs font-black px-2 py-0.5 rounded-full ${
                        (revenueData?.summary.revenueGrowthRate || 0) >= 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {(revenueData?.summary.revenueGrowthRate || 0) >= 0 ? (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5" />
                      )}
                      {revenueData?.summary.revenueGrowthRate || 0}%
                    </span>
                    <span className="text-xs text-zinc-400">
                      {t('adminAnalyticsVsPrevPeriod')} (
                      {formatCurrency(revenueData?.summary.previousPeriodRevenue)})
                    </span>
                  </div>
                </div>

                {/* Card 2: Subscription Revenue */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-blue-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {t('adminAnalyticsSubscriptionTitle')}
                    </span>
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                      <Building2 className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight">
                      {formatCurrency(revenueData?.summary.subscriptionRevenue.total)}
                    </span>
                    <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                      {revenueData?.summary.subscriptionRevenue.percentage || 0}%
                    </span>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold">
                      Plus: {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.plus)}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-700 font-semibold">
                      Pro: {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.pro)}
                    </span>
                  </div>
                </div>

                {/* Card 3: Post Credit Purchases */}
                <div className="relative overflow-hidden bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs hover:border-emerald-200 transition-all">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                      {t('adminAnalyticsPostPurchaseTitle')}
                    </span>
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                      <FileText className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-2xl lg:text-3xl font-black text-zinc-900 tracking-tight">
                      {formatCurrency(revenueData?.summary.postPurchaseRevenue.total)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      {revenueData?.summary.postPurchaseRevenue.percentage || 0}%
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
                    <span>
                      {t('adminAnalyticsSoldLabel')}:{' '}
                      <strong className="text-zinc-800">
                        {formatNumber(revenueData?.summary.postPurchaseRevenue.totalCreditsSold)}
                      </strong>{' '}
                      {t('adminAnalyticsCreditsUnit')}
                    </span>
                    <span>
                      {t('adminAnalyticsAovLabel')}{' '}
                      <strong className="text-zinc-800">
                        {formatCurrency(revenueData?.summary.postPurchaseRevenue.averageOrderValue)}
                      </strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Revenue Charts Row */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stacked Bar Chart: Revenue Timeline */}
                <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h2 className="text-sm font-black text-zinc-900">
                        {t('adminAnalyticsRevTimelineTitle')}
                      </h2>
                      <p className="text-xs text-zinc-400 mt-0.5">
                        {t('adminAnalyticsRevTimelineSubtitle')}
                      </p>
                    </div>
                  </div>

                  <div className="h-72 w-full">
                    {revenueData?.timeline && revenueData.timeline.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={revenueData.timeline}
                          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="label"
                            tickLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                          />
                          <YAxis
                            tickLine={false}
                            axisLine={false}
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            tickFormatter={v =>
                              v >= 1000000 ? `${(v / 1000000).toFixed(0)}M` : `${v}`
                            }
                          />
                          <Tooltip
                            formatter={(val: any) => formatCurrency(Number(val))}
                            contentStyle={{
                              borderRadius: '12px',
                              border: '1px solid #e2e8f0',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              fontSize: '12px',
                            }}
                          />
                          <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                          <Bar
                            dataKey="subscriptionPlus"
                            name={t('adminAnalyticsBarPlus')}
                            stackId="a"
                            fill="#3b82f6"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="subscriptionPro"
                            name={t('adminAnalyticsBarPro')}
                            stackId="a"
                            fill="#f97316"
                            radius={[0, 0, 0, 0]}
                          />
                          <Bar
                            dataKey="postPurchase"
                            name={t('adminAnalyticsBarCredits')}
                            stackId="a"
                            fill="#10b981"
                            radius={[4, 4, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="flex flex-col h-full items-center justify-center text-xs text-zinc-400 gap-2">
                        <Inbox className="w-8 h-8 text-zinc-300" />
                        <span>{t('adminAnalyticsNoTimeline')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Donut Chart: Revenue Streams Breakdown */}
                <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs flex flex-col justify-between">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900">
                      {t('adminAnalyticsMonetizationTitle')}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t('adminAnalyticsMonetizationSubtitle')}
                    </p>
                  </div>

                  <div className="h-56 w-full my-auto">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: t('adminAnalyticsPiePlusPlan'),
                              value: revenueData?.summary.subscriptionRevenue.byPlan.plus || 0,
                            },
                            {
                              name: t('adminAnalyticsPieProPlan'),
                              value: revenueData?.summary.subscriptionRevenue.byPlan.pro || 0,
                            },
                            {
                              name: t('adminAnalyticsPiePostCredits'),
                              value: revenueData?.summary.postPurchaseRevenue.total || 0,
                            },
                          ]}
                          innerRadius={50}
                          outerRadius={75}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {PIE_COLORS.map((color, idx) => (
                            <Cell key={`cell-${idx}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip
                          formatter={(val: any) => formatCurrency(Number(val))}
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                        />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="space-y-2 border-t border-zinc-100 pt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]" />
                        <span className="text-zinc-600">{t('adminAnalyticsPlusSubs')}</span>
                      </div>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.plus)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                        <span className="text-zinc-600">{t('adminAnalyticsProSubs')}</span>
                      </div>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(revenueData?.summary.subscriptionRevenue.byPlan.pro)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-[#10b981]" />
                        <span className="text-zinc-600">{t('adminAnalyticsPiePostCredits')}</span>
                      </div>
                      <span className="font-bold text-zinc-900">
                        {formatCurrency(revenueData?.summary.postPurchaseRevenue.total)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 2: USERS ANALYTICS
         ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-zinc-100 rounded-md w-1/2" />
                    <div className="h-8 bg-zinc-100 rounded-md w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded-md w-1/3" />
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse h-80" />
            </div>
          ) : (
            <>
              {/* User Metrics Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsTotalUsers')}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-zinc-900">
                      {formatNumber(userData?.summary.totalUsers)}
                    </span>
                    <span
                      className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
                        (userData?.summary.growthRate || 0) >= 0
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-rose-50 text-rose-700'
                      }`}
                    >
                      {(userData?.summary.growthRate || 0) >= 0 ? '+' : ''}
                      {userData?.summary.growthRate || 0}%
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    +{formatNumber(userData?.summary.newUsersCurrentPeriod)}{' '}
                    {t('adminAnalyticsNewInPeriod')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsTenants')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-blue-600">
                    {formatNumber(userData?.summary.byRole.tenant)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {userData?.summary.totalUsers
                      ? `${Math.round(((userData.summary.byRole.tenant || 0) / userData.summary.totalUsers) * 100)}%`
                      : '0%'}{' '}
                    {t('adminAnalyticsOfTotalUsers')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsLandlords')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-orange-600">
                    {formatNumber(userData?.summary.byRole.landlord)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {userData?.summary.totalUsers
                      ? `${Math.round(((userData.summary.byRole.landlord || 0) / userData.summary.totalUsers) * 100)}%`
                      : '0%'}{' '}
                    {t('adminAnalyticsOfTotalUsers')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsStaffAndAgents')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-emerald-600">
                    {formatNumber(
                      (userData?.summary.byRole.employee || 0) +
                        (userData?.summary.byRole.leasing_agent || 0),
                    )}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {userData?.summary.byRole.employee || 0} {t('adminAnalyticsStaffUnit')} •{' '}
                    {userData?.summary.byRole.leasing_agent || 0} {t('adminAnalyticsAgentsUnit')}
                  </p>
                </div>
              </div>

              {/* User Registration Timeline Chart */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900">
                      {t('adminAnalyticsUserTrendTitle')}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t('adminAnalyticsUserTrendSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  {userData?.timeline && userData.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={userData.timeline}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Bar
                          dataKey="count"
                          name={t('adminAnalyticsTotalNewUsers')}
                          fill="#f97316"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center text-xs text-zinc-400 gap-2">
                      <Inbox className="w-8 h-8 text-zinc-300" />
                      <span>{t('adminAnalyticsNoUserData')}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 3: PROPERTIES & ROOMS ANALYTICS
         ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'properties' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-zinc-100 rounded-md w-1/2" />
                    <div className="h-8 bg-zinc-100 rounded-md w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded-md w-1/3" />
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse h-64" />
            </div>
          ) : (
            <>
              {/* Properties KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsBoardingHouses')}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-zinc-900">
                      {formatNumber(propertyData?.summary.totalHouses)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +{formatNumber(propertyData?.summary.newHousesCurrentPeriod)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {propertyData?.summary.housesByStatus.active} {t('adminAnalyticsHousesActive')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsTotalRooms')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-blue-600">
                    {formatNumber(propertyData?.summary.totalRooms)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {propertyData?.summary.roomsByStatus.available}{' '}
                    {t('adminAnalyticsRoomsAvailable')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsOccupancyRate')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-emerald-600">
                    {propertyData?.summary.occupancyRate || 0}%
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {propertyData?.summary.roomsByStatus.occupied} {t('adminAnalyticsRoomsOccupied')}{' '}
                    • {propertyData?.summary.roomsByStatus.deposited}{' '}
                    {t('adminAnalyticsRoomsDeposited')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsMaintenanceRooms')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-amber-600">
                    {propertyData?.summary.roomsByStatus.maintainace || 0}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {t('adminAnalyticsRequiresAttention')}
                  </p>
                </div>
              </div>

              {/* Regional Breakdown Table */}
              <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-zinc-100 flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900">
                      {t('adminAnalyticsRegionalTitle')}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t('adminAnalyticsRegionalSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-zinc-50 border-b border-zinc-100 text-[11px] font-black text-zinc-400 uppercase tracking-wider">
                        <th className="py-3 px-4">{t('adminAnalyticsThRegion')}</th>
                        <th className="py-3 px-4">{t('adminAnalyticsThHouses')}</th>
                        <th className="py-3 px-4">{t('adminAnalyticsThRooms')}</th>
                        <th className="py-3 px-4">{t('adminAnalyticsThOccupancy')}</th>
                        <th className="py-3 px-4">{t('adminAnalyticsThShare')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700">
                      {propertyData?.summary.regions && propertyData.summary.regions.length > 0 ? (
                        propertyData.summary.regions.map((reg, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/80 transition-colors">
                            <td className="py-3 px-4 font-bold text-zinc-900">{reg.name}</td>
                            <td className="py-3 px-4">{formatNumber(reg.houses)}</td>
                            <td className="py-3 px-4 font-semibold">{formatNumber(reg.rooms)}</td>
                            <td className="py-3 px-4">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700">
                                {reg.occupancyRate}%
                              </span>
                            </td>
                            <td className="py-3 px-4 text-zinc-500">{reg.share}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <Inbox className="w-6 h-6 text-zinc-300" />
                              <span>{t('adminAnalyticsNoRegionalData')}</span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* ──────────────────────────────────────────────────────────────────────
          TAB 4: BHRP LISTINGS ANALYTICS
         ────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'listings' && (
        <div className="space-y-6">
          {loading ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div
                    key={i}
                    className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse space-y-3"
                  >
                    <div className="h-4 bg-zinc-100 rounded-md w-1/2" />
                    <div className="h-8 bg-zinc-100 rounded-md w-3/4" />
                    <div className="h-3 bg-zinc-100 rounded-md w-1/3" />
                  </div>
                ))}
              </div>
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs animate-pulse h-80" />
            </div>
          ) : (
            <>
              {/* Listings KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsTotalListings')}
                  </span>
                  <div className="mt-2 flex items-baseline justify-between">
                    <span className="text-2xl font-black text-zinc-900">
                      {formatNumber(listingData?.summary.totalPosts)}
                    </span>
                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                      +{formatNumber(listingData?.summary.newPostsCurrentPeriod)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {listingData?.summary.byStatus.posted} {t('adminAnalyticsActiveOnBhrp')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsTotalViews')}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-blue-600">
                      {formatNumber(listingData?.summary.totalViews)}
                    </span>
                    <Eye className="w-4 h-4 text-blue-400" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {t('adminAnalyticsAverageLabel')}:{' '}
                    <strong className="text-zinc-800">
                      {listingData?.summary.averageViewsPerPost || 0}
                    </strong>{' '}
                    {t('adminAnalyticsViewsPerPost')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsBookmarks')}
                  </span>
                  <div className="mt-2 flex items-baseline gap-2">
                    <span className="text-2xl font-black text-rose-600">
                      {formatNumber(listingData?.summary.totalSaved)}
                    </span>
                    <Bookmark className="w-4 h-4 text-rose-400" />
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {t('adminAnalyticsTenantInterest')}
                  </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
                  <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                    {t('adminAnalyticsSourceQuota')}
                  </span>
                  <div className="mt-2 text-2xl font-black text-emerald-600">
                    {formatNumber(listingData?.summary.bySourceType.purchased)}
                  </div>
                  <p className="text-xs text-zinc-400 mt-2">
                    {t('adminAnalyticsPurchasedCredits')} •{' '}
                    {formatNumber(listingData?.summary.bySourceType.free_quote)}{' '}
                    {t('adminAnalyticsFree')}
                  </p>
                </div>
              </div>

              {/* Listings Volume Timeline Chart */}
              <div className="bg-white p-6 rounded-2xl border border-zinc-200/80 shadow-xs">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-sm font-black text-zinc-900">
                      {t('adminAnalyticsListingTrendTitle')}
                    </h2>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {t('adminAnalyticsListingTrendSubtitle')}
                    </p>
                  </div>
                </div>

                <div className="h-72 w-full">
                  {listingData?.timeline && listingData.timeline.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart
                        data={listingData.timeline}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                      >
                        <defs>
                          <linearGradient id="listingColor" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis
                          dataKey="label"
                          tickLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <YAxis
                          tickLine={false}
                          axisLine={false}
                          tick={{ fontSize: 11, fill: '#64748b' }}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: '12px',
                            border: '1px solid #e2e8f0',
                            fontSize: '12px',
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                        <Area
                          type="monotone"
                          dataKey="count"
                          name={t('adminAnalyticsPublishedListings')}
                          stroke="#10b981"
                          fillOpacity={1}
                          fill="url(#listingColor)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="flex flex-col h-full items-center justify-center text-xs text-zinc-400 gap-2">
                      <Inbox className="w-8 h-8 text-zinc-300" />
                      <span>{t('adminAnalyticsNoListingData')}</span>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
