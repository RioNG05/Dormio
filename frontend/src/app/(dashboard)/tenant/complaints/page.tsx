'use client'

import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  MessageSquare,
  AlertTriangle,
  CheckCircle2,
  Clock,
  X,
  ShieldAlert,
  UploadCloud,
  Trash2,
  Eye,
  Search,
  Filter,
  AlertCircle,
  HelpCircle,
  Image as ImageIcon,
  Building,
  LayoutGrid,
  List,
  Plus,
  ShieldCheck,
  Calendar,
  Sparkles,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react'
import { Button, TextInput, TextareaInput, Pagination, ViewModeToggle, FilterToolbar, SearchInput } from '@/components/ui'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { grievanceService, Grievance, GrievancePriority } from '@/services/grievance.service'

export default function TenantAdminComplaintsPage() {
  const t = useTranslations('tenantPortal')
  const { locale } = useLanguage()

  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<Grievance[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedGrievance, setSelectedGrievance] = useState<Grievance | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // View Mode: Grid (default, Rule #9) vs Table
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(6)

  // Create form state
  const [title, setTitle] = useState('')
  const [priority, setPriority] = useState<GrievancePriority>('medium')
  const [category, setCategory] = useState<string>('catDeposit')
  const [description, setDescription] = useState('')
  const [uploadedImages, setUploadedImages] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showExitConfirm, setShowExitConfirm] = useState(false)

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Check if form has unsaved modifications (Rule #10)
  const isFormDirty =
    title.trim() !== '' ||
    description.trim() !== '' ||
    uploadedImages.length > 0 ||
    priority !== 'medium'

  // 1. Fetch real grievances from backend
  useEffect(() => {
    let isMounted = true

    async function loadData() {
      try {
        const data = await grievanceService.getTenantGrievances()
        if (!isMounted) return
        setComplaints(data || [])
      } catch (err: unknown) {
        console.warn('Could not load complaints from backend:', err)
        if (!isMounted) return
        setComplaints([])
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadData()

    return () => {
      isMounted = false
    }
  }, [])

  const resetForm = () => {
    setTitle('')
    setPriority('medium')
    setCategory('catDeposit')
    setDescription('')
    setUploadedImages([])
    setFormError(null)
    setShowExitConfirm(false)
  }

  const handleCloseModal = () => {
    if (isFormDirty) {
      setShowExitConfirm(true)
    } else {
      setIsModalOpen(false)
      resetForm()
    }
  }

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
      setFormError(t('tenantMaxEvidenceImagesError'))
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

  // Submit new grievance (real backend API with optimistic demo fallback)
  const handleSubmitGrievance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim()) {
      setFormError(t('tenantTitleRequiredError'))
      return
    }
    if (description.trim().length < 10) {
      setFormError(t('tenantDescMinLengthError'))
      return
    }

    setIsSubmitting(true)
    setFormError(null)

    try {
      const newGrievance = await grievanceService.createGrievance({
        type: 'complaint',
        title: title.trim(),
        description: description.trim(),
        priority,
        imageUrls: uploadedImages,
      })

      setComplaints(prev => [newGrievance, ...prev])
      setIsModalOpen(false)
      resetForm()
    } catch (err: unknown) {
      console.error('API create error:', err)
      const errorMsg = err instanceof Error ? err.message : t('tenantSubmitFailedError')
      setFormError(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Filtering & Pagination
  const filteredComplaints = useMemo(() => {
    return complaints.filter(item => {
      const matchSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.id.toLowerCase().includes(searchQuery.toLowerCase())

      const statusStr = String(item.status)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'resolved' && (statusStr === 'resolved' || statusStr === 'closed')) ||
        (statusFilter === 'in_progress' &&
          (statusStr === 'in_progress' || statusStr === 'investigating')) ||
        (statusFilter === 'pending' && statusStr === 'pending')

      return matchSearch && matchStatus
    })
  }, [complaints, searchQuery, statusFilter])

  const paginatedComplaints = filteredComplaints.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  )

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '-'
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

  const getPriorityBadge = (p: string) => {
    switch (p) {
      case 'urgent':
      case 'high':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-danger-soft text-danger border border-danger-subtle text-[10px] font-black uppercase flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-danger" />
            <span>{t('tenantPriorityUrgent')}</span>
          </span>
        )
      case 'medium':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-warning-soft text-warning border border-warning-subtle text-[10px] font-black uppercase">
            {t('tenantPriorityNormal')}
          </span>
        )
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-card-hover text-muted border border-line text-[10px] font-black uppercase">
            {t('tenantPriorityLow')}
          </span>
        )
    }
  }

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'resolved':
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-success-soft text-success border border-success-subtle text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span>{t('tenantStatusResponded')}</span>
          </span>
        )
      case 'in_progress':
      case 'investigating':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-info-soft text-info border border-info-subtle text-[10px] font-bold">
            <Clock className="w-3 h-3 text-info animate-spin" />
            <span>{t('tenantStatusProcessing')}</span>
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning-soft text-warning border border-warning-subtle text-[10px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
            <span>{t('tenantStatusUnresponded')}</span>
          </span>
        )
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto px-1 sm:px-0">
      {/* Top Header with Protected Escrow Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-soft border border-primary-subtle text-primary text-[11px] font-bold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('tenantEscrowProtectedBadge')}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            {t('tenantComplaintsTitle')}
          </h1>
          <p className="text-xs sm:text-sm text-muted mt-1 leading-relaxed max-w-3xl">
            {t('tenantComplaintsSubtitle')}
          </p>
        </div>

        <Button size="xs"
          onClick={() => {
            resetForm()
            setIsModalOpen(true)
          }}
          className="sm:w-auto from-primary to-[#20a8a3] hover:from-[#20a8a3] hover:to-[#1a938f] sm:text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>{t('tenantBtnNewComplaint')}</span>
        </Button>
      </div>

      {/* Standardized Filter Toolbar */}
      <FilterToolbar
        search={
          <SearchInput
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            placeholder={t('tenantSearchGrievancePlaceholder')}
          />
        }
        filters={
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-card-hover/80 rounded-2xl">
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setStatusFilter('all')
                setCurrentPage(1)
              }}
              className="shrink-0"
            >
              <span>{t('tenantTabAllIssues')}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === 'all' ? 'bg-zinc-900 text-white' : 'bg-line text-foreground/90'
                }`}
              >
                {complaints.length}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setStatusFilter('pending')
                setCurrentPage(1)
              }}
              className="shrink-0"
            >
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{t('tenantStatusUnresponded')}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === 'pending'
                    ? 'bg-warning text-white'
                    : 'bg-warning-soft text-warning'
                }`}
              >
                {complaints.filter(c => c.status === 'pending').length}
              </span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setStatusFilter('resolved')
                setCurrentPage(1)
              }}
              className="shrink-0"
            >
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{t('tenantStatusResponded')}</span>
              </div>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  statusFilter === 'resolved'
                    ? 'bg-[#20a8a3] text-white'
                    : 'bg-success-soft text-success'
                }`}
              >
                {
                  complaints.filter(
                    c => c.status === 'resolved' || (c.status as string) === 'closed',
                  ).length
                }
              </span>
            </Button>
          </div>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
          />
        }
      />

      {/* Content: Grid or Table */}
      {viewMode === 'grid' ? (
        /* Grid View (Rule #9 Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedComplaints.length === 0 ? (
            <div className="col-span-full py-12 text-center text-muted text-xs">
              {t('tenantNoGrievancesFound')}
            </div>
          ) : (
            paginatedComplaints.map(item => (
              <div
                key={item.id}
                onClick={() => setSelectedGrievance(item)}
                className="rounded-2xl border border-line bg-card p-5 shadow-2xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 group"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono text-muted font-bold bg-card-hover px-2 py-0.5 rounded-md">
                        {item.id}
                      </span>
                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-accent-soft text-accent border border-accent-subtle">
                        {t('tenantBqtDormioBadge')}
                      </span>
                    </div>
                    {getPriorityBadge(item.priority)}
                  </div>

                  <h3 className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                    {item.title}
                  </h3>

                  <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>
                </div>

                {/* Resolution card snippet */}
                {item.resolutionNote && (
                  <div className="p-3 rounded-xl bg-success-soft border border-success-subtle text-[11px] text-success space-y-1">
                    <div className="font-black flex items-center gap-1 text-success">
                      <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                      <span>{t('tenantResolutionResponseFromAdmin')}</span>
                    </div>
                    <p className="line-clamp-2 font-medium leading-relaxed">
                      {item.resolutionNote}
                    </p>
                  </div>
                )}

                <div className="border-t border-line pt-3 flex items-center justify-between text-[11px]">
                  <span className="text-muted font-medium">{formatDate(item.createdAt)}</span>
                  {getStatusBadge(item.status)}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <div className="bg-card rounded-2xl border border-line shadow-2xs overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-surface border-b border-line text-muted uppercase font-black text-[10px] tracking-wider">
              <tr>
                <th className="px-6 py-4">{t('tenantColGrievanceId')}</th>
                <th className="px-6 py-4">{t('tenantColGrievanceTitle')}</th>
                <th className="px-6 py-4">{t('tenantColGrievancePriority')}</th>
                <th className="px-6 py-4">{t('tenantColGrievanceDate')}</th>
                <th className="px-6 py-4">{t('tenantColGrievanceStatus')}</th>
                <th className="px-6 py-4 text-right">{t('tenantColGrievanceAction')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {paginatedComplaints.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-muted">
                    {t('tenantNoGrievances')}
                  </td>
                </tr>
              ) : (
                paginatedComplaints.map(item => (
                  <tr
                    key={item.id}
                    onClick={() => setSelectedGrievance(item)}
                    className="hover:bg-card-hover transition-colors duration-150 cursor-pointer"
                  >
                    <td className="px-6 py-4 font-mono font-bold text-muted">{item.id}</td>
                    <td className="px-6 py-4 font-bold text-foreground max-w-xs truncate">
                      {item.title}
                    </td>
                    <td className="px-6 py-4">{getPriorityBadge(item.priority)}</td>
                    <td className="px-6 py-4 text-muted font-medium">
                      {formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(item.status)}</td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Standard Pagination Bar (Rule #9) */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredComplaints.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* Modal 1: Create New Grievance Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={handleCloseModal}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col border border-line my-auto"
          >
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-foreground">
                    {t('tenantCreateGrievanceModalTitle')}
                  </h3>
                  <p className="text-xs text-muted">{t('tenantCreateGrievanceModalSubtitle')}</p>
                </div>
              </div>
              <Button rounded="full"
                variant="ghost"
                size="sm"
                type="button"
                onClick={handleCloseModal}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form
              onSubmit={handleSubmitGrievance}
              className="p-6 overflow-y-auto space-y-4 text-xs"
            >
              {formError && (
                <div className="p-3 rounded-xl bg-danger-soft border border-danger-subtle text-danger font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Priority Selection */}
              <div>
                <label className="font-bold text-foreground/90 block mb-1.5">
                  {t('tenantFieldSeverityLabel')}
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { key: 'low', label: t('tenantPriorityLowDesc'), color: 'border-line' },
                    {
                      key: 'medium',
                      label: t('tenantPriorityNormalDesc'),
                      color: 'border-warning-subtle',
                    },
                    { key: 'high', label: t('tenantPriorityUrgentDesc'), color: 'border-rose-300' },
                  ].map(p => (
                    <Button
                      key={p.key}
                      variant="secondary"
                      size="sm"
                      type="button"
                      onClick={() => setPriority(p.key as GrievancePriority)}
                    >
                      {p.label}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="font-bold text-foreground/90 block mb-1.5">
                  {t('tenantFieldTitleLabel')} <span className="text-danger">*</span>
                </label>
                <TextInput
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder={t('tenantFieldTitlePlaceholder')}
                  containerClassName="space-y-0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:outline-none focus:border-primary text-xs"
                />
              </div>

              {/* Description */}
              <div>
                <label className="font-bold text-foreground/90 block mb-1.5">
                  {t('tenantFieldDescLabel')} <span className="text-danger">*</span>
                </label>
                <TextareaInput
                  rows={4}
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('tenantFieldDescPlaceholder')}
                  containerClassName="space-y-0"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-line font-medium focus:outline-none focus:border-primary text-xs leading-relaxed"
                />
              </div>

              {/* Image attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-bold text-foreground/90">{t('tenantFieldPhotosLabel')}</label>
                  <span className="text-muted">{uploadedImages.length}/5</span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {uploadedImages.map((img, idx) => (
                    <div
                      key={idx}
                      className="relative h-20 rounded-xl overflow-hidden border border-line group"
                    >
                      <img src={img} alt="Evidence" className="w-full h-full object-cover" />
                      <Button
                        variant="ghost"
                        size="sm"
                        type="button"
                        onClick={() => removeUploadedImage(idx)}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}

                  {uploadedImages.length < 5 && (
                    <Button fullWidth
                      variant="ghost"
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex-col"
                    >
                      <UploadCloud className="w-5 h-5 mb-1" />
                      <span className="text-[10px] font-bold">{t('tenantAddPhotoBtn')}</span>
                    </Button>
                  )}
                </div>
                <TextInput
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  containerClassName="hidden"
                  className="hidden"
                />
              </div>

              <div className="pt-3 border-t border-line flex items-center justify-end gap-2.5">
                <Button size="xs"
                  type="button"
                  variant="ghost"
                  onClick={handleCloseModal}
                >
                  {t('tenantBtnCancel')}
                </Button>
                <Button size="xs"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? t('tenantSubmitting') : t('tenantBtnSubmitOfficial')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: View Grievance Detail Modal */}
      {selectedGrievance && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-200"
          onClick={() => setSelectedGrievance(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl shadow-2xl w-full max-w-xl max-h-[92vh] overflow-hidden flex flex-col border border-line my-auto"
          >
            <div className="p-5 border-b border-line flex items-center justify-between bg-surface/60">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-muted bg-card px-2 py-0.5 rounded border border-line">
                  {selectedGrievance.id}
                </span>
                {getStatusBadge(selectedGrievance.status)}
              </div>
              <Button rounded="full"
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setSelectedGrievance(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 text-xs leading-relaxed">
              <div>
                <h3 className="text-base font-black text-foreground leading-snug">
                  {selectedGrievance.title}
                </h3>
                <div className="text-[11px] text-muted mt-1 flex items-center gap-2">
                  <span>
                    {t('tenantSubmittedDateLabel', {
                      date: formatDate(selectedGrievance.createdAt),
                    })}
                  </span>
                  <span>&bull;</span>
                  <span>
                    {t('tenantRoomGrievanceBadge', {
                      room: selectedGrievance.roomNumber || '101',
                      house: selectedGrievance.boardingHouseName || 'Dormio',
                    })}
                  </span>
                </div>
              </div>

              <div className="p-3.5 bg-surface rounded-2xl border border-line space-y-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-muted">
                  {t('tenantComplaintContentTitle')}
                </span>
                <p className="text-foreground/90 font-medium whitespace-pre-wrap">
                  {selectedGrievance.description}
                </p>
              </div>

              {/* Evidence Images */}
              {selectedGrievance.images && selectedGrievance.images.length > 0 && (
                <div>
                  <span className="text-[10px] font-black uppercase tracking-wider text-muted block mb-2">
                    {t('tenantEvidencePhotosTitle')}
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {selectedGrievance.images.map(img => (
                      <div
                        key={img.id}
                        onClick={() => setPreviewImage(img.url)}
                        className="w-20 h-20 rounded-xl overflow-hidden border border-line cursor-pointer hover:opacity-90"
                      >
                        <img src={img.url} alt="Evidence" className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Resolution Section */}
              {selectedGrievance.resolutionNote ? (
                <div className="p-4 rounded-2xl bg-success-soft border border-success-subtle space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 font-black text-success text-xs">
                      <ShieldCheck className="w-4 h-4 text-success" />
                      <span>
                        {t('tenantOfficialResponseFromAdmin', {
                          name: selectedGrievance.resolvedByName || t('tenantDefaultAdminName'),
                        })}
                      </span>
                    </div>
                    {selectedGrievance.resolvedAt && (
                      <span className="text-[10px] text-success font-semibold">
                        {formatDate(selectedGrievance.resolvedAt)}
                      </span>
                    )}
                  </div>
                  <p className="text-success font-medium whitespace-pre-wrap leading-relaxed">
                    {selectedGrievance.resolutionNote}
                  </p>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-warning-soft border border-warning-subtle text-warning font-medium flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-warning shrink-0" />
                  <span>{t('tenantPendingVerificationNotice')}</span>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-line flex justify-end bg-surface/50">
              <Button size="xs"
                onClick={() => setSelectedGrievance(null)}
              >
                {t('tenantBtnClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal on Exit Unsaved (Rule #10) */}
      {showExitConfirm && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setShowExitConfirm(false)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-line"
          >
            <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black text-foreground">
                {t('tenantConfirmCloseFormTitle')}
              </h3>
              <p className="text-xs text-muted">{t('tenantConfirmCloseFormDesc')}</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <Button size="xs"
                variant="ghost"
                onClick={() => setShowExitConfirm(false)}
                className="flex-1"
              >
                {t('tenantBtnKeepEditing')}
              </Button>
              <Button size="xs" variant="danger"
                onClick={() => {
                  setShowExitConfirm(false)
                  setIsModalOpen(false)
                  resetForm()
                }}
                className="flex-1"
              >
                {t('tenantBtnDiscardAndClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Image Preview Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setPreviewImage(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-card rounded-3xl p-4 max-w-xl w-full space-y-3"
          >
            <div className="flex items-center justify-between border-b pb-2">
              <span className="text-xs font-bold text-foreground/90">
                {t('tenantEvidencePhotoTitle')}
              </span>
              <Button rounded="full"
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => setPreviewImage(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] overflow-hidden rounded-2xl bg-card-hover">
              <img src={previewImage} alt="Preview" className="w-full h-full object-contain" />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
