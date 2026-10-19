'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Search,
  Command,
  X,
  MapPin,
  Building,
  ArrowRight,
  Menu,
  Building2,
  UserCheck,
  Sparkles,
  CheckCircle2,
  LogOut,
  Heart,
  ChevronDown,
  PlusCircle,
  BarChart3,
  Clock,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import NotificationBell from '@/components/NotificationBell'
import Logo from '@/components/Logo'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { Button, Text, Modal, TextInput, NumberInput } from '@/components/ui'

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const tNav = useTranslations('nav')
  const tFooter = useTranslations('footer')
  const tUpgrade = useTranslations('landlordUpgradeModal')
  const {
    isLoggedIn,
    user,
    logout,
    upgradeToLandlord,
    buildings,
    capabilities,
  } = useAuth()

  const handleManageBoardingHouse = () => {
    if (!isLoggedIn) {
      router.push('/login?from=/landlord')
      return
    }
    const hasHouse = (buildings && buildings.length > 0) || Boolean(capabilities?.isLandlord)
    if (hasHouse) {
      router.push('/landlord')
    } else {
      router.push('/landlord/setup')
    }
  }

  const [isCommandOpen, setIsCommandOpen] = useState(false)
  const [commandQuery, setCommandQuery] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const userMenuRef = React.useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Landlord Upgrade Modal State
  const [isLandlordModalOpen, setIsLandlordModalOpen] = useState(false)
  const [houseName, setHouseName] = useState('')
  const [houseAddress, setHouseAddress] = useState('')
  const [roomCount, setRoomCount] = useState('10')
  const [upgradeSuccess, setUpgradeSuccess] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const handleUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!houseName || !houseAddress) return

    upgradeToLandlord({ houseName, houseAddress })
    setUpgradeSuccess(true)

    setTimeout(() => {
      setUpgradeSuccess(false)
      setIsLandlordModalOpen(false)
      router.push('/landlord')
    }, 1500)
  }

  const searchResults = [
    ...(FEATURE_FLAGS.ENABLE_BHRP
      ? [
          {
            type: 'room',
            title: tNav('searchMockRoom1Title'),
            href: '/rooms/1',
            price: tNav('searchMockRoom1Price'),
            location: tNav('searchMockRoom1Location'),
          },
          {
            type: 'room',
            title: tNav('searchMockRoom2Title'),
            href: '/rooms/2',
            price: tNav('searchMockRoom2Price'),
            location: tNav('searchMockRoom2Location'),
          },
          {
            type: 'room',
            title: tNav('searchMockRoom3Title'),
            href: '/rooms/3',
            price: tNav('searchMockRoom3Price'),
            location: tNav('searchMockRoom3Location'),
          },
        ]
      : []),
    {
      type: 'blog',
      title: tNav('searchMockBlog1Title'),
      href: '/blog',
      category: tNav('searchMockBlog1Category'),
      price: undefined,
      location: undefined,
    },
    {
      type: 'blog',
      title: tNav('searchMockBlog2Title'),
      href: '/blog',
      category: tNav('searchMockBlog2Category'),
      price: undefined,
      location: undefined,
    },
  ].filter(
    item =>
      commandQuery === '' ||
      item.title.toLowerCase().includes(commandQuery.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(commandQuery.toLowerCase())),
  )

  const navItems = [
    { href: '/', label: tNav('home') },
    ...(FEATURE_FLAGS.ENABLE_BHRP ? [{ href: '/rooms', label: tNav('rooms') }] : []),
    { href: '/pricing', label: tNav('pricing') },
    { href: '/blog', label: tNav('blog') },
    { href: '/contact', label: tNav('contact') },
  ]

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <Logo size="md" />

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-6">
            {navItems.map(item => {
              const isActive =
                pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs font-bold transition-all relative py-1 ${
                    isActive
                      ? 'text-[#2AC1BC] font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#2AC1BC] after:rounded-full'
                      : 'text-zinc-700 hover:text-[#2AC1BC]'
                  }`}
                >
                  <Text as="span" size="xs" weight={isActive ? 'extrabold' : 'bold'} color="inherit">
                    {item.label}
                  </Text>
                </Link>
              )
            })}
          </nav>

          {/* Desktop Right Action Buttons & User Menu */}
          <div className="hidden lg:flex items-center gap-3">
            {/* Nút Quản lý nhà trọ của bạn */}
            <Button
              variant="primary"
              size="sm"
              rounded="full"
              onClick={handleManageBoardingHouse}
              leftIcon={<Building2 className="w-3.5 h-3.5" />}
              className="shadow-md shadow-[#2AC1BC]/20 hover:scale-105"
            >
              {tNav('manageYourHouse')}
            </Button>

            {/* Auth Actions Conditional Rendering */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                {/* User Avatar & Dropdown Menu */}
                <div ref={userMenuRef} className="relative pl-2 border-l border-zinc-200">
                  <button
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 cursor-pointer p-1 rounded-2xl hover:bg-zinc-100 transition-all text-left"
                  >
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-8 h-8 rounded-full object-cover border border-zinc-200 shadow-xs"
                    />
                    <div className="hidden sm:block text-left">
                      <Text as="span" size="xs" weight="black" color="default" className="block leading-tight truncate max-w-[100px]">
                        {user.name}
                      </Text>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-zinc-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {/* Dropdown Menu Popup */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl border border-zinc-200 shadow-2xl p-2 z-50 animate-in fade-in duration-200 space-y-1">
                      <div className="px-3 py-2 border-b border-zinc-100">
                        <Text as="p" size="xs" weight="black" color="default" className="truncate">
                          {user.name}
                        </Text>
                        <Text as="p" size="3xs" color="subtle" weight="medium" className="truncate">
                          {user.email}
                        </Text>
                      </div>

                      {/* Staff Portal Link */}
                      {user.role === 'employee' && (
                        <Link
                          href="/staff"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-[#2AC1BC] hover:bg-[#2AC1BC]/10 rounded-xl transition-all"
                        >
                          <Clock className="w-4 h-4 text-[#2AC1BC]" />
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {tNav('staffPortalLink')}
                          </Text>
                        </Link>
                      )}

                      {/* 1. Profile */}
                      <Link
                        href="/profile"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      >
                        <UserCheck className="w-4 h-4 text-[#2AC1BC]" />
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {tNav('myProfile')}
                        </Text>
                      </Link>

                      {/* Gửi đơn */}
                      <Link
                        href="/send-application"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      >
                        <FileText className="w-4 h-4 text-amber-500" />
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {tNav('sendApplication')}
                        </Text>
                      </Link>

                      {/* 2. Phòng trọ đã thuê / Quản lý trọ */}
                      <Link
                        href={
                          user.role === 'landlord'
                            ? '/landlord/rooms'
                            : user.role === 'employee'
                              ? '/staff'
                              : '/tenant'
                        }
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                      >
                        <Building className="w-4 h-4 text-blue-500" />
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {user.role === 'landlord'
                            ? tNav('manageHouses')
                            : user.role === 'employee'
                              ? tNav('myShifts')
                              : tNav('myRentedRooms')}
                        </Text>
                      </Link>

                      {/* 3. Phòng trọ đã lưu (Chỉ hiện khi bật sàn BHRP) */}
                      {FEATURE_FLAGS.ENABLE_BHRP && (
                        <Link
                          href="/saved-posts"
                          onClick={() => setIsUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                        >
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {tNav('mySavedRooms')}
                          </Text>
                        </Link>
                      )}

                      {/* 4. Đăng tin tìm khách & Thống kê (Chỉ hiện khi bật sàn BHRP) */}
                      {FEATURE_FLAGS.ENABLE_BHRP && (
                        <div className="border-t border-zinc-100 pt-1">
                          <Link
                            href="/posts/create"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                          >
                            <PlusCircle className="w-4 h-4 text-[#FF6B35]" />
                            <Text as="span" size="xs" weight="bold" color="inherit">
                              {tNav('postListing')}
                            </Text>
                          </Link>

                          <Link
                            href="/posts/analytics"
                            onClick={() => setIsUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-zinc-700 hover:text-zinc-900 hover:bg-zinc-100 rounded-xl transition-all"
                          >
                            <BarChart3 className="w-4 h-4 text-[#2AC1BC]" />
                            <Text as="span" size="xs" weight="bold" color="inherit">
                              {tNav('postAnalytics')}
                            </Text>
                          </Link>
                        </div>
                      )}

                      <div className="border-t border-zinc-100 pt-1">
                        {/* 6. Đăng xuất */}
                        <button
                          onClick={() => {
                            setIsUserMenuOpen(false)
                            logout()
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-all text-left cursor-pointer"
                        >
                          <LogOut className="w-4 h-4 text-rose-500" />
                          <Text as="span" size="xs" weight="bold" color="danger">
                            {tNav('logout')}
                          </Text>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" size="sm" rounded="full">
                    {tNav('login')}
                  </Button>
                </Link>
              </div>
            )}

            {/* 🔔 Notification Popup & 🌐 Language Switcher */}
            <div className="flex items-center gap-1 pl-1 border-l border-zinc-200/80">
              {isLoggedIn && <NotificationBell align="right" />}
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {isLoggedIn && <NotificationBell align="right" />}
            <LanguageSwitcher />
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-zinc-100 text-zinc-900 rounded-2xl cursor-pointer hover:bg-zinc-200 transition-all border border-zinc-200/80"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-zinc-900" />
              ) : (
                <Menu className="w-6 h-6 text-zinc-900" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Vertically Scrollable) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-zinc-200 bg-white px-4 py-6 space-y-6 animate-in slide-in-from-top-3 duration-200 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 rounded-2xl text-sm font-extrabold text-zinc-800 hover:bg-zinc-100 transition-all flex items-center justify-between"
                >
                  <Text as="span" size="sm" weight="extrabold" color="inherit">
                    {item.label}
                  </Text>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-zinc-100 space-y-3">
              {isLoggedIn && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 bg-zinc-50 rounded-2xl border border-zinc-200">
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-10 h-10 rounded-full object-cover border border-zinc-200"
                    />
                    <div>
                      <Text as="h4" size="xs" weight="black" color="default">
                        {user.name}
                      </Text>
                      <Text as="p" size="3xs" color="subtle" weight="semibold">
                        {user.role === 'landlord' ? tNav('landlordRole') : tNav('tenantRole')}
                      </Text>
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    rounded="full"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleManageBoardingHouse()
                    }}
                    className="w-full shadow-md justify-center"
                    leftIcon={<Building2 className="w-4 h-4" />}
                  >
                    {tNav('manageYourHouse')}
                  </Button>

                  {/* 4 Inner Profile Links for Mobile/Tablet */}
                  <div className="bg-zinc-50 rounded-2xl p-2 border border-zinc-200 space-y-1">
                    {/* 1. Thông tin cá nhân */}
                    <Link
                      href="/profile"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <UserCheck className="w-4 h-4 text-[#2AC1BC]" />
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {tNav('myProfile')}
                        </Text>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    </Link>

                    {/* Gửi đơn */}
                    <Link
                      href="/send-application"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <FileText className="w-4 h-4 text-amber-500" />
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {tNav('sendApplication')}
                        </Text>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    </Link>

                    {/* 2. Phòng trọ đã thuê */}
                    <Link
                      href={user.role === 'landlord' ? '/landlord/rooms' : '/tenant'}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                    >
                      <div className="flex items-center gap-2.5">
                        <Building className="w-4 h-4 text-blue-500" />
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {user.role === 'landlord'
                            ? tNav('manageHouses')
                            : user.role === 'employee'
                              ? tNav('myShifts')
                              : tNav('myRentedRooms')}
                        </Text>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                    </Link>

                    {/* 3. Phòng trọ đã lưu (Chỉ hiện khi bật sàn BHRP) */}
                    {FEATURE_FLAGS.ENABLE_BHRP && (
                      <Link
                        href="/saved-posts"
                        onClick={() => setIsMobileMenuOpen(false)}
                        className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <Heart className="w-4 h-4 text-rose-500 fill-rose-500/10" />
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {tNav('mySavedRooms')}
                          </Text>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                      </Link>
                    )}

                    {/* 4. Đăng tin & Thống kê (Chỉ hiện khi bật sàn BHRP) */}
                    {FEATURE_FLAGS.ENABLE_BHRP && (
                      <>
                        <Link
                          href="/posts/create"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <PlusCircle className="w-4 h-4 text-[#FF6B35]" />
                            <Text as="span" size="xs" weight="bold" color="inherit">
                              {tNav('postListing')}
                            </Text>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                        </Link>

                        <Link
                          href="/posts/analytics"
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-zinc-700 hover:bg-zinc-100 transition-all"
                        >
                          <div className="flex items-center gap-2.5">
                            <BarChart3 className="w-4 h-4 text-[#2AC1BC]" />
                            <Text as="span" size="xs" weight="bold" color="inherit">
                              {tNav('postAnalytics')}
                            </Text>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-zinc-300" />
                        </Link>
                      </>
                    )}

                    {/* 6. Đăng xuất */}
                    <button
                      onClick={() => {
                        setIsMobileMenuOpen(false)
                        logout()
                      }}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-100/50 transition-all text-left cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5">
                        <LogOut className="w-4 h-4 text-rose-500" />
                        <Text as="span" size="xs" weight="bold" color="danger">
                          {tNav('logout')}
                        </Text>
                      </div>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    variant="primary"
                    size="md"
                    rounded="full"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleManageBoardingHouse()
                    }}
                    className="w-full shadow-md justify-center"
                    leftIcon={<Building2 className="w-4 h-4" />}
                  >
                    {tNav('manageYourHouse')}
                  </Button>
                  <Link href="/login" className="block w-full">
                    <Button
                      variant="outline"
                      size="md"
                      rounded="full"
                      className="w-full justify-center"
                    >
                      {tNav('login')}
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </header>

      {/* 🏠 LANDLORD UPGRADE FORM MODAL (Khi người dùng bấm Đăng ký trở thành chủ trọ) */}
      <Modal
        isOpen={isLandlordModalOpen}
        onClose={() => setIsLandlordModalOpen(false)}
        size="md"
        className="rounded-3xl"
      >
        <Modal.Body className="p-6 sm:p-8 space-y-6">
          {upgradeSuccess ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <Text as="h3" size="xl" weight="black" color="default">
                {tUpgrade('congratsTitle')}
              </Text>
              <Text as="p" size="xs" color="secondary" weight="medium" className="max-w-xs mx-auto">
                {tUpgrade('congratsDesc')}
              </Text>
            </div>
          ) : (
            <form onSubmit={handleUpgradeSubmit} className="space-y-5">
              <div className="space-y-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-[#FF6B35] text-[10px] font-black rounded-full uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 fill-[#FF6B35]" />
                  <Text as="span" size="3xs" weight="black" color="orange">
                    {tUpgrade('badge')}
                  </Text>
                </span>
                <Text as="h3" size="xl" weight="black" color="default">
                  {tUpgrade('title')}
                </Text>
                <Text as="p" size="xs" color="secondary" weight="medium" className="leading-relaxed">
                  {tUpgrade('desc')}
                </Text>
              </div>

              <div className="space-y-4 pt-1">
                <TextInput
                  label={tUpgrade('houseNameLabel')}
                  required
                  placeholder={tUpgrade('houseNamePlaceholder')}
                  value={houseName}
                  onChange={e => setHouseName(e.target.value)}
                  leftIcon={<Building2 className="w-4 h-4" />}
                />

                <TextInput
                  label={tUpgrade('houseAddressLabel')}
                  required
                  placeholder={tUpgrade('houseAddressPlaceholder')}
                  value={houseAddress}
                  onChange={e => setHouseAddress(e.target.value)}
                  leftIcon={<MapPin className="w-4 h-4" />}
                />

                <NumberInput
                  label={tUpgrade('roomCountLabel')}
                  placeholder={tUpgrade('roomCountPlaceholder')}
                  value={roomCount}
                  onChange={e => setRoomCount(e.target.value)}
                />
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                rounded="full"
                className="w-full bg-[#FF6B35] hover:bg-[#ff5518] shadow-lg shadow-[#FF6B35]/25 border-none justify-center"
              >
                {tUpgrade('confirmBtn')}
              </Button>
            </form>
          )}
        </Modal.Body>
      </Modal>

      {/* Search Command Palette Modal */}
      {isCommandOpen && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setIsCommandOpen(false)
          }}
          className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 shadow-2xl space-y-4 border border-zinc-200 cursor-default">
            <div className="relative flex items-center border-b border-zinc-100 pb-3">
              <Search className="w-5 h-5 text-[#2AC1BC] absolute left-3" />
              <input
                type="text"
                autoFocus
                placeholder={tUpgrade('searchPlaceholder')}
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm font-bold text-zinc-900 focus:outline-none"
              />
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                onClick={() => setIsCommandOpen(false)}
                className="absolute right-2 !h-7 !w-7"
                aria-label="Đóng tìm kiếm"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              <Text as="span" size="3xs" weight="black" color="subtle" uppercase className="tracking-wider block px-3">
                {tUpgrade('instantSearchTitle', { count: searchResults.length })}
              </Text>

              {searchResults.length === 0 ? (
                <Text as="div" size="xs" weight="semibold" color="subtle" align="center" className="p-8">
                  {tNav('noSearchResults', { query: commandQuery })}
                </Text>
              ) : (
                searchResults.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsCommandOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-zinc-50 transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center">
                        {item.type === 'room' ? (
                          <Building className="w-4 h-4" />
                        ) : (
                          <Command className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <Text as="h4" size="xs" weight="extrabold" color="default" className="group-hover:text-[#2AC1BC] transition-colors">
                          {item.title}
                        </Text>
                        <Text as="span" size="3xs" color="subtle" weight="medium">
                          {item.location || item.category}
                        </Text>
                      </div>
                    </div>
                    {item.price && (
                      <Text as="span" size="xs" weight="black" color="danger">
                        {item.price}
                      </Text>
                    )}
                  </Link>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Page Content */}
      <main className="flex-1">{children}</main>

      {/* Public Footer */}
      <footer className="border-t border-zinc-200 bg-zinc-900 text-white py-12 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <Logo size="md" priority={false} />
            <Text as="p" size="xs" color="subtle" weight="medium" className="leading-relaxed">
              {tFooter('desc')}
            </Text>
          </div>

          <div className="space-y-2">
            <Text as="h4" size="xs" weight="black" color="inherit" uppercase className="tracking-wider text-zinc-300">
              {tFooter('systemModules')}
            </Text>
            <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('bhms')}
                  </Text>
                </Link>
              </li>
              {FEATURE_FLAGS.ENABLE_BHRP && (
                <li>
                  <Link href="/pricing" className="hover:text-white transition-colors">
                    <Text as="span" size="xs" color="inherit">
                      {tFooter('bhrp')}
                    </Text>
                  </Link>
                </li>
              )}
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('vietqr')}
                  </Text>
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('aiOcr')}
                  </Text>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Text as="h4" size="xs" weight="black" color="inherit" uppercase className="tracking-wider text-zinc-300">
              {tFooter('customerSupport')}
            </Text>
            <ul className="space-y-1.5 text-xs text-zinc-400 font-medium">
              <li>
                <Link href="/pricing" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('pricing')}
                  </Text>
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('contact')}
                  </Text>
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('blog')}
                  </Text>
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('terms')}
                  </Text>
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition-colors">
                  <Text as="span" size="xs" color="inherit">
                    {tFooter('privacy')}
                  </Text>
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-2">
            <Text as="h4" size="xs" weight="black" color="inherit" uppercase className="tracking-wider text-zinc-300">
              {tFooter('contactTitle')}
            </Text>
            <p className="text-xs text-zinc-400 font-medium">
              <a href="tel:0344265925" className="hover:text-[#2AC1BC] transition-colors">
                <Text as="span" size="xs" color="inherit">
                  {tFooter('hotline')}
                </Text>
              </a>
            </p>
            <p className="text-xs text-zinc-400 font-medium">
              <a
                href="mailto:contact@dormio.site"
                className="hover:text-[#2AC1BC] transition-colors"
              >
                <Text as="span" size="xs" color="inherit">
                  {tFooter('email')}
                </Text>
              </a>
            </p>
            <Text as="p" size="xs" color="subtle" weight="medium">
              {tFooter('address')}
            </Text>
          </div>
        </div>

        <Text as="div" size="2xs" color="subtle" weight="medium" align="center" className="mx-auto max-w-7xl border-t border-zinc-800 mt-8 pt-6">
          {tFooter('rights')}
        </Text>
      </footer>
    </div>
  )
}
