'use client'

import React, { useState, useRef } from 'react'
import {
  Camera,
  Info,
  Image as Upload,
  AlertTriangle,
  FileText,
  Check,
} from 'lucide-react'
import {
  DutyTaskItem,
  getLocalizedPlace,
  getLocalizedStaffName,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Modal, Button, TextInput, Text } from '@/components/ui'

export interface DutyProofModalProps {
  duty: DutyTaskItem
  boardingHouseName: string
  effectiveTime: string
  staffName?: string
  onClose: () => void
  onSubmit: (payload: {
    dutyId: string
    photo?: string
    note?: string
    proofTime?: string
    markCompleted?: boolean
  }) => void
  onChangeDraft: () => void
}

export function DutyProofModal({
  duty,
  boardingHouseName,
  effectiveTime,
  staffName,
  onClose,
  onSubmit,
  onChangeDraft,
}: DutyProofModalProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()

  const [photo, setPhoto] = useState<string>(duty.photoProof || '')
  const [note, setNote] = useState(duty.note || '')
  const [warningNotice, setWarningNotice] = useState<string | null>(null)
  const [proofTimeStr] = useState<string>(() => {
    const now = new Date()
    const loc = locale === 'en' ? 'en-US' : 'vi-VN'
    return `${now.toLocaleDateString(loc)} ${now.toLocaleTimeString(loc, { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}`
  })
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)

  const getDutyTitle = (d: DutyTaskItem) => d.title

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onChangeDraft()
      setWarningNotice(null)
      const reader = new FileReader()
      reader.onload = event => {
        if (event.target?.result) {
          setPhoto(event.target.result as string)
        }
      }
      reader.readAsDataURL(file)
    }
  }

  return (
    <Modal
      isOpen
      onClose={onClose}
      size="lg"
    >
      <Modal.Header
        title={t('dutyProofTitle')}
        description={getDutyTitle(duty)}
        icon={
          <div className="p-2 rounded-xl bg-primary text-white">
            <Camera className="w-5 h-5" />
          </div>
        }
        onClose={onClose}
      />

      {/* Content */}
      <Modal.Body className="p-5 sm:p-6 space-y-4">
        <div className="p-3 rounded-xl bg-primary-soft border border-primary-subtle text-xs text-primary flex items-start gap-2">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <Text size="xs" color="brand" className="leading-relaxed">{t('dutyProofNotice')}</Text>
        </div>

        {/* Photo Preview Frame */}
        {photo ? (
          <div className="relative rounded-2xl overflow-hidden bg-zinc-900 aspect-16/10 flex items-center justify-center border border-zinc-800 shadow-inner">
            <img src={photo} alt="Duty proof" className="w-full h-full object-cover" />

            {/* Embedded Watermark Stamp */}
            <div className="absolute bottom-2.5 left-2.5 right-2.5 bg-black/75 backdrop-blur-md rounded-xl p-2.5 border border-white/15 text-white text-[10px] space-y-0.5">
              <div className="flex items-center justify-between font-black text-primary">
                <span>🕒 {proofTimeStr}</span>
                <span className="text-emerald-400 font-bold">{t('stampedReal')}</span>
              </div>
              <div className="text-zinc-200 font-medium truncate">
                📍 {getLocalizedPlace(boardingHouseName, locale === 'en')}
              </div>
              <div className="text-muted text-[9px]">
                👤{' '}
                {getLocalizedStaffName(
                  staffName || t('employeeDefaultStaffName'),
                  locale === 'en',
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            onClick={() => fileRef.current?.click()}
            className="rounded-2xl border-2 border-dashed border-line hover:border-primary bg-surface hover:bg-primary/5 aspect-16/10 flex flex-col items-center justify-center gap-2 p-4 text-center cursor-pointer transition-colors"
          >
            <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center shadow-2xs text-primary">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <Text size="xs" weight="bold">{t('dutyProofUploadTitle')}</Text>
              <Text size="2xs" color="secondary">
                {duty.requiresPhoto ? t('requiresPhoto') : t('photoOptional')}
              </Text>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2">
          <TextInput
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            containerClassName="hidden"
            className="hidden"
            onChange={handleFileUpload}
          />
          <TextInput
            ref={fileRef}
            type="file"
            accept="image/*"
            containerClassName="hidden"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button
            size="md"
            onClick={() => cameraRef.current?.click()}
            leftIcon={<Camera />}
            className="flex-1"
          >
            <span>{t('btnCaptureNewDuty')}</span>
          </Button>
          <Button
            variant="outline"
            size="md"
            onClick={() => fileRef.current?.click()}
            leftIcon={<Upload />}
          >
            <span>{t('btnUploadDuty')}</span>
          </Button>
        </div>

        {/* Note Input */}
        <TextInput
          label={t('dutyNoteLabel')}
          value={note}
          onChange={e => {
            setNote(e.target.value)
            onChangeDraft()
          }}
          placeholder={t('dutyNotePlaceholder')}
          className="w-full p-2.5 rounded-xl bg-surface border border-line text-xs text-foreground font-medium focus:outline-none focus:border-primary"
          containerClassName="space-y-1"
        />

        {/* Warning notice if required photo is missing */}
        {warningNotice && (
          <div className="p-3 rounded-xl bg-warning-soft border border-warning-subtle text-warning text-xs font-semibold flex items-center gap-2 animate-in fade-in duration-150">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
            <span>{warningNotice}</span>
          </div>
        )}
      </Modal.Body>

      {/* Footer with 2 separate action buttons: Update Progress & Complete Task */}
      <Modal.Footer className="p-4 sm:p-5 bg-surface border-t border-line flex flex-wrap items-center justify-between gap-2.5">
        <Button
          variant="outline"
          size="md"
          onClick={onClose}
        >
          {t('btnCancel')}
        </Button>

        <div className="flex items-center gap-2">
          <Button
            size="md"
            onClick={() => {
              if (duty.requiresPhoto && !photo) {
                setWarningNotice(t('photoProofRequiredWarning'))
                return
              }
              onSubmit({
                dutyId: duty.id,
                photo: photo || undefined,
                note: note.trim() || undefined,
                proofTime: proofTimeStr,
                markCompleted: true,
              })
            }}
            leftIcon={<Check />}
          >
            <span>{t('btnUpdateProgress')}</span>
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  )
}
