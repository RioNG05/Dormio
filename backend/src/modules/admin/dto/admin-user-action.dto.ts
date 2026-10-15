import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator'
import { UserRole, UserStatus } from '@prisma'

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

