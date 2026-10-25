'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, Shield, UserCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/AuthContext'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, SelectInput } from '@/components/ui'
import { navRoleTagStyles } from './DashboardNavItem'

export interface DashboardMobileHeaderProps {
  onOpenMobileMenu: () => void
}

export function DashboardMobileHeader({ onOpenMobileMenu }: DashboardMobileHeaderProps) {
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const { user, buildings, activeBuildingId, selectBuilding } = useAuth()

  const isTenant = pathname?.startsWith('/tenant')
  const isAdmin = pathname?.startsWith('/admin')
  const isStaff = pathname?.startsWith('/staff')

  return (
    <header className="flex lg:hidden items-center justify-between h-14 px-3 border-b border-line bg-card sticky top-0 z-30 gap-2">
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="-ml-1"
        >
          <Menu />
        </Button>
        <Logo />
        <NotificationBell align="left" />
      </div>

      {/* Admin badge or Staff Badge or Building Selector Dropdown on Mobile Topbar */}
      {isAdmin ? (
        <div className={navRoleTagStyles.accent.badge}>
          <Shield className={navRoleTagStyles.accent.icon} />
          <Text as="span" variant="overline" color="orange">
            {tNav('adminTag')}
          </Text>
        </div>
      ) : isStaff ? (
        <div className={navRoleTagStyles.brand.badge}>
          <UserCircle className={navRoleTagStyles.brand.icon} />
          <Text as="span" variant="overline" color="brand">
            {tNav('staffTag')}
          </Text>
        </div>
      ) : (
        !isTenant && (
          <div className="min-w-0 max-w-[140px] sm:max-w-[200px]">
            <SelectInput
              value={activeBuildingId}
              onChange={e => selectBuilding(e.target.value)}
              options={buildings.map(b => ({
                value: b.id,
                label: b.name,
              }))}
              className="w-full bg-card-hover border border-line rounded-xl px-2 py-1 text-2xs font-black text-foreground focus:outline-none focus:border-primary cursor-pointer pr-6 truncate h-8"
              containerClassName="space-y-0"
            />
          </div>
        )
      )}

      <div className="flex items-center gap-1.5 shrink-0">
        <ThemeSwitcher />
        <Link
          href={isTenant ? '/tenant/profile' : '/profile'}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0 hover:opacity-85 transition-opacity',
            isAdmin
              ? 'bg-accent-soft text-accent'
              : 'bg-primary-soft text-primary',
          )}
          title={tNav('viewProfileTooltip')}
        >
          <Text as="span" size="xs" weight="bold" color="inherit">
            {user?.name
              ? user.name.trim().charAt(0).toUpperCase()
              : isAdmin
                ? 'A'
                : isStaff
                  ? 'T'
                  : 'R'}
          </Text>
        </Link>
      </div>
    </header>
  )
}
export default DashboardMobileHeader

