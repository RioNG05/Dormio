'use client'

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { LandlordPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Plus,
  FileText,
  Receipt,
  Sparkles,
  FileSpreadsheet,
  Eye,
  Calendar,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  QrCode,
  X,
  Check,
  LayoutGrid,
  List,
  Zap,
  Droplets,
  ShieldCheck,
  Send,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  SearchInput,
  ChipGroup,
  Pagination,
  ViewModeToggle,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  landlordInvoiceService,
  LandlordInvoiceItem,
  LandlordInvoicesSummary,
} from '@/services/landlord-invoice.service'
import { getRooms, RoomItem } from '@/services/room.service'

type InvoiceItem = LandlordInvoiceItem

function InvoicesContent() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const t = useTranslations('landlord')
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
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState('2026')

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
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isOcrModalOpen, setIsOcrModalOpen] = useState(false)
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<'create' | 'ocr' | 'detail' | null>(
    null,
  )

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
    wifiFee: 100000,
    trashFee: 50000,
    discount: 0,
    deadline: new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10),
  })
  const [isCreateFormDirty, setIsCreateFormDirty] = useState(false)

  // Form State for AI OCR Modal
  const [ocrMeterValue, setOcrMeterValue] = useState('0')
  const [isOcrFormDirty, setIsOcrFormDirty] = useState(false)

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
  }, [activeBuilding?.id])

  // Fetch invoices from backend
  const fetchInvoices = useCallback(async () => {
    if (!activeBuilding?.id) return
    try {
      setIsLoading(true)
      const res = await landlordInvoiceService.getLandlordInvoices(activeBuilding.id, {
        search: searchTerm,
        status: activeTab,
        month: selectedMonth,
        year: selectedYear,
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
  }, [
    activeBuilding?.id,
    searchTerm,
    activeTab,
    selectedMonth,
    selectedYear,
    currentPage,
    pageSize,
  ])

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

  // Pagination Logic with 5-page window jumping (Rule #9)
  const totalPages = Math.ceil(totalRecords / pageSize) || 1
  const windowSize = 5
  const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
  const visiblePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  )
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalRecords)

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

  // Handlers for Modals
  const handleOpenCreateModal = () => {
    setIsCreateFormDirty(false)
    setIsCreateModalOpen(true)
  }

  const handleRequestCloseCreate = () => {
    if (isCreateFormDirty) {
      setConfirmCloseTarget('create')
    } else {
      setIsCreateModalOpen(false)
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
    }
  }

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === 'create') {
      setIsCreateModalOpen(false)
      setIsCreateFormDirty(false)
    } else if (confirmCloseTarget === 'ocr') {
      setIsOcrModalOpen(false)
      setIsOcrFormDirty(false)
    }
    setConfirmCloseTarget(null)
  }

  // Mark Paid Handler with real backend recording ( Part 3)
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
    } catch (err: any) {
      console.error('Lỗi cập nhật thanh toán:', err)
      toast.error(err?.message || t('landlordInvoicesAlertUpdateStatusFailed'))
    }
  }

  // Create Manual Invoice Handler
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
        serviceFees: [
          { name: 'Internet / Wifi', amount: createForm.wifiFee },
          { name: t('landlordInvoicesFeeTrash'), amount: createForm.trashFee },
        ],
        discount: createForm.discount,
      })
      setIsCreateModalOpen(false)
      setIsCreateFormDirty(false)
      toast.success(t('landlordInvoicesBtnSubmitCreate'))
      await fetchInvoices()
    } catch (err: any) {
      console.error('Lỗi tạo hóa đơn:', err)
      toast.error(err?.message || t('landlordInvoicesAlertCreateFailed'))
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
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 lg:w-[150px]',
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
      <LandlordPageHeader
        title={t('landlordInvoicesTitle')}
        subtitle={t('landlordInvoicesSubtitle')}
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={handleOpenOcrModal}
              leftIcon={<Sparkles className="fill-amber-500 shrink-0" />}
            >
              {t('landlordInvoicesBtnOcrScan')}
            </Button>

            <Button
              variant="outline"
              size="md"
              leftIcon={<FileSpreadsheet className="shrink-0" />}
            >
              {t('landlordInvoicesBtnExportExcel')}
            </Button>

            <Button
              variant="primary"
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
      <div className="bg-card p-3.5 sm:p-4 border border-line rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="flex-1">
            <SearchInput
              placeholder={t('landlordInvoicesSearchPlaceholder')}
              value={searchTerm}
              onChange={val => {
                setSearchTerm(val)
                setCurrentPage(1)
              }}
            />
          </div>

          {/* Month, Year & View Switcher Row on Mobile */}
          <div className="flex items-center gap-2 justify-between shrink-0 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              {/* Month Filter Dropdown */}
              <div className="flex-1 sm:flex-none min-w-[130px]">
                <SelectInput
                  value={selectedMonth}
                  onChange={e => {
                    setSelectedMonth(e.target.value)
                    setCurrentPage(1)
                  }}
                  leftIcon={<Calendar className="w-3.5 h-3.5 text-primary" />}
                  options={[
                    { value: 'all', label: t('landlordInvoicesAllMonths') },
                    { value: '01', label: t('landlordInvoicesMonthPrefix').replace('{month}', '01') },
                    { value: '02', label: t('landlordInvoicesMonthPrefix').replace('{month}', '02') },
                    { value: '03', label: t('landlordInvoicesMonthPrefix').replace('{month}', '03') },
                    { value: '04', label: t('landlordInvoicesMonthPrefix').replace('{month}', '04') },
                    { value: '05', label: t('landlordInvoicesMonthPrefix').replace('{month}', '05') },
                    { value: '06', label: t('landlordInvoicesMonthPrefix').replace('{month}', '06') },
                    { value: '07', label: t('landlordInvoicesMonthPrefix').replace('{month}', '07') },
                    { value: '08', label: t('landlordInvoicesMonthPrefix').replace('{month}', '08') },
                    { value: '09', label: t('landlordInvoicesMonthPrefix').replace('{month}', '09') },
                    { value: '10', label: t('landlordInvoicesMonthPrefix').replace('{month}', '10') },
                    { value: '11', label: t('landlordInvoicesMonthPrefix').replace('{month}', '11') },
                    { value: '12', label: t('landlordInvoicesMonthPrefix').replace('{month}', '12') },
                  ]}
                />
              </div>

              {/* Year Filter Dropdown */}
              <div className="flex-1 sm:flex-none min-w-[110px]">
                <SelectInput
                  value={selectedYear}
                  onChange={e => {
                    setSelectedYear(e.target.value)
                    setCurrentPage(1)
                  }}
                  options={[
                    { value: 'all', label: t('landlordInvoicesAllYears') },
                    { value: '2026', label: '2026' },
                    { value: '2025', label: '2025' },
                    { value: '2024', label: '2024' },
                  ]}
                />
              </div>
            </div>

            {/* View Switcher */}
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
            />
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="border-t border-line pt-3">
          <ChipGroup<'all' | 'unpaid' | 'paid' | 'overdue'>
            value={activeTab}
            onChange={val => {
              setActiveTab(val)
              setCurrentPage(1)
            }}
            scrollable
            options={[
              {
                value: 'all',
                label: t('landlordInvoicesTabAll').replace(/\s*\(?\{count\}\)?/, ''),
                count: totalInvoicesCount,
                variant: 'default',
              },
              {
                value: 'unpaid',
                label: t('landlordInvoicesTabUnpaid').replace(/\s*\(?\{count\}\)?/, ''),
                count: unpaidCount,
                variant: 'warning',
              },
              {
                value: 'paid',
                label: t('landlordInvoicesTabPaid').replace(/\s*\(?\{count\}\)?/, ''),
                count: paidCount,
                variant: 'success',
              },
              {
                value: 'overdue',
                label: t('landlordInvoicesTabOverdue').replace(/\s*\(?\{count\}\)?/, ''),
                count: overdueCount,
                variant: 'danger',
              },
            ]}
          />
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {invoices.length === 0 ? (
        <div className="py-16 px-6 text-center bg-card border border-line rounded-3xl space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Receipt className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-base text-foreground">
              {t('landlordInvoicesNoDataTitle')}
            </h3>
            <p className="text-xs text-muted font-medium leading-relaxed">
              {t('landlordInvoicesNoDataDesc')}
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreateModal}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            {t('landlordInvoicesBtnCreateInvoice')}
          </Button>
        </div>
      ) : paginatedInvoices.length === 0 ? (
        <div className="p-12 text-center bg-card border border-line rounded-2xl space-y-3">
          <Receipt className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-foreground">
            {t('landlordInvoicesEmptyTitle')}
          </h3>
          <p className="text-xs text-muted">{t('landlordInvoicesEmptyDesc')}</p>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedInvoices.map(inv => {
            const isPaid = inv.status === 'Đã thu'
            const isOverdue = inv.status === 'Quá hạn'

            return (
              <div
                key={inv.id}
                className={`bg-card border rounded-2xl p-4 space-y-4 hover:shadow-md transition-all flex flex-col justify-between ${isPaid
                    ? 'border-success-subtle hover:border-emerald-300'
                    : isOverdue
                      ? 'border-danger-subtle hover:border-rose-300 bg-rose-50/20'
                      : 'border-line hover:border-primary/40'
                  }`}
              >
                {/* Header info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2.5 border-b border-line">
                    <span className="font-extrabold text-sm text-foreground flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-primary" /> {inv.roomName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${isPaid
                          ? 'bg-success-soft text-success border-success-subtle'
                          : isOverdue
                            ? 'bg-danger-soft text-danger border-danger-subtle'
                            : 'bg-warning-soft text-warning border-warning-subtle'
                        }`}
                    >
                      {inv.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted font-semibold">
                        {t('landlordInvoicesLabelTenant')}
                      </span>
                      <span className="font-bold text-foreground">{inv.tenantName}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted font-semibold">
                        {t('landlordInvoicesLabelPeriod')}
                      </span>
                      <span className="font-bold text-foreground">
                        {t('landlordInvoicesLabelPeriodMonth').replace('{period}', inv.period)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted font-semibold">
                        {t('landlordInvoicesLabelInvoiceId')}
                      </span>
                      <span className="font-mono text-muted text-[11px]">{inv.id}</span>
                    </div>
                  </div>

                  {/* Fee Items Breakdown Summary */}
                  <div className="p-3 bg-surface rounded-xl space-y-1.5 text-[11px]">
                    <div className="flex justify-between text-muted">
                      <span>{t('landlordInvoicesFeeRent')}</span>
                      <span className="font-bold text-foreground">
                        {inv.rentAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>
                        {t('landlordInvoicesFeeElec').replace(
                          '{usage}',
                          String(inv.elecNew - inv.elecOld),
                        )}
                      </span>
                      <span className="font-bold text-foreground">
                        {((inv.elecNew - inv.elecOld) * inv.elecRate).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <div className="flex justify-between text-muted">
                      <span>
                        {t('landlordInvoicesFeeWater').replace(
                          '{usage}',
                          String(inv.waterNew - inv.waterOld),
                        )}
                      </span>
                      <span className="font-bold text-foreground">
                        {((inv.waterNew - inv.waterOld) * inv.waterRate).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  </div>
                </div>

                {/* Total & Action Footer */}
                <div className="pt-3 border-t border-line space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-bold text-muted block uppercase tracking-wider">
                        {t('landlordInvoicesLabelTotal')}
                      </span>
                      <span className="font-black text-base text-primary">
                        {inv.totalAmount.toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                    <span
                      className={`text-[10px] font-bold ${isOverdue ? 'text-rose-600 font-black' : 'text-muted'}`}
                    >
                      {t('landlordInvoicesLabelDeadline').replace('{deadline}', inv.deadline)}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setSelectedInvoice(inv)}
                      className="flex-1"
                      leftIcon={<Eye />}
                    >
                      {t('landlordInvoicesBtnViewDetail')}
                    </Button>
                    {!isPaid && (
                      <Button variant="success"
                        size="sm"
                        onClick={() => handleMarkAsPaid(inv.id)}
                        title={t('landlordInvoicesTooltipMarkPaid')}
                        leftIcon={<Check />}
                      >
                        {t('landlordInvoicesBtnCollect')}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
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
                  <tr key={inv.id} className="hover:bg-zinc-50/80 transition-colors">
                    <td className="px-4 py-3.5 font-bold font-mono text-foreground flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      {inv.id}
                    </td>
                    <td className="px-4 py-3.5 font-black text-foreground">{inv.roomName}</td>
                    <td className="px-4 py-3.5 text-foreground/90">{inv.tenantName}</td>
                    <td className="px-4 py-3.5 text-muted">
                      {t('landlordInvoicesLabelPeriodMonth').replace('{period}', inv.period)}
                    </td>
                    <td className="px-4 py-3.5 font-black text-primary text-sm">
                      {inv.totalAmount.toLocaleString('vi-VN')} ₫
                    </td>
                    <td
                      className={`px-4 py-3.5 font-bold ${inv.status === 'Quá hạn' ? 'text-rose-600 font-black' : 'text-muted'}`}
                    >
                      {inv.deadline}
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${inv.status === 'Đã thu'
                            ? 'bg-success-soft text-success border-success-subtle'
                            : inv.status === 'Quá hạn'
                              ? 'bg-danger-soft text-danger border-danger-subtle'
                              : 'bg-warning-soft text-warning border-warning-subtle'
                          }`}
                      >
                        {getInvoiceStatusLabel(inv.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => setSelectedInvoice(inv)}
                        leftIcon={<Eye />}
                      >
                        {t('landlordInvoicesBtnViewDetail')}
                      </Button>
                    </td>
                  </tr>
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
      {selectedInvoice && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setSelectedInvoice(null)
          }}
        >
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95 duration-200 border border-line">
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground flex items-center gap-2">
                    {t('landlordInvoicesModalDetailTitle').replace(
                      '{room}',
                      selectedInvoice.roomName,
                    )}
                    <span
                      className={`px-2.5 py-0.5 text-[10px] font-black rounded-full border ${selectedInvoice.status === 'Đã thu'
                          ? 'bg-success-soft text-success border-success-subtle'
                          : selectedInvoice.status === 'Quá hạn'
                            ? 'bg-danger-soft text-danger border-danger-subtle'
                            : 'bg-warning-soft text-warning border-warning-subtle'
                        }`}
                    >
                      {getInvoiceStatusLabel(selectedInvoice.status)}
                    </span>
                  </h3>
                  <p className="text-xs text-muted font-semibold">
                    {t('landlordInvoicesModalDetailSub')
                      .replace('{id}', selectedInvoice.id)
                      .replace('{period}', selectedInvoice.period)}
                  </p>
                </div>
              </div>

              <Button rounded="full"
                variant="ghost"
                size="icon"
                onClick={() => setSelectedInvoice(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Scroll Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs custom-scrollbar">
              {/* Tenant & Building Info Card */}
              <div className="p-4 bg-surface border border-line rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">
                    {t('landlordInvoicesSectionTenant')}
                  </span>
                  <p className="font-black text-sm text-foreground">{selectedInvoice.tenantName}</p>
                  <p className="text-muted font-semibold">{selectedInvoice.tenantPhone}</p>
                </div>

                <div className="space-y-1 sm:text-right">
                  <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">
                    {t('landlordInvoicesSectionDeadlineAndCreated')}
                  </span>
                  <p className="font-bold text-foreground">
                    {t('landlordInvoicesDeadlinePrefix')}{' '}
                    <span
                      className={`font-black ${selectedInvoice.status === 'Quá hạn' ? 'text-rose-600 font-extrabold' : 'text-foreground'}`}
                    >
                      {selectedInvoice.deadline}
                    </span>
                    {selectedInvoice.status === 'Quá hạn' && (
                      <span className="ml-1.5 px-2 py-0.5 bg-danger-soft text-danger text-[10px] font-black rounded-md border border-danger-subtle">
                        {t('landlordInvoicesStatusOverdue')}
                      </span>
                    )}
                  </p>
                  <p className="text-muted font-medium">
                    {t('landlordInvoicesCreatedPrefix')} {selectedInvoice.createdAt}
                  </p>
                </div>
              </div>

              {/* Fee Breakdown Table */}
              <div className="space-y-3">
                <h4 className="font-extrabold text-xs text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-primary" />{' '}
                  {t('landlordInvoicesSectionFeeBreakdown')}
                </h4>

                <div className="border border-line rounded-2xl overflow-x-auto custom-scrollbar">
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
                        <td className="px-4 py-3 font-bold text-foreground">
                          {t('landlordInvoicesItemRoomRent').replace(
                            '{room}',
                            selectedInvoice.roomName,
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted">-</td>
                        <td className="px-4 py-3 text-right">
                          {selectedInvoice.rentAmount.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-right font-black text-foreground">
                          {selectedInvoice.rentAmount.toLocaleString('vi-VN')} ₫
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-bold text-foreground flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />{' '}
                          {t('landlordInvoicesItemElec')}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {selectedInvoice.elecOld} &rarr; {selectedInvoice.elecNew} (
                          {selectedInvoice.elecNew - selectedInvoice.elecOld} kWh)
                        </td>
                        <td className="px-4 py-3 text-right">
                          {selectedInvoice.elecRate.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-right font-black text-foreground">
                          {(
                            (selectedInvoice.elecNew - selectedInvoice.elecOld) *
                            selectedInvoice.elecRate
                          ).toLocaleString('vi-VN')}{' '}
                          ₫
                        </td>
                      </tr>

                      <tr>
                        <td className="px-4 py-3 font-bold text-foreground flex items-center gap-1.5">
                          <Droplets className="w-3.5 h-3.5 text-blue-500" />{' '}
                          {t('landlordInvoicesItemWater')}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {selectedInvoice.waterOld} &rarr; {selectedInvoice.waterNew} (
                          {selectedInvoice.waterNew - selectedInvoice.waterOld} m³)
                        </td>
                        <td className="px-4 py-3 text-right">
                          {selectedInvoice.waterRate.toLocaleString('vi-VN')} ₫
                        </td>
                        <td className="px-4 py-3 text-right font-black text-foreground">
                          {(
                            (selectedInvoice.waterNew - selectedInvoice.waterOld) *
                            selectedInvoice.waterRate
                          ).toLocaleString('vi-VN')}{' '}
                          ₫
                        </td>
                      </tr>

                      {selectedInvoice.serviceFees.map((fee, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-bold text-foreground">{fee.name}</td>
                          <td className="px-4 py-3 text-muted">
                            {t('landlordInvoicesItemFixedMonthly')}
                          </td>
                          <td className="px-4 py-3 text-right">
                            {fee.amount.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="px-4 py-3 text-right font-black text-foreground">
                            {fee.amount.toLocaleString('vi-VN')} ₫
                          </td>
                        </tr>
                      ))}

                      {selectedInvoice.discount > 0 && (
                        <tr className="bg-danger-soft">
                          <td className="px-4 py-3 font-bold text-danger">
                            {t('landlordInvoicesItemDiscount')}
                          </td>
                          <td className="px-4 py-3 text-muted">-</td>
                          <td className="px-4 py-3 text-right text-danger">
                            -{selectedInvoice.discount.toLocaleString('vi-VN')} ₫
                          </td>
                          <td className="px-4 py-3 text-right font-black text-danger">
                            -{selectedInvoice.discount.toLocaleString('vi-VN')} ₫
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
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
                    <span className="font-extrabold text-primary flex items-center gap-1">
                      <QrCode className="w-3.5 h-3.5" /> {t('landlordInvoicesVietQrAuto')}
                    </span>
                    <p className="font-bold text-foreground">{t('landlordInvoicesVietQrBank')}</p>
                    <p className="font-mono text-foreground/90 font-bold">STK: 0988123456</p>
                    <p className="text-muted font-medium truncate">
                      {t('landlordInvoicesVietQrMemo').replace(
                        '{memo}',
                        `${selectedInvoice.id} ${selectedInvoice.roomName.replace(' ', '')}`,
                      )}
                    </p>
                  </div>
                </div>

                {/* Grand Total */}
                <div className="p-5 bg-zinc-900 text-white rounded-2xl space-y-2 text-right shadow-inner">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted block">
                    {t('landlordInvoicesGrandTotal')}
                  </span>
                  <span className="text-2xl sm:text-3xl font-black text-primary block">
                    {selectedInvoice.totalAmount.toLocaleString('vi-VN')} ₫
                  </span>
                  {selectedInvoice.paidAt && (
                    <span className="text-[10px] font-bold text-emerald-400 block">
                      {t('landlordInvoicesPaidAtBadgeDetail')
                        .replace('{time}', selectedInvoice.paidAt || '')
                        .replace('{method}', selectedInvoice.paymentMethod || '')}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t border-line bg-card flex flex-wrap items-center justify-between gap-3">
              {/* If UNPAID: Show "Nhắc Thu Tiền Qua Chat" button */}
              {selectedInvoice.status !== 'Đã thu' ? (
                <Button
                  variant="outline"
                  size="sm"
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
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    {t('landlordInvoicesPaidAtBadge')
                      .replace('{time}', selectedInvoice.paidAt || '')
                      .replace('{method}', selectedInvoice.paymentMethod || '')}
                  </span>
                </div>
              )}

              <div className="flex items-center gap-2">
                {/* If UNPAID: Show "Xác Nhận Đã Thu Tiền" button */}
                {selectedInvoice.status !== 'Đã thu' && (
                  <Button variant="success"
                    size="sm"
                    onClick={() =>
                      handleMarkAsPaid(selectedInvoice.id, t('landlordInvoicesPaymentMethodManual'))
                    }
                    leftIcon={<Check />}
                  >
                    {t('landlordInvoicesBtnConfirmPaid')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ➕ CREATE NEW INVOICE MODAL */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleRequestCloseCreate()
          }}
        >
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-line">
            {/* Modal Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-card">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">
                    {t('landlordInvoicesModalCreateTitle')}
                  </h3>
                  <p className="text-xs text-muted font-semibold">
                    {t('landlordInvoicesModalCreateSub')}
                  </p>
                </div>
              </div>
              <Button rounded="full"
                variant="ghost"
                size="icon"
                onClick={handleRequestCloseCreate}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Form Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs custom-scrollbar">
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
                <span className="font-black text-xs text-foreground uppercase tracking-wider block">
                  {t('landlordInvoicesMeterReadingsTitle')}
                </span>

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
                    className="border-amber-300 text-warning"
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
                    labelClassName="text-info"
                    className="border-blue-300 text-info"
                  />
                </div>
              </div>

              {/* Total Summary preview */}
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold text-muted block uppercase">
                    {t('landlordInvoicesPreviewTotal')}
                  </span>
                  <span className="text-xl font-black text-primary">
                    {(
                      createForm.rentAmount +
                      Math.max(0, createForm.elecNew - createForm.elecOld) * createForm.elecRate +
                      Math.max(0, createForm.waterNew - createForm.waterOld) *
                      createForm.waterRate +
                      createForm.wifiFee +
                      createForm.trashFee -
                      createForm.discount
                    ).toLocaleString('vi-VN')}{' '}
                    ₫
                  </span>
                </div>
                <span className="text-[11px] font-bold text-muted">
                  {t('landlordInvoicesDeadlinePrefix')} {createForm.deadline}
                </span>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-line bg-card flex items-center justify-end gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRequestCloseCreate}
              >
                {t('landlordInvoicesBtnCancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={handleCreateInvoiceSubmit}
              >
                {isSubmitting
                  ? t('landlordInvoicesBtnSubmitting')
                  : t('landlordInvoicesBtnSubmitCreate')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 🤖 AI OCR METER READING SPLIT-SCREEN VERIFICATION MODAL */}
      {isOcrModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleRequestCloseOcr()
          }}
        >
          <div className="bg-card rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 border border-line">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-line bg-card">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl">
                  <Sparkles className="w-6 h-6 fill-amber-500" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-foreground">
                    {t('landlordInvoicesOcrModalTitle')}
                  </h2>
                  <p className="text-xs text-muted font-medium">
                    {t('landlordInvoicesOcrModalSub')}
                  </p>
                </div>
              </div>
              <Button rounded="full"
                variant="ghost"
                size="icon"
                onClick={handleRequestCloseOcr}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Split Screen Content */}
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 overflow-y-auto custom-scrollbar">
              {/* Left Side: Photo with AI Bounding Box */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-foreground/90 uppercase tracking-wider">
                    {t('landlordInvoicesOcrPhotoTitle')}
                  </span>
                  <span className="px-2.5 py-0.5 bg-success-soft text-emerald-600 border border-success-subtle rounded-full text-[10px] font-extrabold">
                    {t('landlordInvoicesOcrAccuracy')}
                  </span>
                </div>

                <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-teal-500/50 bg-zinc-900 h-64 flex items-center justify-center group shadow-inner">
                  <div className="text-center space-y-2">
                    <div className="inline-block px-6 py-3 bg-black/80 rounded-xl border-2 border-emerald-400 font-mono text-3xl font-black text-emerald-400 tracking-widest shadow-[0_0_15px_rgba(52,211,153,0.5)] relative">
                      {ocrMeterValue}
                      <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full animate-bounce">
                        OCR Box
                      </span>
                    </div>
                    <p className="text-[11px] text-muted">{t('landlordInvoicesOcrMeterDesc')}</p>
                  </div>
                </div>
              </div>

              {/* Right Side: AI Extracted Details & Inputs */}
              <div className="space-y-4 bg-surface p-5 rounded-2xl border border-line flex flex-col justify-between">
                <div className="space-y-4">
                  <span className="text-xs font-black text-foreground/90 uppercase tracking-wider block">
                    {t('landlordInvoicesOcrDetailsTitle')}
                  </span>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-card rounded-xl border border-line">
                      <span className="text-[10px] font-extrabold text-muted block">
                        {t('landlordInvoicesOcrOldIndex')}
                      </span>
                      <span className="text-base font-black text-foreground">1.318 kWh</span>
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
                      <span>{t('landlordInvoicesOcrUsage')}</span>
                      <span className="text-foreground font-black">
                        {Math.max(0, parseInt(ocrMeterValue || '0') - 1318)} kWh
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-bold text-muted">
                      <span>{t('landlordInvoicesOcrUnitPrice')}</span>
                      <span className="text-foreground">3.500 ₫ / kWh</span>
                    </div>
                    <div className="border-t border-line pt-2 flex justify-between text-sm font-black text-foreground">
                      <span>{t('landlordInvoicesOcrAmount')}</span>
                      <span className="text-primary">
                        {(
                          Math.max(0, parseInt(ocrMeterValue || '0') - createForm.elecOld) *
                          createForm.elecRate
                        ).toLocaleString('vi-VN')}{' '}
                        ₫
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 flex gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRequestCloseOcr}
                    className="flex-1"
                  >
                    {t('landlordInvoicesBtnCancel')}
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
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
          </div>
        </div>
      )}

      {/* ⚠️ SYSTEM POP-UP CONFIRMATION MODAL (Rule #10 Dormio Standard) */}
      {confirmCloseTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setConfirmCloseTarget(null)
          }}
        >
          <div className="bg-card rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-line text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-warning-soft text-amber-500 border border-warning-subtle rounded-2xl flex items-center justify-center mx-auto shadow-2xs">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-lg font-black text-foreground">
                {t('landlordInvoicesConfirmCloseTitle')}
              </h3>
              <p className="text-xs text-muted font-semibold leading-relaxed">
                {t('landlordInvoicesConfirmCloseDesc')}
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1"
              >
                {t('landlordInvoicesConfirmCloseKeep')}
              </Button>

              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmCloseModal}
                className="flex-1"
              >
                {t('landlordInvoicesConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}
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
