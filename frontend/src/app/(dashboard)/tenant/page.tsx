'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  Building,
  MapPin,
  Phone,
  User,
  Calendar,
  Zap,
  Droplets,
  Trash2,
  Wifi,
  Speaker,
  FileSignature,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Printer,
  X,
  AlertCircle,
  Bike,
  CreditCard,
  ArrowRight,
  Copy,
  Check,
  FileText,
  Download,
  ExternalLink,
  Sparkles,
} from 'lucide-react'
import { DashboardPageHeader } from '@/components/layout'
import { Button, Pagination, Chip, Modal, EmptyState, Text } from '@/components/ui'

import { useTranslations, useLanguage } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency } from '@/utils'
import { api } from '@/services/api'
import { tenantInvoiceService, TenantInvoice } from '@/services/tenant-invoice.service'
import { FEATURE_FLAGS } from '@/config/features'
import { useUnreadMessages } from '@/hooks'

interface TenancyApiResponse {
  success: boolean
  data: {
    contract: {
      id: string
      startDate: string
      endDate: string
      rentPrice: number
      monthlyPaymentDate: number
      depositAmount: number
      note?: string
      documents: Array<{ id: string; url: string; createdAt: string }>
    }
    room: {
      id: string
      roomNumber: string
      floor: number
      area?: number
      maxOccupants?: number
      roomTypeName?: string
    }
    boardingHouse: {
      id: string
      name: string
      address: string
      landlord: {
        name: string
        phoneNumber: string
        email?: string
      }
    }
    services: Array<{
      id: string
      name: string
      price: number
      unit: string
      isMetered: boolean
    }>
    announcements: Array<{
      id: string
      title: string
      content: string
      createdAt: string
      isNew: boolean
    }>
  } | null
}

