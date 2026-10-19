'use client'

import React, { useState, useEffect, useTransition, Suspense, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  Check,
  ChevronRight,
  ChevronLeft,
  FileSignature,
  User,
  DollarSign,
  Home,
  AlertCircle,
  Sparkles,
  Search,
  ShieldCheck,
  IdCard,
  Building2,
  Calendar,
  Info,
  Loader2,
  X,
  AlertTriangle,
  Lock,
  Unlock,
  ExternalLink,
  UploadCloud,
  Trash2,
  Eye,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react'
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
import {
  Button,
  TextInput,
  DateInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  ToastContainer,
  ToastItem,
  ToastType,
} from '@/components/ui'
import { uploadImageToBackend } from '@/services/upload.service'

/**
 * Formats JSON address or string to readable text
 */
function formatAddress(val: any): string {
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

export default function CreateContractPageWrapper() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 animate-spin text-[#2AC1BC]" />
        </div>
      }
    >
      <CreateContractPage />
    </Suspense>
  )
}

function CreateContractPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRoomId = searchParams.get('roomId') || ''
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')

  // Toast notifications using base ToastContainer
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

  // Wizard Step
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()

  // Rooms list & loading
  const [rooms, setRooms] = useState<RoomItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // Form State
  const [selectedRoomId, setSelectedRoomId] = useState(initialRoomId)
  const [flowType, setFlowType] = useState<'platform' | 'direct'>('direct')
  const [pendingDeposit, setPendingDeposit] = useState<PendingDepositResponse | null>(null)
  const [isCheckingDeposit, setIsCheckingDeposit] = useState(false)

  // Tenant Fields
  const [tenantPhone, setTenantPhone] = useState('')
  const [tenantFullName, setTenantFullName] = useState('')
  const [tenantEmail, setTenantEmail] = useState('')
  const [isSearchingPhone, setIsSearchingPhone] = useState(false)
  const [tenantFound, setTenantFound] = useState<boolean | null>(null)
  const [hasIdentification, setHasIdentification] = useState(false)

  // Identification (CCCD) Fields (from UserIdentification schema)
  const [identityNumber, setIdentityNumber] = useState('')
  const [idFullName, setIdFullName] = useState('')
  const [dateOfBirth, setDateOfBirth] = useState('2000-01-01')
  const [gender, setGender] = useState<'male' | 'female'>('male')
  const [nationality, setNationality] = useState('Việt Nam')
  const [placeOfOrigin, setPlaceOfOrigin] = useState('')
  const [placeOfResidence, setPlaceOfResidence] = useState('')
  const [issueDate, setIssueDate] = useState('')
  const [expiryDate, setExpiryDate] = useState('')
  const [idNote, setIdNote] = useState('')
  const [cardFrontUrl, setCardFrontUrl] = useState('')
  const [cardBackUrl, setCardBackUrl] = useState('')
  const [uploadingFront, setUploadingFront] = useState(false)
  const [uploadingBack, setUploadingBack] = useState(false)
  const [isDraggingFront, setIsDraggingFront] = useState(false)
  const [isDraggingBack, setIsDraggingBack] = useState(false)
  const [previewModalImg, setPreviewModalImg] = useState<{ url: string; title: string } | null>(
    null,
  )

  // Landlord can ONLY edit tenant info if Flow B AND user does NOT exist in system
  const canEditTenantInfo = flowType !== 'platform' && tenantFound === false

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

  // UI status
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)

  // UUID regex to ensure we only send real UUIDs to the backend
  const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

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

  // Check deposit whenever room selection changes
  useEffect(() => {
    async function checkDeposit() {
      if (!selectedRoomId || !activeBuilding?.id) {
        setPendingDeposit(null)
        setFlowType('direct')
        return
      }

      // Skip API if building or room is not a UUID
      if (!UUID_REGEX.test(activeBuilding.id) || !UUID_REGEX.test(selectedRoomId)) {
        setPendingDeposit(null)
        setFlowType('direct')
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
              setIdentityNumber(id.identityNumber || '')
              setIdFullName(id.fullName || res.data.tenant.fullName || '')
              if (id.dateOfBirth) {
                try {
                  setDateOfBirth(new Date(id.dateOfBirth).toISOString().split('T')[0])
                } catch {
                  setDateOfBirth('2000-01-01')
                }
              }
              if (id.gender) {
                setGender(id.gender === 'female' ? 'female' : 'male')
              }
              setNationality(id.nationnality || id.nationality || 'Việt Nam')
              setPlaceOfOrigin(formatAddress(id.placeOfOrigin))
              setPlaceOfResidence(formatAddress(id.placeOfResidence))
              if (id.issueDate) {
                try {
                  setIssueDate(new Date(id.issueDate).toISOString().split('T')[0])
                } catch {
                  setIssueDate('')
                }
              }
              if (id.expiryDate) {
                try {
                  setExpiryDate(new Date(id.expiryDate).toISOString().split('T')[0])
                } catch {
                  setExpiryDate('')
                }
              }
              setIdNote(id.note || '')
              setCardFrontUrl(id.cardFrontUrl || '')
              setCardBackUrl(id.cardBackUrl || '')
            }
          }
        } else {
          // Flow B
          setPendingDeposit(null)
          setFlowType('direct')
        }
      } catch (err) {
        console.warn('Check deposit failed or none present, defaulting to direct flow:', err)
        setPendingDeposit(null)
        setFlowType('direct')
      } finally {
        setIsCheckingDeposit(false)
      }
    }
    checkDeposit()
  }, [selectedRoomId, activeBuilding?.id])

  // Handle phone change & auto-reset
  const handlePhoneChange = (val: string) => {
    const cleanVal = val.replace(/\D/g, '').slice(0, 10)
    setTenantPhone(cleanVal)
    setIsDirty(true)

    // Reset tenant search status & fields if phone changed
    if (tenantFound !== null) {
      setTenantFound(null)
      setTenantFullName('')
      setTenantEmail('')
      setHasIdentification(false)
      setIdentityNumber('')
      setIdFullName('')
      setDateOfBirth('2000-01-01')
      setGender('male')
      setNationality('Việt Nam')
      setPlaceOfOrigin('')
      setPlaceOfResidence('')
      setIssueDate('')
      setExpiryDate('')
      setIdNote('')
      setCardFrontUrl('')
      setCardBackUrl('')
    }

    if (cleanVal.length === 10) {
      handleSearchPhone(cleanVal)
    }
  }

  // Handle phone search debounce / action
  const handleSearchPhone = async (phoneToSearch: string) => {
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
          setIdentityNumber(id.identityNumber || '')
          setIdFullName(id.fullName || res.data.user.fullName || '')
          if (id.dateOfBirth) {
            try {
              setDateOfBirth(new Date(id.dateOfBirth).toISOString().split('T')[0])
            } catch {
              setDateOfBirth('2000-01-01')
            }
          }
          if (id.gender) {
            setGender(id.gender === 'female' ? 'female' : 'male')
          }
          setNationality(id.nationnality || id.nationality || 'Việt Nam')
          setPlaceOfOrigin(formatAddress(id.placeOfOrigin))
          setPlaceOfResidence(formatAddress(id.placeOfResidence))
          if (id.issueDate) {
            try {
              setIssueDate(new Date(id.issueDate).toISOString().split('T')[0])
            } catch {
              setIssueDate('')
            }
          }
          if (id.expiryDate) {
            try {
              setExpiryDate(new Date(id.expiryDate).toISOString().split('T')[0])
            } catch {
              setExpiryDate('')
            }
          }
          setIdNote(id.note || '')
          setCardFrontUrl(id.cardFrontUrl || '')
          setCardBackUrl(id.cardBackUrl || '')
        } else {
          setIdentityNumber('')
          setIdFullName('')
          setPlaceOfOrigin('')
          setPlaceOfResidence('')
          setIssueDate('')
          setExpiryDate('')
          setIdNote('')
          setCardFrontUrl('')
          setCardBackUrl('')
        }
      } else {
        setTenantFound(false)
        setHasIdentification(false)
        setTenantFullName('')
        setTenantEmail('')
        setIdentityNumber('')
        setIdFullName('')
        setDateOfBirth('2000-01-01')
        setGender('male')
        setNationality('Việt Nam')
        setPlaceOfOrigin('')
        setPlaceOfResidence('')
        setIssueDate('')
        setExpiryDate('')
        setIdNote('')
        setCardFrontUrl('')
        setCardBackUrl('')
      }
    } catch (err) {
      console.error('Search tenant failed:', err)
      setTenantFound(false)
      setHasIdentification(false)
    } finally {
      setIsSearchingPhone(false)
    }
  }

  // Helper to compress citizen ID photos before saving
  const compressImageFile = (file: File): Promise<string> => {
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
  }

  const handlePhotoUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back',
  ) => {
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
  }

  const handleDropFile = (e: React.DragEvent, side: 'front' | 'back') => {
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
  }

  // Rule 10: Modal / Form Close Handling with custom Confirmation Modal
  const handleAttemptClose = () => {
    if (isDirty) {
      setShowConfirmClose(true)
    } else {
      router.push('/landlord/contracts')
    }
  }

  const handleConfirmClose = () => {
    setShowConfirmClose(false)
    router.push('/landlord/contracts')
  }

  const handleStep1Next = () => {
    if (!selectedRoomId) {
      setErrorMessage(t('landlordContractsCreateErrSelectRoom'))
      return
    }
    if (flowType === 'direct') {
      if (!tenantPhone || tenantPhone.length !== 10) {
        setErrorMessage(t('landlordContractsCreateErrPhone10Digits'))
        return
      }
      if (tenantFound === null) {
        setErrorMessage(t('landlordContractsCreateErrCheckPhoneFirst'))
        return
      }
      if (tenantFound === false && !tenantFullName.trim()) {
        setErrorMessage(t('landlordContractsCreateErrTenantInfo'))
        return
      }
      if (tenantFound === false) {
        if (
          !identityNumber.trim() ||
          !placeOfOrigin.trim() ||
          !placeOfResidence.trim() ||
          !dateOfBirth
        ) {
          setErrorMessage(t('landlordContractsCreateErrIdentification'))
          return
        }
      }
    }
    setErrorMessage(null)
    setStep(2)
  }

  const handleStep2Next = () => {
    if (!startDate || !endDate) {
      setErrorMessage(t('landlordContractsCreateStartDateLabel'))
      return
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setErrorMessage(t('landlordContractsCreateEndDateLabel'))
      return
    }
    setErrorMessage(null)
    setStep(3)
  }

  // Form Submission
  const handleSubmitContract = async () => {
    if (!selectedRoomId) {
      const msg = t('landlordContractsCreateErrSelectRoom')
      setErrorMessage(msg)
      showToast(msg, 'error')
      setStep(1)
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
            await createPlatformContract(activeBuilding.id, {
              roomId: selectedRoomId,
              startDate: new Date(startDate).toISOString(),
              endDate: new Date(endDate).toISOString(),
              rentPrice: Number(rentPrice),
              monthlyPaymentDate: Number(monthlyPaymentDate),
              rentPaymentCycle: Number(rentPaymentCycle),
              note: note || undefined,
            })
          } else {
            // Flow B submission
            if (!tenantPhone || tenantPhone.length !== 10) {
              const msg = t('landlordContractsCreateErrPhone10Digits')
              setErrorMessage(msg)
              showToast(msg, 'error')
              setStep(1)
              return
            }

            if (tenantFound === null) {
              const msg = t('landlordContractsCreateErrCheckPhoneFirst')
              setErrorMessage(msg)
              showToast(msg, 'error')
              setStep(1)
              return
            }

            if (tenantFound === false && !tenantFullName.trim()) {
              const msg = t('landlordContractsCreateErrTenantInfo')
              setErrorMessage(msg)
              showToast(msg, 'error')
              setStep(1)
              return
            }

            if (tenantFound === false) {
              if (
                !identityNumber.trim() ||
                !placeOfOrigin.trim() ||
                !placeOfResidence.trim() ||
                !dateOfBirth
              ) {
                const msg = t('landlordContractsCreateErrIdentification')
                setErrorMessage(msg)
                showToast(msg, 'error')
                setStep(1)
                return
              }
            }

            const payload: any = {
              roomId: selectedRoomId,
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

            if (identityNumber.trim()) {
              payload.identification = {
                identityNumber: identityNumber.trim(),
                fullName: (idFullName || tenantFullName).trim(),
                dateOfBirth: new Date(dateOfBirth).toISOString(),
                gender,
                nationality: nationality?.trim() || 'Việt Nam',
                placeOfOrigin: placeOfOrigin?.trim()
                  ? { address: placeOfOrigin.trim() }
                  : undefined,
                placeOfResidence: placeOfResidence?.trim()
                  ? { address: placeOfResidence.trim() }
                  : undefined,
                issueDate: issueDate ? new Date(issueDate).toISOString() : undefined,
                expiryDate: expiryDate ? new Date(expiryDate).toISOString() : undefined,
                note: idNote?.trim() || undefined,
                cardFrontUrl: cardFrontUrl?.trim() || undefined,
                cardBackUrl: cardBackUrl?.trim() || undefined,
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
  }

  const selectedRoomObj = rooms.find(r => r.id === selectedRoomId)

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-card p-6 rounded-2xl border border-line shadow-2xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-muted uppercase tracking-wider mb-1">
            <Building2 className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <span>{activeBuilding?.name || t('landlordContractsCreatePropertyFallback')}</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
            {t('landlordContractsCreateTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1">
            {t('landlordContractsCreateSubtitle')}
          </p>
        </div>
      </div>

      {/* Progress Wizard */}
      <div className="flex items-center justify-center gap-2 sm:gap-3 bg-card p-3 rounded-2xl border border-line shadow-2xs">
        <Button variant="dark"
          type="button"
          onClick={() => setStep(1)}
          size="sm"
          leftIcon={step > 1 ? <Check  /> : <Home  />}
        >
          {t('landlordContractsCreateStep1Btn')}
        </Button>

        <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />

        <Button variant="dark"
          type="button"
          onClick={() => step > 1 && setStep(2)}
          size="sm"
          leftIcon={step > 2 ? <Check  /> : <DollarSign  />}
        >
          {t('landlordContractsCreateStep2Btn')}
        </Button>

        <ChevronRight className="w-4 h-4 text-zinc-300 shrink-0" />

        <Button variant="dark"
          type="button"
          onClick={() => step > 2 && setStep(3)}
          size="sm"
          leftIcon={<FileSignature  />}
        >
          {t('landlordContractsCreateStep3Header')}
        </Button>
      </div>

      {/* STEP 1: Phòng & Khách thuê */}
      {step === 1 && (
        <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
          {/* Room Selection */}
          <div className="space-y-3 border-b border-line pb-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-[#2AC1BC]" />{' '}
                {t('landlordContractsCreateRoomSelectLabel')}
              </h2>
              {isCheckingDeposit && (
                <span className="flex items-center gap-1.5 text-xs text-[#2AC1BC] font-bold">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                  {t('landlordContractsCreateTenantSearching')}
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <SelectInput
                label={t('landlordContractsCreateRoomSelectLabel')}
                required
                value={selectedRoomId}
                onChange={e => {
                  setSelectedRoomId(e.target.value)
                  setIsDirty(true)
                }}
              >
                <option value="">{t('landlordContractsCreateRoomPlaceholder')}</option>
                {rooms.map(r => {
                  const roomLabel = `${t('landlordContractDetailRoomPrefix')} ${r.roomNumber} (${r.roomType?.name || 'Standard'} - ${r.status})`
                  return (
                    <option key={r.id} value={r.id} label={roomLabel}>
                      {roomLabel}
                    </option>
                  )
                })}
              </SelectInput>

              {selectedRoomObj && (
                <div className="p-3 bg-surface border border-line rounded-xl flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="text-muted block text-[11px]">
                      {t('landlordContractDetailRoomPrefix')}:
                    </span>
                    <span className="text-foreground font-extrabold text-sm">
                      {t('landlordContractDetailRoomPrefix')} {selectedRoomObj.roomNumber}
                    </span>
                    <span className="text-muted ml-1 text-xs">
                      ({t('landlordRoomDetailFloor')} {selectedRoomObj.floor},{' '}
                      {selectedRoomObj.area || 20}m²)
                    </span>
                  </div>
                  <span
                    className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${selectedRoomObj.status === 'deposited'
                        ? 'bg-deposit-soft text-deposit'
                        : 'bg-success-soft text-success'
                      }`}
                  >
                    {selectedRoomObj.status}
                  </span>
                </div>
              )}
            </div>

            {/* FLOW A BANNER IF PENDING PLATFORM DEPOSIT DETECTED */}
            {flowType === 'platform' && pendingDeposit && (
              <div className="p-4 bg-deposit-soft border border-deposit-subtle rounded-2xl space-y-2 mt-4 animate-in zoom-in-95">
                <div className="flex items-center gap-2 text-deposit font-black text-xs uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  <span>{t('landlordContractsCreateFlowPlatformBadge')}</span>
                </div>
                <p className="text-xs text-deposit font-medium leading-relaxed">
                  {t('landlordContractsCreateFlowPlatformDesc')}
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs text-deposit">
                  <span>
                    {t('landlordContractsCreateTenantNameLabel')}:{' '}
                    <strong>
                      {pendingDeposit.tenant?.fullName || t('landlordContractsCreatePlatformGuest')}
                    </strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    {t('landlordContractDetailMemberPhoneLabel')}{' '}
                    <strong>{pendingDeposit.tenant?.phoneNumber}</strong>
                  </span>
                  <span>&bull;</span>
                  <span>
                    {t('landlordContractDetailDeposit')}{' '}
                    <strong>{pendingDeposit.amount.toLocaleString('vi-VN')} ₫</strong> (Fixed)
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Tenant Information Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" />{' '}
                {t('landlordContractsCreateStep1Header')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Phone Input with search lookup */}
              <div className="sm:col-span-2">
                <div className="relative max-w-md">
                  <TextInput
                    label={t('landlordContractsCreateTenantPhoneLabel')}
                    required
                    type="tel"
                    placeholder={t('landlordContractsCreateTenantPhonePlaceholder')}
                    disabled={flowType === 'platform'}
                    value={tenantPhone}
                    onChange={e => handlePhoneChange(e.target.value)}
                    className="pr-24"
                  />
                  {flowType === 'direct' && (
                    <Button
                      type="button"
                      disabled={isSearchingPhone || tenantPhone.length !== 10}
                      isLoading={isSearchingPhone}
                      onClick={() => handleSearchPhone(tenantPhone)}
                      size="sm"
                      leftIcon={<Search  />}
                      className="absolute right-1.5 bottom-1.5"
                    >
                      {t('landlordContractsCreateTenantSearchBtn')}
                    </Button>
                  )}
                </div>

                {/* Status hints under phone input */}
                {flowType === 'direct' && tenantPhone.length < 10 && tenantFound === null && (
                  <p className="text-[11px] text-muted font-medium mt-1.5 flex items-center gap-1.5 animate-in fade-in">
                    <Lock className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>{t('landlordContractsCreateTenantPhoneLockedHint')}</span>
                  </p>
                )}

                {tenantFound === true && (
                  <div className="p-3 bg-success-soft border border-success-subtle rounded-xl flex items-start gap-2.5 text-xs text-success mt-2.5 animate-in fade-in">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-success block">
                        {t('landlordContractsCreateTenantFound')}: {tenantFullName}
                      </span>
                      <span className="text-[11px] text-success font-medium block mt-0.5">
                        {t('landlordContractsCreateTenantLockedAccountDesc')}
                      </span>
                    </div>
                  </div>
                )}

                {tenantFound === false && flowType === 'direct' && (
                  <div className="p-3 bg-warning-soft border border-warning-subtle rounded-xl flex items-start gap-2.5 text-xs text-warning mt-2.5 animate-in fade-in">
                    <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-black text-warning block">
                        {t('landlordContractsCreateTenantNotFound')}
                      </span>
                      <span className="text-[11px] text-warning font-medium block mt-0.5">
                        {t('landlordContractsCreateTenantNewAccountDesc')}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              {/* Full Name */}
              <TextInput
                label={t('landlordContractsCreateTenantNameLabel')}
                required={flowType !== 'platform'}
                placeholder={
                  !canEditTenantInfo && tenantPhone.length < 10
                    ? t('landlordContractsCreateEnterPhoneFirst')
                    : t('landlordContractsCreateTenantNamePlaceholder')
                }
                disabled={!canEditTenantInfo}
                value={tenantFullName}
                onChange={e => {
                  setTenantFullName(e.target.value)
                  setIsDirty(true)
                }}
              />

              {/* Email */}
              <TextInput
                label={t('landlordContractsCreateTenantEmailLabel')}
                type="email"
                placeholder={
                  !canEditTenantInfo && tenantPhone.length < 10
                    ? t('landlordContractsCreateEnterPhoneFirst')
                    : t('landlordContractsCreateTenantEmailPlaceholder')
                }
                disabled={!canEditTenantInfo}
                value={tenantEmail}
                onChange={e => {
                  setTenantEmail(e.target.value)
                  setIsDirty(true)
                }}
              />
            </div>

            {/* Notice when existing user has NO identification on file */}
            {tenantFound === true && !hasIdentification && (
              <div className="p-4 bg-vacant-soft border border-vacant-subtle rounded-2xl flex items-start gap-3 text-xs text-vacant animate-in fade-in">
                <Info className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-black text-vacant block">
                    {t('landlordContractsCreateTenantFound')}: {tenantFullName}
                  </span>
                  <p className="text-[11px] text-vacant font-medium mt-0.5">
                    {t('landlordContractsCreateTenantNoIdNotice')}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Citizen Identification (CCCD) Section (Direct display, no toggle) */}
          <div className="p-5 bg-surface/80 border border-line rounded-2xl space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-line pb-2.5">
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${hasIdentification
                      ? 'bg-success-soft text-success'
                      : canEditTenantInfo
                        ? 'bg-[#2AC1BC]/10 text-[#2AC1BC]'
                        : 'bg-line text-muted'
                    }`}
                >
                  <IdCard className="w-3.5 h-3.5" />
                </div>
                <h4 className="text-xs font-black text-foreground uppercase tracking-wider flex items-center gap-2">
                  <span>{t('landlordContractsCreateStep2Header')}</span>
                  {hasIdentification && (
                    <span className="px-2 py-0.5 bg-success-soft text-success rounded-full font-bold text-[10px] normal-case">
                      {t('landlordContractsCreateTenantHasIdBadge')}
                    </span>
                  )}
                </h4>
              </div>
              {!canEditTenantInfo ? (
                <span className="text-[11px] text-muted font-bold flex items-center gap-1">
                  <Lock className="w-3 h-3 text-muted" />
                  {t('landlordContractsCreateReadOnlyLocked')}
                </span>
              ) : (
                <span className="text-[11px] text-emerald-600 font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3 text-emerald-500" />
                  {t('landlordContractsCreateEditable')}
                </span>
              )}
            </div>

            {/* Alert inside CCCD form if missing identification fields */}
            {errorMessage === t('landlordContractsCreateErrIdentification') && (
              <div className="p-3 bg-danger-soft border border-danger-subtle text-danger rounded-xl text-xs font-bold flex items-center gap-2 animate-in fade-in">
                <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Row 1: Số CCCD, Họ tên trên CCCD, Ngày sinh */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <TextInput
                label={t('landlordContractsCreateCccdNumberLabel')}
                required={canEditTenantInfo}
                placeholder={t('landlordContractsCreateCccdNumberPlaceholder') || '001201012345'}
                disabled={!canEditTenantInfo}
                value={identityNumber}
                onChange={e => {
                  setIdentityNumber(e.target.value)
                  setIsDirty(true)
                  if (errorMessage) setErrorMessage(null)
                }}
              />

              <TextInput
                label={t('landlordContractsCreateCccdNameLabel')}
                required={canEditTenantInfo}
                placeholder={
                  tenantFullName ||
                  t('landlordContractsCreateCccdNamePlaceholder') ||
                  'NGUYEN VAN AN'
                }
                disabled={!canEditTenantInfo}
                value={idFullName}
                onChange={e => {
                  setIdFullName(e.target.value)
                  setIsDirty(true)
                  if (errorMessage) setErrorMessage(null)
                }}
              />

              <DateInput
                label={t('landlordContractsCreateCccdDobLabel')}
                required={canEditTenantInfo}
                disabled={!canEditTenantInfo}
                value={dateOfBirth}
                onChange={e => {
                  setDateOfBirth(e.target.value)
                  setIsDirty(true)
                  if (errorMessage) setErrorMessage(null)
                }}
              />
            </div>

            {/* Row 2: Giới tính, Quốc tịch, Quê quán */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <SelectInput
                label={t('landlordContractsCreateCccdGenderLabel')}
                required={canEditTenantInfo}
                disabled={!canEditTenantInfo}
                value={gender}
                onChange={e => {
                  setGender(e.target.value as 'male' | 'female')
                  setIsDirty(true)
                }}
              >
                <option value="male">{t('landlordContractsCreateCccdGenderMale')}</option>
                <option value="female">{t('landlordContractsCreateCccdGenderFemale')}</option>
              </SelectInput>

              <TextInput
                label={t('landlordContractsCreateCccdNationalityLabel')}
                disabled={!canEditTenantInfo}
                value={nationality}
                onChange={e => {
                  setNationality(e.target.value)
                  setIsDirty(true)
                }}
              />

              <TextInput
                label={t('landlordContractsCreateCccdOriginLabel')}
                required={canEditTenantInfo}
                placeholder={t('landlordContractsCreateCccdOriginPlaceholder')}
                disabled={!canEditTenantInfo}
                value={placeOfOrigin}
                onChange={e => {
                  setPlaceOfOrigin(e.target.value)
                  setIsDirty(true)
                  if (errorMessage) setErrorMessage(null)
                }}
              />
            </div>

            {/* Row 3: Nơi thường trú, Ngày cấp, Ngày hết hạn */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <TextInput
                label={t('landlordContractsCreateCccdResidenceLabel')}
                required={canEditTenantInfo}
                placeholder={t('landlordContractsCreateCccdResidencePlaceholder')}
                disabled={!canEditTenantInfo}
                value={placeOfResidence}
                onChange={e => {
                  setPlaceOfResidence(e.target.value)
                  setIsDirty(true)
                  if (errorMessage) setErrorMessage(null)
                }}
              />

              <DateInput
                label={t('landlordContractsCreateCccdIssueDateLabel')}
                disabled={!canEditTenantInfo}
                value={issueDate}
                onChange={e => {
                  setIssueDate(e.target.value)
                  setIsDirty(true)
                }}
              />

              <DateInput
                label={t('landlordContractsCreateCccdExpiryDateLabel')}
                disabled={!canEditTenantInfo}
                value={expiryDate}
                onChange={e => {
                  setExpiryDate(e.target.value)
                  setIsDirty(true)
                }}
              />
            </div>

            {/* Row 4: Đặc điểm nhận dạng / Ghi chú */}
            <TextInput
              label={t('landlordContractsCreateCccdNoteLabel')}
              placeholder={t('landlordContractsCreateCccdNotePlaceholder')}
              disabled={!canEditTenantInfo}
              value={idNote}
              onChange={e => {
                setIdNote(e.target.value)
                setIsDirty(true)
              }}
            />

            {/* Row 5: Ảnh mặt trước & mặt sau CCCD (Tải ảnh trực tiếp) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
              {/* Mặt trước CCCD */}
              <div>
                <TextInput
                  id="cccd-front-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  containerClassName="hidden"
                  className="hidden"
                  disabled={!canEditTenantInfo}
                  onChange={e => handlePhotoUpload(e, 'front')}
                />
                <div className="block text-[11px] font-bold text-foreground/90 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    {t('landlordContractsCreateCccdFrontUrlLabel')}
                  </span>
                  {cardFrontUrl && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-success-soft px-2 py-0.5 rounded-full">
                      {t('landlordContractsCreatePhotoUploaded')}
                    </span>
                  )}
                </div>

                {cardFrontUrl ? (
                  <div className="rounded-xl border border-line bg-surface p-2 space-y-2">
                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-zinc-900/5 flex items-center justify-center border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardFrontUrl}
                        alt={t('landlordContractsCreateCccdFrontUrlLabel')}
                        className="w-full h-full object-cover"
                      />
                      {uploadingFront && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                          <span className="text-[11px] font-bold mt-1.5">
                            {t('landlordContractsCreatePhotoProcessing')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewModalImg({
                            url: cardFrontUrl,
                            title: t('landlordContractsCreateCccdFrontUrlLabel'),
                          })
                        }
                        leftIcon={<Eye  />}
                      >
                        {t('landlordContractsCreateCccdViewPhoto')}
                      </Button>

                      {canEditTenantInfo ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingFront}
                            onClick={() => document.getElementById('cccd-front-file')?.click()}
                            leftIcon={<RefreshCw  />}
                          >
                            {t('landlordContractsCreateCccdChangePhoto')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingFront}
                            onClick={() => {
                              setCardFrontUrl('')
                              setIsDirty(true)
                            }}
                            title={t('landlordContractsCreateCccdRemovePhoto')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-muted font-medium">
                          <Lock className="w-3 h-3" />
                          <span>{t('landlordContractsCreatePhotoLocked')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !canEditTenantInfo ? (
                  <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card-hover/70 p-4 text-center cursor-not-allowed select-none">
                    <Lock className="w-6 h-6 text-muted mb-1.5" />
                    <span className="text-xs font-bold text-muted">
                      {tenantPhone.trim().length < 10
                        ? t('landlordContractsCreateEnterPhoneToUnlock')
                        : t('landlordContractsCreateNoFrontPhoto')}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">
                      {tenantPhone.trim().length < 10
                        ? t('landlordContractsCreateVerifyPhoneFirst')
                        : t('landlordContractsCreateAccountExists')}
                    </span>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => document.getElementById('cccd-front-file')?.click()}
                    onDragOver={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingFront(true)
                    }}
                    onDragLeave={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingFront(false)
                    }}
                    onDrop={e => handleDropFile(e, 'front')}
                    className={`h-36 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${isDraggingFront
                        ? 'border-[#2AC1BC] bg-[#2AC1BC]/10 scale-[0.99]'
                        : 'border-line bg-surface/70 hover:border-[#2AC1BC]/70 hover:bg-card-hover'
                      }`}
                  >
                    {uploadingFront ? (
                      <div className="flex flex-col items-center justify-center text-[#2AC1BC]">
                        <Loader2 className="w-7 h-7 animate-spin mb-1.5" />
                        <span className="text-xs font-bold">
                          {t('landlordContractsCreatePhotoUploading')}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mb-1.5 shadow-2xs">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          {t('landlordContractsCreateCccdUploadPrompt')}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          {t('landlordContractsCreateCccdUploadHint')}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Mặt sau CCCD */}
              <div>
                <TextInput
                  id="cccd-back-file"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  containerClassName="hidden"
                  className="hidden"
                  disabled={!canEditTenantInfo}
                  onChange={e => handlePhotoUpload(e, 'back')}
                />
                <div className="block text-[11px] font-bold text-foreground/90 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <IdCard className="w-3.5 h-3.5 text-[#2AC1BC]" />
                    {t('landlordContractsCreateCccdBackUrlLabel')}
                  </span>
                  {cardBackUrl && (
                    <span className="text-[10px] text-emerald-600 font-bold bg-success-soft px-2 py-0.5 rounded-full">
                      {t('landlordContractsCreatePhotoUploaded')}
                    </span>
                  )}
                </div>

                {cardBackUrl ? (
                  <div className="rounded-xl border border-line bg-surface p-2 space-y-2">
                    <div className="relative h-36 w-full rounded-lg overflow-hidden bg-zinc-900/5 flex items-center justify-center border border-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardBackUrl}
                        alt={t('landlordContractsCreateCccdBackUrlLabel')}
                        className="w-full h-full object-cover"
                      />
                      {uploadingBack && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center text-white">
                          <Loader2 className="w-6 h-6 animate-spin text-[#2AC1BC]" />
                          <span className="text-[11px] font-bold mt-1.5">
                            {t('landlordContractsCreatePhotoProcessing')}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1.5 pt-0.5">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setPreviewModalImg({
                            url: cardBackUrl,
                            title: t('landlordContractsCreateCccdBackUrlLabel'),
                          })
                        }
                        leftIcon={<Eye  />}
                      >
                        {t('landlordContractsCreateCccdViewPhoto')}
                      </Button>

                      {canEditTenantInfo ? (
                        <div className="flex items-center gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingBack}
                            onClick={() => document.getElementById('cccd-back-file')?.click()}
                            leftIcon={<RefreshCw  />}
                          >
                            {t('landlordContractsCreateCccdChangePhoto')}
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={uploadingBack}
                            onClick={() => {
                              setCardBackUrl('')
                              setIsDirty(true)
                            }}
                            title={t('landlordContractsCreateCccdRemovePhoto')}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] text-muted font-medium">
                          <Lock className="w-3 h-3" />
                          <span>{t('landlordContractsCreatePhotoLocked')}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ) : !canEditTenantInfo ? (
                  <div className="h-36 flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-card-hover/70 p-4 text-center cursor-not-allowed select-none">
                    <Lock className="w-6 h-6 text-muted mb-1.5" />
                    <span className="text-xs font-bold text-muted">
                      {tenantPhone.trim().length < 10
                        ? t('landlordContractsCreateEnterPhoneToUnlock')
                        : t('landlordContractsCreateNoBackPhoto')}
                    </span>
                    <span className="text-[10px] text-muted mt-0.5">
                      {tenantPhone.trim().length < 10
                        ? t('landlordContractsCreateVerifyPhoneFirst')
                        : t('landlordContractsCreateAccountExists')}
                    </span>
                  </div>
                ) : (
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => document.getElementById('cccd-back-file')?.click()}
                    onDragOver={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingBack(true)
                    }}
                    onDragLeave={e => {
                      e.preventDefault()
                      e.stopPropagation()
                      setIsDraggingBack(false)
                    }}
                    onDrop={e => handleDropFile(e, 'back')}
                    className={`h-36 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-4 text-center cursor-pointer transition-all ${isDraggingBack
                        ? 'border-[#2AC1BC] bg-[#2AC1BC]/10 scale-[0.99]'
                        : 'border-line bg-surface/70 hover:border-[#2AC1BC]/70 hover:bg-card-hover'
                      }`}
                  >
                    {uploadingBack ? (
                      <div className="flex flex-col items-center justify-center text-[#2AC1BC]">
                        <Loader2 className="w-7 h-7 animate-spin mb-1.5" />
                        <span className="text-xs font-bold">
                          {t('landlordContractsCreatePhotoUploading')}
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-9 h-9 rounded-xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mb-1.5 shadow-2xs">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-foreground">
                          {t('landlordContractsCreateCccdUploadBackPrompt')}
                        </p>
                        <p className="text-[10px] text-muted mt-0.5">
                          {t('landlordContractsCreateCccdUploadHint')}
                        </p>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Error Alert if any */}
          {errorMessage && (
            <div className="flex items-center gap-3 p-4 bg-danger-soft border border-danger-subtle text-danger rounded-2xl text-xs font-bold animate-in fade-in">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
              <span>{errorMessage}</span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setErrorMessage(null)}
                className="ml-auto"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAttemptClose}
            >
              {t('landlordContractsCreateCancelBtn')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStep1Next}
              rightIcon={<ChevronRight  />}
            >
              {t('landlordContractsCreateNextStep')}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 2: Điều khoản & Tài chính */}
      {step === 2 && (
        <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
          <div className="border-b border-line pb-3">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-[#2AC1BC]" />{' '}
              {t('landlordContractsCreateStep2Btn')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Rent Price */}
            <NumberInput
              label={t('landlordContractsCreateRentPriceLabel')}
              required
              min={0}
              step={50000}
              suffixText="VNĐ/tháng"
              helperText={`${Number(rentPrice || 0).toLocaleString('vi-VN')} ₫`}
              value={rentPrice}
              onChange={e => {
                setRentPrice(Number(e.target.value))
                setIsDirty(true)
              }}
            />

            {/* Deposit Amount */}
            <NumberInput
              label={t('landlordContractsCreateDepositLabel')}
              required
              min={0}
              disabled={flowType === 'platform'}
              suffixText="VNĐ"
              helperText={
                flowType === 'platform'
                  ? t('landlordContractsCreateDepositInheritedNote')
                  : `${Number(depositAmount || 0).toLocaleString('vi-VN')} ₫`
              }
              value={depositAmount}
              onChange={e => {
                setDepositAmount(Number(e.target.value))
                setIsDirty(true)
              }}
            />

            {/* Monthly Payment Date */}
            <NumberInput
              label={t('landlordContractsCreatePaymentDateLabel')}
              required
              min={1}
              max={31}
              suffixText={t('landlordContractsCreatePaymentDateSuffix')}
              helperText={t('landlordContractDetailPaymentDayValue', { day: monthlyPaymentDate })}
              value={monthlyPaymentDate}
              onChange={e => {
                setMonthlyPaymentDate(Number(e.target.value))
                setIsDirty(true)
              }}
            />

            {/* Payment Cycle */}
            <SelectInput
              label={t('landlordContractsCreatePaymentCycleLabel')}
              required
              value={rentPaymentCycle}
              onChange={e => {
                setRentPaymentCycle(Number(e.target.value))
                setIsDirty(true)
              }}
            >
              <option value={1}>{t('landlordContractsCreateCycle1M')}</option>
              <option value={3}>{t('landlordContractsCreateCycle3M')}</option>
              <option value={6}>{t('landlordContractsCreateCycle6M')}</option>
              <option value={12}>{t('landlordContractsCreateCycle12M')}</option>
            </SelectInput>
          </div>

          <div className="border-b border-line pb-3 pt-2">
            <h2 className="text-sm font-black text-foreground uppercase tracking-wider flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#2AC1BC]" />{' '}
              {t('landlordContractDetailTimelineSection')}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <DateInput
              label={t('landlordContractsCreateStartDateLabel')}
              required
              value={startDate}
              onChange={e => {
                setStartDate(e.target.value)
                setIsDirty(true)
              }}
            />

            <DateInput
              label={t('landlordContractsCreateEndDateLabel')}
              required
              value={endDate}
              onChange={e => {
                setEndDate(e.target.value)
                setIsDirty(true)
              }}
            />

            <div className="col-span-full">
              <TextareaInput
                label={t('landlordContractsCreateNoteLabel')}
                placeholder={t('landlordContractsCreateNotePlaceholder')}
                rows={3}
                value={note}
                onChange={e => {
                  setNote(e.target.value)
                  setIsDirty(true)
                }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setStep(1)}
              leftIcon={<ChevronLeft  />}
            >
              {t('landlordContractsCreatePrevStep')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleStep2Next}
              rightIcon={<ChevronRight  />}
            >
              {t('landlordContractsCreateNextStep')}
            </Button>
          </div>
        </div>
      )}

      {/* STEP 3: Xác nhận & Ký kết */}
      {step === 3 && (
        <div className="bg-card border border-line rounded-2xl p-6 sm:p-8 space-y-6 shadow-2xs animate-in fade-in duration-300">
          <div className="text-center max-w-md mx-auto space-y-2">
            <div className="w-12 h-12 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto mb-2">
              <FileSignature className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-black text-foreground">
              {t('landlordContractsCreateStep3Header')}
            </h2>
            <p className="text-xs text-muted">{t('landlordContractsCreateStep3Desc')}</p>
          </div>

          {/* Summary Card */}
          <div className="bg-surface border border-line rounded-2xl p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <span className="font-bold text-muted">{t('landlordContractDetailStatus')}:</span>
              <span
                className={`px-3 py-1 rounded-full font-black text-[11px] ${flowType === 'platform'
                    ? 'bg-deposit-soft text-deposit'
                    : 'bg-success-soft text-success'
                  }`}
              >
                {flowType === 'platform'
                  ? t('landlordContractsCreateFlowPlatformBadge')
                  : t('landlordContractsCreateFlowDirectBadge')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractDetailRoom')}:
                </span>
                <span className="font-black text-foreground text-sm">
                  {t('landlordContractDetailRoomPrefix')} {selectedRoomObj?.roomNumber} (
                  {t('landlordRoomDetailFloor')} {selectedRoomObj?.floor})
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractDetailTenant')}:
                </span>
                <span className="font-black text-foreground text-sm block">
                  {tenantFullName} ({tenantPhone})
                </span>
                {identityNumber && (
                  <span className="text-[11px] text-muted font-mono block mt-0.5">
                    CCCD: {identityNumber}
                  </span>
                )}
              </div>

              <div>
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractDetailDuration')}:
                </span>
                <span className="font-bold text-foreground">
                  {startDate} &rarr; {endDate}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractsCreatePaymentCycleLabel')}:
                </span>
                <span className="font-bold text-foreground">
                  {t('landlordContractDetailPaymentDayValue', { day: monthlyPaymentDate })} &bull;{' '}
                  {rentPaymentCycle} {t('landlordContractsPaymentCycleLabel')}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractDetailRentPrice')}:
                </span>
                <span className="font-black text-[#2AC1BC] text-sm">
                  {Number(rentPrice).toLocaleString('vi-VN')} ₫{' '}
                  {t('landlordContractsPerMonth')}
                </span>
              </div>

              <div>
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractDetailDeposit')}:
                </span>
                <span className="font-black text-deposit text-sm">
                  {Number(depositAmount).toLocaleString('vi-VN')} ₫
                </span>
              </div>
            </div>

            {note && (
              <div className="pt-2 border-t border-line">
                <span className="text-muted block text-[11px] font-semibold">
                  {t('landlordContractsCreateNoteLabel')}:
                </span>
                <p className="text-foreground/90 italic">{note}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-4 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setStep(2)}
              leftIcon={<ChevronLeft  />}
            >
              {t('landlordContractsCreatePrevStep')}
            </Button>

            <Button
              type="button"
              variant="primary"
              size="sm"
              disabled={isPending}
              isLoading={isPending}
              onClick={handleSubmitContract}
              leftIcon={<Check  />}
            >
              {isPending
                ? t('landlordContractsCreateSubmitting')
                : t('landlordContractsCreateSubmitBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* RULE 10: Custom Pop-up Confirmation Modal for Unsaved Changes */}
      {showConfirmClose && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-sm animate-in fade-in"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setShowConfirmClose(false)
          }}
        >
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden p-6 space-y-4 animate-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-warning-soft text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-foreground">
                {t('landlordContractsCreateConfirmCloseTitle')}
              </h3>
              <p className="text-xs text-muted font-medium">
                {t('landlordContractsCreateConfirmCloseDesc')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button size="xs"
                type="button"
                variant="secondary"
                onClick={() => setShowConfirmClose(false)}
                className="flex-1"
              >
                {t('landlordContractsCreateConfirmCloseKeep')}
              </Button>
              <Button size="xs"
                type="button"
                variant="danger"
                onClick={handleConfirmClose}
                className="flex-1"
              >
                {t('landlordContractsCreateConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Full Image Preview Modal */}
      {previewModalImg && (
        <div
          className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in"
          onClick={() => setPreviewModalImg(null)}
        >
          <div
            className="relative bg-zinc-900 rounded-3xl shadow-2xl max-w-2xl w-full overflow-hidden border border-zinc-800 animate-in zoom-in-95 p-4"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 text-white">
              <div className="flex items-center gap-2">
                <IdCard className="w-5 h-5 text-[#2AC1BC]" />
                <span className="text-sm font-bold">{previewModalImg.title}</span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setPreviewModalImg(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="mt-3 flex items-center justify-center bg-zinc-950 rounded-2xl overflow-hidden min-h-[260px] max-h-[70vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewModalImg.url}
                alt={previewModalImg.title}
                className="w-full h-full object-contain max-h-[68vh]"
              />
            </div>
          </div>
        </div>
      )}
      {/* Centralized Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
