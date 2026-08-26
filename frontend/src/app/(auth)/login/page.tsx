"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Phone, Mail, Lock, Eye, EyeOff, Sparkles, ArrowRight
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [showPassword, setShowPassword] = useState(false);

  // Form states
  const [accountIdentifier, setAccountIdentifier] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountIdentifier || !password) return;
    
    // Login user
    login({
      name: "Nguyễn Văn A",
      email: method === "email" ? accountIdentifier : "nguyenvana@gmail.com",
      phone: method === "phone" ? accountIdentifier : "0987654321",
    });

    router.push("/");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Top Header & Badge */}
      <div className="space-y-2">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2AC1BC]/10 text-[#2AC1BC] text-[11px] font-black rounded-full border border-[#2AC1BC]/30 uppercase tracking-wider">
          <Sparkles className="w-3.5 h-3.5 fill-[#2AC1BC]" /> ĐĂNG NHẬP HỆ THỐNG
        </span>

        <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
          Chào mừng quay trở lại!
        </h1>
        <p className="text-xs text-zinc-500 font-medium leading-relaxed">
          Đăng nhập để truy cập Bảng điều khiển quản lý và dữ liệu phòng trọ.
        </p>
      </div>

      {/* Input Method Selector Tabs (Phone vs Email) */}
      <div className="flex p-1 bg-zinc-100/80 rounded-2xl border border-zinc-200/60">
        <button
          type="button"
          onClick={() => setMethod("phone")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            method === "phone" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Phone className="w-3.5 h-3.5" /> Số điện thoại
        </button>
        <button
          type="button"
          onClick={() => setMethod("email")}
          className={`flex-1 py-2 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
            method === "email" ? "bg-white text-[#2AC1BC] shadow-xs" : "text-zinc-500 hover:text-zinc-800"
          }`}
        >
          <Mail className="w-3.5 h-3.5" /> Địa chỉ Email
        </button>
      </div>

      {/* Login Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Phone or Email input */}
        <div className="space-y-1">
          <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">
            {method === "phone" ? "SỐ ĐIỆN THOẠI *" : "ĐỊA CHỈ EMAIL *"}
          </label>
          <div className="relative">
            {method === "phone" ? (
              <Phone className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            ) : (
              <Mail className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            )}
            <input
              type={method === "phone" ? "tel" : "email"}
              required
              placeholder={method === "phone" ? "0987 654 321" : "nguyenvana@gmail.com"}
              value={accountIdentifier}
              onChange={(e) => setAccountIdentifier(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
          </div>
        </div>

        {/* Password Field & Forgot Link */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-extrabold text-zinc-500 uppercase tracking-wider block">MẬT KHẨU *</label>
            <Link href="/forgot-password" className="text-xs font-extrabold text-[#2AC1BC] hover:underline">
              Quên mật khẩu?
            </Link>
          </div>

          <div className="relative">
            <Lock className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type={showPassword ? "text" : "password"}
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-10 pr-10 py-3 bg-white border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#2AC1BC]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#2AC1BC]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] mt-2"
        >
          <span>Đăng nhập hệ thống</span>
          <ArrowRight className="w-4 h-4" />
        </button>

      </form>

      {/* Social Options (REMOVED ZALO - ONLY GOOGLE REMAINS) */}
      <div className="space-y-3 pt-2">
        <div className="relative flex items-center justify-center">
          <div className="border-t border-zinc-100 w-full" />
          <span className="bg-white px-3 text-[10px] font-extrabold text-zinc-400 uppercase tracking-wider absolute">HOẶC ĐĂNG NHẬP VỚI</span>
        </div>

        <button
          type="button"
          onClick={() => {
            login({ name: "Google User", email: "user@google.com" });
            router.push("/");
          }}
          className="w-full py-3 px-4 border border-zinc-200 rounded-2xl text-xs font-bold text-zinc-700 hover:bg-zinc-50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs"
        >
          <span className="font-black text-rose-500 text-sm">G</span> Đăng nhập bằng tài khoản Google
        </button>
      </div>

      {/* Bottom Auth Navigation Link */}
      <div className="text-center text-xs text-zinc-500 font-medium pt-2">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-extrabold text-[#2AC1BC] hover:underline">
          Đăng ký ngay
        </Link>
      </div>

    </div>
  );
}
