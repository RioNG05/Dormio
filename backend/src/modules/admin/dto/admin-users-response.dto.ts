import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { AuditLogAction, UserRole, UserStatus } from '@prisma'

export class AdminUserIdentificationDto {
  @ApiProperty({ description: 'Identity number (CCCD/CMND)' })
  identityNumber: string

  @ApiProperty({ description: 'Full legal name on identity card' })
  fullName: string

  @ApiProperty({ description: 'Date of birth' })
  dateOfBirth: string

  @ApiProperty({ description: 'Gender', enum: ['male', 'female'] })
  gender: string

  @ApiPropertyOptional({ description: 'Front photo URL of CCCD' })
  cardFrontUrl?: string

  @ApiPropertyOptional({ description: 'Back photo URL of CCCD' })
  cardBackUrl?: string

  @ApiPropertyOptional({ description: 'Place of residence' })
  placeOfResidence?: any

  @ApiPropertyOptional({ description: 'Place of origin' })
  placeOfOrigin?: any

  @ApiPropertyOptional({ description: 'Issue date' })
  issueDate?: string
}

export class AdminUserBankAccountDto {
  @ApiProperty({ description: 'Bank code / name' })
  bankName: string

  @ApiProperty({ description: 'Account number' })
  accountNumber: string

  @ApiProperty({ description: 'Account holder name' })
  accountName: string
}

export class AdminUserItemDto {
  @ApiProperty({ description: 'Unique user UUID' })
  id: string

  @ApiPropertyOptional({ description: 'Username of user' })
  username?: string | null

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string | null

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string | null

  @ApiProperty({ description: 'Assigned system role', enum: UserRole })
  role: UserRole

  @ApiProperty({ description: 'Account status', enum: UserStatus })
  status: UserStatus

  @ApiProperty({ description: 'Whether user must change password upon login' })
  mustChangePassword: boolean

  @ApiProperty({ description: 'Registration / Join timestamp (ISO 8601)' })
  createdAt: string

  @ApiPropertyOptional({ description: 'Last update timestamp (ISO 8601)' })
  updatedAt?: string | null

  @ApiPropertyOptional({ description: 'Full verified legal name if identified' })
  fullName?: string | null

  @ApiPropertyOptional({ description: 'Citizen identity number if identified' })
  identityNumber?: string | null

  @ApiProperty({ description: 'Whether user has verified citizen identification' })
  isIdentityVerified: boolean

  @ApiProperty({ description: 'Count of boarding houses owned (for landlords)' })
  housesCount: number

  @ApiProperty({ description: 'Count of tenant contracts (for tenants)' })
  contractsCount: number

  @ApiProperty({ description: 'Count of rental posts created' })
  postsCount: number

  @ApiPropertyOptional({ description: 'Active subscription plan (free, plus, pro)' })
  subscriptionPackage?: string | null

  @ApiPropertyOptional({ description: 'Timestamp of last recorded system action' })
  lastActiveAt?: string | null
}

export class AdminUserDetailDto extends AdminUserItemDto {
  @ApiPropertyOptional({ description: 'Bio of user' })
  bio?: string | null

  @ApiPropertyOptional({ description: 'Full citizen identification record', type: AdminUserIdentificationDto })
  identification?: AdminUserIdentificationDto | null

  @ApiPropertyOptional({ description: 'Bank account details', type: AdminUserBankAccountDto })
  bankAccount?: AdminUserBankAccountDto | null

  @ApiProperty({ description: 'List of boarding house names owned by user', type: [String] })
  houseNames: string[]

  @ApiProperty({ description: 'List of recent system activity logs' })
  recentActivities: AdminUserActivityDto[]
}

export class AdminUserActivityDto {
  @ApiProperty({ description: 'Activity / Audit log UUID' })
  id: string

  @ApiProperty({ description: 'Action executed', enum: AuditLogAction })
  action: AuditLogAction

  @ApiProperty({ description: 'Target entity type (e.g. USER, CONTRACT, PAYMENT, INVOICE)' })
  entityType: string

  @ApiProperty({ description: 'Target entity UUID' })
  entityId: string

  @ApiPropertyOptional({ description: 'Previous state before change' })
  oldValue?: any

  @ApiPropertyOptional({ description: 'New state after change' })
  newValue?: any

  @ApiProperty({ description: 'IP address where action originated' })
  ipAddress: string

  @ApiProperty({ description: 'Timestamp when action occurred' })
  createdAt: string
}

export class AdminUsersSummaryDto {
  @ApiProperty({ description: 'Total registered users in platform' })
  totalUsers: number

  @ApiProperty({ description: 'Active accounts' })
  activeUsers: number

  @ApiProperty({ description: 'Banned / locked accounts' })
  bannedUsers: number

  @ApiProperty({ description: 'Inactive accounts' })
  inactiveUsers: number

  @ApiProperty({ description: 'Total landlords' })
  landlordsCount: number

  @ApiProperty({ description: 'Total tenants' })
  tenantsCount: number

  @ApiProperty({ description: 'Total staff/employees' })
  employeesCount: number
}

export class AdminUsersListResponseDto {
  @ApiProperty({ description: 'List of users matching filter', type: [AdminUserItemDto] })
  items: AdminUserItemDto[]

  @ApiProperty({ description: 'Total count matching filters' })
  total: number

  @ApiProperty({ description: 'Current page number' })
  page: number

  @ApiProperty({ description: 'Limit per page' })
  limit: number

  @ApiProperty({ description: 'Calculated total pages' })
  totalPages: number

  @ApiProperty({ description: 'High-level KPI statistics of platform users', type: AdminUsersSummaryDto })
  summary: AdminUsersSummaryDto
}

export class AdminUserActivitiesResponseDto {
  @ApiProperty({ description: 'List of audit activities', type: [AdminUserActivityDto] })
  items: AdminUserActivityDto[]

  @ApiProperty({ description: 'Total activity records' })
  total: number

  @ApiProperty({ description: 'Current page' })
  page: number

  @ApiProperty({ description: 'Page limit' })
  limit: number
}

