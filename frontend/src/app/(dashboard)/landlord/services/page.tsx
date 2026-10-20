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
  Search,
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
  Box,
  LayoutGrid,
  List,
  Home,
  X,
  Clock,
  MapPin,
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
import { Button, TextInput, NumberInput, SelectInput, SearchInput, ChipGroup } from '@/components/ui'
import { LandlordPageHeader, LandlordStatBanner, LandlordStatChipItem } from '@/components/landlord'

export default function ServicesPage() {
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')
  const { locale } = useLanguage()
  const isEn = locale === 'en'

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
        color: 'text-blue-500',
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
        color: 'text-rose-500',
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
      color: 'text-[#2AC1BC]',
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
      showAlert(err?.message || 'Không thể tải danh sách dịch vụ', 'error', 'Lỗi tải dữ liệu')
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, searchQuery, typeFilter, currentPage, itemsPerPage])

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
      showAlert(err?.message || 'Không thể tải danh sách phòng áp dụng', 'error')
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
        showAlert(t('landlordServicesAlertUpdateSuccess'), 'success')
      }

      setIsModalOpen(false)
      setIsDirty(false)
      fetchServices()
    } catch (err: any) {
      showAlert(err?.message || 'Thao tác thất bại', 'error')
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
      showAlert(err?.message || 'Không thể cập nhật trạng thái', 'error')
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
      showAlert(err?.message || 'Không thể xóa dịch vụ này', 'error')
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
        icon: <Wrench className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />,
        containerClassName:
          'px-3.5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border-rose-500/30 lg:w-[150px]',
        labelClassName: 'text-rose-400',
        valueColor: 'danger',
        valueClassName: 'text-base sm:text-lg leading-none mt-1',
      },
      {
        key: 'metered',
        label: t('landlordServicesFilterMetered'),
        value: summary.meteredCount,
        icon: <Zap className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#2AC1BC] shrink-0" />,
        containerClassName:
          'px-3 py-2 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 border-[#2AC1BC]/30 lg:w-[130px]',
        labelColor: 'brand',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'roomFixed',
        label: t('landlordServicesFixedRoom'),
        value: summary.roomFixedCount,
        icon: <Wifi className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-[#FF6B35] shrink-0" />,
        containerClassName:
          'px-3 py-2 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 border-[#FF6B35]/30 lg:w-[130px]',
        labelClassName: 'text-[#FF6B35]',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
      {
        key: 'other',
        label: t('landlordServicesFixedPerson'),
        value: summary.otherCount,
        icon: <CarFront className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-blue-400 shrink-0" />,
        containerClassName:
          'px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 lg:w-[130px]',
        labelClassName: 'text-blue-400',
        valueColor: 'white',
        valueClassName: 'text-sm sm:text-base leading-none mt-0.5',
      },
    ],
    [t, summary],
  )

  // Calculation for pagination
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1

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
              <UploadCloud className="w-4 h-4 text-emerald-600" /> Import
            </Button>
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => showAlert(t('landlordServicesAlertExportSuccess'), 'success')}
              className="sm:px-3.5"
            >
              <FileSpreadsheet className="w-4 h-4 text-blue-600" /> Export
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
      <div className="bg-[#2AC1BC]/5 border border-[#2AC1BC]/20 rounded-2xl p-3.5 sm:p-4 flex items-start gap-3">
        <div className="bg-[#2AC1BC]/10 p-1.5 rounded-xl text-[#2AC1BC] shrink-0 mt-0.5">
          <Info className="w-4 h-4" />
        </div>
        <div className="space-y-0.5 text-xs">
          <h3 className="font-extrabold text-foreground">{t('landlordServicesPricingRule')}</h3>
          <p className="text-muted leading-relaxed font-medium">
            {t('landlordServicesPricingRuleGuidance', {
              building: activeBuilding?.name || (isEn ? 'the property' : 'tòa nhà'),
            })}
          </p>
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
              className="w-full text-xs font-semibold bg-surface border border-line rounded-xl focus:bg-white focus:outline-none focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 transition-all"
            />
          </div>

          {/* Right Toolbar: View Mode Toggle */}
          <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0">
            <div className="flex items-center gap-1 bg-card-hover p-1 rounded-xl border border-line">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('grid')
                  setItemsPerPage(6)
                  setCurrentPage(1)
                }}
                title={t('landlordServicesViewGrid')}
              >
                <LayoutGrid className="w-4 h-4" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setViewMode('list')
                  setItemsPerPage(10)
                  setCurrentPage(1)
                }}
                title={t('landlordServicesViewTable')}
              >
                <List className="w-4 h-4" />
              </Button>
            </div>
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
          <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
          <p className="text-xs text-muted font-medium">{t('landlordServicesLoading')}</p>
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
              const formattedPrice = `${service.numericPrice.toLocaleString(isEn ? 'en-US' : 'vi-VN')} ₫`

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
                            <span className="text-[10px] font-black text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md border border-[#2AC1BC]/30">
                              {service.id.substring(0, 8).toUpperCase()}
                            </span>
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
                          <h3 className="font-black text-foreground text-base sm:text-lg mt-1">
                            {service.name}
                          </h3>
                        </div>
                      </div>
                    </div>

                    {/* STATUS TOGGLE WITH SWITCH */}
                    <div className="flex items-center justify-between p-3 bg-surface rounded-2xl border border-line">
                      <div className="space-y-0.5">
                        <span className="text-xs font-extrabold text-foreground/90 block">
                          {t('landlordServicesAppliedStatus')}:
                        </span>
                        <span
                          className={`text-[11px] font-bold block ${isActive ? 'text-emerald-600' : 'text-muted'}`}
                        >
                          {isActive
                            ? t('landlordServicesStatusOn')
                            : t('landlordServicesStatusOff')}
                        </span>
                      </div>

                      <Button rounded="full"
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={e => handleToggleActive(service, e)}
                        className="shrink-0"
                        title={
                          isActive
                            ? t('landlordServicesClickToDisable')
                            : t('landlordServicesClickToEnable')
                        }
                      >
                        <span className="sr-only">Toggle status</span>
                        <span
                          className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                            isActive ? 'translate-x-5' : 'translate-x-0'
                          }`}
                        />
                      </Button>
                    </div>

                    {/* Service Specification Table */}
                    <div className="p-3.5 bg-surface/80 rounded-2xl space-y-2 text-xs border border-line">
                      <div className="flex justify-between items-center text-muted">
                        <span className="text-muted font-medium">
                          {t('landlordServicesBillingTypeLabel')}
                        </span>
                        <span className="font-bold text-foreground bg-card px-2 py-0.5 rounded-md border border-line">
                          {visual.typeLabel}
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-muted">
                        <span className="text-muted font-medium">
                          {t('landlordServicesUnitLabel')}
                        </span>
                        <span className="font-bold text-foreground">{service.unit}</span>
                      </div>
                      <div className="flex justify-between items-center text-muted pt-1 border-t border-line">
                        <span className="text-muted font-medium">
                          {t('landlordServicesDefaultPriceLabel')}
                        </span>
                        <span className="font-black text-emerald-600 text-base sm:text-lg">
                          {formattedPrice}
                        </span>
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
                      <Home className="w-3.5 h-3.5 text-[#2AC1BC]" />{' '}
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
              <p className="font-black text-foreground text-base">
                {t('landlordServicesEmptyTitle')}
              </p>
              <p className="text-xs text-muted">{t('landlordServicesEmptyDesc')}</p>
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
                      {t('landlordServicesEmptyTitle')}
                    </td>
                  </tr>
                ) : (
                  services.map(service => {
                    const visual = getServiceVisuals(service.name, service.isMetered, service.unit)
                    const isActive = service.status === 'active'
                    const formattedPrice = `${service.numericPrice.toLocaleString(isEn ? 'en-US' : 'vi-VN')} ₫`

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
                              <span className="font-black text-foreground block text-xs sm:text-sm whitespace-nowrap">
                                {service.name}
                              </span>
                              <span className="text-[10px] font-mono text-[#2AC1BC] font-bold block">
                                {service.id.substring(0, 8).toUpperCase()}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                          <span className="font-bold text-foreground bg-card-hover px-2.5 py-1 rounded-md border border-line inline-block">
                            {visual.typeLabel}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-bold text-foreground/90 whitespace-nowrap">
                          {service.unit}
                        </td>
                        <td className="px-4 sm:px-6 py-4 font-black text-emerald-600 text-sm whitespace-nowrap">
                          {formattedPrice}
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
                            <Button rounded="full"
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={e => handleToggleActive(service, e)}
                              className="shrink-0"
                              title={
                                isActive
                                  ? t('landlordServicesClickToDisable')
                                  : t('landlordServicesClickToEnable')
                              }
                            >
                              <span
                                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-2xs ring-0 transition duration-200 ease-in-out ${
                                  isActive ? 'translate-x-5' : 'translate-x-0'
                                }`}
                              />
                            </Button>
                            <span
                              className={`text-xs font-bold ${isActive ? 'text-emerald-600 font-black' : 'text-muted'}`}
                            >
                              {isActive
                                ? t('landlordServicesAlertStatusActive')
                                : t('landlordServicesAlertStatusInactive')}
                            </span>
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
                              <Edit3 className="w-3 h-3 text-[#2AC1BC]" />{' '}
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-card border border-line rounded-2xl shadow-xs mt-4">
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-muted">
          <div className="flex items-center gap-1.5 bg-surface px-2.5 py-1 rounded-xl border border-line">
            <span>{t('landlordServicesPaginationShowing')}</span>
            <NumberInput
              min={1}
              max={100}
              value={itemsPerPage || ''}
              onChange={e => {
                const val = parseInt(e.target.value, 10)
                setItemsPerPage(isNaN(val) || val <= 0 ? 1 : Math.min(val, 100))
                setCurrentPage(1)
              }}
              containerClassName="w-16 space-y-0"
              className="w-16 text-center font-extrabold text-foreground bg-card border border-line rounded-lg px-1 py-0.5 focus:outline-none focus:border-[#2AC1BC] text-xs h-7"
            />
            <span>{t('landlordServicesPaginationPerPage')}</span>
          </div>

          <span className="hidden sm:inline text-zinc-300">|</span>

          <div>
            <span className="font-extrabold text-foreground">
              {totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}
            </span>{' '}
            -{' '}
            <span className="font-extrabold text-foreground">
              {Math.min(currentPage * itemsPerPage, totalItems)}
            </span>{' '}
            {t('landlordServicesPaginationTotal', { total: totalItems })}
          </div>
        </div>

        {(() => {
          const windowSize = 5
          const windowStart = Math.floor((currentPage - 1) / windowSize) * windowSize + 1
          const windowEnd = Math.min(windowStart + windowSize - 1, totalPages)
          const visiblePages = Array.from(
            { length: windowEnd - windowStart + 1 },
            (_, i) => windowStart + i,
          )

          return (
            <div className="flex items-center gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
              >
                &larr; {t('landlordServicesPaginationPrev')}
              </Button>
              {visiblePages.map(page => (
                <Button
                  key={page}
                  type="button"
                  variant={currentPage === page ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentPage === totalPages || windowStart + windowSize > totalPages}
                onClick={() => setCurrentPage(Math.min(windowStart + windowSize, totalPages))}
              >
                {t('landlordServicesPaginationNext')} &rarr;
              </Button>
            </div>
          )
        })()}
      </div>

      {/* ADD / EDIT SERVICE MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) handleCloseModal()
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line flex flex-col max-h-[90vh]">
            <div className="px-5 sm:px-6 py-4 border-b border-line flex items-center justify-between bg-surface/80">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-accent-soft text-[#FF6B35] rounded-xl">
                  <Wrench className="w-5 h-5 text-[#2AC1BC]" />
                </div>
                <div>
                  <h3 className="font-black text-base sm:text-lg text-foreground">
                    {selectedService
                      ? t('landlordServicesModalEditTitle', { name: selectedService.name })
                      : t('landlordServicesModalAddTitle')}
                  </h3>
                  <p className="text-xs text-muted font-medium">
                    {t('landlordServicesModalSubtitle')}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCloseModal}
              >
                <Plus className="w-5 h-5 rotate-45" />
              </Button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
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
                className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
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
                  className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none bg-card cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none bg-card cursor-pointer"
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
                  className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
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
                  className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none transition-all"
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
                  className="w-full px-3.5 py-2.5 font-semibold border border-line rounded-xl focus:border-[#2AC1BC] focus:ring-4 focus:ring-[#2AC1BC]/10 outline-none bg-card cursor-pointer"
                />
              </div>
            </div>

            <div className="p-4 border-t border-line flex items-center justify-end gap-3 bg-surface">
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
            </div>
          </div>
        </div>
      )}

      {/* APPLIED ROOMS OVERVIEW MODAL */}
      {roomsModalService && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setRoomsModalService(null)
          }}
        >
          <div className="bg-card rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-line p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-line pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center border bg-primary-soft border-primary-subtle text-[#2AC1BC]">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-foreground">{roomsModalService.name}</h3>
                  <span className="text-xs text-muted font-medium">
                    {t('landlordServicesRoomsAppliedSubtitle', { count: serviceRooms.length })}
                  </span>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setRoomsModalService(null)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-surface rounded-xl space-y-1 border border-line">
                <span className="text-muted font-bold block">
                  {t('landlordServicesPrice')}:{' '}
                  <strong className="text-emerald-600 text-sm">
                    {roomsModalService.numericPrice.toLocaleString(isEn ? 'en-US' : 'vi-VN')} ₫
                  </strong>{' '}
                  / {roomsModalService.unit}
                </span>
                <span className="text-muted block font-medium">
                  {t('landlordServicesType')}:{' '}
                  {roomsModalService.isMetered
                    ? t('landlordServicesMetered')
                    : t('landlordServicesTypeFixed')}{' '}
                  (
                  {roomsModalService.autoApplied
                    ? t('landlordServicesMandatory')
                    : t('landlordServicesOptional')}
                  )
                </span>
              </div>

              <span className="font-extrabold text-foreground/90 block pt-2">
                {t('landlordServicesRoomsListTitle')}
              </span>

              {isLoadingRooms ? (
                <div className="py-8 flex justify-center items-center">
                  <Loader2 className="w-6 h-6 text-[#2AC1BC] animate-spin" />
                </div>
              ) : serviceRooms.length === 0 ? (
                <div className="py-6 text-center text-muted text-xs">
                  {t('landlordServicesRoomsEmpty')}
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto pr-1">
                  {serviceRooms.map(room => (
                    <div
                      key={room.id}
                      className="p-2 bg-surface border border-line rounded-xl text-center font-bold text-foreground text-xs"
                      title={`Tầng ${room.floor} - Trạng thái: ${room.status}`}
                    >
                      P.{room.roomNumber}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Button fullWidth
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setRoomsModalService(null)}
            >
              {t('landlordServicesRoomsClose')}
            </Button>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteTarget && (
        <div
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onMouseDown={e => {
            if (e.target === e.currentTarget) setDeleteTarget(null)
          }}
        >
          <div className="bg-card rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-line">
            <div className="w-14 h-14 bg-danger-soft border border-danger-subtle rounded-2xl flex items-center justify-center mx-auto text-rose-500 shadow-2xs">
              <Trash2 className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-black text-foreground tracking-tight">
                {t('landlordServicesDeleteTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed max-w-xs mx-auto">
                {t('landlordServicesDeleteMessage', { name: deleteTarget.name })}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
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
            </div>
          </div>
        </div>
      )}

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
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div className="bg-card rounded-3xl p-6 sm:p-7 shadow-2xl max-w-md w-full text-center space-y-5 animate-in zoom-in-95 duration-200 border border-line">
        <div className="w-14 h-14 bg-warning-soft border border-warning-subtle rounded-2xl flex items-center justify-center mx-auto text-amber-500 shadow-2xs">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-black text-foreground tracking-tight">{title}</h3>
          <p className="text-xs sm:text-sm text-muted font-medium leading-relaxed max-w-xs mx-auto">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
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
        </div>
      </div>
    </div>
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
  if (!isOpen) return null

  const config = {
    warning: {
      bgColor: 'bg-amber-500/10 text-amber-600 border-warning-subtle',
      icon: <AlertTriangle className="w-7 h-7 text-amber-500" />,
      btnColor: 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-500/20',
    },
    error: {
      bgColor: 'bg-rose-500/10 text-rose-600 border-danger-subtle',
      icon: <AlertCircle className="w-7 h-7 text-rose-500" />,
      btnColor: 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20',
    },
    success: {
      bgColor: 'bg-emerald-500/10 text-emerald-600 border-success-subtle',
      icon: <CheckCircle2 className="w-7 h-7 text-emerald-500" />,
      btnColor: 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-emerald-500/20',
    },
    info: {
      bgColor: 'bg-accent-soft text-[#FF6B35] border-accent-subtle',
      icon: <Info className="w-7 h-7 text-[#FF6B35]" />,
      btnColor: 'bg-[#FF6B35] hover:bg-[#e05a2b] text-white shadow-[#FF6B35]/20',
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

        <Button fullWidth variant="dark"
          onClick={onClose}
          size="sm"
        >
          {btnText || t('landlordServicesAlertUnderstand')}
        </Button>
      </div>
    </div>
  )
}
