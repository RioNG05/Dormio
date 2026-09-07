import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ContractStatus,
  DepositStatus,
  DepositType,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  RoomStatus,
} from '@prisma';
import { RoomServiceItemDto, RoomTypeSummaryDto } from './room-response.dto';

export class RoomDashboardTenantDto {
  @ApiProperty({ example: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' })
  id: string;

  @ApiProperty({ example: 'Nguyen Van A' })
  fullName: string;

  @ApiProperty({ example: '0912345678' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'tenant@example.com' })
  email?: string | null;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../avatar.jpg' })
  avatarUrl?: string | null;

  @ApiProperty({ example: true })
  isPrimary: boolean;

  @ApiProperty({ example: true })
  hasIdentification: boolean;

  @ApiPropertyOptional({ example: '079201012345' })
  identityNumber?: string | null;

  @ApiPropertyOptional({ example: '1998-05-12T00:00:00.000Z' })
  dateOfBirth?: string | null;

  @ApiPropertyOptional({ example: 'male' })
  gender?: string | null;
}

export class RoomDashboardDepositDto {
  @ApiProperty({ example: 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' })
  id: string;

  @ApiProperty({ example: '3500000.00' })
  amount: string;

  @ApiProperty({ enum: DepositStatus, example: DepositStatus.paid })
  status: DepositStatus;

  @ApiProperty({ enum: DepositType, example: DepositType.contract })
  type: DepositType;
}

export class RoomDashboardDocumentDto {
  @ApiProperty({ example: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' })
  id: string;

  @ApiProperty({ example: 'https://storage.example.com/contracts/doc1.pdf' })
  url: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;
}

export class RoomDashboardContractDto {
  @ApiProperty({ example: 'd0eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' })
  id: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ example: '2027-09-01T00:00:00.000Z' })
  endDate: string;

  @ApiProperty({ example: '3500000.00' })
  rentPrice: string;

  @ApiProperty({ example: 5 })
  monthlyPaymentDate: number;

  @ApiProperty({ enum: ContractStatus, example: ContractStatus.active })
  status: ContractStatus;

  @ApiPropertyOptional({ example: 'Thanh toan tien phong vao ngay 5 hang thang' })
  note?: string | null;

  @ApiPropertyOptional({ type: RoomDashboardDepositDto })
  deposit?: RoomDashboardDepositDto | null;

  @ApiProperty({ type: [RoomDashboardTenantDto] })
  tenants: RoomDashboardTenantDto[];

  @ApiProperty({ type: [RoomDashboardDocumentDto] })
  documents: RoomDashboardDocumentDto[];
}

export class RoomDashboardRentalHistoryItemDto {
  @ApiProperty({ example: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380a55' })
  id: string;

  @ApiProperty({ example: '2025-08-01T00:00:00.000Z' })
  startDate: string;

  @ApiProperty({ example: '2026-08-01T00:00:00.000Z' })
  endDate: string;

  @ApiProperty({ example: '3200000.00' })
  rentPrice: string;

  @ApiProperty({ enum: ContractStatus, example: ContractStatus.expired })
  status: ContractStatus;

  @ApiProperty({ example: 'Tran Thi B' })
  primaryTenantName: string;

  @ApiProperty({ example: '0987654321' })
  primaryTenantPhone: string;

  @ApiProperty({ example: 2 })
  tenantsCount: number;
}

export class RoomDashboardInvoiceDto {
  @ApiProperty({ example: 'f0eebc99-9c0b-4ef8-bb6d-6bb9bd380a66' })
  id: string;

  @ApiProperty({ example: '3850000.00' })
  totalAmount: string;

  @ApiProperty({ enum: InvoiceStatus, example: InvoiceStatus.paid })
  status: InvoiceStatus;

  @ApiProperty({ example: '2026-09-10T00:00:00.000Z' })
  dueDate: string;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ enum: PaymentStatus, example: PaymentStatus.success })
  paymentStatus?: PaymentStatus | null;

  @ApiPropertyOptional({ enum: PaymentMethod, example: PaymentMethod.banking })
  paymentMethod?: PaymentMethod | null;
}

export class RoomDashboardMeterReadingDto {
  @ApiProperty({ example: '10eebc99-9c0b-4ef8-bb6d-6bb9bd380a77' })
  id: string;

  @ApiProperty({ example: '20eebc99-9c0b-4ef8-bb6d-6bb9bd380a88' })
  serviceId: string;

  @ApiProperty({ example: 'Điện' })
  serviceName: string;

  @ApiPropertyOptional({ example: '1240.50' })
  readingValue?: string | null;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../meter.jpg' })
  imageUrl?: string | null;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;
}

export class RoomDashboardDetailsDto {
  @ApiProperty({ example: '30eebc99-9c0b-4ef8-bb6d-6bb9bd380a99' })
  id: string;

  @ApiProperty({ example: '40eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa' })
  boardingHouseId: string;

  @ApiProperty({ example: 'P101' })
  roomNumber: string;

  @ApiProperty({ example: 1 })
  floor: number;

  @ApiPropertyOptional({ example: '25.5' })
  area?: string | null;

  @ApiPropertyOptional({ example: 2 })
  maxOccupants?: number | null;

  @ApiProperty({ enum: RoomStatus, example: RoomStatus.occupied })
  status: RoomStatus;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/.../room.jpg' })
  imageUrl?: string | null;

  @ApiProperty({ type: RoomTypeSummaryDto })
  roomType: RoomTypeSummaryDto;

  @ApiProperty({ example: '2026-09-01T00:00:00.000Z' })
  createdAt: string;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  updatedAt?: string | null;
}

export class RoomDashboardResponseDto {
  @ApiProperty({ type: RoomDashboardDetailsDto })
  room: RoomDashboardDetailsDto;

  @ApiProperty({ type: [RoomServiceItemDto] })
  services: RoomServiceItemDto[];

  @ApiPropertyOptional({ type: RoomDashboardContractDto })
  currentContract?: RoomDashboardContractDto | null;

  @ApiProperty({ type: [RoomDashboardRentalHistoryItemDto] })
  rentalHistory: RoomDashboardRentalHistoryItemDto[];

  @ApiProperty({ type: [RoomDashboardInvoiceDto] })
  invoices: RoomDashboardInvoiceDto[];

  @ApiProperty({ type: [RoomDashboardMeterReadingDto] })
  meterReadings: RoomDashboardMeterReadingDto[];
}
