'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  AlertTriangle,
  HelpCircle,
  Sparkles,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  UploadCloud,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Building,
  LogIn,
  Calendar,
} from 'lucide-react'
import {
  Button,
  ChipGroup,
  Form,
  Modal,
  NumberInput,
  SearchInput,
  SelectInput,
  Text,
  TextareaInput,
  TextInput,
} from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import {
  grievanceService,
  Grievance,
  GrievanceType,
  GrievancePriority,
} from '@/services/grievance.service'
import { uploadImageToBackend } from '@/services/upload.service'
import { resolveErrorMessage } from '@/utils'

export default function SendApplicationPage() {
  const t = useTranslations('sendApplication')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const { isLoggedIn } = useAuth()
  const { toast } = useToast()

  // Data state
  const [loading, setLoading] = useState(true)
  const [applications, setApplications] = useState<Grievance[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Grievance | null>(null)

  // View Mode: Grid (default, Rule #9) vs Table
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Pagination (Rule #9)
  const [currentPage, setCurrentPage] = useState(1)
  const [customPageSize, setCustomPageSize] = useState<number>(6)
  const itemsPerPage = customPageSize > 0 ? customPageSize : viewMode === 'grid' ? 6 : 10

  // Create Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [appType, setAppType] = useState<GrievanceType>('complaint')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<GrievancePriority>('medium')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Unsaved changes check (Rule #10)
  const isFormDirty =
    title.trim() !== '' ||
    description.trim() !== '' ||
    uploadedImages.length > 0 ||
    priority !== 'medium' ||
    appType !== 'complaint'

  // Reset form helper
  const resetForm = () => {
    setAppType('complaint')
    setTitle('')
    setDescription('')
    setPriority('medium')
    setUploadedImages([])
    setFormError(null)
    setShowExitConfirm(false)
  }

  // Close modal safely (Rule #10)
  const handleCloseModal = () => {
    if (isFormDirty) {
      setShowExitConfirm(true)
    } else {
      setIsModalOpen(false)
      resetForm()
    }
  }

  // Fetch applications if user is logged in
  useEffect(() => {
    let isMounted = true

    async function loadApplications() {
      if (!isLoggedIn) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        const data = await grievanceService.getTenantGrievances()
        if (!isMounted) return
        setApplications(data || [])
      } catch (err: unknown) {
        console.warn('Could not load user applications:', err)
        if (!isMounted) return
        setApplications([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadApplications()

    return () => {
      isMounted = false
    }
  }, [isLoggedIn])

  // Adjust default page size when view mode changes
  useEffect(() => {
    setCustomPageSize(viewMode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }, [viewMode])

  // Client image compression to prevent large payloads
  const compressImageFile = (file: File): Promise<string> => {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = readerEvent => {
        const image = new window.Image()
        image.onload = () => {
          const maxDim = 1280
          let { width, height } = image
          if (width > maxDim || height > maxDim) {
            if (width > height) {
              height = Math.round((height * maxDim) / width)
              width = maxDim
            } else {
              width = Math.round((width * maxDim) / height)
              height = maxDim
            }
          }
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          if (ctx) {
            ctx.drawImage(image, 0, 0, width, height)
            resolve(canvas.toDataURL('image/jpeg', 0.82))
          } else {
            resolve(readerEvent.target?.result as string)
          }
        }
        image.onerror = () => resolve(readerEvent.target?.result as string)
        image.src = readerEvent.target?.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    if (uploadedImages.length + files.length > 5) {
      setFormError(t('errorMaxImages'))
      return
    }

    const compressedList: string[] = []
    for (let i = 0; i < files.length; i++) {
      const base64 = await compressImageFile(files[i])
      compressedList.push(base64)
    }

    setUploadedImages(prev => [...prev, ...compressedList].slice(0, 5))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeUploadedImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index))
  }

  // Submit Application
  const handleSubmitApplication = async (e: React.FormEvent) => {
    e.preventDefault()

    if (title.trim().length < 5) {
      setFormError(t('errorEmptyTitle'))
      return
    }

    if (description.trim().length < 10) {
      setFormError(t('errorEmptyDesc'))
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      // 1. Upload images to Cloudinary with folder dormio/application-images
      const cloudinaryUrls: string[] = []
      for (const img of uploadedImages) {
        if (img.startsWith('http://') || img.startsWith('https://')) {
          cloudinaryUrls.push(img)
        } else {
          const uploadRes = await uploadImageToBackend(img, 'dormio/application-images')
          if (uploadRes?.url) {
            cloudinaryUrls.push(uploadRes.url)
          }
        }
      }

      // 2. Submit grievance with Cloudinary URLs
      const newApp = await grievanceService.createGrievance({
        type: appType,
        title: title.trim(),
        description: description.trim(),
        priority,
        imageUrls: cloudinaryUrls,
      })

      setApplications(prev => [newApp, ...prev])
      setIsModalOpen(false)
      resetForm()
      toast.success(t('submitSuccessToast'))
    } catch (err: unknown) {
      console.error('Failed to create application:', err)
      const errMsg = resolveErrorMessage(err, tErrors, t('submitErrorToast'))
      setFormError(errMsg)
      toast.error(errMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtered & Paginated Applications
  const filteredApplications = useMemo(() => {
    return applications.filter(item => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())

      const itemType = item.type || 'complaint'
      const matchType = typeFilter === 'all' || itemType === typeFilter

      const itemStatus = String(item.status)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'resolved' && (itemStatus === 'resolved' || itemStatus === 'closed')) ||
        (statusFilter === 'in_progress' &&
          (itemStatus === 'in_progress' || itemStatus === 'investigating')) ||
        (statusFilter === 'rejected' && itemStatus === 'rejected') ||
        (statusFilter === 'pending' && itemStatus === 'pending')

      return matchSearch && matchType && matchStatus
    })
  }, [applications, searchQuery, typeFilter, statusFilter])

  const totalPages = Math.max(1, Math.ceil(filteredApplications.length / itemsPerPage))
  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage
    return filteredApplications.slice(start, start + itemsPerPage)
  }, [filteredApplications, currentPage, itemsPerPage])

  // Windowed pagination calculation (Rule #9: 5-page window jumping)
  const windowStart = Math.floor((currentPage - 1) / 5) * 5 + 1
  const windowEnd = Math.min(windowStart + 4, totalPages)
  const pageNumbers: number[] = []
  for (let i = windowStart; i <= windowEnd; i++) {
    pageNumbers.push(i)
  }

  // Type filter options for Chip.Group
  const typeChipOptions = useMemo(
    () => [
      {
        value: 'all',
        label: t('tabAll'),
        count: applications.length,
        variant: 'neutral' as const,
      },
      {
        value: 'complaint',
        label: t('tabComplaint'),
        count: applications.filter(a => (a.type || 'complaint') === 'complaint').length,
        variant: 'danger' as const,
        icon: <AlertTriangle className="w-3.5 h-3.5" />,
      },
      {
        value: 'inquiry',
        label: t('tabInquiry'),
        count: applications.filter(a => a.type === 'inquiry').length,
        variant: 'info' as const,
        icon: <HelpCircle className="w-3.5 h-3.5" />,
      },
      {
        value: 'feedback',
        label: t('tabFeedback'),
        count: applications.filter(a => a.type === 'feedback').length,
        variant: 'purple' as const,
        icon: <Sparkles className="w-3.5 h-3.5" />,
      },
    ],
    [applications, t],
  )

  // Type metadata helper
  const getTypeInfo = (type?: GrievanceType) => {
    switch (type) {
      case 'inquiry':
        return {
          label: t('typeInquiry'),
          icon: HelpCircle,
          badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
          cardBorder: 'border-blue-500 bg-blue-50/30',
        }
      case 'feedback':
        return {
          label: t('typeFeedback'),
          icon: Sparkles,
          badgeColor: 'bg-purple-50 text-purple-700 border-purple-200',
          cardBorder: 'border-purple-500 bg-purple-50/30',
        }
      case 'complaint':
      default:
        return {
          label: t('typeComplaint'),
          icon: AlertTriangle,
          badgeColor: 'bg-rose-50 text-rose-700 border-rose-200',
          cardBorder: 'border-rose-500 bg-rose-50/30',
        }
    }
  }

  // Status badge helper
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
      case 'closed':
        return (
          <Text
            as="span"
            variant="badge"
            weight="bold"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 normal-case"
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <Text as="span" color="inherit">
              {t('statusResolved')}
            </Text>
          </Text>
        )
      case 'in_progress':
      case 'investigating':
        return (
          <Text
            as="span"
            variant="badge"
            weight="bold"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 normal-case"
          >
            <Clock className="w-3 h-3 text-blue-600 animate-spin" />
            <Text as="span" color="inherit">
              {t('statusInProgress')}
            </Text>
          </Text>
        )
      case 'rejected':
        return (
          <Text
            as="span"
            variant="badge"
            weight="bold"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200 normal-case"
          >
            <XCircle className="w-3 h-3 text-zinc-500" />
            <Text as="span" color="inherit">
              {t('statusRejected')}
            </Text>
          </Text>
        )
      case 'pending':
      default:
        return (
          <Text
            as="span"
            variant="badge"
            weight="bold"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 normal-case"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <Text as="span" color="inherit">
              {t('statusPending')}
            </Text>
          </Text>
        )
    }
  }

  // Priority badge helper
  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'high':
        return (
          <Text
            as="span"
            variant="badge"
            weight="black"
            className="px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200"
          >
            {t('priorityHigh')}
          </Text>
        )
      case 'low':
        return (
          <Text
            as="span"
            variant="badge"
            weight="black"
            className="px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600 border border-zinc-200"
          >
            {t('priorityLow')}
          </Text>
        )
      case 'medium':
      default:
        return (
          <Text
            as="span"
            variant="badge"
            weight="black"
            className="px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200"
          >
            {t('priorityMedium')}
          </Text>
        )
    }
  }

  const priorityOptions = [
    { value: 'low', label: t('priorityLow') },
    { value: 'medium', label: t('priorityMedium') },
    { value: 'high', label: t('priorityHigh') },
  ]

  const statusOptions = [
    { value: 'all', label: t('statusFilterAll') },
    { value: 'pending', label: t('statusPending') },
    { value: 'in_progress', label: t('statusInProgress') },
    { value: 'resolved', label: t('statusResolved') },
    { value: 'rejected', label: t('statusRejected') },
  ]

  return (
    <div className="min-h-screen bg-zinc-50/60 pb-16">
      {/* Hero Header */}
      <section className="bg-gradient-to-b from-white via-zinc-50 to-transparent border-b border-zinc-200/80 pt-10 pb-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <Text
              as="div"
              variant="badge"
              size="2xs"
              weight="bold"
              color="brand"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2AC1BC]/10 border border-[#2AC1BC]/30 normal-case"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <Text as="span" color="inherit">
                {t('badge')}
              </Text>
            </Text>
            <Text
              as="h1"
              variant="heading"
              className="text-2xl sm:text-3xl lg:text-4xl font-black text-zinc-900 tracking-tight"
            >
              {t('pageTitle')}
            </Text>
            <Text
              variant="body"
              size="xs"
              color="secondary"
              weight="medium"
              className="sm:text-sm max-w-2xl leading-relaxed"
            >
              {t('pageSubtitle')}
            </Text>
          </div>

          <div>
            {isLoggedIn ? (
              <Button
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  resetForm()
                  setIsModalOpen(true)
                }}
                className="sm:w-auto"
              >
                {t('btnNewApplication')}
              </Button>
            ) : (
              <Link href="/login?from=/send-application">
                <Button
                  size="sm"
                  leftIcon={<LogIn className="w-4 h-4" />}
                  className="sm:w-auto"
                >
                  {t('loginBtn')}
                </Button>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        {!isLoggedIn ? (
          /* Login Notice Card for unauthenticated visitors */
          <div className="bg-white rounded-3xl p-8 sm:p-12 border border-zinc-200 shadow-sm text-center max-w-xl mx-auto space-y-4 my-8">
            <div className="w-16 h-16 rounded-full bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
              <FileText className="w-8 h-8" />
            </div>
            <Text as="h2" variant="heading" size="lg" className="sm:text-xl">
              {t('loginNoticeTitle')}
            </Text>
            <Text
              variant="body"
              size="xs"
              color="secondary"
              weight="medium"
              className="sm:text-sm leading-relaxed"
            >
              {t('loginNoticeDesc')}
            </Text>
            <div className="pt-2">
              <Link href="/login?from=/send-application">
                <Button size="sm" leftIcon={<LogIn className="w-4 h-4" />}>
                  {t('loginBtn')}
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Filter and Control Bar */}
            <div className="bg-white rounded-3xl p-4 sm:p-5 border border-zinc-200/90 shadow-xs space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Main Type Filter Tabs using ChipGroup */}
                <ChipGroup
                  value={typeFilter}
                  onChange={val => {
                    setTypeFilter(val)
                    setCurrentPage(1)
                  }}
                  options={typeChipOptions}
                  size="md"
                  scrollable
                  className="p-1 bg-zinc-100/80 rounded-2xl"
                />

                {/* Search & Status Filter */}
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2.5 w-full lg:w-auto">
                  <div className="flex-1 sm:w-64">
                    <SearchInput
                      placeholder={t('searchPlaceholder')}
                      value={searchQuery}
                      onImmediateChange={val => {
                        setSearchQuery(val)
                        setCurrentPage(1)
                      }}
                      onChange={val => {
                        setSearchQuery(val)
                        setCurrentPage(1)
                      }}
                      className="py-2 bg-zinc-50 text-xs font-semibold"
                    />
                  </div>

                  <div className="w-36 shrink-0">
                    <SelectInput
                      value={statusFilter}
                      onChange={e => {
                        setStatusFilter(e.target.value)
                        setCurrentPage(1)
                      }}
                      options={statusOptions}
                      className="py-2 text-xs bg-zinc-50"
                    />
                  </div>

                  {/* Grid vs Table View Toggle (Rule #9) */}
                  <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0">
                    <Button
                      type="button"
                      variant={viewMode === 'grid' ? 'white' : 'ghost'}
                      size="icon-sm"
                      onClick={() => setViewMode('grid')}
                      title="Grid View"
                    >
                      <LayoutGrid className="w-4 h-4" />
                    </Button>
                    <Button
                      type="button"
                      variant={viewMode === 'table' ? 'white' : 'ghost'}
                      size="icon-sm"
                      onClick={() => setViewMode('table')}
                      title="Table View"
                    >
                      <List className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* List / Grid Display */}
            {loading ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200">
                <Clock className="w-8 h-8 text-[#2AC1BC] animate-spin mx-auto mb-2" />
                <Text variant="caption" size="xs" weight="bold" color="subtle">
                  {tCommon('loading')}
                </Text>
              </div>
            ) : filteredApplications.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-zinc-200 space-y-3">
                <div className="w-12 h-12 rounded-full bg-zinc-100 text-zinc-400 flex items-center justify-center mx-auto">
                  <FileText className="w-6 h-6" />
                </div>
                <Text as="h3" variant="heading" size="sm">
                  {t('emptyListTitle')}
                </Text>
                <Text
                  variant="body"
                  size="xs"
                  color="subtle"
                  weight="medium"
                  className="max-w-sm mx-auto"
                >
                  {t('emptyListDesc')}
                </Text>
                <div className="pt-2">
                  <Button
                    size="sm"
                    leftIcon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      resetForm()
                      setIsModalOpen(true)
                    }}
                  >
                    {t('btnNewApplication')}
                  </Button>
                </div>
              </div>
            ) : viewMode === 'grid' ? (
              /* GRID VIEW (Rule #9 Default) */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {paginatedApplications.map(item => {
                  const typeInfo = getTypeInfo(item.type)
                  const Icon = typeInfo.icon

                  return (
                    <div
                      key={item.id}
                      onClick={() => setSelectedApplication(item)}
                      className="bg-white rounded-3xl p-5 border border-zinc-200/90 shadow-xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between group hover:border-[#2AC1BC]"
                    >
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <Text
                            as="span"
                            variant="badge"
                            weight="black"
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${typeInfo.badgeColor}`}
                          >
                            <Icon className="w-3 h-3" />
                            <Text as="span" color="inherit">
                              {typeInfo.label}
                            </Text>
                          </Text>
                          <div className="flex items-center gap-1.5">
                            {getPriorityBadge(item.priority)}
                            {getStatusBadge(item.status)}
                          </div>
                        </div>

                        <div>
                          <Text
                            as="h4"
                            variant="heading"
                            size="sm"
                            clamp={1}
                            className="group-hover:text-[#2AC1BC] transition-colors"
                          >
                            {item.title}
                          </Text>
                          <Text
                            variant="body"
                            size="xs"
                            color="secondary"
                            weight="medium"
                            clamp={2}
                            className="mt-1"
                          >
                            {item.description}
                          </Text>
                        </div>

                        {item.images && item.images.length > 0 && (
                          <div className="flex items-center gap-1.5 overflow-hidden">
                            {item.images.slice(0, 3).map(img => (
                              <img
                                key={img.id}
                                src={img.url}
                                alt="Evidence"
                                className="w-12 h-12 rounded-xl object-cover border border-zinc-200"
                              />
                            ))}
                            {item.images.length > 3 && (
                              <Text
                                as="div"
                                variant="badge"
                                weight="black"
                                color="secondary"
                                className="w-12 h-12 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center"
                              >
                                +{item.images.length - 3}
                              </Text>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="pt-4 border-t border-zinc-100 flex items-center justify-between mt-4">
                        <Text
                          as="div"
                          variant="caption"
                          color="subtle"
                          className="flex items-center gap-1"
                        >
                          <Calendar className="w-3.5 h-3.5" />
                          <Text as="span" color="inherit">
                            {new Date(item.createdAt).toLocaleDateString()}
                          </Text>
                        </Text>
                        <Text
                          as="span"
                          variant="caption"
                          weight="bold"
                          color="brand"
                          className="group-hover:underline"
                        >
                          {t('viewDetailBtn')} &rarr;
                        </Text>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              /* TABLE VIEW */
              <div className="bg-white rounded-3xl border border-zinc-200/90 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-200 bg-zinc-50/70">
                        <th className="py-3.5 px-4">
                          <Text as="span" variant="overline" size="2xs">
                            {t('typeLabel')}
                          </Text>
                        </th>
                        <th className="py-3.5 px-4">
                          <Text as="span" variant="overline" size="2xs">
                            {t('titleLabel')}
                          </Text>
                        </th>
                        <th className="py-3.5 px-4">
                          <Text as="span" variant="overline" size="2xs">
                            {t('priorityLabel')}
                          </Text>
                        </th>
                        <th className="py-3.5 px-4">
                          <Text as="span" variant="overline" size="2xs">
                            {t('statusFilterLabel')}
                          </Text>
                        </th>
                        <th className="py-3.5 px-4">
                          <Text as="span" variant="overline" size="2xs">
                            {t('createdDate')}
                          </Text>
                        </th>
                        <th className="py-3.5 px-4 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      {paginatedApplications.map(item => {
                        const typeInfo = getTypeInfo(item.type)
                        const Icon = typeInfo.icon

                        return (
                          <tr
                            key={item.id}
                            onClick={() => setSelectedApplication(item)}
                            className="hover:bg-zinc-50/80 transition-colors cursor-pointer group"
                          >
                            <td className="py-3 px-4">
                              <Text
                                as="span"
                                variant="badge"
                                weight="black"
                                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${typeInfo.badgeColor}`}
                              >
                                <Icon className="w-3 h-3" />
                                <Text as="span" color="inherit">
                                  {typeInfo.label}
                                </Text>
                              </Text>
                            </td>
                            <td className="py-3 px-4 max-w-xs">
                              <Text
                                variant="body"
                                size="xs"
                                weight="black"
                                truncate
                                className="text-zinc-900 group-hover:text-[#2AC1BC]"
                              >
                                {item.title}
                              </Text>
                              <Text variant="caption" size="2xs" color="subtle" truncate>
                                {item.description}
                              </Text>
                            </td>
                            <td className="py-3 px-4">{getPriorityBadge(item.priority)}</td>
                            <td className="py-3 px-4">{getStatusBadge(item.status)}</td>
                            <td className="py-3 px-4">
                              <Text variant="caption" size="2xs" color="subtle">
                                {new Date(item.createdAt).toLocaleDateString()}
                              </Text>
                            </td>
                            <td className="py-3 px-4 text-right">
                              <Button
                                size="xs"
                                variant="outline"
                                leftIcon={<Eye className="w-3.5 h-3.5" />}
                              >
                                {t('viewDetailBtn')}
                              </Button>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Standardized Pagination Bar (Rule #9) */}
            {filteredApplications.length > 0 && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 py-3 px-4 bg-white rounded-2xl border border-zinc-200">
                {/* Items per page selector & Range indicator */}
                <div className="flex items-center gap-2">
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {tCommon('showing')}
                  </Text>
                  <NumberInput
                    min={1}
                    max={100}
                    value={customPageSize}
                    onChange={e => {
                      const val = parseInt(e.target.value, 10)
                      if (val > 0) {
                        setCustomPageSize(val)
                        setCurrentPage(1)
                      }
                    }}
                    containerClassName="w-16"
                    className="px-2 py-1 bg-zinc-50 text-center text-xs"
                  />
                  <Text as="span" size="xs" weight="semibold" color="secondary">
                    {tCommon('perPage')} | {(currentPage - 1) * itemsPerPage + 1}-
                    {Math.min(currentPage * itemsPerPage, filteredApplications.length)}{' '}
                    {tCommon('of')} {filteredApplications.length} {tCommon('items')}
                  </Text>
                </div>

                {/* 5-page window jumping controls */}
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>

                  {windowStart > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setCurrentPage(Math.max(1, windowStart - 5))}
                    >
                      ...
                    </Button>
                  )}

                  {pageNumbers.map(pageNum => (
                    <Button
                      key={pageNum}
                      type="button"
                      variant={currentPage === pageNum ? 'primary' : 'outline'}
                      size="xs"
                      onClick={() => setCurrentPage(pageNum)}
                    >
                      {pageNum}
                    </Button>
                  ))}

                  {windowEnd < totalPages && (
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => setCurrentPage(Math.min(totalPages, windowEnd + 1))}
                    >
                      ...
                    </Button>
                  )}

                  <Button
                    type="button"
                    variant="outline"
                    size="icon-sm"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* CREATE APPLICATION MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="xl"
        header={
          <div className="space-y-1">
            <Text
              as="div"
              variant="badge"
              weight="black"
              color="brand"
              className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#2AC1BC]/10 rounded-full tracking-wider"
            >
              <FileText className="w-3 h-3" />
              <Text as="span" color="inherit">
                Dormio Support
              </Text>
            </Text>
            <Text as="h2" variant="heading" size="xl">
              {t('modalTitle')}
            </Text>
            <Text variant="subtitle" size="xs">
              {t('modalSubtitle')}
            </Text>
          </div>
        }
      >
        {formError && (
          <Form.Alert variant="error" message={formError} onClose={() => setFormError(null)} />
        )}

        <Form onSubmit={handleSubmitApplication} isLoading={isSubmitting} variant="modal">
          {/* 3 Application Type Selector Cards */}
          <Form.Field label={t('typeLabel')} required>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Complaint Card */}
              <button
                type="button"
                onClick={() => setAppType('complaint')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  appType === 'complaint'
                    ? 'border-rose-500 bg-rose-50/50 shadow-xs ring-1 ring-rose-500'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-500" />
                  <Text as="span" size="xs" weight="black" color="default">
                    {t('typeComplaint')}
                  </Text>
                </div>
                <Text variant="caption" size="3xs" color="secondary">
                  {t('typeComplaintDesc')}
                </Text>
              </button>

              {/* Inquiry Card */}
              <button
                type="button"
                onClick={() => setAppType('inquiry')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  appType === 'inquiry'
                    ? 'border-blue-500 bg-blue-50/50 shadow-xs ring-1 ring-blue-500'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <HelpCircle className="w-4 h-4 text-blue-500" />
                  <Text as="span" size="xs" weight="black" color="default">
                    {t('typeInquiry')}
                  </Text>
                </div>
                <Text variant="caption" size="3xs" color="secondary">
                  {t('typeInquiryDesc')}
                </Text>
              </button>

              {/* Feedback Card */}
              <button
                type="button"
                onClick={() => setAppType('feedback')}
                className={`p-3 rounded-2xl border text-left cursor-pointer transition-all ${
                  appType === 'feedback'
                    ? 'border-purple-500 bg-purple-50/50 shadow-xs ring-1 ring-purple-500'
                    : 'border-zinc-200 hover:border-zinc-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="w-4 h-4 text-purple-500" />
                  <Text as="span" size="xs" weight="black" color="default">
                    {t('typeFeedback')}
                  </Text>
                </div>
                <Text variant="caption" size="3xs" color="secondary">
                  {t('typeFeedbackDesc')}
                </Text>
              </button>
            </div>
          </Form.Field>

          {/* Title Input */}
          <TextInput
            label={t('titleLabel')}
            required
            placeholder={t('titlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
          />

          {/* Detail Textarea */}
          <TextareaInput
            label={t('detailLabel')}
            required
            rows={4}
            placeholder={t('detailPlaceholder')}
            value={description}
            onChange={e => setDescription(e.target.value)}
          />

          {/* Priority Selector */}
          <SelectInput
            label={t('priorityLabel')}
            value={priority}
            onChange={e => setPriority(e.target.value as GrievancePriority)}
            options={priorityOptions}
          />

          {/* Image Evidence Upload */}
          <Form.Field label={t('evidenceImagesLabel')}>
            {uploadedImages.length > 0 && (
              <div className="grid grid-cols-5 gap-2 pb-2">
                {uploadedImages.map((src, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-xl overflow-hidden border border-zinc-200 aspect-square"
                  >
                    <img src={src} alt="Evidence" className="w-full h-full object-cover" />
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => removeUploadedImage(idx)}
                      className="absolute inset-0 w-full h-full rounded-none bg-black/50 hover:bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {uploadedImages.length < 5 && (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-200 hover:border-[#2AC1BC] rounded-2xl p-4 text-center cursor-pointer transition-colors bg-zinc-50/50 hover:bg-zinc-50"
              >
                <UploadCloud className="w-6 h-6 text-zinc-400 mx-auto mb-1" />
                <Text size="xs" weight="bold" color="secondary">
                  {t('uploadGuide')}
                </Text>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}
          </Form.Field>

          {/* Action Buttons */}
          <Form.Actions bordered stackedOnMobile={false}>
            <Button size="sm" type="button" variant="outline" onClick={handleCloseModal}>
              {t('cancelBtn')}
            </Button>
            <Button size="sm" type="submit" isLoading={isSubmitting}>
              {isSubmitting ? t('submittingBtn') : t('submitBtn')}
            </Button>
          </Form.Actions>
        </Form>
      </Modal>

      {/* CONFIRM EXIT MODAL (Rule #10) */}
      <Modal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        size="md"
        zIndex={60}
        showCloseButton={false}
      >
        <Modal.Body className="text-center space-y-4 p-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <Text as="h3" variant="heading" size="base">
              {t('confirmExitTitle')}
            </Text>
            <Text variant="subtitle" size="xs">
              {t('confirmExitDesc')}
            </Text>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              size="sm"
              type="button"
              variant="outline"
              onClick={() => setShowExitConfirm(false)}
            >
              {t('continueEditingBtn')}
            </Button>
            <Button
              size="sm"
              variant="danger"
              type="button"
              onClick={() => {
                setShowExitConfirm(false)
                setIsModalOpen(false)
                resetForm()
              }}
            >
              {t('discardAndCloseBtn')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* APPLICATION DETAIL MODAL */}
      <Modal
        isOpen={Boolean(selectedApplication)}
        onClose={() => setSelectedApplication(null)}
        size="xl"
        header={
          selectedApplication && (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Text
                  as="span"
                  variant="badge"
                  weight="black"
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full border ${
                    getTypeInfo(selectedApplication.type).badgeColor
                  }`}
                >
                  {getTypeInfo(selectedApplication.type).label}
                </Text>
                {getStatusBadge(selectedApplication.status)}
                {getPriorityBadge(selectedApplication.priority)}
              </div>

              <Text as="h3" variant="heading" size="xl">
                {selectedApplication.title}
              </Text>

              <div className="flex flex-wrap items-center gap-4 pt-1">
                <Text as="span" variant="caption" size="2xs" color="subtle">
                  {t('createdDate')}: {new Date(selectedApplication.createdAt).toLocaleString()}
                </Text>
                {selectedApplication.boardingHouseName && (
                  <Text
                    as="span"
                    variant="caption"
                    size="2xs"
                    weight="bold"
                    color="secondary"
                    className="flex items-center gap-1"
                  >
                    <Building className="w-3.5 h-3.5" />
                    {selectedApplication.boardingHouseName}
                    {selectedApplication.roomNumber ? ` - P.${selectedApplication.roomNumber}` : ''}
                  </Text>
                )}
              </div>
            </div>
          )
        }
        footer={
          <Button size="sm" variant="outline" onClick={() => setSelectedApplication(null)}>
            {t('closeBtn')}
          </Button>
        }
      >
        {selectedApplication && (
          <div className="space-y-5">
            {/* Description */}
            <div className="p-4 bg-zinc-50 rounded-2xl border border-zinc-200/80 space-y-1">
              <Text as="span" variant="overline" className="block">
                {t('detailLabel')}
              </Text>
              <Text
                variant="body"
                size="xs"
                weight="medium"
                color="default"
                className="sm:text-sm whitespace-pre-wrap"
              >
                {selectedApplication.description}
              </Text>
            </div>

            {/* Evidence Photos */}
            {selectedApplication.images && selectedApplication.images.length > 0 && (
              <div className="space-y-2">
                <Text as="span" variant="overline" className="block">
                  {t('evidenceImagesLabel')}
                </Text>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {selectedApplication.images.map(img => (
                    <a
                      key={img.id}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl overflow-hidden border border-zinc-200 aspect-square hover:opacity-90 transition-opacity"
                    >
                      <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Admin Resolution Section */}
            <div className="p-4 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <Text
                  as="span"
                  size="xs"
                  weight="black"
                  className="text-amber-900 flex items-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4 text-amber-600" />
                  <Text as="span" color="inherit">
                    {t('adminResolutionTitle')}
                  </Text>
                </Text>
                {selectedApplication.resolvedAt && (
                  <Text as="span" variant="caption" size="3xs" weight="medium" className="text-amber-700">
                    {new Date(selectedApplication.resolvedAt).toLocaleString()}
                  </Text>
                )}
              </div>

              {selectedApplication.resolutionNote ? (
                <Text
                  variant="body"
                  size="xs"
                  weight="medium"
                  className="text-amber-900 whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-amber-200"
                >
                  {selectedApplication.resolutionNote}
                </Text>
              ) : (
                <Text variant="body" size="xs" weight="medium" italic className="text-amber-700">
                  {t('noResolutionYet')}
                </Text>
              )}

              {selectedApplication.resolvedByName && (
                <Text variant="caption" size="3xs" weight="bold" className="text-amber-800">
                  {t('resolvedBy')}: {selectedApplication.resolvedByName}
                </Text>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

