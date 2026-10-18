'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import Logo from '@/components/Logo'
import { usePathname } from 'next/navigation'
import { Button, Text } from '@/components/ui'
import { useAuth } from '@/context/AuthContext'
import {
  Menu,
  X,
  Home,
  Building2,
  Layers,
  BookOpen,
  Mail,
  User,
  ChevronDown,
  LogOut,
  FileText,
  CreditCard,
  Heart,
} from 'lucide-react'

import { FEATURE_FLAGS } from '@/config/features'

export function PublicHeader() {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [userDropdownOpen, setUserDropdownOpen] = useState(false)

  const { isLoggedIn, user, logout } = useAuth()

  const navLinks = [
    { href: '/', label: 'Trang chủ', icon: Home },
    ...(FEATURE_FLAGS.ENABLE_BHRP ? [{ href: '/rooms', label: 'Phòng trọ', icon: Building2 }] : []),
    { href: '/pricing', label: 'Tính năng & Giá', icon: Layers },
    { href: '/blog', label: 'Blog', icon: BookOpen },
    { href: '/contact', label: 'Liên hệ', icon: Mail },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/80 bg-white/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-16 md:h-20 max-w-7xl items-center justify-between px-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Logo size="md" />

        {/* Desktop & Tablet Navigation Links */}
        <nav className="hidden md:flex items-center gap-4 lg:gap-8">
          {navLinks.map(link => {
            const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors ${
                  isActive ? 'text-[#2AC1BC]' : 'text-zinc-600 hover:text-[#2AC1BC]'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit" className="lg:text-sm">
                  {link.label}
                </Text>
              </Link>
            )
          })}
        </nav>

        {/* Auth & Profile Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {isLoggedIn ? (
            <>
              {/* Prominent "Đăng ký trở thành chủ trọ" or "Bảng điều khiển" Button next to Avatar */}
              <Link href={user?.role === 'landlord' ? '/landlord' : '/landlord/setup'}>
                <Button size="xs" variant="orange">
                  <Building2 className="w-4 h-4" />
                  <Text as="span" size="xs" weight="bold" color="inherit" className="hidden sm:inline">
                    {user?.role === 'landlord'
                      ? 'Bảng điều khiển Chủ trọ'
                      : 'Đăng ký trở thành chủ trọ'}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="inherit" className="sm:hidden">
                    {user?.role === 'landlord' ? 'Chủ trọ' : 'Làm Chủ trọ'}
                  </Text>
                </Button>
              </Link>

              {/* User Profile Avatar Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 p-1.5 rounded-2xl hover:bg-zinc-100 transition-colors border border-zinc-200/80 bg-white cursor-pointer"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={
                      user?.avatar ||
                      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80'
                    }
                    alt={user?.name || 'User Avatar'}
                    className="w-8 h-8 rounded-xl object-cover border border-[#2AC1BC]/30"
                  />
                  <Text as="span" size="xs" weight="bold" color="default" className="hidden lg:inline">
                    {user?.name || 'Tài khoản'}
                  </Text>
                  <ChevronDown className="w-3.5 h-3.5 text-zinc-500" />
                </button>

                {/* Profile Dropdown Menu */}
                {userDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white p-3 shadow-2xl border border-zinc-200/80 z-50 flex flex-col gap-2 text-xs">
                    {/* User Info Header */}
                    <div className="p-2.5 rounded-xl bg-zinc-50 border border-zinc-100 flex flex-col">
                      <Text size="sm" weight="bold" color="default">
                        {user?.name || 'Tài khoản'}
                      </Text>
                      <Text size="2xs" color="subtle">
                        {user?.email || 'user@example.com'}
                      </Text>
                      <Text as="span" size="3xs" weight="bold" color="brand" uppercase className="inline-flex items-center gap-1 mt-1">
                        ● Khách thuê trọ
                      </Text>
                    </div>

                    {/* Quick Landlord Action */}
                    <Link
                      href={user?.role === 'landlord' ? '/landlord' : '/landlord/setup'}
                      onClick={() => setUserDropdownOpen(false)}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl font-bold transition-colors ${
                        user?.role === 'landlord'
                          ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] hover:bg-[#2AC1BC]/20'
                          : 'bg-[#FF6B35]/10 text-[#FF6B35] hover:bg-[#FF6B35]/20'
                      }`}
                    >
                      <Building2 className="w-4 h-4 shrink-0" />
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {user?.role === 'landlord'
                          ? 'Bảng điều khiển Chủ trọ →'
                          : 'Đăng ký trở thành chủ trọ →'}
                      </Text>
                    </Link>

                    {/* Menu links */}
                    <div className="flex flex-col gap-1 pt-1 border-t border-zinc-100 text-zinc-700">
                      {FEATURE_FLAGS.ENABLE_BHRP && (
                        <Link
                          href="/saved-posts"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100"
                        >
                          <Heart className="w-4 h-4 text-zinc-400" />
                          <Text as="span" size="xs" weight="semibold" color="inherit">
                            Phòng trọ đã lưu
                          </Text>
                        </Link>
                      )}
                      <Link
                        href="/tenant/contracts"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100"
                      >
                        <FileText className="w-4 h-4 text-zinc-400" />
                        <Text as="span" size="xs" weight="semibold" color="inherit">
                          Hợp đồng của tôi
                        </Text>
                      </Link>
                      <Link
                        href="/tenant/invoices"
                        onClick={() => setUserDropdownOpen(false)}
                        className="flex items-center gap-2.5 px-2.5 py-2 rounded-lg hover:bg-zinc-100"
                      >
                        <CreditCard className="w-4 h-4 text-zinc-400" />
                        <Text as="span" size="xs" weight="semibold" color="inherit">
                          Hóa đơn tiền phòng
                        </Text>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          logout()
                          setUserDropdownOpen(false)
                        }}
                        leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
                        className="!justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 mt-1 border-t border-zinc-100 pt-2 w-full"
                      >
                        <Text as="span" size="xs" weight="semibold" color="danger">
                          Đăng xuất tài khoản
                        </Text>
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hidden sm:inline-flex px-2.5 py-1.5 transition-colors"
              >
                <Text as="span" size="xs" weight="bold" color="default" className="hover:text-[#2AC1BC] md:text-sm">
                  Đăng nhập
                </Text>
              </Link>
              <Link href="/register">
                <Button size="xs" className="sm:px-5 sm:py-2.5">
                  <Text as="span" size="xs" weight="bold" color="white" className="md:text-sm">
                    Đăng ký tài khoản
                  </Text>
                </Button>
              </Link>
            </>
          )}

          {/* Mobile Hamburger Toggle Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-zinc-700 hover:bg-zinc-100"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Drawer Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-16 bg-white/98 backdrop-blur-xl border-b border-zinc-200 px-4 pt-3 pb-6 flex flex-col gap-3 shadow-2xl z-50">
          <div className="flex flex-col gap-1">
            {navLinks.map(link => {
              const Icon = link.icon
              const isActive = link.href === '/' ? pathname === '/' : pathname.startsWith(link.href)

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isActive ? 'bg-[#2AC1BC]/10 text-[#2AC1BC]' : 'text-zinc-700 hover:bg-zinc-100'
                  }`}
                >
                  <Icon className="w-4 h-4 text-[#2AC1BC]" />
                  <Text as="span" size="sm" weight="bold" color="inherit">
                    {link.label}
                  </Text>
                </Link>
              )
            })}
          </div>

          <div className="pt-3 border-t border-zinc-100 flex flex-col gap-2">
            <Link
              href={user?.role === 'landlord' ? '/landlord' : '/landlord/setup'}
              onClick={() => setMobileMenuOpen(false)}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-xl shadow-md ${
                user?.role === 'landlord' ? 'bg-[#2AC1BC]' : 'bg-[#FF6B35]'
              }`}
            >
              <Building2 className="w-4 h-4 text-white" />
              <Text as="span" size="sm" weight="bold" color="white">
                {user?.role === 'landlord' ? 'Bảng điều khiển Chủ trọ' : 'Đăng ký trở thành chủ trọ'}
              </Text>
            </Link>

            {isLoggedIn ? (
              <Button
                variant="outline"
                size="md"
                onClick={() => {
                  logout()
                  setMobileMenuOpen(false)
                }}
                leftIcon={<LogOut className="w-4 h-4 text-rose-600" />}
                className="w-full border-rose-200 hover:bg-rose-50 mt-1"
              >
                <Text as="span" size="sm" weight="bold" color="danger">
                  Đăng xuất ({user?.name})
                </Text>
              </Button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="md"
                  leftIcon={<User className="w-4 h-4 text-zinc-700" />}
                  className="w-full"
                >
                  <Text as="span" size="sm" weight="bold" color="default">
                    Đăng nhập tài khoản
                  </Text>
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
