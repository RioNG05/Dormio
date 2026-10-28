import { LandlordMeterEditAction } from '@/services/meter-reading.service'

export interface MeterHistoryRecord {
  id?: string
  period: string // "Tháng 09/2026"
  date: string // "01/09/2026 08:00"
  oldElec: number
  newElec: number
  oldWater: number
  newWater: number
  editReason?: string
  editedAt?: string
  editHistory?: Array<{
    id: string
    serviceName: string
    oldValue: number | null
    newValue: number
    reason: string | null
    createdAt: string
  }>
  editActions?: LandlordMeterEditAction[]
  isOpen?: boolean
}

export interface InvoiceRecord {
  id: string // "INV-202609-401"
  period: string // "Tháng 09/2026"
  monthSeq: string // "09/26"
  deadline: string
  status: 'Chưa thanh toán' | 'Đã thu'
  method: string
  isOverdue?: boolean
  editReason?: string
  editedAt?: string
}

export interface MaintenanceRecord {
  id: string
  title: string
  description?: string
  reportDate: string
  status: 'Đang xử lý' | 'Đã xong'
  priority: 'Mức độ cao' | 'Mức độ trung bình' | 'Mức độ nhẹ'
  completedDate?: string
}

export interface RoomCustomServiceItem {
  id: string
  name: string
  defaultPrice: string
  customPrice: string
  unit: string
  isCustom: boolean
  isRemovable: boolean
}

export interface FinancialBreakdown {
  elecUse: number
  elecCost: number
  waterUse: number
  waterCost: number
  meterTotal: number
  grandInvoiceTotal: number
}

