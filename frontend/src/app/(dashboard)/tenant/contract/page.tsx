'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import {
  FileText,
  Printer,
  Download,
  Building,
  Home,
  Calendar,
  CreditCard,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  Copy,
  Phone,
  Mail,
  User,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  Wrench,
  Loader2,
  FileSignature,
  FileCheck,
} from 'lucide-react'
import { DashboardPageHeader } from '@/components/layout'
import { Button, Text, Breadcrumb, EmptyState } from '@/components/ui'
import ContractPreviewModal from '@/components/landlord/ContractPreviewModal'
import { api } from '@/services/api'
import { downloadTenantContractDocument } from '@/services/contract.service'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { useToast } from '@/context/ToastContext'
import { formatCurrency } from '@/utils'

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

export default function TenantContractPage() {
  const t = useTranslations('tenant')
  const { toast } = useToast()
  const { activeTenancyId } = useAuth()

  const [loading, setLoading] = useState(true)
  const [tenancyData, setTenancyData] = useState<TenancyApiResponse['data'] | null>(null)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [downloadingDocId, setDownloadingDocId] = useState<string | null>(null)

  const fetchTenancyData = async () => {
    try {
      setLoading(true)
      const res = await api.get<TenancyApiResponse>('/v1/tenant/tenancy', {
        params: activeTenancyId ? { contractId: activeTenancyId } : undefined,
      })
      if (res?.data) {
        setTenancyData(res.data)
      } else {
        setTenancyData(null)
      }
    } catch (err: any) {
      console.error('Failed to load tenant tenancy details:', err)
      toast.error(err?.message || 'Không thể tải thông tin hợp đồng thuê.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTenancyData()
  }, [activeTenancyId])

  const contract = tenancyData?.contract
  const room = tenancyData?.room
  const boardingHouse = tenancyData?.boardingHouse
  const services = tenancyData?.services || []

  // Contract duration progress
  const durationStats = useMemo(() => {
    if (!contract?.startDate || !contract?.endDate) return null
    const start = new Date(contract.startDate).getTime()
    const end = new Date(contract.endDate).getTime()
    const now = Date.now()

    const totalDuration = end - start
    const elapsed = now - start
    const remainingDays = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)))
    const progressPercent =
      totalDuration > 0
        ? Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)))
        : 100

    return {
      startFormatted: new Date(contract.startDate).toLocaleDateString('vi-VN'),
      endFormatted: new Date(contract.endDate).toLocaleDateString('vi-VN'),
      remainingDays,
      progressPercent,
    }
  }, [contract?.startDate, contract?.endDate])

  const handleCopyContractId = () => {
    if (!contract?.id) return
    navigator.clipboard.writeText(contract.id)
    toast.success('Đã sao chép mã hợp đồng vào bộ nhớ tạm!')
  }

  const handleDownloadDoc = async (docId: string, createdAt: string) => {
    try {
      setDownloadingDocId(docId)
      const dateStr = new Date(createdAt).toISOString().slice(0, 10)
      const roomStr = room?.roomNumber || 'phong'
      const filename = `hop-dong-${roomStr}-${dateStr}.html`
      await downloadTenantContractDocument(docId, filename, activeTenancyId || contract?.id)
      toast.success('Tải văn bản hợp đồng thành công!')
    } catch (err: any) {
      console.error('Failed to download contract document:', err)
      toast.error(err?.message || 'Không thể tải tài liệu hợp đồng.')
    } finally {
      setDownloadingDocId(null)
    }
  }

  // Get service icon helper
  const getServiceIcon = (name: string) => {
    const lower = name.toLowerCase()
    if (lower.includes('điện') || lower.includes('electric')) return <Zap className="w-4 h-4 text-amber-500" />
    if (lower.includes('nước') || lower.includes('water')) return <Droplets className="w-4 h-4 text-blue-500" />
    if (lower.includes('mạng') || lower.includes('wifi') || lower.includes('internet')) return <Wifi className="w-4 h-4 text-indigo-500" />
    if (lower.includes('rác') || lower.includes('vệ sinh') || lower.includes('trash')) return <Trash2 className="w-4 h-4 text-emerald-500" />
    return <Wrench className="w-4 h-4 text-primary" />
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <Text size="sm" weight="medium" color="subtle">
          Đang tải chi tiết hợp đồng...
        </Text>
      </div>
    )
  }

  if (!contract || !room || !boardingHouse) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader
          title={t('tenantContractPageTitle')}
          subtitle={t('tenantContractPageSubtitle')}
        />
        <div className="max-w-xl mx-auto">
          <EmptyState
            icon={<FileText className="w-8 h-8 text-amber-600" />}
            title={t('tenantNoActiveContractTitle')}
            description={t('tenantNoActiveContractDesc')}
            action={
              <Link href="/tenant">
                <Button variant="primary" size="md">
                  Quay lại Tổng quan
                </Button>
              </Link>
            }
          />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Breadcrumb Navigation */}
      <Breadcrumb
        backHref="/tenant"
        backLabel="Tổng quan"
        current={t('tenantContractPageTitle')}
      />

      {/* Page Header */}
      <DashboardPageHeader
        title={`${t('tenantContractPageTitle')} — Phòng ${room.roomNumber}`}
        subtitle={boardingHouse.name}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyContractId}
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Mã: {contract.id.substring(0, 8)}...
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsPreviewModalOpen(true)}
              leftIcon={<Printer className="w-4 h-4" />}
            >
              {t('tenantContractViewAndPrint')}
            </Button>
          </div>
        }
      />

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Contract Terms & Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card: Status & Quick Info Banner */}
          <div className="bg-card border border-line rounded-3xl p-6 shadow-xs relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-line pb-5">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center shrink-0">
                  <FileSignature className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <Text as="h3" size="lg" weight="bold" className="text-foreground">
                      Hợp đồng phòng {room.roomNumber}
                    </Text>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('tenantContractActiveStatus')}
                    </span>
                  </div>
                  <Text size="xs" color="subtle" className="mt-0.5">
                    Mã HĐ: <span className="font-mono text-foreground">{contract.id}</span>
                  </Text>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsPreviewModalOpen(true)}
                  leftIcon={<Printer className="w-4 h-4" />}
                >
                  {t('tenantContractViewAndPrint')}
                </Button>
              </div>
            </div>

            {/* Duration Timeline */}
            {durationStats && (
              <div className="pt-5 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted flex items-center gap-1.5 font-medium">
                    <Calendar className="w-4 h-4 text-primary" />
                    {durationStats.startFormatted} &rarr; {durationStats.endFormatted}
                  </span>
                  <span className="font-bold text-foreground">
                    Còn {durationStats.remainingDays} ngày ({durationStats.progressPercent}% thời gian)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-surface overflow-hidden border border-line">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${durationStats.progressPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Card: Financial Terms */}
          <div className="bg-card border border-line rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 border-b border-line pb-3">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <CreditCard className="w-4 h-4" />
              </div>
              <Text as="h3" size="base" weight="bold" className="text-foreground">
                {t('tenantContractTerms')}
              </Text>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-surface/70 border border-line space-y-1">
                <Text size="xs" color="subtle" weight="medium">
                  Giá thuê hàng tháng
                </Text>
                <div className="text-lg font-black text-primary">
                  {formatCurrency(contract.rentPrice)}
                  <span className="text-xs font-normal text-muted"> / tháng</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface/70 border border-line space-y-1">
                <Text size="xs" color="subtle" weight="medium">
                  {t('tenantContractDepositStatus')}
                </Text>
                <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {formatCurrency(contract.depositAmount)}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface/70 border border-line space-y-1">
                <Text size="xs" color="subtle" weight="medium">
                  {t('tenantContractRentPaymentDay')}
                </Text>
                <div className="text-base font-bold text-foreground">
                  Ngày {contract.monthlyPaymentDate} hàng tháng
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-surface/70 border border-line space-y-1">
                <Text size="xs" color="subtle" weight="medium">
                  Bảo lãnh hợp đồng
                </Text>
                <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 pt-1">
                  <ShieldCheck className="w-4 h-4" />
                  Xác thực số qua hệ thống Dormio
                </div>
              </div>
            </div>

            {contract.note && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1">
                <Text size="xs" weight="bold" className="text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  {t('tenantContractNotes')}
                </Text>
                <Text size="xs" color="subtle" className="leading-relaxed">
                  {contract.note}
                </Text>
              </div>
            )}
          </div>

          {/* Card: Registered Room Services */}
          <div className="bg-card border border-line rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <Wrench className="w-4 h-4" />
                </div>
                <Text as="h3" size="base" weight="bold" className="text-foreground">
                  {t('tenantContractServicesTitle')}
                </Text>
              </div>
              <span className="text-xs font-bold text-muted bg-surface px-2.5 py-0.5 rounded-full border border-line">
                {services.length} dịch vụ
              </span>
            </div>

            {services.length === 0 ? (
              <Text size="xs" color="subtle" className="py-4 text-center">
                {t('tenantContractNoServices')}
              </Text>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {services.map(srv => (
                  <div
                    key={srv.id}
                    className="p-3.5 rounded-2xl bg-surface/70 border border-line flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="p-2 rounded-xl bg-card border border-line shrink-0">
                        {getServiceIcon(srv.name)}
                      </div>
                      <div className="min-w-0">
                        <Text size="xs" weight="bold" className="text-foreground truncate">
                          {srv.name}
                        </Text>
                        <Text size="2xs" color="subtle">
                          {srv.isMetered ? 'Tính theo công tơ' : 'Cố định theo tháng'}
                        </Text>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-xs font-bold text-foreground">
                        {formatCurrency(srv.price)}
                      </div>
                      <Text size="2xs" color="subtle">
                        /{srv.unit}
                      </Text>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card: Exported Contract Documents */}
          <div className="bg-card border border-line rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                  <FileCheck className="w-4 h-4" />
                </div>
                <div>
                  <Text as="h3" size="base" weight="bold" className="text-foreground">
                    {t('tenantContractDocumentsTitle')}
                  </Text>
                  <Text size="xs" color="subtle">
                    {t('tenantContractDocumentsDesc')}
                  </Text>
                </div>
              </div>
            </div>

            {contract.documents && contract.documents.length > 0 ? (
              <div className="space-y-2.5">
                {contract.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3.5 rounded-2xl bg-surface/70 border border-line flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="p-2 rounded-xl bg-card border border-line text-primary shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <Text size="xs" weight="bold" className="text-foreground truncate">
                          Văn bản hợp đồng #{doc.id.substring(0, 8)}
                        </Text>
                        <Text size="2xs" color="subtle">
                          Ngày tạo: {new Date(doc.createdAt).toLocaleString('vi-VN')}
                        </Text>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownloadDoc(doc.id, doc.createdAt)}
                      isLoading={downloadingDocId === doc.id}
                      leftIcon={<Download className="w-3.5 h-3.5" />}
                    >
                      {t('tenantContractDownloadDoc')}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                bordered={false}
                size="sm"
                icon={<FileText className="w-6 h-6 text-muted" />}
                title={t('tenantContractNoDocuments')}
                action={
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsPreviewModalOpen(true)}
                    leftIcon={<Printer className="w-3.5 h-3.5" />}
                  >
                    {t('tenantContractViewAndPrint')}
                  </Button>
                }
              />
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Room & Boarding House Info */}
        <div className="lg:col-span-1 space-y-6">
          {/* Card: Room Specifications */}
          <div className="bg-card border border-line rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-line pb-3">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <Home className="w-4 h-4" />
              </div>
              <Text as="h3" size="base" weight="bold" className="text-foreground">
                Thông số phòng
              </Text>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                <span className="text-muted">Phòng</span>
                <span className="font-bold text-foreground">Phòng {room.roomNumber}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                <span className="text-muted">Tầng</span>
                <span className="font-bold text-foreground">Tầng {room.floor}</span>
              </div>
              {room.area && (
                <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                  <span className="text-muted">Diện tích</span>
                  <span className="font-bold text-foreground">{room.area} m²</span>
                </div>
              )}
              {room.maxOccupants && (
                <div className="flex items-center justify-between py-1.5 border-b border-line/60">
                  <span className="text-muted">Số người ở tối đa</span>
                  <span className="font-bold text-foreground">{room.maxOccupants} người</span>
                </div>
              )}
              {room.roomTypeName && (
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted">Loại phòng</span>
                  <span className="font-bold text-foreground">{room.roomTypeName}</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <Link href="/tenant/room">
                <Button variant="outline" size="sm" className="w-full">
                  Xem chi tiết phòng thuê
                </Button>
              </Link>
            </div>
          </div>

          {/* Card: Property & Landlord Info */}
          <div className="bg-card border border-line rounded-3xl p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 border-b border-line pb-3">
              <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
                <Building className="w-4 h-4" />
              </div>
              <Text as="h3" size="base" weight="bold" className="text-foreground">
                Nhà trọ & Bên cho thuê
              </Text>
            </div>

            <div className="space-y-3">
              <div>
                <Text size="2xs" color="subtle" weight="bold" className="uppercase tracking-wider">
                  Cơ sở trọ
                </Text>
                <Text size="sm" weight="bold" className="text-foreground mt-0.5">
                  {boardingHouse.name}
                </Text>
                <Text size="xs" color="subtle" className="mt-0.5 leading-relaxed">
                  {boardingHouse.address}
                </Text>
              </div>

              <div className="pt-2 border-t border-line/60 space-y-2">
                <Text size="2xs" color="subtle" weight="bold" className="uppercase tracking-wider">
                  Đại diện Bên cho thuê (Chủ trọ)
                </Text>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                    <User className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <Text size="xs" weight="bold" className="text-foreground truncate">
                      {boardingHouse.landlord.name}
                    </Text>
                    {boardingHouse.landlord.phoneNumber && (
                      <a
                        href={`tel:${boardingHouse.landlord.phoneNumber}`}
                        className="text-xs text-primary font-medium hover:underline flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        {boardingHouse.landlord.phoneNumber}
                      </a>
                    )}
                  </div>
                </div>

                {boardingHouse.landlord.email && (
                  <div className="text-xs text-muted flex items-center gap-1.5 pt-1">
                    <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="truncate">{boardingHouse.landlord.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              <Link href="/tenant/messages">
                <Button variant="secondary" size="sm" className="w-full">
                  Nhắn tin với chủ trọ
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Contract Preview & Export Modal */}
      {isPreviewModalOpen && (
        <ContractPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          isTenant={true}
          contractId={contract.id}
          roomNumber={room.roomNumber}
          tenantName=""
          onExportSuccess={fetchTenancyData}
        />
      )}
    </div>
  )
}

