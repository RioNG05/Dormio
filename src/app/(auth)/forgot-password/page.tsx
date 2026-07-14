import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-950 dark:text-zinc-50">
          Quên mật khẩu?
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Nhập email hoặc số điện thoại của bạn và chúng tôi sẽ gửi cho bạn hướng dẫn để đặt lại mật khẩu.
        </p>
      </div>

      <form className="flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Email hoặc Số điện thoại</label>
          <input
            type="text"
            placeholder="Nhập email hoặc số điện thoại"
            className="w-full rounded-lg border border-zinc-200 p-2.5 text-sm focus:outline-primary dark:border-zinc-800 dark:bg-zinc-900"
            required
          />
        </div>

        <Button type="submit" className="w-full h-11 bg-primary hover:bg-primary-hover text-white mt-2">
          Gửi liên kết đặt lại
        </Button>
      </form>

      <div className="text-center text-sm text-zinc-500 dark:text-zinc-400">
        Nhớ mật khẩu?{" "}
        <Link href="/login" className="font-semibold text-primary hover:text-primary-hover">
          Quay lại đăng nhập
        </Link>
      </div>
    </div>
  );
}