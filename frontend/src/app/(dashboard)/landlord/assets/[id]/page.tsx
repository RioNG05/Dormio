'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
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
  QrCode,
  Printer,
  CheckCircle2,
  Copy,
  Check,
  Phone,
  Mail,
  ShieldCheck,
  Building,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { calculateDepreciation } from '../data'
import {
  assetService,
  AssetCondition,
  AssetItem,
  AssetMaintenanceLog,
} from '@/services/asset.service'
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

export default function AssetDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const tErrors = useTranslations('errors')
  const { locale } = useLanguage()
  const { toast } = useToast()

  // ─── Data & Loading States ────────────────────────────────────────────────
  const [asset, setAsset] = useState<AssetItem | null>(null)
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  // Maintenance Logs State
  const [maintenanceLogs, setMaintenanceLogs] = useState<AssetMaintenanceLog[]>([])
  const [totalMaintenanceCost, setTotalMaintenanceCost] = useState<number>(0)
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false)

  // Maintenance Action Status Updating
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false)

  // ─── Modal States ──────────────────────────────────────────────────────────
  // 1. Edit Asset Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isSavingEdit, setIsSavingEdit] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('Điện lạnh')
  const [editRoomId, setEditRoomId] = useState<string>('')
  const [editLocation, setEditLocation] = useState('')
  const [editPurchasePrice, setEditPurchasePrice] = useState('0')
  const [editPurchaseDate, setEditPurchaseDate] = useState('')
  const [editDepreciationYears, setEditDepreciationYears] = useState(5)
  const [editCondition, setEditCondition] = useState<AssetCondition>('good')
  const [editModelCode, setEditModelCode] = useState('')
  const [editSerialNumber, setEditSerialNumber] = useState('')
  const [editWarrantyPeriod, setEditWarrantyPeriod] = useState('')
  const [editSupplier, setEditSupplier] = useState('')
  const [editNote, setEditNote] = useState('')

  // 2. Maintenance Log Modal (Create / Finish Maintenance)
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isSavingLog, setIsSavingLog] = useState(false)
  const [logType, setLogType] = useState('routine')
  const [logDescription, setLogDescription] = useState('')
  const [logCost, setLogCost] = useState('')
  const [logPerformer, setLogPerformer] = useState('')
  const [logPerformedAt, setLogPerformedAt] = useState(new Date().toISOString().split('T')[0])
  const [logSetCondition, setLogSetCondition] = useState<AssetCondition | ''>('')

  // 3. Delete Asset Modal
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // 4. Delete Log Modal
  const [logToDelete, setLogToDelete] = useState<AssetMaintenanceLog | null>(null)
  const [isDeletingLog, setIsDeletingLog] = useState(false)

  // 5. QR Code / Tag Modal
  const [showTagModal, setShowTagModal] = useState(false)
  const [hasCopiedCode, setHasCopiedCode] = useState(false)

  // 6. Unsaved Changes Confirmation Modal (Rule #10)
  const [showConfirmCloseEditModal, setShowConfirmCloseEditModal] = useState(false)
  const [showConfirmCloseLogModal, setShowConfirmCloseLogModal] = useState(false)

  // ─── Status & Category Label Helpers ─────────────────────────────────────
  const getStatusLabel = useCallback(
    (conditionOrStatus?: string) => {
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
    },
    [t],
  )

  const getCategoryLabel = useCallback(
    (category?: string | null) => {
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
    },
    [t],
  )

  const getLogTypeLabel = useCallback(
    (type: string) => {
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
    },
    [t],
  )

  // ─── Data Fetching ────────────────────────────────────────────────────────
  // Load rooms for selection dropdown
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

  // Fetch asset details & maintenance logs
  const fetchAssetAndLogs = useCallback(async () => {
    if (!id || !activeBuilding?.id) return

    setIsLoading(true)
    setLoadError(null)

    try {
      const [assetRes, logsRes] = await Promise.all([
        assetService.getAssetDetail(activeBuilding.id, String(id)),
        assetService.getMaintenanceLogs(activeBuilding.id, String(id)).catch(() => ({
          success: true,
          data: [],
          totalCost: 0,
        })),
      ])

      if (assetRes?.data) {
        setAsset(assetRes.data)
      }

      if (logsRes?.data) {
        setMaintenanceLogs(logsRes.data)
        setTotalMaintenanceCost(logsRes.totalCost || 0)
      }
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsLoadFailed'))
      setLoadError(errorMsg)
    } finally {
      setIsLoading(false)
    }
  }, [id, activeBuilding?.id, tErrors, t])

  useEffect(() => {
    fetchAssetAndLogs()
  }, [fetchAssetAndLogs])

  // ─── Actions: Status & Maintenance Workflow ──────────────────────────────
  /**
   * Quick toggle maintenance or open maintenance recording modal
   */
  const handleInitiateMaintenanceWorkflow = () => {
    if (!asset) return

    const isCurrentlyUnderRepair = asset.condition === 'under_repair'

    if (isCurrentlyUnderRepair) {
      // Opening Complete Maintenance modal
      setLogType('repair')
      setLogDescription('')
      setLogCost('0')
      setLogPerformer('')
      setLogPerformedAt(new Date().toISOString().split('T')[0])
      setLogSetCondition('good')
      setIsLogModalOpen(true)
    } else {
      // Opening Report Maintenance modal
      setLogType('repair')
      setLogDescription('')
      setLogCost('0')
      setLogPerformer('')
      setLogPerformedAt(new Date().toISOString().split('T')[0])
      setLogSetCondition('under_repair')
      setIsLogModalOpen(true)
    }
  }

  /**
   * Save a new maintenance log record
   */
  const handleSaveMaintenanceLog = async () => {
    if (!logDescription.trim()) {
      toast.warning(t('landlordAssetsDetailLogDesc'))
      return
    }

    if (!activeBuilding?.id || !id) return

    const numCost = parseInt(String(logCost).replace(/\D/g, '')) || 0
    setIsSavingLog(true)

    try {
      const payload = {
        type: logType,
        description: logDescription.trim(),
        cost: numCost,
        performer: logPerformer.trim() || undefined,
        performedAt: logPerformedAt ? new Date(logPerformedAt).toISOString() : new Date().toISOString(),
        setCondition: logSetCondition ? (logSetCondition as AssetCondition) : undefined,
      }

      const res = await assetService.createMaintenanceLog(activeBuilding.id, String(id), payload)

      if (res.data) {
        setMaintenanceLogs(prev => [res.data, ...prev])
        setTotalMaintenanceCost(prev => prev + numCost)
      }

      if (logSetCondition && asset) {
        setAsset({
          ...asset,
          condition: logSetCondition as AssetCondition,
        })
      }

      setIsLogModalOpen(false)
      setShowConfirmCloseLogModal(false)
      toast.success(t('landlordAssetsDetailLogAddedSuccess'))
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsDetailLogAddFailed'))
      toast.error(errorMsg)
    } finally {
      setIsSavingLog(false)
    }
  }

  /**
   * Delete a maintenance log record
   */
  const handleConfirmDeleteLog = async () => {
    if (!activeBuilding?.id || !id || !logToDelete) return

    setIsDeletingLog(true)
    try {
      await assetService.deleteMaintenanceLog(activeBuilding.id, String(id), logToDelete.id)
      setMaintenanceLogs(prev => prev.filter(l => l.id !== logToDelete.id))
      setTotalMaintenanceCost(prev => Math.max(0, prev - Number(logToDelete.cost)))
      toast.success(t('landlordAssetsDetailLogDeleteSuccess'))
      setLogToDelete(null)
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsDetailLogDeleteFailed'))
      toast.error(errorMsg)
    } finally {
      setIsDeletingLog(false)
    }
  }

  // ─── Actions: Edit Asset ──────────────────────────────────────────────────
  const handleOpenEditModal = () => {
    if (!asset) return
    setEditName(asset.name || '')
    setEditCategory(asset.category || 'Điện lạnh')
    setEditRoomId(asset.roomId || '')
    setEditLocation(asset.location || '')
    setEditPurchasePrice(String(asset.purchasePrice || 0))
    setEditPurchaseDate(asset.purchaseDate ? asset.purchaseDate.split('T')[0] : '')
    setEditDepreciationYears(asset.depreciationYears || 5)
    setEditCondition(asset.condition || 'good')
    setEditModelCode(asset.modelCode || '')
    setEditSerialNumber(asset.serialNumber || '')
    setEditWarrantyPeriod(asset.warrantyPeriod || '')
    setEditSupplier(asset.supplier || '')
    setEditNote(asset.note || '')
    setIsEditModalOpen(true)
  }

  const isEditDirty = useMemo(() => {
    if (!asset) return false
    return (
      editName !== (asset.name || '') ||
      editCategory !== (asset.category || 'Điện lạnh') ||
      editRoomId !== (asset.roomId || '') ||
      editLocation !== (asset.location || '') ||
      parseInt(String(editPurchasePrice).replace(/\D/g, '')) !== (asset.purchasePrice || 0) ||
      editDepreciationYears !== (asset.depreciationYears || 5) ||
      editCondition !== asset.condition ||
      editModelCode !== (asset.modelCode || '') ||
      editSerialNumber !== (asset.serialNumber || '') ||
      editWarrantyPeriod !== (asset.warrantyPeriod || '') ||
      editSupplier !== (asset.supplier || '') ||
      editNote !== (asset.note || '')
    )
  }, [
    asset,
    editName,
    editCategory,
    editRoomId,
    editLocation,
    editPurchasePrice,
    editDepreciationYears,
    editCondition,
    editModelCode,
    editSerialNumber,
    editWarrantyPeriod,
    editSupplier,
    editNote,
  ])

  const handleRequestCloseEditModal = () => {
    if (isEditDirty) {
      setShowConfirmCloseEditModal(true)
    } else {
      setIsEditModalOpen(false)
    }
  }

  const handleDiscardAndCloseEdit = () => {
    setShowConfirmCloseEditModal(false)
    setIsEditModalOpen(false)
  }

  const handleSaveEditAsset = async () => {
    if (!editName.trim()) {
      toast.warning(t('landlordAssetsFieldName'))
      return
    }

    if (!activeBuilding?.id || !id) return

    const numVal = parseInt(String(editPurchasePrice).replace(/\D/g, '')) || 0
    setIsSavingEdit(true)

    try {
      const res = await assetService.updateAsset(activeBuilding.id, String(id), {
        name: editName.trim(),
        category: editCategory,
        roomId: editRoomId || null,
        location: editLocation.trim() || 'Common Area',
        purchasePrice: numVal,
        purchaseDate: editPurchaseDate ? new Date(editPurchaseDate).toISOString() : undefined,
        depreciationYears: Number(editDepreciationYears) || 5,
        condition: editCondition,
        modelCode: editModelCode.trim() || undefined,
        serialNumber: editSerialNumber.trim() || undefined,
        warrantyPeriod: editWarrantyPeriod.trim() || undefined,
        supplier: editSupplier.trim() || undefined,
        note: editNote.trim() || undefined,
      })

      if (res?.data) {
        setAsset(res.data)
      }

      setIsEditModalOpen(false)
      setShowConfirmCloseEditModal(false)
      toast.success(t('landlordAssetsToastEditSuccess'))
    } catch (err: unknown) {
      const errorMsg = resolveErrorMessage(err, tErrors, t('landlordAssetsSaveFailed'))
      toast.error(errorMsg)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ─── Actions: Delete Asset ────────────────────────────────────────────────
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

  // ─── Actions: Copy Asset Tag URL ──────────────────────────────────────────
  const handleCopyTagCode = () => {
    if (!asset) return
    const textToCopy = `${asset.code} - ${asset.name} (${asset.roomName})`
    navigator.clipboard.writeText(textToCopy).then(() => {
      setHasCopiedCode(true)
      toast.success(t('landlordAssetsDetailTagCopySuccess'))
      setTimeout(() => setHasCopiedCode(false), 2000)
    })
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="p-12 text-center text-muted flex flex-col items-center justify-center min-h-[360px]">
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
          <p className="text-xs text-muted font-medium">{t('landlordAssetsEmptySub')}</p>
        </div>
        <Link href="/landlord/assets">
          <Button variant="primary" size="sm" leftIcon={<ArrowLeft className="w-4 h-4" />}>
            {t('landlordAssetsDetailBack')}
          </Button>
        </Link>
      </div>
    )
  }

  // Depreciation calculations
  const dep = calculateDepreciation({
    purchasePrice: asset.purchasePrice,
    purchaseDate: asset.purchaseDate,
    depreciationYears: asset.depreciationYears || 5,
  })

  const isMaintenance = asset.condition === 'under_repair'
  const isGood = asset.condition === 'good'
  const isReady = asset.condition === 'new'
  const isBroken = asset.condition === 'damaged'

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
    `DORMIO:${asset.boardingHouseId}:${asset.id}:${asset.code}`,
  )}`

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
          {asset.name} (SKU: {asset.code})
        </span>
      </div>

      {/* Main Asset Header Card */}
      <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-start justify-between gap-4 sm:gap-6">
        <div className="flex items-start gap-3.5 sm:gap-4 min-w-0 flex-1">
          <div className="w-14 sm:w-16 h-14 sm:h-16 rounded-2xl bg-accent-soft border border-accent-subtle text-accent flex items-center justify-center shrink-0 shadow-2xs">
            <Package className="w-7 sm:w-8 h-7 sm:h-8" />
          </div>

          <div className="space-y-2 min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="px-2 sm:px-2.5 py-0.5 rounded-md text-[10px] sm:text-[11px] font-black uppercase tracking-wider bg-surface text-foreground/90 border border-line">
                {getCategoryLabel(asset.category)}
              </span>
              <span className="text-[10px] sm:text-xs font-black text-primary bg-primary/10 px-2 py-0.5 rounded-md border border-primary/30 font-mono">
                SKU: {asset.code}
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

            {/* Room Location & Live Tenant Sub-bar */}
            <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted pt-2 border-t border-line">
              <div className="flex items-center gap-1.5 bg-surface px-3 py-1.5 rounded-xl border border-line">
                <Home className="w-4 h-4 text-primary shrink-0" />
                <span>
                  {t('landlordAssetsDetailLocation')}{' '}
                  {asset.roomId ? (
                    <Link
                      href={`/landlord/rooms?id=${asset.roomId}`}
                      className="font-extrabold text-primary hover:underline hover:text-primary-hover transition-colors"
                    >
                      {asset.roomName}
                    </Link>
                  ) : (
                    <strong className="text-foreground font-extrabold">{asset.location}</strong>
                  )}
                </span>
              </div>

              {/* Resolved Active Tenant from Room */}
              {asset.roomId && (
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border ${
                    asset.tenant
                      ? 'bg-success-soft border-success-subtle text-success'
                      : 'bg-surface border-line text-muted'
                  }`}
                >
                  <User className="w-4 h-4 shrink-0" />
                  {asset.tenant ? (
                    <span>
                      {t('landlordAssetsDetailTenant')}{' '}
                      <Link
                        href="/landlord/customers"
                        className="font-extrabold text-success hover:underline hover:text-success/80 transition-colors"
                      >
                        {asset.tenant.name}
                      </Link>
                      {asset.tenant.phone && (
                        <span className="text-muted font-medium ml-1">
                          ({asset.tenant.phone})
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="italic font-medium">
                      {t('landlordAssetsDetailTenantVacant')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-line">
          {/* Notice / Finish Maintenance Action Button */}
          <Button
            variant={isMaintenance ? 'success' : 'warning'}
            size="sm"
            onClick={handleInitiateMaintenanceWorkflow}
            leftIcon={
              isUpdatingStatus ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Wrench className="w-4 h-4" />
              )
            }
            isLoading={isUpdatingStatus}
            disabled={isUpdatingStatus}
          >
            {isMaintenance
              ? t('landlordAssetsDetailBtnFinishMaintenance')
              : t('landlordAssetsDetailBtnSendMaintenance')}
          </Button>

          {/* QR / Inventory Tag Modal Trigger */}
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setShowTagModal(true)}
            leftIcon={<QrCode className="w-4 h-4 text-primary" />}
          >
            {t('landlordAssetsBtnTagQr')}
          </Button>

          {/* Edit Asset Button */}
          <Button
            variant="secondary"
            size="sm"
            onClick={handleOpenEditModal}
            leftIcon={<Edit3 className="w-4 h-4 text-primary" />}
          >
            {t('landlordAssetsBtnEdit')}
          </Button>

          {/* Delete Asset Button */}
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
        {/* Left Column: Info + Valuation + Tenant Profile Card */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-4 sm:space-y-6">
          {/* General Information Card */}
          <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-2">
                <Info className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-primary" />
                <h2 className="text-sm sm:text-base font-black text-foreground">
                  {t('landlordAssetsDetailGeneral')}
                </h2>
              </div>
              <span className="text-xs font-semibold text-muted">
                {t('landlordAssetsQuantityCount', { count: asset.quantity })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs">
              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailModel')}
                </span>
                <span className="font-bold text-foreground font-mono">
                  {asset.modelCode || '—'}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailSerial')}
                </span>
                <span className="font-bold text-foreground font-mono">
                  {asset.serialNumber || '—'}
                </span>
              </div>

              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsFieldPurchaseDate')}
                </span>
                <span className="font-bold text-foreground">
                  {asset.purchaseDate ? formatDate(asset.purchaseDate, locale) : '—'}
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

              <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1 sm:col-span-2">
                <span className="text-muted font-medium block">
                  {t('landlordAssetsDetailSupplier')}
                </span>
                <span className="font-bold text-foreground">
                  {asset.supplier || t('landlordAssetsDetailSupplierPh')}
                </span>
              </div>

              {asset.note && (
                <div className="p-3 sm:p-3.5 bg-surface rounded-2xl space-y-1 sm:col-span-2">
                  <span className="text-muted font-medium block">
                    {t('landlordAssetsFieldNote')}
                  </span>
                  <p className="font-medium text-foreground leading-relaxed">{asset.note}</p>
                </div>
              )}
            </div>
          </div>

          {/* Occupant Tenant Card (if room is rented) */}
          {asset.tenant && (
            <div className="bg-card border border-line rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-3 border-b border-line">
                <div className="flex items-center gap-2">
                  <User className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-success" />
                  <h2 className="text-sm sm:text-base font-black text-foreground">
                    {t('landlordAssetsDetailTenant')} {asset.roomName}
                  </h2>
                </div>
                {asset.tenant.contractId && (
                  <span className="text-[11px] font-mono font-bold text-success bg-success-soft px-2 py-0.5 rounded-md border border-success-subtle">
                    {t('landlordAssetsDetailContractPrefix', {
                      code: asset.tenant.contractId.slice(-6).toUpperCase(),
                    })}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="flex items-center gap-2.5 p-3 bg-surface rounded-2xl border border-line">
                  <div className="w-9 h-9 rounded-xl bg-success-soft text-success flex items-center justify-center font-black">
                    {asset.tenant.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-foreground truncate">{asset.tenant.name}</p>
                    {asset.tenant.phone && (
                      <a
                        href={`tel:${asset.tenant.phone}`}
                        className="text-muted hover:text-primary transition-colors flex items-center gap-1 font-medium"
                      >
                        <Phone className="w-3 h-3 text-muted" /> {asset.tenant.phone}
                      </a>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-2xl border border-line flex flex-col justify-center space-y-1">
                  {asset.tenant.email && (
                    <div className="flex items-center gap-1.5 text-muted truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">{asset.tenant.email}</span>
                    </div>
                  )}
                  {asset.tenant.startDate && asset.tenant.endDate && (
                    <div className="flex items-center gap-1.5 text-muted text-[11px]">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        {t('landlordAssetsDetailContractDuration', {
                          start: formatDate(asset.tenant.startDate, locale),
                          end: formatDate(asset.tenant.endDate, locale),
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <Link href="/landlord/customers">
                  <Button variant="outline" size="sm">
                    {t('landlordAssetsDetailViewTenant')}
                  </Button>
                </Link>
                {asset.tenant.contractId && (
                  <Link href="/landlord/contracts">
                    <Button variant="secondary" size="sm">
                      {t('landlordAssetsDetailViewContract')}
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          )}

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
                    {formatCurrency(asset.purchasePrice || 0, locale)}
                  </span>
                  <span className="text-[10px] text-success font-medium block">
                    {t('landlordAssetsFieldPurchaseDate')}:{' '}
                    {asset.purchaseDate ? formatDate(asset.purchaseDate, locale) : '—'}
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

        {/* Right Column: Maintenance Logs Section (Persistent DB records) */}
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
                  onClick={() => {
                    setLogType('routine')
                    setLogDescription('')
                    setLogCost('0')
                    setLogPerformer('')
                    setLogPerformedAt(new Date().toISOString().split('T')[0])
                    setLogSetCondition('')
                    setIsLogModalOpen(true)
                  }}
                  leftIcon={<Plus className="w-3.5 h-3.5" />}
                >
                  {t('landlordAssetsDetailAddMaintenanceBtn')}
                </Button>
              </div>

              {/* Maintenance Expenditure Summary */}
              {totalMaintenanceCost > 0 && (
                <div className="p-3 bg-surface border border-line rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-semibold text-muted">
                    {t('landlordAssetsDetailTotalMaintenanceCost')}
                  </span>
                  <span className="font-black text-foreground text-sm">
                    {formatCurrency(totalMaintenanceCost, locale)}
                  </span>
                </div>
              )}

              {/* Maintenance Logs List */}
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
                <div className="space-y-3 flex-1 min-h-0 overflow-y-auto pr-1 max-h-[460px]">
                  {maintenanceLogs.map(log => (
                    <div
                      key={log.id}
                      className="p-3.5 sm:p-4 bg-surface rounded-2xl border border-line space-y-2.5 text-xs transition-colors hover:border-line-hover"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="px-2 py-0.5 bg-warning-soft text-warning rounded-md font-extrabold text-[10px]">
                            {getLogTypeLabel(log.type)}
                          </span>
                          <span className="text-muted font-medium text-[11px] flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-muted inline shrink-0" />{' '}
                            {formatDate(log.performedAt, locale)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-success text-xs sm:text-sm bg-success-soft px-2 py-0.5 rounded-md border border-success-subtle shrink-0">
                            {formatCurrency(log.cost, locale)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setLogToDelete(log)}
                            title={t('landlordAssetsDetailLogDeleteBtn')}
                            className="text-muted hover:text-danger p-1 rounded-lg transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="font-bold text-foreground leading-relaxed text-xs sm:text-sm break-words">
                        {log.description}
                      </p>

                      <div className="text-[11px] text-muted font-medium pt-1.5 border-t border-line flex items-center justify-between">
                        <span>
                          {t('landlordAssetsDetailPerformer')}{' '}
                          <strong className="text-foreground/90">
                            {log.performer || t('landlordAssetsDetailNotUpdated')}
                          </strong>
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

      {/* ─── MODAL 1: EDIT ASSET MODAL ─────────────────────────────────────── */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleRequestCloseEditModal}
        size="lg"
        zIndex={50}
        showCloseButton={true}
      >
        <Modal.Header
          title={`${t('landlordAssetsModalEditTitle')} [${asset.code}]`}
          description={t('landlordAssetsModalSub')}
          icon={<Edit3 className="w-5 h-5 text-primary" />}
        />
        <Modal.Body className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            <TextInput
              label={`${t('landlordAssetsFieldSku')} *`}
              type="text"
              value={asset.code}
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
              value={editPurchasePrice}
              onChange={e => setEditPurchasePrice(e.target.value)}
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
              label={t('landlordAssetsFieldDepreciationYears')}
              type="number"
              min={1}
              value={String(editDepreciationYears)}
              onChange={e => setEditDepreciationYears(Number(e.target.value) || 1)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
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

            <TextInput
              label={t('landlordAssetsFieldSupplier')}
              type="text"
              value={editSupplier}
              onChange={e => setEditSupplier(e.target.value)}
              className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none"
            />

            <div className="sm:col-span-2">
              <TextareaInput
                label={t('landlordAssetsFieldNote')}
                rows={2}
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
                className="px-3.5 py-2.5 text-xs font-semibold border border-line rounded-xl focus:border-primary outline-none resize-none"
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex items-center justify-end gap-3 p-4 bg-surface border-t border-line">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRequestCloseEditModal}
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

      {/* ─── MODAL 2: MAINTENANCE LOG MODAL ────────────────────────────────── */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        size="md"
        zIndex={50}
        showCloseButton={true}
      >
        <Modal.Header
          title={
            logSetCondition === 'good'
              ? t('landlordAssetsDetailFinishMaintenanceModalTitle')
              : t('landlordAssetsDetailLogModalTitle')
          }
          description={
            logSetCondition === 'good'
              ? t('landlordAssetsDetailFinishMaintenanceDesc')
              : undefined
          }
          icon={<Wrench className="w-5 h-5 text-warning" />}
        />
        <Modal.Body className="p-4 sm:p-6 space-y-3.5 text-xs">
          <SelectInput
            label={t('landlordAssetsDetailLogType')}
            value={logType}
            onChange={e => setLogType(e.target.value)}
            className="px-3 py-2 font-semibold border border-line rounded-xl outline-none"
            options={[
              { value: 'routine', label: t('landlordAssetsDetailLogTypeRoutine') },
              { value: 'repair', label: t('landlordAssetsDetailLogTypeRepair') },
              { value: 'clean_gas', label: t('landlordAssetsDetailLogTypeCleanGas') },
              { value: 'replace', label: t('landlordAssetsDetailLogTypeReplace') },
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label={t('landlordAssetsDetailLogCost')}
              type="number"
              placeholder="0"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label={t('landlordAssetsColPurchaseDate')}
              type="date"
              value={logPerformedAt}
              onChange={e => setLogPerformedAt(e.target.value)}
              className="px-3 py-2 font-semibold border border-line rounded-xl outline-none"
            />

            <SelectInput
              label={t('landlordAssetsFieldConditionAfter')}
              value={logSetCondition}
              onChange={e => setLogSetCondition(e.target.value as AssetCondition | '')}
              className="px-3 py-2 font-semibold border border-line rounded-xl outline-none"
              options={[
                { value: '', label: t('landlordAssetsDetailConditionKeep') },
                { value: 'good', label: t('landlordAssetsStatusInUse') },
                { value: 'under_repair', label: t('landlordAssetsStatusMaintenance') },
                { value: 'damaged', label: t('landlordAssetsStatusBroken') },
                { value: 'new', label: t('landlordAssetsStatusReady') },
              ]}
            />
          </div>
        </Modal.Body>
        <Modal.Footer className="flex justify-end gap-2 p-4 bg-surface border-t border-line">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsLogModalOpen(false)}
            disabled={isSavingLog}
          >
            {t('landlordAssetsBtnCancel')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveMaintenanceLog}
            isLoading={isSavingLog}
          >
            {t('landlordAssetsDetailLogSaveBtn')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── MODAL 3: DELETE ASSET MODAL ───────────────────────────────────── */}
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
                code: asset?.code || '',
              })}
            </Text>
          </div>

          {asset && (
            <div className="p-3 bg-surface border border-line rounded-xl text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{asset.code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-line text-muted font-medium">
                  {getCategoryLabel(asset.category)}
                </span>
              </div>
              <p className="font-bold text-sm text-foreground truncate">{asset.name}</p>
              <div className="flex items-center justify-between text-muted text-[11px] pt-1 border-t border-line/60">
                <span>{asset.roomName}</span>
                {asset.purchasePrice ? (
                  <span className="font-bold text-foreground">
                    {formatCurrency(asset.purchasePrice, locale)}
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

      {/* ─── MODAL 4: DELETE MAINTENANCE LOG CONFIRMATION ──────────────────── */}
      <Modal
        isOpen={Boolean(logToDelete)}
        onClose={() => setLogToDelete(null)}
        size="sm"
        zIndex={65}
        showCloseButton={false}
      >
        <Modal.Body className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-danger-soft text-danger rounded-2xl flex items-center justify-center mx-auto">
            <Trash2 className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <Text as="h4" size="base" weight="black" color="default">
              {t('landlordAssetsDetailLogDeleteBtn')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('landlordAssetsDetailLogDeleteConfirm')}
            </Text>
          </div>

          {logToDelete && (
            <div className="p-3 bg-surface border border-line rounded-xl text-left space-y-1 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-warning">{getLogTypeLabel(logToDelete.type)}</span>
                <span className="font-mono text-muted text-[11px]">
                  {formatDate(logToDelete.performedAt, locale)}
                </span>
              </div>
              <p className="font-medium text-foreground line-clamp-2">{logToDelete.description}</p>
              <div className="font-black text-success pt-1">
                {formatCurrency(logToDelete.cost, locale)}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setLogToDelete(null)}
              className="flex-1"
              disabled={isDeletingLog}
            >
              {t('landlordAssetsBtnCancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteLog}
              className="flex-1"
              isLoading={isDeletingLog}
            >
              {t('landlordAssetsBtnDelete')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* ─── MODAL 5: ASSET TAG & QR CODE MODAL ────────────────────────────── */}
      <Modal
        isOpen={showTagModal}
        onClose={() => setShowTagModal(false)}
        size="md"
        zIndex={50}
        showCloseButton={true}
      >
        <Modal.Header
          title={t('landlordAssetsTagModalTitle')}
          description={t('landlordAssetsDetailPrintTagDesc')}
          icon={<QrCode className="w-5 h-5 text-primary" />}
        />
        <Modal.Body className="p-4 sm:p-6 space-y-4">
          <div className="p-4 sm:p-6 bg-card border-2 border-dashed border-primary/30 rounded-2xl flex flex-col items-center justify-center space-y-3.5 text-center shadow-xs">
            <div className="flex items-center gap-1.5 text-primary font-black text-xs uppercase tracking-wider">
              <Building className="w-4 h-4" />
              <span>{activeBuilding?.name || 'Dormio Boarding House'}</span>
            </div>

            <div className="p-3 bg-white rounded-2xl shadow-sm border border-line">
              <img
                src={qrImageUrl}
                alt={`QR code for ${asset.code}`}
                width={160}
                height={160}
                className="w-36 h-36 object-contain"
              />
            </div>

            <div className="space-y-1">
              <span className="text-xs font-mono font-black text-primary bg-primary/10 px-3 py-1 rounded-md border border-primary/20">
                {asset.code}
              </span>
              <h3 className="font-black text-base text-foreground pt-1">{asset.name}</h3>
              <p className="text-xs text-muted font-bold">{asset.roomName}</p>
            </div>

            <p className="text-[11px] text-muted max-w-xs">{t('landlordAssetsTagScanNote')}</p>
          </div>
        </Modal.Body>
        <Modal.Footer className="flex items-center justify-between p-4 bg-surface border-t border-line">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopyTagCode}
            leftIcon={hasCopiedCode ? <Check className="w-4 h-4 text-success" /> : <Copy className="w-4 h-4" />}
          >
            {hasCopiedCode ? t('landlordAssetsDetailTagCopySuccess') : asset.code}
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={() => window.print()}
            leftIcon={<Printer className="w-4 h-4" />}
          >
            {t('landlordAssetsTagPrintBtn')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* ─── MODAL 6: CONFIRM CLOSE MODAL FOR EDIT (Rule #10) ──────────────── */}
      <Modal
        isOpen={showConfirmCloseEditModal}
        onClose={() => setShowConfirmCloseEditModal(false)}
        size="sm"
        zIndex={70}
        showCloseButton={false}
      >
        <Modal.Body className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-warning-soft text-warning rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <Text as="h4" size="base" weight="black" color="default">
              {t('landlordAssetsConfirmCloseTitle')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('landlordAssetsConfirmCloseDesc')}
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowConfirmCloseEditModal(false)}
              className="flex-1"
            >
              {t('landlordAssetsConfirmCloseKeep')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleDiscardAndCloseEdit}
              className="flex-1"
            >
              {t('landlordAssetsConfirmCloseDiscard')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}
