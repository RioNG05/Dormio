import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AssignmentStatus, UserRole } from '@prisma';

export class JobPositionDto {
  @ApiProperty({ example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f' })
  id: string;

  @ApiProperty({ example: 'Quản lý tòa nhà' })
  name: string;

  @ApiPropertyOptional({ example: 'Quản lý vận hành và khách thuê', nullable: true })
  description?: string | null;

  @ApiPropertyOptional({ example: 3 })
  staffCount?: number;

  @ApiProperty()
  createdAt: Date;
}

export class StaffItemDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  assignmentId: string;

  @ApiProperty({ example: 'e1e2e3e4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  employeeId: string;

  @ApiProperty({ example: 'u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  userId: string;

  @ApiProperty({ example: 'Nguyễn Văn Bảo' })
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'bao.nguyen@dormio.vn', nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...', nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f' })
  positionId: string;

  @ApiProperty({ example: 'Quản lý tòa nhà' })
  positionName: string;

  @ApiPropertyOptional({ example: 'Quản lý và giám sát cơ sở vật chất', nullable: true })
  positionDescription?: string | null;

  @ApiProperty({ enum: AssignmentStatus, example: AssignmentStatus.active })
  status: AssignmentStatus;

  @ApiProperty()
  joinedAt: Date;

  @ApiPropertyOptional({ nullable: true })
  leftAt?: Date | null;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty({ enum: UserRole, example: UserRole.employee })
  userRole: UserRole;

  @ApiProperty({ example: false })
  mustChangePassword: boolean;
}

export class StaffSummaryDto {
  @ApiProperty({ example: 4 })
  totalStaff: number;

  @ApiProperty({ example: 3 })
  activeStaff: number;

  @ApiProperty({ example: 1 })
  inactiveStaff: number;

  @ApiProperty({ example: 3 })
  positionsCount: number;
}

export class PaginationMetaDto {
  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 15 })
  total: number;

  @ApiProperty({ example: 2 })
  totalPages: number;
}

export class StaffListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [StaffItemDto] })
  data: StaffItemDto[];

  @ApiProperty({ type: StaffSummaryDto })
  summary: StaffSummaryDto;

  @ApiProperty({ type: PaginationMetaDto })
  meta: PaginationMetaDto;
}

export class SearchUserItemDto {
  @ApiProperty({ example: 'u1u2u3u4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  id: string;

  @ApiProperty({ example: 'Nguyễn Văn Bảo' })
  fullName: string;

  @ApiProperty({ example: '0901234567' })
  phoneNumber: string;

  @ApiPropertyOptional({ example: 'bao.nguyen@dormio.vn', nullable: true })
  email?: string | null;

  @ApiPropertyOptional({ nullable: true })
  avatarUrl?: string | null;

  @ApiProperty({ enum: UserRole, example: UserRole.leasing_agent })
  role: UserRole;

  @ApiPropertyOptional({ example: false })
  isAlreadyStaffAtThisHouse?: boolean;
}

export class SearchUserResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ example: true })
  found: boolean;

  @ApiPropertyOptional({ type: SearchUserItemDto, nullable: true })
  user?: SearchUserItemDto | null;
}

export class OnboardStaffResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: StaffItemDto })
  data: StaffItemDto;

  @ApiProperty({ example: false })
  isNewUser: boolean;

  @ApiPropertyOptional({
    example: 'A8xK29qZ',
    description: 'Generated temporary password if a new account was created',
  })
  generatedPassword?: string;

  @ApiProperty({ example: 'Thêm nhân viên thành công' })
  message: string;
}
