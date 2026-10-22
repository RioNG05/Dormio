'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Edit3,
  Trash2,
  DollarSign,
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
  FilterToolbar,
  Card,
  TableRow,
  Modal,
  Text,
  Chip,
} from '@/components/ui'
import { ImageUpload } from '@/components/ImageUpload'
import { uploadImageToBackend } from '@/services/upload.service'
import { DashboardPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

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
  const [formImageUrl, setFormImageUrl] = useState('')
  const [formImagePreview, setFormImagePreview] = useState('')
  const [formNote, setFormNote] = useState('')
  const [inspectImageUrl, setInspectImageUrl] = useState<string | null>(null)

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
    imageUrl: '',
    imagePreview: '',
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
      formImageUrl !== initialFormState.imageUrl ||
      formImagePreview !== initialFormState.imagePreview ||
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
    formImageUrl,
    formImagePreview,
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
    setFormImageUrl('')
    setFormImagePreview('')
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
    setFormImageUrl('')
    setFormImagePreview('')
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
      imageUrl: '',
      imagePreview: '',
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
    const initImageUrl = asset.imageUrl || ''
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
    setFormImageUrl(initImageUrl)
    setFormImagePreview('')
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
      imageUrl: initImageUrl,
      imagePreview: '',
      note: initNote,
    })

    setIsModalOpen(true)
  }

  const handleImageSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = e => {
      const base64 = e.target?.result as string
      if (base64) {
        setFormImagePreview(base64)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleImageRemove = () => {
    setFormImagePreview('')
    setFormImageUrl('')
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
      let finalImageUrl: string | null | undefined = undefined

      // If user selected a new preview image (base64 data), upload it to Cloudinary now upon submit
      if (formImagePreview) {
        try {
          const uploadRes = await uploadImageToBackend(formImagePreview, 'dormio/assets')
          if (uploadRes?.url) {
            finalImageUrl = uploadRes.url
          }
        } catch (uploadErr: any) {
          console.error('Image upload failed on submit:', uploadErr)
          toast.error(uploadErr?.message || 'Không thể tải ảnh lên máy chủ. Vui lòng thử lại.')
          setIsSubmitting(false)
          return
        }
      } else if (selectedAsset) {
        finalImageUrl = formImageUrl.trim() ? formImageUrl.trim() : null
      } else {
        finalImageUrl = undefined
      }

      const payload = {
        name: formName.trim(),
        category: formCategory,
        location: formLocation.trim() || 'Chung',
        roomId: formRoomId || null,
        quantity: Number(formQuantity) || 1,
        condition: formCondition,
        purchasePrice: numVal,
        purchaseDate: formPurchaseDate ? new Date(formPurchaseDate).toISOString() : undefined,
        imageUrl: finalImageUrl,
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
          'px-3 py-2 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[130px]',
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
      <DashboardPageHeader
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
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordAssetsSearchPh')}
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full space-y-0"
            className="py-2 text-xs font-semibold"
          />
        }
        filters={
          <>
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
              containerClassName="w-full sm:w-auto shrink-0 space-y-0 min-w-[150px]"
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
          </>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

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
                  <Card
                    key={asset.id}
                    onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                    className="space-y-3.5 relative group flex flex-col justify-between"
                  >
                    {/* Top Asset Photo Banner */}
                    <Card.Header className="mx-4 sm:mx-5 mt-4 sm:mt-5 p-0 border-0">
                    <div className="w-full aspect-[16/10] rounded-xl overflow-hidden relative border border-line bg-surface shrink-0 group/img">
                      {asset.imageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={asset.imageUrl}
                          alt={asset.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-muted/50 bg-surface/50 gap-1.5">
                          <Package className="w-8 h-8 text-zinc-300" />
                          <span className="text-[10px] font-bold text-muted">{t('landlordAssetsNoImage')}</span>
                        </div>
                      )}
                      {/* Floating Category & SKU Chips */}
                      <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                        <Chip size="xs" preventHover variant="neutral">
                          {getCategoryLabel(asset.category)}
                        </Chip>
                        <Chip size="xs" preventHover variant="primary" className="font-mono">
                          {asset.code}
                        </Chip>
                      </div>
                      {/* Floating Condition Badge */}
                      <div className="absolute top-2 right-2 z-10">
                        <Chip
                          size="xs"
                          preventHover
                          variant={
                            asset.condition === 'good'
                              ? 'primary'
                              : asset.condition === 'new'
                                ? 'info'
                                : asset.condition === 'under_repair'
                                  ? 'accent'
                                  : 'danger'
                          }
                        >
                          {getStatusLabel(asset.condition)}
                        </Chip>
                      </div>
                    </div>
                    </Card.Header>

                    <Card.Body className="px-4 sm:px-5 py-0 space-y-3">
                      <div>
                        <Text
                          as="h3"
                          size="base"
                          weight="black"
                          color="default"
                          className="group-hover:text-primary transition-colors leading-snug"
                        >
                          {asset.name}
                        </Text>
                        {asset.quantity > 1 && (
                          <Text as="span" size="2xs" weight="bold" color="secondary" className="block mt-0.5">
                            {t('landlordAssetsQuantityCount', { count: asset.quantity })}
                          </Text>
                        )}
                      </div>

                      <div className="p-3 bg-surface rounded-xl space-y-2">
                        <div className="flex justify-between items-center">
                          <Text as="span" size="xs" color="secondary" weight="medium">
                            {t('landlordAssetsLocation')}
                          </Text>
                          <Text
                            as="span"
                            size="xs"
                            weight="bold"
                            color="default"
                            className="bg-card px-2 py-0.5 rounded-md border border-line"
                          >
                            {asset.roomName || asset.location}
                          </Text>
                        </div>
                        <div className="flex justify-between items-center">
                          <Text as="span" size="xs" color="secondary" weight="medium">
                            {t('landlordAssetsOriginalValueLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" color="default">
                            {asset.purchasePrice
                              ? `${Number(asset.purchasePrice).toLocaleString('vi-VN')} ₫`
                              : '0 ₫'}
                          </Text>
                        </div>
                        <div className="flex justify-between items-center">
                          <Text as="span" size="xs" color="secondary" weight="medium">
                            {t('landlordAssetsCurrentValueLabel')}
                          </Text>
                          <div className="flex items-center gap-1">
                            <Text as="span" size="xs" weight="black" color="brand">
                              {dep.currentValue.toLocaleString('vi-VN')} ₫
                            </Text>
                            <Text as="span" size="3xs" color="secondary">
                              ({dep.remainingPercent}%)
                            </Text>
                          </div>
                        </div>
                      </div>
                    </Card.Body>

                    <Card.Footer className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-0 pt-2 flex items-center justify-end gap-1 text-xs">
                      <Button
                        variant="secondary"
                        onClick={e => handleOpenEditModal(asset, e)}
                        leftIcon={<Edit3 className="text-primary" />}
                      >
                        {t('landlordAssetsBtnEditSku')}
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        onClick={e => handleOpenDeleteModal(asset, e)}
                        leftIcon={<Trash2 />}
                      >
                        {t('landlordAssetsBtnDelete')}
                      </Button>
                    </Card.Footer>
                  </Card>
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
                  <th className="px-4 sm:px-6 py-3.5 min-w-[70px]">{t('landlordAssetsColImage')}</th>
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
                    <td colSpan={9} className="px-6 py-8 text-center text-muted">
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
                      <TableRow
                        key={asset.id}
                        onClick={() => router.push(`/landlord/assets/${asset.id}`)}
                        className="hover:bg-card-hover transition-colors duration-150 cursor-pointer group"
                      >
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" weight="black" color="brand" mono>
                            {asset.code}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-3 whitespace-nowrap">
                          {asset.imageUrl ? (
                            <div
                              onClick={e => {
                                e.stopPropagation()
                                setInspectImageUrl(asset.imageUrl || null)
                              }}
                              className="w-10 h-10 rounded-xl overflow-hidden border border-line bg-surface cursor-pointer hover:border-primary transition-all relative group/thumb shadow-2xs"
                              title={t('landlordAssetsInspectImage')}
                            >
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={asset.imageUrl}
                                alt={asset.name}
                                className="w-full h-full object-cover group-hover/thumb:scale-110 transition-transform duration-200"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl border border-dashed border-line bg-surface/50 flex items-center justify-center text-muted/40">
                              <Package className="w-4 h-4 text-zinc-300" />
                            </div>
                          )}
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text
                            as="span"
                            size="xs"
                            weight="bold"
                            color="default"
                            className="group-hover:text-primary transition-colors"
                          >
                            {asset.name}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" color="secondary">
                            {getCategoryLabel(asset.category)}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" weight="bold" color="default">
                            {asset.roomName || asset.location}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" weight="bold" color="default">
                            {asset.purchasePrice
                              ? `${Number(asset.purchasePrice).toLocaleString('vi-VN')} ₫`
                              : '0 ₫'}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" weight="black" color="brand">
                            {dep.currentValue.toLocaleString('vi-VN')} ₫
                          </Text>
                          <Text as="span" size="3xs" color="secondary" weight="medium" className="block">
                            {t('landlordAssetsRemaining')} {dep.remainingPercent}%
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Chip
                            size="sm"
                            preventHover
                            variant={
                              asset.condition === 'good'
                                ? 'primary'
                                : asset.condition === 'new'
                                  ? 'info'
                                  : asset.condition === 'under_repair'
                                    ? 'accent'
                                    : 'danger'
                            }
                          >
                            {getStatusLabel(asset.condition)}
                          </Chip>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                          <div
                            className="flex items-center justify-end gap-1.5"
                            onClick={e => e.stopPropagation()}
                          >
                            <Button
                              variant="secondary"
                              size="icon-sm"
                              onClick={e => handleOpenEditModal(asset, e)}
                              title={t('landlordAssetsBtnEdit')}
                            >
                              <Edit3 />
                            </Button>
                            <Button
                              variant="ghost-danger"
                              size="icon-sm"
                              onClick={e => handleOpenDeleteModal(asset, e)}
                              title={t('landlordAssetsBtnDelete')}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                        </td>
                      </TableRow>
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

            {/* Asset Photo Upload (1 image - deferred preview until submit) */}
            <div className="sm:col-span-2 pt-1">
              <ImageUpload
                label={t('landlordAssetsFieldImage')}
                helperText={t('landlordAssetsFieldImageHelper')}
                value={formImagePreview || formImageUrl}
                onFileSelect={handleImageSelect}
                onRemove={handleImageRemove}
                aspectRatio="video"
                disabled={isSubmitting}
                showInspectButton={Boolean(formImagePreview || formImageUrl)}
                onInspect={url => setInspectImageUrl(url)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer className="p-4 border-t border-line flex items-center justify-end gap-3 bg-surface">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRequestCloseModal}
            disabled={isSubmitting}
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

      {/* 4. ASSET IMAGE LIGHTBOX PREVIEW MODAL */}
      <Modal
        isOpen={Boolean(inspectImageUrl)}
        onClose={() => setInspectImageUrl(null)}
        size="lg"
        zIndex={80}
      >
        <Modal.Header
          title={t('landlordAssetsInspectImage')}
          onClose={() => setInspectImageUrl(null)}
        />
        <Modal.Body className="p-4 flex items-center justify-center bg-black/5 dark:bg-black/40">
          {inspectImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={inspectImageUrl}
              alt="Asset full size"
              className="max-h-[75vh] w-auto max-w-full rounded-xl object-contain shadow-lg"
            />
          )}
        </Modal.Body>
      </Modal>
    </div>
  )
}
