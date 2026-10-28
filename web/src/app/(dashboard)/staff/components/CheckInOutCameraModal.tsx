'use client'

import React, { useState, useEffect, useRef } from 'react'
import {
  Camera,
  LogOut,
  ShieldCheck,
  RefreshCw,
  MapPin,
  Image as Upload,
  AlertTriangle,
  Clock,
  Check,
} from 'lucide-react'
import {
  AttendanceWatermark,
  getLocalizedPlace,
  getLocalizedStaffName,
} from '../data'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Button, TextInput, TextareaInput, Text, Chip, Modal } from '@/components/ui'
import { LiveClockBadge } from './LiveClockBadge'

// =======================================================================================
// HELPER: REAL-WORLD REVERSE GEOCODING (STRICTLY ACTUAL ADDRESS, NO BOARDING HOUSE SUFFIX)
// =======================================================================================
async function resolveRealGpsAddress(
  lat: number,
  lng: number,
  isEn = false,
): Promise<{ address: string; coordinates: string }> {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
  const coords = `${latStr}, ${lngStr}`

  // 1. Nominatim OpenStreetMap (Standard Street & Administrative Address)
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&accept-language=${isEn ? 'en' : 'vi'}`,
      { signal: AbortSignal.timeout(3500) },
    )
    if (res.ok) {
      const data = await res.json()
      if (data && data.address) {
        const addr = data.address
        const street = addr.road || addr.street || addr.pedestrian || addr.suburb
        const ward = addr.suburb || addr.quarter || addr.neighbourhood || addr.village
        const district = addr.city_district || addr.district || addr.county
        const city = addr.city || addr.state || addr.province

        const parts = [street, ward, district, city].filter(Boolean)
        const unique = parts.filter((item, idx) => parts.indexOf(item) === idx)
        if (unique.length >= 2) {
          return { address: getLocalizedPlace(unique.join(', '), isEn), coordinates: coords }
        }
      }
      if (data && data.display_name) {
        return {
          address: getLocalizedPlace(
            data.display_name.split(',').slice(0, 4).join(',').trim(),
            isEn,
          ),
          coordinates: coords,
        }
      }
    }
  } catch {
    // Fallback to secondary provider
  }

  // 2. BigDataCloud Reverse Geocoding Client API
  try {
    const res = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=${isEn ? 'en' : 'vi'}`,
      { signal: AbortSignal.timeout(3500) },
    )
    if (res.ok) {
      const data = await res.json()
      const parts = [
        data.locality || data.localityInfo?.administrative?.[3]?.name,
        data.city || data.principalSubdivisionCode || data.localityInfo?.administrative?.[2]?.name,
        data.principalSubdivision || data.countryName,
      ].filter(Boolean)
      if (parts.length > 0) {
        return { address: getLocalizedPlace(parts.join(', '), isEn), coordinates: coords }
      }
    }
  } catch {
    // Offline / timeout fallback
  }

  // 3. Fallback: Pure GPS Coordinates (No boarding house name added)
  return {
    address: isEn ? `GPS Coordinates: ${coords}` : `Tọa độ GPS: ${coords}`,
    coordinates: coords,
  }
}

// =======================================================================================
// SUB-COMPONENT: CHECK-IN / CHECK-OUT REAL DEVICE CAMERA MODAL (NO UPLOAD ALLOWED)
// =======================================================================================
export interface CheckInOutCameraModalProps {
  mode: 'checkin' | 'checkout'
  isLate: boolean
  isEarly: boolean
  shiftName: string
  shiftStartTime?: string
  shiftEndTime?: string
  effectiveTime: string
  boardingHouseName: string
  staffName?: string
  onClose: () => void
  onSubmit: (data: {
    photo: string
    watermark: AttendanceWatermark
    capturedTime: string
    capturedDate?: string
    explanation?: string
  }) => void
  onChangeDraft: () => void
}

