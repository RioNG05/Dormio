'use client'

import React, { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Home,
  User,
  FileSignature,
  Receipt,
  Gauge,
  Banknote,
  Wrench,
  ChevronDown,
  AlertTriangle,
  Eye,
  History,
  Wallet,
  Plus,
  Filter,
  Building2,
  AlertCircle,
  Users,
  ShieldCheck,
  Phone,
  MessageSquare,
  FileText,
  HouseWifi,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  Form,
  Text,
  Modal,
  Breadcrumb,
} from '@/components/ui'
import {
  getRoomDashboard,
  updateRoom,
  RoomDashboardResponse,
} from '@/services/room.service'
import {
  meterReadingService,
  LandlordActiveMeteredService,
  LandlordMeterPeriodHistory,
  LandlordMeterEditAction,
} from '@/services/meter-reading.service'
import { defaultRoomServices, Room } from '../data'

interface MeterHistoryRecord {
  id?: string
  period: string // "Tháng 09/2026"
  date: string // "01/09/2026 08:00"
  oldElec: number
  newElec: number
  oldWater: number
  newWater: number
  editReason?: string
  editedAt?: string
  editHistory?: Array<{
    id: string
    serviceName: string
    oldValue: number | null
    newValue: number
    reason: string | null
    createdAt: string
  }>
  editActions?: LandlordMeterEditAction[]
  isOpen?: boolean
}

interface InvoiceRecord {
  id: string // "INV-202609-401"
  period: string // "Tháng 09/2026"
  monthSeq: string // "09/26"
  deadline: string
  status: 'Chưa thanh toán' | 'Đã thu'
  method: string
  isOverdue?: boolean
  editReason?: string
  editedAt?: string
}

interface MaintenanceRecord {
  id: string
  title: string
  description?: string
  reportDate: string
  status: 'Đang xử lý' | 'Đã xong'
  priority: 'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ'
  completedDate?: string
}

