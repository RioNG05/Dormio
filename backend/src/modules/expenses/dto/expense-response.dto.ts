import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Total matching records', example: 45 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Records per page', example: 6 })
  limit: number;

  @ApiProperty({ description: 'Total available pages', example: 8 })
  totalPages: number;
}

export class ExpenseItemDto {
  @ApiProperty({ description: 'Expense UUID' })
  id: string;

  @ApiProperty({ description: 'Display code for invoice/voucher tracking', example: 'CP-202608-01' })
  code: string;

  @ApiProperty({ description: 'Expense title / name', example: 'Bảo trì thang máy' })
  name: string;

  @ApiPropertyOptional({ description: 'Detailed description', nullable: true })
  description: string | null;

  @ApiProperty({ description: 'Category', example: 'Bảo trì & Sửa chữa' })
  category: string;

  @ApiProperty({ description: 'Expense amount in VND', example: 1500000 })
  amount: number;

  @ApiProperty({ description: 'Expense payment status', enum: ['pending', 'paid', 'canceled'] })
  status: 'pending' | 'paid' | 'canceled';

  @ApiProperty({ description: 'Date when the expense was paid (ISO string)' })
  paidAt: string;

  @ApiProperty({ description: 'Creation date (ISO string)' })
  createdAt: string;

  @ApiProperty({ description: 'Boarding house UUID' })
  boardingHouseId: string;

  @ApiPropertyOptional({ description: 'Room UUID if tied to a room', nullable: true })
  roomId: string | null;

  @ApiProperty({ description: 'Room display name (e.g. "Phòng 102" or "Toàn tòa nhà")', example: 'Toàn tòa nhà' })
  roomName: string;

  @ApiPropertyOptional({ description: 'Room number if room-specific', nullable: true, example: '102' })
  roomNumber: string | null;
}

export class ExpensesSummaryDto {
  @ApiProperty({ description: 'Total expenses amount in VND', example: 25000000 })
  totalAmount: number;

  @ApiProperty({ description: 'Total paid expenses amount in VND', example: 21500000 })
  paidAmount: number;

  @ApiProperty({ description: 'Total pending expenses amount in VND', example: 3500000 })
  pendingAmount: number;

  @ApiProperty({ description: 'Total canceled expenses amount in VND', example: 0 })
  canceledAmount: number;

  @ApiProperty({ description: 'Total expense items count', example: 12 })
  totalCount: number;

  @ApiProperty({ description: 'Count of paid items', example: 10 })
  paidCount: number;

  @ApiProperty({ description: 'Count of pending items', example: 2 })
  pendingCount: number;
}

export class ExpensesListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [ExpenseItemDto] })
  data: ExpenseItemDto[];

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;

  @ApiProperty({ type: ExpensesSummaryDto })
  summary: ExpensesSummaryDto;
}
