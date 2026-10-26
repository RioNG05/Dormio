'use client'

import React, { useState, useEffect, use, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Edit,
  Trash2,
  Home,
  FileSignature,
  Eye,
  Filter,
  AlertTriangle,
  Gauge,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  SelectInput,
  Text,
  Modal,
  Breadcrumb,
  Chip,
  EmptyState,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { AddTenantModal } from '@/components/landlord/AddTenantModal'
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
import { Room } from '../data'

// Modular subcomponents
import {
  MeterHistoryRecord,
  InvoiceRecord,
  MaintenanceRecord,
  RoomCustomServiceItem,
  FinancialBreakdown,
} from './components/types'
import { RoomOccupantsSection } from './components/RoomOccupantsSection'
import { RoomInvoicesSection } from './components/RoomInvoicesSection'
import { RoomMeterHistorySection } from './components/RoomMeterHistorySection'
import { RoomRentalHistorySection } from './components/RoomRentalHistorySection'
import { RoomMaintenanceSection } from './components/RoomMaintenanceSection'
import { RoomDepositCard } from './components/RoomDepositCard'
import { RoomSidebar } from './components/RoomSidebar'
import { MeterCorrectionModal } from './components/MeterCorrectionModal'
import { ReportIncidentModal } from './components/ReportIncidentModal'
import { EditRoomModal } from './components/EditRoomModal'
import { ManageRoomAmenitiesModal } from './components/ManageRoomAmenitiesModal'

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
  const { toast } = useToast()

  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message)
    } else {
      toast.error(message)
    }
  }

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

  const [room, setRoom] = useState<Room | null>(null)
  const [dashboardData, setDashboardData] = useState<RoomDashboardResponse | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Modals & form state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState(false)
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false)
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  })

  // Filter state for Month/Year
  const [selectedFilterPeriod, setSelectedFilterPeriod] = useState<string>('all')

  // Services state
  const [editServices, setEditServices] = useState<RoomCustomServiceItem[]>([
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

  // Meter Readings History & Active Services Data
  const [meterHistory, setMeterHistory] = useState<MeterHistoryRecord[]>([])
  const [meterHistoryRaw, setMeterHistoryRaw] = useState<LandlordMeterPeriodHistory[]>([])
  const [roomMeteredServices, setRoomMeteredServices] = useState<LandlordActiveMeteredService[]>([])

  // Invoices History List
  const [invoicesHistory, setInvoicesHistory] = useState<InvoiceRecord[]>([])

  // Maintenance History List & Pagination
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceRecord[]>([])
  const [maintPage, setMaintPage] = useState(1)
  const MAINT_PER_PAGE = 2

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
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false)
  const [isManageAmenitiesOpen, setIsManageAmenitiesOpen] = useState(false)

  const isRealUuid = Boolean(resolvedParams.id && UUID_REGEX.test(resolvedParams.id))

  // Load Dashboard Data (Aggregated query)
  const loadDashboard = useCallback(async () => {
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
        const rawOccupants = res.occupants || []
        const occupants =
          rawOccupants.length > 0
            ? rawOccupants
            : (activeContract?.tenants || []).map((t: any) => ({
              id: t.id,
              tenantId: t.id,
              fullName: t.fullName,
              phoneNumber: t.phoneNumber,
              email: t.email,
              avatarUrl: t.avatarUrl,
              hasAccount: true,
              hasIdentification: Boolean(t.hasIdentification),
              identityNumber: t.identityNumber,
              dateOfBirth: t.dateOfBirth,
              gender: t.gender,
              status: 'active' as const,
              joinedAt: activeContract?.startDate || new Date().toISOString(),
              note: 'Khách thuê theo hợp đồng',
              hasContract: true,
              contractId: activeContract?.id,
            }))
        const primaryTenant = occupants[0] || activeContract?.tenants?.[0]

        const formattedPrice = activeContract?.rentPrice
          ? `${parseInt(activeContract.rentPrice).toLocaleString('vi-VN')} ₫`
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
          tenant: occupants[0]?.fullName || primaryTenant?.fullName || undefined,
          tenantPhone: occupants[0]?.phoneNumber || primaryTenant?.phoneNumber || undefined,
          tenantCccd: occupants[0]?.identityNumber || primaryTenant?.identityNumber || undefined,
          amenities: (res.amenities && res.amenities.length > 0)
            ? res.amenities.map((a: any) => a.name)
            : [],
          notes: activeContract?.note || '',
        }

        setRoom(mappedRoom)

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
            meterReadingService.getLandlordRoomMeterHistory(
              activeBuilding.id,
              resolvedParams.id,
            ),
          ])

          if (meterServicesRes?.services) {
            setRoomMeteredServices(meterServicesRes.services)
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
  }, [resolvedParams.id, activeBuilding?.id, isRealUuid])

  useEffect(() => {
    setIsMounted(true)
    loadDashboard()
  }, [loadDashboard])

  useEffect(() => {
    setInvoicePage(1)
    setMeterPage(1)
  }, [selectedFilterPeriod])

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

  const handleSaveRoomDetails = async (data: {
    roomNumber: string
    price: string
    area: string
    floor: string
    amenities: string[]
    services: RoomCustomServiceItem[]
    notes: string
  }) => {
    if (isRealUuid && activeBuilding?.id && UUID_REGEX.test(activeBuilding.id)) {
      try {
        const cleanArea = parseFloat(data.area) || undefined
        const cleanFloor = parseInt(data.floor) || undefined

        await updateRoom(activeBuilding.id, resolvedParams.id, {
          roomNumber: data.roomNumber,
          floor: cleanFloor,
          area: cleanArea,
        })

        setRoom(prev =>
          prev
            ? {
              ...prev,
              roomNumber: data.roomNumber || prev.roomNumber,
              price: data.price.includes('₫') ? data.price : `${data.price} ₫`,
              area: data.area || prev.area,
              floor: data.floor || prev.floor,
              amenities: data.amenities,
              notes: data.notes,
            }
            : null,
        )
        setEditServices(data.services)
        showToast(t('landlordRoomDetailToastUpdateSuccess'), 'success')
      } catch (err: any) {
        console.error('Failed to update room:', err)
        showToast(err.message || t('landlordRoomDetailToastUpdateError'), 'error')
        throw err
      }
    } else {
      setRoom(prev =>
        prev
          ? {
            ...prev,
            roomNumber: data.roomNumber || prev.roomNumber,
            price: data.price.includes('₫') ? data.price : `${data.price} ₫`,
            area: data.area || prev.area,
            floor: data.floor || prev.floor,
            amenities: data.amenities,
            notes: data.notes,
          }
          : null,
      )
      setEditServices(data.services)
      showToast(t('landlordRoomDetailToastUpdateSuccess'), 'success')
    }
  }

  const handleCreateIncident = (data: {
    title: string
    description?: string
    priority: 'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ'
  }) => {
    const todayStr = new Date().toLocaleDateString('vi-VN')
    const newRecord: MaintenanceRecord = {
      id: `M_${Date.now()}`,
      title: data.title,
      description: data.description,
      reportDate: todayStr,
      status: 'Đang xử lý',
      priority: data.priority,
    }
    setMaintenanceHistory(prev => [newRecord, ...prev])
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
        <div className="h-16 bg-line rounded-2xl w-full" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="h-44 bg-card-hover rounded-2xl" />
            <div className="h-64 bg-card-hover rounded-2xl" />
          </div>
          <div className="space-y-6">
            <div className="h-40 bg-card-hover rounded-2xl" />
            <div className="h-60 bg-card-hover rounded-2xl" />
          </div>
        </div>
      </div>
    )
  }

  if (!room) {
    return (
      <div className="py-12">
        <EmptyState
          icon={Home}
          title={t('landlordRoomDetailNotFound')}
          description={`${t('landlordRoomDetailRoomCode')}: ${resolvedParams.id}`}
          action={{
            label: t('landlordRoomDetailBack'),
            onClick: () => router.push('/landlord/rooms'),
          }}
          bordered
        />
      </div>
    )
  }

  const isOccupied = room.status === 'Đang thuê'
  const isVacant = room.status === 'Trống'
  const isMaintenance = room.status === 'Bảo trì'
  const isReserved = room.status === 'Đặt cọc'

  // Base financial calculations
  const roomRentNum = parseInt((room.price || '3000000').replace(/\D/g, '')) || 3000000
  const fixedServicesTotal = 210000
  const elecService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('điện'))
  const waterService = roomMeteredServices.find(s => s.serviceName.toLowerCase().includes('nước'))
  const elecUnitPrice = elecService?.unitPrice ?? 3500
  const waterUnitPrice = waterService?.unitPrice ?? 25000

  const computeRecordFinancials = (m: MeterHistoryRecord): FinancialBreakdown => {
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
  const rawOccupants = dashboardData?.occupants || []
  const occupants =
    rawOccupants.length > 0
      ? rawOccupants
      : (currentContract?.tenants || []).map((t: any) => ({
        id: t.id,
        tenantId: t.id,
        fullName: t.fullName,
        phoneNumber: t.phoneNumber,
        email: t.email,
        avatarUrl: t.avatarUrl,
        hasAccount: true,
        hasIdentification: Boolean(t.hasIdentification),
        identityNumber: t.identityNumber,
        dateOfBirth: t.dateOfBirth,
        gender: t.gender,
        status: 'active' as const,
        joinedAt: currentContract?.startDate || new Date().toISOString(),
        note: 'Khách thuê theo hợp đồng',
        hasContract: true,
        contractId: currentContract?.id,
      }))

  const availablePeriods = Array.from(
    new Set([
      ...meterHistory.map(m => m.period),
      ...invoicesHistory.map(i => i.period),
      'Tháng 09/2026',
      'Tháng 08/2026',
      'Tháng 07/2026',
    ]),
  ).filter(Boolean)

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
            <Text
              as="h1"
              variant="heading"
              size="2xl"
              weight="black"
              color="default"
              className="tracking-tight sm:text-2xl"
            >
              {t('landlordRoomDetailRoomPrefix')} {room.roomNumber}
            </Text>
            <Chip
              variant={
                isOccupied
                  ? 'default'
                  : isVacant
                    ? 'info'
                    : isMaintenance
                      ? 'warning'
                      : isReserved
                        ? 'purple'
                        : 'neutral'
              }
              size="sm"
              preventHover
              className={cn(
                'rounded-full',
                isOccupied && 'bg-primary/10 text-primary border-primary/30',
              )}
            >
              {getStatusLabel(room.status)}
            </Chip>
            {dashboardData?.room?.roomType?.name && (
              <Chip
                variant="success"
                size="sm"
                preventHover
                className="rounded-full"
              >
                {dashboardData.room.roomType.name}
              </Chip>
            )}
          </div>
        </div>

        {/* Action Toolbar */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-line">
          {isOccupied && (
            <Button
              size="md"
              onClick={() => router.push(`/landlord/meter-readings?roomId=${resolvedParams.id}`)}
              leftIcon={<Gauge />}
              className="flex-1 md:flex-initial"
            >
              {t('landlordRoomDetailBtnLogMeter')}
            </Button>
          )}

          {isOccupied ? (
            <Button
              href={
                currentContract?.id
                  ? `/landlord/contracts/${currentContract.id}`
                  : `/landlord/contracts/HD-01012026-${room.building === 'b2' ? 2 : 1}-${room.roomNumber}`
              }
              size="md"
              variant="outline"
              leftIcon={<Eye />}
              className="flex-1 md:flex-initial"
            >
              {t('landlordRoomDetailBtnViewContract')}
            </Button>
          ) : (
            <Button
              variant='accent'
              href={`/landlord/contracts/create?roomId=${dashboardData?.room?.id || room?.id || resolvedParams.id}`}
              size="md"
              leftIcon={<FileSignature />}
              className="flex-1 md:flex-initial"
            >
              {t('landlordRoomDetailBtnCreateContract')}
            </Button>
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
          {/* ROOM OCCUPANTS SECTION */}
          <RoomOccupantsSection
            occupants={occupants}
            currentContract={currentContract}
            roomId={dashboardData?.room?.id || room.id || resolvedParams.id}
            roomNumber={room.roomNumber}
            isOccupied={isOccupied}
            onOpenAddTenantModal={() => setIsAddTenantModalOpen(true)}
          />

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
                  ...availablePeriods.map(p => ({
                    value: p,
                    label: p,
                  })),
                ]}
              />
            </div>
          </div>

          {/* INVOICES & DEBT */}
          <RoomInvoicesSection
            invoicesHistory={invoicesHistory}
            filteredInvoices={filteredInvoices}
            paginatedInvoices={paginatedInvoices}
            meterHistory={meterHistory}
            unpaidInvoice={unpaidInvoice}
            unpaidFinancials={unpaidFinancials}
            roomRentNum={roomRentNum}
            fixedServicesTotal={fixedServicesTotal}
            computeRecordFinancials={computeRecordFinancials}
            totalInvoicePages={totalInvoicePages}
            invoicePage={invoicePage}
            onInvoicePageChange={setInvoicePage}
            itemsPerPage={ITEMS_PER_PAGE}
          />

          {/* METER READINGS HISTORY */}
          <RoomMeterHistorySection
            meterHistory={meterHistory}
            filteredMeterHistory={filteredMeterHistory}
            paginatedMeterHistory={paginatedMeterHistory}
            invoicesHistory={invoicesHistory}
            elecUnitPrice={elecUnitPrice}
            waterUnitPrice={waterUnitPrice}
            computeRecordFinancials={computeRecordFinancials}
            totalMeterPages={totalMeterPages}
            meterPage={meterPage}
            onMeterPageChange={setMeterPage}
            onOpenCorrectionModal={handleOpenCorrectionModal}
            itemsPerPage={ITEMS_PER_PAGE}
            roomId={resolvedParams.id}
          />

          {/* RENTAL HISTORY */}
          <RoomRentalHistorySection
            rentalHistory={dashboardData?.rentalHistory || []}
            roomTenant={room.tenant}
          />

          {/* MAINTENANCE & DEPOSIT SECTION */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <RoomMaintenanceSection
              maintenanceHistory={maintenanceHistory}
              maintPage={maintPage}
              onPageChange={setMaintPage}
              onReportIncident={() => setIsIncidentModalOpen(true)}
              itemsPerPage={MAINT_PER_PAGE}
            />

            <RoomDepositCard
              currentContract={currentContract}
              onRefundDeposit={() =>
                showToast(t('landlordRoomDetailRefundToast'), 'success')
              }
            />
          </div>
        </div>

        {/* Right Sidebar Column */}
        <RoomSidebar
          room={room}
          dashboardData={dashboardData}
          currentContract={currentContract}
          unpaidFinancials={unpaidFinancials}
          services={editServices}
          onUpdateStatus={handleUpdateStatus}
          onOpenManageAmenities={() => setIsManageAmenitiesOpen(true)}
        />
      </div>

      {/* MODAL 1: CHỈNH SỬA SỐ ĐIỆN NƯỚC */}
      <MeterCorrectionModal
        isOpen={correctModal.isOpen}
        period={correctModal.period}
        oldElec={correctModal.oldElec}
        newElec={correctModal.newElec}
        oldWater={correctModal.oldWater}
        newWater={correctModal.newWater}
        reason={correctModal.reason}
        error={correctModal.error}
        isSubmitting={isSubmittingCorrection}
        onClose={() => setCorrectModal(prev => ({ ...prev, isOpen: false }))}
        onSave={handleSaveCorrection}
        onChangeNewElec={val => setCorrectModal(prev => ({ ...prev, newElec: val, error: '' }))}
        onChangeNewWater={val => setCorrectModal(prev => ({ ...prev, newWater: val, error: '' }))}
        onChangeReason={val => setCorrectModal(prev => ({ ...prev, reason: val, error: '' }))}
      />

      {/* MODAL 2: EDIT ROOM INFO MODAL */}
      <EditRoomModal
        isOpen={isEditModalOpen}
        room={room}
        initialServices={editServices}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSaveRoomDetails}
      />

      {/* MODAL 3: BÁO SỰ CỐ BẢO TRÌ */}
      <ReportIncidentModal
        isOpen={isIncidentModalOpen}
        roomNumber={room.roomNumber}
        onClose={() => setIsIncidentModalOpen(false)}
        onSubmit={handleCreateIncident}
      />

      {/* MODAL 4: QUẢN LÝ TIỆN NGHI PHÒNG */}
      <ManageRoomAmenitiesModal
        isOpen={isManageAmenitiesOpen}
        boardingHouseId={activeBuilding?.id || ''}
        roomId={resolvedParams.id}
        roomNumber={room.roomNumber}
        onClose={() => setIsManageAmenitiesOpen(false)}
        onSuccess={loadDashboard}
      />

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
            <Text as="h3" weight="black" color="default" size="lg">
              {confirmModal.title}
            </Text>
          </div>
          <Text size="xs" color="secondary" weight="medium">
            {confirmModal.message}
          </Text>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailModalCancelBtn')}
              </Text>
            </Button>
            <Button variant="danger" onClick={confirmModal.onConfirm}>
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordRoomDetailDeleteBtnConfirm')}
              </Text>
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ADD TENANT MODAL */}
      {activeBuilding?.id && (
        <AddTenantModal
          isOpen={isAddTenantModalOpen}
          onClose={() => setIsAddTenantModalOpen(false)}
          onSuccess={async () => {
            setIsAddTenantModalOpen(false)
            showToast(t('landlordTenantSuccessToast'), 'success')
            await loadDashboard()
          }}
          boardingHouseId={activeBuilding.id}
          fixedRoomId={resolvedParams.id}
          fixedRoomNumber={room?.roomNumber}
        />
      )}
    </div>
  )
}
