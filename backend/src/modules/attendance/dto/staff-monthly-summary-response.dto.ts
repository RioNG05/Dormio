import { ApiProperty } from '@nestjs/swagger';

export class StaffMonthlySummaryResponseDto {
  @ApiProperty({ example: '2026-09', description: 'Month in YYYY-MM format' })
  month: string;

  @ApiProperty({ example: 8, description: 'Total scheduled/attended shifts in the month' })
  totalShifts: number;

  @ApiProperty({ example: 64, description: 'Total working hours completed in the month' })
  totalHours: number;

  @ApiProperty({ example: 87.5, description: 'On-time rate percentage (0-100)' })
  onTimeRate: number;

  @ApiProperty({ example: 7, description: 'Number of on-time attendance records' })
  onTimeCount: number;

  @ApiProperty({ example: 1, description: 'Number of late attendance records' })
  lateCount: number;

  @ApiProperty({ example: 0, description: 'Number of early checkout records' })
  earlyCount: number;
}

