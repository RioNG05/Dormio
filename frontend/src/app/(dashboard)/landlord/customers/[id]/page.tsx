'use client'

import React, { useState, useEffect, use } from 'react'
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
  Image as ImageIcon,
  FileSignature,
  AlertTriangle,
  X,
  ExternalLink,
  Loader2,
  MessageCircle,
  Info,
  PhoneCall,
} from 'lucide-react'
import { Customer } from '../data'
import { getLandlordContracts, getContractById } from '@/services/contract.service'
import { useAuth } from '@/context/AuthContext'
import { useTranslations } from '@/context/LanguageContext'
import {
  Button,
  TextInput,
  DateInput,
  SelectInput,
  TextareaInput,
  Modal,
  Text,
} from '@/components/ui'

export default function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const router = useRouter()
  const t = useTranslations('landlord')
  const { activeBuilding } = useAuth()

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

  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isImagePreviewOpen, setIsImagePreviewOpen] = useState<string | null>(null)
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => void
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { },
  })

  const [alertModal, setAlertModal] = useState<{
    isOpen: boolean
    title: string
    message: string
    type: 'info' | 'warning' | 'error' | 'success'
  }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
  })

  // Edit form states
  const [editName, setEditName] = useState('')
  const [editPhone, setEditPhone] = useState('')
  const [editCccd, setEditCccd] = useState('')
  const [editDob, setEditDob] = useState('')
  const [editGender, setEditGender] = useState('')
  const [editAddress, setEditAddress] = useState('')
  const [editEmail, setEditEmail] = useState('')
  const [editJob, setEditJob] = useState('')
  const [editWorkplace, setEditWorkplace] = useState('')
  const [editNote, setEditNote] = useState('')

  const showAlert = (
    message: string,
    type: 'info' | 'warning' | 'error' | 'success' = 'info',
    title: string = 'Thông báo',
  ) => {
    setAlertModal({ isOpen: true, title, message, type })
  }

  useEffect(() => {
    setIsMounted(true)

    async function loadCustomerDetail() {
      const rawId = decodeURIComponent(resolvedParams.id || '')
      if (!rawId || !activeBuilding?.id) {
        setIsLoading(false)
        return
      }

      // Strictly accept ONLY userId on param (cannot be a CCCD/CMND number)
      const isCccd = /^\d{9,12}$/.test(rawId)
      if (isCccd) {
        setCustomer(null)
        setIsLoading(false)
        return
      }

      setIsLoading(true)
      try {
        const res = await getLandlordContracts(activeBuilding.id, { limit: 100 })
        const contracts: any[] = res?.data || []

        let matchedContract: any = null
        let matchedTenantUser: any = null

        const cleanRawId = rawId.replace(/^cust_/, '')

        for (const c of contracts) {
          // Check tenantContracts list - ONLY match by tenant's userId
          const tContracts = c.tenantContracts || []
          for (const tc of tContracts) {
            const tu = tc.tenant
            if (tu && (tu.id === rawId || tu.id === cleanRawId)) {
              matchedContract = c
              matchedTenantUser = tu
              break
            }
          }
          if (matchedContract) break

          // Check primary tenant - ONLY match by tenant's userId
          if (c.tenant && (c.tenant.id === rawId || c.tenant.id === cleanRawId)) {
            matchedContract = c
            matchedTenantUser = c.tenant
            break
          }
        }

        if (matchedContract) {
          // Fetch complete contract detail to obtain room services, deposit, invoices, docs
          let fullContract = matchedContract
          try {
            const detailRes = await getContractById(activeBuilding.id, matchedContract.id)
            if (detailRes?.data) {
              fullContract = detailRes.data
              if (!matchedTenantUser && fullContract.tenant) {
                matchedTenantUser = fullContract.tenant
              }
            }
          } catch (detailErr) {
            console.warn('Could not load full contract detail, using list aggregate:', detailErr)
          }

          const ident = matchedTenantUser?.userIdentification
          const daysRemaining = fullContract.endDate
            ? Math.max(
              0,
              Math.ceil(
                (new Date(fullContract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24),
              ),
            )
            : undefined
          const contractStatus =
            fullContract.status === 'active'
              ? daysRemaining !== undefined && daysRemaining <= 30
                ? 'Sắp hết hợp đồng'
                : 'Đang ở'
              : fullContract.status === 'draft'
                ? 'Sắp hết hợp đồng'
                : 'Đã rời'

          // Format address from Json or string
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

          const mappedCustomer: Customer = {
            id: matchedTenantUser?.id || `cust_${fullContract.id}`,
            userId: matchedTenantUser?.id,
            contractId: fullContract.id,
            name:
              ident?.fullName ||
              matchedTenantUser?.fullName ||
              matchedTenantUser?.username ||
              t('landlordCustomersDefaultName'),
            phone: matchedTenantUser?.phoneNumber || '—',
            room: fullContract.room?.roomNumber || '—',
            roomId: fullContract.room?.id,
            floor: fullContract.room?.floor,
            building: activeBuilding.name || activeBuilding.id,
            cccd: ident?.identityNumber || '—',
            joinDate: fullContract.startDate
              ? new Date(fullContract.startDate).toLocaleDateString('vi-VN')
              : '—',
            endDate: fullContract.endDate
              ? new Date(fullContract.endDate).toLocaleDateString('vi-VN')
              : undefined,
            rentPrice: fullContract.rentPrice,
            depositAmount: fullContract.deposit?.amount || fullContract.depositAmount || 0,
            daysRemaining,
            status: contractStatus,
            email: matchedTenantUser?.email,
            dob: ident?.dateOfBirth
              ? new Date(ident.dateOfBirth).toLocaleDateString('vi-VN')
              : undefined,
            gender: ident?.gender === 'male' || ident?.gender === 'nam' ? 'nam' : 'nu',
            address: formattedAddress || undefined,
            cardFrontUrl: ident?.cardFrontUrl,
            cardBackUrl: ident?.cardBackUrl,
            note: fullContract.note || undefined,
            hasAccount: !!matchedTenantUser?.id,
            recentInvoices: fullContract.recentInvoices || [],
          }

          setCustomer(mappedCustomer)
          setEditName(mappedCustomer.name)
          setEditPhone(mappedCustomer.phone !== '—' ? mappedCustomer.phone : '')
          setEditCccd(mappedCustomer.cccd !== '—' ? mappedCustomer.cccd : '')
          setEditDob(mappedCustomer.dob || '')
          setEditGender(mappedCustomer.gender || 'nam')
          setEditAddress(mappedCustomer.address || '')
          setEditEmail(mappedCustomer.email || '')
          setEditJob('')
          setEditWorkplace('')
          setEditNote(mappedCustomer.note || '')
        } else {
          setCustomer(null)
        }
      } catch (err) {
        console.error('Failed to load customer detail:', err)
        setCustomer(null)
      } finally {
        setIsLoading(false)
      }
    }

    loadCustomerDetail()
  }, [resolvedParams.id, activeBuilding?.id])

  // Track initial values for dirty check (Rule 10)
  const initialEditValues = React.useMemo(() => {
    if (!customer) return null
    return {
      name: customer.name || '',
      phone: customer.phone !== '—' ? customer.phone : '',
      cccd: customer.cccd !== '—' ? customer.cccd : '',
      dob: customer.dob || '',
      gender: customer.gender || 'nam',
      address: customer.address || '',
      email: customer.email || '',
      job: customer.job || '',
      workplace: customer.workplace || '',
      note: customer.note || '',
    }
  }, [customer])

  const [discardConfirmModal, setDiscardConfirmModal] = useState<{
    isOpen: boolean
    onConfirm: () => void
  }>({
    isOpen: false,
    onConfirm: () => { },
  })

  const resetEditForm = () => {
    if (initialEditValues) {
      setEditName(initialEditValues.name)
      setEditPhone(initialEditValues.phone)
      setEditCccd(initialEditValues.cccd)
      setEditDob(initialEditValues.dob)
      setEditGender(initialEditValues.gender)
      setEditAddress(initialEditValues.address)
      setEditEmail(initialEditValues.email)
      setEditJob(initialEditValues.job)
      setEditWorkplace(initialEditValues.workplace)
      setEditNote(initialEditValues.note)
    }
  }

  const handleCloseEditModal = () => {
    if (!initialEditValues) {
      setIsEditModalOpen(false)
      return
    }
    const hasChanges =
      editName !== initialEditValues.name ||
      editPhone !== initialEditValues.phone ||
      editCccd !== initialEditValues.cccd ||
      editDob !== initialEditValues.dob ||
      editGender !== initialEditValues.gender ||
      editAddress !== initialEditValues.address ||
      editEmail !== initialEditValues.email ||
      editJob !== initialEditValues.job ||
      editWorkplace !== initialEditValues.workplace ||
      editNote !== initialEditValues.note

    if (hasChanges) {
      setDiscardConfirmModal({
        isOpen: true,
        onConfirm: () => {
          resetEditForm()
          setIsEditModalOpen(false)
          setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))
        },
      })
    } else {
      resetEditForm()
      setIsEditModalOpen(false)
    }
  }

  const handleSaveCustomer = () => {
    setCustomer(prev =>
      prev
        ? {
          ...prev,
          name: editName || prev.name,
          phone: editPhone || prev.phone,
          cccd: editCccd || prev.cccd,
          dob: editDob || prev.dob,
          gender: editGender || prev.gender,
          address: editAddress || prev.address,
          email: editEmail || prev.email,
          job: editJob || prev.job,
          workplace: editWorkplace || prev.workplace,
          note: editNote || prev.note,
          updatedAt: new Date().toLocaleDateString('vi-VN'),
        }
        : null,
    )
    setIsEditModalOpen(false)
  }

  const isStaying = customer ? (customer.status === 'Đang ở' || customer.status === 'Sắp hết hợp đồng') : false

  const handleOpenChat = () => {
    if (!customer) return
    const targetUserId =
      customer.userId || (customer.id && !customer.id.startsWith('cust_') ? customer.id : '')
    if (!targetUserId && !customer.hasAccount) {
      showAlert(
        `Khách thuê ${customer.name} chưa có tài khoản trên hệ thống Dormio để nhắn tin trực tiếp. Vui lòng liên hệ qua số điện thoại ${customer.phone !== '—' ? customer.phone : 'đã lưu'}.`,
        'info',
        'Chưa có tài khoản liên kết',
      )
      return
    }
    const query = new URLSearchParams()
    if (targetUserId) {
      query.set('userId', targetUserId)
    }
    if (customer.name) {
      query.set('tenant', customer.name)
    }
    if (customer.room && customer.room !== '—') {
      query.set('room', customer.room)
    }
    router.push(`/landlord/messages?${query.toString()}`)
  }

  if (!isMounted || isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-28 space-y-3 bg-card rounded-2xl border border-line shadow-xs">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-bold text-muted">{t('landlordCustomersLoading')}</p>
      </div>
    )
  }

  if (!customer) {
    return (
      <div className="p-8 text-center bg-card rounded-2xl border border-line text-muted my-6 space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-full bg-card-hover flex items-center justify-center mx-auto text-muted">
          <User className="w-6 h-6" />
        </div>
        <p className="font-bold text-lg text-foreground">{t('landlordCustomersTenantNotFound')}</p>
        <p className="text-xs text-muted">
          {t('landlordCustomersUserId')}:{' '}
          <span className="font-mono font-bold text-foreground/90">{resolvedParams.id}</span>
        </p>
        <Link
          href="/landlord/customers"
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-colors shadow-2xs"
        >
          &larr; {t('landlordCustomersBackToList')}
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6 pb-24 w-full">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-card p-4 sm:p-5 rounded-2xl border border-line shadow-xs">
        <div className="flex items-center gap-3 sm:gap-4 min-w-0">
          <Link
            href="/landlord/customers"
            className="p-2 -ml-2 text-muted hover:bg-card-hover hover:text-foreground rounded-full transition-colors cursor-pointer shrink-0"
            title={t('landlordCustomersBackToList')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>

          <div className="flex items-center gap-3">
            <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-primary text-white font-black text-lg flex items-center justify-center shadow-md shrink-0">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-foreground tracking-tight">
                  {customer.name}
                </h1>
                <span
                  className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full uppercase tracking-wider border shrink-0 ${customer.status === 'Đang ở'
                    ? 'bg-primary/10 text-primary border-primary/30'
                    : customer.status === 'Sắp hết hợp đồng'
                      ? 'bg-warning-soft text-warning border-warning-subtle'
                      : 'bg-card-hover text-muted border-line'
                    }`}
                >
                  {getCustomerStatusLabel(customer.status)}
                </span>
              </div>
              <Text size='xs' className="text-xs text-muted font-semibold mt-0.5">
                {t('landlordCustomersPhone')}:{' '}
                <span className="font-bold text-foreground">{customer.phone}</span>
              </Text>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto pt-2 md:pt-0 border-t md:border-t-0 border-line">
          <Button
            type="button"
            variant="success"
            size="sm"
            leftIcon={<PhoneCall />}
            onClick={() => {
              if (customer.phone && customer.phone !== '—') {
                window.location.href = `tel:${customer.phone}`
              }
            }}
          >
            {t('landlordCustomersCallBtn')}
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            leftIcon={<MessageCircle />}
            onClick={handleOpenChat}
          >
            {t('landlordCustomersMessageBtn')}
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            leftIcon={<Edit2 />}
            onClick={() => setIsEditModalOpen(true)}
          >
            {t('landlordCustomersEditInfo')}
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            leftIcon={<Trash2 />}
            onClick={() => {
              setConfirmModal({
                isOpen: true,
                title: t('landlordCustomersConfirmDeleteTitle'),
                message: t('landlordCustomersConfirmDeleteMsg')
                  .replace('{name}', customer.name)
                  .replace('{cccd}', customer.phone !== '—' ? customer.phone : customer.name),
                onConfirm: () => {
                  router.push('/landlord/customers')
                  setConfirmModal(prev => ({ ...prev, isOpen: false }))
                },
              })
            }}
          >
            {t('landlordCustomersDeleteBtn')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* CARD 1: THÔNG TIN CÁ NHÂN */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="font-black text-foreground text-sm uppercase tracking-wider flex items-center gap-2 border-b border-line pb-3">
              <User className="w-4 h-4 text-primary" /> {t('landlordCustomersPersonalInfo')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersFullNameLabel')}
                </span>
                <p className="font-extrabold text-foreground text-sm">{customer.name}</p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersCccdLabel')}
                </span>
                <p className="font-black text-primary text-sm tracking-wide">
                  {customer.cccd && customer.cccd !== '—' ? customer.cccd : 'Chưa cập nhật'}
                </p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersDobLabel')}
                </span>
                <p className="font-bold text-foreground">{customer.dob || 'Chưa cập nhật'}</p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersGenderLabel')}
                </span>
                <p className="font-bold text-foreground">
                  {customer.gender === 'nam'
                    ? t('landlordCustomersGenderMale')
                    : t('landlordCustomersGenderFemale')}
                </p>
              </div>

              <div className="sm:col-span-2 p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersPermanentAddressLabel')}
                </span>
                <p className="font-bold text-foreground">{customer.address || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>

          {/* CARD 2: THÔNG TIN LIÊN HỆ & NGHỀ NGHIỆP */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
            <h3 className="font-black text-foreground text-sm uppercase tracking-wider flex items-center gap-2 border-b border-line pb-3">
              <Phone className="w-4 h-4 text-primary" /> {t('landlordCustomersContactAndWork')}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersPhoneLabel')}
                </span>
                <p className="font-black text-foreground text-sm">{customer.phone}</p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersEmailLabel')}
                </span>
                <p className="font-bold text-foreground">{customer.email || 'Chưa cập nhật'}</p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersJobLabel')}
                </span>
                <p className="font-bold text-foreground">{customer.job || 'Chưa cập nhật'}</p>
              </div>

              <div className="p-3 bg-surface rounded-xl border border-line space-y-1">
                <span className="text-[10px] font-bold text-muted uppercase">
                  {t('landlordCustomersWorkplaceLabel')}
                </span>
                <p className="font-bold text-foreground">{customer.workplace || 'Chưa cập nhật'}</p>
              </div>
            </div>
          </div>

          {/* CARD 3: HÌNH ẢNH GIẤY TỜ CCCD */}
          <div className="bg-card border border-line rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex justify-between items-center border-b border-line pb-3">
              <h3 className="font-black text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />{' '}
                {t('landlordCustomersIdCardsSection')}
              </h3>
              {customer.cardFrontUrl && customer.cardBackUrl ? (
                <span className="px-2 py-0.5 bg-success-soft text-success border border-success-subtle rounded-full text-[10px] font-bold">
                  ✓ {t('landlordCustomersOcrVerified')}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-card-hover text-muted border border-line rounded-full text-[10px] font-bold">
                  Chưa tải đủ ảnh
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted block">
                  {t('landlordCustomersFrontIdCard')}
                </span>
                {customer.cardFrontUrl ? (
                  <div
                    onClick={() => setIsImagePreviewOpen(customer.cardFrontUrl!)}
                    className="group relative border-2 border-dashed border-line rounded-2xl h-44 overflow-hidden bg-surface flex items-center justify-center cursor-pointer hover:border-primary transition-all"
                  >
                    <img
                      src={customer.cardFrontUrl}
                      alt={t('landlordCustomersFrontIdCard')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                      {t('landlordCustomersClickToEnlarge')}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-line rounded-2xl h-44 bg-surface/50 flex flex-col items-center justify-center text-muted gap-2">
                    <ImageIcon className="w-8 h-8 text-zinc-300" />
                    <span className="text-xs font-semibold">Chưa cập nhật ảnh mặt trước</span>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <span className="text-xs font-bold text-muted block">
                  {t('landlordCustomersBackIdCard')}
                </span>
                {customer.cardBackUrl ? (
                  <div
                    onClick={() => setIsImagePreviewOpen(customer.cardBackUrl!)}
                    className="group relative border-2 border-dashed border-line rounded-2xl h-44 overflow-hidden bg-surface flex items-center justify-center cursor-pointer hover:border-primary transition-all"
                  >
                    <img
                      src={customer.cardBackUrl}
                      alt={t('landlordCustomersBackIdCard')}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold text-xs gap-1">
                      🔍 {t('landlordCustomersClickToEnlarge')}
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-line rounded-2xl h-44 bg-surface/50 flex flex-col items-center justify-center text-muted gap-2">
                    <ImageIcon className="w-8 h-8 text-zinc-300" />
                    <span className="text-xs font-semibold">Chưa cập nhật ảnh mặt sau</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (1 Col) */}
        <div className="space-y-6">
          {/* CARD: PHÒNG ĐANG Ở & HỢP ĐỒNG */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-foreground text-xs uppercase tracking-wider flex items-center gap-2 border-b border-line pb-3">
              <Home className="w-4 h-4 text-primary" />{' '}
              {t('landlordCustomersContractAndCurrentRoom')}
            </h3>

            {isStaying ? (
              <div className="space-y-3">
                <div className="p-3.5 bg-primary/10 rounded-2xl border border-primary/30 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-muted">
                      {t('landlordCustomersCurrentlyRenting')}
                    </span>
                    {customer.roomId ? (
                      <Link
                        href={`/landlord/rooms/${customer.roomId}`}
                        className="text-base font-black text-primary hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        {t('landlordCustomersRoomWord')} {customer.room}{' '}
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    ) : (
                      <span className="text-base font-black text-primary">
                        {t('landlordCustomersRoomWord')} {customer.room}
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-muted font-semibold border-t border-primary/20 pt-2 flex justify-between">
                    <span>
                      {t('landlordCustomersBuilding')}: {customer.building}
                    </span>
                    <span>
                      {t('landlordCustomersFloorPrefix')}{' '}
                      {customer.floor || customer.room.charAt(0) || '1'}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-surface rounded-xl border border-line space-y-1.5 text-xs">
                  {customer.contractId && (
                    <div className="flex justify-between items-center font-bold text-foreground/90">
                      <span>{t('landlordCustomersContractCodeLabel')}</span>
                      <Link
                        href={`/landlord/contracts`}
                        className="text-primary hover:underline font-black flex items-center gap-1 cursor-pointer"
                        title={t('landlordCustomersViewContractDetail')}
                      >
                        {customer.contractId.slice(0, 8).toUpperCase()}{' '}
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-muted font-semibold">
                    <span>{t('landlordCustomersContractTermLabel')}</span>
                    <span>
                      {customer.joinDate} - {customer.endDate || '—'}
                    </span>
                  </div>
                  {customer.rentPrice !== undefined && customer.rentPrice > 0 && (
                    <div className="flex justify-between text-[11px] text-foreground/90 font-semibold">
                      <span>Giá thuê:</span>
                      <span className="font-bold text-foreground">
                        {Number(customer.rentPrice).toLocaleString('vi-VN')} ₫/tháng
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[11px] text-success font-bold pt-1 border-t border-line">
                    <span>{t('landlordCustomersHoldingDepositLabel')}</span>
                    <span className="font-black text-deposit">
                      {customer.depositAmount
                        ? Number(customer.depositAmount).toLocaleString('vi-VN') + ' ₫'
                        : '0 ₫'}
                    </span>
                  </div>
                </div>

                {customer.roomId && (
                  <Link
                    href={`/landlord/rooms/${customer.roomId}`}
                    className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-black rounded-xl transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer text-center"
                  >
                    <Home className="w-4 h-4" />{' '}
                    {t('landlordCustomersViewRoomDetailBtn').replace('{room}', customer.room)}{' '}
                    &rarr;
                  </Link>
                )}
              </div>
            ) : (
              <div className="p-4 text-center bg-surface rounded-xl border border-line text-xs text-muted font-bold">
                {t('landlordCustomersContractEndedDesc')}
              </div>
            )}
          </div>

          {/* CARD: LỊCH SỬ THUÊ & THANH TOÁN */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-xs space-y-4">
            <h3 className="font-black text-foreground text-xs uppercase tracking-wider flex items-center gap-2 border-b border-line pb-3">
              <Clock className="w-4 h-4 text-primary" /> {t('landlordCustomersStayHistoryTitle')}
            </h3>

            <div className="space-y-2.5">
              <div className="p-3 bg-surface rounded-xl border border-line text-xs space-y-1">
                <div className="flex justify-between items-center font-bold">
                  <span className="text-foreground">
                    {t('landlordCustomersRoomWord')} {customer.room} ({customer.building})
                  </span>
                  <span
                    className={`px-2 py-0.5 text-[9px] font-black rounded-full ${customer.status === 'Đang ở'
                      ? 'bg-success-soft text-success'
                      : customer.status === 'Sắp hết hợp đồng'
                        ? 'bg-accent-soft text-accent'
                        : 'bg-info-soft text-info'
                      }`}
                  >
                    {getCustomerStatusLabel(customer.status)}
                  </span>
                </div>
                <p className="text-[10px] text-muted">
                  {t('landlordCustomersFromDate')} {customer.joinDate} -{' '}
                  {customer.endDate || t('landlordCustomersToDate')}
                </p>
              </div>

              {customer.recentInvoices && customer.recentInvoices.length > 0 && (
                <div className="p-3 bg-surface/80 rounded-xl border border-line text-xs space-y-1.5">
                  <span className="text-[10px] font-bold text-muted uppercase block">
                    Hóa đơn gần nhất
                  </span>
                  {customer.recentInvoices.slice(0, 2).map((inv: any) => (
                    <div key={inv.id} className="flex justify-between items-center text-[11px]">
                      <span className="text-muted font-medium">HĐ {inv.id.slice(0, 6)}</span>
                      <span className="font-bold text-foreground">
                        {Number(inv.totalAmount).toLocaleString('vi-VN')} ₫
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* CARD: GHI CHÚ CHỦ TRỌ */}
          <div className="bg-card border border-line rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="font-black text-foreground text-xs uppercase tracking-wider flex items-center gap-2 border-b border-line pb-3">
              <FileSignature className="w-4 h-4 text-primary" />{' '}
              {t('landlordCustomersLandlordNotesTitle')}
            </h3>
            <p className="text-xs text-muted font-medium italic bg-surface p-3 rounded-xl border border-line leading-relaxed">
              {customer.note ? `"${customer.note}"` : 'Không có ghi chú nào.'}
            </p>
          </div>
        </div>
      </div>

      {/* MODAL 1: CHỈNH SỬA THÔNG TIN KHÁCH THUÊ */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={handleCloseEditModal}
        size="2xl"
      >
        <Modal.Header
          icon={<Edit2 className="w-5 h-5 text-primary" />}
          title={`${t('landlordCustomersEditTenantTitlePrefix')} ${customer.name}`}
          description={t('landlordCustomersEditTenantSubtitle')}
        />

        <Modal.Body className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              label={t('landlordCustomersFullNameLabel')}
              required
              value={editName}
              onChange={e => setEditName(e.target.value)}
            />

            <TextInput
              label={t('landlordCustomersPhoneLabel')}
              required
              value={editPhone}
              onChange={e => setEditPhone(e.target.value)}
            />

            <TextInput
              label={t('landlordCustomersCccdLabel')}
              value={editCccd}
              onChange={e => setEditCccd(e.target.value)}
              className="font-bold text-primary"
            />

            <DateInput
              label={t('landlordCustomersDobLabel')}
              value={editDob}
              onChange={e => setEditDob(e.target.value)}
            />

            <SelectInput
              label={t('landlordCustomersGenderLabel')}
              value={editGender}
              onChange={e => setEditGender(e.target.value)}
              options={[
                { value: 'nam', label: t('landlordCustomersGenderMale') },
                { value: 'nu', label: t('landlordCustomersGenderFemale') },
              ]}
            />

            <TextInput
              label={t('landlordCustomersEmailLabel')}
              type="email"
              value={editEmail}
              onChange={e => setEditEmail(e.target.value)}
            />

            <div className="md:col-span-2">
              <TextInput
                label={t('landlordCustomersPermanentAddressLabel')}
                value={editAddress}
                onChange={e => setEditAddress(e.target.value)}
              />
            </div>

            <TextInput
              label={t('landlordCustomersJobLabel')}
              value={editJob}
              onChange={e => setEditJob(e.target.value)}
            />

            <TextInput
              label={t('landlordCustomersWorkplaceLabel')}
              value={editWorkplace}
              onChange={e => setEditWorkplace(e.target.value)}
            />

            <div className="md:col-span-2">
              <TextareaInput
                label={t('landlordCustomersNotesLabel')}
                rows={3}
                value={editNote}
                onChange={e => setEditNote(e.target.value)}
              />
            </div>
          </div>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline"
            size="sm"
            onClick={handleCloseEditModal}
          >
            {t('landlordCustomersCancelBtn')}
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSaveCustomer}
          >
            {t('landlordCustomersSaveChangesBtn')}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* UNSAVED CHANGES CONFIRMATION MODAL (RULE 10) */}
      <Modal
        isOpen={discardConfirmModal.isOpen}
        onClose={() => setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4">
          <div className="flex items-center gap-3 text-amber-600">
            <div className="p-3 bg-warning-soft rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <Text as="h3" weight="black" color="default" size="base">
                Xác nhận đóng form
              </Text>
              <Text size="xs" color="secondary" weight="medium">
                Bạn có các thay đổi chưa lưu. Bạn có chắc chắn muốn hủy bỏ và đóng biểu mẫu không?
              </Text>
            </div>
          </div>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setDiscardConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              Tiếp tục chỉnh sửa
            </Button>
            <Button
              type="button"
              variant="danger"
              size="sm"
              onClick={discardConfirmModal.onConfirm}
            >
              Hủy thay đổi & Đóng
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* MODAL 2: XEM ẢNH CCCD PHÓNG TO */}
      <Modal
        isOpen={!!isImagePreviewOpen}
        onClose={() => setIsImagePreviewOpen(null)}
        size="3xl"
        className="bg-zinc-950 border-zinc-800 p-2 overflow-hidden"
      >
        <div className="relative w-full flex flex-col items-center">
          <Button
            rounded="full"
            variant="ghost"
            size="sm"
            onClick={() => setIsImagePreviewOpen(null)}
            className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
          >
            <X className="w-5 h-5" />
          </Button>
          {isImagePreviewOpen && (
            <img
              src={isImagePreviewOpen}
              alt={t('landlordCustomersCccdEnlargedAlt')}
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          )}
        </div>
      </Modal>

      {/* MODAL 3: CONFIRM DELETE */}
      <Modal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        size="md"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4">
          <div className="flex items-center gap-3 text-rose-600">
            <div className="p-3 bg-danger-soft rounded-full shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <Text as="h3" weight="black" color="default" size="base">
              {confirmModal.title}
            </Text>
          </div>
          <Text size="xs" color="secondary" weight="medium">
            {confirmModal.message}
          </Text>
          <div className="flex justify-end gap-2.5 pt-2 border-t border-line">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
            >
              {t('landlordCustomersCancelBtn')}
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={confirmModal.onConfirm}
            >
              {t('landlordCustomersConfirmDeleteBtn')}
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* MODAL 4: ALERT NOTIFICATION */}
      <Modal
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
        size="sm"
        showCloseButton={false}
      >
        <Modal.Body className="space-y-4 text-center">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center border bg-accent-soft text-accent border-accent-subtle">
            <Info className="w-7 h-7 text-accent" />
          </div>

          <div className="space-y-1.5">
            <Text as="h3" weight="black" color="default" size="base">
              {alertModal.title}
            </Text>
            <Text size="xs" color="secondary" weight="medium" className="leading-relaxed">
              {alertModal.message}
            </Text>
          </div>

          <Button
            fullWidth
            size="sm"
            variant="dark"
            onClick={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
          >
            {t('landlordCustomersUnderstood')}
          </Button>
        </Modal.Body>
      </Modal>
    </div>
  )
}
