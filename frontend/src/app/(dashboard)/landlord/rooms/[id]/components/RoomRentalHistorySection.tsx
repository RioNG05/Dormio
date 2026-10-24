'use client'

import React from 'react'
import Link from 'next/link'
import { History } from 'lucide-react'
import { Button, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { RoomDashboardRentalHistoryItem } from '@/services/room.service'

interface RoomRentalHistorySectionProps {
  rentalHistory: RoomDashboardRentalHistoryItem[]
  roomTenant?: string
}

export function RoomRentalHistorySection({
  rentalHistory,
  roomTenant,
}: RoomRentalHistorySectionProps) {
  const t = useTranslations('landlord')

  return (
    <div className="bg-card rounded-2xl border border-line shadow-xs p-3.5 sm:p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-line pb-3">
        <Text
          as="h2"
          weight="black"
          color="default"
          className="text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2"
        >
          <History className="w-4 h-4 text-primary" />{' '}
          {t('landlordRoomDetailRentalHistoryTitle').replace(
            '{count}',
            String(rentalHistory?.length || (roomTenant ? 1 : 0)),
          )}
        </Text>
        <Text as="span" size="2xs" weight="bold" color="secondary">
          {t('landlordRoomDetailRentalHistorySubtitle')}
        </Text>
      </div>

      <div className="space-y-3">
        {rentalHistory && rentalHistory.length > 0 ? (
          rentalHistory.map(hist => {
            const isActive = hist.status === 'active'
            return (
              <div
                key={hist.id}
                className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-primary/5 border-primary/30'
                    : 'bg-surface border-line'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                      isActive ? 'bg-primary' : 'bg-line'
                    }`}
                  >
                    <Text
                      as="span"
                      size="xs"
                      weight="black"
                      className={isActive ? '' : 'text-foreground/90'}
                    >
                      {hist.primaryTenantName.charAt(0)}
                    </Text>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Text as="span" size="xs" weight="black" color="default">
                        {hist.primaryTenantName}
                      </Text>
                      <span
                        className={`px-2 py-0.5 rounded-full ${
                          isActive ? 'bg-success-soft' : 'bg-line'
                        }`}
                      >
                        <Text
                          as="span"
                          size="2xs"
                          weight="black"
                          color={isActive ? 'success' : 'secondary'}
                        >
                          {isActive
                            ? t('landlordRoomDetailContractActive')
                            : t('landlordRoomDetailContractEnded')}
                        </Text>
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Text as="span" size="xs" weight="medium" color="secondary">
                        {new Date(hist.startDate).toLocaleDateString('vi-VN')} -{' '}
                        {new Date(hist.endDate).toLocaleDateString('vi-VN')}
                      </Text>
                      {hist.primaryTenantPhone && (
                        <Text as="span" size="xs" weight="medium" color="secondary">
                          • {hist.primaryTenantPhone}
                        </Text>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                  <Text as="span" size="xs" weight="black" color="brand">
                    {parseInt(hist.rentPrice).toLocaleString('vi-VN')}{' '}
                    {t('landlordRoomDetailRentPerMonth')}
                  </Text>
                  <Button href={`/landlord/contracts/${hist.id}`} variant="white">
                    {t('landlordRoomDetailViewContractShort')}
                  </Button>
                </div>
              </div>
            )
          })
        ) : (
          <div className="p-4 text-center bg-surface rounded-xl">
            <Text size="xs" weight="bold" color="subtle">
              {t('landlordRoomDetailNoRentalHistory')}
            </Text>
          </div>
        )}
      </div>
    </div>
  )
}

