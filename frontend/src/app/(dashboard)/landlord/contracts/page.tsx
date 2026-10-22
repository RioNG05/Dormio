'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
import { useRouter } from 'next/navigation'
import {
  Plus,
  FileSignature,
  CalendarDays,
  Ban,
  Users,
  Gauge,
  CreditCard,
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
  DateInput,
  NumberInput,
  SelectInput,
  SearchInput,
  ToastContainer,
  ToastItem,
  ChipGroup,
  Text,
  Modal,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Chip,
  EmptyState,
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

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordContractsStatTotal'),
        value: contracts.length,
        icon: <FileSignature className="w-5 h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'active',
        label: t('landlordContractsStatActive'),
        value: contracts.filter(
          c => c.status === 'Còn hiệu lực' || c.status === 'Đang hiệu lực',
        ).length,
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
        key: 'expiring',
        label: t('landlordContractsStatExpiring'),
        value: contracts.filter(c => c.status === 'Sắp hết hạn' || c.status === 'Quá hạn').length,
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
        key: 'ended',
        label: t('landlordContractsStatEnded'),
        value: contracts.filter(c => c.status === 'Chấm dứt' || c.status === 'Đã chấm dứt').length,
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
    [t, contracts],
  )

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Rule #10: Custom Confirm-Close Modal */}
      <Modal
        isOpen={showCloseConfirm}
        onClose={() => setShowCloseConfirm(false)}
        size="sm"
        zIndex={200}
        showCloseButton={false}
        footer={
          <div className="flex items-center gap-3 w-full">
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
        }
      >
        <div className="space-y-2">
          <Text as="h3" size="base" weight="bold" color="default">
            {t('landlordContractsConfirmCloseTitle')}
          </Text>
          <Text size="sm" color="secondary">
            {t('landlordContractsConfirmCloseDesc')}
          </Text>
        </div>
      </Modal>

      <div className="space-y-6 animate-in fade-in duration-500 pb-12">
        <DashboardPageHeader
          title={t('landlordContractsTitle')}
          subtitle={t('landlordContractsSubtitle')}
          actions={
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/landlord/contracts/create')}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('landlordContractsCreateBtn')}
            </Button>
          }
        />

        <LandlordStatBanner
          chips={statChips}
          watermarkIcon={<FileSignature className="w-64 h-64" />}
        />

        {/* Single Row Toolbar (Filter Pills + Search Bar + View Mode) */}
        <FilterToolbar
          search={
            <SearchInput
              placeholder={t('landlordContractsSearchPlaceholder')}
              value={searchQuery}
              onChange={val => {
                setSearchQuery(val)
                setCurrentPage(1)
              }}
              containerClassName="w-full space-y-0"
            />
          }
          filters={
            <ChipGroup
              value={statusFilter}
              onChange={val => {
                setStatusFilter(val)
                setCurrentPage(1)
              }}
              options={[
                { label: t('landlordContractsFilterAll'), value: '' },
                { label: t('landlordContractsFilterActive'), value: 'Đang hiệu lực' },
                { label: t('landlordContractsFilterExpiring'), value: 'Sắp hết hạn', variant: 'warning' },
                { label: t('landlordContractsFilterOverdue'), value: 'Quá hạn', variant: 'danger' },
                { label: t('landlordContractsFilterEnded'), value: 'Đã chấm dứt', variant: 'neutral' },
              ]}
            />
          }
          viewMode={
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
            />
          }
        />

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 bg-card border border-line rounded-2xl">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <Text size="sm" weight="semibold" color="secondary">
              {t('landlordContractsLoading')}
            </Text>
          </div>
        )}

        {/* Error State */}
        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center gap-3 py-16 bg-card border border-danger-subtle rounded-2xl">
            <AlertTriangle className="w-8 h-8 text-danger" />
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
                  <div className="col-span-full">
                    <EmptyState
                      icon={<FileSignature className="w-8 h-8" />}
                      title={t('landlordContractsNoContractsFound')}
                      description={t('landlordContractsSubtitle')}
                      action={
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => router.push('/landlord/contracts/create')}
                          leftIcon={<Plus className="w-4 h-4" />}
                        >
                          {t('landlordContractsCreateBtn')}
                        </Button>
                      }
                    />
                  </div>
                ) : (
                  paginatedContracts.map((c, idx) => {
                    return (
                      <Card
                        key={c.id || idx}
                        onClick={() => router.push(`/landlord/contracts/${c.id}`)}
                        className="group flex flex-col justify-between relative overflow-hidden"
                      >
                        <Card.Header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-3">
                          {/* Card Header: Room & Status */}
                          <div className="flex items-start justify-between gap-3">
                            <Text as="h3" weight="black" size="base" color="default" className="group-hover:text-primary transition-colors">
                              {t('landlordRoomDetailRoomPrefix')} {c.room}
                            </Text>

                            <Chip
                              size="sm"
                              preventHover
                              variant={`${(c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực')
                                ? 'success'
                                : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                  ? 'warning'
                                  : 'default'}`}
                            >
                              {getContractStatusLabel(c.status)}
                            </Chip>
                          </div>
                        </Card.Header>

                        {/* Card Body */}
                        <Card.Body className="px-4 sm:px-5 py-3 space-y-2.5">
                          <div className="flex items-center justify-between text-xs">
                            <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-muted" />
                              {t('landlordContractsRepresentative')}
                            </Text>
                            <div className="flex flex-col items-end">
                              <Text as="span" size="xs" weight="extrabold" color="default">
                                {c.tenant}
                              </Text>
                              {c.members && c.members.length > 0 && (
                                <Text as="span" size="3xs" weight="bold" color="secondary" className="flex items-center gap-1">
                                  <Users className="w-3 h-3 text-muted" />
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
                              <CreditCard className="w-3.5 h-3.5 text-muted" />
                              {t('landlordContractsRentPriceLabel')}:
                            </Text>
                            <Text as="span" size="sm" weight="black" color="brand">
                              {c.price} {t('landlordContractsPerMonth')}
                            </Text>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                              <CalendarDays className="w-3.5 h-3.5 text-muted" />
                              {t('landlordContractsDurationLabel')}
                            </Text>
                            <div className="flex items-center gap-1.5">
                              <Text as="span" size="xs" weight="bold" color="default">
                                {c.startDate} - {c.endDate}
                              </Text>
                              {c.isOverdue && (
                                <Chip size="xs" variant="danger" preventHover>
                                  {t('landlordContractsDueExpired')}
                                </Chip>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs pt-1 border-t border-line">
                            <Text as="span" size="xs" weight="semibold" color="secondary" className="flex items-center gap-1.5">
                              <CreditCard className="w-3.5 h-3.5 text-muted" />
                              {t('landlordContractsPaymentLabel')}
                            </Text>
                            <Chip
                              size="sm"
                              preventHover
                              variant={c.paymentStatus === 'Đã thu đủ' ? 'success' : 'danger'}
                            >
                              {getPaymentStatusLabel(c.paymentStatus)}
                            </Chip>
                          </div>
                        </Card.Body>

                        {/* Card Footer Actions */}
                        <Card.Footer className="px-4 sm:px-5 pt-3 pb-4 flex items-center justify-end gap-2">
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedContract(c)
                                setIsExtendModalOpen(true)
                              }}
                              leftIcon={<CalendarDays />}
                            >
                              {t('landlordContractsBtnExtend')}
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedContract(c)
                                setIsTerminateModalOpen(true)
                              }}
                              leftIcon={<Ban />}
                            >
                              {t('landlordContractsBtnTerminate')}
                            </Button>
                          </div>
                        </Card.Footer>
                      </Card>
                    )
                  })
                )}
              </div>
            ) : (
              /* Table View */
              <div className="bg-card border border-line rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                  <table className="w-full min-w-[850px] text-xs text-left border-collapse">
                    <thead className="text-[11px] font-black text-muted uppercase bg-card-hover/90 backdrop-blur-md border-b border-line sticky top-0 z-20 shadow-xs">
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
                    <tbody className="divide-y divide-line bg-card">
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
                            <TableRow
                              key={c.id || idx}
                              onClick={() => router.push(`/landlord/contracts/${c.id}`)}
                              className="group"
                            >
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Text as="span" size="sm" weight="black" color="brand">
                                  {t('landlordRoomDetailRoomPrefix')} {c.room}
                                </Text>
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
                                  <Text as="span" size="xs" weight="bold" color="default">
                                    {c.startDate} - {c.endDate}
                                  </Text>
                                  {c.isOverdue && (
                                    <Chip size="xs" variant="danger" preventHover className="w-fit mt-0.5">
                                      {t('landlordContractsDueExpired')}
                                    </Chip>
                                  )}
                                </div>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Text as="span" size="sm" weight="black" color="brand">
                                  {c.price}
                                </Text>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Chip
                                  size="sm"
                                  preventHover
                                  variant={c.paymentStatus === 'Đã thu đủ' ? 'success' : 'danger'}
                                >
                                  {getPaymentStatusLabel(c.paymentStatus)}
                                </Chip>
                              </td>
                              <td className="px-5 py-4 whitespace-nowrap">
                                <Chip
                                  size="sm"
                                  preventHover
                                  variant={
                                    c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                      ? 'success'
                                      : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                        ? 'warning'
                                        : 'default'
                                  }
                                >
                                  {getContractStatusLabel(c.status)}
                                </Chip>
                              </td>
                              <td className="px-5 py-4 text-right whitespace-nowrap">
                                <div className="flex items-center justify-end gap-1 text-muted">
                                  <Button
                                    variant="secondary"
                                    size="icon-sm"
                                    onClick={e => {
                                      e.stopPropagation()
                                      setSelectedContract(c)
                                      setIsExtendModalOpen(true)
                                    }}
                                    title={t('landlordContractsBtnExtend')}
                                  >
                                    <CalendarDays />
                                  </Button>
                                  <Button
                                    variant="ghost-danger"
                                    size="icon-sm"
                                    onClick={e => {
                                      e.stopPropagation()
                                      setSelectedContract(c)
                                      setIsTerminateModalOpen(true)
                                    }}
                                    title={t('landlordContractsBtnTerminate')}
                                  >
                                    <Ban />
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
              </div>
            )}

            {/* Standardized Pagination Footer (Rule #9) */}
            <Pagination
              currentPage={currentPage}
              totalItems={totalItems}
              pageSize={rowsPerPage}
              onPageChange={setCurrentPage}
              onPageSizeChange={setRowsPerPage}
              unitLabel={t('landlordContractsPaginationTotalContracts')}
            />

          </>
        )}
      </div>

      {/* Extend Contract Modal */}
      <Modal
        isOpen={isExtendModalOpen}
        onClose={() => requestCloseModal(() => setIsExtendModalOpen(false))}
        size="md"
        zIndex={100}
        title={t('landlordContractsExtendModalTitle')}
        bodyClassName="p-6 space-y-5"
        footer={
          <div className="flex justify-end gap-3 w-full">
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
        }
      >
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
      </Modal>

      {/* Terminate Contract Modal */}
      <Modal
        isOpen={isTerminateModalOpen}
        onClose={() => requestCloseModal(() => setIsTerminateModalOpen(false))}
        size="md"
        zIndex={100}
        header={
          <Text as="h2" size="xl" weight="bold" color="danger">
            {t('landlordContractsTerminateModalTitle')}
          </Text>
        }
        bodyClassName="p-6 space-y-5"
        footer={
          <div className="flex justify-end gap-3 w-full">
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
        }
      >
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

        <div className="border border-line rounded-xl p-4 bg-surface/50 space-y-4">
          <div className="flex items-center gap-2">
            <Gauge className="w-4 h-4 text-primary" />
            <Text as="span" size="sm" weight="medium" color="brand">
              {t('landlordContractsTerminateEndIndexTitle')}
            </Text>
          </div>
          <Text size="xs" color="secondary">
            {t('landlordContractsTerminateEndIndexHint')}
          </Text>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Text as="span" size="sm" weight="semibold" className="w-12 text-foreground">
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
              <Text as="span" size="sm" weight="semibold" className="w-12 text-foreground">
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
      </Modal>

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
