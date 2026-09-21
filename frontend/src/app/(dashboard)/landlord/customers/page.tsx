"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
    Search,
    UploadCloud,
    Plus,
    LayoutGrid,
    List,
    Users,
    MapPin,
    AlertCircle,
    CheckCircle2,
    Info,
    FileSpreadsheet,
    PhoneCall,
    MessageCircle,
    Eye,
    AlertTriangle,
    Loader2,
} from "lucide-react";
import { Customer } from "./data";
import { getLandlordContracts } from "@/services/contract.service";
import { useAuth } from "@/context/AuthContext";
import { useTranslations } from "@/context/LanguageContext";
import { Button, TextInput, SelectInput } from "@/components/ui";

export default function CustomersPage() {
    const { activeBuilding } = useAuth();
    const router = useRouter();
    const t = useTranslations("landlord");

    const getCustomerStatusLabel = (status: string) => {
        switch (status) {
            case "Đang ở":
                return t("landlordCustomersStaying");
            case "Sắp hết hợp đồng":
                return t("landlordCustomersExpiringSoon");
            case "Đã rời":
                return t("landlordCustomersLeft");
            default:
                return status;
        }
    };

    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const [searchQuery, setSearchQuery] = useState("");
    const [buildingFilter, setBuildingFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [sortFilter, setSortFilter] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(6);

    // Professional Alert Popup Modal State
    const [alertModal, setAlertModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type: "warning" | "error" | "success" | "info";
    }>({
        isOpen: false,
        title: t("landlordCustomersAlertDefaultTitle"),
        message: "",
        type: "info",
    });

    const showAlert = (message: string, type: "warning" | "error" | "success" | "info" = "warning", title?: string) => {
        const finalTitle = title || t("landlordCustomersAlertDefaultTitle");
        setAlertModal({ isOpen: true, title: finalTitle, message, type });
    };

    const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, buildingFilter, statusFilter, sortFilter, itemsPerPage]);

    const [customers, setCustomers] = useState<Customer[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);

    // Load real customers from active property contracts
    useEffect(() => {
        async function loadCustomers() {
            if (!activeBuilding?.id) {
                setCustomers([]);
                return;
            }
            const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!UUID_RE.test(activeBuilding.id)) {
                setCustomers([]);
                return;
            }

            try {
                setIsLoading(true);
                const res = await getLandlordContracts(activeBuilding.id, { limit: 100 });
                const list = res?.data || [];
                const mapped: Customer[] = list.flatMap((c: any) => {
                    const tContracts = c.tenantContracts || [];
                    const daysRemaining = c.endDate
                        ? Math.max(0, Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                        : undefined;
                    const contractStatus = c.status === "active"
                        ? (daysRemaining !== undefined && daysRemaining <= 30 ? "Sắp hết hợp đồng" : "Đang ở")
                        : c.status === "draft"
                            ? "Sắp hết hợp đồng"
                            : "Đã rời";

                    if (tContracts.length === 0) {
                        return [{
                            id: `cust_${c.id}`,
                            name: t("landlordCustomersDefaultName"),
                            phone: "—",
                            room: c.room?.roomNumber || "—",
                            building: activeBuilding.id,
                            cccd: "—",
                            joinDate: c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "—",
                            endDate: c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : undefined,
                            daysRemaining,
                            status: contractStatus,
                            hasAccount: false,
                        }];
                    }
                    return tContracts.map((tc: any) => {
                        const tenantUser = tc.tenant;
                        const ident = tenantUser?.userIdentification;
                        return {
                            id: tenantUser?.id || `cust_${c.id}`,
                            name: ident?.fullName || tenantUser?.username || t("landlordCustomersDefaultName"),
                            phone: tenantUser?.phoneNumber || "—",
                            room: c.room?.roomNumber || "—",
                            building: activeBuilding.id,
                            cccd: ident?.identityNumber || "—",
                            joinDate: c.startDate ? new Date(c.startDate).toLocaleDateString("vi-VN") : "—",
                            endDate: c.endDate ? new Date(c.endDate).toLocaleDateString("vi-VN") : undefined,
                            daysRemaining,
                            status: contractStatus,
                            email: tenantUser?.email || undefined,
                            dob: ident?.dateOfBirth ? new Date(ident.dateOfBirth).toLocaleDateString("vi-VN") : undefined,
                            gender: ident?.gender || "nam",
                            address: ident?.permanentAddress || undefined,
                            hasAccount: !!tenantUser?.id,
                        };
                    });
                });
                setCustomers(mapped);
            } catch (err) {
                console.warn("Failed to load customers from contracts:", err);
                setCustomers([]);
            } finally {
                setIsLoading(false);
            }
        }

        loadCustomers();
    }, [activeBuilding?.id]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            const rawId = params.get('id');
            if (rawId) {
                router.push(`/landlord/customers/${encodeURIComponent(rawId)}`);
            }
        }
    }, [router]);

    if (!isMounted) {
        return null;
    }

    const filteredCustomers = customers.filter(customer => {
        const matchSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.phone.includes(searchQuery) ||
            customer.cccd.includes(searchQuery);
        const matchBuilding = buildingFilter === "" || customer.building === buildingFilter;
        const matchStatus = statusFilter === "" || customer.status === statusFilter;
        return matchSearch && matchBuilding && matchStatus;
    });

    const sortedCustomers = [...filteredCustomers].sort((a, b) => {
        if (sortFilter === "name_asc") return a.name.localeCompare(b.name);
        if (sortFilter === "room_asc") return a.room.localeCompare(b.room);
        return 0;
    });

    const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage);

    const totalCustomers = customers.length;
    const stayingCount = customers.filter(c => c.status === 'Đang ở').length;
    const expiringCount = customers.filter(c => c.status === 'Sắp hết hợp đồng').length;
    const leftCount = customers.filter(c => c.status === 'Đã rời').length;

    return (
        <div className="space-y-6">
            {/* Top Bar / Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-zinc-900 tracking-tight flex items-center gap-2">
                        {t("landlordCustomersPageHeading")}
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-500 mt-0.5 font-medium">
                        {t("landlordCustomersPageSubheading")}
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showAlert(t("landlordCustomersAlertImportExcel"), "info", t("landlordCustomersAlertExperimentalTitle"))}
                        className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border-zinc-200 rounded-xl hover:bg-zinc-100 shadow-2xs gap-1.5"
                    >
                        <UploadCloud className="w-4 h-4 text-emerald-600" />
                        <span>{t("landlordCustomersImportBtn")}</span>
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => showAlert(t("landlordCustomersAlertExportExcel"), "success", t("landlordCustomersAlertExportTitle"))}
                        className="px-3.5 py-2 text-xs font-bold text-zinc-700 bg-white border-zinc-200 rounded-xl hover:bg-zinc-100 shadow-2xs gap-1.5"
                    >
                        <FileSpreadsheet className="w-4 h-4 text-blue-600" />
                        <span>{t("landlordCustomersExportBtn")}</span>
                    </Button>
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={() => router.push("/landlord/contracts/create")}
                        className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-bold shadow-sm shadow-[#2AC1BC]/20 bg-[#2AC1BC] hover:bg-[#25ad87] text-white rounded-xl"
                    >
                        <Plus className="w-4 h-4" />
                        <span>{t("landlordCustomersBtnAddContract")}</span>
                    </Button>
                </div>
            </div>

            {/* Building Overview Banner */}
            {activeBuilding && (
                <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
                    {/* Background Decoration */}
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
                        <Users className="w-64 h-64" />
                    </div>

                    <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
                        <div className="space-y-3 max-w-xl w-full">
                            <div className="flex flex-wrap items-center gap-2">
                                <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                                    {activeBuilding.name}
                                </h2>
                                <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                                    {t("landlordContractsBannerOperating")}
                                </span>
                            </div>

                            {/* Separated Address Line with Integrated Map Link */}
                            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
                                <div className="flex items-center gap-2 min-w-0">
                                    <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                                    <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">{activeBuilding.address}</span>
                                </div>
                                <a
                                    href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                                >
                                    <span>{t("landlordInvoicesViewMap")}</span> &rarr;
                                </a>
                            </div>

                            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                                {t("landlordCustomersBannerSub")}
                            </p>
                        </div>

                        {/* 4 Unified Stat Chips (Aesthetic Single Row matching Assets & Services) */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
                                <Users className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">{t("landlordCustomersStatTotalShort")}</span>
                                    <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">{totalCustomers}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">{t("landlordCustomersStatStayingShort")}</span>
                                    <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{stayingCount}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
                                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">{t("landlordCustomersStatExpiringShort")}</span>
                                    <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{expiringCount}</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                                <div className="flex flex-col">
                                    <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">{t("landlordCustomersStatLeftShort")}</span>
                                    <span className="font-black text-white text-base sm:text-lg leading-none mt-1">{leftCount}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* SINGLE ROW TOOLBAR (Filter Pills + Search + Sort + View Switcher all in 1 Row) */}
            <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-2xs">
                <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                    {/* Left Controls: Status Pills + Search + Sort */}
                    <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                        {/* Filter Pills */}
                        {[
                            { id: "", label: t("landlordCustomersAll"), count: totalCustomers, color: "text-zinc-700 bg-zinc-100 border-zinc-200" },
                            { id: "Đang ở", label: t("landlordCustomersStatStayingShort"), count: stayingCount, color: "text-[#2AC1BC] bg-[#2AC1BC]/10 border-[#2AC1BC]/30" },
                            { id: "Sắp hết hợp đồng", label: t("landlordCustomersStatExpiringShort"), count: expiringCount, color: "text-orange-700 bg-orange-50 border-orange-200" },
                            { id: "Đã rời", label: t("landlordCustomersStatLeftShort"), count: leftCount, color: "text-blue-700 bg-blue-50 border-blue-200" },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setStatusFilter(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border cursor-pointer whitespace-nowrap shrink-0 ${statusFilter === tab.id
                                    ? "bg-[#2AC1BC] text-white border-[#2AC1BC] shadow-2xs"
                                    : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                                    }`}
                            >
                                <span className="whitespace-nowrap">{tab.label}</span>
                                <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-black whitespace-nowrap ${statusFilter === tab.id ? "bg-white/20 text-white" : tab.color
                                    }`}>
                                    {tab.count}
                                </span>
                            </button>
                        ))}

                        {/* Separator Line */}
                        <div className="hidden xl:block h-6 w-px bg-zinc-200 mx-1 shrink-0" />

                        {/* Search Input using Base Component */}
                        <TextInput
                            leftIcon={<Search className="w-4 h-4 text-zinc-400" />}
                            placeholder={t("landlordCustomersSearchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            containerClassName="w-full sm:w-52 shrink-0 space-y-0"
                            className="py-1.5 text-xs font-semibold bg-zinc-50 border-zinc-200 focus:bg-white rounded-xl"
                        />

                        {/* Sort Select using Base Component */}
                        <SelectInput
                            value={sortFilter}
                            onChange={(e) => setSortFilter(e.target.value)}
                            containerClassName="w-auto shrink-0 space-y-0"
                            className="py-1.5 pl-3 pr-8 text-xs font-semibold text-zinc-700 bg-zinc-50 border-zinc-200 rounded-xl"
                            options={[
                                { value: "", label: t("landlordCustomersSort") },
                                { value: "name_asc", label: t("landlordCustomersSortName") },
                                { value: "room_asc", label: t("landlordCustomersSortRoom") },
                            ]}
                        />
                    </div>

                    {/* Right Controls: View Mode Switcher */}
                    <div className="flex items-center justify-end gap-1 bg-zinc-100 p-1 rounded-xl border border-zinc-200 shrink-0 self-end lg:self-auto">
                        <button
                            onClick={() => { setViewMode("grid"); setItemsPerPage(6); setCurrentPage(1); }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "grid" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                                }`}
                            title={t("landlordCustomersViewGrid")}
                        >
                            <LayoutGrid className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => { setViewMode("list"); setItemsPerPage(10); setCurrentPage(1); }}
                            className={`p-1.5 rounded-lg transition-all cursor-pointer ${viewMode === "list" ? "bg-white text-[#2AC1BC] shadow-2xs font-extrabold" : "text-zinc-500 hover:text-zinc-900"
                                }`}
                            title={t("landlordCustomersViewList")}
                        >
                            <List className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Customer View: Grid or List */}
            {viewMode === "grid" ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sortedCustomers.length === 0 ? (
                        <div className="col-span-full py-14 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                                    <span className="text-xs font-bold">{t("landlordCustomersLoading")}</span>
                                </div>
                            ) : (
                                <div className="flex flex-col items-center gap-2">
                                    <Users className="w-8 h-8 text-zinc-300" />
                                    <p className="text-sm font-bold text-zinc-700">{t("landlordCustomersEmptyTitle")}</p>
                                    <p className="text-xs text-zinc-400">{t("landlordCustomersEmptyDesc")}</p>
                                    <Button
                                        variant="primary"
                                        size="sm"
                                        onClick={() => router.push("/landlord/contracts/create")}
                                        className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all shadow-2xs"
                                    >
                                        <Plus className="w-3.5 h-3.5" />
                                        <span>{t("landlordCustomersBtnCreateContract")}</span>
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        paginatedCustomers.map((customer) => (
                            <div
                                key={customer.id}
                                className="bg-white rounded-2xl border border-zinc-200/80 p-4 shadow-xs hover:shadow-md transition-all space-y-3 relative group"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-sm uppercase shrink-0">
                                            {customer.name.charAt(0)}
                                        </div>
                                        <div className="min-w-0">
                                            <Link href={`/landlord/customers/${customer.id}`} className="font-bold text-zinc-900 text-sm hover:text-[#2AC1BC] cursor-pointer transition-colors truncate block">
                                                {customer.name}
                                            </Link>
                                            <p className="text-xs text-zinc-500 font-medium truncate">{t("landlordCustomersIdCardHeader")}: {customer.cccd}</p>
                                        </div>
                                    </div>
                                    <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 whitespace-nowrap ${customer.status === 'Đang ở'
                                        ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30'
                                        : customer.status === 'Sắp hết hợp đồng'
                                            ? 'bg-orange-50 text-orange-700 border border-orange-200 animate-pulse'
                                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                                        }`}>
                                        {getCustomerStatusLabel(customer.status)}
                                    </span>
                                </div>

                                <div className="p-2.5 bg-zinc-50 rounded-xl space-y-1.5 text-xs text-zinc-600">
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-medium whitespace-nowrap">{t("landlordCustomersBuildingAndRoomLabel")}</span>
                                        <span className="font-bold text-zinc-900 whitespace-nowrap">{activeBuilding?.name || t("landlordCustomersBuildingFallback")} — {t("landlordCustomersRoomWord")} {customer.status === 'Đã rời' ? "—" : customer.room}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-zinc-400 font-medium whitespace-nowrap">{t("landlordCustomersStayDate")}</span>
                                        <span className="font-semibold text-zinc-800 whitespace-nowrap">{customer.joinDate}</span>
                                    </div>
                                    {customer.status === 'Sắp hết hợp đồng' && (
                                        <div className="flex justify-between items-center pt-1 border-t border-orange-200/60 text-orange-800 font-bold">
                                            <span className="whitespace-nowrap">⏳ {t("landlordCustomersContractExpiry")}</span>
                                            <span className="text-orange-600 animate-pulse whitespace-nowrap">
                                                {customer.daysRemaining !== undefined
                                                    ? t("landlordCustomersContractDaysRemaining").replace("{days}", String(customer.daysRemaining))
                                                    : t("landlordCustomersDaysRemainingShort")}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {/* Quick Inline Action Buttons */}
                                <div className="grid grid-cols-3 gap-1.5 pt-1">
                                    <a
                                        href={`tel:${customer.phone}`}
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-1.5 bg-red-600 text-white border border-zinc-200 rounded-xl text-[11px] font-extrabold hover:bg-red-500 transition-colors text-center flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
                                    >
                                        <PhoneCall className="w-3 h-3" /> {t("landlordCustomersCallBtn")}
                                    </a>
                                    <a
                                        href={`https://zalo.me/${customer.phone.replace(/\D/g, '')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="py-1.5 bg-[#0068FF] text-white rounded-xl text-[11px] font-extrabold hover:bg-[#0052cc] transition-colors text-center flex items-center justify-center gap-1 shadow-2xs whitespace-nowrap"
                                    >
                                        <MessageCircle className="w-3 h-3" /> {t("landlordCustomersZaloBtn")}
                                    </a>
                                    <Link
                                        href={`/landlord/customers/${customer.id}`}
                                        className="py-1.5 bg-orange-50 text-[#FF6B35] border border-orange-200/80 rounded-xl text-[11px] font-extrabold hover:bg-[#FF6B35] hover:text-white transition-colors text-center flex items-center justify-center gap-1 cursor-pointer whitespace-nowrap"
                                    >
                                        <Eye className="w-3 h-3" /> {t("landlordCustomersViewBtn")}
                                    </Link>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            ) : (
                <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden flex flex-col">
                    <div className="overflow-auto max-h-[500px]">
                        <table className="w-full text-sm text-left relative">
                            <thead className="text-[11px] font-bold text-zinc-500 uppercase bg-zinc-50/80 border-b border-zinc-100 sticky top-0 z-10">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">{t("landlordCustomersCustomerName")}</th>
                                    <th className="px-6 py-4 whitespace-nowrap">{t("landlordCustomersPhone")}</th>
                                    <th className="px-6 py-4 whitespace-nowrap">{t("landlordCustomersIdCardHeader")}</th>
                                    <th className="px-6 py-4 whitespace-nowrap">{t("landlordCustomersBuilding")}</th>
                                    <th className="px-6 py-4 whitespace-nowrap">{t("landlordCustomersCurrentRoom")}</th>
                                    <th className="px-6 py-4 whitespace-nowrap">{t("landlordCustomersStatus")}</th>
                                    <th className="px-6 py-4 text-right whitespace-nowrap">{t("landlordCustomersActions")}</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-100">
                                {sortedCustomers.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                                            {isLoading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <Loader2 className="w-5 h-5 animate-spin text-[#2AC1BC]" />
                                                    <span className="text-xs font-bold">{t("landlordCustomersLoading")}</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-1.5 py-4">
                                                    <Users className="w-7 h-7 text-zinc-300" />
                                                    <p className="text-xs font-bold text-zinc-700">{t("landlordCustomersEmptyTitle")}</p>
                                                    <p className="text-[11px] text-zinc-400">{t("landlordCustomersEmptyDescTable")}</p>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    paginatedCustomers.map((customer) => (
                                        <tr
                                            key={customer.id}
                                            className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                                            onClick={() => router.push(`/landlord/customers/${customer.id}`)}
                                        >
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center font-black text-xs uppercase shrink-0">
                                                        {customer.name.charAt(0)}
                                                    </div>
                                                    <span className="font-bold text-zinc-900 group-hover:text-[#2AC1BC] transition-colors">{customer.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.phone}</td>
                                            <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.cccd}</td>
                                            <td className="px-6 py-3.5 font-medium text-zinc-700 capitalize whitespace-nowrap">{activeBuilding?.name || t("landlordCustomersBuildingFallback")}</td>
                                            <td className="px-6 py-3.5 font-medium text-zinc-700 whitespace-nowrap">{customer.status === 'Đã rời' ? "—" : customer.room}</td>
                                            <td className="px-6 py-3.5 whitespace-nowrap">
                                                <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border whitespace-nowrap ${customer.status === 'Đang ở'
                                                    ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30'
                                                    : customer.status === 'Sắp hết hợp đồng'
                                                        ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse'
                                                        : 'bg-blue-50 text-blue-700 border-blue-200'
                                                    }`}>
                                                    {getCustomerStatusLabel(customer.status)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-3.5 text-right whitespace-nowrap">
                                                <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                                                    <a
                                                        href={`tel:${customer.phone}`}
                                                        title={t("landlordCustomersCallNow")}
                                                        className="px-2.5 py-1 bg-red-600 text-white border border-zinc-200 rounded-lg text-xs font-bold hover:bg-red-500 transition-colors shadow-2xs flex items-center gap-1 whitespace-nowrap"
                                                    >
                                                        <PhoneCall className="w-3 h-3" /> {t("landlordCustomersCallBtn")}
                                                    </a>
                                                    <a
                                                        href={`https://zalo.me/${customer.phone.replace(/\D/g, '')}`}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        title={t("landlordCustomersMessageZalo")}
                                                        className="px-2.5 py-1 bg-[#0068FF] text-white rounded-lg text-xs font-bold hover:bg-[#0052cc] transition-colors shadow-2xs flex items-center gap-1"
                                                    >
                                                        <MessageCircle className="w-3 h-3" /> {t("landlordCustomersZaloBtn")}
                                                    </a>
                                                    <Link
                                                        href={`/landlord/customers/${customer.id}`}
                                                        className="px-2.5 py-1 bg-orange-50 text-[#FF6B35] border border-orange-200/80 rounded-lg text-xs font-bold hover:bg-[#FF6B35] hover:text-white transition-colors flex items-center gap-1 cursor-pointer"
                                                    >
                                                        <Eye className="w-3 h-3" /> {t("landlordCustomersViewBtn")}
                                                    </Link>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Standardized Dormio Pagination Footer with Custom Rows Per Page */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                    <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                        <span>{t("landlordCustomersPaginationShowing")}</span>
                        <input
                            type="number"
                            min={1}
                            max={500}
                            value={itemsPerPage || ""}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val);
                                setCurrentPage(1);
                            }}
                            className="w-12 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs"
                        />
                        <span>{t("landlordCustomersPaginationPerPage")}</span>
                    </div>

                    <span className="hidden sm:inline text-zinc-300">|</span>

                    <div>
                        <span className="font-extrabold text-zinc-800">{sortedCustomers.length === 0 ? 0 : startIndex + 1}</span> - <span className="font-extrabold text-zinc-800">{Math.min(startIndex + itemsPerPage, sortedCustomers.length)}</span> {t("landlordCustomersPaginationOf")} <span className="font-extrabold text-zinc-800">{sortedCustomers.length}</span> {t("landlordCustomersTotalCustomers").toLowerCase()}
                    </div>
                </div>
                {(() => {
                    const windowSize = 5;
                    const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1;
                    const windowEnd = Math.min(windowStart + windowSize - 1, totalPages);
                    const visiblePages = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i);

                    return (
                        <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                &larr; {t("landlordCustomersPaginationPrev")}
                            </Button>
                            {visiblePages.map(page => (
                                <Button
                                    key={page}
                                    variant={currentPage === page ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => setCurrentPage(page)}
                                    className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all p-0 ${currentPage === page
                                        ? "bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30"
                                        : "bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50"
                                        }`}
                                >
                                    {page}
                                </Button>
                            ))}
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={currentPage === totalPages || windowStart + windowSize > totalPages}
                                onClick={() => setCurrentPage(Math.min(windowStart + windowSize, totalPages))}
                                className="px-3 py-1.5 text-xs font-bold bg-white border border-zinc-200 text-zinc-700 rounded-xl hover:bg-zinc-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                            >
                                {t("landlordCustomersPaginationNext")} &rarr;
                            </Button>
                        </div>
                    );
                })()}
            </div>

            <AlertModal
                isOpen={alertModal.isOpen}
                title={alertModal.title}
                message={alertModal.message}
                type={alertModal.type}
                onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
            />
        </div>
    );
}

function AlertModal({
    isOpen,
    title,
    message,
    type = "info",
    onClose
}: {
    isOpen: boolean;
    title: string;
    message: string;
    type?: "warning" | "error" | "success" | "info";
    onClose: () => void;
}) {
    const t = useTranslations("landlord");
    if (!isOpen) return null;

    const config = {
        warning: {
            bgColor: "bg-amber-500/10 text-amber-600 border-amber-200",
            icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
            btnColor: "bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20"
        },
        error: {
            bgColor: "bg-rose-500/10 text-rose-600 border-rose-200",
            icon: <AlertCircle className="w-7 h-7 text-rose-500" />,
            btnColor: "bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20"
        },
        success: {
            bgColor: "bg-emerald-500/10 text-emerald-600 border-emerald-200",
            icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
            btnColor: "bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20"
        },
        info: {
            bgColor: "bg-orange-50 text-[#FF6B35] border-orange-200",
            icon: <Info className="w-7 h-7 text-[#FF6B35]" />,
            btnColor: "bg-[#FF6B35] hover:bg-[#e05a2b] text-white shadow-[#FF6B35]/20"
        }
    }[type];

    return (
        <div
            className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-zinc-100 p-6 space-y-4 text-center">
                <div className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}>
                    {config.icon}
                </div>

                <div className="space-y-1.5">
                    <h3 className="text-lg font-black text-zinc-900">{title}</h3>
                    <p className="text-xs text-zinc-500 font-medium leading-relaxed">{message}</p>
                </div>

                <Button
                    onClick={onClose}
                    className={`w-full py-2.5 text-xs font-black rounded-xl transition-all shadow-md cursor-pointer ${config.btnColor}`}
                >
                    {t("landlordCustomersUnderstood")}
                </Button>
            </div>
        </div>
    );
}
