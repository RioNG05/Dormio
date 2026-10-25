'use client'

import React, { useRef, useState, useMemo } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Phone,
  Mail,
  Camera,
  Loader2,
  Lock,
  Building,
  CreditCard,
  UserCheck,
  Building2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Button, Text, Avatar } from '@/components/ui'
import { uploadImageToBackend } from '@/services/upload.service'
import { userService } from '@/services/user.service'

import PersonalInfoTab from './tabs/PersonalInfoTab'
import RoleDataTab from './tabs/RoleDataTab'
import BankAccountTab from './tabs/BankAccountTab'
import SecurityTab from './tabs/SecurityTab'

function UniversalProfilePage() {
  const t = useTranslations('guest')
  const { isLoggedIn, user, updateAvatar } = useAuth()
  const { toast } = useToast()
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

  interface ProfileTabItem {
    key: TabKey
    labelLine1: string
    labelLine2?: string
    icon: React.ReactNode
  }

  const navTabs: ProfileTabItem[] = useMemo(
    () => [
      {
        key: 'info',
        labelLine1: t('guestProfileTabInfo1'),
        icon: <UserCheck className="w-4 h-4 shrink-0" />,
      },
      {
        key: 'role_data',
        labelLine1: isLandlord
          ? t('guestProfileTabLandlordRole1')
          : t('guestProfileTabTenantRole1'),
        icon: isLandlord ? (
          <Building2 className="w-4 h-4 shrink-0" />
        ) : (
          <Building className="w-4 h-4 shrink-0" />
        ),
      },
      {
        key: 'bank',
        labelLine1: t('guestProfileTabBank1'),
        icon: <CreditCard className="w-4 h-4 shrink-0" />,
      },
      {
        key: 'security',
        labelLine1: t('guestProfileTabSecurity1'),
        icon: <Lock className="w-4 h-4 shrink-0" />,
      },
    ],
    [t, isLandlord],
  )

  const fullName = user?.name || t('guestProfileDefaultFullName')
  const phone = user?.phone || '0987.654.321'
  const email = user?.email || 'nguyenvana@gmail.com'

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
  const [previewAvatarUrl, setPreviewAvatarUrl] = useState<string | null>(null)

  const handleAvatarClick = () => {
    if (isUploadingAvatar) return
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate MIME type
    const validMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
    if (!validMimes.includes(file.type) && !file.type.startsWith('image/')) {
      toast.error(t('guestProfileAvatarInvalidType'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    // Validate file size (max 5MB)
    const MAX_SIZE = 5 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      toast.error(t('guestProfileAvatarSizeLimit'))
      if (fileInputRef.current) fileInputRef.current.value = ''
      return
    }

    setIsUploadingAvatar(true)

    const reader = new FileReader()
    reader.onload = async () => {
      try {
        const base64Data = reader.result as string
        setPreviewAvatarUrl(base64Data)

        // Upload to Cloudinary backend
        const uploadResult = await uploadImageToBackend(base64Data, 'dormio/avatars')
        const newAvatarUrl = uploadResult?.url

        if (!newAvatarUrl) {
          throw new Error('Upload returned empty URL')
        }

        // Persist to backend database if user is authenticated
        try {
          await userService.updateAvatar(newAvatarUrl)
        } catch (apiErr) {
          console.warn('Could not persist avatar to backend database:', apiErr)
        }

        // Update global auth state & localStorage
        updateAvatar(newAvatarUrl)

        toast.success(t('guestProfileAvatarUploadSuccess'))
      } catch (err) {
        console.error('Failed to upload avatar:', err)
        toast.error(t('guestProfileAvatarUploadFailed'))
      } finally {
        setPreviewAvatarUrl(null)
        setIsUploadingAvatar(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    }

    reader.onerror = () => {
      setIsUploadingAvatar(false)
      setPreviewAvatarUrl(null)
      toast.error(t('guestProfileAvatarUploadFailed'))
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }

    reader.readAsDataURL(file)
  }

  if (!isLoggedIn) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-6 space-y-6">
        <div className="w-20 h-20 rounded-3xl bg-primary/10 text-primary flex items-center justify-center shadow-inner">
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
          <Button
            href="/login"
            size="md"
            rightIcon={<span>&rarr;</span>}
            className="rounded-2xl shadow-lg shadow-primary/20"
          >
            {t('guestProfileLockLoginBtn')}
          </Button>
          <Button href="/register" variant="dark" size="md" className="rounded-2xl">
            {t('guestProfileLockRegisterBtn')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-surface/50 py-6 sm:py-10 px-3 sm:px-6 lg:px-8 animate-in fade-in duration-500">
      <div className="max-w-5xl mx-auto space-y-6 sm:space-y-8">
        {/* Top Profile Banner Hero Spotlight */}
        <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 rounded-3xl p-5 sm:p-8 text-white shadow-2xl border border-zinc-800 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-center md:items-start justify-between gap-6 text-center md:text-left">
            <div className="flex flex-col sm:flex-row items-center gap-5">
              {/* Hidden File Input for Avatar Upload */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/jpg"
                onChange={handleAvatarChange}
                className="hidden"
                disabled={isUploadingAvatar}
              />

              {/* Avatar Image with Edit Badge */}
              <div
                className="relative group shrink-0 cursor-pointer"
                onClick={handleAvatarClick}
                role="button"
                tabIndex={0}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleAvatarClick()
                  }
                }}
                title={t('guestProfileAvatarChangeTooltip')}
              >
                <Avatar
                  src={previewAvatarUrl || user?.avatar}
                  name={fullName}
                  size="3xl"
                  shape="rounded"
                />

                {/* Uploading Spinner Overlay */}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/60 rounded-3xl flex flex-col items-center justify-center gap-1 z-10 transition-opacity">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                )}

                <Button
                  size="icon-sm"
                  title={t('guestProfileAvatarChangeTooltip')}
                  isLoading={isUploadingAvatar}
                  disabled={isUploadingAvatar}
                  onClick={e => {
                    e.stopPropagation()
                    handleAvatarClick()
                  }}
                  className="absolute bottom-1 right-1 shadow-lg hover:scale-110 z-20"
                >
                  <Camera />
                </Button>
              </div>

              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <Text
                    as="span"
                    variant="badge"
                    size="3xs"
                    weight="black"
                    uppercase
                    className={`px-3 py-1 rounded-full border tracking-wider whitespace-nowrap ${isLandlord
                      ? 'bg-accent/20 text-accent border-accent/30'
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
                    <Phone className="w-3.5 h-3.5 text-primary" />
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
                    <Mail className="w-3.5 h-3.5 text-primary" />
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
          <div className="flex flex-wrap lg:flex-nowrap items-stretch sm:items-center gap-2 w-full">
            {navTabs.map(tab => (
              <Button
                key={tab.key}
                variant={activeTab === tab.key ? 'primary' : 'outline'}
                size="md"
                onClick={() => setActiveTab(tab.key)}
                leftIcon={tab.icon}
                className="w-full sm:w-auto sm:justify-start leading-tight"
              >
                {tab.labelLine1}
              </Button>
            ))}
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
