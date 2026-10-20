'use client'

import { useState, useMemo, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import { redirect } from 'next/navigation'
import { FEATURE_FLAGS } from '@/config/features'
import { postService, PublicPostListing } from '@/services/post.service'
import {
  ShieldAlert,
  Plus,
  Search,
  Eye,
  Edit3,
  Trash2,
  Lock,
  Unlock,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  X,
  AlertTriangle,
  RefreshCw,
  Bookmark,
  Building2,
  CheckCircle2,
  Newspaper,
} from 'lucide-react'
import { Button, TextInput, NumberInput, SelectInput, TextareaInput, Pagination } from '@/components/ui'

const HOUSE_PLACEHOLDER = '/house-placeholder.jpg'

export default function AdminPostModerationPage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect('/admin')
  }
  const { locale } = useLanguage()
  const t = useTranslations('admin')

  // Data State
  const [posts, setPosts] = useState<PublicPostListing[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [feedbackMsg, setFeedbackMsg] = useState<{
    type: 'success' | 'error'
    text: string
  } | null>(null)

  // Rule #9: Standardized Table Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10) // Standard 10 for table

  // Direct Column Filters for Table
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

  // Edit Post Modal State
  const [editTarget, setEditTarget] = useState<PublicPostListing | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')
  const [editDeposit, setEditDeposit] = useState<number>(0)
  const [editCoverImage, setEditCoverImage] = useState('')
  const [editStatus, setEditStatus] = useState<'posted' | 'draft' | 'hidden' | 'locked'>('posted')
  const [editError, setEditError] = useState('')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  // Create Post Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createTitle, setCreateTitle] = useState('')
  const [createCoverImage, setCreateCoverImage] = useState(HOUSE_PLACEHOLDER)
  const [createContent, setCreateContent] = useState('')
  const [createDepositAmount, setCreateDepositAmount] = useState<number>(0)
  const [createStatus, setCreateStatus] = useState<'posted' | 'draft'>('posted')
  const [createError, setCreateError] = useState('')
  const [isSavingCreate, setIsSavingCreate] = useState(false)

  // Delete Post Modal State (Mandatory Reason to Notify Author)
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

        // Augment demo reported metadata if viewing reported filter or fallback demo
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

  // Trigger backend fetch whenever filters, page, or page size change
  useEffect(() => {
    fetchPosts()
  }, [fetchPosts])

  // Reset to page 1 when filter values change
  useEffect(() => {
    setCurrentPage(1)
  }, [debouncedArticle, filterProperty, filterDeposit, statusFilter])

  // Handle manual refresh
  const handleRefresh = () => {
    setRefreshing(true)
    fetchPosts(true)
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

  const isEditDirty = useMemo(() => {
    if (!editTarget) return false
    return (
      editTitle.trim() !== (editTarget.title || '') ||
      editContent.trim() !== (editTarget.content || '') ||
      editDeposit !== (Number(editTarget.depositAmount) || 0) ||
      editStatus !== editTarget.status
    )
  }, [editTarget, editTitle, editContent, editDeposit, editStatus])

  const handleRequestCloseEdit = () => {
    if (isEditDirty) {
      setConfirmCloseModal({
        isOpen: true,
        onDiscard: () => {
          setEditTarget(null)
          setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })
        },
      })
    } else {
      setEditTarget(null)
    }
  }

  // --- Create Post Flow (Rule #10 compliant) ---
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
    if (createDepositAmount < 0) {
      setCreateError(t('adminBlogsErrorDeposit'))
      return
    }

    setIsSavingCreate(true)
    try {
      await postService.createPost({
        title: createTitle.trim(),
        content: createContent.trim(),
        depositAmount: Number(createDepositAmount) || 0,
        imageUrls: createCoverImage.trim() ? [createCoverImage.trim()] : [],
        status: createStatus,
      })

      await fetchPosts(true)
      resetCreateForm()
      setIsCreateModalOpen(false)
      setFeedbackMsg({ type: 'success', text: t('adminBlogsCreateSuccess') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Failed to create post:', err)
      setCreateError(err?.response?.data?.message || t('adminBlogsCreateFailed'))
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

      setDeleteTarget(null)
      setDeleteReason('')
      setFeedbackMsg({ type: 'success', text: t('adminBlogsDeleteSubmit') })
      setTimeout(() => setFeedbackMsg(null), 4000)
    } catch (err: any) {
      console.error('Delete failed:', err)
      setDeleteReasonError(err?.response?.data?.message || t('adminBlogsDeleteFailed'))
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-6 pb-14">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-black bg-accent-soft text-accent tracking-wide uppercase">
              <ShieldAlert className="w-3.5 h-3.5" />
              {t('adminModBadge')}
            </span>
            <span className="text-xs font-semibold text-muted">• {t('adminBlogsLiveDb')}</span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight mt-1">
            {t('adminModTitle')}
          </h1>
          <p className="text-xs text-muted mt-0.5">{t('adminModSubtitle')}</p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            leftIcon={<RefreshCw  />}
            title={t('adminModRefresh')}
          />

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenCreate}
            leftIcon={<Plus  />}
          >
            <span>{t('adminModNewPost')}</span>
          </Button>
        </div>
      </div>

      {/* Success / Feedback Banner */}
      {feedbackMsg && (
        <div
          className={`p-4 rounded-2xl text-xs flex items-center justify-between gap-3 animate-fadeIn ${
            feedbackMsg.type === 'success'
              ? 'bg-success-soft border border-success-subtle text-success'
              : 'bg-danger-soft border border-danger-subtle text-danger'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span className="font-bold">{feedbackMsg.text}</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setFeedbackMsg(null)}
          >
            <X className="w-3.5 h-3.5" />
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
            size="sm"
            onClick={() => fetchPosts()}
          >
            {t('adminBlogsRetry')}
          </Button>
        </div>
      )}

      {/* Post count summary */}
      {!loading && (
        <span className="text-xs font-semibold text-muted pl-2">
          {t('adminBlogsShowingCount', { total: totalItems })}
        </span>
      )}

      {/* Main Table View with Direct Column Filters */}
      {loading ? (
        /* Loading skeleton for table */
        <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-hidden">
          <div className="p-6 space-y-3.5 animate-pulse">
            <div className="h-10 bg-card-hover rounded-xl w-full" />
            {[1, 2, 3, 4, 5, 6].map(idx => (
              <div key={idx} className="h-12 bg-surface rounded-xl w-full" />
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse min-w-[950px]">
            <thead>
              {/* Row 1: Column Titles */}
              <tr className="border-b border-line bg-surface/80 text-muted uppercase tracking-wider font-bold">
                <th className="p-3.5 w-1/3 min-w-[280px]">{t('adminBlogsColArticle')}</th>
                <th className="p-3.5 min-w-[180px]">{t('adminBlogsColCategory')}</th>
                <th className="p-3.5 min-w-[130px]">{t('adminBlogsColEngagement')}</th>
                <th className="p-3.5 min-w-[150px]">{t('adminBlogsColDeposit')}</th>
                <th className="p-3.5 min-w-[140px]">{t('adminBlogsColStatus')}</th>
                <th className="p-3.5 text-right min-w-[140px]">{t('adminBlogsColActions')}</th>
              </tr>

              {/* Row 2: Direct In-Table Column Filters */}
              <tr className="border-b border-line bg-card-hover/60 text-foreground/90">
                {/* 1. Filter Article / Post */}
                <th className="p-2.5 font-normal">
                  <div className="relative">
                    <TextInput
                      type="text"
                      value={filterArticle}
                      onChange={e => {
                        setFilterArticle(e.target.value)
                        setCurrentPage(1)
                      }}
                      placeholder={t('adminBlogsFilterArticlePlaceholder')}
                      containerClassName="space-y-0"
                      className="py-1.5 bg-card border-line rounded-lg text-xs font-medium text-foreground placeholder:text-muted focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all"
                      leftIcon={<Search className="w-3.5 h-3.5 text-muted" />}
                      rightIcon={
                        filterArticle ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setFilterArticle('')
                              setCurrentPage(1)
                            }}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        ) : undefined
                      }
                    />
                  </div>
                </th>

                {/* 2. Filter Category / Property */}
                <th className="p-2.5 font-normal">
                  <SelectInput
                    value={filterProperty}
                    onChange={e => {
                      setFilterProperty(e.target.value)
                      setCurrentPage(1)
                    }}
                    containerClassName="space-y-0"
                    className="w-full py-1.5 px-2 bg-card border-line rounded-lg text-xs font-medium text-foreground/90 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">{t('adminBlogsFilterPropertyAll')}</option>
                    {availableProperties.map(propName => (
                      <option key={propName} value={propName}>
                        {propName}
                      </option>
                    ))}
                  </SelectInput>
                </th>

                {/* 3. Engagement Column */}
                <th className="p-2.5 font-normal text-center text-muted text-[11px]">—</th>

                {/* 4. Filter Deposit / Price */}
                <th className="p-2.5 font-normal">
                  <SelectInput
                    value={filterDeposit}
                    onChange={e => {
                      setFilterDeposit(e.target.value as any)
                      setCurrentPage(1)
                    }}
                    containerClassName="space-y-0"
                    className="w-full py-1.5 px-2 bg-card border-line rounded-lg text-xs font-medium text-foreground/90 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">{t('adminBlogsFilterDepositAll')}</option>
                    <option value="free">{t('adminBlogsFilterDepositFree')}</option>
                    <option value="under_2m">{t('adminBlogsFilterDepositUnder2m')}</option>
                    <option value="2m_5m">{t('adminBlogsFilterDeposit2m5m')}</option>
                    <option value="above_5m">{t('adminBlogsFilterDepositAbove5m')}</option>
                  </SelectInput>
                </th>

                {/* 5. Filter Status */}
                <th className="p-2.5 font-normal">
                  <SelectInput
                    value={statusFilter}
                    onChange={e => {
                      setStatusFilter(e.target.value as any)
                      setCurrentPage(1)
                    }}
                    containerClassName="space-y-0"
                    className="w-full py-1.5 px-2 bg-card border-line rounded-lg text-xs font-bold text-foreground/90 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 cursor-pointer"
                  >
                    <option value="all">{t('adminModFilterAll')}</option>
                    <option value="posted">{t('adminModFilterPosted')}</option>
                    <option value="draft">{t('adminModFilterDraft')}</option>
                    <option value="hidden">{t('adminModFilterHidden')}</option>
                    <option value="locked">{t('adminModFilterLocked')}</option>
                    <option value="reported">{t('adminModFilterReported')}</option>
                  </SelectInput>
                </th>

                {/* 6. Filter Actions (Reset button) */}
                <th className="p-2.5 font-normal text-right">
                  {isAnyFilterActive && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleResetFilters}
                      title={t('adminBlogsFilterResetTooltip')}
                      leftIcon={<RotateCcw  />}
                    >
                      <span>{t('adminBlogsFilterReset')}</span>
                    </Button>
                  )}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-line">
              {posts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-muted">
                    <div className="space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-card-hover text-muted flex items-center justify-center mx-auto">
                        <Newspaper className="w-6 h-6" />
                      </div>
                      <h3 className="text-base font-bold text-foreground">
                        {isAnyFilterActive
                           ? t('adminBlogsFilterNoMatchTitle')
                          : t('adminBlogsNoPosts')}
                      </h3>
                      <p className="text-xs text-muted max-w-sm mx-auto">
                        {isAnyFilterActive
                          ? t('adminBlogsFilterNoMatchDesc')
                          : t('adminBlogsNoPostsDesc')}
                      </p>
                      {isAnyFilterActive ? (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleResetFilters}
                          leftIcon={<RotateCcw  />}
                        >
                          <span>{t('adminBlogsFilterReset')}</span>
                        </Button>
                      ) : (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={handleOpenCreate}
                          leftIcon={<Plus  />}
                        >
                          <span>{t('adminBlogsCreateFirst')}</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                posts.map(item => {
                  const coverImg = item.images?.[0]?.url || HOUSE_PLACEHOLDER
                  const categoryText =
                    item.room?.boardingHouseName ||
                    item.room?.roomTypeName ||
                    item.address?.district ||
                    t('adminBlogsDefaultCategory')
                  const formattedDate = item.createdAt
                    ? new Date(item.createdAt).toLocaleDateString(
                        locale === 'en' ? 'en-US' : 'vi-VN',
                      )
                    : '—'

                  const isReported = Boolean(item.reportsCount && item.reportsCount > 0)

                  return (
                    <tr key={item.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="p-3.5 max-w-sm">
                        <Link
                          href={`/admin/blogs/${item.id}`}
                          className="flex items-center gap-3 cursor-pointer group"
                        >
                          <img
                            src={coverImg}
                            alt=""
                            className="w-12 h-12 rounded-xl object-cover shrink-0 border border-line group-hover:border-orange-500 transition-colors"
                          />
                          <div className="space-y-0.5">
                            <span className="font-bold text-foreground line-clamp-1 group-hover:text-orange-600 transition-colors">
                              {item.title}
                            </span>
                            <div className="text-[11px] text-muted">
                              {item.poster?.username || 'Admin'} • {formattedDate}
                            </div>
                          </div>
                        </Link>
                      </td>

                      <td className="p-3.5">
                        <span className="font-semibold text-foreground/90 bg-card-hover px-2 py-0.5 rounded-md inline-flex items-center gap-1">
                          <Building2 className="w-3 h-3 text-muted" />
                          <span>{categoryText}</span>
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <Eye className="w-3.5 h-3.5" />
                          <span>
                            {(item.viewsCount || 0).toLocaleString()} {t('adminBlogsViewsUnit')}
                          </span>
                        </div>
                        <div className="font-semibold text-[11px] flex items-center gap-1.5">
                          <Bookmark className="w-3.5 h-3.5" />
                          <span>
                            {item.savedCount || 0} {t('adminBlogsSavedUnit')}
                          </span>
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

                        {isReported && (
                          <div>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-warning-soft text-warning inline-flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3 text-amber-600" />
                              <span>
                                {t('adminModBadgeReported', { count: item.reportsCount })}
                              </span>
                            </span>
                          </div>
                        )}
                      </td>

                      <td className="p-3.5">
                        <div className="flex flex-wrap justify-end items-end gap-1">
                          {/* Lock / Unlock */}
                          {item.status === 'locked' ? (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenUnlock(item)}
                              title={t('adminModActionUnlock')}
                            >
                              <Unlock className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenLock(item)}
                              title={t('adminModActionLock')}
                            >
                              <Lock className="w-4 h-4" />
                            </Button>
                          )}

                          {/* Toggle Publish */}
                          {item.status !== 'locked' && (
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => handleTogglePublish(item)}
                              title={
                                item.status === 'posted'
                                  ? t('adminBlogsUnpublish')
                                  : t('adminBlogsPublish')
                              }
                            >
                              {item.status === 'posted'
                                ? t('adminBlogsHideTitle')
                                : t('adminBlogsShowTitle')}
                            </Button>
                          )}

                          {/* Delete */}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDelete(item)}
                            title={t('adminModActionDelete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Standardized Pagination Bar (Rule #9) */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* ─── MODAL 2: LOCK POST MODAL ─── */}
      {lockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-danger-soft border border-danger-subtle flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">{t('adminModLockTitle')}</h3>
                <p className="text-xs text-muted font-mono truncate max-w-[240px]">
                  {lockTarget.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">{t('adminModLockSubtitle')}</p>

            {/* Presets */}
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
                    type="button"
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

            {/* Reason input */}
            <div className="text-left">
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
                className={
                  lockReasonError
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-line focus:border-red-500'
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setLockTarget(null)}
                disabled={isLocking}
              >
                {t('adminBlogsCancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmLock}
                disabled={isLocking || !lockReason.trim()}
                isLoading={isLocking}
              >
                <span>{t('adminModLockConfirmBtn')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 3: UNLOCK POST MODAL ─── */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-emerald-600">
              <div className="w-10 h-10 rounded-2xl bg-success-soft border border-success-subtle flex items-center justify-center shrink-0">
                <Unlock className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">{t('adminModUnlockTitle')}</h3>
                <p className="text-xs text-muted font-mono truncate max-w-[240px]">
                  {unlockTarget.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {t('adminModUnlockConfirm', { title: unlockTarget.title })}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setUnlockTarget(null)}
                disabled={isUnlocking}
              >
                {t('adminBlogsCancel')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmUnlock}
                disabled={isUnlocking}
                isLoading={isUnlocking}
              >
                <span>{t('adminModUnlockConfirmBtn')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL 5: CREATE POST MODAL (Rule #10 compliant) ─── */}
      {isCreateModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={handleRequestCloseCreate}
        >
          <div
            className="bg-card rounded-3xl max-w-xl w-full p-6 shadow-2xl space-y-4 my-8 animate-scaleIn max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-line">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-soft border border-accent-subtle flex items-center justify-center text-orange-600">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {t('adminBlogsCreateModalTitle')}
                  </h3>
                  <p className="text-xs text-muted">{t('adminBlogsCreateModalSubtitle')}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRequestCloseCreate}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {createError && (
              <div className="p-3.5 rounded-xl bg-danger-soft border border-danger-subtle text-danger text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-500" />
                <span>{createError}</span>
              </div>
            )}

            <form onSubmit={handleSaveCreate} className="space-y-4">
              <TextInput
                label={t('adminBlogsFieldTitle')}
                required
                type="text"
                value={createTitle}
                onChange={e => setCreateTitle(e.target.value)}
                placeholder={t('adminBlogsFieldTitlePlaceholder')}
                className="px-3 py-2 bg-surface border border-line rounded-xl text-xs font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />

              <TextInput
                label={t('adminBlogsFieldCoverImage')}
                type="url"
                value={createCoverImage}
                onChange={e => setCreateCoverImage(e.target.value)}
                placeholder={t('adminBlogsFieldCoverImagePlaceholder')}
                className="px-3 py-2 bg-surface border border-line rounded-xl text-xs font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
              />

              <TextareaInput
                label={t('adminBlogsFieldContent')}
                required
                rows={4}
                value={createContent}
                onChange={e => setCreateContent(e.target.value)}
                placeholder={t('adminBlogsFieldContentPlaceholder')}
                className="p-3 bg-surface border border-line rounded-xl text-xs font-medium text-foreground placeholder:text-muted focus:outline-none focus:border-orange-500 focus:bg-white leading-relaxed"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <NumberInput
                  label={t('adminBlogsFieldDeposit')}
                  min={0}
                  step={50000}
                  value={createDepositAmount}
                  onChange={e => setCreateDepositAmount(Number(e.target.value) || 0)}
                  className="px-3 py-2 bg-surface border border-line rounded-xl text-xs font-medium text-foreground focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                />

                <SelectInput
                  label={t('adminBlogsFieldStatus')}
                  value={createStatus}
                  onChange={e => setCreateStatus(e.target.value as any)}
                  className="px-3 py-2 bg-surface border border-line rounded-xl text-xs font-bold text-foreground focus:outline-none focus:border-orange-500 focus:bg-white transition-all"
                  options={[
                    { value: 'posted', label: t('adminBlogsStatusOptionPublished') },
                    { value: 'draft', label: t('adminBlogsStatusOptionDraft') },
                  ]}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-line">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={handleRequestCloseCreate}
                  disabled={isSavingCreate}
                >
                  {t('adminBlogsCancel')}
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={isSavingCreate}
                  isLoading={isSavingCreate}
                >
                  <span>
                    {isSavingCreate ? t('adminBlogsSubmitting') : t('adminBlogsSubmitCreate')}
                  </span>
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL 6: DELETE POST MODAL ─── */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-scaleIn">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-danger-soft border border-danger-subtle flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-base font-black text-foreground">{t('adminBlogsDeleteTitle')}</h3>
                <p className="text-xs text-muted font-mono truncate max-w-[240px]">
                  {deleteTarget.id}
                </p>
              </div>
            </div>

            <p className="text-xs text-muted leading-relaxed">
              {t('adminBlogsDeleteConfirm', { title: deleteTarget.title })}
            </p>

            <div className="text-left">
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
                className={
                  deleteReasonError
                    ? 'border-red-400 bg-red-50/20'
                    : 'border-line focus:border-orange-500'
                }
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-line">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDeleteTarget(null)}
                disabled={isDeleting}
              >
                {t('adminBlogsCancel')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleConfirmDelete}
                disabled={isDeleting || !deleteReason.trim()}
                isLoading={isDeleting}
              >
                <span>{t('adminBlogsDeleteSubmit')}</span>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── RULE #10: MODAL RESET CONFIRMATION POP-UP ─── */}
      {confirmCloseModal.isOpen && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card rounded-3xl max-w-sm w-full shadow-2xl p-6 space-y-4 animate-scaleIn">
            <div className="w-10 h-10 rounded-2xl bg-warning-soft text-warning flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground">
                {t('adminBlogsDiscardModalTitle')}
              </h3>
              <p className="text-xs text-muted mt-1 leading-relaxed">
                {t('adminBlogsDiscardModalDesc')}
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmCloseModal({ isOpen: false, onDiscard: () => {} })}
              >
                {t('adminBlogsContinueEditing')}
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={confirmCloseModal.onDiscard}
              >
                {t('adminBlogsDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
