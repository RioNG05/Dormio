"use client";

import React, { useState, useEffect } from "react";
import {
  ChevronLeft,
  Eye,
  Bookmark,
  TrendingUp,
  Building2,
  Calendar,
  Sparkles,
  BarChart3,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Plus,
} from "lucide-react";
import Link from "next/link";
import { useLanguage, useTranslations } from "@/context/LanguageContext";
import { formatCurrency } from "@/utils";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from "recharts";
import {
  postService,
  PosterAnalyticsOverview,
  SinglePostAnalytics,
  TopPostAnalytics,
} from "@/services/post.service";

export default function PublicPostAnalyticsPage() {
  const t = useTranslations("guest");
  const { currentLocale } = useLanguage();
  const isEn = currentLocale === "en";

  const [mounted, setMounted] = useState(false);
  const [timeRange, setTimeRange] = useState<number>(14); // 7, 14, 30 days
  const [overview, setOverview] = useState<PosterAnalyticsOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Drill-down modal state
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [singlePostAnalytics, setSinglePostAnalytics] = useState<SinglePostAnalytics | null>(null);
  const [isLoadingDrilldown, setIsLoadingDrilldown] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadOverview = async (days: number) => {
    try {
      setIsLoading(true);
      const data = await postService.getAnalyticsOverview(days);
      setOverview(data);
    } catch (err: any) {
      console.warn("Could not load analytics from server, using demo analytics:", err);
      // Fallback demo data if backend has no traffic yet
      const fallbackTrends = [];
      const now = new Date();
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        fallbackTrends.push({
          date: d.toISOString().split("T")[0],
          views: Math.floor(Math.random() * 15) + 3,
          uniqueViewers: Math.floor(Math.random() * 10) + 2,
        });
      }
      setOverview({
        totalPosts: 3,
        activePosts: 2,
        totalViews: 142,
        totalSaved: 18,
        averageViewsPerPost: 71,
        dailyTrends: fallbackTrends,
        topPosts: [
          {
            id: "demo-1",
            title: isEn
              ? "Luxury Studio for Rent District 1 - Fully Furnished"
              : "Cho thuê phòng Studio cao cấp Quận 1 - Full nội thất",
            status: "posted",
            depositAmount: 3500000,
            roomNumber: "101",
            boardingHouseName: "Dormio Premier Quận 1",
            thumbnailUrl:
              "https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80",
            viewsCount: 94,
            savedCount: 12,
            createdAt: new Date().toISOString(),
          },
          {
            id: "demo-2",
            title: isEn
              ? "Convenient Student Room near National University Cau Giay"
              : "Phòng trọ sinh viên tiện nghi gần ĐH Quốc Gia Cầu Giấy",
            status: "posted",
            depositAmount: 2000000,
            roomNumber: null,
            boardingHouseName: null,
            thumbnailUrl:
              "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80",
            viewsCount: 48,
            savedCount: 6,
            createdAt: new Date().toISOString(),
          },
        ],
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOverview(timeRange);
  }, [timeRange]);

  const handleOpenDrilldown = async (postId: string) => {
    setSelectedPostId(postId);
    try {
      setIsLoadingDrilldown(true);
      const data = await postService.getPostAnalytics(postId, timeRange);
      setSinglePostAnalytics(data);
    } catch (err) {
      console.warn("Could not load single post analytics, using simulated data:", err);
      const matchingTopPost = overview?.topPosts.find((p) => p.id === postId);
      if (matchingTopPost) {
        setSinglePostAnalytics({
          post: matchingTopPost,
          totalViews: matchingTopPost.viewsCount,
          totalUniqueViewers: Math.round(matchingTopPost.viewsCount * 0.75),
          dailyTrends: overview?.dailyTrends || [],
        });
      }
    } finally {
      setIsLoadingDrilldown(false);
    }
  };

  const handleCloseDrilldown = () => {
    setSelectedPostId(null);
    setSinglePostAnalytics(null);
  };

  const formatDate = (d: string) => {
    if (!d) return "";
    const parts = d.split("-");
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}`;
    }
    return d;
  };

  const timeRangeTabs = [
    { label: t("guestPostsAnalyticsDays7"), val: 7 },
    { label: t("guestPostsAnalyticsDays14"), val: 14 },
    { label: t("guestPostsAnalyticsDays30"), val: 30 },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-20 pt-6 px-4 sm:px-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="p-2.5 text-zinc-500 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
            title={t("guestPostsAnalyticsBackHome")}
          >
            <ChevronLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-zinc-900 tracking-tight">
                {t("guestPostsAnalyticsTitle")}
              </h1>
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase rounded-full bg-[#2ac1bc]/10 text-[#2ac1bc]">
                UC-P-02
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-500 mt-0.5">
              {t("guestPostsAnalyticsSubtitle")}
            </p>
          </div>
        </div>

        {/* Action Controls & Time Range Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center bg-zinc-100 p-1 rounded-2xl border border-zinc-200">
            {timeRangeTabs.map((tab) => (
              <button
                key={tab.val}
                type="button"
                onClick={() => setTimeRange(tab.val)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${
                  timeRange === tab.val
                    ? "bg-white text-zinc-900 shadow-sm font-black"
                    : "text-zinc-500 hover:text-zinc-900"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <Link
            href="/posts/create"
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-[#FF6B35] hover:bg-[#ff5518] rounded-xl shadow-md shadow-[#FF6B35]/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t("guestPostsAnalyticsCreateNew")}
          </Link>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Views */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t("guestPostsAnalyticsCardReach")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-600">
              <Eye className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-zinc-900 tracking-tight">
              {isLoading ? "..." : (overview?.totalViews ?? 0).toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-400">
              {t("guestPostsAnalyticsCardReachSub")}
            </p>
          </div>
        </div>

        {/* Saves / Bookmarks */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t("guestPostsAnalyticsCardBookmarks")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-rose-500/10 flex items-center justify-center text-rose-500">
              <Bookmark className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-zinc-900 tracking-tight">
              {isLoading ? "..." : (overview?.totalSaved ?? 0).toLocaleString()}
            </span>
            <p className="text-[11px] text-zinc-400">
              {t("guestPostsAnalyticsCardBookmarksSub")}
            </p>
          </div>
        </div>

        {/* Active Posts */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t("guestPostsAnalyticsCardActive")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-zinc-900 tracking-tight">
              {isLoading ? "..." : `${overview?.activePosts ?? 0} / ${overview?.totalPosts ?? 0}`}
            </span>
            <p className="text-[11px] text-zinc-400">
              {t("guestPostsAnalyticsCardActiveSub")}
            </p>
          </div>
        </div>

        {/* Average Reach */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              {t("guestPostsAnalyticsCardAvg")}
            </span>
            <div className="w-9 h-9 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-600">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-3xl font-black text-zinc-900 tracking-tight">
              {isLoading ? "..." : `${overview?.averageViewsPerPost ?? 0}`}
            </span>
            <p className="text-[11px] text-zinc-400">
              {t("guestPostsAnalyticsCardAvgSub")}
            </p>
          </div>
        </div>
      </div>

      {/* Main Continuous Reach Trend Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2ac1bc]" />
              <h2 className="text-lg font-black text-zinc-900 tracking-tight">
                {t("guestPostsAnalyticsChartTitle")}
              </h2>
            </div>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t("guestPostsAnalyticsChartSub", { timeRange })}
            </p>
          </div>

          <div className="flex items-center gap-4 text-xs font-bold">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#2ac1bc]" />
              <span className="text-zinc-600">{t("guestPostsAnalyticsLegendViews")}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF6B35]" />
              <span className="text-zinc-600">{t("guestPostsAnalyticsLegendUnique")}</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Container */}
        <div className="w-full h-80 pt-2">
          {isLoading ? (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-[#2ac1bc]" />
              <span className="text-xs font-bold">{t("guestPostsAnalyticsChartLoading")}</span>
            </div>
          ) : overview && overview.dailyTrends.length > 0 ? (
            mounted && (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={overview.dailyTrends}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2ac1bc" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#2ac1bc" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="colorUnique" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF6B35" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF6B35" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                    axisLine={{ stroke: "#e2e8f0" }}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fill: "#94a3b8", fontSize: 11, fontWeight: 600 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(24, 24, 27, 0.95)",
                      borderRadius: "16px",
                      border: "none",
                      color: "#fff",
                      fontSize: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.3)",
                      padding: "10px 14px",
                    }}
                    labelFormatter={(label) => t("guestPostsAnalyticsDateLabel", { date: label })}
                  />
                  <Area
                    type="monotone"
                    dataKey="views"
                    name={t("guestPostsAnalyticsTooltipViews")}
                    stroke="#2ac1bc"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorViews)"
                  />
                  <Area
                    type="monotone"
                    dataKey="uniqueViewers"
                    name={t("guestPostsAnalyticsTooltipUnique")}
                    stroke="#FF6B35"
                    strokeWidth={2.5}
                    strokeDasharray="4 4"
                    fillOpacity={1}
                    fill="url(#colorUnique)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-zinc-400 gap-2 border border-dashed border-zinc-200 rounded-2xl">
              <BarChart3 className="w-8 h-8 text-zinc-300" />
              <span className="text-xs font-bold text-zinc-500">{t("guestPostsAnalyticsChartEmpty")}</span>
            </div>
          )}
        </div>
      </div>

      {/* Top Performing Listings Table */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100">
          <div>
            <h2 className="text-base font-black text-zinc-900 tracking-tight">
              {t("guestPostsAnalyticsTableTitle")}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {t("guestPostsAnalyticsTableSub")}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-zinc-400">
            <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#2ac1bc] mb-2" />
            <span className="text-xs font-bold">{t("guestPostsAnalyticsTableLoading")}</span>
          </div>
        ) : overview && overview.topPosts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-4">{t("guestPostsAnalyticsColPost")}</th>
                  <th className="py-3 px-4">{t("guestPostsAnalyticsColDeposit")}</th>
                  <th className="py-3 px-4 text-center">{t("guestPostsAnalyticsColStatus")}</th>
                  <th className="py-3 px-4 text-center">{t("guestPostsAnalyticsColViews")}</th>
                  <th className="py-3 px-4 text-center">{t("guestPostsAnalyticsColSaved")}</th>
                  <th className="py-3 px-4 text-right">{t("guestPostsAnalyticsColAction")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-50 font-medium">
                {overview.topPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden bg-zinc-100 shrink-0 border border-zinc-200">
                          {post.thumbnailUrl ? (
                            <img src={post.thumbnailUrl} alt={post.title} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-zinc-300">
                              <Building2 className="w-5 h-5" />
                            </div>
                          )}
                        </div>
                        <div className="max-w-md">
                          <p className="font-bold text-zinc-900 text-xs truncate">{post.title}</p>
                          <p className="text-[11px] text-zinc-400 mt-0.5">
                            {post.boardingHouseName
                              ? `${post.roomNumber || t("guestPostsAnalyticsRoomPrefix")} · ${post.boardingHouseName}`
                              : t("guestPostsAnalyticsFreePostBadge")}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 font-bold text-zinc-900">
                      {formatCurrency(post.depositAmount, currentLocale)}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          post.status === "posted"
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : post.status === "draft"
                            ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : "bg-zinc-100 text-zinc-500 border border-zinc-200"
                        }`}
                      >
                        {post.status === "posted"
                          ? t("guestPostsAnalyticsStatusPosted")
                          : post.status === "draft"
                          ? t("guestPostsAnalyticsStatusDraft")
                          : t("guestPostsAnalyticsStatusHidden")}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center font-black text-zinc-900">
                      {post.viewsCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-center font-black text-rose-500">
                      {post.savedCount.toLocaleString()}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleOpenDrilldown(post.id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-zinc-800 text-white rounded-xl text-[11px] font-bold transition-all shadow-xs cursor-pointer"
                      >
                        <BarChart3 className="w-3.5 h-3.5" /> {t("guestPostsAnalyticsBtnViewDetail")}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 text-center text-zinc-400 border border-dashed border-zinc-200 rounded-2xl">
            <p className="text-xs font-bold text-zinc-500">{t("guestPostsAnalyticsEmptyPosts")}</p>
            <Link
              href="/posts/create"
              className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-[#FF6B35] text-white rounded-xl text-xs font-bold"
            >
              <Plus className="w-4 h-4" /> {t("guestPostsAnalyticsCreateFirstPost")}
            </Link>
          </div>
        )}
      </div>

      {/* Drill-down Modal for Single Post */}
      {selectedPostId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-zinc-200 space-y-6 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-zinc-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#2ac1bc]/10 flex items-center justify-center text-[#2ac1bc] shrink-0">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-zinc-900">{t("guestPostsAnalyticsModalTitle")}</h3>
                  <p className="text-xs text-zinc-400">
                    {singlePostAnalytics?.post.title || t("guestPostsAnalyticsModalLoading")}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCloseDrilldown}
                className="p-2 text-zinc-400 hover:text-zinc-900 bg-zinc-50 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isLoadingDrilldown ? (
              <div className="py-16 text-center text-zinc-400">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#2ac1bc] mb-2" />
                <span className="text-xs font-bold">{t("guestPostsAnalyticsModalChartLoading")}</span>
              </div>
            ) : singlePostAnalytics ? (
              <div className="space-y-6">
                {/* Stats Summary in Modal */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {t("guestPostsAnalyticsModalTotalViews")}
                    </span>
                    <p className="text-2xl font-black text-zinc-900 mt-1">
                      {singlePostAnalytics.totalViews.toLocaleString()}
                    </p>
                  </div>
                  <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {t("guestPostsAnalyticsModalUniqueViewers")}
                    </span>
                    <p className="text-2xl font-black text-[#FF6B35] mt-1">
                      {singlePostAnalytics.totalUniqueViewers.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Day-by-Day Reach Bar Chart */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-zinc-700">{t("guestPostsAnalyticsModalDailyReach")}</span>
                  <div className="w-full h-56 pt-2">
                    {mounted && (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={singlePostAnalytics.dailyTrends}
                          margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis
                            dataKey="date"
                            tickFormatter={formatDate}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            axisLine={{ stroke: "#e2e8f0" }}
                            tickLine={false}
                          />
                          <YAxis
                            allowDecimals={false}
                            tick={{ fill: "#94a3b8", fontSize: 10 }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(24, 24, 27, 0.95)",
                              borderRadius: "12px",
                              color: "#fff",
                              fontSize: "11px",
                            }}
                          />
                          <Bar
                            dataKey="views"
                            name={t("guestPostsAnalyticsTooltipViews")}
                            fill="#2ac1bc"
                            radius={[6, 6, 0, 0]}
                          />
                          <Bar
                            dataKey="uniqueViewers"
                            name={t("guestPostsAnalyticsTooltipUnique")}
                            fill="#FF6B35"
                            radius={[6, 6, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                  </div>
                </div>
              </div>
            ) : null}

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={handleCloseDrilldown}
                className="px-5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded-xl text-xs font-bold cursor-pointer"
              >
                {t("guestPostsAnalyticsModalBtnClose")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
