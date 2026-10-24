'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import {
  Gauge,
  Zap,
  Droplets,
  Camera,
  CheckCircle2,
  Clock,
  ArrowRight,
  Receipt,
  FileCheck,
  Check,
  Sparkles,
  Info,
  Calendar,
  AlertTriangle,
  AlertCircle,
  RefreshCw,
} from 'lucide-react'
import { Button, TextInput, Modal, Text, EmptyState } from '@/components/ui'
import {
  meterReadingService,
  ActiveMeteredServicesResponse,
  ConfirmReadingsResponse,
} from '@/services/meter-reading.service'
import Link from 'next/link'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency } from '@/utils'

export default function TenantMeterReadingsPage() {
  const t = useTranslations('tenantPortal')
  const { locale } = useLanguage()
  const { toast } = useToast()
  const { activeTenancyId } = useAuth()

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<ActiveMeteredServicesResponse | null>(null)
  const [error, setError] = useState<{ isNoContract?: boolean; message?: string } | null>(null)
  const [readingsState, setReadingsState] = useState<
    Record<
      string,
      {
        readingValue: number | null
        imageUrl: string | null
        isScanning: boolean
        isSaved: boolean
        isEditing: boolean
        draftValue: string
      }
    >
  >({})

  // Confirmation modal & Invoice result state
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [generatedInvoice, setGeneratedInvoice] = useState<ConfirmReadingsResponse | null>(null)

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Real data fetcher
  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await meterReadingService.getActiveMeteredServices(
        activeTenancyId || undefined,
      )
      setData(res)

      // Initialize local state from real backend response
      const stateMap: typeof readingsState = {}
      ;(res?.meteredServices || []).forEach(s => {
        const val = s.currentReading?.readingValue ?? null
        stateMap[s.serviceId] = {
          readingValue: val,
          imageUrl: s.currentReading?.imageUrl ?? null,
          isScanning: false,
          isSaved: val !== null,
          isEditing: false,
          draftValue: val !== null ? String(val) : '',
        }
      })
      setReadingsState(stateMap)
    } catch (err: any) {
      console.error('Error loading meter services:', err)
      const status = err?.status || err?.response?.status
      const isNotFound =
        status === 404 ||
        err?.message?.includes('hợp đồng') ||
        err?.message?.includes('contract')
      setError({
        isNoContract: Boolean(isNotFound),
        message: err?.message,
      })
      setData(null)
      setReadingsState({})
    } finally {
      setLoading(false)
    }
  }, [activeTenancyId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Helper to compress camera / gallery photos before uploading
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

  // Handle Photo Selection & Real AI OCR Upload
  const handlePhotoUpload = async (serviceId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Compress photo to clean lightweight JPEG
    const base64Url = await compressImageFile(file)

    setReadingsState(prev => ({
      ...prev,
      [serviceId]: {
        ...(prev[serviceId] || { isSaved: false, readingValue: null, draftValue: '' }),
        imageUrl: base64Url,
        isScanning: true,
        isEditing: false,
      },
    }))

    try {
      const serviceItem = data?.meteredServices.find(s => s.serviceId === serviceId)
      const serviceType = serviceItem?.serviceName?.toLowerCase().includes('nước')
        ? 'water'
        : 'electricity'

      let detectedValue: number | null = null

      try {
        const aiRes = await meterReadingService.scanMeterWithAi(base64Url, serviceType)
        if (
          aiRes?.success &&
          aiRes.data?.readingValue !== null &&
          aiRes.data?.readingValue !== undefined
        ) {
          detectedValue = aiRes.data.readingValue
        }
      } catch (aiErr) {
        console.warn('AI Vision scan fallback to backend upload:', aiErr)
      }

      // Call backend upload endpoint with detectedValue (or let backend OCR extract)
      const res = await meterReadingService.uploadMeterReading({
        serviceId,
        imageUrl: base64Url,
        contractId: activeTenancyId || undefined,
        ...(detectedValue !== null ? { readingValue: detectedValue } : {}),
      })

      const finalValue = res.readingValue ?? detectedValue

      setReadingsState(prev => ({
        ...prev,
        [serviceId]: {
          readingValue: finalValue,
          imageUrl: base64Url,
          isScanning: false,
          isSaved: finalValue !== null,
          isEditing: finalValue === null,
          draftValue: finalValue !== null ? String(finalValue) : '',
        },
      }))

      if (finalValue !== null) {
        toast.success(t('readingSavedSuccess', { service: serviceItem?.serviceName || '' }))
      } else {
        toast.warning(t('ocrExtractFailed'))
      }
    } catch (err: any) {
      console.error('OCR upload API error:', err)
      toast.error(err?.message || t('ocrExtractFailed'))
      setReadingsState(prev => ({
        ...prev,
        [serviceId]: {
          ...(prev[serviceId] || { readingValue: null, draftValue: '', isSaved: false }),
          imageUrl: base64Url,
          isScanning: false,
          isEditing: true,
        },
      }))
    }
  }

  // Handle manual correction save
  const handleSaveCorrection = async (serviceId: string) => {
    const currentState = readingsState[serviceId]
    if (!currentState) return

    const parsed = parseFloat(currentState.draftValue)
    if (isNaN(parsed) || parsed < 0) {
      toast.error(t('invalidNumberError'))
      return
    }

    const serviceItem = data?.meteredServices.find(s => s.serviceId === serviceId)
    const existingReadingId = serviceItem?.currentReading?.id

    try {
      if (existingReadingId) {
        await meterReadingService.updateMeterReading(existingReadingId, parsed)
      } else if (currentState.imageUrl) {
        await meterReadingService.uploadMeterReading({
          serviceId,
          imageUrl: currentState.imageUrl,
          readingValue: parsed,
          contractId: activeTenancyId || undefined,
        })
      } else {
        await meterReadingService.uploadMeterReading({
          serviceId,
          imageUrl: '',
          readingValue: parsed,
          contractId: activeTenancyId || undefined,
        })
      }

      setReadingsState(prev => ({
        ...prev,
        [serviceId]: {
          ...prev[serviceId],
          readingValue: parsed,
          isSaved: true,
          isEditing: false,
        },
      }))
      toast.success(t('readingSavedSuccess', { service: serviceItem?.serviceName || '' }))
    } catch (err: any) {
      console.error('Error updating reading:', err)
      toast.error(err?.message || t('readingSaveError'))
    }
  }

  // Compute completion status
  const servicesList = data?.meteredServices || []
  const completedCount = servicesList.filter(
    s =>
      readingsState[s.serviceId]?.readingValue !== null &&
      readingsState[s.serviceId]?.readingValue !== undefined,
  ).length
  const isReadyToConfirm = servicesList.length > 0 && completedCount === servicesList.length

  // Handle Confirm & Generate Real Invoice
  const handleConfirmSubmit = async () => {
    setIsSubmitting(true)
    try {
      const invoiceRes = await meterReadingService.confirmAndGenerateInvoice(
        activeTenancyId || undefined,
      )
      setGeneratedInvoice(invoiceRes)
      setShowConfirmModal(false)
      toast.success(t('invoiceGeneratedSuccessTitle'))
    } catch (err: any) {
      console.error('Confirm API failed:', err)
      toast.error(err?.message || t('confirmInvoiceError'))
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
    return <Gauge className="w-5 h-5 text-teal-600" />
  }

  // 1. Loading State
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
        <Text size="sm" weight="medium" color="secondary">
          {t('loadingMeterServices')}
        </Text>
      </div>
    )
  }

  // 2. Error / No Active Tenancy State
  if (error) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          icon={<AlertCircle className="w-8 h-8 text-warning" />}
          title={error.isNoContract ? t('noActiveTenancyTitle') : t('meterLoadErrorTitle')}
          description={
            error.isNoContract
              ? t('noActiveTenancyDesc')
              : error.message || t('meterLoadErrorDesc')
          }
          action={
            <Button
              variant="outline"
              onClick={() => loadData()}
              leftIcon={<RefreshCw />}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('btnRetry')}
              </Text>
            </Button>
          }
          secondaryAction={
            <Button href="/tenant">
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('btnBackToDashboard')}
              </Text>
            </Button>
          }
        />
      </div>
    )
  }

  // 3. Empty Services State
  if (!data || servicesList.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <EmptyState
          icon={<Gauge className="w-8 h-8 text-primary" />}
          title={t('noMeteredServicesTitle')}
          description={t('noMeteredServicesDesc')}
          action={
            <Button href="/tenant">
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('btnBackToDashboard')}
              </Text>
            </Button>
          }
        />
      </div>
    )
  }

  // 4. Main Meter Readings Flow
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-teal-600 via-teal-700 to-cyan-800 rounded-2xl p-6 text-white shadow-lg">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-teal-100 text-xs font-semibold uppercase tracking-wider mb-2">
              <Gauge className="w-3.5 h-3.5" />
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('currentBillingCycleBadge')}
              </Text>
            </div>
            <Text as="h1" size="2xl" weight="black" color="inherit" className="tracking-tight text-white">
              {t('meterReadingsTitle', { room: data.roomNumber })}
            </Text>
            <Text size="sm" color="inherit" className="text-teal-100 mt-1 max-w-xl">
              {t('meterReadingsDesc')}
            </Text>
          </div>

          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 flex items-center gap-4 self-start md:self-auto">
            <div className="p-3 bg-white/20 rounded-lg">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <Text size="xs" color="inherit" weight="medium" className="text-teal-100">
                {t('meterClosingDeadline')}
              </Text>
              <Text size="lg" weight="black" color="inherit" className="text-white">
                {t('monthlyClosingDate', { day: data.monthlyPaymentDate })}
              </Text>
            </div>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-full bg-white/5 pointer-events-none blur-xl" />
      </div>

      {/* Progress & Overview Bar */}
      <div className="bg-card border border-line rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs ${
                isReadyToConfirm ? 'bg-success-soft text-success' : 'bg-primary-soft text-primary'
              }`}
            >
              {completedCount}/{servicesList.length}
            </div>
            <div>
              <Text as="h3" size="sm" weight="bold" color="default">
                {t('meterInputProgress')}
              </Text>
              <Text size="xs" color="secondary">
                {isReadyToConfirm
                  ? t('allMetersReady')
                  : t('metersRemainingCount', {
                      count: servicesList.length - completedCount,
                    })}
              </Text>
            </div>
          </div>

          <div className="text-right">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                isReadyToConfirm
                  ? 'bg-success-soft text-success border border-success-subtle'
                  : 'bg-warning-soft text-warning border border-warning-subtle'
              }`}
            >
              {isReadyToConfirm ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('completedStatus')}
                  </Text>
                </>
              ) : (
                <>
                  <Clock className="w-3.5 h-3.5" />
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('pendingInputStatus')}
                  </Text>
                </>
              )}
            </span>
          </div>
        </div>

        {/* Progress bar line */}
        <div className="w-full bg-card-hover h-2.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isReadyToConfirm ? 'bg-emerald-500' : 'bg-gradient-to-r from-teal-500 to-cyan-500'
            }`}
            style={{
              width: `${
                servicesList.length > 0 ? (completedCount / servicesList.length) * 100 : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Metered Services Cards List */}
      <div className="space-y-4">
        {servicesList.map(service => {
          const state = readingsState[service.serviceId] || {
            readingValue: null,
            imageUrl: null,
            isScanning: false,
            isSaved: false,
            isEditing: false,
            draftValue: '',
          }

          const prevVal = service.previousReading?.readingValue ?? 0
          const currentVal = state.readingValue ?? null
          const isAnomaly = currentVal !== null && currentVal < prevVal
          const consumption = currentVal !== null ? Math.max(0, currentVal - prevVal) : null
          const estimatedCost = consumption !== null ? consumption * service.unitPrice : null

          return (
            <div
              key={service.serviceId}
              className={`bg-card border rounded-2xl p-5 md:p-6 transition-all shadow-sm ${
                isAnomaly
                  ? 'border-amber-300 ring-1 ring-amber-100'
                  : state.readingValue !== null
                    ? 'border-success-subtle ring-1 ring-emerald-100'
                    : 'border-line hover:border-teal-300'
              }`}
            >
              {/* Service Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-line">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-surface border border-line flex items-center justify-center shadow-inner">
                    {getServiceIcon(service.serviceName)}
                  </div>
                  <div>
                    <Text as="h3" size="base" weight="bold" color="default">
                      {service.serviceName}
                    </Text>
                    <div className="flex items-center gap-2 text-xs text-muted mt-0.5">
                      <Text as="span" size="xs" color="secondary">
                        {t('unitPriceLabel')} <strong className="text-foreground/90">{formatCurrency(service.unitPrice, locale)} / {service.unit}</strong>
                      </Text>
                      {service.previousReading && (
                        <>
                          <span>•</span>
                          <Text as="span" size="xs" color="secondary">
                            {t('previousCycleLabel')}{' '}
                            <strong className="text-foreground/90">
                              {service.previousReading.readingValue.toLocaleString(
                                locale === 'en' ? 'en-US' : 'vi-VN',
                              )}{' '}
                              {service.unit}
                            </strong>
                          </Text>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Status Badge */}
                <div>
                  {state.readingValue !== null ? (
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
                        isAnomaly
                          ? 'bg-warning-soft text-warning border border-warning-subtle'
                          : 'bg-success-soft text-success border border-success-subtle'
                      }`}
                    >
                      {isAnomaly ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-warning" />
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      )}
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('readingRecorded', {
                          value: state.readingValue.toLocaleString(
                            locale === 'en' ? 'en-US' : 'vi-VN',
                          ),
                          unit: service.unit,
                        })}
                      </Text>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-card-hover text-muted">
                      <Clock className="w-3.5 h-3.5" />
                      <Text as="span" size="xs" weight="medium" color="inherit">
                        {t('noReadingYet')}
                      </Text>
                    </span>
                  )}
                </div>
              </div>

              {/* Anomaly warning banner if new reading is less than previous */}
              {isAnomaly && (
                <div className="mt-3 p-3 bg-warning-soft border border-warning-subtle rounded-xl flex items-center gap-2.5 text-warning text-xs">
                  <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                  <Text as="span" size="xs" weight="medium" color="inherit">
                    {t('anomalyWarning', { old: prevVal })}
                  </Text>
                </div>
              )}

              {/* Upload & Reading Content Area */}
              <div className="mt-5 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                {/* Left Column: Image Preview / Upload Box */}
                <div className="md:col-span-5">
                  <TextInput
                    type="file"
                    accept="image/*"
                    capture="environment"
                    ref={el => {
                      fileInputRefs.current[service.serviceId] = el
                    }}
                    containerClassName="hidden"
                    className="hidden"
                    onChange={e => handlePhotoUpload(service.serviceId, e)}
                  />

                  {state.imageUrl ? (
                    <div className="relative group rounded-xl overflow-hidden border border-line bg-slate-900 aspect-video md:aspect-[4/3] flex items-center justify-center">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={state.imageUrl}
                        alt={t('meterImageAlt', { name: service.serviceName })}
                        className="w-full h-full object-cover"
                      />

                      {/* OCR Scanning Overlay Animation */}
                      {state.isScanning && (
                        <div className="absolute inset-0 bg-teal-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-white space-y-2">
                          <div className="relative">
                            <Sparkles className="w-8 h-8 text-teal-300 animate-spin" />
                          </div>
                          <Text as="span" size="xs" weight="bold" color="inherit" className="tracking-wide animate-pulse text-white">
                            {t('ocrScanning')}
                          </Text>
                        </div>
                      )}

                      {/* Retake Photo Overlay */}
                      {!state.isScanning && (
                        <Button
                          variant="ghost"
                          leftIcon={<Camera />}
                          onClick={() => fileInputRefs.current[service.serviceId]?.click()}
                          className="absolute bottom-2 right-2 backdrop-blur-md opacity-90 hover:opacity-100 bg-black/40 text-white hover:bg-black/60"
                        >
                          <Text as="span" size="xs" weight="medium" color="inherit">
                            {t('retakePhoto')}
                          </Text>
                        </Button>
                      )}
                    </div>
                  ) : (
                    <Button
                      fullWidth
                      variant="ghost"
                      onClick={() => fileInputRefs.current[service.serviceId]?.click()}
                      className="aspect-video md:aspect-[4/3] flex-col group border-2 border-dashed border-line hover:border-teal-400 bg-surface/50"
                    >
                      <div className="w-12 h-12 rounded-full bg-primary-soft text-teal-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                        <Camera className="w-6 h-6" />
                      </div>
                      <Text as="span" size="sm" weight="bold" color="default" className="group-hover:text-teal-700">
                        {t('takeMeterPhoto', { name: service.serviceName })}
                      </Text>
                      <Text as="span" size="xs" color="subtle" className="mt-0.5">
                        {t('cameraOrFileSupport')}
                      </Text>
                    </Button>
                  )}
                </div>

                {/* Right Column: Extracted Reading & Manual Verification Form */}
                <div className="md:col-span-7 space-y-4">
                  <div className="bg-surface/80 border border-line rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-muted uppercase tracking-wider flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                        <Text as="span" size="xs" weight="bold" color="secondary">
                          {t('meterReadingLabelWithUnit', { unit: service.unit })}
                        </Text>
                      </label>

                      {state.readingValue !== null && !state.isEditing && (
                        <Button
                          variant="ghost"
                          onClick={() =>
                            setReadingsState(prev => ({
                              ...prev,
                              [service.serviceId]: {
                                ...prev[service.serviceId],
                                isEditing: true,
                              },
                            }))
                          }
                          className="hover:underline"
                        >
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {t('manualEditBtn')}
                          </Text>
                        </Button>
                      )}
                    </div>

                    {state.isEditing || state.readingValue === null ? (
                      <div className="flex items-center gap-2">
                        <TextInput
                          type="number"
                          step="any"
                          placeholder={t('enterMeterReadingPlaceholder')}
                          value={state.draftValue}
                          onChange={e =>
                            setReadingsState(prev => ({
                              ...prev,
                              [service.serviceId]: {
                                ...prev[service.serviceId],
                                draftValue: e.target.value,
                              },
                            }))
                          }
                          containerClassName="space-y-0 flex-1"
                          className="w-full py-2.5 bg-card border-line rounded-lg text-lg font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500"
                          rightIcon={
                            <span className="text-xs font-medium text-muted pr-1">
                              {service.unit}
                            </span>
                          }
                        />

                        <Button onClick={() => handleSaveCorrection(service.serviceId)}>
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {t('btnSaveReading')}
                          </Text>
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-baseline justify-between bg-card border border-success-subtle rounded-lg px-4 py-3">
                        <div>
                          <Text as="span" size="2xl" weight="black" color="default" className="tracking-tight">
                            {state.readingValue.toLocaleString(
                              locale === 'en' ? 'en-US' : 'vi-VN',
                            )}
                          </Text>
                          <Text as="span" size="xs" weight="bold" color="secondary" className="ml-1.5">
                            {service.unit}
                          </Text>
                        </div>
                        <span className="text-xs text-success bg-success-soft font-medium px-2 py-0.5 rounded">
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {t('validReadingBadge')}
                          </Text>
                        </span>
                      </div>
                    )}

                    {/* Calculation Breakdown Preview */}
                    {consumption !== null && (
                      <div className="pt-2 border-t border-line grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <Text size="xs" color="secondary">
                            {t('consumptionLabel')}
                          </Text>
                          <Text size="sm" weight="bold" color="default" className="mt-0.5">
                            {consumption.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')}{' '}
                            {service.unit}
                          </Text>
                        </div>
                        <div className="text-right">
                          <Text size="xs" color="secondary">
                            {t('estimatedCostLabel')}
                          </Text>
                          <Text size="sm" weight="bold" className="text-primary mt-0.5">
                            {estimatedCost !== null ? formatCurrency(estimatedCost, locale) : '-'}
                          </Text>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Footer */}
      {servicesList.length > 0 && (
        <div className="sticky bottom-4 bg-card/95 backdrop-blur-md border border-line rounded-2xl p-4 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-muted">
            <Info className="w-4 h-4 text-teal-600 shrink-0" />
            <Text as="span" size="xs" color="secondary">
              {t('confirmWarningNotice')}
            </Text>
          </div>

          <Button
            size="lg"
            onClick={() => setShowConfirmModal(true)}
            disabled={!isReadyToConfirm}
            rightIcon={<ArrowRight />}
            className="sm:w-auto"
          >
            <Text as="span" size="sm" weight="bold" color="inherit">
              {t('confirmAndViewInvoiceBtn')}
            </Text>
          </Button>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal isOpen={showConfirmModal} onClose={() => setShowConfirmModal(false)} size="lg">
        <Modal.Header
          title={t('confirmMeterModalTitle')}
          icon={
            <div className="w-9 h-9 rounded-xl bg-primary-soft text-primary flex items-center justify-center font-bold">
              <FileCheck className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="space-y-5">
          <Text size="sm" color="secondary">
            {t('confirmMeterModalDesc', { room: data.roomNumber })}
          </Text>

          {/* Summary Table */}
          <div className="bg-surface border border-line rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-card-hover/80 text-muted font-semibold uppercase tracking-wider border-b border-line">
                <tr>
                  <th className="px-3.5 py-2.5">{t('tableHeaderService')}</th>
                  <th className="px-3 py-2.5 text-center">{t('tableHeaderOldReading')}</th>
                  <th className="px-3 py-2.5 text-center">{t('tableHeaderNewReading')}</th>
                  <th className="px-3.5 py-2.5 text-right">{t('tableHeaderConsumption')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {servicesList.map(service => {
                  const current = readingsState[service.serviceId]?.readingValue ?? 0
                  const prev = service.previousReading?.readingValue ?? 0
                  const diff = Math.max(0, current - prev) || current

                  return (
                    <tr key={service.serviceId}>
                      <td className="px-3.5 py-2.5 font-medium text-foreground">
                        {service.serviceName}
                      </td>
                      <td className="px-3 py-2.5 text-center text-muted">{prev}</td>
                      <td className="px-3 py-2.5 text-center font-bold text-primary">
                        {current}
                      </td>
                      <td className="px-3.5 py-2.5 text-right font-bold text-foreground">
                        {diff} {service.unit}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowConfirmModal(false)}
            disabled={isSubmitting}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('btnContinueEditing')}
            </Text>
          </Button>

          <Button
            onClick={handleConfirmSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            leftIcon={<Check />}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('btnConfirmAndGenerate')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Generated Invoice Success Modal */}
      <Modal
        isOpen={Boolean(generatedInvoice)}
        onClose={() => setGeneratedInvoice(null)}
        size="lg"
      >
        <Modal.Body className="space-y-5">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-full bg-success-soft text-success flex items-center justify-center mx-auto">
              <Receipt className="w-7 h-7" />
            </div>
            <Text as="h3" weight="bold" size="xl" color="default">
              {t('invoiceGeneratedSuccessTitle')}
            </Text>
            <Text size="xs" color="subtle">
              {t('invoiceGeneratedSuccessDesc', { id: generatedInvoice?.invoiceId || '' })}
            </Text>
          </div>

          {/* Total Amount Box */}
          {generatedInvoice && (
            <>
              <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-primary-subtle rounded-xl p-4 text-center">
                <Text size="xs" weight="bold" className="text-primary uppercase tracking-wider">
                  {t('totalAmountDue')}
                </Text>
                <div className="text-3xl font-black text-primary mt-1">
                  {formatCurrency(generatedInvoice.totalAmount, locale)}
                </div>
                <Text size="xs" color="secondary" className="mt-1 block">
                  {t('invoiceDueDateLabel', {
                    date: new Date(generatedInvoice.dueDate).toLocaleDateString(
                      locale === 'en' ? 'en-US' : 'vi-VN',
                    ),
                  })}
                </Text>
              </div>

              {/* Invoice Line Items */}
              <div className="border border-line rounded-xl overflow-hidden">
                <div className="bg-card-hover px-4 py-2 text-xs font-semibold text-muted uppercase tracking-wider">
                  <Text as="span" size="xs" weight="bold" color="secondary">
                    {t('invoiceLineItemsTitle')}
                  </Text>
                </div>
                <div className="divide-y divide-line">
                  {generatedInvoice.items?.map(item => (
                    <div
                      key={item.id}
                      className="px-4 py-2.5 flex items-center justify-between text-xs"
                    >
                      <Text as="span" size="xs" weight="medium" color="default">
                        {item.title}
                      </Text>
                      <Text as="span" size="xs" weight="bold" color="default">
                        {formatCurrency(item.amount, locale)}
                      </Text>
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <Button
                  href="/tenant/invoices"
                  variant="outline"
                  fullWidth
                  className="w-full sm:w-1/2"
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('viewInvoicesListBtn')}
                  </Text>
                </Button>

                <Button
                  href="/tenant/invoices"
                  fullWidth
                  className="w-full sm:w-1/2"
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('payNowVietQrBtn')}
                  </Text>
                </Button>
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
