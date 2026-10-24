import { ApiPropertyOptional } from '@nestjs/swagger'
import { IsOptional, IsString, IsUUID } from 'class-validator'
import { Type } from 'class-transformer'

export class QueryTenantsDto {
  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  @IsOptional()
  @Type(() => Number)
  page?: number = 1

  @ApiPropertyOptional({ description: 'Items per page', default: 10 })
  @IsOptional()
  @Type(() => Number)
  limit?: number = 10

  @ApiPropertyOptional({ description: 'Filter by search keyword (name, phone, room number)' })
  @IsOptional()
  @IsString()
  search?: string

  @ApiPropertyOptional({ description: 'Filter by room UUID' })
  @IsOptional()
  @IsUUID('4')
  roomId?: string

  @ApiPropertyOptional({ description: 'Filter by status (active, moved_out, all)' })
  @IsOptional()
  @IsString()
  status?: string
}

