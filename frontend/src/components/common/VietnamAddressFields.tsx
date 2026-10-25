'use client'

import React, { useEffect, useState } from 'react'
import {
  fetchProvinces,
  fetchWardsByProvince,
  matchProvince,
  type Province,
  type Ward,
} from '@/services/vietnam-address.service'
import { SelectInput, TextInput } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'

export interface VietnamAddressValue {
  country?: string
  province?: string
  ward?: string
  street?: string
  address?: string
}

export interface VietnamAddressFieldsProps {
  value: VietnamAddressValue
  onChange: (val: VietnamAddressValue) => void
  disabled?: boolean
  required?: boolean
  showCountry?: boolean
  namespace?: 'landlord' | 'guest'
  className?: string
}

export function VietnamAddressFields({
  value,
  onChange,
  disabled = false,
  required = false,
  showCountry = false,
  namespace = 'landlord',
  className = '',
}: VietnamAddressFieldsProps) {
  const t = useTranslations(namespace)

  const [provinces, setProvinces] = useState<Province[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null)
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingWards, setIsLoadingWards] = useState(false)

  // Translation key getters depending on namespace
  const provinceLabel =
    namespace === 'guest'
      ? t('guestProfileAddressProvinceLabel')
      : t('landlordCustomersProvinceLabel')
  const provinceSelect =
    namespace === 'guest'
      ? t('guestProfileAddressProvinceSelect')
      : t('landlordCustomersProvinceSelect')
  const provinceLoading =
    namespace === 'guest'
      ? t('guestProfileAddressProvinceLoading')
      : t('landlordCustomersProvinceLoading')

  const wardLabel =
    namespace === 'guest'
      ? t('guestProfileAddressWardLabel')
      : t('landlordCustomersWardLabel')
  const wardSelect =
    namespace === 'guest'
      ? t('guestProfileAddressWardSelect')
      : t('landlordCustomersWardSelect')
  const wardSelectProvinceFirst =
    namespace === 'guest'
      ? t('guestProfileAddressWardSelectProvinceFirst')
      : t('landlordCustomersWardSelectProvinceFirst')
  const wardLoading =
    namespace === 'guest'
      ? t('guestProfileAddressWardLoading')
      : t('landlordCustomersWardLoading')

  const streetLabel =
    namespace === 'guest'
      ? t('guestProfileAddressStreetLabel')
      : t('landlordCustomersStreetLabel')
  const streetPlaceholder =
    namespace === 'guest'
      ? t('guestProfileAddressStreetPlaceholder')
      : t('landlordCustomersStreetPlaceholder')

  // Load provinces on mount
  useEffect(() => {
    let isMounted = true
    setIsLoadingProvinces(true)
    fetchProvinces()
      .then(data => {
        if (isMounted) {
          setProvinces(data)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingProvinces(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Sync province code when provinces list is loaded or value.province changes
  useEffect(() => {
    if (provinces.length > 0 && value.province) {
      const matched = matchProvince(value.province, provinces)
      if (matched && matched.code !== selectedProvinceCode) {
        setSelectedProvinceCode(matched.code)
      }
    } else if (!value.province) {
      setSelectedProvinceCode(null)
      setWards([])
    }
  }, [provinces, value.province, selectedProvinceCode])

  // Load cascading wards when selectedProvinceCode changes
  useEffect(() => {
    if (!selectedProvinceCode) {
      setWards([])
      return
    }

    let isMounted = true
    setIsLoadingWards(true)
    fetchWardsByProvince(selectedProvinceCode)
      .then(data => {
        if (isMounted) {
          setWards(data)
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingWards(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedProvinceCode])

  const handleProvinceChange = (newProvince: string) => {
    const matched = matchProvince(newProvince, provinces)
    setSelectedProvinceCode(matched ? matched.code : null)
    const newAddress = [value.street, '', newProvince].filter(Boolean).join(', ')
    onChange({
      ...value,
      province: newProvince,
      ward: '', // Reset ward on province change
      address: newAddress,
    })
  }

  const handleWardChange = (newWard: string) => {
    const newAddress = [value.street, newWard, value.province].filter(Boolean).join(', ')
    onChange({
      ...value,
      ward: newWard,
      address: newAddress,
    })
  }

  const handleStreetChange = (newStreet: string) => {
    const newAddress = [newStreet, value.ward, value.province].filter(Boolean).join(', ')
    onChange({
      ...value,
      street: newStreet,
      address: newAddress,
    })
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className={`grid grid-cols-1 ${showCountry ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
        {showCountry && (
          <TextInput
            label="Quốc gia"
            value="Việt Nam"
            disabled
            readOnly
            className="bg-surface"
          />
        )}

        {/* Tỉnh / Thành phố */}
        <SelectInput
          label={provinceLabel}
          required={required}
          value={value.province || ''}
          onChange={e => handleProvinceChange(e.target.value)}
          disabled={disabled || isLoadingProvinces}
          className="bg-surface"
        >
          <option value="">
            {isLoadingProvinces ? provinceLoading : `-- ${provinceSelect} --`}
          </option>
          {provinces.map(p => (
            <option key={p.code} value={p.name}>
              {p.name}
            </option>
          ))}
        </SelectInput>

        {/* Phường / Xã */}
        <SelectInput
          label={wardLabel}
          required={required}
          value={value.ward || ''}
          onChange={e => handleWardChange(e.target.value)}
          disabled={disabled || !selectedProvinceCode || isLoadingWards}
          className="bg-surface"
        >
          {!selectedProvinceCode && (
            <option value="">{wardSelectProvinceFirst}</option>
          )}
          {selectedProvinceCode && isLoadingWards && (
            <option value="">{wardLoading}</option>
          )}
          {selectedProvinceCode && !isLoadingWards && (
            <option value="">-- {wardSelect} --</option>
          )}
          {selectedProvinceCode &&
            !isLoadingWards &&
            wards.map(w => (
              <option key={w.code} value={w.name}>
                {w.name}
              </option>
            ))}
          {/* Fallback option to keep existing ward if not in open API list */}
          {selectedProvinceCode &&
            !isLoadingWards &&
            value.ward &&
            !wards.some(w => w.name === value.ward) && (
              <option value={value.ward}>{value.ward}</option>
            )}
        </SelectInput>
      </div>

      {/* Địa chỉ chi tiết / Số nhà, tên đường */}
      <TextInput
        label={streetLabel}
        required={required}
        placeholder={streetPlaceholder}
        value={value.street || ''}
        onChange={e => handleStreetChange(e.target.value)}
        disabled={disabled}
        className="bg-surface"
      />
    </div>
  )
}

