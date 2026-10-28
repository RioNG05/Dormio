import React from 'react'
import { RoomItem } from '@/services/room.service'
import { PendingDepositResponse } from '@/services/contract.service'
import { RoomOccupantDto } from '@/services/tenant.service'
import { ToastItem, ToastType } from '@/components/ui'

export type ContractStep = 1 | 2 | 3

export type ContractFlowType = 'platform' | 'direct'

export type Gender = 'male' | 'female'

export interface HandoverMeterReadingItem {
  serviceId: string
  serviceName: string
  unit: string
  readingValue: number | ''
  imageUrl?: string | null
}

export interface TenantIdentificationState {
  identityNumber: string
  fullName: string
  dateOfBirth: string
  gender: Gender
  nationality: string
  placeOfOrigin: string
  placeOfResidence: string
  issueDate: string
  expiryDate: string
  note: string
  cardFrontUrl: string
  cardBackUrl: string
}

export interface ContractCreateContextValue {
  // Navigation & Step
  step: ContractStep
  isPending: boolean
  goToStep: (targetStep: ContractStep) => void

  // Room & Building
  rooms: RoomItem[]
  isLoadingRooms: boolean
  selectedRoomId: string
  selectedRoomObj: RoomItem | undefined
  setSelectedRoomId: (id: string) => void

  // Room Occupants (Room-First Contract Creation)
  roomOccupants: RoomOccupantDto[]
  isLoadingOccupants: boolean
  selectedOccupantId: string
  setSelectedOccupantId: (tenantId: string) => void
  isAddOccupantModalOpen: boolean
  setIsAddOccupantModalOpen: (open: boolean) => void
  fetchRoomOccupants: (roomId: string) => Promise<void>
  handleOccupantAdded: (newOccupant: RoomOccupantDto) => void

  // Flow & Deposit
  flowType: ContractFlowType
  pendingDeposit: PendingDepositResponse | null
  isCheckingDeposit: boolean

  // Tenant
  tenantPhone: string
  tenantFullName: string
  tenantEmail: string
  isSearchingPhone: boolean
  tenantFound: boolean | null
  hasIdentification: boolean
  canEditTenantInfo: boolean
  handlePhoneChange: (val: string) => void
  handleSearchPhone: (phone: string) => Promise<void>
  setTenantFullName: (name: string) => void
  setTenantEmail: (email: string) => void

  // Identification (CCCD)
  identification: TenantIdentificationState
  setIdentificationField: <K extends keyof TenantIdentificationState>(
    field: K,
    val: TenantIdentificationState[K],
  ) => void
  uploadingFront: boolean
  uploadingBack: boolean
  isDraggingFront: boolean
  isDraggingBack: boolean
  setIsDraggingFront: (val: boolean) => void
  setIsDraggingBack: (val: boolean) => void
  handlePhotoUpload: (
    e: React.ChangeEvent<HTMLInputElement>,
    side: 'front' | 'back',
  ) => Promise<void>
  handleDropFile: (e: React.DragEvent, side: 'front' | 'back') => void
  setCardFrontUrl: (url: string) => void
  setCardBackUrl: (url: string) => void
  previewModalImg: { url: string; title: string } | null
  setPreviewModalImg: (img: { url: string; title: string } | null) => void

  // Initial Handover Meter Readings
  initialMeterReadings: HandoverMeterReadingItem[]
  setInitialMeterReadings: React.Dispatch<React.SetStateAction<HandoverMeterReadingItem[]>>
  updateInitialMeterReading: (
    serviceId: string,
    updates: Partial<HandoverMeterReadingItem>,
  ) => void

  // Terms & Financials
  startDate: string
  endDate: string
  rentPrice: number
  depositAmount: number
  monthlyPaymentDate: number
  rentPaymentCycle: number
  note: string
  setStartDate: (val: string) => void
  setEndDate: (val: string) => void
  setRentPrice: (val: number) => void
  setDepositAmount: (val: number) => void
  setMonthlyPaymentDate: (val: number) => void
  setRentPaymentCycle: (val: number) => void
  setNote: (val: string) => void

  // Form Status & Validation
  errorMessage: string | null
  setErrorMessage: (msg: string | null) => void
  isDirty: boolean
  setIsDirty: (dirty: boolean) => void
  showConfirmClose: boolean
  setShowConfirmClose: (show: boolean) => void
  handleAttemptClose: () => void
  handleConfirmClose: () => void
  handleStep1Next: () => boolean
  handleStep2Next: () => boolean
  handleSubmitContract: () => Promise<void>

  // Toast Notifications
  toasts: ToastItem[]
  showToast: (message: string, type?: ToastType, title?: string) => void
  dismissToast: (id: string) => void
}

