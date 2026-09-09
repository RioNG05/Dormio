import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsEnum, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DepositStatus, DepositType } from '@prisma';

export class QueryDepositsDto {
  @ApiPropertyOptional({
    description: 'Page number (default: 1)',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page (default: 10)',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Search by room number, tenant name, phone number, or deposit ID',
    example: '102',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by deposit status',
    enum: DepositStatus,
    example: DepositStatus.paid,
  })
  @IsOptional()
  @IsEnum(DepositStatus)
  status?: DepositStatus;

  @ApiPropertyOptional({
    description: 'Filter by deposit type (contract | platform)',
    enum: DepositType,
    example: DepositType.contract,
  })
  @IsOptional()
  @IsEnum(DepositType)
  type?: DepositType;

  @ApiPropertyOptional({
    description: 'Filter by deposit category: "hold" (cọc giữ chỗ, contractId is null) or "contract" (cọc hợp đồng, contractId is not null)',
    enum: ['hold', 'contract'],
    example: 'hold',
  })
  @IsOptional()
  @IsString()
  depositCategory?: 'hold' | 'contract';
}
