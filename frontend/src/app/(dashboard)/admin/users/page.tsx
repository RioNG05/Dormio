'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
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
  X,
  RefreshCw,
  Activity,
  UserCog,
  Crown,
  Sparkles,
  Lock,
} from 'lucide-react'
import {
  Button,
  TableActionButton,
  Text,
  Form,
  TextInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  NumberInput,
  Pagination,
  ViewModeToggle,
  Avatar,
  FilterToolbar,
  SearchInput,
  Card,
  TableRow,
  Modal,
  EmptyState,
} from '@/components/ui'
import { DashboardPageHeader } from '@/components/layout'

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
  const { toast } = useToast()

  // View mode (Rule 9: Grid view as default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // 6 for Grid, 10 for Table

  // Detail Modal state
  const [selectedUser, setSelectedUser] = useState<AdminUserDetail | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [modalTab, setModalTab] = useState<'profile' | 'activity' | 'actions'>('profile')

  // Admin Action Modal state
  const [actionTargetUser, setActionTargetUser] = useState<AdminUserItem | null>(null)
  const [actionType, setActionType] = useState<
    'ban' | 'unban' | 'role' | 'reset-password' | 'tier' | null
  >(null)
  const [actionReason, setActionReason] = useState('')
  const [newRole, setNewRole] = useState<string>('tenant')
  const [newTier, setNewTier] = useState<'free' | 'plus' | 'pro'>('free')
  const [durationMonths, setDurationMonths] = useState<number>(1)
  const [tempPassword, setTempPassword] = useState('Dormio@2026')
  const [forceChangePassword, setForceChangePassword] = useState(true)
  const [actionSubmitting, setActionSubmitting] = useState(false)

  // Unsaved Confirmation Modal (Rule 10)
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false)
  const [pendingCloseTarget, setPendingCloseTarget] = useState<'action' | 'detail' | null>(null)

  // Debounced search query
  const [debouncedSearch, setDebouncedSearch] = useState(searchQuery)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchQuery), 350)
    return () => clearTimeout(timer)
  }, [searchQuery])

  // Adjust view mode
  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    setPageSize(mode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }

  // Fetch users from API
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

  // Client-side filtering & pagination
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false
      if (statusFilter !== 'all' && u.status !== statusFilter) return false
      if (debouncedSearch.trim()) {
        const q = debouncedSearch.toLowerCase().trim()
        const matchName = (u.fullName || '').toLowerCase().includes(q)
        const matchUser = (u.username || '').toLowerCase().includes(q)
        const matchPhone = u.phoneNumber.includes(q)
        const matchEmail = (u.email || '').toLowerCase().includes(q)
        if (!matchName && !matchUser && !matchPhone && !matchEmail) return false
      }
      return true
    })
  }, [users, roleFilter, statusFilter, debouncedSearch])

  const totalItems = filteredUsers.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize))
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages)
  const validPageSize = Math.max(1, Number(pageSize) || (viewMode === 'grid' ? 6 : 10))

  const paginatedUsers = useMemo(() => {
    const start = (safeCurrentPage - 1) * validPageSize
    return filteredUsers.slice(start, start + validPageSize)
  }, [filteredUsers, safeCurrentPage, validPageSize])

  // Open User Detail
  const handleOpenDetail = async (
    user: AdminUserItem,
    initialTab: 'profile' | 'activity' | 'actions' = 'profile',
  ) => {
    setModalTab(initialTab)
    setDetailLoading(true)
    setSelectedUser(null)

    try {
      const detail = await adminUsersService.getUserDetail(user.id)
      setSelectedUser(detail)
    } catch (err: any) {
      console.error('Failed to load user detail:', err)
      toast.error(t('adminUsersLoadDetailError'))
    } finally {
      setDetailLoading(false)
    }
  }

  // Open Action Modal
  const handleOpenAction = (
    user: AdminUserItem,
    type: 'ban' | 'unban' | 'role' | 'reset-password' | 'tier',
  ) => {
    setActionTargetUser(user)
    setActionType(type)
    setActionReason('')
    setNewRole(user.role)
    const currentTier = (user.subscriptionPackage?.toLowerCase() as 'free' | 'plus' | 'pro') || 'free'
    setNewTier(currentTier)
    setDurationMonths(1)
    setTempPassword('Dormio@2026')
    setForceChangePassword(true)
  }

  // Check if root admin user
  const isRootAdminUser = (user: AdminUserItem | AdminUserDetail) => {
    return user.role === 'admin' && (user.username === 'admin' || user.phoneNumber === '0900000000')
  }

  const canModifyUser = (user: AdminUserItem | AdminUserDetail) => {
    if (isRootAdminUser(user)) {
      return false
    }
    return true
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
      toast.error(t('adminUsersRootAdminProtectedDesc'))
      setActionType(null)
      setActionTargetUser(null)
      return
    }

    setActionSubmitting(true)
    try {
      if (actionType === 'ban') {
        await adminUsersService.updateUserStatus(actionTargetUser.id, {
          status: 'banned',
          reason: actionReason || 'Vi phạm chính sách nền tảng',
        })
        toast.success(t('adminUsersBanSuccess'))
      } else if (actionType === 'unban') {
        await adminUsersService.updateUserStatus(actionTargetUser.id, {
          status: 'active',
          reason: actionReason || 'Đã kiểm tra và mở khóa tài khoản',
        })
        toast.success(t('adminUsersUnbanSuccess'))
      } else if (actionType === 'role') {
        await adminUsersService.updateUserRole(actionTargetUser.id, {
          role: newRole,
          reason: actionReason || 'Thay đổi phân quyền hệ thống',
        })
        toast.success(t('adminUsersRoleSuccess'))
      } else if (actionType === 'reset-password') {
        await adminUsersService.resetUserPassword(actionTargetUser.id, {
          temporaryPassword: tempPassword,
          mustChangePassword: forceChangePassword,
        })
        toast.success(t('adminUsersResetPassSuccess'))
      } else if (actionType === 'tier') {
        await adminUsersService.updateUserTier(actionTargetUser.id, {
          tier: newTier as 'free' | 'plus' | 'pro',
          durationMonths,
          reason: actionReason || 'Admin điều chỉnh gói tài khoản',
        })
        toast.success(t('adminUsersTierSuccess'))
      }

      setActionType(null)
      setActionTargetUser(null)
      fetchUsers(true)
      if (selectedUser?.id === actionTargetUser.id) {
        handleOpenDetail(actionTargetUser, modalTab)
      }
    } catch (err: any) {
      console.error('Action failed:', err)
      toast.error(err?.response?.data?.message || t('adminUsersActionError'))
    } finally {
      setActionSubmitting(false)
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
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-card-hover text-foreground/80 border border-line">
            {role}
          </span>
        )
    }
  }

  const getRootAdminBadge = () => {
    return (
      <span
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-zinc-900 text-amber-300 border border-amber-400/30 tracking-wider shadow-xs"
        title={t('adminUsersRootAdminProtected')}
      >
        <Lock className="w-3 h-3 text-amber-400" />
        Root Admin
      </span>
    )
  }

  const getTierBadge = (tier?: string | null) => {
    const normalized = (tier || 'free').toLowerCase()
    switch (normalized) {
      case 'pro':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-warning-soft text-warning border border-warning-subtle">
            <Crown className="w-3 h-3 text-warning" />
            PRO
          </span>
        )
      case 'plus':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase bg-deposit-soft text-deposit border border-deposit-subtle">
            <Sparkles className="w-3 h-3 text-deposit" />
            PLUS
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold text-muted bg-card-hover border border-line">
            FREE
          </span>
        )
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-success-soft text-success border border-success-subtle">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {t('adminUsersStatusActive')}
          </span>
        )
      case 'banned':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-danger-soft text-danger border border-danger-subtle ring-1 ring-red-400">
            <UserX className="w-3 h-3" />
            {t('adminUsersStatusBanned')}
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-card-hover text-muted border border-line">
            <Clock className="w-3 h-3" />
            {t('adminUsersStatusInactive')}
          </span>
        )
    }
  }

  const formatJoinedDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(d)
    } catch {
      return dateStr
    }
  }

  const getRelativeTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      const diffMs = Date.now() - d.getTime()
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

  return (
    <div className="space-y-6 pb-12">
      {/* Header using DashboardPageHeader with size='md' action buttons */}
      <DashboardPageHeader
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <Users className="w-3.5 h-3.5" />
              {t('adminUsersBadge')}
            </span>
            <Text as="span" variant="caption" size="2xs" color="subtle">
              • {t('adminUsersLiveDb')}
            </Text>
          </div>
        }
        title={t('adminUsersTitle')}
        subtitle={t('adminUsersSubtitle')}
        actions={
          <Button
            variant="outline"
            size="md"
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            leftIcon={<RefreshCw className={refreshing ? 'animate-spin' : ''} />}
            className="shrink-0"
          >
            {t('adminUsersRefresh')}
          </Button>
        }
      />

      {/* KPI Cards Grid */}
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

      {/* Filter Toolbar */}
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
              containerClassName="w-36"
            />

            <SelectInput
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: t('adminUsersStatusAll') },
                { value: 'active', label: t('adminUsersStatusActive') },
                { value: 'banned', label: t('adminUsersStatusBanned') },
                { value: 'inactive', label: t('adminUsersStatusInactive') },
              ]}
              containerClassName="w-36"
            />
          </>
        }
        viewMode={
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
        }
      />

      {/* Main Content: Parallel Grid & Table Views */}
      {viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default Grid view) */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-line p-5 space-y-4 animate-pulse"
              >
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-line rounded-full" />
                  <div className="space-y-1.5 flex-1">
                    <div className="h-4 bg-line rounded w-3/4" />
                    <div className="h-3 bg-line rounded w-1/2" />
                  </div>
                </div>
                <div className="h-8 bg-card-hover rounded-xl" />
              </div>
            ))}
          </div>
        ) : paginatedUsers.length === 0 ? (
          <EmptyState
            icon={<Users className="w-10 h-10 text-muted" />}
            title={t('adminUsersNoUsersFound')}
            description={t('adminUsersTryAdjustingFilters')}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedUsers.map(user => {
              return (
                <Card
                  key={user.id}
                  interactive
                  onClick={() => handleOpenDetail(user, 'profile')}
                  className="bg-card p-5 rounded-2xl border border-line shadow-xs hover:border-primary/50 transition-all duration-200 flex flex-col justify-between space-y-4 cursor-pointer"
                >
                  <div className="space-y-3">
                    {/* User Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <Avatar
                          src={user.avatarUrl}
                          name={user.fullName || user.username || user.phoneNumber}
                          size="md"
                          shape="rounded"
                          bordered
                        />
                        <div>
                          <div className="flex items-center gap-1.5">
                            <Text as="h3" size="sm" weight="extrabold" className="text-foreground group-hover:text-primary transition-colors">
                              {user.fullName || user.username || t('adminUsersUnidentified')}
                            </Text>
                            {user.isIdentityVerified && (
                              <span title={t('adminUsersVerified')}>
                                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                              </span>
                            )}
                          </div>
                          <Text variant="caption" size="2xs" color="subtle" className="font-mono">
                            @{user.username || user.phoneNumber}
                          </Text>
                        </div>
                      </div>

                      {getStatusBadge(user.status)}
                    </div>

                    {/* Roles & Subscription Tiers */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getRoleBadge(user.role)}
                      {getTierBadge(user.subscriptionPackage)}
                      {isRootAdminUser(user) && getRootAdminBadge()}
                    </div>

                    {/* Contact Info */}
                    <div className="p-3 rounded-xl bg-surface border border-line space-y-1.5 text-xs">
                      <div className="flex items-center gap-2 text-foreground">
                        <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="font-semibold">{user.phoneNumber}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted truncate">
                        <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate">{user.email || '---'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted">
                        <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>
                          {t('adminUsersLabelJoinedDate')}: {formatJoinedDate(user.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions (View button removed; clicking card opens detail modal) */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-2">
                    <span className="text-[11px] font-mono text-muted truncate">
                      ID: {user.id.slice(0, 8)}...
                    </span>

                    {canModifyUser(user) ? (
                      <div className="flex items-center gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAction(user, 'tier')}
                          leftIcon={<Crown className="w-3.5 h-3.5 text-warning" />}
                        >
                          {t('adminUsersBtnChangeTier')}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetail(user, 'actions')}
                          leftIcon={<UserCog className="w-3.5 h-3.5 text-primary" />}
                        >
                          {t('adminUsersTabActions')}
                        </Button>
                      </div>
                    ) : (
                      <span
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-warning bg-warning-soft px-2 py-0.5 rounded-lg border border-warning-subtle"
                        title={t('adminUsersRootAdminProtected')}
                      >
                        <Lock className="w-3 h-3 text-warning" />
                        Protected
                      </span>
                    )}
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW (Row click navigates/inspects; view button removed) */
        <div className="bg-card rounded-2xl border border-line shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-surface/80 border-b border-line text-muted uppercase text-[11px] font-extrabold tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">{t('adminUsersColUser')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColContact')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColRoleTier')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColStatus')}</th>
                  <th className="py-3.5 px-4">{t('adminUsersColJoined')}</th>
                  <th className="py-3.5 px-4 text-right">{t('adminUsersColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-foreground/90">
                {paginatedUsers.map(user => {
                  return (
                    <TableRow
                      key={user.id}
                      interactive
                      onClick={() => handleOpenDetail(user, 'profile')}
                    >
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
                              <Text as="span" size="xs" weight="extrabold" className="text-foreground group-hover:text-primary transition-colors">
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
                            {user.email || '---'}
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
                          {canModifyUser(user) ? (
                            <>
                              <TableActionButton
                                icon={<Crown />}
                                title={t('adminUsersBtnChangeTier')}
                                onClick={() => handleOpenAction(user, 'tier')}
                              />
                              <TableActionButton
                                icon={<UserCog />}
                                title={t('adminUsersTabActions')}
                                onClick={() => handleOpenDetail(user, 'actions')}
                              />
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
                    </TableRow>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Pagination Bar */}
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

      {/* USER DETAIL MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(selectedUser || detailLoading)}
        onClose={requestCloseDetailModal}
        size="4xl"
        icon={<Users className="w-5 h-5 text-primary" />}
        title={
          selectedUser
            ? t('adminUsersModalTitle', {
                name: selectedUser.fullName || selectedUser.username || selectedUser.phoneNumber,
              })
            : t('adminUsersLoadingProfile')
        }
        description={selectedUser ? `ID: ${selectedUser.id}` : undefined}
        footer={
          <Button variant="outline" size="md" onClick={requestCloseDetailModal}>
            {t('adminUsersClose')}
          </Button>
        }
      >
        {selectedUser && (
          <div className="space-y-5">
            {/* Modal Tab Switcher */}
            <div className="flex border-b border-line gap-2 pb-2">
              <Button
                variant={modalTab === 'profile' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setModalTab('profile')}
                leftIcon={<Users className="w-4 h-4" />}
              >
                {t('adminUsersTabProfile')}
              </Button>
              <Button
                variant={modalTab === 'activity' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setModalTab('activity')}
                leftIcon={<Activity className="w-4 h-4" />}
              >
                {t('adminUsersTabActivity')}
              </Button>
              <Button
                variant={modalTab === 'actions' ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setModalTab('actions')}
                leftIcon={<UserCog className="w-4 h-4" />}
              >
                {t('adminUsersTabActions')}
              </Button>
            </div>

            {/* Modal Content */}
            {detailLoading ? (
              <div className="py-16 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-primary animate-spin mx-auto" />
                <Text variant="body" size="sm" weight="bold" color="secondary">
                  {t('adminUsersRetrieving')}
                </Text>
              </div>
            ) : modalTab === 'profile' ? (
              /* TAB 1: Profile & KYC Details */
              <div className="space-y-6">
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
                        @{selectedUser.username || '---'}
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
                        {selectedUser.email || '---'}
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
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenAction(selectedUser, 'tier')}
                            title={t('adminUsersBtnChangeTier')}
                            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                          >
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

                {/* Identity & KYC Verification */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Text as="h3" variant="heading" size="sm" className="font-extrabold text-foreground">
                      {t('adminUsersLabelKyc')}
                    </Text>
                    {selectedUser.isIdentityVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('adminUsersVerified')}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-muted bg-card-hover px-2.5 py-0.5 rounded-full border border-line">
                        <AlertTriangle className="w-3.5 h-3.5 text-muted" />
                        {t('adminUsersUnverified')}
                      </span>
                    )}
                  </div>

                  {selectedUser.identification ? (
                    <div className="p-4 rounded-2xl bg-surface border border-line space-y-3">
                      <Form.Grid cols={3} gap="sm" className="text-xs">
                        <div>
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersCccdLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" className="font-mono text-foreground">
                            {selectedUser.identification.identityNumber || '---'}
                          </Text>
                        </div>
                        <div>
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersBirthLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" className="text-foreground">
                            {selectedUser.identification.dateOfBirth
                              ? formatJoinedDate(selectedUser.identification.dateOfBirth)
                              : '---'}
                          </Text>
                        </div>
                        <div>
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersHometownLabel')}
                          </Text>
                          <Text as="span" size="xs" weight="bold" className="text-foreground">
                            {typeof selectedUser.identification.placeOfOrigin === 'string'
                              ? selectedUser.identification.placeOfOrigin
                              : selectedUser.identification.placeOfOrigin?.rawAddress || '---'}
                          </Text>
                        </div>
                      </Form.Grid>

                      {(selectedUser.identification.cardFrontUrl || selectedUser.identification.cardBackUrl) && (
                        <div className="space-y-1.5 pt-2 border-t border-line">
                          <Text as="span" size="2xs" color="subtle" className="block">
                            {t('adminUsersPhotosLabel')}
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

                {/* Bank Account Details */}
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
                    <Activity className="w-8 h-8 text-muted mx-auto" />
                    <Text as="p" size="xs" weight="semibold" color="secondary">
                      {t('adminUsersNoActivity')}
                    </Text>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-96 overflow-y-auto">
                    {selectedUser.recentActivities.map(act => (
                      <div
                        key={act.id}
                        className="p-3.5 rounded-2xl bg-surface border border-line space-y-1.5 text-xs hover:bg-card-hover transition-colors"
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
              /* TAB 3: Admin Actions */
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
                    <Text as="p" size="xs" className="leading-relaxed">
                      {t('adminUsersRootAdminProtectedDesc')}
                    </Text>
                  </div>
                )}

                <Form.Grid cols={2} gap="md" className="pt-2">
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
                      <Button
                        fullWidth
                        size="md"
                        onClick={() => handleOpenAction(selectedUser, 'unban')}
                        disabled={!canModifyUser(selectedUser)}
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
                      <Button
                        fullWidth
                        size="md"
                        variant="danger"
                        onClick={() => handleOpenAction(selectedUser, 'ban')}
                        disabled={!canModifyUser(selectedUser)}
                        className="mt-1"
                      >
                        {t('adminUsersBtnBan')}
                      </Button>
                    </div>
                  )}

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
                    <Button
                      fullWidth
                      size="md"
                      variant="outline"
                      onClick={() => handleOpenAction(selectedUser, 'role')}
                      disabled={!canModifyUser(selectedUser)}
                      className="mt-1"
                    >
                      {t('adminUsersBtnChangeRole')}
                    </Button>
                  </div>

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
                    <Button
                      fullWidth
                      size="md"
                      variant="outline"
                      onClick={() => handleOpenAction(selectedUser, 'tier')}
                      disabled={!canModifyUser(selectedUser)}
                      className="mt-1"
                    >
                      {t('adminUsersBtnChangeTier')}
                    </Button>
                  </div>

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
                    <Button
                      fullWidth
                      size="md"
                      variant="outline"
                      onClick={() => handleOpenAction(selectedUser, 'reset-password')}
                      disabled={!canModifyUser(selectedUser)}
                      className="mt-1"
                    >
                      {t('adminUsersBtnResetPassword')}
                    </Button>
                  </div>
                </Form.Grid>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ADMIN ACTION EXECUTION MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(actionType && actionTargetUser)}
        onClose={requestCloseActionModal}
        size="lg"
        title={
          actionType === 'ban'
            ? t('adminUsersModalBanTitle')
            : actionType === 'unban'
              ? t('adminUsersModalUnbanTitle')
              : actionType === 'role'
                ? t('adminUsersModalRoleTitle')
                : actionType === 'reset-password'
                  ? t('adminUsersModalResetPassTitle')
                  : t('adminUsersModalTierTitle')
        }
        description={actionTargetUser ? `${actionTargetUser.fullName || actionTargetUser.username} (${actionTargetUser.phoneNumber})` : undefined}
        asForm
        onSubmit={handleExecuteAction}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={requestCloseActionModal}
              disabled={actionSubmitting}
            >
              {t('adminUsersCancelBtn')}
            </Button>
            <Button
              type="submit"
              size="md"
              variant={actionType === 'ban' ? 'danger' : 'primary'}
              disabled={actionSubmitting}
              isLoading={actionSubmitting}
            >
              {actionSubmitting ? t('adminUsersProcessing') : t('adminUsersConfirmActionBtn')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
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
            />
          )}

          {actionType === 'reset-password' && (
            <div className="space-y-3">
              <TextInput
                label={t('adminUsersTempPassLabel')}
                value={tempPassword}
                onChange={e => setTempPassword(e.target.value)}
                className="font-mono font-bold"
              />
              <Checkbox
                checked={forceChangePassword}
                onChange={e => setForceChangePassword(e.target.checked)}
                label={t('adminUsersForceChangeLabel')}
                size="sm"
              />
            </div>
          )}

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
                        size="sm"
                        variant={durationMonths === m ? 'primary' : 'outline'}
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
                    placeholder={t('adminUsersTierDurationPlaceholder')}
                  />
                </div>
              )}
            </div>
          )}

          <TextareaInput
            label={t('adminUsersReasonLabel')}
            rows={2}
            value={actionReason}
            onChange={e => setActionReason(e.target.value)}
            placeholder={t('adminUsersReasonPlaceholder')}
          />
        </div>
      </Modal>

      {/* CONFIRMATION POP-UP MODAL (Rule 10) */}
      <Modal
        isOpen={showDiscardConfirm}
        onClose={() => setShowDiscardConfirm(false)}
        size="sm"
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        title={t('adminUsersConfirmCloseTitle')}
        footer={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => setShowDiscardConfirm(false)}
            >
              {t('adminUsersKeepEditing')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmDiscard}
            >
              {t('adminUsersDiscardAndClose')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {t('adminUsersConfirmCloseDesc')}
        </p>
      </Modal>
    </div>
  )
}

