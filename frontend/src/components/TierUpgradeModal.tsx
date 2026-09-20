"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Crown, Sparkles, X, ArrowRight, CheckCircle2, ShieldAlert } from "lucide-react";
import { TierRequiredEventDetail } from "@/services/api";

export default function TierUpgradeModal() {
 const router = useRouter();
 const [isOpen, setIsOpen] = useState(false);
 const [tierInfo, setTierInfo] = useState<TierRequiredEventDetail | null>(null);

 useEffect(() => {
 const handleTierRequired = (e: Event) => {
 const customEvent = e as CustomEvent<TierRequiredEventDetail>;
 if (customEvent.detail) {
 setTierInfo(customEvent.detail);
 setIsOpen(true);
 }
 };

 window.addEventListener("dormio:tier-required", handleTierRequired);
 return () => {
 window.removeEventListener("dormio:tier-required", handleTierRequired);
 };
 }, []);

 if (!isOpen || !tierInfo) return null;

 const isPro = tierInfo.requiredTier?.toLowerCase() === "pro";
 const requiredTierName = isPro ? "Pro" : "Plus";
 const currentTierName =
 tierInfo.currentTier?.toLowerCase() === "plus"
 ? "Plus"
 : tierInfo.currentTier?.toLowerCase() === "pro"
 ? "Pro"
 : "Free";

 const benefits = isPro
 ? [
 "Phân quyền quản lý nhân viên & phân công ca trực (, )",
 "Lập lịch làm việc & tuần hoàn ca làm",
 "Chấm công điện tử & giám sát ca làm việc",
 "Chuyển đổi ngữ cảnh & báo cáo thống kê đa nhà trọ (, )",
 ]
 : [
 "Quản lý chi phí vận hành & hóa đơn chi tiêu",
 "Quản lý & xử lý tiền cọc giữ chỗ",
 "Gửi thông báo phát thanh tới toàn bộ cư dân",
 "Xuất hợp đồng & tài liệu pháp lý trực tuyến",
 "Quản lý tài sản & kiểm kê trang thiết bị",
 ];

 const handleUpgrade = () => {
 setIsOpen(false);
 router.push(tierInfo.upgradeUrl || "/pricing");
 };

 return (
 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
 {/* Backdrop */}
 <div
 className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
 onClick={() => setIsOpen(false)}
 />

 {/* Modal Card */}
 <div className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl transition-all dark:border-slate-800 dark:bg-slate-900 sm:p-8 animate-in zoom-in-95 duration-200">
 {/* Glow accent */}
 <div
 className={`absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl opacity-30 ${
 isPro ? "bg-amber-500" : "bg-indigo-500"
 }`}
 />
 <div
 className={`absolute -left-16 -bottom-16 h-40 w-40 rounded-full blur-3xl opacity-20 ${
 isPro ? "bg-orange-500" : "bg-purple-500"
 }`}
 />

 {/* Close Button */}
 <button
 onClick={() => setIsOpen(false)}
 className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300 transition-colors"
 aria-label="Close"
 >
 <X className="h-5 w-5" />
 </button>

 {/* Content */}
 <div className="relative space-y-6">
 {/* Header Icon & Badges */}
 <div className="flex items-center gap-3">
 <div
 className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg ${
 isPro
 ? "bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/20"
 : "bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/20"
 }`}
 >
 {isPro ? <Crown className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
 </div>
 <div>
 <div className="flex items-center gap-2">
 <span
 className={`rounded-full px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider ${
 isPro
 ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
 : "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300"
 }`}
 >
 Gói {requiredTierName}
 </span>
 <span className="text-xs text-slate-400 dark:text-slate-500">
 Gói hiện tại: {currentTierName}
 </span>
 </div>
 <h3 className="mt-1 text-xl font-extrabold text-slate-900 dark:text-white">
 Nâng cấp tài khoản để mở khóa
 </h3>
 </div>
 </div>

 {/* Backend Error Message */}
 <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-xs font-medium text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
 <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
 <p className="leading-relaxed">{tierInfo.message}</p>
 </div>

 {/* Benefits list */}
 <div className="space-y-3">
 <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
 Đặc quyền gói {requiredTierName} bao gồm:
 </p>
 <ul className="space-y-2.5">
 {benefits.map((benefit, index) => (
 <li key={index} className="flex items-start gap-2.5 text-xs text-slate-700 dark:text-slate-300">
 <CheckCircle2
 className={`h-4 w-4 shrink-0 mt-0.5 ${
 isPro ? "text-amber-500" : "text-indigo-500"
 }`}
 />
 <span>{benefit}</span>
 </li>
 ))}
 </ul>
 </div>

 {/* Actions */}
 <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
 <button
 onClick={() => setIsOpen(false)}
 className="w-full sm:w-auto rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800/60 transition-colors"
 >
 Để sau
 </button>
 <button
 onClick={handleUpgrade}
 className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white shadow-lg transition-all ${
 isPro
 ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-500/25"
 : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 shadow-indigo-500/25"
 }`}
 >
 <span>Nâng cấp ngay</span>
 <ArrowRight className="h-4 w-4" />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
}
