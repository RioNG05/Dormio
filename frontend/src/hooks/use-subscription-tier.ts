'use client'

import { useState, useEffect, useCallback } from 'react'
import { subscriptionService, CurrentSubscriptionResponse } from '@/services/subscription.service'
import { TierRequiredEventDetail } from '@/services/api'
import { useAuth } from '@/context/AuthContext'

const TIER_LEVELS: Record<string, number> = {
  free: 0,
  plus: 1,
  pro: 2,
}

export function useSubscriptionTier() {
  const { activeBuilding } = useAuth()
  const [tierData, setTierData] = useState<CurrentSubscriptionResponse | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(true)

  const fetchTier = useCallback(async () => {
    try {
      setIsLoading(true)
      const data = await subscriptionService.getCurrentSubscription(activeBuilding?.id)
      setTierData(data)
    } catch {
      // Default to free on error
      setTierData({ tier: 'free', hasActiveSubscription: false, subscription: null })
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id])

  useEffect(() => {
    fetchTier()
  }, [fetchTier])

  const tier = (tierData?.tier || 'free').toLowerCase() as 'free' | 'plus' | 'pro'
  const isPlusOrHigher = (TIER_LEVELS[tier] ?? 0) >= 1
  const isPro = (TIER_LEVELS[tier] ?? 0) >= 2

  const requireTier = useCallback(
    (requiredTier: 'plus' | 'pro', customMessage?: string): boolean => {
      const currentLevel = TIER_LEVELS[tier] ?? 0
      const requiredLevel = TIER_LEVELS[requiredTier] ?? 1

      if (currentLevel >= requiredLevel) {
        return true
      }

      const defaultMsg =
        requiredTier === 'pro'
          ? 'Tính năng này yêu cầu gói dịch vụ Pro.'
          : 'Tính năng in và xuất hợp đồng pháp lý yêu cầu nâng cấp lên gói Plus.'

      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent<TierRequiredEventDetail>('dormio:tier-required', {
            detail: {
              message: customMessage || defaultMsg,
              requiredTier,
              currentTier: tier,
              upgradeUrl: '/pricing',
            },
          }),
        )
      }
      return false
    },
    [tier],
  )

  return {
    tier,
    isPlusOrHigher,
    isPro,
    isLoading,
    subscription: tierData?.subscription,
    requireTier,
    refreshTier: fetchTier,
  }
}

