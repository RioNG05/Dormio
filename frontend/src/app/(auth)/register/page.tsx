"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Phone, Home } from "lucide-react";

export default function RegisterPage() {
  const [method, setMethod] = useState<"phone" | "email">("phone");
  const [role, setRole] = useState<"landlord" | "tenant">("landlord");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Đăng ký tài khoản
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Tham gia cộng đồng quản lý nhà trọ chuyên nghiệp
        </p>
      </div>

      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Bạn tham gia với tư cách là?</label>
        <div className="grid grid-cols-2 gap-4">
          <label className={`flex flex-col items-center justify-center border-2 p-4 rounded-xl cursor-pointer transition-all ${role === 'landlord' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'}`}>
            <Home className="w-6 h-6 mb-2" />
            <span className="text-sm font-bold">Chủ nhà trọ</span>
            <input type="radio" name="role" value="landlord" checked={role === 'landlord'} onChange={() => setRole('landlord')} className="hidden" />
          </label>
          <label className={`flex flex-col items-center justify-center border-2 p-4 rounded-xl cursor-pointer transition-all ${role === 'tenant' ? 'border-primary bg-primary/5 text-primary' : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 text-zinc-600 dark:text-zinc-400'}`}>
            <svg className="w-6 h-6 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
            <span className="text-sm font-bold">Người thuê phòng</span>
            <input type="radio" name="role" value="tenant" checked={role === 'tenant'} onChange={() => setRole('tenant')} className="hidden" />
          </label>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl mt-2">
        <button
          onClick={() => setMethod("phone")}
          type="button"
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            method === "phone" ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Phone className="w-4 h-4" /> Số điện thoại
        </button>
        <button
          onClick={() => setMethod("email")}
          type="button"
          className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all flex items-center justify-center gap-2 ${
            method === "email" ? "bg-white dark:bg-zinc-800 shadow-sm text-primary" : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
          }`}
        >
          <Mail className="w-4 h-4" /> Email
        </button>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Họ và tên</label>
          <input
            type="text"
            placeholder="Nguyễn Văn A"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
            required
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
            {method === "phone" ? "Số điện thoại" : "Địa chỉ Email"}
          </label>
          <input
            type={method === "phone" ? "tel" : "email"}
            placeholder={method === "phone" ? "0987654321" : "name@example.com"}
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
            required
          />
        </div>

        {role === "landlord" && (
          <>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Tên nhà trọ</label>
              <input
                type="text"
                placeholder="Ví dụ: Trọ cao cấp An Bình"
                className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Địa chỉ nhà trọ</label>
              <input
                type="text"
                placeholder="Nhập địa chỉ chi tiết"
                className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
                required
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mật khẩu</label>
          <input
            type="password"
            placeholder="Tối thiểu 6 ký tự"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
            required
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Xác nhận mật khẩu</label>
          <input
            type="password"
            placeholder="Nhập lại mật khẩu"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
            required
          />
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-white text-base font-semibold shadow-md mt-2">
          Đăng ký
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-2">
        Đã có tài khoản?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
          Đăng nhập ngay
        </Link>
      </div>
    </div>
  );
}