const getAmenityLabel = (item: string, t: (key: string) => string): string => {
  const map: Record<string, string> = {
    WiFi: t('landlordRoomAmenityWiFi'),
    'Điều hòa': t('landlordRoomAmenityAirConditioner'),
    'Nóng lạnh': t('landlordRoomAmenityWaterHeater'),
    'Tủ quần áo': t('landlordRoomAmenityWardrobe'),
    Giường: t('landlordRoomAmenityBed'),
    'Kệ bếp': t('landlordRoomAmenityKitchenShelf'),
    'Ban công': t('landlordRoomAmenityBalcony'),
    'WC riêng': t('landlordRoomAmenityPrivateBathroom'),
    'Máy giặt': t('landlordRoomAmenityWashingMachine'),
    Tivi: t('landlordRoomAmenityTv'),
    'Tủ lạnh': t('landlordRoomAmenityRefrigerator'),
    'Bảo vệ': t('landlordRoomAmenitySecurityGuard'),
  }
  return map[item] || item
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const mapStatusToDisplay = (status?: string): 'Đang thuê' | 'Trống' | 'Bảo trì' | 'Đặt cọc' => {
  switch (status?.toLowerCase()) {
    case 'occupied':
    case 'đang thuê':
      return 'Đang thuê'
    case 'maintainace':
    case 'maintenance':
    case 'bảo trì':
      return 'Bảo trì'
    case 'deposited':
    case 'đặt cọc':
      return 'Đặt cọc'
    case 'available':
    case 'trống':
    default:
      return 'Trống'
  }
}

const mapDisplayToBackendStatus = (status: string): string => {
  switch (status) {
    case 'Đang thuê':
      return 'occupied'
    case 'Bảo trì':
      return 'maintainace'
    case 'Đặt cọc':
      return 'deposited'
    case 'Trống':
    default:
      return 'available'
  }
}

export default function RoomDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Đang thuê':
        return t('landlordRoomDetailStatusOccupied')
      case 'Trống':
        return t('landlordRoomDetailStatusAvailable')
      case 'Bảo trì':
        return t('landlordRoomDetailStatusMaintenance')
      case 'Đặt cọc':
        return t('landlordRoomDetailStatusDeposited')
      default:
        return status
    }
  }

  const priorityLabels: Record<string, string> = {
    'Mức độ cao': t('landlordRoomDetailPriorityHigh'),
    'Mức độ trung bình': t('landlordRoomDetailPriorityMedium'),
    'Mức độ nhẹ': t('landlordRoomDetailPriorityLow'),
  }

  const [room, setRoom] = useState<Room | null>(null)
  const [dashboardData, setDashboardData] = useState<RoomDashboardResponse | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Modals & form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  })
  const [discardConfirmModal, setDiscardConfirmModal] = useState<{
    isOpen: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    onConfirm: () => { },
  })

  // Filter state for Month/Year
  const [selectedFilterPeriod, setSelectedFilterPeriod] = useState<string>('all')

  // Room Edit Form states
  const [editRoomNumber, setEditRoomNumber] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editArea, setEditArea] = useState('')
  const [editFloor, setEditFloor] = useState('')
  const [editAmenities, setEditAmenities] = useState<string[]>([])
  const [editNotes, setEditNotes] = useState('')
  const [editServices, setEditServices] = useState([
    {
      id: 'bao_ve',
      name: 'Bảo vệ',
      defaultPrice: '50.000',
      customPrice: '60.000',
      unit: 'đ/phòng',
      isCustom: true,
      isRemovable: false,
    },
    {
      id: 'dien',
      name: 'Điện',
      defaultPrice: '3.500',
      customPrice: '3.500',
      unit: 'đ/kWh',
      isCustom: true,
      isRemovable: false,
    },
    {
      id: 'nuoc',
      name: 'Nước',
      defaultPrice: '25.000',
      customPrice: '25.000',
      unit: 'đ/m³',
      isCustom: true,
      isRemovable: false,
    },
    {
      id: 'rac',
      name: 'Rác',
      defaultPrice: '20.000',
      customPrice: '20.000',
      unit: 'đ/phòng',
      isCustom: true,
      isRemovable: false,
    },
    {
      id: 've_sinh',
      name: 'Vệ sinh',
      defaultPrice: '30.000',
      customPrice: '30.000',
      unit: 'đ/phòng',
      isCustom: true,
      isRemovable: false,
    },
    {
      id: 'wifi',
      name: 'Wifi',
      defaultPrice: '100.000',
      customPrice: '100.000',
      unit: 'đ/phòng',
      isCustom: true,
      isRemovable: false,
    },
  ])

  // Initial snapshot to detect unsaved changes
  const [initialEditValues, setInitialEditValues] = useState({
    roomNumber: '',
    price: '',
    area: '',
    floor: '',
  })

  // Meter Readings History & Active Services Data
  const [meterHistory, setMeterHistory] = useState<MeterHistoryRecord[]>([])
  const [meterHistoryRaw, setMeterHistoryRaw] = useState<LandlordMeterPeriodHistory[]>([])
  const [roomMeteredServices, setRoomMeteredServices] = useState<LandlordActiveMeteredService[]>([])

  // Invoices History List (initialized empty; loaded from API)
  const [invoicesHistory, setInvoicesHistory] = useState<InvoiceRecord[]>([])

  // Maintenance History List & Pagination (initialized empty; no mockup data)
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [maintPage, setMaintPage] = useState(1)
  const MAINT_PER_PAGE = 2

  const [incidentTitleInput, setIncidentTitleInput] = useState('')
  const [incidentDescInput, setIncidentDescInput] = useState('')
  const [incidentPriorityInput, setIncidentPriorityInput] = useState<
    'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ'
  >('Mức độ trung bình')

  // Toast notification state
  const { toast } = useToast()
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

  // Pagination states
  const ITEMS_PER_PAGE = 2
  const [invoicePage, setInvoicePage] = useState(1)
  const [meterPage, setMeterPage] = useState(1)

  // Meter Correction Modal State
  const [correctModal, setCorrectModal] = useState<{
    isOpen: boolean
    period: string
    oldElec: number
    newElec: number
    oldWater: number
    newWater: number
    reason: string
    error: string
  }>({
    isOpen: false,
    period: '',
    oldElec: 0,
    newElec: 0,
    oldWater: 0,
    newWater: 0,
    reason: '',
    error: '',
  })

  const isRealUuid = Boolean(resolvedParams.id && UUID_REGEX.test(resolvedParams.id))

  // Load Dashboard Data (Aggregated query) or fallback to mock
  useEffect(() => {
    setIsMounted(true)

    async function loadDashboard() {
      setIsLoading(true)
      if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
        try {
          const rawRes = await getRoomDashboard(activeBuilding.id, resolvedParams.id)
          const res = (rawRes as any)?.data?.room ? (rawRes as any).data : rawRes
          setDashboardData(res)

          const r = res?.room
          if (!r) {
            console.error('Room data is missing from dashboard response:', res)
            return
          }
          const activeContract = res.currentContract
          const primaryTenant =
            activeContract?.tenants?.find((t: any) => t.isPrimary) || activeContract?.tenants?.[0]

          const formattedPrice = activeContract?.rentPrice
            ? `${parseInt(activeContract.rentPrice).toLocaleString('vi-VN')} ₫`
            : r.roomType?.name
              ? `3.000.000 ₫`
              : '3.000.000 ₫'

          const mappedRoom: Room = {
            id: r.id,
            roomNumber: r.roomNumber,
            building: activeBuilding.id,
            buildingSeq: 1,
            floor: String(r.floor),
            price: formattedPrice,
            area: r.area ? String(r.area) : '25',
            status: mapStatusToDisplay(r.status),
            contract: activeContract ? 'active' : 'none',
            invoice: (res.invoices || []).some((i: any) => i.status?.toLowerCase() !== 'paid')
              ? 'debt'
              : 'paid',
            tenant: primaryTenant?.fullName || undefined,
            tenantPhone: primaryTenant?.phoneNumber || undefined,
            tenantCccd: primaryTenant?.identityNumber || undefined,
            amenities: [
              'WiFi',
              'Điều hòa',
              'Nóng lạnh',
              'Tủ quần áo',
              'Giường',
              'Kệ bếp',
              'Ban công',
              'WC riêng',
            ],
            notes: activeContract?.note || '',
          }

          setRoom(mappedRoom)
          setEditRoomNumber(r.roomNumber)
          setEditPrice(formattedPrice)
          setEditArea(mappedRoom.area || '25')
          setEditFloor(mappedRoom.floor || '1')
          setInitialEditValues({
            roomNumber: r.roomNumber,
            price: formattedPrice,
            area: mappedRoom.area || '25',
            floor: mappedRoom.floor || '1',
          })

          // Populate live services if attached
          if (res.services && res.services.length > 0) {
            setEditServices(
              res.services.map((s: any) => ({
                id: s.id,
                name: s.name,
                defaultPrice: parseInt(s.price).toLocaleString('vi-VN'),
                customPrice: parseInt(s.price).toLocaleString('vi-VN'),
                unit: s.unit ? `đ/${s.unit}` : 'đ/tháng',
                isCustom: false,
                isRemovable: false,
              })),
            )
          }

          // Populate live invoices if available
          if (res.invoices && res.invoices.length > 0) {
            setInvoicesHistory(
              res.invoices.map((inv: any) => {
                const due = new Date(inv.dueDate)
                const month = (due.getMonth() + 1).toString().padStart(2, '0')
                const year = due.getFullYear()
                const isPaid = inv.status?.toLowerCase() === 'paid'
                return {
                  id: inv.id.slice(0, 8).toUpperCase(),
                  period: `Tháng ${month}/${year}`,
                  monthSeq: `${month}/${String(year).slice(-2)}`,
                  deadline: due.toLocaleDateString('vi-VN'),
                  status: isPaid ? 'Đã thu' : 'Chưa thanh toán',
                  method: inv.paymentMethod || 'VietQR Auto',
                  isOverdue: !isPaid && new Date() > due,
                }
              }),
            )
          }

          // Load active metered services & meter history
          try {
            const [meterServicesRes, meterHistoryRes] = await Promise.all([
              meterReadingService.getLandlordRoomMeteredServices(
                activeBuilding.id,
                resolvedParams.id,
              ),
              meterReadingService.getLandlordRoomMeterHistory(activeBuilding.id, resolvedParams.id),
            ])

            if (meterServicesRes?.services) {
              setRoomMeteredServices(meterServicesRes.services)
              const elec = meterServicesRes.services.find(s =>
                s.serviceName.toLowerCase().includes('điện'),
              )
              const water = meterServicesRes.services.find(s =>
                s.serviceName.toLowerCase().includes('nước'),
              )
            }

            if (meterHistoryRes?.history) {
              setMeterHistoryRaw(meterHistoryRes.history)
              const mapped = meterHistoryRes.history.map((h, idx) => {
                const elec = h.services.find(
                  s =>
                    s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh',
                )
                const water = h.services.find(
                  s =>
                    s.serviceName.toLowerCase().includes('nước') ||
                    s.unit.toLowerCase().includes('m3') ||
                    s.unit.toLowerCase().includes('m³'),
                )
                return {
                  id: h.id || `cycle_${h.period}_${idx}`,
                  period: h.period,
                  date: h.date,
                  oldElec: elec?.oldReading ?? 0,
                  newElec: elec?.newReading ?? 0,
                  oldWater: water?.oldReading ?? 0,
                  newWater: water?.newReading ?? 0,
                  isOpen: idx === 0,
                  editReason: h.editReason,
                  editedAt: h.editedAt,
                  editHistory: h.editHistory,
                  editActions: h.editActions,
                }
              })
              setMeterHistory(mapped)
            }
          } catch (mErr) {
            console.warn('Could not load landlord meter readings:', mErr)
            setMeterHistory([])
          }
        } catch (err: any) {
          console.error('Failed to load room dashboard from API:', err)
          setMeterHistory([])
          setMaintenanceHistory([])
          setRoom(null)
        }
      } else {
        setRoom(null)
      }
      setIsLoading(false)
    }

    loadDashboard()
  }, [resolvedParams.id, activeBuilding?.id, isRealUuid])

  useEffect(() => {
    setInvoicePage(1)
    setMeterPage(1)
  }, [selectedFilterPeriod])

  // Modal reset behavior with confirmation for unsaved changes (Rule 10)
  const handleCloseEditModal = () => {
    const hasChanges =
      editRoomNumber !== initialEditValues.roomNumber ||
      editPrice !== initialEditValues.price ||
      editArea !== initialEditValues.area ||
      editFloor !== initialEditValues.floor

    if (hasChanges) {
      setDiscardConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setEditRoomNumber(initialEditValues.roomNumber)
          setEditPrice(initialEditValues.price)
          setEditArea(initialEditValues.area)
          setEditFloor(initialEditValues.floor)
          setIsEditModalOpen(false)
          setDiscardConfirmModal({ isOpen: false, onConfirm: () => { } })
        },
      })
    } else {
      setIsEditModalOpen(false)
    }
  }

  const handleSaveRoomDetails = async () => {
    if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
      try {
        const cleanArea = parseFloat(editArea) || undefined
        const cleanFloor = parseInt(editFloor) || undefined

        await updateRoom(activeBuilding.id, resolvedParams.id, {
          roomNumber: editRoomNumber.trim(),
          floor: cleanFloor,
          area: cleanArea,
        })

        setRoom(prev =>
          prev
            ? {
              ...prev,
              roomNumber: editRoomNumber || prev.roomNumber,
              price: editPrice.includes('₫') ? editPrice : `${editPrice} ₫`,
              area: editArea || prev.area,
              floor: editFloor || prev.floor,
              amenities: editAmenities,
              notes: editNotes,
            }
            : null,
        )
        setInitialEditValues({
          roomNumber: editRoomNumber,
          price: editPrice,
          area: editArea,
          floor: editFloor,
        })
        setIsEditModalOpen(false)
        showToast(t('landlordRoomDetailToastUpdateSuccess'), 'success')
      } catch (err: any) {
        console.error('Failed to update room:', err)
        showToast(err.message || t('landlordRoomDetailToastUpdateError'), 'error')
      }
    } else {
      setRoom(prev =>
        prev
          ? {
            ...prev,
            roomNumber: editRoomNumber || prev.roomNumber,
            price: editPrice.includes('₫') ? editPrice : `${editPrice} ₫`,
            area: editArea || prev.area,
            floor: editFloor || prev.floor,
            amenities: editAmenities,
            notes: editNotes,
          }
          : null,
      )
      setInitialEditValues({
        roomNumber: editRoomNumber,
        price: editPrice,
        area: editArea,
        floor: editFloor,
      })
      setIsEditModalOpen(false)
      showToast(t('landlordRoomDetailToastUpdateSuccess'), 'success')
    }
  }

  const handleUpdateStatus = async (
    newDisplayStatus: 'Trống' | 'Đang thuê' | 'Bảo trì' | 'Đặt cọc',
  ) => {
    const newBackendStatus = mapDisplayToBackendStatus(newDisplayStatus)
    setRoom(prev => (prev ? { ...prev, status: newDisplayStatus } : null))

    if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
      try {
        await updateRoom(activeBuilding.id, resolvedParams.id, { status: newBackendStatus })
        showToast(
          t('landlordRoomDetailToastStatusChanged').replace(
            '{status}',
            getStatusLabel(newDisplayStatus),
          ),
          'success',
        )
      } catch (err: any) {
        console.error('Failed to update status:', err)
        showToast(err.message || t('landlordRoomDetailToastStatusError'), 'error')
      }
    } else {
      showToast(
        t('landlordRoomDetailToastStatusChanged').replace(
          '{status}',
          getStatusLabel(newDisplayStatus),
        ),
        'success',
      )
    }
  }

  const handleCreateIncidentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!incidentTitleInput.trim()) {
      showToast(t('landlordRoomDetailToastIncidentNameRequired'), 'error')
      return
    }
    const todayStr = new Date().toLocaleDateString('vi-VN')

    const newRecord: MaintenanceRecord = {
      id: `M_${Date.now()}`,
      title: incidentTitleInput.trim(),
      description: incidentDescInput.trim() || undefined,
      reportDate: todayStr,
      status: 'Đang xử lý',
      priority: incidentPriorityInput,
    }
    setMaintenanceHistory(prev => [newRecord, ...prev])
    setIncidentTitleInput('')
    setIncidentDescInput('')
    setIncidentPriorityInput('Mức độ trung bình')
    setIsIncidentModalOpen(false)
    showToast(t('landlordRoomDetailToastIncidentSuccess'), 'success')
  }

  // Open correction modal for a specific period
  const handleOpenCorrectionModal = (record: MeterHistoryRecord) => {
    setCorrectModal({
      isOpen: true,
      period: record.period,
      oldElec: record.oldElec,
      newElec: record.newElec,
      oldWater: record.oldWater,
      newWater: record.newWater,
      reason: '',
      error: '',
    })
  }

  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false)

  // Close correction modal with unsaved confirmation check (Rule 10)
  const handleCloseCorrectionModal = () => {
    if (correctModal.reason.trim() !== '') {
      setDiscardConfirmModal({
        isOpen: true,
        onConfirm: () => {
          setCorrectModal(prev => ({ ...prev, isOpen: false }))
          setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))
        },
      })
    } else {
      setCorrectModal(prev => ({ ...prev, isOpen: false }))
    }
  }

  // Save correction action with mandatory reason check
  const handleSaveCorrection = async () => {
    if (!correctModal.reason.trim()) {
      setCorrectModal(prev => ({ ...prev, error: t('landlordRoomDetailToastReasonRequired') }))
      return
    }

    if (!activeBuilding?.id || !resolvedParams.id) {
      showToast(t('landlordRoomDetailToastRoomNotFound'), 'error')
      return
    }

    const rawPeriod = meterHistoryRaw.find(h => h.period === correctModal.period)
    if (!rawPeriod) {
      setMeterHistory(prev =>
        prev.map(item => {
          if (item.period === correctModal.period) {
            const changes = []
            if (Number(correctModal.newElec) !== item.newElec) {
              changes.push({
                serviceName: 'Điện',
                oldValue: item.newElec,
                newValue: Number(correctModal.newElec),
                unit: 'kWh',
              })
            }
            if (Number(correctModal.newWater) !== item.newWater) {
              changes.push({
                serviceName: 'Nước',
                oldValue: item.newWater,
                newValue: Number(correctModal.newWater),
                unit: 'm³',
              })
            }
            const newAction: LandlordMeterEditAction = {
              id: `mock_act_${Date.now()}`,
              reason: correctModal.reason,
              createdAt: new Date().toISOString(),
              changes,
            }
            return {
              ...item,
              newElec: Number(correctModal.newElec),
              newWater: Number(correctModal.newWater),
              editReason: correctModal.reason,
              editedAt: new Date().toLocaleString('vi-VN'),
              editActions:
                changes.length > 0 ? [newAction, ...(item.editActions || [])] : item.editActions,
            }
          }
          return item
        }),
      )
      setCorrectModal(prev => ({ ...prev, isOpen: false }))
      showToast(t('landlordRoomDetailToastMeterAdjustSuccess'), 'success')
      return
    }

    try {
      setIsSubmittingCorrection(true)
      const elecItem = rawPeriod.services.find(
        s => s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh',
      )
      const waterItem = rawPeriod.services.find(
        s =>
          s.serviceName.toLowerCase().includes('nước') ||
          s.unit.toLowerCase().includes('m3') ||
          s.unit.toLowerCase().includes('m³'),
      )

      const sharedActionId = crypto.randomUUID()
      const updatePromises = []
      if (elecItem && Number(correctModal.newElec) !== elecItem.newReading) {
        updatePromises.push(
          meterReadingService.updateLandlordMeterReading(activeBuilding.id, elecItem.id, {
            readingValue: Number(correctModal.newElec),
            reason: correctModal.reason,
            actionId: sharedActionId,
          }),
        )
      }
      if (waterItem && Number(correctModal.newWater) !== waterItem.newReading) {
        updatePromises.push(
          meterReadingService.updateLandlordMeterReading(activeBuilding.id, waterItem.id, {
            readingValue: Number(correctModal.newWater),
            reason: correctModal.reason,
            actionId: sharedActionId,
          }),
        )
      }

      if (updatePromises.length > 0) {
        await Promise.all(updatePromises)
      }

      setCorrectModal(prev => ({ ...prev, isOpen: false }))
      showToast(t('landlordRoomDetailToastMeterAdjustSuccess'), 'success')

      // Reload meter history
      const newHistoryRes = await meterReadingService.getLandlordRoomMeterHistory(
        activeBuilding.id,
        resolvedParams.id,
      )
      if (newHistoryRes?.history) {
        setMeterHistoryRaw(newHistoryRes.history)
        const mapped = newHistoryRes.history.map((h, idx) => {
          const elec = h.services.find(
            s => s.serviceName.toLowerCase().includes('điện') || s.unit.toLowerCase() === 'kwh',
          )
          const water = h.services.find(
            s =>
              s.serviceName.toLowerCase().includes('nước') ||
              s.unit.toLowerCase().includes('m3') ||
              s.unit.toLowerCase().includes('m³'),
          )
          return {
            id: h.id || `cycle_${h.period}_${idx}`,
            period: h.period,
            date: h.date,
            oldElec: elec?.oldReading ?? 0,
            newElec: elec?.newReading ?? 0,
            oldWater: water?.oldReading ?? 0,
            newWater: water?.newReading ?? 0,
            isOpen: idx === 0,
            editReason: h.editReason,
            editedAt: h.editedAt,
            editHistory: h.editHistory,
            editActions: h.editActions,
          }
        })
        setMeterHistory(mapped)
      }
    } catch (err: any) {
      console.error('Failed to update meter reading:', err)
      showToast(err.message || t('landlordRoomDetailToastMeterAdjustError'), 'error')
    } finally {
      setIsSubmittingCorrection(false)
    }
  }

  if (!isMounted || isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-16 bg-line rounded-2xl w-full"></div>
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-44 bg-card-hover rounded-2xl"></div>
            <div className="h-64 bg-card-hover rounded-2xl"></div>
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-card-hover rounded-2xl"></div>
            <div className="h-60 bg-card-hover rounded-2xl"></div>
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-line text-muted my-6 shadow-xs">
        <Text as="p" variant="heading" size="lg" weight="bold" color="default" className="mb-2">
          {t('landlordRoomDetailNotFound')}
        </Text>
        <Text variant="subtitle" size="xs" color="subtle" className="mb-4">
          {t('landlordRoomDetailRoomCode')}: {resolvedParams.id}
        </Text>
        <Link
          href="/landlord/rooms"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary  text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors"
        >
          <Text as="span" size="xs" weight="bold" color="white">
            &larr; {t('landlordRoomDetailBack')}
          </Text>
        </Link>
      </div>
    )
  }

  const isOccupied = room.status === 'Đang thuê'
  const isVacant = room.status === 'Trống'
  const isMaintenance = room.status === 'Bảo trì'
  const isReserved = room.status === 'Đặt cọc'

  // Base constants for financial calculations
  const roomRentNum = parseInt((room.price || '3000000').replace(/\D/g, '')) || 3000000
  const fixedServicesTotal = 210000
  const elecService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'))
  const waterService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'))
  const elecUnitPrice = elecService?.unitPrice ?? 3500
  const waterUnitPrice = waterService?.unitPrice ?? 25000

  const computeRecordFinancials = (m: MeterHistoryRecord) => {
    const elecUse = Math.max(0, m.newElec - m.oldElec)
    const elecCost = elecUse * elecUnitPrice
    const waterUse = Math.max(0, m.newWater - m.oldWater)
    const waterCost = waterUse * waterUnitPrice
    const meterTotal = elecCost + waterCost
    const grandInvoiceTotal = roomRentNum + fixedServicesTotal + meterTotal

    return {
      elecUse,
      elecCost,
      waterUse,
      waterCost,
      meterTotal,
      grandInvoiceTotal,
    }
  }

  // Filtered meter records and invoices based on selected Filter Period
  const filteredMeterHistory = meterHistory.filter(
    m => selectedFilterPeriod === 'all' || m.period === selectedFilterPeriod,
  )
  const filteredInvoices = invoicesHistory.filter(
    inv => selectedFilterPeriod === 'all' || inv.period === selectedFilterPeriod,
  )

  const totalInvoicePages = Math.ceil(filteredInvoices.length / ITEMS_PER_PAGE) || 1
  const paginatedInvoices = filteredInvoices.slice(
    (invoicePage - 1) * ITEMS_PER_PAGE,
    invoicePage * ITEMS_PER_PAGE,
  )

  const totalMeterPages = Math.ceil(filteredMeterHistory.length / ITEMS_PER_PAGE) || 1
  const paginatedMeterHistory = filteredMeterHistory.slice(
    (meterPage - 1) * ITEMS_PER_PAGE,
    meterPage * ITEMS_PER_PAGE,
  )

  const unpaidInvoice = invoicesHistory.find(i => i.status === 'Chưa thanh toán')
  const unpaidRecord = unpaidInvoice
    ? meterHistory.find(m => m.period === unpaidInvoice.period)
    : null
  const unpaidFinancials = unpaidRecord ? computeRecordFinancials(unpaidRecord) : null

  const currentContract = dashboardData?.currentContract
  const primaryTenant =
    currentContract?.tenants?.find(t => t.isPrimary) || currentContract?.tenants?.[0]
  const otherTenants = currentContract?.tenants?.filter(t => t.id !== primaryTenant?.id) || []

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        backHref="/landlord/rooms"
        backLabel={t('landlordRoomDetailBack')}
        current={`${t('landlordRoomDetailRoomPrefix')} ${room.roomNumber}`}
      />

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-line shadow-xs">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2.5">
            <Text as="h1" variant="heading" size="2xl" weight="black" color="default" className="tracking-tight sm:text-2xl">
              {t('landlordRoomDetailRoomPrefix')} {room.roomNumber}
            </Text>
            <span
              className={`px-2.5 py-0.5 sm:py-1 rounded-full border shrink-0 ${isOccupied
                ? 'text-primary bg-primary/10 border-primary/30'
                : isMaintenance
                  ? 'text-accent bg-accent/10 border-accent/30'
                  : isReserved
                    ? 'text-deposit bg-purple-500/10 border-purple-500/30'
                    : isVacant
                      ? 'text-info bg-vacant/10 border-vacant/30'
                      : 'text-muted bg-card-hover border-line'
                }`}
            >
              <Text as="span" variant="badge" size="3xs" weight="extrabold" color="inherit" className="tracking-wider flex items-center">
                {getStatusLabel(room.status)}
              </Text>
            </span>
            {dashboardData?.room?.roomType?.name && (
              <Text
                as="span" size="3xs" weight="bold" color="success"
                className='bg-success-soft px-2 py-0.5 rounded-full border border-success-subtle flex items-center'
              >
                {dashboardData.room.roomType.name}
              </Text>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-line">
          {isOccupied && (
            <Button
              size="md"
              variant="primary"
              onClick={() => router.push(`/landlord/rooms/${resolvedParams.id}/meter-reading`)}
              leftIcon={<Gauge />}
              className="flex-1 md:flex-initial"
            >
              {t('landlordRoomDetailBtnLogMeter')}
            </Button>
          )}

          {isOccupied ? (
            <Link
              href={
                currentContract?.id
                  ? `/landlord/contracts/${currentContract.id}`
                  : `/landlord/contracts/HD-01012026-${room.building === 'b2' ? 2 : 1}-${room.roomNumber}`
              }
              className="flex-1 md:flex-initial"
            >
              <Button
                fullWidth
                size="md"
                variant="outline"
                leftIcon={<Eye />}
              >
                {t('landlordRoomDetailBtnViewContract')}
              </Button>
            </Link>
          ) : (
            <Link
              href={`/landlord/contracts/create?roomId=${dashboardData?.room?.id || room?.id || resolvedParams.id}`}
              className="flex-1 md:flex-initial"
            >
              <Button
                fullWidth
                size="md"
                variant="primary"
                leftIcon={<FileSignature />}
              >
                {t('landlordRoomDetailBtnCreateContract')}
              </Button>
            </Link>
          )}

          <Button
            size="md"
            variant="secondary"
            onClick={() => setIsEditModalOpen(true)}
            leftIcon={<Edit />}
            className="flex-1 md:flex-initial"
          >
            {t('landlordRoomDetailBtnEdit')}
          </Button>

          <Button
            size="md"
            variant="danger"
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: t('landlordRoomDetailDeleteTitle'),
                message: t('landlordRoomDetailDeleteConfirm').replace(
                  '{roomNumber}',
                  room.roomNumber,
                ),
                onConfirm: () => {
                  router.push('/landlord/rooms')
                  setConfirmModal(prev => ({ ...prev, isOpen: false }))
                },
              })
            }}
            leftIcon={<Trash2 />}
            className="flex-1 md:flex-initial"
          >
            {t('landlordRoomDetailBtnDelete')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left Main Column */}
        <div className="xl:col-span-2 space-y-6">
          {/* SPOTLIGHT TENANT PROFILE CARD */}
          <div className="bg-card rounded-2xl border border-line shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-3.5 sm:p-5 border-b border-line">
              <Text as="h2" size="xs" weight="black" color="default" className="uppercase tracking-wider flex items-center gap-2 sm:text-sm">
                <User className="w-4 h-4 text-primary" />{' '}
                {t('landlordRoomDetailCurrentTenantTitle')}
              </Text>
              {isOccupied && currentContract && (
                <Link
                  href={`/landlord/contracts/${currentContract.id}`}
                  className="px-3 py-2 text-[11px] font-bold text-primary hover:bg-primary/10 rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <Text as="span" size="xs" weight="bold" color="brand">
                    {t('landlordRoomDetailContractDetailBtn')}
                  </Text>
                </Link>
              )}
            </div>

            <div className="p-3.5 sm:p-5">
              {room.tenant || primaryTenant ? (
                <div className="space-y-3">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3.5 p-3.5 sm:p-4 bg-primary/5 rounded-2xl border border-primary/20">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary  flex items-center justify-center shadow-md shrink-0">
                        <Text as="span" size="base" weight="black" color="white" className="sm:text-lg">
                          {(primaryTenant?.fullName || room.tenant || 'K').charAt(0)}
                        </Text>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <Text as="h3" size="sm" weight="black" color="default" className="sm:text-base">
                            {primaryTenant?.fullName || room.tenant}
                          </Text>
                          {primaryTenant?.hasIdentification && (
                            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-success-soft rounded-full">
                              <ShieldCheck className="w-3 h-3 text-success" />
                              <Text as="span" size="3xs" weight="bold" color="success">
                                {t('landlordRoomDetailHasCccd')}
                              </Text>
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                          <Text as="span" size="xs" weight="bold" color="subtle">
                            {t('landlordRoomDetailPhoneLabel')}{' '}
                            {primaryTenant?.phoneNumber || room.tenantPhone || '0977815704'}
                          </Text>
                          <Text as="span" size="xs" color="subtle" className="hidden sm:inline">
                            •
                          </Text>
                          <Text as="span" size="xs" weight="bold" color="subtle">
                            {t('landlordRoomDetailCccdLabel')}{' '}
                            {primaryTenant?.identityNumber ||
                              room.tenantCccd ||
                              t('landlordRoomDetailNotUpdated')}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                      <a href={`tel:${primaryTenant?.phoneNumber || room.tenantPhone || '0977815704'}`}>
                        <Button
                          size='sm'
                          variant='success'
                          leftIcon={<Phone />}
                        >
                          {t('landlordRoomDetailCallNow')}
                        </Button>
                      </a>
                      <Link
                        href={`/landlord/messages?${new URLSearchParams({
                          ...(primaryTenant?.id ? { userId: primaryTenant.id } : {}),
                          ...((primaryTenant?.fullName || room.tenant) ? { tenant: primaryTenant?.fullName || room.tenant || '' } : {}),
                          ...(room.roomNumber ? { room: room.roomNumber } : {}),
                        }).toString()}`}
                      >
                        <Button
                          size='sm'
                          variant='primary'
                          leftIcon={<MessageSquare />}
                        >
                          {t('landlordRoomDetailMessageBtn')}
                        </Button>
                      </Link>
                      <Link href={`/landlord/customers/${primaryTenant?.id || ''}`}>
                        <Button
                          size='sm'
                          variant='white'
                          leftIcon={<User />}
                        >
                          {t('landlordRoomDetailProfileBtn')}
                        </Button>
                      </Link>
                    </div>
                  </div>

                  {/* Co-occupants list if present */}
                  {otherTenants.length > 0 && (
                    <div className="p-3 bg-surface rounded-xl border border-line text-xs">
                      <Text as="span" size="2xs" weight="bold" color="subtle" className="block mb-1.5">
                        {t('landlordRoomDetailRoommatesCount').replace(
                          '{count}',
                          String(otherTenants.length),
                        )}
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {otherTenants.map(ot => (
                          <Link
                            key={ot.id}
                            href={`/landlord/messages?${new URLSearchParams({
                              ...(ot.id ? { userId: ot.id } : {}),
                              ...(ot.fullName ? { tenant: ot.fullName } : {}),
                              ...(room.roomNumber ? { room: room.roomNumber } : {}),
                            }).toString()}`}
                            className="px-2.5 py-1 bg-card hover:bg-card-hover border border-line rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer group"
                            title={t('landlordRoomDetailMessageBtn')}
                          >
                            <Users className="w-3 h-3 text-muted group-hover:text-primary transition-colors" />
                            <Text as="span" size="2xs" weight="bold" color="default">
                              {ot.fullName}
                            </Text>
                            <Text as="span" size="2xs" weight="normal" color="subtle">
                              ({ot.phoneNumber})
                            </Text>
                            <MessageSquare className="w-3 h-3 text-muted group-hover:text-primary transition-colors ml-0.5" />
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center bg-surface rounded-2xl border border-dashed border-line space-y-2">
                  <Text size="xs" weight="bold" color="subtle">
                    {t('landlordRoomDetailVacantDesc')}
                  </Text>
                  <Button
                    size="sm"
                    variant="primary"
                    leftIcon={<Plus />}
                    onClick={() =>
                      router.push(
                        `/landlord/contracts/create?roomId=${dashboardData?.room.id || room?.id || resolvedParams.id}`,
                      )
                    }
                  >
                    {t('landlordRoomDetailCreateContractNew')}
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* GLOBAL FILTER BAR FOR MONTH/YEAR */}
          <div className="bg-card p-3.5 sm:p-4 rounded-2xl border border-line shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" />
              <Text as="span" size="xs" weight="black" color="default">
                {t('landlordRoomDetailFilterPeriodLabel')}
              </Text>
            </div>
            <div className="w-full sm:w-64">
              <SelectInput
                value={selectedFilterPeriod}
                onChange={e => setSelectedFilterPeriod(e.target.value)}
                options={[
                  { value: 'all', label: t('landlordRoomDetailFilterAllMonths') },
                  {
                    value: 'Tháng 09/2026',
                    label: t('landlordRoomDetailFilterCurrentMonth').replace('{month}', '09/2026'),
                  },
                  {
                    value: 'Tháng 08/2026',
                    label: t('landlordRoomDetailFilterMonth').replace('{month}', '08/2026'),
                  },
                  {
                    value: 'Tháng 07/2026',
                    label: t('landlordRoomDetailFilterMonth').replace('{month}', '07/2026'),
                  },
                ]}
              />
            </div>
          </div>

          {/* SECTION 1: HÓA ĐƠN & CÔNG NỢ */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-line pb-3">
              <Text as="h2" size="xs" weight="black" color="default" className="uppercase tracking-wider flex items-center gap-2 sm:text-sm">
                <Receipt className="w-4 h-4 text-primary" />{' '}
                {t('landlordRoomDetailInvoicesTitle')}
              </Text>
              {unpaidInvoice && unpaidFinancials && (
                <span className="self-start sm:self-auto px-2.5 py-1 bg-danger-soft border border-danger-subtle rounded-full animate-pulse">
                  <Text as="span" variant="badge" size="3xs" weight="black" color="danger">
                    {t('landlordRoomDetailUnpaidInvoicesBadge')
                      .replace('{count}', '1')
                      .replace(
                        '{amount}',
                        unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN'),
                      )}
                  </Text>
                </span>
              )}
            </div>

            <div className="space-y-3">
              {invoicesHistory.length === 0 ? (
                <div className="p-8 text-center bg-surface border border-line rounded-2xl space-y-2">
                  <Receipt className="w-8 h-8 text-zinc-300 mx-auto" />
                  <Text size="xs" weight="bold" color="secondary">
                    {t('landlordRoomDetailNoInvoicesTitle')}
                  </Text>
                  <Text size="2xs" color="subtle">
                    {t('landlordRoomDetailNoInvoicesDesc')}
                  </Text>
                </div>
              ) : filteredInvoices.length === 0 ? (
                <div className="p-6 text-center bg-surface rounded-xl">
                  <Text size="xs" weight="bold" color="subtle">
                    {t('landlordRoomDetailNoInvoicesInFilter')}
                  </Text>
                </div>
              ) : (
                paginatedInvoices.map(inv => {
                  const rec = meterHistory.find(m => m.period === inv.period) || {
                    period: inv.period,
                    date: '',
                    oldElec: 0,
                    newElec: 0,
                    oldWater: 0,
                    newWater: 0,
                  }
                  const fin = computeRecordFinancials(rec)
                  const isUnpaid = inv.status === 'Chưa thanh toán'

                  return (
                    <div
                      key={inv.id}
                      className={`p-3.5 sm:p-4 rounded-2xl border transition-all space-y-3 ${isUnpaid
                        ? 'bg-danger/5 border-danger/30'
                        : 'bg-surface border-line'
                        }`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <div className='flex items-center justify-center gap-2'>
                              <Text as="span" weight="bold" color={isUnpaid ? 'danger' : 'subtle'}>
                                {inv.period}
                              </Text>
                              <Text as="span" variant="badge" size="3xs" weight="black" color={isUnpaid ? 'danger' : 'success'}
                                className={`px-2 py-0.5 rounded-full ${isUnpaid ? 'bg-danger-soft' : 'bg-success-soft'}`}>
                                {isUnpaid
                                  ? t('landlordRoomDetailInvoiceStatusUnpaid')
                                  : t('landlordRoomDetailInvoiceStatusPaid')}
                              </Text>
                            </div>
                          </div>
                          <Text size="3xs" weight="semibold" color="subtle" className="mt-0.5">
                            {t('landlordRoomDetailInvoiceDeadline')}{' '}
                            <Text as="strong" size="3xs" weight="bold" color={isUnpaid ? 'danger' : 'secondary'}>
                              {inv.deadline}
                            </Text>
                          </Text>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-line">
                          <Text
                            as="span"
                            size="base"
                            weight="black"
                            color={isUnpaid ? 'danger' : 'brand'}
                            className="whitespace-nowrap sm:text-lg"
                          >
                            {fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫
                          </Text>
                          {isUnpaid ?? (
                            <span className="bg-line/60 px-2 py-0.5 rounded-md whitespace-nowrap">
                              <Text as="span" variant="badge" size="3xs" weight="extrabold" color="secondary">
                                {inv.method}
                              </Text>
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="p-3 bg-card rounded-xl border border-line text-xs space-y-1.5">
                        <div className="flex justify-between border-b border-line pb-1">
                          <Text as="span" size="2xs" weight="extrabold" color="secondary">
                            {t('landlordRoomDetailInvoiceDetailsTitle')}
                          </Text>
                          <Text as="span" size="xs" weight="black" color="brand" className="whitespace-nowrap">
                            {fin.grandInvoiceTotal.toLocaleString('vi-VN')} ₫
                          </Text>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                          <div className="p-1.5 bg-surface rounded-lg">
                            <Text as="span" size="3xs" color="subtle" className="block">
                              {t('landlordRoomDetailInvoiceRoomPrice')}
                            </Text>
                            <Text as="strong" size="2xs" weight="bold" color="default" className="whitespace-nowrap">
                              {roomRentNum.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                          <div className="p-1.5 bg-surface rounded-lg">
                            <Text as="span" size="3xs" color="subtle" className="block">
                              {t('landlordRoomDetailInvoiceFixedServices')}
                            </Text>
                            <Text as="strong" size="2xs" weight="bold" color="default" className="whitespace-nowrap">
                              {fixedServicesTotal.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                          <div className="p-1.5 bg-warning-soft rounded-lg">
                            <Text as="span" size="3xs" color="warning" className="block">
                              {t('landlordRoomDetailInvoiceElecUsage').replace(
                                '{usage}',
                                String(fin.elecUse),
                              )}
                            </Text>
                            <Text as="strong" size="2xs" weight="bold" color="warning" className="whitespace-nowrap">
                              {fin.elecCost.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                          <div className="p-1.5 bg-info-soft rounded-lg">
                            <Text as="span" size="3xs" className="block text-info">
                              {t('landlordRoomDetailInvoiceWaterUsage').replace(
                                '{usage}',
                                String(fin.waterUse),
                              )}
                            </Text>
                            <Text as="strong" size="2xs" weight="bold" className="text-info whitespace-nowrap">
                              {fin.waterCost.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                        </div>

                        {inv.editReason && (
                          <div className="mt-2 p-2 bg-warning-soft border border-warning-subtle rounded-lg flex items-start gap-1.5">
                            <AlertCircle className="w-3.5 h-3.5 text-warning shrink-0 mt-0.5" />
                            <div>
                              <Text as="span" size="3xs" weight="bold" color="warning">
                                {t('landlordRoomDetailInvoiceEditedNotice').replace(
                                  '{editedAt}',
                                  inv.editedAt || '',
                                )}
                              </Text>
                              <Text as="span" size="3xs" weight="extrabold" color="warning" italic className="block">
                                "{inv.editReason}"
                              </Text>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })
              )}

              {/* Pagination Controls for Invoices */}
              {totalInvoicePages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-line">
                  <Text as="span" size="2xs" weight="bold" color="subtle">
                    {t('landlordRoomDetailShowingItems')
                      .replace('{start}', String((invoicePage - 1) * ITEMS_PER_PAGE + 1))
                      .replace(
                        '{end}',
                        String(Math.min(invoicePage * ITEMS_PER_PAGE, filteredInvoices.length)),
                      )
                      .replace('{total}', String(filteredInvoices.length))}
                  </Text>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={invoicePage === 1}
                      onClick={() => setInvoicePage(p => Math.max(1, p - 1))}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordRoomDetailPaginationPrev')}
                      </Text>
                    </Button>
                    {Array.from({ length: totalInvoicePages }).map((_, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={invoicePage === idx + 1 ? 'primary' : 'secondary'}
                        onClick={() => setInvoicePage(idx + 1)}
                      >
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {idx + 1}
                        </Text>
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={invoicePage === totalInvoicePages}
                      onClick={() => setInvoicePage(p => Math.min(totalInvoicePages, p + 1))}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordRoomDetailPaginationNext')}
                      </Text>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* SECTION: LỊCH SỬ THUÊ PHÒNG (RENTAL HISTORY) */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <Text as="h2" weight="black" color="default" className="text-xs sm:text-sm uppercase tracking-wider flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />{' '}
                {t('landlordRoomDetailRentalHistoryTitle').replace(
                  '{count}',
                  String(dashboardData?.rentalHistory?.length || (room?.tenant ? 1 : 0)),
                )}
              </Text>
              <Text as="span" size="2xs" weight="bold" color="secondary">
                {t('landlordRoomDetailRentalHistorySubtitle')}
              </Text>
            </div>

            <div className="space-y-3">
              {dashboardData && dashboardData.rentalHistory.length > 0 ? (
                dashboardData.rentalHistory.map(hist => {
                  const isActive = hist.status === 'active'
                  return (
                    <div
                      key={hist.id}
                      className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isActive
                        ? 'bg-primary/5 border-primary/30'
                        : 'bg-surface border-line'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isActive ? 'bg-primary' : 'bg-line'
                            }`}
                        >
                          <Text as="span" size="xs" weight="black" className={isActive ? '' : 'text-foreground/90'}>
                            {hist.primaryTenantName.charAt(0)}
                          </Text>
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Text as="span" size="xs" weight="black" color="default">
                              {hist.primaryTenantName}
                            </Text>
                            <span
                              className={`px-2 py-0.5 rounded-full ${isActive
                                ? 'bg-success-soft'
                                : 'bg-line'
                                }`}
                            >
                              <Text as="span" size="2xs" weight="black" color={isActive ? 'success' : 'secondary'}>
                                {isActive
                                  ? t('landlordRoomDetailContractActive')
                                  : t('landlordRoomDetailContractEnded')}
                              </Text>
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Text as="span" size="xs" weight="medium" color="secondary">
                              {new Date(hist.startDate).toLocaleDateString('vi-VN')} -{' '}
                              {new Date(hist.endDate).toLocaleDateString('vi-VN')}
                            </Text>
                            {hist.primaryTenantPhone && (
                              <Text as="span" size="xs" weight="medium" color="secondary">
                                • {hist.primaryTenantPhone}
                              </Text>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
                        <Text as="span" size="xs" weight="black" color="brand">
                          {parseInt(hist.rentPrice).toLocaleString('vi-VN')}{' '}
                          {t('landlordRoomDetailRentPerMonth')}
                        </Text>
                        <Link href={`/landlord/contracts/${hist.id}`}>
                          <Button size='sm' variant='white'>
                            {t('landlordRoomDetailViewContractShort')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="p-4 text-center bg-surface rounded-xl">
                  <Text size="xs" weight="bold" color="subtle">
                    {t('landlordRoomDetailNoRentalHistory')}
                  </Text>
                </div>
              )}
            </div>
          </div>

          {/* SECTION 2: LỊCH SỬ CHỐT ĐIỆN NƯỚC */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-3.5 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-line pb-3">
              <Text as="h2" weight="black" color="default" className="text-xs sm:text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />{' '}
                {t('landlordRoomDetailMeterHistoryTitle')}
              </Text>

              <Button
                size="sm"
                variant="primary"
                leftIcon={<Gauge />}
                onClick={() => router.push(`/landlord/rooms/${resolvedParams.id}/meter-reading`)}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordRoomDetailMeterLogBtn')}
                </Text>
              </Button>
            </div>

            <div className="space-y-3">
              {meterHistory.length === 0 ? (
                <div className="p-8 text-center bg-surface border border-line rounded-2xl space-y-2">
                  <div className="w-10 h-10 rounded-full bg-line/70 text-muted flex items-center justify-center mx-auto">
                    <Gauge className="w-5 h-5" />
                  </div>
                  <Text weight="bold" size="sm" color="default">
                    {t('landlordRoomDetailNoMeterDataTitle')}
                  </Text>
                  <Text size="xs" color="subtle" weight="medium" className="max-w-sm mx-auto">
                    {t('landlordRoomDetailNoMeterDataDesc')}
                  </Text>
                </div>
              ) : filteredMeterHistory.length === 0 ? (
                <div className="p-6 text-center bg-surface rounded-xl">
                  <Text size="xs" color="subtle" weight="bold">
                    {t('landlordRoomDetailNoMeterDataInFilter')}
                  </Text>
                </div>
              ) : (
                paginatedMeterHistory.map((item, itemIdx) => {
                  const fin = computeRecordFinancials(item)
                  const matchingInvoice = invoicesHistory.find(inv => inv.period === item.period)
                  const isPaid = matchingInvoice?.status === 'Đã thu'

                  return (
                    <details
                      key={item.id || `${item.period}-${itemIdx}`}
                      className="group border border-line rounded-xl overflow-hidden shadow-2xs"
                      open={item.isOpen}
                    >
                      <summary className="flex flex-wrap sm:flex-nowrap justify-between items-center p-3 sm:p-3.5 bg-surface/80 hover:bg-card-hover cursor-pointer select-none outline-none transition-colors gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Text as="span" size="xs" weight="black" color="brand" className="uppercase tracking-wider">
                            {t('landlordRoomDetailReadingPeriod').replace('{period}', item.period)}
                          </Text>
                          <Text as="span" size="2xs" weight="bold" color="subtle">({item.date})</Text>
                          {item.editReason && (
                            <span className="px-2 py-0.5 bg-warning-soft rounded-full">
                              <Text as="span" size="2xs" weight="black" color="warning">
                                {t('landlordRoomDetailEditedBadge')}
                              </Text>
                            </span>
                          )}
                          {isPaid && (
                            <span className="px-2 py-0.5 bg-success-soft rounded-full">
                              <Text as="span" size="2xs" weight="black" color="success">
                                {t('landlordRoomDetailPaidBadge')}
                              </Text>
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3">
                          {isPaid ? (
                            <span
                              className="px-2.5 py-1 bg-card-hover border border-line rounded-lg flex items-center gap-1 cursor-not-allowed select-none"
                              title={t('landlordRoomDetailLockedTooltip')}
                            >
                              <Text as="span" size="2xs" weight="bold" color="secondary">
                                {t('landlordRoomDetailLockedBadge')}
                              </Text>
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={e => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleOpenCorrectionModal(item)
                              }}
                              leftIcon={<Edit />}
                            >
                              {t('landlordRoomDetailEditMeterBtn')}
                            </Button>
                          )}
                          <Text as="span" size="xs" weight="black" color="default">
                            {t('landlordRoomDetailTotalAmount')}{' '}
                            {fin.meterTotal.toLocaleString('vi-VN')} ₫
                          </Text>
                          <ChevronDown className="w-4 h-4 text-muted group-open:rotate-180 transition-transform" />
                        </div>
                      </summary>

                      <div className="p-3 sm:p-4 bg-card border-t border-line space-y-2.5">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-amber-500/5 border border-amber-500/20 rounded-xl">
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <Text as="div" weight="black" size="xs" color="default" className="flex items-center gap-1">
                              {t('landlordRoomDetailElecHeader').replace(
                                '{unitPrice}',
                                elecUnitPrice.toLocaleString('vi-VN'),
                              )}
                            </Text>
                            <Text as="span" size="xs" weight="black" color="default" className="sm:hidden">
                              {fin.elecCost.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                            <Text as="span" size="2xs" color="secondary" weight="medium">
                              {t('landlordRoomDetailElecStats')
                                .replace('{index}', String(item.newElec))
                                .replace('{usage}', String(fin.elecUse))}
                            </Text>
                            <Text as="span" size="xs" weight="black" color="brand" className="hidden sm:inline">
                              {fin.elecCost.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                        </div>

                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2.5 bg-vacant/5 border border-vacant/20 rounded-xl">
                          <div className="flex items-center justify-between sm:justify-start gap-2">
                            <Text as="div" weight="black" size="xs" color="default" className="flex items-center gap-1">
                              {t('landlordRoomDetailWaterHeader').replace(
                                '{unitPrice}',
                                waterUnitPrice.toLocaleString('vi-VN'),
                              )}
                            </Text>
                            <Text as="span" size="xs" weight="black" color="default" className="sm:hidden">
                              {fin.waterCost.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                            <Text as="span" size="2xs" color="secondary" weight="medium">
                              {t('landlordRoomDetailWaterStats')
                                .replace('{index}', String(item.newWater))
                                .replace('{usage}', String(fin.waterUse))}
                            </Text>
                            <Text as="span" size="xs" weight="black" color="brand" className="hidden sm:inline">
                              {fin.waterCost.toLocaleString('vi-VN')} ₫
                            </Text>
                          </div>
                        </div>

                        {item.editActions && item.editActions.length > 0 ? (
                          <div className="p-2.5 bg-warning-soft border border-warning-subtle rounded-xl text-xs space-y-2">
                            <Text as="div" weight="bold" color="warning" size="xs" className="flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-warning" />{' '}
                              {t('landlordRoomDetailEditHistoryTitle').replace(
                                '{count}',
                                String(item.editActions.length),
                              )}
                            </Text>
                            <div className="space-y-1.5">
                              {item.editActions.map((act, actIdx) => (
                                <div
                                  key={act.id || actIdx}
                                  className="p-2 bg-card/90 border border-warning-subtle rounded-lg text-[11px] text-warning space-y-1 shadow-2xs"
                                >
                                  <div className="flex flex-wrap items-center justify-between gap-1 border-b border-warning-subtle pb-1">
                                    <Text as="span" size="2xs" weight="bold" color="warning">
                                      {t('landlordRoomDetailEditHistoryTimes').replace(
                                        '{times}',
                                        String(item.editActions!.length - actIdx),
                                      )}
                                    </Text>
                                    <Text as="span" size="2xs" color="secondary">
                                      {new Date(act.createdAt).toLocaleString('vi-VN')}
                                    </Text>
                                  </div>
                                  <div className="space-y-0.5">
                                    {act.changes.map((ch, chIdx) => (
                                      <Text key={chIdx} size="xs" color="default">
                                        <strong>{ch.serviceName}</strong>:{' '}
                                        {ch.oldValue !== null
                                          ? ch.oldValue
                                          : t('landlordRoomDetailNotAvailable')}{' '}
                                        ➔ <strong className="text-foreground">{ch.newValue}</strong>{' '}
                                        {ch.unit || ''}
                                      </Text>
                                    ))}
                                  </div>
                                  {act.reason && (
                                    <Text size="2xs" color="secondary" className="italic pt-0.5">
                                      {t('landlordRoomDetailEditReasonLabel')} &ldquo;{act.reason}&rdquo;
                                    </Text>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : item.editHistory && item.editHistory.length > 0 ? (
                          <div className="p-2.5 bg-warning-soft border border-warning-subtle rounded-xl text-xs space-y-1.5">
                            <Text as="div" weight="bold" color="warning" size="xs" className="flex items-center gap-1.5">
                              <History className="w-3.5 h-3.5 text-warning" />{' '}
                              {t('landlordRoomDetailEditHistorySingle')}
                            </Text>
                            <div className="space-y-1">
                              {item.editHistory.map((eh, ehIdx) => (
                                <div
                                  key={eh.id || ehIdx}
                                  className="border-b border-warning-subtle last:border-0 pb-1 last:pb-0 flex flex-wrap justify-between gap-1"
                                >
                                  <Text as="span" size="xs" color="default">
                                    <strong>{eh.serviceName}</strong>:{' '}
                                    {eh.oldValue !== null
                                      ? eh.oldValue
                                      : t('landlordRoomDetailNotAvailable')}{' '}
                                    ➔ <strong className="text-foreground">{eh.newValue}</strong>
                                    {eh.reason && (
                                      <Text as="span" size="xs" color="secondary" className="italic">
                                        {' '}
                                        &mdash; "{eh.reason}"
                                      </Text>
                                    )}
                                  </Text>
                                  <Text as="span" size="2xs" color="secondary">
                                    {new Date(eh.createdAt).toLocaleString('vi-VN')}
                                  </Text>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : item.editReason ? (
                          <div className="p-2.5 bg-warning-soft border border-warning-subtle rounded-xl text-xs space-y-0.5">
                            <Text as="div" weight="bold" color="warning" size="xs">
                              {t('landlordRoomDetailEditLogTitle').replace(
                                '{editedAt}',
                                item.editedAt || '',
                              )}
                            </Text>
                            <Text size="xs" color="warning" weight="bold" className="italic">
                              "{item.editReason}"
                            </Text>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  )
                })
              )}

              {/* Pagination Controls for Meter History */}
              {totalMeterPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 pt-3 border-t border-line">
                  <Text as="span" size="xs" weight="bold" color="secondary">
                    {t('landlordRoomDetailShowingMeters')
                      .replace('{start}', String((meterPage - 1) * ITEMS_PER_PAGE + 1))
                      .replace(
                        '{end}',
                        String(Math.min(meterPage * ITEMS_PER_PAGE, filteredMeterHistory.length)),
                      )
                      .replace('{total}', String(filteredMeterHistory.length))}
                  </Text>
                  <div className="flex items-center gap-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={meterPage === 1}
                      onClick={() => setMeterPage(p => Math.max(1, p - 1))}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordRoomDetailPaginationPrev')}
                      </Text>
                    </Button>
                    {Array.from({ length: totalMeterPages }).map((_, idx) => (
                      <Button
                        key={idx}
                        size="sm"
                        variant={meterPage === idx + 1 ? 'primary' : 'secondary'}
                        onClick={() => setMeterPage(idx + 1)}
                      >
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {idx + 1}
                        </Text>
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={meterPage === totalMeterPages}
                      onClick={() => setMeterPage(p => Math.min(totalMeterPages, p + 1))}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordRoomDetailPaginationNext')}
                      </Text>
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BẢO TRÌ & TIỀN ĐẶT CỌC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 1. Quản Lý Bảo Trì */}
            <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-center border-b border-line pb-3">
                  <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-accent" />{' '}
                    {t('landlordRoomDetailMaintenanceTitle').replace(
                      '{count}',
                      String(maintenanceHistory.length),
                    )}
                  </Text>
                  <Button
                    size="sm"
                    variant="accent"
                    onClick={() => setIsIncidentModalOpen(true)}
                  >
                    <Text as="span" size="xs" weight="bold" color="inherit">
                      {t('landlordRoomDetailReportIncidentBtn')}
                    </Text>
                  </Button>
                </div>

                <div className="space-y-3 min-h-[195px] pt-1">
                  {maintenanceHistory.length === 0 ? (
                    <div className="p-4 text-center bg-surface rounded-xl">
                      <Text size="xs" color="subtle" weight="bold">
                        {t('landlordRoomDetailNoMaintenance')}
                      </Text>
                    </div>
                  ) : (
                    maintenanceHistory
                      .slice((maintPage - 1) * MAINT_PER_PAGE, maintPage * MAINT_PER_PAGE)
                      .map(item => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-xl border min-h-[86px] flex flex-col justify-between ${item.status === 'Đang xử lý'
                            ? 'bg-amber-500/5 border-amber-500/20'
                            : 'bg-surface border-line'
                            }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <Text as="span" size="xs" weight="black" color="default" className="line-clamp-1">
                              {item.title}
                            </Text>
                            <span
                              className={`px-2 py-0.5 rounded-full shrink-0 ${item.status === 'Đang xử lý'
                                ? 'bg-warning-soft'
                                : 'bg-success-soft'
                                }`}
                            >
                              <Text as="span" size="2xs" weight="black" color={item.status === 'Đang xử lý' ? 'warning' : 'success'}>
                                {item.status === 'Đang xử lý'
                                  ? t('landlordRoomDetailMaintenanceProcessing')
                                  : t('landlordRoomDetailMaintenanceDone')}
                              </Text>
                            </span>
                          </div>

                          {item.description ? (
                            <Text size="xs" color="secondary" weight="medium" className="leading-tight line-clamp-1 my-1">
                              {item.description}
                            </Text>
                          ) : (
                            <div className="my-1"></div>
                          )}

                          <div className="flex items-center justify-between pt-0.5 border-t border-line">
                            <Text as="span" size="2xs" color="secondary" weight="bold">
                              {item.completedDate
                                ? t('landlordRoomDetailMaintenanceCompletedDate').replace(
                                  '{date}',
                                  item.completedDate,
                                )
                                : t('landlordRoomDetailMaintenanceReportDate').replace(
                                  '{date}',
                                  item.reportDate,
                                )}
                            </Text>
                            <Text
                              as="span"
                              size="2xs"
                              weight={item.priority === 'Mức độ cao' ? 'black' : 'bold'}
                              color={item.priority === 'Mức độ cao' ? 'danger' : 'secondary'}
                            >
                              {priorityLabels[item.priority] || item.priority}
                            </Text>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </div>

              {/* Maintenance Pagination */}
              {Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE) > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-line text-xs mt-auto">
                  <Text as="span" size="2xs" color="subtle" weight="bold">
                    Trang {maintPage} / {Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE)}
                  </Text>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setMaintPage(prev => Math.max(1, prev - 1))}
                      disabled={maintPage === 1}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordRoomDetailPaginationPrev')}
                      </Text>
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        setMaintPage(prev =>
                          Math.min(Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE), prev + 1),
                        )
                      }
                      disabled={maintPage === Math.ceil(maintenanceHistory.length / MAINT_PER_PAGE)}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordRoomDetailPaginationNext')}
                      </Text>
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* 2. Quản Lý Tiền Đặt Cọc */}
            <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4 flex flex-col justify-between">
              <div>
                <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-deposit" />{' '}
                  {t('landlordRoomDetailDepositTitle')}
                </Text>

                <div className="mt-3 p-4 bg-gradient-to-br from-purple-500/10 via-purple-500/5 to-indigo-500/10 rounded-2xl border border-deposit-subtle space-y-3">
                  <div className="flex items-center justify-between">
                    <Text as="span" size="2xs" weight="black" className="text-deposit uppercase tracking-wider">
                      {t('landlordRoomDetailDepositSafeBadge')}
                    </Text>
                    <Text as="span" size="2xs" weight="black" color="success"
                      className="px-2 py-0.5 bg-success-soft rounded-full border border-success-subtle"
                    >
                      {currentContract?.deposit?.status === 'active'
                        ? t('landlordRoomDetailDepositLocked')
                        : t('landlordRoomDetailDepositLabel')}
                    </Text>
                  </div>

                  <div className="flex items-baseline justify-between">
                    <div className="text-2xl font-black text-deposit tracking-tight">
                      <Text as="span" weight="black" className="text-2xl text-deposit">
                        {currentContract?.deposit?.amount
                          ? parseInt(currentContract.deposit.amount).toLocaleString('vi-VN')
                          : '3.000.000'}{' '}
                      </Text>
                      <Text as="span" size="xs" color="inherit">₫</Text>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 border-t border-deposit-subtle pt-2.5">
                    <div className="space-y-0.5">
                      <Text as="span" size="2xs" color="subtle" weight="medium" className="block">
                        {t('landlordRoomDetailContractStartDate')}
                      </Text>
                      <Text as="span" size="2xs" weight="black" color="default">
                        {currentContract?.startDate
                          ? new Date(currentContract.startDate).toLocaleDateString('vi-VN')
                          : '01/01/2026'}
                      </Text>
                    </div>
                    <div className="space-y-0.5 text-right">
                      <Text as="span" size="2xs" color="subtle" weight="medium" className="block">
                        {t('landlordRoomDetailContractDuration')}
                      </Text>
                      <Text as="span" size="2xs" weight="black" color="default">
                        {currentContract?.endDate
                          ? new Date(currentContract.endDate).toLocaleDateString('vi-VN')
                          : '01/01/2027'}
                      </Text>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <Button fullWidth
                  size="sm"
                  variant="primary"
                  onClick={() => showToast(t('landlordRoomDetailRefundToast'), 'success')}
                  leftIcon={<Wallet className='w-5 h-5' />}
                  className="from-deposit to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                >
                  {t('landlordRoomDetailRefundDepositBtn')}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          {/* COMPACT SIDEBAR 4 ROOM METRIC CARDS */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-4 space-y-3">
            <Text as="h2" weight="black" color="default" className="flex items-center gap-2 text-xs uppercase tracking-wider border-b border-line pb-2">
              <Home className="w-4 h-4 text-primary" />{' '}
              <Text as="span" color="inherit">
                {t('landlordRoomDetailSpecsTitle').replace('{roomNumber}', room.roomNumber)}
              </Text>
            </Text>
            <div className="grid grid-cols-2 gap-2.5">
              <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
                <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
                  {t('landlordRoomDetailRentLabel')}
                </Text>
                <Text size="sm" weight="black" color="brand">
                  {room.price || '3.000.000 ₫'}
                </Text>
                <Text as="span" size="2xs" color="secondary">
                  {currentContract
                    ? t('landlordRoomDetailMonthlyDueDay').replace(
                      '{day}',
                      String(currentContract.monthlyPaymentDate),
                    )
                    : t('landlordRoomDetailStartOfMonth')}
                </Text>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
                <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
                  {t('landlordRoomDetailDepositSpecLabel')}
                </Text>
                <Text size="sm" weight="black" className="text-deposit">
                  {currentContract?.deposit?.amount
                    ? `${parseInt(currentContract.deposit.amount).toLocaleString('vi-VN')} ₫`
                    : '3.000.000 ₫'}
                </Text>
                <Text as="span" size="2xs" weight="bold" color="success">
                  {t('landlordRoomDetailLockDepositText')}
                </Text>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
                <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
                  {t('landlordRoomDetailDebtLabel')}
                </Text>
                <Text size="sm" weight="black" color="danger">
                  {unpaidFinancials
                    ? `${unpaidFinancials.grandInvoiceTotal.toLocaleString('vi-VN')} ₫`
                    : '0 ₫'}
                </Text>
                <Text as="span" size="2xs" weight="bold" color="danger">
                  {t('landlordRoomDetailDebtOutstanding')}
                </Text>
              </div>

              <div className="p-2.5 bg-surface rounded-xl border border-line space-y-0.5">
                <Text as="span" size="2xs" weight="black" color="subtle" className="uppercase block">
                  {t('landlordRoomDetailAreaLabel')}
                </Text>
                <Text size="xs" weight="black" color="default">
                  {room.area || '25'} m² • T{room.floor}
                </Text>
                <Text as="span" size="2xs" color="secondary">
                  {dashboardData?.room.maxOccupants
                    ? t('landlordRoomDetailMaxOccupantsText').replace(
                      '{count}',
                      String(dashboardData.room.maxOccupants),
                    )
                    : t('landlordRoomDetailBalconyText')}
                </Text>
              </div>
            </div>
          </div>

          {/* Giá dịch vụ định kỳ với Badge màu sắc */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4">
            <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2 border-b border-line pb-3">
              <Banknote className="w-4 h-4 text-primary" /> {t('landlordRoomDetailServicesTitle')}
            </Text>
            <div className="space-y-2.5">
              {(editServices && editServices.length > 0 ? editServices : defaultRoomServices).map(
                service => (
                  <div
                    key={service.id}
                    className="flex justify-between items-center p-2.5 bg-surface rounded-xl border border-line"
                  >
                    <div className="flex items-center gap-2">
                      <Text as="span" size="xs" weight="black" color="default">{service.name}</Text>
                      {service.isCustom && (
                        <span className="bg-warning-soft border border-warning-subtle px-1.5 py-0.5 rounded-md">
                          <Text as="span" size="2xs" weight="bold" color="warning">
                            {t('landlordRoomDetailCustomServiceBadge')}
                          </Text>
                        </span>
                      )}
                    </div>
                    <Text as="span" size="xs" weight="black" color="brand">
                      {service.customPrice} {service.unit}
                    </Text>
                  </div>
                ),
              )}
            </div>
          </div>

          {/* Tiện nghi phòng */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4">
            {(() => {
              const amenitiesList = room.amenities || [
                'WiFi',
                'Điều hòa',
                'Nóng lạnh',
                'Tủ quần áo',
                'Giường',
                'Kệ bếp',
                'Ban công',
                'WC riêng',
              ]
              return (
                <>
                  <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2 border-b border-line pb-3">
                    <HouseWifi className="w-4 h-4 text-primary" />{' '}
                    {t('landlordRoomDetailAmenitiesTitle').replace(
                      '{count}',
                      String(amenitiesList.length),
                    )}
                  </Text>

                  <div className="flex flex-wrap gap-2">
                    {amenitiesList.map((item: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 bg-card-hover border border-line rounded-xl shadow-2xs"
                      >
                        <Text as="span" size="xs" weight="bold" color="default" className="flex items-center gap-1">
                          {getAmenityLabel(item, t)}
                        </Text>
                      </span>
                    ))}
                  </div>
                </>
              )
            })()}
          </div>

          {/* Quản lý trạng thái phòng */}
          <div className="bg-card rounded-2xl border border-line shadow-xs p-5 space-y-4">
            <Text as="h2" weight="black" color="default" size="sm" className="flex items-center gap-2 border-b border-line pb-3">
              <Building2 className="w-4 h-4 text-primary" />{' '}
              {t('landlordRoomDetailRoomStatusTitle')}
            </Text>

            <div className="space-y-2">
              <Text as="label" size="xs" weight="bold" color="secondary" className="uppercase tracking-wider block">
                {t('landlordRoomDetailQuickSwitchStatus')}
              </Text>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  variant={isVacant ? 'primary' : 'secondary'}
                  className={isVacant ? 'bg-vacant hover:bg-vacant-hover' : ''}
                  onClick={() => handleUpdateStatus('Trống')}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('landlordRoomDetailStatusBtnAvailable')}
                  </Text>
                </Button>

                <Button
                  size="sm"
                  variant={isOccupied ? 'primary' : 'secondary'}
                  className={isOccupied ? 'bg-primary hover:bg-primary-hover ' : ''}
                  onClick={() => handleUpdateStatus('Đang thuê')}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('landlordRoomDetailStatusBtnOccupied')}
                  </Text>
                </Button>

                <Button
                  size="sm"
                  variant={isMaintenance ? 'primary' : 'secondary'}
                  className={isMaintenance ? 'bg-accent hover:bg-accent-hover ' : ''}
                  onClick={() => handleUpdateStatus('Bảo trì')}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('landlordRoomDetailStatusBtnMaintenance')}
                  </Text>
                </Button>

                <Button
                  size="sm"
                  variant={isReserved ? 'primary' : 'secondary'}
                  className={isReserved ? 'bg-deposit hover:bg-deposit-hover ' : ''}
                  onClick={() => handleUpdateStatus('Đặt cọc')}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('landlordRoomDetailStatusBtnDeposited')}
                  </Text>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA SỐ ĐIỆN NƯỚC (CÓ YÊU CẦU NHẬP LÝ DO BẮT BUỘC) */}
      <Modal
        isOpen={correctModal.isOpen}
        onClose={handleCloseCorrectionModal}
        size="lg"
      >
        <Modal.Header
          title={t('landlordRoomDetailModalCorrectTitle').replace(
            '{period}',
            correctModal.period,
          )}
          description={t('landlordRoomDetailModalCorrectDesc')}
          icon={
            <div className="p-2 bg-amber-500/10 text-warning rounded-xl">
              <Edit className="w-5 h-5" />
            </div>
          }
          className="bg-warning-soft"
        />

        <Modal.Body className="space-y-4">
          {correctModal.error && (
            <Form.Alert variant="error" message={correctModal.error} />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-amber-500/5 rounded-xl border border-amber-500/20">
              <NumberInput
                label={t('landlordRoomDetailNewElecLabel')}
                helperText={t('landlordRoomDetailOldIndexLabel').replace(
                  '{index}',
                  String(correctModal.oldElec),
                )}
                value={correctModal.newElec}
                onChange={e =>
                  setCorrectModal(prev => ({
                    ...prev,
                    newElec: parseInt(e.target.value) || 0,
                    error: '',
                  }))
                }
              />
            </div>

            <div className="p-3 bg-vacant/5 rounded-xl border border-vacant/20">
              <NumberInput
                label={t('landlordRoomDetailNewWaterLabel')}
                helperText={t('landlordRoomDetailOldIndexLabel').replace(
                  '{index}',
                  String(correctModal.oldWater),
                )}
                value={correctModal.newWater}
                onChange={e =>
                  setCorrectModal(prev => ({
                    ...prev,
                    newWater: parseInt(e.target.value) || 0,
                    error: '',
                  }))
                }
              />
            </div>
          </div>

          <div>
            <TextareaInput
              label={t('landlordRoomDetailReasonRequiredLabel')}
              required
              rows={3}
              value={correctModal.reason}
              onChange={e =>
                setCorrectModal(prev => ({ ...prev, reason: e.target.value, error: '' }))
              }
              placeholder={t('landlordRoomDetailReasonPlaceholder')}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloseCorrectionModal}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailModalCancelBtn')}
            </Text>
          </Button>
          <Button variant="orange"
            size="sm"
            onClick={handleSaveCorrection}
            isLoading={isSubmittingCorrection}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailSaveAndUpdateInvoice')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL 3: EDIT ROOM INFO MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        size="2xl"
      >
        <Modal.Header
          title={t('landlordRoomDetailModalEditRoomTitle').replace(
            '{roomNumber}',
            room.roomNumber,
          )}
          description={t('landlordRoomDetailModalEditRoomDesc')}
          icon={
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Edit className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="overflow-y-auto max-h-[75vh] space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label={t('landlordRoomDetailRoomNumberLabel')}
              value={editRoomNumber}
              onChange={e => setEditRoomNumber(e.target.value)}
            />
            <TextInput
              label={t('landlordRoomDetailRentMonthlyLabel')}
              value={editPrice}
              onChange={e => setEditPrice(e.target.value)}
            />
            <TextInput
              label={t('landlordRoomDetailAreaLabel')}
              value={editArea}
              onChange={e => setEditArea(e.target.value)}
            />
            <TextInput
              label={t('landlordRoomDetailFloorLabel')}
              value={editFloor}
              onChange={e => setEditFloor(e.target.value)}
            />
          </div>

          <div>
            <Text as="label" size="xs" weight="bold" color="default" className="block mb-2">
              {t('landlordRoomDetailAmenitiesListLabel')}
            </Text>
            <div className="flex flex-wrap gap-2">
              {[
                'WiFi',
                'Điều hòa',
                'Nóng lạnh',
                'Tủ quần áo',
                'Giường',
                'Kệ bếp',
                'Ban công',
                'WC riêng',
                'Máy giặt',
                'Tivi',
                'Tủ lạnh',
                'Bảo vệ',
              ].map(item => (
                <Button
                  key={item}
                  type="button"
                  size="sm"
                  variant={editAmenities.includes(item) ? 'primary' : 'outline'}
                  className={
                    editAmenities.includes(item)
                      ? 'bg-primary/10 text-primary border border-primary/40 hover:bg-primary/20 text-xs'
                      : 'bg-card text-muted hover:bg-card-hover text-xs'
                  }
                  onClick={() =>
                    setEditAmenities(prev =>
                      prev.includes(item) ? prev.filter(a => a !== item) : [...prev, item],
                    )
                  }
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {getAmenityLabel(item, t)}
                  </Text>
                </Button>
              ))}
            </div>
          </div>

          {/* Cấu hình dịch vụ phòng */}
          <div className="border border-line rounded-xl p-4 bg-surface/50 space-y-3">
            <div className="flex justify-between items-center mb-2">
              <Text as="h3" weight="bold" color="default" size="xs" className="uppercase tracking-wider flex items-center gap-1.5">
                <Banknote className="w-4 h-4 text-primary" />{' '}
                {t('landlordRoomDetailRecurringServicesTitle')}
              </Text>
              <Text as="span" size="2xs" color="secondary" weight="medium">
                {t('landlordRoomDetailCustomPriceHint')}
              </Text>
            </div>

            <div className="space-y-2.5">
              {editServices.map(service => (
                <div
                  key={service.id}
                  className="border border-line rounded-xl p-3 bg-card flex flex-wrap sm:flex-nowrap items-center justify-between gap-3 shadow-2xs"
                >
                  <div className="flex items-center gap-2">
                    {!service.isRemovable ? (
                      <Text as="span" weight="bold" size="xs" color="default">{service.name}</Text>
                    ) : (
                      <TextInput
                        containerClassName="w-28 space-y-0"
                        className="py-1 text-xs"
                        value={service.name}
                        onChange={e =>
                          setEditServices(prev =>
                            prev.map(s =>
                              s.id === service.id ? { ...s, name: e.target.value } : s,
                            ),
                          )
                        }
                        placeholder={t('landlordRoomDetailServiceNamePlaceholder')}
                      />
                    )}
                    <Text as="span" size="2xs" color="subtle" weight="medium">
                      ({service.unit})
                    </Text>
                  </div>

                  <div className="flex items-center gap-3">
                    <Checkbox
                      size="sm"
                      label={t('landlordRoomDetailCustomToggle')}
                      checked={Boolean(service.isCustom)}
                      onChange={e =>
                        setEditServices(prev =>
                          prev.map(s =>
                            s.id === service.id ? { ...s, isCustom: e.target.checked } : s,
                          ),
                        )
                      }
                    />

                    <div className="relative w-28 flex items-center">
                      <TextInput
                        containerClassName="w-full space-y-0"
                        className="py-1 text-xs"
                        value={service.isCustom ? service.customPrice : service.defaultPrice}
                        onChange={e =>
                          setEditServices(prev =>
                            prev.map(s =>
                              s.id === service.id ? { ...s, customPrice: e.target.value } : s,
                            ),
                          )
                        }
                        disabled={!service.isCustom}
                      />
                    </div>

                    {service.isRemovable && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setEditServices(prev => prev.filter(s => s.id !== service.id))
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button fullWidth
              type="button"
              variant="primary"
              size="md"
              leftIcon={<Plus />}
              onClick={() =>
                setEditServices(prev => [
                  ...prev,
                  {
                    id: `custom_${Date.now()}`,
                    name: '',
                    defaultPrice: '0',
                    customPrice: '0',
                    unit: 'đ/tháng',
                    isCustom: true,
                    isRemovable: true,
                  },
                ])
              }
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailAddCustomService')}
              </Text>
            </Button>
          </div>

          <div>
            <TextareaInput
              label={t('landlordRoomDetailNotesLabel')}
              rows={3}
              value={editNotes}
              onChange={e => setEditNotes(e.target.value)}
              placeholder={t('landlordRoomDetailNotesPlaceholder')}
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloseEditModal}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailModalCancelBtn')}
            </Text>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveRoomDetails}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailSaveChangesBtn')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MODAL BÁO SỰ CỐ BẢO TRÌ */}
      <Modal
        isOpen={isIncidentModalOpen}
        onClose={() => setIsIncidentModalOpen(false)}
        size="md"
        asForm
        onSubmit={handleCreateIncidentSubmit}
      >
        <Modal.Header
          title={t('landlordRoomDetailModalIncidentTitle')}
          description={t('landlordRoomDetailModalIncidentDesc').replace(
            '{roomNumber}',
            room.roomNumber,
          )}
          icon={
            <div className="p-2 bg-accent  rounded-xl">
              <Wrench className="w-5 h-5" />
            </div>
          }
          className="bg-accent/10"
        />

        <Modal.Body className="space-y-4">
          <TextInput
            label={t('landlordRoomDetailIncidentNameLabel')}
            required
            value={incidentTitleInput}
            onChange={e => setIncidentTitleInput(e.target.value)}
            placeholder={t('landlordRoomDetailIncidentNamePlaceholder')}
          />

          <TextareaInput
            label={t('landlordRoomDetailIncidentDescLabel')}
            rows={3}
            value={incidentDescInput}
            onChange={e => setIncidentDescInput(e.target.value)}
            placeholder={t('landlordRoomDetailIncidentDescPlaceholder')}
          />

          <SelectInput
            label={t('landlordRoomDetailPriorityLabel')}
            value={incidentPriorityInput}
            onChange={e => setIncidentPriorityInput(e.target.value as any)}
            options={[
              { value: 'Mức độ nhẹ', label: t('landlordRoomDetailPriorityLow') },
              { value: 'Mức độ trung bình', label: t('landlordRoomDetailPriorityMedium') },
              { value: 'Mức độ cao', label: t('landlordRoomDetailPriorityHighUrgent') },
            ]}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsIncidentModalOpen(false)}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailModalCancelBtn')}
            </Text>
          </Button>
          <Button variant="orange"
            type="submit"
            size="sm"
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordRoomDetailSendIncidentBtn')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CONFIRM DELETE MODAL */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4">
          <div className="flex items-center gap-3 text-danger">
            <div className="p-3 bg-danger-soft rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <Text as="h3" weight="black" color="default" size="lg">{confirmModal.title}</Text>
          </div>
          <Text size="xs" color="secondary" weight="medium">{confirmModal.message}</Text>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailModalCancelBtn')}
              </Text>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmModal.onConfirm}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailDeleteBtnConfirm')}
              </Text>
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* UNSAVED CHANGES CONFIRMATION MODAL (RULE 10) */}
      <Modal
        isOpen={discardConfirmModal.isOpen}
        onClose={() => setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4">
          <div className="flex items-center gap-3 text-warning">
            <div className="p-3 bg-warning-soft rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-warning" />
            </div>
            <div>
              <Text as="h3" weight="black" color="default" size="base">
                {t('landlordRoomDetailConfirmCloseTitle')}
              </Text>
              <Text size="xs" color="secondary" weight="medium">
                {t('landlordRoomDetailConfirmCloseDesc')}
              </Text>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailConfirmCloseContinue')}
              </Text>
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={discardConfirmModal.onConfirm}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailConfirmCloseDiscard')}
              </Text>
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* TOAST NOTIFICATION HANDLED BY GLOBAL TOAST PROVIDER */}
    </div>
  )
}
