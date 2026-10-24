'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
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
  AlertTriangle,
  Loader2,
} from 'lucide-react'
import { Customer } from './data'
import { getLandlordTenants, LandlordTenantItem } from '@/services/tenant.service'
import { AddTenantModal } from '@/components/landlord/AddTenantModal'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TableActionButton,
  SelectInput,
  SearchInput,
  ChipGroup,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  Card,
  TableRow,
  Chip,
  Text,
  EmptyState,
  Modal,
} from '@/components/ui'
import { DashboardPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

export default function CustomersPage() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')
  const { toast } = useToast()

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
  const [isAddTenantModalOpen, setIsAddTenantModalOpen] = useState<boolean>(false)

  const handleOpenChat = (cust: Customer) => {
    const targetUserId = cust.userId || (cust.id && !cust.id.startsWith('cust_') ? cust.id : '')
    if (!targetUserId && !cust.hasAccount) {
      showAlert(
        t('landlordCustomersChatNoAccountDesc', {
          name: cust.name,
          phone: cust.phone !== '—' ? cust.phone : t('landlordCustomersDefaultName'),
        }),
        'info',
        t('landlordCustomersChatNoAccountTitle'),
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

  // Load real customers from unified landlord tenants endpoint
  const loadCustomers = useCallback(async () => {
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
      const tenantRes = await getLandlordTenants(activeBuilding.id, { limit: 100 })
      const raw = tenantRes?.data as any
      const list: LandlordTenantItem[] = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.data)
          ? raw.data
          : []
      const mapped: Customer[] = list.map(item => ({
        id: item.id,
        userId: item.userId,
        contractId: item.contractId,
        name: item.fullName || t('landlordCustomersDefaultName'),
        phone: item.phoneNumber || '—',
        room: item.roomNumber || '—',
        building: activeBuilding.id,
        cccd: item.identityNumber || '—',
        joinDate: item.joinedAt || '—',
        endDate: item.endDate,
        daysRemaining: item.daysRemaining,
        status: item.status,
        email: item.email || undefined,
        dob: item.dateOfBirth || undefined,
        gender: item.gender || 'nam',
        address: item.address || undefined,
        cardFrontUrl: item.cardFrontUrl || undefined,
        cardBackUrl: item.cardBackUrl || undefined,
        hasAccount: item.hasAccount,
        tenancyType: item.tenancyType,
        roomId: item.roomId,
      }))
      setCustomers(mapped)
    } catch (err) {
      console.error('Failed to load tenants:', err)
      setCustomers([])
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, t])

  useEffect(() => {
    loadCustomers()
  }, [loadCustomers])

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

  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedCustomers = sortedCustomers.slice(startIndex, startIndex + itemsPerPage)


  return (
    <div className="space-y-6">
      {/* Top Bar / Header */}
      <DashboardPageHeader
        title={t('landlordCustomersPageHeading')}
        subtitle={t('landlordCustomersPageSubheading')}
        actions={
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
            <Button
              size="md"
              variant="outline"
              onClick={() => router.push('/landlord/contracts/create')}
              leftIcon={<Plus />}
              className="w-full sm:w-auto text-sm"
            >
              {t('landlordCustomersBtnAddContract')}
            </Button>
            <Button
              size="md"
              variant="primary"
              onClick={() => {
                if (!activeBuilding?.id) {
                  showAlert(t('landlordCustomersSelectBuildingFirst'), 'warning')
                  return
                }
                setIsAddTenantModalOpen(true)
              }}
              leftIcon={<Plus />}
              className="w-full sm:w-auto text-sm"
            >
              {t('landlordTenantBtnAdd')}
            </Button>
          </div>
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
            <div className="col-span-full">
              {isLoading ? (
                <div className="py-14 text-center bg-card rounded-2xl border border-line text-muted flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-primary" />
                  <span className="text-xs font-bold">{t('landlordCustomersLoading')}</span>
                </div>
              ) : (
                <EmptyState
                  icon={<Users className="w-8 h-8" />}
                  title={t('landlordCustomersEmptyTitle')}
                  description={t('landlordCustomersEmptyDesc')}
                  action={
                    <div className="flex flex-col sm:flex-row items-center gap-2.5">
                      <Button
                        size='md'
                        variant="primary"
                        onClick={() => {
                          if (!activeBuilding?.id) {
                            showAlert(t('landlordCustomersSelectBuildingFirst'), 'warning')
                            return
                          }
                          setIsAddTenantModalOpen(true)
                        }}
                        leftIcon={<Plus />}
                      >
                        {t('landlordTenantBtnAdd')}
                      </Button>
                      <Button
                        size='md'
                        variant="outline"
                        onClick={() => router.push('/landlord/contracts/create')}
                        leftIcon={<Plus />}
                      >
                        {t('landlordCustomersBtnCreateContract')}
                      </Button>
                    </div>
                  }
                />
              )}
            </div>
          ) : (
            paginatedCustomers.map(customer => (
              <Card
                key={customer.id}
                className="space-y-3 relative group"
                onClick={() => router.push(`/landlord/customers/${customer.userId || customer.id}`)}
              >
                <Card.Header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-0 border-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm uppercase shrink-0">
                        {customer.name.charAt(0)}
                      </div>
                      <div className="min-w-0">
                        <Text
                          as="h3"
                          size="sm"
                          weight="bold"
                          color="default"
                          clamp={1}
                          className="group-hover:text-primary transition-colors"
                        >
                          {customer.name}
                        </Text>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                          <Text as="span" size="xs" color="secondary" weight="semibold" clamp={1}>
                            {customer.phone || '—'}
                          </Text>
                        </div>
                      </div>
                    </div>
                    <Chip
                      size="sm"
                      preventHover
                      variant={
                        customer.status === 'Đang ở'
                          ? 'primary'
                          : customer.status === 'Sắp hết hợp đồng'
                            ? 'accent'
                            : 'info'
                      }
                    >
                      {getCustomerStatusLabel(customer.status)}
                    </Chip>
                  </div>
                </Card.Header>

                <Card.Body className="px-4 sm:px-5 py-0">
                  <div className="p-2.5 bg-surface rounded-xl space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Text as="span" size="xs" color="secondary" weight="medium" className="whitespace-nowrap">
                        {t('landlordCustomersBuildingAndRoomLabel')}
                      </Text>
                      <Text as="span" size="xs" weight="bold" color="default" className="whitespace-nowrap">
                        {activeBuilding?.name || t('landlordCustomersBuildingFallback')} —{' '}
                        {t('landlordCustomersRoomWord')}{' '}
                        {customer.status === 'Đã rời' ? '—' : customer.room}
                      </Text>
                    </div>
                    <div className="flex justify-between items-center">
                      <Text as="span" size="xs" color="secondary" weight="medium" className="whitespace-nowrap">
                        {t('landlordCustomersStayDate')}
                      </Text>
                      <Text as="span" size="xs" weight="semibold" color="default" className="whitespace-nowrap">
                        {customer.joinDate}
                      </Text>
                    </div>
                    {customer.status === 'Sắp hết hợp đồng' && (
                      <div className="flex justify-between items-center pt-1 border-t border-accent-subtle">
                        <Text as="span" size="xs" weight="bold" color="orange" className="whitespace-nowrap">
                          ⏳ {t('landlordCustomersContractExpiry')}
                        </Text>
                        <Text as="span" size="xs" weight="bold" color="orange" className="animate-pulse whitespace-nowrap">
                          {customer.daysRemaining !== undefined
                            ? t('landlordCustomersContractDaysRemaining').replace(
                              '{days}',
                              String(customer.daysRemaining),
                            )
                            : t('landlordCustomersDaysRemainingShort')}
                        </Text>
                      </div>
                    )}
                  </div>
                </Card.Body>

                {/* Quick Inline Action Buttons */}
                <Card.Footer className="px-4 sm:px-5 pt-1 pb-4 border-0 flex justify-end gap-1.5">
                  <a
                    href={`tel:${customer.phone}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <Button
                      variant='success'
                      leftIcon={<PhoneCall />}
                    >
                      {t('landlordCustomersCallBtn')}
                    </Button>
                  </a>
                  <Button
                    leftIcon={<MessageCircle />}
                    onClick={e => {
                      e.stopPropagation()
                      handleOpenChat(customer)
                    }}
                  >
                    {t('landlordCustomersMessageBtn')}
                  </Button>
                </Card.Footer>
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
                    <td colSpan={6} className="px-6 py-12">
                      {isLoading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin text-primary" />
                          <span className="text-xs font-bold">{t('landlordCustomersLoading')}</span>
                        </div>
                      ) : (
                        <EmptyState
                          icon={<Users className="w-8 h-8" />}
                          title={t('landlordCustomersEmptyTitle')}
                          description={t('landlordCustomersEmptyDescTable')}
                          bordered={false}
                          action={
                            <div className="flex flex-col sm:flex-row items-center gap-2.5">
                              <Button
                                variant="primary"
                                onClick={() => {
                                  if (!activeBuilding?.id) {
                                    showAlert(t('landlordCustomersSelectBuildingFirst'), 'warning')
                                    return
                                  }
                                  setIsAddTenantModalOpen(true)
                                }}
                                leftIcon={<Plus />}
                              >
                                {t('landlordTenantBtnAdd')}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => router.push('/landlord/contracts/create')}
                                leftIcon={<Plus />}
                              >
                                {t('landlordCustomersBtnCreateContract')}
                              </Button>
                            </div>
                          }
                        />
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
                          <Text
                            as="span"
                            size="sm"
                            weight="bold"
                            color="default"
                            className="group-hover:text-primary transition-colors"
                          >
                            {customer.name}
                          </Text>
                        </div>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Text as="span" size="xs" weight="bold" color="default">
                          {customer.phone || '—'}
                        </Text>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap capitalize">
                        <Text as="span" size="xs" weight="medium" color="default">
                          {activeBuilding?.name || t('landlordCustomersBuildingFallback')}
                        </Text>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Text as="span" size="xs" weight="medium" color="default">
                          {customer.status === 'Đã rời' ? '—' : customer.room}
                        </Text>
                      </td>
                      <td className="px-6 py-3.5 whitespace-nowrap">
                        <Chip
                          size="sm"
                          preventHover
                          variant={
                            customer.status === 'Đang ở'
                              ? 'primary'
                              : customer.status === 'Sắp hết hợp đồng'
                                ? 'accent'
                                : 'info'
                          }
                        >
                          {getCustomerStatusLabel(customer.status)}
                        </Chip>
                      </td>
                      <td className="px-6 py-3.5 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={e => e.stopPropagation()}
                        >
                          <a href={`tel:${customer.phone}`} onClick={e => e.stopPropagation()}>
                            <TableActionButton
                              icon={<PhoneCall />}
                              title={t('landlordCustomersCallBtn')}
                            />
                          </a>
                          <TableActionButton
                            icon={<MessageCircle />}
                            title={t('landlordCustomersMessageBtn')}
                            onClick={e => {
                              e.stopPropagation()
                              handleOpenChat(customer)
                            }}
                          />
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

      {activeBuilding?.id && (
        <AddTenantModal
          isOpen={isAddTenantModalOpen}
          onClose={() => setIsAddTenantModalOpen(false)}
          onSuccess={async () => {
            setIsAddTenantModalOpen(false)
            await loadCustomers()
            toast.success(t('landlordTenantSuccessToast'))
          }}
          boardingHouseId={activeBuilding.id}
        />
      )}
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

  const config = {
    warning: {
      bgColor: 'bg-warning-soft text-warning border-warning-subtle',
      icon: <AlertTriangle className="w-6 h-6 text-warning" />,
    },
    error: {
      bgColor: 'bg-danger-soft text-danger border-danger-subtle',
      icon: <AlertCircle className="w-6 h-6 text-danger" />,
    },
    success: {
      bgColor: 'bg-success-soft text-success border-success-subtle',
      icon: <CheckCircle2 className="w-6 h-6 text-success" />,
    },
    info: {
      bgColor: 'bg-accent-soft text-accent border-accent-subtle',
      icon: <Info className="w-6 h-6 text-accent" />,
    },
  }[type]

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title={title}
      icon={
        <div
          className={`w-12 h-12 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}
        >
          {config.icon}
        </div>
      }
      footer={
        <Button fullWidth onClick={onClose}>
          {t('landlordCustomersUnderstood')}
        </Button>
      }
    >
      <p className="text-xs text-muted font-medium leading-relaxed text-center">{message}</p>
    </Modal>
  )
}
