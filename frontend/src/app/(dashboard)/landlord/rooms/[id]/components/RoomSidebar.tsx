'use client'

import React from 'react'
import { Home, Banknote, HouseWifi, Building2 } from 'lucide-react'
import { Button, Text, Chip } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { Room, defaultRoomServices } from '../../data'
import { RoomDashboardResponse } from '@/services/room.service'
import { FinancialBreakdown, RoomCustomServiceItem } from './types'

export const getAmenityLabel = (item: string, t: (key: string) => string): string => {
  const map: Record<string, string> = {
    WiFi: t('landlordRoomAmenityWiFi'),
    'Điều hòa': t('landlordRoomAmenityAirConditioner'),
    'Nóng lạnh': t('landlordRoomAmenityWaterHeater'),
    'Tủ quần áo': t('landlordRoomAmenityWardrobe'),
    Giường: t('landlordRoomAmenityBed'),
    'Kệ bếp': t('landlordRoomAmenityKitchenShelf'),
    'Ban công': t('landlordRoomAmenityBalcony'),
    'WC riêng': t('landlordRoomAmenityPrivateBathroom'),
    'Máy giặt': t('landlordRoomAmenityWashingMachine'),
    Tivi: t('landlordRoomAmenityTv'),
    'Tủ lạnh': t('landlordRoomAmenityRefrigerator'),
    'Bảo vệ': t('landlordRoomAmenitySecurityGuard'),
  }
  return map[item] || item
}

interface RoomSidebarProps {
  room: Room
  dashboardData: RoomDashboardResponse | null
  currentContract: any
  unpaidFinancials: FinancialBreakdown | null
  services?: RoomCustomServiceItem[]
  onUpdateStatus: (newStatus: 'Trống' | 'Đang thuê' | 'Bảo trì' | 'Đặt cọc') => void
}

