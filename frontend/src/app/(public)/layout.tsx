import React from "react";
import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Button } from "@/components/ui/button";
import { ScrollToTop } from "@/components/ScrollToTop";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Public Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-primary">
              Dormio
            </span>
          </Link>

          {/* Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link href="/" className="text-sm font-semibold text-zinc-900 hover:text-accent transition-colors">
              Trang chủ
            </Link>
            <Link href="/features" className="text-sm font-semibold text-zinc-600 hover:text-accent transition-colors">
              Tính năng
            </Link>
            <Link href="/pricing" className="text-sm font-semibold text-zinc-600 hover:text-accent transition-colors">
              Bảng giá
            </Link>
            <Link href="/blog" className="text-sm font-semibold text-zinc-600 hover:text-accent transition-colors">
              Blog
            </Link>
            <Link href="/contact" className="text-sm font-semibold text-zinc-600 hover:text-accent transition-colors">
              Liên hệ
            </Link>
          </nav>

          {/* Auth Actions */}
          <div className="flex items-center gap-4">
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-zinc-700 hover:text-zinc-900">
              Đăng nhập
            </Link>
            <Link href="/register">
              <Button className="rounded-full px-6 shadow-sm">Dùng thử miễn phí</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      {/* Public Footer */}
      <footer className="border-t border-zinc-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Column 1: Brand & Desc */}
            <div className="flex flex-col gap-4">
              <Link href="/" className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-primary">
                  Dormio
                </span>
              </Link>
              <p className="text-sm text-zinc-500 leading-relaxed">
                Giải pháp quản lý nhà trọ toàn diện, giúp bạn tiết kiệm thời gian và tối ưu hiệu quả kinh doanh.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <a href={siteConfig.links.zalo} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-[12px] font-bold text-zinc-600 hover:text-accent hover:border-accent transition-colors">
                  Zalo
                </a>
                <a href={siteConfig.links.facebook} target="_blank" rel="noreferrer" className="w-10 h-10 rounded-full border border-zinc-200 flex items-center justify-center text-zinc-600 hover:text-accent hover:border-accent transition-colors">
                  <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Column 2: Sản phẩm */}
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-4">
                Sản phẩm
              </h3>
              <ul className="space-y-3">
                <li><Link href="/features" className="text-sm text-zinc-500 hover:text-accent transition-colors">Tính năng</Link></li>
                <li><Link href="/pricing" className="text-sm text-zinc-500 hover:text-accent transition-colors">Bảng giá</Link></li>
                <li><Link href="/register" className="text-sm text-zinc-500 hover:text-accent transition-colors">Dùng thử miễn phí</Link></li>
              </ul>
            </div>

            {/* Column 3: Hỗ trợ */}
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-4">
                Hỗ trợ
              </h3>
              <ul className="space-y-3">
                <li><Link href="/docs" className="text-sm text-zinc-500 hover:text-accent transition-colors">Hướng dẫn sử dụng</Link></li>
                <li><Link href="/faq" className="text-sm text-zinc-500 hover:text-accent transition-colors">Câu hỏi thường gặp</Link></li>
                <li><Link href="/contact" className="text-sm text-zinc-500 hover:text-accent transition-colors">Liên hệ</Link></li>
              </ul>
            </div>

            {/* Column 4: Công ty */}
            <div>
              <h3 className="text-sm font-bold text-zinc-900 mb-4">
                Công ty
              </h3>
              <ul className="space-y-3">
                <li><Link href="/about" className="text-sm text-zinc-500 hover:text-accent transition-colors">Về chúng tôi</Link></li>
                <li><Link href="/blog" className="text-sm text-zinc-500 hover:text-accent transition-colors">Blog</Link></li>
                <li><Link href="/privacy" className="text-sm text-zinc-500 hover:text-accent transition-colors">Chính sách bảo mật</Link></li>
              </ul>
            </div>
          </div>

          {/* Bottom Copyright */}
          <div className="mt-12 border-t border-zinc-100 pt-8 text-center flex flex-col items-center">
            <p className="text-sm text-zinc-500">
              © {new Date().getFullYear()} Dormio. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
      <ScrollToTop />
    </div>
  );
}
