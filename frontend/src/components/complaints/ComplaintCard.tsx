'use client'

import React from 'react'
import { AlertTriangle, CheckCircle2, Clock, User, DoorOpen, Building } from 'lucide-react'
import { Text, Chip } from '@/components/ui'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { ComplaintCardProps } from './types'

export function ComplaintCard({ item, role, onSelect }: ComplaintCardProps) {
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
    <div
      onClick={() => onSelect(item)}
      className="rounded-2xl border border-line bg-card p-5 shadow-2xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
    >
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Text
              size="xs"
              weight="bold"
              color="secondary"
              className="font-mono bg-card-hover px-2 py-0.5 rounded-md"
            >
              {item.id.slice(0, 8)}
            </Text>
            {role === 'tenant' ? (
              <Chip variant="accent" size="xs" preventHover>
                {t('tenantBqtDormioBadge')}
              </Chip>
            ) : (
              item.boardingHouseName && (
                <Chip variant="neutral" size="xs" preventHover leftIcon={<Building className="w-3 h-3" />}>
                  {item.boardingHouseName}
                </Chip>
              )
            )}
          </div>
          {getPriorityBadge(item.priority)}
        </div>

        {/* Sender & Room for Landlord & Staff */}
        {role !== 'tenant' && (
          <div className="flex items-center gap-3 text-[11px] text-muted font-medium pt-0.5">
            {item.tenantName && (
              <span className="flex items-center gap-1 text-foreground/80 font-semibold truncate max-w-[140px]">
                <User className="w-3 h-3 text-muted shrink-0" />
                <span className="truncate">{item.tenantName}</span>
              </span>
            )}
            {item.roomNumber && (
              <span className="flex items-center gap-1">
                <DoorOpen className="w-3 h-3 text-muted shrink-0" />
                <span>{item.roomNumber}</span>
              </span>
            )}
          </div>
        )}

        <Text
          as="h3"
          size="sm"
          weight="bold"
          color="default"
          className="group-hover:text-primary transition-colors line-clamp-2 leading-snug"
        >
          {item.title}
        </Text>

        <Text size="xs" color="secondary" className="line-clamp-2 leading-relaxed">
          {item.description}
        </Text>
      </div>

      {/* Resolution note preview snippet */}
      {item.resolutionNote && (
        <div className="p-3 rounded-xl bg-success-soft border border-success-subtle text-[11px] text-success space-y-1">
          <div className="font-black flex items-center gap-1 text-success">
            <CheckCircle2 className="w-3.5 h-3.5 text-success" />
            <span>{t('tenantResolutionResponseFromAdmin')}</span>
          </div>
          <Text size="xs" weight="medium" color="success" className="line-clamp-2 leading-relaxed">
            {item.resolutionNote}
          </Text>
        </div>
      )}

      <div className="border-t border-line pt-3 flex items-center justify-between text-[11px]">
        <Text size="xs" color="secondary" weight="medium">
          {formatDate(item.createdAt)}
        </Text>
        {getStatusBadge(item.status)}
      </div>
    </div>
  )
}
