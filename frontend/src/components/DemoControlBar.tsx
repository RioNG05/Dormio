'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Sparkles,
  User,
  Building2,
  Shield,
  ChevronUp,
  ChevronDown,
  Home,
  X,
  Check,
  ArrowRight,
  EyeOff,
} from 'lucide-react'
import { useAuth, DemoPreset } from '@/context/AuthContext'
import { Button, Text } from '@/components/ui'

export default function DemoControlBar() {
  const router = useRouter()
  const { isLoggedIn, user, setDemoPreset } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  if (isDismissed) {
    return (
      <Button
        variant="ghost"
        size="sm"
        rounded="full"
        onClick={() => setIsDismissed(false)}
        className="fixed bottom-4 right-4 z-50 p-2 bg-zinc-900/90 text-primary border border-zinc-700 shadow-lg text-[10px] font-bold hover:bg-zinc-800"
        title="Mở lại bảng thử nghiệm"
      >
        <Sparkles className="w-3.5 h-3.5 fill-primary" />
        <Text as="span" size="3xs" weight="bold" color="inherit">
          Thử nghiệm
        </Text>
      </Button>
    )
  }

  const handleSelectPreset = (preset: DemoPreset, redirectPath?: string) => {
    setDemoPreset(preset)
    if (redirectPath) {
      router.push(redirectPath)
    }
  }

  const getActivePreset = (): DemoPreset => {
    if (!isLoggedIn || !user) return 'guest'
    if (user.role === 'admin') return 'admin'
    if (user.role === 'employee') return 'staff'
    if (user.role === 'tenant') return 'tenant'
    if (user.role === 'landlord') {
      return user.houseName ? 'landlord_active' : 'landlord_empty'
    }
    return 'guest'
  }

  const activePreset = getActivePreset()

  const getPresetLabel = (preset: DemoPreset) => {
    switch (preset) {
      case 'guest':
        return '🌐 Khách Vãng Lai'
      case 'tenant':
        return '👤 Khách Thuê (Tenant)'
      case 'staff':
        return '👷 Nhân Viên (Staff)'
      case 'landlord_empty':
        return '🏠 Chủ Trọ Mới (Trống Trơn)'
      case 'landlord_active':
        return '📊 Chủ Trọ Đang Vận Hành'
      case 'admin':
        return '👑 Admin Nền Tảng'
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-auto">
      {/* Floating Expanded Control Panel Panel */}
      {isOpen && (
        <div className="mb-3 max-w-sm sm:max-w-md w-full bg-zinc-950/95 backdrop-blur-2xl border border-zinc-800 p-5 rounded-3xl shadow-2xl text-white space-y-4 animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-primary text-white flex items-center justify-center font-black">
                <Sparkles className="w-4 h-4 fill-white" />
              </div>
              <div>
                <Text as="h4" size="xs" weight="black" color="white">
                  Bảng Thử Nghiệm Project
                </Text>
                <Text as="p" size="3xs" color="subtle" weight="medium">
                  Chuyển đổi vai trò & kiểm thử các luồng 1-click
                </Text>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                onClick={() => setIsDismissed(true)}
                title="Ẩn nút thử nghiệm"
                className="!h-7 !w-7 text-muted hover:text-rose-400 hover:bg-zinc-800"
              >
                <EyeOff className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                rounded="full"
                onClick={() => setIsOpen(false)}
                className="!h-7 !w-7 text-muted hover:text-white hover:bg-zinc-800"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* 1-Click Role Presets */}
          <div className="space-y-2">
            <Text as="span" size="3xs" weight="extrabold" color="subtle" uppercase className="tracking-wider block">
              CHỌN VAI TRÒ KIỂM THỬ:
            </Text>

            <div className="grid grid-cols-1 gap-2">
              {/* Guest */}
              <button
                onClick={() => handleSelectPreset('guest', '/')}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === 'guest'
                    ? 'border-white bg-card text-foreground shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  🌐 1. Khách Vãng Lai (Chưa đăng nhập)
                </Text>
                {activePreset === 'guest' && <Check className="w-4 h-4 text-foreground stroke-[3]" />}
              </button>

              {/* Tenant */}
              <button
                onClick={() => handleSelectPreset('tenant', '/tenant')}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === 'tenant'
                    ? 'border-accent bg-accent text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  👤 2. Khách Thuê
                </Text>
                {activePreset === 'tenant' && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Staff */}
              <button
                onClick={() => handleSelectPreset('staff', '/staff')}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === 'staff'
                    ? 'border-primary bg-primary text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  👷 3. Nhân Viên Vận Hành (Staff)
                </Text>
                {activePreset === 'staff' && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>

              {/* Landlord Empty */}
              <button
                onClick={() => handleSelectPreset('landlord_empty', '/landlord')}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === 'landlord_empty'
                    ? 'border-danger bg-danger text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  🏠 4. Chủ Trọ Mới (Dashboard Trống Trơn)
                </Text>
                {activePreset === 'landlord_empty' && (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                )}
              </button>

              {/* Landlord Active */}
              <button
                onClick={() => handleSelectPreset('landlord_active', '/landlord')}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === 'landlord_active'
                    ? 'border-success bg-success text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  📊 5. Chủ Trọ Đang Vận Hành
                </Text>
                {activePreset === 'landlord_active' && (
                  <Check className="w-4 h-4 text-white stroke-[3]" />
                )}
              </button>

              {/* Admin */}
              <button
                onClick={() => handleSelectPreset('admin', '/admin')}
                className={`p-2.5 rounded-2xl border text-left text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  activePreset === 'admin'
                    ? 'border-deposit bg-deposit text-white shadow-md'
                    : 'border-zinc-800 bg-zinc-900/80 text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  👑 6. Admin Nền Tảng (System)
                </Text>
                {activePreset === 'admin' && <Check className="w-4 h-4 text-white stroke-[3]" />}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Pill Button Toggle (0% Header Collision) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-3 bg-zinc-950/95 hover:bg-zinc-900 text-white rounded-full border border-zinc-700 shadow-2xl flex items-center gap-2.5 transition-all cursor-pointer hover:scale-105 group"
      >
        <span className="relative flex h-2.5 w-2.5 shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
        </span>

        <Text as="span" size="xs" weight="black" color="brand">
          🧪 Test Suite:
        </Text>
        <Text as="span" size="xs" weight="extrabold" color="inherit" className="text-zinc-200">
          {getPresetLabel(activePreset)}
        </Text>

        {isOpen ? (
          <ChevronDown className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
        ) : (
          <ChevronUp className="w-4 h-4 text-muted group-hover:text-white transition-colors" />
        )}
      </button>
    </div>
  )
}
