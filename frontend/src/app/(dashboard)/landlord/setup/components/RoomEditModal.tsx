'use client'

import React from 'react'
import { Layers, X } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Checkbox, Form, NumberInput, SelectInput, Text, TextInput } from '@/components/ui'
import type { CustomRoomData, RoomTypeItem, ServiceItem } from '../types'

export interface RoomEditModalProps {
  isOpen: boolean
  target: { floor: number; index: number } | null
  draft: CustomRoomData | null
  isCustomized: boolean
  roomTypes: RoomTypeItem[]
  services: ServiceItem[]
  onClose: () => void
  onChangeDraft: (updater: (prev: CustomRoomData) => CustomRoomData) => void
  onResetToDefault: () => void
  onSave: () => void
}

export function RoomEditModal({
  isOpen,
  target,
  draft,
  isCustomized,
  roomTypes,
  services,
  onClose,
  onChangeDraft,
  onResetToDefault,
  onSave,
}: RoomEditModalProps) {
  const t = useTranslations('landlord')

  if (!isOpen || !target || !draft) return null

  const activeRoomTypes = roomTypes.filter(rt => rt.name.trim().length > 0)
  const activeServices = services.filter(s => s.name.trim().length > 0)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-3xl bg-card p-6 shadow-2xl border border-line space-y-5 animate-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-start justify-between border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold shrink-0">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Text as="h3" size="base" weight="black" color="default">
                  {t('landlordSetupRoomModalTitle').replace(
                    '{roomNumber}',
                    draft.roomNumber || `P${target.floor}0${target.index}`,
                  )}
                </Text>
                {isCustomized && (
                  <Text
                    as="span"
                    variant="badge"
                    color="brand-dark"
                    className="bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20"
                  >
                    {t('landlordSetupPreviewCustomBadge')}
                  </Text>
                )}
              </div>
              <Text as="p" variant="subtitle">
                {t('landlordSetupRoomModalSubtitle')
                  .replace('{floor}', String(target.floor))
                  .replace('{index}', String(target.index))}
              </Text>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={onClose}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Modal Form Fields */}
        <div className="space-y-4">
          {/* Room Code / Number */}
          <TextInput
            label={t('landlordSetupRoomModalRoomNumberLabel')}
            required
            value={draft.roomNumber}
            onChange={e => onChangeDraft(prev => ({ ...prev, roomNumber: e.target.value }))}
            placeholder={t('landlordSetupRoomModalRoomNumberPlaceholder')}
          />

          {/* Area & Max Occupants Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label={t('landlordSetupRoomModalAreaLabel')}
              step="0.1"
              min={1}
              max={1000}
              value={draft.area}
              onChange={e => onChangeDraft(prev => ({ ...prev, area: e.target.value }))}
              placeholder={t('landlordSetupRoomModalAreaPlaceholder')}
            />

            <NumberInput
              label={t('landlordSetupRoomModalOccupantsLabel')}
              min={1}
              max={50}
              value={draft.maxOccupants}
              onChange={e =>
                onChangeDraft(prev => ({
                  ...prev,
                  maxOccupants: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
            />
          </div>

          {/* Room Type */}
          <SelectInput
            label={t('landlordSetupRoomModalRoomTypeLabel')}
            required
            value={draft.roomTypeIndex}
            onChange={e =>
              onChangeDraft(prev => ({
                ...prev,
                roomTypeIndex: parseInt(e.target.value, 10),
              }))
            }
          >
            {activeRoomTypes.map((rt, idx) => (
              <option key={rt.id} value={idx}>
                {rt.name} {rt.description ? `(${rt.description})` : ''}
              </option>
            ))}
          </SelectInput>

          {/* Attached Services */}
          <Form.Field
            label={t('landlordSetupRoomModalServicesLabel')}
            helperText={t('landlordSetupRoomModalServicesHint')}
          >
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {activeServices.length === 0 ? (
                <Text as="p" size="xs" color="subtle" italic>
                  {t('landlordSetupRoomModalNoServices')}
                </Text>
              ) : (
                activeServices.map((service, idx) => {
                  const isChecked = draft.serviceIndices.includes(idx)
                  return (
                    <Checkbox
                      key={service.id}
                      variant="card"
                      size="sm"
                      label={
                        <span className="flex items-center justify-between w-full">
                          <Text as="span" size="xs" weight="bold" color="default">
                            {service.name}
                          </Text>
                          <Text as="span" size="xs" color="secondary" weight="semibold">
                            {service.price}₫ / {service.unit}
                          </Text>
                        </span>
                      }
                      checked={isChecked}
                      onChange={() => {
                        onChangeDraft(prev => {
                          const current = prev.serviceIndices
                          const next = current.includes(idx)
                            ? current.filter(i => i !== idx)
                            : [...current, idx]
                          return { ...prev, serviceIndices: next }
                        })
                      }}
                    />
                  )
                })
              )}
            </div>
          </Form.Field>
        </div>

        {/* Modal Actions */}
        <Form.Actions align="between" className="border-t border-line pt-4">
          <div>
            {isCustomized && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={onResetToDefault}
              >
                {t('landlordSetupRoomModalResetToDefault')}
              </Button>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
            >
              {t('landlordSetupRoomModalCancel')}
            </Button>
            <Button type="button" variant="primary" size="sm" onClick={onSave} >
              {t('landlordSetupRoomModalSave')}
            </Button>
          </div>
        </Form.Actions>
      </div>
    </div>
  )
}
