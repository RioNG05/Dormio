import {
  Controller,
  Get,
  Query,
  UseGuards,
  Logger,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiOkResponse,
} from '@nestjs/swagger';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma';
import { AdminAnalyticsService } from './admin-analytics.service';
import {
  AdminAnalyticsQueryDto,
  UserAnalyticsResponseDto,
  PropertyAnalyticsResponseDto,
  ListingAnalyticsResponseDto,
  AdminOverviewResponseDto,
} from './dto/admin-analytics.dto';
import {
  RevenueQueryDto,
  RevenueResponseDto,
} from './dto/revenue-analytics.dto';

@ApiTags('Admin Analytics & Revenue Dashboard')
@ApiBearerAuth('JWT')
@UseGuards(RolesGuard)
@Roles(UserRole.admin)
@Controller('admin/analytics')
export class AdminAnalyticsController {
  private readonly logger = new Logger(AdminAnalyticsController.name);

  constructor(private readonly analyticsService: AdminAnalyticsService) {}

  @Get('users')
  @ApiOperation({
    summary: 'UC-A-01: Global Analytics — Users',
    description:
      'Retrieve system-wide user counts, role/status breakdowns, and time-bucketed user registration trends.',
  })
  @ApiOkResponse({
    description: 'User analytics data retrieved successfully',
    type: UserAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getUserAnalytics(
    @Query() query: AdminAnalyticsQueryDto,
  ): Promise<UserAnalyticsResponseDto> {
    this.logger.log(
      `GET /admin/analytics/users called with period=${query.period || 'month'}, year=${query.year || new Date().getFullYear()}`,
    );
    return this.analyticsService.getUserAnalytics(query);
  }

  @Get('properties')
  @ApiOperation({
    summary: 'UC-A-02: Global Analytics — Properties & Rooms',
    description:
      'Retrieve system-wide property and room counts, global occupancy rate, regional distribution, and property registration timeline.',
  })
  @ApiOkResponse({
    description: 'Property analytics data retrieved successfully',
    type: PropertyAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getPropertyAnalytics(
    @Query() query: AdminAnalyticsQueryDto,
  ): Promise<PropertyAnalyticsResponseDto> {
    this.logger.log(
      `GET /admin/analytics/properties called with period=${query.period || 'month'}, year=${query.year || new Date().getFullYear()}`,
    );
    return this.analyticsService.getPropertyAnalytics(query);
  }

  @Get('listings')
  @ApiOperation({
    summary: 'UC-A-03: Global Analytics — Listings (BHRP)',
    description:
      'Retrieve BHRP rental listings statistics, quota sources (free vs purchased), engagement metrics (views, saves), and publication trend.',
  })
  @ApiOkResponse({
    description: 'Listing analytics data retrieved successfully',
    type: ListingAnalyticsResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getListingAnalytics(
    @Query() query: AdminAnalyticsQueryDto,
  ): Promise<ListingAnalyticsResponseDto> {
    this.logger.log(
      `GET /admin/analytics/listings called with period=${query.period || 'month'}, year=${query.year || new Date().getFullYear()}`,
    );
    return this.analyticsService.getListingAnalytics(query);
  }

  @Get('revenue')
  @ApiOperation({
    summary: 'UC-A-06: Platform Revenue Dashboard',
    description:
      'Retrieve direct platform revenue breakdown: subscription package upgrades (Plus/Pro, Monthly/Yearly) and post credit purchases, with net revenue accounting (gross - refund), growth rates, and timeline buckets.',
  })
  @ApiOkResponse({
    description: 'Platform revenue dashboard analytics retrieved successfully',
    type: RevenueResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getRevenueAnalytics(
    @Query() query: RevenueQueryDto,
  ): Promise<RevenueResponseDto> {
    this.logger.log(
      `GET /admin/analytics/revenue called with period=${query.period || 'month'}, year=${query.year || new Date().getFullYear()}`,
    );
    return this.analyticsService.getRevenueAnalytics(query);
  }

  @Get('overview')
  @ApiOperation({
    summary: 'Unified Admin Dashboard Snapshot',
    description:
      'Retrieve high-level KPIs for the main admin portal dashboard (users, houses, rooms, occupancy, revenue, grievances).',
  })
  @ApiOkResponse({
    description: 'Admin dashboard overview snapshot retrieved successfully',
    type: AdminOverviewResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Forbidden. Requires Admin role',
  })
  async getAdminOverview(): Promise<AdminOverviewResponseDto> {
    this.logger.log('GET /admin/analytics/overview called');
    return this.analyticsService.getAdminOverview();
  }
}
