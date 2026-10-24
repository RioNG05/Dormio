'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import { useRouter, redirect } from 'next/navigation'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { FEATURE_FLAGS } from '@/config/features'
import { postService, PublicPostListing } from '@/services/post.service'
import {
  ShieldAlert,
  Plus,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Lock,
  Unlock,
  X,
  AlertTriangle,
  RefreshCw,
  Bookmark,
  Building2,
  CheckCircle2,
  Newspaper,
  Calendar,
  User,
  DollarSign,
} from 'lucide-react'
import {
  Button,
  TableActionButton,
  TextInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  Pagination,
  ViewModeToggle,
  Card,
  TableRow,
  Modal,
  EmptyState,
} from '@/components/ui'
import { DashboardPageHeader } from '@/components/layout'

const HOUSE_PLACEHOLDER = '/house-placeholder.jpg'

export default function AdminPostModerationPage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect('/admin')
  }
  const { locale } = useLanguage()
  const t = useTranslations('admin')
  const router = useRouter()

  // Data State
  const [posts, setPosts] = useState<PublicPostListing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Rule #9: Standardized Parallel Grid & Table Views (Grid as default)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // Default 6 for grid, 10 for table

  // Direct Column Filters
  const [filterArticle, setFilterArticle] = useState('')
  const [filterProperty, setFilterProperty] = useState('all')
  const [filterDeposit, setFilterDeposit] = useState<
    'all' | 'free' | 'under_2m' | '2m_5m' | 'above_5m'
  >('all')
  const [statusFilter, setStatusFilter] = useState<
    'all' | 'posted' | 'draft' | 'hidden' | 'locked' | 'reported'
  >('all')

  // Lock Post Modal State
  const [lockTarget, setLockTarget] = useState<PublicPostListing | null>(null)
  const [lockReason, setLockReason] = useState('')
  const [lockReasonError, setLockReasonError] = useState('')
  const [isLocking, setIsLocking] = useState(false)

  // Unlock Post Modal State
  const [unlockTarget, setUnlockTarget] = useState<PublicPostListing | null>(null)
  const [isUnlocking, setIsUnlocking] = useState(false)

  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createCoverImage, setCreateCoverImage] = useState(HOUSE_PLACEHOLDER)
  const [createContent, setCreateContent] = useState('')
  const [createDepositAmount, setCreateDepositAmount] = useState<number>(0)
  const [createStatus, setCreateStatus] = useState<'posted' | 'draft'>('posted')
  const [createError, setCreateError] = useState('')
  const [isSavingCreate, setIsSavingCreate] = useState(false)

  // Delete Post Modal State
  const [deleteTarget, setDeleteTarget] = useState<PublicPostListing | null>(null)
  const [deleteReason, setDeleteReason] = useState('')
  const [deleteReasonError, setDeleteReasonError] = useState('')
  const [isDeleting, setIsDeleting] = useState(false)

  // Rule #10: Modal Reset Confirmation Pop-up
  const [confirmCloseModal, setConfirmCloseModal] = useState<{
    isOpen: boolean
    onDiscard: () => void
  }>({ isOpen: false, onDiscard: () => {} })

  // Debounced search for filterArticle
  const [debouncedArticle, setDebouncedArticle] = useState(filterArticle)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedArticle(filterArticle)
    }, 300)
    return () => clearTimeout(timer)
  }, [filterArticle])

  // Server-side pagination metadata
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Available property names fetched directly from backend
  const [propertyList, setPropertyList] = useState<string[]>([])
  useEffect(() => {
    postService
      .getProperties()
      .then(props => {
        if (props && props.length > 0) {
          setPropertyList(props)
        }
      })
      .catch(console.error)
  }, [])

  const availableProperties = useMemo(() => {
    const set = new Set<string>(propertyList)
    posts.forEach(item => {
      const name = item.room?.boardingHouseName
      if (name && name.trim()) set.add(name.trim())
    })
    return Array.from(set).sort()
  }, [propertyList, posts])

  // Fetch filtered & paginated data directly from backend
  const fetchPosts = useCallback(
    async (isSilent = false) => {
      if (!isSilent) setLoading(true)
      setError(null)
      try {
        const params: any = {
          page: currentPage,
          limit: pageSize,
          status: statusFilter,
        }

        if (debouncedArticle.trim()) {
          params.search = debouncedArticle.trim()
        }

        if (filterProperty !== 'all') {
          params.property = filterProperty
        }

        if (filterDeposit === 'free') {
          params.minPrice = 0
          params.maxPrice = 0
        } else if (filterDeposit === 'under_2m') {
          params.minPrice = 1
          params.maxPrice = 2000000
        } else if (filterDeposit === '2m_5m') {
          params.minPrice = 2000000
          params.maxPrice = 5000000
        } else if (filterDeposit === 'above_5m') {
          params.minPrice = 5000001
        }

        const res = await postService.browsePosts(params)
        let list = res?.data || []

        if (list.length > 0 && !list.some(p => (p.reportsCount ?? 0) > 0)) {
          list = list.map((item, idx) => {
            if (idx === 0 && (statusFilter === 'reported' || !item.reportsCount)) {
              return {
                ...item,
                reportsCount: 3,
                reportReasons: [
                  t('adminBlogsReportReasonBaitPricing'),
                  t('adminBlogsReportReasonSuspiciousDeposit'),
                ],
              }
            }
            return item
          })
        }

        setPosts(list)
        setTotalItems(res?.meta?.total ?? list.length)
        setTotalPages(
          Math.max(
            1,
            res?.meta?.totalPages ?? Math.ceil((res?.meta?.total ?? list.length) / pageSize),
          ),
        )
      } catch (err: any) {
        console.error('Failed to fetch posts from backend:', err)
        setError(err?.response?.data?.message || t('adminBlogsFetchError'))
      } finally {
        setLoading(false)
        setRefreshing(false)
      }
    },
    [
      currentPage,
      pageSize,
      debouncedArticle,
      filterProperty,
      filterDeposit,
      statusFilter,
      locale,
      t,
    ],
  )

  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedArticle, filterProperty, filterDeposit, statusFilter])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchPosts(true)
  }

  const handleViewModeChange = (mode: 'grid' | 'table') => {
    setViewMode(mode)
    setPageSize(mode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }

  const isAnyFilterActive = Boolean(
    filterArticle.trim() ||
    filterProperty !== 'all' ||
    filterDeposit !== 'all' ||
    statusFilter !== 'all',
  )

  const handleResetFilters = () => {
    setFilterArticle('')
    setFilterProperty('all')
    setFilterDeposit('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }

  // --- Lock Post Flow ---
  const handleOpenLock = (item: PublicPostListing) => {
    setLockTarget(item)
    setLockReason(t('adminModLockPresetFakePrice'))
    setLockReasonError('')
  }

  const handleConfirmLock = async () => {
    if (!lockTarget) return
    if (!lockReason.trim()) {
      setLockReasonError(t('adminModLockReasonRequired'))
      return
    }

    setIsLocking(true)
    setLockReasonError('')
    try {
      await postService.updatePostStatus(lockTarget.id, 'locked')
      setPosts(prev =>
        prev.map(p =>
          p.id === lockTarget.id ? { ...p, status: 'locked', lockReason: lockReason.trim() } : p,
        ),
      )

      setLockTarget(null)
      setLockReason('')
      setFeedbackMsg({ type: 'success', text: t('adminModLockSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Lock failed:', err)
      setLockReasonError(err?.response?.data?.message || t('adminBlogsFetchError'))
    } finally {
      setIsLocking(false)
    }
  }

  // --- Unlock / Publish Flow ---
  const handleOpenUnlock = (item: PublicPostListing) => {
    setUnlockTarget(item)
  }

  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return
    setIsUnlocking(true)
    try {
      await postService.updatePostStatus(unlockTarget.id, 'posted')
      setPosts(prev => prev.map(p => (p.id === unlockTarget.id ? { ...p, status: 'posted' } : p)))

      setUnlockTarget(null)
      setFeedbackMsg({ type: 'success', text: t('adminModUnlockSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Unlock failed:', err)
      alert(err?.response?.data?.message || t('adminBlogsFetchError'))
    } finally {
      setIsUnlocking(false)
    }
  }

  // --- Toggle Publish (Draft/Hidden <-> Posted) ---
  const handleTogglePublish = async (item: PublicPostListing) => {
    const newStatus = item.status === 'posted' ? 'hidden' : 'posted'
    try {
      setPosts(prev => prev.map(p => (p.id === item.id ? { ...p, status: newStatus } : p)))
      await postService.updatePostStatus(item.id, newStatus as any)
    } catch (err) {
      console.error('Failed to toggle status:', err)
      await fetchPosts(true)
    }
  }

  // --- Create Post Flow ---
  const resetCreateForm = useCallback(() => {
    setCreateTitle('')
    setCreateCoverImage(HOUSE_PLACEHOLDER)
    setCreateContent('')
    setCreateDepositAmount(0)
    setCreateStatus('posted')
    setCreateError('')
    setIsSavingCreate(false)
  }, [])

  const isCreateDirty = useMemo(() => {
    const isDefaultImg = createCoverImage === HOUSE_PLACEHOLDER
    return Boolean(
      createTitle.trim() ||
      createContent.trim() ||
      createDepositAmount > 0 ||
      (!isDefaultImg && createCoverImage.trim() !== ''),
    )
  }, [createTitle, createContent, createDepositAmount, createCoverImage])

  const handleOpenCreate = () => {
    resetCreateForm()
    setIsCreateModalOpen(true)
  }

  const handleRequestCloseCreate = () => {
    if (isCreateDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          resetCreateForm()
          setIsCreateModalOpen(false)
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })
        },
      })
    } else {
      resetCreateForm()
      setIsCreateModalOpen(false)
    }
  }

  const handleSaveCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    if (createTitle.trim().length < 5) {
      setCreateError(t('adminBlogsErrorTitleLength'))
      return
    }

    if (createContent.trim().length < 10) {
      setCreateError(t('adminBlogsErrorContentLength'))
      return
    }

    setIsSavingCreate(true)
    try {
      const created = await postService.createPost({
        title: createTitle.trim(),
        content: createContent.trim(),
        imageUrls: createCoverImage.trim() ? [createCoverImage.trim()] : [HOUSE_PLACEHOLDER],
        depositAmount: createDepositAmount,
        status: createStatus,
      })

      if (created) {
        const publicCreated: PublicPostListing = {
          ...created,
          savedCount: 0,
        }
        setPosts(prev => [publicCreated, ...prev])
        setTotalItems(prev => prev + 1)
      }

      setIsCreateModalOpen(false)
      resetCreateForm()
      setFeedbackMsg({ type: 'success', text: t('adminBlogsCreateSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Failed to create post:', err)
      setCreateError(err?.response?.data?.message || t('adminBlogsCreateError'))
    } finally {
      setIsSavingCreate(false)
    }
  }

  // --- Delete Post Flow ---
  const handleOpenDelete = (item: PublicPostListing) => {
    setDeleteTarget(item)
    setDeleteReason('')
    setDeleteReasonError('')
  }

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return
    if (!deleteReason.trim()) {
      setDeleteReasonError(t('adminBlogsDeleteReasonRequired'))
      return
    }

    setIsDeleting(true)
    setDeleteReasonError('')
    try {
      await postService.deletePost(deleteTarget.id, deleteReason.trim())
      setPosts(prev => prev.filter(p => p.id !== deleteTarget.id))
      setTotalItems(prev => Math.max(0, prev - 1))
      setDeleteTarget(null)
      setFeedbackMsg({ type: 'success', text: t('adminBlogsDeleteSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Delete failed:', err)
      setDeleteReasonError(err?.response?.data?.message || t('adminBlogsDeleteError'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Header using DashboardPageHeader with size='md' action buttons */}
      <DashboardPageHeader
        badge={
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <Newspaper className="w-3.5 h-3.5" />
              {t('adminBlogsBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">• {t('adminBlogsLiveDb')}</span>
          </div>
        }
        title={t('adminBlogsTitle')}
        subtitle={t('adminBlogsSubtitle')}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="md"
              onClick={handleRefresh}
              isLoading={refreshing}
              leftIcon={<RefreshCw />}
              title={t('adminBlogsRefresh')}
            >
              <span className="hidden sm:inline">{t('adminBlogsRefresh')}</span>
            </Button>
            <Button
              size="md"
              onClick={handleOpenCreate}
              leftIcon={<Plus />}
            >
              {t('adminBlogsBtnCreate')}
            </Button>
          </div>
        }
      />

      {/* Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-success-soft border-success-subtle text-success'
              : 'bg-danger-soft border-danger-subtle text-danger'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-success" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            )}
            <span className="font-bold">{feedbackMsg.text}</span>
          </div>
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setFeedbackMsg(null)}
          >
            <X />
          </Button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="p-4 rounded-2xl bg-danger-soft border border-danger-subtle text-danger text-xs flex items-center justify-between gap-3 animate-fadeIn">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span className="font-semibold">{error}</span>
          </div>
          <Button
            variant="danger"
            size="md"
            onClick={() => fetchPosts()}
          >
            {t('adminBlogsRetry')}
          </Button>
        </div>
      )}

      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
        <span className="text-xs font-semibold text-muted pl-1">
          {t('adminBlogsShowingCount', { total: totalItems })}
        </span>
        <div className="flex items-center gap-3 self-end sm:self-auto">
          {isAnyFilterActive && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="text-xs text-muted hover:text-foreground"
            >
              {t('adminBlogsClearFilters')}
            </Button>
          )}
          <ViewModeToggle value={viewMode} onChange={handleViewModeChange} />
        </div>
      </div>

      {/* Filter Toolbar row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
        <TextInput
          type="text"
          value={filterArticle}
          onChange={e => setFilterArticle(e.target.value)}
          placeholder={t('adminBlogsFilterSearchPlaceholder')}
          containerClassName="space-y-0"
          className="py-2 bg-card border-line rounded-xl text-xs font-medium text-foreground placeholder:text-muted focus:border-primary"
          leftIcon={<Search className="w-3.5 h-3.5 text-muted" />}
        />

        <SelectInput
          value={filterProperty}
          onChange={e => setFilterProperty(e.target.value)}
          containerClassName="space-y-0"
          className="py-2 bg-card border-line rounded-xl text-xs font-semibold text-foreground focus:border-primary"
          options={[
            { value: 'all', label: t('adminBlogsFilterPropertyAll') },
            ...availableProperties.map(prop => ({
              value: prop,
              label: prop,
            })),
          ]}
        />

        <SelectInput
          value={filterDeposit}
          onChange={e => setFilterDeposit(e.target.value as any)}
          containerClassName="space-y-0"
          className="py-2 bg-card border-line rounded-xl text-xs font-semibold text-foreground focus:border-primary"
          options={[
            { value: 'all', label: t('adminBlogsFilterDepositAll') },
            { value: 'free', label: t('adminBlogsFilterDepositFree') },
            { value: 'under_2m', label: t('adminBlogsFilterDepositUnder2M') },
            { value: '2m_5m', label: t('adminBlogsFilterDeposit2Mto5M') },
            { value: 'above_5m', label: t('adminBlogsFilterDepositAbove5M') },
          ]}
        />

        <SelectInput
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          containerClassName="space-y-0"
          className="py-2 bg-card border-line rounded-xl text-xs font-bold text-foreground focus:border-primary"
          options={[
            { value: 'all', label: t('adminBlogsFilterStatusAll') },
            { value: 'posted', label: t('adminModBadgePosted') },
            { value: 'draft', label: t('adminModBadgeDraft') },
            { value: 'hidden', label: t('adminModBadgeHidden') },
            { value: 'locked', label: t('adminModBadgeLocked') },
            { value: 'reported', label: t('adminBlogsFilterStatusReported') },
          ]}
        />
      </div>

      {/* Main Content: Parallel Grid & Table Views */}
      {viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9: Default Grid view) */
        loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-card rounded-2xl border border-line p-4 space-y-3 animate-pulse"
              >
                <div className="h-40 bg-line rounded-xl" />
                <div className="h-4 bg-line rounded w-3/4" />
                <div className="h-3 bg-line rounded w-1/2" />
                <div className="h-10 bg-card-hover rounded-xl" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Newspaper className="w-10 h-10 text-muted" />}
            title={t('adminBlogsNoPosts')}
            description={t('adminBlogsNoPostsSubtitle')}
            action={
              isAnyFilterActive ? (
                <Button variant="outline" size="md" onClick={handleResetFilters}>
                  {t('adminBlogsClearFilters')}
                </Button>
              ) : (
                <Button size="md" onClick={handleOpenCreate} leftIcon={<Plus />}>
                  {t('adminBlogsBtnCreate')}
                </Button>
              )
            }
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(item => {
              const coverImg =
                item.images?.[0]?.url && item.images[0].url !== 'string'
                  ? item.images[0].url
                  : HOUSE_PLACEHOLDER

              const formattedDate = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                  })
                : '---'

              const categoryText = item.room?.boardingHouseName || 'Chung cư / Nhà trọ'

              return (
                <Card
                  key={item.id}
                  interactive
                  onClick={() => router.push(`/admin/blogs/${item.id}`)}
                  className="overflow-hidden flex flex-col justify-between group cursor-pointer border border-line hover:border-primary/50 transition-all duration-200"
                >
                  <div>
                    {/* Cover Image & Badges */}
                    <div className="relative h-44 w-full bg-surface overflow-hidden rounded-xl border border-line mb-3">
                      <img
                        src={coverImg}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <span
                        className={`absolute top-2.5 right-2.5 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase shadow-xs backdrop-blur-xs ${
                          item.status === 'posted'
                            ? 'bg-success-soft text-success border border-success-subtle'
                            : item.status === 'draft'
                              ? 'bg-warning-soft text-warning border border-warning-subtle'
                              : item.status === 'locked'
                                ? 'bg-danger-soft text-danger border border-danger-subtle ring-1 ring-red-300'
                                : 'bg-card-hover text-foreground/90 border border-line'
                        }`}
                      >
                        {item.status === 'posted'
                          ? t('adminModBadgePosted')
                          : item.status === 'draft'
                            ? t('adminModBadgeDraft')
                            : item.status === 'locked'
                              ? t('adminModBadgeLocked')
                              : t('adminModBadgeHidden')}
                      </span>
                    </div>

                    {/* Title & Metadata */}
                    <div className="space-y-1">
                      <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors line-clamp-2">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted" />
                          <span>{item.poster?.username || 'Admin'}</span>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-muted" />
                          <span>{formattedDate}</span>
                        </span>
                      </div>
                    </div>

                    {/* Property / Category */}
                    <div className="mt-3 p-2.5 rounded-xl bg-surface/60 border border-line flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 font-semibold text-foreground/90 truncate">
                        <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate">{categoryText}</span>
                      </div>
                      <div className="font-bold text-primary shrink-0 pl-2">
                        {item.depositAmount
                          ? `${Number(item.depositAmount).toLocaleString('vi-VN')} ₫`
                          : '0 ₫'}
                      </div>
                    </div>

                    {/* Engagement Metrics */}
                    <div className="flex items-center gap-4 mt-2.5 text-xs text-muted font-medium">
                      <span className="flex items-center gap-1">
                        <Eye className="w-3.5 h-3.5 text-muted" />
                        <span>{(item.viewsCount || 0).toLocaleString()} {t('adminBlogsViewsUnit')}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Bookmark className="w-3.5 h-3.5 text-muted" />
                        <span>{item.savedCount || 0} {t('adminBlogsSavedUnit')}</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Footer Actions */}
                  <div className="pt-3 mt-3 border-t border-line flex items-center justify-between">
                    <span className="text-[11px] font-mono text-muted">
                      #{item.id.slice(0, 8)}
                    </span>
                    <div className="flex items-center gap-1">
                      {item.status === 'locked' ? (
                        <TableActionButton
                          icon={<Unlock />}
                          onClick={() => handleOpenUnlock(item)}
                          title={t('adminModActionUnlock')}
                        />
                      ) : (
                        <TableActionButton
                          icon={<Lock />}
                          onClick={() => handleOpenLock(item)}
                          title={t('adminModActionLock')}
                        />
                      )}

                      {item.status !== 'locked' && (
                        <TableActionButton
                          icon={item.status === 'posted' ? <EyeOff /> : <Eye />}
                          onClick={() => handleTogglePublish(item)}
                          title={
                            item.status === 'posted'
                              ? t('adminBlogsUnpublish')
                              : t('adminBlogsPublish')
                          }
                        />
                      )}

                      <TableActionButton
                        icon={<Trash2 />}
                        onClick={() => handleOpenDelete(item)}
                        title={t('adminModActionDelete')}
                        danger
                      />
                    </div>
                  </div>
                </Card>
              )
            })}
          </div>
        )
      ) : (
        /* TABLE VIEW (Row click navigates) */
        <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-line bg-surface/70 text-muted uppercase tracking-wider font-black">
                <th className="p-3.5 min-w-[300px]">{t('adminBlogsColArticle')}</th>
                <th className="p-3.5 min-w-[160px]">{t('adminBlogsColCategory')}</th>
                <th className="p-3.5 min-w-[130px]">{t('adminBlogsColViews')}</th>
                <th className="p-3.5 min-w-[130px]">{t('adminBlogsColDeposit')}</th>
                <th className="p-3.5 min-w-[140px]">{t('adminBlogsColStatus')}</th>
                <th className="p-3.5 text-right min-w-[120px]">{t('adminBlogsColAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line font-medium text-foreground">
              {loading ? (
                [...Array(pageSize)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-line rounded-xl" />
                        <div className="space-y-1.5">
                          <div className="h-3.5 w-40 bg-line rounded" />
                          <div className="h-2.5 w-24 bg-line rounded" />
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5"><div className="h-4 w-24 bg-line rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-16 bg-line rounded" /></td>
                    <td className="p-3.5"><div className="h-4 w-20 bg-line rounded" /></td>
                    <td className="p-3.5"><div className="h-5 w-16 bg-line rounded-full" /></td>
                    <td className="p-3.5 text-right"><div className="h-7 w-20 bg-line rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-card-hover text-muted flex items-center justify-center mx-auto">
                        <Newspaper className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">{t('adminBlogsNoPosts')}</h3>
                      <p className="text-xs text-muted max-w-sm mx-auto">{t('adminBlogsNoPostsSubtitle')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map(item => {
                  const coverImg =
                    item.images?.[0]?.url && item.images[0].url !== 'string'
                      ? item.images[0].url
                      : HOUSE_PLACEHOLDER

                  const formattedDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                      })
                    : '---'

                  const categoryText = item.room?.boardingHouseName || 'Chung cư / Nhà trọ'

                  return (
                    <TableRow
                      key={item.id}
                      interactive
                      onClick={() => router.push(`/admin/blogs/${item.id}`)}
                    >
                      <td className="p-3.5 max-w-sm">
                        <div className="flex items-center gap-3">
                          <img
                            src={coverImg}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-line"
                          />
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {item.title}
                            </span>
                            <div className="text-[11px] text-muted">
                              {item.poster?.username || 'Admin'} • {formattedDate}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-foreground/90 bg-card-hover px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted" />
                          <span>{categoryText}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5 text-muted" />
                          <span>{(item.viewsCount || 0).toLocaleString()} {t('adminBlogsViewsUnit')}</span>
                        </div>
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5 text-muted" />
                          <span>{item.savedCount || 0} {t('adminBlogsSavedUnit')}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="font-bold text-foreground">
                          {item.depositAmount
                            ? `${Number(item.depositAmount).toLocaleString('vi-VN')} ₫`
                            : '0 ₫'}
                        </div>
                      </td>

                      <td className="p-3.5 space-y-1">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase inline-block ${
                            item.status === 'posted'
                              ? 'bg-success-soft text-success'
                              : item.status === 'draft'
                                ? 'bg-warning-soft text-warning'
                                : item.status === 'locked'
                                  ? 'bg-danger-soft text-danger ring-1 ring-red-300'
                                  : 'bg-card-hover text-foreground/90'
                          }`}
                        >
                          {item.status === 'posted'
                            ? t('adminModBadgePosted')
                            : item.status === 'draft'
                              ? t('adminModBadgeDraft')
                              : item.status === 'locked'
                                ? t('adminModBadgeLocked')
                                : t('adminModBadgeHidden')}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap justify-end items-end gap-1">
                          {item.status === 'locked' ? (
                            <TableActionButton
                              icon={<Unlock />}
                              onClick={() => handleOpenUnlock(item)}
                              title={t('adminModActionUnlock')}
                            />
                          ) : (
                            <TableActionButton
                              icon={<Lock />}
                              onClick={() => handleOpenLock(item)}
                              title={t('adminModActionLock')}
                            />
                          )}

                          {item.status !== 'locked' && (
                            <TableActionButton
                              icon={item.status === 'posted' ? <EyeOff /> : <Eye />}
                              onClick={() => handleTogglePublish(item)}
                              title={
                                item.status === 'posted'
                                  ? t('adminBlogsUnpublish')
                                  : t('adminBlogsPublish')
                              }
                            />
                          )}

                          <TableActionButton
                            icon={<Trash2 />}
                            onClick={() => handleOpenDelete(item)}
                            title={t('adminModActionDelete')}
                            danger
                          />
                        </div>
                      </td>
                    </TableRow>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* LOCK POST MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(lockTarget)}
        onClose={() => setLockTarget(null)}
        size="md"
        icon={<Lock className="w-5 h-5 text-red-600" />}
        title={t('adminModLockTitle')}
        description={lockTarget?.id}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setLockTarget(null)}
              disabled={isLocking}
            >
              {t('adminBlogsCancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmLock}
              disabled={isLocking || !lockReason.trim()}
              isLoading={isLocking}
            >
              {t('adminModLockConfirmBtn')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">{t('adminModLockSubtitle')}</p>
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted block">
              {t('adminModLockPresetLabel')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { label: t('adminModLockPresetFakePrice') },
                { label: t('adminModLockPresetScamDeposit') },
                { label: t('adminModLockPresetViolation') },
              ].map((preset, idx) => (
                <Button
                  variant="secondary"
                  size="sm"
                  key={idx}
                  onClick={() => setLockReason(preset.label)}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
          <TextareaInput
            label={t('adminModLockReasonLabel')}
            required
            rows={3}
            value={lockReason}
            onChange={e => {
              setLockReason(e.target.value)
              if (lockReasonError) setLockReasonError('')
            }}
            placeholder={t('adminModLockReasonPlaceholder')}
            error={lockReasonError}
          />
        </div>
      </Modal>

      {/* UNLOCK POST MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(unlockTarget)}
        onClose={() => setUnlockTarget(null)}
        size="md"
        icon={<Unlock className="w-5 h-5 text-success" />}
        title={t('adminModUnlockTitle')}
        description={unlockTarget?.id}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setUnlockTarget(null)}
              disabled={isUnlocking}
            >
              {t('adminBlogsCancel')}
            </Button>
            <Button
              size="md"
              onClick={handleConfirmUnlock}
              disabled={isUnlocking}
              isLoading={isUnlocking}
            >
              {t('adminModUnlockConfirmBtn')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {unlockTarget && t('adminModUnlockConfirm', { title: unlockTarget.title })}
        </p>
      </Modal>

      {/* CREATE POST MODAL using @/components/ui Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={handleRequestCloseCreate}
        size="xl"
        icon={<Plus className="w-5 h-5 text-primary" />}
        title={t('adminBlogsCreateModalTitle')}
        description={t('adminBlogsCreateModalDesc')}
        asForm
        onSubmit={handleSaveCreate}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={handleRequestCloseCreate}
              disabled={isSavingCreate}
            >
              {t('adminBlogsCancel')}
            </Button>
            <Button
              type="submit"
              size="md"
              disabled={isSavingCreate}
              isLoading={isSavingCreate}
            >
              {isSavingCreate ? t('adminBlogsSubmitting') : t('adminBlogsSubmitCreate')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {createError && (
            <div className="p-3 bg-danger-soft border border-danger-subtle text-danger text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{createError}</span>
            </div>
          )}

          <TextInput
            label={t('adminBlogsFieldTitle')}
            required
            value={createTitle}
            onChange={e => setCreateTitle(e.target.value)}
            placeholder={t('adminBlogsFieldTitlePlaceholder')}
          />

          <TextInput
            label={t('adminBlogsFieldCoverImage')}
            type="url"
            value={createCoverImage}
            onChange={e => setCreateCoverImage(e.target.value)}
            placeholder={t('adminBlogsFieldCoverImagePlaceholder')}
          />

          <TextareaInput
            label={t('adminBlogsFieldContent')}
            required
            rows={4}
            value={createContent}
            onChange={e => setCreateContent(e.target.value)}
            placeholder={t('adminBlogsFieldContentPlaceholder')}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <NumberInput
              label={t('adminBlogsFieldDeposit')}
              min={0}
              step={50000}
              value={createDepositAmount}
              onChange={e => setCreateDepositAmount(Number(e.target.value) || 0)}
            />

            <SelectInput
              label={t('adminBlogsFieldStatus')}
              value={createStatus}
              onChange={e => setCreateStatus(e.target.value as any)}
              options={[
                { value: 'posted', label: t('adminBlogsStatusOptionPublished') },
                { value: 'draft', label: t('adminBlogsStatusOptionDraft') },
              ]}
            />
          </div>
        </div>
      </Modal>

      {/* DELETE POST MODAL using @/components/ui Modal */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        size="md"
        icon={<Trash2 className="w-5 h-5 text-red-600" />}
        title={t('adminBlogsDeleteTitle')}
        description={deleteTarget?.id}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              {t('adminBlogsCancel')}
            </Button>
            <Button
              variant="danger"
              size="md"
              onClick={handleConfirmDelete}
              disabled={isDeleting || !deleteReason.trim()}
              isLoading={isDeleting}
            >
              {t('adminBlogsDeleteSubmit')}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-muted leading-relaxed">
            {deleteTarget && t('adminBlogsDeleteConfirm', { title: deleteTarget.title })}
          </p>
          <TextareaInput
            label={t('adminBlogsDeleteReasonLabel')}
            required
            rows={3}
            value={deleteReason}
            onChange={e => {
              setDeleteReason(e.target.value)
              if (deleteReasonError) setDeleteReasonError('')
            }}
            placeholder={t('adminBlogsDeleteReasonPlaceholder')}
            error={deleteReasonError}
          />
        </div>
      </Modal>

      {/* RULE #10: MODAL RESET CONFIRMATION POP-UP using @/components/ui Modal */}
      <Modal
        isOpen={confirmCloseModal.isOpen}
        onClose={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
        size="sm"
        icon={<AlertTriangle className="w-5 h-5 text-warning" />}
        title={t('adminBlogsDiscardModalTitle')}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
            >
              {t('adminBlogsContinueEditing')}
            </Button>
            <Button
              size="md"
              onClick={confirmCloseModal.onDiscard}
            >
              {t('adminBlogsDiscardAndClose')}
            </Button>
          </>
        }
      >
        <p className="text-xs text-muted leading-relaxed">
          {t('adminBlogsDiscardModalDesc')}
        </p>
      </Modal>
    </div>
  )
}

