'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Layers, Sparkles, CreditCard } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { Button, Form, Text } from '@/components/ui'
import {
  setupBoardingHouse,
  type SetupBoardingHousePayload,
  type SetupCustomRoomPayload,
  type SetupRoomTypePayload,
  type SetupServicePayload,
} from '@/services/boarding-house.service'
import {
  fetchProvinces,
  fetchWardsByProvince,
  type Province,
  type Ward,
  FALLBACK_PROVINCES,
} from '@/services/vietnam-address.service'
import type { SelectedMapAddress } from '@/components/landlord/MapAddressPicker'
import { userService } from '@/services/user.service'
import {
  StepperItem,
  Step1GeneralInfo,
  Step2ServicesAndRoomTypes,
  Step3BulkRoomsAndPreview,
  Step4BankAccount,
} from './components'
import {
  createId,
  MAX_FREE_TIER_ROOMS,
  type BankInfoState,
  type CustomRoomData,
  type GeneralInfoState,
  type RoomsConfigState,
  type RoomTypeItem,
  type ServiceItem,
  type WizardStep,
} from './types'

export default function SetupWizardPage() {
  const router = useRouter()
  const { buildings, selectBuilding, refreshBuildings, upgradeToLandlord } = useAuth()
  const t = useTranslations('landlord')

  // ─── WIZARD PROGRESS ─────────────────────────────────────────────────────────
  const [step, setStep] = useState<WizardStep>(1)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // ─── STEP 1 STATE: GENERAL INFO ──────────────────────────────────────────────
  const [info, setInfo] = useState<GeneralInfoState>({
    name: '',
    description: '',
    country: 'Việt Nam',
    province: '',
    city: '',
    ward: '',
    street: '',
    houseNumber: '',
    totalFloor: '3',
    builtAt: new Date().toISOString().slice(0, 10),
    thumbnail: '',
  })

  // Vietnam Administrative Address States
  const [provinces, setProvinces] = useState<Province[]>(FALLBACK_PROVINCES)
  const [selectedProvinceCode, setSelectedProvinceCode] = useState<number | null>(null)
  const [wards, setWards] = useState<Ward[]>([])
  const [isLoadingProvinces, setIsLoadingProvinces] = useState(false)
  const [isLoadingWards, setIsLoadingWards] = useState(false)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)

  // ─── STEP 2 STATE: SERVICES & ROOM TYPES ─────────────────────────────────────
  const [services, setServices] = useState<ServiceItem[]>(() => [
    {
      id: createId(),
      name: t('landlordSetupDefaultServiceElec'),
      unit: 'kWh',
      price: '3500',
      isMetered: true,
      autoApplied: true,
    },
    {
      id: createId(),
      name: t('landlordSetupDefaultServiceWater'),
      unit: 'm³',
      price: '25000',
      isMetered: true,
      autoApplied: true,
    },
    {
      id: createId(),
      name: t('landlordSetupDefaultServiceInternet'),
      unit: t('landlordSetupDefaultUnitMonth'),
      price: '100000',
      isMetered: false,
      autoApplied: true,
    },
  ])

  const [roomTypes, setRoomTypes] = useState<RoomTypeItem[]>(() => [
    {
      id: createId(),
      name: t('landlordSetupDefaultRoomTypeName'),
      description: t('landlordSetupDefaultRoomTypeDesc'),
    },
  ])

  // ─── STEP 3 STATE: BULK ROOM GENERATION ──────────────────────────────────────
  const [roomsConfig, setRoomsConfig] = useState<RoomsConfigState>({
    floorCount: 3,
    roomsPerFloor: 3,
    nameFormat: 'P{floor}0{index}',
    area: '22',
    maxOccupants: 2,
    roomTypeIndex: 0,
    serviceIndices: [0, 1, 2], // default apply initial services
  })

  // ─── STEP 3: INDIVIDUAL ROOM CUSTOMIZATION OVERRIDES ──────────────────────────
  const [roomOverrides, setRoomOverrides] = useState<Record<string, CustomRoomData>>({})

  // ─── STEP 4 STATE: BANK ACCOUNT (PAYOUT / VIETQR) ────────────────────────────
  const [bankInfo, setBankInfo] = useState<BankInfoState>({
    bankName: '',
    accountNumber: '',
    accountName: '',
  })

  const nameFormatPresets = useMemo(
    () => [
      { label: 'P{floor}0{index} (P101, P102...)', value: 'P{floor}0{index}' },
      { label: 'P{floor}{index} (P11, P12...)', value: 'P{floor}{index}' },
      { label: '{floor}0{index} (101, 102...)', value: '{floor}0{index}' },
      {
        label: `${t('landlordSetupPresetRoomPrefix')} {floor}0{index}`,
        value: `${t('landlordSetupPresetRoomPrefix')} {floor}0{index}`,
      },
    ],
    [t],
  )

  // Fetch existing bank account on mount to prefill Step 4
  useEffect(() => {
    let isMounted = true
    userService
      .getBankAccount()
      .then(res => {
        if (isMounted && res.bankAccount) {
          setBankInfo({
            bankName: res.bankAccount.bankName || '',
            accountNumber: res.bankAccount.accountNumber || '',
            accountName: res.bankAccount.accountName || '',
          })
        }
      })
      .catch(() => {
        // Silently ignore if user hasn't added bank account yet
      })

    return () => {
      isMounted = false
    }
  }, [])

  // Fetch Vietnam provinces on mount
  useEffect(() => {
    let isMounted = true
    setIsLoadingProvinces(true)
    fetchProvinces()
      .then(data => {
        if (isMounted && data.length > 0) {
          setProvinces(data)
        }
      })
      .catch(err => {
        console.error('Failed to load provinces:', err)
      })
      .finally(() => {
        if (isMounted) setIsLoadingProvinces(false)
      })

    return () => {
      isMounted = false
    }
  }, [])

  // When a user selects a province
  const handleProvinceSelect = async (provinceName: string) => {
    const prov = provinces.find(p => p.name === provinceName)
    setInfo(prev => ({
      ...prev,
      province: provinceName,
      city: provinceName,
      ward: '', // Reset ward when province changes
    }))

    if (!prov) {
      setSelectedProvinceCode(null)
      setWards([])
      return
    }

    setSelectedProvinceCode(prov.code)
    setIsLoadingWards(true)
    try {
      const wardList = await fetchWardsByProvince(prov.code)
      setWards(wardList)
    } catch (err) {
      console.error('Failed to fetch wards:', err)
      setWards([])
    } finally {
      setIsLoadingWards(false)
    }
  }

  // When a user picks address from Google Maps / Map picker
  const handleMapAddressSelect = async (selected: SelectedMapAddress) => {
    if (selected.province) {
      const prov = provinces.find(
        p =>
          p.name === selected.province ||
          p.name.includes(selected.province) ||
          selected.province.includes(p.name),
      )

      if (prov) {
        setSelectedProvinceCode(prov.code)
        setIsLoadingWards(true)
        try {
          const wardList = await fetchWardsByProvince(prov.code)
          setWards(wardList)

          // Find matching ward in wardList
          let matchedWard = selected.ward
          if (selected.ward) {
            const foundWard = wardList.find(
              w =>
                w.name === selected.ward ||
                w.name.includes(selected.ward) ||
                selected.ward.includes(w.name),
            )
            if (foundWard) matchedWard = foundWard.name
          }

          setInfo(prev => ({
            ...prev,
            province: prov.name,
            city: prov.name,
            ward: matchedWard || prev.ward,
            street: selected.street || prev.street,
            houseNumber: selected.houseNumber || prev.houseNumber,
          }))
        } catch (err) {
          console.error('Failed to fetch wards for map selection:', err)
        } finally {
          setIsLoadingWards(false)
        }
        return
      }
    }

    // Direct assignment if province wasn't matched
    setInfo(prev => ({
      ...prev,
      province: selected.province || prev.province,
      city: selected.province || prev.city,
      ward: selected.ward || prev.ward,
      street: selected.street || prev.street,
      houseNumber: selected.houseNumber || prev.houseNumber,
    }))
  }

  const updateInfo = (field: keyof GeneralInfoState, value: string) => {
    setInfo(prev => {
      const next = { ...prev, [field]: value }
      // Auto-sync floorCount in Step 3 if totalFloor changes
      if (field === 'totalFloor') {
        const parsed = parseInt(value, 10)
        if (!isNaN(parsed) && parsed > 0) {
          setRoomsConfig(rc => ({ ...rc, floorCount: parsed }))
        }
      }
      return next
    })
  }

  // ─── STEP 1 VALIDATION ───────────────────────────────────────────────────────
  const isStep1Valid = useMemo(() => {
    return Boolean(
      info.name.trim() &&
      info.houseNumber.trim() &&
      info.street.trim() &&
      info.ward.trim() &&
      info.province.trim() &&
      info.country.trim() &&
      info.builtAt,
    )
  }, [info])

  // ─── STEP 2 OPERATIONS & VALIDATION ──────────────────────────────────────────
  const addService = () => {
    setServices(prev => [
      ...prev,
      {
        id: createId(),
        name: '',
        unit: t('landlordSetupDefaultUnitMonth'),
        price: '0',
        isMetered: false,
        autoApplied: true,
      },
    ])
  }

  const updateService = (id: string, field: keyof SetupServicePayload, value: string | boolean) => {
    setServices(prev => prev.map(s => (s.id === id ? { ...s, [field]: value } : s)))
  }

  const removeService = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id))
  }

  const addRoomType = () => {
    setRoomTypes(prev => [
      ...prev,
      {
        id: createId(),
        name: '',
        description: '',
      },
    ])
  }

  const updateRoomType = (id: string, field: keyof SetupRoomTypePayload, value: string) => {
    setRoomTypes(prev => prev.map(rt => (rt.id === id ? { ...rt, [field]: value } : rt)))
  }

  const removeRoomType = (id: string) => {
    setRoomTypes(prev => prev.filter(rt => rt.id !== id))
  }

  const isStep2Valid = useMemo(() => {
    // Must have at least 1 room type with a valid name
    const validRoomTypes = roomTypes.filter(rt => rt.name.trim().length > 0)
    if (validRoomTypes.length === 0) return false

    // Any non-empty service must have name, unit, and valid price
    const hasInvalidService = services.some(s => {
      if (!s.name.trim() && !s.price.trim()) return false
      const validPrice = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/.test(s.price.trim())
      return !s.name.trim() || !s.unit.trim() || !validPrice
    })

    return !hasInvalidService
  }, [roomTypes, services])

  // ─── STEP 4 VALIDATION ───────────────────────────────────────────────────────
  const isStep4Valid = useMemo(() => {
    const cleanAcc = bankInfo.accountNumber.trim().replace(/\s/g, '')
    return Boolean(
      bankInfo.bankName.trim() &&
      cleanAcc.length >= 6 &&
      cleanAcc.length <= 25 &&
      bankInfo.accountName.trim(),
    )
  }, [bankInfo])

  // ─── STEP 3 PREVIEW & QUOTA CALCULATION ──────────────────────────────────────
  const totalRoomsToCreate = useMemo(() => {
    const floors = Math.max(1, roomsConfig.floorCount)
    const perFloor = Math.max(1, roomsConfig.roomsPerFloor)
    return floors * perFloor
  }, [roomsConfig.floorCount, roomsConfig.roomsPerFloor])

  const isQuotaExceeded = totalRoomsToCreate > MAX_FREE_TIER_ROOMS

  const computeDefaultRoomCode = (
    floor: number,
    index: number,
    format = roomsConfig.nameFormat,
  ) => {
    return format.replace(/\{floor\}/g, String(floor)).replace(/\{index\}/g, String(index))
  }

  // ─── SUBMISSION (ATOMIC) ─────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setErrorMessage(null)

    if (isQuotaExceeded) {
      setErrorMessage(
        t('landlordSetupErrorQuotaExceeded')
          .replace('{total}', String(totalRoomsToCreate))
          .replace('{max}', String(MAX_FREE_TIER_ROOMS)),
      )
      return
    }

    if (!isStep4Valid) {
      setErrorMessage(t('landlordSetupBankErrorRequired'))
      setStep(4)
      return
    }

    const cleanedRoomTypes = roomTypes
      .filter(rt => rt.name.trim().length > 0)
      .map(rt => ({
        name: rt.name.trim(),
        description: rt.description?.trim() || undefined,
      }))

    if (cleanedRoomTypes.length === 0) {
      setErrorMessage(t('landlordSetupErrorNoRoomType'))
      setStep(2)
      return
    }

    const cleanedServices = services
      .filter(s => s.name.trim().length > 0)
      .map(s => ({
        name: s.name.trim(),
        price: s.price.trim() || '0',
        unit: s.unit.trim(),
        isMetered: Boolean(s.isMetered),
        autoApplied: Boolean(s.autoApplied),
      }))

    const safeRoomTypeIndex = Math.min(
      Math.max(0, roomsConfig.roomTypeIndex),
      cleanedRoomTypes.length - 1,
    )

    const safeServiceIndices = roomsConfig.serviceIndices.filter(
      idx => idx >= 0 && idx < cleanedServices.length,
    )

    const hasAnyCustomRoom = Object.keys(roomOverrides).length > 0
    let customRoomsPayload: SetupCustomRoomPayload[] | undefined = undefined

    if (hasAnyCustomRoom) {
      customRoomsPayload = []
      for (let f = 1; f <= roomsConfig.floorCount; f++) {
        for (let i = 1; i <= roomsConfig.roomsPerFloor; i++) {
          const key = `${f}-${i}`
          const override = roomOverrides[key]
          if (override) {
            const overrideRoomTypeIndex = Math.min(
              Math.max(0, override.roomTypeIndex),
              cleanedRoomTypes.length - 1,
            )
            const overrideServiceIndices = override.serviceIndices.filter(
              idx => idx >= 0 && idx < cleanedServices.length,
            )
            customRoomsPayload.push({
              floor: f,
              index: i,
              roomNumber: override.roomNumber.trim() || computeDefaultRoomCode(f, i),
              area: override.area.trim() || undefined,
              maxOccupants: override.maxOccupants || undefined,
              roomTypeIndex: overrideRoomTypeIndex,
              serviceIndices: overrideServiceIndices,
            })
          } else {
            customRoomsPayload.push({
              floor: f,
              index: i,
              roomNumber: computeDefaultRoomCode(f, i),
              area: roomsConfig.area.trim() || undefined,
              maxOccupants: roomsConfig.maxOccupants || undefined,
              roomTypeIndex: safeRoomTypeIndex,
              serviceIndices: safeServiceIndices,
            })
          }
        }
      }
    }

    const payload: SetupBoardingHousePayload = {
      name: info.name.trim(),
      description: info.description.trim() || undefined,
      houseNumber: info.houseNumber.trim(),
      street: info.street.trim(),
      ward: info.ward.trim(),
      district: 'N/A', // District deleted from UI, sending placeholder to satisfy backend @Matches(/\S/)
      province: info.province.trim(),
      city: info.city.trim() || info.province.trim() || undefined,
      country: info.country.trim() || t('landlordSetupCountryDefault'),
      totalFloor: info.totalFloor ? parseInt(info.totalFloor, 10) : undefined,
      builtAt: info.builtAt,
      thumbnail: info.thumbnail.trim() || undefined,
      services: cleanedServices,
      roomTypes: cleanedRoomTypes,
      rooms: {
        floorCount: roomsConfig.floorCount,
        roomsPerFloor: roomsConfig.roomsPerFloor,
        nameFormat: roomsConfig.nameFormat.trim(),
        area: roomsConfig.area.trim() || undefined,
        maxOccupants: roomsConfig.maxOccupants || undefined,
        roomTypeIndex: safeRoomTypeIndex,
        serviceIndices: safeServiceIndices,
        customRooms: customRoomsPayload,
      },
      bankAccount: {
        bankName: bankInfo.bankName.trim(),
        accountNumber: bankInfo.accountNumber.trim().replace(/\s/g, ''),
        accountName: bankInfo.accountName.trim().toUpperCase(),
      },
    }

    setIsSubmitting(true)
    try {
      const result = await setupBoardingHouse(payload)
      const newHouse = result.boardingHouse

      // Also ensure bank account is upserted to user profile cache
      await userService
        .upsertBankAccount({
          bankName: bankInfo.bankName.trim(),
          accountNumber: bankInfo.accountNumber.trim().replace(/\s/g, ''),
          accountName: bankInfo.accountName.trim().toUpperCase(),
        })
        .catch(() => {
          // Silently ignore if already saved by setupBoardingHouse
        })

      // Update Auth context with newly created property and promote role
      if (newHouse?.id) {
        const fullAddress = [
          newHouse.houseNumber,
          newHouse.street,
          newHouse.ward,
          newHouse.province,
        ]
          .filter(Boolean)
          .join(', ')

        upgradeToLandlord({
          houseName: newHouse.name,
          houseAddress: fullAddress,
        })

        await refreshBuildings()
        selectBuilding(newHouse.id)
      }

      // Granted dashboard access upon successful creation -> navigate to landlord overview
      router.push('/landlord')
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('landlordSetupErrorGeneric')
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    if (buildings.length > 0) {
      router.push('/landlord')
    } else {
      router.push('/')
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 py-6 pb-20 px-4 sm:px-6">
      {/* ─── HEADER & STEPPER ───────────────────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <Text as="h1" size="2xl" weight="black" className="mt-2 sm:text-3xl tracking-tight">
              {t('landlordSetupTitle')}
            </Text>
            <Text as="p" size="sm" color="secondary" weight="medium" className="mt-1">
              {t('landlordSetupSubtitle')}
            </Text>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancel}
            className="self-start sm:self-auto text-xs font-bold text-zinc-500 hover:text-zinc-800"
          >
            {t('landlordSetupCancel')}
          </Button>
        </div>

        {/* Wizard Stepper Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 pt-2">
          <StepperItem
            stepNumber={1}
            currentStep={step}
            stepLabel={t('landlordSetupStepNumber')}
            title={t('landlordSetupStep1Title')}
            desc={t('landlordSetupStep1Desc')}
            icon={<Building2 className="w-4 h-4" />}
            onClick={() => step > 1 && setStep(1)}
          />
          <StepperItem
            stepNumber={2}
            currentStep={step}
            stepLabel={t('landlordSetupStepNumber')}
            title={t('landlordSetupStep2Title')}
            desc={t('landlordSetupStep2Desc')}
            icon={<Layers className="w-4 h-4" />}
            onClick={() => {
              if (step > 2 || isStep1Valid) setStep(2)
            }}
          />
          <StepperItem
            stepNumber={3}
            currentStep={step}
            stepLabel={t('landlordSetupStepNumber')}
            title={t('landlordSetupStep3Title')}
            desc={t('landlordSetupStep3Desc')}
            icon={<Sparkles className="w-4 h-4" />}
            onClick={() => {
              if (isStep1Valid && isStep2Valid) setStep(3)
            }}
          />
          <StepperItem
            stepNumber={4}
            currentStep={step}
            stepLabel={t('landlordSetupStepNumber')}
            title={t('landlordSetupStep4Title')}
            desc={t('landlordSetupStep4Desc')}
            icon={<CreditCard className="w-4 h-4" />}
            onClick={() => {
              if (isStep1Valid && isStep2Valid && !isQuotaExceeded && totalRoomsToCreate >= 1)
                setStep(4)
            }}
          />
        </div>
      </div>

      {/* Global Error Banner */}
      {errorMessage && (
        <Form.Alert
          variant="error"
          title={t('landlordSetupErrorTitle')}
          message={errorMessage}
          onClose={() => setErrorMessage(null)}
        />
      )}

      {/* ─── STEP 1: GENERAL PROPERTY INFORMATION ────────────────────────────── */}
      {step === 1 && (
        <Step1GeneralInfo
          info={info}
          onUpdateInfo={updateInfo}
          provinces={provinces}
          isLoadingProvinces={isLoadingProvinces}
          selectedProvinceCode={selectedProvinceCode}
          wards={wards}
          isLoadingWards={isLoadingWards}
          onProvinceSelect={handleProvinceSelect}
          onMapAddressSelect={handleMapAddressSelect}
          onThumbnailFileChange={file => setThumbnailFile(file)}
          isValid={isStep1Valid}
          onNext={() => setStep(2)}
          onCancel={handleCancel}
        />
      )}

      {/* ─── STEP 2: SERVICES & ROOM TYPES ──────────────────────────────────── */}
      {step === 2 && (
        <Step2ServicesAndRoomTypes
          services={services}
          onAddService={addService}
          onUpdateService={updateService}
          onRemoveService={removeService}
          roomTypes={roomTypes}
          onAddRoomType={addRoomType}
          onUpdateRoomType={updateRoomType}
          onRemoveRoomType={removeRoomType}
          isValid={isStep2Valid}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {/* ─── STEP 3: BULK GENERATE ROOMS & PREVIEW ─────────────────────────── */}
      {step === 3 && (
        <Step3BulkRoomsAndPreview
          roomsConfig={roomsConfig}
          onChangeRoomsConfig={setRoomsConfig}
          roomOverrides={roomOverrides}
          onSetRoomOverrides={setRoomOverrides}
          roomTypes={roomTypes}
          services={services}
          totalRoomsToCreate={totalRoomsToCreate}
          isQuotaExceeded={isQuotaExceeded}
          nameFormatPresets={nameFormatPresets}
          isSubmitting={isSubmitting}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {/* ─── STEP 4: BANK ACCOUNT INFORMATION (PAYOUT / VIETQR) ──────────────── */}
      {step === 4 && (
        <Step4BankAccount
          bankInfo={bankInfo}
          onChangeBankInfo={setBankInfo}
          isValid={isStep4Valid}
          isSubmitting={isSubmitting}
          onBack={() => setStep(3)}
          onSubmit={handleSubmit}
        />
      )}
    </div>
  )
}
