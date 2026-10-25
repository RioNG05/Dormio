'use client'

import React from 'react'
import { ShieldCheck, Lock, Clock, MapPin, User } from 'lucide-react'
import {
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
  getLocalizedExplanation,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Modal, Button, Text, Chip } from '@/components/ui'

export interface PreviewImageModalData {
  isOpen: boolean
  title: string
  imageUrl: string
  watermark?: AttendanceWatermark
  note?: string
}

interface PreviewImageModalProps {
  data: PreviewImageModalData | null
  onClose: () => void
}

export function PreviewImageModal({ data, onClose }: PreviewImageModalProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  if (!data) return null

  return (
    <Modal
      isOpen={data.isOpen}
      onClose={onClose}
      size="xl"
      className="bg-zinc-900 text-white border-zinc-800"
    >
      <Modal.Header
        title={data.title}
        icon={<ShieldCheck className="w-5 h-5 text-primary" />}
        onClose={onClose}
        className="border-b border-zinc-800 text-zinc-100"
      />
      <Modal.Body className="p-0 overflow-hidden">
        {/* Read-only audit banner */}
        <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 text-amber-300 text-xs font-bold flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <Text as="span" size="xs" weight="bold" color="warning">{t('auditLockedBanner')}</Text>
          </span>
          <Text as="span" size="3xs" color="secondary" mono className="tracking-wider">
            {t('auditVerified')}
          </Text>
        </div>

        {/* Lightbox Image with Watermark Overlay */}
        <div className="relative bg-black flex items-center justify-center max-h-[460px] overflow-hidden">
          <img
            src={data.imageUrl}
            alt="Enlarged Proof"
            className="w-full h-auto max-h-[460px] object-contain"
          />

          {/* Stamped Watermark HUD on the Photo */}
          {data.watermark && (
            <div className="absolute bottom-3 left-3 right-3 bg-black/75 backdrop-blur-md rounded-2xl p-3 border border-white/15 text-white text-xs space-y-1 shadow-lg pointer-events-none">
              <div className="flex items-center justify-between font-black text-primary text-[11px] uppercase tracking-wider">
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> {data.watermark.time}
                </span>
                <Chip variant="success" size="xs" preventHover className="border border-emerald-500/30">
                  {t('validLocation')}
                </Chip>
              </div>
              <div className="text-[11px] font-bold text-zinc-200 flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span>
                  {getLocalizedPlace(data.watermark.place, locale === 'en')}
                </span>
              </div>
              <div className="text-[10px] text-zinc-300 flex items-center justify-between pt-0.5 border-t border-white/10">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-muted" />{' '}
                  {getLocalizedStaffName(
                    data.watermark.staffName,
                    locale === 'en',
                  )}
                </span>
                <span className="font-mono text-muted">
                  {data.watermark.coordinates || t('gpsRecorded')}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Note / Explanation section if present */}
        {data.note && (
          <div className="p-4 bg-zinc-800/80 border-t border-zinc-700/60 text-xs space-y-1">
            <Text as="span" size="xs" weight="bold" className="text-zinc-300 block">{t('explanationNoteTitle')}</Text>
            <Text size="xs" italic className="text-zinc-300">
              &quot;{getLocalizedExplanation(data.note, locale === 'en')}&quot;
            </Text>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer className="p-4 bg-zinc-900 border-t border-zinc-800 flex justify-end">
        <Button
          variant="ghost"
          size="md"
          onClick={onClose}
        >
          {t('btnClose')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
