import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum AdminNotifyChannel {
  in_app = 'in_app',
  zalo = 'zalo',
  sms = 'sms',
  email = 'email',
}

export enum AdminNotifyTarget {
  all_users = 'all_users',
  all_landlords = 'all_landlords',
  all_staff = 'all_staff',
  all_admins = 'all_admins',
  specific_user = 'specific_user',
}

export enum AdminNotifyStatus {
  pending = 'pending',
  sent = 'sent',
  failed = 'failed',
  canceled = 'canceled',
}

export class CreateMassNotificationDto {
  @ApiProperty({
    description: 'Target delivery channel',
    enum: AdminNotifyChannel,
    example: AdminNotifyChannel.email,
  })
  @IsEnum(AdminNotifyChannel)
  @IsNotEmpty()
  channel: AdminNotifyChannel;

  @ApiProperty({
    description: 'Target recipient audience type',
    enum: AdminNotifyTarget,
    example: AdminNotifyTarget.all_users,
  })
  @IsEnum(AdminNotifyTarget)
  @IsNotEmpty()
  targetType: AdminNotifyTarget;

  @ApiPropertyOptional({
    description: 'Required if targetType is specific_user. Target user UUID.',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsOptional()
  @IsUUID('4')
  targetId?: string;

  @ApiProperty({
    description: 'Title / Subject of the notification message',
    example: 'Thông báo nâng cấp hệ thống định kỳ',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  title: string;

  @ApiProperty({
    description: 'Body content of the notification message',
    example: 'Dormio sẽ bảo trì nâng cấp máy chủ từ 01:00 đến 03:00 sáng mai.',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5)
  content: string;
}

export class MassNotificationQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by job status',
    enum: AdminNotifyStatus,
  })
  @IsOptional()
  @IsEnum(AdminNotifyStatus)
  status?: AdminNotifyStatus;

  @ApiPropertyOptional({
    description: 'Filter by delivery channel',
    enum: AdminNotifyChannel,
  })
  @IsOptional()
  @IsEnum(AdminNotifyChannel)
  channel?: AdminNotifyChannel;

  @ApiPropertyOptional({
    description: 'Search by title or content',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}

export class MassNotificationItemDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  createdBy: string;

  @ApiPropertyOptional({ example: 'Admin Quản Trị' })
  creatorName?: string;

  @ApiProperty({ enum: AdminNotifyChannel, example: 'email' })
  channel: AdminNotifyChannel;

  @ApiProperty({ enum: AdminNotifyTarget, example: 'all_users' })
  targetType: AdminNotifyTarget;

  @ApiProperty({ example: 'Toàn bộ người dùng' })
  targetLabel: string;

  @ApiPropertyOptional({ example: '123e4567-e89b-12d3-a456-426614174002' })
  targetId?: string;

  @ApiPropertyOptional({ example: 'Nguyễn Văn A' })
  targetUserName?: string;

  @ApiProperty({ example: 'Thông báo bảo trì hệ thống' })
  title: string;

  @ApiProperty({ example: 'Nội dung chi tiết thông báo...' })
  content: string;

  @ApiProperty({ enum: AdminNotifyStatus, example: 'sent' })
  status: AdminNotifyStatus;

  @ApiProperty({ example: 12450 })
  sentCount: number;

  @ApiProperty({ example: 12 })
  failedCount: number;

  @ApiProperty({ example: 12462 })
  totalRecipients: number;

  @ApiProperty({ example: '2026-09-11T15:30:00.000Z' })
  createdAt: string;
}

export class MassNotificationStatusCountsDto {
  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 38 })
  sent: number;

  @ApiProperty({ example: 5 })
  pending: number;

  @ApiProperty({ example: 2 })
  failed: number;
}

export class MassNotificationListResponseDto {
  @ApiProperty({ type: [MassNotificationItemDto] })
  items: MassNotificationItemDto[];

  @ApiProperty({ example: 45 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 5 })
  totalPages: number;

  @ApiProperty({ type: MassNotificationStatusCountsDto })
  counts: MassNotificationStatusCountsDto;
}
