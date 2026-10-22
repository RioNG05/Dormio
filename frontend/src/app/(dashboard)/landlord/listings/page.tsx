'use client'

import React, { useState, useEffect, useMemo } from 'react'
import {
  Plus,
  Search,
  Image as ImageIcon,
  ChevronDown,
  LayoutGrid,
  List,
  Eye,
  EyeOff,
  Coins,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  Loader2,
  Wand2,
} from 'lucide-react'
import Link from 'next/link'
import { redirect, useRouter } from 'next/navigation'
import { FEATURE_FLAGS } from '@/config/features'
import {
  postService,
  PostListing,
  PostQuotaStatus,
  UnlistedVacantRoom,
} from '@/services/post.service'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { Button, TextInput, SelectInput, NumberInput, SearchInput, Pagination, ViewModeToggle, FilterToolbar, TableRow, Card } from '@/components/ui'
import { DashboardPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

export default function ListingsPage() {
  if (!FEATURE_FLAGS.ENABLE_BHRP) {
    redirect('/landlord')
  }
  const router = useRouter()
  const t = useTranslations('landlord')
  const { currentLocale } = useLanguage()

  // View mode: Standardized to Grid view as default
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [buildingFilter, setBuildingFilter] = useState('all')

  // Pagination states
  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(6) // Default 6 for grid, 10 for table
  const [totalItems, setTotalItems] = useState(0)
  const [totalPages, setTotalPages] = useState(1)

  // Data states
  const [listings, setListings] = useState<PostListing[]>([])
  const [quota, setQuota] = useState<PostQuotaStatus | null>(null)
  const [unlistedRooms, setUnlistedRooms] = useState<UnlistedVacantRoom[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  // Fetch listings and quota
  const loadData = async () => {
    try {
      setIsLoading(true)
      const [quotaRes, listingsRes, unlistedRes] = await Promise.allSettled([
        postService.getQuota(),
        postService.getMyListings({
          page,
          limit: pageSize,
          status: statusFilter || undefined,
          search: searchQuery || undefined,
        }),
        postService.getUnlistedRooms(),
      ])

      if (quotaRes.status === 'fulfilled') {
        setQuota(quotaRes.value)
      } else {
        setQuota({
          isLandlord: true,
          planName: 'free',
          baseDailyQuota: 3,
          bonusDailyQuota: 0,
          dailyPostQuota: 3,
          freePostsUsedToday: 0,
          freePostsRemainingToday: 3,
          purchasedCreditsAvailable: 0,
          canPublish: true,
        })
      }

      if (listingsRes.status === 'fulfilled') {
        setListings(listingsRes.value.data || [])
        setTotalItems(listingsRes.value.meta?.total || 0)
        setTotalPages(listingsRes.value.meta?.totalPages || 1)
      } else {
        setListings([])
        setTotalItems(0)
        setTotalPages(1)
      }

      if (unlistedRes.status === 'fulfilled') {
        setUnlistedRooms(unlistedRes.value || [])
      } else {
        setUnlistedRooms([])
      }
    } catch (err: any) {
      console.error('Error loading listings data:', err)
      setListings([])
      setTotalItems(0)
      setTotalPages(1)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [page, pageSize, statusFilter, searchQuery])

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadData()
  }

  const handleToggleStatus = async (item: PostListing) => {
    const newStatus = item.status === 'posted' ? 'hidden' : 'posted'
    try {
      await postService.updatePostStatus(item.id, newStatus)
      showToast(
        newStatus === 'posted'
          ? t('landlordListingsToastShowSuccess', { title: item.title })
          : t('landlordListingsToastHideSuccess', { title: item.title }),
      )
      loadData()
    } catch (err: any) {
      showToast(err.message || t('landlordListingsToastStatusError'), 'error')
    }
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'freeToday',
        label: t('landlordListingsFreeToday'),
        value: quota ? `${quota.freePostsRemainingToday} / ${quota.dailyPostQuota}` : '1 / 1',
        icon: <Coins className="w-5 h-5 text-accent shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-accent/10 hover:bg-accent/20 border-accent/30 lg:w-[150px]',
        labelClassName: 'text-accent',
        valueColor: 'white',
        valueClassName: 'text-base leading-none mt-1',
      },
      {
        key: 'paidCredits',
        label: t('landlordListingsPaidCredits'),
        value: t('landlordListingsPaidUnit', { count: quota?.purchasedCreditsAvailable ?? 0 }),
        icon: <Sparkles className="w-5 h-5 text-primary shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[150px]',
        labelColor: 'brand',
        valueColor: 'brand',
        valueClassName: 'text-base leading-none mt-1',
      },
      {
        key: 'published',
        label: t('landlordListingsTotalPublished'),
        value: t('landlordListingsPaidUnit', { count: totalItems }),
        icon: <Eye className="w-5 h-5 text-blue-400 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[150px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-base leading-none mt-1',
      },
    ],
    [t, quota, totalItems],
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 p-4 rounded-2xl shadow-xl flex items-center gap-3 text-sm font-bold animate-in slide-in-from-bottom-2 duration-300 ${
            toast.type === 'success'
              ? 'bg-success text-white shadow-success/20'
              : 'bg-danger text-white shadow-danger/20'
          }`}
        >
          {toast.type === 'success' ? (
            <ShieldCheck className="w-5 h-5" />
          ) : (
            <AlertCircle className="w-5 h-5" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Top Header & Action */}
      <DashboardPageHeader
        title={t('landlordListingsPageTitle')}
        subtitle={t('landlordListingsPageSubtitle')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/landlord/listings/create')}
            className="bg-accent hover:bg-[#ff5518] text-white"
          >
            <Plus className="w-4 h-4" /> {t('landlordListingsNewListingBtn')}
          </Button>
        }
      />

      {/* Dark Banner Card Hero */}
      <LandlordStatBanner
        watermarkIcon={<ImageIcon className="w-64 h-64" />}
        chips={statChips}
      />

      {/* AI Rental Post Suggestions for Unlisted Vacant Rooms */}
      {unlistedRooms.length > 0 && (
        <div className="bg-linear-to-r from-teal-950 via-zinc-900 to-zinc-900 border border-teal-800/40 rounded-3xl p-5 sm:p-6 text-white shadow-lg space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-primary/20 text-primary border border-primary/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-300" />{' '}
                  {t('landlordListingsVacantBannerTag')}
                </span>
                <span className="text-xs text-zinc-300">
                  {t('landlordListingsVacantBannerCount', { count: unlistedRooms.length })}
                </span>
              </div>
              <h3 className="text-base font-bold text-white">
                {t('landlordListingsVacantBannerTitle')}
              </h3>
            </div>
            <Link
              href="/landlord/listings/create"
              className="text-xs font-bold text-primary hover:underline"
            >
              {t('landlordListingsVacantBannerViewAll')}
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {unlistedRooms.slice(0, 3).map(room => (
              <div
                key={room.roomId}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/50 transition-all flex items-center justify-between gap-3"
              >
                <div className="space-y-1 text-xs">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <span>
                      {t('landlordListingsVacantRoomFloor', {
                        room: room.roomNumber,
                        floor: room.floor,
                      })}
                    </span>
                    <span className="text-[10px] text-primary font-semibold">
                      • {room.roomTypeName}
                    </span>
                  </div>
                  <div className="text-[11px] text-muted line-clamp-1">
                    {room.boardingHouseName}
                  </div>
                  <div className="text-[10px] text-amber-300">
                    {t('landlordListingsVacantDays', { days: room.vacantDays })}
                  </div>
                </div>
                <Link
                  href={`/landlord/listings/create?roomId=${room.roomId}&aiDraft=true`}
                  className="shrink-0 flex items-center gap-1.5 px-3 py-2 bg-primary hover:bg-[#23a5a0] text-white text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  <span>{t('landlordListingsVacantAiDraftBtn')}</span>
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Filter and View Mode Toolbar */}
      <FilterToolbar
        search={
          <form onSubmit={handleSearchSubmit}>
            <SearchInput
              value={searchQuery}
              onChange={val => {
                setSearchQuery(val)
                setPage(1)
              }}
              placeholder={t('landlordListingsSearchPlaceholder')}
              containerClassName="w-full space-y-0"
              className="w-full py-2 text-xs border border-line rounded-xl focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-colors"
            />
          </form>
        }
        filters={
          <SelectInput
            value={statusFilter}
            onChange={e => {
              setStatusFilter(e.target.value)
              setPage(1)
            }}
            containerClassName="w-auto space-y-0"
            className="rounded-xl border border-line pl-3 pr-8 py-2 text-xs font-semibold text-foreground/90 bg-surface/50 hover:bg-card focus:outline-none focus:border-accent transition-colors cursor-pointer"
            options={[
              { value: '', label: t('landlordListingsFilterAllStatus') },
              { value: 'posted', label: t('landlordListingsStatusPosted') },
              { value: 'draft', label: t('landlordListingsStatusDraft') },
              { value: 'hidden', label: t('landlordListingsStatusHidden') },
            ]}
          />
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={setViewMode}
            showLabels
          />
        }
      />

      {/* Loading state */}
      {isLoading ? (
        <div className="bg-card border border-line rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-xs font-bold text-muted">{t('landlordListingsLoading')}</span>
        </div>
      ) : listings.length === 0 ? (
        /* Empty State */
        <div className="bg-card border border-line rounded-3xl p-16 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
          <div className="w-16 h-16 rounded-full bg-accent-soft text-accent flex items-center justify-center">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="text-base font-black text-foreground">
              {t('landlordListingsEmptyTitle')}
            </h3>
            <p className="text-xs text-muted">{t('landlordListingsEmptyDesc')}</p>
          </div>
          <Link
            href="/landlord/listings/create"
            className="flex items-center gap-2 px-6 py-2.5 text-xs font-bold text-white bg-accent hover:bg-[#ff5518] rounded-xl shadow-md shadow-accent/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" /> {t('landlordListingsCreateFirstBtn')}
          </Link>
        </div>
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map(item => {
            const firstImage =
              item.images && item.images.length > 0
                ? item.images[0].url
                : 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'

            return (
              <Card
                key={item.id}
                className="overflow-hidden shadow-2xs hover:shadow-md hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 flex flex-col group"
              >
                {/* Thumbnail Image */}
                <Card.Header className="relative aspect-video w-full bg-card-hover overflow-hidden p-0">
                  <img
                    src={firstImage}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={e => {
                      ;(e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'
                    }}
                  />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span
                      className={`px-3 py-1 text-[10px] font-black uppercase rounded-full shadow-sm backdrop-blur-md ${
                        item.status === 'posted'
                          ? 'bg-emerald-500/90 text-white'
                          : item.status === 'draft'
                            ? 'bg-amber-500/90 text-white'
                            : 'bg-zinc-800/90 text-zinc-200'
                      }`}
                    >
                      {item.status === 'posted'
                        ? t('landlordListingsStatusPosted')
                        : item.status === 'draft'
                          ? t('landlordListingsStatusDraft')
                          : t('landlordListingsStatusHidden')}
                    </span>
                    <span className="px-2.5 py-1 text-[10px] font-bold rounded-full bg-black/60 text-white backdrop-blur-md">
                      {item.sourceType === 'free_quote'
                        ? t('landlordListingsSourceFree')
                        : t('landlordListingsSourcePaid')}
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 px-2.5 py-1 bg-black/70 backdrop-blur-md rounded-xl text-white text-[10px] font-bold flex items-center gap-1.5">
                    <Eye className="w-3 h-3 text-primary" />{' '}
                    {t('landlordListingsViewsBadge', { count: item.viewsCount })}
                  </div>
                </Card.Header>

                {/* Content */}
                <Card.Body className="p-6 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="font-bold text-foreground/90">
                        {item.room
                          ? t('landlordListingsRoomLabel', {
                              room: item.room.roomNumber,
                              house:
                                item.room.boardingHouseName || t('landlordListingsRoomFallback'),
                            })
                          : t('landlordListingsUnlinkedRoom')}
                      </span>
                      <span>
                        {new Date(item.createdAt).toLocaleDateString(
                          currentLocale === 'vi' ? 'vi-VN' : 'en-US',
                        )}
                      </span>
                    </div>

                    <h3 className="text-base font-black text-foreground line-clamp-2 leading-snug group-hover:text-accent transition-colors">
                      {item.title}
                    </h3>

                    <p className="text-xs text-muted line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Financial & Controls */}
                  <Card.Footer className="pt-4 border-t border-line flex items-center justify-between">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-muted">
                        {t('landlordListingsDepositHolding')}
                      </div>
                      <div className="text-sm font-black text-accent">
                        {Number(item.depositAmount).toLocaleString(
                          currentLocale === 'vi' ? 'vi-VN' : 'en-US',
                        )}{' '}
                        ₫
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(item)}
                        title={
                          item.status === 'posted'
                            ? t('landlordListingsTitleHide')
                            : t('landlordListingsTitleShow')
                        }
                      >
                        {item.status === 'posted' ? (
                          <>
                            <EyeOff className="w-3.5 h-3.5" /> {t('landlordListingsBtnToggleHide')}
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5" /> {t('landlordListingsActionRepublish')}
                          </>
                        )}
                      </Button>
                    </div>
                    </Card.Footer>
                  </Card.Body>
                </Card>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW */
        <div className="bg-card border border-line rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-line text-[11px] font-black uppercase text-muted tracking-wider">
                  <th className="px-6 py-4">{t('landlordListingsColListing')}</th>
                  <th className="px-6 py-4">{t('landlordListingsColLinkedRoom')}</th>
                  <th className="px-6 py-4">{t('landlordListingsColDeposit')}</th>
                  <th className="px-6 py-4">{t('landlordListingsColQuota')}</th>
                  <th className="px-6 py-4">{t('landlordListingsColViews')}</th>
                  <th className="px-6 py-4">{t('landlordListingsColStatus')}</th>
                  <th className="px-6 py-4 text-right">{t('landlordListingsColActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-xs">
                {listings.map(item => (
                  <TableRow key={item.id} className="group">
                    <td className="px-6 py-4 max-w-xs">
                      <div className="font-bold text-foreground line-clamp-1">{item.title}</div>
                      <div className="text-[11px] text-muted mt-0.5 line-clamp-1">
                        {item.content}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-foreground/90">
                      {item.room
                        ? `P.${item.room.roomNumber} (${item.room.boardingHouseName || t('landlordListingsRoomFallback')})`
                        : '—'}
                    </td>
                    <td className="px-6 py-4 font-black text-accent">
                      {Number(item.depositAmount).toLocaleString(
                        currentLocale === 'vi' ? 'vi-VN' : 'en-US',
                      )}{' '}
                      ₫
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-card-hover text-foreground/90">
                        {item.sourceType === 'free_quote'
                          ? t('landlordListingsSourceFree')
                          : t('landlordListingsSourcePaid')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-muted font-bold">{item.viewsCount}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 text-[10px] font-black rounded-full uppercase ${
                          item.status === 'posted'
                            ? 'bg-success-soft text-success border border-success-subtle'
                            : item.status === 'draft'
                              ? 'bg-warning-soft text-warning border border-warning-subtle'
                              : 'bg-card-hover text-muted border border-line'
                        }`}
                      >
                        {item.status === 'posted'
                          ? t('landlordListingsStatusPosted')
                          : item.status === 'draft'
                            ? t('landlordListingsStatusDraft')
                            : t('landlordListingsStatusHidden')}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleStatus(item)}
                      >
                        {item.status === 'posted'
                          ? t('landlordListingsBtnToggleHide')
                          : t('landlordListingsBtnToggleShow')}
                      </Button>
                    </td>
                  </TableRow>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Pagination Bar */}
      <Pagination
        currentPage={page}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />
    </div>
  )
}
