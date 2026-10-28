'use client'

import React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Users,
  Plus,
  FileText,
  FileSignature,
  AlertTriangle,
  ShieldCheck,
  Phone,
  MessageSquare,
  User,
} from 'lucide-react'
import { Button, Chip, EmptyState, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import {
  RoomDashboardContract,
  RoomDashboardOccupant,
} from '@/services/room.service'

interface RoomOccupantsSectionProps {
  occupants: RoomDashboardOccupant[]
  currentContract?: RoomDashboardContract | null
  roomId: string
  roomNumber: string
  isOccupied: boolean
  onOpenAddTenantModal: () => void
}

export function RoomOccupantsSection({
  occupants,
  currentContract,
  roomId,
  roomNumber,
  isOccupied,
  onOpenAddTenantModal,
}: RoomOccupantsSectionProps) {
  const router = useRouter()
  const t = useTranslations('landlord')

  return (
    <div className="bg-card rounded-2xl border border-line shadow-xs overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 sm:p-5 border-b border-line">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-primary" />
          <Text
            as="h2"
            size="xs"
            weight="black"
            color="default"
            className="uppercase tracking-wider sm:text-sm"
          >
            {t('landlordRoomDetailOccupantsTitle')}
          </Text>
          {occupants.length > 0 && (
            <Chip size="xs" variant="default" className="ml-1">
              {occupants.length}
            </Chip>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="primary"
            onClick={onOpenAddTenantModal}
            leftIcon={<Plus />}
            className="w-full sm:w-auto text-xs"
          >
            {t('landlordRoomDetailAddOccupantBtn')}
          </Button>
          {isOccupied && currentContract && (
            <Link
              href={`/landlord/contracts/${currentContract.id}`}
              className="px-3 py-2 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <Text as="span" size="xs" weight="bold" color="brand">
                {t('landlordRoomDetailContractDetailBtn')}
              </Text>
            </Link>
          )}
        </div>
      </div>

      <div className="p-3.5 sm:p-5 space-y-4">
        {/* Warning banner when room has occupants but no contract yet */}
        {occupants.length > 0 && !currentContract && (
          <div className="p-3.5 sm:p-4 bg-warning-soft border border-warning-subtle rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div>
                <Text as="h4" size="xs" weight="black" color="warning">
                  {t('landlordRoomDetailNoContractWarningTitle')}
                </Text>
                <Text as="p" size="2xs" color="subtle" className="mt-0.5">
                  {t('landlordRoomDetailNoContractWarningDesc', {
                    count: occupants.length,
                  })}
                </Text>
              </div>
            </div>
            <Button
              size="sm"
              variant="warning"
              leftIcon={<FileSignature />}
              onClick={() => router.push(`/landlord/contracts/create?roomId=${roomId}`)}
              className="shrink-0 w-full sm:w-auto"
            >
              {t('landlordRoomDetailCreateContractNowBtn')}
            </Button>
          </div>
        )}

        {/* Occupants List */}
        {occupants.length > 0 ? (
          <div className="space-y-3">
            {occupants.map((occ: RoomDashboardOccupant, idx: number) => (
              <div
                key={occ.id || idx}
                className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 bg-surface hover:bg-card-hover border border-line rounded-2xl transition-colors"
              >
                <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                  <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shadow-xs shrink-0 font-black text-base">
                    {occ.fullName?.charAt(0) || 'K'}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Text as="h3" size="sm" weight="black" color="default" className="truncate">
                        {occ.fullName}
                      </Text>
                      {occ.hasIdentification && (
                        <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-success-soft text-success text-[10px] font-bold rounded-full">
                          <ShieldCheck className="w-3 h-3" />
                          {t('landlordRoomDetailHasCccd')}
                        </span>
                      )}
                      <Chip
                        size="xs"
                        variant={occ.hasContract ? 'default' : 'warning'}
                        className="text-[10px]"
                      >
                        {occ.hasContract
                          ? t('landlordRoomDetailOccupantHasContract')
                          : t('landlordRoomDetailOccupantNoContract')}
                      </Chip>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted">
                      <span className="flex items-center gap-1 font-semibold">
                        <Phone className="w-3.5 h-3.5 text-muted" />
                        {occ.phoneNumber || '—'}
                      </span>
                      {occ.identityNumber && (
                        <span className="hidden sm:inline">
                          CCCD: <span className="font-semibold">{occ.identityNumber}</span>
                        </span>
                      )}
                      {occ.joinedAt && (
                        <span className="text-[11px] text-muted">
                          Ở từ: {new Date(occ.joinedAt).toLocaleDateString('vi-VN')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2 lg:pt-0 border-t lg:border-t-0 border-line justify-end">
                  {occ.phoneNumber && (
                    <Button
                      href={`tel:${occ.phoneNumber}`}
                      size="sm"
                      variant="outline"
                      leftIcon={<Phone />}
                      className="text-xs"
                    >
                      {t('landlordRoomDetailCallNow')}
                    </Button>
                  )}
                  <Button
                    href={`/landlord/messages?${new URLSearchParams({
                      ...(occ.tenantId ? { userId: occ.tenantId } : {}),
                      ...(occ.fullName ? { tenant: occ.fullName } : {}),
                      ...(roomNumber ? { room: roomNumber } : {}),
                    }).toString()}`}
                    size="sm"
                    variant="secondary"
                    leftIcon={<MessageSquare />}
                    className="text-xs"
                  >
                    {t('landlordRoomDetailMessageBtn')}
                  </Button>
                  <Button
                    href={`/landlord/customers/${occ.tenantId || occ.id}`}
                    size="sm"
                    variant="ghost"
                    leftIcon={<User />}
                    className="text-xs"
                  >
                    {t('landlordRoomDetailProfileBtn')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            icon={Users}
            title={t('landlordRoomDetailNoTenantsInRoom')}
            description={t('landlordRoomDetailEmptyOccupantsDesc')}
            action={
              <div className="flex flex-col sm:flex-row items-center gap-2.5">
                <Button
                  size="md"
                  variant="primary"
                  onClick={onOpenAddTenantModal}
                  leftIcon={<Plus />}
                >
                  {t('landlordRoomDetailAddOccupantBtn')}
                </Button>
                <Button
                  size="md"
                  variant="outline"
                  onClick={() => router.push(`/landlord/contracts/create?roomId=${roomId}`)}
                  leftIcon={<FileSignature />}
                >
                  {t('landlordRoomDetailBtnCreateContract')}
                </Button>
              </div>
            }
          />
        )}
      </div>
    </div>
  )
}
