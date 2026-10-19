'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import Logo from '@/components/Logo'
import NotificationBell from '@/components/NotificationBell'
import { Button } from '@/components/ui'
import { DashboardBuildingSelector } from './DashboardBuildingSelector'
import { DashboardNav } from './DashboardNav'
import { DashboardUserFooter } from './DashboardUserFooter'

export interface DashboardSidebarProps {
  mobileMenuOpen: boolean
  onCloseMobileMenu: () => void
}

export function DashboardSidebar({
  mobileMenuOpen,
  onCloseMobileMenu,
}: DashboardSidebarProps) {
  const pathname = usePathname()
  const isTenant = pathname?.startsWith('/tenant')
  const isAdmin = pathname?.startsWith('/admin')
  const isStaff = pathname?.startsWith('/staff')
  const isLandlord = !isAdmin && !isStaff && !isTenant

  return (
    <>
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 border-r border-line bg-card z-20">
        <div className="flex flex-col flex-1 min-h-0">
          <div className="flex items-center justify-between h-14 px-4 border-b border-line">
            <Logo size="sm" imageClassName="h-7 w-auto" />
            <NotificationBell align="left" />
          </div>

          {isLandlord && <DashboardBuildingSelector />}

          <DashboardNav persistScroll />
          <DashboardUserFooter />
        </div>
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onCloseMobileMenu}
          />
          <aside className="fixed inset-y-0 left-0 w-64 bg-card shadow-xl flex flex-col border-r border-line">
            <div className="flex items-center justify-between h-14 px-4 border-b border-line">
              <Logo size="sm" imageClassName="h-7 w-auto" />
              <div className="flex items-center gap-1">
                <NotificationBell align="left" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={onCloseMobileMenu}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {isLandlord && <DashboardBuildingSelector />}

            <DashboardNav />
            <DashboardUserFooter />
          </aside>
        </div>
      )}
    </>
  )
}
export default DashboardSidebar

