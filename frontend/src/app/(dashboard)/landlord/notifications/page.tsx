'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Plus,
  CheckCircle2,
  X,
  Send,
  Users,
  Building2,
  Eye,
  Sparkles,
  Search,
  LayoutGrid,
  List,
  RefreshCw,
  MapPin,
  ShieldAlert,
  Smartphone,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'
import {
  announcementService,
  LandlordAnnouncementItem,
  LandlordAnnouncementsSummary,
} from '@/services/announcement.service'
import {
  Button,
  TextInput,
  SelectInput,
  TextareaInput,
  NumberInput,
  SearchInput,
  Text,
  ChipGroup,
  Modal,
} from '@/components/ui'

export default function NotificationsPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const tCommon = useTranslations('common')

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const [isMounted, setIsMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Filter and Search States
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [channelFilter, setChannelFilter] = useState('')

  // Pagination State (Rule #9: Default Grid=6, List=10)
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  // Backend Announcements Data
  const [notifications, setNotifications] = useState<LandlordAnnouncementItem[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [summary, setSummary] = useState<LandlordAnnouncementsSummary>({
    totalAnnouncements: 0,
    totalTargetTenants: 0,
    emergencyCount: 0,
  })

  // Modals & Forms State
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false)
  const [selectedNotifDetail, setSelectedNotifDetail] = useState<LandlordAnnouncementItem | null>(
    null,
  )
  const [deletingNotifId, setDeletingNotifId] = useState<string | null>(null)

  // Form inputs state
  const [notifTitle, setNotifTitle] = useState('')
  const [notifContent, setNotifContent] = useState('')
  const [notifCategory, setNotifCategory] = useState('Điện nước')
  const [notifTargetScope, setNotifTargetScope] = useState('')
  const [notifChannel, setNotifChannel] = useState('Thông báo hệ thống')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  // Toast feedback notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return
    const timer = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(timer)
  }, [toast])

  useEffect(() => {
    setIsMounted(true)
    if (activeBuilding?.name) {
      setNotifTargetScope(activeBuilding.name)
    }
  }, [activeBuilding?.name])

  // Localized category label helper
  const getCategoryLabel = useCallback(
    (category: string) => {
      switch (category) {
        case 'Điện nước':
        case 'Utilities':
          return t('landlordNotificationsCatUtilities')
        case 'Tiền nhà':
        case 'Rent':
        case 'Rent & Billing':
          return t('landlordNotificationsCatRent')
        case 'Nội quy':
        case 'Rules':
        case 'Rules & Policies':
          return t('landlordNotificationsCatRules')
        case 'Khẩn cấp':
        case 'Emergency':
          return t('landlordNotificationsCatEmergency')
        default:
          return category
      }
    },
    [t],
  )

  // Localized channel label helper
  const getChannelLabel = useCallback(
    (channel: string) => {
      switch (channel) {
        case 'Thông báo hệ thống':
        case 'System In-App':
        case 'In-App Notice':
          return t('landlordNotificationsChannelInApp')
        case 'SMS':
          return t('landlordNotificationsChannelSms')
        default:
          return channel
      }
    },
    [t],
  )

  // Reset draft fields completely
  const resetNotifForm = useCallback(() => {
    setNotifTitle('')
    setNotifContent('')
    setNotifCategory('Điện nước')
    setNotifTargetScope(activeBuilding?.name || '')
    setNotifChannel('Thông báo hệ thống')
  }, [activeBuilding?.name])

  // Directly close modal and reset form
  const requestCloseNotifModal = useCallback(() => {
    resetNotifForm()
    setIsNotifModalOpen(false)
  }, [resetNotifForm])

  // Fetch broadcast announcements from real backend API
  const fetchAnnouncements = useCallback(async () => {
    if (!activeBuilding?.id) return
    setIsLoading(true)
    try {
      const res = await announcementService.getAnnouncements(activeBuilding.id, {
        page,
        limit: itemsPerPage,
        search: searchQuery,
        category: categoryFilter,
        channel: channelFilter,
      })

      setNotifications(res.data || [])
      setTotalItems(res.meta?.total || 0)
      setTotalPages(res.meta?.totalPages || 1)
      if (res.summary) {
        setSummary(res.summary)
      }
    } catch (err: any) {
      console.error('Failed to fetch announcements:', err)
      setToast({
        type: 'error',
        text: err?.message || tRef.current('landlordNotificationsToastFetchError'),
      })
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, page, itemsPerPage, searchQuery, categoryFilter, channelFilter])

  useEffect(() => {
    fetchAnnouncements()
  }, [fetchAnnouncements])

  // Reset pagination when search or filters change
  useEffect(() => {
    setPage(1)
  }, [searchQuery, categoryFilter, channelFilter])

  // Broadcast announcement handler
  const handleBroadcastAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!notifTitle.trim() || !notifContent.trim() || !activeBuilding?.id) return

    setIsSubmitting(true)
    try {
      await announcementService.broadcastAnnouncement(activeBuilding.id, {
        title: notifTitle.trim(),
        content: notifContent.trim(),
        category: notifCategory,
        targetScope:
          notifTargetScope.trim() ||
          activeBuilding.name ||
          tRef.current('landlordNotificationsEntireBuilding'),
        channel: notifChannel,
      })

      resetNotifForm()
      setIsNotifModalOpen(false)
      setToast({
        type: 'success',
        text: tRef.current('landlordNotificationsToastBroadcastSuccess'),
      })
      await fetchAnnouncements()
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.message || tRef.current('landlordNotificationsToastBroadcastError'),
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Delete announcement handler
  const handleDeleteAnnouncement = async (id: string) => {
    if (!activeBuilding?.id) return
    setIsDeleting(true)
    try {
      await announcementService.deleteAnnouncement(activeBuilding.id, id)
      setDeletingNotifId(null)
      if (selectedNotifDetail?.id === id) {
        setSelectedNotifDetail(null)
      }
      setToast({
        type: 'success',
        text: tRef.current('landlordNotificationsToastDeleteSuccess'),
      })
      await fetchAnnouncements()
    } catch (err: any) {
      setToast({
        type: 'error',
        text: err?.message || tRef.current('landlordNotificationsToastDeleteError'),
      })
    } finally {
      setIsDeleting(false)
    }
  }

  // Quick Announcement Templates
  const notificationTemplates = useMemo(
    () => [
      {
        title: t('landlordNotificationsTmpl1Title'),
        category: 'Điện nước',
        content: t('landlordNotificationsTmpl1Content', {
          building: activeBuilding?.name || t('landlordNotificationsBuildingFallback'),
        }),
      },
      {
        title: t('landlordNotificationsTmpl2Title'),
        category: 'Tiền nhà',
        content: t('landlordNotificationsTmpl2Content'),
      },
      {
        title: t('landlordNotificationsTmpl3Title'),
        category: 'Nội quy',
        content: t('landlordNotificationsTmpl3Content', {
          building: activeBuilding?.name || t('landlordNotificationsBuildingFallback'),
        }),
      },
      {
        title: t('landlordNotificationsTmpl4Title'),
        category: 'Khẩn cấp',
        content: t('landlordNotificationsTmpl4Content'),
      },
    ],
    [activeBuilding?.name, t],
  )

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordNotificationsStatTotal'),
        value: summary.totalAnnouncements,
        icon: <Send className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC] shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 border-[#2AC1BC]/30 lg:w-[155px]',
        labelColor: 'brand',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'reached',
        label: t('landlordNotificationsStatReached'),
        value: summary.totalTargetTenants,
        icon: <Users className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 lg:w-[155px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'urgent',
        label: t('landlordNotificationsStatUrgent'),
        value: summary.emergencyCount,
        icon: <ShieldAlert className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 lg:w-[155px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
    ],
    [t, summary],
  )

  if (!isMounted) return null

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* Toast Notification Banner */}
      {toast && (
        <div className="fixed top-6 right-6 z-70 animate-in slide-in-from-top-3 duration-200">
          <div
            className={`px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2.5 text-xs font-bold border backdrop-blur-md ${toast.type === 'success'
              ? 'bg-emerald-50/95 text-success border-success-subtle'
              : 'bg-rose-50/95 text-danger border-danger-subtle'
              }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.text}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setToast(null)}
              className="ml-2"
            >
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      )}

      {/* 1. Page Header */}
      <LandlordPageHeader
        title={t('landlordNotificationsHeroTitle')}
        subtitle={t('landlordNotificationsHeroSubtitle')}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => fetchAnnouncements()}
              disabled={isLoading}
              title={t('landlordNotificationsRefreshList')}
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-[#2AC1BC]' : ''}`} />
              <span>{t('landlordNotificationsRefreshList')}</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => setIsNotifModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>{t('landlordNotificationsBtnBroadcast')}</span>
            </Button>
          </>
        }
      />

      {/* Dark Stat Banner */}
      <LandlordStatBanner
        watermarkIcon={<Send className="w-64 h-64 text-white" />}
        chips={statChips}
      />

      {/* 2. Action & Filter Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <SearchInput
            placeholder={t('landlordNotificationsSearchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>

        {/* Filter Controls & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Filter */}
          <div className="w-36 sm:w-40">
            <SelectInput
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              options={[
                { value: '', label: t('landlordNotificationsFilterAllCategories') },
                { value: 'Điện nước', label: t('landlordNotificationsCatUtilities') },
                { value: 'Tiền nhà', label: t('landlordNotificationsCatRent') },
                { value: 'Nội quy', label: t('landlordNotificationsCatRules') },
                { value: 'Khẩn cấp', label: t('landlordNotificationsCatEmergency') },
              ]}
            />
          </div>

          {/* Channel Filter */}
          <div className="w-36 sm:w-40">
            <SelectInput
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              options={[
                { value: '', label: t('landlordNotificationsFilterAllChannels') },
                { value: 'Thông báo hệ thống', label: t('landlordNotificationsChannelInApp') },
                { value: 'Zalo OA', label: t('landlordNotificationsChannelZalo') },
                { value: 'SMS', label: t('landlordNotificationsChannelSms') },
              ]}
            />
          </div>

          {/* View Switcher (Rule #9: Grid is Default) */}
          <div className="flex items-center p-1 bg-card-hover rounded-xl border border-line">
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setViewMode('grid')
                if (itemsPerPage === 10) setItemsPerPage(6)
              }}
              title={t('landlordNotificationsViewGrid')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setViewMode('list')
                if (itemsPerPage === 6) setItemsPerPage(10)
              }}
              title={t('landlordNotificationsViewList')}
            >
              <List className="w-4 h-4" />
            </Button>
          </div>

          </div>
      </div>

      {/* 3. Announcements List Section */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-line text-center">
            <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin mb-3" />
            <p className="text-xs font-bold text-muted">{t('landlordNotificationsLoading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4 bg-card rounded-2xl border border-line border-dashed text-center">
            <div className="w-16 h-16 bg-card-hover rounded-full flex items-center justify-center mb-3 text-muted">
              <Send className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-foreground">
              {t('landlordNotificationsEmptyTitle')}
            </h3>
            <p className="text-xs text-muted mt-1 max-w-sm">
              {t('landlordNotificationsEmptyDesc')}
            </p>
            <Button
              size='sm'
              onClick={() => setIsNotifModalOpen(true)}
              className="mt-4"
            >
              <Plus className="w-4 h-4" />
              <span>{t('landlordNotificationsCreateFirstNotif')}</span>
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* Parallel View 1: Grid View (Default) */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notifications.map(notif => {
              const readPct =
                notif.totalTarget > 0 ? Math.round((notif.readCount / notif.totalTarget) * 100) : 0
              const isEmergency = notif.category === 'Khẩn cấp' || notif.category === 'Emergency'
              const isUtilities = notif.category === 'Điện nước' || notif.category === 'Utilities'
              const isRent = notif.category === 'Tiền nhà' || notif.category === 'Rent'

              return (
                <div
                  key={notif.id}
                  onClick={() => setSelectedNotifDetail(notif)}
                  className="bg-card border border-line rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md hover:border-[#2AC1BC]/40 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Category Badge + Sent Time */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                      <span
                        className={`px-2.5 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${isEmergency
                          ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                          : isUtilities
                            ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                            : isRent
                              ? 'bg-emerald-500/15 text-success border border-emerald-500/30'
                              : 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                          }`}
                      >
                        {getCategoryLabel(notif.category)}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-muted">
                          {notif.sentAt}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={e => {
                            e.stopPropagation()
                            setDeletingNotifId(notif.id)
                          }}
                          title={t('landlordNotificationsDeleteAction')}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Title & Preview */}
                    <div className="py-3 space-y-1.5">
                      <h3 className="font-extrabold text-sm text-foreground group-hover:text-[#2AC1BC] transition-colors line-clamp-1">
                        {notif.title}
                      </h3>
                      <p className="text-muted text-xs line-clamp-2 leading-relaxed whitespace-pre-line">
                        {notif.content}
                      </p>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-2 py-2 border-t border-line text-xs font-bold text-foreground/90">
                      <span className="inline-flex items-center gap-1.5 bg-card-hover px-2.5 py-1 rounded-full text-[11px]">
                        <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span className="truncate max-w-[120px]">{notif.targetScope}</span>
                      </span>
                      <span className="inline-flex items-center gap-1.5 bg-[#2AC1BC]/10 text-[#2AC1BC] px-2.5 py-1 rounded-full text-[11px]">
                        <Smartphone className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                        <span>{getChannelLabel(notif.channel)}</span>
                      </span>
                    </div>

                    {/* Read Progress Bar */}
                    <div className="pt-2 border-t border-line">
                      <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                        <span className="text-muted">
                          {t('landlordNotificationsReadPrefix')}: {notif.readCount}/
                          {notif.totalTarget} {t('landlordNotificationsTenantsUnit')}
                        </span>
                        <span className="text-[#2AC1BC]">{readPct}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#2AC1BC] rounded-full transition-all"
                          style={{ width: `${readPct}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Footer Details Button */}
                  <div className="pt-3 mt-3 border-t border-line flex items-center justify-end">
                    <Button fullWidth
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation()
                        setSelectedNotifDetail(notif)
                      }}
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>{t('landlordNotificationsViewDetails')}</span>
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          /* Parallel View 2: Table/List View */
          <div className="bg-card border border-line rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse min-w-[900px]">
                <thead className="text-[11px] font-black text-muted uppercase bg-card-hover/90 border-b border-line">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap w-80">
                      {t('landlordNotificationsColCategoryTitle')}
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      {t('landlordNotificationsColTargetAudience')}
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      {t('landlordNotificationsColChannel')}
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      {t('landlordNotificationsColReadRate')}
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      {t('landlordNotificationsColSentAt')}
                    </th>
                    <th className="px-4 py-3.5 text-right whitespace-nowrap">
                      {t('landlordNotificationsColActions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line font-medium">
                  {notifications.map(notif => {
                    const readPct =
                      notif.totalTarget > 0
                        ? Math.round((notif.readCount / notif.totalTarget) * 100)
                        : 0
                    const isEmergency =
                      notif.category === 'Khẩn cấp' || notif.category === 'Emergency'
                    const isUtilities =
                      notif.category === 'Điện nước' || notif.category === 'Utilities'
                    const isRent = notif.category === 'Tiền nhà' || notif.category === 'Rent'

                    return (
                      <tr key={notif.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 py-4 max-w-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`px-2 py-0.5 text-[10px] font-black rounded-md uppercase shrink-0 ${isEmergency
                                ? 'bg-rose-500/15 text-rose-600 border border-rose-500/30'
                                : isUtilities
                                  ? 'bg-amber-500/15 text-amber-600 border border-amber-500/30'
                                  : isRent
                                    ? 'bg-emerald-500/15 text-success border border-emerald-500/30'
                                    : 'bg-blue-500/15 text-blue-600 border border-blue-500/30'
                                }`}
                            >
                              {getCategoryLabel(notif.category)}
                            </span>
                            <span className="font-bold text-foreground text-sm truncate">
                              {notif.title}
                            </span>
                          </div>
                          <p className="text-muted text-xs line-clamp-1">{notif.content}</p>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 bg-card-hover text-foreground/90 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                            <Building2 className="w-3.5 h-3.5 text-muted shrink-0" />
                            <span>{notif.targetScope}</span>
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="inline-flex items-center gap-1.5 text-xs font-bold text-foreground/90 whitespace-nowrap">
                            <Smartphone className="w-3.5 h-3.5 text-[#2AC1BC] shrink-0" />
                            <span>{getChannelLabel(notif.channel)}</span>
                          </span>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap min-w-[160px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between text-[11px] font-bold">
                              <span className="text-foreground/90">
                                {notif.readCount}/{notif.totalTarget}{' '}
                                {t('landlordNotificationsTenantsUnit')}
                              </span>
                              <span className="text-[#2AC1BC]">{readPct}%</span>
                            </div>
                            <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                              <div
                                className="h-full bg-[#2AC1BC] rounded-full transition-all"
                                style={{ width: `${readPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 text-muted font-semibold whitespace-nowrap">
                          {notif.sentAt}
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedNotifDetail(notif)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>{t('landlordNotificationsBtnDetails')}</span>
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeletingNotifId(notif.id)}
                              title={t('landlordNotificationsBtnDelete')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
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

        {/* 4. Standardized Pagination Footer (Rule #9) */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-card border border-line rounded-2xl shadow-xs">
          <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
            <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-xl border border-line">
              <span>{t('landlordNotificationsPaginationShowing')}</span>
              <NumberInput
                min={1}
                max={100}
                value={itemsPerPage || ''}
                onChange={e => {
                  const val = parseInt(e.target.value)
                  setItemsPerPage(isNaN(val) || val <= 0 ? 1 : val)
                  setPage(1)
                }}
                containerClassName="w-16 space-y-0"
                className="w-16 text-center font-extrabold text-foreground bg-card border border-line rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs h-7"
              />
              <span>{t('landlordNotificationsPaginationPerPage')}</span>
            </div>

            <span className="hidden sm:inline text-zinc-300">|</span>

            <div>
              <span className="font-extrabold text-foreground">
                {totalItems === 0 ? 0 : (page - 1) * itemsPerPage + 1}
              </span>
              {' - '}
              <span className="font-extrabold text-foreground">
                {Math.min(page * itemsPerPage, totalItems)}
              </span>
              {` ${t('landlordNotificationsPaginationOf')} `}
              <span className="font-extrabold text-foreground">{totalItems}</span>
              {` ${t('landlordNotificationsPaginationAnnouncements')}`}
            </div>
          </div>

          {/* 5-Page Window Pagination (Rule #9) */}
          {(() => {
            const windowSize = 5
            const windowStart = Math.floor((page - 1) / windowSize) * windowSize + 1
            const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
            const visiblePages = Array.from(
              { length: windowEnd - windowStart + 1 },
              (_, i) => windowStart + i,
            )

            return (
              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(Math.max(windowStart - windowSize, 1))}
                >
                  &larr; {t('landlordNotificationsPaginationPrev')}
                </Button>
                {visiblePages.map(p => (
                  <Button
                    type="button"
                    variant={page === p ? 'primary' : 'outline'}
                    size="sm"
                    key={p}
                    onClick={() => setPage(p)}
                  >
                    {p}
                  </Button>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === totalPages || windowStart + windowSize > totalPages}
                  onClick={() => setPage(Math.min(windowStart + windowSize, totalPages))}
                >
                  {t('landlordNotificationsPaginationNext')} &rarr;
                </Button>
              </div>
            )
          })()}
        </div>
      </div>

      {/* 5. MODAL: Create Broadcast Announcement Modal */}
      <Modal
        isOpen={isNotifModalOpen}
        onClose={requestCloseNotifModal}
        size="2xl"
        asForm
        onSubmit={handleBroadcastAnnouncement}
        headerClassName="bg-zinc-900 text-white border-zinc-800"
        header={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2AC1BC]/20 text-[#2AC1BC] rounded-xl border border-[#2AC1BC]/30">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" variant="heading" size="lg" weight="black" color="white" className="tracking-tight">
                {t('landlordNotificationsModalTitle')}
              </Text>
              <Text size="xs" color="subtle" className="text-muted mt-0.5">
                {t('landlordNotificationsModalSubtitle')}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4 custom-scrollbar bg-surface/50"
        footer={
          <div className="flex items-center justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={requestCloseNotifModal}
              disabled={isSubmitting}
            >
              {t('landlordNotificationsBtnCancel')}
            </Button>
            <Button
              size="xs"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={!isSubmitting ? <Send className="w-4 h-4" /> : undefined}
            >
              <span>
                {isSubmitting
                  ? t('landlordNotificationsBroadcasting')
                  : t('landlordNotificationsBtnBroadcastNow')}
              </span>
            </Button>
          </div>
        }
      >
        {/* Quick Templates */}
        <div className="space-y-1.5">
          <label className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#2AC1BC]" />
            <Text as="span" size="xs" weight="bold" className="text-foreground/90 uppercase tracking-wider">
              {t('landlordNotificationsTemplatesLabel')}
            </Text>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {notificationTemplates.map(tmpl => (
              <Button fullWidth size="icon"
                key={tmpl.title}
                type="button"
                variant="ghost"
                onClick={() => {
                  setNotifTitle(tmpl.title)
                  setNotifContent(tmpl.content)
                  setNotifCategory(tmpl.category)
                }}
                className="group flex-col items-start justify-start whitespace-normal"
              >
                <Text size="xs" weight="bold" className="text-foreground group-hover:text-[#2AC1BC] truncate w-full text-left">
                  {tmpl.title}
                </Text>
                <Text size="3xs" weight="medium" color="subtle" className="text-muted mt-0.5 text-left">
                  {getCategoryLabel(tmpl.category)}
                </Text>
              </Button>
            ))}
          </div>
        </div>

        {/* Title */}
        <TextInput
          label={t('landlordNotificationsFieldTitle')}
          required
          placeholder={t('landlordNotificationsFieldTitlePlaceholder')}
          value={notifTitle}
          onChange={e => setNotifTitle(e.target.value)}
        />

        {/* Target & Channel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <TextInput
            label={t('landlordNotificationsFieldTargetScope')}
            value={notifTargetScope}
            onChange={e => setNotifTargetScope(e.target.value)}
            placeholder={t('landlordNotificationsFieldTargetScopePlaceholder')}
          />

          <SelectInput
            label={t('landlordNotificationsFieldChannel')}
            value={notifChannel}
            onChange={e => setNotifChannel(e.target.value)}
            options={[
              {
                value: 'Thông báo hệ thống',
                label: t('landlordNotificationsChannelInAppFull'),
              },
              { value: 'Zalo OA', label: t('landlordNotificationsChannelZalo') },
              { value: 'SMS', label: t('landlordNotificationsChannelSmsDirect') },
            ]}
          />
        </div>

        {/* Category */}
        <SelectInput
          label={t('landlordNotificationsFieldCategory')}
          value={notifCategory}
          onChange={e => setNotifCategory(e.target.value)}
          options={[
            { value: 'Điện nước', label: t('landlordNotificationsCatUtilities') },
            { value: 'Tiền nhà', label: t('landlordNotificationsCatRent') },
            { value: 'Nội quy', label: t('landlordNotificationsCatRules') },
            { value: 'Khẩn cấp', label: t('landlordNotificationsCatEmergency') },
          ]}
        />

        {/* Content */}
        <TextareaInput
          label={t('landlordNotificationsFieldContent')}
          required
          rows={5}
          placeholder={t('landlordNotificationsFieldContentPlaceholder')}
          value={notifContent}
          onChange={e => setNotifContent(e.target.value)}
        />
      </Modal>

      {/* 6. MODAL: View Announcement Details */}
      <Modal
        isOpen={Boolean(selectedNotifDetail)}
        onClose={() => setSelectedNotifDetail(null)}
        size="lg"
        headerClassName="bg-zinc-900 text-white border-zinc-800"
        header={
          selectedNotifDetail ? (
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 rounded-full">
                <Text as="span" variant="badge" size="3xs" weight="black" color="brand">
                  {getCategoryLabel(selectedNotifDetail.category)}
                </Text>
              </span>
              <Text as="h3" size="sm" weight="bold" color="white">
                {t('landlordNotificationsDetailTitle')}
              </Text>
            </div>
          ) : null
        }
        bodyClassName="p-6 space-y-4"
        footer={
          selectedNotifDetail ? (
            <div className="flex items-center justify-between w-full">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDeletingNotifId(selectedNotifDetail.id)
                  setSelectedNotifDetail(null)
                }}
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                <span>{t('landlordNotificationsDetailDelete')}</span>
              </Button>

              <Button
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setSelectedNotifDetail(null)}
              >
                {t('landlordNotificationsDetailClose')}
              </Button>
            </div>
          ) : null
        }
      >
        {selectedNotifDetail && (
          <>
            <div>
              <Text as="h2" size="base" weight="black" className="text-foreground leading-snug mb-1">
                {selectedNotifDetail.title}
              </Text>
              <div className="flex items-center gap-3">
                <Text as="span" size="2xs" weight="bold" color="subtle" className="text-muted">
                  {t('landlordNotificationsDetailSentAt', { time: selectedNotifDetail.sentAt })}
                </Text>
                <Text as="span" size="2xs" color="subtle" className="text-muted">
                  •
                </Text>
                <Text as="span" size="2xs" weight="bold" color="subtle" className="text-muted">
                  {t('landlordNotificationsDetailChannel', {
                    channel: getChannelLabel(selectedNotifDetail.channel),
                  })}
                </Text>
              </div>
            </div>

            <div className="p-4 bg-surface rounded-xl border border-line">
              <Text size="xs" weight="medium" className="text-foreground leading-relaxed whitespace-pre-line">
                {selectedNotifDetail.content}
              </Text>
            </div>

            <div className="p-3 bg-info-soft rounded-xl border border-info-subtle flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <Text as="span" size="xs" weight="bold" className="text-foreground/90">
                  {t('landlordNotificationsDetailTargetReach')}
                </Text>
              </div>
              <Text as="span" size="sm" weight="black" className="text-blue-600">
                {t('landlordNotificationsDetailResidentsUnit', {
                  count: selectedNotifDetail.totalTarget,
                })}
              </Text>
            </div>
          </>
        )}
      </Modal>

      {/* 7. MODAL: Confirm Delete Modal */}
      <Modal
        isOpen={Boolean(deletingNotifId)}
        onClose={() => setDeletingNotifId(null)}
        size="sm"
        zIndex={60}
        showCloseButton={false}
        footer={
          <div className="flex items-center justify-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isDeleting}
              onClick={() => setDeletingNotifId(null)}
              className="flex-1"
            >
              {t('landlordNotificationsBtnCancel')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              disabled={isDeleting}
              isLoading={isDeleting}
              leftIcon={!isDeleting ? <Trash2 className="w-4 h-4" /> : undefined}
              onClick={() => deletingNotifId && handleDeleteAnnouncement(deletingNotifId)}
              className="flex-1"
            >
              <span>{t('landlordNotificationsConfirmDeleteBtn')}</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 bg-danger-soft border border-danger-subtle rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Text as="h3" variant="heading" size="xl" weight="black" className="text-foreground tracking-tight">
              {t('landlordNotificationsConfirmDeleteTitle')}
            </Text>
            <Text size="sm" weight="medium" color="subtle" align="center" className="text-muted leading-relaxed max-w-xs mx-auto">
              {t('landlordNotificationsConfirmDeleteDesc')}
            </Text>
          </div>
        </div>
      </Modal>
    </div>
  )
}
