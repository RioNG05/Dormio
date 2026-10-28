'use client'

import React, { useState } from 'react'
import { Building2, ChevronRight, Sparkles, Plus, Trash2, HouseWifi } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  Chip,
  Checkbox,
  DateInput,
  Form,
  NumberInput,
  SelectInput,
  Text,
  TextInput,
  TextareaInput,
} from '@/components/ui'
import { CoverPhotoUpload } from '@/components/landlord/CoverPhotoUpload'
import type { Province, Ward } from '@/services/vietnam-address.service'
import type { AmenityItem, GeneralInfoState } from '../types'

export interface Step1GeneralInfoProps {
  info: GeneralInfoState
  onUpdateInfo: (field: keyof GeneralInfoState, value: string) => void
  provinces: Province[]
  isLoadingProvinces: boolean
  selectedProvinceCode: number | null
  wards: Ward[]
  isLoadingWards: boolean
  onProvinceSelect: (provinceName: string) => void
  onMapAddressSelect?: (selected: any) => void
  onThumbnailFileChange: (file: File | null) => void
  amenities: AmenityItem[]
  onToggleAmenity: (id: string) => void
  onAddAmenity: (name: string) => void
  onRemoveAmenity: (id: string) => void
  isValid: boolean
  onNext: () => void
  onCancel: () => void
}

