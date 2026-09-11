import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';

export class CreateShiftDto {
  @ApiProperty({
    description: 'Name of the shift',
    example: 'Ca sáng',
  })
  @IsString()
  @IsNotEmpty({ message: 'Tên ca làm việc không được để trống' })
  name: string;

  @ApiProperty({
    description: 'Start time in HH:mm format (24h)',
    example: '06:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ bắt đầu phải theo định dạng HH:mm (ví dụ 06:00)',
  })
  startTime: string;

  @ApiProperty({
    description: 'End time in HH:mm format (24h)',
    example: '14:00',
  })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'Giờ kết thúc phải theo định dạng HH:mm (ví dụ 14:00)',
  })
  endTime: string;
}
