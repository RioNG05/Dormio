'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Plus,
  Search,
  Home,
  Building2,
  Target,
  FileSignature,
  Receipt,
  Eye,
  Edit,
  AlertTriangle,
  Sparkles,
  Loader2,
  ListFilterPlus,
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  Form,
  SearchInput,
  Text,
  Modal,
  ViewModeToggle,
  TableRow,
  type TextColor,
} from '@/components/ui'
import { ImageUpload } from '@/components/ImageUpload'
import { formatCurrency } from '@/utils'
import {
  bulkGenerateRooms,
  createRoom,
  getRoom,
  getRoomMetadata,
  getRooms,
  updateRoom,
  type RoomMetadata,
} from '@/services/room.service'

interface StatChipItem {
  key: string
  label: string
  value: React.ReactNode
  icon: React.ReactNode
  containerClassName: string
  labelColor?: TextColor
  labelClassName?: string
  valueColor?: TextColor
  valueClassName?: string
}

const BACKEND_TO_DISPLAY_STATUS: Record<string, string> = {
  available: 'Trống',
  occupied: 'Đang thuê',
  maintainace: 'Bảo trì',
  maintenance: 'Bảo trì',
  deposited: 'Đặt cọc',
}

const DISPLAY_TO_BACKEND_STATUS: Record<string, string> = {
  'Trống': 'available',
  'Đang thuê': 'occupied',
  'Bảo trì': 'maintainace',
  'Đặt cọc': 'deposited',
}

function formatDisplayStatus(backendStatus?: string): string {
  if (!backendStatus) return 'Trống'
  return BACKEND_TO_DISPLAY_STATUS[backendStatus] || backendStatus
}

function formatBackendStatus(displayStatus?: string): string {
  if (!displayStatus) return 'available'
  return DISPLAY_TO_BACKEND_STATUS[displayStatus] || displayStatus
}

function parseRoomsResponse(res: any): any[] {
  if (Array.isArray(res?.data)) return res.data
  if (Array.isArray(res?.data?.data)) return res.data.data
  if (Array.isArray(res)) return res
  return []
}

interface RoomStatusVisual {
  translationKey: string
  gridContainer: string
  gridText: string
  gridBadge: string
  tableBadge: string
}

const ROOM_STATUS_CONFIG: Record<string, RoomStatusVisual> = {
  'Đang thuê': {
    translationKey: 'landlordRoomsStatusOccupied',
    gridContainer: 'bg-primary/10 border-primary/30 hover:border-primary',
    gridText: 'text-primary',
    gridBadge: 'text-primary bg-primary/15',
    tableBadge: 'bg-primary/15 text-primary',
  },
  'Bảo trì': {
    translationKey: 'landlordRoomsStatusMaintenance',
    gridContainer: 'bg-accent/10 border-accent/30 hover:border-accent',
    gridText: 'text-accent',
    gridBadge: 'text-accent bg-accent/15',
    tableBadge: 'bg-accent/15 text-accent',
  },
  'Đặt cọc': {
    translationKey: 'landlordRoomsStatusReserved',
    gridContainer: 'bg-deposit/10 border-deposit/30 hover:border-deposit',
    gridText: 'text-deposit',
    gridBadge: 'text-deposit bg-deposit/15',
    tableBadge: 'bg-deposit-soft text-deposit',
  },
  'Trống': {
    translationKey: 'landlordRoomsStatusVacant',
    gridContainer: 'bg-vacant/10 border-vacant/30 hover:border-vacant',
    gridText: 'text-info',
    gridBadge: 'text-info bg-vacant/15',
    tableBadge: 'bg-info-soft text-info',
  },
}

const DEFAULT_ROOM_STATUS_VISUAL = {
  gridContainer: 'bg-card border-line hover:border-line',
  gridText: 'text-foreground',
  gridBadge: 'text-muted bg-card-hover text-center',
  tableBadge: 'bg-card-hover text-muted',
}

const SERVICE_NAME_TO_KEY: Record<string, string> = {
  'Điện': 'landlordRoomsServiceElectricity',
  'Nước': 'landlordRoomsServiceWater',
  'WiFi': 'landlordRoomsServiceWifi',
  'Vệ sinh': 'landlordRoomsServiceCleaning',
  'Rác': 'landlordRoomsServiceTrash',
  'Bảo vệ': 'landlordRoomsServiceSecurity',
}

