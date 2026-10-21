'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Wrench,
  Plus,
  Zap,
  Droplets,
  Wifi,
  Trash2,
  ShieldCheck,
  CarFront,
  Edit3,
  Info,
  UploadCloud,
  FileSpreadsheet,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Flame,
  Tv,
  Waves,
  Home,
  X,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { useLanguage, useTranslations } from '@/context/LanguageContext'
import {
  serviceService,
  ServiceItem,
  ServicesSummary,
  ServiceAssignedRoom,
} from '@/services/service.service'
import {
  Button,
  TextInput,
  NumberInput,
  SelectInput,
  SearchInput,
  ChipGroup,
  Pagination,
  ViewModeToggle,
  Modal,
  Text,
  Switch,
} from '@/components/ui'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'
import { formatCurrency, resolveErrorMessage, localizeDbEnum } from '@/utils'

export default function ServicesPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const tCommon = useTranslations('common')
  const tErrors = useTranslations('errors')
  const { locale } = useLanguage()

  // Data States
  const [services, setServices] = useState<ServiceItem[]>([])
  const [summary, setSummary] = useState<ServicesSummary>({
    totalServices: 0,
    meteredCount: 0,
    roomFixedCount: 0,
    otherCount: 0,
    activeCount: 0,
    inactiveCount: 0,
  })
  const [totalItems, setTotalItems] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filters & View Mode
  const [searchQuery, setSearchQuery] = useState('')
  const [typeFilter, setTypeFilter] = useState('') // "" | "metered" | "room" | "person" | "other"
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Pagination States (Rule #9: Grid default 6, Table 10)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(6)

  // Add / Edit Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isDirty, setIsDirty] = useState(false)
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null)

  // Form Fields
  const [formName, setFormName] = useState('')
  const [formPrice, setFormPrice] = useState<number | string>(0)
  const [formUnit, setFormUnit] = useState('kWh')
  const [formIsMetered, setFormIsMetered] = useState(false)
  const [formAutoApplied, setFormAutoApplied] = useState(true)
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active')

  // Rooms Applied Modal State
  const [roomsModalService, setRoomsModalService] = useState<ServiceItem | null>(null)
  const [serviceRooms, setServiceRooms] = useState<ServiceAssignedRoom[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(false)

  // Delete Confirmation Modal State
  const [deleteTarget, setDeleteTarget] = useState<ServiceItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Alert & Confirm Modals
  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'warning' | 'error' | 'success' | 'info'
  }>({
    isOpen: false,
    title: t('landlordServicesAlertDefaultTitle'),
    message: '',
    type: 'info',
  })

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    onConfirm: () => void
  }>({ isOpen: false, title: '', message: '', onConfirm: () => {} })

  const showAlert = (
    message: string,
    type: 'warning' | 'error' | 'success' | 'info' = 'info',
    title: string = t('landlordServicesAlertDefaultTitle'),
  ) => {
    setAlertModal({ isOpen: true, title, message, type })
  }

  // Helper to determine service visual representation
  const getServiceVisuals = (name: string, isMetered: boolean, unit: string) => {
    const lowerName = name.toLowerCase()
    const lowerUnit = unit.toLowerCase()

    if (lowerName.includes('điện') || lowerName.includes('dien') || lowerName.includes('elec')) {
      return {
        iconName: 'Zap',
        color: 'text-amber-500',
        bg: 'bg-warning-soft border-warning-subtle',
        typeLabel: t('landlordServicesTypeMetered'),
      }
    }
    if (lowerName.includes('nước') || lowerName.includes('nuoc') || lowerName.includes('water')) {
      return {
        iconName: 'Droplets',
        color: 'text-vacant',
        bg: 'bg-info-soft border-info-subtle',
        typeLabel: t('landlordServicesTypeMetered'),
      }
    }
    if (
      lowerName.includes('wifi') ||
      lowerName.includes('mạng') ||
      lowerName.includes('internet')
    ) {
      return {
        iconName: 'Wifi',
        color: 'text-indigo-500',
        bg: 'bg-info-soft border-info-subtle',
        typeLabel: t('landlordServicesTypeFixedRoom'),
      }
    }
    if (
      lowerName.includes('rác') ||
      lowerName.includes('vệ sinh') ||
      lowerName.includes('rac') ||
      lowerName.includes('clean') ||
      lowerName.includes('trash')
    ) {
      return {
        iconName: 'Trash2',
        color: 'text-emerald-500',
        bg: 'bg-success-soft border-success-subtle',
        typeLabel:
          lowerUnit.includes('người') || lowerUnit.includes('person')
            ? t('landlordServicesTypeFixedPerson')
            : t('landlordServicesTypeFixedRoom'),
      }
    }
    if (
      lowerName.includes('xe') ||
      lowerName.includes('gửi xe') ||
      lowerName.includes('bãi xe') ||
      lowerName.includes('park') ||
      lowerName.includes('vehicle')
    ) {
      return {
        iconName: 'CarFront',
        color: 'text-purple-500',
        bg: 'bg-deposit-soft border-deposit-subtle',
        typeLabel: t('landlordServicesTypeQuantity'),
      }
    }
    if (
      lowerName.includes('an ninh') ||
      lowerName.includes('thang máy') ||
      lowerName.includes('bảo vệ') ||
      lowerName.includes('security') ||
      lowerName.includes('elevator')
    ) {
      return {
        iconName: 'ShieldCheck',
        color: 'text-danger',
        bg: 'bg-danger-soft border-danger-subtle',
        typeLabel: t('landlordServicesTypeFixedRoom'),
      }
    }
    if (lowerName.includes('gas') || lowerName.includes('bếp')) {
      return {
        iconName: 'Flame',
        color: 'text-orange-500',
        bg: 'bg-accent-soft border-accent-subtle',
        typeLabel: isMetered
          ? t('landlordServicesTypeMetered')
          : t('landlordServicesTypeFixedRoom'),
      }
    }

    // Generic fallback
    let typeLabel = t('landlordServicesTypeFixed')
    if (isMetered) typeLabel = t('landlordServicesTypeMetered')
    else if (
      lowerUnit.includes('phòng') ||
      lowerUnit.includes('phong') ||
      lowerUnit.includes('room')
    )
      typeLabel = t('landlordServicesTypeFixedRoom')
    else if (
      lowerUnit.includes('người') ||
      lowerUnit.includes('nguoi') ||
      lowerUnit.includes('person')
    )
      typeLabel = t('landlordServicesTypeFixedPerson')
    else if (
      lowerUnit.includes('xe') ||
      lowerUnit.includes('chiếc') ||
      lowerUnit.includes('vehicle')
    )
      typeLabel = t('landlordServicesTypeQuantity')

    return {
      iconName: 'Wrench',
      color: 'text-primary',
      bg: 'bg-primary-soft border-primary-subtle',
      typeLabel,
    }
  }

  const renderIcon = (iconName: string, className = 'w-6 h-6') => {
    switch (iconName) {
      case 'Zap':
        return <Zap className={className} />
      case 'Droplets':
        return <Droplets className={className} />
      case 'Wifi':
        return <Wifi className={className} />
      case 'Trash2':
        return <Trash2 className={className} />
      case 'CarFront':
        return <CarFront className={className} />
      case 'ShieldCheck':
        return <ShieldCheck className={className} />
      case 'Flame':
        return <Flame className={className} />
      case 'Tv':
        return <Tv className={className} />
      case 'Waves':
        return <Waves className={className} />
      default:
        return <Wrench className={className} />
    }
  }

  // Fetch Services from Backend
  const fetchServices = useCallback(async () => {
    if (!activeBuilding?.id) return
    setIsLoading(true)
    try {
      let isMeteredParam: boolean | undefined = undefined
      if (typeFilter === 'metered') isMeteredParam = true
      if (typeFilter === 'room' || typeFilter === 'person' || typeFilter === 'other')
        isMeteredParam = false

      const response = await serviceService.getServices(activeBuilding.id, {
        search: searchQuery.trim() || undefined,
        isMetered: isMeteredParam,
        page: currentPage,
        limit: itemsPerPage,
      })

      if (response && response.success) {
        setServices(response.data || [])
        setSummary(response.summary)
        setTotalItems(response.meta.total)
      }
    } catch (err: any) {
      showAlert(resolveErrorMessage(err, tErrors, t('landlordServicesErrorLoadFailed')), 'error')
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, searchQuery, typeFilter, currentPage, itemsPerPage, t, tErrors])

  useEffect(() => {
    fetchServices()
  }, [fetchServices])

  // Fetch Rooms for Assigned Modal
  const handleOpenRoomsModal = async (service: ServiceItem) => {
    if (!activeBuilding?.id) return
    setRoomsModalService(service)
    setIsLoadingRooms(true)
    try {
      const res = await serviceService.getServiceRooms(activeBuilding.id, service.id)
      if (res && res.success && res.data) {
        setServiceRooms(res.data.rooms || [])
      }
    } catch (err: any) {
      showAlert(resolveErrorMessage(err, tErrors, t('landlordServicesErrorLoadRoomsFailed')), 'error')
    } finally {
      setIsLoadingRooms(false)
    }
  }

  // Add Modal Open
  const handleOpenAddModal = () => {
    setSelectedService(null)
    setFormName('')
    setFormPrice(0)
    setFormUnit('kWh')
    setFormIsMetered(true)
    setFormAutoApplied(true)
    setFormStatus('active')
    setIsDirty(false)
    setIsModalOpen(true)
  }

  // Edit Modal Open
  const handleOpenEditModal = (srv: ServiceItem) => {
    setSelectedService(srv)
    setFormName(srv.name)
    setFormPrice(srv.numericPrice)
    setFormUnit(srv.unit)
    setFormIsMetered(srv.isMetered)
    setFormAutoApplied(srv.autoApplied)
    setFormStatus(srv.status)
    setIsDirty(false)
    setIsModalOpen(true)
  }

  // Modal Close with Rule #10 Confirm Modal on Dirty Draft
  const handleCloseModal = () => {
    if (isDirty) {
      setConfirmModal({
        isOpen: true,
        title: t('landlordServicesConfirmCloseTitle'),
        message: t('landlordServicesConfirmCloseDesc'),
        confirmText: t('landlordServicesConfirmCloseDiscard'),
        cancelText: t('landlordServicesConfirmCloseKeep'),
        onConfirm: () => {
          setIsModalOpen(false)
          setConfirmModal(prev => ({ ...prev, isOpen: false }))
          setIsDirty(false)
        },
      })
    } else {
      setIsModalOpen(false)
    }
  }

  // Save (Create or Update) Service
  const handleSaveService = async () => {
    if (!formName.trim()) {
      showAlert(t('landlordServicesAlertMissingName'), 'warning')
      return
    }

    const priceNum =
      typeof formPrice === 'number'
        ? formPrice
        : parseInt(String(formPrice).replace(/\D/g, ''), 10) || 0
    if (priceNum < 0) {
      showAlert(t('landlordServicesAlertInvalidPrice'), 'warning')
      return
    }

    if (!formUnit.trim()) {
      showAlert(t('landlordServicesAlertMissingUnit'), 'warning')
      return
    }

    setIsSubmitting(true)
    try {
      if (!activeBuilding?.id) return
      if (selectedService) {
        await serviceService.updateService(activeBuilding.id, selectedService.id, {
          name: formName.trim(),
          price: priceNum,
          unit: formUnit.trim(),
          isMetered: formIsMetered,
          autoApplied: formAutoApplied,
          status: formStatus,
        })
        showAlert(t('landlordServicesAlertUpdateSuccess'), 'success')
      } else {
        await serviceService.createService(activeBuilding.id, {
          name: formName.trim(),
          price: priceNum,
          unit: formUnit.trim(),
          isMetered: formIsMetered,
          autoApplied: formAutoApplied,
          status: formStatus,
        })
        showAlert(t('landlordServicesAlertCreateSuccess'), 'success')
      }

      setIsModalOpen(false)
      setIsDirty(false)
      fetchServices()
    } catch (err: any) {
      showAlert(resolveErrorMessage(err, tErrors, t('landlordServicesErrorActionFailed')), 'error')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Toggle Service Active Status
  const handleToggleActive = async (srv: ServiceItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    if (!activeBuilding?.id) return
    const nextStatus = srv.status === 'active' ? 'inactive' : 'active'

    try {
      await serviceService.updateService(activeBuilding.id, srv.id, { status: nextStatus })
      const statusText =
        nextStatus === 'active'
          ? t('landlordServicesAlertStatusActive')
          : t('landlordServicesAlertStatusInactive')
      showAlert(
        t('landlordServicesAlertToggleStatus', { status: statusText, name: srv.name }),
        nextStatus === 'active' ? 'success' : 'info',
      )
      // Optimistic update local state
      setServices(prev => prev.map(s => (s.id === srv.id ? { ...s, status: nextStatus } : s)))
      setSummary(prev => ({
        ...prev,
        activeCount: nextStatus === 'active' ? prev.activeCount + 1 : prev.activeCount - 1,
        inactiveCount: nextStatus === 'inactive' ? prev.inactiveCount + 1 : prev.inactiveCount - 1,
      }))
    } catch (err: any) {
      showAlert(resolveErrorMessage(err, tErrors, t('landlordServicesErrorUpdateStatusFailed')), 'error')
      fetchServices()
    }
  }

  // Delete Service
  const handleDeleteService = async () => {
    if (!deleteTarget || !activeBuilding?.id) return
    setIsDeleting(true)
    try {
      await serviceService.deleteService(activeBuilding.id, deleteTarget.id)
      showAlert(t('landlordServicesAlertDeleteSuccess', { name: deleteTarget.name }), 'success')
      setDeleteTarget(null)
      fetchServices()
    } catch (err: any) {
      showAlert(resolveErrorMessage(err, tErrors, t('landlordServicesErrorDeleteFailed')), 'error')
    } finally {
      setIsDeleting(false)
    }
  }

  const statChips: LandlordStatChipItem[] = useMemo(
    () => [
      {
        key: 'total',
        label: t('landlordServicesTotalServices'),
        value: summary.totalServices,
        icon: <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-danger shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-danger/10 hover:bg-danger/20 border-danger/30 lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'metered',
        label: t('landlordServicesFilterMetered'),
        value: summary.meteredCount,
        icon: <Zap className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-primary shrink-0" />,
        containerClassName:
          'px-3 py-2 bg-primary/10 hover:bg-primary/20 border-primary/30 lg:w-[130px]',
        labelColor: 'brand',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'roomFixed',
        label: t('landlordServicesFixedRoom'),
        value: summary.roomFixedCount,
        icon: <Wifi className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-accent shrink-0" />,
        containerClassName:
          'px-3 py-2 bg-accent/10 hover:bg-accent/20 border-accent/30 lg:w-[130px]',
        labelClassName: 'text-accent',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'other',
        label: t('landlordServicesFixedPerson'),
        value: summary.otherCount,
        icon: <CarFront className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />,
        containerClassName:
          'px-3 py-2 bg-vacant/10 hover:bg-vacant/20 border-vacant/30 lg:w-[130px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
    ],
    [t, summary],
  )

  // Calculation for pagination

  return (
    <div className="space-y-4 sm:space-y-6 animate-in fade-in duration-500 pb-12">
      {/* Top Bar Header */}
      <LandlordPageHeader
        title={t('landlordServicesTitle')}
        subtitle={t('landlordServicesSubtitle')}
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => showAlert(t('landlordServicesAlertImportDeveloping'), 'info')}
              className="sm:px-3.5"
            >
              <UploadCloud className="w-4 h-4 text-success" /> {tCommon('import')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => showAlert(t('landlordServicesAlertExportSuccess'), 'success')}
              className="sm:px-3.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-info" /> {tCommon('export')}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={fetchServices}
              title={t('landlordServicesRefresh')}
            >
              <RefreshCw className={`w-4 h-4 text-muted ${isLoading ? 'animate-spin' : ''}`} />{' '}
              {t('landlordServicesRefresh')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="md"
              onClick={handleOpenAddModal}
              className="sm:w-auto"
            >
              <Plus className="w-4 h-4" /> {t('landlordServicesAddNew')}
            </Button>
          </>
        }
      />

      {/* Dark Hero Banner */}
      <LandlordStatBanner
        watermarkIcon={<Wrench className="w-64 h-64" />}
        chips={statChips}
      />

      {/* Guidance Alert Banner */}
      <div className="bg-primary/5 border border-primary/20 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <div className="bg-primary/10 p-1.5 rounded-xl text-primary shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <Text as="h3" weight="extrabold" color="default" size="xs">
            {t('landlordServicesPricingRule')}
          </Text>
          <Text size="xs" color="secondary" weight="medium" className="leading-relaxed">
            {t('landlordServicesPricingRuleGuidance', {
              building: activeBuilding?.name || t('landlordServicesBuildingFallback'),
            })}
          </Text>
        </div>
      </div>

      {/* FILTER & TOOLBAR BAR */}
      <div className="bg-card border border-line rounded-2xl p-3 sm:p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative w-full sm:max-w-xs">
            <SearchInput
              placeholder={t('landlordServicesSearchPlaceholder')}
              value={searchQuery}
              onChange={val => {
                setSearchQuery(val)
                setCurrentPage(1)
              }}
              containerClassName="w-full space-y-0"
              className="w-full text-xs font-semibold bg-surface border border-line rounded-xl focus:bg-white focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all"
            />
          </div>

          {/* Right Toolbar: View Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <ViewModeToggle
              value={viewMode}
              onChange={setViewMode}
              onPageSizeChange={setItemsPerPage}
              onPageChange={setCurrentPage}
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="pt-1 border-t border-line">
          <ChipGroup
            value={typeFilter}
            onChange={val => {
              setTypeFilter(val)
              setCurrentPage(1)
            }}
            options={[
              { value: '', label: t('landlordServicesFilterAll') },
              { value: 'metered', label: t('landlordServicesFilterMetered') },
              { value: 'room', label: t('landlordServicesFilterFixed') },
            ]}
          />
        </div>
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="py-12 flex flex-col items-center justify-center space-y-2">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <Text size="xs" color="secondary" weight="medium">
            {t('landlordServicesLoading')}
          </Text>
        </div>
      )}

      {/* CONTENT DISPLAY: GRID OR LIST VIEW */}
      {!isLoading && viewMode === 'grid' ? (
        /* GRID VIEW CARDS */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {services.length > 0 ? (
            services.map(service => {
              const visual = getServiceVisuals(service.name, service.isMetered, service.unit)
              const isActive = service.status === 'active'
              const formattedPrice = formatCurrency(service.numericPrice, locale)

              return (
                <div
                  key={service.id}
                  className={`bg-card border rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all space-y-4 relative overflow-hidden flex flex-col justify-between ${
                    isActive ? 'border-line' : 'border-line opacity-70 bg-surface/50'
                  }`}
                >
                  <div className="space-y-3.5">
                    {/* Top Header Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 sm:w-12 h-11 sm:h-12 rounded-2xl flex items-center justify-center border shadow-2xs shrink-0 ${visual.bg} ${visual.color}`}
                        >
                          {renderIcon(visual.iconName, 'w-5 sm:w-6 h-5 sm:h-6')}
                        </div>
                        <div>
                          <div className="flex flex-wrap items-center gap-1.5">
                            <Text
                              as="span"
                              size="3xs"
                              weight="black"
                              color="brand"
                              className="bg-primary/10 px-2 py-0.5 rounded-md border border-primary/30"
                            >
                              {service.id.substring(0, 8).toUpperCase()}
                            </Text>
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border ${
                                service.autoApplied
                                  ? 'bg-danger-soft text-danger border-danger-subtle'
                                  : 'bg-info-soft text-info border-info-subtle'
                              }`}
                            >
                              {service.autoApplied
                                ? t('landlordServicesMandatory')
                                : t('landlordServicesOptional')}
                            </span>
                          </div>
                          <Text as="h3" weight="black" color="default" size="lg" className="mt-1">
                            {service.name}
                          </Text>
                        </div>
                      </div>
                    </div>

                    {/* STATUS TOGGLE WITH SWITCH */}
                    <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-line">
                      <div className="space-y-0.5">
                        <Text as="span" size="xs" weight="extrabold" className="block text-foreground/90">
                          {t('landlordServicesAppliedStatus')}:
                        </Text>
                        <Text
                          as="span"
                          size="2xs"
                          weight="bold"
                          className={`block ${isActive ? 'text-success' : 'text-muted'}`}
                        >
                          {isActive
                            ? t('landlordServicesStatusOn')
                            : t('landlordServicesStatusOff')}
                        </Text>
                      </div>

                      <Switch
                        checked={isActive}
                        onClick={(e: React.MouseEvent) => handleToggleActive(service, e)}
                        title={
                          isActive
                            ? t('landlordServicesClickToDisable')
                            : t('landlordServicesClickToEnable')
                        }
                        srLabel={t('landlordServicesToggleStatusSr')}
                      />
                    </div>

                    {/* Service Specification Table */}
                    <div className="p-3.5 bg-surface/80 rounded-2xl space-y-2 text-xs border border-line">
                      <div className="flex justify-between items-center text-muted">
                        <Text as="span" size="xs" color="secondary" weight="medium">
                          {t('landlordServicesBillingTypeLabel')}
                        </Text>
                        <Text as="span" size="xs" weight="bold" color="default" className="bg-card px-2 py-0.5 rounded-md border border-line">
                          {visual.typeLabel}
                        </Text>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <Text as="span" size="xs" color="secondary" weight="medium">
                          {t('landlordServicesUnitLabel')}
                        </Text>
                        <Text as="span" size="xs" weight="bold" color="default">
                          {service.unit}
                        </Text>
                      </div>
                      <div className="flex justify-between items-center text-muted pt-1 border-t border-line">
                        <Text as="span" size="xs" color="secondary" weight="medium">
                          {t('landlordServicesDefaultPriceLabel')}
                        </Text>
                        <Text as="span" weight="black" color="success" size="lg">
                          {formattedPrice}
                        </Text>
                      </div>
                    </div>
                  </div>

                  {/* Footer Action Controls */}
                  <div className="pt-3 border-t border-line flex items-center justify-between gap-1.5 text-xs">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenRoomsModal(service)}
                      title={t('landlordServicesAppliedRooms')}
                    >
                      <Home className="w-3.5 h-3.5 text-primary" />{' '}
                      {t('landlordServicesRoomsCount', { count: service.appliedRoomsCount })}
                    </Button>

                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditModal(service)}
                      >
                        <Edit3 className="w-3.5 h-3.5" /> {t('landlordServicesEdit')}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget(service)}
                        title={t('landlordServicesDeleteTooltip')}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="col-span-full py-16 flex flex-col items-center justify-center bg-card rounded-3xl border border-line border-dashed p-6 text-center space-y-2">
              <Wrench className="w-12 h-12 text-zinc-300 mb-1" />
              <Text weight="black" color="default" size="base">
                {t('landlordServicesEmptyTitle')}
              </Text>
              <Text size="xs" color="secondary">
                {t('landlordServicesEmptyDesc')}
              </Text>
            </div>
          )}
        </div>
      ) : !isLoading ? (
        /* LIST VIEW TABLE */
        <div className="bg-card border border-line rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left min-w-[900px]">
              <thead className="bg-surface text-muted uppercase font-extrabold border-b border-line whitespace-nowrap">
                <tr>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[200px]">{t('landlordServicesCode')}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[170px]">{t('landlordServicesType')}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">{t('landlordServicesUnit')}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">
                    {t('landlordServicesPrice')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[100px]">{t('landlordServicesRule')}</th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[130px]">
                    {t('landlordServicesAppliedRooms')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[140px]">
                    {t('landlordServicesStatus')}
                  </th>
                  <th className="px-4 sm:px-6 py-3.5 min-w-[120px] text-right">
                    {t('landlordServicesActions')}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line font-medium">
                {services.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-muted">
                      <Text size="xs" color="secondary">
                        {t('landlordServicesEmptyTitle')}
                      </Text>
                    </td>
                  </tr>
                ) : (
                  services.map(service => {
                    const visual = getServiceVisuals(service.name, service.isMetered, service.unit)
                    const isActive = service.status === 'active'
                    const formattedPrice = formatCurrency(service.numericPrice, locale)

                    return (
                      <tr key={service.id} className="hover:bg-zinc-50/80 transition-colors">
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${visual.bg} ${visual.color}`}
                            >
                              {renderIcon(visual.iconName, 'w-4.5 h-4.5')}
                            </div>
                            <div>
                              <Text as="span" weight="black" color="default" size="sm" className="block whitespace-nowrap">
                                {service.name}
                              </Text>
                              <Text as="span" size="3xs" weight="bold" color="brand" mono className="block">
                                {service.id.substring(0, 8).toUpperCase()}
                              </Text>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" weight="bold" color="default" className="bg-card-hover px-2.5 py-1 rounded-md border border-line inline-block">
                            {visual.typeLabel}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="xs" weight="bold" className="text-foreground/90">
                            {service.unit}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Text as="span" size="sm" weight="black" color="success">
                            {formattedPrice}
                          </Text>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span
                            className={`px-2.5 py-1 rounded-md text-[10px] font-extrabold border inline-block whitespace-nowrap ${
                              service.autoApplied
                                ? 'bg-danger-soft text-danger border-danger-subtle'
                                : 'bg-info-soft text-info border-info-subtle'
                            }`}
                          >
                            {service.autoApplied
                              ? t('landlordServicesMandatory')
                              : t('landlordServicesOptional')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenRoomsModal(service)}
                            className="hover:underline"
                          >
                            <Home className="w-3.5 h-3.5" />{' '}
                            {t('landlordServicesRoomsCount', { count: service.appliedRoomsCount })}
                          </Button>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Switch
                              size="sm"
                              checked={isActive}
                              onClick={(e: React.MouseEvent) => handleToggleActive(service, e)}
                              title={
                                isActive
                                  ? t('landlordServicesClickToDisable')
                                  : t('landlordServicesClickToEnable')
                              }
                              srLabel={t('landlordServicesToggleStatusSr')}
                            />
                            <Text
                              as="span"
                              size="xs"
                              weight="bold"
                              className={isActive ? 'text-success font-black' : 'text-muted'}
                            >
                              {isActive
                                ? t('landlordServicesAlertStatusActive')
                                : t('landlordServicesAlertStatusInactive')}
                            </Text>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEditModal(service)}
                            >
                              <Edit3 className="w-3 h-3 text-primary" />{' '}
                              {t('landlordServicesEdit')}
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setDeleteTarget(service)}
                              title={t('landlordServicesDeleteTooltip')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {/* Standardized Dormio Pagination Footer (Rule #9) */}
      <Pagination
        currentPage={currentPage}
        totalItems={totalItems}
        pageSize={itemsPerPage}
        onPageChange={setCurrentPage}
        onPageSizeChange={setItemsPerPage}
        pageSizeMax={100}
        className="mt-4"
      />

      {/* ADD / EDIT SERVICE MODAL */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        size="lg"
      >
        <Modal.Header
          icon={
            <div className="p-2 bg-accent-soft text-accent rounded-xl">
              <Wrench className="w-5 h-5 text-primary" />
            </div>
          }
          title={
            selectedService
              ? t('landlordServicesModalEditTitle', { name: selectedService.name })
              : t('landlordServicesModalAddTitle')
          }
          description={t('landlordServicesModalSubtitle')}
        />

        <Modal.Body className="p-4 sm:p-6 space-y-4 text-xs">
          <TextInput
            label={t('landlordServicesFormNameLabel')}
            required
            type="text"
            placeholder={t('landlordServicesFormNamePlaceholder')}
            value={formName}
            onChange={e => {
              setFormName(e.target.value)
              setIsDirty(true)
            }}
            containerClassName="w-full space-y-1"
            labelClassName="block font-extrabold text-foreground/90"
            className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <SelectInput
              label={t('landlordServicesFormMeasurementLabel')}
              value={formIsMetered ? 'metered' : 'fixed'}
              onChange={e => {
                setFormIsMetered(e.target.value === 'metered')
                setIsDirty(true)
              }}
              options={[
                { value: 'metered', label: t('landlordServicesFormOptionMetered') },
                { value: 'fixed', label: t('landlordServicesFormOptionFixed') },
              ]}
              containerClassName="w-full space-y-1"
              labelClassName="block font-extrabold text-foreground/90"
              className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-card cursor-pointer"
            />

            <SelectInput
              label={t('landlordServicesFormRuleLabel')}
              value={formAutoApplied ? 'mandatory' : 'optional'}
              onChange={e => {
                setFormAutoApplied(e.target.value === 'mandatory')
                setIsDirty(true)
              }}
              options={[
                { value: 'mandatory', label: t('landlordServicesFormOptionMandatory') },
                { value: 'optional', label: t('landlordServicesFormOptionOptional') },
              ]}
              containerClassName="w-full space-y-1"
              labelClassName="block font-extrabold text-foreground/90"
              className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-card cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <TextInput
              label={t('landlordServicesFormUnitLabel')}
              required
              type="text"
              placeholder={t('landlordServicesFormUnitPlaceholder')}
              value={formUnit}
              onChange={e => {
                setFormUnit(e.target.value)
                setIsDirty(true)
              }}
              containerClassName="w-full space-y-1"
              labelClassName="block font-extrabold text-foreground/90"
              className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />

            <NumberInput
              label={t('landlordServicesFormPriceLabel')}
              required
              min={0}
              step={100}
              placeholder={t('landlordServicesFormPricePlaceholder')}
              value={formPrice}
              onChange={e => {
                setFormPrice(e.target.value === '' ? '' : Number(e.target.value))
                setIsDirty(true)
              }}
              containerClassName="w-full space-y-1"
              labelClassName="block font-extrabold text-foreground/90"
              className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all"
            />
          </div>

          <div>
            <SelectInput
              label={t('landlordServicesFormStatusLabel')}
              value={formStatus}
              onChange={e => {
                setFormStatus(e.target.value as 'active' | 'inactive')
                setIsDirty(true)
              }}
              options={[
                { value: 'active', label: t('landlordServicesFormOptionActive') },
                { value: 'inactive', label: t('landlordServicesFormOptionInactive') },
              ]}
              containerClassName="w-full space-y-1"
              labelClassName="block font-extrabold text-foreground/90"
              className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-primary focus:ring-4 focus:ring-primary/10 outline-none bg-card cursor-pointer"
            />
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCloseModal}
          >
            {t('landlordServicesModalCancel')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleSaveService}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('landlordServicesModalSave')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* APPLIED ROOMS OVERVIEW MODAL */}
      <Modal
        isOpen={Boolean(roomsModalService)}
        onClose={() => setRoomsModalService(null)}
        size="md"
      >
        {roomsModalService && (
          <>
            <Modal.Header
              icon={
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-primary-soft border-primary-subtle text-primary">
                  <Wrench className="w-5 h-5" />
                </div>
              }
              title={roomsModalService.name}
              description={t('landlordServicesRoomsAppliedSubtitle', {
                count: serviceRooms.length,
              })}
            />

            <Modal.Body className="p-4 sm:p-6 space-y-4 text-xs">
              <div className="p-3 bg-surface rounded-xl space-y-1 border border-line">
                <Text as="span" size="xs" weight="bold" color="secondary" className="block">
                  {t('landlordServicesPrice')}:{' '}
                  <Text as="strong" size="sm" weight="black" color="success">
                    {formatCurrency(roomsModalService.numericPrice, locale)}
                  </Text>{' '}
                  / {roomsModalService.unit}
                </Text>
                <Text as="span" size="xs" color="secondary" weight="medium" className="block">
                  {t('landlordServicesType')}:{' '}
                  {roomsModalService.isMetered
                    ? t('landlordServicesMetered')
                    : t('landlordServicesTypeFixed')}{' '}
                  (
                  {roomsModalService.autoApplied
                    ? t('landlordServicesMandatory')
                    : t('landlordServicesOptional')}
                  )
                </Text>
              </div>

              <Text as="span" size="xs" weight="extrabold" className="block pt-2 text-foreground/90">
                {t('landlordServicesRoomsListTitle')}
              </Text>

              {isLoadingRooms ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-6 h-6 text-primary animate-spin" />
                </div>
              ) : serviceRooms.length === 0 ? (
                <div className="py-6 text-center text-muted text-xs">
                  <Text size="xs" color="secondary">
                    {t('landlordServicesRoomsEmpty')}
                  </Text>
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {serviceRooms.map(room => (
                    <div
                      key={room.id}
                      className="p-2 bg-surface border border-line rounded-xl text-center font-bold text-foreground text-xs"
                      title={t('landlordServicesRoomTooltip', {
                        floor: room.floor,
                        status: localizeDbEnum('roomStatus', room.status, locale),
                      })}
                    >
                      {t('landlordServicesRoomBadge', { room: room.roomNumber })}
                    </div>
                  ))}
                </div>
              )}
            </Modal.Body>

            <Modal.Footer>
              <Button
                fullWidth
                type="button"
                variant="primary"
                size="sm"
                onClick={() => setRoomsModalService(null)}
              >
                {t('landlordServicesRoomsClose')}
              </Button>
            </Modal.Footer>
          </>
        )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        isOpen={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        size="md"
        zIndex={60}
        showCloseButton={false}
      >
        <Modal.Body className="p-6 sm:p-7 text-center space-y-5">
          <div className="w-14 h-14 bg-danger-soft border border-danger-subtle rounded-2xl flex items-center justify-center mx-auto text-danger shadow-2xs">
            <Trash2 className="w-7 h-7" />
          </div>

          <div className="space-y-2">
            <Text as="h3" weight="black" size="xl" color="default" className="tracking-tight">
              {t('landlordServicesDeleteTitle')}
            </Text>
            <Text size="sm" color="secondary" weight="medium" className="leading-relaxed max-w-xs mx-auto">
              {deleteTarget && t('landlordServicesDeleteMessage', { name: deleteTarget.name })}
            </Text>
          </div>
        </Modal.Body>

        <Modal.Footer className="flex items-center justify-center gap-3 pt-2 bg-transparent border-t-0 p-6 pt-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setDeleteTarget(null)}
            className="flex-1"
          >
            {t('landlordServicesDeleteCancel')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleDeleteService}
            disabled={isDeleting}
            className="flex-1"
          >
            {isDeleting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            {t('landlordServicesDeleteConfirm')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* CONFIRM MODAL (RULE #10) */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmText={confirmModal.confirmText || t('landlordServicesConfirmCloseDiscard')}
        cancelText={confirmModal.cancelText || t('landlordServicesConfirmCloseKeep')}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      {/* ALERT MODAL */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        btnText={t('landlordServicesAlertUnderstand')}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  )
}

function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
}: {
  isOpen: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const t = useTranslations('landlord')

  return (
    <Modal
      isOpen={isOpen}
      onClose={onCancel}
      size="sm"
      zIndex={60}
      showCloseButton={false}
    >
      <Modal.Body className="p-6 sm:p-7 text-center space-y-5">
        <div className="w-14 h-14 bg-warning-soft border border-warning-subtle rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <Text as="h3" weight="black" size="xl" color="default" className="tracking-tight">
            {title}
          </Text>
          <Text size="sm" color="secondary" weight="medium" className="leading-relaxed max-w-xs mx-auto">
            {message}
          </Text>
        </div>
      </Modal.Body>

      <Modal.Footer className="flex items-center justify-center gap-3 pt-2 bg-transparent border-t-0 p-6 pt-0">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="flex-1"
        >
          {cancelText || t('landlordServicesConfirmCloseKeep')}
        </Button>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={onConfirm}
          className="flex-1"
        >
          {confirmText || t('landlordServicesConfirmCloseDiscard')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}

function AlertModal({
  isOpen,
  title,
  message,
  type = 'info',
  btnText,
  onClose,
}: {
  isOpen: boolean
  title: string
  message: string
  type?: 'warning' | 'error' | 'success' | 'info'
  btnText?: string
  onClose: () => void
}) {
  const t = useTranslations('landlord')

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="xs"
      zIndex={75}
      showCloseButton={false}
    >
      <Modal.Body className="p-6 space-y-4 text-center">
        <div
          className={`w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border ${config.bgColor}`}
        >
          {config.icon}
        </div>

        <div className="space-y-1.5">
          <Text as="h3" weight="black" size="lg" color="default">
            {title}
          </Text>
          <Text size="xs" color="secondary" weight="medium" className="leading-relaxed">
            {message}
          </Text>
        </div>
      </Modal.Body>

      <Modal.Footer className="bg-transparent border-t-0 p-6 pt-0">
        <Button fullWidth variant="dark" onClick={onClose} size="sm">
          {btnText || t('landlordServicesAlertUnderstand')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
