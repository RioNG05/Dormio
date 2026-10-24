'use client'

import React from 'react'
import { ShieldCheck, Clock, User, Phone, Mail, CheckCircle2, Wrench } from 'lucide-react'
import { Modal, Button, Text, Chip } from '@/components/ui'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { ComplaintDetailModalProps } from './types'

export function ComplaintDetailModal({
  isOpen,
  item,
  role,
  onClose,
  onPreviewImage,
  onOpenResolve,
}: ComplaintDetailModalProps) {
  const t = useTranslations('tenantPortal')
  const { locale } = useLanguage()

  if (!item) return null

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
    <Modal isOpen={isOpen} onClose={onClose} size="xl">
      <Modal.Header
        title={
          <div className="flex items-center gap-2">
            <Text
              size="xs"
              weight="bold"
              color="secondary"
              className="font-mono bg-card px-2 py-0.5 rounded border border-line"
            >
              {item.id.slice(0, 8)}
            </Text>
            {getStatusBadge(item.status)}
          </div>
        }
        onClose={onClose}
      />

      <Modal.Body className="space-y-4">
        <div>
          <Text as="h3" size="base" weight="black" color="default" className="leading-snug">
            {item.title}
          </Text>
          <div className="mt-1 flex items-center gap-2 flex-wrap">
            <Text size="2xs" color="secondary">
              {t('tenantSubmittedDateLabel', {
                date: formatDate(item.createdAt),
              })}
            </Text>
            {(item.roomNumber || item.boardingHouseName) && (
              <>
                <Text size="2xs" color="secondary">
                  &bull;
                </Text>
                <Text size="2xs" color="secondary">
                  {t('tenantRoomGrievanceBadge', {
                    room: item.roomNumber || '101',
                    house: item.boardingHouseName || 'Dormio',
                  })}
                </Text>
              </>
            )}
          </div>
        </div>

        {/* Tenant contact details for Landlord & Staff */}
        {role !== 'tenant' && (item.tenantName || item.tenantPhone || item.tenantEmail) && (
          <div className="p-3.5 bg-card rounded-2xl border border-line space-y-2">
            <Text size="3xs" weight="black" color="secondary" uppercase className="tracking-wider block">
              {t('complaintTenantInfoTitle')}
            </Text>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              {item.tenantName && (
                <div className="flex items-center gap-1.5 text-foreground font-semibold">
                  <User className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">{item.tenantName}</span>
                </div>
              )}
              {item.tenantPhone && (
                <div className="flex items-center gap-1.5 text-secondary">
                  <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span>{item.tenantPhone}</span>
                </div>
              )}
              {item.tenantEmail && (
                <div className="flex items-center gap-1.5 text-secondary truncate">
                  <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                  <span className="truncate">{item.tenantEmail}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="p-3.5 bg-surface rounded-2xl border border-line space-y-1.5">
          <Text size="3xs" weight="black" color="secondary" uppercase className="tracking-wider block">
            {t('tenantComplaintContentTitle')}
          </Text>
          <Text size="xs" weight="medium" color="default" className="whitespace-pre-wrap leading-relaxed">
            {item.description}
          </Text>
        </div>

        {/* Evidence Photos */}
        {item.images && item.images.length > 0 && (
          <div>
            <Text size="3xs" weight="black" color="secondary" uppercase className="tracking-wider block mb-2">
              {t('tenantEvidencePhotosTitle')}
            </Text>
            <div className="flex flex-wrap gap-2">
              {item.images.map(img => (
                <div
                  key={img.id}
                  onClick={() => onPreviewImage(img.url)}
                  className="w-20 h-20 rounded-xl overflow-hidden border border-line cursor-pointer hover:opacity-90 transition-opacity"
                >
                  <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Resolution section */}
        {item.resolutionNote ? (
          <div className="p-4 rounded-2xl bg-success-soft border border-success-subtle space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-success" />
                <Text size="xs" weight="black" color="success">
                  {t('tenantOfficialResponseFromAdmin', {
                    name: item.resolvedByName || t('tenantDefaultAdminName'),
                  })}
                </Text>
              </div>
              {item.resolvedAt && (
                <Text size="3xs" weight="semibold" color="success">
                  {formatDate(item.resolvedAt)}
                </Text>
              )}
            </div>
            <Text size="xs" weight="medium" color="success" className="whitespace-pre-wrap leading-relaxed">
              {item.resolutionNote}
            </Text>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-warning-soft border border-warning-subtle text-warning font-medium flex items-center gap-2.5">
            <Clock className="w-4 h-4 text-warning shrink-0" />
            <Text size="xs" weight="medium" color="warning">
              {t('tenantPendingVerificationNotice')}
            </Text>
          </div>
        )}
      </Modal.Body>

      <Modal.Footer className="flex items-center justify-between">
        <div>
          {role !== 'tenant' && onOpenResolve && (
            <Button
              size="md"
              variant="primary"
              leftIcon={<Wrench className="w-4 h-4" />}
              onClick={onOpenResolve}
            >
              {t('complaintBtnResolveAction')}
            </Button>
          )}
        </div>
        <Button size="md" variant="secondary" onClick={onClose}>
          {t('tenantBtnClose')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
