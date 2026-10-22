'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  MapPin,
  Phone,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  ShieldCheck,
  Home,
  Sparkles,
  ExternalLink,
  MessageCircle,
  FileSignature,
  FileText,
  User,
  Wrench,
  Loader2,
} from 'lucide-react'
import { DashboardPageHeader } from '@/components/layout'
import { Breadcrumb, Button, Text, EmptyState } from '@/components/ui'
import { useTranslations } from '@/context/LanguageContext'
import { formatCurrency } from '@/utils'
import { api } from '@/services/api'

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
  } | null
}

export default function TenantRoomPage() {
  const t = useTranslations('tenant')

  const [loading, setLoading] = useState(true)
  const [tenancyData, setTenancyData] = useState<TenancyApiResponse['data'] | null>(null)

  useEffect(() => {
    let isMounted = true

    async function fetchDetails() {
      try {
        const response = await api.get<TenancyApiResponse>('/v1/tenant/tenancy', { silent: true })
        if (isMounted && response?.data) {
          setTenancyData(response.data)
        }
      } catch (err) {
        console.error('Failed to load room tenancy info:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchDetails()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <span className="text-xs text-muted font-medium">{t('tenantLoadingRoomDetails')}</span>
      </div>
    )
  }

  if (!tenancyData || !tenancyData.room) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title={t('tenantRoomInfoTitle')}
          subtitle="Thông tin phòng thuê hiện tại của bạn"
        />
        <div className="max-w-xl mx-auto">
          <EmptyState
            icon={<Home className="w-8 h-8" />}
            title={t('tenantRoomNotFoundTitle')}
            description={t('tenantRoomNotFoundDesc')}
            action={
              <Link href="/tenant">
                <Button variant="primary" size="md">
                  {t('tenantBackToDashboard')}
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  const room = tenancyData.room
  const house = tenancyData.boardingHouse || {
    id: 'bh-unknown',
    name: 'Nhà trọ',
    address: 'Địa chỉ chưa cập nhật',
    landlord: {
      name: 'Chủ trọ',
      phoneNumber: '',
    },
  }
  const contract = tenancyData.contract || {
    id: 'HD-PENDING',
    startDate: '',
    endDate: '',
    rentPrice: 0,
    monthlyPaymentDate: 5,
    depositAmount: 0,
    note: '',
  }
  const services = tenancyData.services || []

  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('điện') || lower.includes('electric'))
      return <Zap className="w-5 h-5 text-amber-500" />
    if (lower.includes('nước') || lower.includes('water'))
      return <Droplets className="w-5 h-5 text-sky-500" />
    if (lower.includes('mạng') || lower.includes('wifi') || lower.includes('internet'))
      return <Wifi className="w-5 h-5 text-indigo-500" />
    if (lower.includes('rác') || lower.includes('vệ sinh') || lower.includes('trash'))
      return <Trash2 className="w-5 h-5 text-emerald-500" />
    return <Wrench className="w-5 h-5 text-primary" />
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* Top Breadcrumb & Status */}
      <div className="flex items-center justify-between gap-4">
        <Breadcrumb
          backHref="/tenant"
          backLabel={t('tenantBackToDashboard')}
          current={`Phòng ${room.roomNumber} - ${house.name}`}
        />
        <span className="px-3 py-1 bg-success-soft text-success text-[11px] font-bold rounded-full border border-success-subtle flex items-center gap-1.5 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-success" />
          {t('tenantActiveTenancyBadge')}
        </span>
      </div>

      {/* Main Room Spotlight Header */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-800 to-zinc-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-primary/20 text-primary text-[11px] font-black rounded-full border border-primary/30 uppercase tracking-wider">
                {room.roomTypeName || 'Phòng trọ'}
              </span>
              <span className="text-xs text-muted font-semibold">
                {t('tenantFloorLabel', { floor: room.floor })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight flex items-center gap-3">
              <span>Phòng {room.roomNumber}</span>
              <span className="text-lg sm:text-xl font-normal text-muted">| {house.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-zinc-300 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <span>{house.address}</span>
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-white/10 space-y-1 sm:text-right shrink-0">
            <span className="text-[11px] font-bold text-muted uppercase tracking-wider block">
              {t('tenantMonthlyRent')}
            </span>
            <div className="text-2xl sm:text-3xl font-black text-primary">
              {formatCurrency(contract.rentPrice)}
            </div>
            <span className="text-[11px] text-muted block font-medium">
              {t('tenantRentDueOnDay', { day: contract.monthlyPaymentDate })}
            </span>
          </div>
        </div>
      </div>

      {/* Grid Content: Details & Amenities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Room Specifications & Services */}
        <div className="lg:col-span-2 space-y-6">
          {/* Room Specs Card */}
          <div className="bg-card rounded-3xl p-6 border border-line shadow-xs space-y-5">
            <div className="border-b border-line pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                <Home className="w-4 h-4 text-primary" />
                {t('tenantRoomSpecifications')}
              </h3>
              <span className="text-xs font-bold text-muted">ID: {room.id}</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3.5 bg-surface rounded-2xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('tenantFloorArea')}
                </span>
                <span className="text-sm font-black text-foreground block">{room.area || 25} m²</span>
              </div>
              <div className="p-3.5 bg-surface rounded-2xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('tenantMaxOccupants')}
                </span>
                <span className="text-sm font-black text-foreground block">
                  {t('tenantOccupantsCount', { count: room.maxOccupants || 2 })}
                </span>
              </div>
              <div className="p-3.5 bg-surface rounded-2xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('tenantFloorLevel')}
                </span>
                <span className="text-sm font-black text-foreground block">
                  {t('tenantFloorLabel', { floor: room.floor })}
                </span>
              </div>
              <div className="p-3.5 bg-surface rounded-2xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase block">
                  {t('tenantDeposit')}
                </span>
                <span className="text-sm font-black text-success block">
                  {formatCurrency(contract.depositAmount)}
                </span>
              </div>
            </div>
          </div>

          {/* Connected Services */}
          <div className="bg-card rounded-3xl p-6 border border-line shadow-xs space-y-4">
            <div className="border-b border-line pb-3 flex items-center justify-between">
              <h3 className="text-sm font-black text-foreground uppercase tracking-wide flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                {t('tenantRegisteredServices')}
              </h3>
              <span className="text-xs text-muted font-semibold">
                {t('tenantActiveServices', { count: services.length })}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {services.map(svc => (
                <div
                  key={svc.id}
                  className="p-4 bg-surface hover:bg-card-hover rounded-2xl border border-line flex items-center justify-between transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-card shadow-xs flex items-center justify-center border border-line">
                      {getServiceIcon(svc.name)}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-foreground">{svc.name}</p>
                      <span className="text-[10px] text-muted font-medium">
                        {svc.isMetered ? 'Tính theo công tơ' : 'Cố định hàng tháng'}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-foreground">{formatCurrency(svc.price)}</p>
                    <span className="text-[10px] text-muted">/{svc.unit}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Landlord & Quick Links */}
        <div className="space-y-6">
          {/* Landlord Contact Card */}
          <div className="bg-card rounded-3xl p-6 border border-line shadow-xs space-y-4">
            <h3 className="text-xs font-black text-muted uppercase tracking-wider">
              {t('tenantRoleLandlord')}
            </h3>
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-primary to-teal-400 text-white font-black text-base flex items-center justify-center shadow-md shadow-primary/20">
                {(house.landlord?.name || 'C').charAt(0)}
              </div>
              <div className="space-y-0.5">
                <h4 className="text-sm font-black text-foreground">
                  {house.landlord?.name || 'Chủ trọ'}
                </h4>
                <p className="text-xs text-muted font-medium">
                  {house.landlord?.phoneNumber || 'Chưa cập nhật SĐT'}
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              {house.landlord?.phoneNumber && (
                <a
                  href={`tel:${house.landlord.phoneNumber}`}
                  className="w-full py-2.5 bg-accent hover:bg-[#ff5518] text-white font-extrabold text-xs rounded-xl shadow-md shadow-accent/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('tenantCallLandlord')}</span>
                </a>
              )}
              <Link
                href="/tenant/messages"
                className="w-full py-2.5 bg-card-hover hover:bg-line text-foreground font-extrabold text-xs rounded-xl flex items-center justify-center gap-2 transition-all"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{t('tenantChatInPortal')}</span>
              </Link>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="bg-surface rounded-3xl p-6 border border-line shadow-xs space-y-3">
            <h4 className="text-xs font-bold text-foreground/90">{t('tenantRelatedActions')}</h4>
            <div className="space-y-2">
              <Link
                href="/tenant/contract"
                className="flex items-center justify-between p-3 bg-card rounded-xl border border-line hover:border-primary text-xs font-bold text-foreground/90 hover:text-primary transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-primary" />
                  Hợp đồng thuê phòng
                </span>
                <ExternalLink className="w-3.5 h-3.5 text-muted" />
              </Link>
              <Link
                href="/tenant/invoices"
                className="flex items-center justify-between p-3 bg-card rounded-xl border border-line hover:border-primary text-xs font-bold text-foreground/90 hover:text-primary transition-colors"
              >
                <span>{t('tenantViewMonthlyInvoices')}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted" />
              </Link>
              <Link
                href="/tenant/complaints"
                className="flex items-center justify-between p-3 bg-card rounded-xl border border-line hover:border-primary text-xs font-bold text-foreground/90 hover:text-primary transition-colors"
              >
                <span>{t('tenantReportIssueOrRepair')}</span>
                <ExternalLink className="w-3.5 h-3.5 text-muted" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

