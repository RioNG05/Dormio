'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
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
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  Shield,
  Package,
  Wrench,
  Globe,
  DoorOpen,
  Building,
  MessageCircle,
  Building2,
  Megaphone,
  ShieldCheck,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { Button, Text } from '@/components/ui'
import { useUnreadMessages } from '@/hooks'

export interface DashboardNavProps {
  persistScroll?: boolean
}

export function DashboardNav({ persistScroll = false }: DashboardNavProps) {
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const { isLoggedIn } = useAuth()

  const navRef = useRef<HTMLElement>(null)
  const sidebarScrollPos = useRef(0)

  // Initialize scroll position from sessionStorage on mount (for desktop sidebar)
  useEffect(() => {
    if (!persistScroll) return
    try {
      const saved = sessionStorage.getItem('dormio_desktop_sidebar_scroll')
      if (saved && navRef.current) {
        const top = parseInt(saved, 10)
        if (!isNaN(top)) {
          navRef.current.scrollTop = top
          sidebarScrollPos.current = top
        }
      }
    } catch {
      // Ignore storage errors in restricted iframe/browser environments
    }
  }, [persistScroll])

  // When switching tabs (pathname changes), restore exact scroll position
  useEffect(() => {
    if (persistScroll && navRef.current) {
      navRef.current.scrollTop = sidebarScrollPos.current
    }
  }, [pathname, persistScroll])

  const handleScroll = (e: React.UIEvent<HTMLElement>) => {
    if (!persistScroll) return
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
  const isLandlord = !isAdmin && !isStaff && !isTenant

  const { unreadCount: unreadMessagesCount } = useUnreadMessages(
    isLoggedIn && (Boolean(isTenant) || isLandlord),
  )

  const staffMenus = [
    { name: tNav('staffOverview'), href: '/staff', icon: LayoutDashboard },
    { name: tNav('staffShiftsAttendance'), href: '/staff/schedule', icon: Calendar },
    { name: tNav('staffShiftHistory'), href: '/staff/shift-history', icon: Clock },
  ]

  const adminMenus = [
    { name: tNav('adminOverview'), href: '/admin', icon: LayoutDashboard },
    { name: tNav('adminAnalytics'), href: '/admin/analytics', icon: BarChart2 },
    { name: tNav('adminUsers'), href: '/admin/users', icon: Users },
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

  if (isAdmin) {
    return (
      <nav
        ref={navRef}
        onScroll={handleScroll}
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
                  : 'text-muted hover:bg-card-hover hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-orange-500 rounded-r-full" />
              )}
              <item.icon
                className={`h-4.5 w-4.5 shrink-0 ${
                  isActive ? 'text-orange-600 dark:text-orange-400' : 'text-zinc-400'
                }`}
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
        onScroll={handleScroll}
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
                  : 'text-muted hover:bg-card-hover hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3.5px] h-5 bg-[#2AC1BC] rounded-r-full" />
              )}
              <item.icon
                className={`h-4.5 w-4.5 shrink-0 ${isActive ? 'text-[#2AC1BC]' : 'text-muted'}`}
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
        onScroll={handleScroll}
        className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-0.5"
      >
        {tenantMenus.map((item, idx) => {
          const isActive =
            pathname === item.href ||
            (item.href !== '/tenant' && pathname?.startsWith(item.href + '/'))
          const isMessages = item.href === '/tenant/messages'
          return (
            <Link
              key={idx}
              href={item.href}
              scroll={false}
              className={`relative flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted hover:bg-card-hover hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                )}
                <item.icon
                  className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted'}`}
                  strokeWidth={isActive ? 2 : 1.75}
                />
                <Text as="span" size="sm" weight={isActive ? 'bold' : 'medium'} color="inherit">
                  {item.name}
                </Text>
              </div>
              {isMessages && unreadMessagesCount > 0 && (
                <Text
                  as="span"
                  size="2xs"
                  weight="extrabold"
                  color="white"
                  className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500 shadow-2xs animate-in zoom-in-75 duration-150"
                >
                  {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                </Text>
              )}
            </Link>
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      ref={navRef}
      onScroll={handleScroll}
      className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar"
    >
      {landlordMenus.map((block, idx) => {
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
                  : 'text-foreground/90 hover:bg-card-hover hover:text-foreground'
              }`}
            >
              {isActive && (
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
              )}
              <block.icon
                className={`h-4 w-4 shrink-0 ${isActive ? 'text-primary' : 'text-muted'}`}
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
              fullWidth
              type="button"
              variant="ghost"
              onClick={() => toggleGroup(block.key!)}
              className="justify-between"
            >
              <div className="flex items-center gap-2 min-w-0">
                <Text
                  as="span"
                  variant="overline"
                  weight="bold"
                  color="subtle"
                  className="hover:text-foreground transition-colors"
                >
                  {block.group}
                </Text>
                {block.key === 'van-hanh' && !isOpen && unreadMessagesCount > 0 && (
                  <Text
                    as="span"
                    size="3xs"
                    weight="bold"
                    color="white"
                    className="inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full bg-rose-500 shadow-2xs"
                  >
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </Text>
                )}
              </div>
              {isOpen ? (
                <ChevronDown className="w-3.5 h-3.5 text-muted" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-muted" />
              )}
            </Button>

            {isOpen && (
              <div className="mt-0.5 mb-3 space-y-0.5">
                {block.items!.map((item, i) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/landlord' && pathname?.startsWith(item.href + '/'))
                  const isMessages = item.href === '/landlord/messages'
                  return (
                    <Link
                      key={i}
                      href={item.href}
                      scroll={false}
                      className={`relative flex items-center justify-between px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                        isActive
                          ? 'bg-primary/10 text-primary'
                          : 'text-muted hover:bg-card-hover hover:text-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        {isActive && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
                        )}
                        <item.icon
                          className={`h-4 w-4 shrink-0 ${
                            isActive ? 'text-primary' : 'text-muted'
                          }`}
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
                      </div>
                      {isMessages && unreadMessagesCount > 0 && (
                        <Text
                          as="span"
                          size="2xs"
                          weight="extrabold"
                          color="white"
                          className="ml-auto inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-rose-500 shadow-2xs animate-in zoom-in-75 duration-150"
                        >
                          {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                        </Text>
                      )}
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
export default DashboardNav

