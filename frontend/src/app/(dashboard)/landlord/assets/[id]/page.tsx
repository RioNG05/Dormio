'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Package,
  Wrench,
  Calendar,
  Home,
  User,
  Plus,
  Edit3,
  Trash2,
  Clock,
  ChevronRight,
  Info,
  BarChart3,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { Asset, MaintenanceLog, calculateDepreciation } from '../data'
import { assetService, AssetCondition } from '@/services/asset.service'
import { getRooms, RoomItem } from '@/services/room.service'
import {
  Button,
  TextInput,
  SelectInput,
  TextareaInput,
  Modal,
  Text,
} from '@/components/ui'
import { resolveErrorMessage, formatCurrency, formatDate } from '@/utils'

// Mock Room Tenants dictionary for tenant reflection when room matches
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
  const tErrors = useTranslations('errors')
  const { locale } = useLanguage()
  const { toast } = useToast()

  const mapStatusToCondition = (status: string): AssetCondition => {
    switch (status) {
      case 'under_repair':
      case 'Bảo trì':
        return 'under_repair'
      case 'new':
      case 'Sẵn sàng':
        return 'new'
      case 'damaged':
      case 'Hỏng hóc':
        return 'damaged'
      case 'lost':
      case 'Đã mất':
        return 'lost'
      case 'disposed':
      case 'Đã thanh lý':
        return 'disposed'
      case 'good':
      case 'Đang sử dụng':
      default:
        return 'good'
    }
  }

  const getStatusLabel = (conditionOrStatus?: string) => {
    switch (conditionOrStatus) {
      case 'good':
      case 'Đang sử dụng':
        return t('landlordAssetsStatusInUse')
      case 'new':
      case 'Sẵn sàng':
        return t('landlordAssetsStatusReady')
      case 'under_repair':
      case 'Bảo trì':
        return t('landlordAssetsStatusMaintenance')
      case 'damaged':
      case 'Hỏng hóc':
        return t('landlordAssetsStatusBroken')
      case 'lost':
      case 'Đã mất':
        return t('landlordAssetsStatusLost')
      case 'disposed':
      case 'Đã thanh lý':
        return t('landlordAssetsStatusDisposed')
      default:
        return conditionOrStatus || t('landlordAssetsStatusInUse')
    }
  }

  const getCategoryLabel = (category?: string | null) => {
    switch (category) {
      case 'Điện lạnh':
      case 'refrigeration':
        return t('landlordAssetsCatRefrigeration')
      case 'Nội thất':
      case 'furniture':
        return t('landlordAssetsCatFurniture')
      case 'Gia dụng':
      case 'appliances':
        return t('landlordAssetsCatAppliances')
      case 'Điện nước':
      case 'utilities':
        return t('landlordAssetsCatUtilities')
      case 'An ninh':
      case 'security':
        return t('landlordAssetsCatSecurity')
      default:
        return category || t('landlordAssetsCatGeneral')
    }
  }

  const getLogTypeLabel = (type: string) => {
    switch (type) {
      case 'routine':
      case 'Bảo dưỡng định kỳ':
        return t('landlordAssetsDetailLogTypeRoutine')
      case 'repair':
      case 'Sửa chữa linh kiện':
        return t('landlordAssetsDetailLogTypeRepair')
      case 'clean_gas':
      case 'Vệ sinh & Nạp gas':
        return t('landlordAssetsDetailLogTypeCleanGas')
      case 'replace':
      case 'Thay thế mới':
        return t('landlordAssetsDetailLogTypeReplace')
      default:
        return type
    }
  }

  // Data & Loading States
  const [asset, setAsset] = useState<Asset | null>(null)
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Maintenance Status Updating State
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false)

  // Maintenance Log Modal State
  const [maintenanceLogs, setMaintenanceLogs] = useState<MaintenanceLog[]>([])
  const [logPage, setLogPage] = useState(1)
  const logsPerPage = 2
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [logType, setLogType] = useState('Bảo dưỡng định kỳ')
  const [logDescription, setLogDescription] = useState('')
  const [logCost, setLogCost] = useState('200000')
  const [logPerformer, setLogPerformer] = useState('')

  // Edit Asset Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editSku, setEditSku] = useState('')
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('Điện lạnh')
  const [editRoomId, setEditRoomId] = useState<string>('')
  const [editLocation, setEditLocation] = useState('')
  const [editPurchaseValue, setEditPurchaseValue] = useState('8500000')
  const [editPurchaseDate, setEditPurchaseDate] = useState('2024-01-10')
  const [editDepreciationYears, setEditDepreciationYears] = useState(5)
  const [editCondition, setEditCondition] = useState<AssetCondition>('good')
  const [editModelCode, setEditModelCode] = useState('')
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editWarrantyPeriod, setEditWarrantyPeriod] = useState('')
  const [editSupplier, setEditSupplier] = useState('')

  // Delete Confirmation Modal State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load rooms for room selection
  useEffect(() => {
    if (!activeBuilding?.id) return
    getRooms(activeBuilding.id)
      .then(res => {
        setAvailableRooms(res.data || [])
      })
      .catch(err => {
        console.warn('Failed to load rooms for asset detail dropdown:', err)
      })
  }, [activeBuilding?.id])

  // Fetch asset details
  useEffect(() => {
    if (!id || !activeBuilding?.id) return

    setIsLoading(true)
    setLoadError(null)

    assetService
      .getAssetDetail(activeBuilding.id, String(id))
      .then(res => {
        if (res?.data) {
          const item = res.data
          const condition = item.condition || 'good'
          const numPrice = item.purchasePrice ? Number(item.purchasePrice) : 0

          setAsset({
            id: item.id,
            sku: item.code,
            name: item.name,
            category: item.category || 'Điện lạnh',
            building: activeBuilding.id,
            buildingName: activeBuilding.name,
            room: item.roomNumber
              ? t('landlordAssetsRoomPrefix', { room: item.roomNumber })
              : item.location || t('landlordAssetsRoomSharedOption'),
            roomId: item.roomId,
            status: getStatusLabel(condition),
            condition,
            dateAdded: item.createdAt ? item.createdAt.split('T')[0] : '',
            purchaseDate: item.purchaseDate ? item.purchaseDate.split('T')[0] : '',
            purchaseValue: numPrice,
            numericValue: numPrice,
            value: formatCurrency(numPrice, locale),
            note: item.note || '',
            maintenanceLogs: [],
          })
        }
      })
      .catch((err: unknown) => {
        const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsLoadFailed'))
        setLoadError(errorMsg)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [id, activeBuilding?.id, t, tErrors, locale])

  /**
   * UC-L-25: Change maintenance status by calling PATCH /v1/landlord/assets/:id
   * Toggles between maintenance ('under_repair') and normal operation ('good')
   */
  const handleStatusChange = async (targetStatusOrCondition?: string) => {
    if (!activeBuilding?.id || !id || !asset) {
      toast.error(t('landlordAssetsLoadFailed'))
      return
    }

    const isCurrentlyUnderRepair =
      asset.condition === 'under_repair' || asset.status === 'Bảo trì'

    let targetCondition: AssetCondition
    if (targetStatusOrCondition) {
      targetCondition = mapStatusToCondition(targetStatusOrCondition)
    } else {
      // Toggle maintenance status: if currently under repair -> good, otherwise -> under_repair
      targetCondition = isCurrentlyUnderRepair ? 'good' : 'under_repair'
    }

    setIsUpdatingStatus(true)
    try {
      const res = await assetService.updateAsset(activeBuilding.id, String(id), {
        condition: targetCondition,
      })

      const updatedCondition = res.data?.condition || targetCondition

      setAsset(prev =>
        prev
          ? {
              ...prev,
              status: getStatusLabel(updatedCondition),
              condition: updatedCondition,
            }
          : null,
      )

      if (updatedCondition === 'under_repair') {
        toast.success(t('landlordAssetsToastStatusMaintenanceSuccess'))
      } else {
        toast.success(t('landlordAssetsToastStatusNormalSuccess'))
      }
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsToastStatusError'))
      toast.error(errorMsg)
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  /**
   * Delete asset with permanent removal and redirect
   */
  const handleDeleteAsset = async () => {
    if (!activeBuilding?.id || !id) return
    setIsDeleting(true)
    try {
      await assetService.deleteAsset(activeBuilding.id, String(id))
      toast.success(t('landlordAssetsToastDeleteSuccess'))
      setShowDeleteModal(false)
      router.push('/landlord/assets')
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsDeleteFailed'))
      toast.error(errorMsg)
      setIsDeleting(false)
    }
  }

  /**
   * Open Edit Asset modal populated with current asset values
   */
  const handleOpenEditModal = () => {
    if (!asset) return
    setEditSku(asset.sku || asset.id)
    setEditName(asset.name)
    setEditCategory(asset.category)
    setEditRoomId(asset.roomId || '')
    setEditLocation(asset.room)
    setEditPurchaseValue(String(asset.numericValue || 0))
    setEditPurchaseDate(asset.purchaseDate || asset.dateAdded || '')
    setEditDepreciationYears(asset.depreciationYears || 5)
    setEditCondition((asset.condition as AssetCondition) || 'good')
    setEditModelCode(asset.modelCode || '')
    setEditSerialNumber(asset.serialNumber || '')
    setEditWarrantyPeriod(asset.warrantyPeriod || '')
    setEditSupplier(asset.supplier || '')
    setIsEditModalOpen(true)
  }

  /**
   * Save asset modifications to backend
   */
  const handleSaveEditAsset = async () => {
    if (!editName.trim()) {
      toast.warning(t('landlordAssetsFieldName'))
      return
    }

    if (!activeBuilding?.id || !id) return

    const numVal = parseInt(String(editPurchaseValue).replace(/\D/g, '')) || 0
    setIsSavingEdit(true)

    try {
      const res = await assetService.updateAsset(activeBuilding.id, String(id), {
        name: editName.trim(),
        category: editCategory,
        roomId: editRoomId || null,
        location: editLocation.trim() || 'Common Area',
        purchasePrice: numVal,
        purchaseDate: editPurchaseDate ? new Date(editPurchaseDate).toISOString() : undefined,
        condition: editCondition,
        note: asset?.note,
      })

      const updated = res.data
      const updatedCondition = updated?.condition || editCondition
      const numUpdatedPrice = updated?.purchasePrice ? Number(updated.purchasePrice) : numVal

      setAsset(prev =>
        prev
          ? {
              ...prev,
              name: updated?.name || editName.trim(),
              category: updated?.category || editCategory,
              room: updated?.roomNumber
                ? t('landlordAssetsRoomPrefix', { room: updated.roomNumber })
                : updated?.location || editLocation,
              roomId: updated?.roomId,
              value: formatCurrency(numUpdatedPrice, locale),
              numericValue: numUpdatedPrice,
              purchaseValue: numUpdatedPrice,
              purchaseDate: updated?.purchaseDate ? updated.purchaseDate.split('T')[0] : editPurchaseDate,
              status: getStatusLabel(updatedCondition),
              condition: updatedCondition,
              modelCode: editModelCode.trim(),
              serialNumber: editSerialNumber.trim(),
              warrantyPeriod: editWarrantyPeriod.trim(),
              supplier: editSupplier.trim(),
            }
          : null,
      )

      setIsEditModalOpen(false)
      toast.success(t('landlordAssetsToastEditSuccess'))
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsSaveFailed'))
      toast.error(errorMsg)
    } finally {
      setIsSavingEdit(false)
    }
  }

  /**
   * Add a new maintenance log record
   */
  const handleAddMaintenanceLog = () => {
    if (!logDescription.trim()) {
      toast.warning(t('landlordAssetsDetailLogDesc'))
      return
    }

    const numCost = parseInt(logCost.replace(/\D/g, '')) || 0
    const newLog: MaintenanceLog = {
      id: `LOG-${Date.now().toString().slice(-4)}`,
      date: formatDate(new Date(), locale),
      type: logType,
      description: logDescription.trim(),
      cost: formatCurrency(numCost, locale),
      performer: logPerformer.trim() || t('landlordAssetsDetailLogPerformerPh'),
    }

    setMaintenanceLogs(prev => [newLog, ...prev])
    setLogPage(1)
    setIsLogModalOpen(false)
    setLogDescription('')
    setLogPerformer('')
    toast.success(t('landlordAssetsDetailLogSaveBtn'))
  }

  // Loading indicator
  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted flex flex-col items-center justify-center min-h-[300px]">
        <Package className="w-12 h-12 mb-3 text-muted-foreground animate-pulse" />
        <p className="font-bold text-sm text-foreground">{t('landlordAssetsDetailLoading')}</p>
      </div>
    )
  }

  // Error or Not Found state
  if (loadError || !asset) {
    return (
      <div className="p-8 text-center space-y-4 max-w-md mx-auto">
        <div className="w-14 h-14 bg-danger-soft text-danger rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <div className="space-y-1">
          <h3 className="font-black text-lg text-foreground">
            {loadError || t('landlordAssetsLoadFailed')}
          </h3>
          <p className="text-xs text-muted font-medium">
            {t('landlordAssetsEmptySub')}
          </p>
        </div>
        <Link href="/landlord/assets">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            {t('landlordAssetsDetailBack')}
          </Button>
        </Link>
      </div>
    )
  }

  // Check if location is a tenant room
  const isTenantRoom = (roomStr: string) => {
    if (!roomStr) return false
    const trimmed = roomStr.trim()
    return /^\d+$/.test(trimmed) || /^p\d+/i.test(trimmed) || /^phòng\s*\d+/i.test(trimmed) || /^room\s*\d+/i.test(trimmed)
  }

  const hasRoomLink = isTenantRoom(asset.room)
  const roomKey = asset.room.replace(/\D/g, '')
  const currentTenant = mockRoomTenants[roomKey] || { name: 'Nguyễn Văn A', phone: '0901234567' }
  const dep = calculateDepreciation(asset)

  const isMaintenance = asset.condition === 'under_repair' || asset.status === t('landlordAssetsStatusMaintenance')
  const isGood = asset.condition === 'good' || asset.status === t('landlordAssetsStatusInUse')
  const isReady = asset.condition === 'new' || asset.status === t('landlordAssetsStatusReady')
  const isBroken = asset.condition === 'damaged' || asset.status === t('landlordAssetsStatusBroken')

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
        <ChevronRight className="w-3.5 h-3.5 text-line shrink-0" />
        <span className="text-foreground font-extrabold truncate">
          {asset.name} (SKU: {asset.sku || asset.id})
        </span>
      </div>

      {/* Main Asset Header Card */}
      <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
          <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-2xl bg-accent-soft border border-accent-subtle text-accent flex items-center justify-center shrink-0 shadow-2xs">
            <Package className="w-6 sm:w-8 h-6 sm:h-8" />
          </div>
          <div className="space-y-2 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-surface text-foreground/90 border border-line">
                {getCategoryLabel(asset.category)}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/30">
                SKU: {asset.sku || asset.id}
              </span>
              <span
                className={`px-2 sm:px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-extrabold border ${
                  isGood
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : isReady
                      ? 'bg-info-soft text-info border-info-subtle'
                      : isMaintenance
                        ? 'bg-warning-soft text-warning border-warning-subtle animate-pulse'
                        : isBroken
                          ? 'bg-danger-soft text-danger border-danger-subtle'
                          : 'bg-surface text-muted border-line'
                }`}
              >
                {getStatusLabel(asset.condition)}
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight leading-snug">
              {asset.name}
            </h1>

            {/* Location & Tenant sub-bar */}
            <div className="flex flex-wrap items-center gap-3.5 text-xs font-semibold text-muted pt-2 border-t border-line">
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-line">
                <Home className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {t('landlordAssetsDetailLocation')}{' '}
                  {hasRoomLink ? (
                    <Link
                      href={`/landlord/rooms?id=${roomKey || asset.room}`}
                      className="font-extrabold text-primary hover:underline hover:text-primary-hover transition-colors"
                    >
                      {asset.room}
                    </Link>
                  ) : (
                    <strong className="text-foreground font-extrabold">{asset.room}</strong>
                  )}
                </span>
              </div>

              {hasRoomLink && (
                <div className="flex items-center gap-1.5 bg-success-soft px-3 py-1.5 rounded-xl border border-success-subtle">
                  <User className="w-4 h-4 text-success shrink-0" />
                  <span>
                    {t('landlordAssetsDetailTenant')}{' '}
                    <Link
                      href="/landlord/customers"
                      className="font-extrabold text-success hover:underline hover:text-success/80 transition-colors"
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
          {/* Notice / Finish Maintenance Action Button */}
          <Button
            variant="warning"
            size="sm"
            onClick={() => handleStatusChange()}
            leftIcon={isUpdatingStatus ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wrench className="w-4 h-4" />}
            isLoading={isUpdatingStatus}
            disabled={isUpdatingStatus}
          >
            {isMaintenance
              ? t('landlordAssetsDetailBtnFinishMaintenance')
              : t('landlordAssetsDetailBtnSendMaintenance')}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenEditModal}
            leftIcon={<Edit3 className="w-4 h-4 text-primary" />}
          >
            {t('landlordAssetsBtnEdit')}
          </Button>

          <Button
            variant="danger"
            size="sm"
            onClick={() => setShowDeleteModal(true)}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {t('landlordAssetsBtnDelete')}
          </Button>
        </div>
      </div>

      {/* Grid Layout Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        {/* Left Column: Info + Valuation */}
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
                  {asset.modelCode || '—'}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailSerial')}
                </span>
                <span className="font-bold text-foreground">
                  {asset.serialNumber || '—'}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsFieldPurchaseDate')}
                </span>
                <span className="font-bold text-foreground">
                  {formatDate(asset.purchaseDate || asset.dateAdded, locale) || '—'}
                </span>
              </div>
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailWarranty')}
                </span>
                <span className="font-bold text-success">
                  {asset.warrantyPeriod || t('landlordAssetsDetailNotUpdated')}
                </span>
              </div>
            </div>
          </div>

          {/* Linear Depreciation Valuation Card */}
          <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-success" />
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {t('landlordAssetsDetailDepreciation')}
                  </h2>
                </div>
                <span className="text-[10px] font-black text-muted bg-surface px-2 py-1 rounded-lg border border-line">
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
                    {formatCurrency(asset.numericValue, locale)}
                  </span>
                  <span className="text-[10px] text-success font-medium block">
                    {t('landlordAssetsFieldPurchaseDate')}: {formatDate(asset.purchaseDate || asset.dateAdded, locale) || '—'}
                  </span>
                </div>

                <div className="p-3.5 sm:p-4 bg-warning-soft border border-warning-subtle rounded-2xl space-y-1">
                  <span className="text-warning font-medium block">
                    {t('landlordAssetsDetailAccumulatedDepreciation', {
                      percent: dep.depreciatedPercent,
                    })}
                  </span>
                  <span className="font-black text-warning text-base sm:text-lg">
                    - {formatCurrency(dep.accumulatedDepreciation, locale)}
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
                    {formatCurrency(dep.currentValue, locale)}
                  </span>
                  <span className="text-[10px] text-info font-medium block">
                    {t('landlordAssetsDetailMonthlyDepreciation', {
                      amount: formatCurrency(Math.round(dep.monthlyDepreciation), locale),
                    })}
                  </span>
                </div>
              </div>
            </div>

            {/* Visual Depreciation Progress Bar */}
            <div className="space-y-1.5 pt-2">
              <div className="flex justify-between text-xs font-extrabold text-foreground/90">
                <span>
                  {t('landlordAssetsDetailRemainingRatio', { percent: dep.remainingPercent })}
                </span>
                <span className="text-warning">
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

        {/* Right Column: Maintenance Logs Section */}
        <div className="lg:col-span-5 flex flex-col">
          <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4 flex-1 flex flex-col justify-between">
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-line shrink-0">
                <div className="flex items-center gap-2">
                  <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-warning shrink-0" />
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
                  <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning border border-warning-subtle flex items-center justify-center shadow-2xs">
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
                            {getLogTypeLabel(log.type)}
                          </span>
                          <span className="text-muted font-medium text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted inline shrink-0" />{' '}
                            {log.date}
                          </span>
                        </div>
                        <span className="font-black text-success text-xs sm:text-sm bg-success-soft px-2 py-0.5 rounded-md border border-success-subtle shrink-0">
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

      {/* EDIT ASSET MODAL */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        size="lg"
        zIndex={50}
        showCloseButton={true}
      >
        <Modal.Header
          title={`${t('landlordAssetsModalEditTitle')} [${editSku}]`}
          description={t('landlordAssetsModalSub')}
          icon={<Edit3 className="w-5 h-5 text-primary" />}
        />
        <Modal.Body className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <TextInput
              label={`${t('landlordAssetsFieldSku')} *`}
              type="text"
              value={editSku}
              disabled={true}
              className="px-3.5 py-2.5 text-xs font-bold border border-line rounded-xl uppercase font-mono opacity-80"
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
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
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
              value={editRoomId}
              onChange={e => {
                const selected = e.target.value
                setEditRoomId(selected)
                if (selected) {
                  const targetRoom = availableRooms.find(r => r.id === selected)
                  if (targetRoom) {
                    setEditLocation(t('landlordAssetsRoomPrefix', { room: targetRoom.roomNumber }))
                  }
                } else {
                  setEditLocation(t('landlordAssetsRoomSharedOption'))
                }
              }}
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
              options={[
                { value: '', label: t('landlordAssetsRoomSharedOption') },
                ...availableRooms.map(r => ({
                  value: r.id,
                  label: t('landlordAssetsRoomPrefix', { room: r.roomNumber }),
                })),
              ]}
            />

            <TextInput
              label={t('landlordAssetsFieldPurchaseValue')}
              type="number"
              value={editPurchaseValue}
              onChange={e => setEditPurchaseValue(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
            />

            <TextInput
              label={t('landlordAssetsFieldPurchaseDate')}
              type="date"
              value={editPurchaseDate}
              onChange={e => setEditPurchaseDate(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
            />

            <SelectInput
              label={t('landlordAssetsFieldStatus')}
              value={editCondition}
              onChange={e => setEditCondition(e.target.value as AssetCondition)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
              options={[
                { value: 'good', label: t('landlordAssetsStatusInUse') },
                { value: 'new', label: t('landlordAssetsStatusReady') },
                { value: 'under_repair', label: t('landlordAssetsStatusMaintenance') },
                { value: 'damaged', label: t('landlordAssetsStatusBroken') },
                { value: 'lost', label: t('landlordAssetsStatusLost') },
                { value: 'disposed', label: t('landlordAssetsStatusDisposed') },
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
              label={t('landlordAssetsFieldSerial')}
              type="text"
              value={editSerialNumber}
              onChange={e => setEditSerialNumber(e.target.value)}
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
        </Modal.Body>
        <Modal.Footer className="flex items-center justify-end gap-3 p-4 bg-surface border-t border-line">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(false)}
            disabled={isSavingEdit}
          >
            {t('landlordAssetsBtnCancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveEditAsset}
            isLoading={isSavingEdit}
          >
            {t('landlordAssetsBtnSave')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* MAINTENANCE LOG MODAL */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        size="md"
        zIndex={50}
        showCloseButton={true}
      >
        <Modal.Header
          title={t('landlordAssetsDetailLogModalTitle')}
          icon={<Wrench className="w-5 h-5 text-warning" />}
        />
        <Modal.Body className="p-4 sm:p-6 space-y-3 text-xs">
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
            type="number"
            placeholder="250000"
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
        </Modal.Body>
        <Modal.Footer className="flex justify-end gap-2 p-4 bg-surface border-t border-line">
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
        </Modal.Footer>
      </Modal>

      {/* DELETE ASSET CONFIRMATION MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        size="sm"
        zIndex={60}
        showCloseButton={false}
      >
        <Modal.Body className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-danger-soft text-danger rounded-2xl flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <Text as="h4" size="base" weight="black" color="default">
              {t('landlordAssetsDeleteConfirmTitle')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('landlordAssetsDeleteConfirmDesc', {
                name: asset?.name || '',
                code: asset?.sku || asset?.id || '',
              })}
            </Text>
          </div>

          {asset && (
            <div className="p-3 bg-surface border border-line rounded-xl text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{asset.sku || asset.id}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-line text-muted font-medium">
                  {getCategoryLabel(asset.category)}
                </span>
              </div>
              <p className="font-bold text-sm text-foreground truncate">{asset.name}</p>
              <div className="flex items-center justify-between text-muted text-[11px] pt-1 border-t border-line/60">
                <span>{asset.room}</span>
                {asset.numericValue ? (
                  <span className="font-bold text-foreground">
                    {formatCurrency(asset.numericValue, locale)}
                  </span>
                ) : null}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowDeleteModal(false)}
              className="flex-1"
              disabled={isDeleting}
            >
              {t('landlordAssetsBtnCancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDeleteAsset}
              className="flex-1"
              isLoading={isDeleting}
            >
              {t('landlordAssetsDeleteConfirmBtn')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}
