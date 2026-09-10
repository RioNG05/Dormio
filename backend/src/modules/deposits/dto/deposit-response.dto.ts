import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DepositStatus, DepositType } from '@prisma';

export class DepositResponseDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'room-uuid-1' })
  roomId: string;

  @ApiProperty({ example: '102' })
  roomNumber: string;

  @ApiProperty({ example: 'house-uuid-1' })
  boardingHouseId: string;

  @ApiProperty({ example: 'Dormio Premier Quận 1' })
  boardingHouseName: string;

  @ApiPropertyOptional({ example: 'contract-uuid-1', nullable: true })
  contractId: string | null;

  @ApiPropertyOptional({ example: 'post-uuid-1', nullable: true })
  postId: string | null;

  @ApiProperty({ enum: DepositType, example: DepositType.contract })
  type: DepositType;

  @ApiProperty({ enum: ['hold', 'contract'], example: 'hold' })
  depositCategory: 'hold' | 'contract';

  @ApiProperty({ example: 1000000 })
  amount: number;

  @ApiProperty({ example: 1000000 })
  originalAmount: number;

  @ApiProperty({ enum: DepositStatus, example: DepositStatus.paid })
  status: DepositStatus;

  @ApiProperty({ example: true })
  recordedManually: boolean;

  @ApiPropertyOptional({ example: 'user-uuid-1', nullable: true })
  recordedBy: string | null;

  @ApiProperty({ example: 'Trần Thị Mai' })
  tenantName: string;

  @ApiProperty({ example: '0977234567' })
  tenantPhone: string;

  @ApiPropertyOptional({ example: '2026-09-25', nullable: true })
  expiryDate: string | null;

  @ApiProperty({ example: '15/08/2026' })
  depositDate: string;

  @ApiProperty({ example: 0 })
  deductedAmount: number;

  @ApiProperty({ example: 0 })
  refundAmount: number;

  @ApiPropertyOptional({ example: 'Khấu trừ 100% cọc', nullable: true })
  deductionReason: string | null;

  @ApiPropertyOptional({ example: 'Cọc giữ chỗ hẹn chốt hợp đồng', nullable: true })
  note: string | null;

  @ApiProperty({ example: '2026-08-15T10:00:00.000Z' })
  createdAt: string;
}

export class DepositStatsDto {
  @ApiProperty({ example: 25000000 })
  totalHoldingAmount: number;

  @ApiProperty({ example: 10000000 })
  totalHoldTypeAmount: number;

  @ApiProperty({ example: 5000000 })
  totalRefundedAmount: number;

  @ApiProperty({ example: 3000000 })
  totalDeductedAmount: number;

  @ApiProperty({ example: 8 })
  holdingCountTotal: number;

  @ApiProperty({ example: 4 })
  holdTypeHoldingCountTotal: number;

  @ApiProperty({ example: 3 })
  refundedCountTotal: number;

  @ApiProperty({ example: 2 })
  deductedCountTotal: number;

  @ApiProperty({ example: 10 })
  holdTypeCountTotal: number;

  @ApiProperty({ example: 10 })
  contractTypeCountTotal: number;
}

export class PaginatedDepositsResponseDto {
  @ApiProperty({ type: [DepositResponseDto] })
  data: DepositResponseDto[];

  @ApiProperty({ type: DepositStatsDto })
  stats: DepositStatsDto;

  @ApiProperty({
    example: {
      total: 20,
      page: 1,
      limit: 10,
      totalPages: 2,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
