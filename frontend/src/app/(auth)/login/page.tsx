"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Mail, Phone } from "lucide-react";

export default function LoginPage() {
  const [method, setMethod] = useState<"phone" | "email">("phone");

  return (
    <div className="flex flex-col gap-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Chào mừng quay trở lại
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Đăng nhập vào tài khoản để quản lý phòng trọ của bạn
        </p>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-zinc-100 dark:bg-zinc-900 rounded-xl">
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

        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Mật khẩu</label>
            <Link
              href="/forgot-password"
              className="text-xs font-semibold text-primary hover:text-primary-hover"
            >
              Quên mật khẩu?
            </Link>
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="w-full rounded-xl border border-zinc-200 p-3 text-sm focus:outline-primary transition-colors dark:border-zinc-800 dark:bg-zinc-900"
            required
          />
        </div>

        <Button type="submit" className="w-full h-12 rounded-xl bg-primary hover:bg-primary-hover text-white text-base font-semibold shadow-md mt-2">
          Đăng nhập
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-2">
        Chưa có tài khoản?{" "}
        <Link href="/register" className="font-semibold text-primary hover:text-primary-hover">
          Đăng ký ngay
        </Link>
      </div>
    </div>
  );
}
