"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations } from "next-intl";
import {
  Menu,
  X,
  Home,
  Building2,
  Layers,
  Tag,
  BookOpen,
  Mail,
  User,
  ShieldCheck,
  ChevronDown,
  Sparkles,
  LogOut,
  FileText,
  CreditCard,
  UserCheck,
  Heart
} from "lucide-react";

export function PublicHeader() {
  const pathname = usePathname();
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const { isLoggedIn, user, logout, toggleLoginDemo } = useAuth();

  const navLinks = [
    { href: "/", label: tNav("home"), icon: Home },
    { href: "/rooms", label: tNav("rooms"), icon: Building2 },
    { href: "/features", label: tNav("features"), icon: Layers },
    { href: "/pricing", label: tNav("pricing"), icon: Tag },
    { href: "/blog", label: tNav("blog"), icon: BookOpen },
    { href: "/contact", label: tNav("contact"), icon: Mail },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#2AC1BC] flex items-center justify-center text-white font-black text-base md:text-lg shadow-md shadow-[#2AC1BC]/25 group-hover:scale-105 transition-transform">
            D
          </div>
          <span className="text-xl md:text-2xl font-black tracking-tight text-zinc-900">
            Dormio<span className="text-[#FF6B35]">.</span>
          </span>
        </Link>

        {/* Desktop & Tablet Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`text-xs lg:text-sm font-bold transition-colors ${isActive
                  ? "text-[#2AC1BC]"
                  : "text-zinc-600 hover:text-[#2AC1BC]"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth & Profile Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              {/* Prominent "Đăng ký trở thành chủ trọ" Button next to Avatar */}
              <Link href="/landlord">
                <Button className="rounded-xl px-3 sm:px-4 py-2 bg-[#FF6B35] hover:bg-[#d55e23] text-white text-xs sm:text-sm font-bold shadow-md shadow-[#FF6B35]/25 flex items-center gap-1.5 transition-all hover:scale-105">
                  <Building2 className="w-4 h-4" />
                  <span className="hidden sm:inline">{tNav("becomeLandlord")}</span>
                  <span className="sm:hidden">{tNav("becomeLandlordMobile")}</span>
                </Button>
              </Link>

              {/* User Profile Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-zinc-100 transition-colors border border-zinc-200/80 bg-white"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={user?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"}
                    alt={user?.name || "User Avatar"}
                    className="w-8 h-8 rounded-xl object-cover border border-[#2AC1BC]/30"
                  />
                  <span className="hidden lg:inline text-xs font-bold text-zinc-800">
                    {user?.name || "Tài khoản"}
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {/* Profile Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-2xl border border-zinc-200/80 z-50 flex flex-col gap-2 text-xs">
                    {/* User Info Header */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex flex-col">
                      <span className="font-bold text-zinc-900 text-sm">{user?.name || "Nguyễn Văn A"}</span>
                      <span className="text-zinc-500 text-[11px]">{user?.email || "user@example.com"}</span>
                      <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-bold text-[#2AC1BC] uppercase">
                        ● Khách thuê trọ
                      </span>
                    </div>

                    {/* Quick Landlord Action */}
                    <Link
                      href="/landlord"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 p-2.5 rounded-xl bg-[#FF6B35]/10 text-[#FF6B35] font-bold hover:bg-[#FF6B35]/20 transition-colors"
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <span>Đăng ký trở thành chủ trọ &rarr;</span>
                    </Link>

                    {/* Menu links */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-zinc-100 text-zinc-700">
                      <Link
                        href="/saved-posts"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 font-semibold"
                      >
                        <Heart className="w-4 h-4 text-zinc-400" /> Phòng trọ đã lưu
                      </Link>
                      <Link
                        href="/tenant/contracts"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 font-semibold"
                      >
                        <FileText className="w-4 h-4 text-zinc-400" /> Hợp đồng của tôi
                      </Link>
                      <Link
                        href="/tenant/invoices"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100 font-semibold"
                      >
                        <CreditCard className="w-4 h-4 text-zinc-400" /> Hóa đơn tiền phòng
                      </Link>
                      <button
                        onClick={() => {
                          logout();
                          setUserDropdownOpen(false);
                        }}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-red-50 text-red-600 font-semibold text-left transition-colors mt-1 border-t border-zinc-100 w-full"
                      >
                        <LogOut className="w-4 h-4" /> Đăng xuất tài khoản
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex text-xs md:text-sm font-bold text-zinc-700 hover:text-[#2AC1BC] transition-colors px-2.5 py-1.5"
              >
                {tNav("login")}
              </Link>
              <Link href="/register">
                <Button className="rounded-xl px-3.5 sm:px-5 py-2 sm:py-2.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white text-xs md:text-sm font-bold shadow-md shadow-[#2AC1BC]/25">
                  {tNav("register")}
                </Button>
              </Link>
            </>
          )}

          {/* 🌐 Rightmost Position - Language Switcher */}
          <div className="pl-1 border-l border-zinc-200">
            <LanguageSwitcher />
          </div>

          {/* Mobile Hamburger Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-zinc-700 hover:bg-zinc-100 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white/98 backdrop-blur-xl border-b border-zinc-200 px-4 pt-3 pb-6 flex flex-col gap-3 shadow-2xl z-50">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${isActive
                    ? "bg-[#2AC1BC]/10 text-[#2AC1BC]"
                    : "text-zinc-700 hover:bg-zinc-100"
                    }`}
                >
                  <Icon className="w-4 h-4 text-[#2AC1BC]" />
                  {link.label}
                </Link>
              );
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
            <Link
              href="/landlord"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-[#FF6B35] text-white text-sm font-bold shadow-md"
            >
              <Building2 className="w-4 h-4" /> Đăng ký trở thành chủ trọ
            </Link>

            {isLoggedIn ? (
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-bold text-red-600 border border-red-200 hover:bg-red-50 mt-1"
              >
                <LogOut className="w-4 h-4" /> Đăng xuất ({user?.name})
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-zinc-200 text-sm font-bold text-zinc-800 hover:bg-zinc-50"
              >
                <User className="w-4 h-4" /> Đăng nhập tài khoản
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}


