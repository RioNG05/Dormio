'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { DashboardPageHeader, LandlordStatBanner, type LandlordStatChipItem } from '@/components/landlord'
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
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Text,
  Modal,
  Chip,
  EmptyState,
} from '@/components/ui'
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

  // Status Badge Helper
  const renderStatusBadge = (status: ExpenseItem['status']) => {
    if (status === 'paid') {
      return (
        <Chip preventHover variant='primary' className='w-full' leftIcon={<Check className='text-primary' />}>
          {t('landlordExpensesStatusPaid')}
        </Chip>
      )
    }
    if (status === 'pending') {
      return (
        <Chip preventHover variant='accent' className='w-full' leftIcon={<Check className='text-accent' />}>
          {t('landlordExpensesStatusPaid')}
        </Chip>
      )
    }
    return (
      <Chip preventHover variant='default' className='w-full' leftIcon={<X />}>
        {t('landlordExpensesStatusCanceled')}
      </Chip>
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
      <DashboardPageHeader
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
          <>
            <SelectInput
              value={activeStatusTab}
              onChange={e => {
                setActiveStatusTab(e.target.value as 'all' | 'paid' | 'pending' | 'canceled')
                setCurrentPage(1)
              }}
              containerClassName="w-full sm:w-auto min-w-[150px] space-y-0"
              options={[
                {
                  value: 'all',
                  label: t('landlordExpensesAllStatuses'),
                },
                {
                  value: 'paid',
                  label: t('landlordExpensesStatusPaid'),
                },
                {
                  value: 'pending',
                  label: t('landlordExpensesStatusPending'),
                },
                {
                  value: 'canceled',
                  label: t('landlordExpensesStatusCanceled'),
                },
              ]}
            />
            <SelectInput
              value={activeCategoryTab}
              onChange={e => {
                setActiveCategoryTab(e.target.value)
                setCurrentPage(1)
              }}
              containerClassName="w-full sm:w-auto min-w-[170px] space-y-0"
              options={categoriesList.map(cat => ({
                value: cat,
                label:
                  cat === 'all'
                    ? summary.totalCount
                      ? `${t('landlordExpensesAllCategories')} (${summary.totalCount})`
                      : t('landlordExpensesAllCategories')
                    : getCategoryLabel(cat),
              }))}
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

      {/* ─── Main Content Display (Grid or Table View) ───────────────────────── */}
      {isLoading ? (
        <div className="p-16 flex flex-col items-center justify-center bg-card rounded-2xl border border-line text-center">
          <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
          <Text size="sm" weight="bold" color="default">{t('landlordExpensesLoading')}</Text>
        </div>
      ) : expensesList.length === 0 ? (
        <EmptyState
          icon={<Wallet className="w-8 h-8" />}
          title={t('landlordExpensesNotFound')}
          description={t('landlordExpensesNotFoundDesc')}
          action={
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                resetForm()
                setShowCreateModal(true)
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('landlordExpensesAddNew')}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9 Default) */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {expensesList.map(exp => (
            <Card
              key={exp.id}
              className="space-y-4 flex flex-col justify-between"
              onClick={event => {
                event.stopPropagation()
                setSelectedExpense(exp)
              }}
            >
              {/* Header Info */}
              <Card.Header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-primary shrink-0" />
                  <Text as="span" size="xs" weight="black" color="default">{exp.code}</Text>
                </div>
                <Chip preventHover size='sm'>
                  {getCategoryLabel(exp.category)}
                </Chip>
              </Card.Header>

              <Card.Body className="px-4 sm:px-5 py-0 space-y-3">
                <div>
                  <Text as="h4" size="sm" weight="black" color="default" clamp={2} className="leading-snug">
                    {exp.name}
                  </Text>
                </div>

                {/* Amount Highlight */}
                <div className="p-3 bg-danger-soft border border-danger-subtle rounded-xl flex items-center justify-between">
                  <Text as="span" size="2xs" weight="extrabold" color="danger" uppercase>
                    {t('landlordExpensesExpenseAmount')}
                  </Text>
                  <Text as="span" size="base" weight="black" color="danger" className="whitespace-nowrap">
                    -{formatCurrency(exp.amount)}
                  </Text>
                </div>

                {/* Scope & Date Meta */}
                <div className="space-y-1.5 my-4 text-xs text-muted font-medium">
                  <div className="flex items-center justify-between">
                    <Text as="span" size="xs" color="secondary">{t('landlordExpensesScopeColon')}</Text>
                    <Text as="span" size="xs" weight="extrabold" color="default">{getScopeLabel(exp)}</Text>
                  </div>
                  <div className="flex items-center justify-between">
                    <Text as="span" size="xs" color="secondary">{t('landlordExpensesDateColon')}</Text>
                    <Text as="span" size="xs" weight="semibold" color="default">{formatDate(exp.paidAt)}</Text>
                  </div>
                </div>
                {renderStatusBadge(exp.status)}
              </Card.Body>

              {/* Action Buttons */}
              <Card.Footer className="px-4 sm:px-5 pt-3 pb-4 flex items-center justify-end gap-2">
                {exp.status === 'pending' && (
                  <Button
                    variant="dark"
                    onClick={event => {
                      event.stopPropagation()
                      handleMarkAsPaid(exp.id)
                    }}
                    title={t('landlordExpensesMarkPaid')}
                  >
                    {t('landlordExpensesMarkPaid')}
                  </Button>
                )}

                <div className="flex items-center gap-1">
                  {exp.status === 'paid' ? (
                    <Button
                      variant="secondary"
                      onClick={event => {
                        event.stopPropagation()
                        openEditModal(exp)
                      }}
                      leftIcon={<Lock className="text-amber-500" />}
                    >
                      {t('landlordExpensesLockedTooltip')}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      onClick={event => {
                        event.stopPropagation()
                        openEditModal(exp)
                      }}
                      title={t('landlordExpensesEditTooltip')}
                    >
                      <Edit3 />
                    </Button>
                  )}
                  <Button
                    variant="danger"
                    onClick={event => {
                      event.stopPropagation()
                      handleDeleteExpense(exp)
                    }}
                    leftIcon={<Trash2 />}
                  >
                    {t('landlordExpensesDeleteTooltip')}
                  </Button>
                </div>
              </Card.Footer>
            </Card>
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
                  <TableRow
                    key={exp.id}
                    className="group"
                    onClick={() => setSelectedExpense(exp)}
                  >
                    <td className="py-3 px-3.5 sm:px-4 font-black text-foreground whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-primary shrink-0" />
                        <Text as="span" size="xs" weight="black" color="default">{exp.code}</Text>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4">
                      <div className="min-w-[180px] max-w-[260px]">
                        <Text as="div" size="xs" weight="extrabold" color="default" clamp={2} className="leading-snug">
                          {exp.name}
                        </Text>
                        <Text as="span" size="3xs" color="secondary" weight="medium" className="block mt-0.5">
                          {getCategoryLabel(exp.category)}
                        </Text>
                      </div>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-bold text-foreground whitespace-nowrap">
                      <Text as="span" size="xs" weight="bold" color="default">{getScopeLabel(exp)}</Text>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 text-muted whitespace-nowrap">
                      <Text as="span" size="xs" color="secondary">{formatDate(exp.paidAt)}</Text>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 font-black text-danger whitespace-nowrap">
                      <Text as="span" size="xs" weight="black" color="danger">-{formatCurrency(exp.amount)}</Text>
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 whitespace-nowrap">
                      {renderStatusBadge(exp.status)}
                    </td>

                    <td className="py-3 px-3.5 sm:px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        {exp.status === 'paid' ? (
                          <Button
                            variant="orange"
                            size='icon-sm'
                            onClick={() => openEditModal(exp)}
                            title={t('landlordExpensesLockedTooltip')}
                          >
                            <Lock />
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            size="icon-sm"
                            onClick={() => openEditModal(exp)}
                            title={t('landlordExpensesEditTooltip')}
                          >
                            <Edit3 />
                          </Button>
                        )}
                        {exp.status === 'paid' ? (
                          <Button
                            variant="danger"
                            size="icon-sm"
                            onClick={() => openEditModal(exp)}
                            title={t('landlordExpensesLockedDeleteTooltip')}
                          >
                            <Trash2 />
                          </Button>
                        ) : (
                          <Button
                            variant="danger"
                            size="icon-sm"
                            onClick={() => handleDeleteExpense(exp)}
                            title={t('landlordExpensesDeleteTooltip')}
                          >
                            <Trash2 />
                          </Button>
                        )}
                      </div>
                    </td>
                  </TableRow>
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
        <Modal
          isOpen
          onClose={() => setSelectedExpense(null)}
          title={t('landlordExpensesDetailTitle', { code: selectedExpense.code })}
          description={getCategoryLabel(selectedExpense.category)}
          icon={<Receipt className="w-5 h-5 text-primary" />}
          size="lg"
          closeOnOverlayClick
          closeOnEsc
          bodyClassName="text-xs"
          footerClassName="justify-between"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setSelectedExpense(null)}>
                {t('landlordExpensesCloseBtn')}
              </Button>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                {selectedExpense.status === 'pending' && (
                  <Button variant="dark" size="sm" onClick={() => handleMarkAsPaid(selectedExpense.id)} leftIcon={<Check />}>
                    {t('landlordExpensesStatusPaid')}
                  </Button>
                )}
                {selectedExpense.status === 'paid' ? (
                  <Button variant="secondary" size="sm" onClick={() => openEditModal(selectedExpense)} leftIcon={<Lock />}>
                    {t('landlordExpensesLockedBtn')}
                  </Button>
                ) : (
                  <Button variant="dark" size="sm" onClick={() => {
                    const expToEdit = selectedExpense
                    setSelectedExpense(null)
                    openEditModal(expToEdit)
                  }} leftIcon={<Edit3 />}>
                    {t('landlordExpensesEditBtn')}
                  </Button>
                )}
              </div>
            </>
          }
        >
          <div className="space-y-4 sm:space-y-5">
            {/* Financial Highlight Box */}
            <div className="p-4 sm:p-5 bg-gradient-to-br from-zinc-900 via-zinc-900 to-[#0f5351] text-white rounded-2xl sm:rounded-3xl space-y-3 shadow-xl">
              <div className="flex items-center justify-between gap-2">
                <Text as="span" size="3xs" weight="extrabold" color="secondary" uppercase className="whitespace-nowrap">
                  {t('landlordExpensesPaymentAmountLabel')}
                </Text>
                <Text as="span" size="xs" weight="semibold" color="subtle" className="whitespace-nowrap">
                  {t('landlordExpensesPaymentDateLabel')}{' '}
                  <Text as="strong" color="white" weight="black" className="whitespace-nowrap">
                    {formatDate(selectedExpense.paidAt)}
                  </Text>
                </Text>
              </div>

              <div className="flex items-baseline gap-1 text-2xl sm:text-3xl font-black text-primary tracking-tight whitespace-nowrap">
                <Text as="span" size={{ base: '2xl', sm: '3xl' }} weight="black" color="brand">
                  -{formatCurrency(selectedExpense.amount)}
                </Text>
              </div>

              <div className="pt-2.5 border-t border-zinc-800/80 text-[11px] text-zinc-300 font-medium flex items-center justify-between gap-2">
                <Text as="span" color="subtle" className="shrink-0">{t('landlordExpensesNameColon')}</Text>
                <Text as="strong" color="white" weight="black" align="right" clamp={1}>
                  {selectedExpense.name}
                </Text>
              </div>
            </div>

            {/* Expense Details Breakdown Card */}
            <div className="p-4 bg-surface border border-line rounded-2xl space-y-3">
              <div className="flex justify-between items-center text-muted gap-2">
                <Text as="span" weight="semibold" color="secondary" className="shrink-0">
                  {t('landlordExpensesScopeColon')}
                </Text>
                <Text as="span" weight="black" color="default" truncate>
                  {getScopeLabel(selectedExpense)}
                </Text>
              </div>

              <div className="flex justify-between items-center text-muted border-t border-line pt-2 gap-2">
                <Text as="span" weight="semibold" color="secondary" className="shrink-0">
                  {t('landlordExpensesStatusColon')}
                </Text>
                <div className="shrink-0">{renderStatusBadge(selectedExpense.status)}</div>
              </div>

              {selectedExpense.description && (
                <div className="border-t border-line pt-2.5 space-y-1">
                  <Text as="span" weight="extrabold" color="default" className="block">
                    {t('landlordExpensesDescriptionLabel')}
                  </Text>
                  <Text as="p" color="secondary" className="leading-relaxed bg-card p-3 rounded-xl border border-line">
                    {selectedExpense.description}
                  </Text>
                </div>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* ─── Modal 2: Create / Edit Expense Modal ────────────────────────────── */}
      {(showCreateModal || editingExpense) && (
        <Modal
          isOpen
          onClose={() => requestCloseModal(showCreateModal ? 'create' : 'edit')}
          title={showCreateModal
            ? t('landlordExpensesCreateTitle')
            : t('landlordExpensesEditTitleWithCode', { code: editingExpense?.code || '' })}
          description={t('landlordExpensesFormSubtitle')}
          icon={<Wallet className="w-5 h-5 text-primary" />}
          size="xl"
          asForm
          onSubmit={event => {
            event.preventDefault()
            if (!isSubmitting) {
              void (showCreateModal ? handleCreateExpense() : handleUpdateExpense())
            }
          }}
          footer={
            <>
              <Button variant="secondary" size="sm" type="button" onClick={() => requestCloseModal(showCreateModal ? 'create' : 'edit')}>
                {t('landlordExpensesCancelBtn')}
              </Button>
              <Button variant="dark" size="sm" type="submit" disabled={isSubmitting} isLoading={isSubmitting} leftIcon={!isSubmitting ? <Check /> : undefined}>
                {showCreateModal ? t('landlordExpensesSaveExpense') : t('landlordExpensesUpdateExpense')}
              </Button>
            </>
          }
        >
          <div className="text-xs space-y-4">
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
        </Modal>
      )}

      {/* ─── Modal 3: Rule #10 Unsaved Changes Confirmation Modal ────────────── */}
      {confirmCloseTarget && (
        <Modal
          isOpen
          onClose={() => setConfirmCloseTarget(null)}
          title={t('landlordExpensesFormCloseTitle')}
          description={t('landlordExpensesFormCloseDesc')}
          icon={<AlertTriangle className="w-5 h-5 text-warning" />}
          size="sm"
          closeOnOverlayClick={false}
          footer={
            <>
              <Button variant="secondary" onClick={() => setConfirmCloseTarget(null)} className="flex-1">
                {t('landlordExpensesContinueTyping')}
              </Button>
              <Button variant="danger" onClick={handleConfirmCloseModal} className="flex-1">
                {t('landlordExpensesDiscardAndClose')}
              </Button>
            </>
          }
        />
      )}

      {/* ─── Modal 4: Delete Confirmation Pop-up Modal ────────────────────────── */}
      {deletingExpenseTarget && (
        <Modal
          isOpen
          onClose={() => setDeletingExpenseTarget(null)}
          title={t('landlordExpensesDeleteConfirmTitle')}
          description={t('landlordExpensesDeleteConfirmDesc', {
            name: deletingExpenseTarget.name,
            code: deletingExpenseTarget.code,
          })}
          icon={<Trash2 className="w-5 h-5 text-danger" />}
          size="sm"
          footer={
            <>
              <Button variant="secondary" onClick={() => setDeletingExpenseTarget(null)} className="flex-1">
                {t('landlordExpensesCancelBtn')}
              </Button>
              <Button variant="danger" onClick={confirmDeleteExpense} className="flex-1">
                {t('landlordExpensesDeleteBtn')}
              </Button>
            </>
          }
        />
      )}

      {/* ─── Modal 5: Locked Paid Expense Pop-up Modal ────────────────────────── */}
      {lockedExpenseTarget && (
        <Modal
          isOpen
          onClose={() => setLockedExpenseTarget(null)}
          title={t('landlordExpensesLockedTitle')}
          description={t('landlordExpensesLockedDesc', {
            name: lockedExpenseTarget.name,
            code: lockedExpenseTarget.code,
          })}
          icon={<Lock className="w-5 h-5 text-warning" />}
          size="sm"
          footer={
            <>
              <Button fullWidth variant="dark" onClick={() => setLockedExpenseTarget(null)}>
                {t('landlordExpensesUnderstand')}
              </Button>
            </>
          }
        />
      )}
    </div>
  )
}
