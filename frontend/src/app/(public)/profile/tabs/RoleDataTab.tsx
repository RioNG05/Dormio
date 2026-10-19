'use client'

import React from 'react'
import Link from 'next/link'
import { Building2, Home, MapPin, ExternalLink, Phone, FileText } from 'lucide-react'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button, Form, Text } from '@/components/ui'
import { formatCurrency } from '@/utils'

export default function RoleDataTab() {
  const t = useTranslations('guest')
  const { currentLocale } = useLanguage()
  const { user } = useAuth()
  const { toast } = useToast()

  const isLandlord = user?.role === 'landlord'

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {isLandlord ? (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-4 gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-[#FF6B35]/10 text-[#FF6B35] flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <Text as="h3" variant="heading" size="lg" weight="black">
                  {user?.houseName || t('guestProfileLandlordMockHouseName')}
                </Text>
                <Text variant="subtitle" size="xs" weight="medium">
                  {user?.houseAddress || t('guestProfileLandlordMockHouseAddress')}
                </Text>
              </div>
            </div>

            <Link href="/landlord" className="w-full sm:w-auto">
              <Button
                variant="accent"
                size="md"
                leftIcon={<Building2 className="w-4 h-4 shrink-0" />}
                rightIcon={<span>&rarr;</span>}
                className="w-full sm:w-auto rounded-2xl hover:scale-105"
              >
                {t('guestProfileOpenDashboard')}
              </Button>
            </Link>
          </div>

          <Form.Grid cols={3}>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileLandlordManagedRooms')}
              </Text>
              <Text as="span" variant="heading" size="lg" weight="black" className="block">
                {t('guestProfileLandlordRoomsCount', { count: 10 })}
              </Text>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileLandlordRevenueMonth')}
              </Text>
              <Text
                as="span"
                variant="heading"
                size="lg"
                weight="black"
                color="brand"
                className="block"
              >
                {formatCurrency(45000000, currentLocale)}
              </Text>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileLandlordSubscription')}
              </Text>
              <Text
                as="span"
                size="xs"
                weight="black"
                color="success"
                uppercase
                className="block"
              >
                {t('guestProfileLandlordProTier')}
              </Text>
            </div>
          </Form.Grid>
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-5 sm:p-8 border border-zinc-200/80 shadow-sm space-y-6">
          {/* Header CTA to Jump to Tenant Dashboard */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-100 pb-5 gap-4">
            <div className="space-y-1.5">
              <Text
                as="span"
                variant="badge"
                size="xs"
                weight="black"
                color="success"
                className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full whitespace-nowrap"
              >
                {t('guestProfileTenantRoomActive')}
              </Text>

              {/* Room Name with clear vertical spacing */}
              <Text as="h3" variant="heading" size="2xl" weight="black" className="pt-1">
                {t('guestProfileTenantMockRoomTitle')}
              </Text>

              {/* Clickable Address with Google Maps Integration */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent('123 Nguyen Hue Ben Nghe District 1 HCMC')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1.5 bg-[#2AC1BC]/10 px-3 py-1.5 rounded-xl border border-[#2AC1BC]/20 transition-all"
                >
                  <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                  <Text as="span" size="xs" weight="bold" color="brand">
                    {t('guestProfileTenantMockRoomAddress')}
                  </Text>
                  <ExternalLink className="w-3.5 h-3.5 text-[#2AC1BC] ml-1 shrink-0" />
                </a>
              </div>
            </div>

            {/* Direct Jump Button to Tenant Dashboard */}
            <Link href="/tenant" className="w-full sm:w-auto">
              <Button
                variant="primary"
                size="lg"
                leftIcon={<Home className="w-4 h-4 shrink-0" />}
                rightIcon={<span>&rarr;</span>}
                className="w-full sm:w-auto rounded-2xl shadow-lg shadow-[#2AC1BC]/25 hover:scale-105"
              >
                {t('guestProfileTenantRoomDashboard')}
              </Button>
            </Link>
          </div>

          {/* Lease Details Cards */}
          <Form.Grid cols={3}>
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileTenantMonthlyRent')}
              </Text>
              <Text
                as="span"
                variant="heading"
                size="xl"
                weight="black"
                color="danger"
                className="block"
              >
                {formatCurrency(4500000, currentLocale)}
                {t('guestProfileTenantPerMonth')}
              </Text>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileTenantDepositEscrow')}
              </Text>
              <Text
                as="span"
                variant="heading"
                size="xl"
                weight="black"
                color="brand"
                className="block"
              >
                {formatCurrency(1000000, currentLocale)}
              </Text>
              <Text
                as="span"
                variant="caption"
                size="3xs"
                weight="bold"
                color="success"
                className="block"
              >
                {t('guestProfileTenantContractEscrowProtected')}
              </Text>
            </div>

            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileTenantContractTerm')}
              </Text>
              <Text as="span" variant="heading" size="sm" weight="black" className="block">
                01/01/2026 - 31/12/2026
              </Text>
              <Text
                as="span"
                variant="caption"
                size="3xs"
                weight="bold"
                color="secondary"
                className="block"
              >
                {t('guestProfileTenantContractDuration', { stayed: 8, total: 12, percent: 66 })}
              </Text>
            </div>
          </Form.Grid>

          {/* Lease Progress Bar */}
          <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-2">
            <div className="flex flex-col sm:flex-row justify-between gap-1">
              <Text as="span" size="xs" weight="bold" color="secondary">
                {t('guestProfileTenantContractProgress')}
              </Text>
              <Text as="span" size="xs" weight="bold" color="secondary">
                {t('guestProfileTenantContractRemaining', { percent: 66, months: 4 })}
              </Text>
            </div>
            <div className="w-full h-3 bg-zinc-200 rounded-full overflow-hidden">
              <div className="h-full bg-[#2AC1BC] rounded-full" style={{ width: '66%' }} />
            </div>
          </div>

          {/* Landlord Contact & Contract Export */}
          <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl space-y-4 shadow-xl border border-zinc-800">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
              <div>
                <Text as="h4" variant="heading" size="sm" weight="black" color="white">
                  {t('guestProfileLandlordManager')}
                </Text>
                <Text variant="subtitle" size="xs" weight="medium" color="subtle">
                  {t('guestProfileLandlordContractInfo', {
                    name: t('guestProfileLandlordMockName'),
                    phone: '0901.234.567',
                  })}
                </Text>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                <a
                  href="tel:0901234567"
                  className="px-4 py-2.5 bg-[#FF6B35] hover:bg-[#ff5518] text-white rounded-xl transition-all shadow-md shadow-[#FF6B35]/20 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <Text as="span" size="xs" weight="extrabold" color="white">
                    {t('guestProfileCallLandlord')}
                  </Text>
                </a>

                <Button
                  type="button"
                  variant="dark"
                  size="sm"
                  leftIcon={<FileText className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />}
                  onClick={() => toast.info(t('guestProfileAlertDownloadPdf'))}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
                >
                  {t('guestProfileDownloadContractPdf')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
