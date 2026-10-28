'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  AlertTriangle,
  FileSpreadsheet,
  DollarSign,
  Calendar,
  Send,
  CheckCircle2,
  Copy,
  Check,
  X,
  User,
  Phone,
  Loader2,
  Receipt,
  CreditCard,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  landlordInvoiceService,
  RoomDebtItem,
  LandlordDebtsSummary,
  ManualPaymentPayload,
} from '@/services/landlord-invoice.service'
import {
  Button,
  TableActionButton,
  TextInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Text,
  Chip,
  EmptyState,
} from '@/components/ui'
import { DashboardPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'

export default function LandlordDebtsPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { locale } = useLanguage()
  const { toast } = useToast()
  const isEn = locale === 'en'

  const [isMounted, setIsMounted] = useState(false)
  // Rule #9: Grid view as default (Grid=6, Table=10)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [pageSize, setPageSize] = useState<number>(6)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)

  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [durationFilter, setDurationFilter] = useState<
    'all' | 'current' | 'overdue' | '1_month' | '2_months' | 'bad_debt'
  >('all')
  const [sortBy, setSortBy] = useState<'debt_desc' | 'aging_desc' | 'room_asc'>('debt_desc')

  // Selection (Rule #9: applies to current page only)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([])

  // Data states
  const [isLoading, setIsLoading] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [debtRooms, setDebtRooms] = useState<RoomDebtItem[]>([])
  const [summary, setSummary] = useState<LandlordDebtsSummary>({
    totalDebtAmount: 0,
    overdueDebtAmount: 0,
    badDebtAmount: 0,
    debtorRoomsCount: 0,
    totalInvoicesCount: 0,
    agingDistribution: {
      under30Days: 0,
      under30DaysAmount: 0,
      from31To60Days: 0,
      from31To60DaysAmount: 0,
      over60Days: 0,
      over60DaysAmount: 0,
    },
  })

  // Modals
  const [invoicesModalRoom, setInvoicesModalRoom] = useState<RoomDebtItem | null>(null)
  const [reminderModalRoom, setReminderModalRoom] = useState<RoomDebtItem | null>(null)
  const [reminderNote, setReminderNote] = useState('')
  const [isReminderDirty, setIsReminderDirty] = useState(false)
  const [isSendingReminder, setIsSendingReminder] = useState(false)
  const [reminderCopied, setReminderCopied] = useState(false)
  const [reminderSuccessMessage, setReminderSuccessMessage] = useState<string | null>(null)

  // Manual payment modal
  const [paymentModalInvoice, setPaymentModalInvoice] = useState<{
    id: string
    period: string
    totalAmount: number
    roomNumber: string
  } | null>(null)
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'banking'>('cash')
  const [paymentNote, setPaymentNote] = useState('')
  const [isPaymentDirty, setIsPaymentDirty] = useState(false)
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false)

  // Rule #10: Unsaved changes confirmation modal
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<'reminder' | 'payment' | null>(null)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Clear selection on viewMode change without refetching data
  useEffect(() => {
    setSelectedRoomIds([])
  }, [viewMode])

  // Fetch debts from API
  const fetchDebts = useCallback(async () => {
    if (!activeBuilding?.id) return
    try {
      setIsLoading(true)
      const res = await landlordInvoiceService.getLandlordDebts(activeBuilding.id, {
        search: searchTerm,
        duration: durationFilter,
        sortBy,
        page: currentPage,
        limit: pageSize,
      })

      if (res && res.success) {
        setDebtRooms(res.data || [])
        setSummary(res.summary)
        setTotalRecords(res.meta.total || 0)
      }
    } catch (err) {
      console.error('Failed to load debts:', err)
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }, [activeBuilding?.id, searchTerm, durationFilter, sortBy, currentPage, pageSize])

  useEffect(() => {
    fetchDebts()
  }, [fetchDebts])

  // Trigger manual overdue check
  const handleTriggerFlip = async () => {
    if (!activeBuilding?.id) return
    try {
      setIsRefreshing(true)
      await landlordInvoiceService.flipOverdueInvoices(activeBuilding.id)
      await fetchDebts()
    } catch (err) {
      console.error('Failed to trigger overdue check:', err)
      setIsRefreshing(false)
    }
  }

  // Rule #9 Pagination Calculation
  const totalPages = Math.ceil(totalRecords / pageSize) || 1
  const windowSize = 5
  const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
  const visiblePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  )
  const startIndex = totalRecords === 0 ? 0 : (currentPage - 1) * pageSize + 1
  const endIndex = Math.min(currentPage * pageSize, totalRecords)

  // Format currency
  const formatCurrency = (amt: number) => {
    return isEn ? `${amt.toLocaleString('en-US')} ₫` : `${amt.toLocaleString('vi-VN')} ₫`
  }

  // Reminder message template
  const buildReminderText = (room: RoomDebtItem, customNote: string) => {
    const tenantName = room.tenant?.name || (isEn ? 'Tenant' : 'Khách thuê')
    const amountStr = formatCurrency(room.totalDebtAmount)
    if (isEn) {
      return `[Dormio - ${room.buildingName}]\nDear ${tenantName} (Room ${room.roomNumber}),\nThis is to notify you that your room currently has an outstanding balance for rent/services of: ${amountStr} (${room.invoicesCount} invoice(s)).\n${customNote ? `Landlord's note: "${customNote}"\n` : ''}Please arrange payment at your earliest convenience to protect your rental rights. Thank you!`
    }
    return `[Dormio - ${room.buildingName}]\nKính gửi anh/chị ${tenantName} (Phòng ${room.roomNumber}),\nHệ thống xin thông báo hiện tại phòng đang có dư nợ tiền trọ/dịch vụ chưa thanh toán: ${amountStr} (${room.invoicesCount} kỳ hóa đơn).\n${customNote ? `Ghi chú từ chủ trọ: "${customNote}"\n` : ''}Kính mong anh/chị thu xếp thanh toán sớm để đảm bảo quyền lợi thuê phòng. Trân trọng cảm ơn!`
  }

  // Copy reminder to clipboard
  const handleCopyReminder = (room: RoomDebtItem) => {
    const text = buildReminderText(room, reminderNote)
    navigator.clipboard.writeText(text)
    setReminderCopied(true)
    setTimeout(() => setReminderCopied(false), 2500)
  }

  // Send in-app reminder
  const handleSendInAppReminder = async (room: RoomDebtItem) => {
    if (!activeBuilding?.id) return
    try {
      setIsSendingReminder(true)
      const res = await landlordInvoiceService.sendDebtReminder(
        activeBuilding.id,
        room.roomId,
        reminderNote || undefined,
      )
      if (res && res.success) {
        setReminderSuccessMessage(res.message || t('landlordDebtsToastReminderSuccess'))
        setTimeout(() => {
          setReminderSuccessMessage(null)
          setReminderModalRoom(null)
          setReminderNote('')
          setIsReminderDirty(false)
        }, 1800)
      }
    } catch (err: unknown) {
      const errorMsg = (err as Error)?.message || t('landlordDebtsToastReminderFailed')
      toast.error(errorMsg)
    } finally {
      setIsSendingReminder(false)
    }
  }

  // Record manual payment
  const handleRecordPayment = async () => {
    if (!activeBuilding?.id || !paymentModalInvoice) return
    try {
      setIsSubmittingPayment(true)
      const payload: ManualPaymentPayload = {
        method: paymentMethod,
        note: paymentNote || undefined,
      }
      await landlordInvoiceService.recordManualPayment(
        activeBuilding.id,
        paymentModalInvoice.id,
        payload,
      )

      // Close modal and refresh
      setPaymentModalInvoice(null)
      setPaymentNote('')
      setIsPaymentDirty(false)
      setInvoicesModalRoom(null)
      await fetchDebts()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t('landlordDebtsToastPaymentFailed'))
    } finally {
      setIsSubmittingPayment(false)
    }
  }

  // Rule #10 Modal close handlers
  const handleRequestCloseReminder = () => {
    if (isReminderDirty) {
      setConfirmCloseTarget('reminder')
    } else {
      setReminderModalRoom(null)
      setReminderNote('')
      setIsReminderDirty(false)
    }
  }

  const handleRequestClosePayment = () => {
    if (isPaymentDirty) {
      setConfirmCloseTarget('payment')
    } else {
      setPaymentModalInvoice(null)
      setPaymentNote('')
      setIsPaymentDirty(false)
    }
  }

  const handleConfirmDiscard = () => {
    if (confirmCloseTarget === 'reminder') {
      setReminderModalRoom(null)
      setReminderNote('')
      setIsReminderDirty(false)
    } else if (confirmCloseTarget === 'payment') {
      setPaymentModalInvoice(null)
      setPaymentNote('')
      setIsPaymentDirty(false)
    }
    setConfirmCloseTarget(null)
  }

  // Export CSV
  const handleExportCSV = () => {
    if (debtRooms.length === 0) {
      toast.warning(t('landlordDebtsExportNoData'))
      return
    }

    const headers = isEn
      ? [
        'Room',
        'Floor',
        'Tenant',
        'Phone',
        'Total Debt (VND)',
        'Overdue Debt (VND)',
        'Max Aging Days',
        'Status',
        'Invoice Count',
      ]
      : [
        'Phòng',
        'Tầng',
        'Khách thuê',
        'Số điện thoại',
        'Số tiền nợ (VND)',
        'Nợ quá hạn (VND)',
        'Số ngày nợ cao nhất',
        'Tình trạng',
        'Số lượng hóa đơn',
      ]

    const rows = debtRooms.map(r => [
      r.roomNumber,
      r.floor !== null ? (isEn ? `Floor ${r.floor}` : `Tầng ${r.floor}`) : '-',
      r.tenant?.name || (isEn ? 'No name' : 'Chưa có tên'),
      r.tenant?.phone || '-',
      r.totalDebtAmount,
      r.overdueAmount,
      r.maxAgingDays,
      r.agingCategory === 'bad_debt'
        ? isEn
          ? 'Bad debt'
          : 'Nợ xấu'
        : r.agingCategory === '2_months'
          ? isEn
            ? '2 months overdue'
            : 'Quá hạn 2 tháng'
          : r.agingCategory === '1_month'
            ? isEn
              ? '1 month overdue'
              : 'Quá hạn 1 tháng'
            : isEn
              ? 'Due'
              : 'Đến hạn',
      r.invoicesCount,
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Dormio_Cong_No_${activeBuilding?.name || 'ToaNha'}_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Rule #9 Select All toggle
  const isAllCurrentPageSelected =
    debtRooms.length > 0 && debtRooms.every(r => selectedRoomIds.includes(r.roomId))

  const handleToggleSelectAll = () => {
    if (isAllCurrentPageSelected) {
      setSelectedRoomIds(prev => prev.filter(id => !debtRooms.some(r => r.roomId === id)))
    } else {
      const pageIds = debtRooms.map(r => r.roomId)
      setSelectedRoomIds(prev => Array.from(new Set([...prev, ...pageIds])))
    }
  }

  const handleToggleSelectRoom = (roomId: string) => {
    setSelectedRoomIds(prev =>
      prev.includes(roomId) ? prev.filter(id => id !== roomId) : [...prev, roomId],
    )
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'totalDebt',
        label: t('landlordDebtsTotalDebt'),
        value: formatCurrency(summary.totalDebtAmount),
        icon: <DollarSign className="w-5 h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[160px]',
        labelClassName: 'text-rose-400',
        valueClassName: 'text-rose-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'overdueDebt',
        label: t('landlordDebtsOverdueDebt'),
        value: formatCurrency(summary.overdueDebtAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[160px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'badDebt',
        label: t('landlordDebtsBadDebt3Months'),
        value: formatCurrency(summary.badDebtAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 lg:w-[160px]',
        labelClassName: 'text-purple-400',
        valueClassName: 'text-purple-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'debtorRooms',
        label: t('landlordDebtsDebtorRooms'),
        value: `${summary.debtorRoomsCount} ${t('landlordDebtsRoomUnit')}`,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[160px]',
        labelColor: 'brand',
        valueColor: 'brand',
        valueClassName: 'text-sm sm:text-base leading-none mt-1 tracking-tight',
      },
    ],
    [t, summary],
  )

  if (!isMounted) return null

  return (
    <div className="space-y-6 pb-20">
      {/* ─── Page Header ──────────────────────────────────────────────────────── */}
      <DashboardPageHeader
        title={t('landlordDebtsTitle')}
        subtitle={t('landlordDebtsSubtitle')}
        actions={
          <Button
            variant="success"
            size="md"
            onClick={handleExportCSV}
            leftIcon={<FileSpreadsheet />}
          >
            {t('landlordDebtsExportExcel')}
          </Button>
        }
      />

      {/* ─── Stat Banner ────────────────────────────────────────────────────── */}
      <LandlordStatBanner
        watermarkIcon={<AlertTriangle className="w-64 h-64" />}
        chips={statChips}
      />

      {/* ─── Filter & Control Bar ─────────────────────────────────────────────── */}
      <FilterToolbar
        search={
          <SearchInput
            value={searchTerm}
            onChange={val => {
              setSearchTerm(val)
              setCurrentPage(1)
            }}
            placeholder={t('landlordDebtsSearchPlaceholder')}
            containerClassName="w-full space-y-0"
            className="w-full text-xs font-semibold text-foreground bg-surface border border-line rounded-xl"
          />
        }
        filters={
          <>
            <SelectInput
              value={durationFilter}
              onChange={e => {
                setDurationFilter(e.target.value as typeof durationFilter)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: t('landlordDebtsAllDurations') },
                { value: 'overdue', label: t('landlordDebtsFilterOverdue') },
                { value: '1_month', label: t('landlordDebtsFilter1Month') },
                { value: '2_months', label: t('landlordDebtsFilter2Months') },
                { value: 'bad_debt', label: t('landlordDebtsFilterBadDebt') },
              ]}
              containerClassName="w-auto space-y-0"
              className="px-3 py-2 text-xs font-bold text-foreground/90 bg-surface border border-line rounded-xl"
            />

            <SelectInput
              value={sortBy}
              onChange={e => {
                setSortBy(e.target.value as typeof sortBy)
                setCurrentPage(1)
              }}
              options={[
                { value: 'debt_desc', label: t('landlordDebtsSortDebtDesc') },
                { value: 'aging_desc', label: t('landlordDebtsSortAgingDesc') },
                { value: 'room_asc', label: t('landlordDebtsSortRoomAsc') },
              ]}
              containerClassName="w-auto space-y-0"
              className="px-3 py-2 text-xs font-bold text-foreground/90 bg-surface border border-line rounded-xl"
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

      {/* ─── Loading / Empty / Content ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-card rounded-2xl border border-line text-center">
          <Loader2 className="w-8 h-8 text-teal-600 animate-spin mb-3" />
          <p className="text-sm font-bold text-foreground/90">{t('landlordDebtsLoadingTitle')}</p>
          <p className="text-xs text-muted mt-1">{t('landlordDebtsLoadingDesc')}</p>
        </div>
      ) : debtRooms.length === 0 ? (
        <EmptyState
          icon={<CheckCircle2 className="w-8 h-8 text-success" />}
          title={t('landlordDebtsEmptyFilteredTitle')}
          description={
            searchTerm || durationFilter !== 'all'
              ? t('landlordDebtsEmptyFilteredDesc')
              : t('landlordDebtsEmptyAllPaidDesc')
          }
          action={
            (searchTerm || durationFilter !== 'all') ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('')
                  setDurationFilter('all')
                }}
              >
                {t('landlordDebtsClearFilter')}
              </Button>
            ) : undefined
          }
        />
      ) : viewMode === 'grid' ? (
        /* ─── Grid View (Default per Rule #9) ─────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {debtRooms.map(room => {
            const isSelected = selectedRoomIds.includes(room.roomId)

            const isBadDebt = room.agingCategory === 'bad_debt'
            const is2Months = room.agingCategory === '2_months'

            const badgeLabel = isBadDebt
              ? t('landlordDebtsBadgeBadDebt')
              : is2Months
                ? t('landlordDebtsBadge2Months')
                : room.maxAgingDays > 0
                  ? t('landlordDebtsBadgeOverdueDays', { days: room.maxAgingDays })
                  : t('landlordDebtsBadgeDue')

            return (
              <Card
                key={room.roomId}
                onClick={() => setInvoicesModalRoom(room)}
                className={`flex flex-col justify-between overflow-hidden group ${
                  isSelected ? 'border-primary ring-2 ring-primary/20' : ''
                }`}
              >
                {/* Card Header */}
                <Card.Header className="px-5 pt-5 pb-2.5 border-0">
                  <div className="flex items-start justify-between gap-3 w-full">
                    <div>
                      <div className="flex items-center gap-2">
                        <Text
                          as="span"
                          size="base"
                          weight="black"
                          color="default"
                          className="group-hover:text-primary transition-colors"
                        >
                          {t('landlordDebtsRoomPrefix', { room: room.roomNumber })}
                        </Text>
                        {room.floor !== null && (
                          <Text
                            as="span"
                            size="3xs"
                            weight="bold"
                            color="secondary"
                            className="px-2 py-0.5 bg-card-hover rounded-md"
                          >
                            {t('landlordDebtsFloorPrefix', { floor: room.floor })}
                          </Text>
                        )}
                      </div>
                      <Text as="span" size="2xs" color="secondary" weight="medium" className="block mt-0.5">
                        {room.buildingName}
                      </Text>
                    </div>

                    <Chip
                      size="sm"
                      preventHover
                      variant={
                        isBadDebt
                          ? 'danger'
                          : is2Months
                            ? 'danger'
                            : room.maxAgingDays > 0
                              ? 'warning'
                              : 'neutral'
                      }
                    >
                      {badgeLabel}
                    </Chip>
                  </div>
                </Card.Header>

                {/* Card Body */}
                <Card.Body className="px-5 py-0 space-y-3">
                  {/* Tenant Details */}
                  <div className="flex items-center justify-between p-3 bg-surface rounded-xl">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-card-hover text-muted flex items-center justify-center font-bold text-xs shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <Text as="span" size="xs" weight="bold" color="default" clamp={1} className="block">
                          {room.tenant?.name || t('landlordDebtsNoTenant')}
                        </Text>
                        {room.tenant?.phone ? (
                          <a
                            href={`tel:${room.tenant.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="text-[11px] text-muted hover:text-primary flex items-center gap-1 font-semibold"
                          >
                            <Phone className="w-3 h-3" />
                            {room.tenant.phone}
                          </a>
                        ) : (
                          <Text as="span" size="3xs" color="subtle">
                            {t('landlordDebtsNoPhone')}
                          </Text>
                        )}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <Text as="span" size="3xs" weight="bold" color="secondary" uppercase className="tracking-wider block">
                        {t('landlordDebtsInvoicesCount')}
                      </Text>
                      <Text as="span" size="xs" weight="black" color="default">
                        {t('landlordDebtsInvoicesUnit', { count: room.invoicesCount })}
                      </Text>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="p-3 bg-surface rounded-xl space-y-2 text-xs">
                    <div className="flex items-baseline justify-between">
                      <Text as="span" size="xs" weight="bold" color="secondary">
                        {t('landlordDebtsTotalDebtLabel')}
                      </Text>
                      <Text as="span" size="lg" weight="black" color="danger" className="tracking-tight">
                        {formatCurrency(room.totalDebtAmount)}
                      </Text>
                    </div>

                    {room.overdueAmount > 0 && (
                      <div className="flex items-center justify-between text-xs">
                        <Text as="span" size="xs" color="secondary" weight="medium">
                          {t('landlordDebtsOverduePartLabel')}
                        </Text>
                        <Text as="span" size="xs" weight="extrabold" color="orange">
                          {formatCurrency(room.overdueAmount)}
                        </Text>
                      </div>
                    )}

                    {/* Oldest Debt Date */}
                    <div className="flex items-center justify-between text-[11px] text-muted pt-2 border-t border-line">
                      <span className="flex items-center gap-1 font-medium">
                        <Calendar className="w-3 h-3 text-muted" />
                        {t('landlordDebtsOldestDebtDate')}
                      </span>
                      <Text as="span" size="2xs" weight="bold" color="default">
                        {new Date(room.oldestDueDate).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
                      </Text>
                    </div>
                  </div>
                </Card.Body>

                {/* Card Actions Footer */}
                <Card.Footer className="px-5 pt-3 pb-4 flex items-center justify-end gap-2">
                  <Button
                    onClick={e => {
                      e.stopPropagation()
                      setReminderModalRoom(room)
                      setReminderNote('')
                      setIsReminderDirty(false)
                      setReminderCopied(false)
                    }}
                    leftIcon={<Send />}
                  >
                    {t('landlordDebtsBtnSendReminder')}
                  </Button>
                </Card.Footer>
              </Card>
            )
          })}
        </div>
      ) : (
        /* ─── Table View (Rule #9) ────────────────────────────────────────────── */
        <div className="bg-card rounded-2xl border border-line overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 text-muted uppercase tracking-wider font-extrabold border-b border-line text-[11px]">
                <tr>
                  <th className="p-4">{t('landlordDebtsThRoomTenant')}</th>
                  <th className="p-4">{t('landlordDebtsThPhone')}</th>
                  <th className="p-4 text-right">{t('landlordDebtsThTotalDebt')}</th>
                  <th className="p-4 text-right">{t('landlordDebtsThOverdueDebt')}</th>
                  <th className="p-4 text-center">{t('landlordDebtsThCycles')}</th>
                  <th className="p-4">{t('landlordDebtsThSince')}</th>
                  <th className="p-4 text-center">{t('landlordDebtsThStatus')}</th>
                  <th className="p-4 text-center">{t('landlordDebtsThActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {debtRooms.map(room => {
                  const isSelected = selectedRoomIds.includes(room.roomId)
                  const isBadDebt = room.agingCategory === 'bad_debt'
                  const is2Months = room.agingCategory === '2_months'

                  const badgeLabel = isBadDebt
                    ? t('landlordDebtsBadDebtStatus')
                    : is2Months
                      ? t('landlordDebtsOverdue2Months')
                      : room.maxAgingDays > 0
                        ? t('landlordDebtsBadgeOverdueDays', { days: room.maxAgingDays })
                        : t('landlordDebtsBadgeDue')

                  return (
                    <TableRow
                      key={room.roomId}
                      className={`hover:bg-card-hover transition-colors duration-150 ${
                        isSelected ? 'bg-primary-soft' : ''
                      }`}
                      onClick={() => setInvoicesModalRoom(room)}
                    >
                      <td className="p-4 whitespace-nowrap">
                        <Text as="span" size="xs" weight="bold" color="default" className="block">
                          {t('landlordDebtsRoomPrefix', { room: room.roomNumber })}
                          {room.floor !== null && (
                            <Text as="span" size="3xs" color="secondary" className="ml-1.5 font-normal">
                              ({t('landlordDebtsFloorPrefix', { floor: room.floor })})
                            </Text>
                          )}
                        </Text>
                        <Text as="span" size="2xs" color="secondary" weight="medium">
                          {room.tenant?.name || t('landlordDebtsNoTenant')}
                        </Text>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        {room.tenant?.phone ? (
                          <a
                            href={`tel:${room.tenant.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="text-xs text-foreground/90 hover:text-primary font-semibold"
                          >
                            {room.tenant.phone}
                          </a>
                        ) : (
                          <Text as="span" size="xs" color="secondary">-</Text>
                        )}
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <Text as="span" size="sm" weight="black" color="danger">
                          {formatCurrency(room.totalDebtAmount)}
                        </Text>
                      </td>

                      <td className="p-4 text-right whitespace-nowrap">
                        <Text as="span" size="xs" weight="extrabold" color="orange">
                          {formatCurrency(room.overdueAmount)}
                        </Text>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <Text as="span" size="xs" weight="bold" color="default">
                          {t('landlordDebtsMonthsCount', { count: room.invoicesCount })}
                        </Text>
                      </td>

                      <td className="p-4 whitespace-nowrap">
                        <Text as="span" size="xs" color="secondary">
                          {new Date(room.oldestDueDate).toLocaleDateString(isEn ? 'en-US' : 'vi-VN')}
                        </Text>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <Chip
                          size="sm"
                          preventHover
                          variant={
                            isBadDebt
                              ? 'danger'
                              : is2Months
                                ? 'danger'
                                : room.maxAgingDays > 0
                                  ? 'warning'
                                  : 'neutral'
                          }
                        >
                          {badgeLabel}
                        </Chip>
                      </td>

                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <TableActionButton
                            variant="primary"
                            icon={<Send />}
                            onClick={event => {
                              event.stopPropagation()
                              setReminderModalRoom(room)
                              setReminderNote('')
                              setIsReminderDirty(false)
                              setReminderCopied(false)
                            }}
                            title={t('landlordDebtsBtnSendReminder')}
                          />
                        </div>
                      </td>
                    </TableRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Rule #9 Pagination Bar ───────────────────────────────────────────── */}
      {debtRooms.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalRecords}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeMax={100}
          unitLabel={t('landlordDebtsPaginationRooms')}
        />
      )}

      {/* ─── Modal 1: Invoices List for Room ──────────────────────────────────── */}
      {invoicesModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-2xl rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-6 bg-surface border-b border-line flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Receipt className="w-5 h-5 text-teal-600" />
                  <h3 className="text-lg font-black text-foreground">
                    {t('landlordDebtsModalInvoicesTitle', { room: invoicesModalRoom.roomNumber })}
                  </h3>
                </div>
                <p className="text-xs text-muted mt-0.5">
                  {t('landlordDebtsModalTenant', {
                    name: invoicesModalRoom.tenant?.name || (isEn ? 'None' : 'Chưa có tên'),
                  })}{' '}
                  •{' '}
                  {t('landlordDebtsModalPhone', {
                    phone: invoicesModalRoom.tenant?.phone || (isEn ? 'None' : 'Chưa có'),
                  })}
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setInvoicesModalRoom(null)}
              >
                <X />
              </Button>
            </div>

            {/* Invoices List */}
            <div className="p-6 overflow-y-auto space-y-4">
              <div className="p-4 bg-danger-soft border border-danger-subtle rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-extrabold text-danger uppercase tracking-wider block">
                    {t('landlordDebtsModalTotalOutstanding')}
                  </span>
                  <span className="text-2xl font-black text-danger">
                    {formatCurrency(invoicesModalRoom.totalDebtAmount)}
                  </span>
                </div>
                <span className="px-3 py-1 bg-card text-danger font-black text-xs rounded-full border border-danger-subtle shadow-sm">
                  {t('landlordDebtsModalInvoicesSummary', {
                    count: invoicesModalRoom.invoicesCount,
                  })}
                </span>
              </div>

              <div className="space-y-3">
                {invoicesModalRoom.invoices.map(inv => (
                  <div
                    key={inv.id}
                    className="p-4 rounded-2xl border border-line bg-card hover:border-teal-500/50 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-foreground">
                          {t('landlordDebtsModalPeriod', { period: inv.period })}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${inv.status === 'overdue'
                            ? 'bg-danger-soft text-danger border-danger-subtle'
                            : 'bg-warning-soft text-warning border-warning-subtle'
                            }`}
                        >
                          {inv.status === 'overdue'
                            ? t('landlordDebtsModalStatusOverdue')
                            : t('landlordDebtsModalStatusUncollected')}
                        </span>
                        {inv.agingDays > 0 && (
                          <span className="text-[10px] font-bold text-muted">
                            {t('landlordDebtsModalOverdueDays', { days: inv.agingDays })}
                          </span>
                        )}
                      </div>
                      <span className="text-xs text-muted mt-1 block">
                        {t('landlordDebtsModalDueDate', {
                          date: new Date(inv.dueDate).toLocaleDateString(isEn ? 'en-US' : 'vi-VN'),
                        })}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                      <span className="text-base font-black text-danger">
                        {formatCurrency(inv.totalAmount)}
                      </span>

                      <Button
                        variant="outline"
                        onClick={() => {
                          setPaymentModalInvoice({
                            id: inv.id,
                            period: inv.period,
                            totalAmount: inv.totalAmount,
                            roomNumber: invoicesModalRoom.roomNumber,
                          })
                          setPaymentMethod('cash')
                          setPaymentNote('')
                          setIsPaymentDirty(false)
                        }}
                        leftIcon={<CreditCard />}
                      >
                        {t('landlordDebtsModalCollectNow')}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface border-t border-line flex items-center justify-end">
              <Button
                variant="outline"
                onClick={() => setInvoicesModalRoom(null)}
              >
                {t('landlordDebtsModalClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Send Debt Reminder ─────────────────────────────────────── */}
      {reminderModalRoom && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="p-6 bg-gradient-to-r from-teal-500 to-teal-600 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Send className="w-5 h-5" />
                <div>
                  <h3 className="text-base font-black">
                    {t('landlordDebtsModalReminderTitle', { room: reminderModalRoom.roomNumber })}
                  </h3>
                  <p className="text-xs text-teal-100">{t('landlordDebtsModalReminderSubtitle')}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRequestCloseReminder}
              >
                <X />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              {reminderSuccessMessage && (
                <div className="p-4 bg-success-soft border border-success-subtle text-success rounded-2xl text-xs font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
                  <span>{reminderSuccessMessage}</span>
                </div>
              )}

              {/* Tenant info banner */}
              <div className="p-4 bg-surface border border-line rounded-2xl grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">
                    {t('landlordDebtsModalRecipient')}
                  </span>
                  <span className="font-extrabold text-foreground block">
                    {reminderModalRoom.tenant?.name || (isEn ? 'No name' : 'Chưa có tên')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">
                    {t('landlordDebtsModalRecipientPhone')}
                  </span>
                  <span className="font-extrabold text-foreground block">
                    {reminderModalRoom.tenant?.phone || (isEn ? 'None' : 'Chưa có')}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">
                    {t('landlordDebtsTotalDebt')}
                  </span>
                  <span className="font-black text-danger block text-sm">
                    {formatCurrency(reminderModalRoom.totalDebtAmount)}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-muted uppercase">
                    {t('landlordDebtsInvoicesCount')}
                  </span>
                  <span className="font-extrabold text-foreground block">
                    {t('landlordDebtsModalInvoicesSummary', {
                      count: reminderModalRoom.invoicesCount,
                    })}
                  </span>
                </div>
              </div>

              {/* Custom Memo Input */}
              <div className="space-y-1.5">
                <TextInput
                  label={t('landlordDebtsModalMemoLabel')}
                  type="text"
                  value={reminderNote}
                  onChange={e => {
                    setReminderNote(e.target.value)
                    setIsReminderDirty(true)
                  }}
                  placeholder={t('landlordDebtsModalMemoPlaceholder')}
                  containerClassName="w-full space-y-1.5"
                  className="w-full px-3.5 py-2 text-xs text-foreground border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                />
              </div>

              {/* Message Preview */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-muted uppercase tracking-wider">
                    {t('landlordDebtsModalTemplateTitle')}
                  </label>
                  <Button
                    variant="ghost"
                    onClick={() => handleCopyReminder(reminderModalRoom)}
                    leftIcon={reminderCopied ? <Check className="text-success" /> : <Copy />}
                  >
                    <span className={reminderCopied ? 'text-success' : undefined}>
                      {reminderCopied ? t('landlordDebtsModalCopied') : t('landlordDebtsModalCopyBtn')}
                    </span>
                  </Button>
                </div>
                <div className="p-3.5 bg-surface border border-line rounded-2xl text-xs text-foreground/90 font-mono whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {buildReminderText(reminderModalRoom, reminderNote)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-surface border-t border-line flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={handleRequestCloseReminder}
              >
                {t('landlordDebtsModalCancelBtn')}
              </Button>

              <Button
                disabled={isSendingReminder}
                isLoading={isSendingReminder}
                onClick={() => handleSendInAppReminder(reminderModalRoom)}
                leftIcon={<Send />}
              >
                <span>{t('landlordDebtsModalSendAppBtn')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Manual Payment Recording ────────────────────────────────── */}
      {paymentModalInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-md rounded-3xl shadow-2xl border border-line overflow-hidden flex flex-col">
            <div className="p-6 bg-surface border-b border-line flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-success" />
                <h3 className="text-base font-black text-foreground">
                  {t('landlordDebtsModalPaymentTitle', { room: paymentModalInvoice.roomNumber })}
                </h3>
              </div>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleRequestClosePayment}
              >
                <X />
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-4 bg-success-soft rounded-2xl border border-success-subtle text-center">
                <span className="text-[11px] font-extrabold text-success uppercase block">
                  {t('landlordDebtsModalPaymentAmount', { period: paymentModalInvoice.period })}
                </span>
                <span className="text-2xl font-black text-success block mt-1">
                  {formatCurrency(paymentModalInvoice.totalAmount)}
                </span>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/90">
                  {t('landlordDebtsModalPaymentMethod')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={paymentMethod === 'cash' ? 'primary' : 'outline'}
                    onClick={() => {
                      setPaymentMethod('cash')
                      setIsPaymentDirty(true)
                    }}
                  >
                    {t('landlordDebtsModalMethodCash')}
                  </Button>
                  <Button
                    variant={paymentMethod === 'banking' ? 'primary' : 'outline'}
                    onClick={() => {
                      setPaymentMethod('banking')
                      setIsPaymentDirty(true)
                    }}
                  >
                    {t('landlordDebtsModalMethodBanking')}
                  </Button>
                </div>
              </div>

              <div className="space-y-1.5">
                <TextareaInput
                  label={t('landlordDebtsModalPaymentNoteLabel')}
                  rows={2}
                  value={paymentNote}
                  onChange={e => {
                    setPaymentNote(e.target.value)
                    setIsPaymentDirty(true)
                  }}
                  placeholder={t('landlordDebtsModalPaymentNotePlaceholder')}
                  containerClassName="w-full space-y-1.5"
                  className="w-full px-3 py-2 text-xs text-foreground border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                />
              </div>
            </div>

            <div className="p-4 bg-surface border-t border-line flex items-center justify-end gap-2.5">
              <Button
                variant="outline"
                onClick={handleRequestClosePayment}
              >
                {t('landlordDebtsModalCancelBtn')}
              </Button>

              <Button
                disabled={isSubmittingPayment}
                isLoading={isSubmittingPayment}
                onClick={handleRecordPayment}
                leftIcon={<Check />}
              >
                <span>{t('landlordDebtsModalConfirmPaymentBtn')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Rule #10: Unsaved Changes Confirmation Modal ─────────────────────── */}
      {confirmCloseTarget && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-sm rounded-3xl p-6 shadow-2xl border border-line space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-black text-foreground">
                {t('landlordDebtsModalConfirmDiscardTitle')}
              </h4>
              <p className="text-xs text-muted mt-1">
                {t('landlordDebtsModalConfirmDiscardDesc')}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <Button
                variant="outline"
                onClick={() => setConfirmCloseTarget(null)}
              >
                {t('landlordDebtsModalKeepEditing')}
              </Button>
              <Button
                variant="danger"
                onClick={handleConfirmDiscard}
              >
                {t('landlordDebtsModalDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
