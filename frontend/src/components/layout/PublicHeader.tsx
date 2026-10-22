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
import ThemeSwitcher from '@/components/ThemeSwitcher'
import NotificationBell from '@/components/NotificationBell'
import Logo from '@/components/Logo'
import { useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { Button, Text, Modal, TextInput, NumberInput, Avatar } from '@/components/ui'

interface UserMenuItem {
  key: string
  label: string
  href?: string
  onClick?: () => void
  icon: React.ReactNode
  className?: string
  dividerAbove?: boolean
  isDanger?: boolean
}

function MenuItemRenderer({
  item,
  onClose,
  isMobile,
}: {
  item: UserMenuItem
  onClose: () => void
  isMobile?: boolean
}) {
  const handleClick = () => {
    onClose()
    if (item.onClick) item.onClick()
  }

  const buttonElement = (
    <Button
      onClick={item.href ? undefined : handleClick}
      variant={item.isDanger ? 'ghost-danger' : 'ghost'}
      size="lg"
      fullWidth
      justify={isMobile ? 'between' : 'start'}
      leftIcon={item.icon}
      rightIcon={isMobile ? <ArrowRight /> : undefined}
    >
      <Text as="span" size="xs" weight="bold" color={item.isDanger ? 'danger' : 'inherit'}>
        {item.label}
      </Text>
    </Button>
  )

  return (
    <>
      {item.dividerAbove && <div className="border-t border-line my-1" />}
      {item.href ? (
        <Link href={item.href} onClick={handleClick} className="block w-full">
          {buttonElement}
        </Link>
      ) : (
        buttonElement
      )}
    </>
  )
}

export function PublicHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const tNav = useTranslations('nav')
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

  const userMenuItems: UserMenuItem[] = user
    ? [
      ...(user.role === 'employee'
        ? [
          {
            key: 'staff-portal',
            label: tNav('staffPortalLink'),
            href: '/staff',
            icon: <Clock className="w-4 h-4 text-primary" />,
            className: 'text-primary hover:bg-primary/10',
          },
        ]
        : []),
      {
        key: 'profile',
        label: tNav('myProfile'),
        href: '/profile',
        icon: <UserCheck className="w-4 h-4 text-primary" />,
      },
      {
        key: 'send-application',
        label: tNav('sendApplication'),
        href: '/send-application',
        icon: <FileText className="w-4 h-4 text-amber-500" />,
      },
      {
        key: 'rented-rooms',
        label:
          user.role === 'landlord'
            ? tNav('manageHouses')
            : user.role === 'employee'
              ? tNav('myShifts')
              : tNav('myRentedRooms'),
        href:
          user.role === 'landlord'
            ? '/landlord/rooms'
            : user.role === 'employee'
              ? '/staff'
              : '/tenant',
        icon: <Building className="w-4 h-4 text-vacant" />,
      },
      ...(FEATURE_FLAGS.ENABLE_BHRP
        ? [
          {
            key: 'saved-rooms',
            label: tNav('mySavedRooms'),
            href: '/saved-posts',
            icon: <Heart className="w-4 h-4 text-danger fill-danger/10" />,
          },
          {
            key: 'post-listing',
            label: tNav('postListing'),
            href: '/posts/create',
            icon: <PlusCircle className="w-4 h-4 text-accent" />,
            dividerAbove: true,
          },
          {
            key: 'post-analytics',
            label: tNav('postAnalytics'),
            href: '/posts/analytics',
            icon: <BarChart3 className="w-4 h-4 text-primary" />,
          },
        ]
        : []),
      {
        key: 'logout',
        label: tNav('logout'),
        onClick: logout,
        icon: <LogOut className="w-4 h-4 text-danger" />,
        isDanger: true,
        dividerAbove: true,
      },
    ]
    : []

  return (
    <>
      {/* Public Header */}
      <header className="sticky top-0 z-40 w-full border-b border-line bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex h-16 md:h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
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
                  className={`text-xs font-bold transition-all relative py-1 ${isActive
                    ? 'text-primary font-extrabold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary after:rounded-full'
                    : 'text-foreground/90 hover:text-primary'
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
            <Button
              rounded="full"
              onClick={handleManageBoardingHouse}
              leftIcon={<Building2 />}
            >
              {tNav('manageYourHouse')}
            </Button>

            {/* Auth Actions Conditional Rendering */}
            {isLoggedIn && user ? (
              <div className="flex items-center gap-3">
                {/* User Avatar & Dropdown Menu */}
                <div ref={userMenuRef} className="relative pl-2 border-l border-line">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1 rounded-2xl hover:bg-card-hover text-left h-auto"
                  >
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="sm"
                      bordered
                      className="shadow-xs"
                    />
                    <div className="hidden sm:block text-left">
                      <Text
                        as="span"
                        size="xs"
                        weight="black"
                        color="default"
                        className="block leading-tight truncate max-w-[100px]"
                      >
                        {user.name}
                      </Text>
                    </div>
                    <ChevronDown
                      className={`w-3.5 h-3.5 text-muted transition-transform ${isUserMenuOpen ? 'rotate-180' : ''
                        }`}
                    />
                  </Button>

                  {/* Dropdown Menu Popup */}
                  {isUserMenuOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 bg-card rounded-2xl border border-line shadow-2xl p-2 z-50 animate-in fade-in duration-200 space-y-1">
                      <div className="px-3 py-2 border-b border-line">
                        <Text as="p" size="xs" weight="black" color="default" className="truncate">
                          {user.name}
                        </Text>
                        <Text as="p" size="3xs" color="subtle" weight="medium" className="truncate">
                          {user.phone}
                        </Text>
                      </div>

                      {userMenuItems.map(item => (
                        <MenuItemRenderer
                          key={item.key}
                          item={item}
                          onClose={() => setIsUserMenuOpen(false)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/login">
                  <Button variant="ghost" rounded="full">
                    {tNav('login')}
                  </Button>
                </Link>
              </div>
            )}

            {/* Notification Popup, Theme Switcher & Language Switcher */}
            <div className="flex items-center gap-1.5 pl-1.5 border-l border-zinc-200/80 dark:border-line">
              {isLoggedIn && <NotificationBell align="right" />}
              <ThemeSwitcher />
              <LanguageSwitcher />
            </div>
          </div>

          {/* Mobile Controls */}
          <div className="flex items-center gap-1.5 lg:hidden">
            {isLoggedIn && <NotificationBell align="right" />}
            <ThemeSwitcher />
            <LanguageSwitcher />
            <Button
              variant="secondary"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="rounded-2xl border border-zinc-200/80 dark:border-line"
              aria-label="Toggle Navigation Menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6 text-zinc-900 dark:text-foreground" />
              ) : (
                <Menu className="w-6 h-6 text-zinc-900 dark:text-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile Dropdown Menu (Vertically Scrollable) */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-b border-line bg-card px-4 py-6 space-y-6 animate-in slide-in-from-top-3 duration-200 shadow-2xl max-h-[calc(100vh-5rem)] overflow-y-auto">
            <nav className="flex flex-col space-y-2">
              {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="px-4 py-3 rounded-2xl text-sm font-extrabold text-foreground hover:bg-card-hover transition-all flex items-center justify-between"
                >
                  <Text as="span" size="sm" weight="extrabold" color="inherit">
                    {item.label}
                  </Text>
                  <ArrowRight className="w-4 h-4 text-zinc-300" />
                </Link>
              ))}
            </nav>

            {/* Mobile Auth Actions */}
            <div className="pt-4 border-t border-line space-y-3">
              {isLoggedIn && user ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-3.5 bg-surface rounded-2xl border border-line">
                    <Avatar
                      src={user.avatar}
                      name={user.name}
                      size="md"
                      bordered
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
                    size="md"
                    rounded="full"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleManageBoardingHouse()
                    }}
                    className="w-full shadow-md justify-center"
                    leftIcon={<Building2 />}
                  >
                    {tNav('manageYourHouse')}
                  </Button>

                  {/* Inner Profile Links for Mobile/Tablet */}
                  <div className="bg-surface rounded-2xl p-2 border border-line space-y-1">
                    {userMenuItems.map(item => (
                      <MenuItemRenderer
                        key={`mobile-${item.key}`}
                        item={item}
                        onClose={() => setIsMobileMenuOpen(false)}
                        isMobile
                      />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Button
                    size="md"
                    rounded="full"
                    onClick={() => {
                      setIsMobileMenuOpen(false)
                      handleManageBoardingHouse()
                    }}
                    className="w-full shadow-md justify-center"
                    leftIcon={<Building2 />}
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

      {/* Landlord Upgrade Form Modal */}
      <Modal
        isOpen={isLandlordModalOpen}
        onClose={() => setIsLandlordModalOpen(false)}
        size="md"
        className="rounded-3xl"
      >
        <Modal.Body className="p-6 sm:p-8 space-y-6">
          {upgradeSuccess ? (
            <div className="text-center py-8 space-y-4 animate-in fade-in duration-300">
              <div className="w-16 h-16 rounded-full bg-success-soft text-emerald-500 flex items-center justify-center mx-auto shadow-inner">
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
                <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-danger-soft text-accent text-[10px] font-black rounded-full uppercase tracking-wider">
                  <Sparkles className="w-3 h-3 fill-accent" />
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
                size="md"
                rounded="full"
                className="w-full bg-accent hover:bg-[#ff5518] shadow-lg shadow-accent/25 border-none justify-center"
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
          <div className="bg-card rounded-3xl max-w-xl w-full p-4 shadow-2xl space-y-4 border border-line cursor-default">
            <div className="relative flex items-center border-b border-line pb-3">
              <Search className="w-5 h-5 text-primary absolute left-3" />
              <input
                type="text"
                autoFocus
                placeholder={tUpgrade('searchPlaceholder')}
                value={commandQuery}
                onChange={e => setCommandQuery(e.target.value)}
                className="w-full pl-10 pr-10 py-2 text-sm font-bold text-foreground focus:outline-none"
              />
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                onClick={() => setIsCommandOpen(false)}
                className="absolute right-2 !h-7 !w-7"
                aria-label="Close search"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto space-y-2">
              <Text
                as="span"
                size="3xs"
                weight="black"
                color="subtle"
                uppercase
                className="tracking-wider block px-3"
              >
                {tUpgrade('instantSearchTitle', { count: searchResults.length })}
              </Text>

              {searchResults.length === 0 ? (
                <Text
                  as="div"
                  size="xs"
                  weight="semibold"
                  color="subtle"
                  align="center"
                  className="p-8"
                >
                  {tNav('noSearchResults', { query: commandQuery })}
                </Text>
              ) : (
                searchResults.map((item, idx) => (
                  <Link
                    key={idx}
                    href={item.href}
                    onClick={() => setIsCommandOpen(false)}
                    className="flex items-center justify-between p-3 rounded-2xl hover:bg-card-hover transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                        {item.type === 'room' ? (
                          <Building className="w-4 h-4" />
                        ) : (
                          <Command className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <Text
                          as="h4"
                          size="xs"
                          weight="extrabold"
                          color="default"
                          className="group-hover:text-primary transition-colors"
                        >
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
    </>
  )
}
export default PublicHeader
