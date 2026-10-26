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
  ExternalLink,
  Phone,
  Layers,
  Sparkles,
  Plus,
  Trash2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  Checkbox,
  Chip,
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
import {
  createId,
  DEFAULT_AMENITIES,
  type AmenityItem,
} from '../setup/types'

export interface SettingRoomTypeItem {
  id: string
  name: string
  description: string
  isNew?: boolean
}

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
  monthlyPaymentDate: string
  thumbnail: string
  roomTypes: SettingRoomTypeItem[]
  amenities: AmenityItem[]
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
  monthlyPaymentDate: '5',
  thumbnail: '',
  roomTypes: [],
  amenities: [],
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

  // Quick add amenity input state
  const [newAmenityName, setNewAmenityName] = useState('')

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

      // Load room types
      const populatedRoomTypes: SettingRoomTypeItem[] = (house.roomTypes || []).map(rt => ({
        id: rt.id,
        name: rt.name,
        description: rt.description || '',
      }))

      // Load amenities from localStorage (scoped by boarding house) or fallback to defaults
      let loadedAmenities: AmenityItem[] = []
      if (typeof window !== 'undefined') {
        try {
          const raw = localStorage.getItem(`dormio_amenities_${house.id}`)
          if (raw) {
            loadedAmenities = JSON.parse(raw)
          }
        } catch (e) {
          console.warn('Failed to parse saved amenities from localStorage:', e)
        }
      }
      if (!loadedAmenities || loadedAmenities.length === 0) {
        loadedAmenities = DEFAULT_AMENITIES.map(a => ({ ...a, id: createId() }))
      }

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
        monthlyPaymentDate: house.monthlyPaymentDate ? String(house.monthlyPaymentDate) : '5',
        thumbnail: house.thumbnail || '',
        roomTypes: populatedRoomTypes,
        amenities: loadedAmenities,
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

  // ─── ROOM TYPES HANDLERS ──────────────────────────────────────────────────
  const handleAddRoomType = () => {
    const newItem: SettingRoomTypeItem = {
      id: createId(),
      name: '',
      description: '',
      isNew: true,
    }
    setFormData(prev => ({
      ...prev,
      roomTypes: [...prev.roomTypes, newItem],
    }))
  }

  const handleUpdateRoomType = (id: string, field: 'name' | 'description', value: string) => {
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.map(rt => (rt.id === id ? { ...rt, [field]: value } : rt)),
    }))
  }

  const handleRemoveRoomType = (id: string) => {
    if (formData.roomTypes.length <= 1) {
      toast.warning(t('landlordSettingsRoomTypeMinWarning'))
      return
    }
    setFormData(prev => ({
      ...prev,
      roomTypes: prev.roomTypes.filter(rt => rt.id !== id),
    }))
  }

  // ─── AMENITIES HANDLERS ───────────────────────────────────────────────────
  const handleToggleAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.map(a => (a.id === id ? { ...a, checked: !a.checked } : a)),
    }))
  }

  const handleAddAmenity = () => {
    const trimmed = newAmenityName.trim()
    if (!trimmed) return
    if (formData.amenities.some(a => a.name.toLowerCase() === trimmed.toLowerCase())) {
      toast.warning(t('landlordSetupSection1bDuplicate'))
      return
    }
    const newItem: AmenityItem = {
      id: createId(),
      name: trimmed,
      checked: true,
      isCustom: true,
    }
    setFormData(prev => ({
      ...prev,
      amenities: [...prev.amenities, newItem],
    }))
    setNewAmenityName('')
  }

  const handleRemoveAmenity = (id: string) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.filter(a => a.id !== id),
    }))
  }

  const getAmenityLabel = (item: AmenityItem): string => {
    if (item.key) {
      const i18nKey = `landlordRoomAmenity${item.key}`
      const translated = t(i18nKey)
      if (translated && translated !== i18nKey) return translated
    }
    return item.name
  }

  const handleReset = () => {
    if (originalData) {
      setFormData(originalData)
      setNewAmenityName('')
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

    // Validate room types
    const validRoomTypes = formData.roomTypes.filter(rt => rt.name.trim().length > 0)
    if (validRoomTypes.length === 0) {
      toast.warning(t('landlordSettingsRoomTypeEmptyWarning'))
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
        monthlyPaymentDate: formData.monthlyPaymentDate ? parseInt(formData.monthlyPaymentDate, 10) : 5,
        thumbnail: formData.thumbnail || undefined,
        roomTypes: validRoomTypes.map(rt => ({
          id: rt.isNew ? undefined : rt.id,
          name: rt.name.trim(),
          description: rt.description.trim() || undefined,
        })),
        amenities: formData.amenities.filter(a => a.checked).map(a => a.name),
      }

      const updated = await updateBoardingHouse(selectedHouseId, payload)

      // Persist amenities in localStorage for this boarding house
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(
            `dormio_amenities_${selectedHouseId}`,
            JSON.stringify(formData.amenities),
          )
        } catch (err) {
          console.warn('Failed to persist amenities to localStorage:', err)
        }
      }

      await refreshBuildings()

      if (updated && updated.id) {
        setLoadedHouse(prev => (prev ? { ...prev, ...updated } : updated))
        if (updated.roomTypes && updated.roomTypes.length > 0) {
          const syncedRoomTypes: SettingRoomTypeItem[] = updated.roomTypes.map(rt => ({
            id: rt.id,
            name: rt.name,
            description: rt.description || '',
          }))
          setFormData(prev => ({ ...prev, roomTypes: syncedRoomTypes }))
          setOriginalData({ ...formData, roomTypes: syncedRoomTypes })
        } else {
          setOriginalData(formData)
        }
      } else {
        setOriginalData(formData)
      }

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
  const contactPhone = user?.phone || '0988777666'
  const selectedAmenitiesCount = formData.amenities.filter(a => a.checked).length

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
              {formData.roomTypes.length}
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

              {/* Monthly Payment Date */}
              <NumberInput
                label={t('landlordSetupMonthlyPaymentDateLabel')}
                helperText={t('landlordSetupMonthlyPaymentDateHint')}
                min={1}
                max={31}
                value={formData.monthlyPaymentDate}
                onChange={e => handleUpdateField('monthlyPaymentDate', e.target.value)}
                placeholder="5"
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
              <Button href="/landlord/services" variant="outline" size="sm">
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

          {/* Section 4: Room Types Configuration */}
          <Form.Section
            icon={<Layers className="w-4 h-4" />}
            title={t('landlordSettingsRoomTypesSection')}
            description={t('landlordSettingsRoomTypesDesc')}
            actions={
              <Button
                type="button"
                variant="outline"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={handleAddRoomType}
                disabled={isSaving}
              >
                {t('landlordSetupAddRoomType')}
              </Button>
            }
            divider
          >
            {formData.roomTypes.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-line p-6 text-center">
                <Text variant="caption" color="secondary">
                  {t('landlordSettingsNoRoomTypes')}
                </Text>
              </div>
            ) : (
              <div className="space-y-3">
                {formData.roomTypes.map((rt, index) => (
                  <div
                    key={rt.id}
                    className="p-4 rounded-2xl border border-line bg-surface/50 space-y-3"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                      <div className="sm:col-span-5">
                        <TextInput
                          label={`${t('landlordSetupRoomTypeNameLabel').replace('{index}', String(index + 1))}`}
                          required
                          value={rt.name}
                          onChange={e => handleUpdateRoomType(rt.id, 'name', e.target.value)}
                          placeholder={t('landlordSetupRoomTypeNamePlaceholder')}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="sm:col-span-6">
                        <TextInput
                          label={t('landlordSetupRoomTypeDescLabel')}
                          value={rt.description}
                          onChange={e => handleUpdateRoomType(rt.id, 'description', e.target.value)}
                          placeholder={t('landlordSetupRoomTypeDescPlaceholder')}
                          disabled={isSaving}
                        />
                      </div>

                      <div className="sm:col-span-1 flex justify-end pb-1">
                        {formData.roomTypes.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleRemoveRoomType(rt.id)}
                            title={t('landlordSetupDeleteRoomType')}
                            disabled={isSaving}
                          >
                            <Trash2 className="w-4 h-4 text-danger" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Form.Section>

          {/* Section 5: Boarding House Amenities Configuration */}
          <Form.Section
            icon={<Sparkles className="w-4 h-4" />}
            title={t('landlordSettingsAmenitiesSection')}
            description={t('landlordSettingsAmenitiesDesc')}
            actions={
              <Chip size="sm" variant="primary" preventHover>
                {t('landlordSetupSection1bSelectedCount').replace('{count}', String(selectedAmenitiesCount))}
              </Chip>
            }
            divider
          >
            <div className="space-y-4">
              {/* Quick Add Amenity Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex-1">
                  <TextInput
                    value={newAmenityName}
                    onChange={e => setNewAmenityName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault()
                        handleAddAmenity()
                      }
                    }}
                    placeholder={t('landlordSetupSection1bAddPlaceholder')}
                    disabled={isSaving}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={handleAddAmenity}
                  disabled={!newAmenityName.trim() || isSaving}
                  className="self-end sm:self-auto shrink-0"
                >
                  {t('landlordSetupSection1bAddBtn')}
                </Button>
              </div>

              {/* Amenities Checkbox Grid */}
              {formData.amenities.length === 0 ? (
                <div className="p-8 rounded-2xl border border-dashed border-line text-center">
                  <Text as="p" size="sm" color="subtle">
                    {t('landlordSetupSection1bEmpty')}
                  </Text>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {formData.amenities.map(amenity => {
                    const label = getAmenityLabel(amenity)
                    return (
                      <Checkbox
                        key={amenity.id}
                        size="sm"
                        variant="card"
                        checked={amenity.checked}
                        onChange={() => handleToggleAmenity(amenity.id)}
                        disabled={isSaving}
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
                                handleRemoveAmenity(amenity.id)
                              }}
                              title={t('landlordSetupSection1bDelete')}
                              disabled={isSaving}
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
