"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AIChatBot from "@/components/AIChatBot";
import { useAuth } from "@/context/AuthContext";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  LayoutDashboard, Home, Users, FileText, Bell,
  Wallet, CreditCard,
  Receipt, BarChart2,
  UserCircle, Calendar, Clock,
  Settings, HelpCircle,
  LogOut, Menu, X, ChevronDown, ChevronRight,
  AlertTriangle, Shield, Package, Hammer, Wrench, Gauge, History, Globe, DoorOpen, Building, MessageSquare, MessageCircle, Building2,
  Megaphone, Newspaper, ShieldCheck, CheckSquare
} from "lucide-react";

import { useTranslations, useLanguage } from "@/context/LanguageContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { locale } = useLanguage();
  const tNav = useTranslations("nav");
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'van-hanh': true,
    'so-thu-chi': true,
    'bao-cao': true,
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const isTenant = pathname?.startsWith('/tenant');
  const isAdmin = pathname?.startsWith('/admin');
  const isStaff = pathname?.startsWith('/staff');

  const staffMenus = [
    { name: tNav("staffOverview"), href: "/staff", icon: LayoutDashboard },
    { name: tNav("staffShiftsAttendance"), href: "/staff/schedule", icon: Calendar },
    { name: tNav("staffTasks"), href: "/staff/tasks", icon: CheckSquare },
  ];

  const adminMenus = [
    { name: tNav("adminOverview"), href: "/admin", icon: LayoutDashboard },
    { name: tNav("adminModeration"), href: "/admin/moderation", icon: ShieldCheck },
    { name: tNav("adminGrievances"), href: "/admin/grievances", icon: AlertTriangle },
    { name: tNav("adminNotifications"), href: "/admin/notifications", icon: Megaphone },
    { name: tNav("adminBlogs"), href: "/admin/blogs", icon: Newspaper },
    { name: tNav("adminAnalytics"), href: "/admin/analytics", icon: BarChart2 },
  ];

  const landlordMenus = [
    { name: tNav("dashboard"), href: "/landlord", icon: LayoutDashboard },
    {
      group: tNav("operations"),
      key: "van-hanh",
      items: [
        { name: tNav("rooms"), href: "/landlord/rooms", icon: DoorOpen },
        { name: tNav("customers"), href: "/landlord/customers", icon: Users },
        { name: tNav("contracts"), href: "/landlord/contracts", icon: FileText },
        { name: tNav("assets"), href: "/landlord/assets", icon: Package },
        { name: tNav("services"), href: "/landlord/services", icon: Wrench },
        { name: tNav("reminders"), href: "/landlord/reminders", icon: Bell },
        { name: tNav("messages"), href: "/landlord/messages", icon: MessageCircle },
      ]
    },
    {
      group: tNav("accounting"),
      key: "so-thu-chi",
      items: [
        { name: tNav("invoices"), href: "/landlord/invoices", icon: Receipt },
        { name: tNav("debts"), href: "/landlord/debts", icon: AlertTriangle },
        { name: tNav("deposits"), href: "/landlord/deposits", icon: Shield },
        { name: tNav("expenses"), href: "/landlord/expenses", icon: Wallet },
      ]
    },
    {
      group: tNav("business"),
      key: "kinh-doanh",
      items: [
        { name: tNav("listings"), href: "/landlord/listings", icon: Globe },
        { name: tNav("reports"), href: "/landlord/reports", icon: BarChart2 },
      ]
    },
    {
      group: tNav("workforce"),
      key: "nhan-su",
      items: [
        { name: tNav("staff"), href: "/landlord/workforce", icon: UserCircle },
        { name: tNav("schedule"), href: "/landlord/workforce/schedule", icon: Calendar },
        { name: tNav("attendance"), href: "/landlord/workforce/attendance", icon: Clock },
      ]
    },
    {
      group: tNav("other"),
      key: "khac",
      items: [
        { name: tNav("settings"), href: "/landlord/settings", icon: Settings },
        { name: tNav("guide"), href: "/landlord/guide", icon: HelpCircle },
      ]
    }
  ];

  const tenantMenus = [
    { name: tNav("home"), href: "/tenant", icon: Building },
    { name: tNav("invoices"), href: "/tenant/invoices", icon: Receipt },
    { name: tNav("messages"), href: "/tenant/messages", icon: MessageCircle },
    { name: tNav("complaints"), href: "/tenant/complaints", icon: MessageSquare },
  ];

  const NavContent = () => {
    if (isAdmin) {
      return (
        <nav className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black text-orange-600 uppercase tracking-widest flex items-center gap-1.5">
            <Shield className="w-3 h-3" />
            {tNav("adminTag")}
          </div>
          {adminMenus.map((item, idx) => {
            const isActive = item.href === '/admin'
              ? pathname === '/admin'
              : (pathname === item.href || pathname?.startsWith(item.href + '/'));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${isActive
                  ? "bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-orange-500 rounded-r-full" />}
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-orange-600 dark:text-orange-400" : "text-zinc-400"}`} strokeWidth={isActive ? 2.2 : 1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      );
    }

    if (isStaff) {
      return (
        <nav className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1">
          <div className="px-3 pb-2 text-[10px] font-black text-[#2AC1BC] uppercase tracking-widest flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5" />
            <span>{tNav("staffBadge")}</span>
          </div>
          {staffMenus.map((item, idx) => {
            const isActive = item.href === '/staff'
              ? pathname === '/staff'
              : (pathname === item.href || pathname?.startsWith(item.href + '/'));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${isActive
                  ? "bg-[#2AC1BC]/10 text-[#2AC1BC] font-bold shadow-2xs"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-[#2AC1BC] rounded-r-full" />}
                <item.icon className={`h-4.5 w-4.5 shrink-0 ${isActive ? "text-[#2AC1BC]" : "text-zinc-400"}`} strokeWidth={isActive ? 2.2 : 1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      );
    }

    if (isTenant) {
      return (
        <nav className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-0.5">
          {tenantMenus.map((item, idx) => {
            const isActive = pathname === item.href || (item.href !== '/tenant' && pathname?.startsWith(item.href + '/'));
            return (
              <Link
                key={idx}
                href={item.href}
                className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                <item.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-zinc-400"}`} strokeWidth={isActive ? 2 : 1.75} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      );
    }

    return (
      <nav className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar">
        {landlordMenus.map((block, idx) => {
          // Top-level single item
          if (!('group' in block)) {
            const isActive = pathname === block.href || (block.href !== '/landlord' && pathname?.startsWith(block.href + '/'));
            return (
              <Link
                key={idx}
                href={block.href!}
                className={`relative flex items-center gap-3 px-3 py-2 mb-3 text-sm font-semibold rounded-lg transition-colors ${isActive
                  ? "bg-primary/10 text-primary"
                  : "text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
                  }`}
              >
                {isActive && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />}
                <block.icon className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-zinc-500"}`} strokeWidth={isActive ? 2 : 1.75} />
                {block.name}
              </Link>
            );
          }

          const isOpen = openGroups[block.key!];
          return (
            <div key={idx} className="mb-1">
              <button
                onClick={() => toggleGroup(block.key!)}
                className="flex items-center justify-between w-full px-3 py-1.5 text-[11px] font-bold text-zinc-400 uppercase tracking-widest hover:text-zinc-600 transition-colors rounded-lg"
              >
                <span>{block.group}</span>
                {isOpen
                  ? <ChevronDown className="w-3.5 h-3.5" />
                  : <ChevronRight className="w-3.5 h-3.5" />
                }
              </button>

              {isOpen && (
                <div className="mt-0.5 mb-3 space-y-0.5">
                  {block.items!.map((item, i) => {
                    const isActive = pathname === item.href || (item.href !== '/landlord' && pathname?.startsWith(item.href + '/'));
                    return (
                      <Link
                        key={i}
                        href={item.href}
                        className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${isActive
                          ? "bg-primary/10 text-primary"
                          : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900"
                          }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${isActive ? "text-primary" : "text-zinc-400"}`}
                          strokeWidth={isActive ? 2 : 1.75}
                        />
                        <span>{item.name}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>
    );
  };

  const { user, buildings, activeBuildingId, activeBuilding, selectBuilding } = useAuth();

  // DYNAMICALLY UPDATE BROWSER DOCUMENT TITLE BASED ON ACTIVE BUILDING & ROUTE
  React.useEffect(() => {
    if (typeof window !== "undefined") {
      let pageTitle = "Dormio";
      if (isStaff) {
        if (pathname === "/staff") {
          pageTitle = tNav("staffTitleOverview");
        } else if (pathname?.startsWith("/staff/schedule") || pathname?.startsWith("/staff/attendance")) {
          pageTitle = tNav("staffTitleSchedule");
        } else if (pathname?.startsWith("/staff/tasks")) {
          pageTitle = tNav("staffTitleTasks");
        } else {
          pageTitle = tNav("staffTitlePortal");
        }
      } else if (isAdmin) {
        if (pathname === "/admin") {
          pageTitle = tNav("adminTitleOverview");
        } else if (pathname?.startsWith("/admin/moderation")) {
          pageTitle = tNav("adminTitleModeration");
        } else if (pathname?.startsWith("/admin/grievances")) {
          pageTitle = tNav("adminTitleGrievances");
        } else if (pathname?.startsWith("/admin/notifications")) {
          pageTitle = tNav("adminTitleNotifications");
        } else if (pathname?.startsWith("/admin/blogs")) {
          pageTitle = tNav("adminTitleBlogs");
        } else if (pathname?.startsWith("/admin/analytics")) {
          pageTitle = tNav("adminTitleAnalytics");
        } else {
          pageTitle = tNav("adminTitlePortal");
        }
      } else if (activeBuilding?.name) {
        if (pathname === "/landlord") {
          pageTitle = `${tNav("landlordTitleOverview")} — ${activeBuilding.name}`;
        } else if (pathname?.startsWith("/landlord/rooms")) {
          pageTitle = `${tNav("landlordTitleRooms")} — ${activeBuilding.name}`;
        } else if (pathname?.startsWith("/landlord/contracts")) {
          pageTitle = `${tNav("landlordTitleContracts")} — ${activeBuilding.name}`;
        } else if (pathname?.startsWith("/landlord/invoices")) {
          pageTitle = `${tNav("landlordTitleInvoices")} — ${activeBuilding.name}`;
        } else if (pathname?.startsWith("/landlord/customers") || pathname?.startsWith("/landlord/tenants")) {
          pageTitle = `${tNav("landlordTitleCustomers")} — ${activeBuilding.name}`;
        } else if (pathname?.startsWith("/landlord/services")) {
          pageTitle = `${tNav("landlordTitleServices")} — ${activeBuilding.name}`;
        } else if (pathname?.startsWith("/landlord/reports")) {
          pageTitle = `${tNav("landlordTitleReports")} — ${activeBuilding.name}`;
        } else {
          pageTitle = `${activeBuilding.name} | Dormio BHMS`;
        }
      }

      document.title = pageTitle;
    }
  }, [activeBuilding?.name, pathname, isAdmin, isStaff, tNav]);

  const StaffHeaderBadge = () => (
    <div className="px-3.5 py-3 border-b border-[#2AC1BC]/20 bg-linear-to-r from-[#2AC1BC]/10 to-teal-50/40">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-xl bg-[#2AC1BC]/15 text-[#2AC1BC] flex items-center justify-center font-black text-xs shrink-0">
          <UserCircle className="w-5 h-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-black text-[#2AC1BC] uppercase tracking-wide">
              {tNav("staffBadge")}
            </span>
          </div>
          <p className="text-xs font-bold text-zinc-900 truncate">{tNav("staffMockBuilding")}</p>
        </div>
      </div>
    </div>
  );

  const AdminHeaderBadge = () => (
    <div className="px-3.5 py-3 border-b border-orange-100 bg-linear-to-r from-orange-50/80 to-amber-50/40">
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-black bg-orange-600 text-white tracking-wider shadow-2xs uppercase">
          <Shield className="w-3 h-3" />
          {tNav("adminTag")}
        </span>
      </div>
      <p className="text-[11px] font-medium text-zinc-500 mt-1.5 leading-tight">
        {tNav("adminHeaderSubtitle")}
      </p>
    </div>
  );

  const BuildingSelector = () => (
    <div className="px-3 py-2.5 border-b border-zinc-100 bg-zinc-50/60">
      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
        {tNav("managingBuilding")}
      </span>
      <div className="relative">
        <select
          value={activeBuildingId}
          onChange={(e) => selectBuilding(e.target.value)}
          className="w-full bg-white border border-zinc-200 rounded-xl px-2.5 py-1.5 text-xs font-black text-zinc-900 focus:outline-none focus:border-[#2AC1BC] cursor-pointer shadow-xs appearance-none pr-7"
        >
          {buildings.map(b => (
            <option key={b.id} value={b.id}>{b.name}</option>
          ))}
        </select>
        <ChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
      </div>
    </div>
  );

  const Logo = () => (
    <Link href="/" className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shadow-sm shrink-0">
        <Home className="w-4 h-4 text-white" strokeWidth={2.5} />
      </div>
      <span className="text-base font-extrabold text-zinc-900 tracking-tight">Dormio</span>
    </Link>
  );

  const UserFooter = ({ compact = false }: { compact?: boolean }) => (
    <div className={`border-t border-zinc-100 ${compact ? "p-3" : "p-3"}`}>
      <div className="flex items-center justify-between px-2 mb-2">
        <span className="text-xs font-semibold text-zinc-500">{tNav("langLabel")}</span>
        <LanguageSwitcher />
      </div>

      {/* Clickable Profile Card */}
      <Link
        href={isTenant ? "/tenant/profile" : "/profile"}
        className="group flex items-center gap-3 px-2 py-2 mb-2 rounded-xl hover:bg-zinc-100 transition-colors cursor-pointer"
        title={tNav("viewProfileTooltip")}
      >
        <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0 transition-transform group-hover:scale-105 ${
          isAdmin ? "bg-orange-100 text-orange-600" : isStaff ? "bg-[#2AC1BC]/15 text-[#2AC1BC]" : "bg-primary/10 text-primary"
        }`}>
          {user?.name ? user.name.trim().charAt(0).toUpperCase() : (isAdmin ? "A" : isStaff ? "T" : "R")}
        </div>
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="text-sm font-semibold text-zinc-900 truncate group-hover:text-primary transition-colors">
            {user?.name || (isAdmin ? tNav("adminRole") : isStaff ? tNav("staffRole") : tNav("landlordRole"))}
          </div>
          <div className="text-xs text-zinc-400 truncate">
            {isAdmin ? tNav("adminRole") : isTenant ? tNav("tenantRole") : isStaff ? tNav("staffRole") : tNav("landlordRole")}
          </div>
        </div>
      </Link>
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg text-danger bg-danger-bg hover:bg-orange-100 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        {tNav("logout")}
      </Link>
    </div>
  );

  return (
    <div className="flex min-h-screen bg-zinc-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-zinc-200 bg-white z-20">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center h-14 px-4 border-b border-zinc-100">
            <Logo />
          </div>

          {/* Admin Badge or Staff Badge or Global Landlord Building Selector */}
          {isAdmin ? <AdminHeaderBadge /> : isStaff ? <StaffHeaderBadge /> : !isTenant && <BuildingSelector />}

          <NavContent />
          <UserFooter />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col border-r border-zinc-200">
            <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-100">
              <Logo />
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Admin Badge or Staff Badge or Global Landlord Building Selector on Mobile Drawer */}
            {isAdmin ? <AdminHeaderBadge /> : isStaff ? <StaffHeaderBadge /> : !isTenant && <BuildingSelector />}

            <NavContent />
            <UserFooter />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex flex-col flex-1 lg:pl-64 min-w-0">
        {/* Mobile topbar */}
        <header className="flex lg:hidden items-center justify-between h-14 px-3 border-b border-zinc-200 bg-white sticky top-0 z-30 gap-2">
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 -ml-1 text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <Logo />
          </div>

          {/* Admin badge or Staff Badge or Building Selector Dropdown on Mobile Topbar */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/80 text-[10px] font-black text-orange-600 uppercase tracking-wide">
              <Shield className="w-3.5 h-3.5" />
              <span>SYSTEM ADMIN</span>
            </div>
          ) : isStaff ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 text-[10px] font-black text-[#2AC1BC] uppercase tracking-wide">
              <UserCircle className="w-3.5 h-3.5" />
              <span>{tNav("staffBadge")}</span>
            </div>
          ) : !isTenant && (
            <div className="relative min-w-0 max-w-[140px] sm:max-w-[200px]">
              <select
                value={activeBuildingId}
                onChange={(e) => selectBuilding(e.target.value)}
                className="w-full bg-zinc-100 border border-zinc-200/80 rounded-xl px-2 py-1 text-[11px] font-black text-zinc-900 focus:outline-none focus:border-[#2AC1BC] cursor-pointer appearance-none pr-6 truncate"
              >
                {buildings.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}

          <Link
            href={isTenant ? "/tenant/profile" : "/profile"}
            className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 hover:opacity-85 transition-opacity ${
              isAdmin ? "bg-orange-100 text-orange-600" : isStaff ? "bg-[#2AC1BC]/15 text-[#2AC1BC]" : "bg-primary/10 text-primary"
            }`}
            title={tNav("viewProfileTooltip")}
          >
            {user?.name ? user.name.trim().charAt(0).toUpperCase() : (isAdmin ? "A" : isStaff ? "T" : "R")}
          </Link>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>

      {!isTenant && !isAdmin && !isStaff && <AIChatBot />}
    </div>
  );
}
