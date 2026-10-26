'use client'

import React, { useState, useRef, useEffect } from 'react'
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
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, Avatar, Chip, Modal } from '@/components/ui'

export function DashboardUserFooter() {
  const tNav = useTranslations('nav')
  const tCommon = useTranslations('common')
  const pathname = usePathname()
  const { user, logout, capabilities } = useAuth()
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showLogoutModal, setShowLogoutModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const isTenant = pathname?.startsWith('/tenant')
  const isAdmin = pathname?.startsWith('/admin')
  const isStaff = pathname?.startsWith('/staff')
  const isLandlord = !isAdmin && !isStaff && !isTenant

  // Determine current active portal label
  const getRoleLabel = () => {
    if (isAdmin) return tNav('adminRole')
    if (isStaff) return tNav('staffRole')
    if (isTenant) return tNav('tenantRole')
    return tNav('landlordRole')
  }

  // Determine semantic chip variant for active portal
  const getRoleChipVariant = (): 'warning' | 'info' | 'primary' | 'success' => {
    if (isAdmin) return 'warning'
    if (isStaff) return 'info'
    if (isTenant) return 'primary'
    return 'success'
  }

  // Close user account menu when clicking outside or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
      }
    }

    if (userMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      document.addEventListener('touchstart', handleClickOutside, { passive: true })
      document.addEventListener('keydown', handleKeyDown)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('touchstart', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [userMenuOpen])

  const dashboardOptions = [
    {
      label: tNav('userMenuLandlordDashboard'),
      href: '/landlord',
      icon: Building2,
      allowed: capabilities.isLandlord,
      isActive: isLandlord,
      color: 'text-primary',
      bg: 'hover:bg-primary-soft',
    },
    {
      label: tNav('userMenuTenantDashboard'),
      href: '/tenant',
      icon: Home,
      allowed: capabilities.isTenant,
      isActive: isTenant,
      color: 'text-vacant',
      bg: 'hover:bg-vacant-soft',
    },
    {
      label: tNav('userMenuStaffDashboard'),
      href: '/staff',
      icon: UserCircle,
      allowed: capabilities.isEmployee,
      isActive: isStaff,
      color: 'text-primary',
      bg: 'hover:bg-primary-soft',
    },
    {
      label: tNav('userMenuAdminDashboard'),
      href: '/admin',
      icon: Shield,
      allowed: capabilities.isAdmin,
      isActive: isAdmin,
      color: 'text-accent',
      bg: 'hover:bg-accent-soft',
    },
  ]

  // Only show options the user actually has permission to access
  const availableOptions = dashboardOptions.filter(o => o.allowed)

  const handleConfirmLogout = () => {
    setShowLogoutModal(false)
    setUserMenuOpen(false)
    logout()
  }

  return (
    <div className="border-t border-line p-3 bg-card shrink-0">
      {/* Settings Row (Theme & Language Switchers) */}
      <div className="flex items-center justify-between px-1 mb-2.5">
        <Text variant="overline" color="subtle" className="tracking-wider select-none">
          {tNav('settings')}
        </Text>
        <div className="flex items-center gap-1.5">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </div>

      {/* Account Popup Trigger + Menu Container */}
      <div ref={userMenuRef} className="relative">
        {/* Upward Popup Menu */}
        {userMenuOpen && (
          <div
            role="menu"
            aria-label={tNav('userMenuTitle')}
            className="absolute bottom-full left-0 right-0 mb-2 bg-card border border-line rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[min(520px,calc(100vh-140px))] animate-scaleIn origin-bottom"
          >
            {/* User Info Header */}
            <div className="p-3.5 border-b border-line bg-surface/70 shrink-0">
              <div className="flex items-center gap-3">
                <Avatar
                  src={user?.avatar}
                  name={user?.name || getRoleLabel()}
                  size="md"
                  status="online"
                  zoomOnHover
                />
                <div className="overflow-hidden flex-1 min-w-0">
                  <Text size="sm" weight="black" color="default" truncate className="leading-tight mb-0.5">
                    {user?.name || getRoleLabel()}
                  </Text>
                  <Text size="2xs" color="secondary" truncate className="leading-snug mb-1.5">
                    {user?.phone || user?.email || ''}
                  </Text>
                  <Chip variant={getRoleChipVariant()} size="xs">
                    {getRoleLabel()}
                  </Chip>
                </div>
              </div>
            </div>

            {/* Scrollable Menu Items */}
            <div className="flex-1 min-h-0 overflow-y-auto divide-y divide-line custom-scrollbar p-1.5 space-y-1">
              {/* Profile & Application Navigation Links */}
              <div className="space-y-0.5">
                <Button
                  href={isTenant ? '/tenant/profile' : '/profile'}
                  onClick={() => setUserMenuOpen(false)}
                  variant="ghost"
                  size="md"
                  fullWidth
                  justify="start"
                  leftIcon={<UserCircle className="text-primary" />}
                  className="rounded-xl px-2.5 py-2 font-semibold text-foreground/90 hover:bg-card-hover"
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {tNav('userMenuProfile')}
                  </Text>
                </Button>

                <Button
                  href="/send-application"
                  onClick={() => setUserMenuOpen(false)}
                  variant="ghost"
                  size="md"
                  fullWidth
                  justify="start"
                  leftIcon={<FileText className="text-warning" />}
                  className="rounded-xl px-2.5 py-2 font-semibold text-foreground/90 hover:bg-card-hover"
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {tNav('sendApplication')}
                  </Text>
                </Button>
              </div>

              {/* Dashboard Switcher — only shown if user has access to at least 1 */}
              {availableOptions.length > 0 && (
                <div className="pt-2 pb-1 space-y-1">
                  <Text variant="overline" color="subtle" className="px-2.5 pb-0.5 select-none">
                    {tNav('userMenuSwitchDashboard')}
                  </Text>
                  {availableOptions.map(opt => {
                    const Icon = opt.icon
                    return (
                      <Button
                        key={opt.href}
                        href={opt.href}
                        onClick={() => setUserMenuOpen(false)}
                        variant="ghost"
                        size="md"
                        fullWidth
                        justify="between"
                        leftIcon={<Icon className={opt.color} />}
                        className={`rounded-xl px-2.5 py-2 transition-colors ${opt.isActive ? 'bg-surface font-bold border border-line' : opt.bg
                          }`}
                      >
                        <Text
                          as="span"
                          size="xs"
                          weight={opt.isActive ? 'black' : 'semibold'}
                          color={opt.isActive ? 'brand' : 'default'}
                          truncate
                        >
                          {opt.label}
                        </Text>
                      </Button>
                    )
                  })}
                </div>
              )}

              {/* Logout Option in Popup */}
              <div className="pt-1.5 pb-0.5">
                <Button
                  fullWidth
                  variant="ghost-danger"
                  size="md"
                  onClick={() => {
                    setUserMenuOpen(false)
                    setShowLogoutModal(true)
                  }}
                  leftIcon={<LogOut />}
                  justify="start"
                  className="rounded-xl px-2.5 py-2 text-danger hover:bg-danger-soft transition-colors"
                >
                  <Text as="span" size="xs" weight="bold" color="danger">
                    {tNav('logout')}
                  </Text>
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Profile Card Trigger Button */}
        <Button
          fullWidth
          variant="ghost"
          onClick={() => setUserMenuOpen(prev => !prev)}
          className="h-auto py-2 px-2.5 rounded-xl justify-between group hover:bg-card-hover border border-line hover:border-primary/40 bg-surface/40 transition-all text-left"
          title={tNav('viewProfileTooltip')}
          aria-expanded={userMenuOpen}
          aria-label={tNav('userMenuTitle')}
        >
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <Avatar
              src={user?.avatar}
              name={user?.name || getRoleLabel()}
              size="sm"
              zoomOnHover
              status="online"
            />
            <div className="overflow-hidden flex-1 min-w-0 text-left">
              <Text
                size="xs"
                weight="black"
                color="default"
                truncate
                className="group-hover:text-primary transition-colors leading-tight"
              >
                {user?.name || getRoleLabel()}
              </Text>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-success shrink-0" />
                <Text size="2xs" color="subtle" truncate className="leading-none">
                  {getRoleLabel()}
                </Text>
              </div>
            </div>
          </div>
          {userMenuOpen ? (
            <ChevronUp className="w-4 h-4 text-muted shrink-0 ml-1.5" />
          ) : (
            <ChevronDown className="w-4 h-4 text-muted shrink-0 ml-1.5" />
          )}
        </Button>

        {/* Quick Logout Button */}
        <Button
          fullWidth
          variant="ghost-danger"
          size="sm"
          onClick={() => setShowLogoutModal(true)}
          leftIcon={<LogOut />}
          className="mt-1.5 rounded-xl py-1.5 font-bold"
        >
          {tNav('logout')}
        </Button>
      </div>

      {/* Confirm Logout Modal (Rule 10 & Rule 18) */}
      <Modal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        size="sm"
        title={tNav('logoutConfirmTitle')}
        icon={<LogOut className="w-5 h-5 text-danger" />}
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLogoutModal(false)}
            >
              {tCommon('cancel')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleConfirmLogout}
              leftIcon={<LogOut />}
            >
              {tNav('logout')}
            </Button>
          </div>
        }
      >
        <div className="py-2">
          <Text size="sm" color="secondary" className="leading-relaxed">
            {tNav('logoutConfirmMessage')}
          </Text>
        </div>
      </Modal>
    </div>
  )
}

export default DashboardUserFooter
