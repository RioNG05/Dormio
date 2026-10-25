'use client'

import React from 'react'
import { Building2, ChevronRight } from 'lucide-react'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  DateInput,
  Form,
  NumberInput,
  SelectInput,
  Text,
  TextInput,
  TextareaInput,
} from '@/components/ui'
import { MapAddressPicker, type SelectedMapAddress } from '@/components/landlord/MapAddressPicker'
import { CoverPhotoUpload } from '@/components/landlord/CoverPhotoUpload'
import type { Province, Ward } from '@/services/vietnam-address.service'
import type { GeneralInfoState } from '../types'

export interface Step1GeneralInfoProps {
  info: GeneralInfoState
  onUpdateInfo: (field: keyof GeneralInfoState, value: string) => void
  provinces: Province[]
  isLoadingProvinces: boolean
  selectedProvinceCode: number | null
  wards: Ward[]
  isLoadingWards: boolean
  onProvinceSelect: (provinceName: string) => void
  onMapAddressSelect: (selected: SelectedMapAddress) => void
  onThumbnailFileChange: (file: File | null) => void
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
  onMapAddressSelect,
  onThumbnailFileChange,
  isValid,
  onNext,
  onCancel,
}: Step1GeneralInfoProps) {
  const t = useTranslations('landlord')

  return (
    <section className="space-y-6 animate-in fade-in duration-300">
      <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex items-center gap-3 border-b border-line pb-4">
          <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-bold">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <Text as="h2" variant="heading">
              {t('landlordSetupSection1Title')}
            </Text>
            <Text as="p" variant="subtitle">
              {t('landlordSetupSection1Desc')}
            </Text>
          </div>
        </div>

        {/* Google Maps / Interactive Map Address Picker */}
        <MapAddressPicker
          provinces={provinces}
          onSelectAddress={onMapAddressSelect}
          initialAddress={[info.houseNumber, info.street, info.ward, info.province]
            .filter(Boolean)
            .join(', ')}
        />

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

          {/* Cover Photo Upload */}
          <div className="md:col-span-2">
            <CoverPhotoUpload
              value={info.thumbnail}
              onChange={url => onUpdateInfo('thumbnail', url)}
              onFileChange={onThumbnailFileChange}
              label={t('landlordSetupThumbnailLabel')}
              hint={t('landlordSetupThumbnailHint')}
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

      <Form.Actions align="between" className="pt-2">
        <Button variant="outline" onClick={onCancel}>
          {t('landlordSetupCancel')}
        </Button>
        <Button
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