export function Step1GeneralInfo({
  info,
  onUpdateInfo,
  provinces,
  isLoadingProvinces,
  selectedProvinceCode,
  wards,
  isLoadingWards,
  onProvinceSelect,
  onThumbnailFileChange,
  amenities,
  onToggleAmenity,
  onAddAmenity,
  onRemoveAmenity,
  isValid,
  onNext,
  onCancel,
}: Step1GeneralInfoProps) {
  const t = useTranslations('landlord')
  const [newAmenityName, setNewAmenityName] = useState('')
  const [amenityError, setAmenityError] = useState<string | null>(null)

  const selectedAmenitiesCount = amenities.filter(a => a.checked).length

  const handleAddAmenityClick = () => {
    const trimmed = newAmenityName.trim()
    if (!trimmed) return
    if (amenities.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
      setAmenityError(t('landlordSetupSection1bDuplicate'))
      return
    }
    onAddAmenity(trimmed)
    setNewAmenityName('')
    setAmenityError(null)
  }

  const getAmenityLabel = (item: AmenityItem): string => {
    if (item.key) {
      const i18nKey = `landlordRoomAmenity${item.key}`
      const translated = t(i18nKey)
      if (translated && translated !== i18nKey) return translated
    }
    return item.name
  }

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      {/* ─── 1a. Thông tin cơ sở nhà trọ ────────────────────────────────────────── */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <Text as="h2" variant="heading">
              {t('landlordSetupSection1aTitle')}
            </Text>
            <Text as="p" variant="subtitle">
              {t('landlordSetupSection1aDesc')}
            </Text>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
          {/* Country (Locked) */}
          <TextInput
            label={t('landlordSetupCountryLabel')}
            helperText={t('landlordSetupCountryLockedNotice')}
            required
            readOnly
            disabled
            value="Việt Nam"
          />

          {/* Province / City Dropdown */}
          <SelectInput
            label={t('landlordSetupProvinceLabel')}
            required
            value={info.province}
            onChange={e => onProvinceSelect(e.target.value)}
            disabled={isLoadingProvinces}
          >
            <option value="">
              {isLoadingProvinces
                ? t('landlordSetupProvinceLoading')
                : `-- ${t('landlordSetupProvinceSelect')} --`}
            </option>
            {provinces.map(prov => (
              <option key={prov.code} value={prov.name}>
                {prov.name}
              </option>
            ))}
          </SelectInput>

          {/* Ward Dropdown */}
          <SelectInput
            label={t('landlordSetupWardLabel')}
            required
            value={info.ward}
            onChange={e => onUpdateInfo('ward', e.target.value)}
            disabled={!selectedProvinceCode || isLoadingWards}
          >
            {!selectedProvinceCode && (
              <option value="">{t('landlordSetupWardSelectProvinceFirst')}</option>
            )}
            {selectedProvinceCode && isLoadingWards && (
              <option value="">{t('landlordSetupWardLoading')}</option>
            )}
            {selectedProvinceCode && !isLoadingWards && (
              <option value="">-- {t('landlordSetupWardSelect')} --</option>
            )}
            {selectedProvinceCode &&
              !isLoadingWards &&
              wards.map(w => (
                <option key={w.code} value={w.name}>
                  {w.name}
                </option>
              ))}
            {selectedProvinceCode &&
              !isLoadingWards &&
              info.ward &&
              !wards.some(w => w.name === info.ward) && (
                <option value={info.ward}>{info.ward}</option>
              )}
          </SelectInput>

          {/* Street */}
          <TextInput
            label={t('landlordSetupStreetLabel')}
            required
            value={info.street}
            onChange={e => onUpdateInfo('street', e.target.value)}
            placeholder={t('landlordSetupStreetPlaceholder')}
          />

          {/* House Number */}
          <TextInput
            label={t('landlordSetupHouseNumberLabel')}
            required
            value={info.houseNumber}
            onChange={e => onUpdateInfo('houseNumber', e.target.value)}
            placeholder={t('landlordSetupHouseNumberPlaceholder')}
          />

          {/* Building Name */}
          <TextInput
            label={t('landlordSetupNameLabel')}
            required
            helperText={t('landlordSetupNameHint')}
            value={info.name}
            onChange={e => onUpdateInfo('name', e.target.value)}
            placeholder={t('landlordSetupNamePlaceholder')}
          />

          {/* Total Floors */}
          <NumberInput
            label={t('landlordSetupTotalFloorLabel')}
            helperText={t('landlordSetupTotalFloorHint')}
            min={1}
            max={100}
            value={info.totalFloor}
            onChange={e => onUpdateInfo('totalFloor', e.target.value)}
            placeholder={t('landlordSetupTotalFloorPlaceholder')}
          />

          {/* Built At Date */}
          <DateInput
            label={t('landlordSetupBuiltAtLabel')}
            required
            maxDate="today"
            value={info.builtAt}
            onChange={e => onUpdateInfo('builtAt', e.target.value)}
          />

          {/* Monthly Payment Date */}
          <NumberInput
            label={t('landlordSetupMonthlyPaymentDateLabel')}
            helperText={t('landlordSetupMonthlyPaymentDateHint')}
            min={1}
            max={31}
            value={info.monthlyPaymentDate}
            onChange={e => onUpdateInfo('monthlyPaymentDate', e.target.value)}
            placeholder="5"
          />

          {/* Cover Photo Upload */}
          <div className="md:col-span-2">
            <CoverPhotoUpload
              value={info.thumbnail}
              onChange={url => onUpdateInfo('thumbnail', url)}
              onFileChange={onThumbnailFileChange}
              label={t('landlordSetupThumbnailLabel')}
              hint={t('landlordSetupThumbnailUploadHint')}
              maxSizeMb={10}
            />
          </div>

          {/* Summary Description */}
          <div className="md:col-span-2">
            <TextareaInput
              label={t('landlordSetupDescriptionLabel')}
              helperText={t('landlordSetupDescriptionHint')}
              rows={3}
              value={info.description}
              onChange={e => onUpdateInfo('description', e.target.value)}
              placeholder={t('landlordSetupDescriptionPlaceholder')}
            />
          </div>
        </div>
      </div>

      {/* ─── 1b. Tiện nghi nhà trọ ────────────────────────────────────────────── */}
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-line pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-info-soft text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <HouseWifi className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" variant="heading">
                {t('landlordSetupSection1bTitle')}
              </Text>
              <Text as="p" variant="subtitle">
                {t('landlordSetupSection1bDesc')}
              </Text>
            </div>
          </div>
          <Chip size="sm" variant="primary" preventHover className="self-start sm:self-auto">
            {t('landlordSetupSection1bSelectedCount').replace('{count}', String(selectedAmenitiesCount))}
          </Chip>
        </div>

        {/* Add Amenity Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="flex-1">
            <TextInput
              value={newAmenityName}
              onChange={e => {
                setNewAmenityName(e.target.value)
                if (amenityError) setAmenityError(null)
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  handleAddAmenityClick()
                }
              }}
              placeholder={t('landlordSetupSection1bAddPlaceholder')}
              error={amenityError ?? undefined}
            />
          </div>
          <Button
            type="button"
            variant="secondary"
            size="md"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={handleAddAmenityClick}
            disabled={!newAmenityName.trim()}
            className="self-end sm:self-auto shrink-0"
          >
            {t('landlordSetupSection1bAddBtn')}
          </Button>
        </div>

        {/* Suggested Amenities Checkbox Grid */}
        {amenities.length === 0 ? (
          <div className="p-8 rounded-2xl border border-dashed border-line text-center">
            <Text as="p" size="sm" color="subtle">
              {t('landlordSetupSection1bEmpty')}
            </Text>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {amenities.map(amenity => {
              const label = getAmenityLabel(amenity)
              return (
                <Checkbox
                  key={amenity.id}
                  size="sm"
                  variant="card"
                  checked={amenity.checked}
                  onChange={() => onToggleAmenity(amenity.id)}
                  label={
                    <div className="flex items-center justify-between w-full min-w-0 pr-1">
                      <Text
                        as="span"
                        size="xs"
                        weight={amenity.checked ? 'bold' : 'normal'}
                        truncate
                        className={amenity.checked ? 'text-foreground' : 'text-muted'}
                      >
                        {label}
                      </Text>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        onClick={e => {
                          e.stopPropagation()
                          onRemoveAmenity(amenity.id)
                        }}
                        title={t('landlordSetupSection1bDelete')}
                        className="opacity-60 sm:opacity-0 group-hover:opacity-100 hover:text-danger hover:bg-danger-soft transition-opacity shrink-0 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  }
                />
              )
            })}
          </div>
        )}
      </div>

      <Form.Actions align="between" className="pt-2">
        <Button size="md" variant="outline" onClick={onCancel}>
          {t('landlordSetupCancel')}
        </Button>
        <Button
          size="md"
          disabled={!isValid}
          onClick={onNext}
          rightIcon={<ChevronRight />}
        >
          {t('landlordSetupNextToStep2')}
        </Button>
      </Form.Actions>
    </section>
  )
}
