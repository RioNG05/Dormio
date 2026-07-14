import React from "react";
import Link from "next/link";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      {/* Cột Trái: Form đăng nhập/đăng ký */}
      <div className="flex flex-1 flex-col justify-center px-4 py-12 sm:px-6 lg:flex-none lg:px-20 xl:px-24 bg-white dark:bg-black">
        <div className="mx-auto w-full max-w-sm lg:w-96">
          <div className="mb-8">
            <Link href="/" className="text-2xl font-bold text-primary">
              Dormio
            </Link>
          </div>
          {children}
        </div>
      </div>

      {/* Cột Phải: Hình ảnh & Giới thiệu thương hiệu */}
      <div className="relative hidden w-0 flex-1 lg:block bg-zinc-900">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          className="absolute inset-0 h-full w-full object-cover opacity-70"
          src="https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1000&q=80"
          alt="Boarding houses"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent flex flex-col justify-end p-16 text-white">
          <h2 className="text-3xl font-bold mb-4">Nền tảng quản lý phòng trọ hiện đại</h2>
          <p className="text-zinc-300 max-w-md">
            Tìm phòng trọ, thanh toán hóa đơn dịch vụ, ký hợp đồng điện tử nhanh gọn, minh bạch trong vài cú click chuột.
          </p>
        </div>
      </div>
    </div>
  );
}
