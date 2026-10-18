'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Crown, Sparkles, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react'
import { TierRequiredEventDetail } from '@/services/api'
import { Modal, Button, Text, Chip } from '@/components/ui'

export default function TierUpgradeModal() {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [tierInfo, setTierInfo] = useState<TierRequiredEventDetail | null>(null)

  useEffect(() => {
    const handleTierRequired = (e: Event) => {
      const customEvent = e as CustomEvent<TierRequiredEventDetail>
      if (customEvent.detail) {
        setTierInfo(customEvent.detail)
        setIsOpen(true)
      }
    }

    window.addEventListener('dormio:tier-required', handleTierRequired)
    return () => {
      window.removeEventListener('dormio:tier-required', handleTierRequired)
    }
  }, [])

  if (!isOpen || !tierInfo) return null

  const isPro = tierInfo.requiredTier?.toLowerCase() === 'pro'
  const requiredTierName = isPro ? 'Pro' : 'Plus'
  const currentTierName =
    tierInfo.currentTier?.toLowerCase() === 'plus'
      ? 'Plus'
      : tierInfo.currentTier?.toLowerCase() === 'pro'
        ? 'Pro'
        : 'Free'

  const benefits = isPro
    ? [
        'Phân quyền quản lý nhân viên & phân công ca trực',
        'Lập lịch làm việc & tuần hoàn ca làm',
        'Chấm công điện tử & giám sát ca làm việc',
        'Chuyển đổi ngữ cảnh & báo cáo thống kê đa nhà trọ',
      ]
    : [
        'Quản lý chi phí vận hành & hóa đơn chi tiêu',
        'Quản lý & xử lý tiền cọc giữ chỗ',
        'Gửi thông báo phát thanh tới toàn bộ cư dân',
        'Xuất hợp đồng & tài liệu pháp lý trực tuyến',
        'Quản lý tài sản & kiểm kê trang thiết bị',
      ]

  const handleUpgrade = () => {
    setIsOpen(false)
    router.push(tierInfo.upgradeUrl || '/pricing')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      size="lg"
      className="p-2 overflow-hidden"
    >
      <div className="relative space-y-6">
        {/* Header Icon & Badges */}
        <div className="flex items-center gap-3">
          <div
            className={`flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shrink-0 ${
              isPro
                ? 'bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-amber-500/20'
                : 'bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-indigo-500/20'
            }`}
          >
            {isPro ? <Crown className="h-7 w-7" /> : <Sparkles className="h-7 w-7" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Chip
                variant={isPro ? 'warning' : 'info'}
                size="sm"
                className="uppercase tracking-wider font-extrabold"
              >
                Gói {requiredTierName}
              </Chip>
              <Text as="span" size="xs" color="subtle">
                Gói hiện tại: {currentTierName}
              </Text>
            </div>
            <Text as="h3" size="xl" weight="black" color="default" className="mt-1">
              Nâng cấp tài khoản để mở khóa
            </Text>
          </div>
        </div>

        {/* Backend Error Message */}
        <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50/70 p-4 text-amber-900 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-200">
          <ShieldAlert className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
          <Text size="xs" weight="medium" color="inherit" className="leading-relaxed">
            {tierInfo.message}
          </Text>
        </div>

        {/* Benefits list */}
        <div className="space-y-3">
          <Text size="xs" weight="bold" color="subtle" uppercase className="tracking-wider">
            Đặc quyền gói {requiredTierName} bao gồm:
          </Text>
          <ul className="space-y-2.5">
            {benefits.map((benefit, index) => (
              <li
                key={index}
                className="flex items-start gap-2.5"
              >
                <CheckCircle2
                  className={`h-4 w-4 shrink-0 mt-0.5 ${
                    isPro ? 'text-amber-500' : 'text-indigo-500'
                  }`}
                />
                <Text as="span" size="xs" color="secondary">
                  {benefit}
                </Text>
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end pt-2">
          <Button
            variant="outline"
            size="md"
            onClick={() => setIsOpen(false)}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              Để sau
            </Text>
          </Button>
          <Button
            variant="primary"
            size="md"
            onClick={handleUpgrade}
            rightIcon={<ArrowRight className="h-4 w-4" />}
            className={
              isPro
                ? '!bg-gradient-to-r !from-amber-500 !to-orange-500 hover:!from-amber-600 hover:!to-orange-600 shadow-amber-500/25 shadow-lg'
                : '!bg-gradient-to-r !from-indigo-600 !to-violet-600 hover:!from-indigo-700 hover:!to-violet-700 shadow-indigo-500/25 shadow-lg'
            }
          >
            <Text as="span" size="xs" weight="bold" color="white">
              Nâng cấp ngay
            </Text>
          </Button>
        </div>
      </div>
    </Modal>
  )
}
