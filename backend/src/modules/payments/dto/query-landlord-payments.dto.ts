import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min } from 'class-validator';

export class QueryLandlordPaymentsDto {
  @ApiPropertyOptional({
    description: 'Lọc theo phòng cụ thể (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsOptional()
  @IsString()
  roomId?: string;

  @ApiPropertyOptional({
    description: 'Số trang hiện tại (bắt đầu từ 1)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Số lượng bản ghi mỗi trang',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Hình thức thanh toán: cash, banking, hoặc all',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  method?: string;

  @ApiPropertyOptional({
    description: 'Tháng thanh toán: 1-12 hoặc all',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  month?: string;

  @ApiPropertyOptional({
    description: 'Năm thanh toán: e.g. 2026 hoặc all',
    example: 'all',
  })
  @IsOptional()
  @IsString()
  year?: string;

  @ApiPropertyOptional({
    description: 'Từ khóa tìm kiếm (mã GD, số phòng, số biên nhận, người thanh toán)',
    example: '101',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
