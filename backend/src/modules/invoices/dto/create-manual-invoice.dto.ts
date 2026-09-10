import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsUUID,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ServiceFeeItemDto {
  @ApiProperty({ description: 'Name of the service', example: 'WiFi' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Fee amount in VND', example: 100000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateManualInvoiceDto {
  @ApiProperty({
    description: 'Target Room ID (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID('4')
  roomId: string;

  @ApiProperty({
    description: 'Billing period in format MM/YYYY',
    example: '08/2026',
  })
  @IsString()
  period: string;

  @ApiProperty({
    description: 'Payment deadline / Due date',
    example: '2026-08-20T00:00:00.000Z',
  })
  @IsString()
  dueDate: string;

  @ApiProperty({
    description: 'Room rental base amount in VND',
    example: 3500000,
  })
  @IsNumber()
  @Min(0)
  rentAmount: number;

  @ApiPropertyOptional({ description: 'Previous electricity meter index', example: 1318 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  elecOld?: number;

  @ApiPropertyOptional({ description: 'Current electricity meter index', example: 1418 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  elecNew?: number;

  @ApiPropertyOptional({ description: 'Electricity unit price in VND/kWh', example: 3500 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  elecRate?: number;

  @ApiPropertyOptional({ description: 'Previous water meter index', example: 240 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterOld?: number;

  @ApiPropertyOptional({ description: 'Current water meter index', example: 252 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterNew?: number;

  @ApiPropertyOptional({ description: 'Water unit price in VND/m³', example: 15000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  waterRate?: number;

  @ApiPropertyOptional({
    description: 'Other flat service fees (wifi, trash, cleaning, etc.)',
    type: [ServiceFeeItemDto],
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ServiceFeeItemDto)
  serviceFees?: ServiceFeeItemDto[];

  @ApiPropertyOptional({ description: 'Discount or deduction amount in VND', example: 0, default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiPropertyOptional({ description: 'Optional note from landlord', example: 'Đã trừ 50k hỗ trợ wifi' })
  @IsOptional()
  @IsString()
  note?: string;
}
