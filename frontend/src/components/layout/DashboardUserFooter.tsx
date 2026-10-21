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
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, Avatar } from '@/components/ui'

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
      color: 'text-primary',
      bg: 'hover:bg-primary/10',
    },
    {
      label: tNav('userMenuTenantDashboard'),
      href: '/tenant',
      icon: Home,
      allowed: capabilities.isTenant,
      color: 'text-blue-500',
      bg: 'hover:bg-blue-500/10',
    },
    {
      label: tNav('userMenuStaffDashboard'),
      href: '/staff',
      icon: UserCircle,
      allowed: capabilities.isEmployee,
      color: 'text-teal-500',
      bg: 'hover:bg-teal-500/10',
    },
    {
      label: tNav('userMenuAdminDashboard'),
      href: '/admin',
      icon: Shield,
      allowed: capabilities.isAdmin,
      color: 'text-accent',
      bg: 'hover:bg-accent/10',
    },
  ]

  // Only show options the user actually has access to
  const availableOptions = dashboardOptions.filter(o => o.allowed)

  const handleLogout = () => {
    setUserMenuOpen(false)
    logout()
  }

  return (
    <div className="border-t border-zinc-100 dark:border-line p-3">
      {/* Theme & Language toggle row */}
      <div className="flex items-center justify-end gap-1.5 px-2 mb-2">
        <ThemeSwitcher />
        <LanguageSwitcher />
      </div>

      {/* Account popup trigger + menu container */}
      <div ref={userMenuRef} className="relative">
        {/* Upward popup menu */}
        {userMenuOpen && (
          <div className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-line rounded-2xl shadow-lg shadow-black/5 overflow-hidden z-50">
            {/* Header */}
            <div className="px-4 py-3 border-b border-line bg-surface/60">
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
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-foreground/90 hover:bg-card-hover transition-colors"
              >
                <UserCircle className="w-4 h-4 text-muted shrink-0" />
                <Text as="span" size="sm" weight="semibold" color="inherit">
                  {tNav('userMenuProfile')}
                </Text>
              </Link>
              <Link
                href="/send-application"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold text-foreground/90 hover:bg-card-hover transition-colors"
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
                <div className="mx-3 my-1 h-px bg-card-hover" />
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
            <div className="mx-3 my-1 h-px bg-card-hover" />
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
          size="lg"
          type="button"
          variant="ghost"
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="group mb-2 px-0 justify-start"
          title={tNav('viewProfileTooltip')}
        >
          <Avatar
            src={user?.avatar}
            name={
              user?.name ||
              (isAdmin ? 'Admin' : isStaff ? 'Staff' : isTenant ? 'Tenant' : 'Landlord')
            }
            size="sm"
            zoomOnHover
          />
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
            <ChevronUp className="w-4 h-4 text-muted shrink-0" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted shrink-0" />
          )}
        </Button>

        {/* Logout shortcut (always visible below profile card) */}
        <Link
          href="/login"
          onClick={logout}
          className="flex items-center justify-center gap-2 w-full py-2 text-sm font-medium rounded-lg text-danger bg-danger-soft opacity-100 hover:opacity-70 transition-colors"
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

