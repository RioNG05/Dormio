'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import { History, Gauge, Edit, ChevronDown } from 'lucide-react'
import { Button, EmptyState, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import {
  InvoiceRecord,
  MeterHistoryRecord,
  FinancialBreakdown,
} from './types'

interface RoomMeterHistorySectionProps {
  meterHistory: MeterHistoryRecord[]
  filteredMeterHistory: MeterHistoryRecord[]
  paginatedMeterHistory: MeterHistoryRecord[]
  invoicesHistory: InvoiceRecord[]
  elecUnitPrice: number
  waterUnitPrice: number
  computeRecordFinancials: (m: MeterHistoryRecord) => FinancialBreakdown
  totalMeterPages: number
  meterPage: number
  onMeterPageChange: (page: number) => void
  onOpenCorrectionModal: (record: MeterHistoryRecord) => void
  itemsPerPage: number
  roomId: string
}

export function RoomMeterHistorySection({
  meterHistory,
  filteredMeterHistory,
  paginatedMeterHistory,
  invoicesHistory,
  elecUnitPrice,
  waterUnitPrice,
  computeRecordFinancials,
  totalMeterPages,
  meterPage,
  onMeterPageChange,
  onOpenCorrectionModal,
  itemsPerPage,
  roomId,
}: RoomMeterHistorySectionProps) {
  const router = useRouter()
  const t = useTranslations('landlord')

  return (
    <div className="bg-card rounded-2xl border border-line shadow-xs p-3.5 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-line pb-3">
        <Text as="h2" weight="black" color="default" className="text-xs sm:text-sm flex items-center gap-2">
          <History className="w-4 h-4 text-primary" />{' '}
          {t('landlordRoomDetailMeterHistoryTitle')}
        </Text>

        <Button
          leftIcon={<Gauge />}
          onClick={() => router.push(`/landlord/meter-readings?roomId=${roomId}`)}
        >
          <Text as="span" size="xs" weight="bold" color="inherit">
            {t('landlordRoomDetailMeterLogBtn')}
          </Text>
        </Button>
      </div>

      <div className="space-y-3">
        {meterHistory.length === 0 ? (
          <EmptyState
            icon={Gauge}
            title={t('landlordRoomDetailNoMeterDataTitle')}
            description={t('landlordRoomDetailNoMeterDataDesc')}
            bordered
          />
        ) : filteredMeterHistory.length === 0 ? (
          <div className="p-6 text-center bg-surface rounded-xl">
            <Text size="xs" color="subtle" weight="bold">
              {t('landlordRoomDetailNoMeterDataInFilter')}
            </Text>
          </div>
        ) : (
          paginatedMeterHistory.map((item, itemIdx) => {
            const fin = computeRecordFinancials(item)
            const matchingInvoice = invoicesHistory.find(inv => inv.period === item.period)
            const isPaid = matchingInvoice?.status === 'Đã thu'

            return (
              <details
                key={item.id || `${item.period}-${itemIdx}`}
                className="group border border-line rounded-xl overflow-hidden shadow-2xs"
                open={item.isOpen}
              >
                <summary className="flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-3.5 bg-surface/80 hover:bg-card-hover cursor-pointer select-none outline-none transition-colors gap-2">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Text as="span" size="xs" weight="black" color="brand" className="uppercase tracking-wider">
                      {t('landlordRoomDetailReadingPeriod').replace('{period}', item.period)}
                    </Text>
                    <Text as="span" size="2xs" weight="bold" color="subtle">({item.date})</Text>
                    {item.editReason && (
                      <span className="px-2 py-0.5 bg-warning-soft rounded-full">
                        <Text as="span" size="2xs" weight="black" color="warning">
                          {t('landlordRoomDetailEditedBadge')}
                        </Text>
                      </span>
                    )}
                    {isPaid && (
                      <span className="px-2 py-0.5 bg-success-soft rounded-full">
                        <Text as="span" size="2xs" weight="black" color="success">
                          {t('landlordRoomDetailPaidBadge')}
                        </Text>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    {isPaid ? (
                      <span
                        className="px-2.5 py-1 bg-card-hover border border-line rounded-lg flex items-center gap-1 cursor-not-allowed select-none"
                        title={t('landlordRoomDetailLockedTooltip')}
                      >
                        <Text as="span" size="2xs" weight="bold" color="secondary">
                          {t('landlordRoomDetailLockedBadge')}
                        </Text>
                      </span>
                    ) : (
                      <Button
                        variant="outline"
                        onClick={e => {
                          e.preventDefault()
                          e.stopPropagation()
                          onOpenCorrectionModal(item)
                        }}
                        leftIcon={<Edit />}
                      >
                        {t('landlordRoomDetailEditMeterBtn')}
                      </Button>
                    )}
                    <Text as="span" size="xs" weight="black" color="default">
                      {t('landlordRoomDetailTotalAmount')}{' '}
                      {fin.meterTotal.toLocaleString('vi-VN')} ₫
                    </Text>
                    <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                  </div>
                </summary>

                <div className="p-3 sm:p-4 bg-card border-t border-line space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <Text as="div" weight="black" size="xs" color="default" className="flex items-center gap-1">
                        {t('landlordRoomDetailElecHeader').replace(
                          '{unitPrice}',
                          elecUnitPrice.toLocaleString('vi-VN'),
                        )}
                      </Text>
                      <Text as="span" size="xs" weight="black" color="default" className="sm:hidden">
                        {fin.elecCost.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <Text as="span" size="2xs" color="secondary" weight="medium">
                        {t('landlordRoomDetailElecStats')
                          .replace('{index}', String(item.newElec))
                          .replace('{usage}', String(fin.elecUse))}
                      </Text>
                      <Text as="span" size="xs" weight="black" color="brand" className="hidden sm:inline">
                        {fin.elecCost.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-vacant/5 border border-vacant/20 rounded-xl">
                    <div className="flex items-center justify-between sm:justify-start gap-2">
                      <Text as="div" weight="black" size="xs" color="default" className="flex items-center gap-1">
                        {t('landlordRoomDetailWaterHeader').replace(
                          '{unitPrice}',
                          waterUnitPrice.toLocaleString('vi-VN'),
                        )}
                      </Text>
                      <Text as="span" size="xs" weight="black" color="default" className="sm:hidden">
                        {fin.waterCost.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                      <Text as="span" size="2xs" color="secondary" weight="medium">
                        {t('landlordRoomDetailWaterStats')
                          .replace('{index}', String(item.newWater))
                          .replace('{usage}', String(fin.waterUse))}
                      </Text>
                      <Text as="span" size="xs" weight="black" color="brand" className="hidden sm:inline">
                        {fin.waterCost.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  </div>

                  {item.editActions && item.editActions.length > 0 && (
                    <div className="p-2.5 bg-warning-soft border border-warning-subtle rounded-xl text-xs space-y-2">
                      <Text as="div" weight="bold" color="warning" size="xs" className="flex items-center gap-1.5">
                        <History className="w-3.5 h-3.5 text-warning" />{' '}
                        {t('landlordRoomDetailEditHistoryTitle').replace(
                          '{count}',
                          String(item.editActions.length),
                        )}
                      </Text>
                      <div className="space-y-1.5">
                        {item.editActions.map((act, actIdx) => (
                          <div
                            key={act.id || actIdx}
                            className="p-2 bg-card/90 border border-warning-subtle rounded-lg text-[11px] text-warning space-y-1 shadow-2xs"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-1 border-b border-warning-subtle pb-1">
                              <Text as="span" size="2xs" weight="bold" color="warning">
                                {t('landlordRoomDetailEditHistoryTimes').replace(
                                  '{times}',
                                  String(item.editActions!.length - actIdx),
                                )}
                              </Text>
                              <Text as="span" size="2xs" color="secondary">
                                {new Date(act.createdAt).toLocaleString('vi-VN')}
                              </Text>
                            </div>
                            <div className="space-y-0.5">
                              <Text as="div" size="2xs" weight="medium" color="default">
                                {act.reason || t('landlordRoomDetailAuditNoReason')}
                              </Text>
                              {act.changes && act.changes.map((c, cIdx) => (
                                <Text key={cIdx} as="div" size="3xs" color="subtle">
                                  {t('landlordRoomDetailAuditChangeLog')
                                    .replace('{service}', c.serviceName || '')
                                    .replace('{old}', String(c.oldValue ?? 0))
                                    .replace('{new}', String(c.newValue ?? 0))}
                                </Text>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </details>
            )
          })
        )}

        {/* Pagination Controls for Meter Readings */}
        {totalMeterPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-line">
            <Text as="span" size="2xs" weight="bold" color="subtle">
              {t('landlordRoomDetailShowingItems')
                .replace('{start}', String((meterPage - 1) * itemsPerPage + 1))
                .replace(
                  '{end}',
                  String(Math.min(meterPage * itemsPerPage, filteredMeterHistory.length)),
                )
                .replace('{total}', String(filteredMeterHistory.length))}
            </Text>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                disabled={meterPage === 1}
                onClick={() => onMeterPageChange(Math.max(1, meterPage - 1))}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordRoomDetailPaginationPrev')}
                </Text>
              </Button>
              {Array.from({ length: totalMeterPages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={meterPage === idx + 1 ? 'primary' : 'secondary'}
                  onClick={() => onMeterPageChange(idx + 1)}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {idx + 1}
                  </Text>
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={meterPage === totalMeterPages}
                onClick={() => onMeterPageChange(Math.min(totalMeterPages, meterPage + 1))}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordRoomDetailPaginationNext')}
                </Text>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
