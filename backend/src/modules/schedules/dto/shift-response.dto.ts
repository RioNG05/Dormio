import { ApiProperty } from '@nestjs/swagger';

export class ShiftItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  boardingHouseId: string;

  @ApiProperty({ example: 'Ca sáng' })
  name: string;

  @ApiProperty({ example: '06:00' })
  startTime: string;

  @ApiProperty({ example: '14:00' })
  endTime: string;

  @ApiProperty({ example: '2026-09-12T00:00:00.000Z' })
  createdAt: string;
}
