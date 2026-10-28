'use client'

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useTransition,
} from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { getRooms, RoomItem } from '@/services/room.service'
import {
  getPendingPlatformDeposit,
  searchTenantByPhone,
  createPlatformContract,
  createDirectContract,
  PendingDepositResponse,
} from '@/services/contract.service'
import { getRoomOccupants, RoomOccupantDto } from '@/services/tenant.service'
import { uploadImageToBackend } from '@/services/upload.service'
import { ToastItem, ToastType } from '@/components/ui'
import {
  ContractStep,
  ContractFlowType,
  TenantIdentificationState,
  ContractCreateContextValue,
  HandoverMeterReadingItem,
} from '../types'

/**
 * Formats JSON address or string to readable text
 */
export function formatAddress(val: any): string {
  if (!val) return ''
  if (typeof val === 'string') return val
  if (typeof val === 'object') {
    if (val.address) return String(val.address)
    return Object.values(val)
      .filter(v => typeof v === 'string' && v.trim())
      .join(', ')
  }
  return String(val)
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const ContractCreateContext = createContext<ContractCreateContextValue | null>(null)

export function useContractCreate() {
  const context = useContext(ContractCreateContext)
  if (!context) {
    throw new Error('useContractCreate must be used within a ContractCreateProvider')
  }
  return context
}

export function ContractCreateProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')

  // Read initial params
  const stepParam = searchParams.get('step')
  const initialStep: ContractStep = stepParam === '2' ? 2 : stepParam === '3' ? 3 : 1
  const initialRoomId = searchParams.get('roomId') || ''

  // Current active step
  const [step, setStepState] = useState<ContractStep>(initialStep)
  const [isPending, startTransition] = useTransition()

  // Sync step with browser Back / Forward buttons without Next.js router re-fetch
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search)
      const rawStep = params.get('step')
      const parsedStep: ContractStep = rawStep === '2' ? 2 : rawStep === '3' ? 3 : 1
      setStepState(parsedStep)
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Toast notifications
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Date.now().toString()
      setToasts(prev => [...prev, { id, message, type, title, duration: 4000 }])
    },
    [],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(tItem => tItem.id !== id))
  }, [])

  // Rooms list & loading
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // Form State
  const [selectedRoomId, setSelectedRoomIdState] = useState(initialRoomId)
  const [flowType, setFlowType] = useState<ContractFlowType>('direct')
  const [pendingDeposit, setPendingDeposit] = useState<PendingDepositResponse | null>(null)
  const [isCheckingDeposit, setIsCheckingDeposit] = useState(false)

  // Room Occupants (Room-First Contract Creation)
  const [roomOccupants, setRoomOccupants] = useState<RoomOccupantDto[]>([])
  const [isLoadingOccupants, setIsLoadingOccupants] = useState(false)
  const [selectedOccupantId, setSelectedOccupantIdState] = useState('')
  const [isAddOccupantModalOpen, setIsAddOccupantModalOpen] = useState(false)
  const [occupantHasAccount, setOccupantHasAccount] = useState(true)

  // Tenant Fields
  const [tenantPhone, setTenantPhone] = useState('')
  const [tenantFullName, setTenantFullName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [tenantFound, setTenantFound] = useState<boolean | null>(null)
  const [hasIdentification, setHasIdentification] = useState(false)

  // Initial Handover Meter Readings
  const [initialMeterReadings, setInitialMeterReadings] = useState<HandoverMeterReadingItem[]>([])

  const updateInitialMeterReading = useCallback(
    (serviceId: string, updates: Partial<HandoverMeterReadingItem>) => {
      setInitialMeterReadings(prev =>
        prev.map(item => (item.serviceId === serviceId ? { ...item, ...updates } : item)),
      )
      setIsDirty(true)
    },
    [],
  )

  // Identification (CCCD) Fields
  const [identification, setIdentification] = useState<TenantIdentificationState>({
    identityNumber: '',
    fullName: '',
    dateOfBirth: '2000-01-01',
    gender: 'male',
    nationality: 'Việt Nam',
    placeOfOrigin: '',
    placeOfResidence: '',
    issueDate: '',
    expiryDate: '',
    note: '',
    cardFrontUrl: '',
    cardBackUrl: '',
  })

  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)
  const [isDraggingFront, setIsDraggingFront] = useState(false)
  const [isDraggingBack, setIsDraggingBack] = useState(false)
  const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string } | null>(
    null,
  )

  const selectedOccupant = roomOccupants.find(
    o => o.tenantId === selectedOccupantId || o.id === selectedOccupantId,
  )

  // Landlord can edit tenant info if direct flow AND (tenant has no ID on file OR user has no registered account)
  const canEditTenantInfo =
    flowType !== 'platform' &&
    !!selectedOccupant &&
    (!hasIdentification || selectedOccupant.tenant?.hasAccount === false)

  const applyOccupantSelection = useCallback((occupant: RoomOccupantDto) => {
    if (!occupant) return
    const actualOccupant = (occupant as any)?.data || occupant
    const tenant = actualOccupant.tenant || actualOccupant
    const id = actualOccupant.tenantId || actualOccupant.id || ''

    setSelectedOccupantIdState(id)
    setTenantPhone(tenant?.phoneNumber || '')
    setTenantFullName(tenant?.fullName || '')
    setTenantEmail(tenant?.email || '')
    setTenantFound(true)
    const hasId = !!tenant?.identityNumber
    setHasIdentification(hasId)
    setOccupantHasAccount(tenant?.hasAccount ?? true)

    let dob = '2000-01-01'
    if (tenant?.dateOfBirth) {
      try {
        dob = new Date(tenant.dateOfBirth).toISOString().split('T')[0]
      } catch {
        dob = '2000-01-01'
      }
    }

    setIdentification({
      identityNumber: tenant?.identityNumber || '',
      fullName: tenant?.fullName || '',
      dateOfBirth: dob,
      gender: tenant?.gender === 'female' ? 'female' : 'male',
      nationality: 'Việt Nam',
      placeOfOrigin: formatAddress(tenant?.placeOfResidence),
      placeOfResidence: formatAddress(tenant?.placeOfResidence),
      issueDate: '',
      expiryDate: '',
      note: actualOccupant.note || '',
      cardFrontUrl: tenant?.cardFrontUrl || '',
      cardBackUrl: tenant?.cardBackUrl || '',
    })
  }, [])

  const fetchRoomOccupants = useCallback(
    async (roomId: string) => {
      if (
        !activeBuilding?.id ||
        !UUID_REGEX.test(activeBuilding.id) ||
        !roomId ||
        !UUID_REGEX.test(roomId)
      ) {
        setRoomOccupants([])
        setSelectedOccupantIdState('')
        return
      }

      setIsLoadingOccupants(true)
      try {
        const rawOccupants = await getRoomOccupants(activeBuilding.id, roomId)
        const occupants = Array.isArray(rawOccupants)
          ? rawOccupants
          : (rawOccupants as any)?.data || []
        const activeOccs = (occupants || []).filter(
          (o: any) => o.status === 'active' || !o.status,
        )
        setRoomOccupants(activeOccs)
        if (activeOccs.length > 0) {
          applyOccupantSelection(activeOccs[0])
        } else {
          setSelectedOccupantIdState('')
          setTenantPhone('')
          setTenantFullName('')
          setTenantEmail('')
          setTenantFound(null)
          setHasIdentification(false)
          setIdentification({
            identityNumber: '',
            fullName: '',
            dateOfBirth: '2000-01-01',
            gender: 'male',
            nationality: 'Việt Nam',
            placeOfOrigin: '',
            placeOfResidence: '',
            issueDate: '',
            expiryDate: '',
            note: '',
            cardFrontUrl: '',
            cardBackUrl: '',
          })
        }
      } catch (err) {
        console.warn('Failed to load room occupants:', err)
        setRoomOccupants([])
        setSelectedOccupantIdState('')
      } finally {
        setIsLoadingOccupants(false)
      }
    },
    [activeBuilding?.id, applyOccupantSelection],
  )

  const setSelectedOccupantId = useCallback(
    (tenantId: string) => {
      setSelectedOccupantIdState(tenantId)
      setIsDirty(true)
      const occ = roomOccupants.find(o => o.tenantId === tenantId || o.id === tenantId)
      if (occ) {
        applyOccupantSelection(occ)
      }
    },
    [applyOccupantSelection, roomOccupants],
  )

  const handleOccupantAdded = useCallback(
    (rawOccupant: RoomOccupantDto) => {
      const newOccupant = (rawOccupant as any)?.data || rawOccupant
      setRoomOccupants(prev => {
        const existing = prev.filter(
          o => o.id !== newOccupant.id && o.tenantId !== newOccupant.tenantId,
        )
        return [newOccupant, ...existing]
      })
      applyOccupantSelection(newOccupant)
      setIsAddOccupantModalOpen(false)
      setErrorMessage(null)
      showToast(t('landlordCustomerAddSuccess') || 'Thêm khách thuê thành công!', 'success')
    },
    [applyOccupantSelection, showToast, t],
  )

  // Terms & Financials
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0])
  const [endDate, setEndDate] = useState(
    new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
  )
  const [rentPrice, setRentPrice] = useState<number>(3500000)
  const [depositAmount, setDepositAmount] = useState<number>(3500000)
  const [monthlyPaymentDate, setMonthlyPaymentDate] = useState<number>(5)
  const [rentPaymentCycle, setRentPaymentCycle] = useState<number>(1)
  const [note, setNote] = useState('')

  // UI status & Dirty tracking (Rule 10)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  const setIdentificationField = useCallback(
    <K extends keyof TenantIdentificationState>(field: K, val: TenantIdentificationState[K]) => {
      setIdentification(prev => ({ ...prev, [field]: val }))
      setIsDirty(true)
    },
    [],
  )

  const setCardFrontUrl = useCallback((url: string) => {
    setIdentification(prev => ({ ...prev, cardFrontUrl: url }))
    setIsDirty(true)
  }, [])

  const setCardBackUrl = useCallback((url: string) => {
    setIdentification(prev => ({ ...prev, cardBackUrl: url }))
    setIsDirty(true)
  }, [])

  // Update selected room and preserve roomId param in URL without Next.js route re-fetch flicker
  const setSelectedRoomId = useCallback((id: string) => {
    setSelectedRoomIdState(id)
    setIsDirty(true)

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (id) {
        params.set('roomId', id)
      } else {
        params.delete('roomId')
      }
      window.history.replaceState(null, '', `?${params.toString()}`)
    }
  }, [])

  // Load rooms for the active building
  useEffect(() => {
    async function loadRooms() {
      if (!activeBuilding?.id || !UUID_REGEX.test(activeBuilding.id)) {
        setRooms([])
        return
      }

      setIsLoadingRooms(true)
      try {
        const res = await getRooms(activeBuilding.id, { limit: 100 })
        if (res?.data && res.data.length > 0) {
          setRooms(res.data)
        } else {
          setRooms([])
        }
      } catch (err) {
        console.warn('Failed to load rooms from API:', err)
        setRooms([])
      } finally {
        setIsLoadingRooms(false)
      }
    }
    loadRooms()
  }, [activeBuilding?.id])

  // Check deposit whenever room selection changes and load room occupants
  useEffect(() => {
    async function checkDepositAndOccupants() {
      if (!selectedRoomId || !activeBuilding?.id) {
        setPendingDeposit(null)
        setFlowType('direct')
        setRoomOccupants([])
        setSelectedOccupantIdState('')
        return
      }

      // Skip API if building or room is not a UUID
      if (!UUID_REGEX.test(activeBuilding.id) || !UUID_REGEX.test(selectedRoomId)) {
        setPendingDeposit(null)
        setFlowType('direct')
        setRoomOccupants([])
        setSelectedOccupantIdState('')
        return
      }

      setIsCheckingDeposit(true)
      try {
        const res = await getPendingPlatformDeposit(activeBuilding.id, selectedRoomId)
        if (res?.data) {
          // Flow A detected!
          setPendingDeposit(res.data)
          setFlowType('platform')
          setDepositAmount(res.data.amount)
          if (res.data.tenant) {
            setTenantPhone(res.data.tenant.phoneNumber || '')
            setTenantFullName(res.data.tenant.fullName || '')
            setTenantEmail(res.data.tenant.email || '')
            setTenantFound(true)
            setHasIdentification(!!res.data.tenant.userIdentification)
            if (res.data.tenant.userIdentification) {
              const id = res.data.tenant.userIdentification
              let dob = '2000-01-01'
              if (id.dateOfBirth) {
                try {
                  dob = new Date(id.dateOfBirth).toISOString().split('T')[0]
                } catch {
                  dob = '2000-01-01'
                }
              }
              let issDate = ''
              if (id.issueDate) {
                try {
                  issDate = new Date(id.issueDate).toISOString().split('T')[0]
                } catch {
                  issDate = ''
                }
              }
              let expDate = ''
              if (id.expiryDate) {
                try {
                  expDate = new Date(id.expiryDate).toISOString().split('T')[0]
                } catch {
                  expDate = ''
                }
              }

              setIdentification({
                identityNumber: id.identityNumber || '',
                fullName: id.fullName || res.data.tenant.fullName || '',
                dateOfBirth: dob,
                gender: id.gender === 'female' ? 'female' : 'male',
                nationality: id.nationnality || id.nationality || 'Việt Nam',
                placeOfOrigin: formatAddress(id.placeOfOrigin),
                placeOfResidence: formatAddress(id.placeOfResidence),
                issueDate: issDate,
                expiryDate: expDate,
                note: id.note || '',
                cardFrontUrl: id.cardFrontUrl || '',
                cardBackUrl: id.cardBackUrl || '',
              })
            }
          }
        } else {
          // Flow B
          setPendingDeposit(null)
          setFlowType('direct')
          await fetchRoomOccupants(selectedRoomId)
        }
      } catch (err) {
        console.warn('Check deposit failed or none present, defaulting to direct flow:', err)
        setPendingDeposit(null)
        setFlowType('direct')
        await fetchRoomOccupants(selectedRoomId)
      } finally {
        setIsCheckingDeposit(false)
      }
    }
    checkDepositAndOccupants()
  }, [selectedRoomId, activeBuilding?.id, fetchRoomOccupants])

  // Handle phone change & auto-reset
  const handlePhoneChange = useCallback(
    (val: string) => {
      const cleanVal = val.replace(/\D/g, '').slice(0, 10)
      setTenantPhone(cleanVal)
      setIsDirty(true)

      // Reset tenant search status & fields if phone changed
      if (tenantFound !== null) {
        setTenantFound(null)
        setTenantFullName('')
        setTenantEmail('')
        setHasIdentification(false)
        setIdentification({
          identityNumber: '',
          fullName: '',
          dateOfBirth: '2000-01-01',
          gender: 'male',
          nationality: 'Việt Nam',
          placeOfOrigin: '',
          placeOfResidence: '',
          issueDate: '',
          expiryDate: '',
          note: '',
          cardFrontUrl: '',
          cardBackUrl: '',
        })
      }

      if (cleanVal.length === 10) {
        handleSearchPhone(cleanVal)
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tenantFound],
  )

  // Handle phone search debounce / action
  const handleSearchPhone = useCallback(async (phoneToSearch: string) => {
    const cleanPhone = phoneToSearch.replace(/\D/g, '')
    if (!cleanPhone || cleanPhone.length !== 10) return
    setIsSearchingPhone(true)
    setErrorMessage(null)
    try {
      const res = await searchTenantByPhone(cleanPhone)
      if (res?.data?.exists && res.data.user) {
        setTenantFound(true)
        setTenantFullName(res.data.user.fullName || '')
        setTenantEmail(res.data.user.email || '')
        setHasIdentification(res.data.user.hasIdentification)
        if (res.data.user.identification) {
          const id = res.data.user.identification
          let dob = '2000-01-01'
          if (id.dateOfBirth) {
            try {
              dob = new Date(id.dateOfBirth).toISOString().split('T')[0]
            } catch {
              dob = '2000-01-01'
            }
          }
          let issDate = ''
          if (id.issueDate) {
            try {
              issDate = new Date(id.issueDate).toISOString().split('T')[0]
            } catch {
              issDate = ''
            }
          }
          let expDate = ''
          if (id.expiryDate) {
            try {
              expDate = new Date(id.expiryDate).toISOString().split('T')[0]
            } catch {
              expDate = ''
            }
          }

          setIdentification({
            identityNumber: id.identityNumber || '',
            fullName: id.fullName || res.data.user.fullName || '',
            dateOfBirth: dob,
            gender: id.gender === 'female' ? 'female' : 'male',
            nationality: id.nationnality || id.nationality || 'Việt Nam',
            placeOfOrigin: formatAddress(id.placeOfOrigin),
            placeOfResidence: formatAddress(id.placeOfResidence),
            issueDate: issDate,
            expiryDate: expDate,
            note: id.note || '',
            cardFrontUrl: id.cardFrontUrl || '',
            cardBackUrl: id.cardBackUrl || '',
          })
        } else {
          setIdentification({
            identityNumber: '',
            fullName: '',
            dateOfBirth: '2000-01-01',
            gender: 'male',
            nationality: 'Việt Nam',
            placeOfOrigin: '',
            placeOfResidence: '',
            issueDate: '',
            expiryDate: '',
            note: '',
            cardFrontUrl: '',
            cardBackUrl: '',
          })
        }
      } else {
        setTenantFound(false)
        setHasIdentification(false)
        setTenantFullName('')
        setTenantEmail('')
        setIdentification({
          identityNumber: '',
          fullName: '',
          dateOfBirth: '2000-01-01',
          gender: 'male',
          nationality: 'Việt Nam',
          placeOfOrigin: '',
          placeOfResidence: '',
          issueDate: '',
          expiryDate: '',
          note: '',
          cardFrontUrl: '',
          cardBackUrl: '',
        })
      }
    } catch (err) {
      console.error('Search tenant failed:', err)
      setTenantFound(false)
      setHasIdentification(false)
    } finally {
      setIsSearchingPhone(false)
    }
  }, [])

  // Helper to compress citizen ID photos before saving
  const compressImageFile = useCallback((file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = readerEvent => {
        const img = new window.Image()
        img.onload = () => {
          const maxDim = 1600
          let { width, height } = img
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.85))
          } else {
            resolve((readerEvent.target?.result as string) || '')
          }
        }
        img.src = readerEvent.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }, [])

  const handlePhotoUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
      const file = e.target.files?.[0]
      if (!file) return

      // Reset the file input so user can re-select the same file if needed
      e.target.value = ''

      if (!file.type.startsWith('image/')) {
        setErrorMessage(t('landlordContractsCreateErrImageFormat'))
        return
      }

      if (file.size > 10 * 1024 * 1024) {
        setErrorMessage(t('landlordContractsCreateErrImageSize'))
        return
      }

      const setUploading = side === 'front' ? setUploadingFront : setUploadingBack
      const setUrl = side === 'front' ? setCardFrontUrl : setCardBackUrl

      setUploading(true)
      try {
        const compressedDataUrl = await compressImageFile(file)
        setUrl(compressedDataUrl)
        setIsDirty(true)

        // Delegate upload to backend! Backend handles Cloudinary storage
        try {
          const res = await uploadImageToBackend(compressedDataUrl, 'dormio/identifications')
          if (res?.url) {
            setUrl(res.url)
          }
        } catch (cloudErr) {
          console.warn('Backend upload deferred to form submission:', cloudErr)
        }
      } catch (err: any) {
        console.error('Error processing image:', err)
        setErrorMessage(t('landlordContractsCreateErrImageProcess'))
      } finally {
        setUploading(false)
      }
    },
    [compressImageFile, setCardBackUrl, setCardFrontUrl, t],
  )

  const handleDropFile = useCallback(
    (e: React.DragEvent, side: 'front' | 'back') => {
      e.preventDefault()
      e.stopPropagation()
      if (side === 'front') setIsDraggingFront(false)
      else setIsDraggingBack(false)

      if (!canEditTenantInfo) return

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const fakeEvent = {
          target: {
            files: e.dataTransfer.files,
            value: '',
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        handlePhotoUpload(fakeEvent, side)
      }
    },
    [canEditTenantInfo, handlePhotoUpload],
  )

  const selectedRoomObj = rooms.find(r => r.id === selectedRoomId)

  useEffect(() => {
    if (!selectedRoomObj) {
      setInitialMeterReadings([])
      return
    }
    const meteredServices = selectedRoomObj.services?.filter(s => s.isMetered) || []
    setInitialMeterReadings(prev => {
      return meteredServices.map(s => {
        const existing = prev.find(p => p.serviceId === s.id)
        return {
          serviceId: s.id,
          serviceName: s.name,
          unit: s.unit || '',
          readingValue: existing ? existing.readingValue : '',
          imageUrl: existing?.imageUrl || null,
        }
      })
    })
  }, [selectedRoomObj])

  // Step 1 Validation
  const handleStep1Next = useCallback((): boolean => {
    if (!selectedRoomId) {
      setErrorMessage(t('landlordContractsCreateErrSelectRoom'))
      return false
    }
    if (flowType === 'direct') {
      if (roomOccupants.length === 0) {
        const roomNum = selectedRoomObj?.roomNumber || ''
        setErrorMessage(
          t('landlordContractRoomEmptyWarning', { room: roomNum }) ||
            `Phòng trọ ${roomNum} chưa có người thuê. Vui lòng thêm người thuê vào phòng để tạo hợp đồng.`,
        )
        return false
      }
      if (!selectedOccupantId) {
        setErrorMessage(
          t('landlordContractSelectOccupantPlaceholder') ||
            'Vui lòng chọn người thuê trong phòng để lập hợp đồng.',
        )
        return false
      }
      if (!tenantPhone || tenantPhone.length !== 10) {
        setErrorMessage(t('landlordContractsCreateErrPhone10Digits'))
        return false
      }
      if (canEditTenantInfo) {
        if (!tenantFullName.trim()) {
          setErrorMessage(t('landlordContractsCreateErrTenantInfo'))
          return false
        }
        if (
          !identification.identityNumber.trim() ||
          !identification.placeOfOrigin.trim() ||
          !identification.placeOfResidence.trim() ||
          !identification.dateOfBirth
        ) {
          setErrorMessage(t('landlordContractsCreateErrIdentification'))
          return false
        }
      }
    }
    setErrorMessage(null)
    return true
  }, [
    canEditTenantInfo,
    flowType,
    identification,
    roomOccupants.length,
    selectedOccupantId,
    selectedRoomId,
    selectedRoomObj?.roomNumber,
    t,
    tenantFullName,
    tenantPhone,
  ])

  // Step 2 Validation
  const handleStep2Next = useCallback((): boolean => {
    if (!startDate || !endDate) {
      setErrorMessage(t('landlordContractsCreateStartDateLabel'))
      return false
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setErrorMessage(t('landlordContractsCreateEndDateLabel'))
      return false
    }
    setErrorMessage(null)
    return true
  }, [endDate, startDate, t])

  // Navigation: Go to step with URL synchronization (instant client transition, no Suspense flicker)
  const goToStep = useCallback(
    (targetStep: ContractStep) => {
      if (targetStep === 2) {
        const ok = handleStep1Next()
        if (!ok) return
      } else if (targetStep === 3) {
        const ok1 = handleStep1Next()
        if (!ok1) return
        const ok2 = handleStep2Next()
        if (!ok2) return
      }

      setErrorMessage(null)
      setStepState(targetStep)

      if (typeof window !== 'undefined') {
        const params = new URLSearchParams(window.location.search)
        params.set('step', String(targetStep))
        window.history.pushState(null, '', `?${params.toString()}`)
        window.scrollTo({ top: 0, behavior: 'instant' })
      }
    },
    [handleStep1Next, handleStep2Next],
  )

  // Step Guard: If user lands on ?step=2 or ?step=3 directly without selecting room
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const rawStep = params.get('step')
      if ((rawStep === '2' || rawStep === '3') && !selectedRoomId) {
        params.set('step', '1')
        window.history.replaceState(null, '', `?${params.toString()}`)
        setStepState(1)
      }
    }
  }, [selectedRoomId])

  // Rule 10: Modal / Form Close Handling with custom Confirmation Modal
  const handleAttemptClose = useCallback(() => {
    if (isDirty) {
      setShowConfirmClose(true)
    } else {
      router.push('/landlord/contracts')
    }
  }, [isDirty, router])

  const handleConfirmClose = useCallback(() => {
    setShowConfirmClose(false)
    router.push('/landlord/contracts')
  }, [router])

  // Form Submission
  const handleSubmitContract = useCallback(async () => {
    if (!selectedRoomId) {
      const msg = t('landlordContractsCreateErrSelectRoom')
      setErrorMessage(msg)
      showToast(msg, 'error')
      goToStep(1)
      return
    }

    if (!activeBuilding?.id) {
      const msg = t('landlordContractsCreateErrNoBuilding')
      setErrorMessage(msg)
      showToast(msg, 'error')
      return
    }

    setErrorMessage(null)

    startTransition(async () => {
      try {
        const isRealApi = UUID_REGEX.test(activeBuilding.id) && UUID_REGEX.test(selectedRoomId)

        if (isRealApi) {
          if (flowType === 'platform') {
            // Flow A submission
            const formattedInitialReadings = initialMeterReadings
              .filter(r => r.readingValue !== '' && !isNaN(Number(r.readingValue)))
              .map(r => ({
                serviceId: r.serviceId,
                readingValue: Number(r.readingValue),
                imageUrl: r.imageUrl || null,
              }))

            await createPlatformContract(activeBuilding.id, {
              roomId: selectedRoomId,
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              rentPrice: Number(rentPrice),
              monthlyPaymentDate: Number(monthlyPaymentDate),
              rentPaymentCycle: Number(rentPaymentCycle),
              note: note || undefined,
              initialMeterReadings:
                formattedInitialReadings.length > 0 ? formattedInitialReadings : undefined,
            })
          } else {
            // Flow B submission
            if (!selectedOccupantId) {
              const msg =
                t('landlordContractSelectOccupantPlaceholder') ||
                'Vui lòng chọn người thuê trong phòng để lập hợp đồng.'
              setErrorMessage(msg)
              showToast(msg, 'error')
              goToStep(1)
              return
            }

            if (!tenantPhone || tenantPhone.length !== 10) {
              const msg = t('landlordContractsCreateErrPhone10Digits')
              setErrorMessage(msg)
              showToast(msg, 'error')
              goToStep(1)
              return
            }

            if (canEditTenantInfo) {
              if (!tenantFullName.trim()) {
                const msg = t('landlordContractsCreateErrTenantInfo')
                setErrorMessage(msg)
                showToast(msg, 'error')
                goToStep(1)
                return
              }

              if (
                !identification.identityNumber.trim() ||
                !identification.placeOfOrigin.trim() ||
                !identification.placeOfResidence.trim() ||
                !identification.dateOfBirth
              ) {
                const msg = t('landlordContractsCreateErrIdentification')
                setErrorMessage(msg)
                showToast(msg, 'error')
                goToStep(1)
                return
              }
            }

            const payload: any = {
              roomId: selectedRoomId,
              tenantId: selectedOccupantId,
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              rentPrice: Number(rentPrice),
              depositAmount: Number(depositAmount),
              monthlyPaymentDate: Number(monthlyPaymentDate),
              rentPaymentCycle: Number(rentPaymentCycle),
              note: note || undefined,
              tenantPhoneNumber: tenantPhone,
              tenantFullName: tenantFullName.trim(),
              tenantEmail: tenantEmail?.trim() || undefined,
            }

            const formattedInitialReadings = initialMeterReadings
              .filter(r => r.readingValue !== '' && !isNaN(Number(r.readingValue)))
              .map(r => ({
                serviceId: r.serviceId,
                readingValue: Number(r.readingValue),
                imageUrl: r.imageUrl || null,
              }))

            if (formattedInitialReadings.length > 0) {
              payload.initialMeterReadings = formattedInitialReadings
            }

            if (identification.identityNumber.trim()) {
              payload.identification = {
                identityNumber: identification.identityNumber.trim(),
                fullName: (identification.fullName || tenantFullName).trim(),
                dateOfBirth: new Date(identification.dateOfBirth).toISOString(),
                gender: identification.gender,
                nationality: identification.nationality?.trim() || 'Việt Nam',
                placeOfOrigin: identification.placeOfOrigin?.trim()
                  ? { address: identification.placeOfOrigin.trim() }
                  : undefined,
                placeOfResidence: identification.placeOfResidence?.trim()
                  ? { address: identification.placeOfResidence.trim() }
                  : undefined,
                issueDate: identification.issueDate
                  ? new Date(identification.issueDate).toISOString()
                  : undefined,
                expiryDate: identification.expiryDate
                  ? new Date(identification.expiryDate).toISOString()
                  : undefined,
                note: identification.note?.trim() || undefined,
                cardFrontUrl: identification.cardFrontUrl?.trim() || undefined,
                cardBackUrl: identification.cardBackUrl?.trim() || undefined,
              }
            }

            await createDirectContract(activeBuilding.id, payload)
          }
        }

        showToast(t('landlordContractsToastCreateSuccess'), 'success')
        setTimeout(() => {
          router.push('/landlord/contracts?created=true')
        }, 1200)
      } catch (err: any) {
        console.error('Submit contract failed:', err)
        const errMsg = err?.message || t('landlordContractsToastCreateFailed')
        setErrorMessage(errMsg)
        showToast(errMsg, 'error')
      }
    })
  }, [
    activeBuilding?.id,
    canEditTenantInfo,
    depositAmount,
    endDate,
    flowType,
    goToStep,
    identification,
    monthlyPaymentDate,
    note,
    rentPaymentCycle,
    rentPrice,
    router,
    selectedOccupantId,
    selectedRoomId,
    showToast,
    startDate,
    t,
    tenantEmail,
    tenantFullName,
    tenantPhone,
  ])

  const value: ContractCreateContextValue = {
    step,
    isPending,
    goToStep,
    rooms,
    isLoadingRooms,
    selectedRoomId,
    selectedRoomObj,
    setSelectedRoomId,
    roomOccupants,
    isLoadingOccupants,
    selectedOccupantId,
    setSelectedOccupantId,
    isAddOccupantModalOpen,
    setIsAddOccupantModalOpen,
    fetchRoomOccupants,
    handleOccupantAdded,
    flowType,
    pendingDeposit,
    isCheckingDeposit,
    tenantPhone,
    tenantFullName,
    tenantEmail,
    isSearchingPhone,
    tenantFound,
    hasIdentification,
    canEditTenantInfo,
    handlePhoneChange,
    handleSearchPhone,
    setTenantFullName,
    setTenantEmail,
    identification,
    setIdentificationField,
    uploadingFront,
    uploadingBack,
    isDraggingFront,
    isDraggingBack,
    setIsDraggingFront,
    setIsDraggingBack,
    handlePhotoUpload,
    handleDropFile,
    setCardFrontUrl,
    setCardBackUrl,
    previewModalImg,
    setPreviewModalImg,
    initialMeterReadings,
    setInitialMeterReadings,
    updateInitialMeterReading,
    startDate,
    endDate,
    rentPrice,
    depositAmount,
    monthlyPaymentDate,
    rentPaymentCycle,
    note,
    setStartDate,
    setEndDate,
    setRentPrice,
    setDepositAmount,
    setMonthlyPaymentDate,
    setRentPaymentCycle,
    setNote,
    errorMessage,
    setErrorMessage,
    isDirty,
    setIsDirty,
    showConfirmClose,
    setShowConfirmClose,
    handleAttemptClose,
    handleConfirmClose,
    handleStep1Next,
    handleStep2Next,
    handleSubmitContract,
    toasts,
    showToast,
    dismissToast,
  }

  return (
    <ContractCreateContext.Provider value={value}>{children}</ContractCreateContext.Provider>
  )
}

