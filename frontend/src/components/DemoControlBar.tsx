"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, User, Building2, Shield, ChevronUp, ChevronDown, 
  Home, X, Check, ArrowRight, EyeOff
} from "lucide-react";
import { useAuth, DemoPreset } from "@/context/AuthContext";

export default function DemoControlBar() {
  const router = useRouter();
  const { isLoggedIn, user, setDemoPreset } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed) {
    return (
      <button
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-zinc-900/90 text-[#2AC1BC] rounded-full border border-zinc-700 shadow-lg text-[10px] font-bold flex items-center gap-1 cursor-pointer hover:bg-zinc-800 transition-all"
        title="Mở lại bảng thử nghiệm"
      >
        <Sparkles className="w-3.5 h-3.5 fill-[#2AC1BC]" />
        <span>Thử nghiệm</span>
      </button>
    );
  }

  const handleSelectPreset = (preset: DemoPreset, redirectPath?: string) => {
    setDemoPreset(preset);
    if (redirectPath) {
      router.push(redirectPath);
    }
  };

  const getActivePreset = (): DemoPreset => {
    if (!isLoggedIn || !user) return "guest";
    if (user.role === "admin") return "admin";
    if (user.role === "tenant") return "tenant";
    if (user.role === "landlord") {
      return user.houseName ? "landlord_active" : "landlord_empty";
    }
    return "guest";
  };

  const activePreset = getActivePreset();

  const getPresetLabel = (preset: DemoPreset) => {
    switch (preset) {
      case "guest": return "🌐 Khách Vãng Lai";
      case "tenant": return "👤 Khách Thuê (Tenant)";
      case "landlord_empty": return "🏠 Chủ Trọ Mới (Trống Trơn)";
      case "landlord_active": return "📊 Chủ Trọ Đang Vận Hành";
      case "admin": return "👑 Admin Nền Tảng";
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      
      {/* Floating Expanded Control Panel Panel */}
      {isOpen && (
        <div className="mb-3 max-w-sm sm:max-w-md w-full bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 p-5 rounded-3xl shadow-2xl text-white space-y-4 animate-in slide-in-from-bottom-4 duration-200">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#2AC1BC] text-white flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <h4 className="text-xs font-black text-white">Bảng Thử Nghiệm Project</h4>
                <p className="text-[10px] text-zinc-400 font-medium">Chuyển đổi vai trò & kiểm thử các luồng 1-click</p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsDismissed(true)}
                title="Ẩn nút thử nghiệm"
                className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <EyeOff className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 1-Click Role Presets */}
          <div className="space-y-2">
            <span className="text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider block">
              CHỌN VAI TRÒ KIỂM THỬ:
            </span>

            <div className="grid grid-cols-1 gap-2">
              
              {/* Guest */}
              <button
                onClick={() => handleSelectPreset("guest", "/")}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === "guest"
                    ? "border-white bg-white text-zinc-950 shadow-md"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>🌐 1. Khách Vãng Lai (Chưa đăng nhập)</span>
                {activePreset === "guest" && <Check className="w-4 h-4 text-zinc-950 stroke-[3]" />}
              </button>

              {/* Tenant */}
              <button
                onClick={() => handleSelectPreset("tenant", "/")}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === "tenant"
                    ? "border-[#FF6B35] bg-[#FF6B35] text-white shadow-md"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>👤 2. Khách Thuê (Thử nút Đăng ký Chủ Trọ)</span>
                {activePreset === "tenant" && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Landlord Empty */}
              <button
                onClick={() => handleSelectPreset("landlord_empty", "/landlord")}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === "landlord_empty"
                    ? "border-rose-500 bg-rose-500 text-white shadow-md"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>🏠 3. Chủ Trọ Mới (Dashboard Trống Trơn)</span>
                {activePreset === "landlord_empty" && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Landlord Active */}
              <button
                onClick={() => handleSelectPreset("landlord_active", "/landlord")}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === "landlord_active"
                    ? "border-[#2AC1BC] bg-[#2AC1BC] text-white shadow-md"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>📊 4. Chủ Trọ Đang Vận Hành (Đầy Đủ Data)</span>
                {activePreset === "landlord_active" && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Admin */}
              <button
                onClick={() => handleSelectPreset("admin", "/admin")}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === "admin"
                    ? "border-purple-600 bg-purple-600 text-white shadow-md"
                    : "border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800"
                }`}
              >
                <span>👑 5. Admin Nền Tảng (System)</span>
                {activePreset === "admin" && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

            </div>
          </div>

          {/* Quick Page Jump Shortcuts */}
          <div className="pt-2 border-t border-zinc-800 space-y-1.5">
            <span className="text-[10px] font-extrabold text-zinc-500 uppercase tracking-wider block">
              CHUYỂN NHANH DỰ ÁN:
            </span>

            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <Link href="/" className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 flex items-center justify-between font-bold">
                <span>Trang Chủ</span>
                <Home className="w-3.5 h-3.5 text-[#2AC1BC]" />
              </Link>

              <Link href="/register" className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 flex items-center justify-between font-bold">
                <span>Trang Đăng Ký</span>
                <ArrowRight className="w-3.5 h-3.5 text-zinc-400" />
              </Link>

              <Link href="/landlord" className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 flex items-center justify-between font-bold">
                <span>Dashboard Chủ Trọ</span>
                <Building2 className="w-3.5 h-3.5 text-[#FF6B35]" />
              </Link>

              <Link href="/tenant" className="px-3 py-2 bg-zinc-900 hover:bg-zinc-800 rounded-xl text-zinc-300 flex items-center justify-between font-bold">
                <span>Dashboard Tenant</span>
                <User className="w-3.5 h-3.5 text-amber-400" />
              </Link>
            </div>
          </div>

        </div>
      )}

      {/* Floating Bottom Pill Button Toggle (0% Header Collision) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-zinc-950/95 hover:bg-zinc-900 text-white rounded-full border border-zinc-700 shadow-2xl flex items-center gap-2.5 transition-all cursor-pointer hover:scale-105 group"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2AC1BC] opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#2AC1BC]"></span>
        </span>

        <span className="text-xs font-black text-[#2AC1BC]">🧪 Test Suite:</span>
        <span className="text-xs font-extrabold text-zinc-200">{getPresetLabel(activePreset)}</span>

        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-zinc-400 group-hover:text-white transition-colors" />
        )}
      </button>

    </div>
  );
}
