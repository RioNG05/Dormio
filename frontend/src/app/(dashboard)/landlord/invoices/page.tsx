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
  X,
  Check,
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
  const currentYear = useMemo(() => new Date().getFullYear(), [])
  const [activeTab, setActiveTab] = useState<'all' | 'unpaid' | 'paid' | 'overdue'>('all')
  const [searchTerm, setSearchTerm] = useState(urlSearch)
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [selectedYear, setSelectedYear] = useState<string>(() => String(new Date().getFullYear()))

  const yearOptions = useMemo(
    () => [
      { value: 'all', label: t('landlordInvoicesAllYears') },
      ...Array.from({ length: 5 }, (_, i) => {
        const y = String(currentYear - i)
        return { value: y, label: y }
      }),
    ],
    [currentYear, t],
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
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value)
                setCurrentPage(1)
              }}
              leftIcon={<Calendar className="w-3.5 h-3.5 text-primary" />}
              containerClassName="w-auto min-w-[130px] space-y-0"
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
            <SelectInput
              value={selectedYear}
              onChange={e => {
                setSelectedYear(e.target.value)
                setCurrentPage(1)
              }}
              containerClassName="w-auto min-w-[110px] space-y-0"
              options={yearOptions}
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
      {invoices.length === 0 ? (
        <EmptyState
          icon={<Receipt className="w-8 h-8" />}
          title={t('landlordInvoicesNoDataTitle')}
          description={t('landlordInvoicesNoDataDesc')}
          action={
            <Button
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
              onClick={() => {
                setSearchTerm('')
                setSelectedMonth('all')
                setSelectedYear('all')
                setActiveTab('all')
              }}
            >
              {t('landlordInvoicesBtnResetFilter') || 'Reset'}
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
                className={`space-y-4 flex flex-col justify-between ${isPaid
                  ? 'border-success-subtle hover:border-emerald-300'
                  : isOverdue
                    ? 'border-danger-subtle hover:border-rose-300 bg-rose-50/20'
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
                </Card.Body>

                {/* Total & Action Footer */}
                <Card.Footer className="px-4 sm:px-5 pt-3 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text as="span" size="3xs" weight="bold" color="secondary" uppercase className="block tracking-wider">
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
                      {t('landlordInvoicesLabelDeadline').replace('{deadline}', formatDate(inv.deadline))}
                    </Text>
                  </div>

                  {!isPaid && (
                    <div className="flex items-center justify-end">
                      <Button
                        variant="success"
                        fullWidth
                        onClick={() => handleMarkAsPaid(inv.id)}
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
                      <Text as="span" size="xs" weight="black" color="default">
                        {inv.roomName}
                      </Text>
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
                        <Text as="span" size="xs" color="secondary">—</Text>
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
                  <span>
                    {t('landlordInvoicesModalDetailTitle').replace(
                      '{room}',
                      selectedInvoice.roomName,
                    )}
                  </span>
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
            <Modal.Body className="p-6 space-y-6 text-xs">
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
                      className={`font-black ${selectedInvoice.status === 'Quá hạn' ? 'text-danger font-extrabold' : 'text-foreground'}`}
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
                          <Droplets className="w-3.5 h-3.5 text-vacant" />{' '}
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
            </Modal.Body>

            {/* Modal Footer Actions */}
            <Modal.Footer className="flex flex-wrap items-center justify-between gap-3 bg-card">
              {/* If UNPAID: Show "Nhắc Thu Tiền Qua Chat" button */}
              {selectedInvoice.status !== 'Đã thu' ? (
                <Button
                  variant="outline"
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
                    onClick={() =>
                      handleMarkAsPaid(selectedInvoice.id, t('landlordInvoicesPaymentMethodManual'))
                    }
                    leftIcon={<Check />}
                  >
                    {t('landlordInvoicesBtnConfirmPaid')}
                  </Button>
                )}
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
        <Modal.Body className="p-6 space-y-4 text-xs">
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
        </Modal.Body>

        {/* Footer */}
        <Modal.Footer className="bg-card flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleRequestCloseCreate}
          >
            {t('landlordInvoicesBtnCancel')}
          </Button>
          <Button
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
        <Modal.Body className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Side: Photo with AI Bounding Box */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text as="span" size="xs" weight="black" color="default" uppercase className="tracking-wider">
                  {t('landlordInvoicesOcrPhotoTitle')}
                </Text>
                <Chip size="sm" preventHover variant="success">
                  {t('landlordInvoicesOcrAccuracy')}
                </Chip>
              </div>

              <div className="relative rounded-2xl overflow-hidden border-2 border-dashed border-teal-500/50 bg-zinc-900 h-64 flex items-center justify-center group shadow-inner">
                <div className="text-center space-y-2">
                  <div className="inline-block px-6 py-3 bg-black/80 rounded-xl border-2 border-emerald-400 font-mono text-3xl font-black text-emerald-400 tracking-widest shadow-[0_0_15px_rgba(52,211,153,0.5)] relative">
                    {ocrMeterValue}
                    <span className="absolute -top-3 -right-3 px-2 py-0.5 bg-amber-500 text-black text-[9px] font-black rounded-full animate-bounce">
                      OCR Box
                    </span>
                  </div>
                  <Text size="2xs" color="secondary">{t('landlordInvoicesOcrMeterDesc')}</Text>
                </div>
              </div>
            </div>

            {/* Right Side: AI Extracted Details & Inputs */}
            <div className="space-y-4 bg-surface p-5 rounded-2xl border border-line flex flex-col justify-between">
              <div className="space-y-4">
                <Text as="span" size="xs" weight="black" color="default" uppercase className="tracking-wider block">
                  {t('landlordInvoicesOcrDetailsTitle')}
                </Text>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-card rounded-xl border border-line">
                    <Text as="span" size="3xs" weight="extrabold" color="secondary" className="block">
                      {t('landlordInvoicesOcrOldIndex')}
                    </Text>
                    <Text as="span" size="base" weight="black" color="default">1.318 kWh</Text>
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
                    <Text as="span" weight="black" color="default">
                      {Math.max(0, parseInt(ocrMeterValue || '0') - 1318)} kWh
                    </Text>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-muted">
                    <span>{t('landlordInvoicesOcrUnitPrice')}</span>
                    <Text as="span" color="default">3.500 ₫ / kWh</Text>
                  </div>
                  <div className="border-t border-line pt-2 flex justify-between text-sm font-black text-foreground">
                    <span>{t('landlordInvoicesOcrAmount')}</span>
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

              <div className="pt-2 flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleRequestCloseOcr}
                  className="flex-1"
                >
                  {t('landlordInvoicesBtnCancel')}
                </Button>
                <Button
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
        </Modal.Body>
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
              onClick={() => setConfirmCloseTarget(null)}
              className="flex-1"
            >
              {t('landlordInvoicesConfirmCloseKeep')}
            </Button>

            <Button
              variant="danger"
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
