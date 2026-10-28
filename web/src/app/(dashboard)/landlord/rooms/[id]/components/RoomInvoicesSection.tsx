'use client'

import React from 'react'
import { Receipt, AlertCircle } from 'lucide-react'
import { Button, EmptyState, Text } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import {
  InvoiceRecord,
  MeterHistoryRecord,
  FinancialBreakdown,
} from './types'

interface RoomInvoicesSectionProps {
  invoicesHistory: InvoiceRecord[]
  filteredInvoices: InvoiceRecord[]
  paginatedInvoices: InvoiceRecord[]
  meterHistory: MeterHistoryRecord[]
  unpaidInvoice?: InvoiceRecord
  unpaidFinancials: FinancialBreakdown | null
  roomRentNum: number
  fixedServicesTotal: number
  computeRecordFinancials: (m: MeterHistoryRecord) => FinancialBreakdown
  totalInvoicePages: number
  invoicePage: number
  onInvoicePageChange: (page: number) => void
  itemsPerPage: number
}

export function RoomInvoicesSection({
  invoicesHistory,
  filteredInvoices,
  paginatedInvoices,
  meterHistory,
  unpaidInvoice,
  unpaidFinancials,
  roomRentNum,
  fixedServicesTotal,
  computeRecordFinancials,
  totalInvoicePages,
  invoicePage,
  onInvoicePageChange,
  itemsPerPage,
}: RoomInvoicesSectionProps) {
  const t = useTranslations('landlord')

  return (
    <div className="bg-card rounded-2xl border border-line shadow-xs p-3.5 sm:p-5 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
        <Text
          as="h2"
          size="xs"
          weight="black"
          color="default"
          className="uppercase tracking-wider flex items-center gap-2 sm:text-sm"
        >
          <Receipt className="w-4 h-4 text-primary" />{' '}
          {t('landlordRoomDetailInvoicesTitle')}
        </Text>
        {unpaidInvoice && unpaidFinancials && (
          <span className="self-start sm:self-auto px-2.5 py-1 bg-danger-soft border border-danger-subtle rounded-full animate-pulse">
            <Text as="span" variant="badge" size="3xs" weight="black" color="danger">
              {t('landlordRoomDetailUnpaidInvoicesBadge')
                .replace('{count}', '1')
                .replace(
                  '{amount}',
                  unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN'),
                )}
            </Text>
          </span>
        )}
      </div>

      <div className="space-y-3">
        {invoicesHistory.length === 0 ? (
          <EmptyState
            icon={Receipt}
            title={t('landlordRoomDetailNoInvoicesTitle')}
            description={t('landlordRoomDetailNoInvoicesDesc')}
            bordered
          />
        ) : filteredInvoices.length === 0 ? (
          <div className="p-6 text-center bg-surface rounded-xl">
            <Text size="xs" weight="bold" color="subtle">
              {t('landlordRoomDetailNoInvoicesInFilter')}
            </Text>
          </div>
        ) : (
          paginatedInvoices.map(inv => {
            const rec = meterHistory.find(m => m.period === inv.period) || {
              period: inv.period,
              date: '',
              oldElec: 0,
              newElec: 0,
              oldWater: 0,
              newWater: 0,
            }
            const fin = computeRecordFinancials(rec)
            const isUnpaid = inv.status === 'Chưa thanh toán'

            return (
              <div
                key={inv.id}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${
                  isUnpaid
                    ? 'bg-danger/5 border-danger/30'
                    : 'bg-surface border-line'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                      <div className="flex items-center justify-center gap-2">
                        <Text as="span" weight="bold" color={isUnpaid ? 'danger' : 'subtle'}>
                          {inv.period}
                        </Text>
                        <Text
                          as="span"
                          variant="badge"
                          size="3xs"
                          weight="black"
                          color={isUnpaid ? 'danger' : 'success'}
                          className={`px-2 py-0.5 rounded-full ${
                            isUnpaid ? 'bg-danger-soft' : 'bg-success-soft'
                          }`}
                        >
                          {isUnpaid
                            ? t('landlordRoomDetailInvoiceStatusUnpaid')
                            : t('landlordRoomDetailInvoiceStatusPaid')}
                        </Text>
                      </div>
                    </div>
                    <Text size="3xs" weight="semibold" color="subtle" className="mt-0.5">
                      {t('landlordRoomDetailInvoiceDeadline')}{' '}
                      <Text
                        as="strong"
                        size="3xs"
                        weight="bold"
                        color={isUnpaid ? 'danger' : 'secondary'}
                      >
                        {inv.deadline}
                      </Text>
                    </Text>
                  </div>

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
                    <Text
                      as="span"
                      size="base"
                      weight="black"
                      color={isUnpaid ? 'danger' : 'brand'}
                      className="whitespace-nowrap sm:text-lg"
                    >
                      {fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫
                    </Text>
                    {!isUnpaid && (
                      <span className="bg-line/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                        <Text as="span" variant="badge" size="3xs" weight="extrabold" color="secondary">
                          {inv.method}
                        </Text>
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-card rounded-xl border border-line text-xs space-y-1.5">
                  <div className="flex justify-between border-b border-line pb-1">
                    <Text as="span" size="2xs" weight="extrabold" color="secondary">
                      {t('landlordRoomDetailInvoiceDetailsTitle')}
                    </Text>
                    <Text as="span" size="xs" weight="black" color="brand" className="whitespace-nowrap">
                      {fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫
                    </Text>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <div className="p-1.5 bg-surface rounded-lg">
                      <Text as="span" size="3xs" color="subtle" className="block">
                        {t('landlordRoomDetailInvoiceRoomPrice')}
                      </Text>
                      <Text as="strong" size="2xs" weight="bold" color="default" className="whitespace-nowrap">
                        {roomRentNum.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="p-1.5 bg-surface rounded-lg">
                      <Text as="span" size="3xs" color="subtle" className="block">
                        {t('landlordRoomDetailInvoiceFixedServices')}
                      </Text>
                      <Text as="strong" size="2xs" weight="bold" color="default" className="whitespace-nowrap">
                        {fixedServicesTotal.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="p-1.5 bg-warning-soft rounded-lg">
                      <Text as="span" size="3xs" color="warning" className="block">
                        {t('landlordRoomDetailInvoiceElecUsage').replace(
                          '{usage}',
                          String(fin.elecUse),
                        )}
                      </Text>
                      <Text as="strong" size="2xs" weight="bold" color="warning" className="whitespace-nowrap">
                        {fin.elecCost.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="p-1.5 bg-info-soft rounded-lg">
                      <Text as="span" size="3xs" className="block text-info">
                        {t('landlordRoomDetailInvoiceWaterUsage').replace(
                          '{usage}',
                          String(fin.waterUse),
                        )}
                      </Text>
                      <Text as="strong" size="2xs" weight="bold" className="text-info whitespace-nowrap">
                        {fin.waterCost.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  </div>

                  {inv.editReason && (
                    <div className="mt-2 p-2 bg-warning-soft border border-warning-subtle rounded-lg flex items-start gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                      <div>
                        <Text as="span" size="3xs" weight="bold" color="warning">
                          {t('landlordRoomDetailInvoiceEditedNotice').replace(
                            '{editedAt}',
                            inv.editedAt || '',
                          )}
                        </Text>
                        <Text as="span" size="3xs" weight="extrabold" color="warning" italic className="block">
                          &quot;{inv.editReason}&quot;
                        </Text>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}

        {/* Pagination Controls for Invoices */}
        {totalInvoicePages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-line">
            <Text as="span" size="2xs" weight="bold" color="subtle">
              {t('landlordRoomDetailShowingItems')
                .replace('{start}', String((invoicePage - 1) * itemsPerPage + 1))
                .replace(
                  '{end}',
                  String(Math.min(invoicePage * itemsPerPage, filteredInvoices.length)),
                )
                .replace('{total}', String(filteredInvoices.length))}
            </Text>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                disabled={invoicePage === 1}
                onClick={() => onInvoicePageChange(Math.max(1, invoicePage - 1))}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordRoomDetailPaginationPrev')}
                </Text>
              </Button>
              {Array.from({ length: totalInvoicePages }).map((_, idx) => (
                <Button
                  key={idx}
                  variant={invoicePage === idx + 1 ? 'primary' : 'secondary'}
                  onClick={() => onInvoicePageChange(idx + 1)}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {idx + 1}
                  </Text>
                </Button>
              ))}
              <Button
                variant="outline"
                disabled={invoicePage === totalInvoicePages}
                onClick={() => onInvoicePageChange(Math.min(totalInvoicePages, invoicePage + 1))}
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