export function CheckInOutCameraModal({
  mode,
  isLate,
  isEarly,
  shiftName,
  shiftStartTime,
  shiftEndTime,
  effectiveTime,
  boardingHouseName,
  staffName,
  onClose,
  onSubmit,
  onChangeDraft,
}: CheckInOutCameraModalProps) {
  const t = useTranslations('staffPortal')
  const { locale } = useLanguage()
  const isEn = locale === 'en'

  const isRequireExplanation = isLate || isEarly

  // Real Camera Hardware Refs & States
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const fallbackFileInputRef = useRef<HTMLInputElement>(null)

  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user')
  const [cameraStatus, setCameraStatus] = useState<'starting' | 'ready' | 'error' | 'unsupported'>(
    'starting',
  )
  const [cameraError, setCameraError] = useState<string | null>(null)

  // Real device Geolocation & Reverse Geocoding (Pure GPS, NO boarding house appended)
  const [geoState, setGeoState] = useState<{
    status: 'locating' | 'ready' | 'error'
    place: string
    coordinates: string
    accuracy?: number
    error?: string
  }>({
    status: 'locating',
    place: t('gpsLocating'),
    coordinates: '',
  })

  // Captured states at the exact moment of taking photo
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null)
  const [capturedWatermark, setCapturedWatermark] = useState<AttendanceWatermark | null>(null)
  const [capturedTime, setCapturedTime] = useState<string | null>(null)
  const [capturedDate, setCapturedDate] = useState<string | null>(null)

  const [isFlashing, setIsFlashing] = useState(false)
  const [explanation, setExplanation] = useState('')
  const [selectedQuickReason, setSelectedQuickReason] = useState<string | null>(null)

  // Preset reason chips for Check-in (Late / Handover)
  const checkInLatePresets = [
    t('presetLateTraffic'),
    t('presetLateIncident'),
    t('presetLateFamily'),
    t('presetLateWeather'),
    t('presetLateOvertime'),
  ]

  const checkInOnTimePresets = [
    t('presetOnTimeHandover'),
    t('presetOnTimeReady'),
    t('presetOnTimeVehicles'),
    t('presetOnTimeHygiene'),
  ]

  // Preset reason chips for Check-out (Early / Normal)
  const checkOutEarlyPresets = [
    t('presetEarlyHealth'),
    t('presetEarlyFamily'),
    t('presetEarlyHandover'),
    t('presetEarlyApproval'),
  ]

  const checkOutNormalPresets = [
    t('presetNormalGateLocked'),
    t('presetNormalDone'),
    t('presetNormalSafe'),
    t('presetNormalClean'),
  ]

  const currentPresets =
    mode === 'checkin'
      ? isLate
        ? checkInLatePresets
        : checkInOnTimePresets
      : isEarly
        ? checkOutEarlyPresets
        : checkOutNormalPresets

  // Stop camera tracks cleanly
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
  }

  // Request actual Geolocation & Reverse Geocoding
  const locateUser = () => {
    setGeoState(prev => ({
      ...prev,
      status: 'locating',
      place: t('gpsLocatingShort'),
      coordinates: '',
      error: undefined,
    }))

    if (typeof window === 'undefined' || !navigator.geolocation) {
      setGeoState({
        status: 'error',
        place: t('gpsNoSupportDevice'),
        coordinates: t('gpsNotAvailable'),
        error: t('gpsNoSupportBrowser'),
      })
      return
    }

    navigator.geolocation.getCurrentPosition(
      async pos => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude
        const acc = Math.round(pos.coords.accuracy)

        const { address, coordinates } = await resolveRealGpsAddress(lat, lng, isEn)

        setGeoState({
          status: 'ready',
          place: address,
          coordinates: coordinates,
          accuracy: acc,
        })
      },
      err => {
        let errorMsg = t('gpsCannotObtain')
        if (err.code === 1) errorMsg = t('gpsPermissionDenied')
        else if (err.code === 2) errorMsg = t('gpsLocationUnavailable')
        else if (err.code === 3) errorMsg = t('gpsTimeout')

        setGeoState({
          status: 'error',
          place: t('gpsPermissionNotGranted'),
          coordinates: t('gpsNotReady'),
          error: errorMsg,
        })
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 10000 },
    )
  }

  // Start real device camera via getUserMedia
  const startCamera = async (modeToUse: 'user' | 'environment') => {
    stopCamera()
    setCameraStatus('starting')
    setCameraError(null)

    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      setCameraStatus('unsupported')
      setCameraError(t('cameraNotSupported'))
      return
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: modeToUse },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      }

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = mediaStream

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream
        await videoRef.current.play().catch(() => {})
      }
      setCameraStatus('ready')
    } catch (err: any) {
      console.warn('Camera init error:', err)
      setCameraStatus('error')
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError(t('cameraDenied'))
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setCameraError(t('cameraNotFound'))
      } else {
        setCameraError(t('cameraConnectError', { error: err.message || t('cameraHardwareError') }))
      }
    }
  }

  useEffect(() => {
    startCamera(facingMode)
    locateUser()

    return () => {
      stopCamera()
    }
  }, [])

  const handleToggleFacingMode = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user'
    setFacingMode(nextMode)
    startCamera(nextMode)
  }

  const handleCaptureRealFrame = () => {
    if (!videoRef.current || cameraStatus !== 'ready' || geoState.status === 'locating') return
    setIsFlashing(true)
    onChangeDraft()

    try {
      const now = new Date()
      const d = String(now.getDate()).padStart(2, '0')
      const m = String(now.getMonth() + 1).padStart(2, '0')
      const y = now.getFullYear()
      const h = String(now.getHours()).padStart(2, '0')
      const min = String(now.getMinutes()).padStart(2, '0')
      const s = String(now.getSeconds()).padStart(2, '0')

      const snapDateStr = isEn ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
      const snapTimeStr = `${h}:${min}:${s}`
      const snapIsoDate = `${y}-${m}-${d}`
      const snapFullDateTime = `${snapDateStr} ${snapTimeStr}`

      const activePlace = getLocalizedPlace(
        geoState.status === 'ready' ? geoState.place : t('gpsAddressUndetermined'),
        isEn,
      )
      const activeCoords = geoState.status === 'ready' ? geoState.coordinates : t('gpsUnverified')

      const activeWatermark: AttendanceWatermark = {
        time: snapFullDateTime,
        place: activePlace,
        staffName: getLocalizedStaffName(staffName || t('defaultStaffName'), isEn),
        coordinates: activeCoords,
      }

      const video = videoRef.current
      const canvas = document.createElement('canvas')
      const width = video.videoWidth || 640
      const height = video.videoHeight || 480
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (ctx) {
        if (facingMode === 'user') {
          ctx.translate(width, 0)
          ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, width, height)
        ctx.setTransform(1, 0, 0, 1, 0, 0)

        const barHeight = Math.max(90, Math.floor(height * 0.22))
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
        ctx.fillRect(0, height - barHeight, width, barHeight)

        // Safe left padding: at least 36px or 4% of width to prevent cutoff
        const padX = Math.max(36, Math.floor(width * 0.04))
        const fontSize = Math.max(13, Math.min(22, Math.floor(width * 0.024)))

        ctx.fillStyle = '#2AC1BC'
        ctx.font = `bold ${fontSize}px monospace`
        ctx.fillText(
          `🕒 ${activeWatermark.time} | ${t('liveVerified')}`,
          padX,
          height - barHeight + fontSize + 8,
        )

        ctx.fillStyle = '#FFFFFF'
        ctx.font = `bold ${fontSize - 1}px sans-serif`
        ctx.fillText(`📍 ${activeWatermark.place}`, padX, height - barHeight + fontSize * 2 + 16)

        ctx.fillStyle = '#CBD5E1'
        ctx.font = `${fontSize - 2}px sans-serif`
        ctx.fillText(
          `👤 ${activeWatermark.staffName} • GPS: ${activeWatermark.coordinates}${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ''}`,
          padX,
          height - barHeight + fontSize * 3 + 24,
        )

        setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.92))
        setCapturedWatermark(activeWatermark)
        setCapturedTime(snapTimeStr)
        setCapturedDate(snapIsoDate)
        stopCamera()
      }
    } catch (err) {
      console.error('Failed to capture video frame:', err)
    } finally {
      setTimeout(() => setIsFlashing(false), 250)
    }
  }

  const handleFallbackImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    onChangeDraft()
    setIsFlashing(true)

    const now = new Date()
    const d = String(now.getDate()).padStart(2, '0')
    const m = String(now.getMonth() + 1).padStart(2, '0')
    const y = now.getFullYear()
    const h = String(now.getHours()).padStart(2, '0')
    const min = String(now.getMinutes()).padStart(2, '0')
    const s = String(now.getSeconds()).padStart(2, '0')

    const snapDateStr = isEn ? `${m}/${d}/${y}` : `${d}/${m}/${y}`
    const snapTimeStr = `${h}:${min}:${s}`
    const snapIsoDate = `${y}-${m}-${d}`
    const snapFullDateTime = `${snapDateStr} ${snapTimeStr}`

    const activePlace = getLocalizedPlace(
      geoState.status === 'ready' ? geoState.place : t('gpsAddressUndetermined'),
      isEn,
    )
    const activeCoords = geoState.status === 'ready' ? geoState.coordinates : t('gpsUnverified')

    const activeWatermark: AttendanceWatermark = {
      time: snapFullDateTime,
      place: activePlace,
      staffName: getLocalizedStaffName(staffName || t('defaultStaffName'), isEn),
      coordinates: activeCoords,
    }

    const reader = new FileReader()
    reader.onload = event => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const width = img.width || 640
        const height = img.height || 480
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height)

          const barHeight = Math.max(90, Math.floor(height * 0.22))
          ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
          ctx.fillRect(0, height - barHeight, width, barHeight)

          const padX = Math.max(36, Math.floor(width * 0.04))
          const fontSize = Math.max(13, Math.min(22, Math.floor(width * 0.024)))

          ctx.fillStyle = '#2AC1BC'
          ctx.font = `bold ${fontSize}px monospace`
          ctx.fillText(
            `🕒 ${activeWatermark.time} | ${t('liveVerified')}`,
            padX,
            height - barHeight + fontSize + 8,
          )

          ctx.fillStyle = '#FFFFFF'
          ctx.font = `bold ${fontSize - 1}px sans-serif`
          ctx.fillText(`📍 ${activeWatermark.place}`, padX, height - barHeight + fontSize * 2 + 16)

          ctx.fillStyle = '#CBD5E1'
          ctx.font = `${fontSize - 2}px sans-serif`
          ctx.fillText(
            `👤 ${activeWatermark.staffName} • GPS: ${activeWatermark.coordinates}${geoState.accuracy ? ` (±${geoState.accuracy}m)` : ''}`,
            padX,
            height - barHeight + fontSize * 3 + 24,
          )

          setCapturedPhoto(canvas.toDataURL('image/jpeg', 0.92))
          setCapturedWatermark(activeWatermark)
          setCapturedTime(snapTimeStr)
          setCapturedDate(snapIsoDate)
          stopCamera()
        }
        setIsFlashing(false)
      }
      if (typeof event.target?.result === 'string') {
        img.src = event.target.result
      }
    }
    reader.readAsDataURL(file)
  }

  const handleRetakePhoto = () => {
    setCapturedPhoto(null)
    setCapturedWatermark(null)
    setCapturedTime(null)
    setCapturedDate(null)
    onChangeDraft()
    startCamera(facingMode)
  }

  const handleSelectChip = (reason: string) => {
    setSelectedQuickReason(reason)
    setExplanation(reason)
    onChangeDraft()
  }

  const isFormValid =
    Boolean(capturedPhoto && capturedWatermark && capturedTime) &&
    (!isRequireExplanation || explanation.trim().length > 0)

  return (
    <Modal
      isOpen
      onClose={() => {
        stopCamera()
        onClose()
      }}
      size="xl"
    >
      <Modal.Header
        title={mode === 'checkin' ? t('modalCheckInTitle') : t('modalCheckOutTitle')}
        description={`${shiftName} • ${boardingHouseName}`}
        icon={
          <div
            className={`p-2 rounded-xl text-white ${mode === 'checkin' ? 'bg-primary' : 'bg-success'}`}
          >
            {mode === 'checkin' ? <Camera className="w-5 h-5" /> : <LogOut className="w-5 h-5" />}
          </div>
        }
        onClose={() => {
          stopCamera()
          onClose()
        }}
      />

      <Modal.Body className="p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between gap-2 p-2.5 rounded-2xl bg-success-soft border border-success-subtle text-success text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-success shrink-0" />
            <Text as="span" size="2xs" weight="black" uppercase className="tracking-wide text-success">
              {t('cameraNotice')}
            </Text>
          </div>
        </div>

        <div className="space-y-2">
          {/* Stable Non-Jitter Status Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <Text as="span" size="xs" weight="bold" className="flex items-center gap-1.5 shrink-0 text-foreground/90">
              <Camera className="w-4 h-4 text-primary" />
              <span>
                {t('cameraLabel', {
                  facing: facingMode === 'user' ? t('cameraFront') : t('cameraRear'),
                })}
              </span>
            </Text>

            <div className="flex items-center gap-1.5 shrink-0">
              {/* Isolated Live Clock Badge */}
              <LiveClockBadge />

              {/* Stable GPS Status Badge */}
              {geoState.status === 'locating' && (
                <Chip
                  variant="warning"
                  size="xs"
                  preventHover
                  leftIcon={<RefreshCw className="w-3 h-3 animate-spin text-warning" />}
                  className="font-bold shrink-0"
                >
                  {t('locatingGps')}
                </Chip>
              )}
              {geoState.status === 'ready' && (
                <Chip
                  variant="success"
                  size="xs"
                  preventHover
                  leftIcon={<span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />}
                  className="font-bold shrink-0"
                  title={geoState.place}
                >
                  {t('gpsReady', { coords: geoState.coordinates })}
                </Chip>
              )}
              {geoState.status === 'error' && (
                <Chip
                  variant="secondary"
                  size="xs"
                  leftIcon={<MapPin className="w-3 h-3 text-muted" />}
                  className="font-bold shrink-0"
                  title={geoState.error}
                >
                  {t('gpsDisabled')}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={locateUser}
                    className="hover:underline ml-1 inline text-[10px] p-0 h-auto"
                  >
                    {t('gpsRetry')}
                  </Button>
                </Chip>
              )}
            </div>
          </div>

          {/* Resolved GPS Address Banner (Pure address, no boarding house suffix) */}
          {geoState.status === 'ready' && (
            <div className="px-3 py-1.5 rounded-xl bg-card-hover text-foreground/90 text-[11px] font-medium flex items-center gap-1.5 truncate border border-line shadow-2xs">
              <MapPin className="w-3.5 h-3.5 text-red-500 shrink-0" />
              <Text as="span" size="2xs" weight="bold" className="text-foreground shrink-0">{t('realLocation')}</Text>
              <span
                className="truncate text-foreground/90"
                title={getLocalizedPlace(geoState.place, isEn)}
              >
                {getLocalizedPlace(geoState.place, isEn)}
              </span>
            </div>
          )}

          {/* Camera Viewport (aspect-video with object-contain to prevent any text clipping) */}
          <div className="relative rounded-2xl overflow-hidden bg-zinc-950 border-2 border-zinc-800 shadow-inner group aspect-video max-h-[360px] w-full flex items-center justify-center">
            {!capturedPhoto ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-contain ${facingMode === 'user' ? 'scale-x-[-1]' : ''} ${cameraStatus === 'ready' ? 'block' : 'hidden'}`}
                />
                {cameraStatus === 'starting' && (
                  <div className="text-center p-6 text-muted text-xs space-y-3">
                    <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                    <Text size="xs" weight="semibold" className="text-zinc-300">{t('cameraStarting')}</Text>
                  </div>
                )}
                {(cameraStatus === 'error' || cameraStatus === 'unsupported') && (
                  <div className="text-center p-6 text-muted text-xs space-y-3 max-w-sm">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
                    <Text size="xs" weight="bold" className="text-zinc-200">{cameraError}</Text>
                    <TextInput
                      ref={fallbackFileInputRef}
                      type="file"
                      accept="image/*"
                      containerClassName="hidden"
                      className="hidden"
                      onChange={handleFallbackImageUpload}
                    />
                    <div className="flex flex-col sm:flex-row gap-2 pt-1 justify-center">
                      <Button
                        variant="ghost"
                        onClick={() => startCamera(facingMode)}
                      >
                        {t('retryCamera')}
                      </Button>
                      <Button
                        variant="ghost"
                        onClick={() => fallbackFileInputRef.current?.click()}
                        leftIcon={<Upload />}
                      >
                        {t('btnUploadDuty')}
                      </Button>
                    </div>
                  </div>
                )}
                {cameraStatus === 'ready' && (
                  <Button
                    variant="ghost"
                    onClick={handleToggleFacingMode}
                    leftIcon={<RefreshCw />}
                    className="absolute top-3 right-3 z-20 backdrop-blur-md"
                  >
                    {facingMode === 'user' ? t('cameraRear') : t('cameraFront')}
                  </Button>
                )}
                <div className="absolute inset-4 border border-white/20 rounded-xl pointer-events-none flex flex-col justify-between">
                  <div className="flex justify-between p-2">
                    <div className="w-4 h-4 border-t-2 border-l-2 border-primary" />
                    <div className="w-4 h-4 border-t-2 border-r-2 border-primary" />
                  </div>
                  <div className="flex justify-between p-2">
                    <div className="w-4 h-4 border-b-2 border-l-2 border-primary" />
                    <div className="w-4 h-4 border-b-2 border-r-2 border-primary" />
                  </div>
                </div>
              </>
            ) : (
              <img
                src={capturedPhoto}
                alt="Captured frame"
                className="w-full h-full object-contain animate-in fade-in duration-200"
              />
            )}
            {isFlashing && (
              <div className="absolute inset-0 bg-card animate-out fade-out duration-250 pointer-events-none z-30" />
            )}
          </div>

          {/* Captured Watermark Verification HUD below picture */}
          {capturedPhoto && capturedWatermark && (
            <div className="p-3.5 bg-zinc-900 rounded-2xl text-white text-xs border border-zinc-800 space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-bold text-primary flex items-center gap-1.5 font-mono">
                  <Clock className="w-3.5 h-3.5" /> {capturedWatermark.time}
                </span>
                <Chip variant="success" size="xs" preventHover className="border border-emerald-500/40">
                  {t('stampedReal')}
                </Chip>
              </div>
              <div className="text-zinc-200 text-[11px] font-medium flex items-center gap-1.5 truncate">
                <MapPin className="w-3.5 h-3.5 text-red-400 shrink-0" />
                <span className="truncate">
                  {getLocalizedPlace(capturedWatermark.place, isEn)}
                </span>
              </div>
              <div className="text-muted text-[10px] flex items-center justify-between pt-1 border-t border-zinc-800">
                <span>{getLocalizedStaffName(capturedWatermark.staffName, isEn)}</span>
                <span className="font-mono text-zinc-300">
                  GPS: {capturedWatermark.coordinates}
                </span>
              </div>
            </div>
          )}

          {/* Snap Button */}
          <div className="flex items-center justify-center gap-3 pt-1">
            {!capturedPhoto ? (
              <Button
                fullWidth
                disabled={cameraStatus !== 'ready' || geoState.status === 'locating'}
                onClick={handleCaptureRealFrame}
                leftIcon={
                  geoState.status === 'locating' ? (
                    <RefreshCw />
                  ) : (
                    <Camera />
                  )
                }
              >
                {geoState.status === 'locating' ? t('waitingGps') : t('btnCaptureNow')}
              </Button>
            ) : (
              <Button
                fullWidth
                variant="outline"
                onClick={handleRetakePhoto}
                leftIcon={<RefreshCw />}
              >
                {t('btnRetake')}
              </Button>
            )}
          </div>
        </div>

        {/* EXPLANATION / NOTE SECTION */}
        <div className="space-y-3 pt-1 border-t border-line">
          <div className="p-4 sm:p-5 rounded-2xl bg-warning-soft border border-warning-subtle space-y-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <Text as="h4" size="xs" weight="black" color="warning" uppercase>
                  {mode === 'checkin'
                    ? isLate
                      ? t('lateCheckInTitle')
                      : t('onTimeCheckInTitle')
                    : isEarly
                      ? t('earlyCheckOutTitle')
                      : t('normalCheckOutTitle')}
                </Text>
                <Text size="2xs" color="warning" weight="medium" className="leading-relaxed">
                  {mode === 'checkin'
                    ? isLate
                      ? t('lateCheckInDesc', { time: shiftStartTime || '07:00' })
                      : t('onTimeCheckInDesc')
                    : isEarly
                      ? t('earlyCheckOutDesc', { time: shiftEndTime || '15:00' })
                      : t('normalCheckOutDesc')}
                </Text>
              </div>
            </div>

            {/* Preset Chips */}
            <div className="space-y-1.5">
              <Text as="span" size="3xs" weight="bold" color="warning" uppercase className="block tracking-wider">
                {t('commonReasonsTitle')}
              </Text>
              <div className="flex flex-wrap gap-1.5">
                {currentPresets.map((chip, idx) => (
                  <Chip
                    key={idx}
                    variant={explanation.includes(chip) ? 'warning' : 'secondary'}
                    size="xs"
                    onClick={() => handleSelectChip(chip)}
                  >
                    {chip}
                  </Chip>
                ))}
              </div>
            </div>

            {/* Textarea */}
            <div className="space-y-1">
              <TextareaInput
                rows={2}
                value={explanation}
                onChange={e => {
                  setExplanation(e.target.value)
                  onChangeDraft()
                }}
                placeholder={
                  mode === 'checkin'
                    ? isLate
                      ? t('placeholderExplanation')
                      : t('placeholderNote')
                    : isEarly
                      ? t('placeholderExplanation')
                      : t('placeholderCheckOutNote')
                }
                className="w-full p-2.5 rounded-xl bg-card border border-amber-300 text-xs text-foreground font-medium focus:outline-none focus:border-warning focus:ring-1 focus:ring-amber-500/20"
                containerClassName="space-y-0"
              />
              {isRequireExplanation && !explanation.trim() ? (
                <Text as="span" size="3xs" weight="bold" color="danger" className="block">
                  {t('explanationRequiredNotice')}
                </Text>
              ) : (
                <Text as="span" size="3xs" weight="medium" className="text-amber-700/80 block">
                  {t('explanationOptionalNotice')}
                </Text>
              )}
            </div>
          </div>
        </div>
      </Modal.Body>

      {/* MODAL FOOTER */}
      <Modal.Footer className="p-4 sm:p-5 bg-surface border-t border-line flex items-center justify-end gap-2.5">
        <Button
          variant="outline"
          size="md"
          onClick={() => {
            stopCamera()
            onClose()
          }}
        >
          {t('btnCancel')}
        </Button>
        <Button
          size="md"
          disabled={!isFormValid}
          onClick={() => {
            if (capturedPhoto && capturedWatermark && capturedTime && isFormValid) {
              stopCamera()
              onSubmit({
                photo: capturedPhoto,
                watermark: capturedWatermark,
                capturedTime: capturedTime,
                capturedDate: capturedDate || undefined,
                explanation: explanation.trim() || undefined,
              })
            }
          }}
          leftIcon={<Check />}
        >
          {mode === 'checkin' ? t('btnConfirmCheckIn') : t('btnConfirmCheckOut')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
