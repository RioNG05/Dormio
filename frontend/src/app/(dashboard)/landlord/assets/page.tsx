'use client'

import React, { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Package,
  Search,
  Plus,
  Download,
  MoreHorizontal,
  CheckCircle2,
  AlertTriangle,
  Wrench,
  Box,
  Filter,
  Building2,
  ArrowUpDown,
  ChevronDown,
  UploadCloud,
  FileSpreadsheet,
  MapPin,
  Eye,
  Edit3,
  Trash2,
  Tag,
  ShieldCheck,
  Sparkles,
  LayoutGrid,
  List,
  DollarSign,
  Home,
  AlertCircle,
  Info,
  Calendar,
  ArrowRight,
  BarChart3,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { assetService, AssetItem, AssetCondition, AssetsSummary } from '@/services/asset.service'
import { getRooms, RoomItem } from '@/services/room.service'
import { calculateDepreciation } from './data'
import { Button, TextInput, NumberInput, SelectInput, TextareaInput, SearchInput, ChipGroup } from '@/components/ui'

export default function AssetsPage() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')
  const tRef = React.useRef(t)

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
  const [totalPages, setTotalPages] = useState(1)

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [selectedAsset, setSelectedAsset] = useState<AssetItem | null>(null)

  // Form Field States
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('Điện lạnh')
  const [formRoomId, setFormRoomId] = useState<string>('')
  const [formLocation, setFormLocation] = useState('101')
  const [formQuantity, setFormQuantity] = useState<number>(1)
  const [formCondition, setFormCondition] = useState<AssetCondition>('good')
  const [formValue, setFormValue] = useState('3.000.000 ₫')
  const [formPurchaseDate, setFormPurchaseDate] = useState(new Date().toISOString().split('T')[0])
  const [formDepreciationYears, setFormDepreciationYears] = useState(5)
  const [formNote, setFormNote] = useState('')

  // Building Code Prefix for Asset ID
  const buildingPrefix = activeBuilding?.id ? activeBuilding.id.slice(0, 8).toUpperCase() : 'DORMIO'

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'warning' | 'error' | 'success' | 'info'
  }>({
    isOpen: false,
    title: t('landlordAssetsAlertTitle'),
    message: '',
    type: 'info',
  })

  const showAlert = (
    message: string,
    type: 'warning' | 'error' | 'success' | 'info' = 'warning',
    title?: string,
  ) => {
    setAlertModal({
      isOpen: true,
      title: title || tRef.current('landlordAssetsAlertTitle'),
      message,
      type,
    })
  }

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
          setTotalPages(res.pagination.totalPages)
        }
      }
    } catch (error: any) {
      console.error('Error loading assets:', error)
      showAlert(error?.message || tRef.current('landlordAssetsLoadFailed'), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, searchQuery, categoryFilter, statusFilter, currentPage, itemsPerPage])

  useEffect(() => {
    fetchAssets()
  }, [fetchAssets])

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsDirty(false)
  }

  const handleOpenAddModal = () => {
    setSelectedAsset(null)
    setFormName('')
    setFormCategory('Điện lạnh')
    setFormRoomId(availableRooms.length > 0 ? availableRooms[0].id : '')
    setFormLocation(
      availableRooms.length > 0
        ? t('landlordAssetsRoomPrefix', { room: availableRooms[0].roomNumber })
        : t('landlordAssetsLocationStorage'),
    )
    setFormQuantity(1)
    setFormCondition('good')
    setFormValue('3.000.000 ₫')
    setFormPurchaseDate(new Date().toISOString().split('T')[0])
    setFormDepreciationYears(5)
    setFormNote('')
    setIsDirty(false)
    setIsModalOpen(true)
  }

  const handleOpenEditModal = (asset: AssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    setSelectedAsset(asset)
    setFormName(asset.name)
    setFormCategory(asset.category || 'Điện lạnh')
    setFormRoomId(asset.roomId || '')
    setFormLocation(asset.location || asset.roomName)
    setFormQuantity(asset.quantity || 1)
    setFormCondition(asset.condition || 'good')
    setFormValue(
      asset.purchasePrice ? `${Number(asset.purchasePrice).toLocaleString('vi-VN')} ₫` : '0 ₫',
    )
    setFormPurchaseDate(
      asset.purchaseDate
        ? asset.purchaseDate.split('T')[0]
        : new Date().toISOString().split('T')[0],
    )
    setFormDepreciationYears(5)
    setFormNote(asset.note || '')
    setIsDirty(false)
    setIsModalOpen(true)
  }

  const handleSaveAsset = async () => {
    if (!formName.trim()) {
      showAlert(t('landlordAssetsNameRequired'), 'warning', t('landlordAssetsInfoMissing'))
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
        showAlert(
          t('landlordAssetsToastEditSuccess'),
          'success',
          t('landlordAssetsToastEditSuccess'),
        )
      } else {
        await assetService.createAsset(activeBuilding.id, payload)
        showAlert(t('landlordAssetsToastAddSuccess'), 'success', t('landlordAssetsToastAddSuccess'))
      }

      setIsModalOpen(false)
      setIsDirty(false)
      fetchAssets()
    } catch (err: any) {
      console.error('Save asset error:', err)
      showAlert(err?.message || tRef.current('landlordAssetsSaveFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteAsset = async (asset: AssetItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!activeBuilding?.id) return

    try {
      await assetService.deleteAsset(activeBuilding.id, asset.id)
      showAlert(t('landlordAssetsToastDeleteSuccess'), 'success')
      fetchAssets()
    } catch (err: any) {
      showAlert(err?.message || tRef.current('landlordAssetsDeleteFailed'), 'error')
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

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            {t('landlordAssetsPageTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-0.5 font-medium">
            {t('landlordAssetsPageSubtitle')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleOpenAddModal}
          >
            <Plus className="w-4 h-4" /> {t('landlordAssetsAddBtn')}
          </Button>
        </div>
      </div>

      {/* Building Overview Banner Card */}
      <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
          <Package className="w-48 sm:w-64 h-48 sm:h-64" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="space-y-2.5 max-w-xl w-full">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                {activeBuilding?.name || 'Dormio'}
              </h2>
              <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                {t('landlordAssetsCodePrefix', { code: buildingPrefix })}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
              <div className="flex items-center gap-2 min-w-0">
                <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">
                  {activeBuilding?.address || t('landlordAssetsNoAddress')}
                </span>
              </div>
              {activeBuilding?.address && (
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                >
                  <span>{t('landlordAssetsBtnViewMap')}</span> &rarr;
                </a>
              )}
            </div>

            <p className="text-muted text-xs sm:text-sm leading-relaxed">
              {t('landlordAssetsBannerSub')}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full md:w-[135px]">
              <Package className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">
                  {t('landlordAssetsTotalAssetsShort')}
                </span>
                <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">
                  {t('landlordAssetsItemsCount', { count: summary.totalItems })}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">
                  {t('landlordAssetsInUse')}
                </span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                  {summary.goodConditionCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">
                  {t('landlordAssetsUnderMaintenance')}
                </span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                  {summary.needsRepairCount}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full md:w-[135px]">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
              <div className="flex flex-col">
                <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
                  {t('landlordAssetsTotalQuantity')}
                </span>
                <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                  {summary.totalQuantity}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Category Tabs & Financial Valuation Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card p-3 rounded-2xl border border-line shadow-xs">
        {/* Category Pills */}
        <ChipGroup
          scrollable
          value={categoryFilter}
          onChange={cat => {
            setCategoryFilter(cat)
            setCurrentPage(1)
          }}
          className="pb-1 sm:pb-0"
          options={[
            { value: '', label: t('landlordAssetsFilterAllCategories') },
            { value: 'Điện lạnh', label: t('landlordAssetsCatRefrigeration') },
            { value: 'Nội thất', label: t('landlordAssetsCatFurniture') },
            { value: 'Gia dụng', label: t('landlordAssetsCatAppliances') },
            { value: 'Điện nước', label: t('landlordAssetsCatUtilities') },
            { value: 'An ninh', label: t('landlordAssetsCatSecurity') },
          ]}
        />

        {/* Financial Valuation Summary */}
        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2 shrink-0">
          <div className="px-3 py-1.5 bg-success-soft border border-success-subtle rounded-xl text-xs font-black text-success flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>
              {t('landlordAssetsOriginalValueLabel')}{' '}
              {totalPurchaseValueSum.toLocaleString('vi-VN')} ₫
            </span>
          </div>

          <div className="px-3 py-1.5 bg-info-soft border border-info-subtle rounded-xl text-xs font-black text-info flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5 text-blue-600" />
            <span>
              {t('landlordAssetsCurrentValueLabel')} {totalCurrentValueSum.toLocaleString('vi-VN')}{' '}
              ₫
            </span>
          </div>

          <div className="flex items-center gap-1 bg-card-hover p-1 rounded-xl">
            <Button
              type="button"
              variant={viewMode === 'grid' ? 'white' : 'ghost'}
              size="icon-sm"
              onClick={() => {
                setViewMode('grid')
                setItemsPerPage(6)
                setCurrentPage(1)
              }}
              title={t('landlordAssetsViewGrid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant={viewMode === 'list' ? 'white' : 'ghost'}
              size="icon-sm"
              onClick={() => {
                setViewMode('list')
                setItemsPerPage(10)
                setCurrentPage(1)
              }}
              title={t('landlordAssetsViewTable')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="bg-card border border-line rounded-2xl shadow-xs overflow-hidden">
        {/* Filter Toolbar */}
        <div className="p-3.5 sm:p-4 border-b border-line flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center justify-between bg-surface/50">
          <SearchInput
            placeholder={t('landlordAssetsSearchPh')}
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full sm:max-w-md space-y-0"
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

        {/* Loading Indicator */}
        {isLoading ? (
          <div className="py-20 text-center text-muted font-medium">
            <Loader2 className="w-8 h-8 mx-auto text-[#2AC1BC] animate-spin mb-3" />
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
                    className="bg-card rounded-2xl border border-line p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all space-y-4 cursor-pointer relative group flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-card-hover text-foreground/90 border border-line">
                            {getCategoryLabel(asset.category)}
                          </span>
                          <span className="px-2 py-0.5 rounded-md text-[10px] font-black bg-[#2AC1BC]/10 text-[#2AC1BC] border border-[#2AC1BC]/30">
                            {asset.code}
                          </span>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border shrink-0 ${
                            asset.condition === 'good'
                              ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30'
                              : asset.condition === 'new'
                                ? 'bg-info-soft text-blue-600 border-info-subtle'
                                : asset.condition === 'under_repair'
                                  ? 'bg-accent-soft text-[#FF6B35] border-accent-subtle animate-pulse'
                                  : 'bg-danger-soft text-rose-600 border-danger-subtle'
                          }`}
                        >
                          {getStatusLabel(asset.condition)}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-base font-black text-foreground group-hover:text-[#2AC1BC] transition-colors leading-snug">
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
                          <span className="font-black text-emerald-600">
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
                          size="xs"
                          onClick={e => handleOpenEditModal(asset, e)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5 text-[#2AC1BC]" />}
                        >
                          {t('landlordAssetsBtnEditSku')}
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-xs"
                          onClick={e => handleDeleteAsset(asset, e)}
                          title={t('landlordAssetsBtnDelete')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                      <span className="text-xs font-black text-[#2AC1BC] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
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
                          <span className="font-black text-[#2AC1BC] block font-mono">
                            {asset.code}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-foreground group-hover:text-[#2AC1BC] transition-colors whitespace-nowrap">
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
                        <td className="px-4 sm:px-6 py-4 font-black text-emerald-600 whitespace-nowrap">
                          {dep.currentValue.toLocaleString('vi-VN')} ₫
                          <span className="text-[10px] text-muted font-medium block">
                            {t('landlordAssetsRemaining')} {dep.remainingPercent}%
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold border inline-block whitespace-nowrap ${
                              asset.condition === 'good'
                                ? 'bg-[#2AC1BC]/10 text-[#2AC1BC] border-[#2AC1BC]/30'
                                : asset.condition === 'new'
                                  ? 'bg-info-soft text-blue-600 border-info-subtle'
                                  : asset.condition === 'under_repair'
                                    ? 'bg-accent-soft text-[#FF6B35] border-accent-subtle animate-pulse'
                                    : 'bg-danger-soft text-rose-600 border-danger-subtle'
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
                              leftIcon={<Edit3 className="w-3 h-3 text-[#2AC1BC]" />}
                            >
                              {t('landlordAssetsBtnEdit')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon-xs"
                              onClick={e => handleDeleteAsset(asset, e)}
                              title={t('landlordAssetsBtnDelete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                            <Link
                              href={`/landlord/assets/${asset.id}`}
                              className="px-2.5 py-1 bg-accent-soft text-[#FF6B35] border border-accent-subtle rounded-lg text-xs font-bold hover:bg-[#FF6B35] hover:text-white transition-colors flex items-center gap-1"
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-card border border-line rounded-2xl shadow-xs mt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-xl border border-line">
            <span>{t('landlordAssetsShowing')}</span>
            <NumberInput
              min={1}
              max={500}
              value={itemsPerPage || ''}
              onChange={e => {
                const val = parseInt(e.target.value)
                setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val)
                setCurrentPage(1)
              }}
              containerClassName="w-16 space-y-0"
              className="w-16 text-center font-extrabold text-foreground bg-card border border-line rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs h-7"
            />
            <span>{t('landlordAssetsPerPage')}</span>
          </div>

          <span className="hidden sm:inline text-zinc-300">|</span>

          <div>
            <span className="font-extrabold text-foreground">
              {totalRecords === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            -{' '}
            <span className="font-extrabold text-foreground">
              {Math.min(currentPage * itemsPerPage, totalRecords)}
            </span>{' '}
            {t('landlordAssetsOfTotal')}{' '}
            <span className="font-extrabold text-foreground">{totalRecords}</span>{' '}
            {t('landlordAssetsAssetsUnit')}
          </div>
        </div>

        {(() => {
          const windowSize = 5
          const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1
          const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
          const visiblePages = Array.from(
            { length: Math.max(0, windowEnd - windowStart + 1) },
            (_, i) => windowStart + i,
          )

          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
              >
                &larr; {t('landlordAssetsPrev')}
              </Button>
              {visiblePages.map(page => (
                <Button
                  type="button"
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="icon-sm"
                  key={page}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="xs"
                disabled={currentPage >= totalPages || windowStart + windowSize > totalPages}
                onClick={() => setCurrentPage(Math.min(windowStart + windowSize, totalPages))}
              >
                {t('landlordAssetsNext')} &rarr;
              </Button>
            </div>
          )
        })()}
      </div>

      {/* ADD / EDIT ASSET MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between bg-surface/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent-soft text-[#FF6B35] rounded-xl">
                  <Package className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-foreground">
                    {selectedAsset
                      ? `${t('landlordAssetsModalEditTitle')} [${selectedAsset.code}]`
                      : t('landlordAssetsModalAddTitle')}
                  </h3>
                  <p className="text-xs text-muted font-medium">{t('landlordAssetsModalSub')}</p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={handleCloseModal}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4">
                {/* Name */}
                <TextInput
                  label={t('landlordAssetsFieldName')}
                  required
                  placeholder={t('landlordAssetsFieldNamePh')}
                  value={formName}
                  onChange={e => {
                    setFormName(e.target.value)
                    setIsDirty(true)
                  }}
                  containerClassName="sm:col-span-2"
                />

                {/* Category */}
                <SelectInput
                  label={t('landlordAssetsFieldCategory')}
                  value={formCategory}
                  onChange={e => {
                    setFormCategory(e.target.value)
                    setIsDirty(true)
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
                    setIsDirty(true)
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
                    setIsDirty(true)
                  }}
                />

                {/* Quantity */}
                <NumberInput
                  label={t('landlordAssetsFieldQuantity')}
                  min={1}
                  value={formQuantity}
                  onChange={e => {
                    setFormQuantity(Math.max(1, parseInt(e.target.value) || 1))
                    setIsDirty(true)
                  }}
                />

                {/* Purchase Value */}
                <TextInput
                  label={t('landlordAssetsFieldPurchaseValue')}
                  placeholder="VD: 8.500.000 ₫"
                  value={formValue}
                  onChange={e => {
                    setFormValue(e.target.value)
                    setIsDirty(true)
                  }}
                />

                {/* Purchase Date */}
                <TextInput
                  type="date"
                  label={t('landlordAssetsFieldPurchaseDate')}
                  value={formPurchaseDate}
                  onChange={e => {
                    setFormPurchaseDate(e.target.value)
                    setIsDirty(true)
                  }}
                />

                {/* Condition / Status */}
                <SelectInput
                  label={t('landlordAssetsFieldStatus')}
                  value={formCondition}
                  onChange={e => {
                    setFormCondition(e.target.value as AssetCondition)
                    setIsDirty(true)
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
                    setIsDirty(true)
                  }}
                  containerClassName="sm:col-span-2"
                  className="resize-none"
                />
              </div>
            </div>

            <div className="p-4 border-t border-line flex items-center justify-end gap-3 bg-surface">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCloseModal}
              >
                {t('landlordAssetsBtnCancel')}
              </Button>
              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={handleSaveAsset}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                {t('landlordAssetsModalBtnSave')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
