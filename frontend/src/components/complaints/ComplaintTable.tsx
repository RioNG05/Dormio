'use client'

import React from 'react'
import { AlertTriangle, Clock, User, DoorOpen } from 'lucide-react'
import { Text, Chip, TableRow } from '@/components/ui'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { ComplaintTableProps } from './types'

export function ComplaintTable({ items, role, onSelect }: ComplaintTableProps) {
  const t = useTranslations('tenantPortal')
  const { locale } = useLanguage()

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
      case 'high':
        return (
          <Chip
            variant="danger"
            size="xs"
            preventHover
            leftIcon={<AlertTriangle className="w-3 h-3 text-danger" />}
          >
            {t('tenantPriorityUrgent')}
          </Chip>
        )
      case 'medium':
        return (
          <Chip variant="warning" size="xs" preventHover>
            {t('tenantPriorityNormal')}
          </Chip>
        )
      default:
        return (
          <Chip variant="neutral" size="xs" preventHover>
            {t('tenantPriorityLow')}
          </Chip>
        )
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'resolved':
      case 'closed':
        return (
          <Chip
            variant="success"
            size="xs"
            preventHover
            leftIcon={<span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />}
          >
            {t('tenantStatusResponded')}
          </Chip>
        )
      case 'in_progress':
      case 'investigating':
        return (
          <Chip
            variant="info"
            size="xs"
            preventHover
            leftIcon={<Clock className="w-3 h-3 text-info animate-spin" />}
          >
            {t('tenantStatusProcessing')}
          </Chip>
        )
      default:
        return (
          <Chip
            variant="warning"
            size="xs"
            preventHover
            leftIcon={<span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
          >
            {t('tenantStatusUnresponded')}
          </Chip>
        )
    }
  }

  return (
    <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="bg-surface border-b border-line text-muted uppercase font-black text-[10px] tracking-wider">
          <tr>
            <th className="px-6 py-4">{t('tenantColGrievanceId')}</th>
            {role !== 'tenant' && (
              <>
                <th className="px-6 py-4">{t('complaintTenantInfoTitle')}</th>
                <th className="px-6 py-4">{t('complaintPropertyInfo')}</th>
              </>
            )}
            <th className="px-6 py-4">{t('tenantColGrievanceTitle')}</th>
            <th className="px-6 py-4">{t('tenantColGrievancePriority')}</th>
            <th className="px-6 py-4">{t('tenantColGrievanceDate')}</th>
            <th className="px-6 py-4">{t('tenantColGrievanceStatus')}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {items.length === 0 ? (
            <tr>
              <td colSpan={role !== 'tenant' ? 7 : 5} className="px-6 py-12 text-center text-muted">
                {t('tenantNoGrievances')}
              </td>
            </tr>
          ) : (
            items.map(item => (
              <TableRow
                key={item.id}
                interactive
                onClick={() => onSelect(item)}
              >
                <td className="px-6 py-4">
                  <Text size="xs" weight="bold" color="secondary" className="font-mono">
                    {item.id.slice(0, 8)}
                  </Text>
                </td>
                {role !== 'tenant' && (
                  <>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground">
                        <User className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate max-w-[130px]">{item.tenantName || '-'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-secondary">
                        <DoorOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{item.roomNumber || '-'}</span>
                        {item.boardingHouseName && (
                          <span className="text-muted text-[11px] truncate max-w-[120px]">
                            ({item.boardingHouseName})
                          </span>
                        )}
                      </div>
                    </td>
                  </>
                )}
                <td className="px-6 py-4 max-w-xs truncate">
                  <Text size="xs" weight="bold" color="default" className="truncate">
                    {item.title}
                  </Text>
                </td>
                <td className="px-6 py-4">{getPriorityBadge(item.priority)}</td>
                <td className="px-6 py-4">
                  <Text size="xs" weight="medium" color="secondary">
                    {formatDate(item.createdAt)}
                  </Text>
                </td>
                <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
              </TableRow>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
