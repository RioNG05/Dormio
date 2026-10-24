'use client'

import React, { useState, useRef, useEffect } from 'react'
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
  Gauge,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { useUnreadMessages } from '@/hooks'
import {
  DashboardNavItem,
  DashboardNavSectionHeader,
  DashboardNavGroupToggle,
} from './DashboardNavItem'


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
    isLoggedIn && (Boolean(isTenant) || isLandlord || Boolean(isStaff)),
  )

  const staffMenus = [
    { name: tNav('staffOverview'), href: '/staff', icon: LayoutDashboard },
    { name: tNav('staffShiftsAttendance'), href: '/staff/schedule', icon: Calendar },
    { name: tNav('staffShiftHistory'), href: '/staff/shift-history', icon: Clock },
    { name: tNav('messages'), href: '/staff/messages', icon: MessageCircle },
    { name: tNav('complaints'), href: '/staff/complaints', icon: AlertTriangle },
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
        { name: tNav('meterReadings'), href: '/landlord/meter-readings', icon: Gauge },
        { name: tNav('customers'), href: '/landlord/customers', icon: Users },
        { name: tNav('contracts'), href: '/landlord/contracts', icon: FileText },
        { name: tNav('assets'), href: '/landlord/assets', icon: Package },
        { name: tNav('services'), href: '/landlord/services', icon: Wrench },
        { name: tNav('messages'), href: '/landlord/messages', icon: MessageCircle },
        { name: tNav('complaints'), href: '/landlord/complaints', icon: AlertTriangle },
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
    {
      name: tNav('roomInfo'),
      href: "/tenant/room",
      icon: DoorOpen,
    },
    { name: tNav('contracts'), href: '/tenant/contract', icon: FileText },
    { name: tNav('invoices'), href: '/tenant/invoices', icon: Receipt },
    { name: tNav('messages'), href: '/tenant/messages', icon: MessageCircle },
    { name: tNav('complaints'), href: '/tenant/complaints', icon: AlertTriangle },
  ]

  if (isAdmin) {
    return (
      <nav
        ref={navRef}
        onScroll={handleScroll}
        className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1"
      >
        <DashboardNavSectionHeader
          icon={Shield}
          title={tNav('adminTag')}
          color="orange"
        />
        {adminMenus.map((item, idx) => {
          const isActive =
            item.href === '/admin'
              ? pathname === '/admin'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
          return (
            <DashboardNavItem
              key={idx}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={isActive}
              theme="orange"
            />
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
        <DashboardNavSectionHeader
          icon={UserCircle}
          title={tNav('staffTag')}
          color="brand"
        />
        {staffMenus.map((item, idx) => {
          const isActive =
            item.href === '/staff'
              ? pathname === '/staff'
              : pathname === item.href || pathname?.startsWith(item.href + '/')
          const isMessages = item.href === '/staff/messages'
          return (
            <DashboardNavItem
              key={idx}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={isActive}
              badge={isMessages && unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
              theme="brand"
            />
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
        className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1"
      >
        <DashboardNavSectionHeader
          icon={DoorOpen}
          title={tNav('tenantTag')}
          color="brand"
        />
        {tenantMenus.map((item, idx) => {
          const isRoomItem = item.href === '/tenant/room'
          const isActive =
            (isRoomItem && Boolean(pathname === '/tenant/room' || pathname?.startsWith('/tenant/room'))) ||
            pathname === item.href ||
            (item.href !== '/tenant' && pathname?.startsWith(item.href + '/'))
          const isMessages = item.href === '/tenant/messages'
          return (
            <DashboardNavItem
              key={idx}
              href={item.href}
              icon={item.icon}
              label={item.name}
              isActive={isActive}
              badge={isMessages && unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
              theme="brand"
            />
          )
        })}
      </nav>
    )
  }

  return (
    <nav
      ref={navRef}
      onScroll={handleScroll}
      className="flex-1 px-3 py-4 overflow-y-auto hide-scrollbar space-y-1"
    >
      {landlordMenus.map((block, idx) => {
        if (!('group' in block)) {
          const isActive =
            pathname === block.href ||
            (block.href !== '/landlord' && pathname?.startsWith(block.href + '/'))
          return (
            <DashboardNavItem
              key={idx}
              href={block.href!}
              icon={block.icon}
              label={block.name}
              isActive={isActive}
              theme="brand"
              className="mb-2"
            />
          )
        }

        const isOpen = openGroups[block.key!]
        const hasUnread = block.key === 'van-hanh' && !isOpen && unreadMessagesCount > 0
        return (
          <div key={idx} className="mb-1.5">
            <DashboardNavGroupToggle
              label={block.group}
              isOpen={isOpen}
              onToggle={() => toggleGroup(block.key!)}
              badge={hasUnread ? unreadMessagesCount : undefined}
            />

            {isOpen && (
              <div className="mt-1 space-y-1">
                {block.items!.map((item, i) => {
                  const isActive =
                    pathname === item.href ||
                    (item.href !== '/landlord' && pathname?.startsWith(item.href + '/'))
                  const isMessages = item.href === '/landlord/messages'
                  return (
                    <DashboardNavItem
                      key={i}
                      href={item.href}
                      icon={item.icon}
                      label={item.name}
                      isActive={isActive}
                      badge={isMessages && unreadMessagesCount > 0 ? unreadMessagesCount : undefined}
                      theme="brand"
                    />
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

