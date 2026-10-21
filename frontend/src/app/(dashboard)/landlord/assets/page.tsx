'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Eye,
  Edit3,
  Trash2,
  DollarSign,
  ArrowRight,
  BarChart3,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import { assetService, AssetItem, AssetCondition, AssetsSummary } from '@/services/asset.service'
import { getRooms, RoomItem } from '@/services/room.service'
import { calculateDepreciation } from './data'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  Pagination,
  ViewModeToggle,
  Modal,
  Text,
} from '@/components/ui'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

export default function AssetsPage() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')
  const { toast } = useToast()
  const tRef = useRef(t)

  useEffect(() => {
    tRef.current = t
  }, [t])

  // Data & Loading States
  const [assets, setAssets] = useState<AssetItem[]>([])
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [summary, setSummary] = useState<AssetsSummary>({
    totalItems: 0,
    totalQuantity: 0,
    totalValue: 0,
    goodConditionCount: 0,
    needsRepairCount: 0,
  })
  const [isLoading, setIsLoading] = useState<boolean>(true)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Pagination States (Rule #9: Grid=6, Table=10 default)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)
  const [totalRecords, setTotalRecords] = useState(0)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState(false)
  const [assetToDelete, setAssetToDelete] = useState<AssetItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form Field States
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('Điện lạnh')
  const [formRoomId, setFormRoomId] = useState<string>('')
  const [formLocation, setFormLocation] = useState('101')
  const [formQuantity, setFormQuantity] = useState<number>(1)
  const [formCondition, setFormCondition] = useState<AssetCondition>('good')
  const [formValue, setFormValue] = useState('3.000.000 ₫')
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [formNote, setFormNote] = useState('')

  // Initial Form Snapshot for dirty tracking (Rule #10)
  const [initialFormState, setInitialFormState] = useState({
    name: '',
    category: 'Điện lạnh',
    roomId: '',
    location: '101',
    quantity: 1,
    condition: 'good' as AssetCondition,
    value: '3.000.000 ₫',
    purchaseDate: new Date().toISOString().split('T')[0],
    note: '',
  })

  // Building Code Prefix for Asset ID
  const buildingPrefix = activeBuilding?.id ? activeBuilding.id.slice(0, 8).toUpperCase() : 'DORMIO'

  // Map condition to UI label
  const getStatusLabel = (cond: AssetCondition | string) => {
    switch (cond) {
      case 'new':
        return t('landlordAssetsStatusReady')
      case 'good':
        return t('landlordAssetsStatusInUse')
      case 'under_repair':
        return t('landlordAssetsStatusMaintenance')
      case 'damaged':
        return t('landlordAssetsStatusBroken')
      case 'lost':
        return t('landlordAssetsStatusLost')
      case 'disposed':
        return t('landlordAssetsStatusDisposed')
      default:
        return cond
    }
  }

  // Map UI status filter to backend condition
  const mapUiStatusToCondition = (uiStatus: string): string => {
    if (uiStatus === 'Đang sử dụng') return 'good'
    if (uiStatus === 'Sẵn sàng') return 'new'
    if (uiStatus === 'Bảo trì') return 'under_repair'
    if (uiStatus === 'Hỏng hóc') return 'damaged'
    return uiStatus
  }

  const getCategoryLabel = (category: string | null) => {
    if (!category) return t('landlordAssetsCatGeneral')
    if (category === 'Điện lạnh') return t('landlordAssetsCatRefrigeration')
    if (category === 'Nội thất') return t('landlordAssetsCatFurniture')
    if (category === 'Gia dụng') return t('landlordAssetsCatAppliances')
    if (category === 'Điện nước') return t('landlordAssetsCatUtilities')
    if (category === 'An ninh') return t('landlordAssetsCatSecurity')
    return category
  }

  // Fetch Rooms
  useEffect(() => {
    if (!activeBuilding?.id) return
    getRooms(activeBuilding.id)
      .then(res => {
        if (res && res.data) {
          setAvailableRooms(res.data)
        }
      })
      .catch(err => {
        console.error('Failed to load rooms:', err)
      })
  }, [activeBuilding?.id])

  // Fetch Assets from Backend API
  const fetchAssets = useCallback(async () => {
    if (!activeBuilding?.id) return
    setIsLoading(true)
    try {
      const conditionParam = statusFilter ? mapUiStatusToCondition(statusFilter) : undefined
      const res = await assetService.getAssets(activeBuilding.id, {
        search: searchQuery || undefined,
        category: categoryFilter || undefined,
        condition: conditionParam || undefined,
        page: currentPage,
        limit: itemsPerPage,
      })

      if (res && res.success) {
        setAssets(res.data || [])
        if (res.summary) {
          setSummary(res.summary)
        }
        if (res.pagination) {
          setTotalRecords(res.pagination.total)
        }
      }
    } catch (error: any) {
      console.error('Error loading assets:', error)
      toast.error(error?.message || tRef.current('landlordAssetsLoadFailed'))
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, searchQuery, categoryFilter, statusFilter, currentPage, itemsPerPage, toast])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  // Rule #10: Track dirty state to prevent accidental loss of changes
  const isFormDirty = useMemo(() => {
    if (!isModalOpen) return false
    return (
      formName !== initialFormState.name ||
      formCategory !== initialFormState.category ||
      formRoomId !== initialFormState.roomId ||
      formLocation !== initialFormState.location ||
      formQuantity !== initialFormState.quantity ||
      formCondition !== initialFormState.condition ||
      formValue !== initialFormState.value ||
      formPurchaseDate !== initialFormState.purchaseDate ||
      formNote !== initialFormState.note
    )
  }, [
    isModalOpen,
    initialFormState,
    formName,
    formCategory,
    formRoomId,
    formLocation,
    formQuantity,
    formCondition,
    formValue,
    formPurchaseDate,
    formNote,
  ])

  const resetAndCloseModal = () => {
    setIsModalOpen(false)
    setShowConfirmCloseModal(false)
    setSelectedAsset(null)
    setFormName('')
    setFormCategory('Điện lạnh')
    setFormRoomId('')
    setFormLocation('')
    setFormQuantity(1)
    setFormCondition('good')
    setFormValue('3.000.000 ₫')
    setFormPurchaseDate(new Date().toISOString().split('T')[0])
    setFormNote('')
  }

  const handleRequestCloseModal = () => {
    if (isFormDirty) {
      setShowConfirmCloseModal(true)
    } else {
      resetAndCloseModal()
    }
  }

  const handleOpenAddModal = () => {
    const initRoomId = availableRooms.length > 0 ? availableRooms[0].id : ''
    const initLocation =
      availableRooms.length > 0
        ? t('landlordAssetsRoomPrefix', { room: availableRooms[0].roomNumber })
        : t('landlordAssetsLocationStorage')
    const initDate = new Date().toISOString().split('T')[0]

    setSelectedAsset(null)
    setFormName('')
    setFormCategory('Điện lạnh')
    setFormRoomId(initRoomId)
    setFormLocation(initLocation)
    setFormQuantity(1)
    setFormCondition('good')
    setFormValue('3.000.000 ₫')
    setFormPurchaseDate(initDate)
    setFormNote('')

    setInitialFormState({
      name: '',
      category: 'Điện lạnh',
      roomId: initRoomId,
      location: initLocation,
      quantity: 1,
      condition: 'good',
      value: '3.000.000 ₫',
      purchaseDate: initDate,
      note: '',
    })

    setIsModalOpen(true)
  }

  const handleOpenEditModal = (asset: AssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const initVal = asset.purchasePrice
      ? `${Number(asset.purchasePrice).toLocaleString('vi-VN')} ₫`
      : '0 ₫'
    const initDate = asset.purchaseDate
      ? asset.purchaseDate.split('T')[0]
      : new Date().toISOString().split('T')[0]
    const initLocation = asset.location || asset.roomName || ''
    const initCategory = asset.category || 'Điện lạnh'
    const initRoomId = asset.roomId || ''
    const initQuantity = asset.quantity || 1
    const initCondition = asset.condition || 'good'
    const initNote = asset.note || ''

    setSelectedAsset(asset)
    setFormName(asset.name)
    setFormCategory(initCategory)
    setFormRoomId(initRoomId)
    setFormLocation(initLocation)
    setFormQuantity(initQuantity)
    setFormCondition(initCondition)
    setFormValue(initVal)
    setFormPurchaseDate(initDate)
    setFormNote(initNote)

    setInitialFormState({
      name: asset.name,
      category: initCategory,
      roomId: initRoomId,
      location: initLocation,
      quantity: initQuantity,
      condition: initCondition,
      value: initVal,
      purchaseDate: initDate,
      note: initNote,
    })

    setIsModalOpen(true)
  }

  const handleSaveAsset = async () => {
    if (!formName.trim()) {
      toast.warning(t('landlordAssetsNameRequired'))
      return
    }

    const numVal = parseInt(formValue.replace(/\D/g, '')) || 0
    if (!activeBuilding?.id) return

    setIsSubmitting(true)
    try {
      const payload = {
        name: formName.trim(),
        category: formCategory,
        location: formLocation.trim() || 'Chung',
        roomId: formRoomId || null,
        quantity: Number(formQuantity) || 1,
        condition: formCondition,
        purchasePrice: numVal,
        purchaseDate: formPurchaseDate ? new Date(formPurchaseDate).toISOString() : undefined,
        note: formNote.trim() || undefined,
      }

      if (selectedAsset) {
        await assetService.updateAsset(activeBuilding.id, selectedAsset.id, payload)
        toast.success(t('landlordAssetsToastEditSuccess'))
      } else {
        await assetService.createAsset(activeBuilding.id, payload)
        toast.success(t('landlordAssetsToastAddSuccess'))
      }

      resetAndCloseModal()
      fetchAssets()
    } catch (err: any) {
      console.error('Save asset error:', err)
      toast.error(err?.message || tRef.current('landlordAssetsSaveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenDeleteModal = (asset: AssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setAssetToDelete(asset)
  }

  const handleConfirmDeleteAsset = async () => {
    if (!assetToDelete || !activeBuilding?.id) return
    setIsDeleting(true)
    try {
      await assetService.deleteAsset(activeBuilding.id, assetToDelete.id)
      toast.success(t('landlordAssetsToastDeleteSuccess'))
      setAssetToDelete(null)
      fetchAssets()
    } catch (err: any) {
      console.error('Delete asset error:', err)
      toast.error(err?.message || tRef.current('landlordAssetsDeleteFailed'))
    } finally {
      setIsDeleting(false)
    }
  }

  // Financial Valuation Calculation (Original vs Depreciated Current Value)
  const totalPurchaseValueSum = summary.totalValue || 0
  const totalCurrentValueSum = assets.reduce((sum, a) => {
    const dep = calculateDepreciation({
      purchasePrice: a.purchasePrice,
      purchaseDate: a.purchaseDate,
      depreciationYears: 5,
    })
    return sum + dep.currentValue
  }, 0)

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordAssetsTotalAssetsShort'),
        value: t('landlordAssetsItemsCount', { count: summary.totalItems }),
        icon: <Package className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'inUse',
        label: t('landlordAssetsInUse'),
        value: summary.goodConditionCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[130px]',
        labelColor: 'brand',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'maintenance',
        label: t('landlordAssetsUnderMaintenance'),
        value: summary.needsRepairCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-accent/10 hover:bg-accent/20 border-accent/30 lg:w-[130px]',
        labelClassName: 'text-accent',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'quantity',
        label: t('landlordAssetsTotalQuantity'),
        value: summary.totalQuantity,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-vacant shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-vacant/10 hover:bg-vacant-hover border-vacant/30 lg:w-[130px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
    ],
    [t, summary],
  )

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar / Header */}
      <LandlordPageHeader
        title={t('landlordAssetsPageTitle')}
        subtitle={t('landlordAssetsPageSubtitle')}
        actions={
          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleOpenAddModal}
          >
            <Plus className="w-4 h-4" /> {t('landlordAssetsAddBtn')}
          </Button>
        }
      />

      {/* Building Overview Banner Card */}
      <LandlordStatBanner
        watermarkIcon={<Package className="w-64 h-64" />}
        chips={statChips}
      >
        <div className="px-3 py-1.5 bg-success-soft border border-success-subtle rounded-xl text-xs font-black text-success flex items-center gap-1.5">
          <DollarSign className="w-3.5 h-3.5 text-success" />
          <span>
            {t('landlordAssetsOriginalValueLabel')}{' '}
            {totalPurchaseValueSum.toLocaleString('vi-VN')} ₫
          </span>
        </div>

        <div className="px-3 py-1.5 bg-info-soft border border-info-subtle rounded-xl text-xs font-black text-info flex items-center gap-1.5">
          <BarChart3 className="w-3.5 h-3.5 text-info" />
          <span>
            {t('landlordAssetsCurrentValueLabel')} {totalCurrentValueSum.toLocaleString('vi-VN')}{' '}
            ₫
          </span>
        </div>
      </LandlordStatBanner>

      {/* Category Tabs & Financial Valuation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-line shadow-xs">
        {/* Category & Status Dropdowns */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <SelectInput
            value={categoryFilter}
            onChange={e => {
              setCategoryFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: t('landlordAssetsFilterAllCategories') },
              { value: 'Điện lạnh', label: t('landlordAssetsCatRefrigeration') },
              { value: 'Nội thất', label: t('landlordAssetsCatFurniture') },
              { value: 'Gia dụng', label: t('landlordAssetsCatAppliances') },
              { value: 'Điện nước', label: t('landlordAssetsCatUtilities') },
              { value: 'An ninh', label: t('landlordAssetsCatSecurity') },
            ]}
            containerClassName="w-full sm:w-auto shrink-0 space-y-0 min-w-[160px]"
            className="py-2 text-xs font-semibold"
          />

          <SelectInput
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: t('landlordAssetsFilterAllStatuses') },
              { value: 'Đang sử dụng', label: t('landlordAssetsStatusInUse') },
              { value: 'Sẵn sàng', label: t('landlordAssetsStatusReady') },
              { value: 'Bảo trì', label: t('landlordAssetsStatusMaintenance') },
              { value: 'Hỏng hóc', label: t('landlordAssetsStatusBroken') },
            ]}
            containerClassName="w-full sm:w-auto shrink-0 space-y-0 min-w-[150px]"
            className="py-2 text-xs font-semibold"
          />
        </div>

        <div className='flex gap-2 justify-center items-center'>
          <SearchInput
            placeholder={t('landlordAssetsSearchPh')}
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full min-w-80 sm:max-w-md space-y-0"
            className="py-2 text-xs font-semibold"
          />

          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            onPageSizeChange={setItemsPerPage}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-line rounded-2xl shadow-xs overflow-hidden">
        {/* Loading Indicator */}
        {isLoading ? (
          <div className="py-20 text-center text-muted font-medium">
            <Loader2 className="w-8 h-8 mx-auto text-primary animate-spin mb-3" />
            <p className="text-xs font-bold text-muted">{t('landlordAssetsLoading')}</p>
          </div>
        ) : viewMode === 'grid' ? (
          /* GRID VIEW */
          <div className="p-4 sm:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {assets.length === 0 ? (
              <div className="col-span-full py-12 text-center text-muted font-medium">
                <Package className="w-10 h-10 mx-auto text-zinc-300 mb-2" />
                {t('landlordAssetsEmptyTitle')}
              </div>
            ) : (
              assets.map(asset => {
                const dep = calculateDepreciation({
                  purchasePrice: asset.purchasePrice,
                  purchaseDate: asset.purchaseDate,
                  depreciationYears: 5,
                })
                return (
                  <div
                    key={asset.id}
                    onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                    className="bg-card rounded-2xl border border-line p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-primary/40 transition-all space-y-4 cursor-pointer relative group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-card-hover text-foreground/90 border border-line">
                            {getCategoryLabel(asset.category)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-primary/10 text-primary border border-primary/30">
                            {asset.code}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${asset.condition === 'good'
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : asset.condition === 'new'
                              ? 'bg-info-soft text-info border-info-subtle'
                              : asset.condition === 'under_repair'
                                ? 'bg-accent-soft text-accent border-accent-subtle animate-pulse'
                                : 'bg-danger-soft text-danger border-danger-subtle'
                            }`}
                        >
                          {getStatusLabel(asset.condition)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-foreground group-hover:text-primary transition-colors leading-snug">
                          {asset.name}
                        </h3>
                        {asset.quantity > 1 && (
                          <span className="text-[11px] font-bold text-muted block mt-0.5">
                            {t('landlordAssetsQuantityCount', { count: asset.quantity })}
                          </span>
                        )}
                      </div>

                      <div className="p-3 bg-surface rounded-xl space-y-2 text-xs">
                        <div className="flex justify-between items-center text-muted">
                          <span className="text-muted font-medium">
                            {t('landlordAssetsLocation')}
                          </span>
                          <span className="font-bold text-foreground bg-card px-2 py-0.5 rounded-md border border-line">
                            {asset.roomName || asset.location}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted">
                          <span className="text-muted font-medium">
                            {t('landlordAssetsOriginalValueLabel')}
                          </span>
                          <span className="font-bold text-foreground">
                            {asset.purchasePrice
                              ? `${Number(asset.purchasePrice).toLocaleString('vi-VN')} ₫`
                              : '0 ₫'}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-muted">
                          <span className="text-muted font-medium">
                            {t('landlordAssetsCurrentValueLabel')}
                          </span>
                          <span className="font-black text-accent">
                            {dep.currentValue.toLocaleString('vi-VN')} ₫{' '}
                            <span className="text-[10px] text-muted font-normal">
                              ({dep.remainingPercent}%)
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-line flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={e => handleOpenEditModal(asset, e)}
                          leftIcon={<Edit3 className="text-primary" />}
                        >
                          {t('landlordAssetsBtnEditSku')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost-danger"
                          size="icon-sm"
                          onClick={e => handleOpenDeleteModal(asset, e)}
                          title={t('landlordAssetsBtnDelete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <span className="text-xs font-black text-primary group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        {t('landlordAssetsBtnDetails')} <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        ) : (
          /* LIST VIEW TABLE */
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead className="bg-surface text-muted uppercase font-extrabold border-b border-line whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5">{t('landlordAssetsFieldSku')}</th>
                  <th className="px-4 sm:px-6 py-3.5">{t('landlordAssetsColName')}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px]">
                    {t('landlordAssetsColCategory')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px]">
                    {t('landlordAssetsColRoom')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">
                    {t('landlordAssetsColOriginalValue')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[180px]">
                    {t('landlordAssetsColCurrentValue')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">
                    {t('landlordAssetsColStatus')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px] text-right">
                    {t('landlordAssetsColActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {assets.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted">
                      {t('landlordAssetsEmptyTitle')}
                    </td>
                  </tr>
                ) : (
                  assets.map(asset => {
                    const dep = calculateDepreciation({
                      purchasePrice: asset.purchasePrice,
                      purchaseDate: asset.purchaseDate,
                      depreciationYears: 5,
                    })
                    return (
                      <tr
                        key={asset.id}
                        onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                        className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-black text-primary block font-mono">
                            {asset.code}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-foreground group-hover:text-primary transition-colors whitespace-nowrap">
                          {asset.name}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-muted whitespace-nowrap">
                          {getCategoryLabel(asset.category)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-foreground whitespace-nowrap">
                          {asset.roomName || asset.location}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-foreground whitespace-nowrap">
                          {asset.purchasePrice
                            ? `${Number(asset.purchasePrice).toLocaleString('vi-VN')} ₫`
                            : '0 ₫'}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-black text-success whitespace-nowrap">
                          {dep.currentValue.toLocaleString('vi-VN')} ₫
                          <span className="text-[10px] text-muted font-medium block">
                            {t('landlordAssetsRemaining')} {dep.remainingPercent}%
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block whitespace-nowrap ${asset.condition === 'good'
                              ? 'bg-primary/10 text-primary border-primary/30'
                              : asset.condition === 'new'
                                ? 'bg-info-soft text-info border-info-subtle'
                                : asset.condition === 'under_repair'
                                  ? 'bg-accent-soft text-accent border-accent-subtle animate-pulse'
                                  : 'bg-danger-soft text-danger border-danger-subtle'
                              }`}
                          >
                            {getStatusLabel(asset.condition)}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <Button
                              type="button"
                              variant="secondary"
                              size="xs"
                              onClick={e => handleOpenEditModal(asset, e)}
                              leftIcon={<Edit3 className="w-3 h-3 text-primary" />}
                            >
                              {t('landlordAssetsBtnEdit')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost-danger"
                              size="icon-xs"
                              onClick={e => handleOpenDeleteModal(asset, e)}
                              title={t('landlordAssetsBtnDelete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Link
                              href={`/landlord/assets/${asset.id}`}
                              className="px-2.5 py-1 bg-accent-soft text-accent border border-accent-subtle rounded-lg text-xs font-bold hover:bg-accent hover:text-white transition-colors flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" /> {t('landlordAssetsBtnViewDetail')}
                            </Link>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Standardized Dormio Pagination Footer with Custom Rows Per Page */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalRecords}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        unitLabel={t('landlordAssetsAssetsUnit')}
      />

      {/* ─── MODALS ──────────────────────────────────────────────────────────── */}

      {/* 1. ADD / EDIT ASSET MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleRequestCloseModal}
        size="2xl"
        asForm
        onSubmit={e => {
          e.preventDefault()
          handleSaveAsset()
        }}
      >
        <Modal.Header
          title={
            selectedAsset
              ? `${t('landlordAssetsModalEditTitle')} [${selectedAsset.code}]`
              : t('landlordAssetsModalAddTitle')
          }
          description={t('landlordAssetsModalSub')}
          icon={
            <div className="p-2 bg-accent-soft text-accent rounded-xl">
              <Package className="w-5 h-5 text-primary" />
            </div>
          }
          onClose={handleRequestCloseModal}
        />

        <Modal.Body className="p-4 sm:p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
            {/* Name */}
            <TextInput
              label={t('landlordAssetsFieldName')}
              required
              placeholder={t('landlordAssetsFieldNamePh')}
              value={formName}
              onChange={e => {
                setFormName(e.target.value)
              }}
              containerClassName="sm:col-span-2"
            />

            {/* Category */}
            <SelectInput
              label={t('landlordAssetsFieldCategory')}
              value={formCategory}
              onChange={e => {
                setFormCategory(e.target.value)
              }}
              options={[
                { value: 'Điện lạnh', label: t('landlordAssetsCatRefrigeration') },
                { value: 'Nội thất', label: t('landlordAssetsCatFurniture') },
                { value: 'Gia dụng', label: t('landlordAssetsCatAppliances') },
                { value: 'Điện nước', label: t('landlordAssetsCatUtilities') },
                { value: 'An ninh', label: t('landlordAssetsCatSecurity') },
              ]}
            />

            {/* Room Selection */}
            <SelectInput
              label={t('landlordAssetsFieldRoom')}
              value={formRoomId}
              onChange={e => {
                const selectedVal = e.target.value
                setFormRoomId(selectedVal)
                if (!selectedVal) {
                  setFormLocation(t('landlordAssetsLocationSharedOrStorage'))
                } else {
                  const targetRoom = availableRooms.find(r => r.id === selectedVal)
                  if (targetRoom) {
                    setFormLocation(
                      t('landlordAssetsRoomPrefix', { room: targetRoom.roomNumber }),
                    )
                  }
                }
              }}
              options={[
                { value: '', label: t('landlordAssetsRoomSharedOption') },
                ...availableRooms.map(room => ({
                  value: room.id,
                  label: t('landlordAssetsRoomPrefix', { room: room.roomNumber }),
                })),
              ]}
            />

            {/* Location Detail */}
            <TextInput
              label={t('landlordAssetsFieldLocationDetail')}
              placeholder={t('landlordAssetsFieldLocationDetailPh')}
              value={formLocation}
              onChange={e => {
                setFormLocation(e.target.value)
              }}
            />

            {/* Quantity */}
            <NumberInput
              label={t('landlordAssetsFieldQuantity')}
              min={1}
              value={formQuantity}
              onChange={e => {
                setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))
              }}
            />

            {/* Purchase Value */}
            <TextInput
              label={t('landlordAssetsFieldPurchaseValue')}
              placeholder="VD: 8.500.000 ₫"
              value={formValue}
              onChange={e => {
                setFormValue(e.target.value)
              }}
            />

            {/* Purchase Date */}
            <TextInput
              type="date"
              label={t('landlordAssetsFieldPurchaseDate')}
              value={formPurchaseDate}
              onChange={e => {
                setFormPurchaseDate(e.target.value)
              }}
            />

            {/* Condition / Status */}
            <SelectInput
              label={t('landlordAssetsFieldStatus')}
              value={formCondition}
              onChange={e => {
                setFormCondition(e.target.value as AssetCondition)
              }}
              options={[
                { value: 'good', label: t('landlordAssetsStatusInUse') },
                { value: 'new', label: t('landlordAssetsStatusReady') },
                { value: 'under_repair', label: t('landlordAssetsStatusMaintenance') },
                { value: 'damaged', label: t('landlordAssetsStatusBroken') },
                { value: 'lost', label: t('landlordAssetsStatusLost') },
                { value: 'disposed', label: t('landlordAssetsStatusDisposed') },
              ]}
            />

            {/* Note */}
            <TextareaInput
              label={t('landlordAssetsFieldNoteWarranty')}
              rows={2}
              placeholder={t('landlordAssetsFieldNoteWarrantyPh')}
              value={formNote}
              onChange={e => {
                setFormNote(e.target.value)
              }}
              containerClassName="sm:col-span-2"
              className="resize-none"
            />
          </div>
        </Modal.Body>

        <Modal.Footer className="p-4 border-t border-line flex items-center justify-end gap-3 bg-surface">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRequestCloseModal}
          >
            {t('landlordAssetsBtnCancel')}
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            {t('landlordAssetsModalBtnSave')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 2. RULE #10 UNSAVED CHANGES CONFIRMATION MODAL */}
      <Modal
        isOpen={showConfirmCloseModal}
        onClose={() => setShowConfirmCloseModal(false)}
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
              onClick={() => setShowConfirmCloseModal(false)}
              className="flex-1"
            >
              {t('landlordAssetsConfirmCloseKeep')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={resetAndCloseModal}
              className="flex-1"
            >
              {t('landlordAssetsConfirmCloseDiscard')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* 3. DELETE ASSET CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(assetToDelete)}
        onClose={() => setAssetToDelete(null)}
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
                name: assetToDelete?.name || '',
                code: assetToDelete?.code || '',
              })}
            </Text>
          </div>

          {assetToDelete && (
            <div className="p-3 bg-surface border border-line rounded-xl text-left space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-primary">{assetToDelete.code}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-card border border-line text-muted font-medium">
                  {getCategoryLabel(assetToDelete.category)}
                </span>
              </div>
              <p className="font-bold text-sm text-foreground truncate">{assetToDelete.name}</p>
              <div className="flex items-center justify-between text-muted text-[11px] pt-1 border-t border-line/60">
                <span>{assetToDelete.roomName || assetToDelete.location}</span>
                {assetToDelete.purchasePrice && (
                  <span className="font-bold text-foreground">
                    {Number(assetToDelete.purchasePrice).toLocaleString('vi-VN')} ₫
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setAssetToDelete(null)}
              className="flex-1"
              disabled={isDeleting}
            >
              {t('landlordAssetsBtnCancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              onClick={handleConfirmDeleteAsset}
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
