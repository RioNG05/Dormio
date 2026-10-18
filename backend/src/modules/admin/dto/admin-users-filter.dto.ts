import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'
import { Type } from 'class-transformer'
import { UserRole, UserStatus } from '@prisma'

export class AdminUsersFilterDto {
  @ApiPropertyOptional({
    description: 'Search string matching username, phone number, email, or full name',
    example: 'Tuan',
  })
  @IsOptional()
  @IsString()
  query?: string

  @ApiPropertyOptional({
    description: 'Filter by primary user role',
    enum: UserRole,
    example: UserRole.landlord,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole

  @ApiPropertyOptional({
    description: 'Filter by account status',
    enum: UserStatus,
    example: UserStatus.active,
  })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus

  @ApiPropertyOptional({
    description: 'Start date filter for registration date (ISO 8601 string)',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  joinedFrom?: string

  @ApiPropertyOptional({
    description: 'End date filter for registration date (ISO 8601 string)',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  joinedTo?: string

  @ApiPropertyOptional({
    description: 'Current page number for pagination',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: 'Number of records per page',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10

  @ApiPropertyOptional({
    description: 'Sort field',
    enum: ['createdAt', 'username', 'phoneNumber'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'username' | 'phoneNumber' = 'createdAt'

  @ApiPropertyOptional({
    description: 'Sort direction',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc'
}

