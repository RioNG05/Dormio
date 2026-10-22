'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Users,
  AlertCircle,
  CheckCircle2,
  Info,
  PhoneCall,
  Phone,
  MessageCircle,
  Eye,
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Customer } from './data'
import { getLandlordContracts } from '@/services/contract.service'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  SelectInput,
  SearchInput,
  ChipGroup,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
} from '@/components/ui'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

export default function CustomersPage() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')

  const getCustomerStatusLabel = (status: string) => {
    switch (status) {
      case 'Đang ở':
        return t('landlordCustomersStaying')
      case 'Sắp hết hợp đồng':
        return t('landlordCustomersExpiringSoon')
      case 'Đã rời':
        return t('landlordCustomersLeft')
      default:
        return status
    }
  }

  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  const [searchQuery, setSearchQuery] = useState('')
  const [buildingFilter, setBuildingFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [sortFilter, setSortFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  // Professional Alert Popup Modal State
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'warning' | 'error' | 'success' | 'info'
  }>({
    isOpen: false,
    title: t('landlordCustomersAlertDefaultTitle'),
    message: '',
    type: 'info',
  })

  const showAlert = (
    message: string,
    type: 'warning' | 'error' | 'success' | 'info' = 'warning',
    title?: string,
  ) => {
    const finalTitle = title || t('landlordCustomersAlertDefaultTitle')
    setAlertModal({ isOpen: true, title: finalTitle, message, type })
  }

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, buildingFilter, statusFilter, sortFilter, itemsPerPage])

  const [customers, setCustomers] = useState<Customer[]>([])
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const handleOpenChat = (cust: Customer) => {
    const targetUserId = cust.userId || (cust.id && !cust.id.startsWith('cust_') ? cust.id : '')
    if (!targetUserId && !cust.hasAccount) {
      showAlert(
        `Khách thuê ${cust.name} chưa có tài khoản trên hệ thống Dormio để nhắn tin trực tiếp. Vui lòng liên hệ qua số điện thoại ${cust.phone !== '—' ? cust.phone : 'đã lưu'}.`,
        'info',
        'Chưa có tài khoản liên kết',
      )
      return
    }
    const query = new URLSearchParams()
    if (targetUserId) {
      query.set('userId', targetUserId)
    }
    if (cust.name) {
      query.set('tenant', cust.name)
    }
    if (cust.room && cust.room !== '—') {
      query.set('room', cust.room)
    }
    router.push(`/landlord/messages?${query.toString()}`)
  }

  // Load real customers from active property contracts
  useEffect(() => {
    async function loadCustomers() {
      if (!activeBuilding?.id) {
        setCustomers([])
        return
      }
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
      if (!UUID_RE.test(activeBuilding.id)) {
        setCustomers([])
        return
      }

      try {
        setIsLoading(true)
        const res = await getLandlordContracts(activeBuilding.id, { limit: 100 })
        const list = res?.data || []
        const mapped: Customer[] = list.flatMap((c: any): Customer[] => {
          const daysRemaining = c.endDate
            ? Math.max(
              0,
              Math.ceil((new Date(c.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
            )
            : undefined
          const contractStatus =
            c.status === 'active'
              ? daysRemaining !== undefined && daysRemaining <= 30
                ? 'Sắp hết hợp đồng'
                : 'Đang ở'
              : c.status === 'draft'
                ? 'Sắp hết hợp đồng'
                : 'Đã rời'

          const tContracts =
            c.tenantContracts && c.tenantContracts.length > 0 ? c.tenantContracts : []
          let tenantsToMap: any[] = []

          if (tContracts.length > 0) {
            tenantsToMap = tContracts.map((tc: any) => tc.tenant).filter(Boolean)
          } else if (c.tenant) {
            tenantsToMap = [c.tenant]
          }

          if (tenantsToMap.length === 0) {
            return [
              {
                id: `cust_${c.id}`,
                contractId: c.id,
                name: t('landlordCustomersDefaultName'),
                phone: '—',
                room: c.room?.roomNumber || '—',
                building: activeBuilding.id,
                cccd: '—',
                joinDate: c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—',
                endDate: c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : undefined,
                daysRemaining,
                status: contractStatus,
                hasAccount: false,
              },
            ]
          }

          return tenantsToMap.map((tenantUser: any) => {
            const ident = tenantUser?.userIdentification
            let formattedAddress = ''
            if (ident?.placeOfResidence) {
              if (typeof ident.placeOfResidence === 'string') {
                formattedAddress = ident.placeOfResidence
              } else if (typeof ident.placeOfResidence === 'object') {
                formattedAddress = Object.values(ident.placeOfResidence).filter(Boolean).join(', ')
              }
            } else if (ident?.permanentAddress) {
              formattedAddress = ident.permanentAddress
            }

            return {
              id: tenantUser?.id || `cust_${c.id}`,
              userId: tenantUser?.id,
              contractId: c.id,
              name:
                ident?.fullName ||
                tenantUser?.fullName ||
                tenantUser?.username ||
                t('landlordCustomersDefaultName'),
              phone: tenantUser?.phoneNumber || '—',
              room: c.room?.roomNumber || '—',
              building: activeBuilding.id,
              cccd: ident?.identityNumber || '—',
              joinDate: c.startDate ? new Date(c.startDate).toLocaleDateString('vi-VN') : '—',
              endDate: c.endDate ? new Date(c.endDate).toLocaleDateString('vi-VN') : undefined,
              daysRemaining,
              status: contractStatus,
              email: tenantUser?.email || undefined,
              dob: ident?.dateOfBirth
                ? new Date(ident.dateOfBirth).toLocaleDateString('vi-VN')
                : undefined,
              gender: ident?.gender || 'nam',
              address: formattedAddress || undefined,
              cardFrontUrl: ident?.cardFrontUrl,
              cardBackUrl: ident?.cardBackUrl,
              hasAccount: !!tenantUser?.id,
            }
          })
        })
        setCustomers(mapped)
      } catch (err) {
        console.warn('Failed to load customers from contracts:', err)
        setCustomers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomers()
  }, [activeBuilding?.id])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const rawId = params.get('id')
      if (rawId) {
        router.push(`/landlord/customers/${encodeURIComponent(rawId)}`)
      }
    }
  }, [router])


  const totalCustomers = customers.length
  const stayingCount = customers.filter(c => c.status === 'Đang ở').length
  const expiringCount = customers.filter(c => c.status === 'Sắp hết hợp đồng').length
  const leftCount = customers.filter(c => c.status === 'Đã rời').length

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordCustomersStatTotalShort'),
        value: totalCustomers,
        icon: <Users className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'staying',
        label: t('landlordCustomersStatStayingShort'),
        value: stayingCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[130px]',
        labelColor: 'brand',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'expiring',
        label: t('landlordCustomersStatExpiringShort'),
        value: expiringCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-accent shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-accent/10 hover:bg-accent/20 border-accent/30 lg:w-[130px]',
        labelClassName: 'text-accent',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'left',
        label: t('landlordCustomersStatLeftShort'),
        value: leftCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-vacant shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3 py-2 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[130px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
    ],
    [t, totalCustomers, stayingCount, expiringCount, leftCount],
  )

  if (!isMounted) {
    return null
  }

  const filteredCustomers = customers.filter(customer => {
    const matchSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.includes(searchQuery) ||
      customer.cccd.includes(searchQuery)
    const matchBuilding = buildingFilter === '' || customer.building === buildingFilter
    const matchStatus = statusFilter === '' || customer.status === statusFilter
    return matchSearch && matchBuilding && matchStatus
  })

  const sortedCustomers = [...filteredCustomers].sort((a, b) => {
    if (sortFilter === 'name_asc') return a.name.localeCompare(b.name)
    if (sortFilter === 'room_asc') return a.room.localeCompare(b.room)
    return 0
  })

  const totalPages = Math.ceil(sortedCustomers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage)


  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <LandlordPageHeader
        title={t('landlordCustomersPageHeading')}
        subtitle={t('landlordCustomersPageSubheading')}
        actions={
          <Button
            variant="primary"
            size="md"
            onClick={() => router.push('/landlord/contracts/create')}
            className="sm:w-auto text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>{t('landlordCustomersBtnAddContract')}</span>
          </Button>
        }
      />

      {/* Building Overview Banner */}
      {activeBuilding && (
        <LandlordStatBanner
          watermarkIcon={<Users className="w-64 h-64" />}
          chips={statChips}
        />
      )}

      {/* SINGLE ROW TOOLBAR (Filter Pills + Search + Sort + View Switcher all in 1 Row) */}
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordCustomersSearchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
            containerClassName="w-full space-y-0"
          />
        }
        filters={
          <>
            <ChipGroup
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                {
                  value: '',
                  label: t('landlordCustomersAll'),
                  count: totalCustomers,
                },
                {
                  value: 'Đang ở',
                  label: t('landlordCustomersStatStayingShort'),
                  count: stayingCount,
                  variant: 'default',
                },
                {
                  value: 'Sắp hết hợp đồng',
                  label: t('landlordCustomersStatExpiringShort'),
                  count: expiringCount,
                  variant: 'warning',
                },
                {
                  value: 'Đã rời',
                  label: t('landlordCustomersStatLeftShort'),
                  count: leftCount,
                  variant: 'info',
                },
              ]}
            />

            <SelectInput
              value={sortFilter}
              onChange={e => setSortFilter(e.target.value)}
              containerClassName="min-w-34 w-auto shrink-0 space-y-0"
              options={[
                { value: '', label: t('landlordCustomersSort') },
                { value: 'name_asc', label: t('landlordCustomersSortName') },
                { value: 'room_asc', label: t('landlordCustomersSortRoom') },
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

      {/* Customer View: Grid or List */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedCustomers.length === 0 ? (
            <div className="col-span-full py-14 text-center bg-card rounded-2xl border border-line text-muted">
              {isLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-bold">{t('landlordCustomersLoading')}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Users className="w-8 h-8 text-zinc-300" />
                  <p className="text-sm font-bold text-foreground/90">
                    {t('landlordCustomersEmptyTitle')}
                  </p>
                  <p className="text-xs text-muted">{t('landlordCustomersEmptyDesc')}</p>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => router.push('/landlord/contracts/create')}
                    className="mt-2"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{t('landlordCustomersBtnCreateContract')}</span>
                  </Button>
                </div>
              )}
            </div>
          ) : (
            paginatedCustomers.map(customer => (
              <Card
                key={customer.id}
                className="p-4 sm:p-5 space-y-3 relative group"
                onClick={() => router.push(`/landlord/customers/${customer.userId || customer.id}`)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase shrink-0">
                      {customer.name.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/landlord/customers/${customer.userId || customer.id}`}
                        className="font-bold text-foreground text-sm hover:text-primary cursor-pointer transition-colors truncate block"
                      >
                        {customer.name}
                      </Link>
                      <p className="text-xs text-muted font-semibold truncate flex items-center gap-1.5 mt-0.5">
                        <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                        <span>{customer.phone || '—'}</span>
                      </p>
                    </div>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full shrink-0 whitespace-nowrap ${customer.status === 'Đang ở'
                      ? 'bg-primary/10 text-primary border border-primary/30'
                      : customer.status === 'Sắp hết hợp đồng'
                        ? 'bg-accent-soft text-accent border border-accent-subtle animate-pulse'
                        : 'bg-info-soft text-info border border-info-subtle'
                      }`}
                  >
                    {getCustomerStatusLabel(customer.status)}
                  </span>
                </div>

                <div className="p-2.5 bg-surface rounded-xl space-y-1.5 text-xs text-muted">
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-medium whitespace-nowrap">
                      {t('landlordCustomersBuildingAndRoomLabel')}
                    </span>
                    <span className="font-bold text-foreground whitespace-nowrap">
                      {activeBuilding?.name || t('landlordCustomersBuildingFallback')} —{' '}
                      {t('landlordCustomersRoomWord')}{' '}
                      {customer.status === 'Đã rời' ? '—' : customer.room}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted font-medium whitespace-nowrap">
                      {t('landlordCustomersStayDate')}
                    </span>
                    <span className="font-semibold text-foreground whitespace-nowrap">
                      {customer.joinDate}
                    </span>
                  </div>
                  {customer.status === 'Sắp hết hợp đồng' && (
                    <div className="flex justify-between items-center pt-1 border-t border-accent-subtle text-accent font-bold">
                      <span className="whitespace-nowrap">
                        ⏳ {t('landlordCustomersContractExpiry')}
                      </span>
                      <span className="text-orange-600 animate-pulse whitespace-nowrap">
                        {customer.daysRemaining !== undefined
                          ? t('landlordCustomersContractDaysRemaining').replace(
                            '{days}',
                            String(customer.daysRemaining),
                          )
                          : t('landlordCustomersDaysRemainingShort')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Quick Inline Action Buttons */}
                <div className="grid grid-cols-3 gap-1.5 pt-1">
                  <a
                    href={`tel:${customer.phone}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      variant='success'
                      size='sm'
                      leftIcon={<PhoneCall />}
                      fullWidth
                    >
                      {t('landlordCustomersCallBtn')}
                    </Button>
                  </a>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    leftIcon={<MessageCircle />}
                    fullWidth
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenChat(customer)
                    }}
                    className="whitespace-nowrap"
                  >
                    {t('landlordCustomersMessageBtn')}
                  </Button>
                </div>
              </Card>
            ))
          )}
        </div>
      ) : (
        <div className="bg-card border border-line rounded-2xl shadow-xs overflow-hidden flex flex-col">
          <div className="overflow-auto max-h-[500px]">
            <table className="w-full text-sm text-left relative">
              <thead className="text-[11px] font-bold text-muted uppercase bg-surface/80 border-b border-line sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-4 whitespace-nowrap">
                    {t('landlordCustomersCustomerName')}
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">{t('landlordCustomersPhone')}</th>
                  <th className="px-6 py-4 whitespace-nowrap">{t('landlordCustomersBuilding')}</th>
                  <th className="px-6 py-4 whitespace-nowrap">
                    {t('landlordCustomersCurrentRoom')}
                  </th>
                  <th className="px-6 py-4 whitespace-nowrap">{t('landlordCustomersStatus')}</th>
                  <th className="px-6 py-4 text-right whitespace-nowrap">
                    {t('landlordCustomersActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {sortedCustomers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-xs font-bold">{t('landlordCustomersLoading')}</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-1.5 py-4">
                          <Users className="w-7 h-7 text-zinc-300" />
                          <p className="text-xs font-bold text-foreground/90">
                            {t('landlordCustomersEmptyTitle')}
                          </p>
                          <p className="text-[11px] text-muted">
                            {t('landlordCustomersEmptyDescTable')}
                          </p>
                        </div>
                      )}
                    </td>
                  </tr>
                ) : (
                  paginatedCustomers.map(customer => (
                    <TableRow
                      key={customer.id}
                      className="group"
                      onClick={() =>
                        router.push(`/landlord/customers/${customer.userId || customer.id}`)
                      }
                    >
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-xs uppercase shrink-0">
                            {customer.name.charAt(0)}
                          </div>
                          <span className="font-bold text-foreground group-hover:text-primary transition-colors">
                            {customer.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 font-bold text-foreground whitespace-nowrap">
                        {customer.phone}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-foreground/90 capitalize whitespace-nowrap">
                        {activeBuilding?.name || t('landlordCustomersBuildingFallback')}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-foreground/90 whitespace-nowrap">
                        {customer.status === 'Đã rời' ? '—' : customer.room}
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full border whitespace-nowrap ${customer.status === 'Đang ở'
                            ? 'bg-primary/10 text-primary border-primary/30'
                            : customer.status === 'Sắp hết hợp đồng'
                              ? 'bg-accent-soft text-accent border border-accent-subtle animate-pulse'
                              : 'bg-info-soft text-info border border-info-subtle'
                            }`}
                        >
                          {getCustomerStatusLabel(customer.status)}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <a href={`tel:${customer.phone}`} onClick={e => e.stopPropagation()}>
                            <Button variant='success' size='icon-sm' title={t('landlordCustomersCallBtn')}>
                              <PhoneCall />
                            </Button>
                          </a>
                          <Button
                            variant="primary"
                            size="icon-sm"
                            title={t('landlordCustomersMessageBtn')}
                            className="whitespace-nowrap"
                            onClick={e => {
                              e.stopPropagation()
                              handleOpenChat(customer)
                            }}
                          >
                            <MessageCircle />
                          </Button>
                        </div>
                      </td>
                    </TableRow>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Standardized Dormio Pagination Footer with Custom Rows Per Page */}
      <Pagination
        currentPage={currentPage}
        totalItems={sortedCustomers.length}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        unitLabel={t('landlordCustomersTotalCustomers').toLowerCase()}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

function AlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  onClose,
}: {
  isOpen: boolean
  title: string
  message: string
  type?: 'warning' | 'error' | 'success' | 'info'
  onClose: () => void
}) {
  const t = useTranslations('landlord')
  if (!isOpen) return null

  const config = {
    warning: {
      bgColor: 'bg-amber-500/10 text-warning border-warning-subtle',
      icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
      btnColor: 'bg-amber-500 hover:bg-warning text-white shadow-amber-500/20',
    },
    error: {
      bgColor: 'bg-danger/10 text-danger border-danger-subtle',
      icon: <AlertCircle className="w-7 h-7 text-danger" />,
      btnColor: 'bg-danger hover:bg-danger text-white shadow-danger/20',
    },
    success: {
      bgColor: 'bg-emerald-500/10 text-success border-success-subtle',
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      btnColor: 'bg-emerald-500 hover:bg-success text-white shadow-emerald-500/20',
    },
    info: {
      bgColor: 'bg-accent-soft text-accent border-accent-subtle',
      icon: <Info className="w-7 h-7 text-accent" />,
      btnColor: 'bg-accent hover:bg-[#e05a2b] text-white shadow-accent/20',
    },
  }[type]

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line p-6 space-y-4 text-center">
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}
        >
          {config.icon}
        </div>

        <div className="space-y-1.5">
          <h3 className="text-lg font-black text-foreground">{title}</h3>
          <p className="text-xs text-muted font-medium leading-relaxed">{message}</p>
        </div>

        <Button fullWidth size="xs" variant="dark"
          onClick={onClose}
        >
          {t('landlordCustomersUnderstood')}
        </Button>
      </div>
    </div>
  )
}
