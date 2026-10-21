'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { LandlordPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
import {
  Plus,
  Receipt,
  Wallet,
  Check,
  X,
  AlertTriangle,
  Trash2,
  Edit3,
  Clock,
  Lock,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  ChipGroup,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import {
  expenseService,
  ExpenseItem,
  ExpensesSummary,
  CreateExpensePayload,
} from '@/services/expense.service'
import { getRooms, RoomItem } from '@/services/room.service'

export default function ExpensesPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { toast } = useToast()

  const [isMounted, setIsMounted] = useState(false)
  const [expensesList, setExpensesList] = useState<ExpenseItem[]>([])
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [summary, setSummary] = useState<ExpensesSummary>({
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
    canceledAmount: 0,
    totalCount: 0,
    paidCount: 0,
    pendingCount: 0,
  })

  // Rule #9: Default Grid view (Grid=6, Table=10)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [pageSize, setPageSize] = useState<number>(6)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalRecords, setTotalRecords] = useState<number>(0)

  // Filters
  const [activeCategoryTab, setActiveCategoryTab] = useState<string>('all')
  const [activeStatusTab, setActiveStatusTab] = useState<
    'all' | 'paid' | 'pending' | 'canceled'
  >('all')
  const [searchTerm, setSearchTerm] = useState<string>('')

  // Loading states
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  // Modals state
  const [selectedExpense, setSelectedExpense] = useState<ExpenseItem | null>(null)
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false)
  const [editingExpense, setEditingExpense] = useState<ExpenseItem | null>(null)
  const [deletingExpenseTarget, setDeletingExpenseTarget] = useState<ExpenseItem | null>(null)
  const [lockedExpenseTarget, setLockedExpenseTarget] = useState<ExpenseItem | null>(null)

  // Form State for Create / Edit
  const [expenseForm, setExpenseForm] = useState({
    name: '',
    category: 'Bảo trì & Sửa chữa',
    amount: '',
    roomScope: 'property' as 'property' | 'room',
    roomId: '',
    status: 'paid' as 'paid' | 'pending',
    paidAt: new Date().toISOString().split('T')[0],
    description: '',
  })

  // Rule #10: Form Dirty State & Confirmation Modal
  const [isFormDirty, setIsFormDirty] = useState<boolean>(false)
  const [confirmCloseTarget, setConfirmCloseTarget] = useState<'create' | 'edit' | null>(null)

  // Large Money Formatter Helper
  const formatLargeMoney = (amount: number): string => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} ${t('landlordExpensesUnitBillion')}`
    }
    if (amount >= 1_000_000) {
      return `${(amount / 1_000_000).toFixed(2).replace(/\.00$/, '')} ${t('landlordExpensesUnitMillion')}`
    }
    return `${amount.toLocaleString('vi-VN')} ₫`
  }

  const formatCurrency = (amt: number) => {
    return `${amt.toLocaleString('vi-VN')} ₫`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  const getCategoryLabel = (cat: string) => {
    switch (cat) {
      case 'Bảo trì & Sửa chữa':
        return t('landlordExpensesCatMaintenance')
      case 'Điện nước & Dịch vụ':
        return t('landlordExpensesCatUtilities')
      case 'Vệ sinh & An ninh':
        return t('landlordExpensesCatCleaning')
      case 'Trang thiết bị':
        return t('landlordExpensesCatEquipment')
      case 'Chi phí khác':
        return t('landlordExpensesCatOther')
      default:
        return cat
    }
  }

  const getScopeLabel = (exp: ExpenseItem) => {
    if (!exp.roomId || exp.roomName === 'Toàn tòa nhà') {
      return t('landlordExpensesPropertyWide')
    }
    return exp.roomName
  }

  useEffect(() => {
    setIsMounted(true)
  }, [])

  // Update pageSize on viewMode change per Rule #9
  useEffect(() => {
    const defaultSize = viewMode === 'grid' ? 6 : 10
    setPageSize(defaultSize)
    setCurrentPage(1)
  }, [viewMode])

  // Load Rooms list for dropdown
  useEffect(() => {
    if (!activeBuilding?.id) return
    getRooms(activeBuilding.id, { limit: 100 })
      .then(res => {
        if (res && res.data) {
          setAvailableRooms(res.data)
        }
      })
      .catch(err => console.error('Failed to load rooms:', err))
  }, [activeBuilding?.id])

  // Fetch Expenses List & Summary
  const fetchExpenses = useCallback(async () => {
    if (!activeBuilding?.id) return
    try {
      setIsLoading(true)
      const res = await expenseService.getExpenses(activeBuilding.id, {
        search: searchTerm,
        category: activeCategoryTab === 'all' ? undefined : activeCategoryTab,
        status: activeStatusTab === 'all' ? undefined : activeStatusTab,
        page: currentPage,
        limit: pageSize,
      })

      if (res && res.success) {
        setExpensesList(res.data || [])
        setSummary(res.summary)
        setTotalRecords(res.meta.total || 0)
      }
    } catch (err) {
      console.error('Failed to fetch expenses:', err)
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, searchTerm, activeCategoryTab, activeStatusTab, currentPage, pageSize])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  // Categories list
  const categoriesList = [
    'all',
    'Bảo trì & Sửa chữa',
    'Điện nước & Dịch vụ',
    'Vệ sinh & An ninh',
    'Trang thiết bị',
    'Chi phí khác',
  ]

  const resetForm = () => {
    setExpenseForm({
      name: '',
      category: 'Bảo trì & Sửa chữa',
      amount: '',
      roomScope: 'property',
      roomId: '',
      status: 'paid',
      paidAt: new Date().toISOString().split('T')[0],
      description: '',
    })
    setIsFormDirty(false)
  }

  // Rule #10 Request Close Modal Handler
  const requestCloseModal = (target: 'create' | 'edit') => {
    if (isFormDirty) {
      setConfirmCloseTarget(target)
    } else {
      if (target === 'create') setShowCreateModal(false)
      if (target === 'edit') setEditingExpense(null)
      resetForm()
    }
  }

  const handleConfirmCloseModal = () => {
    if (confirmCloseTarget === 'create') setShowCreateModal(false)
    if (confirmCloseTarget === 'edit') setEditingExpense(null)
    setConfirmCloseTarget(null)
    resetForm()
  }

  // Open Edit Modal
  const openEditModal = (expense: ExpenseItem) => {
    if (expense.status === 'paid') {
      setLockedExpenseTarget(expense)
      return
    }
    setEditingExpense(expense)
    setExpenseForm({
      name: expense.name,
      category: expense.category,
      amount: String(expense.amount),
      roomScope: expense.roomId ? 'room' : 'property',
      roomId: expense.roomId || '',
      status: expense.status === 'canceled' ? 'pending' : expense.status,
      paidAt: expense.paidAt
        ? expense.paidAt.split('T')[0]
        : new Date().toISOString().split('T')[0],
      description: expense.description || '',
    })
    setIsFormDirty(false)
  }

  // Create Expense Submission
  const handleCreateExpense = async () => {
    if (!activeBuilding?.id) return
    if (!expenseForm.name.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.warning(t('landlordExpensesAlertValidation'))
      return
    }

    try {
      setIsSubmitting(true)
      const payload: CreateExpensePayload = {
        name: expenseForm.name.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        paidAt: new Date(expenseForm.paidAt).toISOString(),
        status: expenseForm.status,
        roomId: expenseForm.roomScope === 'room' ? expenseForm.roomId || null : null,
        description: expenseForm.description.trim() || undefined,
      }

      await expenseService.createExpense(activeBuilding.id, payload)
      toast.success(t('landlordExpensesSaveExpense'))
      setShowCreateModal(false)
      resetForm()
      await fetchExpenses()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t('landlordExpensesAlertCreateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Edit Expense Submission
  const handleUpdateExpense = async () => {
    if (!activeBuilding?.id || !editingExpense) return
    if (!expenseForm.name.trim() || !expenseForm.amount || Number(expenseForm.amount) <= 0) {
      toast.warning(t('landlordExpensesAlertValidation'))
      return
    }

    try {
      setIsSubmitting(true)
      const payload = {
        name: expenseForm.name.trim(),
        category: expenseForm.category,
        amount: Number(expenseForm.amount),
        paidAt: new Date(expenseForm.paidAt).toISOString(),
        status: expenseForm.status,
        roomId: expenseForm.roomScope === 'room' ? expenseForm.roomId || null : null,
        description: expenseForm.description.trim() || undefined,
      }

      await expenseService.updateExpense(activeBuilding.id, editingExpense.id, payload)
      toast.success(t('landlordExpensesUpdateExpense'))
      setEditingExpense(null)
      resetForm()
      await fetchExpenses()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t('landlordExpensesAlertUpdateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mark as Paid
  const handleMarkAsPaid = async (id: string) => {
    if (!activeBuilding?.id) return
    try {
      await expenseService.updateExpense(activeBuilding.id, id, {
        status: 'paid',
        paidAt: new Date().toISOString(),
      })
      toast.success(t('landlordExpensesStatusPaid'))
      if (selectedExpense?.id === id) {
        setSelectedExpense(prev => (prev ? { ...prev, status: 'paid' } : null))
      }
      await fetchExpenses()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t('landlordExpensesAlertPaymentFailed'))
    }
  }

  // Delete Expense
  const handleDeleteExpense = (expense: ExpenseItem) => {
    if (expense.status === 'paid') {
      setLockedExpenseTarget(expense)
      return
    }
    setDeletingExpenseTarget(expense)
  }

  const confirmDeleteExpense = async () => {
    if (!activeBuilding?.id || !deletingExpenseTarget) return
    try {
      await expenseService.deleteExpense(activeBuilding.id, deletingExpenseTarget.id)
      toast.success(t('landlordExpensesDeleteBtn'))
      if (selectedExpense?.id === deletingExpenseTarget.id) setSelectedExpense(null)
      setDeletingExpenseTarget(null)
      await fetchExpenses()
    } catch (err: unknown) {
      toast.error((err as Error)?.message || t('landlordExpensesAlertDeleteFailed'))
    }
  }

  // Export CSV
  const handleExportCSV = () => {
    if (expensesList.length === 0) {
      toast.warning(t('landlordExpensesAlertNoDataExport'))
      return
    }

    const headers = [
      t('landlordExpensesCsvCode'),
      t('landlordExpensesCsvTitle'),
      t('landlordExpensesCsvCategory'),
      t('landlordExpensesCsvScope'),
      t('landlordExpensesCsvAmount'),
      t('landlordExpensesCsvStatus'),
      t('landlordExpensesCsvPaidDate'),
      t('landlordExpensesCsvNotes'),
    ]

    const rows = expensesList.map(exp => [
      exp.code,
      exp.name,
      getCategoryLabel(exp.category),
      getScopeLabel(exp),
      exp.amount,
      exp.status === 'paid'
        ? t('landlordExpensesStatusPaid')
        : exp.status === 'pending'
          ? t('landlordExpensesStatusPending')
          : t('landlordExpensesStatusCanceled'),
      exp.paidAt ? exp.paidAt.split('T')[0] : '',
      exp.description || '',
    ])

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map(row => row.map(val => `"${val}"`).join(','))].join('\n')

    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute(
      'download',
      `Dormio_ChiPhi_${activeBuilding?.name || 'ToaNha'}_${new Date().toISOString().slice(0, 10)}.csv`,
    )
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Rule #9 Pagination Calculation with 5-page window jumping
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

  // Status Badge Helper
  const renderStatusBadge = (status: ExpenseItem['status']) => {
    if (status === 'paid') {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-primary/15 text-[#0d6e6b] border border-primary/30 flex items-center gap-1 shrink-0">
          <Check className="w-3 h-3" /> {t('landlordExpensesStatusPaid')}
        </span>
      )
    }
    if (status === 'pending') {
      return (
        <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-warning-soft text-warning border border-warning-subtle flex items-center gap-1 shrink-0">
          <Clock className="w-3 h-3 text-amber-500" /> {t('landlordExpensesStatusPending')}
        </span>
      )
    }
    return (
      <span className="px-2.5 py-0.5 text-[10px] font-black rounded-full bg-card-hover text-muted border border-line flex items-center gap-1 shrink-0">
        <X className="w-3 h-3" /> {t('landlordExpensesStatusCanceled')}
      </span>
    )
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordExpensesTotalExpenses'),
        value: formatLargeMoney(summary.totalAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[160px]',
        labelClassName: 'text-rose-400',
        valueClassName: 'text-rose-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'paid',
        label: t('landlordExpensesPaidExpenses'),
        value: formatLargeMoney(summary.paidAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[160px]',
        labelColor: 'brand',
        valueClassName: 'text-primary text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'pending',
        label: t('landlordExpensesPendingExpenses'),
        value: formatLargeMoney(summary.pendingAmount),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[160px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
    ],
    [t, summary],
  )

  if (!isMounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* ─── Top Header & Actions Bar ────────────────────────────────────────── */}
      <LandlordPageHeader
        title={t('landlordExpensesTitle')}
        subtitle={t('landlordExpensesSubtitle')}
        actions={
          <>
            <Button
              variant="success"
              size="md"
              onClick={handleExportCSV}
              leftIcon={<FileSpreadsheet />}
            >
              {t('landlordExpensesExportExcel')}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              leftIcon={<Plus className="shrink-0" />}
            >
              {t('landlordExpensesAddNew')}
            </Button>
          </>
        }
      />

      {/* ─── Dark Hero Summary Banner ────────────────────────────────────────── */}
      <LandlordStatBanner
        watermarkIcon={<Wallet className="w-64 h-64" />}
        chips={statChips}
      />

      {/* ─── Main Filter & Control Bar ───────────────────────────────────────── */}
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordExpensesSearchPlaceholder')}
            value={searchTerm}
            onChange={val => {
              setSearchTerm(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full space-y-0"
          />
        }
        filters={
          <div className="flex items-center gap-2 overflow-x-auto">
            <span className="text-muted text-[11px] font-extrabold uppercase mr-1 hidden sm:inline shrink-0">
              {t('landlordExpensesCategoryColon')}
            </span>
            <ChipGroup
              value={activeCategoryTab}
              onChange={val => {
                setActiveCategoryTab(val)
                setCurrentPage(1)
              }}
              scrollable
              options={categoriesList.map(cat => ({
                value: cat,
                label: cat === 'all' ? t('landlordExpensesAllCategories') : getCategoryLabel(cat),
                count: cat === 'all' ? summary.totalCount : undefined,
                variant: 'default' as const,
              }))}
            />
          </div>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
          />
        }
        subRow={
          <ChipGroup<'all' | 'paid' | 'pending' | 'canceled'>
            value={activeStatusTab}
            onChange={val => {
              setActiveStatusTab(val)
              setCurrentPage(1)
            }}
            scrollable
            options={[
              {
                value: 'all',
                label: t('landlordExpensesAllStatuses'),
                variant: 'neutral',
              },
              {
                value: 'paid',
                label: t('landlordExpensesStatusPaid'),
                variant: 'success',
              },
              {
                value: 'pending',
                label: t('landlordExpensesStatusPending'),
                variant: 'warning',
              },
              {
                value: 'canceled',
                label: t('landlordExpensesStatusCanceled'),
                variant: 'danger',
              },
            ]}
          />
        }
      />

      {/* ─── Main Content Display (Grid or Table View) ───────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-card rounded-2xl border border-line text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <p className="text-sm font-bold text-foreground/90">{t('landlordExpensesLoading')}</p>
        </div>
      ) : expensesList.length === 0 ? (
        <div className="p-12 text-center bg-card border border-line rounded-2xl space-y-3">
          <Wallet className="w-12 h-12 text-zinc-300 mx-auto stroke-1" />
          <h3 className="font-extrabold text-sm text-foreground">{t('landlordExpensesNotFound')}</h3>
          <p className="text-xs text-muted">{t('landlordExpensesNotFoundDesc')}</p>
          <Button variant="dark"
            size="sm"
            onClick={() => {
              resetForm()
              setShowCreateModal(true)
            }}
            leftIcon={<Plus />}
          >
            {t('landlordExpensesAddNew')}
          </Button>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expensesList.map(exp => (
            <div
              key={exp.id}
              className="bg-card border border-line hover:border-primary/40 rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              {/* Header Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2.5 border-b border-line">
                  <div className="flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-black text-xs text-foreground">{exp.code}</span>
                  </div>
                  {renderStatusBadge(exp.status)}
                </div>

                <div>
                  <span className="px-2 py-0.5 text-[10px] font-extrabold rounded-md bg-card-hover text-foreground/90 border border-line inline-block mb-1.5">
                    {getCategoryLabel(exp.category)}
                  </span>
                  <h4 className="font-black text-sm text-foreground leading-snug line-clamp-2">
                    {exp.name}
                  </h4>
                </div>

                {/* Amount Highlight */}
                <div className="p-3 bg-danger-soft border border-danger-subtle rounded-xl flex items-center justify-between">
                  <span className="text-[11px] font-extrabold text-danger uppercase">
                    {t('landlordExpensesExpenseAmount')}
                  </span>
                  <span className="text-base font-black text-danger whitespace-nowrap">
                    -{formatCurrency(exp.amount)}
                  </span>
                </div>

                {/* Scope & Date Meta */}
                <div className="space-y-1.5 text-xs text-muted font-medium">
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t('landlordExpensesScopeColon')}</span>
                    <span className="font-extrabold text-foreground">{getScopeLabel(exp)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted">{t('landlordExpensesDateColon')}</span>
                    <span className="font-semibold text-foreground/90">{formatDate(exp.paidAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedExpense(exp)}
                  className="flex-1"
                >
                  {t('landlordExpensesViewDetail')}
                </Button>

                {exp.status === 'pending' && (
                  <Button variant="dark"
                    size="sm"
                    onClick={() => handleMarkAsPaid(exp.id)}
                    className="whitespace-nowrap"
                    title={t('landlordExpensesMarkPaid')}
                  >
                    {t('landlordExpensesMarkPaid')}
                  </Button>
                )}

                <div className="flex items-center gap-1">
                  {exp.status === 'paid' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(exp)}
                      title={t('landlordExpensesLockedTooltip')}
                    >
                      <Lock className="w-4 h-4 text-amber-500" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(exp)}
                      title={t('landlordExpensesEditTooltip')}
                    >
                      <Edit3 className="w-4 h-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteExpense(exp)}
                    title={t('landlordExpensesDeleteTooltip')}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-card border border-line rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs min-w-[720px]">
              <thead>
                <tr className="bg-surface border-b border-line text-muted font-extrabold uppercase tracking-wider text-[10px] whitespace-nowrap">
                  <th className="py-3 px-3.5 sm:px-4 min-w-[130px]">{t('landlordExpensesCode')}</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[220px]">
                    {t('landlordExpensesNameAndCategory')}
                  </th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[120px]">
                    {t('landlordExpensesScope')}
                  </th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[110px]">{t('landlordExpensesDate')}</th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[130px]">
                    {t('landlordExpensesAmount')}
                  </th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[120px]">
                    {t('landlordExpensesStatus')}
                  </th>
                  <th className="py-3 px-3.5 sm:px-4 min-w-[110px] text-right">
                    {t('landlordExpensesActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-semibold text-foreground/90">
                {expensesList.map(exp => (
                  <tr key={exp.id} className="hover:bg-card-hover transition-colors duration-150 group">
                    <td className="py-3 px-3.5 sm:px-4 font-black text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span>{exp.code}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4">
                      <div className="min-w-[180px] max-w-[260px]">
                        <div className="font-extrabold text-foreground text-xs leading-snug line-clamp-2">
                          {exp.name}
                        </div>
                        <span className="text-[10px] text-muted font-medium block mt-0.5">
                          {getCategoryLabel(exp.category)}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-bold text-foreground whitespace-nowrap">
                      {getScopeLabel(exp)}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 text-muted whitespace-nowrap">
                      {formatDate(exp.paidAt)}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-black text-danger whitespace-nowrap">
                      -{formatCurrency(exp.amount)}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                      {renderStatusBadge(exp.status)}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setSelectedExpense(exp)}
                        >
                          {t('landlordExpensesDetailBtn')}
                        </Button>
                        {exp.status === 'paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(exp)}
                            title={t('landlordExpensesLockedTooltip')}
                          >
                            <Lock className="w-3.5 h-3.5 text-amber-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(exp)}
                            title={t('landlordExpensesEditTooltip')}
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                        {exp.status === 'paid' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(exp)}
                            title={t('landlordExpensesLockedDeleteTooltip')}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-zinc-300 hover:text-amber-500" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExpense(exp)}
                            title={t('landlordExpensesDeleteTooltip')}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── Rule #9 Pagination Bar ───────────────────────────────────────────── */}
      {expensesList.length > 0 && (
        <Pagination
          currentPage={currentPage}
          totalItems={totalRecords}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeMax={100}
          unitLabel={t('landlordExpensesPaginationItems')}
        />
      )}

      {/* ─── Modal 1: View Detail Lightbox ───────────────────────────────────── */}
      {selectedExpense && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedExpense(null)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-card border border-line rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-line flex items-center justify-between bg-primary/5 shrink-0">
              <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 pr-2">
                <div className="p-2 sm:p-2.5 bg-primary/10 text-primary rounded-2xl shadow-xs shrink-0">
                  <Receipt className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-black text-sm sm:text-base text-foreground truncate">
                    {t('landlordExpensesDetailTitle', { code: selectedExpense.code })}
                  </h3>
                  <p className="text-[11px] sm:text-xs text-muted font-semibold truncate">
                    {getCategoryLabel(selectedExpense.category)}
                  </p>
                </div>
              </div>

              <Button
                rounded="full"
                variant="ghost"
                size="icon-sm"
                onClick={() => setSelectedExpense(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 sm:space-y-5 custom-scrollbar text-xs">
              {/* Financial Highlight Box */}
              <div className="p-4 sm:p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0f5351] text-white rounded-2xl sm:rounded-3xl space-y-3 shadow-xl">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-muted whitespace-nowrap">
                    {t('landlordExpensesPaymentAmountLabel')}
                  </span>
                  <span className="text-xs text-zinc-300 font-semibold whitespace-nowrap">
                    {t('landlordExpensesPaymentDateLabel')}{' '}
                    <strong className="text-white font-black whitespace-nowrap">
                      {formatDate(selectedExpense.paidAt)}
                    </strong>
                  </span>
                </div>

                <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-primary tracking-tight whitespace-nowrap">
                  <span>-{formatCurrency(selectedExpense.amount)}</span>
                </div>

                <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-center justify-between gap-2">
                  <span className="shrink-0">{t('landlordExpensesNameColon')}</span>
                  <strong className="text-white font-black text-right line-clamp-1">
                    {selectedExpense.name}
                  </strong>
                </div>
              </div>

              {/* Expense Details Breakdown Card */}
              <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
                <div className="flex justify-between items-center text-muted gap-2">
                  <span className="font-semibold text-muted shrink-0">
                    {t('landlordExpensesScopeColon')}
                  </span>
                  <span className="font-black text-foreground truncate">
                    {getScopeLabel(selectedExpense)}
                  </span>
                </div>

                <div className="flex justify-between items-center text-muted border-t border-line pt-2 gap-2">
                  <span className="font-semibold text-muted shrink-0">
                    {t('landlordExpensesStatusColon')}
                  </span>
                  <div className="shrink-0">{renderStatusBadge(selectedExpense.status)}</div>
                </div>

                {selectedExpense.description && (
                  <div className="border-t border-line pt-2.5 space-y-1">
                    <span className="font-extrabold text-foreground/90 block">
                      {t('landlordExpensesDescriptionLabel')}
                    </span>
                    <p className="text-muted leading-relaxed bg-card p-3 rounded-xl border border-line">
                      {selectedExpense.description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div className="p-3.5 sm:p-4 border-t border-line bg-card flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-2 shrink-0">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSelectedExpense(null)}
                className="sm:w-auto"
              >
                {t('landlordExpensesCloseBtn')}
              </Button>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedExpense.status === 'pending' && (
                  <Button variant="dark"
                    size="sm"
                    onClick={() => handleMarkAsPaid(selectedExpense.id)}
                    className="sm:w-auto whitespace-nowrap"
                    leftIcon={<Check className="shrink-0" />}
                  >
                    {t('landlordExpensesStatusPaid')}
                  </Button>
                )}

                {selectedExpense.status === 'paid' ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => openEditModal(selectedExpense)}
                    className="sm:w-auto whitespace-nowrap"
                    title={t('landlordExpensesLockedTooltip')}
                    leftIcon={<Lock className="shrink-0" />}
                  >
                    {t('landlordExpensesLockedBtn')}
                  </Button>
                ) : (
                  <Button variant="dark"
                    size="sm"
                    onClick={() => {
                      const expToEdit = selectedExpense
                      setSelectedExpense(null)
                      openEditModal(expToEdit)
                    }}
                    className="sm:w-auto whitespace-nowrap"
                    leftIcon={<Edit3 className="shrink-0" />}
                  >
                    {t('landlordExpensesEditBtn')}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 2: Create / Edit Expense Modal ────────────────────────────── */}
      {(showCreateModal || editingExpense) && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) requestCloseModal(showCreateModal ? 'create' : 'edit')
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 cursor-pointer"
        >
          <div className="bg-card border border-line rounded-3xl max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col shadow-2xl cursor-default animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-line flex items-center justify-between bg-gradient-to-r from-teal-50/50 via-white to-teal-50/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-primary/10 text-primary rounded-2xl shadow-xs">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">
                    {showCreateModal
                      ? t('landlordExpensesCreateTitle')
                      : t('landlordExpensesEditTitleWithCode', {
                        code: editingExpense?.code || '',
                      })}
                  </h3>
                  <p className="text-xs text-muted font-semibold">
                    {t('landlordExpensesFormSubtitle')}
                  </p>
                </div>
              </div>

              <Button rounded="full"
                variant="ghost"
                size="sm"
                onClick={() => requestCloseModal(showCreateModal ? 'create' : 'edit')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Body Form */}
            <div className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs">
              <TextInput
                label={t('landlordExpensesNameLabel')}
                labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                value={expenseForm.name}
                onChange={e => {
                  setExpenseForm({ ...expenseForm, name: e.target.value })
                  setIsFormDirty(true)
                }}
                placeholder={t('landlordExpensesExpenseNamePlaceholder')}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectInput
                  label={t('landlordExpensesCategoryLabel')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  value={expenseForm.category}
                  onChange={e => {
                    setExpenseForm({ ...expenseForm, category: e.target.value })
                    setIsFormDirty(true)
                  }}
                  options={[
                    { value: 'Bảo trì & Sửa chữa', label: t('landlordExpensesCatMaintenance') },
                    { value: 'Điện nước & Dịch vụ', label: t('landlordExpensesCatUtilities') },
                    { value: 'Vệ sinh & An ninh', label: t('landlordExpensesCatCleaning') },
                    { value: 'Trang thiết bị', label: t('landlordExpensesCatEquipment') },
                    { value: 'Chi phí khác', label: t('landlordExpensesCatOther') },
                  ]}
                />

                <NumberInput
                  label={t('landlordExpensesAmountLabel')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  min={0}
                  value={expenseForm.amount}
                  onChange={e => {
                    setExpenseForm({ ...expenseForm, amount: e.target.value })
                    setIsFormDirty(true)
                  }}
                  placeholder="0"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <SelectInput
                  label={t('landlordExpensesScopeLabel')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  value={expenseForm.roomScope}
                  onChange={e => {
                    const newScope = e.target.value as 'property' | 'room'
                    setExpenseForm({
                      ...expenseForm,
                      roomScope: newScope,
                      roomId:
                        newScope === 'room' && availableRooms.length > 0
                          ? availableRooms[0].id
                          : '',
                    })
                    setIsFormDirty(true)
                  }}
                  options={[
                    { value: 'property', label: t('landlordExpensesEntirePropertyOption') },
                    { value: 'room', label: t('landlordExpensesSpecificRoom') },
                  ]}
                />

                {expenseForm.roomScope === 'room' ? (
                  <SelectInput
                    label={t('landlordExpensesSelectRoomLabel')}
                    labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                    value={expenseForm.roomId}
                    onChange={e => {
                      setExpenseForm({ ...expenseForm, roomId: e.target.value })
                      setIsFormDirty(true)
                    }}
                    options={[
                      { value: '', label: t('landlordExpensesSelectRoomPlaceholder') },
                      ...availableRooms.map(r => ({
                        value: r.id,
                        label: t('landlordExpensesRoomFloorOption', {
                          room: r.roomNumber,
                          floor: r.floor,
                        }),
                      })),
                    ]}
                  />
                ) : (
                  <SelectInput
                    label={t('landlordExpensesPaymentStatusLabel')}
                    labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                    value={expenseForm.status}
                    onChange={e => {
                      setExpenseForm({
                        ...expenseForm,
                        status: e.target.value as 'paid' | 'pending',
                      })
                      setIsFormDirty(true)
                    }}
                    options={[
                      { value: 'paid', label: t('landlordExpensesOptionPaid') },
                      { value: 'pending', label: t('landlordExpensesOptionPending') },
                    ]}
                  />
                )}
              </div>

              {expenseForm.roomScope === 'room' && (
                <SelectInput
                  label={t('landlordExpensesPaymentStatusLabel')}
                  labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                  value={expenseForm.status}
                  onChange={e => {
                    setExpenseForm({
                      ...expenseForm,
                      status: e.target.value as 'paid' | 'pending',
                    })
                    setIsFormDirty(true)
                  }}
                  options={[
                    { value: 'paid', label: t('landlordExpensesOptionPaid') },
                    { value: 'pending', label: t('landlordExpensesOptionPending') },
                  ]}
                />
              )}

              <TextInput
                type="date"
                label={t('landlordExpensesDateLabel')}
                labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                value={expenseForm.paidAt}
                onChange={e => {
                  setExpenseForm({ ...expenseForm, paidAt: e.target.value })
                  setIsFormDirty(true)
                }}
              />

              <TextareaInput
                label={t('landlordExpensesNoteLabel')}
                labelClassName="text-[11px] font-extrabold text-foreground/90 mb-1"
                rows={2}
                value={expenseForm.description}
                onChange={e => {
                  setExpenseForm({ ...expenseForm, description: e.target.value })
                  setIsFormDirty(true)
                }}
                placeholder={t('landlordExpensesDescriptionPlaceholder')}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-line bg-card flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => requestCloseModal(showCreateModal ? 'create' : 'edit')}
              >
                {t('landlordExpensesCancelBtn')}
              </Button>
              <Button variant="dark"
                size="sm"
                disabled={isSubmitting}
                isLoading={isSubmitting}
                onClick={showCreateModal ? handleCreateExpense : handleUpdateExpense}
                leftIcon={!isSubmitting ? <Check /> : undefined}
              >
                {showCreateModal
                  ? t('landlordExpensesSaveExpense')
                  : t('landlordExpensesUpdateExpense')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 3: Rule #10 Unsaved Changes Confirmation Modal ────────────── */}
      {confirmCloseTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-card border border-line rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 bg-amber-500/10 text-warning rounded-2xl flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-foreground">
                {t('landlordExpensesFormCloseTitle')}
              </h4>
              <p className="text-xs text-muted font-medium mt-1">
                {t('landlordExpensesFormCloseDesc')}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setConfirmCloseTarget(null)}
                className="flex-1"
              >
                {t('landlordExpensesContinueTyping')}
              </Button>

              <Button
                variant="danger"
                onClick={handleConfirmCloseModal}
                className="flex-1"
              >
                {t('landlordExpensesDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 4: Delete Confirmation Pop-up Modal ────────────────────────── */}
      {deletingExpenseTarget && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setDeletingExpenseTarget(null)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="bg-card border border-line rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150 cursor-default">
            <div className="w-12 h-12 bg-danger/10 text-danger rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-foreground">
                {t('landlordExpensesDeleteConfirmTitle')}
              </h4>
              <p className="text-xs text-muted font-medium mt-1.5 leading-relaxed">
                {t('landlordExpensesDeleteConfirmDesc', {
                  name: deletingExpenseTarget.name,
                  code: deletingExpenseTarget.code,
                })}
              </p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button
                variant="secondary"
                onClick={() => setDeletingExpenseTarget(null)}
                className="flex-1"
              >
                {t('landlordExpensesCancelBtn')}
              </Button>

              <Button
                variant="danger"
                onClick={confirmDeleteExpense}
                className="flex-1"
              >
                {t('landlordExpensesDeleteBtn')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal 5: Locked Paid Expense Pop-up Modal ────────────────────────── */}
      {lockedExpenseTarget && (
        <div
          onClick={e => {
            if (e.target === e.currentTarget) setLockedExpenseTarget(null)
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150 cursor-pointer"
        >
          <div className="bg-card border border-line rounded-3xl max-w-sm w-full p-6 space-y-4 text-center shadow-2xl animate-in zoom-in-95 duration-150 cursor-default">
            <div className="w-12 h-12 bg-amber-500/10 text-warning rounded-2xl flex items-center justify-center mx-auto shadow-xs">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-black text-base text-foreground">
                {t('landlordExpensesLockedTitle')}
              </h4>
              <p className="text-xs text-muted font-medium mt-1.5 leading-relaxed">
                {t('landlordExpensesLockedDesc', {
                  name: lockedExpenseTarget.name,
                  code: lockedExpenseTarget.code,
                })}
              </p>
            </div>
            <div className="pt-2">
              <Button fullWidth variant="dark"
                onClick={() => setLockedExpenseTarget(null)}
              >
                {t('landlordExpensesUnderstand')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