export default function TenantOverviewPage() {
  const t = useTranslations('tenantPortal')
  const { locale } = useLanguage()
  const { activeTenancyId } = useAuth()
  const { unreadCount: unreadMessagesCount } = useUnreadMessages()

  const [loading, setLoading] = useState(true)
  const [tenancyData, setTenancyData] = useState<TenancyApiResponse['data'] | null>(null)
  const [latestInvoice, setLatestInvoice] = useState<TenantInvoice | null>(null)

  // States for modals and UI
  const [selectedNotice, setSelectedNotice] = useState<any>(null)
  const [copiedBank, setCopiedBank] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)

  // 1. Fetch real tenancy details & real invoices from backend
  useEffect(() => {
    let isMounted = true

    async function fetchDashboardData() {
      try {
        setLoading(true)
        const [response, invoices] = await Promise.all([
          api
            .get<TenancyApiResponse>('/v1/tenant/tenancy', {
              silent: true,
              params: activeTenancyId ? { contractId: activeTenancyId } : undefined,
            })
            .catch(() => null),
          tenantInvoiceService
            .getTenantInvoices(activeTenancyId || undefined)
            .catch(() => []),
        ])

        if (!isMounted) return

        if (response?.data) {
          setTenancyData(response.data)
        } else {
          setTenancyData(null)
        }

        if (invoices && invoices.length > 0) {
          const unpaid = invoices.find(inv => inv.status === 'unpaid' || inv.status === 'overdue')
          setLatestInvoice(unpaid || null)
        } else {
          setLatestInvoice(null)
        }
      } catch (err) {
        // Silent catch for dev mode
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDashboardData()

    return () => {
      isMounted = false
    }
  }, [activeTenancyId])

  // Format phone display
  const formatPhoneDisplay = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '')
    if (cleaned.length === 10) {
      return `${cleaned.slice(0, 4)}.${cleaned.slice(4, 7)}.${cleaned.slice(7)}`
    }
    return phone
  }

  // Format date helper
  const formatDateStr = (dateStr?: string) => {
    if (!dateStr) return ''
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat(locale === 'en' ? 'en-US' : 'vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }).format(date)
    } catch {
      return dateStr
    }
  }

  // Resolve room & contract info (real backend data only)
  const roomInfo = useMemo(() => {
    if (tenancyData && tenancyData.contract && tenancyData.room) {
      const { contract, room, boardingHouse } = tenancyData
      const start = new Date(contract.startDate)
      const end = new Date(contract.endDate)
      const now = new Date()

      const totalMs = Math.max(1, end.getTime() - start.getTime())
      const elapsedMs = Math.max(0, now.getTime() - start.getTime())
      const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24))
      const daysElapsed = Math.min(totalDays, Math.ceil(elapsedMs / (1000 * 60 * 60 * 24)))
      const daysRemaining = Math.max(0, totalDays - daysElapsed)

      return {
        roomNumber: room.roomNumber,
        roomType: room.roomTypeName || 'Studio',
        buildingName: boardingHouse?.name || t('fallbackBuildingName'),
        address: boardingHouse?.address || t('fallbackAddress'),
        landlord: boardingHouse?.landlord?.name || t('fallbackLandlord'),
        landlordIdCard: t('fallbackNotUpdated'),
        landlordBank: t('fallbackNotUpdated'),
        tenantName: t('fallbackTenant'),
        tenantIdCard: t('fallbackNotUpdated'),
        phone: boardingHouse?.landlord?.phoneNumber || '',
        phoneDisplay: formatPhoneDisplay(boardingHouse?.landlord?.phoneNumber || ''),
        hotline: '1900 8899',
        contractCode: `HĐ-${contract.id.slice(-6).toUpperCase()}`,
        contractStart: formatDateStr(contract.startDate),
        contractEnd: formatDateStr(contract.endDate),
        rentPrice: Number(contract.rentPrice) || 0,
        deposit: Number(contract.depositAmount) || 0,
        daysElapsed,
        totalDays,
        daysRemaining,
        documentUrl: contract.documents?.[0]?.url || null,
        roomImage:
          'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
        amenities: [
          t('amenityAc'),
          t('amenityFridge'),
          t('amenityWaterHeater'),
          t('amenityBalcony'),
          t('amenitySmartLock'),
          t('amenityKitchen'),
        ],
      }
    }

    return null
  }, [tenancyData, locale, t])

  // Service helper
  const getServiceIconAndColor = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('điện') || lower.includes('electric')) {
      return { icon: Zap, color: 'text-amber-500', bg: 'bg-warning-soft border-warning-subtle' }
    }
    if (lower.includes('nước') || lower.includes('water')) {
      return { icon: Droplets, color: 'text-sky-500', bg: 'bg-vacant-soft border-vacant-subtle' }
    }
    if (lower.includes('rác') || lower.includes('trash') || lower.includes('vệ sinh')) {
      return { icon: Trash2, color: 'text-emerald-500', bg: 'bg-success-soft border-success-subtle' }
    }
    if (lower.includes('wifi') || lower.includes('mạng') || lower.includes('internet')) {
      return { icon: Wifi, color: 'text-purple-500', bg: 'bg-deposit-soft border-deposit-subtle' }
    }
    if (lower.includes('xe') || lower.includes('parking') || lower.includes('bike')) {
      return { icon: Bike, color: 'text-teal-500', bg: 'bg-primary-soft border-primary-subtle' }
    }
    return { icon: Building, color: 'text-indigo-500', bg: 'bg-info-soft border-info-subtle' }
  }

  // Services list (from backend only)
  const services = useMemo(() => {
    if (tenancyData?.services && tenancyData.services.length > 0) {
      return tenancyData.services.map(svc => {
        const style = getServiceIconAndColor(svc.name)
        return {
          name: svc.name,
          price: `${Number(svc.price).toLocaleString(locale === 'en' ? 'en-US' : 'vi-VN')} ₫ / ${svc.unit || t('perMonth')}`,
          type: svc.isMetered ? t('serviceMetered') : t('serviceFixed'),
          icon: style.icon,
          color: style.color,
          bg: style.bg,
        }
      })
    }

    return []
  }, [tenancyData, locale, t])

  // Announcements list (from backend only)
  const allAnnouncements = useMemo(() => {
    if (tenancyData?.announcements && tenancyData.announcements.length > 0) {
      return tenancyData.announcements.map((item, idx) => ({
        id: item.id || String(idx),
        title: item.title,
        date: formatDateStr(item.createdAt),
        tag: item.isNew ? t('noticeTagNew') : t('noticeTagNotice'),
        color: item.isNew
          ? 'bg-danger-soft text-danger border-danger-subtle'
          : 'bg-primary-soft text-primary border-primary-subtle',
        content: item.content,
        isNew: item.isNew,
      }))
    }

    return []
  }, [tenancyData, locale, t])

  // Pagination for announcements (4 items per page)
  const itemsPerPage = 4
  const currentAnnouncements = allAnnouncements.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const handleCopyBank = () => {
    if (typeof navigator !== 'undefined' && roomInfo?.landlordBank) {
      navigator.clipboard.writeText(roomInfo.landlordBank)
      setCopiedBank(true)
      setTimeout(() => setCopiedBank(false), 2000)
    }
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto">
      {/* Top Header */}
      <DashboardPageHeader
        badge={
          roomInfo ? (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-success-soft text-success border border-success-subtle text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{t('roomStatusActive')}</span>
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card-hover text-muted border border-line text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span>{t('noActiveRoom')}</span>
            </div>
          )
        }
        title={t('title')}
        subtitle={t('subtitle')}
        actions={
          <>
            <Link href="/tenant/messages">
              <Button
                size="md"
                className="relative sm:text-sm"
                leftIcon={<MessageCircle />}
              >
                <span>{t('chatWithLandlord')}</span>
                {unreadMessagesCount > 0 && (
                  <span className="ml-1 inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-danger text-white text-[10px] font-black shadow-xs animate-in zoom-in-75 duration-150">
                    {unreadMessagesCount > 99 ? '99+' : unreadMessagesCount}
                  </span>
                )}
              </Button>

            </Link>
            {roomInfo && (
              <Link href="/tenant/contract">
                <Button
                  size="md"
                  variant='accent'
                  leftIcon={<FileSignature />}
                  className="sm:text-sm"
                >
                  {t('viewContract')}
                </Button>
              </Link>
            )}
          </>
        }
      />

      {/* Quick Billing Alert Banner (Only when unpaid invoice exists) */}
      {latestInvoice && (
        <div className="p-4 sm:p-5 rounded-3xl border border-accent-subtle bg-accent-soft/30 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-accent text-white flex items-center justify-center shrink-0 shadow-sm shadow-accent/30">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-accent">
                  {t('currentInvoiceReady')}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-warning-soft text-warning text-[10px] font-extrabold uppercase">
                  {t('unpaid')}
                </span>
              </div>
              <div className="text-sm sm:text-base font-black text-foreground mt-0.5">
                {latestInvoice.period} &bull; {formatCurrency(latestInvoice.amount, locale)}
                <span className="text-xs font-normal text-muted ml-2">
                  ({t('dueDate')}: {formatDateStr(latestInvoice.dueDate)})
                </span>
              </div>
            </div>
          </div>

          <Link href={`/tenant/invoices/${latestInvoice.id}`} className="w-full sm:w-auto">
            <Button size="xs" variant="orange" className="sm:w-auto">
              <span>{t('payNow')}</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          {/* Hero Room Details Card or Empty Tenancy State */}
          {roomInfo ? (
            <div className="rounded-3xl border border-line bg-card shadow-xs overflow-hidden">
              <div className="p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 border-b border-line bg-gradient-to-r from-card via-surface to-primary/5">
                <div className="flex items-center gap-4 sm:gap-5">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-line shrink-0 shadow-xs">
                    <img
                      src={roomInfo.roomImage}
                      alt={roomInfo.roomNumber}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                        {t('roomNumber')} {roomInfo.roomNumber}
                      </h2>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-extrabold uppercase">
                        {roomInfo.roomType}
                      </span>
                    </div>
                    <div className="text-xs sm:text-sm font-medium text-muted flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-muted shrink-0" />
                      <span>
                        {roomInfo.buildingName} &bull; {roomInfo.address}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="sm:text-right bg-primary-soft sm:bg-transparent p-4 sm:p-0 rounded-2xl w-full sm:w-auto border border-primary-subtle sm:border-0">
                  <div className="text-[11px] font-extrabold text-muted uppercase tracking-wider">
                    {t('rentPrice')}
                  </div>
                  <div className="text-2xl font-black text-primary mt-0.5">
                    {formatCurrency(roomInfo.rentPrice, locale)}
                    <span className="text-xs font-normal text-muted"> {t('monthUnit')}</span>
                  </div>
                </div>
              </div>

              {/* Room Lease Progress Bar */}
              <div className="px-6 sm:px-8 py-4 bg-surface/70 border-b border-line flex flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-muted flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-primary" />
                    {t('contractDuration')}: {roomInfo.contractStart} &ndash; {roomInfo.contractEnd}
                  </span>
                  <span className="text-success">
                    {t('daysRemaining', { days: roomInfo.daysRemaining })}
                  </span>
                </div>
                <div className="w-full bg-line rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.round(
                        (roomInfo.daysElapsed / Math.max(1, roomInfo.totalDays)) * 100,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Room Details Grid */}
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-6 bg-card">
                {/* Landlord Contact */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-card-hover text-muted flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted">{t('landlord')}</div>
                      <div className="text-sm font-bold text-foreground mt-0.5">
                        {roomInfo.landlord}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <Phone className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted">{t('phone')}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <a
                          href={`tel:${roomInfo.phone}`}
                          className="text-sm font-bold text-primary hover:underline"
                        >
                          {roomInfo.phoneDisplay}
                        </a>
                        <Button
                          variant="secondary"
                          size="sm"
                          type="button"
                          onClick={handleCopyBank}
                          title={t('stkLabel')}
                        >
                          {copiedBank ? (
                            <Check className="w-3 h-3 text-success" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                          <span>{copiedBank ? t('copied') : t('stkLabel')}</span>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Deposit & Escrow */}
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-card-hover text-muted flex items-center justify-center shrink-0 mt-0.5">
                      <ShieldCheck className="w-4 h-4 text-success" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted">{t('deposit')}</div>
                      <div className="text-sm font-bold text-foreground mt-0.5">
                        {formatCurrency(roomInfo.deposit, locale)}
                      </div>
                      <div className="text-[11px] text-muted">{t('escrowProtected')}</div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-card-hover text-muted flex items-center justify-center shrink-0 mt-0.5">
                      <AlertCircle className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-muted">
                        {t('hotlineSupport')}
                      </div>
                      <div className="text-sm font-bold text-foreground mt-0.5">
                        {roomInfo.hotline}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Room Amenities Chips */}
              <div className="p-6 sm:p-8 pt-0 bg-card border-t border-line">
                <div className="text-xs font-black uppercase tracking-wider text-muted mb-3">
                  {t('roomAmenitiesTitle')}
                </div>
                <div className="flex flex-wrap gap-2">
                  {roomInfo.amenities.map((item, idx) => (
                    <Chip
                      key={idx}
                      size='sm'
                      variant='neutral'
                      leftIcon={<CheckCircle2 className="text-primary" />}
                    >
                      {item}
                    </Chip>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <EmptyState
              icon={<Building className="w-8 h-8" />}
              title={t('noActiveContractTitle')}
              description={t('noActiveContractDesc')}
              action={
                FEATURE_FLAGS.ENABLE_BHRP ? (
                  <Link href="/rooms">
                    <Button size="sm">
                      {t('exploreHousesBtn')}
                    </Button>
                  </Link>
                ) : undefined
              }
            />
          )}

          {/* Card: Services & Utility Rates */}
          <div className="rounded-3xl border border-line bg-card p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black text-foreground tracking-tight">
                  {t('servicesTitle')}
                </h3>
                <p className="text-xs text-muted mt-0.5">{t('servicesSubtitle')}</p>
              </div>
              <Chip size='sm' variant='primary'>
                {t('activeServices', { count: services.length })}
              </Chip>
            </div>

            {services.length === 0 ? (
              <div className="py-8 text-center text-xs text-muted space-y-1">
                <Sparkles className="w-8 h-8 mx-auto text-zinc-300 mb-2" />
                <p className="font-semibold">{t('noServices')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {services.map((svc, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-line bg-surface/50 hover:bg-card hover:border-zinc-200/80 hover:shadow-xs transition-all duration-200"
                  >
                    <div
                      className={`w-12 h-12 rounded-xl flex items-center justify-center ${svc.bg} ${svc.color} shrink-0 border`}
                    >
                      <svc.icon className="w-6 h-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-bold text-foreground truncate">{svc.name}</div>
                      <div className="text-xs font-extrabold text-foreground/90 mt-0.5">{svc.price}</div>
                      <div className="text-[11px] font-medium text-muted mt-0.5">{svc.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Announcements (Compact, 4 per page) */}
        <div className="lg:col-span-1 flex flex-col gap-6">
          <div className="rounded-3xl border border-line bg-card shadow-xs flex flex-col h-fit">
            <div className="px-5 py-3.5 border-b border-line flex items-center justify-between bg-surface/50 rounded-t-3xl">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <Speaker className="w-4 h-4" />
                </div>
                <h3 className="text-sm sm:text-base font-black text-foreground">
                  {t('announcementsTitle')}
                </h3>
              </div>
              <span className="text-[10px] sm:text-[11px] font-bold text-muted bg-card px-2.5 py-0.5 rounded-full border border-line">
                {t('noticesCount', { count: allAnnouncements.length })}
              </span>
            </div>

            {/* List of 4 announcements or empty */}
            {allAnnouncements.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted space-y-2">
                <Speaker className="w-8 h-8 mx-auto text-zinc-300" />
                <p className="font-semibold text-muted">{t('noAnnouncementsTitle')}</p>
                <p className="text-[11px] text-muted">{t('noAnnouncementsDesc')}</p>
              </div>
            ) : (
              <>
                <div className="p-4 space-y-2.5">
                  {currentAnnouncements.map(item => (
                    <div
                      key={item.id}
                      onClick={() => setSelectedNotice(item)}
                      className="p-3 rounded-2xl bg-surface/70 border border-line hover:border-primary/50 hover:bg-card hover:shadow-xs transition-all cursor-pointer space-y-1.5 group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] sm:text-[11px] font-bold text-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {item.date}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded-md text-[9px] sm:text-[10px] font-black uppercase tracking-wider border ${item.color}`}
                        >
                          {item.tag}
                        </span>
                      </div>
                      <h4 className="text-xs sm:text-sm font-bold text-foreground leading-snug group-hover:text-primary transition-colors line-clamp-1">
                        {item.title}
                      </h4>
                      <p className="text-[11px] sm:text-xs text-muted leading-relaxed line-clamp-1">
                        {item.content}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Pagination Controls - 4 items per page */}
                <Pagination
                  currentPage={currentPage}
                  totalItems={allAnnouncements.length}
                  pageSize={itemsPerPage}
                  onPageChange={setCurrentPage}
                  showPageSizeInput={false}
                  variant="flat"
                  className="px-4 py-2.5 border-t border-line bg-surface/50 rounded-b-3xl"
                />
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modal: View Full Notice Detail */}
      {selectedNotice && (
        <Modal
          isOpen={!!selectedNotice}
          onClose={() => setSelectedNotice(null)}
          title={selectedNotice.title}
          size="md"
        >
          <div className="space-y-4 pt-1">
            <div className="flex items-center justify-between gap-2 border-b border-line pb-3">
              <span
                className={`inline-block px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${selectedNotice.color}`}
              >
                {selectedNotice.tag}
              </span>
              <div className="text-xs text-muted flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" /> {selectedNotice.date} &bull;{' '}
                {t('sentByManagement')}
              </div>
            </div>

            <div className="text-xs sm:text-sm text-foreground/90 leading-relaxed">
              {selectedNotice.content}
            </div>

            <div className="pt-4 flex justify-end border-t border-line">
              <Button size="sm" onClick={() => setSelectedNotice(null)}>
                {t('btnClose')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
