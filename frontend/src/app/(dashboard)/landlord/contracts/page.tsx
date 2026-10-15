'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  Plus,
  Search,
  FileSignature,
  X,
  LayoutGrid,
  List,
  FileText,
  CalendarDays,
  Ban,
  ArrowLeft,
  Copy,
  Printer,
  Edit2,
  Zap,
  ClipboardList,
  UploadCloud,
  Users,
  Gauge,
  History,
  MapPin,
  FileSpreadsheet,
  CreditCard,
  Eye,
  Loader2,
  AlertTriangle,
  Building2,
  Home,
  User,
} from 'lucide-react'

import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { getLandlordContracts, ContractItem, exportContract } from '@/services/contract.service'
import ContractPreviewModal from '@/components/landlord/ContractPreviewModal'
import {
  Button,
  TextInput,
  DateInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  Checkbox,
  ToastContainer,
  ToastItem,
} from '@/components/ui'

function mapContractStatus(rawStatus: string): string {
  switch (rawStatus) {
    case 'active':
      return 'Đang hiệu lực'
    case 'draft':
      return 'Chờ xác nhận'
    case 'expired':
      return 'Quá hạn'
    case 'canceled':
      return 'Đã chấm dứt'
    default:
      return rawStatus
  }
}

export default function ContractsPage() {
  const { activeBuilding } = useAuth()
  const router = useRouter()
  const t = useTranslations('landlord')

  // Rule #10: Unsaved changes confirmation modal state
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const [modalPendingClose, setModalPendingClose] = useState<(() => void) | null>(null)
  const [isDirty, setIsDirty] = useState(false)

  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [contracts, setContracts] = useState<any[]>([])

  // Selection & UI views
  const [selectedContract, setSelectedContract] = useState<any>(null)
  const [isDetailViewOpen, setIsDetailViewOpen] = useState(false)
  const [isEditingContract, setIsEditingContract] = useState(false)

  // Filters & Pagination (Rule #9: Grid default 6, List default 10)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [rowsPerPage, setRowsPerPage] = useState(6)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Shared Modals
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false)
  const [isCheckoutNoticeModalOpen, setIsCheckoutNoticeModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false)
  const [editingService, setEditingService] = useState<any>(null)

  // Form states inside modals
  const [extendEndDate, setExtendEndDate] = useState('')
  const [extendRent, setExtendRent] = useState('')
  const [terminateDate, setTerminateDate] = useState('')
  const [terminateReason, setTerminateReason] = useState('')
  const [finalElecIndex, setFinalElecIndex] = useState('')
  const [finalWaterIndex, setFinalWaterIndex] = useState('')

  // Preview contract modal
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    contractId: string
    roomNumber: string
    tenantName?: string
  }>({
    isOpen: false,
    contractId: '',
    roomNumber: '',
    tenantName: '',
  })

  // Toast notifications using base ToastContainer
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const showToast = useCallback(
    (message: string, type: 'success' | 'error' | 'warning' | 'info' = 'success') => {
      const id = Date.now().toString() + Math.random().toString(36).substring(2, 5)
      setToasts(prev => [...prev, { id, message, type, duration: 4000 }])
    },
    [],
  )

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(tItem => tItem.id !== id))
  }, [])

  // Centralized Status Label mappings (Rule #14)
  const getContractStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'active':
        case 'Đang hiệu lực':
        case 'Còn hiệu lực':
          return t('landlordContractsStatusActive')
        case 'draft':
        case 'Chờ xác nhận':
          return t('landlordContractsStatusDraft')
        case 'expired':
        case 'Quá hạn':
          return t('landlordContractsStatusOverdue')
        case 'Sắp hết hạn':
          return t('landlordContractsStatusExpiring')
        case 'canceled':
        case 'Đã chấm dứt':
        case 'Chấm dứt':
          return t('landlordContractsStatusEnded')
        default:
          return status
      }
    },
    [t],
  )

  const getPaymentStatusLabel = useCallback(
    (status: string) => {
      switch (status) {
        case 'paid':
        case 'Đã thu đủ':
          return t('landlordContractsPaymentStatusPaid')
        case 'unpaid':
        case 'Còn nợ':
          return t('landlordContractsPaymentStatusUnpaid')
        default:
          return status
      }
    },
    [t],
  )

  // Default services localized via t(...)
  const [services, setServices] = useState<any[]>([])
  const [members, setMembers] = useState<any[]>([])

  useEffect(() => {
    setIsMounted(true)
    setServices([
      {
        id: 1,
        name: t('landlordContractsServiceSecurity'),
        type: t('landlordContractsServiceTypeFixed'),
        price: 50000,
        unit: t('landlordContractsServiceUnitRoom'),
        applied: true,
      },
      {
        id: 2,
        name: t('landlordContractsServiceElectricity'),
        type: t('landlordContractsServiceTypeMetered'),
        price: 3500,
        unit: t('landlordContractsServiceUnitKwh'),
        applied: true,
      },
      {
        id: 3,
        name: t('landlordContractsServiceWater'),
        type: t('landlordContractsServiceTypeMetered'),
        price: 25000,
        unit: t('landlordContractsServiceUnitM3'),
        applied: true,
      },
      {
        id: 4,
        name: t('landlordContractsServiceGarbage'),
        type: t('landlordContractsServiceTypeFixed'),
        price: 40000,
        unit: t('landlordContractsServiceUnitRoom'),
        applied: true,
      },
    ])
  }, [t])

  const fetchContracts = useCallback(async () => {
    if (!activeBuilding?.id) {
      setIsLoading(false)
      return
    }
    setIsLoading(true)
    setLoadError(null)
    try {
      const res = await getLandlordContracts(activeBuilding.id, { limit: 100 })
      if (res?.data && res.data.length > 0) {
        const mapped = res.data.map((c: ContractItem) => ({
          id: c.id,
          building: activeBuilding.id,
          room: c.room.roomNumber,
          roomType: c.room.roomTypeName || 'Studio',
          tenant: c.tenant?.fullName || t('landlordContractsTenantFallback'),
          tenantId: c.tenant?.id || 'KH-1',
          tenantPhone: c.tenant?.phoneNumber || '',
          startDate: new Date(c.startDate).toLocaleDateString('vi-VN'),
          endDate: new Date(c.endDate).toLocaleDateString('vi-VN'),
          isOverdue: new Date(c.endDate) < new Date() && c.status !== 'canceled',
          price: `${c.rentPrice.toLocaleString('vi-VN')} ₫`,
          rentPrice: c.rentPrice,
          deposit: `${c.depositAmount.toLocaleString('vi-VN')} ₫`,
          depositAmount: c.depositAmount,
          paymentDate: `${c.monthlyPaymentDate}`,
          paymentStatus: 'Đã thu đủ',
          status: mapContractStatus(c.status),
          documentsCount: c.documentsCount,
          createdAt: new Date(c.createdAt).toLocaleDateString('vi-VN'),
          history: [],
          members: [],
        }))
        setContracts(mapped)
      } else {
        setContracts([])
      }
    } catch (err: any) {
      console.warn('Could not load contracts from backend, using fallback data:', err)
      setLoadError(t('landlordContractsLoadError'))
    } finally {
      setIsLoading(false)
    }
  }, [activeBuilding?.id, t])

  useEffect(() => {
    fetchContracts()
  }, [fetchContracts])

  // Rule #10: Modal close handling with confirmation if unsaved changes exist
  const requestCloseModal = (closeFn: () => void) => {
    if (isDirty) {
      setModalPendingClose(() => closeFn)
      setShowCloseConfirm(true)
    } else {
      closeFn()
    }
  }

  const handleConfirmDiscard = () => {
    setShowCloseConfirm(false)
    setIsDirty(false)
    if (modalPendingClose) {
      modalPendingClose()
      setModalPendingClose(null)
    }
  }

  const formatDateToInput = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('/')
    if (parts.length === 3) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    return dateStr
  }

  const formatDateToDisplay = (dateStr: string) => {
    if (!dateStr) return ''
    const parts = dateStr.split('-')
    if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`
    return dateStr
  }

  // Export current contract list as CSV
  const handleExportCsv = () => {
    const headers = [
      t('landlordContractsCsvHeaderId'),
      t('landlordContractsCsvHeaderRoom'),
      t('landlordContractsCsvHeaderTenant'),
      t('landlordContractsCsvHeaderStartDate'),
      t('landlordContractsCsvHeaderEndDate'),
      t('landlordContractsCsvHeaderRentPrice'),
      t('landlordContractsCsvHeaderDeposit'),
      t('landlordContractsCsvHeaderStatus'),
    ]
    const rows = contracts.map((c: any) => [
      c.id,
      c.room,
      c.tenant,
      c.startDate,
      c.endDate,
      c.price,
      c.deposit,
      getContractStatusLabel(c.status),
    ])
    const csv = [headers, ...rows]
      .map(r => r.map((v: any) => `"${String(v).replace(/"/g, '""')}"`).join(','))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `contracts_${activeBuilding?.name || 'export'}_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    showToast(t('landlordContractsToastCsvExportSuccess'), 'success')
  }

  // Handle print/preview modal
  const handlePrintContract = (contract: any) => {
    setPreviewModal({
      isOpen: true,
      contractId: contract.id,
      roomNumber: contract.room,
      tenantName: contract.tenant,
    })
  }

  // Direct export of contract document (HTML/PDF)
  const handleExportContract = async (contract: any) => {
    if (!activeBuilding?.id) return
    try {
      showToast(t('landlordContractsToastDocExporting'), 'info')
      const res = await exportContract(activeBuilding.id, contract.id)
      if (res?.data) {
        showToast(t('landlordContractsToastDocExportSuccess'), 'success')
        fetchContracts()
        const blob = new Blob([res.data.html || ''], { type: 'text/html;charset=utf-8' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `hop-dong-phong-${String(contract.room).replace(/[^a-zA-Z0-9_-]/g, '_')}-${contract.id.substring(0, 8)}.html`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }
    } catch (err: any) {
      console.error('Failed to export contract:', err)
      showToast(err.message || t('landlordContractsToastDocExportFailed'), 'error')
    }
  }

  const handleTerminateContract = () => {
    if (!selectedContract) return
    const updated = contracts.map(c =>
      c.id === selectedContract.id ? { ...c, status: 'Đã chấm dứt' } : c,
    )
    setContracts(updated)
    setSelectedContract(updated.find(c => c.id === selectedContract.id))
    setIsTerminateModalOpen(false)
    setIsDirty(false)
    showToast(t('landlordContractsToastTerminateSuccess'), 'success')
  }

  const handleExtendContract = () => {
    if (!selectedContract || !extendEndDate) return
    const updated = contracts.map(c =>
      c.id === selectedContract.id ? { ...c, endDate: formatDateToDisplay(extendEndDate) } : c,
    )
    setContracts(updated)
    setSelectedContract(updated.find(c => c.id === selectedContract.id))
    setIsExtendModalOpen(false)
    setIsDirty(false)
    setExtendEndDate('')
    setExtendRent('')
    showToast(t('landlordContractsToastExtendSuccess'), 'success')
  }


  const copyToClipboard = (e: React.MouseEvent, text: string) => {
    e.stopPropagation()
    navigator.clipboard.writeText(text)
    showToast(t('landlordContractsToastCodeCopied'), 'success')
  }

  const handleSaveContract = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const reason = formData.get('reason') as string

    if (!reason || reason.trim() === '') {
      showToast(t('landlordContractsToastReasonRequired'), 'error')
      return
    }

    const updatedContract = {
      ...selectedContract,
      room: formData.get('room'),
      startDate: formatDateToDisplay(formData.get('startDate') as string),
      endDate: formatDateToDisplay(formData.get('endDate') as string),
      price: formData.get('price') + ' ₫',
      deposit: formData.get('deposit') + ' ₫',
      paymentDate: formData.get('paymentDate'),
    }

    const today = new Date().toLocaleDateString('vi-VN')
    updatedContract.history = [
      { date: today, user: 'Admin', content: reason },
      ...(updatedContract.history || []),
    ]

    setContracts(contracts.map(c => (c.id === selectedContract.id ? updatedContract : c)))
    setSelectedContract(updatedContract)
    setIsEditingContract(false)
    setIsDirty(false)
    showToast(t('landlordContractsToastUpdateContractSuccess'), 'success')
  }

  const handleSaveCheckoutNotice = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const date = formData.get('checkoutDate') as string
    const note = formData.get('checkoutNote') as string

    if (!date) {
      showToast(t('landlordContractsToastCheckoutDateRequired'), 'error')
      return
    }

    const updatedContract = {
      ...selectedContract,
      checkoutNotice: {
        date: formatDateToDisplay(date),
        note: note,
      },
    }

    setContracts(contracts.map(c => (c.id === selectedContract.id ? updatedContract : c)))
    setSelectedContract(updatedContract)
    setIsCheckoutNoticeModalOpen(false)
    setIsDirty(false)
    showToast(t('landlordContractsToastCheckoutSuccess'), 'success')
  }

  const handleSaveMember = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const customer = formData.get('customer') as string
    const relation = formData.get('relation') as string
    if (!customer) {
      showToast(t('landlordContractsToastCustomerRequired'), 'error')
      return
    }
    setMembers([...members, { name: customer, relation }])
    setIsAddMemberModalOpen(false)
    setIsDirty(false)
    showToast(t('landlordContractsToastAddMemberSuccess'), 'success')
  }

  const handleSaveService = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const name = formData.get('name') as string
    const priceStr = formData.get('price') as string
    const isApplied = formData.get('applied') === 'on'

    if (!name) {
      showToast(t('landlordContractsToastServiceNameRequired'), 'error')
      return
    }

    if (editingService) {
      if (!isApplied) {
        setServices(services.map(s => (s.id === editingService.id ? { ...s, applied: false } : s)))
      } else {
        setServices(
          services.map(s =>
            s.id === editingService.id
              ? { ...s, price: priceStr ? parseInt(priceStr) : s.price, applied: true }
              : s,
          ),
        )
      }
      showToast(t('landlordContractsToastUpdateServiceSuccess'), 'success')
    } else {
      setServices([
        ...services,
        {
          id: Date.now(),
          name,
          type: t('landlordContractsServiceTypeFixed'),
          price: priceStr ? parseInt(priceStr) : 0,
          unit: t('landlordContractsCurrencyVnd'),
          applied: true,
        },
      ])
      showToast(t('landlordContractsToastAddServiceSuccess'), 'success')
    }
    setIsServiceModalOpen(false)
    setEditingService(null)
    setIsDirty(false)
  }

  const filteredContracts = contracts.filter(c => {
    if (
      searchQuery &&
      !c.tenant.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.room.toLowerCase().includes(searchQuery.toLowerCase()) &&
      !c.id.toLowerCase().includes(searchQuery.toLowerCase())
    )
      return false
    if (statusFilter) {
      const displayStatus = getContractStatusLabel(c.status)
      const rawStatus = c.status
      if (rawStatus !== statusFilter && displayStatus !== statusFilter) return false
    }
    return true
  })

  const totalItems = filteredContracts.length
  const totalPages = Math.max(1, Math.ceil(totalItems / rowsPerPage))
  const paginatedContracts = filteredContracts.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  )


  const terminateReasonOptions = useMemo(
    () => [
      { value: '', label: t('landlordContractsTerminateReasonPlaceholder') },
      { value: '1', label: t('landlordContractsTerminateReason1') },
      { value: '2', label: t('landlordContractsTerminateReason2') },
      { value: '3', label: t('landlordContractsTerminateReason3') },
    ],
    [t],
  )

  const customerOptions = useMemo(
    () => [
      { value: '', label: t('landlordContractsAddMemberSelectPlaceholder') },
      { value: 'Trần Thị B', label: 'Trần Thị B' },
      { value: 'Nguyễn Văn A', label: 'Nguyễn Văn A' },
      { value: 'Lê Văn C', label: 'Lê Văn C' },
    ],
    [t],
  )

  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-6 relative min-h-screen">
      {/* Rule #10: Custom Confirm-Close Modal */}
      {showCloseConfirm && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-zinc-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <h3 className="text-base font-bold text-zinc-900 mb-2">
                {t('landlordContractsConfirmCloseTitle')}
              </h3>
              <p className="text-sm text-zinc-600">
                {t('landlordContractsConfirmCloseDesc')}
              </p>
            </div>
            <div className="flex items-center gap-3 px-6 pb-6">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowCloseConfirm(false)}
              >
                {t('landlordContractsConfirmCloseContinue')}
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                onClick={handleConfirmDiscard}
              >
                {t('landlordContractsConfirmCloseDiscard')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {selectedContract && isDetailViewOpen ? (
        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => {
                  setSelectedContract(null)
                  setIsDetailViewOpen(false)
                }}
                className="mt-1 p-2 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-5 h-5 text-zinc-600" />
              </button>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-zinc-900">
                    {t('landlordContractsRoomPrefix').replace('{room}', selectedContract.room)}
                  </h1>
                  <span
                    className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                      selectedContract.status === 'Đang hiệu lực' || selectedContract.status === 'Còn hiệu lực'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : selectedContract.status === 'Quá hạn' || selectedContract.status === 'Sắp hết hạn'
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    }`}
                  >
                    {getContractStatusLabel(selectedContract.status)}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mt-1 text-sm text-zinc-500">
                  <span className="font-medium text-zinc-700">
                    {activeBuilding?.name || 'Dormio Building'}
                  </span>
                  <span>·</span>
                  <span className="font-medium text-primary">{selectedContract.tenant}</span>
                  <span className="hidden sm:inline">|</span>
                  <span>
                    {t('landlordContractsContractCode')}: {selectedContract.id}
                  </span>
                  <button
                    onClick={e => copyToClipboard(e, selectedContract.id)}
                    className="hover:text-primary transition-colors cursor-pointer"
                    title={t('landlordContractsCopyCodeTitle')}
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExtendModalOpen(true)}
                leftIcon={<CalendarDays className="w-4 h-4" />}
              >
                {t('landlordContractsBtnExtend')}
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsTerminateModalOpen(true)}
                leftIcon={<Ban className="w-4 h-4" />}
              >
                {t('landlordContractsBtnTerminate')}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintContract(selectedContract)}
                title={t('landlordContractsPreviewPrintTitle')}
                leftIcon={<Printer className="w-4 h-4" />}
              >
                {t('landlordContractsBtnPrint')}
              </Button>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Thông tin hợp đồng */}
              <form
                onSubmit={handleSaveContract}
                onChange={() => setIsDirty(true)}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold text-zinc-900">
                      {t('landlordContractsContractInfoTitle')}
                    </h3>
                  </div>
                  {isEditingContract ? (
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setIsEditingContract(false)
                          setIsDirty(false)
                        }}
                      >
                        {t('landlordContractsBtnCancel')}
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        size="sm"
                      >
                        {t('landlordContractsBtnSaveChange')}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditingContract(true)}
                      leftIcon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      {t('landlordContractsBtnEdit')}
                    </Button>
                  )}
                </div>

                <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    {isEditingContract ? (
                      <TextInput
                        label={t('landlordRoomDetailRoomPrefix')}
                        name="room"
                        defaultValue={selectedContract.room}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordRoomDetailRoomPrefix')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {selectedContract.room}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditingContract ? (
                      <TextInput
                        label={t('landlordSetupTotalFloorLabel')}
                        name="building"
                        defaultValue={activeBuilding?.name || 'Dormio Building'}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordSetupTotalFloorLabel')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {activeBuilding?.name || 'Dormio Building'}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditingContract ? (
                      <DateInput
                        label={t('landlordContractsStartDateLabel')}
                        name="startDate"
                        defaultValue={formatDateToInput(selectedContract.startDate)}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordContractsStartDateLabel')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {selectedContract.startDate}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditingContract ? (
                      <DateInput
                        label={t('landlordContractsEndDateLabel')}
                        name="endDate"
                        defaultValue={formatDateToInput(selectedContract.endDate)}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordContractsEndDateLabel')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {selectedContract.endDate}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditingContract ? (
                      <NumberInput
                        label={t('landlordContractsRentPriceLabel')}
                        name="price"
                        defaultValue={selectedContract.rentPrice}
                        suffixText="₫"
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordContractsRentPriceLabel')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {selectedContract.price}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditingContract ? (
                      <NumberInput
                        label={t('landlordContractsDepositLabel')}
                        name="deposit"
                        defaultValue={selectedContract.depositAmount || 0}
                        suffixText="₫"
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordContractsDepositLabel')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {selectedContract.deposit}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    {isEditingContract ? (
                      <NumberInput
                        label={t('landlordContractsPaymentDateMonthlyLabel')}
                        name="paymentDate"
                        min={1}
                        max={31}
                        defaultValue={selectedContract.paymentDate || 5}
                      />
                    ) : (
                      <div>
                        <div className="text-sm font-medium text-zinc-500 mb-1.5">
                          {t('landlordContractsPaymentDateLabel')}
                        </div>
                        <div className="w-full px-3 py-2 text-sm font-semibold text-zinc-900 bg-zinc-50/50 rounded-lg border border-transparent">
                          {t('landlordContractsPaymentDateEveryMonth').replace(
                            '{day}',
                            selectedContract.paymentDate || '5',
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {isEditingContract && (
                  <div className="px-5 pb-5 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="border-t border-zinc-100 pt-5 mt-1">
                      <TextareaInput
                        label={t('landlordContractsEditReasonLabel')}
                        name="reason"
                        required
                        rows={3}
                        placeholder={t('landlordContractsEditReasonPlaceholder')}
                      />
                    </div>
                  </div>
                )}

                {/* Lịch sử thay đổi */}
                <div className="px-5 py-4 bg-zinc-50/30 border-t border-zinc-100">
                  <h4 className="text-sm font-semibold text-zinc-900 flex items-center gap-2 mb-3">
                    <History className="w-4 h-4 text-zinc-500" />
                    {t('landlordContractsHistoryTitle')}
                  </h4>
                  {selectedContract.history && selectedContract.history.length > 0 ? (
                    <div className="space-y-3 pl-1.5">
                      {selectedContract.history.map((item: any, idx: number) => (
                        <div key={idx} className="relative pl-4 border-l-2 border-primary/20">
                          <div className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-primary" />
                          <p className="text-sm font-medium text-zinc-800">{item.content}</p>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {item.date} • {item.user}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-zinc-500 italic">
                      {t('landlordContractsHistoryEmpty')}
                    </p>
                  )}
                </div>
              </form>

              {/* Thông báo trả phòng */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <CalendarDays className="w-4 h-4 text-amber-500" />
                  <h3 className="font-semibold text-zinc-900">
                    {t('landlordContractsCheckoutNoticeTitle')}
                  </h3>
                </div>
                <div className="p-5 flex flex-col gap-4">
                  {selectedContract.checkoutNotice ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm font-medium text-zinc-500 mb-1">
                            {t('landlordContractsCheckoutNoticeDate')}
                          </p>
                          <p className="text-sm font-semibold text-zinc-900">
                            {selectedContract.checkoutNotice.date}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-zinc-500 mb-1">
                            {t('landlordContractsCheckoutNoticeNote')}
                          </p>
                          <p className="text-sm font-semibold text-zinc-900">
                            {selectedContract.checkoutNotice.note ||
                              t('landlordContractsCheckoutNoticeNoNote')}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCheckoutNoticeModalOpen(true)}
                          leftIcon={<Edit2 className="w-4 h-4" />}
                        >
                          {t('landlordContractsCheckoutNoticeUpdate')}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-zinc-600">
                        {t('landlordContractsCheckoutNoticeEmpty')}
                      </p>
                      <div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setIsCheckoutNoticeModalOpen(true)}
                          leftIcon={<ClipboardList className="w-4 h-4" />}
                        >
                          {t('landlordContractsCheckoutNoticeBtn')}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Tài liệu hợp đồng */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <FileText className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-zinc-900">
                    {t('landlordContractsContractDocumentsTitle')}
                  </h3>
                </div>
                <div className="p-5">
                  <div
                    onClick={() => handleExportContract(selectedContract)}
                    className="border-2 border-dashed border-zinc-200 rounded-xl p-8 flex flex-col items-center justify-center text-center hover:border-primary hover:bg-primary/5 transition-colors cursor-pointer group"
                  >
                    <div className="p-3 bg-zinc-100 rounded-full group-hover:bg-primary/10 transition-colors mb-3">
                      <UploadCloud className="w-6 h-6 text-zinc-500 group-hover:text-primary" />
                    </div>
                    <h4 className="font-semibold text-zinc-900 text-sm">
                      {t('landlordContractsContractDocumentsUploadTitle')}
                    </h4>
                    <p className="text-xs text-zinc-500 mt-1">
                      {t('landlordContractsContractDocumentsUploadDesc')}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Khách thuê chính */}
              <div
                onClick={() => router.push(`/landlord/customers?id=${selectedContract.tenantId}`)}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-primary/30 transition-all group"
              >
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 group-hover:bg-primary/5 transition-colors">
                  <User className="w-4 h-4 text-primary" />
                  <h3 className="font-semibold text-zinc-900">
                    {t('landlordContractsPrimaryTenantTitle')}
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl group-hover:bg-primary/10 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-lg">
                      {selectedContract.tenant.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold text-zinc-900 text-sm">
                        {selectedContract.tenant}
                      </div>
                      <div className="text-xs text-zinc-500">{selectedContract.tenantPhone || '---'}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phòng thuê */}
              <div
                onClick={() => router.push(`/landlord/rooms?id=${selectedContract.room}`)}
                className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center gap-2 px-5 py-4 border-b border-zinc-100 bg-zinc-50/50 group-hover:bg-emerald-50/50 transition-colors">
                  <Home className="w-4 h-4 text-emerald-500" />
                  <h3 className="font-semibold text-zinc-900">
                    {t('landlordRoomDetailRoomPrefix')}
                  </h3>
                </div>
                <div className="p-5">
                  <div className="flex items-center gap-3 p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl group-hover:bg-emerald-100/50 transition-colors">
                    <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-emerald-700 text-sm">
                        {t('landlordContractsRoomPrefix').replace('{room}', selectedContract.room)}
                      </div>
                      <div className="text-xs text-emerald-600/80">{selectedContract.roomType}</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Thành viên */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-purple-500" />
                    <h3 className="font-semibold text-zinc-900">
                      {t('landlordContractsMembersTitle')}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddMemberModalOpen(true)}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    {t('landlordContractsModalAddMember')}
                  </Button>
                </div>
                <div className="p-0">
                  {members.length > 0 ? (
                    <div className="divide-y divide-zinc-100">
                      {members.map((m, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-4 hover:bg-zinc-50 transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-sm">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-zinc-900 text-sm">{m.name}</div>
                            <div className="text-xs text-zinc-500">{m.relation}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-5 text-center">
                      <p className="text-sm text-zinc-500">{t('landlordContractsMembersEmpty')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Dịch vụ */}
              <div className="bg-white border border-zinc-200 rounded-xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <h3 className="font-semibold text-zinc-900">
                      {t('landlordContractsServicesTitle')}
                    </h3>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingService(null)
                      setIsServiceModalOpen(true)
                    }}
                    leftIcon={<Plus className="w-3 h-3" />}
                  >
                    {t('landlordContractsModalServiceAdd')}
                  </Button>
                </div>
                <div className="p-0 divide-y divide-zinc-100">
                  {services
                    .filter(s => s.applied)
                    .map(service => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-zinc-900">{service.name}</span>
                          <span className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                            {service.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-amber-600">
                            {service.price > 0
                              ? `${service.price.toLocaleString('vi-VN')} ${service.unit}`
                              : t('landlordContractsServiceFree')}
                          </span>
                          <button
                            onClick={() => {
                              setEditingService(service)
                              setIsServiceModalOpen(true)
                            }}
                            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  {services.filter(s => s.applied).length === 0 && (
                    <div className="p-5 text-center">
                      <p className="text-sm text-zinc-500">{t('landlordContractsServicesEmpty')}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Notice Modal */}
          {isCheckoutNoticeModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-200">
              <form
                onSubmit={handleSaveCheckoutNotice}
                onChange={() => setIsDirty(true)}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900">
                    {t('landlordContractsCheckoutNoticeModalTitle')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => requestCloseModal(() => setIsCheckoutNoticeModalOpen(false))}
                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <DateInput
                    label={t('landlordContractsCheckoutNoticeDate')}
                    name="checkoutDate"
                    defaultValue={formatDateToInput(selectedContract.checkoutNotice?.date)}
                    required
                  />
                  <TextareaInput
                    label={t('landlordContractsCheckoutNoticeNote')}
                    name="checkoutNote"
                    defaultValue={selectedContract.checkoutNotice?.note}
                    placeholder={t('landlordContractsCheckoutNoticeNotePlaceholder')}
                    rows={3}
                  />
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => requestCloseModal(() => setIsCheckoutNoticeModalOpen(false))}
                  >
                    {t('landlordContractsBtnCancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {t('landlordContractsBtnSave')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Add Member Modal */}
          {isAddMemberModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-200">
              <form
                onSubmit={handleSaveMember}
                onChange={() => setIsDirty(true)}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900">
                    {t('landlordContractsAddMemberModalTitle')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => requestCloseModal(() => setIsAddMemberModalOpen(false))}
                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <SelectInput
                    label={t('landlordContractsAddMemberSelectCustomer')}
                    name="customer"
                    required
                    options={customerOptions}
                  />
                  <TextInput
                    label={t('landlordContractsAddMemberRelation')}
                    name="relation"
                    placeholder={t('landlordContractsAddMemberRelationPlaceholder')}
                  />
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => requestCloseModal(() => setIsAddMemberModalOpen(false))}
                  >
                    {t('landlordContractsBtnCancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {t('landlordContractsBtnSave')}
                  </Button>
                </div>
              </form>
            </div>
          )}

          {/* Service Modal */}
          {isServiceModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-200">
              <form
                onSubmit={handleSaveService}
                onChange={() => setIsDirty(true)}
                className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
              >
                <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100">
                  <h3 className="text-lg font-bold text-zinc-900">
                    {editingService
                      ? t('landlordContractsServiceEditModalTitle')
                      : t('landlordContractsModalServiceAdd')}
                  </h3>
                  <button
                    type="button"
                    onClick={() => requestCloseModal(() => {
                      setIsServiceModalOpen(false)
                      setEditingService(null)
                    })}
                    className="p-2 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="p-6 space-y-5">
                  <TextInput
                    label={t('landlordContractsServiceNameLabel')}
                    name="name"
                    defaultValue={editingService?.name || ''}
                    placeholder={t('landlordContractsServiceNamePlaceholder')}
                    disabled={!!editingService}
                    required
                  />
                  <NumberInput
                    label={t('landlordContractsServiceCustomPriceLabel')}
                    name="price"
                    defaultValue={editingService?.price || 0}
                    placeholder="0"
                    suffixText={t('landlordContractsCurrencyVnd')}
                  />
                  <TextInput
                    label={t('landlordContractsServiceReasonLabel')}
                    name="reason"
                    placeholder={t('landlordContractsServiceReasonPlaceholder')}
                  />
                  {editingService && (
                    <div className="pt-2">
                      <Checkbox
                        name="applied"
                        defaultChecked={editingService.applied}
                        label={t('landlordContractsServiceApplied')}
                      />
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-100 bg-zinc-50/50">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => requestCloseModal(() => {
                      setIsServiceModalOpen(false)
                      setEditingService(null)
                    })}
                  >
                    {t('landlordContractsBtnCancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                  >
                    {t('landlordContractsBtnSave')}
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500 pb-12">
          {/* Top Page Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-zinc-900">{t('landlordContractsTitle')}</h1>
              <p className="text-sm text-zinc-500">{t('landlordContractsSubtitle')}</p>
            </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => router.push('/landlord/contracts/create')}
                leftIcon={<Plus className="w-4 h-4" />}
              >
                {t('landlordContractsCreateBtn')}
              </Button>
          </div>

          {/* Building Overview Banner Card */}
          <div className="bg-zinc-900 rounded-2xl p-4 sm:p-6 text-white shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none transform translate-x-4 -translate-y-4">
              <FileSignature className="w-64 h-64" />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 sm:gap-6">
              <div className="space-y-3 max-w-xl w-full">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
                    {activeBuilding?.name || 'Dormio Building'}
                  </h2>
                  <span className="px-2.5 py-0.5 bg-[#2AC1BC]/20 text-[#2AC1BC] border border-[#2AC1BC]/30 text-[10px] font-black rounded-full uppercase tracking-wider shrink-0">
                    {t('landlordContractsBannerOperating')}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 sm:px-3 sm:py-1.5 bg-white/10 hover:bg-white/15 border border-white/15 rounded-xl transition-all w-full sm:w-auto">
                  <div className="flex items-center gap-2 min-w-0">
                    <MapPin className="w-4 h-4 text-[#2AC1BC] shrink-0" />
                    <span className="text-xs font-bold text-zinc-200 truncate sm:whitespace-normal">
                      {activeBuilding?.address || ''}
                    </span>
                  </div>
                  {activeBuilding?.address && (
                    <a
                      href={`https://maps.google.com/?q=${encodeURIComponent(activeBuilding.address)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="self-end sm:self-auto px-2.5 py-1 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-[10px] font-black rounded-lg transition-colors flex items-center gap-1 shrink-0"
                    >
                      <span>{t('landlordOverviewViewMap')}</span> &rarr;
                    </a>
                  )}
                </div>

                <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">
                  {t('landlordContractsBannerDesc')}
                </p>
              </div>

              {/* 4 Stat Chips */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:flex md:flex-row md:justify-end gap-2.5 sm:gap-3 w-full lg:w-auto mt-2 lg:mt-0">
                <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 transition-colors rounded-xl border border-rose-500/30 backdrop-blur-md w-full lg:w-[135px]">
                  <FileSignature className="w-4.5 sm:w-5 h-4.5 sm:h-5 text-rose-500 shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-rose-400 tracking-wider">
                      {t('landlordContractsStatTotal')}
                    </span>
                    <span className="font-black text-rose-500 text-base sm:text-lg leading-none mt-1">
                      {contracts.length}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#2AC1BC]/10 hover:bg-[#2AC1BC]/20 transition-colors rounded-xl border border-[#2AC1BC]/30 backdrop-blur-md w-full lg:w-[135px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#2AC1BC] shadow-[0_0_8px_rgba(42,193,188,0.8)] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-[#2AC1BC] tracking-wider">
                      {t('landlordContractsStatActive')}
                    </span>
                    <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                      {
                        contracts.filter(
                          c => c.status === 'Còn hiệu lực' || c.status === 'Đang hiệu lực',
                        ).length
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-[#FF6B35]/10 hover:bg-[#FF6B35]/20 transition-colors rounded-xl border border-[#FF6B35]/30 backdrop-blur-md w-full lg:w-[135px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#FF6B35] shadow-[0_0_8px_rgba(255,107,53,0.8)] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-[#FF6B35] tracking-wider">
                      {t('landlordContractsStatExpiring')}
                    </span>
                    <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                      {
                        contracts.filter(c => c.status === 'Sắp hết hạn' || c.status === 'Quá hạn')
                          .length
                      }
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 sm:gap-3 px-3 sm:px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 transition-colors rounded-xl border border-blue-500/30 backdrop-blur-md w-full lg:w-[135px]">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)] shrink-0" />
                  <div className="flex flex-col">
                    <span className="text-[9px] uppercase font-bold text-blue-400 tracking-wider">
                      {t('landlordContractsStatEnded')}
                    </span>
                    <span className="font-black text-white text-base sm:text-lg leading-none mt-1">
                      {
                        contracts.filter(c => c.status === 'Chấm dứt' || c.status === 'Đã chấm dứt')
                          .length
                      }
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Single Row Toolbar (Filter Pills + Search Bar + View Mode) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-3 shadow-2xs">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              {/* Status Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 flex-1 min-w-0">
                {[
                  { label: t('landlordContractsFilterAll'), value: '' },
                  { label: t('landlordContractsFilterActive'), value: 'Đang hiệu lực' },
                  { label: t('landlordContractsFilterExpiring'), value: 'Sắp hết hạn' },
                  { label: t('landlordContractsFilterOverdue'), value: 'Quá hạn' },
                  { label: t('landlordContractsFilterEnded'), value: 'Đã chấm dứt' },
                ].map(tab => {
                  const isActive = statusFilter === tab.value
                  return (
                    <button
                      key={tab.value}
                      onClick={() => {
                        setStatusFilter(tab.value)
                        setCurrentPage(1)
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                        isActive
                          ? 'bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/20'
                          : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100 border border-zinc-200/80'
                      }`}
                    >
                      {tab.label}
                    </button>
                  )
                })}
              </div>

              {/* Search & View Mode */}
              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
                <div className="w-full sm:w-64">
                  <TextInput
                    placeholder={t('landlordContractsSearchPlaceholder')}
                    value={searchQuery}
                    onChange={e => {
                      setSearchQuery(e.target.value)
                      setCurrentPage(1)
                    }}
                    leftIcon={<Search className="w-4 h-4 text-zinc-400" />}
                    className="bg-zinc-50 focus:bg-white text-xs"
                  />
                </div>

                <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl border border-zinc-200 shrink-0">
                  <button
                    onClick={() => {
                      setViewMode('grid')
                      setRowsPerPage(6)
                      setCurrentPage(1)
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'grid'
                        ? 'bg-white text-[#2AC1BC] shadow-2xs font-extrabold'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title={t('landlordContractsGridView')}
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => {
                      setViewMode('list')
                      setRowsPerPage(10)
                      setCurrentPage(1)
                    }}
                    className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                      viewMode === 'list'
                        ? 'bg-white text-[#2AC1BC] shadow-2xs font-extrabold'
                        : 'text-zinc-500 hover:text-zinc-900'
                    }`}
                    title={t('landlordContractsListView')}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white border border-zinc-200/80 rounded-2xl">
              <Loader2 className="w-8 h-8 text-[#2AC1BC] animate-spin" />
              <p className="text-sm font-semibold text-zinc-500">
                {t('landlordContractsLoading')}
              </p>
            </div>
          )}

          {/* Error State */}
          {!isLoading && loadError && (
            <div className="flex flex-col items-center justify-center gap-3 py-16 bg-white border border-rose-200 rounded-2xl">
              <AlertTriangle className="w-8 h-8 text-rose-500" />
              <p className="text-sm font-semibold text-rose-600">{loadError}</p>
              <Button
                variant="primary"
                size="sm"
                onClick={fetchContracts}
              >
                {t('landlordContractsRetry')}
              </Button>
            </div>
          )}

          {/* Grid / Table View */}
          {!isLoading && !loadError && (
            <>
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {paginatedContracts.length === 0 ? (
                    <div className="col-span-full p-8 text-center text-zinc-400 font-bold bg-white border border-zinc-200/80 rounded-2xl">
                      {t('landlordContractsNoContractsFound')}
                    </div>
                  ) : (
                    paginatedContracts.map((c, idx) => {
                      return (
                        <div
                          key={c.id || idx}
                          onClick={() => {
                            setSelectedContract(c)
                            setIsDetailViewOpen(true)
                          }}
                          className="bg-white border border-zinc-200/80 hover:border-[#2AC1BC]/40 rounded-2xl p-4 sm:p-5 shadow-2xs hover:shadow-md transition-all cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                        >
                          <div>
                            {/* Card Header: Room & Status */}
                            <div className="flex items-start justify-between gap-3 pb-3 border-b border-zinc-100">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-black text-base text-zinc-900 group-hover:text-[#2AC1BC] transition-colors">
                                    {t('landlordRoomDetailRoomPrefix')} {c.room}
                                  </h3>
                                  <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                    {activeBuilding?.name || 'Dormio'}
                                  </span>
                                </div>
                                <div className="text-[11px] text-zinc-400 font-bold flex items-center gap-1 mt-0.5">
                                  <span>
                                    {t('landlordContractsContractCodeShort')} {c.id}
                                  </span>
                                  <button
                                    onClick={e => copyToClipboard(e, c.id)}
                                    className="p-0.5 hover:text-[#2AC1BC] transition-colors rounded cursor-pointer"
                                    title={t('landlordContractsCopyCodeTitle')}
                                  >
                                    <Copy className="w-3 h-3 text-zinc-400 hover:text-[#2AC1BC]" />
                                  </button>
                                </div>
                              </div>

                              <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-full border shrink-0 ${
                                  c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                                      : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                      ? 'bg-emerald-500'
                                      : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                        ? 'bg-amber-500'
                                        : 'bg-zinc-400'
                                  }`}
                                />
                                {getContractStatusLabel(c.status)}
                              </span>
                            </div>

                            {/* Card Body */}
                            <div className="py-3 space-y-2.5">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-zinc-400" />
                                  {t('landlordContractsRepresentative')}
                                </span>
                                <div className="flex flex-col items-end">
                                  <span className="font-extrabold text-zinc-900">{c.tenant}</span>
                                  {c.members && c.members.length > 0 && (
                                    <span className="text-[10px] font-bold text-zinc-500 flex items-center gap-1">
                                      <Users className="w-3 h-3 text-zinc-400" />
                                      {t('landlordContractsRoommatesCount').replace(
                                        '{count}',
                                        String(c.members.length),
                                      )}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                                  {t('landlordContractsRentPriceLabel')}:
                                </span>
                                <span className="font-black text-sm text-[#2AC1BC]">
                                  {c.price} {t('landlordContractsPerMonth')}
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs">
                                <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                                  <CalendarDays className="w-3.5 h-3.5 text-zinc-400" />
                                  {t('landlordContractsDurationLabel')}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-zinc-800">
                                    {c.startDate} - {c.endDate}
                                  </span>
                                  {c.isOverdue && (
                                    <span className="px-1.5 py-0.5 text-[9px] font-black rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                                      {t('landlordContractsDueExpired')}
                                    </span>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100">
                                <span className="text-zinc-500 font-semibold flex items-center gap-1.5">
                                  <CreditCard className="w-3.5 h-3.5 text-zinc-400" />
                                  {t('landlordContractsPaymentLabel')}
                                </span>
                                <span
                                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${
                                    c.paymentStatus === 'Đã thu đủ'
                                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                      : 'bg-rose-50 text-rose-700 border-rose-200'
                                  }`}
                                >
                                  {getPaymentStatusLabel(c.paymentStatus)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Card Footer Actions */}
                          <div className="pt-3 border-t border-zinc-100 flex items-center justify-between gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="bg-[#2AC1BC]/10 hover:bg-[#2AC1BC] text-[#2AC1BC] hover:text-white border-[#2AC1BC]/30 text-xs font-extrabold"
                              onClick={e => {
                                e.stopPropagation()
                                setSelectedContract(c)
                                setIsDetailViewOpen(true)
                              }}
                              leftIcon={<Eye className="w-3.5 h-3.5" />}
                            >
                              {t('landlordContractsBtnDetail')}
                            </Button>
                            <div className="flex items-center gap-1.5">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 bg-zinc-50 hover:bg-zinc-200 text-zinc-600 rounded-xl"
                                onClick={e => {
                                  e.stopPropagation()
                                  handlePrintContract(c)
                                }}
                                title={t('landlordContractsPrintExportTitle')}
                              >
                                <Printer className="w-3.5 h-3.5 text-zinc-700" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white border-emerald-200 text-xs font-bold"
                                onClick={e => {
                                  e.stopPropagation()
                                  setSelectedContract(c)
                                  setIsExtendModalOpen(true)
                                }}
                                leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
                              >
                                {t('landlordContractsBtnExtend')}
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border-rose-200 text-xs font-bold"
                                onClick={e => {
                                  e.stopPropagation()
                                  setSelectedContract(c)
                                  setIsTerminateModalOpen(true)
                                }}
                                leftIcon={<Ban className="w-3.5 h-3.5" />}
                              >
                                {t('landlordContractsBtnTerminate')}
                              </Button>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>
              ) : (
                /* Table View */
                <div className="bg-white border border-zinc-200/80 rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                    <table className="w-full min-w-[850px] text-xs text-left border-collapse">
                      <thead className="text-[11px] font-black text-zinc-500 uppercase bg-zinc-100/90 backdrop-blur-md border-b border-zinc-200/80 sticky top-0 z-20 shadow-xs">
                        <tr>
                          <th className="px-5 py-3.5 whitespace-nowrap">
                            {t('landlordContractsTableHeaderRoomCode')}
                          </th>
                          <th className="px-5 py-3.5 whitespace-nowrap">
                            {t('landlordContractsTableHeaderTenant')}
                          </th>
                          <th className="px-5 py-3.5 whitespace-nowrap">
                            {t('landlordContractsTableHeaderDuration')}
                          </th>
                          <th className="px-5 py-3.5 whitespace-nowrap">
                            {t('landlordContractsTableHeaderPrice')}
                          </th>
                          <th className="px-5 py-3.5 whitespace-nowrap">
                            {t('landlordContractsTableHeaderPayment')}
                          </th>
                          <th className="px-5 py-3.5 whitespace-nowrap">
                            {t('landlordContractsTableHeaderStatus')}
                          </th>
                          <th className="px-5 py-3.5 text-right whitespace-nowrap">
                            {t('landlordContractsTableHeaderAction')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {paginatedContracts.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-zinc-400 font-bold">
                              {t('landlordContractsNoContractsFound')}
                            </td>
                          </tr>
                        ) : (
                          paginatedContracts.map((c, idx) => {
                            return (
                              <tr
                                key={c.id || idx}
                                onClick={() => {
                                  setSelectedContract(c)
                                  setIsDetailViewOpen(true)
                                }}
                                className="hover:bg-zinc-50/80 transition-colors group cursor-pointer"
                              >
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="flex flex-col gap-0.5">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-sm text-[#2AC1BC]">
                                        {t('landlordRoomDetailRoomPrefix')} {c.room}
                                      </span>
                                      <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                                        {activeBuilding?.name || 'Dormio'}
                                      </span>
                                    </div>
                                    <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 font-bold">
                                      <span>{c.id}</span>
                                      <button
                                        onClick={e => copyToClipboard(e, c.id)}
                                        className="p-1 hover:text-[#2AC1BC] transition-colors hover:bg-zinc-100 rounded cursor-pointer"
                                        title={t('landlordContractsCopyCodeTitle')}
                                      >
                                        <Copy className="w-3 h-3 text-zinc-400 hover:text-[#2AC1BC]" />
                                      </button>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="font-extrabold text-zinc-900 text-sm">
                                      {c.tenant}
                                    </span>
                                    <span className="text-[11px] text-zinc-400 font-bold">
                                      {c.tenantPhone || '---'}
                                    </span>
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="font-bold text-zinc-800">
                                      {c.startDate} - {c.endDate}
                                    </span>
                                    {c.isOverdue && (
                                      <span className="text-[10px] font-black text-rose-600">
                                        {t('landlordContractsDueExpired')}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span className="font-black text-sm text-[#2AC1BC]">
                                    {c.price}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-extrabold rounded-full border ${
                                      c.paymentStatus === 'Đã thu đủ'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-rose-50 text-rose-700 border-rose-200'
                                    }`}
                                  >
                                    {getPaymentStatusLabel(c.paymentStatus)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 whitespace-nowrap">
                                  <span
                                    className={`inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-extrabold rounded-full border ${
                                      c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                                          : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        c.status === 'Đang hiệu lực' || c.status === 'Còn hiệu lực'
                                          ? 'bg-emerald-500'
                                          : c.status === 'Sắp hết hạn' || c.status === 'Quá hạn'
                                            ? 'bg-amber-500'
                                            : 'bg-zinc-400'
                                      }`}
                                    />
                                    {getContractStatusLabel(c.status)}
                                  </span>
                                </td>
                                <td className="px-5 py-4 text-right whitespace-nowrap">
                                  <div className="flex items-center justify-end gap-1 text-zinc-400">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-primary hover:bg-primary/10"
                                      onClick={e => {
                                        e.stopPropagation()
                                        setSelectedContract(c)
                                        setIsExtendModalOpen(true)
                                      }}
                                      title={t('landlordContractsBtnExtend')}
                                    >
                                      <CalendarDays className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100"
                                      onClick={e => {
                                        e.stopPropagation()
                                        handlePrintContract(c)
                                      }}
                                      title={t('landlordContractsPrintExportTitle')}
                                    >
                                      <Printer className="w-4 h-4 text-[#2AC1BC]" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-zinc-400 hover:text-rose-600 hover:bg-rose-50"
                                      onClick={e => {
                                        e.stopPropagation()
                                        setSelectedContract(c)
                                        setIsTerminateModalOpen(true)
                                      }}
                                      title={t('landlordContractsBtnTerminate')}
                                    >
                                      <Ban className="w-4 h-4" />
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
              )}

              {/* Standardized Pagination Footer (Rule #9) */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white border border-zinc-200/80 rounded-2xl shadow-xs mt-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-zinc-500">
                  <div className="flex items-center gap-1.5 bg-zinc-50 px-2.5 py-1 rounded-xl border border-zinc-200/80">
                    <span>{t('landlordContractsPaginationShowing')}</span>
                    <NumberInput
                      min={1}
                      max={500}
                      value={rowsPerPage || 1}
                      onChange={e => {
                        const val = parseInt(e.target.value)
                        setRowsPerPage(isNaN(val) || val <= 0 ? 1 : val)
                        setCurrentPage(1)
                      }}
                      className="w-14 text-center font-extrabold text-zinc-900 bg-white border border-zinc-200 rounded-lg px-1 py-0.5 text-xs"
                    />
                    <span>{t('landlordContractsPaginationPerPage')}</span>
                  </div>

                  <span className="hidden sm:inline text-zinc-300">|</span>

                  <div>
                    <span className="font-extrabold text-zinc-800">
                      {totalItems === 0 ? 0 : (currentPage - 1) * rowsPerPage + 1}
                    </span>{' '}
                    -{' '}
                    <span className="font-extrabold text-zinc-800">
                      {Math.min(currentPage * rowsPerPage, totalItems)}
                    </span>{' '}
                    {t('landlordContractsPaginationOf')}{' '}
                    <span className="font-extrabold text-zinc-800">{totalItems}</span>{' '}
                    {t('landlordContractsPaginationTotalContracts')}
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
                        variant="outline"
                        size="sm"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(Math.max(windowStart - windowSize, 1))}
                      >
                        &larr; {t('landlordContractsPaginationPrev')}
                      </Button>
                      {visiblePages.map(page => (
                        <button
                          key={page}
                          onClick={() => setCurrentPage(page)}
                          className={`w-8 h-8 text-xs font-extrabold rounded-xl transition-all cursor-pointer ${
                            currentPage === page
                              ? 'bg-[#2AC1BC] text-white shadow-2xs shadow-[#2AC1BC]/30'
                              : 'bg-white border border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                          }`}
                        >
                          {page}
                        </button>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={currentPage === totalPages || windowStart + windowSize > totalPages}
                        onClick={() =>
                          setCurrentPage(Math.min(windowStart + windowSize, totalPages))
                        }
                      >
                        {t('landlordContractsPaginationNext')} &rarr;
                      </Button>
                    </div>
                  )
                })()}
              </div>


            </>
          )}
        </div>
      )}


      {/* Extend Contract Modal */}
      {isExtendModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onMouseDown={e => {
            if (e.target === e.currentTarget) requestCloseModal(() => setIsExtendModalOpen(false))
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-zinc-900">
                {t('landlordContractsExtendModalTitle')}
              </h2>
              <button
                onClick={() => requestCloseModal(() => setIsExtendModalOpen(false))}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <DateInput
                label={t('landlordContractsExtendEndDateLabel')}
                required
                value={extendEndDate}
                onChange={e => {
                  setExtendEndDate(e.target.value)
                  setIsDirty(true)
                }}
              />
              <NumberInput
                label={t('landlordContractsExtendNewRentLabel')}
                placeholder="3000000"
                suffixText={t('landlordContractsCurrencyVnd')}
                helperText={t('landlordContractsExtendNewRentHint')}
                value={extendRent}
                onChange={e => {
                  setExtendRent(e.target.value)
                  setIsDirty(true)
                }}
              />
            </div>
            <div className="p-6 pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => requestCloseModal(() => setIsExtendModalOpen(false))}
              >
                {t('landlordContractsBtnCancel')}
              </Button>
              <Button
                variant="primary"
                onClick={handleExtendContract}
              >
                {t('landlordContractsBtnExtend')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Contract Modal */}
      {isTerminateModalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md animate-in fade-in duration-300"
          onMouseDown={e => {
            if (e.target === e.currentTarget) requestCloseModal(() => setIsTerminateModalOpen(false))
          }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-6 border-b border-zinc-100">
              <h2 className="text-xl font-bold text-rose-600">
                {t('landlordContractsTerminateModalTitle')}
              </h2>
              <button
                onClick={() => requestCloseModal(() => setIsTerminateModalOpen(false))}
                className="p-2 text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              <DateInput
                label={t('landlordContractsTerminatedDateLabel')}
                required
                value={terminateDate}
                onChange={e => {
                  setTerminateDate(e.target.value)
                  setIsDirty(true)
                }}
              />

              <SelectInput
                label={t('landlordContractsTerminateReasonLabel')}
                required
                value={terminateReason}
                onChange={e => {
                  setTerminateReason(e.target.value)
                  setIsDirty(true)
                }}
                options={terminateReasonOptions}
              />

              <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50/50 space-y-4">
                <div className="flex items-center gap-2 text-primary font-medium">
                  <Gauge className="w-4 h-4" />
                  <span>{t('landlordContractsTerminateEndIndexTitle')}</span>
                </div>
                <p className="text-xs text-zinc-500">
                  {t('landlordContractsTerminateEndIndexHint')}
                </p>

                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-12 text-zinc-800">
                      {t('landlordContractsTerminateLastElec')}
                    </span>
                    <span className="text-sm text-zinc-500 whitespace-nowrap min-w-[50px]">
                      {t('landlordContractsTerminateLastOldPrefix')} 11
                    </span>
                    <div className="flex-1">
                      <NumberInput
                        placeholder={t('landlordContractsTerminateNewIndexPlaceholder')}
                        suffixText="kWh"
                        value={finalElecIndex}
                        onChange={e => {
                          setFinalElecIndex(e.target.value)
                          setIsDirty(true)
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm font-semibold w-12 text-zinc-800">
                      {t('landlordContractsTerminateLastWater')}
                    </span>
                    <span className="text-sm text-zinc-500 whitespace-nowrap min-w-[50px]">
                      {t('landlordContractsTerminateLastOldPrefix')} 12
                    </span>
                    <div className="flex-1">
                      <NumberInput
                        placeholder={t('landlordContractsTerminateNewIndexPlaceholder')}
                        suffixText="m³"
                        value={finalWaterIndex}
                        onChange={e => {
                          setFinalWaterIndex(e.target.value)
                          setIsDirty(true)
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-6 pt-2 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => requestCloseModal(() => setIsTerminateModalOpen(false))}
              >
                {t('landlordContractsBtnCancel')}
              </Button>
              <Button
                variant="danger"
                onClick={handleTerminateContract}
              >
                {t('landlordContractsBtnTerminate')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Contract Print / Preview Modal */}
      {previewModal.isOpen && (
        <ContractPreviewModal
          isOpen={previewModal.isOpen}
          onClose={() => setPreviewModal(prev => ({ ...prev, isOpen: false }))}
          buildingId={activeBuilding?.id || ''}
          contractId={previewModal.contractId}
          roomNumber={previewModal.roomNumber}
          tenantName={previewModal.tenantName}
        />
      )}

      {/* Centralized Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
