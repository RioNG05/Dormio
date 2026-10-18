'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  FileSignature,
  X,
  LayoutGrid,
  List,
  CalendarDays,
  Ban,
  Copy,
  Printer,
  Users,
  Gauge,
  MapPin,
  CreditCard,
  Eye,
  Loader2,
  AlertTriangle,
  User,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useSubscriptionTier } from '@/hooks'
import { getLandlordContracts, ContractItem, exportContract } from '@/services/contract.service'
import ContractPreviewModal from '@/components/landlord/ContractPreviewModal'
import {
  Button,
  TextInput,
  DateInput,
  NumberInput,
  SelectInput,
  SearchInput,
  ToastContainer,
  ToastItem,
  ChipGroup,
  Text,
} from '@/components/ui'
import { cn } from '@/lib/utils'

function mapContractStatus(rawStatus: string): string {
  switch (rawStatus) {
    case 'active':
      return 'Đang hiệu lực'
    case 'draft':
      return 'Chờ xác nhận'
    case 'expired':
      return 'Quá hạn'
    case 'canceled':
      return 'Đã chấm dứt'
    default:
      return rawStatus
  }
}

export default function ContractsPage() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')
  const { requireTier } = useSubscriptionTier()

  // Rule #10: Unsaved changes confirmation modal state
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [modalPendingClose, setModalPendingClose] = useState<(() => void) | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [contracts, setContracts] = useState<any[]>([])

  // Selection for quick action modals (Extend, Terminate, Print)
  const [selectedContract, setSelectedContract] = useState<any>(null)

  // Filters & Pagination (Rule #9: Grid default 6, List default 10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(6)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Quick Action Modals
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false)

  // Form states inside modals
  const [extendEndDate, setExtendEndDate] = useState('')
  const [extendRent, setExtendRent] = useState('')
  const [terminateDate, setTerminateDate] = useState('')
  const [terminateReason, setTerminateReason] = useState('')
  const [finalElecIndex, setFinalElecIndex] = useState('')
  const [finalWaterIndex, setFinalWaterIndex] = useState('')

  // Preview contract modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    contractId: string
    roomNumber: string
    tenantName?: string
  }>({
    isOpen: false,
    contractId: '',
    roomNumber: '',
    tenantName: '',
  })

  // Toast notifications using base ToastContainer
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5)
      setToasts(prev => [...prev, { id, message, type, duration: 4000 }])
    },
    [],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(tItem => tItem.id !== id))
  }, [])

  // Centralized Status Label mappings (Rule #14)
  const getContractStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'active':
        case 'Đang hiệu lực':
        case 'Còn hiệu lực':
          return t('landlordContractsStatusActive')
        case 'draft':
        case 'Chờ xác nhận':
          return t('landlordContractsStatusDraft')
        case 'expired':
        case 'Quá hạn':
          return t('landlordContractsStatusOverdue')
        case 'Sắp hết hạn':
          return t('landlordContractsStatusExpiring')
        case 'canceled':
        case 'Đã chấm dứt':
        case 'Chấm dứt':
          return t('landlordContractsStatusEnded')
        default:
          return status
      }
    },
    [t],
  )

  const getPaymentStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'paid':
        case 'Đã thu đủ':
          return t('landlordContractsPaymentStatusPaid')
        case 'unpaid':
        case 'Còn nợ':
          return t('landlordContractsPaymentStatusUnpaid')
        default:
          return status
      }
    },
    [t],
  )

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const fetchContracts = useCallback(async () => {
    if (!activeBuilding?.id) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await getLandlordContracts(activeBuilding.id, { limit: 100 })
      if (res?.data && res.data.length > 0) {
        const mapped = res.data.map((c: ContractItem) => ({
          id: c.id,
          building: activeBuilding.id,
          room: c.room.roomNumber,
          roomType: c.room.roomTypeName || 'Studio',
          tenant: c.tenant?.fullName || t('landlordContractsTenantFallback'),
          tenantId: c.tenant?.id || 'KH-1',
          tenantPhone: c.tenant?.phoneNumber || '',
          startDate: new Date(c.startDate).toLocaleDateString('vi-VN'),
          endDate: new Date(c.endDate).toLocaleDateString('vi-VN'),
          isOverdue: new Date(c.endDate) < new Date() && c.status !== 'canceled',
          price: `${c.rentPrice.toLocaleString('vi-VN')} ₫`,
          rentPrice: c.rentPrice,
          deposit: `${c.depositAmount.toLocaleString('vi-VN')} ₫`,
          depositAmount: c.depositAmount,
          paymentDate: `${c.monthlyPaymentDate}`,
          paymentStatus: 'Đã thu đủ',
          status: mapContractStatus(c.status),
          documentsCount: c.documentsCount,
          createdAt: new Date(c.createdAt).toLocaleDateString('vi-VN'),
          history: [],
          members: [],
        }))
        setContracts(mapped)
      } else {
        setContracts([])
      }
    } catch (err: any) {
      console.warn('Could not load contracts from backend, using fallback data:', err)
      setLoadError(t('landlordContractsLoadError'))
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, t])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Rule #10: Modal close handling with confirmation if unsaved changes exist
  const requestCloseModal = (closeFn: () => void) => {
    if (isDirty) {
      setModalPendingClose(() => closeFn)
      setShowCloseConfirm(true)
    } else {
      closeFn()
    }
  }

  const handleConfirmDiscard = () => {
    setShowCloseConfirm(false)
    setIsDirty(false)
    if (modalPendingClose) {
      modalPendingClose()
      setModalPendingClose(null)
    }
  }


  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }

  // Export current contract list as CSV
  const handleExportCsv = () => {
    const headers = [
      t('landlordContractsCsvHeaderId'),
      t('landlordContractsCsvHeaderRoom'),
      t('landlordContractsCsvHeaderTenant'),
      t('landlordContractsCsvHeaderStartDate'),
      t('landlordContractsCsvHeaderEndDate'),
      t('landlordContractsCsvHeaderRentPrice'),
      t('landlordContractsCsvHeaderDeposit'),
      t('landlordContractsCsvHeaderStatus'),
    ]
    const rows = contracts.map((c: any) => [
      c.id,
      c.room,
      c.tenant,
      c.startDate,
      c.endDate,
      c.price,
      c.deposit,
      getContractStatusLabel(c.status),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contracts_${activeBuilding?.name || 'export'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(t('landlordContractsToastCsvExportSuccess'), 'success')
  }

  // Handle print/preview modal
  const handlePrintContract = (contract: any) => {
    if (
      !requireTier(
        'plus',
        t('landlordContractDetailTierRequiredMsg') ||
        'Tính năng in và xuất văn bản hợp đồng pháp lý yêu cầu nâng cấp lên gói Plus.',
      )
    ) {
      return
    }
    setPreviewModal({
      isOpen: true,
      contractId: contract.id,
      roomNumber: contract.room,
      tenantName: contract.tenant,
    })
  }

  // Direct export of contract document (HTML/PDF)
  const handleExportContract = async (contract: any) => {
    if (
      !requireTier(
        'plus',
        t('landlordContractDetailTierRequiredMsg') ||
        'Tính năng in và xuất văn bản hợp đồng pháp lý yêu cầu nâng cấp lên gói Plus.',
      )
    ) {
      return
    }
    if (!activeBuilding?.id) return
    try {
      showToast(t('landlordContractsToastDocExporting'), 'info')
      const res = await exportContract(activeBuilding.id, contract.id)
      if (res?.data) {
        showToast(t('landlordContractsToastDocExportSuccess'), 'success')
        fetchContracts()
        const blob = new Blob([res.data.html || ''], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hop-dong-phong-${String(contract.room).replace(/[^a-zA-Z0-9_-]/g, '_')}-${contract.id.substring(0, 8)}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error('Failed to export contract:', err)
      showToast(err.message || t('landlordContractsToastDocExportFailed'), 'error')
    }
  }

  const handleTerminateContract = () => {
    if (!selectedContract) return
    const updated = contracts.map(c =>
      c.id === selectedContract.id ? { ...c, status: 'Đã chấm dứt' } : c,
    )
    setContracts(updated)
    setSelectedContract(updated.find(c => c.id === selectedContract.id))
    setIsTerminateModalOpen(false)
    setIsDirty(false)
    showToast(t('landlordContractsToastTerminateSuccess'), 'success')
  }

  const handleExtendContract = () => {
    if (!selectedContract || !extendEndDate) return
    const updated = contracts.map(c =>
      c.id === selectedContract.id ? { ...c, endDate: formatDateToDisplay(extendEndDate) } : c,
    )
    setContracts(updated)
    setSelectedContract(updated.find(c => c.id === selectedContract.id))
    setIsExtendModalOpen(false)
    setIsDirty(false)
    setExtendEndDate('')
    setExtendRent('')
    showToast(t('landlordContractsToastExtendSuccess'), 'success')
  }


  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    showToast(t('landlordContractsToastCodeCopied'), 'success')
  }

  const filteredContracts = contracts.filter(c => {
    if (
      searchQuery &&
      !c.tenant.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.room.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    if (statusFilter) {
      const displayStatus = getContractStatusLabel(c.status)
      const rawStatus = c.status
      if (rawStatus !== statusFilter && displayStatus !== statusFilter) return false
    }
    return true
  })

  const totalItems = filteredContracts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  )

  const terminateReasonOptions = useMemo(
    () => [
      { value: '', label: t('landlordContractsTerminateReasonPlaceholder') },
      { value: '1', label: t('landlordContractsTerminateReason1') },
      { value: '2', label: t('landlordContractsTerminateReason2') },
      { value: '3', label: t('landlordContractsTerminateReason3') },
    ],
    [t],
  )

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Rule #10: Custom Confirm-Close Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <Text as="h3" size="base" weight="bold" color="default" className="mb-2">
                {t('landlordContractsConfirmCloseTitle')}
              </Text>
              <Text size="sm" color="secondary">
                {t('landlordContractsConfirmCloseDesc')}
              </Text>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCloseConfirm(false)}
              >
                {t('landlordContractsConfirmCloseContinue')}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmDiscard}
              >
                {t('landlordContractsConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        {/* Top Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <Text as="h1" variant="heading" size="2xl" weight="black" className="tracking-tight text-zinc-900">
              {t('landlordContractsTitle')}
            </Text>
            <Text variant="subtitle" size="sm" color="secondary" className="mt-0.5">
              {t('landlordContractsSubtitle')}
            </Text>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => router.push('/landlord/contracts/create')}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('landlordContractsCreateBtn')}
          </Button>
        </div>

        {/* Building Overview Banner Card */}
        <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
            <FileSignature className="w-64 h-64" />
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
            <div className="space-y-3 max-w-xl w-full">
              <div className="flex flex-wrap items-center gap-2">
                <Text as="h2" weight="black" color="white" className="text-xl sm:text-2xl md:text-3xl tracking-tight">
                  {activeBuilding?.name || 'Dormio Building'}
                </Text>
                <Text as="span" variant="overline" size="3xs" weight="black" className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 rounded-full tracking-wider shrink-0">
                  {t('landlordContractsBannerOperating')}
                </Text>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                  <Text as="span" size="xs" weight="bold" className="text-zinc-200 truncate sm:whitespace-normal">
                    {activeBuilding?.address || ''}
                  </Text>
                </div>
                {activeBuilding?.address && (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                  >
                    <Text as="span" size="3xs" weight="black">{t('landlordOverviewViewMap')}</Text> &rarr;
                  </a>
                )}
              </div>

              <Text variant="body" size="sm" color="subtle" className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                {t('landlordContractsBannerDesc')}
              </Text>
            </div>

            {/* 4 Stat Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
                <FileSignature className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
                <div className="flex flex-col">
                  <Text as="span" variant="overline" size="3xs" weight="bold" className="text-rose-400 tracking-wider">
                    {t('landlordContractsStatTotal')}
                  </Text>
                  <Text as="span" size="lg" weight="black" className="text-rose-500 leading-none mt-1">
                    {contracts.length}
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <Text as="span" variant="overline" size="3xs" weight="bold" color="brand" className="tracking-wider">
                    {t('landlordContractsStatActive')}
                  </Text>
                  <Text as="span" size="lg" weight="black" color="white" className="leading-none mt-1">
                    {
                      contracts.filter(
                        c => c.status === 'Còn hiệu lực' || c.status === 'Đang hiệu lực',
                      ).length
                    }
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <Text as="span" variant="overline" size="3xs" weight="bold" className="text-[#FF6B35] tracking-wider">
                    {t('landlordContractsStatExpiring')}
                  </Text>
                  <Text as="span" size="lg" weight="black" color="white" className="leading-none mt-1">
                    {
                      contracts.filter(c => c.status === 'Sắp hết hạn' || c.status === 'Quá hạn')
                        .length
                    }
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                <div className="flex flex-col">
                  <Text as="span" variant="overline" size="3xs" weight="bold" className="text-blue-400 tracking-wider">
                    {t('landlordContractsStatEnded')}
                  </Text>
                  <Text as="span" size="lg" weight="black" color="white" className="leading-none mt-1">
                    {
                      contracts.filter(c => c.status === 'Chấm dứt' || c.status === 'Đã chấm dứt').length
                    }
                  </Text>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Single Row Toolbar (Filter Pills + Search Bar + View Mode) */}
        <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Filter Pills */}
            <ChipGroup
              value={statusFilter}
              onChange={val => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
              className="flex-1 min-w-0"
              options={[
                { label: t('landlordContractsFilterAll'), value: '' },
                { label: t('landlordContractsFilterActive'), value: 'Đang hiệu lực' },
                { label: t('landlordContractsFilterExpiring'), value: 'Sắp hết hạn', variant: 'warning' },
                { label: t('landlordContractsFilterOverdue'), value: 'Quá hạn', variant: 'danger' },
                { label: t('landlordContractsFilterEnded'), value: 'Đã chấm dứt', variant: 'neutral' },
              ]}
            />

            {/* Search & View Mode */}
            <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
              <div className="w-full sm:w-64">
                <SearchInput
                  placeholder={t('landlordContractsSearchPlaceholder')}
                  value={searchQuery}
                  onChange={val => {
                    setSearchQuery(val)
                    setCurrentPage(1)
                  }}
                  className="bg-zinc-50 focus:bg-white text-xs"
                />
              </div>

              <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewMode('grid')
                    setRowsPerPage(6)
                    setCurrentPage(1)
                  }}
                  title={t('landlordContractsGridView')}
                >
                  <LayoutGrid className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setViewMode('list')
                    setRowsPerPage(10)
                    setCurrentPage(1)
                  }}
                  title={t('landlordContractsListView')}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white border border-zinc-200/80 rounded-2xl">
            <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
            <Text size="sm" weight="semibold" color="secondary">
              {t('landlordContractsLoading')}
            </Text>
          </div>
        )}

        {/* Error State */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white border border-rose-200 rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-rose-500" />
            <Text size="sm" weight="semibold" color="danger">
              {loadError}
            </Text>
            <Button
              variant="primary"
              size="sm"
              onClick={fetchContracts}
            >
              {t('landlordContractsRetry')}
            </Button>
          </div>
        )}

        {/* Grid / Table View */}
        {!isLoading && !loadError && (
          <>
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedContracts.length === 0 ? (
                  <div className="col-span-full p-8 text-center bg-white border border-zinc-200/80 rounded-2xl">
                    <Text weight="bold" color="subtle">
                      {t('landlordContractsNoContractsFound')}
                    </Text>
                  </div>
                ) : (
                  paginatedContracts.map((c, idx) => {
                    return (
                      <div
                        key={c.id || idx}
                        onClick={() => router.push(`/landlord/contracts/${c.id}`)}
                        className="bg-white border border-zinc-200/80 hover:border-[#2AC1BC]/40 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                      >
                        <div>
                          {/* Card Header: Room & Status */}
                          <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <Text as="h3" weight="black" size="base" color="default" className="group-hover:text-[#2AC1BC] transition-colors">
                                  {t('landlordRoomDetailRoomPrefix')} {c.room}
                                </Text>
                                <Text as="span" size="3xs" weight="extrabold" className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                  {activeBuilding?.name || 'Dormio'}
                                </Text>
                              </div>
                              <div className="flex items-center gap-1 mt-0.5">
                                <Text as="span" variant="caption" size="2xs" weight="bold" color="subtle">
                                  {t('landlordContractsContractCodeShort')} {c.id}
                                </Text>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={e => copyToClipboard(e, c.id)}
                                  className="rounded"
                                  title={t('landlordContractsCopyCodeTitle')}
                                >
                                  <Copy className="w-3 h-3 text-zinc-400 hover:text-[#2AC1BC]" />
                                </Button>
                              </div>
                            </div>

                            <Text
                              as="span"
                              size="2xs"
                              weight="extrabold"
                              className={cn(
                                'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border shrink-0',
                                c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                                    : 'bg-zinc-100 text-zinc-600 border-zinc-200',
                              )}
                            >
                              <span
                                className={cn(
                                  'w-1.5 h-1.5 rounded-full',
                                  c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                    ? 'bg-emerald-500'
                                    : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                      ? 'bg-amber-500'
                                      : 'bg-zinc-400',
                                )}
                              />
                              {getContractStatusLabel(c.status)}
                            </Text>
                          </div>

                          {/* Card Body */}
                          <div className="py-3 space-y-2.5">
                            <div className="flex items-center justify-between text-xs">
                              <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-zinc-400" />
                                {t('landlordContractsRepresentative')}
                              </Text>
                              <div className="flex flex-col items-end">
                                <Text as="span" size="xs" weight="extrabold" color="default">
                                  {c.tenant}
                                </Text>
                                {c.members && c.members.length > 0 && (
                                  <Text as="span" size="3xs" weight="bold" color="secondary" className="flex items-center gap-1">
                                    <Users className="w-3 h-3 text-zinc-400" />
                                    {t('landlordContractsRoommatesCount').replace(
                                      '{count}',
                                      String(c.members.length),
                                    )}
                                  </Text>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                                {t('landlordContractsRentPriceLabel')}:
                              </Text>
                              <Text as="span" size="sm" weight="black" color="brand">
                                {c.price} {t('landlordContractsPerMonth')}
                              </Text>
                            </div>

                            <div className="flex items-center justify-between text-xs">
                              <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                                <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                                {t('landlordContractsDurationLabel')}
                              </Text>
                              <div className="flex items-center gap-1.5">
                                <Text as="span" size="xs" weight="bold" className="text-zinc-800">
                                  {c.startDate} - {c.endDate}
                                </Text>
                                {c.isOverdue && (
                                  <Text as="span" size="3xs" weight="black" className="px-1.5 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                    {t('landlordContractsDueExpired')}
                                  </Text>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                              <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                                <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                                {t('landlordContractsPaymentLabel')}
                              </Text>
                              <Text
                                as="span"
                                size="2xs"
                                weight="extrabold"
                                className={cn(
                                  'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border',
                                  c.paymentStatus === 'Đã thu đủ'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-rose-50 text-rose-700 border-rose-200',
                                )}
                              >
                                {getPaymentStatusLabel(c.paymentStatus)}
                              </Text>
                            </div>
                          </div>
                        </div>

                        {/* Card Footer Actions */}
                        <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={e => {
                              e.stopPropagation()
                              router.push(`/landlord/contracts/${c.id}`)
                            }}
                            leftIcon={<Eye  />}
                          >
                            {t('landlordContractsBtnDetail')}
                          </Button>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={e => {
                                e.stopPropagation()
                                handlePrintContract(c)
                              }}
                              title={t('landlordContractsPrintExportTitle')}
                            >
                              <Printer className="w-3.5 h-3.5 text-zinc-700" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedContract(c)
                                setIsExtendModalOpen(true)
                              }}
                              leftIcon={<CalendarDays  />}
                            >
                              {t('landlordContractsBtnExtend')}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedContract(c)
                                setIsTerminateModalOpen(true)
                              }}
                              leftIcon={<Ban  />}
                            >
                              {t('landlordContractsBtnTerminate')}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            ) : (
              /* Table View */
              <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <table className="w-full min-w-[850px] text-xs text-left border-collapse">
                    <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-20 shadow-xs">
                      <tr>
                        <th className="px-5 py-3.5 whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderRoomCode')}
                          </Text>
                        </th>
                        <th className="px-5 py-3.5 whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderTenant')}
                          </Text>
                        </th>
                        <th className="px-5 py-3.5 whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderDuration')}
                          </Text>
                        </th>
                        <th className="px-5 py-3.5 whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderPrice')}
                          </Text>
                        </th>
                        <th className="px-5 py-3.5 whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderPayment')}
                          </Text>
                        </th>
                        <th className="px-5 py-3.5 whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderStatus')}
                          </Text>
                        </th>
                        <th className="px-5 py-3.5 text-right whitespace-nowrap">
                          <Text as="span" variant="overline" size="2xs" weight="black" color="secondary">
                            {t('landlordContractsTableHeaderAction')}
                          </Text>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {paginatedContracts.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-8 text-center">
                            <Text weight="bold" color="subtle">
                              {t('landlordContractsNoContractsFound')}
                            </Text>
                          </td>
                        </tr>
                      ) : (
                        paginatedContracts.map((c, idx) => {
                          return (
                            <tr
                              key={c.id || idx}
                              onClick={() => router.push(`/landlord/contracts/${c.id}`)}
                              className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                            >
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col gap-0.5">
                                  <div className="flex items-center gap-2">
                                    <Text as="span" size="sm" weight="black" color="brand">
                                      {t('landlordRoomDetailRoomPrefix')} {c.room}
                                    </Text>
                                    <Text as="span" size="3xs" weight="extrabold" className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                      {activeBuilding?.name || 'Dormio'}
                                    </Text>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <Text as="span" size="2xs" weight="bold" color="subtle">{c.id}</Text>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={e => copyToClipboard(e, c.id)}
                                      className="rounded"
                                      title={t('landlordContractsCopyCodeTitle')}
                                    >
                                      <Copy className="w-3 h-3 text-zinc-400 hover:text-[#2AC1BC]" />
                                    </Button>
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <Text as="span" size="sm" weight="extrabold" color="default">
                                    {c.tenant}
                                  </Text>
                                  <Text as="span" size="2xs" weight="bold" color="subtle">
                                    {c.tenantPhone || '---'}
                                  </Text>
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <div className="flex flex-col">
                                  <Text as="span" size="xs" weight="bold" className="text-zinc-800">
                                    {c.startDate} - {c.endDate}
                                  </Text>
                                  {c.isOverdue && (
                                    <Text as="span" size="3xs" weight="black" color="danger">
                                      {t('landlordContractsDueExpired')}
                                    </Text>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Text as="span" size="sm" weight="black" color="brand">
                                  {c.price}
                                </Text>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Text
                                  as="span"
                                  size="2xs"
                                  weight="extrabold"
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border',
                                    c.paymentStatus === 'Đã thu đủ'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200',
                                  )}
                                >
                                  {getPaymentStatusLabel(c.paymentStatus)}
                                </Text>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Text
                                  as="span"
                                  size="2xs"
                                  weight="extrabold"
                                  className={cn(
                                    'inline-flex items-center gap-1 px-2.5 py-1 rounded-full border',
                                    c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                                        : 'bg-zinc-100 text-zinc-600 border-zinc-200',
                                  )}
                                >
                                  <span
                                    className={cn(
                                      'w-1.5 h-1.5 rounded-full',
                                      c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                        ? 'bg-emerald-500'
                                        : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                          ? 'bg-amber-500'
                                          : 'bg-zinc-400',
                                    )}
                                  />
                                  {getContractStatusLabel(c.status)}
                                </Text>
                              </td>
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1 text-zinc-400">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={e => {
                                      e.stopPropagation()
                                      router.push(`/landlord/contracts/${c.id}`)
                                    }}
                                    title={t('landlordContractsBtnDetail')}
                                  >
                                    <Eye className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={e => {
                                      e.stopPropagation()
                                      setSelectedContract(c)
                                      setIsExtendModalOpen(true)
                                    }}
                                    title={t('landlordContractsBtnExtend')}
                                  >
                                    <CalendarDays className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={e => {
                                      e.stopPropagation()
                                      handlePrintContract(c)
                                    }}
                                    title={t('landlordContractsPrintExportTitle')}
                                  >
                                    <Printer className="w-4 h-4 text-[#2AC1BC]" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={e => {
                                      e.stopPropagation()
                                      setSelectedContract(c)
                                      setIsTerminateModalOpen(true)
                                    }}
                                    title={t('landlordContractsBtnTerminate')}
                                  >
                                    <Ban className="w-4 h-4" />
                                  </Button>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Standardized Pagination Footer (Rule #9) */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-4">
              <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordContractsPaginationShowing')}
                  </Text>
                  <NumberInput
                    min={1}
                    max={500}
                    value={rowsPerPage || 1}
                    onChange={e => {
                      const val = parseInt(e.target.value)
                      setRowsPerPage(isNaN(val) || val <= 0 ? 1 : val)
                      setCurrentPage(1)
                    }}
                    className="w-14 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 text-xs"
                  />
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordContractsPaginationPerPage')}
                  </Text>
                </div>

                <span className="hidden sm:inline text-zinc-300">|</span>

                <div className="text-xs font-semibold text-zinc-500">
                  <Text as="span" weight="extrabold" color="default">
                    {totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                  </Text>{' '}
                  -{' '}
                  <Text as="span" weight="extrabold" color="default">
                    {Math.min(currentPage * rowsPerPage, totalItems)}
                  </Text>{' '}
                  {t('landlordContractsPaginationOf')}{' '}
                  <Text as="span" weight="extrabold" color="default">
                    {totalItems}
                  </Text>{' '}
                  {t('landlordContractsPaginationTotalContracts')}
                </div>
              </div>

              {(() => {
                const windowSize = 5
                const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1
                const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
                const visiblePages = Array.from(
                  { length: windowEnd - windowStart + 1 },
                  (_, i) => windowStart + i,
                )

                return (
                  <div className="flex items-center gap-1.5">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
                    >
                      &larr; {t('landlordContractsPaginationPrev')}
                    </Button>
                    {visiblePages.map(page => (
                      <Button
                        key={page}
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </Button>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === totalPages || windowStart + windowSize > totalPages}
                      onClick={() =>
                        setCurrentPage(Math.min(windowStart + windowSize, totalPages))
                      }
                    >
                      {t('landlordContractsPaginationNext')} &rarr;
                    </Button>
                  </div>
                )
              })()}
            </div>


          </>
        )}
      </div>

      {/* Extend Contract Modal */}
      {isExtendModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onMouseDown={e => {
            if (e.target === e.currentTarget) requestCloseModal(() => setIsExtendModalOpen(false))
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <Text as="h2" size="xl" weight="bold" color="default">
                {t('landlordContractsExtendModalTitle')}
              </Text>
              <Button rounded="full"
                variant="ghost"
                size="sm"
                onClick={() => requestCloseModal(() => setIsExtendModalOpen(false))}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <DateInput
                label={t('landlordContractsExtendEndDateLabel')}
                required
                value={extendEndDate}
                onChange={e => {
                  setExtendEndDate(e.target.value)
                  setIsDirty(true)
                }}
              />
              <NumberInput
                label={t('landlordContractsExtendNewRentLabel')}
                placeholder="3000000"
                suffixText={t('landlordContractsCurrencyVnd')}
                helperText={t('landlordContractsExtendNewRentHint')}
                value={extendRent}
                onChange={e => {
                  setExtendRent(e.target.value)
                  setIsDirty(true)
                }}
              />
            </div>
            <div className="p-6 pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => requestCloseModal(() => setIsExtendModalOpen(false))}
              >
                {t('landlordContractsBtnCancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleExtendContract}
              >
                {t('landlordContractsBtnExtend')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Contract Modal */}
      {isTerminateModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onMouseDown={e => {
            if (e.target === e.currentTarget) requestCloseModal(() => setIsTerminateModalOpen(false))
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <Text as="h2" size="xl" weight="bold" color="danger">
                {t('landlordContractsTerminateModalTitle')}
              </Text>
              <Button rounded="full"
                variant="ghost"
                size="sm"
                onClick={() => requestCloseModal(() => setIsTerminateModalOpen(false))}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6 space-y-5">
              <DateInput
                label={t('landlordContractsTerminatedDateLabel')}
                required
                value={terminateDate}
                onChange={e => {
                  setTerminateDate(e.target.value)
                  setIsDirty(true)
                }}
              />

              <SelectInput
                label={t('landlordContractsTerminateReasonLabel')}
                required
                value={terminateReason}
                onChange={e => {
                  setTerminateReason(e.target.value)
                  setIsDirty(true)
                }}
                options={terminateReasonOptions}
              />

              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-4">
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#2AC1BC]" />
                  <Text as="span" size="sm" weight="medium" color="brand">
                    {t('landlordContractsTerminateEndIndexTitle')}
                  </Text>
                </div>
                <Text size="xs" color="secondary">
                  {t('landlordContractsTerminateEndIndexHint')}
                </Text>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Text as="span" size="sm" weight="semibold" className="w-12 text-zinc-800">
                      {t('landlordContractsTerminateLastElec')}
                    </Text>
                    <Text as="span" size="sm" color="secondary" className="whitespace-nowrap min-w-[50px]">
                      {t('landlordContractsTerminateLastOldPrefix')} 11
                    </Text>
                    <div className="flex-1">
                      <NumberInput
                        placeholder={t('landlordContractsTerminateNewIndexPlaceholder')}
                        suffixText="kWh"
                        value={finalElecIndex}
                        onChange={e => {
                          setFinalElecIndex(e.target.value)
                          setIsDirty(true)
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Text as="span" size="sm" weight="semibold" className="w-12 text-zinc-800">
                      {t('landlordContractsTerminateLastWater')}
                    </Text>
                    <Text as="span" size="sm" color="secondary" className="whitespace-nowrap min-w-[50px]">
                      {t('landlordContractsTerminateLastOldPrefix')} 12
                    </Text>
                    <div className="flex-1">
                      <NumberInput
                        placeholder={t('landlordContractsTerminateNewIndexPlaceholder')}
                        suffixText="m³"
                        value={finalWaterIndex}
                        onChange={e => {
                          setFinalWaterIndex(e.target.value)
                          setIsDirty(true)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => requestCloseModal(() => setIsTerminateModalOpen(false))}
              >
                {t('landlordContractsBtnCancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleTerminateContract}
              >
                {t('landlordContractsBtnTerminate')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Print / Preview Modal */}
      {previewModal.isOpen && (
        <ContractPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
          buildingId={activeBuilding?.id || ''}
          contractId={previewModal.contractId}
          roomNumber={previewModal.roomNumber}
          tenantName={previewModal.tenantName}
        />
      )}

      {/* Centralized Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
