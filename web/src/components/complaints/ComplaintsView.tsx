'use client'

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  Plus,
  RefreshCw,
} from 'lucide-react'
import {
  Button,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  SearchInput,
  SelectInput,
  EmptyState,
} from '@/components/ui'
import { DashboardPageHeader } from '@/components/layout'
import { useTranslations } from '@/context/LanguageContext'
import { useAuth } from '@/context/AuthContext'
import { grievanceService, GrievancePriority } from '@/services/grievance.service'
import { getMyBoardingHouses } from '@/services/boarding-house.service'
import { ComplaintCard } from './ComplaintCard'
import { ComplaintTable } from './ComplaintTable'
import { ComplaintDetailModal } from './ComplaintDetailModal'
import { ComplaintCreateModal } from './ComplaintCreateModal'
import { ComplaintResolveModal } from './ComplaintResolveModal'
import { ComplaintLightboxModal } from './ComplaintLightboxModal'
import { ComplaintItem, ComplaintsViewProps } from './types'

export function ComplaintsView({ role, defaultHouseId }: ComplaintsViewProps) {
  const t = useTranslations('tenantPortal')
  const { activeTenancyId, activeTenancy } = useAuth()

  const [loading, setLoading] = useState(true)
  const [complaints, setComplaints] = useState<ComplaintItem[]>([])
  const [houses, setHouses] = useState<{ id: string; name: string }[]>([])
  const [selectedHouseId, setSelectedHouseId] = useState<string>(defaultHouseId || 'all')

  // View Mode: Grid (default, Rule #9) vs Table
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')

  // Filter and search state
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState<number>(6)

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<ComplaintItem | null>(null)
  const [resolveItem, setResolveItem] = useState<ComplaintItem | null>(null)
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null)

  // 1. Fetch houses for landlord/staff filter
  useEffect(() => {
    if (role === 'landlord') {
      getMyBoardingHouses({ silent: true })
        .then(list => {
          if (Array.isArray(list)) {
            setHouses(list.map(h => ({ id: h.id, name: h.name })))
          }
        })
        .catch(() => {})
    }
  }, [role])

  // 2. Fetch complaints according to role
  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      if (role === 'tenant') {
        const data = await grievanceService.getTenantGrievances()
        const mapped: ComplaintItem[] = (data || []).map(g => ({
          ...g,
          images: g.images || [],
        }))
        setComplaints(mapped)
      } else if (role === 'landlord') {
        const res = await grievanceService.getLandlordGrievances({
          boardingHouseId: selectedHouseId !== 'all' ? selectedHouseId : undefined,
          limit: 100,
        })
        const mapped: ComplaintItem[] = (res.items || []).map(g => ({
          ...g,
          images: g.images || [],
        }))
        setComplaints(mapped)
      } else {
        const res = await grievanceService.getStaffGrievances({
          boardingHouseId: selectedHouseId !== 'all' ? selectedHouseId : undefined,
          limit: 100,
        })
        const mapped: ComplaintItem[] = (res.items || []).map(g => ({
          ...g,
          images: g.images || [],
        }))
        setComplaints(mapped)
      }
    } catch (err: unknown) {
      console.warn('Could not load complaints from backend:', err)
      setComplaints([])
    } finally {
      setLoading(false)
    }
  }, [role, selectedHouseId])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Handle submit new grievance (tenant)
  const handleCreateSubmit = async (data: {
    title: string
    description: string
    priority: GrievancePriority
    imageUrls: string[]
  }) => {
    const created = await grievanceService.createGrievance({
      type: 'complaint',
      title: data.title,
      description: data.description,
      priority: data.priority,
      imageUrls: data.imageUrls,
      contractId: activeTenancyId || undefined,
      roomId: activeTenancy?.roomId || undefined,
    })

    const newItem: ComplaintItem = {
      ...created,
      images: created.images || [],
    }

    setComplaints(prev => [newItem, ...prev])
  }

  // Handle grievance resolved
  const handleItemResolved = (updated: ComplaintItem) => {
    setComplaints(prev =>
      prev.map(item => (item.id === updated.id ? { ...item, ...updated } : item)),
    )
    if (selectedItem?.id === updated.id) {
      setSelectedItem(prev => (prev ? { ...prev, ...updated } : null))
    }
  }

  // Filtering & Pagination
  const filteredComplaints = useMemo(() => {
    const q = searchQuery.toLowerCase().trim()
    return complaints.filter(item => {
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        (item.tenantName && item.tenantName.toLowerCase().includes(q)) ||
        (item.roomNumber && item.roomNumber.toLowerCase().includes(q)) ||
        (item.boardingHouseName && item.boardingHouseName.toLowerCase().includes(q))

      const statusStr = String(item.status)
      const matchStatus =
        statusFilter === 'all' ||
        (statusFilter === 'resolved' && (statusStr === 'resolved' || statusStr === 'closed')) ||
        (statusFilter === 'in_progress' &&
          (statusStr === 'in_progress' || statusStr === 'investigating')) ||
        (statusFilter === 'pending' && statusStr === 'pending')

      const matchHouse =
        selectedHouseId === 'all' ||
        !item.boardingHouseId ||
        item.boardingHouseId === selectedHouseId

      return matchSearch && matchStatus && matchHouse
    })
  }, [complaints, searchQuery, statusFilter, selectedHouseId])

  const paginatedComplaints = useMemo(() => {
    return filteredComplaints.slice((currentPage - 1) * pageSize, currentPage * pageSize)
  }, [filteredComplaints, currentPage, pageSize])

  // Page header strings based on role
  const getHeaderInfo = () => {
    if (role === 'tenant') {
      return {
        title: t('tenantComplaintsTitle'),
        description: t('tenantComplaintsSubtitle'),
      }
    }
    if (role === 'landlord') {
      return {
        title: t('landlordComplaintsTitle'),
        description: t('landlordComplaintsSubtitle'),
      }
    }
    return {
      title: t('staffComplaintsTitle'),
      description: t('staffComplaintsSubtitle'),
    }
  }

  const header = getHeaderInfo()

  return (
    <div className="flex flex-col gap-6 sm:gap-8 pb-12 animate-in fade-in duration-300 max-w-7xl mx-auto px-1 sm:px-0">
      {/* Top Header */}
      <DashboardPageHeader
        title={header.title}
        description={header.description}
        actions={
          <div className="flex items-center gap-2">
            <Button
              size="md"
              variant="secondary"
              leftIcon={<RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />}
              onClick={loadData}
              title="Làm mới"
            />
            {role === 'tenant' && (
              <Button
                size="md"
                onClick={() => setIsCreateOpen(true)}
                leftIcon={<Plus />}
                className="sm:text-sm shrink-0"
              >
                {t('tenantBtnNewComplaint')}
              </Button>
            )}
          </div>
        }
      />

      {/* Standardized Filter Toolbar */}
      <FilterToolbar
        search={
          <SearchInput
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            placeholder={t('tenantSearchGrievancePlaceholder')}
          />
        }
        filters={
          <div className="flex items-center gap-2 flex-wrap">
            {/* Boarding House Filter for Landlord */}
            {role === 'landlord' && houses.length > 0 && (
              <div className="w-48 shrink-0">
                <SelectInput
                  value={selectedHouseId}
                  onChange={e => {
                    setSelectedHouseId(e.target.value)
                    setCurrentPage(1)
                  }}
                  options={[
                    { value: 'all', label: t('complaintHouseFilterLabel') },
                    ...houses.map(h => ({ value: h.id, label: h.name })),
                  ]}
                  containerClassName="space-y-0"
                  className="py-1.5 text-xs"
                />
              </div>
            )}

            {/* Status tab pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar p-1 bg-card-hover/80 rounded-2xl">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'ghost'}
                onClick={() => {
                  setStatusFilter('all')
                  setCurrentPage(1)
                }}
                className="shrink-0"
              >
                <span>{t('tenantTabAllIssues')}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface text-foreground/90">
                  {complaints.length}
                </span>
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'primary' : 'ghost'}
                onClick={() => {
                  setStatusFilter('pending')
                  setCurrentPage(1)
                }}
                className="shrink-0"
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('tenantStatusUnresponded')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface text-foreground/90">
                  {complaints.filter(c => c.status === 'pending').length}
                </span>
              </Button>
              <Button
                variant={statusFilter === 'in_progress' ? 'primary' : 'ghost'}
                onClick={() => {
                  setStatusFilter('in_progress')
                  setCurrentPage(1)
                }}
                className="shrink-0"
              >
                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{t('tenantStatusProcessing')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface text-foreground/90">
                  {
                    complaints.filter(
                      c => c.status === 'in_progress' || (c.status as string) === 'investigating',
                    ).length
                  }
                </span>
              </Button>
              <Button
                variant={statusFilter === 'resolved' ? 'primary' : 'ghost'}
                onClick={() => {
                  setStatusFilter('resolved')
                  setCurrentPage(1)
                }}
                className="shrink-0"
              >
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{t('tenantStatusResponded')}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-surface text-foreground/90">
                  {
                    complaints.filter(
                      c => c.status === 'resolved' || (c.status as string) === 'closed',
                    ).length
                  }
                </span>
              </Button>
            </div>
          </div>
        }
        viewMode={
          <ViewModeToggle
            value={viewMode}
            onChange={val => {
              setViewMode(val)
              setPageSize(val === 'grid' ? 6 : 10)
              setCurrentPage(1)
            }}
          />
        }
      />

      {/* Content: Grid or Table */}
      {viewMode === 'grid' ? (
        /* Grid View (Rule #9 Default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {paginatedComplaints.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<AlertCircle className="w-8 h-8" />}
                title={t('tenantNoGrievancesFound')}
                description={header.description}
                action={
                  role === 'tenant' ? (
                    <Button onClick={() => setIsCreateOpen(true)} leftIcon={<Plus />}>
                      {t('tenantBtnNewComplaint')}
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            paginatedComplaints.map(item => (
              <ComplaintCard
                key={item.id}
                item={item}
                role={role}
                onSelect={setSelectedItem}
              />
            ))
          )}
        </div>
      ) : (
        /* Table View */
        <ComplaintTable
          items={paginatedComplaints}
          role={role}
          onSelect={setSelectedItem}
        />
      )}

      {/* Standard Pagination Bar (Rule #9) */}
      <Pagination
        currentPage={currentPage}
        totalItems={filteredComplaints.length}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
      />

      {/* Modal 1: Create New Grievance Modal (Tenant only) */}
      {role === 'tenant' && (
        <ComplaintCreateModal
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onSubmit={handleCreateSubmit}
        />
      )}

      {/* Modal 2: View Grievance Detail Modal */}
      <ComplaintDetailModal
        isOpen={Boolean(selectedItem)}
        item={selectedItem}
        role={role}
        onClose={() => setSelectedItem(null)}
        onPreviewImage={setPreviewImageUrl}
        onOpenResolve={() => {
          if (selectedItem) {
            setResolveItem(selectedItem)
          }
        }}
      />

      {/* Modal 3: Resolve Grievance Modal (Landlord & Staff) */}
      {role !== 'tenant' && (
        <ComplaintResolveModal
          isOpen={Boolean(resolveItem)}
          item={resolveItem}
          role={role}
          onClose={() => setResolveItem(null)}
          onResolved={handleItemResolved}
        />
      )}

      {/* Modal 4: Image Lightbox Modal */}
      <ComplaintLightboxModal
        imageUrl={previewImageUrl}
        onClose={() => setPreviewImageUrl(null)}
      />
    </div>
  )
}
