'use client'

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { DashboardPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Receipt,
  Sparkles,
  FileSpreadsheet,
  Calendar,
  AlertTriangle,
  QrCode,
  Check,
  Zap,
  Droplets,
  ShieldCheck,
  Send,
  Loader2,
  Camera,
  Eye,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TableActionButton,
  TextInput,
  NumberInput,
  SelectInput,
  SearchInput,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Text,
  Chip,
  Modal,
  EmptyState,
} from '@/components/ui'
import {
  landlordInvoiceService,
  LandlordInvoiceItem,
  LandlordInvoicesSummary,
} from '@/services/landlord-invoice.service'
import { getRooms, RoomItem } from '@/services/room.service'
import { formatDate } from '@/utils'
import { resolveErrorMessage } from '@/utils/error-resolver'

type InvoiceItem = LandlordInvoiceItem

function InvoicesContent() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('landlord')
  const tErrors = useTranslations('errors')
  const { toast } = useToast()

  const getInvoiceStatusLabel = (status: string) => {
    switch (status) {
      case 'Đã thu':
      case 'Đã thanh toán':
      case 'paid':
        return t('landlordInvoicesStatusPaid')
      case 'Quá hạn':
      case 'overdue':
        return t('landlordInvoicesStatusOverdue')
      case 'Chưa thu':
      case 'Chờ thanh toán':
      case 'unpaid':
      default:
        return t('landlordInvoicesStatusUnpaid')
    }
  }

  // URL Params parsing
  const urlSearch = searchParams.get('search') || searchParams.get('room') || ''
  const urlId = searchParams.get('id') || ''

  const [isMounted, setIsMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all')
  const [searchTerm, setSearchTerm] = useState(urlSearch)
  const [selectedPeriod, setSelectedPeriod] = useState('all')

  // Generate 24 most recent months relative to current date (Rule #18 & user spec)
  const recent24Months = useMemo(() => {
    const list: Array<{ value: string; label: string; month: string; year: string }> = []
    const now = new Date()
    for (let i = 0; i < 24; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const m = String(d.getMonth() + 1).padStart(2, '0')
      const y = String(d.getFullYear())
      const formatted = `${m}/${y}`
      const label =
        i === 0
          ? t('landlordRoomDetailFilterCurrentMonth', { month: formatted })
          : t('landlordRoomDetailFilterMonth', { month: formatted })
      list.push({
        value: formatted,
        label,
        month: m,
        year: y,
      })
    }
    return list
  }, [t])

  const periodOptions = useMemo(
    () => [
      { value: 'all', label: t('landlordInvoicesAllMonths') },
      ...recent24Months.map(m => ({
        value: m.value,
        label: m.label,
      })),
    ],
    [recent24Months, t],
  )

  // Pagination State (Rule #9: Grid=6, Table=10, 5-page window jumping)
  const [pageSize, setPageSize] = useState<number>(viewMode === 'grid' ? 6 : 10)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)

  // Loading & Data States
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [invoices, setInvoices] = useState<InvoiceItem[]>([])
  const [serverSummary, setServerSummary] = useState<LandlordInvoicesSummary>({
    totalInvoicesCount: 0,
    paidCount: 0,
    unpaidCount: 0,
    overdueCount: 0,
    totalPaidAmount: 0,
    totalUnpaidAmount: 0,
  })

  // Modals & Drawer States
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceItem | null>(null)

  // Meter data & photos helper for selected invoice
  const selectedInvoiceMeterData = useMemo(() => {
    if (!selectedInvoice) return null
    const elecReading = selectedInvoice.meterReadings?.find(
      mr => /electr|điện/i.test(mr.serviceName) || mr.unit?.toLowerCase() === 'kwh',
    )
    const waterReading = selectedInvoice.meterReadings?.find(
      mr =>
        /water|nước/i.test(mr.serviceName) ||
        mr.unit?.toLowerCase() === 'm³' ||
        mr.unit?.toLowerCase() === 'm3',
    )
    const elecImg =
      selectedInvoice.elecMeterImage ||
      elecReading?.imageUrl ||
      (selectedInvoice.ocrMeterImage && !selectedInvoice.waterMeterImage
        ? selectedInvoice.ocrMeterImage
        : undefined)
    const waterImg = selectedInvoice.waterMeterImage || waterReading?.imageUrl
    const hasAnyMeterPhoto = Boolean(elecImg || waterImg)

    return {
      elecReading,
      waterReading,
      elecImg,
      waterImg,
      hasAnyMeterPhoto,
    }
  }, [selectedInvoice])

  const [previewPhoto, setPreviewPhoto] = useState<{
    url: string
    title: string
    sub?: string
  } | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false)
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<'create' | 'ocr' | null>(null)

  // Form State for Create Invoice
  const [createForm, setCreateForm] = useState({
    roomId: '',
    roomName: '',
    tenantName: '',
    period: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
    rentAmount: 0,
    elecOld: 0,
    elecNew: 0,
    elecRate: 3500,
    waterOld: 0,
    waterNew: 0,
    waterRate: 15000,
    elecImageUrl: '',
    waterImageUrl: '',
    wifiFee: 100000,
    trashFee: 50000,
    discount: 0,
    deadline: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  })
  const [isCreateFormDirty, setIsCreateFormDirty] = useState(false)

  // Form State for AI OCR Modal
  const [ocrMeterValue, setOcrMeterValue] = useState('0')
  const [isOcrFormDirty, setIsOcrFormDirty] = useState(false)

  // Reset Create Form (Rule #10)
  const resetCreateForm = useCallback(() => {
    const defaultRoom = availableRooms.length > 0 ? availableRooms[0] : null
    let defaultElec = 3500
    let defaultWater = 15000
    if (defaultRoom?.services) {
      const elec = defaultRoom.services.find(
        s =>
          s.isMetered &&
          (s.name.toLowerCase().includes('điện') || s.name.toLowerCase().includes('electric')),
      )
      if (elec) defaultElec = Number(elec.price) || defaultElec
      const water = defaultRoom.services.find(
        s =>
          s.isMetered &&
          (s.name.toLowerCase().includes('nước') || s.name.toLowerCase().includes('water')),
      )
      if (water) defaultWater = Number(water.price) || defaultWater
    }

    setCreateForm({
      roomId: defaultRoom ? defaultRoom.id : '',
      roomName: defaultRoom ? `${t('landlordRoomDetailRoomPrefix')} ${defaultRoom.roomNumber}` : '',
      tenantName: '',
      period: `${String(new Date().getMonth() + 1).padStart(2, '0')}/${new Date().getFullYear()}`,
      rentAmount: 0,
      elecOld: 0,
      elecNew: 0,
      elecRate: defaultElec,
      waterOld: 0,
      waterNew: 0,
      waterRate: defaultWater,
      elecImageUrl: '',
      waterImageUrl: '',
      wifiFee: 100000,
      trashFee: 50000,
      discount: 0,
      deadline: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
    })
    setIsCreateFormDirty(false)
  }, [availableRooms, t])

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update default pageSize on viewMode change (Rule #9)
  useEffect(() => {
    setPageSize(viewMode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }, [viewMode])

  // Fetch available rooms for active building
  useEffect(() => {
    if (!activeBuilding?.id) return
    getRooms(activeBuilding.id)
      .then(res => {
        if (res?.data) {
          setAvailableRooms(res.data)
          if (res.data.length > 0) {
            const first = res.data[0]
            setCreateForm(prev => ({
              ...prev,
              roomId: prev.roomId || first.id,
              roomName: prev.roomName || `${t('landlordRoomDetailRoomPrefix')} ${first.roomNumber}`,
            }))
          }
        }
      })
      .catch(err => {
        console.error('Failed to load rooms:', err)
      })
  }, [activeBuilding?.id, t])

  // Fetch invoices from backend
  const fetchInvoices = useCallback(async () => {
    if (!activeBuilding?.id) return
    try {
      setIsLoading(true)
      let queryMonth = 'all'
      let queryYear = 'all'
      if (selectedPeriod !== 'all') {
        const parts = selectedPeriod.split('/')
        if (parts.length === 2) {
          queryMonth = parts[0]
          queryYear = parts[1]
        }
      }

      const res = await landlordInvoiceService.getLandlordInvoices(activeBuilding.id, {
        search: searchTerm,
        status: activeTab,
        month: queryMonth,
        year: queryYear,
        page: currentPage,
        limit: pageSize,
      })
      if (res && res.success) {
        setInvoices(res.data || [])
        setServerSummary(res.summary)
        setTotalRecords(res.meta.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch landlord invoices:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, searchTerm, activeTab, selectedPeriod, currentPage, pageSize])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Handle URL deep-linking: ?id=INV-... or ?search=... or ?room=101
  useEffect(() => {
    if (urlId) {
      const matchInv = invoices.find(
        i =>
          i.id.toLowerCase() === urlId.toLowerCase() ||
          i.roomId.toLowerCase() === urlId.toLowerCase(),
      )
      if (matchInv) {
        setSelectedInvoice(matchInv)
      }
    } else if (urlSearch) {
      const matchInv = invoices.find(
        i => i.roomId === urlSearch || i.roomName.toLowerCase().includes(urlSearch.toLowerCase()),
      )
      if (matchInv) {
        setSelectedInvoice(matchInv)
      }
    }
  }, [urlId, urlSearch, invoices])

  // Calculate Metrics from serverSummary
  const totalInvoicesCount = serverSummary.totalInvoicesCount
  const paidCount = serverSummary.paidCount
  const unpaidCount = serverSummary.unpaidCount
  const overdueCount = serverSummary.overdueCount
  const totalPaidAmount = serverSummary.totalPaidAmount
  const totalUnpaidAmount = serverSummary.totalUnpaidAmount

  const paginatedInvoices = invoices
  const totalItems = totalRecords

  // Format large money amounts cleanly without wrapping
  const formatLargeMoney = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} ${t('landlordInvoicesUnitBillion')}`
    }
    if (amount >= 100_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')} ${t('landlordInvoicesUnitMillion')}`
    }
    return `${amount.toLocaleString('vi-VN')} ₫`
  }

  // Handlers for Modals (Rule #10)
  const handleOpenCreateModal = () => {
    resetCreateForm()
    setIsCreateModalOpen(true)
  }

  const handleRequestCloseCreate = () => {
    if (isCreateFormDirty) {
      setConfirmCloseTarget('create')
    } else {
      setIsCreateModalOpen(false)
      resetCreateForm()
    }
  }

  const handleOpenOcrModal = () => {
    setOcrMeterValue(String(createForm.elecNew || createForm.elecOld || '0'))
    setIsOcrFormDirty(false)
    setIsOcrModalOpen(true)
  }

  const handleRequestCloseOcr = () => {
    if (isOcrFormDirty) {
      setConfirmCloseTarget('ocr')
    } else {
      setIsOcrModalOpen(false)
      setOcrMeterValue('0')
      setIsOcrFormDirty(false)
    }
  }

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === 'create') {
      setIsCreateModalOpen(false)
      resetCreateForm()
    } else if (confirmCloseTarget === 'ocr') {
      setIsOcrModalOpen(false)
      setOcrMeterValue('0')
      setIsOcrFormDirty(false)
    }
    setConfirmCloseTarget(null)
  }

  // Mark Paid Handler with real backend recording (Rule #15)
  const handleMarkAsPaid = async (
    invId: string,
    method = t('landlordInvoicesPaymentMethodManual'),
  ) => {
    if (!activeBuilding?.id) return
    try {
      const isCash =
        method.toLowerCase().includes('tiền mặt') || method.toLowerCase().includes('cash')
      await landlordInvoiceService.recordManualPayment(activeBuilding.id, invId, {
        method: isCash ? 'cash' : 'banking',
        note: method,
      })
      await fetchInvoices()
      if (selectedInvoice && selectedInvoice.id === invId) {
        const detail = await landlordInvoiceService.getLandlordInvoiceDetail(
          activeBuilding.id,
          invId,
        )
        if (detail?.data) setSelectedInvoice(detail.data)
      }
      toast.success(t('landlordInvoicesBtnConfirmPaid'))
    } catch (err: unknown) {
      console.error('Failed to update invoice payment status:', err)
      toast.error(resolveErrorMessage(err, tErrors, t('landlordInvoicesAlertUpdateStatusFailed')))
    }
  }

  // Create Manual Invoice Handler (Rule #15)
  const handleCreateInvoiceSubmit = async () => {
    if (!activeBuilding?.id) return
    if (!createForm.roomId) {
      toast.warning(t('landlordInvoicesAlertSelectRoom'))
      return
    }
    try {
      setIsSubmitting(true)
      await landlordInvoiceService.createManualInvoice(activeBuilding.id, {
        roomId: createForm.roomId,
        period: createForm.period,
        dueDate: createForm.deadline
          ? new Date(createForm.deadline).toISOString()
          : new Date().toISOString(),
        rentAmount: createForm.rentAmount,
        elecOld: createForm.elecOld,
        elecNew: createForm.elecNew,
        elecRate: createForm.elecRate,
        waterOld: createForm.waterOld,
        waterNew: createForm.waterNew,
        waterRate: createForm.waterRate,
        elecImageUrl: createForm.elecImageUrl || undefined,
        waterImageUrl: createForm.waterImageUrl || undefined,
        serviceFees: [
          { name: 'Wifi', amount: createForm.wifiFee },
          { name: t('landlordInvoicesFeeTrash'), amount: createForm.trashFee },
        ],
        discount: createForm.discount,
      })
      setIsCreateModalOpen(false)
      resetCreateForm()
      toast.success(t('landlordInvoicesBtnSubmitCreate'))
      await fetchInvoices()
    } catch (err: unknown) {
      console.error('Failed to create manual invoice:', err)
      toast.error(resolveErrorMessage(err, tErrors, t('landlordInvoicesAlertCreateFailed')))
    } finally {
      setIsSubmitting(false)
    }
  }

  // VietQR Code Generator URL
  const getVietQrUrl = (inv: InvoiceItem) => {
    const bankBin = '970422' // MBBank BIN
    const accountNo = '0988123456'
    const amount = inv.totalAmount
    const memo = encodeURIComponent(`${inv.id} ${inv.roomName.replace(' ', '')}`)
    return `https://img.vietqr.io/image/${bankBin}-${accountNo}-compact2.png?amount=${amount}&addInfo=${memo}&accountName=DORMIO%20BHMS`
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordInvoicesTotalInvoicesShort'),
        value: totalInvoicesCount,
        icon: <Receipt className="w-5 h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[150px]',
        labelColor: 'subtle',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'overdue',
        label: t('landlordInvoicesOverdueShort'),
        value: overdueCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueClassName: 'text-rose-400 text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'paid',
        label: t('landlordInvoicesPaidShort').replace('{count}', String(paidCount)),
        value: formatLargeMoney(totalPaidAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 lg:w-[160px]',
        labelClassName: 'text-emerald-400',
        valueClassName: 'text-emerald-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'unpaid',
        label: t('landlordInvoicesUnpaidShort').replace('{count}', String(unpaidCount)),
        value: formatLargeMoney(totalUnpaidAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[160px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
    ],
    [t, totalInvoicesCount, overdueCount, paidCount, totalPaidAmount, unpaidCount, totalUnpaidAmount],
  )

  if (!isMounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <DashboardPageHeader
        title={t('landlordInvoicesTitle')}
        subtitle={t('landlordInvoicesSubtitle')}
        actions={
          <>
            <Button
              variant="success"
              size="md"
              leftIcon={<FileSpreadsheet className="shrink-0" />}
            >
              {t('landlordInvoicesBtnExportExcel')}
            </Button>

            <Button
              size="md"
              onClick={handleOpenCreateModal}
              className="sm:w-auto"
              leftIcon={<Plus className="shrink-0" />}
            >
              {t('landlordInvoicesBtnCreateInvoice')}
            </Button>
          </>
        }
      />

      {/* Dark Hero Summary Banner */}
      <LandlordStatBanner
        chips={statChips}
        watermarkIcon={<Receipt className="w-64 h-64" />}
      />

      {/* Main Filter & Tabs Control Bar */}
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordInvoicesSearchPlaceholder')}
            value={searchTerm}
            onChange={val => {
              setSearchTerm(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full space-y-0"
          />
        }
        filters={
          <>
            <SelectInput
              value={selectedPeriod}
              onChange={e => {
                setSelectedPeriod(e.target.value)
                setCurrentPage(1)
              }}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-primary" />}
              containerClassName="w-auto min-w-[170px] space-y-0"
              options={periodOptions}
            />
            <SelectInput
              value={activeTab}
              onChange={e => {
                setActiveTab(e.target.value as 'all' | 'unpaid' | 'paid' | 'overdue')
                setCurrentPage(1)
              }}
              containerClassName="w-auto min-w-[150px] space-y-0"
              options={[
                {
                  value: 'all',
                  label: t('landlordInvoicesTabAll', { count: totalInvoicesCount }),
                },
                {
                  value: 'unpaid',
                  label: t('landlordInvoicesTabUnpaid', { count: unpaidCount }),
                },
                {
                  value: 'paid',
                  label: t('landlordInvoicesTabPaid', { count: paidCount }),
                },
                {
                  value: 'overdue',
                  label: t('landlordInvoicesTabOverdue', { count: overdueCount }),
                },
              ]}
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

      {/* Main Content Display (Grid or Table View) */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <Text weight="bold" size="sm" color="default">
            {t('landlordInvoicesLoading')}
          </Text>
        </div>
      ) : invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title={t('landlordInvoicesNoDataTitle')}
          description={t('landlordInvoicesNoDataDesc')}
          action={
            <Button
              size="md"
              onClick={handleOpenCreateModal}
              leftIcon={<Plus />}
            >
              {t('landlordInvoicesBtnCreateInvoice')}
            </Button>
          }
        />
      ) : paginatedInvoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title={t('landlordInvoicesEmptyTitle')}
          description={t('landlordInvoicesEmptyDesc')}
          action={
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                setSearchTerm('')
                setSelectedPeriod('all')
                setActiveTab('all')
              }}
            >
              {t('landlordInvoicesBtnResetFilter')}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedInvoices.map(inv => {
            const isPaid = inv.status === 'Đã thu'
            const isOverdue = inv.status === 'Quá hạn'

            return (
              <Card
                key={inv.id}
                className={`space-y-4 flex flex-col justify-between ${
                  isPaid
                    ? 'border-success-subtle hover:border-emerald-300'
                    : isOverdue
                      ? 'border-danger-subtle hover:border-rose-300 bg-danger-soft/20'
                      : 'border-line hover:border-primary/40'
                }`}
                onClick={event => {
                  event.stopPropagation()
                  setSelectedInvoice(inv)
                }}
              >
                {/* Header info */}
                <Card.Header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-primary shrink-0" />
                    <Text as="span" size="sm" weight="extrabold" color="default">
                      {inv.roomName}
                    </Text>
                  </div>
                  <Chip
                    preventHover
                    size="sm"
                    variant={isPaid ? 'success' : isOverdue ? 'danger' : 'warning'}
                  >
                    {getInvoiceStatusLabel(inv.status)}
                  </Chip>
                </Card.Header>

                <Card.Body className="px-4 sm:px-5 py-0 space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="semibold">
                        {t('landlordInvoicesLabelTenant')}
                      </Text>
                      <Text as="span" size="xs" weight="bold" color="default">
                        {inv.tenantName}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="semibold">
                        {t('landlordInvoicesLabelPeriod')}
                      </Text>
                      <Text as="span" size="xs" weight="bold" color="default">
                        {t('landlordInvoicesLabelPeriodMonth').replace('{period}', inv.period)}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="semibold">
                        {t('landlordInvoicesLabelInvoiceId')}
                      </Text>
                      <Text as="span" size="2xs" color="subtle" mono>
                        {inv.id}
                      </Text>
                    </div>
                  </div>

                  {/* Fee Items Breakdown Summary */}
                  <div className="p-3 bg-surface rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Text as="span" size="2xs" color="secondary">
                        {t('landlordInvoicesFeeRent')}
                      </Text>
                      <Text as="span" size="2xs" weight="bold" color="default">
                        {inv.rentAmount.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text as="span" size="2xs" color="secondary">
                        {t('landlordInvoicesFeeElec').replace(
                          '{usage}',
                          String(inv.elecNew - inv.elecOld),
                        )}
                      </Text>
                      <Text as="span" size="2xs" weight="bold" color="default">
                        {((inv.elecNew - inv.elecOld) * inv.elecRate).toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text as="span" size="2xs" color="secondary">
                        {t('landlordInvoicesFeeWater').replace(
                          '{usage}',
                          String(inv.waterNew - inv.waterOld),
                        )}
                      </Text>
                      <Text as="span" size="2xs" weight="bold" color="default">
                        {((inv.waterNew - inv.waterOld) * inv.waterRate).toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                  </div>

                  {Boolean(
                    inv.elecMeterImage ||
                      inv.waterMeterImage ||
                      inv.ocrMeterImage ||
                      inv.meterReadings?.some(m => m.imageUrl),
                  ) && (
                    <div className="pt-1 flex items-center gap-1.5 text-primary">
                      <Camera className="w-3.5 h-3.5 shrink-0" />
                      <Text as="span" size="3xs" weight="bold" color="brand">
                        {t('landlordInvoicesHasMeterPhotosBadge')}
                      </Text>
                    </div>
                  )}
                </Card.Body>

                {/* Total & Action Footer */}
                <Card.Footer className="px-4 sm:px-5 pt-3 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text
                        as="span"
                        size="3xs"
                        weight="bold"
                        color="secondary"
                        uppercase
                        className="block tracking-wider"
                      >
                        {t('landlordInvoicesLabelTotal')}
                      </Text>
                      <Text as="span" size="base" weight="black" color="brand">
                        {inv.totalAmount.toLocaleString('vi-VN')} ₫
                      </Text>
                    </div>
                    <Text
                      as="span"
                      size="3xs"
                      weight={isOverdue ? 'black' : 'bold'}
                      color={isOverdue ? 'danger' : 'secondary'}
                    >
                      {t('landlordInvoicesLabelDeadline').replace(
                        '{deadline}',
                        formatDate(inv.deadline),
                      )}
                    </Text>
                  </div>

                  {!isPaid && (
                    <div className="flex items-center justify-end">
                      <Button
                        variant="success"
                        size="md"
                        fullWidth
                        onClick={e => {
                          e.stopPropagation()
                          handleMarkAsPaid(inv.id)
                        }}
                        title={t('landlordInvoicesTooltipMarkPaid')}
                        leftIcon={<Check />}
                      >
                        {t('landlordInvoicesBtnCollect')}
                      </Button>
                    </div>
                  )}
                </Card.Footer>
              </Card>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9 Alternative) */
        <div className="bg-card border border-line rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="text-[11px] text-muted bg-surface border-b border-line uppercase font-black tracking-wider">
                <tr>
                  <th className="px-4 py-3">{t('landlordInvoicesColInvoiceId')}</th>
                  <th className="px-4 py-3">{t('landlordInvoicesRoom')}</th>
                  <th className="px-4 py-3">{t('landlordInvoicesSectionTenant')}</th>
                  <th className="px-4 py-3">{t('landlordInvoicesColPeriod')}</th>
                  <th className="px-4 py-3">{t('landlordInvoicesColTotal')}</th>
                  <th className="px-4 py-3">{t('landlordInvoicesColDeadline')}</th>
                  <th className="px-4 py-3">{t('landlordInvoicesColStatus')}</th>
                  <th className="px-4 py-3 text-right">{t('landlordInvoicesColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-semibold">
                {paginatedInvoices.map(inv => (
                  <TableRow
                    key={inv.id}
                    className="group"
                    onClick={() => setSelectedInvoice(inv)}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <Text as="span" size="xs" weight="bold" color="default" mono>
                          {inv.id}
                        </Text>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Text as="span" size="xs" weight="black" color="default">
                          {inv.roomName}
                        </Text>
                        {Boolean(
                          inv.elecMeterImage ||
                            inv.waterMeterImage ||
                            inv.ocrMeterImage ||
                            inv.meterReadings?.some(m => m.imageUrl),
                        ) && (
                          <span
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-primary-soft text-primary text-[10px] font-bold"
                            title={t('landlordInvoicesHasMeterPhotosBadge')}
                          >
                            <Camera className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Text as="span" size="xs" weight="medium" color="default">
                        {inv.tenantName}
                      </Text>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Text as="span" size="xs" color="secondary">
                        {t('landlordInvoicesLabelPeriodMonth').replace('{period}', inv.period)}
                      </Text>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Text as="span" size="sm" weight="black" color="brand">
                        {inv.totalAmount.toLocaleString('vi-VN')} ₫
                      </Text>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Text
                        as="span"
                        size="xs"
                        weight={inv.status === 'Quá hạn' ? 'black' : 'bold'}
                        color={inv.status === 'Quá hạn' ? 'danger' : 'secondary'}
                      >
                        {formatDate(inv.deadline)}
                      </Text>
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <Chip
                        preventHover
                        size="sm"
                        variant={
                          inv.status === 'Đã thu'
                            ? 'success'
                            : inv.status === 'Quá hạn'
                              ? 'danger'
                              : 'warning'
                        }
                      >
                        {getInvoiceStatusLabel(inv.status)}
                      </Chip>
                    </td>
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      {inv.status !== 'Đã thu' ? (
                        <TableActionButton
                          icon={<Check />}
                          variant="success"
                          onClick={event => {
                            event.stopPropagation()
                            handleMarkAsPaid(inv.id)
                          }}
                          title={t('landlordInvoicesTooltipMarkPaid')}
                        />
                      ) : (
                        <Text as="span" size="xs" color="secondary">
                          —
                        </Text>
                      )}
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Bar (Standard Dormio Rule #9) */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeMax={50}
          unitLabel={t('landlordInvoicesPaginationItems')}
        />
      )}

      {/* 📄 DETAILED INVOICE LIGHTBOX MODAL / DRAWER */}
      <Modal
        isOpen={Boolean(selectedInvoice)}
        onClose={() => setSelectedInvoice(null)}
        size="3xl"
      >
        {selectedInvoice && (
          <>
            {/* Modal Header */}
            <Modal.Header
              icon={
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
              }
              title={
                <div className="flex items-center gap-2">
                  <Text as="span" size="base" weight="black" color="default">
                    {t('landlordInvoicesModalDetailTitle').replace(
                      '{room}',
                      selectedInvoice.roomName,
                    )}
                  </Text>
                  <Chip
                    size="sm"
                    preventHover
                    variant={
                      selectedInvoice.status === 'Đã thu'
                        ? 'success'
                        : selectedInvoice.status === 'Quá hạn'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    {getInvoiceStatusLabel(selectedInvoice.status)}
                  </Chip>
                </div>
              }
              description={t('landlordInvoicesModalDetailSub')
                .replace('{id}', selectedInvoice.id)
                .replace('{period}', selectedInvoice.period)}
            />

            {/* Modal Scroll Content */}
            <Modal.Body className="p-6 space-y-6 text-xs max-h-[75vh] overflow-y-auto">
              {/* Tenant & Building Info Card */}
              <div className="p-4 bg-surface border border-line rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Text
                    as="span"
                    size="3xs"
                    weight="extrabold"
                    color="secondary"
                    uppercase
                    className="tracking-wider block"
                  >
                    {t('landlordInvoicesSectionTenant')}
                  </Text>
                  <Text as="p" size="sm" weight="black" color="default">
                    {selectedInvoice.tenantName}
                  </Text>
                  <Text as="p" size="xs" weight="semibold" color="secondary">
                    {selectedInvoice.tenantPhone}
                  </Text>
                </div>

                <div className="space-y-1 sm:text-right">
                  <Text
                    as="span"
                    size="3xs"
                    weight="extrabold"
                    color="secondary"
                    uppercase
                    className="tracking-wider block"
                  >
                    {t('landlordInvoicesSectionDeadlineAndCreated')}
                  </Text>
                  <Text as="p" size="xs" weight="bold" color="default">
                    {t('landlordInvoicesDeadlinePrefix')}{' '}
                    <Text
                      as="span"
                      weight={selectedInvoice.status === 'Quá hạn' ? 'black' : 'bold'}
                      color={selectedInvoice.status === 'Quá hạn' ? 'danger' : 'default'}
                    >
                      {selectedInvoice.deadline}
                    </Text>
                    {selectedInvoice.status === 'Quá hạn' && (
                      <span className="ml-1.5 px-2 py-0.5 bg-danger-soft text-danger text-[10px] font-black rounded-md border border-danger-subtle">
                        {t('landlordInvoicesStatusOverdue')}
                      </span>
                    )}
                  </Text>
                  <Text as="p" size="2xs" weight="medium" color="secondary">
                    {t('landlordInvoicesCreatedPrefix')} {selectedInvoice.createdAt}
                  </Text>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="space-y-3">
                <Text
                  as="h4"
                  size="xs"
                  weight="black"
                  color="default"
                  uppercase
                  className="tracking-wider flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-primary" />{' '}
                  {t('landlordInvoicesSectionFeeBreakdown')}
                </Text>

                <div className="border border-line rounded-2xl overflow-x-auto">
                  <table className="w-full text-xs text-left min-w-[500px]">
                    <thead className="bg-surface border-b border-line font-black text-muted uppercase text-[10px]">
                      <tr>
                        <th className="px-4 py-2.5">{t('landlordInvoicesColItem')}</th>
                        <th className="px-4 py-2.5">{t('landlordInvoicesColOldNewIndex')}</th>
                        <th className="px-4 py-2.5 text-right">
                          {t('landlordInvoicesColUnitPrice')}
                        </th>
                        <th className="px-4 py-2.5 text-right">{t('landlordInvoicesColAmount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line font-semibold">
                      <tr>
                        <td className="px-4 py-3">
                          <Text as="span" weight="bold" color="default">
                            {t('landlordInvoicesItemRoomRent').replace(
                              '{room}',
                              selectedInvoice.roomName,
                            )}
                          </Text>
                        </td>
                        <td className="px-4 py-3">
                          <Text as="span" color="secondary">
                            -
                          </Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Text as="span" color="default">
                            {selectedInvoice.rentAmount.toLocaleString('vi-VN')} ₫
                          </Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Text as="span" weight="black" color="default">
                            {selectedInvoice.rentAmount.toLocaleString('vi-VN')} ₫
                          </Text>
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-amber-500" />
                            <Text as="span" weight="bold" color="default">
                              {t('landlordInvoicesItemElec')}
                            </Text>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Text as="span" color="secondary">
                            {selectedInvoice.elecOld} &rarr; {selectedInvoice.elecNew} (
                            {selectedInvoice.elecNew - selectedInvoice.elecOld} kWh)
                          </Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Text as="span" color="default">
                            {selectedInvoice.elecRate.toLocaleString('vi-VN')} ₫
                          </Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Text as="span" weight="black" color="default">
                            {(
                              (selectedInvoice.elecNew - selectedInvoice.elecOld) *
                              selectedInvoice.elecRate
                            ).toLocaleString('vi-VN')}{' '}
                            ₫
                          </Text>
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5">
                            <Droplets className="w-3.5 h-3.5 text-primary" />
                            <Text as="span" weight="bold" color="default">
                              {t('landlordInvoicesItemWater')}
                            </Text>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Text as="span" color="secondary">
                            {selectedInvoice.waterOld} &rarr; {selectedInvoice.waterNew} (
                            {selectedInvoice.waterNew - selectedInvoice.waterOld} m³)
                          </Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Text as="span" color="default">
                            {selectedInvoice.waterRate.toLocaleString('vi-VN')} ₫
                          </Text>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Text as="span" weight="black" color="default">
                            {(
                              (selectedInvoice.waterNew - selectedInvoice.waterOld) *
                              selectedInvoice.waterRate
                            ).toLocaleString('vi-VN')}{' '}
                            ₫
                          </Text>
                        </td>
                      </tr>

                      {selectedInvoice.serviceFees.map((fee, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3">
                            <Text as="span" weight="bold" color="default">
                              {fee.name}
                            </Text>
                          </td>
                          <td className="px-4 py-3">
                            <Text as="span" color="secondary">
                              {t('landlordInvoicesItemFixedMonthly')}
                            </Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Text as="span" color="default">
                              {fee.amount.toLocaleString('vi-VN')} ₫
                            </Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Text as="span" weight="black" color="default">
                              {fee.amount.toLocaleString('vi-VN')} ₫
                            </Text>
                          </td>
                        </tr>
                      ))}

                      {selectedInvoice.discount > 0 && (
                        <tr className="bg-danger-soft">
                          <td className="px-4 py-3">
                            <Text as="span" weight="bold" color="danger">
                              {t('landlordInvoicesItemDiscount')}
                            </Text>
                          </td>
                          <td className="px-4 py-3">
                            <Text as="span" color="secondary">
                              -
                            </Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Text as="span" color="danger">
                              -{selectedInvoice.discount.toLocaleString('vi-VN')} ₫
                            </Text>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Text as="span" weight="black" color="danger">
                              -{selectedInvoice.discount.toLocaleString('vi-VN')} ₫
                            </Text>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Utility Meter Reading Proof Photos Section (UC-L-06 & User Requirement) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Text
                    as="h4"
                    size="xs"
                    weight="black"
                    color="default"
                    uppercase
                    className="tracking-wider flex items-center gap-1.5"
                  >
                    <Camera className="w-4 h-4 text-primary" />{' '}
                    {t('landlordInvoicesMeterPhotosTitle')}
                  </Text>
                  {selectedInvoiceMeterData?.hasAnyMeterPhoto && (
                    <Chip size="sm" preventHover variant="primary">
                      {t('landlordInvoicesHasMeterPhotosBadge')}
                    </Chip>
                  )}
                </div>

                <Text as="p" size="2xs" color="secondary">
                  {t('landlordInvoicesMeterPhotosDesc')}
                </Text>

                {selectedInvoiceMeterData?.hasAnyMeterPhoto ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Electricity Meter Photo Card */}
                    <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Zap className="w-4 h-4 text-amber-500" />
                          <Text as="span" size="xs" weight="black" color="default">
                            {t('landlordInvoicesElecMeterPhoto')}
                          </Text>
                        </div>
                        <Text as="span" size="2xs" weight="bold" color="warning">
                          {selectedInvoice.elecNew} kWh
                        </Text>
                      </div>

                      {selectedInvoiceMeterData.elecImg ? (
                        <div
                          className="relative rounded-xl overflow-hidden border border-line bg-zinc-950 aspect-video flex items-center justify-center cursor-pointer group shadow-2xs hover:border-primary/50 transition-colors"
                          onClick={() =>
                            setPreviewPhoto({
                              url: selectedInvoiceMeterData.elecImg!,
                              title: `${t('landlordInvoicesElecMeterPhoto')} - ${selectedInvoice.roomName}`,
                              sub: selectedInvoiceMeterData.elecReading?.recordedAt
                                ? t('landlordInvoicesPhotoRecordedAt').replace(
                                    '{time}',
                                    formatDate(selectedInvoiceMeterData.elecReading.recordedAt),
                                  )
                                : t('landlordInvoicesPhotoReadingValue')
                                    .replace('{value}', String(selectedInvoice.elecNew))
                                    .replace('{unit}', 'kWh'),
                            })
                          }
                        >
                          <img
                            src={selectedInvoiceMeterData.elecImg}
                            alt={t('landlordInvoicesElecMeterPhoto')}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                            <Eye className="w-4 h-4" />
                            <Text as="span" size="xs" weight="bold" color="white">
                              {t('landlordInvoicesViewFullPhoto')}
                            </Text>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-line bg-card p-6 text-center space-y-1">
                          <Camera className="w-6 h-6 text-muted mx-auto" />
                          <Text as="p" size="2xs" color="secondary">
                            {t('landlordInvoicesNoElecMeterPhoto')}
                          </Text>
                        </div>
                      )}

                      {selectedInvoiceMeterData.elecReading?.recordedAt && (
                        <Text as="p" size="3xs" color="secondary">
                          {t('landlordInvoicesPhotoRecordedAt').replace(
                            '{time}',
                            formatDate(selectedInvoiceMeterData.elecReading.recordedAt),
                          )}
                        </Text>
                      )}
                    </div>

                    {/* Water Meter Photo Card */}
                    <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <Droplets className="w-4 h-4 text-primary" />
                          <Text as="span" size="xs" weight="black" color="default">
                            {t('landlordInvoicesWaterMeterPhoto')}
                          </Text>
                        </div>
                        <Text as="span" size="2xs" weight="bold" color="brand">
                          {selectedInvoice.waterNew} m³
                        </Text>
                      </div>

                      {selectedInvoiceMeterData.waterImg ? (
                        <div
                          className="relative rounded-xl overflow-hidden border border-line bg-zinc-950 aspect-video flex items-center justify-center cursor-pointer group shadow-2xs hover:border-primary/50 transition-colors"
                          onClick={() =>
                            setPreviewPhoto({
                              url: selectedInvoiceMeterData.waterImg!,
                              title: `${t('landlordInvoicesWaterMeterPhoto')} - ${selectedInvoice.roomName}`,
                              sub: selectedInvoiceMeterData.waterReading?.recordedAt
                                ? t('landlordInvoicesPhotoRecordedAt').replace(
                                    '{time}',
                                    formatDate(selectedInvoiceMeterData.waterReading.recordedAt),
                                  )
                                : t('landlordInvoicesPhotoReadingValue')
                                    .replace('{value}', String(selectedInvoice.waterNew))
                                    .replace('{unit}', 'm³'),
                            })
                          }
                        >
                          <img
                            src={selectedInvoiceMeterData.waterImg}
                            alt={t('landlordInvoicesWaterMeterPhoto')}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white">
                            <Eye className="w-4 h-4" />
                            <Text as="span" size="xs" weight="bold" color="white">
                              {t('landlordInvoicesViewFullPhoto')}
                            </Text>
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-xl border border-dashed border-line bg-card p-6 text-center space-y-1">
                          <Camera className="w-6 h-6 text-muted mx-auto" />
                          <Text as="p" size="2xs" color="secondary">
                            {t('landlordInvoicesNoWaterMeterPhoto')}
                          </Text>
                        </div>
                      )}

                      {selectedInvoiceMeterData.waterReading?.recordedAt && (
                        <Text as="p" size="3xs" color="secondary">
                          {t('landlordInvoicesPhotoRecordedAt').replace(
                            '{time}',
                            formatDate(selectedInvoiceMeterData.waterReading.recordedAt),
                          )}
                        </Text>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-surface border border-dashed border-line rounded-2xl flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card border border-line flex items-center justify-center text-muted shrink-0">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <Text as="p" size="xs" weight="bold" color="default">
                        {t('landlordInvoicesNoMeterPhotos')}
                      </Text>
                      <Text as="p" size="2xs" color="secondary">
                        {t('landlordInvoicesAttachPhotosHint')}
                      </Text>
                    </div>
                  </div>
                )}
              </div>

              {/* Total Calculation Card & VietQR Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                {/* VietQR Bank Card */}
                <div className="p-4 bg-success-soft border border-success-subtle rounded-2xl flex items-center gap-4">
                  <div className="w-24 h-24 bg-card rounded-xl p-1 shadow-2xs shrink-0 flex items-center justify-center overflow-hidden border border-line">
                    <img
                      src={getVietQrUrl(selectedInvoice)}
                      alt={t('landlordInvoicesVietQrAlt')}
                      className="w-full h-full object-contain"
                    />
                  </div>

                  <div className="space-y-1 text-[11px] min-w-0">
                    <Text
                      as="span"
                      size="xs"
                      weight="black"
                      color="brand"
                      className="flex items-center gap-1"
                    >
                      <QrCode className="w-3.5 h-3.5" /> {t('landlordInvoicesVietQrAuto')}
                    </Text>
                    <Text as="p" size="xs" weight="bold" color="default">
                      {t('landlordInvoicesVietQrBank')}
                    </Text>
                    <Text as="p" size="xs" weight="bold" color="default" mono>
                      {t('landlordInvoicesVietQrAccount')}
                    </Text>
                    <Text as="p" size="xs" weight="medium" color="secondary" className="truncate">
                      {t('landlordInvoicesVietQrMemo').replace(
                        '{memo}',
                        `${selectedInvoice.id} ${selectedInvoice.roomName.replace(' ', '')}`,
                      )}
                    </Text>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="p-5 bg-zinc-900 text-white rounded-2xl space-y-2 text-right shadow-inner">
                  <Text
                    as="span"
                    size="3xs"
                    weight="bold"
                    uppercase
                    color="secondary"
                    className="tracking-wider block"
                  >
                    {t('landlordInvoicesGrandTotal')}
                  </Text>
                  <Text as="span" size="2xl" weight="black" color="brand" className="block sm:text-3xl">
                    {selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫
                  </Text>
                  {selectedInvoice.paidAt && (
                    <Text as="span" size="3xs" weight="bold" color="success" className="block">
                      {t('landlordInvoicesPaidAtBadgeDetail')
                        .replace('{time}', selectedInvoice.paidAt || '')
                        .replace('{method}', selectedInvoice.paymentMethod || '')}
                    </Text>
                  )}
                </div>
              </div>
            </Modal.Body>

            {/* Modal Footer Actions (Rule #18: size="md") */}
            <Modal.Footer className="flex flex-wrap items-center justify-between gap-3 bg-card">
              {/* If UNPAID: Show "Nhắc Thu Tiền Qua Chat" button */}
              {selectedInvoice.status !== 'Đã thu' ? (
                <Button
                  variant="outline"
                  size="md"
                  onClick={() => {
                    const roomNum = selectedInvoice.roomId
                    const tenantName = selectedInvoice.tenantName
                    setSelectedInvoice(null)
                    router.push(
                      `/landlord/messages?room=${encodeURIComponent(roomNum)}&tenant=${encodeURIComponent(tenantName)}&invId=${encodeURIComponent(selectedInvoice.id)}&amount=${selectedInvoice.totalAmount}&period=${encodeURIComponent(selectedInvoice.period)}&autoSend=true`,
                    )
                  }}
                  leftIcon={<Send />}
                >
                  {t('landlordInvoicesBtnRemindChat')}
                </Button>
              ) : (
                /* If PAID: HIDE "Nhắc thu tiền", show Paid Confirmation Status Badge */
                <div className="flex items-center gap-2 px-3.5 py-2 bg-success-soft border border-success-subtle text-success text-xs font-black rounded-xl">
                  <ShieldCheck className="w-4 h-4 text-success shrink-0" />
                  <Text as="span" size="xs" weight="black" color="inherit">
                    {t('landlordInvoicesPaidAtBadge')
                      .replace('{time}', selectedInvoice.paidAt || '')
                      .replace('{method}', selectedInvoice.paymentMethod || '')}
                  </Text>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* If UNPAID: Show "Xác Nhận Đã Thu Tiền" button */}
                {selectedInvoice.status !== 'Đã thu' && (
                  <Button
                    variant="success"
                    size="md"
                    onClick={() =>
                      handleMarkAsPaid(selectedInvoice.id, t('landlordInvoicesPaymentMethodManual'))
                    }
                    leftIcon={<Check />}
                  >
                    {t('landlordInvoicesBtnConfirmPaid')}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  size="md"
                  onClick={() => setSelectedInvoice(null)}
                >
                  {t('commonClose')}
                </Button>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ➕ CREATE NEW INVOICE MODAL */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleRequestCloseCreate}
        size="2xl"
      >
        {/* Modal Header */}
        <Modal.Header
          icon={
            <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
              <Plus className="w-5 h-5" />
            </div>
          }
          title={t('landlordInvoicesModalCreateTitle')}
          description={t('landlordInvoicesModalCreateSub')}
        />

        {/* Modal Form Content */}
        <Modal.Body className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <SelectInput
              label={t('landlordInvoicesFieldRoom')}
              value={createForm.roomId}
              onChange={e => {
                const selectedId = e.target.value
                const r = availableRooms.find(rm => rm.id === selectedId)
                let elecRate = createForm.elecRate
                let waterRate = createForm.waterRate
                if (r?.services) {
                  const elec = r.services.find(
                    s =>
                      s.isMetered &&
                      (s.name.toLowerCase().includes('điện') ||
                        s.name.toLowerCase().includes('electric')),
                  )
                  if (elec) elecRate = Number(elec.price) || elecRate
                  const water = r.services.find(
                    s =>
                      s.isMetered &&
                      (s.name.toLowerCase().includes('nước') ||
                        s.name.toLowerCase().includes('water')),
                  )
                  if (water) waterRate = Number(water.price) || waterRate
                }
                setCreateForm({
                  ...createForm,
                  roomId: selectedId,
                  roomName: r ? `${t('landlordRoomDetailRoomPrefix')} ${r.roomNumber}` : '',
                  elecRate,
                  waterRate,
                })
                setIsCreateFormDirty(true)
              }}
              options={[
                { value: '', label: t('landlordInvoicesSelectRoomPlaceholder') },
                ...availableRooms.map(r => ({
                  value: r.id,
                  label: t('landlordInvoicesRoomOption')
                    .replace('{roomNumber}', r.roomNumber)
                    .replace('{floor}', String(r.floor))
                    .replace(
                      '{roomType}',
                      r.roomType?.name || t('landlordInvoicesStandardRoom'),
                    ),
                })),
              ]}
            />

            <TextInput
              label={t('landlordInvoicesFieldPeriod')}
              value={createForm.period}
              onChange={e => {
                setCreateForm({ ...createForm, period: e.target.value })
                setIsCreateFormDirty(true)
              }}
              placeholder="08/2026"
            />
          </div>

          {/* Meter Readings Inputs */}
          <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
            <Text
              as="span"
              size="xs"
              weight="black"
              color="default"
              uppercase
              className="tracking-wider block"
            >
              {t('landlordInvoicesMeterReadingsTitle')}
            </Text>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <NumberInput
                label={t('landlordInvoicesElecOld')}
                value={createForm.elecOld}
                onChange={e => {
                  setCreateForm({ ...createForm, elecOld: parseInt(e.target.value) || 0 })
                  setIsCreateFormDirty(true)
                }}
              />

              <NumberInput
                label={t('landlordInvoicesElecNew')}
                value={createForm.elecNew}
                onChange={e => {
                  setCreateForm({ ...createForm, elecNew: parseInt(e.target.value) || 0 })
                  setIsCreateFormDirty(true)
                }}
                labelClassName="text-warning"
                className="border-warning/40 text-warning"
              />

              <NumberInput
                label={t('landlordInvoicesWaterOld')}
                value={createForm.waterOld}
                onChange={e => {
                  setCreateForm({ ...createForm, waterOld: parseInt(e.target.value) || 0 })
                  setIsCreateFormDirty(true)
                }}
              />

              <NumberInput
                label={t('landlordInvoicesWaterNew')}
                value={createForm.waterNew}
                onChange={e => {
                  setCreateForm({ ...createForm, waterNew: parseInt(e.target.value) || 0 })
                  setIsCreateFormDirty(true)
                }}
                labelClassName="text-primary"
                className="border-primary/40 text-primary"
              />
            </div>
          </div>

          {/* Meter Dial Photos Inputs (Optional) */}
          <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <Text
                as="span"
                size="xs"
                weight="black"
                color="default"
                uppercase
                className="tracking-wider block"
              >
                <Camera className="w-4 h-4 inline-block mr-1.5 text-primary" />
                {t('landlordInvoicesAttachPhotosLabel')}
              </Text>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setIsOcrModalOpen(true)}
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-warning" />}
              >
                {t('landlordInvoicesBtnOcrScan')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <TextInput
                label={t('landlordInvoicesUploadElecPhoto')}
                placeholder="https://... hoặc URL ảnh"
                value={createForm.elecImageUrl}
                onChange={e => {
                  setCreateForm({ ...createForm, elecImageUrl: e.target.value })
                  setIsCreateFormDirty(true)
                }}
              />

              <TextInput
                label={t('landlordInvoicesUploadWaterPhoto')}
                placeholder="https://... hoặc URL ảnh"
                value={createForm.waterImageUrl}
                onChange={e => {
                  setCreateForm({ ...createForm, waterImageUrl: e.target.value })
                  setIsCreateFormDirty(true)
                }}
              />
            </div>
          </div>

          {/* Total Summary preview */}
          <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between">
            <div>
              <Text
                as="span"
                size="3xs"
                weight="extrabold"
                color="secondary"
                uppercase
                className="block"
              >
                {t('landlordInvoicesPreviewTotal')}
              </Text>
              <Text as="span" size="xl" weight="black" color="brand">
                {(
                  createForm.rentAmount +
                  Math.max(0, createForm.elecNew - createForm.elecOld) * createForm.elecRate +
                  Math.max(0, createForm.waterNew - createForm.waterOld) * createForm.waterRate +
                  createForm.wifiFee +
                  createForm.trashFee -
                  createForm.discount
                ).toLocaleString('vi-VN')}{' '}
                ₫
              </Text>
            </div>
            <Text as="span" size="2xs" weight="bold" color="secondary">
              {t('landlordInvoicesDeadlinePrefix')} {createForm.deadline}
            </Text>
          </div>
        </Modal.Body>

        {/* Footer (Rule #18: size="md") */}
        <Modal.Footer className="bg-card flex items-center justify-end gap-2">
          <Button
            variant="outline"
            size="md"
            onClick={handleRequestCloseCreate}
          >
            {t('landlordInvoicesBtnCancel')}
          </Button>
          <Button
            size="md"
            disabled={isSubmitting}
            isLoading={isSubmitting}
            onClick={handleCreateInvoiceSubmit}
          >
            {isSubmitting
              ? t('landlordInvoicesBtnSubmitting')
              : t('landlordInvoicesBtnSubmitCreate')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 🤖 AI OCR METER READING SPLIT-SCREEN VERIFICATION MODAL */}
      <Modal
        isOpen={isOcrModalOpen}
        onClose={handleRequestCloseOcr}
        size="4xl"
      >
        {/* Header */}
        <Modal.Header
          icon={
            <div className="p-3 bg-amber-500/10 text-warning rounded-2xl">
              <Sparkles className="w-6 h-6 fill-amber-500" />
            </div>
          }
          title={t('landlordInvoicesOcrModalTitle')}
          description={t('landlordInvoicesOcrModalSub')}
        />

        {/* Split Screen Content */}
        <Modal.Body className="p-6 max-h-[75vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side: Photo with AI Bounding Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text
                  as="span"
                  size="xs"
                  weight="black"
                  color="default"
                  uppercase
                  className="tracking-wider"
                >
                  {t('landlordInvoicesOcrPhotoTitle')}
                </Text>
                <Chip size="sm" preventHover variant="success">
                  {t('landlordInvoicesOcrAccuracy')}
                </Chip>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-primary/50 bg-zinc-900 h-64 flex items-center justify-center group shadow-inner">
                <div className="text-center space-y-2">
                  <div className="inline-block px-6 py-3 bg-black/80 rounded-xl border-2 border-emerald-400 font-mono text-3xl font-black text-emerald-400 tracking-widest shadow-[0_0_15px_rgba(52,211,153,0.5)] relative">
                    {ocrMeterValue}
                    <Text
                      as="span"
                      size="3xs"
                      weight="black"
                      className="absolute -top-3 -right-3 px-2 py-0.5 bg-warning text-foreground rounded-full animate-bounce"
                    >
                      OCR
                    </Text>
                  </div>
                  <Text size="2xs" color="secondary">
                    {t('landlordInvoicesOcrMeterDesc')}
                  </Text>
                </div>
              </div>
            </div>

            {/* Right Side: AI Extracted Details & Inputs */}
            <div className="space-y-4 bg-surface p-5 rounded-2xl border border-line flex flex-col justify-between">
              <div className="space-y-4">
                <Text
                  as="span"
                  size="xs"
                  weight="black"
                  color="default"
                  uppercase
                  className="tracking-wider block"
                >
                  {t('landlordInvoicesOcrDetailsTitle')}
                </Text>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card rounded-xl border border-line">
                    <Text as="span" size="3xs" weight="extrabold" color="secondary" className="block">
                      {t('landlordInvoicesOcrOldIndex')}
                    </Text>
                    <Text as="span" size="base" weight="black" color="default">
                      {createForm.elecOld} kWh
                    </Text>
                  </div>
                  <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                    <TextInput
                      label={t('landlordInvoicesOcrNewIndex')}
                      value={ocrMeterValue}
                      onChange={e => {
                        setOcrMeterValue(e.target.value)
                        setIsOcrFormDirty(true)
                      }}
                      labelClassName="text-warning text-[10px]"
                      className="text-base font-black text-warning border-none bg-transparent"
                    />
                  </div>
                </div>

                <div className="p-4 bg-card rounded-xl border border-line space-y-2">
                  <div className="flex justify-between text-xs font-bold text-muted">
                    <Text as="span" size="xs" weight="bold" color="secondary">
                      {t('landlordInvoicesOcrUsage')}
                    </Text>
                    <Text as="span" weight="black" color="default">
                      {Math.max(0, parseInt(ocrMeterValue || '0') - createForm.elecOld)} kWh
                    </Text>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted">
                    <Text as="span" size="xs" weight="bold" color="secondary">
                      {t('landlordInvoicesOcrUnitPrice')}
                    </Text>
                    <Text as="span" color="default">
                      {createForm.elecRate.toLocaleString('vi-VN')} ₫ / kWh
                    </Text>
                  </div>
                  <div className="border-t border-line pt-2 flex justify-between text-sm font-black text-foreground">
                    <Text as="span" size="sm" weight="black" color="default">
                      {t('landlordInvoicesOcrAmount')}
                    </Text>
                    <Text as="span" color="brand" weight="black">
                      {(
                        Math.max(0, parseInt(ocrMeterValue || '0') - createForm.elecOld) *
                        createForm.elecRate
                      ).toLocaleString('vi-VN')}{' '}
                      ₫
                    </Text>
                  </div>
                </div>
              </div>

              {/* Action buttons (Rule #18: size="md") */}
              <div className="pt-2 flex gap-3">
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleRequestCloseOcr}
                  className="flex-1"
                >
                  {t('landlordInvoicesBtnCancel')}
                </Button>
                <Button
                  size="md"
                  onClick={() => {
                    setCreateForm(prev => ({
                      ...prev,
                      elecNew: parseInt(ocrMeterValue) || prev.elecNew,
                    }))
                    setIsOcrModalOpen(false)
                    setIsOcrFormDirty(false)
                  }}
                  className="flex-1"
                >
                  {t('landlordInvoicesOcrConfirm')}
                </Button>
              </div>
            </div>
          </div>
        </Modal.Body>
      </Modal>

      {/* 🔍 LIGHTBOX MODAL: FULL-SIZE METER PHOTO PREVIEW */}
      <Modal
        isOpen={Boolean(previewPhoto)}
        onClose={() => setPreviewPhoto(null)}
        size="4xl"
      >
        {previewPhoto && (
          <>
            <Modal.Header
              icon={
                <div className="p-3 bg-primary/10 text-primary rounded-2xl">
                  <Camera className="w-6 h-6" />
                </div>
              }
              title={previewPhoto.title}
              description={previewPhoto.sub || t('landlordInvoicesPreviewPhotoModalSub')}
            />
            <Modal.Body className="p-4 sm:p-6 text-center max-h-[75vh] overflow-y-auto">
              <div className="rounded-2xl overflow-hidden bg-black/90 p-2 border border-line shadow-inner max-w-2xl mx-auto">
                <img
                  src={previewPhoto.url}
                  alt={previewPhoto.title}
                  className="max-h-[60vh] w-auto mx-auto object-contain rounded-xl"
                />
              </div>
            </Modal.Body>
            <Modal.Footer className="bg-card flex items-center justify-end">
              <Button
                variant="outline"
                size="md"
                onClick={() => setPreviewPhoto(null)}
              >
                {t('commonClose')}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* ⚠️ SYSTEM POP-UP CONFIRMATION MODAL (Rule #10 Dormio Standard) */}
      <Modal
        isOpen={Boolean(confirmCloseTarget)}
        onClose={() => setConfirmCloseTarget(null)}
        size="sm"
        zIndex={60}
        showCloseButton={false}
      >
        <Modal.Body className="p-6 sm:p-7 text-center space-y-5">
          <div className="w-14 h-14 bg-warning-soft text-amber-500 border border-warning-subtle rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
            <AlertTriangle className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Text as="h3" size="lg" weight="black" color="default">
              {t('landlordInvoicesConfirmCloseTitle')}
            </Text>
            <Text size="xs" color="secondary" weight="semibold" className="leading-relaxed">
              {t('landlordInvoicesConfirmCloseDesc')}
            </Text>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => setConfirmCloseTarget(null)}
              className="flex-1"
            >
              {t('landlordInvoicesConfirmCloseKeep')}
            </Button>

            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmCloseModal}
              className="flex-1"
            >
              {t('landlordInvoicesConfirmCloseDiscard')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

function InvoicesFallback() {
  const t = useTranslations('landlord')
  return (
    <div className="p-8 text-center text-xs font-bold text-muted">
      {t('landlordInvoicesLoading')}
    </div>
  )
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<InvoicesFallback />}>
      <InvoicesContent />
    </Suspense>
  )
}