export default function RoomsPage() {
  const { activeBuilding, buildings, refreshBuildings, selectBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')
  const { currentLocale } = useLanguage()
  const [isMounted, setIsMounted] = useState(false)

  // Status visual metadata and localized label helper
  const getRoomStatusMeta = useCallback(
    (status: string) => {
      const config = ROOM_STATUS_CONFIG[status]
      if (!config) {
        return {
          label: status,
          ...DEFAULT_ROOM_STATUS_VISUAL,
        }
      }
      return {
        label: t(config.translationKey as any),
        gridContainer: config.gridContainer,
        gridText: config.gridText,
        gridBadge: config.gridBadge,
        tableBadge: config.tableBadge,
      }
    },
    [t],
  )

  // Localized service name helper
  const getServiceLabel = useCallback(
    (serviceName: string) => {
      const translationKey = SERVICE_NAME_TO_KEY[serviceName]
      return translationKey ? t(translationKey as any) : serviceName
    },
    [t],
  )

  // View mode (Grid view by default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Metadata from backend
  const [metadata, setMetadata] = useState<RoomMetadata | null>(null)
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [invoiceFilter, setInvoiceFilter] = useState('')

  // Feedback Notification
  const { toast } = useToast()

  // Modals & dirty tracking according to Rule 10
  const [isSingleModalOpen, setIsSingleModalOpen] = useState(false)
  const [isSingleDirty, setIsSingleDirty] = useState(false)

  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [isBulkDirty, setIsBulkDirty] = useState(false)
  const [isBulkSubmitting, setIsBulkSubmitting] = useState(false)
  const [bulkError, setBulkError] = useState<string | null>(null)

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: t('landlordRoomsConfirmCloseTitle'),
    message: t('landlordRoomsConfirmCloseMessage'),
    onConfirm: () => { },
  })

  // Single room form states
  const [formBuilding, setFormBuilding] = useState('')
  const [formRoomNumber, setFormRoomNumber] = useState('')
  const [formRoomTypeId, setFormRoomTypeId] = useState('')
  const [formFloor, setFormFloor] = useState('1')
  const [formArea, setFormArea] = useState('25')
  const [formMaxOccupants, setFormMaxOccupants] = useState('2')
  const [formStatus, setFormStatus] = useState('available')
  const [formImageUrl, setFormImageUrl] = useState('')
  const [isImageUploading, setIsImageUploading] = useState(false)
  const [formPrice, setFormPrice] = useState('3.500.000')
  const [formNotes, setFormNotes] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([])
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null)
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false)
  const [singleError, setSingleError] = useState<string | null>(null)

  const getSingleSubmitLabel = useCallback(() => {
    if (isSingleSubmitting) return t('landlordRoomsSingleBtnSaving')
    if (selectedRoomId) return t('landlordRoomsSingleBtnSaveEdit')
    return t('landlordRoomsSingleBtnSaveCreate')
  }, [isSingleSubmitting, selectedRoomId, t])

  // Bulk Generate form states
  const [bulkFloorCount, setBulkFloorCount] = useState<number>(3)
  const [bulkRoomsPerFloor, setBulkRoomsPerFloor] = useState<number>(4)
  const [bulkNameFormat, setBulkNameFormat] = useState<string>('P{floor}0{index}')
  const [bulkArea, setBulkArea] = useState<string>('25')
  const [bulkMaxOccupants, setBulkMaxOccupants] = useState<string>('2')
  const [bulkRoomTypeId, setBulkRoomTypeId] = useState<string>('')
  const [bulkServiceIds, setBulkServiceIds] = useState<string[]>([])

  const [rooms, setRooms] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
  }

  // Ensure buildings are loaded from backend on mount
  useEffect(() => {
    if (buildings.length === 0) {
      refreshBuildings()
    }
  }, [buildings.length, refreshBuildings])

  // Load real room metadata & backend rooms whenever activeBuilding changes
  const fetchBuildingData = useCallback(async (buildingId: string) => {
    if (!buildingId) return
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!UUID_RE.test(buildingId)) return
    try {
      setIsLoadingMetadata(true)
      const [meta, realRoomsRes] = await Promise.all([
        getRoomMetadata(buildingId),
        getRooms(buildingId, { limit: 100 }),
      ])
      const safeMeta: RoomMetadata = (meta as any)?.data?.roomTypes ? (meta as any).data : meta
      setMetadata(safeMeta)

      if (safeMeta?.roomTypes && safeMeta.roomTypes.length > 0) {
        setBulkRoomTypeId(prev => prev || safeMeta.roomTypes[0].id)
      }
      if (safeMeta?.services && safeMeta.services.length > 0) {
        setBulkServiceIds(prev => (prev.length === 0 ? safeMeta.services.map(s => s.id) : prev))
      }

      // Map real rooms from backend safely
      const rawRooms = parseRoomsResponse(realRoomsRes)

      const mapped = rawRooms.map((r: any) => ({
        id: r.roomNumber,
        fullRoomId: r.id,
        floor: (r.floor !== undefined && r.floor !== null ? r.floor : 1).toString(),
        status: formatDisplayStatus(r.status),
        building: buildingId,
        buildingSeq: 1,
        contract: r.status === 'occupied' ? 'active' : 'none',
        invoice: 'paid',
        area: r.area || '25',
        price: '3.500.000',
        roomType: r.roomType?.name || 'Studio',
        services: (r.services || []).map((s: any) => s.name || s),
        amenities: ['WiFi', 'Điều hòa', 'WC riêng'],
      }))
      setRooms(mapped)
    } catch (err) {
      console.error('Failed to fetch building data:', err)
      setRooms([])
    } finally {
      setIsLoadingMetadata(false)
    }
  }, [])

  useEffect(() => {
    const targetBuildingId = activeBuilding?.id || (buildings.length > 0 ? buildings[0].id : '')
    if (targetBuildingId) {
      fetchBuildingData(targetBuildingId)
    }
  }, [activeBuilding?.id, buildings, fetchBuildingData])

  // Reset single room form drafts (Rule 10)
  const resetSingleForm = useCallback(() => {
    setSelectedRoomId(null)
    setFormRoomNumber('')
    setFormFloor('1')
    setFormArea('25')
    setFormMaxOccupants('2')
    setFormStatus('available')
    setFormImageUrl('')
    setIsImageUploading(false)
    setFormPrice('3.500.000')
    setFormNotes('')
    setSingleError(null)
    setIsSingleDirty(false)
    if (metadata?.roomTypes?.[0]) {
      setFormRoomTypeId(metadata.roomTypes[0].id)
    } else {
      setFormRoomTypeId('')
    }
    if (metadata?.services) {
      setSelectedServiceIds(metadata.services.map(s => s.id))
    } else {
      setSelectedServiceIds([])
    }
    setSelectedAmenities([
      'WiFi',
      'Điều hòa',
      'Nóng lạnh',
      'Tủ quần áo',
      'Giường',
      'Kệ bếp',
      'Ban công',
      'WC riêng',
    ])
  }, [metadata])

  // Open create modal
  const handleOpenCreateModal = () => {
    resetSingleForm()
    setIsSingleModalOpen(true)
  }

  // Open edit modal for an existing room
  const handleOpenEditModal = async (room: any) => {
    setSelectedRoomId(room.fullRoomId || room.id)
    setFormBuilding(room.building || activeBuilding?.id || '')
    setFormRoomNumber(room.id || '')
    setFormFloor(room.floor || '1')
    setFormArea(room.area ? String(room.area).replace(/[^\d.]/g, '') : '25')
    setFormMaxOccupants(room.maxOccupants ? String(room.maxOccupants) : '2')
    setFormStatus(formatBackendStatus(room.status))
    setFormImageUrl(room.imageUrl || '')
    setFormPrice(room.price || '3.500.000')
    setFormNotes(room.notes || '')
    setSingleError(null)
    setIsSingleDirty(false)

    if (metadata?.roomTypes) {
      const matchType = metadata.roomTypes.find(
        rt =>
          rt.name.toLowerCase() === (room.roomType || '').toLowerCase() ||
          rt.id === room.roomTypeId,
      )
      setFormRoomTypeId(matchType ? matchType.id : metadata.roomTypes[0]?.id || '')
    }

    const buildingId = activeBuilding?.id || ''
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (UUID_RE.test(buildingId) && UUID_RE.test(room.fullRoomId)) {
      try {
        const fullRoom = await getRoom(buildingId, room.fullRoomId)
        if (fullRoom) {
          setFormRoomNumber(fullRoom.roomNumber)
          setFormFloor(String(fullRoom.floor))
          if (fullRoom.area) setFormArea(String(fullRoom.area))
          if (fullRoom.maxOccupants) setFormMaxOccupants(String(fullRoom.maxOccupants))
          if (fullRoom.status) setFormStatus(fullRoom.status)
          if (fullRoom.imageUrl) setFormImageUrl(fullRoom.imageUrl)
          if (fullRoom.roomType) setFormRoomTypeId(fullRoom.roomType.id)
          if (fullRoom.services) setSelectedServiceIds(fullRoom.services.map(s => s.id))
        }
      } catch {
        if (metadata?.services && Array.isArray(room.services)) {
          const matchedIds = metadata.services
            .filter(s => room.services.includes(s.name) || room.services.includes(s.id))
            .map(s => s.id)
          setSelectedServiceIds(matchedIds)
        }
      }
    } else {
      if (metadata?.services && Array.isArray(room.services)) {
        const matchedIds = metadata.services
          .filter(s => room.services.includes(s.name))
          .map(s => s.id)
        setSelectedServiceIds(matchedIds)
      }
    }

    setSelectedAmenities(room.amenities || ['WiFi', 'Điều hòa', 'WC riêng'])
    setIsSingleModalOpen(true)
  }

  // Handle single room modal close with Rule 10 dirty check
  const handleCloseSingleModal = () => {
    if (isSingleDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('landlordRoomsConfirmCloseTitle'),
        message: t('landlordRoomsConfirmCloseMessage'),
        onConfirm: () => {
          setIsSingleModalOpen(false)
          resetSingleForm()
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        },
      })
    } else {
      setIsSingleModalOpen(false)
      resetSingleForm()
    }
  }

  // Handle single room submit
  const handleSingleRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isImageUploading) return
    setSingleError(null)

    if (!formRoomNumber.trim()) {
      setSingleError(t('landlordRoomsErrorRoomNumberRequired'))
      return
    }

    const floorNum = parseInt(formFloor, 10)
    if (isNaN(floorNum) || floorNum < 1) {
      setSingleError(t('landlordRoomsErrorFloorInvalid'))
      return
    }

    if (!formRoomTypeId) {
      setSingleError(t('landlordRoomsErrorRoomTypeRequired'))
      return
    }

    const buildingId = activeBuilding?.id
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!buildingId || !UUID_RE.test(buildingId)) {
      setSingleError(t('landlordRoomsErrorBuildingNotFound'))
      return
    }

    setIsSingleSubmitting(true)
    try {
      if (selectedRoomId && UUID_RE.test(selectedRoomId)) {
        // Update Room
        await updateRoom(buildingId, selectedRoomId, {
          roomNumber: formRoomNumber.trim(),
          floor: floorNum,
          area: formArea ? parseFloat(formArea) : undefined,
          maxOccupants: formMaxOccupants ? parseInt(formMaxOccupants, 10) : undefined,
          roomTypeId: formRoomTypeId,
          status: formStatus,
          imageUrl: formImageUrl.trim() || undefined,
          serviceIds: selectedServiceIds,
        })
        toast.success(t('landlordRoomsToastUpdateSuccess', { room: formRoomNumber.trim() }))
      } else {
        // Create Room
        await createRoom(buildingId, {
          roomNumber: formRoomNumber.trim(),
          floor: floorNum,
          area: formArea ? parseFloat(formArea) : undefined,
          maxOccupants: formMaxOccupants ? parseInt(formMaxOccupants, 10) : undefined,
          roomTypeId: formRoomTypeId,
          status: formStatus,
          imageUrl: formImageUrl.trim() || undefined,
          serviceIds: selectedServiceIds,
        })
        toast.success(t('landlordRoomsToastCreateSuccess', { room: formRoomNumber.trim() }))
      }

      // Refresh room list from server
      await fetchBuildingData(buildingId)
      setIsSingleModalOpen(false)
      setIsSingleDirty(false)
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('landlordRoomsErrorSaveFailed')
      setSingleError(msg)
    } finally {
      setIsSingleSubmitting(false)
    }
  }

  // Reset bulk form drafts
  const resetBulkForm = () => {
    setBulkFloorCount(3)
    setBulkRoomsPerFloor(4)
    setBulkNameFormat('P{floor}0{index}')
    setBulkArea('25')
    setBulkMaxOccupants('2')
    setBulkError(null)
    setIsBulkDirty(false)
    if (metadata?.roomTypes?.[0]) {
      setBulkRoomTypeId(metadata.roomTypes[0].id)
    }
    if (metadata?.services) {
      setBulkServiceIds(metadata.services.map(s => s.id))
    }
  }

  // Handle bulk generate modal close with Rule 10 dirty check
  const handleCloseBulkModal = () => {
    if (isBulkDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('landlordRoomsConfirmCloseTitle'),
        message: t('landlordRoomsConfirmCloseBulkMessage'),
        onConfirm: () => {
          setIsBulkModalOpen(false)
          resetBulkForm()
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
        },
      })
    } else {
      setIsBulkModalOpen(false)
      resetBulkForm()
    }
  }

  // Real-time Preview computation for generated room numbers
  const previewRoomNumbers = useMemo(() => {
    const list: string[] = []
    const template = bulkNameFormat || 'P{floor}0{index}'
    const floors = Math.max(1, Math.min(bulkFloorCount || 1, 50))
    const perFloor = Math.max(1, Math.min(bulkRoomsPerFloor || 1, 50))

    for (let f = 1; f <= floors; f++) {
      for (let i = 1; i <= perFloor; i++) {
        const code = template
          .replace(/\{floor:0?2\}/g, String(f).padStart(2, '0'))
          .replace(/\{floor\}/g, String(f))
          .replace(/\{index:0?2\}/g, String(i).padStart(2, '0'))
          .replace(/\{index\}/g, String(i))
          .trim()
        list.push(code)
      }
    }
    return list
  }, [bulkFloorCount, bulkRoomsPerFloor, bulkNameFormat])

  const totalGeneratedCount = previewRoomNumbers.length
  const currentTotalRooms = rooms.filter(
    r =>
      buildingFilter === '' || r.building === buildingFilter || r.building === activeBuilding?.id,
  ).length

  const maxPlanRoom = metadata?.maxRoom ?? 10
  const isOverQuota = currentTotalRooms + totalGeneratedCount > maxPlanRoom

  // Handle Bulk Generate Form Submit
  const handleBulkGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBulkError(null)

    if (!bulkNameFormat.trim()) {
      setBulkError(t('landlordRoomsErrorBulkPatternRequired'))
      return
    }

    if (bulkFloorCount < 1 || bulkRoomsPerFloor < 1) {
      setBulkError(t('landlordRoomsErrorBulkFloorsInvalid'))
      return
    }

    if (!bulkRoomTypeId) {
      setBulkError(t('landlordRoomsErrorBulkTypeRequired'))
      return
    }

    const buildingId = activeBuilding?.id
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

    if (!buildingId || !UUID_RE.test(buildingId)) {
      setBulkError(t('landlordRoomsErrorBuildingNotFound'))
      return
    }

    // Check duplicate room numbers within generated list
    const uniqueSet = new Set(previewRoomNumbers)
    if (uniqueSet.size !== previewRoomNumbers.length) {
      setBulkError(t('landlordRoomsErrorBulkDuplicate'))
      return
    }

    setIsBulkSubmitting(true)
    try {
      const response = await bulkGenerateRooms(buildingId, {
        floorCount: bulkFloorCount,
        roomsPerFloor: bulkRoomsPerFloor,
        nameFormat: bulkNameFormat.trim(),
        area: bulkArea ? parseFloat(bulkArea) : undefined,
        maxOccupants: bulkMaxOccupants ? parseInt(bulkMaxOccupants, 10) : undefined,
        roomTypeId: bulkRoomTypeId,
        serviceIds: bulkServiceIds,
      })

      toast.success(t('landlordRoomsToastBulkSuccess', { count: response.count }))

      // Refresh room list from server
      await fetchBuildingData(buildingId)
      setIsBulkModalOpen(false)
      resetBulkForm()
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || t('landlordRoomsErrorSaveFailed')
      setBulkError(msg)
    } finally {
      setIsBulkSubmitting(false)
    }
  }

  // Filter rooms
  const filteredRooms = rooms.filter(room => {
    const matchSearch = room.id.toLowerCase().includes(searchQuery.toLowerCase())
    const matchBuilding = buildingFilter === '' || room.building === buildingFilter
    const matchStatus = statusFilter === '' || room.status === statusFilter
    const matchContract = contractFilter === '' || room.contract === contractFilter
    const matchInvoice = invoiceFilter === '' || room.invoice === invoiceFilter

    return matchSearch && matchBuilding && matchStatus && matchContract && matchInvoice
  })

  // Group all filtered rooms by floor for Grid View (defaults to displaying all rooms)
  const groupedRooms = useMemo(() => {
    return filteredRooms.reduce(
      (acc, room) => {
        if (!acc[room.floor]) acc[room.floor] = []
        acc[room.floor].push(room)
        return acc
      },
      {} as Record<string, typeof rooms>,
    )
  }, [filteredRooms])

  const floors = useMemo(() => {
    return Object.keys(groupedRooms).sort((a, b) => Number(b) - Number(a))
  }, [groupedRooms])

  const totalRoomsCount = rooms.length
  const occupiedCount = rooms.filter(r => r.status === 'Đang thuê').length
  const vacantCount = rooms.filter(r => r.status === 'Trống').length
  const maintenanceCount = rooms.filter(r => r.status === 'Bảo trì').length
  const reservedCount = rooms.filter(r => r.status === 'Đặt cọc').length
  const occupancyRate =
    totalRoomsCount > 0 ? ((occupiedCount / totalRoomsCount) * 100).toFixed(1) : '0.0'

  const statChips: StatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordRoomsStatTotal'),
        value: totalRoomsCount,
        icon: <Home className="w-5 h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 transition-colors border-white/10 backdrop-blur-md w-full lg:w-[150px]',
        labelColor: 'subtle',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'occupancy',
        label: t('landlordRoomsOccupancy'),
        value: `${occupancyRate}%`,
        icon: <Target className="w-5 h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 transition-colors border-danger/30 backdrop-blur-md w-full lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'occupied',
        label: t('landlordRoomsStatusOccupied'),
        value: occupiedCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-primary/10 hover:bg-primary/20 transition-colors border-primary/30 backdrop-blur-md w-full lg:w-[130px]',
        labelColor: 'brand',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'vacant',
        label: t('landlordRoomsStatusVacant'),
        value: vacantCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-vacant shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-vacant/10 hover:bg-vacant/20 transition-colors border-vacant/30 backdrop-blur-md w-full lg:w-[130px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'maintenance',
        label: t('landlordRoomsStatusMaintenance'),
        value: maintenanceCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-accent/10 hover:bg-accent/20 transition-colors border-accent/30 backdrop-blur-md w-full lg:w-[130px]',
        labelClassName: 'text-accent',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'reserved',
        label: t('landlordRoomsStatusReserved'),
        value: reservedCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-deposit shadow-[0_0_8px_rgba(139,92,246,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-deposit/10 hover:bg-deposit/20 transition-colors border-deposit/30 backdrop-blur-md w-full lg:w-[130px]',
        labelClassName: 'text-purple-400',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
    ],
    [
      t,
      totalRoomsCount,
      occupancyRate,
      occupiedCount,
      vacantCount,
      maintenanceCount,
      reservedCount,
    ],
  )

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Text as="h1" size="4xl" weight="black" className="tracking-tight">
            {t('landlordRoomsPageTitle')}
          </Text>
          <Text variant="subtitle" size="sm" color="secondary" className="mt-0.5">
            {t('landlordRoomsPageSubtitle')}
          </Text>
        </div>
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full sm:w-auto">
          {/* Bulk Generate Trigger Button */}
          <Button
            type="button"
            variant="accent"
            size='md'
            onClick={() => {
              resetBulkForm()
              setIsBulkModalOpen(true)
            }}
            leftIcon={<ListFilterPlus />}
            title={t('landlordRoomsBulkGenerateTooltip')}
          >
              {t('landlordRoomsBulkGenerateBtn')}
          </Button>

          {/* Single Room Add Button */}
          <Button
            type="button"
            variant="primary"
            size='md'
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className='w-5 h-5' />}
            className="sm:w-auto"
          >
            {t('landlordRoomsAddRoomBtn')}
          </Button>
        </div>
      </div>

      {/* Building Overview Banner */}
      <div className="bg-zinc-900 rounded-3xl p-5 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Building2 className="w-64 h-64" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
          {/* Stat Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:flex lg:flex-wrap lg:justify-end items-center gap-2.5 sm:gap-3 w-full lg:w-auto mt-4 lg:mt-0">
            {statChips.map(chip => (
              <div
                key={chip.key}
                className={`flex items-center gap-2.5 sm:gap-3 rounded-2xl border ${chip.containerClassName}`}
              >
                {chip.icon}
                <div className="flex flex-col">
                  <Text
                    variant="overline"
                    size="3xs"
                    weight="bold"
                    color={chip.labelColor}
                    className={chip.labelClassName}
                  >
                    {chip.label}
                  </Text>
                  <Text
                    weight="black"
                    color={chip.valueColor}
                    className={chip.valueClassName}
                  >
                    {chip.value}
                  </Text>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main Card with Toolbar & View Switcher */}
      <div className="bg-card border border-line rounded-3xl shadow-sm overflow-hidden">
        {/* Toolbar Header */}
        <div className="p-4 border-b border-line flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Fixed-width Search */}
          <div className="w-full sm:w-64 lg:w-72 shrink-0">
            <SearchInput
              placeholder={t('landlordRoomsSearchInputPlaceholder')}
              value={searchQuery}
              onChange={val => setSearchQuery(val)}
              containerClassName="w-full space-y-0"
            />
          </div>

          {/* Right: Filters & View Switcher */}
          <div className="flex flex-wrap items-center justify-start lg:justify-end gap-2.5 flex-1 min-w-0">
            <SelectInput
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              containerClassName="w-auto min-w-[140px] space-y-0"
              options={[
                { value: '', label: t('landlordRoomsAllStatuses') },
                { value: 'Trống', label: t('landlordRoomsStatusVacant') },
                { value: 'Đang thuê', label: t('landlordRoomsStatusOccupied') },
                { value: 'Bảo trì', label: t('landlordRoomsStatusMaintenance') },
                { value: 'Đặt cọc', label: t('landlordRoomsStatusReserved') },
              ]}
            />

            <SelectInput
              value={contractFilter}
              onChange={e => setContractFilter(e.target.value)}
              containerClassName="w-auto min-w-[150px] space-y-0"
              options={[
                { value: '', label: t('landlordRoomsAllContracts') },
                { value: 'active', label: t('landlordRoomsContractActive') },
                { value: 'expired', label: t('landlordRoomsContractExpired') },
                { value: 'none', label: t('landlordRoomsContractNone') },
              ]}
            />

            <div className="shrink-0 ml-auto lg:ml-0">
              <ViewModeToggle
                value={viewMode}
                onChange={handleViewModeChange}
              />
            </div>
          </div>
        </div>

        {/* Content Section: Grid View vs Table View */}
        <div className="p-5">
          {isLoadingMetadata ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
              <Text weight="bold" size="sm" className="text-foreground/90">
                {t('landlordRoomsLoadingData')}
              </Text>
              <Text variant="caption" color="subtle" className="mt-1">
                {t('landlordRoomsSyncingInfo')}
              </Text>
            </div>
          ) : filteredRooms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-4 bg-surface/50 rounded-2xl border border-line border-dashed text-center">
              <div className="w-16 h-16 bg-card rounded-2xl shadow-sm border border-line flex items-center justify-center mb-4 text-muted">
                <Search className="w-8 h-8" />
              </div>
              <Text as="h3" weight="bold" size="base" className="text-foreground mb-1">
                {t('landlordRoomsEmptyTitle')}
              </Text>
              <Text variant="subtitle" size="xs" color="secondary" className="max-w-sm">
                {t('landlordRoomsEmptyDesc')}
              </Text>
              <div className="flex items-center gap-3 mt-5">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('')
                    setStatusFilter('')
                    setContractFilter('')
                    setInvoiceFilter('')
                  }}
                >
                  {t('landlordRoomsClearFilter')}
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsBulkModalOpen(true)}
                  leftIcon={<Sparkles className="w-4 h-4" />}
                >
                  {t('landlordRoomsBulkGenerateBtn')}
                </Button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* GRID VIEW (Grouped by floor - all rooms displayed) */
            <div className="space-y-4">
              {floors.map(floor => (
                <div
                  key={floor}
                  className="flex flex-col md:flex-row gap-4 bg-card p-3.5 rounded-2xl border border-line shadow-2xs hover:border-line transition-all"
                >
                  <div className="flex-shrink-0 w-full md:w-24 bg-zinc-900 rounded-xl flex items-center justify-center px-3 py-3 text-white">
                    <div className="flex items-center gap-1.5">
                      <Text variant="overline" size="3xs" weight="bold" color="subtle">
                        {t('landlordRoomsColFloor')}
                      </Text>
                      <Text size="lg" weight="black" color="white">
                        {floor}
                      </Text>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-wrap gap-3 items-center">
                    {(groupedRooms[floor] || []).map((room: any) => {
                      const statusMeta = getRoomStatusMeta(room.status)

                      return (
                        <div
                          key={`${room.building}-${room.id}`}
                          onClick={() => router.push(`/landlord/rooms/${room.fullRoomId}`)}
                          className={`relative flex flex-col items-center justify-center p-3 rounded-xl border w-[100px] h-[100px] transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-md ${statusMeta.gridContainer}`}
                        >
                          <Button
                            type="button"
                            variant="ghost"
                            rounded='full'
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              handleOpenEditModal(room)
                            }}
                            className="absolute h-6 w-6 p-1 top-0 right-0 opacity-80 hover:opacity-100 z-10"
                            title={t('landlordRoomsEditRoomTooltip')}
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Button>

                          <Text
                            as="span"
                            weight="black"
                            size="lg"
                            className={`mt-1 ${statusMeta.gridText}`}
                          >
                            {room.id}
                          </Text>

                          <Text.Badge className={`mt-1 px-2 py-0.5 rounded-md text-center ${statusMeta.gridBadge}`}>
                            {statusMeta.label}
                          </Text.Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* TABLE VIEW (All rooms displayed) */
            <div className="overflow-x-auto rounded-2xl border border-line">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-card-hover text-foreground/90 font-bold border-b border-line uppercase tracking-wider text-[10px]">
                    <th className="p-3">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColRoomNumber')}
                      </Text>
                    </th>
                    <th className="p-3">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColFloor')}
                      </Text>
                    </th>
                    <th className="p-3">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColRoomType')}
                      </Text>
                    </th>
                    <th className="p-3">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColArea')}
                      </Text>
                    </th>
                    <th className="p-3">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColStatus')}
                      </Text>
                    </th>
                    <th className="p-3">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColServices')}
                      </Text>
                    </th>
                    <th className="p-3 text-right">
                      <Text variant="overline" weight="bold" color="secondary">
                        {t('landlordRoomsColActions')}
                      </Text>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {filteredRooms.map(room => {
                    const statusMeta = getRoomStatusMeta(room.status)

                    return (
                      <TableRow
                        key={`${room.building}-${room.id}`}
                        onClick={() => router.push(`/landlord/rooms/${room.fullRoomId}`)}
                        className="hover:bg-card-hover transition-colors duration-150 group cursor-pointer"
                      >
                        <td className="p-3 font-black text-foreground text-sm">
                          <Text as="span" weight="black" size="sm" className="text-foreground">
                            {room.id}
                          </Text>
                        </td>
                        <td className="p-3 font-semibold text-muted">
                          <Text as="span" weight="semibold" size="xs" color="secondary">
                            {t('landlordRoomsFloorText', { floor: room.floor })}
                          </Text>
                        </td>
                        <td className="p-3 font-medium text-foreground/90">
                          <Text as="span" weight="medium" size="xs" className="text-foreground/90">
                            {room.roomType || 'Studio'}
                          </Text>
                        </td>
                        <td className="p-3 text-muted">
                          <Text as="span" size="xs" color="secondary">
                            {room.area ? `${room.area} m²` : '25 m²'}
                          </Text>
                        </td>
                        <td className="p-3">
                          <Text.Badge className={`px-2.5 py-0.5 rounded-full ${statusMeta.tableBadge}`}>
                            {statusMeta.label}
                          </Text.Badge>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {(room.services || ['Điện', 'Nước']).map((s: string, idx: number) => (
                              <Text
                                key={idx}
                                as="span"
                                size="3xs"
                                weight="medium"
                                className="px-1.5 py-0.5 bg-card-hover text-muted rounded"
                              >
                                {getServiceLabel(s)}
                              </Text>
                            ))}
                          </div>
                        </td>
                        <td className="p-3 text-right space-x-1">
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            onClick={() => handleOpenEditModal(room)}
                            title={t('landlordRoomsEditRoomTooltip')}
                          >
                            <Edit />
                          </Button>
                        </td>
                      </TableRow>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rooms Summary Bar (Default displays all rooms) */}
        <div className="p-4 border-t border-line bg-surface/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted font-medium">
          <div className="flex items-center gap-2">
            <Text as="span" size="xs" color="secondary">
              {t('landlordRoomsPaginationShowing')}:
            </Text>
            <Text as="span" size="xs" weight="black" className="text-foreground">
              {filteredRooms.length}
            </Text>
            <Text as="span" size="xs" color="secondary">
              {t('landlordRoomsPaginationOf', { total: totalRoomsCount })}
            </Text>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BULK GENERATE ROOMS MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isBulkModalOpen}
        onClose={handleCloseBulkModal}
        size="3xl"
        asForm
        onSubmit={handleBulkGenerateSubmit}
        header={
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-warning-soft text-warning rounded-2xl">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <Text as="h2" variant="heading" size="xl" weight="black" className="tracking-tight text-foreground">
                {t('landlordRoomsBulkModalTitle')}
              </Text>
              <Text variant="caption" size="xs" color="subtle" className="mt-0.5">
                {t('landlordRoomsBulkModalSubtitle')}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-6 space-y-6 custom-scrollbar"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseBulkModal}
            >
              {t('landlordRoomsBulkBtnCancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isBulkSubmitting || isOverQuota}
              isLoading={isBulkSubmitting}
              leftIcon={<Sparkles className="w-4 h-4" />}
            >
              {isBulkSubmitting
                ? t('landlordRoomsBulkBtnSubmitting')
                : t('landlordRoomsBulkBtnConfirm', { count: totalGeneratedCount })}
            </Button>
          </div>
        }
      >
        {bulkError && (
          <Form.Alert
            variant="error"
            title={t('landlordRoomsBulkErrorHeader')}
            message={bulkError}
            onClose={() => setBulkError(null)}
          />
        )}

        {/* Quota Info Banner */}
        <div className="p-4 rounded-2xl bg-card border border-line shadow-2xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-foreground/90">
            <Text as="span" size="xs" weight="bold" className="flex items-center gap-1.5 text-foreground/90">
              <Building2 className="w-4 h-4 text-primary" />
              {t('landlordRoomsBulkQuotaLabel')}
            </Text>
            <Text as="span" size="xs" weight="black" className="text-foreground">
              {t('landlordRoomsBulkQuotaValue', {
                current: currentTotalRooms,
                max: maxPlanRoom,
              })}
            </Text>
          </div>
          <div className="w-full h-2 bg-card-hover rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${isOverQuota ? 'bg-red-500' : 'bg-primary'
                }`}
              style={{
                width: `${Math.min(100, ((currentTotalRooms + totalGeneratedCount) / maxPlanRoom) * 100)}%`,
              }}
            />
          </div>
          {isOverQuota && (
            <Form.Alert
              variant="warning"
              message={t('landlordRoomsBulkQuotaWarning', {
                count: totalGeneratedCount,
                max: maxPlanRoom,
              })}
            />
          )}
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-card p-5 rounded-2xl border border-line shadow-2xs">
          <NumberInput
            label={t('landlordRoomsBulkFloorCountLabel')}
            required
            min={1}
            max={50}
            value={bulkFloorCount}
            onChange={e => {
              setBulkFloorCount(parseInt(e.target.value, 10) || 1)
              setIsBulkDirty(true)
            }}
          />

          <NumberInput
            label={t('landlordRoomsBulkRoomsPerFloorLabel')}
            required
            min={1}
            max={50}
            value={bulkRoomsPerFloor}
            onChange={e => {
              setBulkRoomsPerFloor(parseInt(e.target.value, 10) || 1)
              setIsBulkDirty(true)
            }}
          />

          <div className="sm:col-span-2 space-y-1.5">
            <TextInput
              label={t('landlordRoomsBulkNameFormatLabel')}
              required
              value={bulkNameFormat}
              onChange={e => {
                setBulkNameFormat(e.target.value)
                setIsBulkDirty(true)
              }}
              placeholder={t('landlordRoomsBulkNameFormatPlaceholder')}
              labelRight={
                <Text as="span" size="2xs" color="subtle">
                  Placeholder:{' '}
                  <Text.Code className="bg-card-hover text-primary">
                    &#123;floor&#125;
                  </Text.Code>
                  ,{' '}
                  <Text.Code className="bg-card-hover text-primary">
                    &#123;index&#125;
                  </Text.Code>
                </Text>
              }
            />
            <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-muted">
              <Text as="span" size="3xs" weight="bold" color="secondary">
                {t('landlordRoomsBulkSuggestedPatterns')}
              </Text>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBulkNameFormat('P{floor}0{index}')
                  setIsBulkDirty(true)
                }}
                className="rounded"
              >
                P&#123;floor&#125;0&#123;index&#125;
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBulkNameFormat('{floor}0{index}')
                  setIsBulkDirty(true)
                }}
                className="rounded"
              >
                &#123;floor&#125;0&#123;index&#125;
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setBulkNameFormat('P{floor}{index:02}')
                  setIsBulkDirty(true)
                }}
                className="rounded"
              >
                P&#123;floor&#125;&#123;index:02&#125;
              </Button>
            </div>
          </div>

          <SelectInput
            label={t('landlordRoomsBulkRoomTypeLabel')}
            value={bulkRoomTypeId}
            onChange={e => {
              setBulkRoomTypeId(e.target.value)
              setIsBulkDirty(true)
            }}
            options={
              metadata?.roomTypes && metadata.roomTypes.length > 0
                ? metadata.roomTypes.map(rt => ({
                  value: rt.id,
                  label: rt.name,
                }))
                : [
                  { value: 'studio', label: t('landlordRoomsTypeStudio') },
                  { value: '1pn', label: t('landlordRoomsType1Bed') },
                  { value: '2pn', label: t('landlordRoomsType2Bed') },
                ]
            }
          />

          <NumberInput
            label={t('landlordRoomsBulkAreaLabel')}
            min={1}
            value={bulkArea}
            onChange={e => {
              setBulkArea(e.target.value)
              setIsBulkDirty(true)
            }}
            suffixText="m²"
          />
        </div>

        {/* Service Associations Checkboxes */}
        <div className="bg-card p-5 rounded-2xl border border-line shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <Text as="label" size="xs" weight="bold" className="text-foreground flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-primary" />
              {t('landlordRoomsBulkServicesSection')}
            </Text>
            <Text as="span" size="2xs" color="subtle">
              {t('landlordRoomsBulkServicesSelected', { count: bulkServiceIds.length })}
            </Text>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {metadata?.services && metadata.services.length > 0
              ? metadata.services.map(srv => {
                const checked = bulkServiceIds.includes(srv.id)
                return (
                  <Checkbox
                    key={srv.id}
                    variant="card"
                    checked={checked}
                    onChange={() => {
                      setBulkServiceIds(prev =>
                        prev.includes(srv.id)
                          ? prev.filter(id => id !== srv.id)
                          : [...prev, srv.id],
                      )
                      setIsBulkDirty(true)
                    }}
                    label={srv.name}
                  />
                )
              })
              : ['Điện', 'Nước', 'WiFi', 'Vệ sinh'].map((item, idx) => (
                <Checkbox
                  key={idx}
                  variant="card"
                  defaultChecked
                  label={getServiceLabel(item)}
                />
              ))}
          </div>
        </div>

        {/* Live Preview Card */}
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-5 text-white shadow-md space-y-3">
          <div className="flex items-center justify-between">
            <Text as="span" size="xs" weight="bold" className="text-zinc-300 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-400" />
              {t('landlordRoomsBulkPreviewTitle', { count: previewRoomNumbers.length })}
            </Text>
            <Text as="span" size="3xs" mono color="subtle">
              {t('landlordRoomsBulkPreviewSummary', {
                floors: bulkFloorCount,
                roomsPerFloor: bulkRoomsPerFloor,
              })}
            </Text>
          </div>

          <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto custom-scrollbar p-2 bg-white/5 rounded-xl border border-white/10">
            {previewRoomNumbers.map((code, idx) => (
              <Text
                key={idx}
                as="span"
                size="xs"
                mono
                weight="bold"
                className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10"
              >
                {code}
              </Text>
            ))}
          </div>
        </div>

      </Modal>

      {/* ========================================================================= */}
      {/* SINGLE ROOM ADD/EDIT MODAL */}
      {/* ========================================================================= */}
      <Modal
        isOpen={isSingleModalOpen}
        onClose={handleCloseSingleModal}
        size="4xl"
        asForm
        onSubmit={handleSingleRoomSubmit}
        header={
          <div className="flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-2xl">
              {selectedRoomId ? <Edit className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
            </div>
            <div>
              <Text as="h2" variant="heading" size="xl" weight="black" className="text-foreground">
                {selectedRoomId
                  ? t('landlordRoomsSingleTitleEdit')
                  : t('landlordRoomsSingleTitleCreate')}
              </Text>
              <Text variant="caption" size="xs" color="subtle" className="mt-0.5">
                {selectedRoomId
                  ? t('landlordRoomsSingleDescEdit')
                  : t('landlordRoomsSingleDescCreate')}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-6 bg-surface/50 space-y-6 custom-scrollbar"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseSingleModal}
              disabled={isSingleSubmitting || isImageUploading}
            >
              {t('landlordRoomsSingleBtnCancel')}
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSingleSubmitting || isImageUploading}
              isLoading={isSingleSubmitting}
              leftIcon={
                selectedRoomId ? <Edit className="w-4 h-4" /> : <Plus className="w-4 h-4" />
              }
            >
              {getSingleSubmitLabel()}
            </Button>
          </div>
        }
      >
        <div
          onInput={() => setIsSingleDirty(true)}
          onChange={() => setIsSingleDirty(true)}
          className="space-y-6"
        >
          {/* Error Banner */}
          {singleError && (
            <Form.Alert
              variant="error"
              message={singleError}
              onClose={() => setSingleError(null)}
            />
          )}

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Column: Basic Details */}
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-card border border-line rounded-2xl p-5 shadow-2xs space-y-4">
                <Text as="h3" weight="bold" size="sm" className="font-bold text-foreground flex items-center gap-2">
                  <Home className="w-4 h-4 text-primary" />{' '}
                  {t('landlordRoomsSingleSectionInfo')}
                </Text>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Text as="label" size="xs" weight="bold" className="text-foreground/90">
                      {t('landlordRoomsSingleBuildingLabel')}
                    </Text>
                    <Text
                      as="div" size="xs" color='subtle' weight="medium"
                      className="w-full px-3.5 py-2.5 border border-line bg-surface rounded-xl truncate"
                    >
                      {activeBuilding?.name || 'Dormio Boarding House'}
                    </Text>
                  </div>

                  <TextInput
                    label={t('landlordRoomsSingleRoomNumberLabel')}
                    required
                    value={formRoomNumber}
                    onChange={e => {
                      setFormRoomNumber(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    placeholder="VD: 101, A01"
                  />

                  <SelectInput
                    label={t('landlordRoomsSingleRoomTypeLabel')}
                    required
                    value={formRoomTypeId}
                    onChange={e => {
                      setFormRoomTypeId(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    options={
                      metadata?.roomTypes && metadata.roomTypes.length > 0
                        ? metadata.roomTypes.map(rt => ({
                          value: rt.id,
                          label: rt.name,
                        }))
                        : [
                          { value: 'studio', label: t('landlordRoomsTypeStudio') },
                          { value: '1pn', label: t('landlordRoomsType1Bed') },
                          { value: '2pn', label: t('landlordRoomsType2Bed') },
                        ]
                    }
                  />

                  <NumberInput
                    label={t('landlordRoomsSingleFloorLabel')}
                    required
                    min={1}
                    value={formFloor}
                    onChange={e => {
                      setFormFloor(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    placeholder="VD: 1, 2..."
                  />

                  <NumberInput
                    label={t('landlordRoomsBulkAreaLabel')}
                    min={1}
                    step="0.1"
                    value={formArea}
                    onChange={e => {
                      setFormArea(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    placeholder="25"
                    suffixText="m²"
                  />

                  <NumberInput
                    label={t('landlordRoomsSingleMaxOccupantsLabel')}
                    min={1}
                    value={formMaxOccupants}
                    onChange={e => {
                      setFormMaxOccupants(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    placeholder="2"
                  />

                  <SelectInput
                    label={t('landlordRoomsSingleStatusLabel')}
                    value={formStatus}
                    onChange={e => {
                      setFormStatus(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    options={[
                      { value: 'available', label: t('landlordRoomsSingleStatusAvailable') },
                      { value: 'occupied', label: t('landlordRoomsSingleStatusOccupied') },
                      {
                        value: 'maintainace',
                        label: t('landlordRoomsSingleStatusMaintenance'),
                      },
                      { value: 'deposited', label: t('landlordRoomsSingleStatusDeposited') },
                    ]}
                  />

                  <TextInput
                    label={t('landlordRoomsSinglePriceLabel')}
                    value={formPrice}
                    onChange={e => {
                      setFormPrice(e.target.value)
                      setIsSingleDirty(true)
                    }}
                    placeholder="3.500.000"
                    rightIcon={<Text as="span" size="xs" weight="bold" color="brand">đ</Text>}
                  />
                </div>

                <div className="pt-1">
                  <ImageUpload
                    label={t('landlordRoomsSingleImageLabel')}
                    helperText={t('landlordRoomsSingleImageHelper')}
                    loadingText={t('landlordRoomsSingleImageUploading')}
                    value={formImageUrl}
                    onChange={url => {
                      setFormImageUrl(url)
                      setIsSingleDirty(true)
                    }}
                    onRemove={() => {
                      setFormImageUrl('')
                      setIsSingleDirty(true)
                    }}
                    onUploadingChange={setIsImageUploading}
                    folder="dormio/rooms"
                    aspectRatio="video"
                    className="max-h-[220px]"
                    disabled={isSingleSubmitting}
                    showInspectButton={Boolean(formImageUrl)}
                    onInspect={url => {
                      if (typeof window !== 'undefined' && url) {
                        window.open(url, '_blank')
                      }
                    }}
                  />
                </div>
              </div>

              {/* Room Services Association */}
              <div className="bg-card border border-line rounded-2xl p-5 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <Text as="h3" weight="bold" size="sm" className="font-bold text-foreground flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-primary" />{' '}
                    {t('landlordRoomsSingleSectionServices')}
                  </Text>
                  <Text as="span" size="2xs" weight="semibold" color="secondary">
                    {t('landlordRoomsSingleServicesSelected', {
                      count: selectedServiceIds.length,
                    })}
                  </Text>
                </div>
                <Text variant="body" size="xs" color="secondary" className="leading-relaxed">
                  {t('landlordRoomsSingleServicesHint')}
                </Text>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  {metadata?.services && metadata.services.length > 0
                    ? metadata.services.map(srv => {
                      const isChecked = selectedServiceIds.includes(srv.id)
                      return (
                        <Checkbox
                          key={srv.id}
                          variant="card"
                          checked={isChecked}
                          onChange={() => {
                            setSelectedServiceIds(prev =>
                              prev.includes(srv.id)
                                ? prev.filter(id => id !== srv.id)
                                : [...prev, srv.id],
                            )
                            setIsSingleDirty(true)
                          }}
                          label={srv.name}
                          description={
                            srv.price !== undefined
                              ? `${formatCurrency(Number(srv.price) || srv.price, currentLocale)} / ${srv.unit}`
                              : undefined
                          }
                        />
                      )
                    })
                    : [
                      {
                        id: 'dien',
                        name: t('landlordRoomsServiceElectricity'),
                        rate: '3.500 đ/kWh',
                      },
                      {
                        id: 'nuoc',
                        name: t('landlordRoomsServiceWater'),
                        rate: '25.000 đ/m³',
                      },
                      {
                        id: 'wifi',
                        name: t('landlordRoomsServiceWifi'),
                        rate: '100.000 đ/tháng',
                      },
                      {
                        id: 'rac',
                        name: t('landlordRoomsServiceTrash'),
                        rate: '20.000 đ/phòng',
                      },
                    ].map((srv, idx) => (
                      <Checkbox
                        key={idx}
                        variant="card"
                        defaultChecked
                        label={srv.name}
                        description={srv.rate}
                      />
                    ))}
                </div>
              </div>
            </div>

            {/* Right Column: Amenities & Notes */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-line rounded-2xl p-5 shadow-2xs space-y-3">
                <Text as="h3" weight="bold" size="sm" className="font-bold text-foreground flex items-center gap-2">
                  <Target className="w-4 h-4 text-primary" />{' '}
                  {t('landlordRoomsSingleSectionAmenities')}
                </Text>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'WiFi',
                    'Điều hòa',
                    'Nóng lạnh',
                    'Tủ quần áo',
                    'Giường',
                    'Kệ bếp',
                    'Ban công',
                    'WC riêng',
                  ].map(item => (
                    <Button
                      key={item}
                      type="button"
                      variant={selectedAmenities.includes(item) ? 'primary' : 'outline'}
                      size="sm"
                      onClick={() => {
                        setSelectedAmenities(prev =>
                          prev.includes(item)
                            ? prev.filter(a => a !== item)
                            : [...prev, item],
                        )
                        setIsSingleDirty(true)
                      }}
                    >
                      <Text as="span" size="xs" weight="semibold">
                        {item}
                      </Text>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-line rounded-2xl p-5 shadow-2xs space-y-2">
                <Text as="h3" weight="bold" size="sm" className="font-bold text-foreground flex items-center gap-2">
                  <FileSignature className="w-4 h-4 text-primary" />{' '}
                  {t('landlordRoomsSingleSectionNotes')}
                </Text>
                <TextareaInput
                  rows={4}
                  value={formNotes}
                  onChange={e => {
                    setFormNotes(e.target.value)
                    setIsSingleDirty(true)
                  }}
                  placeholder={t('landlordRoomsSingleNotesPlaceholder')}
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Confirmation Modal (Rule 10) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title?: string
  message?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTranslations('landlord')
  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      zIndex={60}
      showCloseButton={false}
      footer={
        <div className="flex items-center justify-center gap-3 w-full">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            {t('landlordRoomsContinueEditing')}
          </Button>
          <Button
            type="button"
            variant="danger"
            onClick={onConfirm}
            className="flex-1"
          >
            {t('landlordRoomsDiscardAndClose')}
          </Button>
        </div>
      }
    >
      <div className="space-y-5 text-center">
        <div className="w-14 h-14 bg-warning-soft border border-warning-subtle rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <Text as="h3" variant="heading" size="lg" weight="black" className="tracking-tight text-foreground">
            {title}
          </Text>
          <Text variant="body" size="xs" weight="medium" color="secondary" className="leading-relaxed max-w-xs mx-auto">
            {message}
          </Text>
        </div>
      </div>
    </Modal>
  )
}
