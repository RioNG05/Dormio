import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TenantUserSummaryDto {
  @ApiProperty({ description: 'User ID UUID', example: 'd3b07384-d113-4c9f-8ec1-c30d9ec0d102' })
  id: string

  @ApiProperty({ description: 'Phone number', example: '0987654321' })
  phoneNumber: string

  @ApiProperty({ description: 'Full name or username', example: 'Nguyen Van An' })
  fullName: string

  @ApiPropertyOptional({ description: 'Email address', example: 'user@example.com' })
  email?: string | null

  @ApiPropertyOptional({ description: 'Avatar URL', example: 'https://example.com/avatar.jpg' })
  avatarUrl?: string | null
}

export class SearchTenantResponseDto {
  @ApiProperty({ description: 'Whether the lookup succeeded', example: true })
  success: boolean

  @ApiProperty({ description: 'Whether a user was found in Dormio system', example: true })
  found: boolean

  @ApiProperty({
    description: 'Whether the user is currently an active resident in this boarding house',
    example: false,
  })
  inBuilding: boolean

  @ApiPropertyOptional({
    description: 'Existing user details if found',
    type: TenantUserSummaryDto,
  })
  user?: TenantUserSummaryDto | null
}

