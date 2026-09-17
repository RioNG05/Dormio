import { ApiProperty } from '@nestjs/swagger';

export class StaffShiftTypeResponseDto {
  @ApiProperty({
    example: 'd9b2d63d-a233-4f9e-a81d-b53e7f4c0291',
    description: 'Unique shift ID in database',
  })
  id: string;

  @ApiProperty({
    example: 'Ca Sáng (07:00 - 15:00)',
    description: 'Shift name as configured in database',
  })
  name: string;

  @ApiProperty({
    example: '07:00',
    description: 'Start time formatted as HH:mm',
  })
  startTime: string;

  @ApiProperty({
    example: '15:00',
    description: 'End time formatted as HH:mm',
  })
  endTime: string;
}

