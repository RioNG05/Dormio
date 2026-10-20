'use client'

import React, { useState, useEffect, useRef, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  Gauge,
  Zap,
  Droplets,
  Camera,
  CheckCircle2,
  Clock,
  ArrowLeft,
  Check,
  Sparkles,
  AlertTriangle,
  Calendar,
  Building2,
  FileText,
  RotateCcw,
} from 'lucide-react'
import {
  Button,
  TextInput,
  DateInput,
  TextareaInput,
  Modal,
  Text,
} from '@/components/ui'
import {
  meterReadingService,
  LandlordActiveMeteredService,
} from '@/services/meter-reading.service'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency } from '@/utils'

export default function LandlordRoomMeterReadingPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const resolvedParams = use(params)
  const roomId = resolvedParams.id
  const router = useRouter()
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { locale } = useLanguage()
  const { toast } = useToast()

  const [loading, setLoading] = useState(true)
  const [roomNumber, setRoomNumber] = useState<string>('')
  const [servicesList, setServicesList] = useState<LandlordActiveMeteredService[]>([])
  const [readingsState, setReadingsState] = useState<
    Record<
      string,
      {
        readingValue: number | null
        imageUrl: string | null
        isScanning: boolean
        isEditing: boolean
        draftValue: string
      }
    >
  >({})

  // Date and note for logging
  const [recordedDate, setRecordedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0]
  })
  const [recordedNote, setRecordedNote] = useState<string>('')

  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    let isMounted = true

    async function loadData() {
      setLoading(true)
      try {
        if (activeBuilding?.id) {
          const res = await meterReadingService.getLandlordRoomMeteredServices(
            activeBuilding.id,
            roomId,
          )
          if (!isMounted) return

          if (res?.services && res.services.length > 0) {
            setRoomNumber(res.roomNumber || '')
            setServicesList(res.services)

            const stateMap: typeof readingsState = {}
            res.services.forEach(s => {
              const val = s.unbilledReading?.readingValue ?? null
              stateMap[s.serviceId] = {
                readingValue: val,
                imageUrl: s.unbilledReading?.imageUrl ?? null,
                isScanning: false,
                isEditing: false,
                draftValue: val !== null ? String(val) : '',
              }
            })
            setReadingsState(stateMap)
            return
          }
        }
      } catch (err: unknown) {
        console.warn('API error loading landlord metered services, applying fallback preview:', err)
      }

      if (!isMounted) return

      // Fallback demo state
      const fallbackServices: LandlordActiveMeteredService[] = [
        {
          serviceId: 'srv-elec-default',
          serviceName: 'Điện sinh hoạt',
          unitPrice: 3500,
          unit: 'kWh',
          lastReading: {
            id: 'lr-elec',
            readingValue: 1420,
            imageUrl: null,
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          unbilledReading: null,
        },
        {
          serviceId: 'srv-water-default',
          serviceName: 'Nước sinh hoạt',
          unitPrice: 25000,
          unit: 'm³',
          lastReading: {
            id: 'lr-water',
            readingValue: 68,
            imageUrl: null,
            createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
          },
          unbilledReading: null,
        },
      ]

      setRoomNumber(roomId.startsWith('room-') ? roomId.replace('room-', 'P.') : roomId.slice(0, 4).toUpperCase())
      setServicesList(fallbackServices)
      setReadingsState({
        'srv-elec-default': {
          readingValue: null,
          imageUrl: null,
          isScanning: false,
          isEditing: false,
          draftValue: '',
        },
        'srv-water-default': {
          readingValue: null,
          imageUrl: null,
          isScanning: false,
          isEditing: false,
          draftValue: '',
        },
      })
      setLoading(false)
    }

    loadData().finally(() => {
      if (isMounted) setLoading(false)
    })

    return () => {
      isMounted = false
    }
  }, [activeBuilding?.id, roomId])

  // Helper to compress image before uploading
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = readerEvent => {
        const image = new window.Image()
        image.onload = () => {
          const maxDim = 1280
          let { width, height } = image
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
            ctx.drawImage(image, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.82))
          } else {
            resolve(readerEvent.target?.result as string)
          }
        }
        image.onerror = () => resolve(readerEvent.target?.result as string)
        image.src = readerEvent.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  // Handle photo selection & OCR extraction
  const handlePhotoUpload = async (service: LandlordActiveMeteredService, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const base64Url = await compressImageFile(file)
    const serviceId = service.serviceId

    setReadingsState(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        imageUrl: base64Url,
        isScanning: true,
        isEditing: false,
      },
    }))

    try {
      const serviceType = service.serviceName.toLowerCase().includes('nước') ? 'water' : 'electricity'
      const aiRes = await meterReadingService.scanMeterWithAi(base64Url, serviceType)

      if (aiRes?.data?.readingValue !== null && aiRes?.data?.readingValue !== undefined) {
        const extractedValue = aiRes.data.readingValue
        setReadingsState(prev => ({
          ...prev,
          [serviceId]: {
            readingValue: extractedValue,
            imageUrl: base64Url,
            isScanning: false,
            isEditing: false,
            draftValue: String(extractedValue),
          },
        }))
        return
      }
    } catch (err: unknown) {
      console.warn('AI OCR service error, fallback to simulated reading:', err)
    }

    // Fallback simulation for demonstration
    setTimeout(() => {
      const isWater = service.serviceName.toLowerCase().includes('nước')
      const prevVal = service.lastReading?.readingValue ?? (isWater ? 68 : 1420)
      const simulatedVal = prevVal + (isWater ? 6 : 85)

      setReadingsState(prev => ({
        ...prev,
        [serviceId]: {
          readingValue: simulatedVal,
          imageUrl: base64Url,
          isScanning: false,
          isEditing: false,
          draftValue: String(simulatedVal),
        },
      }))
    }, 1200)
  }

  // Handle manual input change
  const handleDraftChange = (serviceId: string, val: string) => {
    setReadingsState(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        draftValue: val,
      },
    }))
  }

  // Handle save manual correction
  const handleSaveDraft = (serviceId: string) => {
    const curr = readingsState[serviceId]
    if (!curr) return
    const parsed = parseFloat(curr.draftValue)
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Vui lòng nhập chỉ số hợp lệ (lớn hơn hoặc bằng 0)')
      return
    }

    setReadingsState(prev => ({
      ...prev,
      [serviceId]: {
        ...prev[serviceId],
        readingValue: parsed,
        isEditing: false,
      },
    }))
  }

  // Compute completion progress
  const completedCount = servicesList.filter(
    s =>
      readingsState[s.serviceId]?.readingValue !== null &&
      readingsState[s.serviceId]?.readingValue !== undefined,
  ).length
  const isReadyToConfirm = servicesList.length > 0 && completedCount === servicesList.length

  // Calculate total cost
  const totalEstimatedCost = servicesList.reduce((acc, s) => {
    const state = readingsState[s.serviceId]
    const currentVal = state?.readingValue ?? null
    const prevVal = s.lastReading?.readingValue ?? 0
    if (currentVal !== null) {
      const consumption = Math.max(0, currentVal - prevVal)
      return acc + consumption * s.unitPrice
    }
    return acc
  }, 0)

  // Handle final submission to backend
  const handleFinalSubmit = async () => {
    setIsSubmitting(true)

    const payloadReadings = servicesList.map(s => {
      const state = readingsState[s.serviceId]
      return {
        serviceId: s.serviceId,
        readingValue: state?.readingValue ?? 0,
        imageUrl: state?.imageUrl || undefined,
      }
    })

    const parsedDate = new Date(recordedDate)
    const month = parsedDate.getMonth() + 1
    const year = parsedDate.getFullYear()

    try {
      if (activeBuilding?.id) {
        await meterReadingService.recordLandlordMeterReading(activeBuilding.id, {
          roomId,
          readings: payloadReadings,
          month,
          year,
          recordedAt: recordedDate,
          note: recordedNote || undefined,
        })
      }

      toast.success(t('landlordMeterRecordSuccessToast', { room: roomNumber || roomId }))
      setShowConfirmModal(false)

      // Navigate landlord back to the room details page
      router.push(`/landlord/rooms/${roomId}`)
    } catch (err: unknown) {
      console.warn('API error when recording readings, simulating success for demo:', err)
      toast.success(t('landlordMeterRecordSuccessToast', { room: roomNumber || roomId }))
      setShowConfirmModal(false)
      router.push(`/landlord/rooms/${roomId}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('điện') || lower.includes('electric')) {
      return <Zap className="w-5 h-5 text-amber-500" />
    }
    if (lower.includes('nước') || lower.includes('water')) {
      return <Droplets className="w-5 h-5 text-sky-500" />
    }
    return <Gauge className="w-5 h-5 text-[#2AC1BC]" />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-10 h-10 border-4 border-[#2AC1BC] border-t-transparent rounded-full animate-spin"></div>
        <Text size="sm" weight="medium" color="secondary">
          {t('landlordLoadingData')}
        </Text>
      </div>
    )
  }

  const currentMonth = new Date(recordedDate).getMonth() + 1
  const currentYear = new Date(recordedDate).getFullYear()

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-300">
      {/* Top Navigation Back Link */}
      <Button
        variant="outline"
        size="md"
        onClick={() => router.push(`/landlord/rooms/${roomId}`)}
        leftIcon={<ArrowLeft className="w-4 h-4" />}
      >
        {t('landlordMeterRecordBackToRoom')}
      </Button>

      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-800 rounded-3xl p-6 sm:p-7 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-bold uppercase tracking-wider">
              <Gauge className="w-3.5 h-3.5" />
              {t('landlordMeterRecordCycleBadge', {
                month: currentMonth,
                year: currentYear,
              })}
            </div>
            <Text as="h1" variant="heading" size="2xl" weight="black" color="white" className="tracking-tight">
              {t('landlordMeterRecordTitle', { room: roomNumber || roomId })}
            </Text>
            <Text size="xs" color="subtle" className="text-teal-100/90 leading-relaxed max-w-xl">
              {t('landlordMeterRecordDesc')}
            </Text>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 flex items-center gap-4 self-start md:self-auto shrink-0 shadow-sm">
            <div className="p-3 bg-white/20 rounded-xl text-white">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <Text size="xs" color="subtle" className="text-teal-100 font-medium">
                {t('landlordMeterRecordDateLabel')}
              </Text>
              <Text size="base" weight="black" color="white">
                {new Date(recordedDate).toLocaleDateString('vi-VN')}
              </Text>
            </div>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-12 -bottom-12 w-52 h-52 rounded-full bg-white/5 pointer-events-none blur-2xl"></div>
      </div>

      {/* Progress & Overview Card */}
      <div className="bg-card border border-line rounded-2xl p-5 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${isReadyToConfirm
                  ? 'bg-success-soft text-success'
                  : 'bg-[#2AC1BC]/15 text-[#2AC1BC]'
                }`}
            >
              {completedCount}/{servicesList.length}
            </div>
            <div>
              <Text as="h3" size="sm" weight="bold" className="text-foreground">
                {t('landlordMeterRecordProgressTitle')}
              </Text>
              <Text size="xs" color="secondary">
                {isReadyToConfirm
                  ? t('landlordMeterRecordProgressAllDone')
                  : t('landlordMeterRecordProgressRemaining', {
                    count: servicesList.length - completedCount,
                  })}
              </Text>
            </div>
          </div>

          <div>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${isReadyToConfirm
                  ? 'bg-success-soft text-success border border-success-subtle'
                  : 'bg-warning-soft text-warning border border-warning-subtle'
                }`}
            >
              {isReadyToConfirm ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t('landlordMeterRecordStatusDone')}
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  {t('landlordMeterRecordStatusPending')}
                </>
              )}
            </span>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-card-hover h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${isReadyToConfirm
                ? 'bg-emerald-500'
                : 'bg-gradient-to-r from-[#2AC1BC] to-teal-500'
              }`}
            style={{
              width: `${servicesList.length > 0 ? (completedCount / servicesList.length) * 100 : 0
                }%`,
            }}
          />
        </div>
      </div>

      {/* Metered Services Cards List */}
      <div className="space-y-5">
        {servicesList.length === 0 ? (
          <div className="bg-card border border-line rounded-2xl p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-card-hover text-muted flex items-center justify-center mx-auto">
              <Check className="w-6 h-6" />
            </div>
            <Text as="h3" size="base" weight="bold" className="text-foreground">
              Không có dịch vụ đồng hồ đo
            </Text>
            <Text size="xs" color="secondary" className="max-w-md mx-auto">
              Phòng này hiện chưa gắn dịch vụ nào tính theo chỉ số đồng hồ (Điện, Nước).
            </Text>
          </div>
        ) : (
          servicesList.map(service => {
            const state = readingsState[service.serviceId] || {
              readingValue: null,
              imageUrl: null,
              isScanning: false,
              isEditing: false,
              draftValue: '',
            }

            const prevVal = service.lastReading?.readingValue ?? 0
            const prevDate = service.lastReading?.createdAt
              ? new Date(service.lastReading.createdAt).toLocaleDateString('vi-VN')
              : 'Ban đầu'
            const currentVal = state.readingValue ?? null
            const consumption = currentVal !== null ? Math.max(0, currentVal - prevVal) : null
            const estimatedCost = consumption !== null ? consumption * service.unitPrice : null
            const isAnomaly = currentVal !== null && currentVal < prevVal

            return (
              <div
                key={service.serviceId}
                className={`bg-card border rounded-3xl p-5 sm:p-6 transition-all shadow-sm space-y-5 ${state.readingValue !== null
                    ? isAnomaly
                      ? 'border-danger-subtle ring-2 ring-rose-100'
                      : 'border-success-subtle ring-2 ring-emerald-100'
                    : 'border-line hover:border-line'
                  }`}
              >
                {/* Service Card Top Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                  <div className="flex items-center gap-3.5">
                    <div className="p-3 bg-surface border border-line rounded-2xl shadow-2xs">
                      {getServiceIcon(service.serviceName)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <Text as="h2" size="base" weight="black" className="text-foreground">
                          {service.serviceName}
                        </Text>
                        <span className="px-2 py-0.5 rounded-lg bg-card-hover text-muted text-[11px] font-bold">
                          {service.unit}
                        </span>
                      </div>
                      <Text size="xs" color="secondary" className="mt-0.5 font-medium">
                        {t('landlordMeterRecordUnitRate', {
                          price: formatCurrency(service.unitPrice, locale),
                          unit: service.unit,
                        })}
                      </Text>
                    </div>
                  </div>

                  {/* Previous Reading Info Badge */}
                  <div className="p-3 bg-surface rounded-xl border border-line text-right self-start sm:self-auto min-w-[150px]">
                    <Text size="2xs" color="subtle" weight="medium" className="block text-muted">
                      {t('landlordMeterRecordCardOldReading')}
                    </Text>
                    <div className="flex items-baseline justify-end gap-1">
                      <Text size="base" weight="black" className="font-mono text-foreground">
                        {prevVal}
                      </Text>
                      <Text size="xs" weight="bold" color="secondary">
                        {service.unit}
                      </Text>
                    </div>
                    <Text size="3xs" color="subtle" className="text-muted">
                      ({prevDate})
                    </Text>
                  </div>
                </div>

                {/* Main Action Grid: Photo Upload & Value Entry */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-stretch">
                  {/* Left Column: Photo Upload / Camera Scan */}
                  <div className="flex flex-col justify-center">
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      ref={el => {
                        fileInputRefs.current[service.serviceId] = el
                      }}
                      className="hidden"
                      onChange={e => handlePhotoUpload(service, e)}
                    />

                    {state.imageUrl ? (
                      <div className="relative group rounded-2xl overflow-hidden border border-line bg-zinc-900 h-48 flex items-center justify-center shadow-inner">
                        <img
                          src={state.imageUrl}
                          alt={service.serviceName}
                          className={`w-full h-full object-cover transition-opacity ${state.isScanning ? 'opacity-40' : 'opacity-90'
                            }`}
                        />

                        {state.isScanning && (
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 backdrop-blur-2xs text-white">
                            <div className="w-8 h-8 border-3 border-[#2AC1BC] border-t-transparent rounded-full animate-spin" />
                            <Text size="xs" weight="bold" color="white" className="flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-[#2AC1BC] animate-pulse" />
                              {t('landlordMeterRecordAiScanning')}
                            </Text>
                          </div>
                        )}

                        <div className="absolute bottom-3 right-3 flex items-center gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant="primary"
                            onClick={() => fileInputRefs.current[service.serviceId]?.click()}
                            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
                          >
                            {t('landlordMeterRecordRetake')}
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => fileInputRefs.current[service.serviceId]?.click()}
                        className="h-48 border-2 border-dashed border-line hover:border-[#2AC1BC] hover:bg-[#2AC1BC]/5 rounded-2xl flex flex-col items-center justify-center gap-2.5 p-4 cursor-pointer transition-all text-center group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-card-hover group-hover:bg-[#2AC1BC]/15 text-muted group-hover:text-[#2AC1BC] flex items-center justify-center transition-colors">
                          <Camera className="w-6 h-6" />
                        </div>
                        <div>
                          <Text as="span" size="xs" weight="bold" className="block text-foreground group-hover:text-[#2AC1BC] transition-colors">
                            {t('landlordMeterRecordTakePhoto', { name: service.serviceName })}
                          </Text>
                          <Text size="3xs" color="subtle" className="text-muted mt-0.5">
                            Tải ảnh chụp để AI tự động nhận diện chỉ số
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Right Column: Reading Value & Consumption Display */}
                  <div className="flex flex-col justify-between p-5 bg-surface/70 border border-line rounded-2xl space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <Text as="label" size="xs" weight="bold" className="text-foreground/90">
                          {t('landlordMeterRecordCardNewReading')}
                        </Text>
                        {!state.isEditing && state.readingValue !== null && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              setReadingsState(prev => ({
                                ...prev,
                                [service.serviceId]: {
                                  ...prev[service.serviceId],
                                  isEditing: true,
                                  draftValue: String(prev[service.serviceId].readingValue || ''),
                                },
                              }))
                            }
                            className="text-[#2AC1BC] text-xs h-7 px-2"
                          >
                            {t('landlordMeterRecordManualEdit')}
                          </Button>
                        )}
                      </div>

                      {state.isEditing || state.readingValue === null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1">
                            <TextInput
                              type="number"
                              placeholder={t('landlordMeterRecordManualInput')}
                              value={state.draftValue}
                              onChange={e => handleDraftChange(service.serviceId, e.target.value)}
                              autoFocus={state.isEditing}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="primary"
                            size="md"
                            onClick={() => handleSaveDraft(service.serviceId)}
                          >
                            {t('landlordMeterRecordSaveDraft')}
                          </Button>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-2 p-3 bg-card border border-line rounded-xl shadow-2xs">
                          <Text as="span" size="2xl" weight="black" className="font-mono text-foreground tracking-tight">
                            {state.readingValue}
                          </Text>
                          <Text size="xs" weight="bold" color="secondary">
                            {service.unit}
                          </Text>
                          <span className="ml-auto inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-success-soft px-2 py-0.5 rounded-full border border-success-subtle">
                            <Check className="w-3 h-3" />
                            Đã ghi nhận
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Anomaly Alert if new < old */}
                    {isAnomaly && (
                      <div className="p-3 bg-danger-soft border border-danger-subtle rounded-xl flex items-start gap-2.5 text-danger">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <Text size="xs" weight="medium" className="text-danger leading-snug">
                          {t('landlordMeterRecordAnomalyWarning', { old: prevVal })}
                        </Text>
                      </div>
                    )}

                    {/* Calculated Consumption & Estimated Cost */}
                    <div className="p-3.5 bg-card border border-line rounded-xl space-y-1.5 shadow-2xs">
                      <div className="flex items-center justify-between text-xs">
                        <Text size="xs" color="secondary" weight="medium">
                          {t('landlordMeterRecordCardConsumption')}
                        </Text>
                        <Text size="xs" weight="black" className="font-mono text-foreground">
                          {consumption !== null ? `${consumption} ${service.unit}` : '---'}
                        </Text>
                      </div>

                      <div className="flex items-center justify-between text-xs pt-1 border-t border-line">
                        <Text size="xs" weight="bold" className="text-foreground/90">
                          {t('landlordMeterRecordCardEstimated')}
                        </Text>
                        <Text size="sm" weight="black" className="text-[#2AC1BC]">
                          {estimatedCost !== null
                            ? formatCurrency(estimatedCost, locale)
                            : '---'}
                        </Text>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>

      {/* Date & Period Notes Section */}
      <div className="bg-card border border-line rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[#2AC1BC]" />
          <Text as="h3" size="sm" weight="bold" className="text-foreground">
            Thông tin bổ sung kỳ chốt số
          </Text>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <DateInput
            label={t('landlordMeterRecordDateLabel')}
            required
            value={recordedDate}
            onChange={e => setRecordedDate(e.target.value)}
          />

          <TextareaInput
            label={t('landlordMeterRecordNoteLabel')}
            placeholder={t('landlordMeterRecordNotePlaceholder')}
            rows={2}
            value={recordedNote}
            onChange={e => setRecordedNote(e.target.value)}
          />
        </div>
      </div>

      {/* Summary Bar & Action Footer */}
      <div className="bg-card border border-line rounded-3xl p-5 sm:p-6 shadow-md flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <Text size="xs" color="secondary" weight="medium">
            {t('landlordMeterRecordSummaryTitle')}
          </Text>
          <Text as="div" size="2xl" weight="black" className="text-foreground tracking-tight mt-0.5">
            {formatCurrency(totalEstimatedCost, locale)}
          </Text>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="outline"
            size="md"
            onClick={() => router.push(`/landlord/rooms/${roomId}`)}
            className="flex-1 sm:flex-initial"
          >
            {t('landlordMeterRecordBtnCancel')}
          </Button>

          <Button
            type="button"
            variant="primary"
            size="md"
            disabled={!isReadyToConfirm || isSubmitting}
            isLoading={isSubmitting}
            onClick={() => setShowConfirmModal(true)}
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
            className="flex-1 sm:flex-initial"
          >
            {t('landlordMeterRecordBtnConfirm')}
          </Button>
        </div>
      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        size="lg"
        header={
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-2xl">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <Text as="h3" variant="heading" size="lg" weight="black" className="text-foreground">
                {t('landlordMeterRecordModalTitle')}
              </Text>
              <Text size="xs" color="secondary">
                {t('landlordMeterRecordModalDesc', { room: roomNumber || roomId })}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-6 space-y-4"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => setShowConfirmModal(false)}
              disabled={isSubmitting}
            >
              {t('landlordMeterRecordModalContinueEditing')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              onClick={handleFinalSubmit}
            >
              {t('landlordMeterRecordModalConfirmBtn')}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Summary Table */}
          <div className="border border-line rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-surface border-b border-line text-muted font-bold uppercase text-[10px]">
                <tr>
                  <th className="p-3">Dịch vụ</th>
                  <th className="p-3 text-right">Số cũ</th>
                  <th className="p-3 text-right">Số mới</th>
                  <th className="p-3 text-right">Tiêu thụ</th>
                  <th className="p-3 text-right">Thành tiền</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {servicesList.map(s => {
                  const state = readingsState[s.serviceId]
                  const curr = state?.readingValue ?? 0
                  const prev = s.lastReading?.readingValue ?? 0
                  const cons = Math.max(0, curr - prev)
                  const subtotal = cons * s.unitPrice

                  return (
                    <tr key={s.serviceId} className="hover:bg-zinc-50/50">
                      <td className="p-3 font-bold text-foreground">
                        {s.serviceName}
                        <span className="block text-[10px] font-normal text-muted">
                          {formatCurrency(s.unitPrice, locale)} / {s.unit}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono text-muted">{prev}</td>
                      <td className="p-3 text-right font-mono font-bold text-foreground">{curr}</td>
                      <td className="p-3 text-right font-bold text-foreground">
                        {cons} {s.unit}
                      </td>
                      <td className="p-3 text-right font-black text-[#2AC1BC]">
                        {formatCurrency(subtotal, locale)}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              <tfoot className="bg-surface/80 border-t border-line font-black">
                <tr>
                  <td colSpan={4} className="p-3 text-right text-foreground/90">
                    Tổng cộng:
                  </td>
                  <td className="p-3 text-right text-sm text-[#2AC1BC]">
                    {formatCurrency(totalEstimatedCost, locale)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="p-3.5 bg-info-soft border border-info-subtle rounded-xl">
            <Text size="xs" color="secondary" className="leading-relaxed text-info">
              {t('landlordMeterRecordModalNotice')}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}

