import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { OccupantStatus } from '@prisma'

export class RoomOccupantTenantDto {
  @ApiProperty({ description: 'Tenant user ID UUID' })
  id: string

  @ApiProperty({ description: 'Phone number' })
  phoneNumber: string

  @ApiProperty({ description: 'Full name' })
  fullName: string

  @ApiPropertyOptional({ description: 'Email address' })
  email?: string | null

  @ApiPropertyOptional({ description: 'Avatar URL' })
  avatarUrl?: string | null

  @ApiPropertyOptional({ description: 'Citizen identity number (CCCD)' })
  identityNumber?: string | null

  @ApiPropertyOptional({ description: 'Date of birth' })
  dateOfBirth?: string | null

  @ApiPropertyOptional({ description: 'Gender' })
  gender?: string | null

  @ApiPropertyOptional({ description: 'Place of residence' })
  placeOfResidence?: any

  @ApiPropertyOptional({ description: 'Identity card front URL' })
  cardFrontUrl?: string | null

  @ApiPropertyOptional({ description: 'Identity card back URL' })
  cardBackUrl?: string | null

  @ApiProperty({ description: 'Whether tenant has a registered Dormio account' })
  hasAccount: boolean
}

export class RoomOccupantResponseDto {
  @ApiProperty({ description: 'RoomOccupant ID UUID' })
  id: string

  @ApiProperty({ description: 'Boarding house ID UUID' })
  boardingHouseId: string

  @ApiProperty({ description: 'Room ID UUID' })
  roomId: string

  @ApiProperty({ description: 'Room number' })
  roomNumber: string

  @ApiProperty({ description: 'Tenant user ID UUID' })
  tenantId: string

  @ApiProperty({ enum: OccupantStatus, example: OccupantStatus.active })
  status: OccupantStatus

  @ApiProperty({ description: 'Date joined' })
  joinedAt: Date

  @ApiPropertyOptional({ description: 'Date left' })
  leftAt?: Date | null

  @ApiPropertyOptional({ description: 'Note' })
  note?: string | null

  @ApiProperty({ type: RoomOccupantTenantDto })
  tenant: RoomOccupantTenantDto
}

