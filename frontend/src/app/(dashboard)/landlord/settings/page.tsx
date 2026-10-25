'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Building2,
  Save,
  RotateCcw,
  Loader2,
  Home,
  MapPin,
  Zap,
  Bed,
  CheckCircle2,
  ExternalLink,
  Phone,
  Layers,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  Form,
  NumberInput,
  SelectInput,
  Text,
  TextInput,
  TextareaInput,
  EmptyState,
} from '@/components/ui'
import { MapAddressPicker, type SelectedMapAddress } from '@/components/landlord/MapAddressPicker'
import { CoverPhotoUpload } from '@/components/landlord/CoverPhotoUpload'
import {
  fetchProvinces,
  fetchWardsByProvince,
  matchProvince,
  type Province,
  type Ward,
} from '@/services/vietnam-address.service'
import {
  getBoardingHouseById,
  getMyBoardingHouses,
  updateBoardingHouse,
  type BoardingHouse,
  type UpdateBoardingHousePayload,
} from '@/services/boarding-house.service'

interface HouseFormData {
  name: string
  description: string
  country: string
  province: string
  city: string
  district: string
  ward: string
  street: string
  houseNumber: string
  totalFloor: string
  builtAt: string
  thumbnail: string
}

const INITIAL_FORM_DATA: HouseFormData = {
  name: '',
  description: '',
  country: 'Việt Nam',
  province: '',
  city: '',
  district: '',
  ward: '',
  street: '',
  houseNumber: '',
  totalFloor: '',
  builtAt: '',
  thumbnail: '',
}

