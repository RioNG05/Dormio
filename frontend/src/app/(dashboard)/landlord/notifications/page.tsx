'use client'

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  Plus,
  CheckCircle2,
  X,
  Send,
  Users,
  Building2,
  Sparkles,
  ShieldAlert,
  Smartphone,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { DashboardPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'
import {
  announcementService,
  LandlordAnnouncementItem,
  LandlordAnnouncementsSummary,
} from '@/services/announcement.service'
import {
  Button,
  TableActionButton,
  TextInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  Text,
  Modal,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Chip,
  EmptyState,
} from '@/components/ui'

export default function NotificationsPage() {
  const { activeBuilding, buildings } = useAuth()
  const t = useTranslations('landlord')

  const tRef = useRef(t)
  useEffect(() => {
    tRef.current = t
  }, [t])

  const [isMounted, setIsMounted] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

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
  const [selectedTargetBuildingId, setSelectedTargetBuildingId] = useState<string>('')
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
    if (activeBuilding?.id && !selectedTargetBuildingId) {
      setSelectedTargetBuildingId(activeBuilding.id)
    }
  }, [activeBuilding?.id, selectedTargetBuildingId])

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
    setSelectedTargetBuildingId(activeBuilding?.id || buildings[0]?.id || '')
    setNotifChannel('Thông báo hệ thống')
  }, [activeBuilding?.id, buildings])

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
    if (!notifTitle.trim() || !notifContent.trim()) return

    setIsSubmitting(true)
    try {
      if (selectedTargetBuildingId === 'all') {
        await Promise.all(
          buildings.map(b =>
            announcementService.broadcastAnnouncement(b.id, {
              title: notifTitle.trim(),
              content: notifContent.trim(),
              category: notifCategory,
              targetScope: b.name,
              channel: notifChannel,
            }),
          ),
        )
      } else {
        const targetHouse =
          buildings.find(b => b.id === selectedTargetBuildingId) || activeBuilding
        if (!targetHouse?.id) return

        await announcementService.broadcastAnnouncement(targetHouse.id, {
          title: notifTitle.trim(),
          content: notifContent.trim(),
          category: notifCategory,
          targetScope: targetHouse.name,
          channel: notifChannel,
        })
      }

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
        icon: <Send className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-primary shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[155px]',
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
          'px-3.5 py-2.5 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[155px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'urgent',
        label: t('landlordNotificationsStatUrgent'),
        value: summary.emergencyCount,
        icon: <ShieldAlert className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[155px]',
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
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-danger shrink-0" />
            )}
            <span>{toast.text}</span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setToast(null)}
              className="ml-2"
            >
              <X />
            </Button>
          </div>
        </div>
      )}

      {/* 1. Page Header */}
      <DashboardPageHeader
        title={t('landlordNotificationsHeroTitle')}
        subtitle={t('landlordNotificationsHeroSubtitle')}
        actions={
          <Button
            size="md"
            onClick={() => setIsNotifModalOpen(true)}
            leftIcon={<Plus />}
          >
            {t('landlordNotificationsBtnBroadcast')}
          </Button>
        }
      />

      {/* Dark Stat Banner */}
      <LandlordStatBanner
        watermarkIcon={<Send className="w-64 h-64 text-white" />}
        chips={statChips}
      />

      {/* 2. Action & Filter Bar */}
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordNotificationsSearchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
            containerClassName="w-full space-y-0"
          />
        }
        filters={
          <>
            <SelectInput
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              containerClassName="w-full sm:w-48 space-y-0"
              options={[
                { value: '', label: t('landlordNotificationsFilterAllCategories') },
                { value: 'Điện nước', label: t('landlordNotificationsCatUtilities') },
                { value: 'Tiền nhà', label: t('landlordNotificationsCatRent') },
                { value: 'Nội quy', label: t('landlordNotificationsCatRules') },
                { value: 'Khẩn cấp', label: t('landlordNotificationsCatEmergency') },
              ]}
            />
            <SelectInput
              value={channelFilter}
              onChange={e => setChannelFilter(e.target.value)}
              containerClassName="w-full sm:w-48 space-y-0"
              options={[
                { value: '', label: t('landlordNotificationsFilterAllChannels') },
                { value: 'Thông báo hệ thống', label: t('landlordNotificationsChannelInApp') },
                { value: 'Zalo OA', label: t('landlordNotificationsChannelZalo') },
                { value: 'SMS', label: t('landlordNotificationsChannelSms') },
              ]}
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

      {/* 3. Announcements List Section */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-card rounded-2xl border border-line text-center">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <p className="text-xs font-bold text-muted">{t('landlordNotificationsLoading')}</p>
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Send className="w-8 h-8" />}
            title={t('landlordNotificationsEmptyTitle')}
            description={t('landlordNotificationsEmptyDesc')}
            action={
              <Button
                size='md'
                onClick={() => setIsNotifModalOpen(true)}
                leftIcon={<Plus />}
              >
                {t('landlordNotificationsCreateFirstNotif')}
              </Button>
            }
          />
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
                <Card
                  key={notif.id}
                  onClick={() => setSelectedNotifDetail(notif)}
                  className="group flex flex-col justify-between"
                >
                  <Card.Header className="mx-4 sm:mx-5 mt-4 sm:mt-5 p-0">
                    {/* Header: Category Badge + Sent Time */}
                    <div className="flex items-center justify-between gap-2 pb-3 border-b border-line">
                      <Chip preventHover variant={`${isEmergency
                        ? 'danger'
                        : isUtilities
                          ? 'warning'
                          : isRent
                            ? 'success'
                            : 'info'
                        }`}
                      >
                        {getCategoryLabel(notif.category)}
                      </Chip>
                      <Text as="span" size="2xs" color="secondary" weight="semibold">
                        {notif.sentAt}
                      </Text>
                    </div>
                  </Card.Header>

                  <Card.Body className="px-4 sm:px-5 py-0">
                    {/* Title & Preview */}
                    <div className="py-3 space-y-1.5">
                      <Text
                        as="h3"
                        size="sm"
                        weight="extrabold"
                        color="default"
                        clamp={1}
                        className="group-hover:text-primary transition-colors"
                      >
                        {notif.title}
                      </Text>
                      <Text
                        as="p"
                        size="xs"
                        color="secondary"
                        clamp={2}
                        className="leading-relaxed whitespace-pre-line"
                      >
                        {notif.content}
                      </Text>
                    </div>

                    {/* Metadata Pills */}
                    <div className="flex flex-wrap items-center gap-2 py-2 border-t border-line text-xs font-bold text-foreground/90">
                      <Chip size='sm' leftIcon={<Smartphone />} variant='success'>
                        {getChannelLabel(notif.channel)}
                      </Chip>
                      <Chip size='sm' leftIcon={<Building2 />}>
                        {notif.targetScope}
                      </Chip>
                    </div>

                    {/* Read Progress Bar */}
                    <div className="pt-2 border-t border-line">
                      <div className="flex items-center justify-between mb-1">
                        <Text as="span" size="2xs" weight="bold" color="secondary">
                          {t('landlordNotificationsReadPrefix')}: {notif.readCount}/
                          {notif.totalTarget} {t('landlordNotificationsTenantsUnit')}
                        </Text>
                        <Text as="span" size="2xs" weight="bold" color="brand">
                          {readPct}%
                        </Text>
                      </div>
                      <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${readPct}%` }}
                        />
                      </div>
                    </div>
                  </Card.Body>

                  {/* Footer Details Button */}
                  <Card.Footer className="mx-4 sm:mx-5 mb-4 sm:mb-5 p-0 pt-3 flex items-center justify-end">
                    <Button
                      variant="danger"
                      onClick={e => {
                        e.stopPropagation()
                        setDeletingNotifId(notif.id)
                      }}
                      leftIcon={<Trash2 />}
                    >
                      {t('landlordNotificationsDeleteAction')}
                    </Button>
                  </Card.Footer>
                </Card>
              )
            })}
          </div>
        ) : (
          /* Parallel View 2: Table/List View */
          <div className="bg-card border border-line rounded-2xl shadow-2xs overflow-hidden">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
                <thead className="text-[11px] font-black text-muted uppercase bg-card-hover/90 border-b border-line">
                  <tr>
                    <th className="px-4 py-3.5 whitespace-nowrap">
                      {t('landlordNotificationsColCategory')}
                    </th>
                    <th className="px-4 py-3.5 whitespace-nowrap min-w-[220px]">
                      {t('landlordNotificationsColTitle')}
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
                      <TableRow
                        key={notif.id}
                        onClick={() => setSelectedNotifDetail(notif)}
                        className="hover:bg-card-hover transition-colors duration-150 group cursor-pointer"
                      >
                        <td className="px-4 py-4 whitespace-nowrap">
                          <Chip
                            preventHover
                            variant={
                              isEmergency
                                ? 'danger'
                                : isUtilities
                                  ? 'warning'
                                  : isRent
                                    ? 'success'
                                    : 'info'
                            }
                          >
                            {getCategoryLabel(notif.category)}
                          </Chip>
                        </td>

                        <td className="px-4 py-4 max-w-sm">
                          <Text
                            as="span"
                            size="sm"
                            weight="bold"
                            color="default"
                            clamp={1}
                            className="block group-hover:text-primary transition-colors"
                          >
                            {notif.title}
                          </Text>
                          {notif.content && (
                            <Text as="p" size="xs" color="secondary" clamp={1} className="mt-0.5">
                              {notif.content}
                            </Text>
                          )}
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <Chip size='sm' leftIcon={<Building2 />}>
                            {notif.targetScope}
                          </Chip>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <Chip size='sm' leftIcon={<Smartphone />} variant='success'>
                            {getChannelLabel(notif.channel)}
                          </Chip>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap min-w-[160px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center justify-between">
                              <Text as="span" size="2xs" weight="bold" color="default">
                                {notif.readCount}/{notif.totalTarget}{' '}
                                {t('landlordNotificationsTenantsUnit')}
                              </Text>
                              <Text as="span" size="2xs" weight="bold" color="brand">
                                {readPct}%
                              </Text>
                            </div>
                            <div className="w-full h-1.5 bg-card-hover rounded-full overflow-hidden">
                              <div
                                className="h-full bg-primary rounded-full transition-all"
                                style={{ width: `${readPct}%` }}
                              />
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" color="secondary" weight="semibold">
                            {notif.sentAt}
                          </Text>
                        </td>

                        <td className="px-4 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            <TableActionButton
                              danger
                              icon={<Trash2 />}
                              onClick={() => setDeletingNotifId(notif.id)}
                              title={t('landlordNotificationsBtnDelete')}
                            />
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

        {/* 4. Standardized Pagination Footer (Rule #9) */}
        <Pagination
          currentPage={page}
          totalItems={totalItems}
          pageSize={itemsPerPage}
          onPageChange={setPage}
          onPageSizeChange={setItemsPerPage}
          pageSizeMax={100}
        />
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
            <div className="p-2 bg-primary/20 text-primary rounded-xl border border-primary/30">
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
              size='md'
              variant="outline"
              onClick={requestCloseNotifModal}
              disabled={isSubmitting}
            >
              {t('landlordNotificationsBtnCancel')}
            </Button>
            <Button
              size="md"
              type="submit"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              leftIcon={!isSubmitting ? <Send /> : undefined}
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
          <label className="flex items-center gap-1 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <Text as="span" size="xs" weight="bold" className="text-foreground/90 uppercase tracking-wider">
              {t('landlordNotificationsTemplatesLabel')}
            </Text>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {notificationTemplates.map(tmpl => (
              <Button
                key={tmpl.title}
                fullWidth
                size="lg"
                variant="outline"
                onClick={() => {
                  setNotifTitle(tmpl.title)
                  setNotifContent(tmpl.content)
                  setNotifCategory(tmpl.category)
                }}
                className="h-auto py-2.5 px-3 group flex-col items-start justify-start whitespace-normal gap-1"
                title={tmpl.title}
              >
                <Text
                  size="xs"
                  weight="bold"
                  className="text-foreground group-hover:text-primary w-full text-left break-words leading-snug"
                >
                  {tmpl.title}
                </Text>
                <Text
                  size="3xs"
                  weight="medium"
                  color="subtle"
                  className="text-muted text-left"
                >
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
          <SelectInput
            label={t('landlordNotificationsFieldTargetScope')}
            value={selectedTargetBuildingId || activeBuilding?.id || buildings[0]?.id || ''}
            onChange={e => setSelectedTargetBuildingId(e.target.value)}
            options={[
              ...(buildings.length > 1
                ? [
                    {
                      value: 'all',
                      label: `${t('landlordNotificationsAllHouses')} (${buildings.length})`,
                    },
                  ]
                : []),
              ...(buildings.length > 0
                ? buildings.map(b => ({
                    value: b.id,
                    label: b.name,
                  }))
                : activeBuilding
                  ? [{ value: activeBuilding.id, label: activeBuilding.name }]
                  : []),
            ]}
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
              <Chip size='sm' preventHover variant='default'>
                {getCategoryLabel(selectedNotifDetail.category)}
              </Chip>
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
                variant="danger"
                onClick={() => {
                  setDeletingNotifId(selectedNotifDetail.id)
                  setSelectedNotifDetail(null)
                }}
                leftIcon={<Trash2 />}
              >
                {t('landlordNotificationsDetailDelete')}
              </Button>

              <Button
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
                <Users className="w-4 h-4 text-info" />
                <Text as="span" size="xs" weight="bold" className="text-foreground/90">
                  {t('landlordNotificationsDetailTargetReach')}
                </Text>
              </div>
              <Text as="span" size="sm" weight="black" className="text-info">
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
              variant="outline"
              disabled={isDeleting}
              onClick={() => setDeletingNotifId(null)}
              className="flex-1"
            >
              {t('landlordNotificationsBtnCancel')}
            </Button>
            <Button
              variant="danger"
              disabled={isDeleting}
              isLoading={isDeleting}
              leftIcon={!isDeleting ? <Trash2 /> : undefined}
              onClick={() => deletingNotifId && handleDeleteAnnouncement(deletingNotifId)}
              className="flex-1"
            >
              <span>{t('landlordNotificationsConfirmDeleteBtn')}</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-5 text-center">
          <div className="w-14 h-14 bg-danger-soft border border-danger-subtle rounded-2xl flex items-center justify-center mx-auto text-danger shadow-2xs">
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
