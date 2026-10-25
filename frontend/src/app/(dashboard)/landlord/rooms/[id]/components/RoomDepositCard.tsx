'use client'

import React from 'react'
import { Wallet } from 'lucide-react'
import { Button, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'

interface RoomDepositCardProps {
  currentContract: any
  onRefundDeposit: () => void
}

export const RoomDepositCard: React.FC<RoomDepositCardProps> = ({
  currentContract,
  onRefundDeposit,
}) => {
  const t = useTranslations('landlord')

  const depositAmount = currentContract?.deposit?.amount
    ? parseInt(currentContract.deposit.amount).toLocaleString('vi-VN')
    : '3.000.000'

  const startDateFormatted = currentContract?.startDate
    ? new Date(currentContract.startDate).toLocaleDateString('vi-VN')
    : '01/01/2026'

  const endDateFormatted = currentContract?.endDate
    ? new Date(currentContract.endDate).toLocaleDateString('vi-VN')
    : '01/01/2027'

  return (
    <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4 flex flex-col justify-between">
      <div>
        <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2 border-b border-line pb-3">
          <Wallet className="w-4 h-4 text-deposit" />{' '}
          {t('landlordRoomDetailDepositTitle')}
        </Text>

        <div className="mt-3 p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-indigo-500/10 rounded-2xl border border-deposit-subtle space-y-3">
          <div className="flex items-center justify-between">
            <Text as="span" size="2xs" weight="black" className="text-deposit uppercase tracking-wider">
              {t('landlordRoomDetailDepositSafeBadge')}
            </Text>
            <Text
              as="span"
              size="2xs"
              weight="black"
              color="success"
              className="px-2 py-0.5 bg-success-soft rounded-full border border-success-subtle"
            >
              {currentContract?.deposit?.status === 'active'
                ? t('landlordRoomDetailDepositLocked')
                : t('landlordRoomDetailDepositLabel')}
            </Text>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-black text-deposit tracking-tight">
              <Text as="span" weight="black" className="text-2xl text-deposit">
                {depositAmount}{' '}
              </Text>
              <Text as="span" size="xs" color="inherit">
                ₫
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 border-t border-deposit-subtle pt-2.5">
            <div className="space-y-0.5">
              <Text as="span" size="2xs" color="subtle" weight="medium" className="block">
                {t('landlordRoomDetailContractStartDate')}
              </Text>
              <Text as="span" size="2xs" weight="black" color="default">
                {startDateFormatted}
              </Text>
            </div>
            <div className="space-y-0.5 text-right">
              <Text as="span" size="2xs" color="subtle" weight="medium" className="block">
                {t('landlordRoomDetailContractDuration')}
              </Text>
              <Text as="span" size="2xs" weight="black" color="default">
                {endDateFormatted}
              </Text>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-1 mt-auto">
        <Button
          fullWidth
          onClick={onRefundDeposit}
          leftIcon={<Wallet className="w-4 h-4" />}
          className="from-deposit to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
        >
          {t('landlordRoomDetailRefundDepositBtn')}
        </Button>
      </div>
    </div>
  )
}

