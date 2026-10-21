'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  Wrench,
  Calendar,
  Building2,
  Home,
  User,
  DollarSign,
  ShieldCheck,
  Tag,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  FileText,
  ChevronRight,
  AlertCircle,
  Info,
  ChevronLeft,
  BarChart3,
  TrendingDown,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Asset, MaintenanceLog, calculateDepreciation } from '../data'
import { assetService, AssetCondition } from '@/services/asset.service'
import { Button, TextInput, SelectInput, TextareaInput } from '@/components/ui'

// Mock Room Tenants dictionary for automatic tenant reflection when room changes
const mockRoomTenants: Record<string, { name: string; phone: string }> = {
  '101': { name: 'Nguyễn Văn A', phone: '0901234567' },
  '102': { name: 'Trần Thị B', phone: '0987654321' },
  '103': { name: 'Lê Văn C', phone: '0912345678' },
  '105': { name: 'Phạm Hoàng D', phone: '0909999888' },
  '201': { name: 'Vũ Thị E', phone: '0933445566' },
  '202': { name: 'Hoàng Văn F', phone: '0977889900' },
}

export default function AssetDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { locale } = useLanguage()
  const isEn = locale === 'en'

  const getStatusLabel = (status: string) => {
    if (status === 'Đang sử dụng') return t('landlordAssetsStatusInUse')
    if (status === 'Sẵn sàng') return t('landlordAssetsStatusReady')
    if (status === 'Bảo trì') return t('landlordAssetsStatusMaintenance')
    if (status === 'Hỏng hóc') return t('landlordAssetsStatusBroken')
    return status
  }

  const getCategoryLabel = (category: string) => {
    if (category === 'Điện lạnh') return t('landlordAssetsCatRefrigeration')
    if (category === 'Nội thất') return t('landlordAssetsCatFurniture')
    if (category === 'Gia dụng') return t('landlordAssetsCatAppliances')
    if (category === 'Điện nước') return t('landlordAssetsCatUtilities')
    if (category === 'An ninh') return t('landlordAssetsCatSecurity')
    return category
  }

  const [asset, setAsset] = useState<Asset | null>(null)
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [logPage, setLogPage] = useState(1)
  const logsPerPage = 2

  // Building Code Prefix for Asset ID (e.g. DORMIO-Q1)
  const buildingPrefix = activeBuilding?.id ? activeBuilding.id.toUpperCase() : 'DORMIO-Q1'

  // Maintenance Log Modal State
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logType, setLogType] = useState('Bảo dưỡng định kỳ')
  const [logDescription, setLogDescription] = useState('')
  const [logCost, setLogCost] = useState('200.000 ₫')
  const [logPerformer, setLogPerformer] = useState('')

  // Edit Asset Modal State (with SKU & Depreciation)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editSku, setEditSku] = useState('')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('Điện lạnh')
  const [editRoom, setEditRoom] = useState('101')
  const [editPurchaseValue, setEditPurchaseValue] = useState('8.500.000 ₫')
  const [editPurchaseDate, setEditPurchaseDate] = useState('10/01/2024')
  const [editDepreciationYears, setEditDepreciationYears] = useState(5)
  const [editStatus, setEditStatus] = useState('Đang sử dụng')
  const [editModelCode, setEditModelCode] = useState('')
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editWarrantyPeriod, setEditWarrantyPeriod] = useState('')
  const [editSupplier, setEditSupplier] = useState('')

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'warning' | 'error' | 'success' | 'info'
  }>({
    isOpen: false,
    title: isEn ? 'Notification' : 'Thông báo',
    message: '',
    type: 'info',
  })

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
  })

  const showAlert = (
    message: string,
    type: 'warning' | 'error' | 'success' | 'info' = 'warning',
    title?: string,
  ) => {
    setAlertModal({
      isOpen: true,
      title: title || (isEn ? 'Notification' : 'Thông báo'),
      message,
      type,
    })
  }

  useEffect(() => {
    if (id && activeBuilding?.id) {
      assetService
        .getAssetDetail(activeBuilding.id, String(id))
        .then(res => {
          if (res?.data) {
            const item = res.data
            const statusLabel =
              item.condition === 'good'
                ? 'Đang sử dụng'
                : item.condition === 'new'
                  ? 'Sẵn sàng'
                  : item.condition === 'under_repair'
                    ? 'Bảo trì'
                    : 'Hỏng hóc'

            setAsset({
              id: item.id,
              sku: item.code,
              name: item.name,
              category: item.category || 'Điện lạnh',
              building: activeBuilding.id,
              buildingName: activeBuilding.name,
              room: item.roomNumber ? `Phòng ${item.roomNumber}` : item.location,
              roomId: item.roomId,
              status: statusLabel,
              dateAdded: item.createdAt ? item.createdAt.split('T')[0] : '',
              purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
              purchaseValue: item.purchasePrice ? Number(item.purchasePrice) : 0,
              numericValue: item.purchasePrice ? Number(item.purchasePrice) : 0,
              value: item.purchasePrice
                ? `${Number(item.purchasePrice).toLocaleString('vi-VN')} ₫`
                : '0 ₫',
              note: item.note || '',
              maintenanceLogs: [],
            })
          }
        })
        .catch(err => {
          console.error('Failed to load asset detail:', err)
        })
    }
  }, [id, activeBuilding?.id])

  if (!asset) {
    return (
      <div className="p-8 sm:p-12 text-center text-muted">
        <Package className="w-10 sm:w-12 h-10 sm:h-12 mx-auto mb-3 text-zinc-300 animate-pulse" />
        <p className="font-bold text-xs sm:text-sm">{t('landlordAssetsDetailLoading')}</p>
      </div>
    )
  }

  // Check if location is a tenant room (starts with numbers, P101, Phòng 101, etc.)
  const isTenantRoom = (roomStr: string) => {
    if (!roomStr) return false
    const trimmed = roomStr.trim()
    return /^\d+$/.test(trimmed) || /^p\d+/i.test(trimmed) || /^phòng\s*\d+/i.test(trimmed)
  }

  const hasRoomLink = isTenantRoom(asset.room)
  const currentTenant = mockRoomTenants[asset.room] || { name: 'Nguyễn Văn A', phone: '0901234567' }
  const dep = calculateDepreciation(asset)

  // Pagination calculation for Maintenance Logs
  const totalLogPages = Math.ceil(maintenanceLogs.length / logsPerPage) || 1
  const paginatedLogs = maintenanceLogs.slice((logPage - 1) * logsPerPage, logPage * logsPerPage)

  const handleOpenEditModal = () => {
    setEditSku(asset.sku || asset.id)
    setEditName(asset.name)
    setEditCategory(asset.category)
    setEditRoom(asset.room)
    setEditPurchaseValue(asset.value)
    setEditPurchaseDate(asset.purchaseDate || asset.dateAdded || '10/01/2024')
    setEditDepreciationYears(asset.depreciationYears || 5)
    setEditStatus(asset.status)
    setEditModelCode(asset.modelCode || '')
    setEditSerialNumber(asset.serialNumber || '')
    setEditWarrantyPeriod(asset.warrantyPeriod || '')
    setEditSupplier(asset.supplier || '')
    setIsEditModalOpen(true)
  }

  const handleSaveEditAsset = () => {
    if (!editName.trim()) {
      showAlert(t('landlordAssetsNameRequired'), 'warning', t('landlordAssetsInfoMissing'))
      return
    }
    if (!editSku.trim()) {
      showAlert(t('landlordAssetsSkuRequired'), 'warning', t('landlordAssetsInfoMissing'))
      return
    }

    const numVal = parseInt(editPurchaseValue.replace(/\D/g, '')) || 0
    const formattedVal = numVal > 0 ? `${numVal.toLocaleString('vi-VN')} ₫` : editPurchaseValue
    const cleanSku = editSku.trim().toUpperCase()
    const generatedId = `${buildingPrefix}-${cleanSku}`

    setAsset(prev =>
      prev
        ? {
            ...prev,
            id: generatedId,
            sku: cleanSku,
            name: editName.trim(),
            category: editCategory,
            room: editRoom,
            value: formattedVal,
            numericValue: numVal,
            purchaseValue: numVal,
            purchaseDate: editPurchaseDate,
            depreciationYears: Number(editDepreciationYears) || 5,
            status: editStatus,
            modelCode: editModelCode.trim(),
            serialNumber: editSerialNumber.trim(),
            warrantyPeriod: editWarrantyPeriod.trim(),
            supplier: editSupplier.trim(),
          }
        : null,
    )

    setIsEditModalOpen(false)
    showAlert(t('landlordAssetsToastEditSuccess'), 'success', t('landlordAssetsToastEditSuccess'))
  }

  const handleAddMaintenanceLog = () => {
    if (!logDescription.trim()) {
      showAlert(t('landlordAssetsDetailLogDesc'), 'warning', t('landlordAssetsInfoMissing'))
      return
    }

    const newLog: MaintenanceLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      date: new Date().toLocaleDateString('vi-VN'),
      type: logType,
      description: logDescription.trim(),
      cost: logCost.trim() || '0 ₫',
      performer: logPerformer.trim() || 'Kỹ thuật viên',
    }

    setMaintenanceLogs(prev => [newLog, ...prev])
    setLogPage(1) // Reset to page 1 to view newly added log
    setIsLogModalOpen(false)
    setLogDescription('')
    setLogPerformer('')
    showAlert(t('landlordAssetsDetailLogSaveBtn'), 'success', t('landlordAssetsDetailLogSaveBtn'))
  }

  const handleStatusChange = (newStatus: string) => {
    setAsset(prev => (prev ? { ...prev, status: newStatus } : null))
    showAlert(
      isEn
        ? `Updated asset status to: ${getStatusLabel(newStatus)}`
        : `Đã cập nhật trạng thái tài sản thành: ${getStatusLabel(newStatus)}`,
      'success',
      isEn ? 'Status updated' : 'Cập nhật trạng thái',
    )
  }

  const handleDeleteAsset = () => {
    setConfirmModal({
      isOpen: true,
      title: t('landlordAssetsDetailDeleteConfirmTitle'),
      message: `Bạn có chắc chắn muốn xóa tài sản [${asset.name}] khỏi hệ thống? Hành động này không thể hoàn tác.`,
      onConfirm: () => {
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
        showAlert(
          t('landlordAssetsToastDeleteSuccess'),
          'success',
          t('landlordAssetsToastDeleteSuccess'),
        )
        setTimeout(() => router.push('/landlord/assets'), 1000)
      },
    })
  }

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-1.5 sm:gap-2 text-xs font-bold text-muted flex-wrap">
        <Link
          href="/landlord/assets"
          className="hover:text-primary flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> {t('landlordAssetsDetailBack')}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-zinc-300 shrink-0" />
        <span className="text-foreground font-extrabold truncate">
          {asset.name} (SKU: {asset.sku || asset.id})
        </span>
      </div>

      {/* Main Asset Header Card (With Sub-bar for Location & Tenant right under Title) */}
      <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-accent-soft border border-accent-subtle text-accent flex items-center justify-center shrink-0 shadow-2xs">
            <Package className="w-6 sm:w-8 h-6 sm:h-8" />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-card-hover text-foreground/90 border border-line">
                {getCategoryLabel(asset.category)}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/30">
                SKU: {asset.sku || asset.id}
              </span>
              <span
                className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${
                  asset.status === 'Đang sử dụng'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : asset.status === 'Sẵn sàng'
                      ? 'bg-info-soft text-blue-600 border-info-subtle'
                      : asset.status === 'Bảo trì'
                        ? 'bg-accent-soft text-accent border-accent-subtle animate-pulse'
                        : 'bg-danger-soft text-rose-600 border-danger-subtle'
                }`}
              >
                {getStatusLabel(asset.status)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
              {asset.name}
            </h1>

            {/* LOCATION & TENANT SUB-BAR DIRECTLY UNDER TITLE (Links integrated into Room Name & Tenant Name) */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-muted pt-2 border-t border-line">
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-line">
                <Home className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {t('landlordAssetsDetailLocation')}{' '}
                  {hasRoomLink ? (
                    <Link
                      href={`/landlord/rooms?id=${asset.room}`}
                      className="font-extrabold text-primary hover:underline hover:text-[#25ad87] transition-colors"
                    >
                      {isEn ? `Room ${asset.room}` : `Phòng ${asset.room}`}
                    </Link>
                  ) : (
                    <strong className="text-foreground font-extrabold">{asset.room}</strong>
                  )}
                </span>
              </div>

              {hasRoomLink && (
                <div className="flex items-center gap-1.5 bg-success-soft px-3 py-1.5 rounded-xl border border-success-subtle">
                  <User className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t('landlordAssetsDetailTenant')}{' '}
                    <Link
                      href="/landlord/customers"
                      className="font-extrabold text-success hover:underline hover:text-emerald-800 transition-colors"
                    >
                      {currentTenant.name}
                    </Link>{' '}
                    <span className="text-muted font-medium">({currentTenant.phone})</span>
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          <Button
            variant="warning"
            size="sm"
            onClick={() =>
              handleStatusChange(asset.status === 'Bảo trì' ? 'Đang sử dụng' : 'Bảo trì')
            }
            leftIcon={<Wrench className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-amber-600" />}
          >
            {asset.status === 'Bảo trì'
              ? t('landlordAssetsDetailBtnFinishMaintenance')
              : t('landlordAssetsDetailBtnSendMaintenance')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleOpenEditModal}
            leftIcon={<Edit3 className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary" />}
          >
            {t('landlordAssetsBtnEdit')}
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={handleDeleteAsset}
            leftIcon={<Trash2 className="w-3.5 sm:w-4 h-3.5 sm:h-4" />}
          >
            {t('landlordAssetsBtnDelete')}
          </Button>
        </div>
      </div>

      {/* Grid Layout Details (Items-stretch so both columns are ALWAYS 100% equal in height) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Column (7 Cols on desktop: Info + Valuation) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-6">
          {/* General Information Card */}
          <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-line">
              <Info className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-primary" />
              <h2 className="text-sm sm:text-base font-black text-foreground">
                {t('landlordAssetsDetailGeneral')}
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailModel')}
                </span>
                <span className="font-bold text-foreground">
                  {asset.modelCode || '— Chưa cập nhật'}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailSerial')}
                </span>
                <span className="font-bold text-foreground">
                  {asset.serialNumber || '— Chưa cập nhật'}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsFieldPurchaseDate')}
                </span>
                <span className="font-bold text-foreground">
                  {asset.purchaseDate || asset.dateAdded}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailWarranty')}
                </span>
                <span className="font-bold text-success">
                  {asset.warrantyPeriod || '12 tháng'}
                </span>
              </div>
            </div>
          </div>

          {/* REAL-WORLD LINEAR DEPRECIATION VALUATION CARD */}
          <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-emerald-600" />
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {t('landlordAssetsDetailDepreciation')}
                  </h2>
                </div>
                <span className="text-[10px] font-black text-muted bg-card-hover px-2 py-1 rounded-lg">
                  {t('landlordAssetsDetailYearsUsed', {
                    years: asset.depreciationYears || 5,
                    months: dep.totalMonths,
                  })}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-xs">
                <div className="p-3.5 sm:p-4 bg-success-soft border border-success-subtle rounded-2xl space-y-1">
                  <span className="text-success font-medium block">
                    {t('landlordAssetsDetailInitialValue')}
                  </span>
                  <span className="font-black text-success text-base sm:text-lg">
                    {asset.value}
                  </span>
                  <span className="text-[10px] text-success font-medium block">
                    Ngày mua: {asset.purchaseDate || asset.dateAdded}
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 bg-warning-soft border border-warning-subtle rounded-2xl space-y-1">
                  <span className="text-warning font-medium block">
                    {t('landlordAssetsDetailAccumulatedDepreciation', {
                      percent: dep.depreciatedPercent,
                    })}
                  </span>
                  <span className="font-black text-warning text-base sm:text-lg">
                    - {dep.accumulatedDepreciation.toLocaleString('vi-VN')} ₫
                  </span>
                  <span className="text-[10px] text-warning font-medium block">
                    {t('landlordAssetsDetailUsedMonths', {
                      used: dep.monthsUsed,
                      total: dep.totalMonths,
                    })}
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 bg-info-soft border border-info-subtle rounded-2xl space-y-1">
                  <span className="text-info font-medium block">
                    {t('landlordAssetsDetailCurrentEstimated', { percent: dep.remainingPercent })}
                  </span>
                  <span className="font-black text-info text-base sm:text-lg">
                    {dep.currentValue.toLocaleString('vi-VN')} ₫
                  </span>
                  <span className="text-[10px] text-info font-medium block">
                    Khấu hao ~{Math.round(dep.monthlyDepreciation).toLocaleString('vi-VN')} ₫/tháng
                  </span>
                </div>
              </div>
            </div>

            {/* VISUAL DEPRECIATION PROGRESS BAR */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-extrabold text-foreground/90">
                <span>
                  {t('landlordAssetsDetailRemainingRatio', { percent: dep.remainingPercent })}
                </span>
                <span className="text-amber-600">
                  {t('landlordAssetsDetailDepreciatedRatio', { percent: dep.depreciatedPercent })}
                </span>
              </div>
              <div className="w-full h-3 bg-warning-soft rounded-full overflow-hidden flex p-0.5 border border-line">
                <div
                  style={{ width: `${dep.remainingPercent}%` }}
                  className="h-full bg-primary rounded-full transition-all duration-500 shadow-xs"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 Cols on desktop: Always 100% equal height with Left Column) */}
        <div className="lg:col-span-5 flex flex-col">
          {/* Maintenance Logs Section */}
          <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line shrink-0">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-amber-500 shrink-0" />
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {t('landlordAssetsDetailMaintenanceHistory')}
                  </h2>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsLogModalOpen(true)}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {t('landlordAssetsDetailAddMaintenanceBtn')}
                </Button>
              </div>

              {maintenanceLogs.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center text-muted text-xs space-y-2.5 my-auto">
                  <div className="w-12 h-12 rounded-2xl bg-warning-soft text-amber-500 border border-warning-subtle flex items-center justify-center shadow-2xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-extrabold text-foreground text-sm">
                      {t('landlordAssetsDetailNoMaintenance')}
                    </p>
                    <p className="text-xs text-muted font-medium max-w-xs mx-auto mt-1">
                      {t('landlordAssetsDetailNoMaintenanceDesc')}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 max-h-[340px] sm:max-h-[370px]">
                  {maintenanceLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3.5 sm:p-4 bg-surface rounded-2xl border border-line space-y-2.5 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-warning-soft text-warning rounded-md font-extrabold text-[10px]">
                            {log.type}
                          </span>
                          <span className="text-muted font-medium text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted inline shrink-0" />{' '}
                            {log.date}
                          </span>
                        </div>
                        <span className="font-black text-emerald-600 text-xs sm:text-sm bg-success-soft px-2 py-0.5 rounded-md border border-success-subtle shrink-0">
                          {log.cost}
                        </span>
                      </div>

                      <p className="font-bold text-foreground leading-relaxed text-xs sm:text-sm break-words">
                        {log.description}
                      </p>

                      <div className="text-[11px] text-muted font-medium pt-1.5 border-t border-line flex items-center justify-between">
                        <span>
                          {t('landlordAssetsDetailPerformer')}{' '}
                          <strong className="text-foreground/90">{log.performer}</strong>
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* EDIT ASSET MODAL WITH SKU & DEPRECIATION PARAMETERS */}
      {isEditModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIsEditModalOpen(false)
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between bg-surface/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent-soft text-accent rounded-xl">
                  <Edit3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-foreground">
                    {t('landlordAssetsModalEditTitle')} [{t('landlordAssetsFieldSku')}: {editSku}]
                  </h3>
                  <p className="text-xs text-muted font-medium">{t('landlordAssetsModalSub')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* SKU Code Input */}
                <TextInput
                  label={`${t('landlordAssetsFieldSku')} *`}
                  type="text"
                  value={editSku}
                  onChange={e => setEditSku(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-bold border border-line rounded-xl focus:border-primary outline-none uppercase font-mono"
                />

                <TextInput
                  label={`${t('landlordAssetsFieldName')} *`}
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
                />

                <SelectInput
                  label={t('landlordAssetsFieldCategory')}
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none appearance-none bg-card cursor-pointer"
                  options={[
                    { value: 'Điện lạnh', label: t('landlordAssetsCatRefrigeration') },
                    { value: 'Nội thất', label: t('landlordAssetsCatFurniture') },
                    { value: 'Gia dụng', label: t('landlordAssetsCatAppliances') },
                    { value: 'Điện nước', label: t('landlordAssetsCatUtilities') },
                    { value: 'An ninh', label: t('landlordAssetsCatSecurity') },
                  ]}
                />

                <SelectInput
                  label={t('landlordAssetsFieldRoom')}
                  value={editRoom}
                  onChange={e => setEditRoom(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none appearance-none bg-card cursor-pointer"
                  options={[
                    {
                      value: '101',
                      label: isEn
                        ? 'Room 101 (Tenant: Nguyen Van A)'
                        : 'Phòng 101 (Khách: Nguyễn Văn A)',
                    },
                    {
                      value: '102',
                      label: isEn
                        ? 'Room 102 (Tenant: Tran Thi B)'
                        : 'Phòng 102 (Khách: Trần Thị B)',
                    },
                    {
                      value: '103',
                      label: isEn
                        ? 'Room 103 (Tenant: Le Van C)'
                        : 'Phòng 103 (Khách: Lê Văn C)',
                    },
                    {
                      value: '105',
                      label: isEn
                        ? 'Room 105 (Tenant: Pham Hoang D)'
                        : 'Phòng 105 (Khách: Phạm Hoàng D)',
                    },
                    {
                      value: '201',
                      label: isEn
                        ? 'Room 201 (Tenant: Vu Thi E)'
                        : 'Phòng 201 (Khách: Vũ Thị E)',
                    },
                    {
                      value: 'Kho',
                      label: isEn ? 'Storage (No tenant)' : 'Kho chứa đồ (Không có khách)',
                    },
                    {
                      value: 'Khu sinh hoạt chung',
                      label: isEn
                        ? 'Common area (No tenant)'
                        : 'Khu sinh hoạt chung (Không có khách)',
                    },
                  ]}
                />

                <TextInput
                  label={t('landlordAssetsFieldPurchaseValue')}
                  type="text"
                  value={editPurchaseValue}
                  onChange={e => setEditPurchaseValue(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
                />

                <TextInput
                  label={t('landlordAssetsFieldPurchaseDate')}
                  type="text"
                  placeholder="VD: 10/01/2024"
                  value={editPurchaseDate}
                  onChange={e => setEditPurchaseDate(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
                />

                <SelectInput
                  label={t('landlordAssetsFieldDepreciationYears')}
                  value={editDepreciationYears}
                  onChange={e => setEditDepreciationYears(Number(e.target.value))}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none appearance-none bg-card cursor-pointer"
                  options={[
                    { value: 3, label: `3 ${isEn ? 'years (36 months)' : 'năm (36 tháng)'}` },
                    { value: 5, label: `5 ${isEn ? 'years (60 months)' : 'năm (60 tháng)'}` },
                    { value: 8, label: `8 ${isEn ? 'years (96 months)' : 'năm (96 tháng)'}` },
                    { value: 10, label: `10 ${isEn ? 'years (120 months)' : 'năm (120 tháng)'}` },
                  ]}
                />

                <SelectInput
                  label={t('landlordAssetsFieldStatus')}
                  value={editStatus}
                  onChange={e => setEditStatus(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none appearance-none bg-card cursor-pointer"
                  options={[
                    { value: 'Đang sử dụng', label: t('landlordAssetsStatusInUse') },
                    { value: 'Sẵn sàng', label: t('landlordAssetsStatusReady') },
                    { value: 'Bảo trì', label: t('landlordAssetsStatusMaintenance') },
                    { value: 'Hỏng hóc', label: t('landlordAssetsStatusBroken') },
                  ]}
                />

                <TextInput
                  label={t('landlordAssetsFieldModelCode')}
                  type="text"
                  value={editModelCode}
                  onChange={e => setEditModelCode(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
                />

                <TextInput
                  label={t('landlordAssetsFieldWarranty')}
                  type="text"
                  value={editWarrantyPeriod}
                  onChange={e => setEditWarrantyPeriod(e.target.value)}
                  className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-line flex items-center justify-end gap-3 bg-surface">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditModalOpen(false)}
              >
                {t('landlordAssetsBtnCancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleSaveEditAsset}
              >
                {t('landlordAssetsBtnSave')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MAINTENANCE LOG MODAL */}
      {isLogModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIsLogModalOpen(false)
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <h3 className="font-black text-base text-foreground">
                {t('landlordAssetsDetailLogModalTitle')}
              </h3>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsLogModalOpen(false)}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>

            <div className="space-y-3 text-xs">
              <SelectInput
                label={t('landlordAssetsDetailLogType')}
                value={logType}
                onChange={e => setLogType(e.target.value)}
                className="px-3 py-2 font-semibold border border-line rounded-xl outline-none"
                options={[
                  { value: 'Bảo dưỡng định kỳ', label: t('landlordAssetsDetailLogTypeRoutine') },
                  { value: 'Sửa chữa linh kiện', label: t('landlordAssetsDetailLogTypeRepair') },
                  { value: 'Vệ sinh & Nạp gas', label: t('landlordAssetsDetailLogTypeCleanGas') },
                  { value: 'Thay thế mới', label: t('landlordAssetsDetailLogTypeReplace') },
                ]}
              />

              <TextareaInput
                label={`${t('landlordAssetsDetailLogDesc')} *`}
                rows={2}
                placeholder={t('landlordAssetsDetailLogDescPh')}
                value={logDescription}
                onChange={e => setLogDescription(e.target.value)}
                className="px-3 py-2 font-semibold border border-line rounded-xl outline-none resize-none"
              />

              <TextInput
                label={t('landlordAssetsDetailLogCost')}
                type="text"
                placeholder="VD: 250.000 ₫"
                value={logCost}
                onChange={e => setLogCost(e.target.value)}
                className="px-3 py-2 font-semibold border border-line rounded-xl outline-none"
              />

              <TextInput
                label={t('landlordAssetsDetailLogPerformer')}
                type="text"
                placeholder={t('landlordAssetsDetailLogPerformerPh')}
                value={logPerformer}
                onChange={e => setLogPerformer(e.target.value)}
                className="px-3 py-2 font-semibold border border-line rounded-xl outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsLogModalOpen(false)}
              >
                {t('landlordAssetsBtnCancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleAddMaintenanceLog}
              >
                {t('landlordAssetsDetailLogSaveBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM MODAL */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
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
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!isOpen) return null
  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-line p-6 space-y-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-500/10 text-amber-500 border border-warning-subtle mx-auto flex items-center justify-center shadow-inner">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          <p className="text-xs text-muted font-medium leading-relaxed">{message}</p>
        </div>
        <div className="grid grid-cols-2 gap-2.5 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            variant="warning"
            size="sm"
            onClick={onConfirm}
          >
            OK
          </Button>
        </div>
      </div>
    </div>
  )
}

function AlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
}: {
  isOpen: boolean
  title: string
  message: string
  type?: 'warning' | 'error' | 'success' | 'info'
  onClose: () => void
}) {
  const t = useTranslations('landlord')
  if (!isOpen) return null
  const config = {
    warning: {
      bgColor: 'bg-amber-500/10 text-amber-600 border-warning-subtle',
      icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
      btnColor: 'bg-amber-500 text-white',
    },
    error: {
      bgColor: 'bg-rose-500/10 text-rose-600 border-danger-subtle',
      icon: <AlertCircle className="w-7 h-7 text-rose-500" />,
      btnColor: 'bg-rose-500 text-white',
    },
    success: {
      bgColor: 'bg-emerald-500/10 text-emerald-600 border-success-subtle',
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      btnColor: 'bg-emerald-500 text-white',
    },
    info: {
      bgColor: 'bg-accent-soft text-accent border-accent-subtle',
      icon: <Info className="w-7 h-7 text-accent" />,
      btnColor: 'bg-accent text-white',
    },
  }[type]

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line p-6 space-y-4 text-center">
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}
        >
          {config.icon}
        </div>
        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          <p className="text-xs text-muted font-medium leading-relaxed">{message}</p>
        </div>
        <Button
          variant={
            type === 'warning'
              ? 'warning'
              : type === 'error'
                ? 'danger'
                : type === 'success'
                  ? 'success'
                  : 'orange'
          }
          size="sm"
          fullWidth
          onClick={onClose}
        >
          {t('landlordAssetsBtnUnderstood')}
        </Button>
      </div>
    </div>
  )
}
