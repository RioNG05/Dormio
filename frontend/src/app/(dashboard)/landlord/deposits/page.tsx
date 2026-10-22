'use client'

import React, { useState, useEffect, Suspense, useCallback, useMemo } from 'react'
import { LandlordPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
import { useRouter } from 'next/navigation'
import {
  Plus,
  PiggyBank,
  Clock,
  AlertTriangle,
  Send,
  FileText,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Loader2,
  DiamondPlus,
  FilePenLine,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  Modal,
  Text,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Chip,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  createManualDeposit,
  getDeposits,
  refundDeposit,
  DepositItem,
  DepositStats,
} from '@/services/deposit.service'
import { getRooms, RoomItem } from '@/services/room.service'

// Large Money Formatter Helper (Prevents digit wrapping)
const formatLargeMoney = (
  amount: number,
  unitBillion: string = 'B ₫',
  unitMillion: string = 'M ₫',
  locale: string = 'vi',
): string => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(2).replace(/\.00$/, '')} ${unitBillion}`
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(2).replace(/\.00$/, '')} ${unitMillion}`
  }
  return `${amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫`
}

function DepositsContent() {
  const { activeBuilding } = useAuth()
  const { locale } = useLanguage()
  const router = useRouter()
  const t = useTranslations('landlord')
  const { toast } = useToast()

  const getDepositStatusLabel = (status: string) => {
    switch (status) {
      case 'Đang giữ':
      case 'holding':
        return t('landlordDepositsStatusHolding')
      case 'Đã hoàn':
      case 'Đã hoàn cọc':
      case 'refunded':
        return t('landlordDepositsStatusRefunded')
      case 'Đã khấu trừ':
      case 'deducted':
      case 'forfeited':
        return t('landlordDepositsStatusDeducted')
      default:
        return status
    }
  }

  const getDepositTypeLabel = (type: string) => {
    switch (type) {
      case 'Cọc giữ chỗ':
      case 'hold':
        return t('landlordDepositsHoldingDeposit')
      case 'Cọc hợp đồng':
      case 'contract':
        return t('landlordDepositsContractDeposit')
      default:
        return type
    }
  }

  // Data states (Real backend data, NO mockups)
  const [depositsList, setDepositsList] = useState<DepositItem[]>([])
  const [stats, setStats] = useState<DepositStats>({
    totalHoldingAmount: 0,
    totalHoldTypeAmount: 0,
    totalRefundedAmount: 0,
    totalDeductedAmount: 0,
    holdingCountTotal: 0,
    holdTypeHoldingCountTotal: 0,
    refundedCountTotal: 0,
    deductedCountTotal: 0,
    holdTypeCountTotal: 0,
    contractTypeCountTotal: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [totalItems, setTotalItems] = useState(0)

  // Available rooms for manual deposit entry
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // View mode state (Rule #9: Grid is default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Top Segment Switcher for 2 Deposit Types ("hold" vs "contract")
  const [selectedDepositTypeTab, setSelectedDepositTypeTab] = useState<'hold' | 'contract'>('hold')

  // Status Filter Tab per active Deposit Type (all | holding | refunded | deducted)
  const [activeStatusTab, setActiveStatusTab] = useState<
    'all' | 'holding' | 'refunded' | 'deducted'
  >('all')

  const [searchTerm, setSearchTerm] = useState('')

  // Selected Deposit for Lightbox / Details Modals
  const [selectedDeposit, setSelectedDeposit] = useState<DepositItem | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showUpgradeModal, setShowUpgradeModal] = useState<DepositItem | null>(null)
  const [showRefundModal, setShowRefundModal] = useState<DepositItem | null>(null)

  // Refund & Deduction Form State (Unified Modal)
  const [refundForm, setRefundForm] = useState({
    deductedAmount: '0',
    deductionReason: '',
    note: '',
  })

  // Rule #10 Unsaved Confirmation Modal
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<
    'create' | 'upgrade' | 'refund' | null
  >(null)
  const [isFormDirty, setIsFormDirty] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    if (type === 'error') {
      toast.error(message)
    } else {
      toast.success(message)
    }
  }

  // New Manual Deposit Form State
  const [newDepositForm, setNewDepositForm] = useState({
    roomId: '',
    tenantName: '',
    tenantPhone: '',
    depositType: 'hold' as 'hold' | 'contract',
    amount: '',
    expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    note: '',
  })

  // Upgrade Form State (Hold Deposit -> Contract Deposit)
  const [upgradeForm, setUpgradeForm] = useState({
    targetContractAmount: '',
    additionalAmount: 0,
    note: '',
  })

  // Rule #9 Pagination State
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // Default 6 for Grid

  // Recalculate additional required deposit when upgrade modal target amount changes
  useEffect(() => {
    if (showUpgradeModal) {
      const target = Number(upgradeForm.targetContractAmount) || 0
      const current = showUpgradeModal.amount
      setUpgradeForm(prev => ({
        ...prev,
        additionalAmount: Math.max(0, target - current),
      }))
    }
  }, [upgradeForm.targetContractAmount, showUpgradeModal])

  // ─── Fetch Deposits from Backend API ────────────────────────────────────────
  // NOTE: isEn and locale are intentionally excluded from deps to prevent re-fetching on language switch!
  const fetchDeposits = useCallback(async () => {
    if (!activeBuilding?.id) return

    try {
      setIsLoading(true)

      const statusParam =
        activeStatusTab === 'holding'
          ? 'paid'
          : activeStatusTab === 'refunded'
            ? 'refund'
            : activeStatusTab === 'deducted'
              ? 'forfeited'
              : undefined

      const res = await getDeposits(activeBuilding.id, {
        page: currentPage,
        limit: pageSize,
        search: searchTerm.trim() || undefined,
        status: statusParam,
        depositCategory: selectedDepositTypeTab,
      })

      setDepositsList(res.data)
      setStats(res.stats)
      setTotalItems(res.meta.total)
    } catch (err: any) {
      console.error('Error fetching deposits:', err)
      showToast(err.message || 'Error fetching deposits', 'error')
    } finally {
      setIsLoading(false)
    }
  }, [
    activeBuilding?.id,
    selectedDepositTypeTab,
    activeStatusTab,
    searchTerm,
    currentPage,
    pageSize,
  ])

  useEffect(() => {
    fetchDeposits()
  }, [fetchDeposits])

  // ─── Fetch Available Rooms for New Deposit Modal ───────────────────────────

  const fetchAvailableRooms = useCallback(async () => {
    if (!activeBuilding?.id) return
    try {
      setIsLoadingRooms(true)
      const res = await getRooms(activeBuilding.id, { limit: 100 })
      setAvailableRooms(res.data)
    } catch (err: any) {
      console.error('Error fetching rooms for deposit modal:', err)
    } finally {
      setIsLoadingRooms(false)
    }
  }, [activeBuilding?.id])

  useEffect(() => {
    fetchAvailableRooms()
  }, [fetchAvailableRooms])

  // ─── Handle Create Manual Deposit ────────────────────────────────

  const handleCreateDeposit = async () => {
    if (!activeBuilding?.id) {
      showToast(t('landlordDepositsToastSelectBuilding'), 'error')
      return
    }

    if (!newDepositForm.roomId) {
      showToast(t('landlordDepositsToastSelectRoom'), 'error')
      return
    }

    if (!newDepositForm.tenantName.trim()) {
      showToast(t('landlordDepositsToastEnterName'), 'error')
      return
    }

    if (!newDepositForm.tenantPhone.trim()) {
      showToast(t('landlordDepositsToastEnterPhone'), 'error')
      return
    }

    const amt = Number(newDepositForm.amount)
    if (!amt || amt <= 0) {
      showToast(t('landlordDepositsToastAmountPositive'), 'error')
      return
    }

    try {
      setIsSubmitting(true)
      await createManualDeposit(activeBuilding.id, {
        roomId: newDepositForm.roomId,
        amount: amt,
        tenantName: newDepositForm.tenantName.trim(),
        tenantPhone: newDepositForm.tenantPhone.trim(),
        expiryDate: newDepositForm.expiryDate || undefined,
        note: newDepositForm.note.trim() || undefined,
      })

      showToast(t('landlordDepositsToastCreateSuccess'), 'success')
      setShowCreateModal(false)
      setIsFormDirty(false)

      // Reset form
      setNewDepositForm({
        roomId: '',
        tenantName: '',
        tenantPhone: '',
        depositType: 'hold',
        amount: '',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: '',
      })

      // Switch view to hold deposits tab and refresh
      setSelectedDepositTypeTab('hold')
      setActiveStatusTab('holding')
      await fetchDeposits()
      await fetchAvailableRooms()
    } catch (err: any) {
      console.error('Error creating manual deposit:', err)
      showToast(err.message || t('landlordDepositsToastCreateFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Handle Refund & Deduction Deposit (Unified) ───────────────────────────

  const handleRefundDeposit = async () => {
    if (!activeBuilding?.id || !showRefundModal) return

    try {
      setIsSubmitting(true)
      const deductAmt = Math.min(
        showRefundModal.amount,
        Math.max(0, Number(refundForm.deductedAmount) || 0),
      )

      await refundDeposit(activeBuilding.id, showRefundModal.id, {
        deductedAmount: deductAmt,
        deductionReason:
          refundForm.deductionReason ||
          (deductAmt > 0 ? t('landlordDepositsDefaultDeductionReason') : undefined),
        note: refundForm.note || undefined,
      })

      showToast(t('landlordDepositsToastRefundSuccess'), 'success')
      setShowRefundModal(null)
      setIsFormDirty(false)
      await fetchDeposits()
      await fetchAvailableRooms()
    } catch (err: any) {
      console.error('Error processing refund:', err)
      showToast(err.message || t('landlordDepositsToastRefundFailed'), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ─── Handle Upgrade Hold Deposit -> Contract Deposit ───────────────────────

  const handleConfirmUpgradeToContract = () => {
    if (!showUpgradeModal) return
    router.push(
      `/landlord/contracts?action=create&roomId=${encodeURIComponent(showUpgradeModal.roomId)}&depositId=${encodeURIComponent(showUpgradeModal.id)}`,
    )
    setShowUpgradeModal(null)
    setIsFormDirty(false)
  }

  // ─── Rule #10 Unsaved Pop-up Confirmation Modal ────────────────────────────

  const requestCloseModal = (target: 'create' | 'upgrade' | 'refund') => {
    if (isFormDirty) {
      setConfirmCloseTarget(target)
    } else {
      if (target === 'create') setShowCreateModal(false)
      if (target === 'upgrade') setShowUpgradeModal(null)
      if (target === 'refund') setShowRefundModal(null)
    }
  }

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === 'create') {
      setShowCreateModal(false)
      setNewDepositForm({
        roomId: '',
        tenantName: '',
        tenantPhone: '',
        depositType: 'hold',
        amount: '',
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        note: '',
      })
    }
    if (confirmCloseTarget === 'upgrade') setShowUpgradeModal(null)
    if (confirmCloseTarget === 'refund') setShowRefundModal(null)
    setConfirmCloseTarget(null)
    setIsFormDirty(false)
  }

  // Render Clean Status Badges
  const renderStatusBadge = (dep: DepositItem) => {
    if (dep.status === 'paid') {
      return (
        <Chip preventHover variant="primary" size="sm">
          {t('landlordDepositsStatusHolding')}
        </Chip>
      )
    }

    if (dep.status === 'refund') {
      const hasDeduction = (dep.deductedAmount ?? 0) > 0
      return (
        <div className="flex flex-wrap items-center gap-1 justify-end sm:justify-start">
          <Chip preventHover variant="info" size="sm">
            {t('landlordDepositsStatusRefunded')}
          </Chip>
          {hasDeduction && (
            <Chip
              preventHover
              variant="danger"
              size="sm"
              title={t('landlordDepositsPartialDeductionBadge').replace(
                '{amount}',
                `${dep.deductedAmount?.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫`,
              )}
            >
              {t('landlordDepositsStatusDeducted')}
            </Chip>
          )}
        </div>
      )
    }

    // 100% Deduction / Forfeited status
    return (
      <Chip preventHover variant="danger" size="sm">
        {t('landlordDepositsStatusDeducted')}
      </Chip>
    )
  }

  // Rule #9 Pagination Window Calculation (5-page window jumping)
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)

  const windowSize = 5
  const currentWindowIndex = Math.floor((currentPage - 1) / windowSize)
  const windowStart = currentWindowIndex * windowSize + 1
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
  const pageNumbers = Array.from({ length: windowEnd - windowStart + 1 }, (_, i) => windowStart + i)

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'holding',
        label: `${t('landlordDepositsStatHeld')} (${stats.holdingCountTotal})`,
        value: formatLargeMoney(
          stats.totalHoldingAmount,
          t('landlordInvoicesUnitBillion'),
          t('landlordInvoicesUnitMillion'),
          locale,
        ),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[160px]',
        labelColor: 'brand',
        valueColor: 'brand',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5 tracking-tight',
      },
      {
        key: 'holdingCount',
        label: t('landlordDepositsStatHoldingCount').replace(
          '{count}',
          String(stats.holdTypeHoldingCountTotal),
        ),
        value: formatLargeMoney(
          stats.totalHoldTypeAmount,
          t('landlordInvoicesUnitBillion'),
          t('landlordInvoicesUnitMillion'),
          locale,
        ),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[160px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-sm sm:text-base leading-none mt-0.5 tracking-tight',
      },
      {
        key: 'refunded',
        label: t('landlordDepositsStatRefundedCount').replace(
          '{count}',
          String(stats.refundedCountTotal),
        ),
        value: formatLargeMoney(
          stats.totalRefundedAmount,
          t('landlordInvoicesUnitBillion'),
          t('landlordInvoicesUnitMillion'),
          locale,
        ),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/30 lg:w-[160px]',
        labelClassName: 'text-purple-400',
        valueClassName: 'text-purple-400 text-sm sm:text-base leading-none mt-0.5 tracking-tight',
      },
      {
        key: 'deducted',
        label: t('landlordDepositsStatDeductedCount').replace(
          '{count}',
          String(stats.deductedCountTotal),
        ),
        value: formatLargeMoney(
          stats.totalDeductedAmount,
          t('landlordInvoicesUnitBillion'),
          t('landlordInvoicesUnitMillion'),
          locale,
        ),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[160px]',
        labelClassName: 'text-rose-400',
        valueClassName: 'text-rose-400 text-sm sm:text-base leading-none mt-0.5 tracking-tight',
      },
    ],
    [t, stats, locale],
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <LandlordPageHeader
        title={t('landlordDepositsTitle')}
        subtitle={t('landlordDepositsSubtitle')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setShowCreateModal(true)
              setIsFormDirty(false)
              fetchAvailableRooms()
            }}
            className="sm:w-auto"
            leftIcon={<Plus className="shrink-0 w-4 h-4" />}
          >
            {t('landlordDepositsAddNew')}
          </Button>
        }
      />

      {/* Dark Hero Summary Banner */}
      <LandlordStatBanner
        chips={statChips}
        watermarkIcon={<PiggyBank className="w-64 h-64" />}
      />

      {/* Main Filter & Control Bar */}
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordDepositsSearchPlaceholder')}
            value={searchTerm}
            onChange={val => {
              setSearchTerm(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full space-y-0"
          />
        }
        filters={
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 bg-card-hover p-1 rounded-2xl sm:rounded-full border border-line w-full sm:w-auto">
              <Button
                rounded="full"
                variant={selectedDepositTypeTab === 'hold' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setSelectedDepositTypeTab('hold')
                  setActiveStatusTab('all')
                  setCurrentPage(1)
                }}
                className={cn(
                  'rounded-xl sm:rounded-full text-xs font-black transition-all gap-2',
                  selectedDepositTypeTab === 'hold'
                    ? 'bg-amber-500 hover:bg-warning text-white shadow-xs'
                    : 'text-muted hover:text-foreground hover:bg-zinc-200/50',
                )}
                leftIcon={<Clock className="shrink-0 w-3.5 h-3.5" />}
              >
                <Text as="span" size="xs" weight="black" color="inherit" className="whitespace-nowrap">
                  {t('landlordDepositsTabHoldingButton')}
                </Text>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-black',
                    selectedDepositTypeTab === 'hold'
                      ? 'bg-white/20 text-white'
                      : 'bg-line text-foreground/90',
                  )}
                >
                  {stats.holdTypeCountTotal}
                </span>
              </Button>

              <Button
                rounded="full"
                variant={selectedDepositTypeTab === 'contract' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => {
                  setSelectedDepositTypeTab('contract')
                  setActiveStatusTab('all')
                  setCurrentPage(1)
                }}
                className={cn(
                  'rounded-xl sm:rounded-full text-xs font-black transition-all gap-2',
                  selectedDepositTypeTab === 'contract'
                    ? 'bg-primary text-white shadow-xs'
                    : 'text-muted hover:text-foreground hover:bg-zinc-200/50',
                )}
                leftIcon={<FileText className="shrink-0 w-3.5 h-3.5" />}
              >
                <Text as="span" size="xs" weight="black" color="inherit" className="whitespace-nowrap">
                  {t('landlordDepositsTabContractButton')}
                </Text>
                <span
                  className={cn(
                    'px-2 py-0.5 rounded-full text-[10px] font-black',
                    selectedDepositTypeTab === 'contract'
                      ? 'bg-white/20 text-white'
                      : 'bg-line text-foreground/90',
                  )}
                >
                  {stats.contractTypeCountTotal}
                </span>
              </Button>
            </div>

            <SelectInput
              value={activeStatusTab}
              onChange={e => {
                setActiveStatusTab(e.target.value as 'all' | 'holding' | 'refunded' | 'deducted')
                setCurrentPage(1)
              }}
              containerClassName="w-full sm:w-auto min-w-[160px] space-y-0"
              options={[
                {
                  value: 'all',
                  label: t('landlordDepositsStatusAll'),
                },
                {
                  value: 'holding',
                  label: `${t('landlordDepositsStatusHolding')} (${selectedDepositTypeTab === 'hold'
                    ? stats.holdTypeHoldingCountTotal
                    : stats.holdingCountTotal - stats.holdTypeHoldingCountTotal
                    })`,
                },
                {
                  value: 'refunded',
                  label: `${t('landlordDepositsStatusRefunded')} (${stats.refundedCountTotal})`,
                },
                {
                  value: 'deducted',
                  label: `${t('landlordDepositsStatusDeducted')} (${stats.deductedCountTotal})`,
                },
              ]}
            />
          </div>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {/* ─── DATA PRESENTATION (GRID VS TABLE) ──────────────────────────────── */}

      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <Text size="xs" color="secondary" weight="bold">
            {t('landlordDepositsLoadingData')}
          </Text>
        </div>
      ) : depositsList.length === 0 ? (
        <div className="p-12 text-center bg-card border border-line rounded-3xl space-y-3">
          <div className="w-12 h-12 bg-card-hover text-muted rounded-2xl flex items-center justify-center mx-auto">
            <PiggyBank className="w-6 h-6" />
          </div>
          <Text as="h3" size="base" weight="bold" color="default">
            {t('landlordDepositsNoDataTitle')}
          </Text>
          <Text size="xs" color="secondary" className="max-w-md mx-auto">
            {t('landlordDepositsNoDataDesc')}
          </Text>
          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateModal(true)
                setIsFormDirty(false)
                fetchAvailableRooms()
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordDepositsAddNew')}
              </Text>
            </Button>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default view, 6 items per page) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {depositsList.map(dep => {
            const isHoldType = dep.depositCategory === 'hold'
            const isHolding = dep.status === 'paid'

            return (
              <Card
                key={dep.id}
                onClick={() => setSelectedDeposit(dep)}
                className="flex flex-col justify-between space-y-4 group"
              >
                <Card.Header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2.5 border-0">
                  {/* Top Badge & Room */}
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="p-2 rounded-xl bg-card-hover text-foreground/90 font-black text-xs">
                        <Text as="span" size="xs" weight="black" color="inherit">
                          {t('landlordContractsRoomPrefix').replace(
                            '{room}',
                            String(dep.roomNumber),
                          )}
                        </Text>
                      </span>
                      <Chip
                        preventHover
                        size="sm"
                        variant={isHoldType ? 'warning' : 'success'}
                      >
                        {getDepositTypeLabel(isHoldType ? 'Cọc giữ chỗ' : 'Cọc hợp đồng')}
                      </Chip>
                    </div>

                    {renderStatusBadge(dep)}
                  </div>
                </Card.Header>

                <Card.Body className="px-4 sm:px-5 py-0 space-y-3">
                  {/* Tenant Details */}
                  <div className="p-3 bg-surface rounded-xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="medium">
                        {t('landlordDepositsTenant')}
                      </Text>
                      <Text as="span" size="xs" weight="bold" color="default">
                        {dep.tenantName}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="medium">
                        {t('landlordDepositsPhone')}
                      </Text>
                      <Text as="span" size="xs" weight="bold" color="default">
                        {dep.tenantPhone || t('landlordDepositsNoPhone')}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="medium">
                        {t('landlordDepositsDepositDate')}
                      </Text>
                      <Text as="span" size="xs" weight="semibold" color="secondary">
                        {dep.depositDate}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between">
                      <Text as="span" size="xs" color="secondary" weight="medium">
                        {isHoldType
                          ? t('landlordDepositsExpiryDate')
                          : t('landlordDepositsColExpiryDate')}
                      </Text>
                      <Text
                        as="span"
                        size="xs"
                        weight="bold"
                        className={isHoldType && isHolding ? 'text-warning' : 'text-muted'}
                      >
                        {dep.expiryDate || t('landlordDepositsNoExpiry')}
                      </Text>
                    </div>
                  </div>
                </Card.Body>

                {/* Amount & Action Footer */}
                <Card.Footer className="px-4 sm:px-5 pt-3 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <Text as="span" size="xs" weight="bold" color="secondary" className="block uppercase tracking-wider">
                        {t('landlordDepositsColAmount')}
                      </Text>
                      <Text as="span" size="base" weight="black" className="text-primary">
                        {dep.amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                      </Text>
                    </div>

                    {isHoldType && isHolding && (
                      <Chip preventHover size="xs" variant="warning">
                        {t('landlordDepositsHoldingDeposit')}
                      </Chip>
                    )}
                  </div>

                  {((isHoldType && isHolding) || isHolding) && (
                    <div className="flex items-center justify-end gap-2">
                      {isHoldType && isHolding && (
                        <Button
                          variant="orange"
                          size="sm"
                          onClick={() => {
                            setShowUpgradeModal(dep)
                            setUpgradeForm({
                              targetContractAmount: '',
                              additionalAmount: 0,
                              note: '',
                            })
                            setIsFormDirty(false)
                          }}
                          title={t('landlordDepositsTooltipUpgrade')}
                          leftIcon={<FilePenLine />}
                        >
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {t('landlordDepositsBtnUpgradeShort')}
                          </Text>
                        </Button>
                      )}

                      {isHolding && (
                        <Button
                          size="sm"
                          onClick={() => {
                            setShowRefundModal(dep)
                            setRefundForm({ deductedAmount: '0', deductionReason: '', note: '' })
                            setIsFormDirty(false)
                          }}
                          title={t('landlordDepositsTooltipRefundDeduct')}
                          leftIcon={<RotateCcw />}
                        >
                          <Text as="span" size="xs" weight="bold" color="inherit">
                            {t('landlordDepositsBtnRefundShort')}
                          </Text>
                        </Button>
                      )}
                    </div>
                  )}
                </Card.Footer>
              </Card>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9: Standard 10 items per page) */
        <div className="bg-card border border-line rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-line bg-surface/50 text-muted uppercase tracking-wider font-extrabold text-[10px]">
                  <th className="py-3.5 px-4">{t('landlordDepositsColId')}</th>
                  <th className="py-3.5 px-4">{t('landlordDepositsColRoom')}</th>
                  <th className="py-3.5 px-4">{t('landlordDepositsColTenant')}</th>
                  <th className="py-3.5 px-4">{t('landlordDepositsColType')}</th>
                  <th className="py-3.5 px-4 text-right">{t('landlordDepositsColAmount')}</th>
                  <th className="py-3.5 px-4">{t('landlordDepositsColDate')}</th>
                  <th className="py-3.5 px-4">{t('landlordDepositsColExpiryDate')}</th>
                  <th className="py-3.5 px-4 text-center">{t('landlordDepositsColStatus')}</th>
                  <th className="py-3.5 px-4 text-right">{t('landlordDepositsColAction')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {depositsList.map(dep => {
                  const isHoldType = dep.depositCategory === 'hold'
                  const isHolding = dep.status === 'paid'

                  return (
                    <TableRow
                      key={dep.id}
                      className="group"
                      onClick={() => setSelectedDeposit(dep)}
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Text as="span" size="xs" weight="bold" color="subtle" mono>
                          {dep.id.slice(0, 8)}...
                        </Text>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Text as="span" size="xs" weight="black" color="default">
                          {t('landlordContractsRoomPrefix').replace('{room}', String(dep.roomNumber))}
                        </Text>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Text as="div" size="xs" weight="bold" color="default">
                          {dep.tenantName}
                        </Text>
                        <Text as="div" size="xs" color="secondary">
                          {dep.tenantPhone || t('landlordDepositsNoPhoneShort')}
                        </Text>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Chip
                          size="sm"
                          preventHover
                          variant={isHoldType ? 'warning' : 'success'}
                        >
                          {getDepositTypeLabel(isHoldType ? 'Cọc giữ chỗ' : 'Cọc hợp đồng')}
                        </Chip>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <Text as="span" size="sm" weight="black" color="brand">
                          {dep.amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                        </Text>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Text as="span" size="xs" color="secondary" weight="semibold">
                          {dep.depositDate}
                        </Text>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <Text
                          as="span"
                          size="xs"
                          weight={isHoldType && isHolding ? 'bold' : 'normal'}
                          color={isHoldType && isHolding ? 'warning' : 'secondary'}
                        >
                          {dep.expiryDate || '—'}
                        </Text>
                      </td>
                      <td className="py-3.5 px-4 text-center">{renderStatusBadge(dep)}</td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isHoldType && isHolding && (
                            <Button
                              variant="accent"
                              size="icon-sm"
                              onClick={event => {
                                event.stopPropagation()
                                setShowUpgradeModal(dep)
                                setUpgradeForm({
                                  targetContractAmount: '',
                                  additionalAmount: 0,
                                  note: '',
                                })
                                setIsFormDirty(false)
                              }}
                              title={t('landlordDepositsBtnUpgrade')}
                            >
                              <FilePenLine />
                            </Button>
                          )}

                          {isHolding && (
                            <Button
                              variant="primary"
                              size="icon-sm"
                              onClick={event => {
                                event.stopPropagation()
                                setShowRefundModal(dep)
                                setRefundForm({
                                  deductedAmount: '0',
                                  deductionReason: '',
                                  note: '',
                                })
                                setIsFormDirty(false)
                              }}
                              title={t('landlordDepositsBtnRefundDeduct')}
                            >
                              <RotateCcw />
                            </Button>
                          )}
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

      {/* Rule #9 Standardized Pagination Control */}
      {totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeMax={100}
          unitLabel={t('landlordDepositsItems')}
        />
      )}

      {/* ─── MODALS ──────────────────────────────────────────────────────────── */}

      {/* 1. DEPOSIT DETAILS MODAL */}
      <Modal
        isOpen={Boolean(selectedDeposit)}
        onClose={() => setSelectedDeposit(null)}
        size="lg"
      >
        {selectedDeposit && (
          <>
            <Modal.Header
              title={t('landlordDepositsDetailModalTitle')}
              description={selectedDeposit.id}
              icon={
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
                  <PiggyBank className="w-5 h-5" />
                </div>
              }
            />

            <Modal.Body className="space-y-4">
              <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsRoom')}
                  </Text>
                  <Text as="span" size="sm" weight="black" color="default">
                    {t('landlordContractsRoomPrefix').replace(
                      '{room}',
                      String(selectedDeposit.roomNumber),
                    )}
                  </Text>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsBuilding')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.boardingHouseName}
                  </Text>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsDepositTypeLabel')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.depositCategory === 'hold'
                      ? t('landlordDepositsHoldingDepositDetail')
                      : t('landlordDepositsContractDepositDetail')}
                  </Text>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsColStatus')}
                  </Text>
                  {renderStatusBadge(selectedDeposit)}
                </div>
              </div>

              <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsTenant')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.tenantName}
                  </Text>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsPhone')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.tenantPhone || '—'}
                  </Text>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsDepositDate')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.depositDate}
                  </Text>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsColExpiryDate')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.expiryDate || '—'}
                  </Text>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="p-4 bg-primary/10 border border-primary/30 rounded-2xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {t('landlordDepositsOriginalDepositAmount')}
                  </Text>
                  <Text as="span" size="xs" weight="bold" color="default">
                    {selectedDeposit.originalAmount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                  </Text>
                </div>

                {selectedDeposit.deductedAmount !== null && selectedDeposit.deductedAmount !== undefined && (
                  <div className="flex justify-between items-center text-xs text-danger">
                    <Text as="span" size="xs" weight="semibold" className="text-danger">
                      {t('landlordDepositsDeductedAmount')}
                    </Text>
                    <Text as="span" size="xs" weight="bold" className="text-danger">
                      -{selectedDeposit.deductedAmount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                    </Text>
                  </div>
                )}

                {selectedDeposit.refundAmount !== null && selectedDeposit.refundAmount !== undefined && (
                  <div className="flex justify-between items-center text-xs text-deposit">
                    <Text as="span" size="xs" weight="semibold" className="text-deposit">
                      {t('landlordDepositsRefundedAmount')}
                    </Text>
                    <Text as="span" size="xs" weight="bold" className="text-deposit">
                      {selectedDeposit.refundAmount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                    </Text>
                  </div>
                )}

                <div className="pt-2 border-t border-primary/20 flex justify-between items-center text-xs">
                  <Text as="span" size="xs" weight="black" className="text-[#0d6e6b]">
                    {t('landlordDepositsCurrentlyHeld')}
                  </Text>
                  <Text as="span" size="base" weight="black" className="text-primary">
                    {selectedDeposit.amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                  </Text>
                </div>
              </div>

              {/* Notes */}
              {selectedDeposit.note && (
                <div className="p-3.5 bg-surface border border-line rounded-xl space-y-1">
                  <Text as="span" size="xs" weight="black" color="secondary" className="uppercase tracking-wider block">
                    {t('landlordDepositsNotesLabel')}
                  </Text>
                  <Text size="xs" color="default" weight="medium" className="leading-relaxed">
                    {selectedDeposit.note}
                  </Text>
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <div className="flex items-center justify-between w-full gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    router.push(
                      `/landlord/messages?room=${encodeURIComponent(selectedDeposit.roomId)}&tenant=${encodeURIComponent(selectedDeposit.tenantName)}`,
                    )
                  }}
                  leftIcon={<Send className="w-3.5 h-3.5 text-primary" />}
                >
                  <Text as="span" size="xs" weight="bold" color="inherit">
                    {t('landlordDepositsChatWithTenant')}
                  </Text>
                </Button>

                <div className="flex items-center gap-2">
                  {selectedDeposit.depositCategory === 'hold' &&
                    selectedDeposit.status === 'paid' && (
                      <Button
                        variant="orange"
                        size="sm"
                        onClick={() => {
                          setShowUpgradeModal(selectedDeposit)
                          setUpgradeForm({
                            targetContractAmount: '',
                            additionalAmount: 0,
                            note: '',
                          })
                          setSelectedDeposit(null)
                          setIsFormDirty(false)
                        }}
                        leftIcon={<Sparkles />}
                      >
                        <Text as="span" size="xs" weight="bold" color="inherit">
                          {t('landlordDepositsBtnUpgrade')}
                        </Text>
                      </Button>
                    )}

                  {selectedDeposit.status === 'paid' && (
                    <Button
                      variant="dark"
                      size="sm"
                      onClick={() => {
                        setShowRefundModal(selectedDeposit)
                        setRefundForm({ deductedAmount: '0', deductionReason: '', note: '' })
                        setSelectedDeposit(null)
                        setIsFormDirty(false)
                      }}
                      leftIcon={<RotateCcw />}
                    >
                      <Text as="span" size="xs" weight="bold" color="inherit">
                        {t('landlordDepositsBtnRefundDeduct')}
                      </Text>
                    </Button>
                  )}
                </div>
              </div>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* 2. CREATE NEW MANUAL DEPOSIT MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => requestCloseModal('create')}
        size="xl"
      >
        <Modal.Header
          title={t('landlordDepositsCreateModalTitle')}
          description={t('landlordDepositsCreateModalSub')}
          icon={
            <div className="p-2.5 bg-primary/10 text-primary rounded-2xl">
              <Plus className="w-5 h-5" />
            </div>
          }
        />

        <Modal.Body className="space-y-4">
          {/* Room Selection Dropdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              {isLoadingRooms ? (
                <div className="space-y-1">
                  <Text as="label" size="xs" weight="black" color="default">
                    {t('landlordDepositsRoomSelectLabel')}
                  </Text>
                  <div className="flex items-center gap-2 py-2 text-muted">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />{' '}
                    <Text as="span" size="xs" color="secondary">
                      {t('landlordDepositsLoadingRooms')}
                    </Text>
                  </div>
                </div>
              ) : (
                <SelectInput
                  label={t('landlordDepositsRoomSelectLabel')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  value={newDepositForm.roomId}
                  onChange={e => {
                    setNewDepositForm({ ...newDepositForm, roomId: e.target.value })
                    setIsFormDirty(true)
                  }}
                  options={[
                    { value: '', label: t('landlordInvoicesSelectRoomPlaceholder') },
                    ...availableRooms.map(room => {
                      const isAvail = room.status === 'available'
                      return {
                        value: room.id,
                        disabled: !isAvail,
                        label: `${t('landlordContractsRoomPrefix').replace(
                          '{room}',
                          String(room.roomNumber),
                        )} - ${room.roomType?.name || t('landlordDepositsRoom')} (${isAvail
                          ? t('landlordDepositsRoomStatusAvailable')
                          : room.status === 'deposited'
                            ? t('landlordDepositsRoomStatusDeposited')
                            : t('landlordDepositsRoomStatusRented')
                          })`,
                      }
                    }),
                  ]}
                />
              )}
            </div>

            <div>
              <SelectInput
                label={t('landlordDepositsDepositTypeLabel')}
                labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                value={newDepositForm.depositType}
                onChange={e => {
                  setNewDepositForm({ ...newDepositForm, depositType: e.target.value as any })
                  setIsFormDirty(true)
                }}
                options={[
                  { value: 'Cọc giữ chỗ', label: t('landlordDepositsOptionHoldingDesc') },
                  { value: 'Cọc hợp đồng', label: t('landlordDepositsOptionContractDesc') },
                ]}
              />
            </div>
          </div>

          {/* Prospective Tenant Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <TextInput
              label={t('landlordDepositsTenantNameLabel')}
              labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
              value={newDepositForm.tenantName}
              onChange={e => {
                setNewDepositForm({ ...newDepositForm, tenantName: e.target.value })
                setIsFormDirty(true)
              }}
              placeholder={t('landlordDepositsTenantNameExample')}
            />

            <TextInput
              type="tel"
              label={t('landlordDepositsTenantPhoneLabel')}
              labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
              value={newDepositForm.tenantPhone}
              onChange={e => {
                setNewDepositForm({ ...newDepositForm, tenantPhone: e.target.value })
                setIsFormDirty(true)
              }}
              placeholder="0988xxxxxx"
            />
          </div>

          {/* Amount & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput
              label={t('landlordDepositsDepositAmountVND')}
              labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
              min={10000}
              step={50000}
              value={newDepositForm.amount}
              onChange={e => {
                setNewDepositForm({ ...newDepositForm, amount: e.target.value })
                setIsFormDirty(true)
              }}
              placeholder={t('landlordDepositsAmountPlaceholder')}
            />

            <TextInput
              type="date"
              label={t('landlordDepositsHoldingDeadline')}
              labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
              value={newDepositForm.expiryDate}
              onChange={e => {
                setNewDepositForm({ ...newDepositForm, expiryDate: e.target.value })
                setIsFormDirty(true)
              }}
            />
          </div>

          {/* Notes */}
          <TextareaInput
            label={t('landlordDepositsInitialNotes')}
            labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
            rows={3}
            value={newDepositForm.note}
            onChange={e => {
              setNewDepositForm({ ...newDepositForm, note: e.target.value })
              setIsFormDirty(true)
            }}
            placeholder={t('landlordDepositsInitialNotesPlaceholder')}
          />
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => requestCloseModal('create')}
            disabled={isSubmitting}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordDepositsCancelBtn')}
            </Text>
          </Button>
          <Button
            variant="dark"
            size="sm"
            onClick={handleCreateDeposit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
          >
            <Text as="span" size="xs" weight="bold" color="inherit">
              {t('landlordDepositsSaveDepositAction')}
            </Text>
          </Button>
        </Modal.Footer>
      </Modal>

      {/* 3. UNIFIED REFUND & DEDUCTION DEPOSIT MODAL */}
      <Modal
        isOpen={Boolean(showRefundModal)}
        onClose={() => requestCloseModal('refund')}
        size="lg"
      >
        {showRefundModal && (
          <>
            <Modal.Header
              title={t('landlordDepositsRefundModalTitle')}
              description={`${t('landlordContractsRoomPrefix').replace(
                '{room}',
                String(showRefundModal.roomNumber),
              )} • ${showRefundModal.tenantName}`}
              icon={
                <div className="p-2.5 bg-deposit/10 text-deposit rounded-2xl shadow-xs">
                  <RotateCcw className="w-5 h-5" />
                </div>
              }
            />

            <Modal.Body className="space-y-4">
              {/* Held Amount Banner */}
              <div className="p-4 bg-gradient-to-r from-purple-500/10 via-zinc-50 to-purple-500/10 border border-deposit-subtle rounded-2xl flex items-center justify-between gap-2 text-xs">
                <Text as="span" size="xs" weight="semibold" color="secondary" className="truncate">
                  {t('landlordDepositsCurrentHeldAmount')}
                </Text>
                <Text as="span" size="base" weight="black" className="text-deposit whitespace-nowrap">
                  {showRefundModal.amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                </Text>
              </div>

              {/* Deduction Amount Input */}
              <div className="space-y-2">
                <NumberInput
                  label={t('landlordDepositsDeductAmountLabel')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  min={0}
                  max={showRefundModal.amount}
                  value={refundForm.deductedAmount}
                  onChange={e => {
                    setRefundForm({ ...refundForm, deductedAmount: e.target.value })
                    setIsFormDirty(true)
                  }}
                  placeholder="0"
                />

                {/* Quick Presets */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <Button
                    type="button"
                    variant={refundForm.deductedAmount === '0' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setRefundForm({ ...refundForm, deductedAmount: '0' })
                      setIsFormDirty(true)
                    }}
                    className={cn(
                      'py-2 px-1 text-center font-black flex flex-col items-center justify-center leading-tight h-auto',
                      refundForm.deductedAmount === '0' ? 'bg-deposit hover:bg-purple-700 text-white' : '',
                    )}
                  >
                    <Text as="span" size="xs" weight="bold" color="inherit" className="whitespace-nowrap">
                      {t('landlordDepositsRefund100')}
                    </Text>
                    <Text as="span" size="xs" color="inherit" className="opacity-80 whitespace-nowrap">
                      (0 ₫)
                    </Text>
                  </Button>

                  <Button
                    type="button"
                    variant={Number(refundForm.deductedAmount) === Math.round(showRefundModal.amount / 2) ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      const half = Math.round(showRefundModal.amount / 2)
                      setRefundForm({ ...refundForm, deductedAmount: String(half) })
                      setIsFormDirty(true)
                    }}
                    className={cn(
                      'py-2 px-1 text-center font-black flex flex-col items-center justify-center leading-tight h-auto',
                      Number(refundForm.deductedAmount) === Math.round(showRefundModal.amount / 2) ? 'bg-danger hover:bg-danger text-white' : '',
                    )}
                  >
                    <Text as="span" size="xs" weight="bold" color="inherit" className="whitespace-nowrap">
                      {t('landlordDepositsDeduct50')}
                    </Text>
                    <Text as="span" size="xs" color="inherit" className="opacity-80 whitespace-nowrap">
                      ({Math.round(showRefundModal.amount / 2).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫)
                    </Text>
                  </Button>

                  <Button
                    type="button"
                    variant={Number(refundForm.deductedAmount) === showRefundModal.amount ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => {
                      setRefundForm({
                        ...refundForm,
                        deductedAmount: String(showRefundModal.amount),
                      })
                      setIsFormDirty(true)
                    }}
                    className={cn(
                      'py-2 px-1 text-center font-black flex flex-col items-center justify-center leading-tight h-auto',
                      Number(refundForm.deductedAmount) === showRefundModal.amount ? 'bg-danger hover:bg-rose-700 text-white' : '',
                    )}
                  >
                    <Text as="span" size="xs" weight="bold" color="inherit" className="whitespace-nowrap">
                      {t('landlordDepositsDeduct100')}
                    </Text>
                    <Text as="span" size="xs" color="inherit" className="opacity-80 whitespace-nowrap">
                      {t('landlordDepositsForfeitDeposit')}
                    </Text>
                  </Button>
                </div>
              </div>

              {/* Deduction Reason */}
              <TextInput
                label={t('landlordDepositsDeductionReason')}
                labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                value={refundForm.deductionReason}
                onChange={e => {
                  setRefundForm({ ...refundForm, deductionReason: e.target.value })
                  setIsFormDirty(true)
                }}
                placeholder={t('landlordDepositsDeductionReasonPlaceholder')}
              />

              {/* Note */}
              <TextareaInput
                label={t('landlordDepositsAdditionalNotes')}
                labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                rows={2}
                value={refundForm.note}
                onChange={e => {
                  setRefundForm({ ...refundForm, note: e.target.value })
                  setIsFormDirty(true)
                }}
                placeholder={t('landlordDepositsAdditionalNotesPlaceholder')}
              />
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => requestCloseModal('refund')}
                disabled={isSubmitting}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordDepositsCancelBtn')}
                </Text>
              </Button>
              <Button
                variant="dark"
                size="sm"
                onClick={handleRefundDeposit}
                disabled={isSubmitting}
                isLoading={isSubmitting}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordDepositsConfirmRefundAction')}
                </Text>
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* 4. UPGRADE HOLD DEPOSIT MODAL (Convert to Contract) */}
      <Modal
        isOpen={Boolean(showUpgradeModal)}
        onClose={() => requestCloseModal('upgrade')}
        size="xl"
      >
        {showUpgradeModal && (
          <>
            <Modal.Header
              title={t('landlordDepositsUpgradeModalTitle')}
              description={`${t('landlordContractsRoomPrefix').replace(
                '{room}',
                String(showUpgradeModal.roomNumber),
              )} • ${showUpgradeModal.tenantName}`}
              icon={
                <div className="p-2.5 bg-amber-500/10 text-warning rounded-2xl">
                  <Sparkles className="w-5 h-5" />
                </div>
              }
            />

            <Modal.Body className="space-y-4">
              <div className="p-3 bg-gradient-to-r from-amber-500/10 via-teal-500/10 to-emerald-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                <Text size="xs" color="default" weight="medium" className="leading-relaxed">
                  <strong className="text-foreground font-black">
                    {t('landlordDepositsSmartFeature')}
                  </strong>{' '}
                  {t('landlordDepositsSmartFeatureDesc')}
                </Text>
              </div>

              <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-muted text-xs">
                  <Text as="span" size="xs" color="secondary" weight="medium">
                    {t('landlordDepositsCollectedHoldingDeposit')}
                  </Text>
                  <Text as="span" size="xs" weight="black" color="default" className="whitespace-nowrap">
                    {showUpgradeModal.amount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                  </Text>
                </div>

                <NumberInput
                  label={t('landlordDepositsTargetContractDeposit')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  value={upgradeForm.targetContractAmount}
                  onChange={e => {
                    setUpgradeForm({ ...upgradeForm, targetContractAmount: e.target.value })
                    setIsFormDirty(true)
                  }}
                  placeholder={t('landlordDepositsTargetAmountPlaceholder')}
                />

                <div className="p-3.5 bg-amber-500/10 border border-amber-300/80 rounded-xl flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <Text as="span" size="xs" weight="black" className="uppercase text-warning tracking-wider block truncate">
                      {t('landlordDepositsAdditionalAmountNeeded')}
                    </Text>
                    <Text as="span" size="lg" weight="black" className="text-warning leading-none mt-1 block whitespace-nowrap sm:text-xl">
                      +{upgradeForm.additionalAmount.toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫
                    </Text>
                  </div>
                  <ArrowRight className="w-5 h-5 text-warning shrink-0" />
                </div>
              </div>
            </Modal.Body>

            <Modal.Footer>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => requestCloseModal('upgrade')}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordDepositsCancelBtn')}
                </Text>
              </Button>
              <Button
                variant="orange"
                size="sm"
                onClick={handleConfirmUpgradeToContract}
                leftIcon={<FileText />}
              >
                <Text as="span" size="xs" weight="bold" color="inherit">
                  {t('landlordDepositsSignContractAndTransfer')}
                </Text>
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* 5. RULE #10 UNSAVED POP-UP CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(confirmCloseTarget)}
        onClose={() => setConfirmCloseTarget(null)}
        size="sm"
        zIndex={60}
        showCloseButton={false}
      >
        <Modal.Body className="p-6 text-center space-y-4">
          <div className="w-12 h-12 bg-warning-soft text-warning rounded-2xl flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <Text as="h4" size="base" weight="black" color="default">
              {t('landlordDepositsConfirmCloseTitle')}
            </Text>
            <Text size="xs" color="secondary" className="leading-relaxed">
              {t('landlordDepositsConfirmCloseDesc')}
            </Text>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmCloseTarget(null)}
              className="flex-1"
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordDepositsConfirmCloseKeep')}
              </Text>
            </Button>
            <Button
              variant="danger"
              onClick={handleConfirmCloseModal}
              className="flex-1"
            >
              <Text as="span" size="xs" weight="bold" color="inherit">
                {t('landlordDepositsConfirmCloseDiscard')}
              </Text>
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  )
}

export default function LandlordDepositsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
        </div>
      }
    >
      <DepositsContent />
    </Suspense>
  )
}
