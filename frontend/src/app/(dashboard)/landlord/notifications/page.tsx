"use client";

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
    Plus, CheckCircle2, X, Send, Users, Building2, Eye,
    Sparkles, Search, LayoutGrid, List, RefreshCw, MapPin,
    ShieldAlert, Smartphone, Trash2, Loader2, AlertCircle
} from "lucide-react";

import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import {
    announcementService,
    LandlordAnnouncementItem,
    LandlordAnnouncementsSummary
} from "@/services/announcement.service";
import { Button, TextInput, SelectInput, TextareaInput } from "@/components/ui";

export default function NotificationsPage() {
    const { activeBuilding } = useAuth();
    const t = useTranslations("landlord");
    const tCommon = useTranslations("common");

    const tRef = useRef(t);
    useEffect(() => {
        tRef.current = t;
    }, [t]);

    const [isMounted, setIsMounted] = useState(false);
    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    // Filter and Search States
    const [searchQuery, setSearchQuery] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");
    const [channelFilter, setChannelFilter] = useState("");

    // Pagination State (Rule #9: Default Grid=6, List=10)
    const [page, setPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // Backend Announcements Data
    const [notifications, setNotifications] = useState<LandlordAnnouncementItem[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [totalItems, setTotalItems] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const [summary, setSummary] = useState<LandlordAnnouncementsSummary>({
        totalAnnouncements: 0,
        totalTargetTenants: 0,
        emergencyCount: 0,
    });

    // Modals & Forms State
    const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);
    const [selectedNotifDetail, setSelectedNotifDetail] = useState<LandlordAnnouncementItem | null>(null);
    const [deletingNotifId, setDeletingNotifId] = useState<string | null>(null);

    // Form inputs state
    const [notifTitle, setNotifTitle] = useState("");
    const [notifContent, setNotifContent] = useState("");
    const [notifCategory, setNotifCategory] = useState("Điện nước");
    const [notifTargetScope, setNotifTargetScope] = useState("");
    const [notifChannel, setNotifChannel] = useState("Thông báo hệ thống");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    // Toast feedback notification
    const [toast, setToast] = useState<{ type: "success" | "error"; text: string } | null>(null);

    // Auto-dismiss toast
    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 3500);
        return () => clearTimeout(timer);
    }, [toast]);

    useEffect(() => {
        setIsMounted(true);
        if (activeBuilding?.name) {
            setNotifTargetScope(activeBuilding.name);
        }
    }, [activeBuilding?.name]);

    // Localized category label helper
    const getCategoryLabel = useCallback((category: string) => {
        switch (category) {
            case "Điện nước":
            case "Utilities":
                return t("landlordNotificationsCatUtilities");
            case "Tiền nhà":
            case "Rent":
            case "Rent & Billing":
                return t("landlordNotificationsCatRent");
            case "Nội quy":
            case "Rules":
            case "Rules & Policies":
                return t("landlordNotificationsCatRules");
            case "Khẩn cấp":
            case "Emergency":
                return t("landlordNotificationsCatEmergency");
            default:
                return category;
        }
    }, [t]);

    // Localized channel label helper
    const getChannelLabel = useCallback((channel: string) => {
        switch (channel) {
            case "Thông báo hệ thống":
            case "System In-App":
            case "In-App Notice":
                return t("landlordNotificationsChannelInApp");
            case "SMS":
                return t("landlordNotificationsChannelSms");
            default:
                return channel;
        }
    }, [t]);

    // Reset draft fields completely
    const resetNotifForm = useCallback(() => {
        setNotifTitle("");
        setNotifContent("");
        setNotifCategory("Điện nước");
        setNotifTargetScope(activeBuilding?.name || "");
        setNotifChannel("Thông báo hệ thống");
    }, [activeBuilding?.name]);

    // Directly close modal and reset form
    const requestCloseNotifModal = useCallback(() => {
        resetNotifForm();
        setIsNotifModalOpen(false);
    }, [resetNotifForm]);

    // Fetch broadcast announcements from real backend API
    const fetchAnnouncements = useCallback(async () => {
        if (!activeBuilding?.id) return;
        setIsLoading(true);
        try {
            const res = await announcementService.getAnnouncements(activeBuilding.id, {
                page,
                limit: itemsPerPage,
                search: searchQuery,
                category: categoryFilter,
                channel: channelFilter,
            });

            setNotifications(res.data || []);
            setTotalItems(res.meta?.total || 0);
            setTotalPages(res.meta?.totalPages || 1);
            if (res.summary) {
                setSummary(res.summary);
            }
        } catch (err: any) {
            console.error("Failed to fetch announcements:", err);
            setToast({
                type: "error",
                text: err?.message || tRef.current("landlordNotificationsToastFetchError"),
            });
        } finally {
            setIsLoading(false);
        }
    }, [activeBuilding?.id, page, itemsPerPage, searchQuery, categoryFilter, channelFilter]);

    useEffect(() => {
        fetchAnnouncements();
    }, [fetchAnnouncements]);

    // Reset pagination when search or filters change
    useEffect(() => {
        setPage(1);
    }, [searchQuery, categoryFilter, channelFilter]);

    // Broadcast announcement handler
    const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifTitle.trim() || !notifContent.trim() || !activeBuilding?.id) return;

        setIsSubmitting(true);
        try {
            await announcementService.broadcastAnnouncement(activeBuilding.id, {
                title: notifTitle.trim(),
                content: notifContent.trim(),
                category: notifCategory,
                targetScope: notifTargetScope.trim() || activeBuilding.name || tRef.current("landlordNotificationsEntireBuilding"),
                channel: notifChannel,
            });

            resetNotifForm();
            setIsNotifModalOpen(false);
            setToast({
                type: "success",
                text: tRef.current("landlordNotificationsToastBroadcastSuccess"),
            });
            await fetchAnnouncements();
        } catch (err: any) {
            setToast({
                type: "error",
                text: err?.message || tRef.current("landlordNotificationsToastBroadcastError"),
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Delete announcement handler
    const handleDeleteAnnouncement = async (id: string) => {
        if (!activeBuilding?.id) return;
        setIsDeleting(true);
        try {
            await announcementService.deleteAnnouncement(activeBuilding.id, id);
            setDeletingNotifId(null);
            if (selectedNotifDetail?.id === id) {
                setSelectedNotifDetail(null);
            }
            setToast({
                type: "success",
                text: tRef.current("landlordNotificationsToastDeleteSuccess"),
            });
            await fetchAnnouncements();
        } catch (err: any) {
            setToast({
                type: "error",
                text: err?.message || tRef.current("landlordNotificationsToastDeleteError"),
            });
        } finally {
            setIsDeleting(false);
        }
    };

    // Quick Announcement Templates
    const notificationTemplates = useMemo(() => [
        {
            title: t("landlordNotificationsTmpl1Title"),
            category: "Điện nước",
            content: t("landlordNotificationsTmpl1Content", {
                building: activeBuilding?.name || t("landlordNotificationsBuildingFallback"),
            }),
        },
        {
            title: t("landlordNotificationsTmpl2Title"),
            category: "Tiền nhà",
            content: t("landlordNotificationsTmpl2Content"),
        },
        {
            title: t("landlordNotificationsTmpl3Title"),
            category: "Nội quy",
            content: t("landlordNotificationsTmpl3Content", {
                building: activeBuilding?.name || t("landlordNotificationsBuildingFallback"),
            }),
        },
        {
            title: t("landlordNotificationsTmpl4Title"),
            category: "Khẩn cấp",
            content: t("landlordNotificationsTmpl4Content"),
        },
    ], [activeBuilding?.name, t]);

    if (!isMounted) return null;

    return (
        <div className="space-y-6 animate-in fade-in duration-300 pb-12">
            {/* Toast Notification Banner */}
            {toast && (
                <div className="fixed top-6 right-6 z-70 animate-in slide-in-from-top-3 duration-200">
                    <div
                        className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${toast.type === "success"
                            ? "bg-emerald-50/95 text-emerald-800 border-emerald-200"
                            : "bg-rose-50/95 text-rose-800 border-rose-200"
                            }`}
                    >
                        {toast.type === "success" ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        ) : (
                            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{toast.text}</span>
                        <button
                            onClick={() => setToast(null)}
                            className="ml-2 text-zinc-400 hover:text-zinc-600 p-0.5 cursor-pointer"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            {/* 1. Header & Dark Hero Banner */}
            <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                    <Send className="w-64 h-64 text-white" />
                </div>

                <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
                    {/* Building Context Info */}
                    <div className="space-y-3 max-w-xl w-full">
                        <div className="flex flex-wrap items-center gap-2">
                            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                                {activeBuilding?.name || t("landlordNotificationsHeroTitle")}
                            </h1>
                        </div>

                        {activeBuilding?.address && (
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
                                <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                                    <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">
                                        {activeBuilding.address}
                                    </span>
                                </div>
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                                >
                                    <span>{tCommon("viewMap")}</span> &rarr;
                                </a>
                            </div>
                        )}

                        <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                            {t("landlordNotificationsHeroSubtitle")}
                        </p>
                    </div>

                    {/* 3 Unified Metric Chips */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                        {/* 1. Total Announcements */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[155px]">
                            <Send className="w-5 h-5 text-[#2AC1BC] shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">
                                    {t("landlordNotificationsStatTotal")}
                                </span>
                                <span className="font-black text-white text-lg leading-none mt-1">
                                    {summary.totalAnnouncements}
                                </span>
                            </div>
                        </div>

                        {/* 2. Reached Tenants */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[155px]">
                            <Users className="w-5 h-5 text-blue-400 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
                                    {t("landlordNotificationsStatReached")}
                                </span>
                                <span className="font-black text-white text-lg leading-none mt-1">
                                    {summary.totalTargetTenants}
                                </span>
                            </div>
                        </div>

                        {/* 3. Emergency Announcements */}
                        <div className="flex items-center gap-3 px-4 py-3 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[155px]">
                            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                            <div className="flex flex-col">
                                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">
                                    {t("landlordNotificationsStatUrgent")}
                                </span>
                                <span className="font-black text-rose-500 text-lg leading-none mt-1">
                                    {summary.emergencyCount}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. Action & Filter Bar */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Input */}
                <div className="relative flex-1">
                    <TextInput
                        placeholder={t("landlordNotificationsSearchPlaceholder")}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search className="w-4 h-4" />}
                        rightIcon={
                            searchQuery ? (
                                <button
                                    type="button"
                                    onClick={() => setSearchQuery("")}
                                    className="text-zinc-400 hover:text-zinc-600 cursor-pointer"
                                >
                                    <X className="w-3.5 h-3.5" />
                                </button>
                            ) : undefined
                        }
                    />
                </div>

                {/* Filter Controls & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                    {/* Category Filter */}
                    <div className="w-36 sm:w-40">
                        <SelectInput
                            value={categoryFilter}
                            onChange={(e) => setCategoryFilter(e.target.value)}
                            options={[
                                { value: "", label: t("landlordNotificationsFilterAllCategories") },
                                { value: "Điện nước", label: t("landlordNotificationsCatUtilities") },
                                { value: "Tiền nhà", label: t("landlordNotificationsCatRent") },
                                { value: "Nội quy", label: t("landlordNotificationsCatRules") },
                                { value: "Khẩn cấp", label: t("landlordNotificationsCatEmergency") },
                            ]}
                        />
                    </div>

                    {/* Channel Filter */}
                    <div className="w-36 sm:w-40">
                        <SelectInput
                            value={channelFilter}
                            onChange={(e) => setChannelFilter(e.target.value)}
                            options={[
                                { value: "", label: t("landlordNotificationsFilterAllChannels") },
                                { value: "Thông báo hệ thống", label: t("landlordNotificationsChannelInApp") },
                                { value: "Zalo OA", label: t("landlordNotificationsChannelZalo") },
                                { value: "SMS", label: t("landlordNotificationsChannelSms") },
                            ]}
                        />
                    </div>

                    {/* View Switcher (Rule #9: Grid is Default) */}
                    <div className="flex items-center p-1 bg-zinc-100 rounded-xl border border-zinc-200/80">
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode("grid");
                                if (itemsPerPage === 10) setItemsPerPage(6);
                            }}
                            title={t("landlordNotificationsViewGrid")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "grid"
                                ? "bg-white text-zinc-900 shadow-2xs"
                                : "text-zinc-400 hover:text-zinc-700"
                                }`}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setViewMode("list");
                                if (itemsPerPage === 6) setItemsPerPage(10);
                            }}
                            title={t("landlordNotificationsViewList")}
                            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${viewMode === "list"
                                ? "bg-white text-zinc-900 shadow-2xs"
                                : "text-zinc-400 hover:text-zinc-700"
                                }`}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Refresh Button */}
                    <button
                        type="button"
                        onClick={() => fetchAnnouncements()}
                        disabled={isLoading}
                        title={t("landlordNotificationsRefreshList")}
                        className="p-2.5 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl text-zinc-600 hover:text-zinc-900 transition-colors shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin text-[#2AC1BC]" : ""}`} />
                    </button>

                    {/* Broadcast New Notice Button */}
                    <Button
                        onClick={() => setIsNotifModalOpen(true)}
                        className="bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-sm shadow-[#2AC1BC]/20 flex items-center gap-1.5 py-2 px-4"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("landlordNotificationsBtnBroadcast")}</span>
                    </Button>
                </div>
            </div>

            {/* 3. Announcements List Section */}
            <div className="space-y-4">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-zinc-200 text-center">
                        <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
                        <p className="text-xs font-bold text-zinc-600">
                            {t("landlordNotificationsLoading")}
                        </p>
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 px-4 bg-white rounded-2xl border border-zinc-200 border-dashed text-center">
                        <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-3 text-zinc-400">
                            <Send className="w-8 h-8" />
                        </div>
                        <h3 className="text-base font-bold text-zinc-800">
                            {t("landlordNotificationsEmptyTitle")}
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm">
                            {t("landlordNotificationsEmptyDesc")}
                        </p>
                        <Button
                            onClick={() => setIsNotifModalOpen(true)}
                            className="mt-4 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#2AC1BC]/20 flex items-center gap-1.5"
                        >
                            <Plus className="w-4 h-4" />
                            <span>{t("landlordNotificationsCreateFirstNotif")}</span>
                        </Button>
                    </div>
                ) : viewMode === "grid" ? (
                    /* Parallel View 1: Grid View (Default) */
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {notifications.map((notif) => {
                            const readPct = notif.totalTarget > 0 ? Math.round((notif.readCount / notif.totalTarget) * 100) : 0;
                            const isEmergency = notif.category === "Khẩn cấp" || notif.category === "Emergency";
                            const isUtilities = notif.category === "Điện nước" || notif.category === "Utilities";
                            const isRent = notif.category === "Tiền nhà" || notif.category === "Rent";

                            return (
                                <div
                                    key={notif.id}
                                    onClick={() => setSelectedNotifDetail(notif)}
                                    className="bg-white border border-zinc-200/80 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all cursor-pointer group flex flex-col justify-between"
                                >
                                    <div>
                                        {/* Header: Category Badge + Sent Time */}
                                        <div className="flex items-center justify-between gap-2 pb-3 border-b border-zinc-100">
                                            <span
                                                className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${isEmergency
                                                    ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                                    : isUtilities
                                                        ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                        : isRent
                                                            ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                                            : "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                                                    }`}
                                            >
                                                {getCategoryLabel(notif.category)}
                                            </span>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-semibold text-zinc-400">{notif.sentAt}</span>
                                                <button
                                                    type="button"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeletingNotifId(notif.id);
                                                    }}
                                                    className="text-zinc-300 hover:text-rose-500 transition-colors p-1 cursor-pointer"
                                                    title={t("landlordNotificationsDeleteAction")}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Title & Preview */}
                                        <div className="py-3 space-y-1.5">
                                            <h3 className="font-extrabold text-sm text-zinc-900 group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                                                {notif.title}
                                            </h3>
                                            <p className="text-zinc-500 text-xs line-clamp-2 leading-relaxed whitespace-pre-line">
                                                {notif.content}
                                            </p>
                                        </div>

                                        {/* Metadata Pills */}
                                        <div className="flex flex-wrap items-center gap-2 py-2 border-t border-zinc-100 text-xs font-bold text-zinc-700">
                                            <span className="inline-flex items-center gap-1.5 bg-zinc-100 px-2.5 py-1 rounded-full text-[11px]">
                                                <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                                <span className="truncate max-w-[120px]">{notif.targetScope}</span>
                                            </span>
                                            <span className="inline-flex items-center gap-1.5 bg-[#2AC1BC]/10 text-[#2AC1BC] px-2.5 py-1 rounded-full text-[11px]">
                                                <Smartphone className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                                                <span>{getChannelLabel(notif.channel)}</span>
                                            </span>
                                        </div>

                                        {/* Read Progress Bar */}
                                        <div className="pt-2 border-t border-zinc-100">
                                            <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                                                <span className="text-zinc-600">
                                                    {t("landlordNotificationsReadPrefix")}: {notif.readCount}/{notif.totalTarget} {t("landlordNotificationsTenantsUnit")}
                                                </span>
                                                <span className="text-[#2AC1BC]">{readPct}%</span>
                                            </div>
                                            <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-[#2AC1BC] rounded-full transition-all" style={{ width: `${readPct}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Details Button */}
                                    <div className="pt-3 mt-3 border-t border-zinc-100 flex items-center justify-end">
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setSelectedNotifDetail(notif);
                                            }}
                                            className="w-full px-3 py-1.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC] text-[#2AC1BC] hover:text-white border border-[#2AC1BC]/30 text-xs font-extrabold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                                        >
                                            <Eye className="w-3.5 h-3.5" />
                                            <span>{t("landlordNotificationsViewDetails")}</span>
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    /* Parallel View 2: Table/List View */
                    <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-2xs overflow-hidden">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                                <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 border-b border-zinc-200/80">
                                    <tr>
                                        <th className="px-4 py-3.5 whitespace-nowrap w-80">
                                            {t("landlordNotificationsColCategoryTitle")}
                                        </th>
                                        <th className="px-4 py-3.5 whitespace-nowrap">
                                            {t("landlordNotificationsColTargetAudience")}
                                        </th>
                                        <th className="px-4 py-3.5 whitespace-nowrap">
                                            {t("landlordNotificationsColChannel")}
                                        </th>
                                        <th className="px-4 py-3.5 whitespace-nowrap">
                                            {t("landlordNotificationsColReadRate")}
                                        </th>
                                        <th className="px-4 py-3.5 whitespace-nowrap">
                                            {t("landlordNotificationsColSentAt")}
                                        </th>
                                        <th className="px-4 py-3.5 text-right whitespace-nowrap">
                                            {t("landlordNotificationsColActions")}
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-100 font-medium">
                                    {notifications.map((notif) => {
                                        const readPct = notif.totalTarget > 0 ? Math.round((notif.readCount / notif.totalTarget) * 100) : 0;
                                        const isEmergency = notif.category === "Khẩn cấp" || notif.category === "Emergency";
                                        const isUtilities = notif.category === "Điện nước" || notif.category === "Utilities";
                                        const isRent = notif.category === "Tiền nhà" || notif.category === "Rent";

                                        return (
                                            <tr key={notif.id} className="hover:bg-zinc-50/80 transition-colors">
                                                <td className="px-4 py-4 max-w-sm">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span
                                                            className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${isEmergency
                                                                ? "bg-rose-500/15 text-rose-600 border border-rose-500/30"
                                                                : isUtilities
                                                                    ? "bg-amber-500/15 text-amber-600 border border-amber-500/30"
                                                                    : isRent
                                                                        ? "bg-emerald-500/15 text-emerald-700 border border-emerald-500/30"
                                                                        : "bg-blue-500/15 text-blue-600 border border-blue-500/30"
                                                                }`}
                                                        >
                                                            {getCategoryLabel(notif.category)}
                                                        </span>
                                                        <span className="font-bold text-zinc-900 text-sm truncate">{notif.title}</span>
                                                    </div>
                                                    <p className="text-zinc-500 text-xs line-clamp-1">{notif.content}</p>
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                                                        <Building2 className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                                                        <span>{notif.targetScope}</span>
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <span className="inline-flex items-center gap-1.5 text-xs font-bold text-zinc-700 whitespace-nowrap">
                                                        <Smartphone className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                                                        <span>{getChannelLabel(notif.channel)}</span>
                                                    </span>
                                                </td>

                                                <td className="px-4 py-4 whitespace-nowrap min-w-[160px]">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center justify-between text-[11px] font-bold">
                                                            <span className="text-zinc-700">
                                                                {notif.readCount}/{notif.totalTarget} {t("landlordNotificationsTenantsUnit")}
                                                            </span>
                                                            <span className="text-[#2AC1BC]">{readPct}%</span>
                                                        </div>
                                                        <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                                                            <div className="h-full bg-[#2AC1BC] rounded-full transition-all" style={{ width: `${readPct}%` }} />
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="px-4 py-4 text-zinc-500 font-semibold whitespace-nowrap">
                                                    {notif.sentAt}
                                                </td>

                                                <td className="px-4 py-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => setSelectedNotifDetail(notif)}
                                                            className="px-3 py-1.5 bg-zinc-100 hover:bg-[#2AC1BC] hover:text-white text-zinc-700 text-xs font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                                                        >
                                                            <Eye className="w-3.5 h-3.5" />
                                                            <span>{t("landlordNotificationsBtnDetails")}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setDeletingNotifId(notif.id)}
                                                            className="p-1.5 text-zinc-400 hover:text-rose-500 transition-colors cursor-pointer"
                                                            title={t("landlordNotificationsBtnDelete")}
                                                        >
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* 4. Standardized Pagination Footer (Rule #9) */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs">
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                        <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                            <span>{t("landlordNotificationsPaginationShowing")}</span>
                            <input
                                type="number"
                                min={1}
                                max={100}
                                value={itemsPerPage || ""}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                                    setPage(1);
                                }}
                                className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
                            />
                            <span>{t("landlordNotificationsPaginationPerPage")}</span>
                        </div>

                        <span className="hidden sm:inline text-zinc-300">|</span>

                        <div>
                            <span className="font-extrabold text-zinc-800">
                                {totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1}
                            </span>
                            {" - "}
                            <span className="font-extrabold text-zinc-800">
                                {Math.min(page * itemsPerPage, totalItems)}
                            </span>
                            {` ${t("landlordNotificationsPaginationOf")} `}
                            <span className="font-extrabold text-zinc-800">{totalItems}</span>
                            {` ${t("landlordNotificationsPaginationAnnouncements")}`}
                        </div>
                    </div>

                    {/* 5-Page Window Pagination (Rule #9) */}
                    {(() => {
                        const windowSize = 5;
                        const windowStart = Math.floor((page - 1) / windowSize) * windowSize + 1;
                        const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
                        const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

                        return (
                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    disabled={page === 1}
                                    onClick={() => setPage(Math.max(windowStart - windowSize, 1))}
                                    className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                >
                                    &larr; {t("landlordNotificationsPaginationPrev")}
                                </button>
                                {visiblePages.map((p) => (
                                    <button
                                        type="button"
                                        key={p}
                                        onClick={() => setPage(p)}
                                        className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${page === p
                                            ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                                            : "bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                            }`}
                                    >
                                        {p}
                                    </button>
                                ))}
                                <button
                                    type="button"
                                    disabled={page === totalPages || windowStart + windowSize > totalPages}
                                    onClick={() => setPage(Math.min(windowStart + windowSize, totalPages))}
                                    className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
                                >
                                    {t("landlordNotificationsPaginationNext")} &rarr;
                                </button>
                            </div>
                        );
                    })()}
                </div>
            </div>

            {/* 5. MODAL: Create Broadcast Announcement Modal */}
            {isNotifModalOpen && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) requestCloseNotifModal();
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-[#2AC1BC]/20 text-[#2AC1BC] rounded-xl border border-[#2AC1BC]/30">
                                    <Send className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-black tracking-tight text-white">
                                        {t("landlordNotificationsModalTitle")}
                                    </h2>
                                    <p className="text-xs text-zinc-400 mt-0.5">
                                        {t("landlordNotificationsModalSubtitle")}
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={requestCloseNotifModal}
                                className="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body Form */}
                        <form onSubmit={handleBroadcastAnnouncement} className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-zinc-50/50">
                            {/* Quick Templates */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center gap-1">
                                    <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" />
                                    <span>{t("landlordNotificationsTemplatesLabel")}</span>
                                </label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {notificationTemplates.map((tmpl) => (
                                        <button
                                            key={tmpl.title}
                                            type="button"
                                            onClick={() => {
                                                setNotifTitle(tmpl.title);
                                                setNotifContent(tmpl.content);
                                                setNotifCategory(tmpl.category);
                                            }}
                                            className="p-2.5 text-left border border-zinc-200 hover:border-[#2AC1BC] hover:bg-[#2AC1BC]/5 rounded-xl transition-all bg-white cursor-pointer group"
                                        >
                                            <div className="text-xs font-bold text-zinc-900 group-hover:text-[#2AC1BC] truncate">
                                                {tmpl.title}
                                            </div>
                                            <div className="text-[10px] text-zinc-500 mt-0.5 font-medium">
                                                {getCategoryLabel(tmpl.category)}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Title */}
                            <TextInput
                                label={t("landlordNotificationsFieldTitle")}
                                required
                                placeholder={t("landlordNotificationsFieldTitlePlaceholder")}
                                value={notifTitle}
                                onChange={(e) => setNotifTitle(e.target.value)}
                            />

                            {/* Target & Channel */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <TextInput
                                    label={t("landlordNotificationsFieldTargetScope")}
                                    value={notifTargetScope}
                                    onChange={(e) => setNotifTargetScope(e.target.value)}
                                    placeholder={t("landlordNotificationsFieldTargetScopePlaceholder")}
                                />

                                <SelectInput
                                    label={t("landlordNotificationsFieldChannel")}
                                    value={notifChannel}
                                    onChange={(e) => setNotifChannel(e.target.value)}
                                    options={[
                                        { value: "Thông báo hệ thống", label: t("landlordNotificationsChannelInAppFull") },
                                        { value: "Zalo OA", label: t("landlordNotificationsChannelZalo") },
                                        { value: "SMS", label: t("landlordNotificationsChannelSmsDirect") },
                                    ]}
                                />
                            </div>

                            {/* Category */}
                            <SelectInput
                                label={t("landlordNotificationsFieldCategory")}
                                value={notifCategory}
                                onChange={(e) => setNotifCategory(e.target.value)}
                                options={[
                                    { value: "Điện nước", label: t("landlordNotificationsCatUtilities") },
                                    { value: "Tiền nhà", label: t("landlordNotificationsCatRent") },
                                    { value: "Nội quy", label: t("landlordNotificationsCatRules") },
                                    { value: "Khẩn cấp", label: t("landlordNotificationsCatEmergency") },
                                ]}
                            />

                            {/* Content */}
                            <TextareaInput
                                label={t("landlordNotificationsFieldContent")}
                                required
                                rows={5}
                                placeholder={t("landlordNotificationsFieldContentPlaceholder")}
                                value={notifContent}
                                onChange={(e) => setNotifContent(e.target.value)}
                            />

                            {/* Submit Footer */}
                            <div className="pt-4 border-t border-zinc-200 flex items-center justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={requestCloseNotifModal}
                                    disabled={isSubmitting}
                                    className="px-5 py-2.5 text-xs font-bold text-zinc-700 bg-white border border-zinc-200 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    {t("landlordNotificationsBtnCancel")}
                                </button>
                                <Button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl shadow-sm shadow-[#2AC1BC]/20 flex items-center gap-1.5 py-2.5 px-5 disabled:opacity-50"
                                >
                                    {isSubmitting ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            <span>{t("landlordNotificationsBroadcasting")}</span>
                                        </>
                                    ) : (
                                        <>
                                            <Send className="w-4 h-4" />
                                            <span>{t("landlordNotificationsBtnBroadcastNow")}</span>
                                        </>
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* 6. MODAL: View Announcement Details */}
            {selectedNotifDetail && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setSelectedNotifDetail(null);
                    }}
                >
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
                        {/* Header */}
                        <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-zinc-900 text-white">
                            <div className="flex items-center gap-2.5">
                                <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase">
                                    {getCategoryLabel(selectedNotifDetail.category)}
                                </span>
                                <h3 className="text-sm font-bold text-white">
                                    {t("landlordNotificationsDetailTitle")}
                                </h3>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedNotifDetail(null)}
                                className="p-1.5 text-zinc-400 hover:text-white rounded-full transition-colors cursor-pointer"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6 space-y-4 text-xs font-medium">
                            <div>
                                <h2 className="text-base font-black text-zinc-900 leading-snug mb-1">
                                    {selectedNotifDetail.title}
                                </h2>
                                <div className="flex items-center gap-3 text-zinc-400 text-[11px] font-bold">
                                    <span>
                                        {t("landlordNotificationsDetailSentAt", { time: selectedNotifDetail.sentAt })}
                                    </span>
                                    <span>•</span>
                                    <span>
                                        {t("landlordNotificationsDetailChannel", { channel: getChannelLabel(selectedNotifDetail.channel) })}
                                    </span>
                                </div>
                            </div>

                            <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-200/80 text-zinc-800 leading-relaxed whitespace-pre-line">
                                {selectedNotifDetail.content}
                            </div>

                            <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-4 h-4 text-blue-600" />
                                    <span className="text-zinc-700 font-bold">
                                        {t("landlordNotificationsDetailTargetReach")}
                                    </span>
                                </div>
                                <span className="font-black text-blue-600 text-sm">
                                    {t("landlordNotificationsDetailResidentsUnit", { count: selectedNotifDetail.totalTarget })}
                                </span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="p-4 border-t border-zinc-100 bg-zinc-50 flex items-center justify-between">
                            <button
                                type="button"
                                onClick={() => {
                                    setDeletingNotifId(selectedNotifDetail.id);
                                    setSelectedNotifDetail(null);
                                }}
                                className="px-4 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span>{t("landlordNotificationsDetailDelete")}</span>
                            </button>

                            <button
                                type="button"
                                onClick={() => setSelectedNotifDetail(null)}
                                className="px-5 py-2 text-xs font-bold text-white bg-zinc-900 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
                            >
                                {t("landlordNotificationsDetailClose")}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 7. MODAL: Confirm Delete Modal */}
            {deletingNotifId && (
                <div
                    className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) setDeletingNotifId(null);
                    }}
                >
                    <div className="bg-white rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-zinc-100">
                        <div className="w-14 h-14 bg-rose-50 border border-rose-200/80 rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
                            <Trash2 className="w-7 h-7" />
                        </div>

                        <div className="space-y-2">
                            <h3 className="text-xl font-black text-zinc-900 tracking-tight">
                                {t("landlordNotificationsConfirmDeleteTitle")}
                            </h3>
                            <p className="text-xs sm:text-sm text-zinc-500 font-medium leading-relaxed max-w-xs mx-auto">
                                {t("landlordNotificationsConfirmDeleteDesc")}
                            </p>
                        </div>

                        <div className="flex items-center justify-center gap-3 pt-2">
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => setDeletingNotifId(null)}
                                className="flex-1 py-2.5 px-4 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-bold rounded-xl border border-zinc-300 transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                            >
                                {t("landlordNotificationsBtnCancel")}
                            </button>
                            <button
                                type="button"
                                disabled={isDeleting}
                                onClick={() => handleDeleteAnnouncement(deletingNotifId)}
                                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-sm shadow-rose-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
                            >
                                {isDeleting ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Trash2 className="w-4 h-4" />
                                )}
                                <span>{t("landlordNotificationsConfirmDeleteBtn")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