export default function LandlordSettingsPage() {
  const router = useRouter()
  const t = useTranslations('landlord')
  const { toast } = useToast()
  const {
    user,
    buildings,
    activeBuildingId,
    activeBuilding,
    selectBuilding,
    refreshBuildings,
    isBuildingsLoading,
  } = useAuth()

  // Selected building to edit & full loaded details
  const [selectedHouseId, setSelectedHouseId] = useState<string>('')
  const [loadedHouse, setLoadedHouse] = useState<BoardingHouse | null>(null)
  const [formData, setFormData] = useState<HouseFormData>(INITIAL_FORM_DATA)
  const [originalData, setOriginalData] = useState<HouseFormData | null>(null)

  // Loading & submission states
  const [isLoadingHouse, setIsLoadingHouse] = useState<boolean>(false)
  const [isSaving, setIsSaving] = useState<boolean>(false)

  // Administrative address cascade
  const [provinces, setProvinces] = useState<Province[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState<boolean>(true)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null)
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingWards, setIsLoadingWards] = useState<boolean>(false)

  // Initialize selected house from active building or first available
  useEffect(() => {
    if (!selectedHouseId) {
      if (activeBuildingId) {
        setSelectedHouseId(activeBuildingId)
      } else if (buildings.length > 0) {
        setSelectedHouseId(buildings[0].id)
      }
    }
  }, [activeBuildingId, buildings, selectedHouseId])

  // Fetch provinces list on component mount
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

  // Fetch full details of the currently selected boarding house
  useEffect(() => {
    if (!selectedHouseId) return

    let isMounted = true
    setIsLoadingHouse(true)

    // Helper to populate form state from a BoardingHouse object
    const populateHouseData = (house: BoardingHouse) => {
      const builtAtFormatted = house.builtAt ? house.builtAt.split('T')[0] : ''
      const populated: HouseFormData = {
        name: house.name || '',
        description: house.description || '',
        country: house.country || 'Việt Nam',
        province: house.province || '',
        city: house.city || '',
        district: house.district || '',
        ward: house.ward || '',
        street: house.street || '',
        houseNumber: house.houseNumber || '',
        totalFloor: house.totalFloor ? String(house.totalFloor) : '',
        builtAt: builtAtFormatted,
        thumbnail: house.thumbnail || '',
      }
      setLoadedHouse(house)
      setFormData(populated)
      setOriginalData(populated)
    }

    getBoardingHouseById(selectedHouseId)
      .then(house => {
        if (!isMounted) return
        if (house && house.id) {
          populateHouseData(house)
        } else {
          throw new Error('Invalid house response')
        }
      })
      .catch(err => {
        console.warn('Direct getBoardingHouseById failed, falling back to list:', err)
        // Fallback: search within getMyBoardingHouses
        getMyBoardingHouses({ silent: true })
          .then(list => {
            if (!isMounted) return
            const matched = list.find(h => h.id === selectedHouseId)
            if (matched) {
              populateHouseData(matched)
            } else if (list.length > 0) {
              populateHouseData(list[0])
            }
          })
          .catch(fallbackErr => {
            console.error('Failed to fallback load boarding house:', fallbackErr)
            if (isMounted) {
              toast.error(t('landlordSettingsSaveError'))
            }
          })
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingHouse(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [selectedHouseId, toast, t])

  // Resolve province code when provinces list or formData.province is updated
  useEffect(() => {
    if (provinces.length > 0 && formData.province) {
      const matched = matchProvince(formData.province, provinces)
      if (matched && matched.code !== selectedProvinceCode) {
        setSelectedProvinceCode(matched.code)
      }
    }
  }, [provinces, formData.province, selectedProvinceCode])

  // Fetch cascading wards when selected province code changes
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

  // Form field update handlers
  const handleUpdateField = (field: keyof HouseFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleProvinceSelect = (provinceName: string) => {
    setFormData(prev => ({
      ...prev,
      province: provinceName,
      ward: '',
    }))
    const matched = provinces.find(p => p.name === provinceName)
    setSelectedProvinceCode(matched ? matched.code : null)
  }

  const handleMapAddressSelect = (selected: SelectedMapAddress) => {
    setFormData(prev => ({
      ...prev,
      houseNumber: selected.houseNumber || prev.houseNumber,
      street: selected.street || prev.street,
      ward: selected.ward || prev.ward,
      province: selected.province || prev.province,
    }))

    const matched = matchProvince(selected.province, provinces)
    if (matched) {
      setSelectedProvinceCode(matched.code)
    }
  }

  const handleSwitchBuilding = (houseId: string) => {
    setSelectedHouseId(houseId)
    selectBuilding(houseId)
  }

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData)
    }
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()

    if (
      !formData.name.trim() ||
      !formData.province.trim() ||
      !formData.ward.trim() ||
      !formData.street.trim() ||
      !formData.houseNumber.trim()
    ) {
      toast.warning(t('landlordSettingsRequiredFieldError'))
      return
    }

    try {
      setIsSaving(true)
      const payload: UpdateBoardingHousePayload = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        country: formData.country.trim() || 'Việt Nam',
        province: formData.province.trim(),
        city: formData.city.trim() || undefined,
        district: formData.district.trim() || undefined,
        ward: formData.ward.trim(),
        street: formData.street.trim(),
        houseNumber: formData.houseNumber.trim(),
        totalFloor: formData.totalFloor ? parseInt(formData.totalFloor, 10) : undefined,
        builtAt: formData.builtAt ? new Date(formData.builtAt).toISOString() : undefined,
        thumbnail: formData.thumbnail || undefined,
      }

      const updated = await updateBoardingHouse(selectedHouseId, payload)
      await refreshBuildings()

      if (updated && updated.id) {
        setLoadedHouse(prev => (prev ? { ...prev, ...updated } : updated))
      }
      setOriginalData(formData)
      toast.success(t('landlordSettingsSavedSuccess'))
    } catch (error) {
      console.error('Failed to update boarding house:', error)
      toast.error(t('landlordSettingsSaveError'))
    } finally {
      setIsSaving(false)
    }
  }

  // Detect whether the user has modified any form field
  const hasChanges = Boolean(
    originalData && JSON.stringify(formData) !== JSON.stringify(originalData),
  )

  // Empty state when landlord has no properties
  if (!isBuildingsLoading && buildings.length === 0) {
    return (
      <div className="max-w-4xl mx-auto py-12 px-4">
        <EmptyState
          icon={Building2}
          title={t('landlordSettingsNoProperty')}
          description={t('landlordSettingsPageSubtitle')}
          action={{
            label: `+ ${t('landlordSetupTitle')}`,
            onClick: () => router.push('/landlord/setup'),
          }}
          bordered
        />
      </div>
    )
  }

  const roomCount = loadedHouse?.totalRooms ?? activeBuilding?.totalRooms ?? 0
  const servicesList = loadedHouse?.services ?? []
  const roomTypesList = loadedHouse?.roomTypes ?? []
  const contactPhone = user?.phone || '0988777666'

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <Text as="h1" className="text-2xl font-black text-foreground tracking-tight">
            {t('landlordSettingsTitle')}
          </Text>
          <Text as="p" variant="subtitle" color="secondary">
            {t('landlordSettingsPageSubtitle')}
          </Text>
        </div>

        {/* Multi-Property Switcher Dropdown */}
        {buildings.length > 1 && (
          <div className="w-full sm:w-72">
            <SelectInput
              label={t('landlordSettingsSelectPropertyLabel')}
              value={selectedHouseId}
              onChange={e => handleSwitchBuilding(e.target.value)}
              disabled={isLoadingHouse || isSaving}
            >
              {buildings.map(b => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </SelectInput>
          </div>
        )}
      </div>

      {/* Quick Overview of Existing Property System Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Status Card */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('landlordSettingsTabBuildingInfo')}
            </span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-success-soft text-success border border-success-subtle">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              {t('landlordSettingsStatusActive')}
            </span>
          </div>
          <Text as="p" className="text-base font-black text-foreground truncate">
            {formData.name || activeBuilding?.name || t('landlordSettingsTabBuildingInfo')}
          </Text>
          <Text as="p" size="xs" color="secondary" className="truncate">
            {formData.province || 'Việt Nam'}
          </Text>
        </div>

        {/* Total Rooms Card */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('landlordSettingsTotalRoomsLabel')}
            </span>
            <div className="p-1.5 rounded-lg bg-info-soft text-info">
              <Bed className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <Text as="p" className="text-2xl font-black text-foreground">
              {roomCount}
            </Text>
            <Text as="span" size="xs" color="secondary">
              {t('landlordSettingsTotalRoomsSuffix')}
            </Text>
          </div>
          <Link
            href="/landlord/rooms"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            {t('landlordSettingsManageRoomsBtn')} <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Services Card */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('landlordServicesTitle')}
            </span>
            <div className="p-1.5 rounded-lg bg-warning-soft text-warning">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <Text as="p" className="text-2xl font-black text-foreground">
              {servicesList.length}
            </Text>
            <Text as="span" size="xs" color="secondary">
              dịch vụ
            </Text>
          </div>
          <Link
            href="/landlord/services"
            className="inline-flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            {t('landlordSettingsManageServicesBtn')} <ExternalLink className="w-3 h-3" />
          </Link>
        </div>

        {/* Room Types Card */}
        <div className="bg-card rounded-2xl p-4 border border-line shadow-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted uppercase tracking-wider">
              {t('landlordSettingsRoomTypesSection')}
            </span>
            <div className="p-1.5 rounded-lg bg-deposit-soft text-deposit">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-1.5">
            <Text as="p" className="text-2xl font-black text-foreground">
              {roomTypesList.length}
            </Text>
            <Text as="span" size="xs" color="secondary">
              loại phòng
            </Text>
          </div>
          <Text as="p" size="xs" color="secondary" className="truncate">
            {formData.totalFloor ? `${formData.totalFloor} tầng` : 'Nhiều tầng'}
          </Text>
        </div>
      </div>

      {isLoadingHouse ? (
        <div className="rounded-3xl border border-line bg-card p-12 text-center shadow-xs flex flex-col items-center justify-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <Text variant="body" color="secondary">
            {t('landlordSettingsLoadingProperty')}
          </Text>
        </div>
      ) : (
        <Form variant="card" onSubmit={handleSave}>
          {/* Header Card Information */}
          <Form.Header
            icon={<Building2 className="w-5 h-5" />}
            title={formData.name || t('landlordSettingsTabBuildingInfo')}
            description={[formData.houseNumber, formData.street, formData.ward, formData.province]
              .filter(Boolean)
              .join(', ')}
          />

          {/* Section 1: Basic Information */}
          <Form.Section
            icon={<Home className="w-4 h-4" />}
            title={t('landlordSettingsBasicInfoSection')}
          >
            <Form.Grid cols={2} gap="lg">
              {/* Building Name */}
              <div className="md:col-span-2">
                <TextInput
                  label={t('landlordSetupNameLabel')}
                  required
                  helperText={t('landlordSetupNameHint')}
                  value={formData.name}
                  onChange={e => handleUpdateField('name', e.target.value)}
                  placeholder={t('landlordSetupNamePlaceholder')}
                  disabled={isSaving}
                />
              </div>

              {/* Contact Phone (Prefilled with Landlord Phone) */}
              <TextInput
                label={t('landlordSettingsPhoneContact')}
                helperText="Số hotline / liên hệ hiển thị cho khách thuê"
                value={contactPhone}
                readOnly
                disabled
                leftIcon={<Phone className="w-4 h-4 text-muted" />}
              />

              {/* Total Floors */}
              <NumberInput
                label={t('landlordSetupTotalFloorLabel')}
                helperText={t('landlordSetupTotalFloorHint')}
                min={1}
                max={100}
                value={formData.totalFloor}
                onChange={e => handleUpdateField('totalFloor', e.target.value)}
                placeholder={t('landlordSetupTotalFloorPlaceholder')}
                disabled={isSaving}
              />

              {/* Built At Date */}
              <div className="md:col-span-2">
                <TextInput
                  type="date"
                  label={t('landlordSetupBuiltAtLabel')}
                  value={formData.builtAt}
                  onChange={e => handleUpdateField('builtAt', e.target.value)}
                  disabled={isSaving}
                />
              </div>

              {/* Cover Photo Upload */}
              <div className="md:col-span-2">
                <CoverPhotoUpload
                  value={formData.thumbnail}
                  onChange={url => handleUpdateField('thumbnail', url)}
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
                  value={formData.description}
                  onChange={e => handleUpdateField('description', e.target.value)}
                  placeholder={t('landlordSetupDescriptionPlaceholder')}
                  disabled={isSaving}
                />
              </div>
            </Form.Grid>
          </Form.Section>

          {/* Section 2: Address & Interactive Map */}
          <Form.Section
            icon={<MapPin className="w-4 h-4" />}
            title={t('landlordSettingsAddressSection')}
            divider
          >
            <div className="space-y-5">
              {/* Interactive Google / OSM Map Address Picker */}
              {/* <MapAddressPicker
                provinces={provinces}
                onSelectAddress={handleMapAddressSelect}
                initialAddress={[
                  formData.houseNumber,
                  formData.street,
                  formData.ward,
                  formData.province,
                ]
                  .filter(Boolean)
                  .join(', ')}
              /> */}

              <Form.Grid cols={2} gap="lg">
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
                  value={formData.province}
                  onChange={e => handleProvinceSelect(e.target.value)}
                  disabled={isLoadingProvinces || isSaving}
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
                  value={formData.ward}
                  onChange={e => handleUpdateField('ward', e.target.value)}
                  disabled={!selectedProvinceCode || isLoadingWards || isSaving}
                >
                  {!selectedProvinceCode ? (
                    <option value="">{t('landlordSetupWardSelectProvinceFirst')}</option>
                  ) : isLoadingWards ? (
                    <option value="">{t('landlordSetupWardLoading')}</option>
                  ) : (
                    <>
                      <option value="">-- {t('landlordSetupWardSelect')} --</option>
                      {wards.map(w => (
                        <option key={w.code} value={w.name}>
                          {w.name}
                        </option>
                      ))}
                    </>
                  )}
                </SelectInput>

                {/* Street */}
                <TextInput
                  label={t('landlordSetupStreetLabel')}
                  required
                  value={formData.street}
                  onChange={e => handleUpdateField('street', e.target.value)}
                  placeholder={t('landlordSetupStreetPlaceholder')}
                  disabled={isSaving}
                />

                {/* House Number */}
                <div className="md:col-span-2">
                  <TextInput
                    label={t('landlordSetupHouseNumberLabel')}
                    required
                    value={formData.houseNumber}
                    onChange={e => handleUpdateField('houseNumber', e.target.value)}
                    placeholder={t('landlordSetupHouseNumberPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
              </Form.Grid>
            </div>
          </Form.Section>

          {/* Section 3: Existing Services & Utilities */}
          <Form.Section
            icon={<Zap className="w-4 h-4" />}
            title={t('landlordSettingsServicesSection')}
            description={t('landlordSettingsServicesDesc')}
            actions={
              <Button href="/landlord/services" variant="outline">
                {t('landlordSettingsManageServicesBtn')}
              </Button>
            }
            divider
          >
            {servicesList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-6 text-center">
                <Text variant="caption" color="secondary">
                  {t('landlordSettingsNoServices')}
                </Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {servicesList.map(service => (
                  <div
                    key={service.id}
                    className="p-3.5 rounded-2xl bg-surface/70 border border-line space-y-1.5"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-foreground truncate">
                        {service.name}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          service.isMetered
                            ? 'bg-warning-soft text-warning'
                            : 'bg-info-soft text-info'
                        }`}
                      >
                        {service.isMetered
                          ? t('landlordSettingsMeteredBadge')
                          : t('landlordSettingsFlatBadge')}
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-muted font-medium">Đơn giá:</span>
                      <span className="font-extrabold text-primary">
                        {Number(service.price).toLocaleString('vi-VN')} đ / {service.unit}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.Section>

          {/* Section 4: Existing Room Types */}
          <Form.Section
            icon={<Layers className="w-4 h-4" />}
            title={t('landlordSettingsRoomTypesSection')}
            description={t('landlordSettingsRoomTypesDesc')}
            divider
          >
            {roomTypesList.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-6 text-center">
                <Text variant="caption" color="secondary">
                  {t('landlordSettingsNoRoomTypes')}
                </Text>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {roomTypesList.map(rt => (
                  <div
                    key={rt.id}
                    className="p-3.5 rounded-2xl bg-surface/70 border border-line space-y-1"
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-purple-500" />
                      <span className="font-bold text-sm text-foreground">{rt.name}</span>
                    </div>
                    {rt.description && (
                      <p className="text-xs text-muted line-clamp-2 leading-relaxed pl-4">
                        {rt.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Form.Section>

          {/* Form Actions */}
          <Form.Actions align="between" className="pt-4 border-t border-line">
            <Button
              variant="outline"
              onClick={handleReset}
              disabled={!hasChanges || isSaving}
              leftIcon={<RotateCcw />}
            >
              {t('landlordSettingsResetBtn')}
            </Button>

            <Button
              type="submit"
              disabled={!hasChanges || isSaving}
              isLoading={isSaving}
              leftIcon={<Save />}
            >
              {isSaving ? t('landlordSettingsSaving') : t('landlordSettingsBtnSaveSettings')}
            </Button>
          </Form.Actions>
        </Form>
      )}
    </div>
  )
}
