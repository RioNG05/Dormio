import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class LandlordTenantItemDto {
  @ApiProperty({ description: 'Unique identifier (Occupant ID or Customer ID)' })
  id: string

  @ApiProperty({ description: 'User ID UUID' })
  userId: string

  @ApiProperty({ description: 'Full name' })
  fullName: string

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string

  @ApiPropertyOptional({ description: 'Room ID UUID' })
  roomId?: string

  @ApiProperty({ description: 'Room number' })
  roomNumber: string

  @ApiProperty({ description: 'Boarding house ID UUID' })
  boardingHouseId: string

  @ApiProperty({ description: 'Tenancy category', enum: ['contract', 'direct_occupant'] })
  tenancyType: 'contract' | 'direct_occupant'

  @ApiPropertyOptional({ description: 'Contract ID if contracted' })
  contractId?: string

  @ApiProperty({ description: 'Status display string' })
  status: string

  @ApiProperty({ description: 'Join date' })
  joinedAt: string

  @ApiPropertyOptional({ description: 'End date for contracts' })
  endDate?: string

  @ApiPropertyOptional({ description: 'Days remaining for contract' })
  daysRemaining?: number

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string | null

  @ApiPropertyOptional({ description: 'CCCD number' })
  identityNumber?: string | null

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: string | null

  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string | null

  @ApiPropertyOptional({ description: 'Address' })
  address?: string | null

  @ApiPropertyOptional({ description: 'Card front URL' })
  cardFrontUrl?: string | null

  @ApiPropertyOptional({ description: 'Card back URL' })
  cardBackUrl?: string | null

  @ApiProperty({ description: 'Whether the user has a full registered Dormio account' })
  hasAccount: boolean

  @ApiProperty({ description: 'Whether the user must change password (true = not yet logged in / activated)' })
  mustChangePassword: boolean
}

export class LandlordTenantListResponseDto {
  @ApiProperty({ type: [LandlordTenantItemDto] })
  data: LandlordTenantItemDto[]

  @ApiProperty({ description: 'Total records matching query' })
  total: number

  @ApiProperty({ description: 'Current page' })
  page: number

  @ApiProperty({ description: 'Page limit' })
  limit: number

  @ApiProperty({ description: 'Total pages' })
  totalPages: number
}
