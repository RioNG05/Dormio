import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum TimeBucketPeriod {
  WEEK = 'week',
  MONTH = 'month',
  YEAR = 'year',
}

export class AdminAnalyticsQueryDto {
  @ApiPropertyOptional({
    description: 'Time bucket granularity',
    enum: TimeBucketPeriod,
    default: TimeBucketPeriod.MONTH,
  })
  @IsOptional()
  @IsEnum(TimeBucketPeriod)
  period?: TimeBucketPeriod = TimeBucketPeriod.MONTH;

  @ApiPropertyOptional({
    description: 'Filter by calendar year (e.g. 2026)',
    example: 2026,
    default: new Date().getFullYear(),
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2020)
  @Max(2100)
  year?: number = new Date().getFullYear();

  @ApiPropertyOptional({
    description: 'Optional start date ISO string',
    example: '2026-01-01T00:00:00.000Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'Optional end date ISO string',
    example: '2026-12-31T23:59:59.999Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;
}

// ─── UC-A-01: USERS ANALYTICS ────────────────────────────────────────────────

export class UserRoleBreakdownDto {
  @ApiProperty({ example: 8920 })
  tenant: number;

  @ApiProperty({ example: 3140 })
  landlord: number;

  @ApiProperty({ example: 420 })
  employee: number;

  @ApiProperty({ example: 250 })
  leasing_agent: number;

  @ApiProperty({ example: 10 })
  admin: number;
}

export class UserStatusBreakdownDto {
  @ApiProperty({ example: 12100 })
  active: number;

  @ApiProperty({ example: 350 })
  inactive: number;

  @ApiProperty({ example: 30 })
  banned: number;
}

export class UserAnalyticsSummaryDto {
  @ApiProperty({ example: 12480 })
  totalUsers: number;

  @ApiProperty({ example: 1860 })
  newUsersCurrentPeriod: number;

  @ApiProperty({ example: 1568 })
  newUsersPreviousPeriod: number;

  @ApiProperty({ example: 18.6 })
  growthRate: number;

  @ApiProperty({ type: UserRoleBreakdownDto })
  byRole: UserRoleBreakdownDto;

  @ApiProperty({ type: UserStatusBreakdownDto })
  byStatus: UserStatusBreakdownDto;
}

export class UserTimelineItemDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  bucket: string;

  @ApiProperty({ example: 'Jan 2026' })
  label: string;

  @ApiProperty({ example: 180 })
  count: number;

  @ApiProperty({ type: UserRoleBreakdownDto })
  byRole: UserRoleBreakdownDto;
}

export class UserAnalyticsResponseDto {
  @ApiProperty({ type: UserAnalyticsSummaryDto })
  summary: UserAnalyticsSummaryDto;

  @ApiProperty({ type: [UserTimelineItemDto] })
  timeline: UserTimelineItemDto[];
}

// ─── UC-A-02: PROPERTIES & ROOMS ANALYTICS ───────────────────────────────────

export class RoomStatusBreakdownDto {
  @ApiProperty({ example: 1850 })
  available: number;

  @ApiProperty({ example: 620 })
  deposited: number;

  @ApiProperty({ example: 21770 })
  occupied: number;

  @ApiProperty({ example: 360 })
  maintainace: number;
}

export class BoardingHouseStatusBreakdownDto {
  @ApiProperty({ example: 1820 })
  active: number;

  @ApiProperty({ example: 25 })
  inactive: number;

  @ApiProperty({ example: 5 })
  banned: number;
}

export class RegionalPropertyBreakdownDto {
  @ApiProperty({ example: 'TP. Hồ Chí Minh' })
  name: string;

  @ApiProperty({ example: 920 })
  houses: number;

  @ApiProperty({ example: 12400 })
  rooms: number;

  @ApiProperty({ example: 91.0 })
  occupancyRate: number;

  @ApiProperty({ example: '48%' })
  share: string;
}

export class PropertyAnalyticsSummaryDto {
  @ApiProperty({ example: 1850 })
  totalHouses: number;

  @ApiProperty({ example: 114 })
  newHousesCurrentPeriod: number;

  @ApiProperty({ example: 102 })
  newHousesPreviousPeriod: number;

  @ApiProperty({ example: 11.8 })
  growthRate: number;

  @ApiProperty({ example: 24600 })
  totalRooms: number;

  @ApiProperty({ example: 88.5 })
  occupancyRate: number;

  @ApiProperty({ type: BoardingHouseStatusBreakdownDto })
  housesByStatus: BoardingHouseStatusBreakdownDto;

  @ApiProperty({ type: RoomStatusBreakdownDto })
  roomsByStatus: RoomStatusBreakdownDto;

  @ApiProperty({ type: [RegionalPropertyBreakdownDto] })
  regions: RegionalPropertyBreakdownDto[];
}

export class PropertyTimelineItemDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  bucket: string;

  @ApiProperty({ example: 'Jan 2026' })
  label: string;

  @ApiProperty({ example: 24 })
  count: number;
}

export class PropertyAnalyticsResponseDto {
  @ApiProperty({ type: PropertyAnalyticsSummaryDto })
  summary: PropertyAnalyticsSummaryDto;

