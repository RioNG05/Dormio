'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import AIChatBot from '@/components/AIChatBot'
import TierUpgradeModal from '@/components/TierUpgradeModal'
import AuthGuard from '@/components/AuthGuard'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { DashboardSidebar, DashboardMobileHeader } from '@/components/layout'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tNav = useTranslations('nav')
  const pathname = usePathname()
  const { activeBuilding } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const isTenant = pathname?.startsWith('/tenant')
  const isAdmin = pathname?.startsWith('/admin')
  const isStaff = pathname?.startsWith('/staff')

  // Dynamically update browser document title based on active building & route
  useEffect(() => {
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

  return (
    <AuthGuard>
      <div className="flex min-h-screen bg-zinc-50">
        <DashboardSidebar
          mobileMenuOpen={mobileMenuOpen}
          onCloseMobileMenu={() => setMobileMenuOpen(false)}
        />

        <div className="flex flex-col flex-1 lg:pl-64 min-w-0">
          <DashboardMobileHeader onOpenMobileMenu={() => setMobileMenuOpen(true)} />
          <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">{children}</main>
        </div>

        {!isTenant && !isAdmin && !isStaff && <AIChatBot />}
        <TierUpgradeModal />
      </div>
    </AuthGuard>
  )
}
