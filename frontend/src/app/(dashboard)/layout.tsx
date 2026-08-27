"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AIChatBot from "@/components/AIChatBot";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard, Home, Users, FileText, Bell,
  Wallet, CreditCard,
  Receipt, BarChart2,
  UserCircle, Calendar, Clock,
  Settings, HelpCircle,
  LogOut, Menu, X, ChevronDown, ChevronRight,
  AlertTriangle, Shield, Package, Hammer, Wrench, Gauge, History, Globe, DoorOpen, Building, MessageSquare, MessageCircle, Building2
} from "lucide-react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'van-hanh': true,
    'so-thu-chi': true,
    'co-so-vat-chat': false,
    'kinh-doanh': false,
    'nhan-su': false,
    'khac': false
  });

  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }));

  const isTenant = pathname?.startsWith('/tenant');

  const landlordMenus = [
    { name: "Tổng quan", href: "/landlord", icon: LayoutDashboard },
    {
      group: "Vận hành",
      key: "van-hanh",
      items: [
        { name: "Phòng", href: "/landlord/rooms", icon: DoorOpen },
        { name: "Khách thuê", href: "/landlord/customers", icon: Users },
        { name: "Hợp đồng", href: "/landlord/contracts", icon: FileText },
        { name: "Tài sản", href: "/landlord/assets", icon: Package },
        { name: "Dịch vụ", href: "/landlord/services", icon: Wrench },
        { name: "Thông báo & Nhắc nhở", href: "/landlord/reminders", icon: Bell },
        { name: "Tin nhắn", href: "/landlord/messages", icon: MessageCircle },
      ]
    },
    {
      group: "Sổ thu chi",
      key: "so-thu-chi",
      items: [
        { name: "Hoá đơn", href: "/landlord/invoices", icon: Receipt },
        { name: "Công nợ", href: "/landlord/debts", icon: AlertTriangle },
        { name: "Đặt cọc", href: "/landlord/deposits", icon: Shield },
        { name: "Chi phí", href: "/landlord/expenses", icon: Wallet },
      ]
    },
    {
      group: "Kinh doanh",
      key: "kinh-doanh",
      items: [
        { name: "Đăng tin", href: "/landlord/listings", icon: Globe },
        { name: "Báo cáo", href: "/landlord/reports", icon: BarChart2 },
      ]
    },
    {
      group: "Nhân sự",
      key: "nhan-su",
      items: [
        { name: "Nhân viên", href: "/landlord/workforce", icon: UserCircle },
        { name: "Lịch làm", href: "/landlord/workforce/schedule", icon: Calendar },
        { name: "Chấm công", href: "/landlord/workforce/attendance", icon: Clock },
      ]
    },
    {
      group: "Khác",
      key: "khac",
      items: [
        { name: "Cài đặt", href: "/landlord/settings", icon: Settings },
        { name: "Trợ giúp", href: "/landlord/guide", icon: HelpCircle },
      ]
    }
  ];

  const tenantMenus = [
    { name: "Thông tin trọ", href: "/tenant", icon: Building },
    { name: "Thống kê & Hóa đơn", href: "/tenant/invoices", icon: Receipt },
    { name: "Tin nhắn", href: "/tenant/messages", icon: MessageCircle },
    { name: "Yêu cầu hỗ trợ", href: "/tenant/complaints", icon: MessageSquare },
  ];

  const NavContent = () => {
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

  const { buildings, activeBuildingId, activeBuilding, selectBuilding } = useAuth();

  // DYNAMICALLY UPDATE BROWSER DOCUMENT TITLE BASED ON ACTIVE BUILDING & ROUTE
  React.useEffect(() => {
    if (typeof window !== "undefined" && activeBuilding?.name) {
      let pageTitle = "Dormio BHMS";
      if (pathname === "/landlord") {
        pageTitle = `Tổng Quan — ${activeBuilding.name}`;
      } else if (pathname?.startsWith("/landlord/rooms")) {
        pageTitle = `Sơ Đồ Phòng — ${activeBuilding.name}`;
      } else if (pathname?.startsWith("/landlord/contracts")) {
        pageTitle = `Hợp Đồng Thuê — ${activeBuilding.name}`;
      } else if (pathname?.startsWith("/landlord/invoices")) {
        pageTitle = `Hóa Đơn & Thu Tiền — ${activeBuilding.name}`;
      } else if (pathname?.startsWith("/landlord/customers") || pathname?.startsWith("/landlord/tenants")) {
        pageTitle = `Khách Thuê — ${activeBuilding.name}`;
      } else if (pathname?.startsWith("/landlord/services")) {
        pageTitle = `Bảng Dịch Vụ — ${activeBuilding.name}`;
      } else if (pathname?.startsWith("/landlord/reports")) {
        pageTitle = `Báo Cáo Doanh Thu — ${activeBuilding.name}`;
      } else {
        pageTitle = `${activeBuilding.name} | Dormio BHMS`;
      }

      document.title = pageTitle;
    }
  }, [activeBuilding?.name, pathname]);

  const BuildingSelector = () => (
    <div className="px-3 py-2.5 border-b border-zinc-100 bg-zinc-50/60">
      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-wider block mb-1">
        TÒA NHÀ ĐANG QUẢN LÝ:
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
      <div className="flex items-center gap-3 px-2 py-2 mb-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-sm font-bold shrink-0">
          R
        </div>
        <div className="overflow-hidden">
          <div className="text-sm font-semibold text-zinc-900 truncate">Nguyễn Văn Rio</div>
          <div className="text-xs text-zinc-400 truncate">{isTenant ? "Người thuê" : "Chủ nhà trọ"}</div>
        </div>
      </div>
      <Link
        href="/login"
        className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg text-danger bg-danger-bg hover:bg-orange-100 transition-colors"
      >
        <LogOut className="h-4 w-4 shrink-0" />
        Đăng xuất
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

          {/* Global Landlord Building Selector */}
          {!isTenant && <BuildingSelector />}

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

            {/* Global Landlord Building Selector on Mobile Drawer */}
            {!isTenant && <BuildingSelector />}

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

          {/* Building Selector Dropdown on Mobile Topbar for Landlord */}
          {!isTenant && (
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

          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs shrink-0">
            R
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
      </div>

      {/* Mobile Bottom Navigation Bar for Tenants */}
      {isTenant && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200/80 px-2 py-1.5 flex justify-around items-center shadow-lg">
          {tenantMenus.map((item, idx) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={idx}
                href={item.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl transition-all ${isActive ? "text-[#2AC1BC] font-black" : "text-zinc-400 hover:text-zinc-700 font-bold"
                  }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? "text-[#2AC1BC]" : "text-zinc-400"}`} />
                <span className="text-[10px] tracking-tight">{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}

      {!isTenant && <AIChatBot />}
    </div>
  );
}