  @ApiProperty({ type: [PropertyTimelineItemDto] })
  timeline: PropertyTimelineItemDto[];
}

// ─── UC-A-03: LISTINGS ANALYTICS ─────────────────────────────────────────────

export class PostStatusBreakdownDto {
  @ApiProperty({ example: 3420 })
  posted: number;

  @ApiProperty({ example: 210 })
  draft: number;

  @ApiProperty({ example: 140 })
  hidden: number;
}

export class PostSourceBreakdownDto {
  @ApiProperty({ example: 2570 })
  free_quote: number;

  @ApiProperty({ example: 1200 })
  purchased: number;
}

export class ListingAnalyticsSummaryDto {
  @ApiProperty({ example: 3770 })
  totalPosts: number;

  @ApiProperty({ example: 450 })
  newPostsCurrentPeriod: number;

  @ApiProperty({ example: 390 })
  newPostsPreviousPeriod: number;

  @ApiProperty({ example: 15.4 })
  growthRate: number;

  @ApiProperty({ example: 89400 })
  totalViews: number;

  @ApiProperty({ example: 6420 })
  totalSaved: number;

  @ApiProperty({ example: 26.1 })
  averageViewsPerPost: number;

  @ApiProperty({ type: PostStatusBreakdownDto })
  byStatus: PostStatusBreakdownDto;

  @ApiProperty({ type: PostSourceBreakdownDto })
  bySourceType: PostSourceBreakdownDto;
}

export class ListingTimelineItemDto {
  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  bucket: string;

  @ApiProperty({ example: 'Jan 2026' })
  label: string;

  @ApiProperty({ example: 75 })
  count: number;
}

export class ListingAnalyticsResponseDto {
  @ApiProperty({ type: ListingAnalyticsSummaryDto })
  summary: ListingAnalyticsSummaryDto;

  @ApiProperty({ type: [ListingTimelineItemDto] })
  timeline: ListingTimelineItemDto[];
}

// ─── UNIFIED ADMIN OVERVIEW SNAPSHOT ─────────────────────────────────────────

export class AdminOverviewResponseDto {
  @ApiProperty({ example: 12480 })
  totalUsers: number;

  @ApiProperty({ example: 14.2 })
  userGrowthRate: number;

  @ApiProperty({ type: UserRoleBreakdownDto })
  userRoles: UserRoleBreakdownDto;

  @ApiProperty({ example: 1850 })
  totalHouses: number;

  @ApiProperty({ example: 24600 })
  totalRooms: number;

  @ApiProperty({ example: 88.5 })
  occupancyRate: number;

  @ApiProperty({ example: 8.6 })
  propertyGrowthRate: number;

  @ApiProperty({ example: 148500000 })
  platformRevenue: number;

  @ApiProperty({ example: 22.4 })
  revenueGrowthRate: number;

  @ApiProperty({ example: 7 })
  pendingGrievancesCount: number;

  @ApiProperty({ example: 3 })
  urgentGrievancesCount: number;

  @ApiProperty({ example: 12 })
  reportedItemsCount: number;
}
