import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsString,
  IsNotEmpty,
  IsNumber,
  Min,
  IsOptional,
  IsEnum,
  IsISO8601,
  MaxLength,
} from 'class-validator'
import { Type } from 'class-transformer'
import { AssetCondition } from '@prisma'

export class CreateMaintenanceLogDto {
  @ApiProperty({
    description: 'Type of maintenance activity (e.g., repair, maintenance, inspection, replacement)',
    example: 'repair',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  type: string

  @ApiProperty({
    description: 'Description of the issue or maintenance work conducted',
    example: 'Bảo dưỡng định kỳ, nạp gas và vệ sinh lưới lọc',
  })
  @IsString()
  @IsNotEmpty()
  description: string

  @ApiPropertyOptional({
    description: 'Total cost incurred for this maintenance event in VND',
    example: 350000,
    default: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  cost?: number

  @ApiPropertyOptional({
    description: 'Performer or technician name / company',
    example: 'Anh Nam - Thợ điện lạnh',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  performer?: string

  @ApiPropertyOptional({
    description: 'Date and time when the work was performed (ISO 8601)',
    example: '2026-03-20T10:00:00.000Z',
  })
  @IsOptional()
  @IsISO8601()
  performedAt?: string

  @ApiPropertyOptional({
    description: 'Optional update to the asset physical condition',
    enum: AssetCondition,
    example: AssetCondition.good,
  })
  @IsOptional()
  @IsEnum(AssetCondition)
  setCondition?: AssetCondition
}
