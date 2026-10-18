'use client'

import React, { useState, useMemo } from 'react'
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Info,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Form, NumberInput, SelectInput, Text, TextInput } from '@/components/ui'
import { RoomEditModal } from './RoomEditModal'
import {
  MAX_FREE_TIER_ROOMS,
  type CustomRoomData,
  type RoomTypeItem,
  type RoomsConfigState,
  type ServiceItem,
} from '../types'

export interface Step3BulkRoomsAndPreviewProps {
  roomsConfig: RoomsConfigState
  onChangeRoomsConfig: React.Dispatch<React.SetStateAction<RoomsConfigState>>
  roomOverrides: Record<string, CustomRoomData>
  onSetRoomOverrides: React.Dispatch<React.SetStateAction<Record<string, CustomRoomData>>>
  roomTypes: RoomTypeItem[]
  services: ServiceItem[]
  totalRoomsToCreate: number
  isQuotaExceeded: boolean
  nameFormatPresets: Array<{ label: string; value: string }>
  isSubmitting: boolean
  onBack: () => void
  onNext: () => void
}

export function Step3BulkRoomsAndPreview({
  roomsConfig,
  onChangeRoomsConfig,
  roomOverrides,
  onSetRoomOverrides,
  roomTypes,
  services,
  totalRoomsToCreate,
  isQuotaExceeded,
  nameFormatPresets,
  isSubmitting,
  onBack,
  onNext,
}: Step3BulkRoomsAndPreviewProps) {
  const t = useTranslations('landlord')

  // Individual room customization modal state
  const [editingRoomTarget, setEditingRoomTarget] = useState<{
    floor: number
    index: number
  } | null>(null)
  const [roomModalDraft, setRoomModalDraft] = useState<CustomRoomData | null>(null)

  const computeDefaultRoomCode = (
    floor: number,
    index: number,
    format = roomsConfig.nameFormat,
  ) => {
    return format.replace(/\{floor\}/g, String(floor)).replace(/\{index\}/g, String(index))
  }

  const generatedRoomsPreview = useMemo(() => {
    const list: Array<{
      floor: number
      rooms: Array<{
        index: number
        roomCode: string
        isCustomized: boolean
      }>
    }> = []
    const floors = Math.min(Math.max(1, roomsConfig.floorCount), 30)
    const perFloor = Math.min(Math.max(1, roomsConfig.roomsPerFloor), 30)

    for (let f = 1; f <= floors; f++) {
      const rooms: Array<{
        index: number
        roomCode: string
        isCustomized: boolean
      }> = []
      for (let i = 1; i <= perFloor; i++) {
        const key = `${f}-${i}`
        const override = roomOverrides[key]
        const defaultCode = computeDefaultRoomCode(f, i)
        const roomCode = override?.roomNumber || defaultCode
        const isCustomized = Boolean(override?.isCustomized)
        rooms.push({ index: i, roomCode, isCustomized })
      }
      list.push({ floor: f, rooms })
    }
    return list
  }, [roomsConfig.floorCount, roomsConfig.roomsPerFloor, roomsConfig.nameFormat, roomOverrides])

  const handleOpenRoomModal = (floor: number, index: number) => {
    const key = `${floor}-${index}`
    const existing = roomOverrides[key]

    const initialData: CustomRoomData = existing
      ? { ...existing, serviceIndices: [...existing.serviceIndices] }
      : {
          roomNumber: computeDefaultRoomCode(floor, index),
          area: roomsConfig.area,
          maxOccupants: roomsConfig.maxOccupants,
          roomTypeIndex: Math.min(
            Math.max(0, roomsConfig.roomTypeIndex),
            Math.max(0, roomTypes.length - 1),
          ),
          serviceIndices: [...roomsConfig.serviceIndices],
          isCustomized: false,
        }

    setEditingRoomTarget({ floor, index })
    setRoomModalDraft(initialData)
  }

  const handleCloseRoomModal = () => {
    setEditingRoomTarget(null)
    setRoomModalDraft(null)
  }

  const handleSaveRoomModal = () => {
    if (!editingRoomTarget || !roomModalDraft) return
    const key = `${editingRoomTarget.floor}-${editingRoomTarget.index}`
    onSetRoomOverrides(prev => ({
      ...prev,
      [key]: {
        ...roomModalDraft,
        roomNumber:
          roomModalDraft.roomNumber.trim() ||
          computeDefaultRoomCode(editingRoomTarget.floor, editingRoomTarget.index),
        isCustomized: true,
      },
    }))
    handleCloseRoomModal()
  }

  const handleResetRoomToDefault = () => {
    if (!editingRoomTarget) return
    const key = `${editingRoomTarget.floor}-${editingRoomTarget.index}`
    onSetRoomOverrides(prev => {
      const next = { ...prev }
      delete next[key]
      return next
    })
    handleCloseRoomModal()
  }

  const toggleServiceIndex = (index: number) => {
    onChangeRoomsConfig(prev => {
      const current = prev.serviceIndices
      if (current.includes(index)) {
        return { ...prev, serviceIndices: current.filter(i => i !== index) }
      } else {
        return { ...prev, serviceIndices: [...current, index] }
      }
    })
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Generation Settings Form */}
        <div className="lg:col-span-7 rounded-3xl border border-zinc-200/80 bg-white p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex items-center gap-3 border-b border-zinc-100 pb-4">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" variant="heading">
                {t('landlordSetupSection3Title')}
              </Text>
              <Text as="p" variant="subtitle">
                {t('landlordSetupSection3Desc')}
              </Text>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <NumberInput
              label={t('landlordSetupFloorCountLabel')}
              required
              min={1}
              max={50}
              value={roomsConfig.floorCount}
              onChange={e =>
                onChangeRoomsConfig(prev => ({
                  ...prev,
                  floorCount: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
            />

            <NumberInput
              label={t('landlordSetupRoomsPerFloorLabel')}
              required
              min={1}
              max={50}
              value={roomsConfig.roomsPerFloor}
              onChange={e =>
                onChangeRoomsConfig(prev => ({
                  ...prev,
                  roomsPerFloor: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
            />

            <div className="sm:col-span-2 space-y-2">
              <TextInput
                label={t('landlordSetupNameFormatLabel')}
                required
                helperText={t('landlordSetupNameFormatHint')}
                value={roomsConfig.nameFormat}
                onChange={e =>
                  onChangeRoomsConfig(prev => ({
                    ...prev,
                    nameFormat: e.target.value,
                  }))
                }
              />
              <div className="flex flex-wrap gap-1.5">
                {nameFormatPresets.map(preset => (
                  <Button
                    key={preset.value}
                    type="button"
                    size="sm"
                    variant={roomsConfig.nameFormat === preset.value ? 'primary' : 'outline'}
                    onClick={() =>
                      onChangeRoomsConfig(prev => ({
                        ...prev,
                        nameFormat: preset.value,
                      }))
                    }
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>

            <NumberInput
              label={t('landlordSetupAreaLabel')}
              min={1}
              step="0.1"
              value={roomsConfig.area}
              onChange={e =>
                onChangeRoomsConfig(prev => ({
                  ...prev,
                  area: e.target.value,
                }))
              }
              placeholder="25.0"
            />

            <NumberInput
              label={t('landlordSetupMaxOccupantsLabel')}
              min={1}
              max={10}
              value={roomsConfig.maxOccupants}
              onChange={e =>
                onChangeRoomsConfig(prev => ({
                  ...prev,
                  maxOccupants: Math.max(1, parseInt(e.target.value, 10) || 1),
                }))
              }
            />

            <div className="sm:col-span-2">
              <SelectInput
                label={t('landlordSetupDefaultRoomTypeLabel')}
                required
                value={roomsConfig.roomTypeIndex}
                onChange={e =>
                  onChangeRoomsConfig(prev => ({
                    ...prev,
                    roomTypeIndex: parseInt(e.target.value, 10),
                  }))
                }
              >
                {roomTypes
                  .filter(rt => rt.name.trim())
                  .map((rt, idx) => (
                    <option key={rt.id} value={idx}>
                      {rt.name} {rt.description ? `(${rt.description})` : ''}
                    </option>
                  ))}
              </SelectInput>
            </div>

            <div className="sm:col-span-2 space-y-2">
              <Text as="label" size="xs" weight="bold" color="default" className="block">
                {t('landlordSetupAutoAssignServicesLabel')}
              </Text>
              <div className="flex flex-wrap gap-2">
                {services
                  .filter(s => s.name.trim())
                  .map((service, idx) => {
                    const isSelected = roomsConfig.serviceIndices.includes(idx)
                    return (
                      <Button rounded="full"
                        key={service.id}
                        type="button"
                        size="sm"
                        variant={isSelected ? 'secondary' : 'outline'}
                        onClick={() => toggleServiceIndex(idx)}
                        className={cn(
                          'h-8 text-xs font-semibold',
                          isSelected &&
                            'bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#13615e] hover:bg-[#2AC1BC]/20',
                        )}
                        leftIcon={
                          <span
                            className={cn(
                              'w-3.5 h-3.5 rounded-full flex items-center justify-center border text-[9px]',
                              isSelected
                                ? 'bg-[#2AC1BC] text-white border-transparent'
                                : 'border-zinc-300 bg-white',
                            )}
                          >
                            {isSelected && '✓'}
                          </span>
                        }
                      >
                        {service.name} ({service.price}₫/{service.unit})
                      </Button>
                    )
                  })}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Room Preview Panel & Quota Indicator */}
        <div className="lg:col-span-5 space-y-4">
          <div className="rounded-3xl border border-zinc-200/80 bg-white p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div className="flex items-center gap-2">
                <Text as="h3" size="sm" weight="black" color="default">
                  {t('landlordSetupPreviewTitle')}
                </Text>
              </div>
              <Text
                as="span"
                size="xs"
                weight="extrabold"
                color="brand"
                className="bg-[#2AC1BC]/10 px-2.5 py-0.5 rounded-full"
              >
                {totalRoomsToCreate} {t('landlordSetupRoomsTotal')}
              </Text>
            </div>

            {/* Quota Indicator Banner */}
            {isQuotaExceeded ? (
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 space-y-1.5 animate-in fade-in">
                <div className="flex items-center gap-2 font-bold text-amber-900">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('landlordSetupQuotaExceededTitle')
                      .replace('{total}', String(totalRoomsToCreate))
                      .replace('{max}', String(MAX_FREE_TIER_ROOMS))}
                  </Text>
                </div>
                <Text as="p" size="xs" color="inherit" className="leading-relaxed font-medium">
                  {t('landlordSetupQuotaExceededDesc').replace(
                    '{max}',
                    String(MAX_FREE_TIER_ROOMS),
                  )}
                </Text>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-between text-xs text-emerald-900 font-semibold">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <Text as="span" size="xs" weight="semibold" color="inherit">
                    {t('landlordSetupQuotaLimitLabel')}
                  </Text>
                </span>
                <Text as="span" size="xs" weight="extrabold" color="inherit">
                  {t('landlordSetupQuotaRatio')
                    .replace('{total}', String(totalRoomsToCreate))
                    .replace('{max}', String(MAX_FREE_TIER_ROOMS))}
                </Text>
              </div>
            )}

            {/* Live Preview Room Grid by Floor */}
            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {generatedRoomsPreview.map(group => (
                <div
                  key={group.floor}
                  className="p-3 rounded-2xl bg-zinc-50 border border-zinc-100 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <Text as="span" variant="overline" size="2xs" color="secondary">
                      {t('landlordSetupFloorPrefix')} {group.floor}
                    </Text>
                    <Text as="span" size="3xs" color="subtle" weight="bold">
                      {t('landlordSetupPreviewFloorRooms').replace(
                        '{count}',
                        String(group.rooms.length),
                      )}
                    </Text>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {group.rooms.map(room => (
                      <Button rounded="full"
                        key={room.index}
                        type="button"
                        size="sm"
                        variant={room.isCustomized ? 'secondary' : 'outline'}
                        onClick={() => handleOpenRoomModal(group.floor, room.index)}
                        title={t('landlordSetupPreviewClickToEditHint')}
                        className={cn(
                          'h-7 px-2.5 text-xs font-bold transition-all shadow-2xs hover:scale-105 active:scale-95',
                          room.isCustomized
                            ? 'bg-[#2AC1BC]/10 border-[#2AC1BC] text-[#13615e] ring-1 ring-[#2AC1BC]/40'
                            : 'bg-white border-zinc-200 text-zinc-800 hover:border-[#2AC1BC] hover:text-[#2AC1BC]',
                        )}
                        rightIcon={
                          room.isCustomized ? (
                            <span
                              title={t('landlordSetupPreviewCustomBadge')}
                            />
                          ) : undefined
                        }
                      >
                        {room.roomCode}
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-zinc-500 flex items-center gap-1.5 border-t border-zinc-100">
              <Info className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
              <Text as="span" size="2xs" color="secondary">
                {t('landlordSetupPreviewClickToEditHint')}
              </Text>
            </div>
          </div>
        </div>
      </div>

      {/* Step 3 Navigation / Submit */}
      <Form.Actions align="between" className="pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={isSubmitting}
          onClick={onBack}
          leftIcon={<ChevronLeft className="w-4 h-4" />}
        >
          {t('landlordSetupBackToStep2')}
        </Button>
        <Button
          type="button"
          variant="primary"
          disabled={isSubmitting || isQuotaExceeded || totalRoomsToCreate < 1}
          onClick={onNext}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          {t('landlordSetupNextToStep4')}
        </Button>
      </Form.Actions>

      {/* Room Edit Modal */}
      <RoomEditModal
        isOpen={Boolean(editingRoomTarget && roomModalDraft)}
        target={editingRoomTarget}
        draft={roomModalDraft}
        isCustomized={Boolean(
          editingRoomTarget &&
          roomOverrides[`${editingRoomTarget.floor}-${editingRoomTarget.index}`]?.isCustomized,
        )}
        roomTypes={roomTypes}
        services={services}
        onClose={handleCloseRoomModal}
        onChangeDraft={updater => setRoomModalDraft(prev => (prev ? updater(prev) : null))}
        onResetToDefault={handleResetRoomToDefault}
        onSave={handleSaveRoomModal}
      />
    </section>
  )
}
