'use client'

import React from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Phone,
  Mail,
  ShieldCheck,
  Camera,
  Lock,
  Building,
  CreditCard,
  UserCheck,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Text, Avatar } from '@/components/ui'

import PersonalInfoTab from './tabs/PersonalInfoTab'
import RoleDataTab from './tabs/RoleDataTab'
import BankAccountTab from './tabs/BankAccountTab'
import SecurityTab from './tabs/SecurityTab'

function UniversalProfilePage() {
  const t = useTranslations('guest')
  const { isLoggedIn, user } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  // Tab value derived from URL param
  type TabKey = 'info' | 'role_data' | 'bank' | 'security'
  const TAB_PARAM_MAP: Record<string, TabKey> = {
    'personal-info': 'info',
    role: 'role_data',
    bank: 'bank',
    security: 'security',
  }
  const TAB_URL_MAP: Record<TabKey, string> = {
    info: 'personal-info',
    role_data: 'role',
    bank: 'bank',
    security: 'security',
  }
  const rawTab = searchParams.get('tab') ?? 'personal-info'
  const activeTab: TabKey = TAB_PARAM_MAP[rawTab] ?? 'info'

  const setActiveTab = (tab: TabKey) => {
    router.push(`/profile?tab=${TAB_URL_MAP[tab]}`, { scroll: false })
  }

  const isLandlord = user?.role === 'landlord'
  const isAdmin = user?.role === 'admin'
  const isTenant = !isLandlord && !isAdmin

  const fullName = user?.name || t('guestProfileDefaultFullName')
  const phone = user?.phone || '0987.654.321'
  const email = user?.email || 'nguyenvana@gmail.com'

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center shadow-inner">
          <Lock className="w-10 h-10" />
        </div>
        <div className="space-y-2 max-w-md">
          <Text as="h2" variant="heading" size="2xl" weight="black">
            {t('guestProfileLockTitle')}
          </Text>
          <Text variant="subtitle" size="xs" weight="medium" className="leading-relaxed">
            {t('guestProfileLockDesc')}
          </Text>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Link href="/login">
            <Button
              variant="primary"
              size="md"
              rightIcon={<span>&rarr;</span>}
              className="rounded-2xl shadow-lg shadow-[#2AC1BC]/20"
            >
              {t('guestProfileLockLoginBtn')}
            </Button>
          </Link>
          <Link href="/register">
            <Button variant="dark" size="md" className="rounded-2xl">
              {t('guestProfileLockRegisterBtn')}
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface/50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Profile Banner Hero Spotlight */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 sm:p-8 text-white shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#2AC1BC]/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Avatar Image with Edit Badge */}
              <div className="relative group shrink-0">
                <Avatar
                  src={user?.avatar}
                  name={fullName}
                  size="3xl"
                  shape="rounded"
                  className="border-2 border-[#2AC1BC] shadow-xl group-hover:opacity-90 transition-opacity"
                />
                <Button
                  type="button"
                  variant="primary"
                  size="icon-sm"
                  title={t('guestProfileAvatarChangeTooltip')}
                  className="absolute bottom-1 right-1 shadow-lg hover:scale-110"
                >
                  <Camera className="w-4 h-4" />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Text
                    as="span"
                    variant="badge"
                    size="3xs"
                    weight="black"
                    color="brand"
                    uppercase
                    className="px-3 py-1 bg-[#2AC1BC]/20 rounded-full border border-[#2AC1BC]/30 tracking-wider whitespace-nowrap"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <Text as="span" color="inherit">
                      {t('guestProfileEkycVerifiedBadge')}
                    </Text>
                  </Text>

                  <Text
                    as="span"
                    variant="badge"
                    size="3xs"
                    weight="black"
                    uppercase
                    className={`px-3 py-1 rounded-full border tracking-wider whitespace-nowrap ${
                      isLandlord
                        ? 'bg-[#FF6B35]/20 text-[#FF6B35] border-[#FF6B35]/30'
                        : isAdmin
                          ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                          : 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                    }`}
                  >
                    {isLandlord && t('guestProfileRoleLandlord')}
                    {isTenant && t('guestProfileRoleTenant')}
                    {isAdmin && t('guestProfileRoleAdmin')}
                  </Text>
                </div>

                <Text
                  as="h1"
                  variant="heading"
                  size="2xl"
                  weight="black"
                  color="white"
                  className="sm:text-3xl"
                >
                  {fullName}
                </Text>
                <Text variant="subtitle" size="xs" weight="medium" color="subtle">
                  {t('guestProfileHeroSubtitle')}
                </Text>

                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 sm:gap-4 pt-1">
                  <Text
                    as="span"
                    size="xs"
                    weight="semibold"
                    className="flex items-center gap-1.5 whitespace-nowrap text-zinc-300"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    <Text as="span" color="inherit">
                      {phone}
                    </Text>
                  </Text>
                  <Text as="span" size="xs" className="hidden sm:inline text-muted">
                    •
                  </Text>
                  <Text
                    as="span"
                    size="xs"
                    weight="semibold"
                    className="flex items-center gap-1.5 whitespace-nowrap text-zinc-300"
                  >
                    <Mail className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    <Text as="span" color="inherit">
                      {email}
                    </Text>
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 100% Mobile & Desktop Responsive Tab Navigation Bar */}
        <div className="w-full border-b border-line pb-3">
          <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full">
            {/* Tab 1 */}
            <Button
              type="button"
              variant={activeTab === 'info' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('info')}
              leftIcon={<UserCheck className="w-4 h-4 shrink-0" />}
              className="w-full sm:w-auto rounded-2xl text-[11px] sm:text-xs justify-center sm:justify-start text-center sm:text-left leading-tight"
            >
              <Text as="span" color="inherit">
                <Text as="span" color="inherit" className="block sm:inline">
                  {t('guestProfileTabInfo1')}
                </Text>
                <Text as="span" color="inherit" className="block sm:inline">
                  {t('guestProfileTabInfo2')}
                </Text>
              </Text>
            </Button>

            {/* Tab 2 */}
            <Button
              type="button"
              variant={activeTab === 'role_data' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('role_data')}
              leftIcon={
                isLandlord ? (
                  <Building2 className="w-4 h-4 shrink-0" />
                ) : (
                  <Building className="w-4 h-4 shrink-0" />
                )
              }
              className="w-full sm:w-auto rounded-2xl text-[11px] sm:text-xs justify-center sm:justify-start text-center sm:text-left leading-tight"
            >
              <Text as="span" color="inherit">
                {isLandlord ? (
                  <>
                    <Text as="span" color="inherit" className="block sm:inline">
                      {t('guestProfileTabLandlordRole1')}
                    </Text>
                    <Text as="span" color="inherit" className="block sm:inline">
                      {t('guestProfileTabLandlordRole2')}
                    </Text>
                  </>
                ) : (
                  <>
                    <Text as="span" color="inherit" className="block sm:inline">
                      {t('guestProfileTabTenantRole1')}
                    </Text>
                    <Text as="span" color="inherit" className="block sm:inline">
                      {t('guestProfileTabTenantRole2')}
                    </Text>
                  </>
                )}
              </Text>
            </Button>

            {/* Tab 3 */}
            <Button
              type="button"
              variant={activeTab === 'bank' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('bank')}
              leftIcon={<CreditCard className="w-4 h-4 shrink-0" />}
              className="w-full sm:w-auto rounded-2xl text-[11px] sm:text-xs justify-center sm:justify-start text-center sm:text-left leading-tight"
            >
              <Text as="span" color="inherit">
                <Text as="span" color="inherit" className="block sm:inline">
                  {t('guestProfileTabBank1')}
                </Text>
                <Text as="span" color="inherit" className="block sm:inline">
                  {t('guestProfileTabBank2')}
                </Text>
              </Text>
            </Button>

            {/* Tab 4 */}
            <Button
              type="button"
              variant={activeTab === 'security' ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setActiveTab('security')}
              leftIcon={<Lock className="w-4 h-4 shrink-0" />}
              className="w-full sm:w-auto rounded-2xl text-[11px] sm:text-xs justify-center sm:justify-start text-center sm:text-left leading-tight"
            >
              <Text as="span" color="inherit">
                <Text as="span" color="inherit" className="block sm:inline">
                  {t('guestProfileTabSecurity1')}
                </Text>
                <Text as="span" color="inherit" className="block sm:inline">
                  {t('guestProfileTabSecurity2')}
                </Text>
              </Text>
            </Button>
          </div>
        </div>

        {/* Render Tab Contents */}
        {activeTab === 'info' && <PersonalInfoTab />}
        {activeTab === 'role_data' && <RoleDataTab />}
        {activeTab === 'bank' && <BankAccountTab />}
        {activeTab === 'security' && <SecurityTab />}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <React.Suspense
      fallback={
        <Text
          as="div"
          size="xs"
          weight="bold"
          color="subtle"
          className="min-h-screen bg-surface flex items-center justify-center p-8"
        >
          Loading profile...
        </Text>
      }
    >
      <UniversalProfilePage />
    </React.Suspense>
  )
}