export const RoomSidebar: React.FC<RoomSidebarProps> = ({
  room,
  dashboardData,
  currentContract,
  unpaidFinancials,
  services,
  onUpdateStatus,
}) => {
  const t = useTranslations('landlord')

  const isVacant = room.status === 'Trống'
  const isOccupied = room.status === 'Đang thuê'
  const isMaintenance = room.status === 'Bảo trì'
  const isReserved = room.status === 'Đặt cọc'

  const amenitiesList = room.amenities || [
    'WiFi',
    'Điều hòa',
    'Nóng lạnh',
    'Tủ quần áo',
    'Giường',
    'Kệ bếp',
    'Ban công',
    'WC riêng',
  ]

  const activeServices = services && services.length > 0 ? services : defaultRoomServices

  return (
    <div className="space-y-6">
      {/* COMPACT SIDEBAR 4 ROOM METRIC CARDS */}
      <div className="bg-card rounded-2xl border border-line shadow-xs p-4 space-y-3">
        <Text
          as="h2"
          weight="black"
          color="default"
          className="flex items-center gap-2 text-xs uppercase tracking-wider border-b border-line pb-2"
        >
          <Home className="w-4 h-4 text-primary" />{' '}
          <Text as="span" color="inherit">
            {t('landlordRoomDetailSpecsTitle').replace('{roomNumber}', room.roomNumber)}
          </Text>
        </Text>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
            <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
              {t('landlordRoomDetailRentLabel')}
            </Text>
            <Text size="sm" weight="black" color="brand">
              {room.price || '3.000.000 ₫'}
            </Text>
            <Text as="span" size="2xs" color="secondary">
              {currentContract
                ? t('landlordRoomDetailMonthlyDueDay').replace(
                    '{day}',
                    String(currentContract.monthlyPaymentDate),
                  )
                : t('landlordRoomDetailStartOfMonth')}
            </Text>
          </div>

          <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
            <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
              {t('landlordRoomDetailDepositSpecLabel')}
            </Text>
            <Text size="sm" weight="black" className="text-deposit">
              {currentContract?.deposit?.amount
                ? `${parseInt(currentContract.deposit.amount).toLocaleString('vi-VN')} ₫`
                : '3.000.000 ₫'}
            </Text>
            <Text as="span" size="2xs" weight="bold" color="success">
              {t('landlordRoomDetailLockDepositText')}
            </Text>
          </div>

          <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
            <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
              {t('landlordRoomDetailDebtLabel')}
            </Text>
            <Text size="sm" weight="black" color="danger">
              {unpaidFinancials
                ? `${unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN')} ₫`
                : '0 ₫'}
            </Text>
            <Text as="span" size="2xs" weight="bold" color="danger">
              {t('landlordRoomDetailDebtOutstanding')}
            </Text>
          </div>

          <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
            <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
              {t('landlordRoomDetailAreaLabel')}
            </Text>
            <Text size="xs" weight="black" color="default">
              {room.area || '25'} m² • T{room.floor}
            </Text>
            <Text as="span" size="2xs" color="secondary">
              {dashboardData?.room.maxOccupants
                ? t('landlordRoomDetailMaxOccupantsText').replace(
                    '{count}',
                    String(dashboardData.room.maxOccupants),
                  )
                : t('landlordRoomDetailBalconyText')}
            </Text>
          </div>
        </div>
      </div>

      {/* Giá dịch vụ định kỳ với Badge màu sắc */}
      <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4">
        <Text
          as="h2"
          weight="black"
          color="default"
          size="sm"
          className="flex items-center gap-2 border-b border-line pb-3"
        >
          <Banknote className="w-4 h-4 text-primary" /> {t('landlordRoomDetailServicesTitle')}
        </Text>
        <div className="space-y-2.5">
          {activeServices.map((service: RoomCustomServiceItem) => (
            <div
              key={service.id}
              className="flex justify-between items-center p-2.5 bg-surface rounded-xl border border-line"
            >
              <div className="flex items-center gap-2">
                <Text as="span" size="xs" weight="black" color="default">
                  {service.name}
                </Text>
                {service.isCustom && (
                  <span className="bg-warning-soft border border-warning-subtle px-1.5 py-0.5 rounded-md">
                    <Text as="span" size="2xs" weight="bold" color="warning">
                      {t('landlordRoomDetailCustomServiceBadge')}
                    </Text>
                  </span>
                )}
              </div>
              <Text as="span" size="xs" weight="black" color="brand">
                {service.customPrice} {service.unit}
              </Text>
            </div>
          ))}
        </div>
      </div>

      {/* Tiện nghi phòng */}
      <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4">
        <Text
          as="h2"
          weight="black"
          color="default"
          size="sm"
          className="flex items-center gap-2 border-b border-line pb-3"
        >
          <HouseWifi className="w-4 h-4 text-primary" />{' '}
          {t('landlordRoomDetailAmenitiesTitle').replace('{count}', String(amenitiesList.length))}
        </Text>

        <div className="flex flex-wrap gap-2">
          {amenitiesList.map((item: string, idx: number) => (
            <Chip key={idx} variant="neutral" size="sm" preventHover>
              {getAmenityLabel(item, t)}
            </Chip>
          ))}
        </div>
      </div>

      {/* Quản lý trạng thái phòng */}
      <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4">
        <Text
          as="h2"
          weight="black"
          color="default"
          size="sm"
          className="flex items-center gap-2 border-b border-line pb-3"
        >
          <Building2 className="w-4 h-4 text-primary" /> {t('landlordRoomDetailRoomStatusTitle')}
        </Text>

        <div className="space-y-2">
          <Text
            as="label"
            size="xs"
            weight="bold"
            color="secondary"
            className="uppercase tracking-wider block"
          >
            {t('landlordRoomDetailQuickSwitchStatus')}
          </Text>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant={isVacant ? 'primary' : 'secondary'}
              className={isVacant ? 'bg-vacant hover:bg-vacant-hover' : ''}
              onClick={() => onUpdateStatus('Trống')}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailStatusBtnAvailable')}
              </Text>
            </Button>

            <Button
              variant={isOccupied ? 'primary' : 'secondary'}
              className={isOccupied ? 'bg-primary hover:bg-primary-hover' : ''}
              onClick={() => onUpdateStatus('Đang thuê')}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailStatusBtnOccupied')}
              </Text>
            </Button>

            <Button
              variant={isMaintenance ? 'primary' : 'secondary'}
              className={isMaintenance ? 'bg-accent hover:bg-accent-hover' : ''}
              onClick={() => onUpdateStatus('Bảo trì')}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailStatusBtnMaintenance')}
              </Text>
            </Button>

            <Button
              variant={isReserved ? 'primary' : 'secondary'}
              className={isReserved ? 'bg-deposit hover:bg-deposit-hover' : ''}
              onClick={() => onUpdateStatus('Đặt cọc')}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailStatusBtnDeposited')}
              </Text>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
