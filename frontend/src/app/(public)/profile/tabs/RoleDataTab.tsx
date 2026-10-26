'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Building2,
  Home,
  MapPin,
  ExternalLink,
  Phone,
  FileText,
  Loader2,
} from 'lucide-react'
import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { Button, Form, Text, EmptyState, SelectInput } from '@/components/ui'
import { formatCurrency, formatDate } from '@/utils'
import {
  getBoardingHouseOverview,
  type BoardingHouseOverview,
} from '@/services/boarding-house.service'
import {
  subscriptionService,
  type CurrentSubscriptionResponse,
} from '@/services/subscription.service'
import {
  getTenantTenancyDetails,
  getTenantContractPrintHtml,
  downloadTenantContractDocument,
  type TenantTenancyDetails,
} from '@/services/contract.service'

export default function RoleDataTab() {
  const t = useTranslations('guest')
  const { currentLocale } = useLanguage()
  const {
    user,
    capabilities,
    buildings,
    isBuildingsLoading,
    activeBuildingId,
    selectBuilding,
    tenancies,
    isTenanciesLoading,
    activeTenancyId,
    selectTenancy,
  } = useAuth()
  const { toast } = useToast()

  const isLandlord = user?.role === 'landlord' || capabilities?.isLandlord

  // Landlord state
  const currentBuilding = useMemo(() => {
    return buildings.find(b => b.id === activeBuildingId) || buildings[0] || null
  }, [buildings, activeBuildingId])

  const [overview, setOverview] = useState<BoardingHouseOverview | null>(null)
  const [isOverviewLoading, setIsOverviewLoading] = useState<boolean>(false)
  const [subscription, setSubscription] = useState<CurrentSubscriptionResponse | null>(null)
  const [isSubLoading, setIsSubLoading] = useState<boolean>(false)

  // Fetch Landlord overview & subscription when active building changes
  useEffect(() => {
    if (!isLandlord || !currentBuilding?.id) return

    let isMounted = true
    const buildingId = currentBuilding.id

    const fetchLandlordData = async () => {
      setIsOverviewLoading(true)
      setIsSubLoading(true)
      try {
        const [overviewRes, subRes] = await Promise.allSettled([
          getBoardingHouseOverview(buildingId),
          subscriptionService.getCurrentSubscription(buildingId),
        ])

        if (!isMounted) return

        if (overviewRes.status === 'fulfilled') {
          setOverview(overviewRes.value)
        } else {
          setOverview(null)
        }

        if (subRes.status === 'fulfilled') {
          setSubscription(subRes.value)
        } else {
          setSubscription(null)
        }
      } finally {
        if (isMounted) {
          setIsOverviewLoading(false)
          setIsSubLoading(false)
        }
      }
    }

    fetchLandlordData()

    return () => {
      isMounted = false
    }
  }, [isLandlord, currentBuilding?.id])

  // Tenant state
  const selectedTenancyId = useMemo(() => {
    return activeTenancyId || tenancies[0]?.contractId || ''
  }, [activeTenancyId, tenancies])

  const activeTenancyItem = useMemo(() => {
    return tenancies.find(t => t.contractId === selectedTenancyId) || tenancies[0] || null
  }, [tenancies, selectedTenancyId])

  const [tenancyDetails, setTenancyDetails] = useState<TenantTenancyDetails | null>(null)
  const [isDetailsLoading, setIsDetailsLoading] = useState<boolean>(false)
  const [isDownloadingContract, setIsDownloadingContract] = useState<boolean>(false)

  // Fetch Tenant tenancy details when selected tenancy changes
  useEffect(() => {
    if (isLandlord) return

    let isMounted = true
    const fetchTenancy = async () => {
      setIsDetailsLoading(true)
      try {
        const res = await getTenantTenancyDetails(selectedTenancyId || undefined, { silent: true })
        if (isMounted) {
          setTenancyDetails(res)
        }
      } catch {
        if (isMounted) {
          setTenancyDetails(null)
        }
      } finally {
        if (isMounted) {
          setIsDetailsLoading(false)
        }
      }
    }

    fetchTenancy()

    return () => {
      isMounted = false
    }
  }, [isLandlord, selectedTenancyId])

  // Tenant contract dates & elapsed progress calculations
  const contract = tenancyDetails?.contract
  const startDate = contract?.startDate || activeTenancyItem?.startDate
  const endDate = contract?.endDate || activeTenancyItem?.endDate
  const hasContract = Boolean(contract && startDate && endDate)

  const durationStats = useMemo(() => {
    if (!startDate || !endDate) {
      return { stayed: 0, total: 0, percent: 0, remainingMonths: 0 }
    }
    const start = new Date(startDate).getTime()
    const end = new Date(endDate).getTime()
    if (isNaN(start) || isNaN(end) || end <= start) {
      return { stayed: 0, total: 0, percent: 0, remainingMonths: 0 }
    }
    const now = Date.now()
    const totalMs = end - start
    const elapsedMs = Math.max(0, Math.min(totalMs, now - start))
    const percent = Math.min(100, Math.max(0, Math.round((elapsedMs / totalMs) * 100)))

    const msPerMonth = 30 * 24 * 60 * 60 * 1000
    const totalMonths = Math.max(1, Math.round(totalMs / msPerMonth))
    const stayedMonths = Math.max(0, Math.min(totalMonths, Math.round(elapsedMs / msPerMonth)))
    const remainingMonths = Math.max(0, totalMonths - stayedMonths)

    return { stayed: stayedMonths, total: totalMonths, percent, remainingMonths }
  }, [startDate, endDate])

  // Tenant contract download / preview action
  const handleDownloadContract = useCallback(async () => {
    if (!contract?.id) {
      toast.info(t('guestProfileAlertNoContractPdf'))
      return
    }

    setIsDownloadingContract(true)
    try {
      if (contract.documents && contract.documents.length > 0) {
        await downloadTenantContractDocument(
          contract.documents[0].id,
          undefined,
          contract.id,
        )
        toast.success(t('guestProfileDownloadContractPdfSuccess'))
      } else {
        const html = await getTenantContractPrintHtml(true, contract.id)
        const printWindow = window.open('', '_blank')
        if (printWindow) {
          printWindow.document.write(html)
          printWindow.document.close()
        } else {
          toast.error(t('guestProfileDownloadContractPdfFailed'))
        }
      }
    } catch {
      toast.error(t('guestProfileDownloadContractPdfFailed'))
    } finally {
      setIsDownloadingContract(false)
    }
  }, [contract, t, toast])

  // ==========================================
  // RENDER LANDLORD VIEW
  // ==========================================
  if (isLandlord) {
    if (isBuildingsLoading) {
      return (
        <div className="bg-card rounded-3xl p-6 sm:p-8 border border-line space-y-6 animate-pulse">
          <div className="flex items-center justify-between pb-4 border-b border-line">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-muted/20" />
              <div className="space-y-2">
                <div className="h-5 w-40 bg-muted/20 rounded-md" />
                <div className="h-3 w-56 bg-muted/20 rounded-md" />
              </div>
            </div>
            <div className="h-10 w-32 bg-muted/20 rounded-2xl" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="h-20 bg-surface rounded-2xl border border-line" />
            <div className="h-20 bg-surface rounded-2xl border border-line" />
            <div className="h-20 bg-surface rounded-2xl border border-line" />
          </div>
        </div>
      )
    }

    if (!currentBuilding || buildings.length === 0) {
      return (
        <EmptyState
          icon={<Building2 className="w-8 h-8 text-primary" />}
          title={t('guestProfileLandlordEmptyTitle')}
          description={t('guestProfileLandlordEmptyDesc')}
          action={{
            label: t('guestProfileLandlordEmptyAction'),
            href: '/landlord/setup',
          }}
        />
      )
    }

    const totalRooms = overview?.rooms?.totalRooms ?? currentBuilding.totalRooms ?? 0
    const monthlyRevenue = Number(overview?.financial?.currentMonthRevenue) || 0
    const subTier = subscription?.tier || 'free'
    const tierLabel =
      subTier === 'pro'
        ? t('guestProfileTierPro')
        : subTier === 'plus'
          ? t('guestProfileTierPlus')
          : t('guestProfileTierFree')

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-sm space-y-6">
          {/* Header with Building Selector & Jump Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-4 gap-4">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent/10 text-accent flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                <Building2 className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <Text as="h3" variant="heading" size="lg" weight="black">
                  {currentBuilding.name}
                </Text>

                {currentBuilding.address ? (
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(currentBuilding.address)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline inline-flex items-center gap-1.5 text-muted hover:text-primary transition-colors"
                  >
                    <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                    <Text variant="subtitle" size="xs" weight="medium">
                      {currentBuilding.address}
                    </Text>
                    <ExternalLink className="w-3 h-3 text-muted shrink-0" />
                  </a>
                ) : (
                  <Text variant="subtitle" size="xs" weight="medium" color="subtle">
                    {t('guestProfileNotUpdated')}
                  </Text>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {buildings.length > 1 && (
                <div className="w-full sm:w-52">
                  <SelectInput
                    value={currentBuilding.id}
                    onChange={e => selectBuilding(e.target.value)}
                    options={buildings.map(b => ({
                      value: b.id,
                      label: b.name,
                    }))}
                  />
                </div>
              )}

              <Button
                href="/landlord"
                variant="accent"
                size="md"
                leftIcon={<Building2 className="shrink-0" />}
                rightIcon={<span>&rarr;</span>}
                className="w-full sm:w-auto rounded-2xl hover:scale-105"
              >
                {t('guestProfileOpenDashboard')}
              </Button>
            </div>
          </div>

          {/* Stats Grid */}
          <Form.Grid cols={3}>
            <div className="p-4 bg-surface rounded-2xl border border-line space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileLandlordManagedRooms')}
              </Text>
              <Text as="span" variant="heading" size="lg" weight="black" className="block">
                {isOverviewLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                ) : (
                  t('guestProfileLandlordRoomsCount', { count: totalRooms })
                )}
              </Text>
            </div>

            <div className="p-4 bg-surface rounded-2xl border border-line space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileLandlordRevenueMonth')}
              </Text>
              <Text
                as="span"
                variant="heading"
                size="lg"
                weight="black"
                color="brand"
                className="block"
              >
                {isOverviewLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-muted" />
                ) : (
                  formatCurrency(monthlyRevenue, currentLocale)
                )}
              </Text>
            </div>

            <div className="p-4 bg-surface rounded-2xl border border-line space-y-1">
              <Text
                as="span"
                variant="overline"
                size="3xs"
                weight="bold"
                color="subtle"
                className="block"
              >
                {t('guestProfileLandlordSubscription')}
              </Text>
              <Text
                as="span"
                size="xs"
                weight="black"
                color={subTier === 'pro' ? 'brand' : subTier === 'plus' ? 'orange' : 'secondary'}
                uppercase
                className="block"
              >
                {isSubLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-muted" />
                ) : (
                  tierLabel
                )}
              </Text>
            </div>
          </Form.Grid>
        </div>
      </div>
    )
  }

  // ==========================================
  // RENDER TENANT VIEW
  // ==========================================
  if (isTenanciesLoading || isDetailsLoading) {
    return (
      <div className="bg-card rounded-3xl p-6 sm:p-8 border border-line space-y-6 animate-pulse">
        <div className="flex flex-col sm:flex-row justify-between pb-5 border-b border-line gap-4">
          <div className="space-y-2">
            <div className="h-5 w-24 bg-muted/20 rounded-full" />
            <div className="h-8 w-64 bg-muted/20 rounded-md" />
            <div className="h-4 w-72 bg-muted/20 rounded-md" />
          </div>
          <div className="h-12 w-44 bg-muted/20 rounded-2xl" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="h-24 bg-surface rounded-2xl border border-line" />
          <div className="h-24 bg-surface rounded-2xl border border-line" />
          <div className="h-24 bg-surface rounded-2xl border border-line" />
        </div>
        <div className="h-16 bg-surface rounded-2xl border border-line" />
        <div className="h-24 bg-surface rounded-2xl border border-line" />
      </div>
    )
  }

  const roomNumber = tenancyDetails?.room?.roomNumber || activeTenancyItem?.roomNumber
  const houseName = tenancyDetails?.boardingHouse?.name || activeTenancyItem?.boardingHouseName
  const houseAddress = tenancyDetails?.boardingHouse?.address || activeTenancyItem?.boardingHouseAddress
  const landlordName = tenancyDetails?.boardingHouse?.landlord?.name
  const landlordPhone = tenancyDetails?.boardingHouse?.landlord?.phoneNumber
  const rentPrice = contract?.rentPrice ?? activeTenancyItem?.rentPrice ?? 0
  const depositAmount = contract?.depositAmount ?? 0

  if (!roomNumber && !houseName && (!tenancies || tenancies.length === 0)) {
    return (
      <EmptyState
        icon={<Home className="w-8 h-8 text-primary" />}
        title={t('guestProfileTenantEmptyTitle')}
        description={t('guestProfileTenantEmptyDesc')}
        action={{
          label: t('guestProfileTenantEmptyAction'),
          href: '/rooms',
        }}
      />
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-card rounded-3xl p-5 sm:p-8 border border-line shadow-sm space-y-6">
        {/* Multi-Tenancy Room Switcher if tenant occupies multiple rooms */}
        {tenancies.length > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-line pb-4">
            <Text variant="subtitle" size="xs" weight="bold" color="secondary">
              {t('guestProfileTenantSelectRoom')}:
            </Text>
            <div className="w-full sm:w-72">
              <SelectInput
                value={selectedTenancyId}
                onChange={e => selectTenancy(e.target.value)}
                options={tenancies.map(t => ({
                  value: t.contractId,
                  label: `${t.roomNumber} - ${t.boardingHouseName}`,
                }))}
              />
            </div>
          </div>
        )}

        {/* Header CTA to Jump to Tenant Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-line pb-5 gap-4">
          <div className="space-y-1.5">
            <Text
              as="span"
              variant="badge"
              size="xs"
              weight="black"
              color="success"
              className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 rounded-full whitespace-nowrap inline-block"
            >
              {t('guestProfileTenantRoomActive')}
            </Text>

            {/* Room Name & Property */}
            <Text as="h3" variant="heading" size="2xl" weight="black" className="pt-1">
              {t('guestProfileTenantRoomLabel')} {roomNumber} - {houseName}
            </Text>

            {/* Clickable Address with Google Maps Integration */}
            {houseAddress && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(houseAddress)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline inline-flex items-center gap-1.5 bg-primary/10 px-3 py-1.5 rounded-xl border border-primary/20 transition-all max-w-full"
                >
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <Text as="span" size="xs" weight="bold" color="brand" className="truncate">
                    {houseAddress}
                  </Text>
                  <ExternalLink className="w-3.5 h-3.5 text-primary ml-1 shrink-0" />
                </a>
              </div>
            )}
          </div>

          {/* Direct Jump Button to Tenant Dashboard */}
          <Button
            href="/tenant/room"
            size="lg"
            leftIcon={<Home className="shrink-0" />}
            rightIcon={<span>&rarr;</span>}
            className="w-full sm:w-auto rounded-2xl shadow-lg shadow-primary/25 hover:scale-105"
          >
            {t('guestProfileTenantRoomDashboard')}
          </Button>
        </div>

        {/* Lease Details Cards */}
        <Form.Grid cols={3}>
          {/* Monthly Rent */}
          <div className="p-4 bg-surface rounded-2xl border border-line space-y-1">
            <Text
              as="span"
              variant="overline"
              size="3xs"
              weight="bold"
              color="subtle"
              className="block"
            >
              {t('guestProfileTenantMonthlyRent')}
            </Text>
            <Text
              as="span"
              variant="heading"
              size="xl"
              weight="black"
              color="danger"
              className="block"
            >
              {formatCurrency(rentPrice, currentLocale)}
              <span className="text-xs font-medium ml-1">
                {t('guestProfileTenantPerMonth')}
              </span>
            </Text>
          </div>

          {/* Deposit Escrow */}
          <div className="p-4 bg-surface rounded-2xl border border-line space-y-1">
            <Text
              as="span"
              variant="overline"
              size="3xs"
              weight="bold"
              color="subtle"
              className="block"
            >
              {t('guestProfileTenantDepositEscrow')}
            </Text>
            {depositAmount > 0 ? (
              <>
                <Text
                  as="span"
                  variant="heading"
                  size="xl"
                  weight="black"
                  color="brand"
                  className="block"
                >
                  {formatCurrency(depositAmount, currentLocale)}
                </Text>
                <Text
                  as="span"
                  variant="caption"
                  size="3xs"
                  weight="bold"
                  color="success"
                  className="block"
                >
                  {t('guestProfileTenantContractEscrowProtected')}
                </Text>
              </>
            ) : (
              <Text as="span" variant="subtitle" size="sm" weight="bold" color="secondary" className="block pt-1">
                {t('guestProfileTenantNoDeposit')}
              </Text>
            )}
          </div>

          {/* Contract Term */}
          <div className="p-4 bg-surface rounded-2xl border border-line space-y-1">
            <Text
              as="span"
              variant="overline"
              size="3xs"
              weight="bold"
              color="subtle"
              className="block"
            >
              {t('guestProfileTenantContractTerm')}
            </Text>
            {hasContract ? (
              <>
                <Text as="span" variant="heading" size="sm" weight="black" className="block">
                  {formatDate(startDate, currentLocale)} - {formatDate(endDate, currentLocale)}
                </Text>
                <Text
                  as="span"
                  variant="caption"
                  size="3xs"
                  weight="bold"
                  color="secondary"
                  className="block"
                >
                  {t('guestProfileTenantContractDuration', {
                    stayed: durationStats.stayed,
                    total: durationStats.total,
                    percent: durationStats.percent,
                  })}
                </Text>
              </>
            ) : (
              <Text as="span" variant="subtitle" size="xs" weight="bold" color="secondary" className="block pt-1">
                {t('guestProfileTenantNoContract')}
              </Text>
            )}
          </div>
        </Form.Grid>

        {/* Lease Progress Bar (only if formal contract term exists) */}
        {hasContract && (
          <div className="p-4 bg-surface rounded-2xl border border-line space-y-2">
            <div className="flex flex-col sm:flex-row justify-between gap-1">
              <Text as="span" size="xs" weight="bold" color="secondary">
                {t('guestProfileTenantContractProgress')}
              </Text>
              <Text as="span" size="xs" weight="bold" color="secondary">
                {t('guestProfileTenantContractRemaining', {
                  percent: durationStats.percent,
                  months: durationStats.remainingMonths,
                })}
              </Text>
            </div>
            <div className="w-full h-3 bg-line rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-500"
                style={{ width: `${durationStats.percent}%` }}
              />
            </div>
          </div>
        )}

        {/* Landlord Contact & Contract Export */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 text-white rounded-3xl space-y-4 shadow-xl border border-zinc-800">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <Text as="h4" variant="heading" size="sm" weight="black" color="white">
                {t('guestProfileLandlordManager')}
              </Text>
              <Text variant="subtitle" size="xs" weight="medium" color="subtle">
                {t('guestProfileLandlordContractInfo', {
                  name: landlordName || t('guestProfileNotUpdated'),
                  phone: landlordPhone || t('guestProfileNotUpdated'),
                })}
              </Text>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
              {landlordPhone && (
                <a
                  href={`tel:${landlordPhone}`}
                  className="px-4 py-2.5 bg-accent hover:bg-[#ff5518] text-white rounded-xl transition-all shadow-md shadow-accent/20 inline-flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <Phone className="w-3.5 h-3.5 shrink-0" />
                  <Text as="span" size="xs" weight="extrabold" color="white">
                    {t('guestProfileCallLandlord')}
                  </Text>
                </a>
              )}

              <Button
                variant="dark"
                leftIcon={
                  isDownloadingContract ? (
                    <Loader2 className="w-4 h-4 animate-spin text-primary" />
                  ) : (
                    <FileText className="text-primary" />
                  )
                }
                disabled={isDownloadingContract}
                onClick={handleDownloadContract}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700"
              >
                {t('guestProfileDownloadContractPdf')}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

