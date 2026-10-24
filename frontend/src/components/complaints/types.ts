import {
  Grievance,
  GrievancePriority,
  GrievanceStatus,
  GrievanceType,
  AdminGrievanceItem,
} from '@/services/grievance.service'

export type ComplaintRole = 'tenant' | 'landlord' | 'staff'

export interface ComplaintItem {
  id: string
  type: GrievanceType
  title: string
  description: string
  priority: GrievancePriority
  status: GrievanceStatus
  boardingHouseId?: string | null
  boardingHouseName?: string | null
  roomId?: string | null
  roomNumber?: string | null
  tenantId?: string
  tenantName?: string
  tenantPhone?: string
  tenantEmail?: string
  landlordName?: string | null
  landlordPhone?: string | null
  resolutionNote?: string | null
  resolvedAt?: string | null
  resolvedByName?: string | null
  images: { id: string; url: string; createdAt?: string }[]
  createdAt: string
  updatedAt?: string
}

export interface ComplaintsViewProps {
  role: ComplaintRole
  defaultHouseId?: string
}

export interface ComplaintCardProps {
  item: ComplaintItem
  role: ComplaintRole
  onSelect: (item: ComplaintItem) => void
}

export interface ComplaintTableProps {
  items: ComplaintItem[]
  role: ComplaintRole
  onSelect: (item: ComplaintItem) => void
}

export interface ComplaintDetailModalProps {
  isOpen: boolean
  item: ComplaintItem | null
  role: ComplaintRole
  onClose: () => void
  onPreviewImage: (url: string) => void
  onOpenResolve?: () => void
}

export interface ComplaintCreateModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: {
    title: string
    description: string
    priority: GrievancePriority
    imageUrls: string[]
  }) => Promise<void>
}

export interface ComplaintResolveModalProps {
  isOpen: boolean
  item: ComplaintItem | null
  role: ComplaintRole
  onClose: () => void
  onResolved: (updated: ComplaintItem) => void
}

export interface ComplaintLightboxModalProps {
  imageUrl: string | null
  onClose: () => void
}
