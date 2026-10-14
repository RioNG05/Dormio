'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import AIChatBot from '@/components/AIChatBot'
import TierUpgradeModal from '@/components/TierUpgradeModal'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NotificationBell from '@/components/NotificationBell'
import AuthGuard from '@/components/AuthGuard'
import {
  LayoutDashboard,
  Home,
  Users,
  FileText,
  Bell,
  Wallet,
  Receipt,
  BarChart2,
  UserCircle,
  Calendar,
  Clock,
  Settings,
  HelpCircle,
  LogOut,
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  Shield,
  Package,
  Wrench,
  Globe,
  DoorOpen,
  Building,
  MessageSquare,
  MessageCircle,
  Building2,
  Megaphone,
  ShieldCheck,
  Check,
  Plus,
  Layers,
  ExternalLink,
} from 'lucide-react'

import { useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { Button, Text } from '@/components/ui'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [buildingDropdownOpen, setBuildingDropdownOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  // Sidebar scroll persistence across tab navigations & reloads
  const desktopNavRef = useRef<HTMLElement>(null)
  const sidebarScrollPos = useRef(0)

  // Initialize scroll position from sessionStorage on mount
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('dormio_desktop_sidebar_scroll')
      if (saved && desktopNavRef.current) {
        const top = parseInt(saved, 10)
        if (!isNaN(top)) {
          desktopNavRef.current.scrollTop = top
          sidebarScrollPos.current = top
        }
      }
    } catch {
      // Ignore storage errors in restricted iframe/browser environments
    }
  }, [])

  // When switching tabs (pathname changes), restore exact scroll position
  useEffect(() => {
    if (desktopNavRef.current) {
      desktopNavRef.current.scrollTop = sidebarScrollPos.current
    }
  }, [pathname])

  const handleDesktopScroll = (e: React.UIEvent<HTMLElement>) => {
    const top = e.currentTarget.scrollTop
    sidebarScrollPos.current = top
    try {
      sessionStorage.setItem('dormio_desktop_sidebar_scroll', top.toString())
    } catch {
      // Ignore storage errors
    }
  }

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    'van-hanh': true,
    'so-thu-chi': true,
    'bao-cao': true,
  })

  const toggleGroup = (key: string) => setOpenGroups(prev => ({ ...prev, [key]: !prev[key] }))

  const isTenant = pathname?.startsWith('/tenant')
  const isAdmin = pathname?.startsWith('/admin')
  const isStaff = pathname?.startsWith('/staff')

  const staffMenus = [
    { name: tNav('staffOverview'), href: '/staff', icon: LayoutDashboard },
    { name: tNav('staffShiftsAttendance'), href: '/staff/schedule', icon: Calendar },
    { name: tNav('staffShiftHistory'), href: '/staff/shift-history', icon: Clock },
  ]

  const adminMenus = [
    { name: tNav('adminOverview'), href: '/admin', icon: LayoutDashboard },
    { name: tNav('adminAnalytics'), href: '/admin/analytics', icon: BarChart2 },
    ...(FEATURE_FLAGS.ENABLE_BHRP
      ? [{ name: tNav('adminPostModeration'), href: '/admin/blogs', icon: ShieldCheck }]
      : []),
    { name: tNav('adminHouseModeration'), href: '/admin/houses', icon: Building2 },
    { name: tNav('adminGrievances'), href: '/admin/grievances', icon: AlertTriangle },
    { name: tNav('adminNotifications'), href: '/admin/notifications', icon: Megaphone },
  ]

  const landlordMenus = [
    { name: tNav('dashboard'), href: '/landlord', icon: LayoutDashboard },
    {
      group: tNav('operations'),
      key: 'van-hanh',
      items: [
        { name: tNav('rooms'), href: '/landlord/rooms', icon: DoorOpen },
        { name: tNav('customers'), href: '/landlord/customers', icon: Users },
        { name: tNav('contracts'), href: '/landlord/contracts', icon: FileText },
        { name: tNav('assets'), href: '/landlord/assets', icon: Package },
        { name: tNav('services'), href: '/landlord/services', icon: Wrench },
        { name: tNav('messages'), href: '/landlord/messages', icon: MessageCircle },
        { name: tNav('notification'), href: '/landlord/notifications', icon: Bell },
      ],
    },
    {
      group: tNav('accounting'),
      key: 'so-thu-chi',
      items: [
        { name: tNav('invoices'), href: '/landlord/invoices', icon: Receipt },
        { name: tNav('debts'), href: '/landlord/debts', icon: AlertTriangle },
        { name: tNav('deposits'), href: '/landlord/deposits', icon: Shield },
        { name: tNav('expenses'), href: '/landlord/expenses', icon: Wallet },
      ],
    },
    {
      group: tNav('business'),
      key: 'kinh-doanh',
      items: [
        ...(FEATURE_FLAGS.ENABLE_BHRP
          ? [{ name: tNav('listings'), href: '/landlord/listings', icon: Globe }]
          : []),
        { name: tNav('reports'), href: '/landlord/reports', icon: BarChart2 },
      ],
    },
    {
      group: tNav('workforce'),
      key: 'nhan-su',
      items: [
        { name: tNav('staff'), href: '/landlord/staff', icon: UserCircle },
        { name: tNav('shifts'), href: '/landlord/shifts', icon: Layers },
        { name: tNav('schedule'), href: '/landlord/schedule', icon: Calendar },
        { name: tNav('attendance'), href: '/landlord/attendance', icon: Clock },
      ],
    },
    {
      group: tNav('other'),
      key: 'khac',
      items: [
        { name: tNav('settings'), href: '/landlord/settings', icon: Settings },
        { name: tNav('guide'), href: '/landlord/guide', icon: HelpCircle },
      ],
    },
  ]

  const tenantMenus = [
    { name: tNav('home'), href: '/tenant', icon: Building },
    { name: tNav('invoices'), href: '/tenant/invoices', icon: Receipt },
    { name: tNav('messages'), href: '/tenant/messages', icon: MessageCircle },
  ]

  const renderNavContent = (
    navRef?: React.RefObject<HTMLElement | null>,
    onScrollHandler?: (e: React.UIEvent<HTMLElement>) => void,
  ) => {
    if (isAdmin) {
      return (
        <nav
          ref={navRef}
          onScroll={onScrollHandler}
          className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1"
        >
          <div className="px-3 pb-2 flex items-center gap-1.5">
            <Shield className="w-3 h-3 text-orange-600" />
            <Text as="span" variant="overline" color="orange">
              {tNav('adminTag')}
            </Text>
          </div>
          {adminMenus.map((item, idx) => {
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={idx}
                href={item.href}
                scroll={false}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-orange-500/10 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400 font-bold shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-orange-500 rounded-r-full" />
                )}
                <item.icon
                  className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'}`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <Text as="span" size="sm" weight={isActive ? 'bold' : 'semibold'} color="inherit">
                  {item.name}
                </Text>
              </Link>
            )
          })}
        </nav>
      )
    }

    if (isStaff) {
      return (
        <nav
          ref={navRef}
          onScroll={onScrollHandler}
          className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1"
        >
          <div className="px-3 pb-2 flex items-center gap-1.5">
            <UserCircle className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <Text as="span" variant="overline" color="brand">
              {tNav('staffTag')}
            </Text>
          </div>
          {staffMenus.map((item, idx) => {
            const isActive =
              item.href === '/staff'
                ? pathname === '/staff'
                : pathname === item.href || pathname?.startsWith(item.href + '/')
            return (
              <Link
                key={idx}
                href={item.href}
                scroll={false}
                className={`relative flex items-center gap-3 px-3 py-2.5 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] font-bold shadow-2xs'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-[#2AC1BC] rounded-r-full" />
                )}
                <item.icon
                  className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#2AC1BC]' : 'text-zinc-400'}`}
                  strokeWidth={isActive ? 2.2 : 1.75}
                />
                <Text as="span" size="sm" weight={isActive ? 'bold' : 'semibold'} color="inherit">
                  {item.name}
                </Text>
              </Link>
            )
          })}
        </nav>
      )
    }

    if (isTenant) {
      return (
        <nav
          ref={navRef}
          onScroll={onScrollHandler}
          className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-0.5"
        >
          {tenantMenus.map((item, idx) => {
            const isActive =
              pathname === item.href ||
              (item.href !== '/tenant' && pathname?.startsWith(item.href + '/'))
            return (
              <Link
                key={idx}
                href={item.href}
                scroll={false}
                className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <item.icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-zinc-400'}`}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <Text as="span" size="sm" weight={isActive ? 'bold' : 'medium'} color="inherit">
                  {item.name}
                </Text>
              </Link>
            )
          })}
        </nav>
      )
    }

    return (
      <nav
        ref={navRef}
        onScroll={onScrollHandler}
        className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar"
      >
        {landlordMenus.map((block, idx) => {
          // Top-level single item
          if (!('group' in block)) {
            const isActive =
              pathname === block.href ||
              (block.href !== '/landlord' && pathname?.startsWith(block.href + '/'))
            return (
              <Link
                key={idx}
                href={block.href!}
                scroll={false}
                className={`relative flex items-center gap-3 px-3 py-2 mb-3 text-sm font-semibold rounded-lg transition-colors ${
                  isActive
                    ? 'bg-primary/10 text-primary'
                    : 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <block.icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-zinc-500'}`}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <Text as="span" size="sm" weight={isActive ? 'bold' : 'semibold'} color="inherit">
                  {block.name}
                </Text>
              </Link>
            )
          }

          const isOpen = openGroups[block.key!]
          return (
            <div key={idx} className="mb-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => toggleGroup(block.key!)}
                className="flex items-center justify-between w-full px-3 py-1.5 h-auto hover:bg-transparent rounded-lg text-left"
              >
                <Text
                  as="span"
                  variant="overline"
                  weight="bold"
                  color="subtle"
                  className="hover:text-zinc-600 transition-colors"
                >
                  {block.group}
                </Text>
                {isOpen ? (
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
                ) : (
                  <ChevronRight className="w-3.5 h-3.5 text-zinc-400" />
                )}
              </Button>

              {isOpen && (
                <div className="mt-0.5 mb-3 space-y-0.5">
                  {block.items!.map((item, i) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/landlord' && pathname?.startsWith(item.href + '/'))
                    return (
                      <Link
                        key={i}
                        href={item.href}
                        scroll={false}
                        className={`relative flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                          isActive
                            ? 'bg-primary/10 text-primary'
                            : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900'
                        }`}
                      >
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-zinc-400'}`}
                          strokeWidth={isActive ? 2 : 1.75}
                        />
                        <Text
                          as="span"
                          size="sm"
                          weight={isActive ? 'bold' : 'medium'}
                          color="inherit"
                        >
                          {item.name}
                        </Text>
                      </Link>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>
    )
  }

  const {
    user,
    isLoggedIn,
    logout,
    capabilities,
    buildings,
    activeBuildingId,
    activeBuilding,
    selectBuilding,
  } = useAuth()

  // DYNAMICALLY UPDATE BROWSER DOCUMENT TITLE BASED ON ACTIVE BUILDING & ROUTE
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      let pageTitle = 'Dormio'
      if (isStaff) {
        if (pathname === '/staff') {
          pageTitle = tNav('staffTitleOverview')
        } else if (pathname?.startsWith('/staff/schedule')) {
          pageTitle = tNav('staffTitleSchedule')
        } else if (
          pathname?.startsWith('/staff/shift-history') ||
          pathname?.startsWith('/staff/attendance')
        ) {
          pageTitle = tNav('staffTitleShiftHistory')
        } else {
          pageTitle = tNav('staffTitlePortal')
        }
      } else if (isAdmin) {
        if (pathname === '/admin') {
          pageTitle = tNav('adminTitleOverview')
        } else if (pathname?.startsWith('/admin/moderation')) {
          pageTitle = tNav('adminTitleModeration')
        } else if (pathname?.startsWith('/admin/grievances')) {
          pageTitle = tNav('adminTitleGrievances')
        } else if (pathname?.startsWith('/admin/notifications')) {
          pageTitle = tNav('adminTitleNotifications')
        } else if (pathname?.startsWith('/admin/blogs')) {
          pageTitle = tNav('adminTitleBlogs')
        } else if (pathname?.startsWith('/admin/analytics')) {
          pageTitle = tNav('adminTitleAnalytics')
        } else {
          pageTitle = tNav('adminTitlePortal')
        }
      } else if (activeBuilding?.name) {
        if (pathname === '/landlord') {
          pageTitle = `${tNav('landlordTitleOverview')} — ${activeBuilding.name}`
        } else if (pathname?.startsWith('/landlord/rooms')) {
          pageTitle = `${tNav('landlordTitleRooms')} — ${activeBuilding.name}`
        } else if (pathname?.startsWith('/landlord/contracts')) {
          pageTitle = `${tNav('landlordTitleContracts')} — ${activeBuilding.name}`
        } else if (pathname?.startsWith('/landlord/invoices')) {
          pageTitle = `${tNav('landlordTitleInvoices')} — ${activeBuilding.name}`
        } else if (
          pathname?.startsWith('/landlord/customers') ||
          pathname?.startsWith('/landlord/tenants')
        ) {
          pageTitle = `${tNav('landlordTitleCustomers')} — ${activeBuilding.name}`
        } else if (pathname?.startsWith('/landlord/services')) {
          pageTitle = `${tNav('landlordTitleServices')} — ${activeBuilding.name}`
        } else if (pathname?.startsWith('/landlord/reports')) {
          pageTitle = `${tNav('landlordTitleReports')} — ${activeBuilding.name}`
        } else {
          pageTitle = `${activeBuilding.name} | Dormio BHMS`
        }
      }

      document.title = pageTitle
    }
  }, [activeBuilding?.name, pathname, isAdmin, isStaff, tNav])

  // Close user account menu when clicking outside it
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [userMenuOpen])

  const renderBuildingSelector = () => (
    <div className="relative px-3 py-2.5 border-b border-zinc-100 bg-zinc-50/60">
      <div className="flex items-center justify-between mb-1.5">
        <Text as="span" variant="overline" color="subtle" className="block">
          {tNav('managingBuilding')}
        </Text>
        <Text
          as="span"
          variant="badge"
          color="brand"
          className="bg-[#2AC1BC]/10 px-1.5 py-0.5 rounded-md"
        >
          {tNav('managingPropertiesCount', { count: buildings.length })}
        </Text>
      </div>

      <button
        type="button"
        onClick={() => setBuildingDropdownOpen(prev => !prev)}
        className="w-full bg-white border border-zinc-200 hover:border-[#2AC1BC] rounded-xl px-2.5 py-2 text-left text-xs font-black text-zinc-900 focus:outline-none cursor-pointer shadow-2xs flex items-center justify-between transition-all"
        title={tNav('switchPropertyTooltip')}
      >
        <div className="min-w-0 flex-1 pr-1.5">
          <div className="flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
            <Text as="span" size="xs" weight="black" color="default" truncate>
              {activeBuilding?.name || tNav('selectBuildingPlaceholder')}
            </Text>
          </div>
          {activeBuilding?.address && (
            <Text size="3xs" weight="medium" color="subtle" truncate className="mt-0.5 pl-5">
              {activeBuilding.address}
            </Text>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-200 ${
            buildingDropdownOpen ? 'rotate-180 text-[#2AC1BC]' : ''
          }`}
        />
      </button>

      {buildingDropdownOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setBuildingDropdownOpen(false)} />
          <div className="absolute left-2 right-2 top-full mt-1 bg-white border border-zinc-200 rounded-2xl shadow-xl z-50 p-2 space-y-1 animate-in fade-in zoom-in-95 duration-150">
            <div className="px-2 py-1 flex items-center justify-between">
              <Text as="span" variant="overline" color="subtle">
                {tNav('switchProperty')}
              </Text>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-1">
              {buildings.map(b => {
                const isActive = b.id === activeBuildingId
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => {
                      selectBuilding(b.id)
                      setBuildingDropdownOpen(false)
                    }}
                    className={`w-full text-left p-2 rounded-xl flex items-center justify-between text-xs transition-colors cursor-pointer ${
                      isActive
                        ? 'bg-[#2AC1BC]/10 text-[#138e89] font-black shadow-2xs'
                        : 'hover:bg-zinc-50 text-zinc-700 font-bold'
                    }`}
                  >
                    <div className="min-w-0 flex-1 pr-2">
                      <div className="flex items-center gap-1.5">
                        <Building
                          className={`w-3.5 h-3.5 shrink-0 ${
                            isActive ? 'text-[#2AC1BC]' : 'text-zinc-400'
                          }`}
                        />
                        <Text
                          as="span"
                          size="xs"
                          weight={isActive ? 'black' : 'bold'}
                          color="inherit"
                          truncate
                        >
                          {b.name}
                        </Text>
                      </div>
                      <Text size="3xs" color="subtle" truncate className="mt-0.5 pl-5">
                        {b.address || tNav('roomsCount', { count: b.totalRooms })}
                      </Text>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[#2AC1BC] shrink-0" />}
                  </button>
                )
              })}
            </div>
            <div className="pt-1.5 border-t border-zinc-100">
              <Link
                href="/landlord/setup"
                onClick={() => setBuildingDropdownOpen(false)}
                className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs font-black text-[#2AC1BC] hover:bg-[#2AC1BC]/5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <Text as="span" size="xs" weight="black" color="brand">
                  {tNav('addNewPropertyBtn')}
                </Text>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  )

  /**
   * UserFooter — bottom of sidebar.
   * Clicking the avatar/name row opens an upward popup menu that offers:
   * - Personal profile link
   * - Dashboard switcher buttons (shown/enabled only for roles the user actually has)
   * - Logout
   */
  const renderUserFooter = () => {
    const dashboardOptions = [
      {
        label: tNav('userMenuLandlordDashboard'),
        href: '/landlord',
        icon: Building2,
        allowed: capabilities.isLandlord,
        color: 'text-[#2AC1BC]',
        bg: 'hover:bg-[#2AC1BC]/5',
      },
      {
        label: tNav('userMenuTenantDashboard'),
        href: '/tenant',
        icon: Home,
        allowed: capabilities.isTenant,
        color: 'text-blue-500',
        bg: 'hover:bg-blue-50',
      },
      {
        label: tNav('userMenuStaffDashboard'),
        href: '/staff',
        icon: UserCircle,
        allowed: capabilities.isEmployee,
        color: 'text-teal-500',
        bg: 'hover:bg-teal-50',
      },
      {
        label: tNav('userMenuAdminDashboard'),
        href: '/admin',
        icon: Shield,
        allowed: capabilities.isAdmin,
        color: 'text-orange-500',
        bg: 'hover:bg-orange-50',
      },
    ]

    // Only show options the user actually has access to
    const availableOptions = dashboardOptions.filter(o => o.allowed)

    const handleLogout = () => {
      setUserMenuOpen(false)
      logout()
    }

    const avatarColor = isAdmin
      ? 'bg-orange-100 text-orange-600'
      : isStaff
        ? 'bg-[#2AC1BC]/15 text-[#2AC1BC]'
        : 'bg-primary/10 text-primary'

    const avatarInitial = user?.name
      ? user.name.trim().charAt(0).toUpperCase()
      : isAdmin
        ? 'A'
        : isStaff
          ? 'S'
          : 'R'

    return (
      <div className="border-t border-zinc-100 p-3">
        {/* Language toggle row */}
        <div className="flex items-center justify-between px-2 mb-2">
          <Text as="span" size="xs" weight="semibold" color="secondary">
            {tNav('langLabel')}
          </Text>
          <LanguageSwitcher />
        </div>

        {/* Account popup trigger + menu container */}
        <div ref={userMenuRef} className="relative">
          {/* Upward popup menu */}
          {userMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-zinc-200 rounded-2xl shadow-lg shadow-zinc-200/60 overflow-hidden z-50">
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-100 bg-zinc-50/60">
                <Text variant="overline" color="subtle" className="mb-0.5">
                  {tNav('userMenuTitle')}
                </Text>
                <Text size="sm" weight="bold" color="default" truncate>
                  {user?.name ||
                    tNav(
                      isAdmin
                        ? 'adminRole'
                        : isStaff
                          ? 'staffRole'
                          : isTenant
                            ? 'tenantRole'
                            : 'landlordRole',
                    )}
                </Text>
                <Text size="xs" color="subtle" truncate>
                  {isAdmin
                    ? tNav('adminRole')
                    : isStaff
                      ? tNav('staffRole')
                      : isTenant
                        ? tNav('tenantRole')
                        : tNav('landlordRole')}
                </Text>
              </div>

              {/* Profile link */}
              <div className="px-2 py-1.5 space-y-0.5">
                <Link
                  href={isTenant ? '/tenant/profile' : '/profile'}
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <UserCircle className="w-4 h-4 text-zinc-400 shrink-0" />
                  <Text as="span" size="sm" weight="semibold" color="inherit">
                    {tNav('userMenuProfile')}
                  </Text>
                </Link>
                <Link
                  href="/send-application"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-zinc-700 hover:bg-zinc-100 transition-colors"
                >
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  <Text as="span" size="sm" weight="semibold" color="inherit">
                    {tNav('sendApplication')}
                  </Text>
                </Link>
              </div>

              {/* Dashboard switcher — only shown if user has access to at least 1 */}
              {availableOptions.length > 0 && (
                <>
                  <div className="mx-3 my-1 h-px bg-zinc-100" />
                  <div className="px-2 py-1.5">
                    <Text variant="overline" color="subtle" className="px-3 pb-1">
                      {tNav('userMenuSwitchDashboard')}
                    </Text>
                    {availableOptions.map(opt => {
                      const Icon = opt.icon
                      return (
                        <Link
                          key={opt.href}
                          href={opt.href}
                          onClick={() => setUserMenuOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${opt.color} ${opt.bg}`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <Text as="span" size="sm" weight="semibold" color="inherit">
                            {opt.label}
                          </Text>
                          <ExternalLink className="w-3 h-3 ml-auto opacity-50 shrink-0" />
                        </Link>
                      )
                    })}
                  </div>
                </>
              )}

              {/* Logout */}
              <div className="mx-3 my-1 h-px bg-zinc-100" />
              <div className="px-2 py-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleLogout}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors w-full justify-start h-auto"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  <Text as="span" size="sm" weight="semibold" color="danger">
                    {tNav('logout')}
                  </Text>
                </Button>
              </div>
            </div>
          )}

          {/* Clickable Profile Card (trigger) */}
          <Button
            type="button"
            variant="ghost"
            onClick={() => setUserMenuOpen(prev => !prev)}
            className="group flex items-center gap-3 w-full px-2 py-2 mb-2 rounded-xl hover:bg-zinc-100 transition-colors text-left justify-start h-auto"
            title={tNav('viewProfileTooltip')}
          >
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold shrink-0 transition-transform group-hover:scale-105 ${avatarColor}`}
            >
              {avatarInitial}
            </div>
            <div className="overflow-hidden flex-1 min-w-0 text-left">
              <Text
                size="sm"
                weight="semibold"
                color="default"
                truncate
                className="group-hover:text-primary transition-colors"
              >
                {user?.name ||
                  (isAdmin
                    ? tNav('adminRole')
                    : isStaff
                      ? tNav('staffRole')
                      : tNav('landlordRole'))}
              </Text>
              <Text size="xs" color="subtle" truncate>
                {isAdmin
                  ? tNav('adminRole')
                  : isTenant
                    ? tNav('tenantRole')
                    : isStaff
                      ? tNav('staffRole')
                      : tNav('landlordRole')}
              </Text>
            </div>
            {userMenuOpen ? (
              <ChevronUp className="w-4 h-4 text-zinc-400 shrink-0" />
            ) : (
              <ChevronDown className="w-4 h-4 text-zinc-400 shrink-0" />
            )}
          </Button>

          {/* Logout shortcut (always visible below profile card) */}
          <Link
            href="/login"
            onClick={logout}
            className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg text-danger bg-danger-bg hover:bg-orange-100 transition-colors"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <Text as="span" size="sm" weight="medium" color="danger">
              {tNav('logout')}
            </Text>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50">
        {/* Sidebar Desktop */}
        <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-zinc-200 bg-white z-20">
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-100">
              <Logo size="sm" imageClassName="h-7 w-auto" />
              <NotificationBell align="left" />
            </div>

            {/* Global Landlord Building Selector */}
            {!isAdmin && !isStaff && !isTenant && renderBuildingSelector()}

            {renderNavContent(desktopNavRef, handleDesktopScroll)}
            {renderUserFooter()}
          </div>
        </aside>

        {/* Mobile Sidebar Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden">
            <div
              className="fixed inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            />
            <aside className="fixed inset-y-0 left-0 w-64 bg-white shadow-xl flex flex-col border-r border-zinc-200">
              <div className="flex items-center justify-between h-14 px-4 border-b border-zinc-100">
                <Logo size="sm" imageClassName="h-7 w-auto" />
                <div className="flex items-center gap-1">
                  <NotificationBell align="left" />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setMobileMenuOpen(false)}
                    className="p-1.5 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-lg h-9 w-9"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Global Landlord Building Selector on Mobile Drawer */}
              {!isAdmin && !isStaff && !isTenant && renderBuildingSelector()}

              {renderNavContent()}
              {renderUserFooter()}
            </aside>
          </div>
        )}

        {/* Main content */}
        <div className="flex flex-col flex-1 lg:pl-64 min-w-0">
          {/* Mobile topbar */}
          <header className="flex lg:hidden items-center justify-between h-14 px-3 border-b border-zinc-200 bg-white sticky top-0 z-30 gap-2">
            <div className="flex items-center gap-2 shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileMenuOpen(true)}
                className="p-1.5 -ml-1 text-zinc-600 hover:bg-zinc-100 rounded-lg h-9 w-9"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <Logo />
              <NotificationBell align="left" />
            </div>

            {/* Admin badge or Staff Badge or Building Selector Dropdown on Mobile Topbar */}
            {isAdmin ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200/80">
                <Shield className="w-3.5 h-3.5 text-orange-600" />
                <Text as="span" variant="overline" color="orange">
                  {tNav('adminTag')}
                </Text>
              </div>
            ) : isStaff ? (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#2AC1BC]/10 border border-[#2AC1BC]/30">
                <UserCircle className="w-3.5 h-3.5 text-[#2AC1BC]" />
                <Text as="span" variant="overline" color="brand">
                  {tNav('staffTag')}
                </Text>
              </div>
            ) : (
              !isTenant && (
                <div className="relative min-w-0 max-w-[140px] sm:max-w-[200px]">
                  <select
                    value={activeBuildingId}
                    onChange={e => selectBuilding(e.target.value)}
                    className="w-full bg-zinc-100 border border-zinc-200/80 rounded-xl px-2 py-1 text-[11px] font-black text-zinc-900 focus:outline-none focus:border-[#2AC1BC] cursor-pointer appearance-none pr-6 truncate"
                  >
                    {buildings.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-zinc-500 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              )
            )}

            <Link
              href={isTenant ? '/tenant/profile' : '/profile'}
              className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 hover:opacity-85 transition-opacity ${
                isAdmin
                  ? 'bg-orange-100 text-orange-600'
                  : isStaff
                    ? 'bg-[#2AC1BC]/15 text-[#2AC1BC]'
                    : 'bg-primary/10 text-primary'
              }`}
              title={tNav('viewProfileTooltip')}
            >
              {user?.name
                ? user.name.trim().charAt(0).toUpperCase()
                : isAdmin
                  ? 'A'
                  : isStaff
                    ? 'T'
                    : 'R'}
            </Link>
          </header>

          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
        </div>

        {!isTenant && !isAdmin && !isStaff && <AIChatBot />}
        <TierUpgradeModal />
      </div>
    </AuthGuard>
  )
}
