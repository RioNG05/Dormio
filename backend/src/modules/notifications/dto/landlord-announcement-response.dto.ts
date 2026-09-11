import { ApiProperty } from '@nestjs/swagger';

export class LandlordAnnouncementItemDto {
  @ApiProperty({ format: 'uuid', example: 'd3b07384-d113-4045-9273-04285b7b6c5a' })
  id: string;

  @ApiProperty({ example: 'Thông báo cúp điện bảo trì lưới điện' })
  title: string;

  @ApiProperty({ example: 'Điện lực khu vực sẽ tiến hành bảo trì lưới điện...' })
  content: string;

  @ApiProperty({ example: 'Điện nước' })
  category: string;

  @ApiProperty({ example: 'Toàn bộ tòa nhà' })
  targetScope: string;

  @ApiProperty({ example: '2026-08-28 09:15' })
  sentAt: string;

  @ApiProperty({ example: 'BQL Tòa nhà' })
  sender: string;

  @ApiProperty({ example: 45 })
  readCount: number;

  @ApiProperty({ example: 50 })
  totalTarget: number;

  @ApiProperty({ example: 'Thông báo hệ thống' })
  channel: string;

  @ApiProperty({ example: '2026-08-28T09:15:00.000Z' })
  createdAt: Date;
}

export class AnnouncementPaginationMetaDto {
  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class LandlordAnnouncementsSummaryDto {
  @ApiProperty({ example: 12 })
  totalAnnouncements: number;

  @ApiProperty({ example: 48 })
  totalTargetTenants: number;

  @ApiProperty({ example: 3 })
  emergencyCount: number;
}

export class LandlordAnnouncementsResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [LandlordAnnouncementItemDto] })
  data: LandlordAnnouncementItemDto[];

  @ApiProperty({ type: AnnouncementPaginationMetaDto })
  meta: AnnouncementPaginationMetaDto;

  @ApiProperty({ type: LandlordAnnouncementsSummaryDto })
  summary: LandlordAnnouncementsSummaryDto;
}
