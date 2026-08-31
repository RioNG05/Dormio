import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostQueryDto } from './dto/post-query.dto';
import {
  PaginatedPostsResponseDto,
  PostQuotaDto,
  PostResponseDto,
} from './dto/post-response.dto';
import {
  PosterAnalyticsOverviewDto,
  SinglePostAnalyticsDto,
} from './dto/post-analytics.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PostStatus } from '@prisma';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(private readonly postsService: PostsService) {}

  @Post()
  @ApiOperation({
    summary: 'UC-P-01: Publish a new rental listing',
    description:
      'Checks daily free quota or available purchased credits, validates room ownership if provided, and creates the rental listing with images.',
  })
  @ApiResponse({
    status: 201,
    description: 'Rental listing successfully published',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error in request payload',
  })
  @ApiResponse({
    status: 403,
    description: 'Out of posting quota or unauthorized room ownership',
  })
  @ApiResponse({
    status: 404,
    description: 'Linked room not found',
  })
  async createPost(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePostDto,
  ): Promise<PostResponseDto> {
    this.logger.log(`POST /posts called by user ${user.id}`);
    return this.postsService.createPost(user.id, dto);
  }

  @Get('quota')
  @ApiOperation({
    summary: 'Check posting quota status for the current poster',
    description:
      'Returns the remaining daily free quota and purchased post credits available.',
  })
  @ApiResponse({
    status: 200,
    description: 'Current posting quota status',
    type: PostQuotaDto,
  })
  async getQuotaStatus(
    @CurrentUser() user: JwtPayload,
  ): Promise<PostQuotaDto> {
    this.logger.log(`GET /posts/quota called by user ${user.id}`);
    return this.postsService.getQuotaStatus(user.id);
  }

  @Get('my-listings')
  @ApiOperation({
    summary: 'Get all listings posted by the current user',
    description: 'Retrieves a paginated list of posts created by the authenticated landlord/poster.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user rental listings',
    type: PaginatedPostsResponseDto,
  })
  async getMyListings(
    @CurrentUser() user: JwtPayload,
    @Query() query: PostQueryDto,
  ): Promise<PaginatedPostsResponseDto> {
    this.logger.log(
      `GET /posts/my-listings called by user ${user.id} with page=${query.page}, limit=${query.limit}`,
    );
    return this.postsService.getMyPosts(user.id, query);
  }

  @Get('analytics/overview')
  @ApiOperation({
    summary: 'UC-P-02: Get aggregate poster analytics dashboard overview',
    description:
      'Aggregates total views (COUNT(PostReach)), unique reach, saved counts, and day-by-day trend charts across all listings of the authenticated poster.',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregate poster analytics overview data',
    type: PosterAnalyticsOverviewDto,
  })
  async getPosterAnalyticsOverview(
    @CurrentUser() user: JwtPayload,
    @Query('days') days?: number,
  ): Promise<PosterAnalyticsOverviewDto> {
    this.logger.log(
      `GET /posts/analytics/overview called by user ${user.id} with days=${days || 14}`,
    );
    return this.postsService.getPosterAnalyticsOverview(
      user.id,
      days ? Number(days) : 14,
    );
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get post listing details by ID',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Post details',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getPostById(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PostResponseDto> {
    this.logger.log(`GET /posts/${id} called by user ${user.id}`);
    return this.postsService.getPostById(user.id, id);
  }

  @Get(':id/analytics')
  @ApiOperation({
    summary: 'UC-P-02: Get drill-down analytics for a single rental listing',
    description:
      'Returns day-by-day views and unique reach trend data for a single post belonging to the authenticated poster.',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Drill-down post analytics and trend data',
    type: SinglePostAnalyticsDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not the author of this post',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async getSinglePostAnalytics(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Query('days') days?: number,
  ): Promise<SinglePostAnalyticsDto> {
    this.logger.log(
      `GET /posts/${id}/analytics called by user ${user.id} with days=${days || 14}`,
    );
    return this.postsService.getSinglePostAnalytics(
      user.id,
      id,
      days ? Number(days) : 14,
    );
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update status of a rental listing (e.g. pause/hide or publish draft)',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Updated post details',
    type: PostResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'User is not the author of this post',
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found',
  })
  async updatePostStatus(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body('status') status: PostStatus,
  ): Promise<PostResponseDto> {
    this.logger.log(
      `PATCH /posts/${id}/status to ${status} called by user ${user.id}`,
    );
    return this.postsService.updatePostStatus(user.id, id, status);
  }
}
