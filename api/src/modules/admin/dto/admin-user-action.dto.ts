import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsInt, IsNotEmpty, IsOptional, IsString, Min, MinLength } from 'class-validator'
import { SubscriptionPackage, UserRole, UserStatus } from '@prisma'

export class UpdateUserStatusDto {
  @ApiProperty({
    description: 'Target user status',
    enum: UserStatus,
    example: UserStatus.banned,
  })
  @IsEnum(UserStatus)
  status: UserStatus

  @ApiPropertyOptional({
    description: 'Administrative reason for updating status',
    example: 'Spam listing violation / suspicious activity',
  })
  @IsOptional()
  @IsString()
  reason?: string
}

export class UpdateUserRoleDto {
  @ApiProperty({
    description: 'New role to assign to the user',
    enum: UserRole,
    example: UserRole.landlord,
  })
  @IsEnum(UserRole)
  role: UserRole

  @ApiPropertyOptional({
    description: 'Administrative reason for changing user role',
    example: 'Verified landlord identity documents and granted landlord privileges',
  })
  @IsOptional()
  @IsString()
  reason?: string
}

export class ResetUserPasswordDto {
  @ApiPropertyOptional({
    description: 'Whether the user must change password upon next login',
    default: true,
  })
  @IsOptional()
  mustChangePassword?: boolean = true

  @ApiPropertyOptional({
    description: 'Optional custom temporary password. If omitted, a secure default is assigned',
    example: 'Dormio@2026',
  })
  @IsOptional()
  @IsString()
  @MinLength(6)
  temporaryPassword?: string
}

export class UpdateUserTierDto {
  @ApiProperty({
    description: 'Target subscription tier for the user',
    enum: SubscriptionPackage,
    example: SubscriptionPackage.pro,
  })
  @IsEnum(SubscriptionPackage)
  tier: SubscriptionPackage

  @ApiPropertyOptional({
    description: 'Duration in months for Plus/Pro plan. Ignored for Free tier. Defaults to 1 month.',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  durationMonths?: number = 1

  @ApiPropertyOptional({
    description: 'Administrative justification reason for changing subscription tier',
    example: 'Platform promotion / VIP customer tier upgrade',
  })
  @IsOptional()
  @IsString()
  reason?: string
}

