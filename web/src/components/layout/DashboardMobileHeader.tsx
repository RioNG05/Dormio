'use client'

import React from 'react'
import { Menu } from 'lucide-react'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import ThemeSwitcher from '@/components/ThemeSwitcher'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import { Button } from '@/components/ui'

export interface DashboardMobileHeaderProps {
  onOpenMobileMenu: () => void
}

export function DashboardMobileHeader({ onOpenMobileMenu }: DashboardMobileHeaderProps) {
  return (
    <header className="flex lg:hidden items-center justify-between h-14 px-3 border-b border-line bg-card sticky top-0 z-30 gap-2">
      {/* Left actions: Toggle sidebar button, App Logo, Notification Bell */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="-ml-1"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5" />
        </Button>
        <Logo size="sm" imageClassName="h-7 w-auto" />
      </div>

      {/* Right actions: Theme Switcher, Language Switcher */}
      <div className="flex items-center gap-1.5 shrink-0">
        <LanguageSwitcher />
        <ThemeSwitcher />
        <NotificationBell align="right" />
      </div>
    </header>
  )
}

export default DashboardMobileHeader
