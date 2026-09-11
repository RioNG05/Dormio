import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { ServiceStatus } from '@prisma';

export class CreateServiceDto {
  @ApiProperty({
    description: 'Name of the service (e.g. Điện sinh hoạt, Wifi, Giữ xe máy)',
    example: 'Điện sinh hoạt',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên dịch vụ không được để trống' })
  name: string;

  @ApiProperty({
    description: 'Unit price for this service (in VNĐ)',
    example: 3500,
  })
  @IsNumber({}, { message: 'Đơn giá phải là số' })
  @Min(0, { message: 'Đơn giá không được nhỏ hơn 0' })
  price: number;

  @ApiProperty({
    description: 'Unit of measurement (e.g. kWh, m3, phòng/tháng, xe/tháng)',
    example: 'kWh',
  })
  @IsString()
  @IsNotEmpty({ message: 'Đơn vị tính không được để trống' })
  unit: string;

  @ApiPropertyOptional({
    description: 'Whether service usage is calculated via meter readings',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isMetered?: boolean = false;

  @ApiPropertyOptional({
    description: 'Whether this service is automatically attached to rooms by default',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  autoApplied?: boolean = true;

  @ApiPropertyOptional({
    description: 'Status of the service',
    enum: ServiceStatus,
    default: ServiceStatus.active,
  })
  @IsOptional()
  @IsEnum(ServiceStatus)
  status?: ServiceStatus = ServiceStatus.active;

  @ApiPropertyOptional({
    description: 'Optional list of room IDs to attach this service to immediately',
    type: [String],
    example: ['cec7370a-f423-4a6d-b999-ffd15d5c8c48'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true, message: 'roomIds phải là danh sách UUID hợp lệ' })
  roomIds?: string[];
}
