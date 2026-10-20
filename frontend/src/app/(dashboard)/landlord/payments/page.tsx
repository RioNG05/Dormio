'use client'

import React, { useState, useEffect, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  CreditCard,
  Search,
  Filter,
  ArrowDownLeft,
  Eye,
  Calendar,
  Building2,
  MapPin,
  FileSpreadsheet,
  Receipt,
  User,
  Phone,
  LayoutGrid,
  List,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ExternalLink,
  Printer,
  X,
  Camera,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  Maximize2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import {
  landlordPaymentService,
  LandlordPaymentItem,
  LandlordPaymentsSummary,
} from '@/services/landlord-payment.service'
import { getRooms, RoomItem } from '@/services/room.service'
import { Button, TextInput, NumberInput, SelectInput, SearchInput, Pagination } from '@/components/ui'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

function PaymentsContent() {
  const { activeBuilding } = useAuth()
  const searchParams = useSearchParams()
  const router = useRouter()

  const urlSearch = searchParams.get('search') || searchParams.get('room') || ''

  // View Mode: Grid (default, 6/page) & Table (10/page) per Rule 9
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [pageSize, setPageSize] = useState<number>(6)
  const [currentPage, setCurrentPage] = useState<number>(1)

  // Filters State
  const [searchQuery, setSearchQuery] = useState<string>(urlSearch)
  const [selectedRoom, setSelectedRoom] = useState<string>('all')
  const [selectedMethod, setSelectedMethod] = useState<string>('all')
  const [selectedMonth, setSelectedMonth] = useState<string>('all')
  const [selectedYear, setSelectedYear] = useState<string>('all')
  const [activeTab, setActiveTab] = useState<'all' | 'banking' | 'cash'>('all')

  // Server Data
  const [payments, setPayments] = useState<LandlordPaymentItem[]>([])
  const [totalRecords, setTotalRecords] = useState<number>(0)
  const [summary, setSummary] = useState<LandlordPaymentsSummary>({
    totalRevenue: 0,
    totalTransactions: 0,
    bankingRevenue: 0,
    cashRevenue: 0,
  })
  const [availableRooms, setAvailableRooms] = useState<RoomItem[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(true)

  // Modals & Lightbox
  const [selectedPayment, setSelectedPayment] = useState<LandlordPaymentItem | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // Sync pageSize with viewMode default
  useEffect(() => {
    setPageSize(viewMode === 'grid' ? 6 : 10)
    setCurrentPage(1)
  }, [viewMode])

  // Load available rooms for room filter
  useEffect(() => {
    if (!activeBuilding?.id) return
    let isCancelled = false

    async function loadRooms() {
      try {
        const res = await getRooms(activeBuilding.id, {
          limit: 100,
        })
        if (!isCancelled && res?.data) {
          setAvailableRooms(res.data)
        }
      } catch (err) {
        console.error('Failed to load rooms for filter:', err)
      }
    }

    loadRooms()
    return () => {
      isCancelled = true
    }
  }, [activeBuilding?.id])

  // Fetch payments list
  const fetchPayments = async () => {
    if (!activeBuilding?.id) {
      setPayments([])
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      const methodParam =
        activeTab !== 'all' ? activeTab : selectedMethod !== 'all' ? selectedMethod : undefined

      const res = await landlordPaymentService.getLandlordPayments(activeBuilding.id, {
        roomId: selectedRoom !== 'all' ? selectedRoom : undefined,
        search: searchQuery.trim() || undefined,
        method: methodParam,
        month: selectedMonth !== 'all' ? selectedMonth : undefined,
        year: selectedYear !== 'all' ? selectedYear : undefined,
        page: currentPage,
        limit: pageSize,
      })

      if (res) {
        setPayments(res.payments || [])
        setTotalRecords(res.pagination?.total || 0)
        if (res.summary) {
          setSummary(res.summary)
        }
      }
    } catch (err) {
      console.error('Error loading payment history:', err)
      setPayments([])
      setTotalRecords(0)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchPayments()
  }, [
    activeBuilding?.id,
    currentPage,
    pageSize,
    searchQuery,
    selectedRoom,
    selectedMethod,
    selectedMonth,
    selectedYear,
    activeTab,
  ])

  // Format money helper
  const formatMoney = (amount: number) => {
    return `${amount.toLocaleString('vi-VN')} ₫`
  }

  const formatLargeMoney = (amount: number) => {
    if (amount >= 1_000_000_000) {
      return `${(amount / 1_000_000_000).toFixed(2).replace(/\.00$/, '')} Tỷ ₫`
    }
    if (amount >= 100_000_000) {
      return `${(amount / 1_000_000).toFixed(1).replace(/\.0$/, '')}M ₫`
    }
    return `${amount.toLocaleString('vi-VN')} ₫`
  }

  const formatDateTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(
        2,
        '0',
      )} - ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(
        2,
        '0',
      )}/${d.getFullYear()}`
    } catch {
      return dateStr
    }
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'totalRevenue',
        label: 'TỔNG THU ĐÃ VỀ',
        value: formatLargeMoney(summary.totalRevenue),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 lg:w-[170px]',
        labelClassName: 'text-emerald-400',
        valueClassName: 'text-emerald-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'totalTransactions',
        label: 'SỐ GIAO DỊCH',
        value: summary.totalTransactions,
        icon: <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[150px]',
        labelColor: 'secondary',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'bankingRevenue',
        label: 'VIETQR / NGÂN HÀNG',
        value: formatLargeMoney(summary.bankingRevenue),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(99,102,241,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 lg:w-[170px]',
        labelClassName: 'text-indigo-300',
        valueClassName: 'text-indigo-300 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
      {
        key: 'cashRevenue',
        label: 'TIỀN MẶT',
        value: formatLargeMoney(summary.cashRevenue),
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 lg:w-[170px]',
        labelClassName: 'text-amber-400',
        valueClassName: 'text-amber-400 text-xs sm:text-base leading-none mt-1 tracking-tight',
      },
    ],
    [summary],
  )

  const handlePrintReceipt = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-16">
      {/* Top Header & Actions Bar */}
      <LandlordPageHeader
        title={
          <span className="flex items-center gap-2">
            <CreditCard className="w-8 h-8 text-[#2AC1BC]" /> Lịch Sử Thu Tiền & Thanh Toán
          </span>
        }
        subtitle="Theo dõi tất cả giao dịch thanh toán thành công, biên nhận điện tử và hình ảnh công tơ điện nước."
        actions={
          <>
            <Button
              variant="outline"
              size="md"
              onClick={() => router.push('/landlord/invoices')}
              className="text-sm font-bold"
            >
              <Receipt className="w-4 h-4 text-muted shrink-0" />
              <span>Quản Lý Hóa Đơn</span>
            </Button>
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push('/landlord/invoices?status=unpaid')}
              className="text-sm font-black"
            >
              <ArrowUpRight className="w-4 h-4 shrink-0" />
              <span>Ghi Nhận Thu Tiền Mới</span>
            </Button>
          </>
        }
      />

      {/* Dark Hero Summary Banner */}
      <LandlordStatBanner
        watermarkIcon={<CreditCard className="w-64 h-64" />}
        chips={statChips}
      />

      {/* Main Filter & Tabs Control Bar */}
      <div className="bg-card p-3.5 sm:p-4 border border-line rounded-2xl shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <SearchInput
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            placeholder="Tìm theo mã giao dịch, số phòng, số biên nhận, tên khách..."
            containerClassName="flex-1 space-y-0"
            className="py-2 bg-surface border-line text-xs font-semibold"
          />

          {/* Filter Dropdowns Row */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Room Filter Dropdown */}
            <SelectInput
              value={selectedRoom}
              onChange={e => {
                setSelectedRoom(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Tất cả phòng' },
                ...availableRooms.map(r => ({
                  value: r.id,
                  label: `Phòng ${r.roomNumber}`,
                })),
              ]}
              containerClassName="space-y-0 max-w-[150px]"
              className="py-2 text-xs font-bold bg-surface"
            />

            {/* Method Filter Dropdown */}
            <SelectInput
              value={selectedMethod}
              onChange={e => {
                setSelectedMethod(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Tất cả hình thức' },
                { value: 'banking', label: 'VietQR / Chuyển khoản' },
                { value: 'cash', label: 'Tiền mặt' },
              ]}
              containerClassName="space-y-0 max-w-[170px]"
              className="py-2 text-xs font-bold bg-surface"
            />

            {/* Month Filter Dropdown */}
            <SelectInput
              value={selectedMonth}
              onChange={e => {
                setSelectedMonth(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Tất cả tháng' },
                ...Array.from({ length: 12 }, (_, i) => ({
                  value: String(i + 1),
                  label: `Tháng ${i + 1}`,
                })),
              ]}
              containerClassName="space-y-0 max-w-[130px]"
              className="py-2 text-xs font-bold bg-surface"
            />

            {/* Year Filter Dropdown */}
            <SelectInput
              value={selectedYear}
              onChange={e => {
                setSelectedYear(e.target.value)
                setCurrentPage(1)
              }}
              options={[
                { value: 'all', label: 'Tất cả năm' },
                { value: '2026', label: '2026' },
                { value: '2025', label: '2025' },
                { value: '2024', label: '2024' },
              ]}
              containerClassName="space-y-0 max-w-[130px]"
              className="py-2 text-xs font-bold bg-surface"
            />

            {/* View Switcher (Rule 9) */}
            <div className="flex items-center bg-card-hover p-1 rounded-xl border border-line shrink-0">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('grid')}
                title="Dạng Lưới (Grid - Mặc định)"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setViewMode('table')}
                title="Dạng Bảng (Table)"
              >
                <List className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden text-xs font-extrabold border-t border-line pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTab('all')
              setCurrentPage(1)
            }}
            className="shrink-0"
          >
            Tất cả giao dịch ({summary.totalTransactions})
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTab('banking')
              setCurrentPage(1)
            }}
            className="shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-indigo-400" />
            VietQR / Ngân hàng ({formatLargeMoney(summary.bankingRevenue)})
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              setActiveTab('cash')
              setCurrentPage(1)
            }}
            className="shrink-0"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            Tiền mặt ({formatLargeMoney(summary.cashRevenue)})
          </Button>
        </div>
      </div>

      {/* Main Content Display (Grid or Table View) */}
      {isLoading ? (
        <div className="py-20 text-center space-y-3 bg-card border border-line rounded-3xl">
          <div className="inline-block animate-spin w-8 h-8 border-4 border-[#2AC1BC] border-t-transparent rounded-full" />
          <p className="text-xs text-muted font-bold">Đang tải lịch sử giao dịch...</p>
        </div>
      ) : payments.length === 0 ? (
        /* Clean Empty State (No Mockup Data!) */
        <div className="py-16 px-6 text-center bg-card border border-line rounded-3xl space-y-4 shadow-2xs">
          <div className="w-16 h-16 rounded-3xl bg-[#2AC1BC]/10 text-[#2AC1BC] flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <div className="space-y-1.5 max-w-md mx-auto">
            <h3 className="font-black text-base text-foreground">Chưa có dữ liệu thanh toán nào</h3>
            <p className="text-xs text-muted font-medium leading-relaxed">
              Tòa nhà hiện chưa phát sinh giao dịch thanh toán thành công nào theo bộ lọc đã chọn.
              Giao dịch sẽ tự động hiển thị tại đây khi khách thuê quét mã VietQR hoặc khi bạn xác
              nhận thu tiền.
            </p>
          </div>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('')
                setSelectedRoom('all')
                setSelectedMethod('all')
                setSelectedMonth('all')
                setSelectedYear('all')
                setActiveTab('all')
              }}
            >
              Đặt lại bộ lọc
            </Button>
            <Link
              href="/landlord/invoices?status=unpaid"
              className="px-4 py-2 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-black rounded-xl shadow-sm transition-all"
            >
              Xem hóa đơn cần thu
            </Link>
          </div>
        </div>
      ) : viewMode === 'grid' ? (
        /* Parallel Grid View (Default - Rule 9) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {payments.map(p => {
            const isBanking = p.method === 'banking'
            const evidencePhotos = p.meterReadings.filter(mr => mr.imageUrl)

            return (
              <div
                key={p.id}
                className="bg-card border border-line hover:border-[#2AC1BC]/50 rounded-2xl p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Method Accent Stripe */}
                <div
                  className={`absolute top-0 left-0 right-0 h-1.5 ${
                    isBanking ? 'bg-indigo-500' : 'bg-amber-500'
                  }`}
                />

                <div className="space-y-4">
                  {/* Top Badges Row */}
                  <div className="flex items-center justify-between gap-2 pt-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="px-2.5 py-1 bg-zinc-900 text-white font-black text-xs rounded-xl shrink-0">
                        {p.roomNumber}
                      </span>
                      {p.roomTypeName && (
                        <span className="text-[11px] font-bold text-muted truncate">
                          {p.roomTypeName}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                          isBanking
                            ? 'bg-info-soft text-info border border-info-subtle'
                            : 'bg-warning-soft text-warning border border-warning-subtle'
                        }`}
                      >
                        {isBanking ? 'VietQR' : 'Tiền mặt'}
                      </span>
                      <span className="px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-success-soft text-success border border-success-subtle flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Thành công
                      </span>
                    </div>
                  </div>

                  {/* Payment Amount & Period Callout */}
                  <div className="p-3.5 bg-surface rounded-xl border border-line flex items-baseline justify-between">
                    <div>
                      <span className="text-[10px] font-extrabold text-muted uppercase tracking-wider block">
                        Kỳ Hóa Đơn {p.period}
                      </span>
                      <span className="text-xl font-black text-emerald-600 tracking-tight block mt-0.5">
                        +{formatMoney(p.amount)}
                      </span>
                    </div>
                    <span className="text-[11px] font-bold text-muted">
                      {p.items.length} khoản thu
                    </span>
                  </div>

                  {/* Payer Info & Receipt Numbers */}
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center justify-between text-muted">
                      <span className="font-medium text-muted flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-muted" /> Người nộp:
                      </span>
                      <span className="font-bold text-foreground truncate max-w-[150px]">
                        {p.payerName}
                      </span>
                    </div>

                    {p.payerPhone && (
                      <div className="flex items-center justify-between text-muted">
                        <span className="font-medium text-muted flex items-center gap-1.5">
                          <Phone className="w-3.5 h-3.5 text-muted" /> SĐT:
                        </span>
                        <span className="font-bold text-foreground/90">{p.payerPhone}</span>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-muted">
                      <span className="font-medium text-muted flex items-center gap-1.5">
                        <Receipt className="w-3.5 h-3.5 text-muted" /> Số biên nhận:
                      </span>
                      <span className="font-mono font-bold text-foreground text-[11px]">
                        {p.receiptNumber || `REC-${p.id.substring(0, 8)}`}
                      </span>
                    </div>

                    {p.transactionRef && (
                      <div className="flex items-center justify-between text-muted">
                        <span className="font-medium text-muted text-[11px]">
                          Mã GD ngân hàng:
                        </span>
                        <span className="font-mono text-muted text-[10px] truncate max-w-[140px]">
                          {p.transactionRef}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Supporting Evidence Meter Photos Pill */}
                  {evidencePhotos.length > 0 && (
                    <div className="pt-2 border-t border-line flex items-center justify-between">
                      <span className="text-[11px] font-bold text-warning bg-warning-soft px-2 py-1 rounded-lg border border-warning-subtle flex items-center gap-1">
                        <Camera className="w-3 h-3 text-amber-600" /> {evidencePhotos.length} ảnh
                        đồng hồ
                      </span>
                      <div className="flex items-center gap-1.5">
                        {evidencePhotos.slice(0, 2).map((photo, idx) => (
                          <Button
                            key={idx}
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewImageUrl(photo.imageUrl)}
                            className="overflow-hidden relative group/thumb"
                            title={`Xem ảnh ${photo.serviceName}: ${photo.readingValue}`}
                          >
                            <img
                              src={photo.imageUrl || ''}
                              alt={photo.serviceName}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                              <Maximize2 className="w-2.5 h-2.5 text-white" />
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer: Timestamp & Action */}
                <div className="pt-4 mt-4 border-t border-line flex items-center justify-between">
                  <span className="text-[11px] font-medium text-muted flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-muted" /> {formatDateTime(p.paidAt)}
                  </span>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedPayment(p)}
                  >
                    <Eye className="w-3.5 h-3.5" /> Xem Biên Nhận
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* Parallel Table View (Rule 9) */
        <div className="bg-card border border-line rounded-2xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface border-b border-line text-muted font-extrabold uppercase text-[10px] tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Số Biên Nhận / Mã GD</th>
                  <th className="px-4 py-3.5">Phòng</th>
                  <th className="px-4 py-3.5">Khách Thuê</th>
                  <th className="px-4 py-3.5">Kỳ Hóa Đơn</th>
                  <th className="px-4 py-3.5">Thời Gian Thu</th>
                  <th className="px-4 py-3.5">Số Tiền Đã Thu</th>
                  <th className="px-4 py-3.5">Hình Thức</th>
                  <th className="px-4 py-3.5">Bằng Chứng</th>
                  <th className="px-5 py-3.5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {payments.map(p => {
                  const isBanking = p.method === 'banking'
                  const evidencePhotos = p.meterReadings.filter(mr => mr.imageUrl)

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors">
                      <td className="px-5 py-4">
                        <div className="font-mono font-black text-foreground text-xs">
                          {p.receiptNumber || `REC-${p.id.substring(0, 8)}`}
                        </div>
                        {p.transactionRef && (
                          <div className="text-[10px] font-mono text-muted mt-0.5 truncate max-w-[140px]">
                            {p.transactionRef}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4">
                        <span className="font-black text-foreground bg-card-hover px-2.5 py-1 rounded-lg">
                          {p.roomNumber}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        <div className="font-bold text-foreground">{p.payerName}</div>
                        {p.payerPhone && (
                          <div className="text-[11px] text-muted font-medium">
                            {p.payerPhone}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-4 font-bold text-foreground/90">{p.period}</td>

                      <td className="px-4 py-4 text-muted font-medium">
                        {formatDateTime(p.paidAt)}
                      </td>

                      <td className="px-4 py-4 font-black text-emerald-600 text-sm whitespace-nowrap">
                        +{formatMoney(p.amount)}
                      </td>

                      <td className="px-4 py-4">
                        <span
                          className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            isBanking
                              ? 'bg-info-soft text-info border border-info-subtle'
                              : 'bg-warning-soft text-warning border border-warning-subtle'
                          }`}
                        >
                          {isBanking ? 'VietQR' : 'Tiền mặt'}
                        </span>
                      </td>

                      <td className="px-4 py-4">
                        {evidencePhotos.length > 0 ? (
                          <div className="flex items-center gap-1">
                            {evidencePhotos.slice(0, 2).map((photo, idx) => (
                              <Button
                                key={idx}
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setPreviewImageUrl(photo.imageUrl)}
                                className="rounded overflow-hidden"
                                title={`Xem ${photo.serviceName}: ${photo.readingValue}`}
                              >
                                <img
                                  src={photo.imageUrl || ''}
                                  alt={photo.serviceName}
                                  className="w-full h-full object-cover"
                                />
                              </Button>
                            ))}
                            {evidencePhotos.length > 2 && (
                              <span className="text-[10px] text-muted font-bold">
                                +{evidencePhotos.length - 2}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-300">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4 text-right">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedPayment(p)}
                        >
                          <Eye className="w-3.5 h-3.5" /> Biên Nhận
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

      {/* Standardized View & Pagination Bar (Rule #9) */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalRecords}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={500}
      />

      {/* Electronic Receipt & Detail Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-line p-6 sm:p-8 space-y-6 relative print:p-0 print:border-none print:shadow-none">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-line pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-success-soft text-success border border-success-subtle rounded-lg text-[10px] font-black uppercase">
                    Thanh Toán Hoàn Tất
                  </span>
                  <span className="text-muted text-xs font-semibold">
                    {formatDateTime(selectedPayment.paidAt)}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
                  <Receipt className="w-6 h-6 text-[#2AC1BC]" /> Biên Nhận Điện Tử
                </h3>
                <p className="text-xs text-muted font-mono">
                  Mã biên nhận:{' '}
                  <span className="text-foreground/90 font-bold">
                    {selectedPayment.receiptNumber || `REC-${selectedPayment.id}`}
                  </span>
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handlePrintReceipt}
                  title="In biên nhận"
                >
                  <Printer className="w-5 h-5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedPayment(null)}
                  title="Đóng modal"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Payer & Property Info Card */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-surface p-4 rounded-2xl border border-line text-xs">
              <div className="space-y-1.5">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider">
                  THÔNG TIN PHÒNG & KHÁCH HÀNG
                </span>
                <div className="font-black text-foreground text-sm">
                  Phòng {selectedPayment.roomNumber}{' '}
                  {selectedPayment.roomTypeName && `(${selectedPayment.roomTypeName})`}
                </div>
                <div className="text-muted font-semibold">
                  Người thanh toán:{' '}
                  <span className="text-foreground font-black">{selectedPayment.payerName}</span>
                </div>
                {selectedPayment.payerPhone && (
                  <div className="text-muted">
                    Số điện thoại:{' '}
                    <span className="font-bold text-foreground/90">{selectedPayment.payerPhone}</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5 sm:border-l sm:border-zinc-200 sm:pl-4">
                <span className="text-[10px] font-black uppercase text-muted tracking-wider">
                  THÔNG TIN GIAO DỊCH
                </span>
                <div className="text-foreground/90">
                  Hình thức:{' '}
                  <span className="font-black text-foreground">
                    {selectedPayment.method === 'banking'
                      ? 'Chuyển khoản VietQR'
                      : 'Tiền mặt trực tiếp'}
                  </span>
                </div>
                {selectedPayment.transactionRef && (
                  <div className="text-muted font-mono text-[11px] truncate">
                    Mã GD: {selectedPayment.transactionRef}
                  </div>
                )}
                <div className="text-foreground/90">
                  Kỳ thanh toán:{' '}
                  <span className="font-black text-[#2AC1BC]">{selectedPayment.period}</span>
                </div>
              </div>
            </div>

            {/* Invoice Breakdown Items */}
            <div className="space-y-3">
              <h4 className="text-xs font-black uppercase text-muted tracking-wider">
                Chi Tiết Các Khoản Đã Thu
              </h4>
              <div className="border border-line rounded-2xl overflow-hidden">
                <table className="w-full text-xs">
                  <thead className="bg-surface border-b border-line text-muted font-bold uppercase text-[10px]">
                    <tr>
                      <th className="px-4 py-2.5 text-left">Nội dung</th>
                      <th className="px-3 py-2.5 text-center">Số lượng</th>
                      <th className="px-4 py-2.5 text-right">Đơn giá</th>
                      <th className="px-4 py-2.5 text-right">Thành tiền</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {selectedPayment.items.length > 0 ? (
                      selectedPayment.items.map(item => (
                        <tr key={item.id} className="hover:bg-zinc-50/50">
                          <td className="px-4 py-3 font-bold text-foreground">{item.serviceName}</td>
                          <td className="px-3 py-3 text-center text-muted font-medium">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 text-right text-muted font-medium">
                            {formatMoney(item.unitPrice)}
                          </td>
                          <td className="px-4 py-3 text-right font-black text-foreground">
                            {formatMoney(item.amount)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td className="px-4 py-3 font-bold text-foreground">
                          Tiền phòng & Dịch vụ trọn gói kỳ {selectedPayment.period}
                        </td>
                        <td className="px-3 py-3 text-center text-muted font-medium">1</td>
                        <td className="px-4 py-3 text-right text-muted font-medium">
                          {formatMoney(selectedPayment.amount)}
                        </td>
                        <td className="px-4 py-3 text-right font-black text-foreground">
                          {formatMoney(selectedPayment.amount)}
                        </td>
                      </tr>
                    )}
                  </tbody>
                  <tfoot className="bg-surface border-t border-line">
                    <tr>
                      <td colSpan={3} className="px-4 py-3 font-black text-foreground text-right">
                        TỔNG CỘNG ĐÃ THANH TOÁN:
                      </td>
                      <td className="px-4 py-3 font-black text-emerald-600 text-base text-right whitespace-nowrap">
                        {formatMoney(selectedPayment.amount)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Supporting Evidence Meter Photos */}
            {selectedPayment.meterReadings.length > 0 && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase text-warning tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-600" /> Bằng Chứng Chỉ Số Đồng Hồ
                  </h4>
                  <span className="text-[11px] text-muted font-medium">
                    Ảnh chụp đối soát chỉ số điện / nước
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedPayment.meterReadings.map(mr => (
                    <div
                      key={mr.id}
                      className="p-3 bg-warning-soft border border-warning-subtle rounded-2xl flex items-center gap-3"
                    >
                      {mr.imageUrl ? (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setPreviewImageUrl(mr.imageUrl)}
                          className="overflow-hidden shrink-0 relative group/photo"
                        >
                          <img
                            src={mr.imageUrl}
                            alt={mr.serviceName}
                            className="w-full h-full object-cover group-hover/photo:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity">
                            <Maximize2 className="w-3.5 h-3.5 text-white" />
                          </div>
                        </Button>
                      ) : (
                        <div className="w-16 h-16 rounded-xl bg-card-hover flex items-center justify-center shrink-0 text-muted">
                          <Camera className="w-6 h-6 stroke-1" />
                        </div>
                      )}

                      <div className="space-y-1 min-w-0 text-xs">
                        <span className="font-extrabold text-foreground block truncate">
                          Đồng hồ {mr.serviceName}
                        </span>
                        <span className="text-warning font-black text-sm block">
                          Chỉ số: {mr.readingValue}
                        </span>
                        {mr.imageUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewImageUrl(mr.imageUrl)}
                            className="hover:underline"
                          >
                            <span>Xem ảnh phóng to</span> &rarr;
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="pt-4 border-t border-line flex items-center justify-between print:hidden">
              <span className="text-[11px] text-muted">Xác thực số hóa bởi Dormio BHMS</span>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handlePrintReceipt}
                >
                  <Printer className="w-3.5 h-3.5" /> In Biên Nhận
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  onClick={() => setSelectedPayment(null)}
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox Modal for Meter Reading Photos */}
      {previewImageUrl && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="relative max-w-3xl w-full max-h-[90vh] flex flex-col items-center">
            <Button rounded="full"
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPreviewImageUrl(null)}
              className="absolute -top-12 right-0"
              title="Đóng ảnh"
            >
              <X className="w-6 h-6" />
            </Button>
            <img
              src={previewImageUrl}
              alt="Bằng chứng công tơ điện nước"
              className="max-h-[80vh] w-auto max-w-full rounded-2xl object-contain shadow-2xl border border-white/20"
            />
            <p className="text-white/80 text-xs font-semibold mt-3">
              Ảnh chụp công tơ thực tế đính kèm kỳ thanh toán
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default function PaymentsPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-xs text-muted font-bold">
          Đang tải trang thanh toán...
        </div>
      }
    >
      <PaymentsContent />
    </Suspense>
  )
}
