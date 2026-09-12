import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Matches } from 'class-validator';

export class UpdateShiftDto {
  @ApiPropertyOptional({
    description: 'Name of the shift',
    example: 'Ca sáng sớm',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Start time in HH:mm format (24h)',
    example: '05:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ bắt đầu phải theo định dạng HH:mm (ví dụ 06:00)',
  })
  startTime?: string;

  @ApiPropertyOptional({
    description: 'End time in HH:mm format (24h)',
    example: '13:30',
  })
  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ kết thúc phải theo định dạng HH:mm (ví dụ 14:00)',
  })
  endTime?: string;
}
