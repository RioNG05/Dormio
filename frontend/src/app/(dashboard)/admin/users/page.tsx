'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import {
  adminUsersService,
  AdminUserItem,
  AdminUserDetail,
  AdminUsersSummary,
} from '@/services/admin-users.service'
import {
  Users,
  Search,
  ShieldCheck,
  Shield,
  Home,
  UserCheck,
  UserX,
  Clock,
  Calendar,
  Phone,
  Mail,
  Building2,
  KeyRound,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  RefreshCw,
  LayoutGrid,
  List,
  Eye,
  Activity,
  UserCog,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Text'
import { Form } from '@/components/ui/Form'
import { TextInput } from '@/components/ui/TextInput'
import { SelectInput } from '@/components/ui/SelectInput'
import { TextareaInput } from '@/components/ui/TextareaInput'
import { Checkbox } from '@/components/ui/Checkbox'
import { NumberInput } from '@/components/ui/NumberInput'
import { Pagination } from '@/components/ui/Pagination'
import { ViewModeToggle } from '@/components/ui/ViewModeToggle'
import { Avatar } from '@/components/ui/Avatar'
import { FilterToolbar, SearchInput } from '@/components/ui'

export default function AdminUsersManagementPage() {
  const { locale } = useLanguage()
  const t = useTranslations('admin')
  const { user: currentUser } = useAuth()

  // Data state
  const [users, setUsers] = useState<AdminUserItem[]>([])
  const [summary, setSummary] = useState<AdminUsersSummary>({
    totalUsers: 0,
    activeUsers: 0,
    bannedUsers: 0,
    inactiveUsers: 0,
    landlordsCount: 0,
    tenantsCount: 0,
    employeesCount: 0,
  })
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [errorKey, setErrorKey] = useState<string | null>(null)
  const [toastMsg, setToastMsg] = useState<{ type: 'success' | 'error'; textKey?: string; text?: string } | null>(null)

  // View mode (Rule 9: Grid view as default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Pagination state (Rule 9: Grid=6, Table=10 default, 5-page window jumping)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(viewMode === 'grid' ? 6 : 10)

  // Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Adjust view mode without triggering network refetch
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
  }

  // Fetch users from API (Notice: does NOT depend on `t`, `pageSize`, or `currentPage` so layout/language changes do not trigger refetch)
  const fetchUsers = useCallback(
    async (isManualRefresh = false) => {
      if (isManualRefresh) setRefreshing(true)
      else setLoading(true)
      setErrorKey(null)

      try {
        const res = await adminUsersService.getUsers({
          page: 1,
          limit: 100,
          query: debouncedSearch.trim() || undefined,
          role: roleFilter !== 'all' ? roleFilter : undefined,
          status: statusFilter !== 'all' ? statusFilter : undefined,
        })

        setUsers(res.items || [])
        if (res.summary) {
          setSummary(res.summary)
        }
      } catch (err: any) {
        console.error('Failed to load users:', err)
        setErrorKey('adminUsersActionError')
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [debouncedSearch, roleFilter, statusFilter],
  )

  useEffect(() => {
    fetchUsers()
  }, [fetchUsers])

  // Toast auto-dismiss
  useEffect(() => {
    if (toastMsg) {
      const timer = setTimeout(() => setToastMsg(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [toastMsg])

  // Detail Modal State
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalTab, setModalTab] = useState<'profile' | 'activity' | 'actions'>('profile')

  // Admin Action Modal States
  const [actionType, setActionType] = useState<'ban' | 'unban' | 'role' | 'reset-password' | 'tier' | null>(null)
  const [actionTargetUser, setActionTargetUser] = useState<AdminUserItem | null>(null)
  const [actionReason, setActionReason] = useState('')
  const [newRole, setNewRole] = useState<string>('tenant')
  const [tempPassword, setTempPassword] = useState('Dormio@2026')
  const [forceChangePassword, setForceChangePassword] = useState(true)
  const [newTier, setNewTier] = useState<'free' | 'plus' | 'pro'>('free')
  const [durationMonths, setDurationMonths] = useState<number>(1)
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // Unsaved changes confirmation modal state (Rule 10)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [pendingCloseTarget, setPendingCloseTarget] = useState<'detail' | 'action' | null>(null)

  // Open user detail
  const handleOpenDetail = async (user: AdminUserItem, defaultTab: 'profile' | 'activity' | 'actions' = 'profile') => {
    setModalTab(defaultTab)
    setDetailLoading(true)
    setSelectedUser(null)
    try {
      const data = await adminUsersService.getUserDetail(user.id)
      setSelectedUser(data)
    } catch (err) {
      console.error('Failed to fetch user detail:', err)
      setToastMsg({ type: 'error', textKey: 'adminUsersActionError' })
    } finally {
      setDetailLoading(false)
    }
  }

  // Check if a target user is the Root System Admin (Nguyen Quang Huy)
  const isRootAdminUser = useCallback(
    (targetUser?: { phoneNumber?: string | null; email?: string | null; isRootAdmin?: boolean } | null) => {
      if (!targetUser) return false
      if (targetUser.isRootAdmin) return true
      if (targetUser.phoneNumber === '0344265925') return true
      if (targetUser.email && targetUser.email.toLowerCase().includes('ngquanghuy.work')) return true
      return false
    },
    []
  )

  // Check if current user is authorized to modify the target user
  // Root system admin cannot be modified by any other people
  const canModifyUser = useCallback(
    (targetUser?: AdminUserItem | AdminUserDetail | null) => {
      if (!targetUser) return false
      if (!isRootAdminUser(targetUser)) return true
      if (!currentUser) return false
      const isSelf =
        (currentUser.id && currentUser.id === targetUser.id) ||
        (currentUser.phone && currentUser.phone === targetUser.phoneNumber) ||
        (currentUser.email && currentUser.email.toLowerCase().includes('ngquanghuy.work'))
      return Boolean(isSelf)
    },
    [currentUser, isRootAdminUser]
  )

  const getRootAdminBadge = () => (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-warning-soft text-warning border border-amber-300 shadow-2xs">
      <Shield className="w-3 h-3 text-warning" />
      {t('adminUsersRootAdminBadge')}
    </span>
  )

  // Open action modal
  const handleOpenAction = (user: AdminUserItem, type: 'ban' | 'unban' | 'role' | 'reset-password' | 'tier') => {
    if (!canModifyUser(user)) {
      setToastMsg({ type: 'error', textKey: 'adminUsersRootAdminProtectedDesc' })
      return
    }
    setActionTargetUser(user)
    setActionType(type)
    setActionReason('')
    setNewRole(user.role)
    setTempPassword('Dormio@2026')
    setForceChangePassword(true)
    const currentTier = (user.subscriptionPackage?.toLowerCase() as 'free' | 'plus' | 'pro') || 'free'
    setNewTier(['free', 'plus', 'pro'].includes(currentTier) ? currentTier : 'free')
    setDurationMonths(1)
  }

  // Check if form is dirty before closing (Rule 10)
  const isActionDirty = useMemo(() => {
    const currentTier = (actionTargetUser?.subscriptionPackage?.toLowerCase() as 'free' | 'plus' | 'pro') || 'free'
    return (
      actionReason.trim().length > 0 ||
      (actionType === 'role' && actionTargetUser && newRole !== actionTargetUser.role) ||
      (actionType === 'reset-password' && tempPassword !== 'Dormio@2026') ||
      (actionType === 'tier' && (newTier !== currentTier || durationMonths !== 1))
    )
  }, [actionReason, actionType, actionTargetUser, newRole, tempPassword, newTier, durationMonths])

  const requestCloseActionModal = () => {
    if (isActionDirty) {
      setPendingCloseTarget('action')
      setShowDiscardConfirm(true)
    } else {
      setActionType(null)
      setActionTargetUser(null)
    }
  }

  const requestCloseDetailModal = () => {
    setSelectedUser(null)
  }

  const handleConfirmDiscard = () => {
    setShowDiscardConfirm(false)
    if (pendingCloseTarget === 'action') {
      setActionType(null)
      setActionTargetUser(null)
      setActionReason('')
      setNewTier('free')
      setDurationMonths(1)
    }
    setPendingCloseTarget(null)
  }

  // Execute admin action
  const handleExecuteAction = async () => {
    if (!actionTargetUser || !actionType) return
    if (!canModifyUser(actionTargetUser)) {
      setToastMsg({ type: 'error', textKey: 'adminUsersRootAdminProtectedDesc' })
      setActionType(null)
      setActionTargetUser(null)
      return
    }
    setActionSubmitting(true)
    try {
      if (actionType === 'ban') {
        await adminUsersService.updateUserStatus(actionTargetUser.id, {
          status: 'banned',
          reason: actionReason.trim() || undefined,
        })
        setToastMsg({ type: 'success', textKey: 'adminUsersActionSuccess' })
      } else if (actionType === 'unban') {
        await adminUsersService.updateUserStatus(actionTargetUser.id, {
          status: 'active',
          reason: actionReason.trim() || undefined,
        })
        setToastMsg({ type: 'success', textKey: 'adminUsersActionSuccess' })
      } else if (actionType === 'role') {
        await adminUsersService.updateUserRole(actionTargetUser.id, {
          role: newRole,
          reason: actionReason.trim() || undefined,
        })
        setToastMsg({ type: 'success', textKey: 'adminUsersActionSuccess' })
      } else if (actionType === 'reset-password') {
        await adminUsersService.resetUserPassword(actionTargetUser.id, {
          temporaryPassword: tempPassword,
          mustChangePassword: forceChangePassword,
        })
        setToastMsg({
          type: 'success',
          text: `${t('adminUsersActionSuccess')} (${tempPassword})`,
        })
      } else if (actionType === 'tier') {
        await adminUsersService.updateUserTier(actionTargetUser.id, {
          tier: newTier,
          durationMonths: newTier === 'free' ? undefined : Number(durationMonths) || 1,
          reason: actionReason.trim() || undefined,
        })
        setToastMsg({ type: 'success', textKey: 'adminUsersActionSuccess' })
      }

      // Close modal and refresh data
      setActionType(null)
      setActionTargetUser(null)
      setActionReason('')
      setNewTier('free')
      setDurationMonths(1)
      fetchUsers()

      // If user detail is also open, update it
      if (selectedUser && selectedUser.id === actionTargetUser.id) {
        handleOpenDetail(actionTargetUser, modalTab)
      }
    } catch (err) {
      console.error('Action failed:', err)
      setToastMsg({ type: 'error', textKey: 'adminUsersActionError' })
    } finally {
      setActionSubmitting(false)
    }
  }

  // Formatting helpers
  const formatJoinedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  const getRelativeTime = (dateStr: string) => {
    try {
      const diffMs = Date.now() - new Date(dateStr).getTime()
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      if (diffDays <= 0) return t('adminUsersTimeToday')
      if (diffDays === 1) return t('adminUsersTimeYesterday')
      if (diffDays < 30) return t('adminUsersTimeDaysAgo', { count: diffDays })
      const diffMonths = Math.floor(diffDays / 30)
      if (diffMonths < 12) return t('adminUsersTimeMonthsAgo', { count: diffMonths })
      const diffYears = Math.floor(diffMonths / 12)
      return t('adminUsersTimeYearsAgo', { count: diffYears })
    } catch {
      return ''
    }
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'landlord':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-primary/10 text-primary border border-primary/30">
            <Building2 className="w-3 h-3" />
            {t('adminUsersRoleLandlord')}
          </span>
        )
      case 'tenant':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-info-soft text-info border border-info-subtle">
            <Home className="w-3 h-3" />
            {t('adminUsersRoleTenant')}
          </span>
        )
      case 'employee':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-warning-soft text-warning border border-warning-subtle">
            <UserCheck className="w-3 h-3" />
            {t('adminUsersRoleStaff')}
          </span>
        )
      case 'leasing_agent':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-deposit-soft text-deposit border border-deposit-subtle">
            <UserCog className="w-3 h-3" />
            {t('adminUsersRoleAgent')}
          </span>
        )
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-danger-soft text-danger border border-danger-subtle">
            <Shield className="w-3 h-3" />
            {t('adminUsersRoleAdmin')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-card-hover text-foreground/90">
            {role}
          </span>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-success-soft text-success border border-success-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('adminUsersStatusActive')}
          </span>
        )
      case 'banned':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-danger-soft text-danger border border-danger-subtle">
            <UserX className="w-3 h-3" />
            {t('adminUsersStatusBanned')}
          </span>
        )
      case 'inactive':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-card-hover text-muted border border-line">
            <Clock className="w-3 h-3" />
            {t('adminUsersStatusInactive')}
          </span>
        )
      default:
        return <span className="text-xs text-muted">{status}</span>
    }
  }

  const getTierBadge = (tier?: string | null) => {
    const normalized = (tier || 'free').toLowerCase()
    switch (normalized) {
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-warning-soft text-warning border border-amber-300">
            <Crown className="w-3 h-3 text-warning" />
            {t('adminUsersTierBadgePro')}
          </span>
        )
      case 'plus':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-deposit-soft text-deposit border border-deposit-subtle">
            <Sparkles className="w-3 h-3 text-deposit" />
            {t('adminUsersTierBadgePlus')}
          </span>
        )
      case 'free':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-card-hover text-muted border border-line">
            {t('adminUsersTierBadgeFree')}
          </span>
        )
    }
  }

  // Pagination calculations (Rule 9: Grid=6, Table=10 default, 5-page window jumping)
  const totalItems = users.length
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))
  const totalPages = Math.max(1, Math.ceil(totalItems / validPageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize
    return users.slice(start, start + validPageSize)
  }, [users, safeCurrentPage, validPageSize])

  return (
    <div className="space-y-6 pb-12">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-6 right-6 z-50 animate-in slide-in-from-top-3 duration-300">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl text-sm font-bold border ${
              toastMsg.type === 'success'
                ? 'bg-success-soft text-success border-success-subtle'
                : 'bg-danger-soft text-danger border-danger-subtle'
            }`}
          >
            {toastMsg.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
            )}
            <Text as="span" size="sm" weight="bold">
              {toastMsg.textKey ? t(toastMsg.textKey) : toastMsg.text}
            </Text>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-6 rounded-3xl border border-line shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase bg-accent-soft text-orange-600 border border-accent-subtle">
              <Shield className="w-3.5 h-3.5" />
              {t('adminUsersBadge')}
            </span>
            <Text as="span" variant="caption" size="2xs" color="subtle">
              • {t('adminUsersLiveDb')}
            </Text>
          </div>
          <Text as="h1" variant="heading" size="xl" className="text-foreground font-black tracking-tight">
            {t('adminUsersTitle')}
          </Text>
          <Text variant="caption" size="xs" color="subtle" className="max-w-2xl">
            {t('adminUsersSubtitle')}
          </Text>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fetchUsers(true)}
          disabled={refreshing}
          leftIcon={<RefreshCw  />}
          className="shrink-0"
        >
          {t('adminUsersRefresh')}
        </Button>
      </div>

      {/* KPI Cards Grid using Form.Grid */}
      <Form.Grid cols={5} gap="sm" className="grid-cols-2 lg:grid-cols-5">
        <div className="bg-card p-4 rounded-2xl border border-line shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <Text as="span" size="xs" weight="bold" color="secondary">
              {t('adminUsersKpiTotal')}
            </Text>
            <div className="p-2 rounded-xl bg-card-hover text-foreground/90">
              <Users className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse my-1" />
          ) : (
            <Text as="p" variant="heading" size="2xl" weight="black" className="text-foreground">
              {summary.totalUsers.toLocaleString()}
            </Text>
          )}
          {loading ? (
            <div className="h-3 w-24 bg-card-hover rounded animate-pulse" />
          ) : (
            <Text as="p" size="2xs" weight="bold" color="success">
              {summary.activeUsers} {t('adminUsersStatusActive').toLowerCase()}
            </Text>
          )}
        </div>

        <div className="bg-card p-4 rounded-2xl border border-line shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <Text as="span" size="xs" weight="bold" color="secondary">
              {t('adminUsersKpiLandlords')}
            </Text>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse my-1" />
          ) : (
            <Text as="p" variant="heading" size="2xl" weight="black" className="text-primary">
              {summary.landlordsCount.toLocaleString()}
            </Text>
          )}
          {loading ? (
            <div className="h-3 w-24 bg-card-hover rounded animate-pulse" />
          ) : (
            <Text as="p" size="2xs" color="subtle">
              {summary.totalUsers > 0 ? Math.round((summary.landlordsCount / summary.totalUsers) * 100) : 0}% platform
            </Text>
          )}
        </div>

        <div className="bg-card p-4 rounded-2xl border border-line shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <Text as="span" size="xs" weight="bold" color="secondary">
              {t('adminUsersKpiTenants')}
            </Text>
            <div className="p-2 rounded-xl bg-info-soft text-info">
              <Home className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse my-1" />
          ) : (
            <Text as="p" variant="heading" size="2xl" weight="black" className="text-info">
              {summary.tenantsCount.toLocaleString()}
            </Text>
          )}
          {loading ? (
            <div className="h-3 w-24 bg-card-hover rounded animate-pulse" />
          ) : (
            <Text as="p" size="2xs" color="subtle">
              {summary.totalUsers > 0 ? Math.round((summary.tenantsCount / summary.totalUsers) * 100) : 0}% platform
            </Text>
          )}
        </div>

        <div className="bg-card p-4 rounded-2xl border border-line shadow-xs space-y-1">
          <div className="flex items-center justify-between text-muted">
            <Text as="span" size="xs" weight="bold" color="secondary">
              {t('adminUsersKpiStaff')}
            </Text>
            <div className="p-2 rounded-xl bg-warning-soft text-warning">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse my-1" />
          ) : (
            <Text as="p" variant="heading" size="2xl" weight="black" className="text-warning">
              {summary.employeesCount.toLocaleString()}
            </Text>
          )}
          {loading ? (
            <div className="h-3 w-24 bg-card-hover rounded animate-pulse" />
          ) : (
            <Text as="p" size="2xs" color="subtle">
              Operations staff
            </Text>
          )}
        </div>

        <div className="bg-card p-4 rounded-2xl border border-line shadow-xs space-y-1 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-muted">
            <Text as="span" size="xs" weight="bold" color="secondary">
              {t('adminUsersKpiBanned')}
            </Text>
            <div className="p-2 rounded-xl bg-danger-soft text-danger">
              <UserX className="w-4 h-4" />
            </div>
          </div>
          {loading ? (
            <div className="h-8 w-16 bg-card-hover rounded-lg animate-pulse my-1" />
          ) : (
            <Text as="p" variant="heading" size="2xl" weight="black" className="text-danger">
              {summary.bannedUsers.toLocaleString()}
            </Text>
          )}
          {loading ? (
            <div className="h-3 w-24 bg-card-hover rounded animate-pulse" />
          ) : (
            <Text as="p" size="2xs" color="subtle">
              {summary.inactiveUsers} {t('adminUsersStatusInactive').toLowerCase()}
            </Text>
          )}
        </div>
      </Form.Grid>

      {/* Filter and View Mode Toolbar using FilterToolbar */}
      <FilterToolbar
        search={
          <SearchInput
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            placeholder={t('adminUsersSearchPlaceholder')}
          />
        }
        filters={
          <>
            {/* Role Filter using SelectInput */}
            <SelectInput
              value={roleFilter}
              onChange={e => {
                setRoleFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: t('adminUsersRoleAll') },
                { value: 'landlord', label: t('adminUsersRoleLandlord') },
                { value: 'tenant', label: t('adminUsersRoleTenant') },
                { value: 'employee', label: t('adminUsersRoleStaff') },
                { value: 'leasing_agent', label: t('adminUsersRoleAgent') },
                { value: 'admin', label: t('adminUsersRoleAdmin') },
              ]}
              containerClassName="w-full sm:w-40"
              className="rounded-2xl py-2 text-xs font-bold"
            />

            {/* Status Filter using SelectInput */}
            <SelectInput
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: t('adminUsersStatusAll') },
                { value: 'active', label: t('adminUsersStatusActive') },
                { value: 'inactive', label: t('adminUsersStatusInactive') },
                { value: 'banned', label: t('adminUsersStatusBanned') },
              ]}
              containerClassName="w-full sm:w-40"
              className="rounded-2xl py-2 text-xs font-bold"
            />
          </>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={handleViewModeChange}
          />
        }
      />

      {/* Content Section: Loading / Error / Empty / Grid / Table */}
      {loading ? (
        <div className="bg-card p-12 rounded-3xl border border-line text-center space-y-3 shadow-xs">
          <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
          <Text variant="body" size="sm" weight="bold" color="secondary">
            {t('adminUsersLoading')}
          </Text>
        </div>
      ) : errorKey ? (
        <Form.Alert
          variant="error"
          title={t(errorKey)}
          className="rounded-3xl p-6"
        >
          <div className="pt-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fetchUsers()}>
              {t('adminUsersRefresh')}
            </Button>
          </div>
        </Form.Alert>
      ) : users.length === 0 ? (
        <div className="bg-card p-12 rounded-3xl border border-line text-center space-y-2 shadow-xs">
          <UserX className="w-10 h-10 text-zinc-300 mx-auto" />
          <Text variant="heading" size="base" className="text-foreground">
            {t('adminUsersNoResults')}
          </Text>
          <Text variant="caption" size="xs" color="subtle">
            {t('adminUsersNoResultsDesc')}
          </Text>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule 9: Default view) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedUsers.map(user => {
            return (
              <div
                key={user.id}
                className="bg-card rounded-2xl border border-line shadow-2xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer p-5 flex flex-col justify-between space-y-4 group"
              >
                {/* Header: Avatar, Name, Role & Status */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={user.avatarUrl}
                        name={user.fullName || user.username || user.phoneNumber}
                        size="md"
                        shape="rounded"
                        bordered
                        zoomOnHover
                      />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <Text
                            as="h3"
                            variant="heading"
                            size="sm"
                            className="text-foreground font-extrabold truncate"
                          >
                            {user.fullName || user.username || t('adminUsersUnidentified')}
                          </Text>
                          {user.isIdentityVerified && (
                            <span title={t('adminUsersVerified')}>
                              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                            </span>
                          )}
                        </div>
                        <Text variant="caption" size="2xs" color="subtle" className="truncate font-mono">
                          @{user.username || user.phoneNumber}
                        </Text>
                      </div>
                    </div>
                    {getStatusBadge(user.status)}
                  </div>

                  {/* Role, Tier and Root Admin Tags */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {getRoleBadge(user.role)}
                    {getTierBadge(user.subscriptionPackage)}
                    {isRootAdminUser(user) && getRootAdminBadge()}
                  </div>

                  {/* Contact Info */}
                  <div className="space-y-1.5 pt-1 text-xs text-muted">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                      <Text as="span" size="xs" weight="semibold" className="text-foreground">
                        {user.phoneNumber}
                      </Text>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                      <Text as="span" size="xs" color="secondary" truncate>
                        {user.email || t('adminUsersNoEmail')}
                      </Text>
                    </div>
                  </div>

                  {/* Registration Time & Activity */}
                  <div className="p-2.5 rounded-2xl bg-surface border border-line space-y-1 text-[11px]">
                    <div className="flex items-center justify-between text-muted">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-muted" />
                        {t('adminUsersColJoined')}:
                      </span>
                      <Text as="span" size="2xs" weight="bold" className="text-foreground/90">
                        {formatJoinedDate(user.createdAt)}
                      </Text>
                    </div>
                    <div className="flex items-center justify-between text-muted">
                      <Text as="span" size="3xs" color="subtle">
                        {getRelativeTime(user.createdAt)}
                      </Text>
                      {user.lastActiveAt && (
                        <Text as="span" size="3xs" weight="semibold" color="brand" className="flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          {getRelativeTime(user.lastActiveAt)}
                        </Text>
                      )}
                    </div>
                  </div>

                  {/* Summary Counters */}
                  <div className="flex items-center gap-2 text-[11px] text-muted pt-1">
                    {user.role === 'landlord' && (
                      <Text as="span" size="2xs" weight="bold" className="text-foreground/90">
                        {t('adminUsersHousesCount', { count: user.housesCount })}
                      </Text>
                    )}
                    {user.role === 'tenant' && (
                      <Text as="span" size="2xs" weight="bold" className="text-foreground/90">
                        {t('adminUsersContractsCount', { count: user.contractsCount })}
                      </Text>
                    )}
                    {user.postsCount > 0 && (
                      <Text as="span" size="2xs" color="subtle">
                        • {t('adminUsersPostsCount', { count: user.postsCount })}
                      </Text>
                    )}
                  </div>
                </div>

                {/* Card Actions using Button */}
                <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={() => handleOpenDetail(user, 'profile')}
                    leftIcon={<Eye  />}
                    className="flex-1"
                  >
                    {t('adminUsersBtnDetail')}
                  </Button>

                  {canModifyUser(user) ? (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAction(user, 'tier')}
                        title={t('adminUsersBtnChangeTier')}
                      >
                        <Crown className="w-4 h-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenDetail(user, 'actions')}
                        title={t('adminUsersTabActions')}
                      >
                        <UserCog className="w-4 h-4" />
                      </Button>
                    </>
                  ) : (
                    <div
                      className="inline-flex items-center justify-center p-2 rounded-xl bg-warning-soft text-warning border border-warning-subtle cursor-not-allowed"
                      title={t('adminUsersRootAdminProtected')}
                    >
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule 9: Parallel support) */
        <div className="bg-card rounded-2xl border border-line shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 border-b border-line text-[11px] font-black text-muted uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('adminUsersColUser')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColContact')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColRole')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColStatus')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColJoined')}</th>
                  <th className="py-3.5 px-4 text-right">{t('adminUsersColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-foreground/90">
                {paginatedUsers.map(user => {
                  return (
                    <tr key={user.id} className="hover:bg-card-hover transition-colors duration-150 group">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={user.avatarUrl}
                            name={user.fullName || user.username || user.phoneNumber}
                            size="sm"
                            shape="rounded"
                            bordered
                          />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <Text as="span" size="xs" weight="extrabold" className="text-foreground">
                                {user.fullName || user.username || t('adminUsersUnidentified')}
                              </Text>
                              {user.isIdentityVerified && (
                                <span title={t('adminUsersVerified')}>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                                </span>
                              )}
                            </div>
                            <Text as="span" variant="caption" size="2xs" color="subtle" className="font-mono block">
                              @{user.username || user.phoneNumber}
                            </Text>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="space-y-0.5">
                          <Text as="p" size="xs" weight="semibold" className="text-foreground">
                            {user.phoneNumber}
                          </Text>
                          <Text as="p" size="2xs" color="subtle" truncate className="max-w-[180px]">
                            {user.email || '—'}
                          </Text>
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {getRoleBadge(user.role)}
                          {getTierBadge(user.subscriptionPackage)}
                          {isRootAdminUser(user) && getRootAdminBadge()}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">{getStatusBadge(user.status)}</td>
                      <td className="py-3.5 px-4">
                        <div>
                          <Text as="p" size="xs" weight="semibold" className="text-foreground">
                            {formatJoinedDate(user.createdAt)}
                          </Text>
                          <Text as="p" size="2xs" color="subtle">
                            {getRelativeTime(user.createdAt)}
                          </Text>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleOpenDetail(user, 'profile')}
                            leftIcon={<Eye  />}
                          >
                            {t('adminUsersBtnDetail')}
                          </Button>
                          {canModifyUser(user) ? (
                            <>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenAction(user, 'tier')}
                                title={t('adminUsersBtnChangeTier')}
                              >
                                <Crown className="w-4 h-4" />
                              </Button>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => handleOpenDetail(user, 'actions')}
                                title={t('adminUsersTabActions')}
                              >
                                <UserCog className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <span
                              className="p-1.5 rounded-xl text-warning cursor-not-allowed inline-flex items-center justify-center"
                              title={t('adminUsersRootAdminProtected')}
                            >
                              <Lock className="w-4 h-4" />
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Pagination Bar using Button base component */}
      {!loading && totalItems > 0 && (
        <Pagination
          currentPage={safeCurrentPage}
          totalItems={totalItems}
          pageSize={validPageSize}
          onPageChange={setCurrentPage}
          onPageSizeChange={setPageSize}
          pageSizeMax={100}
        />
      )}

      {/* USER DETAIL MODAL (Tabs: Profile, Activity History, Admin Actions) */}
      {(selectedUser || detailLoading) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-3xl max-h-[90vh] rounded-3xl shadow-2xl border border-line flex flex-col overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-line bg-surface/50">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-primary/10 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Text as="h2" variant="heading" size="base" className="font-extrabold text-foreground">
                      {selectedUser
                        ? t('adminUsersModalTitle', {
                            name: selectedUser.fullName || selectedUser.username || selectedUser.phoneNumber,
                          })
                        : t('adminUsersLoadingProfile')}
                    </Text>
                    {selectedUser && isRootAdminUser(selectedUser) && getRootAdminBadge()}
                  </div>
                  {selectedUser && (
                    <Text variant="caption" size="2xs" color="subtle">
                      ID: {selectedUser.id}
                    </Text>
                  )}
                </div>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={requestCloseDetailModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Modal Tab Switcher using Button components */}
            {selectedUser && (
              <div className="flex border-b border-line bg-card-hover/50 px-5 gap-2 pt-2">
                <Button
                  type="button"
                  variant={modalTab === 'profile' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setModalTab('profile')}
                  leftIcon={<Users  />}
                >
                  {t('adminUsersTabProfile')}
                </Button>
                <Button
                  type="button"
                  variant={modalTab === 'activity' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setModalTab('activity')}
                  leftIcon={<Activity  />}
                >
                  {t('adminUsersTabActivity')}
                </Button>
                <Button
                  type="button"
                  variant={modalTab === 'actions' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setModalTab('actions')}
                  leftIcon={<UserCog  />}
                >
                  {t('adminUsersTabActions')}
                </Button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 custom-scrollbar">
              {detailLoading || !selectedUser ? (
                <div className="py-16 text-center space-y-3">
                  <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                  <Text variant="body" size="sm" weight="bold" color="secondary">
                    {t('adminUsersRetrieving')}
                  </Text>
                </div>
              ) : modalTab === 'profile' ? (
                /* TAB 1: Profile & KYC Details using Form.Grid */
                <div className="space-y-6">
                  {/* Account Overview Card */}
                  <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getRoleBadge(selectedUser.role)}
                        {getStatusBadge(selectedUser.status)}
                        {isRootAdminUser(selectedUser) && getRootAdminBadge()}
                      </div>
                      <Text as="span" size="xs" weight="semibold" color="secondary">
                        {t('adminUsersLabelJoinedDate')}: {formatJoinedDate(selectedUser.createdAt)} (
                        {getRelativeTime(selectedUser.createdAt)})
                      </Text>
                    </div>

                    <Form.Grid cols={2} gap="sm" className="text-xs">
                      <div>
                        <Text as="span" size="2xs" color="subtle" className="block">
                          {t('adminUsersUsernameLabel')}
                        </Text>
                        <Text as="span" size="xs" weight="bold" className="text-foreground">
                          @{selectedUser.username || '—'}
                        </Text>
                      </div>
                      <div>
                        <Text as="span" size="2xs" color="subtle" className="block">
                          {t('adminUsersPhoneLabel')}
                        </Text>
                        <Text as="span" size="xs" weight="bold" className="text-foreground">
                          {selectedUser.phoneNumber}
                        </Text>
                      </div>
                      <div>
                        <Text as="span" size="2xs" color="subtle" className="block">
                          Email
                        </Text>
                        <Text as="span" size="xs" weight="bold" className="text-foreground">
                          {selectedUser.email || '—'}
                        </Text>
                      </div>
                      <div>
                        <Text as="span" size="2xs" color="subtle" className="block">
                          {t('adminUsersLabelSubscription')}
                        </Text>
                        <div className="flex items-center gap-2 mt-0.5">
                          {getTierBadge(selectedUser.subscriptionPackage)}
                          {canModifyUser(selectedUser) ? (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenAction(selectedUser, 'tier')}
                              title={t('adminUsersBtnChangeTier')}
                            >
                              <Sparkles className="w-3 h-3" />
                              {t('adminUsersQuickChangeTier')}
                            </Button>
                          ) : (
                            <span
                              className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning-soft px-2 py-0.5 rounded-lg border border-warning-subtle"
                              title={t('adminUsersRootAdminProtected')}
                            >
                              <Lock className="w-3 h-3 text-warning" />
                              {t('adminUsersRootAdminProtected')}
                            </span>
                          )}
                        </div>
                      </div>
                    </Form.Grid>
                  </div>

                  {/* Citizen Identification (CCCD / KYC) */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Text as="h3" variant="heading" size="sm" className="font-extrabold text-foreground">
                        {t('adminUsersTabProfile')}
                      </Text>
                      {selectedUser.isIdentityVerified ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-success bg-success-soft px-2.5 py-1 rounded-full border border-success-subtle">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t('adminUsersVerified')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-muted bg-card-hover px-2.5 py-1 rounded-full">
                          {t('adminUsersUnverified')}
                        </span>
                      )}
                    </div>

                    {selectedUser.identification ? (
                      <div className="p-4 rounded-2xl border border-line space-y-3 text-xs">
                        <Form.Grid cols={2} gap="sm">
                          <div>
                            <Text as="span" size="2xs" color="subtle" className="block">
                              {t('adminUsersLabelFullName')}
                            </Text>
                            <Text as="span" size="xs" weight="bold" className="text-foreground">
                              {selectedUser.identification.fullName}
                            </Text>
                          </div>
                          <div>
                            <Text as="span" size="2xs" color="subtle" className="block">
                              {t('adminUsersLabelCitizenId')}
                            </Text>
                            <Text as="span" size="xs" weight="bold" className="font-mono text-foreground">
                              {selectedUser.identification.identityNumber}
                            </Text>
                          </div>
                          <div>
                            <Text as="span" size="2xs" color="subtle" className="block">
                              {t('adminUsersLabelDob')}
                            </Text>
                            <Text as="span" size="xs" weight="semibold" className="text-foreground">
                              {new Date(selectedUser.identification.dateOfBirth).toLocaleDateString(
                                locale === 'en' ? 'en-US' : 'vi-VN',
                              )}
                            </Text>
                          </div>
                          <div>
                            <Text as="span" size="2xs" color="subtle" className="block">
                              {t('adminUsersLabelGender')}
                            </Text>
                            <Text as="span" size="xs" weight="semibold" className="text-foreground">
                              {selectedUser.identification.gender === 'male'
                                ? t('adminUsersLabelGenderMale')
                                : t('adminUsersLabelGenderFemale')}
                            </Text>
                          </div>
                          <div className="col-span-full">
                            <Text as="span" size="2xs" color="subtle" className="block">
                              {t('adminUsersLabelResidence')}
                            </Text>
                            <Text as="span" size="xs" weight="semibold" className="text-foreground">
                              {typeof selectedUser.identification.placeOfResidence === 'object'
                                ? JSON.stringify(selectedUser.identification.placeOfResidence)
                                : String(selectedUser.identification.placeOfResidence || '—')}
                            </Text>
                          </div>
                        </Form.Grid>

                        {/* Card Front/Back Images if present */}
                        {(selectedUser.identification.cardFrontUrl || selectedUser.identification.cardBackUrl) && (
                          <div className="pt-2 border-t border-line space-y-2">
                            <Text as="span" size="2xs" weight="bold" color="secondary" className="uppercase block">
                              {t('adminUsersLabelCardPhotos')}
                            </Text>
                            <Form.Grid cols={2} gap="sm">
                              {selectedUser.identification.cardFrontUrl && (
                                <a
                                  href={selectedUser.identification.cardFrontUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative block rounded-xl overflow-hidden border border-line"
                                >
                                  <img
                                    src={selectedUser.identification.cardFrontUrl}
                                    alt="CCCD Front"
                                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                    {t('adminUsersLabelFront')}
                                  </span>
                                </a>
                              )}
                              {selectedUser.identification.cardBackUrl && (
                                <a
                                  href={selectedUser.identification.cardBackUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="group relative block rounded-xl overflow-hidden border border-line"
                                >
                                  <img
                                    src={selectedUser.identification.cardBackUrl}
                                    alt="CCCD Back"
                                    className="w-full h-28 object-cover group-hover:scale-105 transition-transform"
                                  />
                                  <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded font-bold">
                                    {t('adminUsersLabelBack')}
                                  </span>
                                </a>
                              )}
                            </Form.Grid>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl bg-surface border border-line text-center text-xs text-muted">
                        {t('adminUsersNoKycDesc')}
                      </div>
                    )}
                  </div>

                  {/* Bank Account Details using Form.Grid */}
                  {selectedUser.bankAccount && (
                    <div className="space-y-2">
                      <Text as="h3" variant="heading" size="sm" className="font-extrabold text-foreground">
                        {t('adminUsersLabelBank')}
                      </Text>
                      <Form.Grid cols={3} gap="sm" className="p-4 rounded-2xl border border-line text-xs">
                        <div>
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersBankLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" className="text-foreground">
                            {selectedUser.bankAccount.bankName}
                          </Text>
                        </div>
                        <div>
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersAccountNoLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" className="font-mono text-foreground">
                            {selectedUser.bankAccount.accountNumber}
                          </Text>
                        </div>
                        <div>
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersAccountNameLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" className="text-foreground">
                            {selectedUser.bankAccount.accountName}
                          </Text>
                        </div>
                      </Form.Grid>
                    </div>
                  )}

                  {/* Properties Owned if landlord */}
                  {selectedUser.houseNames.length > 0 && (
                    <div className="space-y-2">
                      <Text as="h3" variant="heading" size="sm" className="font-extrabold text-foreground">
                        {t('adminUsersManagedHouses', { count: selectedUser.houseNames.length })}
                      </Text>
                      <div className="flex flex-wrap gap-2">
                        {selectedUser.houseNames.map((name, i) => (
                          <span
                            key={i}
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/30"
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            {name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : modalTab === 'activity' ? (
                /* TAB 2: System Activity Logs */
                <div className="space-y-4">
                  <Text as="h3" variant="heading" size="sm" className="font-extrabold text-foreground">
                    {t('adminUsersTabActivity')}
                  </Text>

                  {selectedUser.recentActivities.length === 0 ? (
                    <div className="p-8 rounded-2xl bg-surface border border-line text-center space-y-2">
                      <Activity className="w-8 h-8 text-zinc-300 mx-auto" />
                      <Text as="p" size="xs" weight="semibold" color="secondary">
                        {t('adminUsersNoActivity')}
                      </Text>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      {selectedUser.recentActivities.map(act => (
                        <div
                          key={act.id}
                          className="p-3.5 rounded-2xl bg-surface border border-line space-y-1.5 text-xs hover:bg-zinc-100/50 transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-900 text-white">
                                {act.action}
                              </span>
                              <Text as="span" size="xs" weight="bold" className="text-foreground">
                                {t('adminUsersTargetEntity')}: {act.entityType} ({act.entityId.slice(0, 8)}...)
                              </Text>
                            </div>
                            <span className="text-[11px] font-mono text-muted">
                              {formatJoinedDate(act.createdAt)}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] text-muted">
                            <span>
                              {t('adminUsersIpAddress')}: <span className="font-mono">{act.ipAddress}</span>
                            </span>
                            <span>{getRelativeTime(act.createdAt)}</span>
                          </div>

                          {act.newValue && (
                            <pre className="p-2 rounded-xl bg-card border border-line text-[10px] font-mono text-foreground/90 overflow-x-auto max-h-24">
                              {JSON.stringify(act.newValue, null, 2)}
                            </pre>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* TAB 3: Admin Actions using Form.Grid */
                <div className="space-y-4">
                  <Text as="h3" variant="heading" size="sm" className="font-extrabold text-foreground">
                    {t('adminUsersTabActions')}
                  </Text>
                  <Text as="p" size="xs" color="subtle">
                    {t('adminUsersActionNotice')}
                  </Text>

                  {!canModifyUser(selectedUser) && (
                    <div className="p-4 rounded-2xl bg-warning-soft border border-warning-subtle text-warning space-y-1">
                      <div className="flex items-center gap-2 font-bold text-sm text-warning">
                        <AlertTriangle className="w-4 h-4 text-warning shrink-0" />
                        <span>{t('adminUsersRootAdminProtectedTitle')}</span>
                      </div>
                      <Text as="p" size="xs" className="text-amber-800/90 leading-relaxed">
                        {t('adminUsersRootAdminProtectedDesc')}
                      </Text>
                    </div>
                  )}

                  <Form.Grid cols={2} gap="md" className="pt-2">
                    {/* Choice 1: Ban or Unban */}
                    {selectedUser.status === 'banned' ? (
                      <div className="p-4 rounded-2xl border border-success-subtle bg-success-soft space-y-2">
                        <div className="flex items-center gap-2 text-success font-extrabold text-sm">
                          <UserCheck className="w-4 h-4" />
                          <Text as="span" size="sm" weight="extrabold" color="inherit">
                            {t('adminUsersBtnUnban')}
                          </Text>
                        </div>
                        <Text as="p" size="xs" color="secondary" className="leading-relaxed">
                          {t('adminUsersUnbanDesc')}
                        </Text>
                        <Button fullWidth
                          type="button"
                          variant="primary"
                          size="sm"
                          onClick={() => handleOpenAction(selectedUser, 'unban')}
                          disabled={!canModifyUser(selectedUser)}
                          title={!canModifyUser(selectedUser) ? t('adminUsersRootAdminProtected') : undefined}
                          className="mt-1"
                        >
                          {t('adminUsersBtnUnban')}
                        </Button>
                      </div>
                    ) : (
                      <div className="p-4 rounded-2xl border border-danger-subtle bg-danger-soft space-y-2">
                        <div className="flex items-center gap-2 text-danger font-extrabold text-sm">
                          <UserX className="w-4 h-4" />
                          <Text as="span" size="sm" weight="extrabold" color="inherit">
                            {t('adminUsersBtnBan')}
                          </Text>
                        </div>
                        <Text as="p" size="xs" color="secondary" className="leading-relaxed">
                          {t('adminUsersBanDesc')}
                        </Text>
                        <Button fullWidth
                          type="button"
                          variant="danger"
                          size="sm"
                          onClick={() => handleOpenAction(selectedUser, 'ban')}
                          disabled={!canModifyUser(selectedUser)}
                          title={!canModifyUser(selectedUser) ? t('adminUsersRootAdminProtected') : undefined}
                          className="mt-1"
                        >
                          {t('adminUsersBtnBan')}
                        </Button>
                      </div>
                    )}

                    {/* Choice 2: Change Role */}
                    <div className="p-4 rounded-2xl border border-line bg-surface/50 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-extrabold text-sm">
                        <UserCog className="w-4 h-4 text-primary" />
                        <Text as="span" size="sm" weight="extrabold" color="inherit">
                          {t('adminUsersBtnChangeRole')}
                        </Text>
                      </div>
                      <Text as="p" size="xs" color="secondary" className="leading-relaxed">
                        {t('adminUsersRoleDesc')}
                      </Text>
                      <Button fullWidth
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAction(selectedUser, 'role')}
                        disabled={!canModifyUser(selectedUser)}
                        title={!canModifyUser(selectedUser) ? t('adminUsersRootAdminProtected') : undefined}
                        className="mt-1"
                      >
                        {t('adminUsersBtnChangeRole')}
                      </Button>
                    </div>

                    {/* Choice 3: Change Subscription Tier */}
                    <div className="p-4 rounded-2xl border border-deposit-subtle bg-deposit-soft space-y-2">
                      <div className="flex items-center gap-2 text-deposit font-extrabold text-sm">
                        <Crown className="w-4 h-4 text-deposit" />
                        <Text as="span" size="sm" weight="extrabold" color="inherit">
                          {t('adminUsersBtnChangeTier')}
                        </Text>
                      </div>
                      <Text as="p" size="xs" color="secondary" className="leading-relaxed">
                        {t('adminUsersTierDesc')}
                      </Text>
                      <Button fullWidth
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAction(selectedUser, 'tier')}
                        disabled={!canModifyUser(selectedUser)}
                        title={!canModifyUser(selectedUser) ? t('adminUsersRootAdminProtected') : undefined}
                        className="mt-1"
                      >
                        {t('adminUsersBtnChangeTier')}
                      </Button>
                    </div>

                    {/* Choice 4: Reset Password */}
                    <div className="p-4 rounded-2xl border border-line bg-surface/50 space-y-2">
                      <div className="flex items-center gap-2 text-foreground font-extrabold text-sm">
                        <KeyRound className="w-4 h-4 text-orange-500" />
                        <Text as="span" size="sm" weight="extrabold" color="inherit">
                          {t('adminUsersBtnResetPassword')}
                        </Text>
                      </div>
                      <Text as="p" size="xs" color="secondary" className="leading-relaxed">
                        {t('adminUsersResetPwdDesc')}
                      </Text>
                      <Button fullWidth
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenAction(selectedUser, 'reset-password')}
                        disabled={!canModifyUser(selectedUser)}
                        title={!canModifyUser(selectedUser) ? t('adminUsersRootAdminProtected') : undefined}
                        className="mt-1"
                      >
                        {t('adminUsersBtnResetPassword')}
                      </Button>
                    </div>
                  </Form.Grid>
                </div>
              )}
            </div>

            {/* Modal Footer using Form.Actions */}
            <div className="p-4 border-t border-line bg-surface/50">
              <Form.Actions align="end">
                <Button type="button" variant="outline" size="sm" onClick={requestCloseDetailModal} >
                  {t('adminUsersClose')}
                </Button>
              </Form.Actions>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN ACTION EXECUTION MODAL using Form root, SelectInput, TextInput, TextareaInput, Checkbox */}
      {actionType && actionTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card w-full max-w-lg rounded-3xl shadow-2xl border border-line overflow-hidden p-6">
            <Form variant="modal" autoPreventDefault onSubmit={handleExecuteAction}>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <Text as="h3" variant="heading" size="base" className="font-black text-foreground">
                    {actionType === 'ban' && t('adminUsersModalBanTitle')}
                    {actionType === 'unban' && t('adminUsersModalUnbanTitle')}
                    {actionType === 'role' && t('adminUsersModalRoleTitle')}
                    {actionType === 'reset-password' && t('adminUsersModalResetPassTitle')}
                    {actionType === 'tier' && t('adminUsersModalTierTitle')}
                  </Text>
                  <Text variant="caption" size="xs" color="subtle">
                    {actionType === 'ban' && t('adminUsersModalBanDesc')}
                    {actionType === 'unban' && t('adminUsersModalUnbanDesc')}
                    {actionType === 'role' && t('adminUsersModalRoleDesc')}
                    {actionType === 'reset-password' && t('adminUsersModalResetPassDesc')}
                    {actionType === 'tier' && t('adminUsersModalTierDesc')}
                  </Text>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={requestCloseActionModal}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Target user recap */}
              <div className="p-3 rounded-2xl bg-surface border border-line flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-line flex items-center justify-center font-bold text-foreground/90">
                  {actionTargetUser.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div>
                  <Text as="p" size="xs" weight="bold" className="text-foreground">
                    {actionTargetUser.fullName || actionTargetUser.username || actionTargetUser.phoneNumber}
                  </Text>
                  <Text as="p" variant="caption" size="2xs" color="subtle">
                    {actionTargetUser.phoneNumber}
                  </Text>
                </div>
              </div>

              {/* Reusing SelectInput for role change */}
              {actionType === 'role' && (
                <SelectInput
                  label={t('adminUsersSelectNewRole')}
                  value={newRole}
                  onChange={e => setNewRole(e.target.value)}
                  options={[
                    { value: 'tenant', label: t('adminUsersRoleTenant') },
                    { value: 'landlord', label: t('adminUsersRoleLandlord') },
                    { value: 'employee', label: t('adminUsersRoleStaff') },
                    { value: 'leasing_agent', label: t('adminUsersRoleAgent') },
                    { value: 'admin', label: t('adminUsersRoleAdmin') },
                  ]}
                  className="rounded-2xl"
                />
              )}

              {/* Reusing TextInput & Checkbox for password reset */}
              {actionType === 'reset-password' && (
                <div className="space-y-3">
                  <TextInput
                    label={t('adminUsersTempPassLabel')}
                    value={tempPassword}
                    onChange={e => setTempPassword(e.target.value)}
                    className="font-mono font-bold rounded-2xl"
                  />
                  <Checkbox
                    checked={forceChangePassword}
                    onChange={e => setForceChangePassword(e.target.checked)}
                    label={t('adminUsersForceChangeLabel')}
                    size="sm"
                  />
                </div>
              )}

              {/* Tier selection & duration */}
              {actionType === 'tier' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-foreground/90 mb-2">
                      {t('adminUsersSelectNewTier')}
                    </label>
                    <div className="grid grid-cols-3 gap-2.5">
                      {[
                        {
                          id: 'free' as const,
                          name: t('adminUsersTierBadgeFree'),
                          icon: Sparkles,
                          color: 'border-line text-foreground/90 hover:bg-card-hover',
                          activeColor: 'border-zinc-900 bg-zinc-900 text-white shadow-sm',
                        },
                        {
                          id: 'plus' as const,
                          name: t('adminUsersTierBadgePlus'),
                          icon: Sparkles,
                          color: 'border-deposit-subtle text-deposit hover:bg-purple-50',
                          activeColor: 'border-deposit bg-deposit text-white shadow-sm',
                        },
                        {
                          id: 'pro' as const,
                          name: t('adminUsersTierBadgePro'),
                          icon: Crown,
                          color: 'border-warning-subtle text-warning hover:bg-amber-50',
                          activeColor: 'border-warning bg-warning text-white shadow-sm',
                        },
                      ].map(tierOpt => {
                        const isSelected = newTier === tierOpt.id
                        const Icon = tierOpt.icon
                        return (
                          <button
                            key={tierOpt.id}
                            type="button"
                            onClick={() => setNewTier(tierOpt.id)}
                            className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 font-bold text-xs ${
                              isSelected ? tierOpt.activeColor : tierOpt.color
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span>{tierOpt.name}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {newTier === 'free' ? (
                    <div className="p-3 rounded-2xl bg-warning-soft border border-warning-subtle text-warning text-xs">
                      {t('adminUsersTierFreeNotice')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-foreground/90">
                        {t('adminUsersTierDurationLabel')}
                      </label>
                      <div className="flex items-center gap-2">
                        {[1, 3, 6, 12].map(m => (
                          <Button
                            key={m}
                            type="button"
                            variant={durationMonths === m ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => setDurationMonths(m)}
                            className="flex-1"
                          >
                            {t('adminUsersTierDurationMonths', { count: m })}
                          </Button>
                        ))}
                      </div>
                      <NumberInput
                        min={1}
                        max={60}
                        value={String(durationMonths)}
                        onChange={e => {
                          const v = parseInt(e.target.value, 10)
                          if (!isNaN(v) && v > 0) setDurationMonths(v)
                        }}
                        className="rounded-2xl text-xs font-bold mt-1"
                        placeholder={t('adminUsersTierDurationPlaceholder')}
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Reusing TextareaInput for justification reason */}
              <TextareaInput
                label={t('adminUsersReasonLabel')}
                rows={2}
                value={actionReason}
                onChange={e => setActionReason(e.target.value)}
                placeholder={t('adminUsersReasonPlaceholder')}
                className="rounded-2xl resize-none text-xs"
              />

              {/* Reusing Form.Actions base component */}
              <Form.Actions align="end" className="pt-2">
                <Button type="button" variant="outline" size="sm" onClick={requestCloseActionModal} disabled={actionSubmitting}>
                  {t('adminUsersCancelBtn')}
                </Button>
                <Button
                  type="submit"
                  variant={actionType === 'ban' ? 'danger' : 'primary'}
                  size="sm"
                  disabled={actionSubmitting}
                >
                  {actionSubmitting ? t('adminUsersProcessing') : t('adminUsersConfirmActionBtn')}
                </Button>
              </Form.Actions>
            </Form>
          </div>
        </div>
      )}

      {/* CONFIRMATION POP-UP MODAL (Rule 10: "Xác nhận đóng form" when unsaved changes exist) */}
      {showDiscardConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-card w-full max-w-sm rounded-3xl shadow-2xl border border-line p-6 space-y-4 text-center">
            <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto border border-warning-subtle">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <Text as="h3" variant="heading" size="base" className="font-black text-foreground">
                {t('adminUsersConfirmCloseTitle')}
              </Text>
              <Text variant="caption" size="xs" color="subtle">
                {t('adminUsersConfirmCloseDesc')}
              </Text>
            </div>

            <Form.Actions stackedOnMobile={false} className="gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowDiscardConfirm(false)}
                className="flex-1"
              >
                {t('adminUsersKeepEditing')}
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={handleConfirmDiscard}
                className="flex-1"
              >
                {t('adminUsersDiscardAndClose')}
              </Button>
            </Form.Actions>
          </div>
        </div>
      )}
    </div>
  )
}
