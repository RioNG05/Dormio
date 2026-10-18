'use client'

import React, { useState, useEffect, use, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft,
  Edit2,
  Trash2,
  User,
  Phone,
  CreditCard,
  Home,
  Clock,
  FileText,
  CalendarDays,
  Ban,
  Printer,
  Crown,
  Copy,
  Plus,
  X,
  Search,
  Banknote,
  Building2,
  AlertTriangle,
  Users,
} from 'lucide-react'
import { getContractById, Contract, ContractMember } from '../data'
import { Customer } from '../../customers/data'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import { useSubscriptionTier } from '@/hooks'
import { getContractById as getContractByIdApi } from '@/services/contract.service'
import ContractPreviewModal from '@/components/landlord/ContractPreviewModal'
import {
  Button,
  TextInput,
  DateInput,
  NumberInput,
  SelectInput,
  TextareaInput,
  SearchInput,
  ToastContainer,
  ToastItem,
  ToastType,
  Modal,
  Text,
} from '@/components/ui'

export default function ContractDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const { activeBuilding } = useAuth()
  const t = useTranslations('landlord')

  const [contract, setContract] = useState<Contract | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)

  // Subscription tier guard (Requires Plus tier for printing & exporting contracts)
  const { isPlusOrHigher, requireTier, isLoading: isTierLoading } = useSubscriptionTier()

  const handlePrintContract = () => {
    if (
      !requireTier(
        'plus',
        t('landlordContractDetailTierRequiredMsg') ||
          'Tính năng in và xuất văn bản hợp đồng pháp lý yêu cầu nâng cấp lên gói Plus.',
      )
    ) {
      return
    }
    setIsPreviewModalOpen(true)
  }

  // Modals
  const [isExtendModalOpen, setIsExtendModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isTerminateModalOpen, setIsTerminateModalOpen] = useState(false)
  const [isAddMemberModalOpen, setIsAddMemberModalOpen] = useState(false)

  // Rule 10: Modal reset & unsaved change confirmation
  const [isDirty, setIsDirty] = useState(false)
  const [showConfirmClose, setShowConfirmClose] = useState(false)
  const [pendingCloseAction, setPendingCloseAction] = useState<(() => void) | null>(null)

  // Toast notifications using base ToastContainer
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const showToast = useCallback(
    (message: string, type: ToastType = 'info', title?: string) => {
      const id = Date.now().toString()
      setToasts(prev => [...prev, { id, message, type, title, duration: 4000 }])
    },
    [],
  )
  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(tItem => tItem.id !== id))
  }, [])

  // Form states for contract edit
  const [editPrice, setEditPrice] = useState('')
  const [editDeposit, setEditDeposit] = useState('')
  const [editPaymentDate, setEditPaymentDate] = useState('5')
  const [editEndDate, setEditEndDate] = useState('')
  const [editReason, setEditReason] = useState('')

  // Form states for member add (Dual-mode: select vs create)
  const [addMemberTab, setAddMemberTab] = useState<'select' | 'create'>('select')
  const [existingCustomers, setExistingCustomers] = useState<Customer[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState('')
  const [memberSearchQuery, setMemberSearchQuery] = useState('')
  const [newMemberName, setNewMemberName] = useState('')
  const [newMemberRelation, setNewMemberRelation] = useState('Gia đình')
  const [newMemberPhone, setNewMemberPhone] = useState('')
  const [newMemberCccd, setNewMemberCccd] = useState('')
  const [newMemberDob, setNewMemberDob] = useState('')
  const [newMemberGender, setNewMemberGender] = useState<'nam' | 'nu'>('nam')
  const [newMemberAddress, setNewMemberAddress] = useState('')
  const [newMemberJob, setNewMemberJob] = useState('')
  const [newMemberWorkplace, setNewMemberWorkplace] = useState('')

  // Form states for extension
  const [extendEndDate, setExtendEndDate] = useState('')

  // Request close with unsaved confirmation
  const requestCloseModal = (closeAction: () => void) => {
    if (isDirty) {
      setPendingCloseAction(() => closeAction)
      setShowConfirmClose(true)
    } else {
      closeAction()
    }
  }

  const handleConfirmDiscard = () => {
    setIsDirty(false)
    setShowConfirmClose(false)
    if (pendingCloseAction) {
      pendingCloseAction()
      setPendingCloseAction(null)
    }
  }

  // Open modal helpers with form reset
  const openExtendModal = () => {
    setExtendEndDate('')
    setIsDirty(false)
    setIsExtendModalOpen(true)
  }

  const openEditModal = () => {
    if (contract) {
      setEditPrice(contract.price.replace(/[^\d]/g, ''))
      setEditDeposit(contract.deposit.replace(/[^\d]/g, ''))
      setEditPaymentDate(contract.paymentDate || '5')
      setEditEndDate(contract.endDate)
    }
    setEditReason('')
    setIsDirty(false)
    setIsEditModalOpen(true)
  }

  const openAddMemberModal = () => {
    setAddMemberTab('select')
    setSelectedCustomerId('')
    setMemberSearchQuery('')
    setNewMemberName('')
    setNewMemberRelation('Gia đình')
    setNewMemberPhone('')
    setNewMemberCccd('')
    setNewMemberDob('')
    setNewMemberGender('nam')
    setNewMemberAddress('')
    setNewMemberJob('')
    setNewMemberWorkplace('')
    setIsDirty(false)
    setIsAddMemberModalOpen(true)
  }

  useEffect(() => {
    setIsMounted(true)
    setExistingCustomers([])
    const contractId = resolvedParams.id ? decodeURIComponent(resolvedParams.id) : ''
    if (!contractId) return

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      contractId,
    )

    if (activeBuilding?.id && isUuid) {
      getContractByIdApi(activeBuilding.id, contractId)
        .then(res => {
          if (res?.data) {
            const d = res.data
            const mappedContract: Contract = {
              id: d.id,
              building: activeBuilding.id,
              buildingName: activeBuilding.name,
              buildingSeq: 1,
              room: d.room?.roomNumber || '—',
              roomType: d.room?.roomTypeName || 'Tiêu chuẩn',
              tenant: d.tenant?.fullName || 'Khách thuê',
              tenantPhone: d.tenant?.phoneNumber || '—',
              tenantCccd: d.tenant?.userIdentification?.identityNumber || '—',
              tenantId: d.tenant?.id || '',
              startDate: new Date(d.startDate).toLocaleDateString('vi-VN'),
              endDate: new Date(d.endDate).toLocaleDateString('vi-VN'),
              signDate: new Date(d.createdAt).toLocaleDateString('vi-VN'),
              isOverdue: new Date(d.endDate) < new Date() && d.status !== 'canceled',
              price: `${Number(d.rentPrice).toLocaleString('vi-VN')} ₫`,
              priceNumber: Number(d.rentPrice),
              deposit: `${Number(d.deposit?.amount || d.rentPrice).toLocaleString('vi-VN')} ₫`,
              depositNumber: Number(d.deposit?.amount || d.rentPrice),
              paymentDate: `${d.monthlyPaymentDate}`,
              paymentStatus: 'Đã thu đủ',
              status:
                d.status === 'active'
                  ? 'Đang hiệu lực'
                  : d.status === 'canceled'
                    ? 'Đã chấm dứt'
                    : 'Quá hạn',
              history: [],
              members: [],
              services: (d.room?.services || []).map((s: any, idx: number) => ({
                id: idx + 1,
                name: s.name,
                type: 'Dịch vụ',
                price: s.price,
                unit: s.unit,
                applied: true,
              })),
            }
            setContract(mappedContract)
            setEditPrice(String(mappedContract.priceNumber))
            setEditDeposit(String(mappedContract.depositNumber))
            setEditPaymentDate(mappedContract.paymentDate || '5')
            setEditEndDate(mappedContract.endDate)
            return
          }
        })
        .catch(() => {
          const found = getContractById(contractId)
          setContract(found)
          if (found) {
            setEditPrice(String(found.priceNumber || found.price.replace(/[^\d]/g, '')))
            setEditDeposit(String(found.depositNumber || found.deposit.replace(/[^\d]/g, '')))
            setEditPaymentDate(found.paymentDate || '5')
            setEditEndDate(found.endDate)
          }
        })
    } else {
      const found = getContractById(contractId)
      setContract(found)
      if (found) {
        setEditPrice(String(found.priceNumber || found.price.replace(/[^\d]/g, '')))
        setEditDeposit(String(found.depositNumber || found.deposit.replace(/[^\d]/g, '')))
        setEditPaymentDate(found.paymentDate || '5')
        setEditEndDate(found.endDate)
      }
    }
  }, [resolvedParams.id, activeBuilding?.id])

  const handleSelectExistingCustomer = (idStr: string) => {
    setSelectedCustomerId(idStr)
    const cust = existingCustomers.find(c => c.id === idStr || c.cccd === idStr)
    if (cust) {
      setNewMemberName(cust.name)
      setNewMemberPhone(cust.phone)
      setNewMemberCccd(cust.cccd)
    }
    setIsDirty(true)
  }

  const handleSaveContractEdit = () => {
    if (!editReason.trim()) {
      showToast(t('landlordContractDetailToastEditReasonRequired'), 'error')
      return
    }

    const todayStr = new Date().toLocaleDateString('vi-VN')
    const formattedPrice = `${Number(editPrice.replace(/[^\d]/g, '') || 0).toLocaleString('vi-VN')} ₫`
    const formattedDeposit = `${Number(editDeposit.replace(/[^\d]/g, '') || 0).toLocaleString('vi-VN')} ₫`

    setContract(prev =>
      prev
        ? {
            ...prev,
            price: formattedPrice,
            priceNumber: Number(editPrice.replace(/[^\d]/g, '') || 0),
            deposit: formattedDeposit,
            depositNumber: Number(editDeposit.replace(/[^\d]/g, '') || 0),
            paymentDate: editPaymentDate,
            endDate: editEndDate || prev.endDate,
            history: [
              { date: todayStr, user: 'Admin (Chủ trọ)', content: `Cập nhật HĐ: ${editReason}` },
              ...(prev.history || []),
            ],
          }
        : null,
    )

    setIsEditModalOpen(false)
    setIsDirty(false)
    setEditReason('')
    showToast(t('landlordContractDetailToastEditSuccess'), 'success')
  }

  const handleSaveExtension = () => {
    if (!extendEndDate) {
      showToast(t('landlordContractDetailToastExtendDateRequired'), 'error')
      return
    }

    const todayStr = new Date().toLocaleDateString('vi-VN')
    setContract(prev =>
      prev
        ? {
            ...prev,
            endDate: extendEndDate,
            status: 'Đang hiệu lực',
            history: [
              {
                date: todayStr,
                user: 'Admin (Chủ trọ)',
                content: `Gia hạn hợp đồng tới ngày ${extendEndDate}`,
              },
              ...(prev.history || []),
            ],
          }
        : null,
    )

    setIsExtendModalOpen(false)
    setIsDirty(false)
    showToast(t('landlordContractDetailToastExtendSuccess'), 'success')
  }

  const handleAddMember = () => {
    if (!newMemberName.trim()) {
      showToast(t('landlordContractDetailToastMemberNameRequired'), 'error')
      return
    }

    const newMem: ContractMember = {
      name: newMemberName.trim(),
      relation: newMemberRelation,
      phone: newMemberPhone.trim() || '—',
      cccd: newMemberCccd.trim() || '—',
    }

    // Update members list in current contract
    setContract(prev =>
      prev
        ? {
            ...prev,
            members: [...(prev.members || []), newMem],
          }
        : null,
    )

    // If Mode 2: Create new tenant -> Sync into Customer list
    if (addMemberTab === 'create' && contract) {
      const createdCccd =
        newMemberCccd.trim() || `00109${Math.floor(1000000 + Math.random() * 9000000)}`
      const newCustomer: Customer = {
        id: createdCccd,
        name: newMemberName.trim(),
        phone: newMemberPhone.trim() || '0900000000',
        room: contract.room,
        building: contract.building,
        cccd: createdCccd,
        joinDate: contract.startDate,
        status: 'Đang ở',
        dob: newMemberDob || '2000-01-01',
        gender: newMemberGender,
        address: newMemberAddress.trim() || 'TP.HCM',
        email: `member${contract.room}@gmail.com`,
        job: newMemberJob.trim() || 'Nhân viên',
        workplace: newMemberWorkplace.trim() || 'Công ty',
        note: `Thành viên ở cùng phòng ${contract.room} (Chủ HĐ: ${contract.tenant})`,
        createdAt: new Date().toLocaleDateString('vi-VN'),
        updatedAt: new Date().toLocaleDateString('vi-VN'),
      }
      setExistingCustomers(prev => [newCustomer, ...prev])
      showToast(
        t('landlordContractDetailSyncSuccess').replace('{name}', newMemberName.trim()),
        'success',
      )
    } else {
      showToast(t('landlordContractDetailToastAddMemberSuccess'), 'success')
    }

    // Reset fields & close modal
    setNewMemberName('')
    setNewMemberPhone('')
    setNewMemberCccd('')
    setSelectedCustomerId('')
    setNewMemberDob('')
    setNewMemberAddress('')
    setNewMemberJob('')
    setNewMemberWorkplace('')
    setIsDirty(false)
    setIsAddMemberModalOpen(false)
  }

  const handleTerminate = () => {
    const todayStr = new Date().toLocaleDateString('vi-VN')
    setContract(prev =>
      prev
        ? {
            ...prev,
            status: 'Đã chấm dứt',
            history: [
              { date: todayStr, user: 'Admin (Chủ trọ)', content: 'Chấm dứt hợp đồng thuê phòng' },
              ...(prev.history || []),
            ],
          }
        : null,
    )

    setIsTerminateModalOpen(false)
    showToast(t('landlordContractDetailToastTerminateSuccess'), 'success')
  }

  const filteredCustomers = useMemo(() => {
    if (!memberSearchQuery.trim()) return existingCustomers
    const q = memberSearchQuery.toLowerCase().trim()
    return existingCustomers.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.cccd.includes(q),
    )
  }, [existingCustomers, memberSearchQuery])

  if (!isMounted) return null

  if (!contract) {
    return (
      <div className="p-8 text-center bg-white rounded-2xl border border-zinc-200 text-zinc-500 my-6">
        <p className="font-bold text-lg mb-2 text-zinc-800">
          {t('landlordContractsNoContractsFound')}
        </p>
        <p className="text-xs text-zinc-500 mb-4">
          {t('landlordContractDetailContractId', { id: resolvedParams.id })}
        </p>
        <Link
          href="/landlord/contracts"
          className="inline-flex items-center gap-2 px-4 py-2 bg-[#2AC1BC] text-white text-xs font-bold rounded-xl hover:bg-[#25ad87] transition-colors"
        >
          &larr; {t('landlordContractDetailBack')}
        </Link>
      </div>
    )
  }

  const fullRoomId = `${contract.buildingSeq}${contract.room}`

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-zinc-200/80 shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/landlord/contracts"
            className="p-2 -ml-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 rounded-full transition-colors cursor-pointer shrink-0"
            title={t('landlordContractDetailBack')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-zinc-900 tracking-tight">
                {t('landlordContractDetailRoomPrefix')} {contract.room}
              </h1>
              <span
                className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border shrink-0 ${
                  contract.status === 'Đang hiệu lực'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : contract.status === 'Quá hạn'
                      ? 'bg-rose-50 text-rose-700 border-rose-200'
                      : contract.status === 'Sắp hết hạn'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-zinc-100 text-zinc-600 border-zinc-200'
                }`}
              >
                {contract.status}
              </span>
            </div>
            <p className="text-xs text-zinc-500 font-semibold mt-0.5 flex flex-wrap items-center gap-2">
              <span>{contract.buildingName}</span>
              <span>•</span>
              <span>{t('landlordContractDetailContractId', { id: contract.id })}</span>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(contract.id)
                  showToast(t('landlordContractsToastCodeCopied'), 'success')
                }}
                title={t('landlordContractsCopyCodeTitle')}
              >
                <Copy className="w-3.5 h-3.5" />
              </Button>
            </p>
          </div>
        </div>

        {/* Action Toolbar using Base Button Components */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-zinc-100">
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={openExtendModal}
            leftIcon={<CalendarDays className="w-3.5 h-3.5" />}
          >
            {t('landlordContractDetailBtnExtend')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={openEditModal}
            leftIcon={<Edit2 className="w-3.5 h-3.5 text-[#2AC1BC]" />}
          >
            {t('landlordContractDetailBtnEdit')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handlePrintContract}
            leftIcon={<Printer className="w-3.5 h-3.5 text-[#2AC1BC]" />}
          >
            {t('landlordContractDetailBtnPrint')}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsTerminateModalOpen(true)}
            leftIcon={<Ban  />}
          >
            {t('landlordContractDetailBtnTerminate')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: THÔNG TIN HỢP ĐỒNG & GIÁ THUÊ */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#2AC1BC]" />{' '}
                {t('landlordContractDetailFinancialSection')}
              </h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={openEditModal}
                leftIcon={<Edit2  />}
              >
                {t('landlordContractDetailBtnEdit')}
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailContractId', { id: '' }).replace(':', '').trim()}
                </span>
                <p className="font-black text-[#2AC1BC] text-sm tracking-wide">{contract.id}</p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailRoomTypeLabel')}
                </span>
                <p className="font-extrabold text-zinc-900 text-sm">
                  {t('landlordContractDetailRoomPrefix')} {contract.room} • {contract.roomType}
                </p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailStartDate')}
                </span>
                <p className="font-bold text-zinc-800">{contract.startDate}</p>
              </div>

              <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailEndDate')}
                </span>
                <p className="font-bold text-zinc-800">{contract.endDate}</p>
              </div>

              <div className="p-3.5 bg-emerald-500/5 rounded-xl border border-emerald-500/20 space-y-1">
                <span className="text-[10px] font-bold text-emerald-600 uppercase">
                  {t('landlordContractDetailRentPrice')}
                </span>
                <p className="font-black text-emerald-600 text-base">{contract.price}</p>
              </div>

              <div className="p-3.5 bg-purple-500/5 rounded-xl border border-purple-500/20 space-y-1">
                <span className="text-[10px] font-bold text-purple-600 uppercase">
                  {t('landlordContractDetailDeposit')}
                </span>
                <p className="font-black text-purple-600 text-base">{contract.deposit}</p>
              </div>

              <div className="sm:col-span-2 p-3.5 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-zinc-400 uppercase block">
                    {t('landlordContractDetailPaymentDay')}
                  </span>
                  <p className="font-bold text-zinc-800 text-xs">
                    {t('landlordContractDetailPaymentDayValue', {
                      day: contract.paymentDate || '5',
                    })}
                  </p>
                </div>
                <span className="px-2.5 py-1 bg-zinc-200 text-zinc-700 text-[10px] font-extrabold rounded-lg">
                  {t('landlordContractDetailVietQrAuto')}
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: BÊN B - KHÁCH THUÊ CHÍNH */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <User className="w-4 h-4 text-[#2AC1BC]" />{' '}
                {t('landlordContractDetailTenantSection')}
              </h3>
              <Link
                href={`/landlord/customers/${contract.tenantCccd}`}
                className="px-3 py-1 bg-[#2AC1BC] text-white text-xs font-bold rounded-lg hover:bg-[#25ad87] transition-all shadow-xs flex items-center gap-1 cursor-pointer"
              >
                {t('landlordContractDetailTenantSection')} &rarr;
              </Link>
            </div>

            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-zinc-50 rounded-2xl border border-zinc-100">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-[#2AC1BC] text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
                  {contract.tenant.charAt(0)}
                </div>
                <div>
                  <h4 className="text-base font-black text-zinc-900">{contract.tenant}</h4>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-500 font-semibold mt-0.5">
                    <span>{t('landlordContractDetailMemberPhoneLabel')} {contract.tenantPhone}</span>
                    <span>•</span>
                    <span>{t('landlordContractDetailMemberCccdLabel')} {contract.tenantCccd}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
                <a
                  href={`tel:${contract.tenantPhone}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors shadow-2xs cursor-pointer"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>{t('landlordContractDetailCallBtn')}</span>
                </a>
                <a
                  href={`https://zalo.me/${contract.tenantPhone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0068FF] text-white rounded-xl text-xs font-bold hover:bg-[#0052cc] transition-colors shadow-2xs cursor-pointer"
                >
                  Zalo
                </a>
              </div>
            </div>
          </div>

          {/* CARD 3: THÀNH VIÊN Ở CÙNG */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-[#2AC1BC]" />{' '}
                {t('landlordContractDetailMembersSection', {
                  count: contract.members?.length || 0,
                })}
              </h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={openAddMemberModal}
                leftIcon={<Plus  />}
              >
                {t('landlordContractDetailAddMemberBtn')}
              </Button>
            </div>

            {!contract.members || contract.members.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 font-bold bg-zinc-50 rounded-xl border border-dashed border-zinc-200">
                {t('landlordContractDetailNoMembers')}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {contract.members.map((mem, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-zinc-900 flex items-center gap-1.5">
                        <span>{mem.name}</span>
                        <span className="text-[10px] bg-zinc-200 text-zinc-700 px-1.5 py-0.5 rounded-md font-semibold">
                          {mem.relation}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 font-medium mt-0.5">
                        {t('landlordContractDetailMemberPhoneLabel')} {mem.phone} • {t('landlordContractDetailMemberCccdLabel')} {mem.cccd || '—'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        setContract(prev =>
                          prev
                            ? { ...prev, members: prev.members.filter((_, i) => i !== idx) }
                            : null,
                        )
                      }
                      title={t('landlordContractsCreateConfirmCloseDiscard')}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* CARD 4: CẤU HÌNH DỊCH VỤ ĐỊNH KỲ */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Banknote className="w-4 h-4 text-[#2AC1BC]" />{' '}
              {t('landlordContractDetailServicesSection')}
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {contract.services.map(svc => (
                <div
                  key={svc.id}
                  className="flex items-center justify-between p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-zinc-800">{svc.name}</span>
                    <span className="text-[9px] bg-zinc-200 text-zinc-600 px-1.5 py-0.5 rounded font-semibold">
                      {svc.type}
                    </span>
                  </div>
                  <span className="font-black text-[#2AC1BC]">
                    {svc.price.toLocaleString('vi-VN')} {svc.unit}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* CARD 5: NHẬT KÝ LỊCH SỬ THAY ĐỔI */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-sm uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Clock className="w-4 h-4 text-[#2AC1BC]" />{' '}
              {t('landlordContractDetailHistorySection')}
            </h3>

            <div className="space-y-2.5">
              {contract.history.map((h, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 text-xs space-y-0.5"
                >
                  <div className="flex justify-between items-center font-bold text-zinc-800">
                    <span>{h.content}</span>
                    <span className="text-[10px] text-zinc-400 font-semibold">{h.date}</span>
                  </div>
                  <p className="text-[10px] text-zinc-500 font-medium">
                    {t('landlordContractDetailUpdatedBy')}{' '}
                    <strong className="text-zinc-700">{h.user}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* CARD BÊN A (CHỦ TRỌ / BQL) */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2 border-b border-zinc-100 pb-3">
              <Building2 className="w-4 h-4 text-[#2AC1BC]" />{' '}
              {t('landlordContractDetailPartyA')}
            </h3>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailPartyARep')}
                </span>
                <p className="font-extrabold text-zinc-900">Nguyễn Văn Quyền (Chủ trọ Dormio)</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailPartyAPhone')}
                </span>
                <p className="font-bold text-zinc-800">0988 123 456</p>
              </div>

              <div className="p-3 bg-zinc-50 rounded-xl border border-zinc-100 space-y-1">
                <span className="text-[10px] font-bold text-zinc-400 uppercase">
                  {t('landlordContractDetailPartyABuilding')}
                </span>
                <p className="font-bold text-zinc-800">{contract.buildingName}</p>
              </div>
            </div>
          </div>

          {/* LINK SANG PHÒNG HIỆN TẠI */}
          <div className="bg-white border border-zinc-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <h3 className="font-black text-zinc-900 text-xs uppercase tracking-wider flex items-center gap-2">
                <Home className="w-4 h-4 text-[#2AC1BC]" />{' '}
                {t('landlordContractDetailRentedRoom')}
              </h3>
              <span className="text-sm font-black text-[#2AC1BC] bg-[#2AC1BC]/10 border border-[#2AC1BC]/20 px-2.5 py-0.5 rounded-lg">
                {t('landlordContractDetailRoomPrefix')} {contract.room}
              </span>
            </div>

            <Link
              href={`/landlord/rooms/${fullRoomId}`}
              className="w-full py-2.5 bg-[#2AC1BC] hover:bg-[#25ad87] text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
            >
              <Home className="w-4 h-4" /> {t('landlordContractDetailViewRoomBtn')}
            </Link>
          </div>
        </div>
      </div>

      {/* MODAL 1: GIA HẠN HỢP ĐỒNG */}
      <Modal
        isOpen={isExtendModalOpen}
        onClose={() => requestCloseModal(() => setIsExtendModalOpen(false))}
        size="md"
        header={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" size="base" weight="black" className="text-zinc-900">
                {t('landlordContractDetailModalExtendTitle')}
              </Text>
              <Text size="xs" color="subtle" weight="medium">
                {t('landlordContractDetailExtendDesc').replace('{room}', contract.room)}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-6 space-y-4"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => requestCloseModal(() => setIsExtendModalOpen(false))}
            >
              {t('landlordContractsCreateCancelBtn')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveExtension}
            >
              {t('landlordContractDetailModalExtendSubmit')}
            </Button>
          </div>
        }
      >
        <TextInput
          label={t('landlordContractDetailCurrentEndDate')}
          value={contract.endDate}
          disabled
        />

        <DateInput
          label={t('landlordContractDetailNewEndDate')}
          required
          value={extendEndDate}
          onChange={e => {
            setExtendEndDate(e.target.value)
            setIsDirty(true)
          }}
        />
      </Modal>

      {/* MODAL 2: SỬA HỢP ĐỒNG */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => requestCloseModal(() => setIsEditModalOpen(false))}
        size="lg"
        header={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
              <Edit2 className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" size="base" weight="black" className="text-zinc-900">
                {t('landlordContractDetailModalEditTitle')} {contract.id}
              </Text>
              <Text size="xs" color="subtle" weight="medium">
                {t('landlordContractDetailEditDesc')}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-6 space-y-4"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => requestCloseModal(() => setIsEditModalOpen(false))}
            >
              {t('landlordContractsCreateCancelBtn')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleSaveContractEdit}
            >
              {t('landlordContractDetailModalEditSubmit')}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <NumberInput
            label={t('landlordContractDetailRentPriceMonthly')}
            required
            suffixText="₫"
            value={editPrice}
            onChange={e => {
              setEditPrice(e.target.value)
              setIsDirty(true)
            }}
          />

          <NumberInput
            label={t('landlordContractDetailDepositAmount')}
            required
            suffixText="₫"
            value={editDeposit}
            onChange={e => {
              setEditDeposit(e.target.value)
              setIsDirty(true)
            }}
          />
        </div>

        <SelectInput
          label={t('landlordContractDetailPaymentDayOfMonth')}
          value={editPaymentDate}
          onChange={e => {
            setEditPaymentDate(e.target.value)
            setIsDirty(true)
          }}
          options={Array.from({ length: 31 }, (_, i) => ({
            value: String(i + 1),
            label: t('landlordContractsPaymentDateEveryMonth').replace('{day}', String(i + 1)),
          }))}
        />

        <TextareaInput
          label={t('landlordContractDetailEditReasonHint')}
          required
          rows={3}
          placeholder={t('landlordContractDetailModalEditReasonPh')}
          value={editReason}
          onChange={e => {
            setEditReason(e.target.value)
            setIsDirty(true)
          }}
        />
      </Modal>

      {/* MODAL 3: THÊM THÀNH VIÊN Ở CÙNG */}
      <Modal
        isOpen={isAddMemberModalOpen}
        onClose={() => requestCloseModal(() => setIsAddMemberModalOpen(false))}
        size="lg"
        header={
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2AC1BC]/10 text-[#2AC1BC] rounded-xl">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <Text as="h2" size="base" weight="black" className="text-zinc-900">
                {t('landlordContractDetailModalAddMemberTitle')}
              </Text>
              <Text size="xs" color="subtle" weight="medium">
                {t('landlordContractDetailAddMemberDesc').replace('{room}', contract.room)}
              </Text>
            </div>
          </div>
        }
        bodyClassName="p-0 overflow-hidden flex flex-col"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => requestCloseModal(() => setIsAddMemberModalOpen(false))}
            >
              {t('landlordContractsCreateCancelBtn')}
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handleAddMember}
            >
              {addMemberTab === 'select'
                ? t('landlordContractDetailModalAddMemberSubmit')
                : t('landlordContractDetailAddNewMemberBtn')}
            </Button>
          </div>
        }
      >
        {/* Mode Switcher Tabs */}
        <div className="grid grid-cols-2 p-2 bg-zinc-100/70 border-b border-zinc-200/60 text-xs font-bold gap-1">
          <Button
            type="button"
            size="sm"
            variant={addMemberTab === 'select' ? 'primary' : 'ghost'}
            onClick={() => setAddMemberTab('select')}
          >
            {t('landlordContractDetailTabSelectExisting')}
          </Button>

          <Button
            type="button"
            size="sm"
            variant={addMemberTab === 'create' ? 'primary' : 'ghost'}
            onClick={() => setAddMemberTab('create')}
          >
            {t('landlordContractDetailTabCreateNew')}
          </Button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto custom-scrollbar">
              {addMemberTab === 'select' ? (
                /* CÁCH 1: CHỌN KHÁCH THUÊ CÓ SẴN TRONG DATA */
                <div className="space-y-4">
                  <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-xs text-blue-700 font-semibold">
                    {t('landlordContractDetailSearchMemberHint')}
                  </div>

                  {/* Thanh Tìm Kiếm Khách Thuê */}
                  <SearchInput
                    label={t('landlordContractDetailSearchMemberLabel')}
                    placeholder={t('landlordContractDetailSearchMemberPh')}
                    value={memberSearchQuery}
                    onChange={setMemberSearchQuery}
                  />

                  {/* Dropdown danh sách kết quả tìm kiếm */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="block text-xs font-bold text-zinc-700">
                        {t('landlordContractDetailSelectMemberLabel')}
                      </label>
                      <span className="text-[10px] text-zinc-400 font-bold">
                        {t('landlordContractDetailSelectMemberCount')
                          .replace('{filtered}', String(filteredCustomers.length))
                          .replace('{total}', String(existingCustomers.length))}
                      </span>
                    </div>
                    <SelectInput
                      value={selectedCustomerId}
                      onChange={e => handleSelectExistingCustomer(e.target.value)}
                    >
                      <option value="">{t('landlordContractDetailSelectExistingPh')}</option>
                      {filteredCustomers.map((cust, idx) => (
                        <option key={`${cust.id}-${idx}`} value={cust.id}>
                          {cust.name} — SĐT: {cust.phone} (CCCD: {cust.cccd})
                        </option>
                      ))}
                    </SelectInput>
                  </div>

                  {/* Preview Khách Thuê Đã Chọn */}
                  {newMemberName ? (
                    <div className="p-3.5 bg-zinc-50 rounded-xl border border-zinc-200/80 space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">
                        {t('landlordContractDetailSelectedMemberTitle')}
                      </span>
                      <p className="font-extrabold text-zinc-900 text-sm">{newMemberName}</p>
                      <p className="text-zinc-500 font-medium">
                        {t('landlordContractDetailMemberPhoneLabel')}{' '}
                        <strong className="text-zinc-800">{newMemberPhone}</strong> •{' '}
                        {t('landlordContractDetailMemberCccdLabel')}{' '}
                        <strong className="text-zinc-800">{newMemberCccd}</strong>
                      </p>
                    </div>
                  ) : (
                    memberSearchQuery && (
                      /* Danh Sách Kết Quả Nhanh Click-to-Select */
                      <div className="border border-zinc-200 rounded-xl divide-y divide-zinc-100 max-h-40 overflow-y-auto custom-scrollbar">
                        {filteredCustomers.slice(0, 5).map((cust, idx) => (
                          <div
                            key={`quick-${cust.id}-${idx}`}
                            onClick={() => handleSelectExistingCustomer(cust.id)}
                            className="p-2.5 hover:bg-[#2AC1BC]/10 cursor-pointer transition-colors flex items-center justify-between text-xs"
                          >
                            <div>
                              <span className="font-bold text-zinc-900 block">{cust.name}</span>
                              <span className="text-[10px] text-zinc-500">
                                {t('landlordContractDetailMemberPhoneLabel')} {cust.phone} •{' '}
                                {t('landlordContractDetailMemberCccdLabel')} {cust.cccd}
                              </span>
                            </div>
                            <span className="text-[10px] font-bold text-[#2AC1BC] bg-[#2AC1BC]/10 px-2 py-0.5 rounded-md">
                              {t('landlordContractDetailSelectAction')}
                            </span>
                          </div>
                        ))}
                        {filteredCustomers.length === 0 && (
                          <div className="p-3 text-center text-xs text-zinc-400">
                            {t('landlordContractDetailNotFoundForQuery').replace(
                              '{query}',
                              memberSearchQuery,
                            )}
                          </div>
                        )}
                      </div>
                    )
                  )}

                  <SelectInput
                    label={t('landlordContractDetailMemberRelationLabel2')}
                    value={newMemberRelation}
                    onChange={e => {
                      setNewMemberRelation(e.target.value)
                      setIsDirty(true)
                    }}
                    options={[
                      { value: 'Gia đình', label: t('landlordContractDetailRelationFamily') },
                      { value: 'Bạn bè', label: t('landlordContractDetailRelationFriend') },
                      { value: 'Đồng nghiệp', label: t('landlordContractDetailRelationColleague') },
                      { value: 'Khác', label: t('landlordContractDetailRelationOther') },
                    ]}
                  />
                </div>
              ) : (
                /* CÁCH 2: TẠO MỚI TRONG HỢP ĐỒNG -> TỰ ĐỘNG ĐỒNG BỘ */
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-semibold">
                    {t('landlordContractDetailCreateMemberHint').replace('{room}', contract.room)}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <TextInput
                      label={t('landlordContractDetailMemberNameLabel')}
                      required
                      placeholder={t('landlordContractDetailMemberNamePh')}
                      value={newMemberName}
                      onChange={e => {
                        setNewMemberName(e.target.value)
                        setIsDirty(true)
                      }}
                    />

                    <TextInput
                      label={t('landlordContractDetailMemberPhoneLabel2')}
                      required
                      placeholder={t('landlordContractDetailMemberPhonePh')}
                      value={newMemberPhone}
                      onChange={e => {
                        setNewMemberPhone(e.target.value)
                        setIsDirty(true)
                      }}
                    />

                    <TextInput
                      label={t('landlordContractDetailMemberCccdLabel2')}
                      required
                      placeholder={t('landlordContractDetailMemberCccdPh')}
                      value={newMemberCccd}
                      onChange={e => {
                        setNewMemberCccd(e.target.value)
                        setIsDirty(true)
                      }}
                    />

                    <DateInput
                      label={t('landlordContractDetailMemberDobLabel')}
                      value={newMemberDob}
                      onChange={e => {
                        setNewMemberDob(e.target.value)
                        setIsDirty(true)
                      }}
                    />

                    <SelectInput
                      label={t('landlordContractDetailMemberGenderLabel')}
                      value={newMemberGender}
                      onChange={e => {
                        setNewMemberGender(e.target.value as 'nam' | 'nu')
                        setIsDirty(true)
                      }}
                      options={[
                        { value: 'nam', label: t('landlordContractDetailGenderMale') },
                        { value: 'nu', label: t('landlordContractDetailGenderFemale') },
                      ]}
                    />

                    <SelectInput
                      label={t('landlordContractDetailMemberRelationLabel2')}
                      value={newMemberRelation}
                      onChange={e => {
                        setNewMemberRelation(e.target.value)
                        setIsDirty(true)
                      }}
                      options={[
                        { value: 'Gia đình', label: t('landlordContractDetailRelationFamily') },
                        { value: 'Bạn bè', label: t('landlordContractDetailRelationFriend') },
                        { value: 'Đồng nghiệp', label: t('landlordContractDetailRelationColleague') },
                        { value: 'Khác', label: t('landlordContractDetailRelationOther') },
                      ]}
                    />

                    <div className="sm:col-span-2">
                      <TextInput
                        label={t('landlordContractDetailMemberAddressLabel')}
                        value={newMemberAddress}
                        onChange={e => {
                          setNewMemberAddress(e.target.value)
                          setIsDirty(true)
                        }}
                      />
                    </div>

                    <TextInput
                      label={t('landlordContractDetailMemberJobLabel')}
                      value={newMemberJob}
                      onChange={e => {
                        setNewMemberJob(e.target.value)
                        setIsDirty(true)
                      }}
                    />

                    <TextInput
                      label={t('landlordContractDetailMemberWorkplaceLabel')}
                      value={newMemberWorkplace}
                      onChange={e => {
                        setNewMemberWorkplace(e.target.value)
                        setIsDirty(true)
                      }}
                    />
                  </div>
                </div>
              )}
        </div>
      </Modal>

      {/* MODAL 4: TERMINATE CONTRACT CONFIRMATION */}
      <Modal
        isOpen={isTerminateModalOpen}
        onClose={() => setIsTerminateModalOpen(false)}
        size="md"
        header={
          <div className="flex items-center gap-3 text-rose-600">
            <div className="p-3 bg-rose-100 rounded-full">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <Text as="h3" size="lg" weight="black" className="text-zinc-900">
              {t('landlordContractDetailModalTerminateTitle')}
            </Text>
          </div>
        }
        bodyClassName="p-6 space-y-4"
        footer={
          <div className="flex justify-end gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsTerminateModalOpen(false)}
            >
              {t('landlordContractsCreateCancelBtn')}
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={handleTerminate}
            >
              {t('landlordContractDetailTerminateConfirmBtn')}
            </Button>
          </div>
        }
      >
        <Text size="xs" color="subtle" weight="medium" className="leading-relaxed">
          {t('landlordContractDetailTerminateConfirmDesc')
            .replace('{id}', contract.id)
            .replace('{room}', contract.room)}
        </Text>
      </Modal>

      {/* Rule 10: Custom Pop-up Confirmation Modal */}
      <Modal
        isOpen={showConfirmClose}
        onClose={() => setShowConfirmClose(false)}
        size="sm"
        zIndex={200}
        showCloseButton={false}
        footer={
          <div className="flex items-center gap-3 w-full">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => setShowConfirmClose(false)}
            >
              {t('landlordContractDetailConfirmCloseKeep')}
            </Button>
            <Button
              type="button"
              variant="danger"
              className="flex-1"
              onClick={handleConfirmDiscard}
            >
              {t('landlordContractDetailConfirmCloseDiscard')}
            </Button>
          </div>
        }
      >
        <div className="space-y-2">
          <Text as="h3" size="base" weight="bold" className="text-zinc-900">
            {t('landlordContractDetailConfirmCloseTitle')}
          </Text>
          <Text size="xs" color="subtle" className="leading-relaxed">
            {t('landlordContractDetailConfirmCloseDesc')}
          </Text>
        </div>
      </Modal>

      {/* Contract Preview & Export Modal */}
      {isPreviewModalOpen && activeBuilding?.id && contract && (
        <ContractPreviewModal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          buildingId={activeBuilding.id}
          contractId={contract.id}
          roomNumber={contract.room}
          tenantName={contract.tenant}
        />
      )}

      {/* Centralized Toast Notifications Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  )
}
