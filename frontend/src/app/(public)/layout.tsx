"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Search, Command, X, MapPin, Building, ArrowRight, Menu, 
  Building2, UserCheck, Sparkles, CheckCircle2, LogOut, ShieldCheck, Heart, ChevronDown
} from "lucide-react";
import { siteConfig } from "@/config/site";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { locale } = useLanguage();
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const tUpgrade = useTranslations("landlordUpgradeModal");
  const { isLoggedIn, user, login, logout, toggleLoginDemo, upgradeToLandlord } = useAuth();

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Landlord Upgrade Modal State
  const [isLandlordModalOpen, setIsLandlordModalOpen] = useState(false);
  const [houseName, setHouseName] = useState("");
  const [houseAddress, setHouseAddress] = useState("");
  const [roomCount, setRoomCount] = useState("10");
  const [upgradeSuccess, setUpgradeSuccess] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!houseName || !houseAddress) return;

    upgradeToLandlord({ houseName, houseAddress });
    setUpgradeSuccess(true);

    setTimeout(() => {
      setUpgradeSuccess(false);
      setIsLandlordModalOpen(false);
      router.push("/landlord");
    }, 1500);
  };

  const searchResults = [
    { type: "room", title: "Phòng Studio Ban Công Nguyễn Huệ Quận 1", href: "/rooms/1", price: "4.5 Tr/tháng", location: "Quận 1, TP. HCM" },
    { type: "room", title: "Phòng Đơn Cao Cấp Full Nội Thất", href: "/rooms/2", price: "4.0 Tr/tháng", location: "Bến Nghé, Quận 1" },
    { type: "room", title: "Phòng Đôi Sinh Viên Cầu Giấy Gần FTU", href: "/rooms/3", price: "3.2 Tr/tháng", location: "Đống Đa, Hà Nội" },
    { type: "blog", title: "5 Bí Quyết Quản Lý Dãy Trọ Tiết Kiệm 80% Thời Gian", href: "/blog", category: "Kinh nghiệm" },
    { type: "blog", title: "Kinh Nghiệm Thuê Phòng Sinh Viên Tránh Bẫy Cọc", href: "/blog", category: "Mẹo tìm phòng" },
  ].filter(
    (item) =>
      commandQuery === "" ||
      item.title.toLowerCase().includes(commandQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(commandQuery.toLowerCase()))
  );

  const navItems = [
    { href: "/", label: tNav("home") },
    { href: "/rooms", label: tNav("rooms") },
    { href: "/features", label: tNav("features") },
    { href: "/pricing", label: tNav("pricing") },
    { href: "/blog", label: tNav("blog") },
    { href: "/contact", label: tNav("contact") },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-[#2AC1BC] flex items-center justify-center text-white font-black text-base shadow-md shadow-[#2AC1BC]/20">
              D
            </div>
            <span className="text-xl md:text-2xl font-black tracking-tight text-zinc-900">
              Dormio<span className="text-[#FF6B35]">.</span>
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/" && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-bold transition-all relative py-1 ${
                    isActive
                      ? "text-[#2AC1BC] font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2AC1BC] after:rounded-full"
                      : "text-zinc-700 hover:text-[#2AC1BC]"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Desktop Right Action Buttons & User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            

            {/* Auth Actions Conditional Rendering */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                
                {/* 🌟 NÚT ĐĂNG KÝ TRỞ THÀNH CHỦ TRỌ BẤM LÀ SANG DASHBOARD CHỦ TRỌ THIẾT LẬP */}
                {user.role === "tenant" ? (
                  <button
                    onClick={() => {
                      upgradeToLandlord({ houseName: "", houseAddress: "" });
                      router.push("/landlord");
                    }}
                    className="px-4 py-2 bg-[#FF6B35] hover:bg-[#ff5518] text-white text-xs font-black rounded-full shadow-md shadow-[#FF6B35]/25 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{tNav("becomeLandlord")}</span>
                  </button>
                ) : (
                  <Link href="/landlord">
                    <button className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#23B3AE] text-white text-xs font-black rounded-full shadow-md shadow-[#2AC1BC]/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>{tNav("dashboard")} →</span>
                    </button>
                  </Link>
                )}

                {/* User Avatar & Dropdown Menu */}
                <div ref={userMenuRef} className="relative pl-2 border-l border-zinc-200">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded-2xl hover:bg-zinc-100 transition-all text-left"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-xs"
                    />
                    <div className="hidden sm:block text-left">
                      <span className="text-xs font-black text-zinc-900 block leading-tight truncate max-w-[100px]">{user.name}</span>
                      <span className="text-[9px] font-bold text-zinc-400 block">{user.role === "landlord" ? tNav("landlordRole") : tNav("tenantRole")}</span>
                    </div>
                    <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isUserMenuOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-zinc-200 shadow-2xl p-2 z-50 animate-in fade-in duration-200 space-y-1">
                      <div className="px-3 py-2 border-b border-zinc-100">
                        <p className="text-xs font-black text-zinc-900 truncate">{user.name}</p>
                        <p className="text-[10px] text-zinc-400 font-medium truncate">{user.email}</p>
                      </div>

                      {/* 1. Profile */}
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      >
                        <UserCheck className="w-4 h-4 text-[#2AC1BC]" />
                        <span>{tNav("myProfile")}</span>
                      </Link>

                      {/* 2. Phòng trọ đã thuê */}
                      <Link
                        href={user.role === "landlord" ? "/landlord/rooms" : "/tenant"}
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      >
                        <Building className="w-4 h-4 text-blue-500" />
                        <span>{tNav("myRentedRooms")}</span>
                      </Link>

                      {/* 3. Phòng trọ đã lưu */}
                      <Link
                        href="/saved-posts"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      >
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
                        <span>{tNav("mySavedRooms")}</span>
                      </Link>

                      <div className="border-t border-zinc-100 pt-1">
                        {/* 4. Đăng xuất */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <span>{tNav("logout")}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login" className="text-xs font-bold text-zinc-700 hover:text-zinc-900 transition-colors px-2">
                  {tNav("login")}
                </Link>
                <Link href="/register">
                  <button className="px-5 py-2.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white text-xs font-bold rounded-full shadow-md shadow-[#2AC1BC]/20 transition-all cursor-pointer">
                    {tNav("trialBtn")}
                  </button>
                </Link>
              </div>
            )}

            {/* 🌐 VERY END RIGHT SIDE - Language Switcher */}
            <div className="pl-1 border-l border-zinc-200/80">
              <LanguageSwitcher />
            </div>

          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-2 lg:hidden">`n            <LanguageSwitcher />`n            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-zinc-100 text-zinc-900 rounded-2xl cursor-pointer hover:bg-zinc-200 transition-all border border-zinc-200/80"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6 text-zinc-900" /> : <Menu className="w-6 h-6 text-zinc-900" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Vertically Scrollable) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-zinc-200 bg-white px-4 py-6 space-y-6 animate-in slide-in-from-top-3 duration-200 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 rounded-2xl text-sm font-extrabold text-zinc-800 hover:bg-zinc-100 transition-all flex items-center justify-between"
                >
                  <span>{item.label}</span>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              {isLoggedIn && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full object-cover border border-zinc-200" />
                    <div>
                      <h4 className="text-xs font-black text-zinc-900">{user.name}</h4>
                      <p className="text-[10px] text-zinc-400 font-semibold">{user.role === "landlord" ? tNav("landlordRole") : tNav("tenantRole")}</p>
                    </div>
                  </div>

                  {user.role === "tenant" ? (
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        upgradeToLandlord({ houseName: "", houseAddress: "" });
                        router.push("/landlord");
                      }}
                      className="w-full py-3 bg-[#FF6B35] text-white font-black text-xs rounded-2xl shadow-md text-center flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Đăng ký trở thành chủ trọ</span>
                    </button>
                  ) : (
                    <Link href="/landlord" className="block w-full" onClick={() => setIsMobileMenuOpen(false)}>
                      <button className="w-full py-3 bg-[#2AC1BC] text-white font-black text-xs rounded-2xl shadow-md text-center">
                        Vào Bảng Điều Khiển Chủ Trọ &rarr;
                      </button>
                    </Link>
                  )}

                  {/* 4 Inner Profile Links for Mobile/Tablet */}
                  <div className="bg-zinc-50 rounded-2xl p-2 border border-zinc-200 space-y-1">
                    {/* 1. Thông tin cá nhân */}
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-[#2AC1BC]" />
                        <span>{tNav("myProfile")}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    </Link>

                    {/* 2. Phòng trọ đã thuê */}
                    <Link
                      href={user.role === "landlord" ? "/landlord/rooms" : "/tenant"}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building className="w-4 h-4 text-blue-500" />
                        <span>{tNav("myRentedRooms")}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    </Link>

                    {/* 3. Phòng trọ đã lưu */}
                    <Link
                      href="/saved-posts"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
                        <span>{tNav("mySavedRooms")}</span>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    </Link>

                    {/* 4. Đăng xuất */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/50 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <span>Đăng xuất tài khoản</span>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <Link href="/login" className="block w-full">
                    <button className="w-full py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-extrabold text-xs rounded-2xl transition-all text-center">
                      {tNav("login")}
                    </button>
                  </Link>
                  <Link href="/register" className="block w-full">
                    <button className="w-full py-3.5 bg-[#2AC1BC] hover:bg-[#72b3a3] text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-[#2AC1BC]/25 transition-all text-center">
                      {tNav("trialBtn")} &rarr;
                    </button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 🏠 LANDLORD UPGRADE FORM MODAL (Khi người dùng bấm Đăng ký trở thành chủ trọ) */}
      {isLandlordModalOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsLandlordModalOpen(false); }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl space-y-6 border border-zinc-200 cursor-default relative">
            
            <button
              onClick={() => setIsLandlordModalOpen(false)}
              className="absolute right-5 top-5 p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {upgradeSuccess ? (
              <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h3 className="text-xl font-black text-zinc-900">{tUpgrade("congratsTitle")}</h3>
                <p className="text-xs text-zinc-500 font-medium max-w-xs mx-auto">
                  {tUpgrade("congratsDesc")}
                </p>
              </div>
            ) : (
              <form onSubmit={handleUpgradeSubmit} className="space-y-5">
                <div className="space-y-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#FF6B35] text-[10px] font-black rounded-full uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 fill-[#FF6B35]" /> {tUpgrade("badge")}
                  </span>
                  <h3 className="text-xl font-black text-zinc-900">{tUpgrade("title")}</h3>
                  <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                    {tUpgrade("desc")}
                  </p>
                </div>

                <div className="space-y-4 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-zinc-700">{tUpgrade("houseNameLabel")}</label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder={tUpgrade("houseNamePlaceholder")}
                        value={houseName}
                        onChange={(e) => setHouseName(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#FF6B35]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-zinc-700">{tUpgrade("houseAddressLabel")}</label>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        required
                        placeholder={tUpgrade("houseAddressPlaceholder")}
                        value={houseAddress}
                        onChange={(e) => setHouseAddress(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#FF6B35]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-extrabold text-zinc-700">{tUpgrade("roomCountLabel")}</label>
                    <input
                      type="number"
                      placeholder={tUpgrade("roomCountPlaceholder")}
                      value={roomCount}
                      onChange={(e) => setRoomCount(e.target.value)}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl text-xs font-semibold text-zinc-900 focus:outline-none focus:border-[#FF6B35]"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white font-extrabold text-xs sm:text-sm rounded-2xl shadow-lg shadow-[#FF6B35]/25 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01]"
                >
                  <span>{tUpgrade("confirmBtn")}</span>
                </button>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Search Command Palette Modal */}
      {isCommandOpen && (
        <div 
          onClick={(e) => { if (e.target === e.currentTarget) setIsCommandOpen(false); }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 shadow-2xl space-y-4 border border-zinc-200 cursor-default">
            <div className="relative flex items-center border-b border-zinc-100 pb-3">
              <Search className="w-5 h-5 text-[#2AC1BC] absolute left-3" />
              <input
                type="text"
                autoFocus
                placeholder={tUpgrade("searchPlaceholder")}
                value={commandQuery}
                onChange={(e) => setCommandQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm font-bold text-zinc-900 focus:outline-none"
              />
              <button
                onClick={() => setIsCommandOpen(false)}
                className="absolute right-2 p-1 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block px-3">
                {tUpgrade("instantSearchTitle", { count: searchResults.length })}
              </span>

              {searchResults.length === 0 ? (
                <div className="p-8 text-center text-xs font-semibold text-zinc-400">
                  {locale === "en"
                    ? `No results found for "${commandQuery}"`
                    : `Không tìm thấy kết quả phù hợp cho "${commandQuery}"`}
                </div>
              ) : (
                searchResults.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsCommandOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center">
                        {item.type === "room" ? <Building className="w-4 h-4" /> : <Command className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="text-xs font-extrabold text-zinc-900 group-hover:text-[#2AC1BC] transition-colors">
                          {item.title}
                        </h4>
                        <span className="text-[10px] text-zinc-400 font-medium">
                          {item.location || item.category}
                        </span>
                      </div>
                    </div>
                    {item.price && (
                      <span className="text-xs font-black text-rose-500">{item.price}</span>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2AC1BC] flex items-center justify-center font-black text-sm text-white">
                D
              </div>
              <span className="text-xl font-black text-white">Dormio.</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed font-medium">
              {tFooter("desc")}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider">{tFooter("systemModules")}</h4>
            <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
              <li><Link href="/features" className="hover:text-white transition-colors">{tFooter("bhms")}</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">{tFooter("bhrp")}</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">{tFooter("vietqr")}</Link></li>
              <li><Link href="/features" className="hover:text-white transition-colors">{tFooter("aiOcr")}</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider">{tFooter("customerSupport")}</h4>
            <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
              <li><Link href="/pricing" className="hover:text-white transition-colors">{tFooter("pricing")}</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">{tFooter("contact")}</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">{tFooter("blog")}</Link></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">{tFooter("privacy")}</Link></li>
            </ul>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider">{tFooter("contactTitle")}</h4>
            <p className="text-xs text-zinc-400 font-medium">{tFooter("hotline")}</p>
            <p className="text-xs text-zinc-400 font-medium">{tFooter("email")}</p>
            <p className="text-xs text-zinc-400 font-medium">{tFooter("address")}</p>
          </div>
        </div>

        <div className="mx-auto max-w-7xl border-t border-zinc-800 mt-8 pt-6 text-center text-[11px] text-zinc-500 font-medium">
          {tFooter("rights")}
        </div>
      </footer>
    </div>
  );
}



