'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Users,
  Plus,
  UserCheck,
  Phone,
  Mail,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Briefcase,
  Copy,
  Check,
  AlertTriangle,
  Info,
  Power,
  Edit3,
  Trash2,
  FileText,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useToast } from '@/context/ToastContext'
import {
  Button,
  TextInput,
  SelectInput,
  SearchInput,
  Avatar,
  Pagination,
  ViewModeToggle,
  FilterToolbar,
  TableRow,
  Card,
  Text,
  Chip,
  Modal,
  EmptyState,
} from '@/components/ui'
import { cn } from '@/lib/utils'
import { DashboardPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'
import { staffService, StaffItem, JobPosition, StaffSummary } from '@/services/staff.service'

export default function StaffPage() {
  const { activeBuilding } = useAuth()
  const buildingId = activeBuilding?.id || ''
  const t = useTranslations('landlord')
  const { toast } = useToast()

  const formatDate = (dateStr?: string | Date | null) => {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('vi-VN')
  }

  // Data states
  const [staffList, setStaffList] = useState<StaffItem[]>([])
  const [positions, setPositions] = useState<JobPosition[]>([])
  const [summary, setSummary] = useState<StaffSummary>({
    totalStaff: 0,
    activeStaff: 0,
    inactiveStaff: 0,
    positionsCount: 0,
  })

  // UI / Filter states
  const [isLoading, setIsLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [positionFilter, setPositionFilter] = useState<string>('all')

  // Rule #9: Standardized View & Pagination (Grid default = 6, Table = 10)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [pageSize, setPageSize] = useState<number>(6)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [totalItems, setTotalItems] = useState<number>(0)

  // Modal states
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)
  const [isAssignRoleModalOpen, setIsAssignRoleModalOpen] = useState(false)
  const [isPositionsModalOpen, setIsPositionsModalOpen] = useState(false)
  const [selectedStaff, setSelectedStaff] = useState<StaffItem | null>(null)
  const [isConfirmCloseOpen, setIsConfirmCloseOpen] = useState(false)
  const [pendingCloseTarget, setPendingCloseTarget] = useState<
    'onboard' | 'assignRole' | 'positions' | null
  >(null)
  const [actionConfirm, setActionConfirm] = useState<{
    title: string
    message: string
    onConfirm: () => void
  } | null>(null)

  const [credentialModal, setCredentialModal] = useState<{
    isOpen: boolean
    name: string
    phone: string
    password?: string
  }>({
    isOpen: false,
    name: '',
    phone: '',
  })

  // Form states for Onboarding
  const [formDirty, setFormDirty] = useState(false)
  const [lookupPhone, setLookupPhone] = useState('')
  const [isSearchingUser, setIsSearchingUser] = useState(false)
  const [foundUser, setFoundUser] = useState<{
    id: string
    fullName: string
    phoneNumber: string
    email?: string | null
    avatarUrl?: string | null
    role: string
    isAlreadyStaffAtThisHouse?: boolean
  } | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  // Form input fields for Onboarding
  const [fullNameInput, setFullNameInput] = useState('')
  const [selectedPositionId, setSelectedPositionId] = useState('')
  const [isCreatingNewPosition, setIsCreatingNewPosition] = useState(false)
  const [newPositionName, setNewPositionName] = useState('')
  const [newPositionDesc, setNewPositionDesc] = useState('')
  const [joinedAtInput, setJoinedAtInput] = useState(new Date().toISOString().split('T')[0])
  const [noteInput, setNoteInput] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [copiedPassword, setCopiedPassword] = useState(false)

  // Form states for Assign Role ( Step 3)
  const [assignTargetPositionId, setAssignTargetPositionId] = useState('')
  const [isAssignCreatingNew, setIsAssignCreatingNew] = useState(false)
  const [assignNewPosName, setAssignNewPosName] = useState('')
  const [assignNewPosDesc, setAssignNewPosDesc] = useState('')
  const [isAssignSubmitting, setIsAssignSubmitting] = useState(false)
  const [assignError, setAssignError] = useState('')

  // Position Management state (CRUD)
  const [editingPosition, setEditingPosition] = useState<JobPosition | null>(null)
  const [posFormName, setPosFormName] = useState('')
  const [posFormDesc, setPosFormDesc] = useState('')
  const [posErrorMessage, setPosErrorMessage] = useState('')
  const [isPosSubmitting, setIsPosSubmitting] = useState(false)
  const [isAddingPositionInline, setIsAddingPositionInline] = useState(false)

  // Load staff list & positions
  const fetchStaffData = useCallback(async () => {
    if (!buildingId) return
    setIsLoading(true)
    try {
      const [staffRes, posRes] = await Promise.all([
        staffService.getStaffList(buildingId, {
          page: currentPage,
          limit: pageSize,
          search: searchQuery.trim() || undefined,
          status: statusFilter === 'all' ? undefined : statusFilter,
          positionId: positionFilter === 'all' ? undefined : positionFilter,
        }),
        staffService.getPositions(buildingId),
      ])

      if (staffRes?.success) {
        setStaffList(staffRes.data || [])
        setSummary(
          staffRes.summary || {
            totalStaff: 0,
            activeStaff: 0,
            inactiveStaff: 0,
            positionsCount: 0,
          },
        )
        setTotalItems(staffRes.meta?.total || 0)
      }

      const posList = Array.isArray(posRes) ? posRes : (posRes as any)?.data || []
      setPositions(posList)
      if (posList.length > 0 && !selectedPositionId) {
        setSelectedPositionId(posList[0].id)
      }
    } catch (err: any) {
      console.error('Failed to fetch staff data:', err)
    } finally {
      setIsLoading(false)
    }
  }, [
    buildingId,
    currentPage,
    pageSize,
    searchQuery,
    statusFilter,
    positionFilter,
    selectedPositionId,
  ])

  useEffect(() => {
    fetchStaffData()
  }, [fetchStaffData])

  // Handle phone lookup debounce or manual trigger
  const handleSearchPhone = async (phone: string) => {
    const clean = phone.trim()
    if (!clean || clean.length < 9) {
      setFoundUser(null)
      setHasSearched(false)
      return
    }

    setIsSearchingUser(true)
    setErrorMessage('')
    try {
      const res = await staffService.searchUser(buildingId, clean)
      if (res?.found && res.user) {
        setFoundUser(res.user)
        setFullNameInput(res.user.fullName)
      } else {
        setFoundUser(null)
      }
      setHasSearched(true)
    } catch (err: any) {
      console.error('User search failed:', err)
    } finally {
      setIsSearchingUser(false)
    }
  }

  // Modal reset logic (Rule #10)
  const resetOnboardForm = () => {
    setFormDirty(false)
    setLookupPhone('')
    setFoundUser(null)
    setHasSearched(false)
    setFullNameInput('')
    setIsCreatingNewPosition(false)
    setNewPositionName('')
    setNewPositionDesc('')
    setJoinedAtInput(new Date().toISOString().split('T')[0])
    setNoteInput('')
    setErrorMessage('')
    if (positions.length > 0) {
      setSelectedPositionId(positions[0].id)
    }
  }

  const handleAttemptCloseModal = (target: 'onboard' | 'assignRole' | 'positions') => {
    if (formDirty) {
      setPendingCloseTarget(target)
      setIsConfirmCloseOpen(true)
    } else {
      if (target === 'onboard') {
        setIsOnboardModalOpen(false)
        resetOnboardForm()
      } else if (target === 'assignRole') {
        setIsAssignRoleModalOpen(false)
        setAssignError('')
      } else if (target === 'positions') {
        setIsPositionsModalOpen(false)
        setEditingPosition(null)
        setIsAddingPositionInline(false)
      }
    }
  }

  const handleConfirmClose = () => {
    setIsConfirmCloseOpen(false)
    if (pendingCloseTarget === 'onboard') {
      setIsOnboardModalOpen(false)
      resetOnboardForm()
    } else if (pendingCloseTarget === 'assignRole') {
      setIsAssignRoleModalOpen(false)
      setAssignError('')
    } else if (pendingCloseTarget === 'positions') {
      setIsPositionsModalOpen(false)
      setEditingPosition(null)
      setIsAddingPositionInline(false)
    }
    setPendingCloseTarget(null)
    setFormDirty(false)
  }

  // Submit Onboard Staff
  const handleSubmitOnboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!buildingId) {
      setErrorMessage(t('landlordStaffAlertMissingBuilding'))
      return
    }

    const cleanPhone = lookupPhone.trim()
    if (!cleanPhone) {
      setErrorMessage(t('landlordStaffAlertMissingPhone'))
      return
    }

    if (!foundUser && !fullNameInput.trim()) {
      setErrorMessage(t('landlordStaffAlertMissingFullName'))
      return
    }

    if (foundUser?.isAlreadyStaffAtThisHouse) {
      setErrorMessage(t('landlordStaffAlertAlreadyAssigned'))
      return
    }

    if (isCreatingNewPosition && !newPositionName.trim()) {
      setErrorMessage(t('landlordStaffAlertMissingNewPosName'))
      return
    }

    setIsSubmitting(true)
    setErrorMessage('')

    try {
      const payload: any = {
        phoneNumber: cleanPhone,
        joinedAt: new Date(joinedAtInput).toISOString(),
        note: noteInput.trim() || undefined,
      }

      if (foundUser) {
        payload.fullName = foundUser.fullName
      } else {
        payload.fullName = fullNameInput.trim()
      }

      if (isCreatingNewPosition) {
        payload.newPositionName = newPositionName.trim()
        payload.newPositionDescription = newPositionDesc.trim() || undefined
      } else {
        payload.positionId = selectedPositionId
      }

      const res = await staffService.onboardStaff(buildingId, payload)

      if (res?.success) {
        setIsOnboardModalOpen(false)
        resetOnboardForm()
        await fetchStaffData()

        if (res.isNewUser && res.generatedPassword) {
          setCredentialModal({
            isOpen: true,
            name: res.data.fullName,
            phone: res.data.phoneNumber,
            password: res.generatedPassword,
          })
        }
      }
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || t('landlordStaffAlertOnboardError')
      setErrorMessage(msg)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Assign / Re-assign Role ( Step 3)
  const handleOpenAssignRoleModal = (staff: StaffItem) => {
    setSelectedStaff(staff)
    setAssignTargetPositionId(staff.positionId)
    setIsAssignCreatingNew(false)
    setAssignNewPosName('')
    setAssignNewPosDesc('')
    setAssignError('')
    setFormDirty(false)
    setIsAssignRoleModalOpen(true)
  }

  const handleSaveAssignRole = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedStaff || !buildingId) return

    if (isAssignCreatingNew && !assignNewPosName.trim()) {
      setAssignError(t('landlordStaffAlertMissingNewPosName'))
      return
    }

    setIsAssignSubmitting(true)
    setAssignError('')

    try {
      const payload: any = {}
      if (isAssignCreatingNew) {
        payload.newPositionName = assignNewPosName.trim()
        payload.newPositionDescription = assignNewPosDesc.trim() || undefined
      } else {
        payload.positionId = assignTargetPositionId
      }

      await staffService.assignRole(buildingId, selectedStaff.assignmentId, payload)
      setIsAssignRoleModalOpen(false)
      setFormDirty(false)
      await fetchStaffData()
    } catch (err: any) {
      setAssignError(
        err?.response?.data?.message || err?.message || t('landlordStaffAlertAssignError'),
      )
    } finally {
      setIsAssignSubmitting(false)
    }
  }

  // Toggle Staff Status ( Step 2 & 4)
  const handleToggleStatus = (staff: StaffItem) => {
    const nextStatus = staff.status === 'active' ? 'inactive' : 'active'
    const confirmMsg =
      nextStatus === 'inactive'
        ? t('landlordStaffConfirmDeactivate', { name: staff.fullName })
        : t('landlordStaffConfirmActivate', { name: staff.fullName })

    setActionConfirm({
      title: t('btnConfirm') || 'Xác nhận thay đổi trạng thái',
      message: confirmMsg,
      onConfirm: async () => {
        try {
          await staffService.updateStaffStatus(buildingId, staff.assignmentId, {
            status: nextStatus,
          })
          toast.success(
            nextStatus === 'active'
              ? t('landlordStaffConfirmActivate', { name: staff.fullName })
              : t('landlordStaffConfirmDeactivate', { name: staff.fullName }),
          )
          await fetchStaffData()
        } catch (err: any) {
          toast.error(err?.response?.data?.message || t('landlordStaffAlertUpdateStatusError'))
        }
      },
    })
  }

  // Manage Positions Actions (CRUD)
  const handleSavePosition = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!posFormName.trim()) {
      setPosErrorMessage(t('landlordStaffAlertPosNameRequired'))
      return
    }

    setIsPosSubmitting(true)
    setPosErrorMessage('')
    try {
      if (editingPosition) {
        await staffService.updatePosition(buildingId, editingPosition.id, {
          name: posFormName.trim(),
          description: posFormDesc.trim() || undefined,
        })
        toast.success(t('landlordStaffPositionsBtnSave'))
      } else {
        await staffService.createPosition(buildingId, {
          name: posFormName.trim(),
          description: posFormDesc.trim() || undefined,
        })
        toast.success(t('landlordStaffPositionsBtnSave'))
      }

      setEditingPosition(null)
      setIsAddingPositionInline(false)
      setPosFormName('')
      setPosFormDesc('')
      setFormDirty(false)
      await fetchStaffData()
    } catch (err: any) {
      setPosErrorMessage(
        err?.response?.data?.message || err?.message || t('landlordStaffAlertPosSaveError'),
      )
    } finally {
      setIsPosSubmitting(false)
    }
  }

  const handleDeletePosition = (pos: JobPosition) => {
    setActionConfirm({
      title: t('btnConfirm') || 'Xác nhận xóa vị trí',
      message: t('landlordStaffConfirmDeletePos', { name: pos.name }),
      onConfirm: async () => {
        try {
          await staffService.deletePosition(buildingId, pos.id)
          toast.success(t('landlordStaffPositionsDeleteTooltip'))
          await fetchStaffData()
        } catch (err: any) {
          toast.error(err?.response?.data?.message || t('landlordStaffAlertDeletePosError'))
        }
      },
    })
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedPassword(true)
    setTimeout(() => setCopiedPassword(false), 2500)
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordStaffStatTotal'),
        value: summary.totalStaff,
        icon: <Users className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-muted shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border-white/10 lg:w-[135px]',
        labelColor: 'secondary',
        valueColor: 'white',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'active',
        label: t('landlordStaffStatActive'),
        value: summary.activeStaff,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-primary shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[135px]',
        labelColor: 'brand',
        valueColor: 'brand',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'inactive',
        label: t('landlordStaffStatInactive'),
        value: summary.inactiveStaff,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-zinc-500 shadow-[0_0_8px_rgba(113,113,122,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-zinc-800/80 hover:bg-zinc-800 border-zinc-700 lg:w-[135px]',
        labelColor: 'secondary',
        valueColor: 'secondary',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'positions',
        label: t('landlordStaffStatPositions'),
        value: summary.positionsCount,
        icon: (
          <div className="w-2.5 h-2.5 rounded-full bg-vacant shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
        ),
        containerClassName:
          'px-3.5 py-2.5 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[135px]',
        labelClassName: 'text-blue-400',
        valueClassName: 'text-blue-400 text-base sm:text-lg leading-none mt-1',
      },
    ],
    [t, summary],
  )

  // Pagination calculations (Rule #9)
  const totalPages = Math.ceil(totalItems / pageSize) || 1
  const windowSize = 5
  const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1
  const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
  const visiblePages = Array.from(
    { length: windowEnd - windowStart + 1 },
    (_, i) => windowStart + i,
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-16">
      {/* Top Action Bar */}
      <DashboardPageHeader
        title={t('landlordStaffTitle')}
        subtitle={t('landlordStaffSubtitle')}
        actions={
          <>
            <Button
              variant="secondary"
              size="md"
              onClick={event => {
                setEditingPosition(null)
                setIsAddingPositionInline(false)
                setPosFormName('')
                setPosFormDesc('')
                setPosErrorMessage('')
                setIsPositionsModalOpen(true)
              }}
              leftIcon={<Briefcase className="text-primary" />}
            >
              {t('landlordStaffManagePositions', { count: positions.length })}
            </Button>

            <Button
              variant="primary"
              size="md"
              onClick={() => {
                resetOnboardForm()
                setIsOnboardModalOpen(true)
              }}
              leftIcon={<Plus />}
            >
              {t('landlordStaffAddNew')}
            </Button>
          </>
        }
      />

      {/* Dark Hero Stats Banner */}
      <LandlordStatBanner
        watermarkIcon={<Users className="w-64 h-64" />}
        chips={statChips}
      />

      {/* Filter & Toolbar Bar */}
      <FilterToolbar
        search={
          <SearchInput
            placeholder={t('landlordStaffSearchPlaceholder')}
            value={searchQuery}
            onChange={val => {
              setSearchQuery(val)
              setCurrentPage(1)
            }}
            containerClassName="w-full space-y-0"
          />
        }
        filters={
          <>
            <SelectInput
              value={statusFilter}
              onChange={e => {
                setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')
                setCurrentPage(1)
              }}
              containerClassName="w-full sm:w-auto min-w-[150px] space-y-0"
              options={[
                {
                  value: 'all',
                  label: `${t('landlordStaffTabAll')} (${summary.totalStaff})`,
                },
                {
                  value: 'active',
                  label: `${t('landlordStaffTabActive')} (${summary.activeStaff})`,
                },
                {
                  value: 'inactive',
                  label: `${t('landlordStaffTabInactive')} (${summary.inactiveStaff})`,
                },
              ]}
            />
            <SelectInput
              value={positionFilter}
              onChange={e => {
                setPositionFilter(e.target.value)
                setCurrentPage(1)
              }}
              containerClassName="w-full sm:w-auto min-w-[170px] space-y-0"
              options={[
                { value: 'all', label: t('landlordStaffAllPositions', { count: positions.length }) },
                ...positions.map(pos => ({
                  value: pos.id,
                  label: `${pos.name} ${pos.staffCount ? `(${pos.staffCount})` : ''}`,
                })),
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

      {/* Main Content Area */}
      {isLoading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2 bg-card rounded-3xl border border-line">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-xs text-muted font-medium">{t('landlordStaffLoading')}</p>
        </div>
      ) : staffList.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8" />}
          title={t('landlordStaffEmptyTitle')}
          description={
            searchQuery || statusFilter !== 'all' || positionFilter !== 'all'
              ? t('landlordStaffEmptyFiltered')
              : t('landlordStaffEmptyDesc')
          }
          action={
            <Button
              size="sm"
              onClick={() => {
                resetOnboardForm()
                setIsOnboardModalOpen(true)
              }}
              leftIcon={<Plus className="w-4 h-4" />}
            >
              {t('landlordStaffAddNow')}
            </Button>
          }
        />
      ) : viewMode === 'grid' ? (
        /* GRID VIEW (Rule #9 default) */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {staffList.map(staff => {
            const isActive = staff.status === 'active'
            return (
              <Card
                key={staff.assignmentId}
                className="flex flex-col justify-between space-y-4 group"
                onClick={() => {
                  setSelectedStaff(staff)
                  setIsDetailModalOpen(true)
                }}
              >
                <Card.Header className="px-4 sm:px-5 pt-4 sm:pt-5 pb-0 border-0">
                  {/* Card Header: Avatar, Name & Status */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={staff.avatarUrl}
                        name={staff.fullName}
                        size="lg"
                        shape="rounded"
                        zoomOnHover
                      />
                      <div>
                        <Text
                          as="h3"
                          size="base"
                          weight="extrabold"
                          color="default"
                          clamp={1}
                          className="group-hover:text-primary transition-colors"
                        >
                          {staff.fullName}
                        </Text>
                        <div className="inline-flex items-center gap-1 mt-0.5">
                          <Briefcase className="w-3 h-3 text-primary" />
                          <Text as="span" size="xs" weight="bold" color="brand">
                            {staff.positionName}
                          </Text>
                        </div>
                      </div>
                    </div>

                    <Chip
                      size="sm"
                      preventHover
                      variant={isActive ? 'primary' : 'neutral'}
                    >
                      {isActive
                        ? t('landlordStaffStatusActiveBadge')
                        : t('landlordStaffStatusInactiveBadge')}
                    </Chip>
                  </div>
                </Card.Header>

                <Card.Body className="px-4 sm:px-5 py-0 space-y-4">
                  {/* Details List */}
                  <div className="space-y-2 pt-1 text-xs text-muted border-t border-line">
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-muted shrink-0" />
                      <Text as="span" size="xs" weight="bold" color="default">
                        {staff.phoneNumber}
                      </Text>
                    </div>
                    {staff.email && (
                      <div className="flex items-center gap-2">
                        <Mail className="w-3.5 h-3.5 text-muted shrink-0" />
                        <Text as="span" size="xs" color="secondary" clamp={1}>
                          {staff.email}
                        </Text>
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted shrink-0" />
                      <Text as="span" size="xs" color="secondary">
                        {t('landlordStaffJoinedLabel')}{' '}
                        <Text as="strong" size="xs" weight="bold" color="default">
                          {formatDate(staff.joinedAt)}
                        </Text>
                      </Text>
                    </div>
                    {staff.positionDescription && (
                      <div className="flex items-start gap-2 text-[11px] text-muted bg-surface p-2 rounded-xl">
                        <FileText className="w-3.5 h-3.5 text-muted shrink-0 mt-0.5" />
                        <span className="line-clamp-2 italic">{staff.positionDescription}</span>
                      </div>
                    )}
                    {staff.mustChangePassword && (
                      <div className="flex items-center gap-1.5 text-[11px] text-warning bg-warning-soft px-2 py-1 rounded-lg border border-warning-subtle font-semibold">
                        <AlertCircle className="w-3 h-3 shrink-0" />
                        <span>{t('landlordStaffMustChangePassword')}</span>
                      </div>
                    )}
                  </div>
                </Card.Body>

                {/* Card Footer Actions: Assign Role & Toggle Status */}
                <Card.Footer className="px-4 sm:px-5 pt-3 pb-4 flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={event => {
                        event.stopPropagation()
                        handleOpenAssignRoleModal(staff)
                      }}
                      title={t('landlordStaffBtnAssignRoleTooltip')}
                      leftIcon={<Edit3 />}
                    >
                      {t('landlordStaffBtnAssignRole')}
                    </Button>
                  </div>

                  <Button
                    size="sm"
                    variant={isActive ? 'danger' : 'secondary'}
                    onClick={event => {
                      event.stopPropagation()
                      handleToggleStatus(staff)
                    }}
                    className={cn(
                      'text-xs font-bold',
                      isActive
                        ? 'text-danger bg-danger-soft hover:bg-rose-100/80 border border-danger-subtle'
                        : 'text-primary bg-primary/10 hover:bg-primary/20 border border-primary/30',
                    )}
                    leftIcon={<Power />}
                  >
                    {isActive ? t('landlordStaffBtnDeactivate') : t('landlordStaffBtnActivate')}
                  </Button>
                </Card.Footer>
              </Card>
            )
          })}
        </div>
      ) : (
        /* TABLE VIEW (Rule #9 parallel table) */
        <div className="bg-card border border-line rounded-3xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-surface/80 text-muted uppercase font-bold border-b border-line">
                <tr>
                  <th className="px-6 py-3.5">{t('landlordStaffThStaff')}</th>
                  <th className="px-6 py-3.5">{t('landlordStaffThRole')}</th>
                  <th className="px-6 py-3.5">{t('landlordStaffThPhone')}</th>
                  <th className="px-6 py-3.5">{t('landlordStaffThJoined')}</th>
                  <th className="px-6 py-3.5">{t('landlordStaffThStatus')}</th>
                  <th className="px-6 py-3.5 text-right">{t('landlordStaffThActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {staffList.map(staff => {
                  const isActive = staff.status === 'active'
                  return (
                    <TableRow
                      key={staff.assignmentId}
                      className="group"
                      onClick={() => {
                        setSelectedStaff(staff)
                        setIsDetailModalOpen(true)
                      }}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar
                            src={staff.avatarUrl}
                            name={staff.fullName}
                            size="sm"
                            shape="rounded"
                          />
                          <div>
                            <Text as="div" size="sm" weight="extrabold" color="default">
                              {staff.fullName}
                            </Text>
                            <Text as="div" size="2xs" color="secondary">
                              {staff.email || t('landlordStaffNoEmail')}
                            </Text>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Text as="span" size="xs" weight="bold" color="default">
                            {staff.positionName}
                          </Text>
                          {staff.positionDescription && (
                            <Text as="p" size="2xs" color="secondary" clamp={1} className="italic">
                              {staff.positionDescription}
                            </Text>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text as="span" size="xs" weight="bold" color="default">
                          {staff.phoneNumber}
                        </Text>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Text as="span" size="xs" color="secondary">
                          {formatDate(staff.joinedAt)}
                        </Text>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Chip
                          size="sm"
                          preventHover
                          variant={isActive ? 'primary' : 'neutral'}
                        >
                          {isActive
                            ? t('landlordStaffTableStatusActive')
                            : t('landlordStaffTableStatusInactive')}
                        </Chip>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleOpenAssignRoleModal(staff)}
                            title={t('landlordStaffBtnAssignRoleTooltip')}
                          >
                            {t('landlordStaffBtnAssignRole')}
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleToggleStatus(staff)}
                            className={cn(
                              'p-1.5 h-auto rounded-lg border',
                              isActive
                                ? 'text-danger bg-danger-soft border-danger-subtle hover:bg-rose-100'
                                : 'text-primary bg-primary/10 border-primary/30 hover:bg-primary/20',
                            )}
                            title={
                              isActive
                                ? t('landlordStaffTooltipDeactivate')
                                : t('landlordStaffTooltipActivate')
                            }
                          >
                            <Power className="w-3.5 h-3.5" />
                          </Button>
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

      {/* Standardized Dormio Pagination Footer (Rule #9) */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
        onPageSizeChange={setPageSize}
        pageSizeMax={100}
        unitLabel={t('landlordStaffPaginationTotal', { total: '' }).trim()}
      />

      {/* ========================================================================= */}
      {/* MODAL: ONBOARD STAFF */}
      {/* ========================================================================= */}
      {isOnboardModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('onboard')
          }}
        >
          <div
            className="bg-card rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line flex flex-col max-h-[92vh]"
            onInput={() => setFormDirty(true)}
            onChange={() => setFormDirty(true)}
          >
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">
                    {t('landlordStaffOnboardTitle')}
                  </h3>
                  <p className="text-[11px] text-muted font-semibold">
                    {t('landlordStaffOnboardSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => handleAttemptCloseModal('onboard')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSubmitOnboard} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
                {errorMessage && (
                  <div className="p-3 bg-danger-soft border border-danger-subtle rounded-2xl flex items-start gap-2.5 text-xs text-danger font-semibold">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-danger" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Phone lookup */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-foreground/90 flex items-center gap-1">
                    <span>{t('landlordStaffOnboardPhoneLabel')}</span>
                    <span className="text-danger">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <TextInput
                        type="tel"
                        required
                        placeholder={t('landlordStaffOnboardPhonePlaceholder')}
                        value={lookupPhone}
                        onChange={e => {
                          setLookupPhone(e.target.value)
                          setFormDirty(true)
                          if (hasSearched) setHasSearched(false)
                        }}
                        onBlur={() => handleSearchPhone(lookupPhone)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleSearchPhone(lookupPhone)
                          }
                        }}
                        leftIcon={<Phone className="w-4 h-4 text-muted" />}
                      />
                    </div>
                    <Button variant="dark"
                      type="button"
                      onClick={() => handleSearchPhone(lookupPhone)}
                      disabled={isSearchingUser || !lookupPhone.trim()}
                      isLoading={isSearchingUser}
                      className="shrink-0"
                    >
                      {t('landlordStaffOnboardBtnCheck')}
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted">{t('landlordStaffOnboardPhoneHelp')}</p>
                </div>

                {/* Found user */}
                {hasSearched && foundUser && (
                  <div className="p-4 rounded-2xl bg-success-soft border border-success-subtle space-y-2.5">
                    <div className="flex items-center gap-2 text-success text-xs font-extrabold">
                      <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                      <span>{t('landlordStaffOnboardAccountFound')}</span>
                    </div>

                    <div className="flex items-center gap-3 bg-card p-3 rounded-xl border border-success-subtle">
                      <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center font-black text-sm">
                        {foundUser.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-extrabold text-foreground text-xs truncate">
                          {foundUser.fullName}
                        </div>
                        <div className="text-[11px] text-muted">
                          {foundUser.phoneNumber} {foundUser.email ? `• ${foundUser.email}` : ''}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded-md bg-card-hover text-muted uppercase">
                        {foundUser.role}
                      </span>
                    </div>

                    {foundUser.isAlreadyStaffAtThisHouse && (
                      <div className="p-2 bg-warning-soft border border-amber-300 rounded-xl text-[11px] text-warning font-bold flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-warning shrink-0" />
                        <span>{t('landlordStaffOnboardAlreadyAssigned')}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* New user prompt */}
                {hasSearched && !foundUser && (
                  <div className="p-4 rounded-2xl bg-accent-soft border border-accent-subtle space-y-3">
                    <div className="flex items-center gap-2 text-accent text-xs font-extrabold">
                      <Info className="w-4 h-4 text-accent shrink-0" />
                      <span>{t('landlordStaffOnboardNewAccountTitle')}</span>
                    </div>

                    <TextInput
                      label={t('landlordStaffOnboardFullNameLabel')}
                      required
                      placeholder={t('landlordStaffOnboardFullNamePlaceholder')}
                      value={fullNameInput}
                      onChange={e => {
                        setFullNameInput(e.target.value)
                        setFormDirty(true)
                      }}
                    />

                    <div className="p-2.5 bg-card/80 rounded-xl border border-accent-subtle text-[11px] text-muted leading-relaxed space-y-1">
                      <p className="font-bold text-accent">
                        {t('landlordStaffOnboardSecurityPolicyTitle')}
                      </p>
                      <p>{t('landlordStaffOnboardSecurityPolicyDesc')}</p>
                    </div>
                  </div>
                )}

                {/* Job Position selection */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground/90 flex items-center gap-1">
                      <span>{t('landlordStaffOnboardPositionLabel')}</span>
                      <span className="text-danger">*</span>
                    </label>
                    <Button
                      variant="ghost"
                      size="sm"
                      type="button"
                      onClick={() => setIsCreatingNewPosition(!isCreatingNewPosition)}
                      className="hover:underline"
                    >
                      {isCreatingNewPosition
                        ? t('landlordStaffOnboardSelectExistingPos')
                        : t('landlordStaffOnboardCreateNewPos')}
                    </Button>
                  </div>

                  {!isCreatingNewPosition ? (
                    <SelectInput
                      value={selectedPositionId}
                      onChange={e => {
                        setSelectedPositionId(e.target.value)
                        setFormDirty(true)
                      }}
                      options={positions.map(pos => ({
                        value: pos.id,
                        label: `${pos.name} ${pos.description ? `— ${pos.description}` : ''}`,
                      }))}
                    />
                  ) : (
                    <div className="space-y-2 p-3 bg-surface rounded-2xl border border-line">
                      <TextInput
                        label={t('landlordStaffOnboardNewPosNameLabel')}
                        labelClassName="text-[11px] font-bold text-muted"
                        required={isCreatingNewPosition}
                        placeholder={t('landlordStaffOnboardNewPosNamePlaceholder')}
                        value={newPositionName}
                        onChange={e => {
                          setNewPositionName(e.target.value)
                          setFormDirty(true)
                        }}
                      />
                      <TextInput
                        label={t('landlordStaffOnboardNewPosDescLabel')}
                        labelClassName="text-[11px] font-bold text-muted"
                        placeholder={t('landlordStaffOnboardNewPosDescPlaceholder')}
                        value={newPositionDesc}
                        onChange={e => {
                          setNewPositionDesc(e.target.value)
                          setFormDirty(true)
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Start Date & Notes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <TextInput
                    type="date"
                    label={t('landlordStaffOnboardStartDateLabel')}
                    labelClassName="text-xs font-bold text-foreground/90"
                    value={joinedAtInput}
                    onChange={e => {
                      setJoinedAtInput(e.target.value)
                      setFormDirty(true)
                    }}
                  />

                  <TextInput
                    label={t('landlordStaffOnboardNoteLabel')}
                    labelClassName="text-xs font-bold text-foreground/90"
                    placeholder={t('landlordStaffOnboardNotePlaceholder')}
                    value={noteInput}
                    onChange={e => {
                      setNoteInput(e.target.value)
                      setFormDirty(true)
                    }}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="px-6 py-4 border-t border-line flex items-center justify-end gap-3 bg-surface/60">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => handleAttemptCloseModal('onboard')}
                >
                  {t('landlordStaffOnboardBtnCancel')}
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || (foundUser?.isAlreadyStaffAtThisHouse ?? false)}
                  isLoading={isSubmitting}
                >
                  {t('landlordStaffOnboardBtnSave')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ASSIGN / RE-ASSIGN ROLE ( Step 3) */}
      {/* ========================================================================= */}
      {isAssignRoleModalOpen && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('assignRole')
          }}
        >
          <div
            className="bg-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line flex flex-col max-h-[90vh]"
            onInput={() => setFormDirty(true)}
            onChange={() => setFormDirty(true)}
          >
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">
                    {t('landlordStaffAssignTitle')}
                  </h3>
                  <p className="text-[11px] text-muted font-semibold">
                    {t('landlordStaffAssignSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAttemptCloseModal('assignRole')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <form onSubmit={handleSaveAssignRole} className="p-6 space-y-4">
              {assignError && (
                <div className="p-3 bg-danger-soft border border-danger-subtle rounded-2xl text-xs text-danger font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                  <span>{assignError}</span>
                </div>
              )}

              {/* Staff Member Card Header */}
              <div className="flex items-center gap-3 p-3 bg-surface rounded-2xl border border-line">
                <Avatar
                  src={selectedStaff.avatarUrl}
                  name={selectedStaff.fullName}
                  size="md"
                  shape="rounded"
                />
                <div className="flex-1">
                  <h4 className="text-xs font-extrabold text-foreground">{selectedStaff.fullName}</h4>
                  <p className="text-[11px] text-muted">
                    {t('landlordStaffAssignCurrentLabel', { phone: selectedStaff.phoneNumber })}{' '}
                    <strong className="text-primary">{selectedStaff.positionName}</strong>
                  </p>
                </div>
              </div>

              {/* Role Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-foreground/90">
                    {t('landlordStaffAssignSelectRoleLabel')}{' '}
                    <span className="text-danger">*</span>
                  </label>
                  <Button size="xs"
                    type="button"
                    variant="ghost"
                    onClick={() => setIsAssignCreatingNew(!isAssignCreatingNew)}
                    className="hover:underline"
                  >
                    {isAssignCreatingNew
                      ? t('landlordStaffOnboardSelectExistingPos')
                      : t('landlordStaffOnboardCreateNewPos')}
                  </Button>
                </div>

                {!isAssignCreatingNew ? (
                  <SelectInput
                    value={assignTargetPositionId}
                    onChange={e => {
                      setAssignTargetPositionId(e.target.value)
                      setFormDirty(true)
                    }}
                    options={positions.map(pos => ({
                      value: pos.id,
                      label: `${pos.name}${pos.description ? ` — ${pos.description}` : ''}`,
                    }))}
                  />
                ) : (
                  <div className="space-y-2 p-3 bg-surface rounded-2xl border border-line">
                    <div>
                      <TextInput
                        label={t('landlordStaffOnboardNewPosNameLabel')}
                        required
                        placeholder={t('landlordStaffOnboardNewPosNamePlaceholder')}
                        value={assignNewPosName}
                        onChange={e => {
                          setAssignNewPosName(e.target.value)
                          setFormDirty(true)
                        }}
                      />
                    </div>
                    <div>
                      <TextInput
                        label={t('landlordStaffOnboardNewPosDescLabel')}
                        placeholder={t('landlordStaffOnboardNewPosDescPlaceholder')}
                        value={assignNewPosDesc}
                        onChange={e => {
                          setAssignNewPosDesc(e.target.value)
                          setFormDirty(true)
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Selected Position Duty Description Preview */}
              {!isAssignCreatingNew && (
                <div className="p-3 bg-info-soft rounded-xl border border-info-subtle text-xs text-info space-y-1">
                  <span className="font-bold block text-[11px] uppercase tracking-wider text-info">
                    {t('landlordStaffAssignDutiesTitle')}
                  </span>
                  <p className="italic text-foreground/90">
                    {positions.find(p => p.id === assignTargetPositionId)?.description ||
                      t('landlordStaffAssignNoDuties')}
                  </p>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-line">
                <Button size="xs"
                  type="button"
                  variant="outline"
                  onClick={() => handleAttemptCloseModal('assignRole')}
                >
                  {t('landlordStaffAssignBtnCancel')}
                </Button>
                <Button size="xs"
                  type="submit"
                  disabled={isAssignSubmitting}
                >
                  {isAssignSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{t('landlordStaffAssignBtnUpdating')}</span>
                    </>
                  ) : (
                    <span>{t('landlordStaffAssignBtnConfirm')}</span>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: MANAGE JOB POSITIONS (CRUD) */}
      {/* ========================================================================= */}
      {isPositionsModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleAttemptCloseModal('positions')
          }}
        >
          <div
            className="bg-card rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line flex flex-col max-h-[90vh]"
            onInput={() => setFormDirty(true)}
            onChange={() => setFormDirty(true)}
          >
            <div className="px-6 py-4 border-b border-line flex items-center justify-between bg-surface/80">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-primary/10 text-primary rounded-xl">
                  <Briefcase className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">
                    {t('landlordStaffPositionsTitle')}
                  </h3>
                  <p className="text-[11px] text-muted font-semibold">
                    {t('landlordStaffPositionsSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleAttemptCloseModal('positions')}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1 custom-scrollbar">
              {posErrorMessage && (
                <div className="p-3 bg-danger-soft border border-danger-subtle rounded-2xl text-xs text-danger font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-danger" />
                  <span>{posErrorMessage}</span>
                </div>
              )}

              {/* Inline Form to Add / Edit Position */}
              {(isAddingPositionInline || editingPosition) && (
                <form
                  onSubmit={handleSavePosition}
                  className="p-4 bg-surface border border-line rounded-2xl space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-foreground">
                      {editingPosition
                        ? t('landlordStaffPositionsEditTitle')
                        : t('landlordStaffPositionsAddTitle')}
                    </h4>
                    <Button size="xs"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setEditingPosition(null)
                        setIsAddingPositionInline(false)
                      }}
                    >
                      {t('landlordStaffPositionsBtnCloseForm')}
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextInput
                      label={t('landlordStaffPositionsNameLabel')}
                      required
                      placeholder={t('landlordStaffPositionsNamePlaceholder')}
                      value={posFormName}
                      onChange={e => {
                        setPosFormName(e.target.value)
                        setFormDirty(true)
                      }}
                    />
                    <TextInput
                      label={t('landlordStaffPositionsDescLabel')}
                      placeholder={t('landlordStaffPositionsDescPlaceholder')}
                      value={posFormDesc}
                      onChange={e => {
                        setPosFormDesc(e.target.value)
                        setFormDirty(true)
                      }}
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingPosition(null)
                        setIsAddingPositionInline(false)
                      }}
                    >
                      {t('landlordStaffPositionsBtnCancel')}
                    </Button>
                    <Button
                      type="submit"
                      disabled={isPosSubmitting}
                      size="sm"
                    >
                      {isPosSubmitting
                        ? t('landlordStaffPositionsBtnSaving')
                        : t('landlordStaffPositionsBtnSave')}
                    </Button>
                  </div>
                </form>
              )}

              {/* Positions List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-foreground/90 uppercase tracking-wider">
                    {t('landlordStaffPositionsListTitle', { count: positions.length })}
                  </span>
                  {!isAddingPositionInline && !editingPosition && (
                    <Button size="icon"
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingPositionInline(true)
                        setEditingPosition(null)
                        setPosFormName('')
                        setPosFormDesc('')
                      }}
                      className="hover:underline"
                    >
                      <Plus className="w-3.5 h-3.5" /> {t('landlordStaffPositionsBtnAddNew')}
                    </Button>
                  )}
                </div>

                <div className="divide-y divide-line border border-line rounded-2xl overflow-hidden bg-card">
                  {positions.map(pos => (
                    <div
                      key={pos.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-zinc-50/80 transition-colors"
                    >
                      <div className="space-y-0.5 max-w-md">
                        <div className="flex items-center gap-2">
                          <span className="font-extrabold text-foreground text-xs sm:text-sm">
                            {pos.name}
                          </span>
                          <span className="px-2 py-0.5 bg-card-hover text-muted rounded-full text-[10px] font-bold">
                            {t('landlordStaffPositionsStaffCount', { count: pos.staffCount || 0 })}
                          </span>
                        </div>
                        <p className="text-xs text-muted italic">
                          {pos.description || t('landlordStaffPositionsNoDesc')}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 self-end sm:self-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setEditingPosition(pos)
                            setIsAddingPositionInline(false)
                            setPosFormName(pos.name)
                            setPosFormDesc(pos.description || '')
                          }}
                          title={t('landlordStaffPositionsEditTooltip')}
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeletePosition(pos)}
                          disabled={(pos.staffCount || 0) > 0}
                          title={
                            (pos.staffCount || 0) > 0
                              ? t('landlordStaffPositionsCannotDeleteTooltip')
                              : t('landlordStaffPositionsDeleteTooltip')
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-line flex items-center justify-end bg-surface/60">
              <Button size="xs"
                type="button"
                variant="outline"
                onClick={() => handleAttemptCloseModal('positions')}
              >
                {t('landlordStaffPositionsBtnClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: CREDENTIALS NOTIFICATION MODAL */}
      {/* ========================================================================= */}
      {credentialModal.isOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) {
              setCredentialModal(prev => ({ ...prev, isOpen: false }))
            }
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-line p-6 space-y-5 text-center">
            <div className="w-14 h-14 rounded-2xl bg-success-soft text-success border border-success-subtle flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-foreground">
                {t('landlordStaffCredSuccessTitle')}
              </h3>
              <p className="text-xs text-muted">
                {t('landlordStaffCredSuccessDesc', { name: credentialModal.name })}
              </p>
            </div>

            <div className="p-4 bg-surface rounded-2xl border border-line text-left space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted font-semibold">
                  {t('landlordStaffCredPhoneLabel')}
                </span>
                <span className="font-extrabold text-foreground">{credentialModal.phone}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted font-semibold">
                  {t('landlordStaffCredPasswordLabel')}
                </span>
                <span className="font-mono font-black text-sm text-accent bg-accent-soft px-2 py-0.5 rounded-lg border border-accent-subtle">
                  {credentialModal.password}
                </span>
              </div>
            </div>

            <Button fullWidth size="xs" variant="dark"
              onClick={() =>
                copyToClipboard(
                  t('landlordStaffCredShareMessage', {
                    phone: credentialModal.phone,
                    password: credentialModal.password,
                  }),
                )
              }
            >
              {copiedPassword ? (
                <>
                  <Check className="w-4 h-4 text-emerald-400" />
                  <span>{t('landlordStaffCredCopied')}</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>{t('landlordStaffCredCopyBtn')}</span>
                </>
              )}
            </Button>

            <Button size="xs"
              variant="ghost"
              onClick={() => setCredentialModal(prev => ({ ...prev, isOpen: false }))}
            >
              {t('landlordStaffCredCloseBtn')}
            </Button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: STAFF DETAIL VIEW */}
      {/* ========================================================================= */}
      {isDetailModalOpen && selectedStaff && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIsDetailModalOpen(false)
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-line p-6 space-y-5">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-zinc-900 text-white flex items-center justify-center font-black text-lg">
                  {selectedStaff.fullName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-extrabold text-foreground text-base">
                    {selectedStaff.fullName}
                  </h3>
                  <p className="text-xs font-bold text-primary">{selectedStaff.positionName}</p>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsDetailModalOpen(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-3 text-xs bg-surface p-4 rounded-2xl border border-line">
              <div className="flex justify-between items-center">
                <span className="text-muted font-semibold">
                  {t('landlordStaffDetailStatusLabel')}
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full font-extrabold text-[10px] ${selectedStaff.status === 'active'
                    ? 'bg-success-soft text-success'
                    : 'bg-line text-muted'
                    }`}
                >
                  {selectedStaff.status === 'active'
                    ? t('landlordStaffTableStatusActive')
                    : t('landlordStaffTableStatusInactive')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted font-semibold">
                  {t('landlordStaffDetailPhoneLabel')}
                </span>
                <span className="font-bold text-foreground">{selectedStaff.phoneNumber}</span>
              </div>
              {selectedStaff.email && (
                <div className="flex justify-between items-center">
                  <span className="text-muted font-semibold">
                    {t('landlordStaffDetailEmailLabel')}
                  </span>
                  <span className="font-medium text-foreground/90">{selectedStaff.email}</span>
                </div>
              )}
              <div className="flex justify-between items-center">
                <span className="text-muted font-semibold">
                  {t('landlordStaffDetailJoinedLabel')}
                </span>
                <span className="font-medium text-foreground/90">
                  {formatDate(selectedStaff.joinedAt)}
                </span>
              </div>
              {selectedStaff.leftAt && (
                <div className="flex justify-between items-center">
                  <span className="text-muted font-semibold">
                    {t('landlordStaffDetailLeftLabel')}
                  </span>
                  <span className="font-medium text-danger">
                    {formatDate(selectedStaff.leftAt)}
                  </span>
                </div>
              )}
              {selectedStaff.positionDescription && (
                <div className="pt-2 border-t border-line">
                  <span className="text-muted font-semibold block mb-1">
                    {t('landlordStaffDetailDutiesLabel')}
                  </span>
                  <p className="text-foreground/90 italic">{selectedStaff.positionDescription}</p>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button size="xs"
                onClick={() => {
                  handleOpenAssignRoleModal(selectedStaff)
                  setIsDetailModalOpen(false)
                }}
              >
                {t('landlordStaffBtnAssignRole')}
              </Button>
              <Button size="xs"
                variant="secondary"
                onClick={() => {
                  handleToggleStatus(selectedStaff)
                  setIsDetailModalOpen(false)
                }}
              >
                {selectedStaff.status === 'active'
                  ? t('landlordStaffBtnDeactivate')
                  : t('landlordStaffBtnActivate')}
              </Button>
              <Button size="xs" variant="dark"
                onClick={() => setIsDetailModalOpen(false)}
              >
                {t('landlordStaffDetailBtnClose')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: UNSAVED CHANGES CONFIRMATION (Rule #10) */}
      {/* ========================================================================= */}
      {isConfirmCloseOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setIsConfirmCloseOpen(false)
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden border border-line p-6 space-y-4 text-center">
            <div className="w-14 h-14 rounded-2xl bg-warning-soft text-warning border border-warning-subtle flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base font-black text-foreground">
                {t('landlordStaffConfirmCloseTitle')}
              </h4>
              <p className="text-xs text-muted leading-relaxed">
                {t('landlordStaffConfirmCloseMessage')}
              </p>
            </div>

            <div className="flex items-center gap-2.5 pt-2">
              <Button size="xs"
                type="button"
                variant="outline"
                onClick={() => setIsConfirmCloseOpen(false)}
                className="flex-1"
              >
                {t('landlordStaffConfirmCloseKeep')}
              </Button>
              <Button size="xs"
                type="button"
                variant="danger"
                onClick={handleConfirmClose}
                className="flex-1"
              >
                {t('landlordStaffConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Action Confirmation Modal (Rule #10) */}
      {actionConfirm && (
        <Modal
          isOpen={!!actionConfirm}
          onClose={() => setActionConfirm(null)}
          size="sm"
        >
          <div className="space-y-4 pt-2 text-center">
            <div className="w-12 h-12 rounded-2xl bg-warning-soft text-warning flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-foreground">
                {actionConfirm.title}
              </h3>
              <p className="text-xs text-muted leading-relaxed">
                {actionConfirm.message}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-3 border-t border-line">
              <Button
                size="sm"
                variant="secondary"
                type="button"
                onClick={() => setActionConfirm(null)}
                className="flex-1"
              >
                {t('landlordStaffConfirmCloseKeep') || 'Hủy bỏ'}
              </Button>
              <Button
                size="sm"
                variant="primary"
                type="button"
                onClick={() => {
                  const onConf = actionConfirm.onConfirm
                  setActionConfirm(null)
                  onConf()
                }}
                className="flex-1"
              >
                {t('btnConfirm') || 'Xác nhận'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
