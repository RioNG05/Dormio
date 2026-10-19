'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  FileText,
  UserCircle,
  LogOut,
  ChevronDown,
  ChevronUp,
  Shield,
  Building2,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text } from '@/components/ui'

export function DashboardUserFooter() {
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const { user, logout, capabilities } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isTenant = pathname?.startsWith('/tenant')
  const isAdmin = pathname?.startsWith('/admin')
  const isStaff = pathname?.startsWith('/staff')

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
                fullWidth
                type="button"
                variant="ghost"
                onClick={handleLogout}
                className="justify-start"
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
          fullWidth
          size="xs"
          type="button"
          variant="ghost"
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="group mb-2 justify-start"
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
export default DashboardUserFooter

