import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Logger,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiParam,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CreatePlatformDepositDto } from './dto/create-platform-deposit.dto';
import { PostQueryDto, BrowsePostsQueryDto } from './dto/post-query.dto';
import {
  PaginatedPostsResponseDto,
  PaginatedPublicPostsResponseDto,
  PostQuotaDto,
  PostResponseDto,
  PosterProfileResponseDto,
  PublicPostResponseDto,
} from './dto/post-response.dto';
import {
  PosterAnalyticsOverviewDto,
  SinglePostAnalyticsDto,
} from './dto/post-analytics.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtPayload } from '../auth/types/jwt-payload.type';
import { PostStatus } from '@prisma';

@ApiTags('Posts')
@ApiBearerAuth()
@Controller('posts')
export class PostsController {
  private readonly logger = new Logger(PostsController.name);

  constructor(
    private readonly postsService: PostsService,
    private readonly jwtService: JwtService,
  ) {}

  private extractViewerId(req: any): string | null {
    try {
      const authHeader = req?.headers?.authorization || req?.headers?.Authorization;
      if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
        return null;
      }
      const token = authHeader.substring(7).trim();
      const payload = this.jwtService.verify<JwtPayload>(token);
      return payload?.id ?? null;
    } catch {
      return null;
    }
  }

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

  // ─── UC-PU-03: Saved / Bookmarked Posts ───────────────────────────────────

  @Get('saved/ids')
  @ApiOperation({
    summary: 'UC-PU-03: Get all saved post IDs for current user',
    description: 'Returns an array of post UUIDs that the current authenticated user has bookmarked.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of bookmarked post IDs',
    type: [String],
  })
  async getSavedPostIds(
    @CurrentUser() user: JwtPayload,
  ): Promise<string[]> {
    this.logger.log(`GET /posts/saved/ids called by user ${user.id}`);
    return this.postsService.getSavedPostIds(user.id);
  }

  @Get('saved/all')
  @ApiOperation({
    summary: 'UC-PU-03: Get all saved rental listings for current user',
    description:
      'Returns full public post details for all listings bookmarked by the current authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Array of bookmarked public listings',
    type: [PublicPostResponseDto],
  })
  async getSavedPosts(
    @CurrentUser() user: JwtPayload,
  ): Promise<PublicPostResponseDto[]> {
    this.logger.log(`GET /posts/saved/all called by user ${user.id}`);
    return this.postsService.getSavedPosts(user.id);
  }

  // ─── UC-PU-01: Public Browse & Filter Listings ────────────────────────────

  @Public()
  @Get('browse')
  @ApiOperation({
    summary: 'UC-PU-01: Browse & filter public rental listings',
    description:
      'Returns paginated rental listings with status=posted. No authentication required. ' +
      'Location filters target structured address fields (province, district, ward) on BoardingHouse, ' +
      'not free-text address search. Price filter applies to depositAmount.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated public listing results',
    type: PaginatedPublicPostsResponseDto,
  })
  async browsePosts(
    @Query() query: BrowsePostsQueryDto,
  ): Promise<PaginatedPublicPostsResponseDto> {
    this.logger.log(
      `GET /posts/browse called (public) — search="${query.search ?? ''}", province="${query.province ?? ''}", ` +
      `district="${query.district ?? ''}", ward="${query.ward ?? ''}", ` +
      `price=[${query.minPrice ?? '-'}, ${query.maxPrice ?? '-'}], ` +
      `area=[${query.minArea ?? '-'}, ${query.maxArea ?? '-'}], ` +
      `page=${query.page ?? 1}, limit=${query.limit ?? 12}`,
    );
    return this.postsService.browsePosts(query);
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

  @Public()
  @Get('posters/:id')
  @ApiOperation({
    summary: 'UC-PU-02: View poster profile',
    description:
      'Returns public subset of User (avatarUrl, username, status, createdAt, postCount, activeListings). ' +
      'Phone and email are strictly withheld unless viewer is authenticated and has an active conversation with this poster.',
  })
  @ApiParam({ name: 'id', description: 'Poster User UUID' })
  @ApiResponse({
    status: 200,
    description: 'Poster public profile with active listings and privacy-guarded contact info',
    type: PosterProfileResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Poster not found',
  })
  async getPosterProfile(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: any,
  ): Promise<PosterProfileResponseDto> {
    this.logger.log(`GET /posts/posters/${id} called`);
    const viewerId = this.extractViewerId(req);
    return this.postsService.getPosterProfile(id, viewerId);
  }

  @Public()
  @Get('browse/:id')
  @ApiOperation({
    summary: 'UC-PU-01: Get a single public post detail by ID',
    description:
      'Returns full public post details. No authentication required. ' +
      'Only posts with status=posted are returned. Poster phone/email are never exposed.',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Public post detail',
    type: PublicPostResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Post not found or not publicly available',
  })
  async getPublicPostById(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<PublicPostResponseDto> {
    this.logger.log(`GET /posts/browse/${id} called (public)`);
    return this.postsService.getPublicPostById(id);
  }

  @Public()
  @Post('browse/:id/deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-PU-04: Place a platform deposit on a rental listing',
    description:
      'Creates a platform DEPOSIT record for the given post, marks the linked room as deposited, ' +
      'and hides the post from search results. No authentication required. ' +
      'Tenant is identified by tenantName + tenantPhone.',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiCreatedResponse({
    description: 'Platform deposit created — post hidden and room marked deposited',
    schema: {
      type: 'object',
      properties: {
        depositId: { type: 'string', example: 'uuid' },
        postId: { type: 'string', example: 'uuid' },
        message: { type: 'string', example: 'Đặt cọc thành công!' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Post is not available for deposit (hidden, room occupied, or already deposited)' })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createPlatformDeposit(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: CreatePlatformDepositDto,
  ): Promise<{ depositId: string; postId: string; message: string }> {
    this.logger.log(`POST /posts/browse/${id}/deposit called by tenant ${dto.tenantPhone}`);
    return this.postsService.createPlatformDeposit(id, dto);
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

  // ─── UC-PU-03: Save/Bookmark Listing Endpoints ───────────────────────────

  @Get(':id/is-saved')
  @ApiOperation({
    summary: 'UC-PU-03: Check if a post is saved by current user',
    description: 'Returns whether the specified post is in the authenticated user’s bookmarked list.',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status of the post',
    schema: {
      type: 'object',
      properties: {
        isSaved: { type: 'boolean', example: true },
      },
    },
  })
  async isPostSaved(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ isSaved: boolean }> {
    this.logger.log(`GET /posts/${id}/is-saved called by user ${user.id}`);
    const isSaved = await this.postsService.isPostSaved(user.id, id);
    return { isSaved };
  }

  @Post(':id/save')
  @ApiOperation({
    summary: 'UC-PU-03: Save/bookmark a rental listing',
    description: 'Bookmarks the post for the current authenticated user (idempotent).',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Post saved successfully',
    schema: {
      type: 'object',
      properties: {
        saved: { type: 'boolean', example: true },
        savedCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async savePost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ saved: boolean; savedCount: number }> {
    this.logger.log(`POST /posts/${id}/save called by user ${user.id}`);
    return this.postsService.savePost(user.id, id);
  }

  @Delete(':id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-PU-03: Unsave/remove bookmark for a rental listing',
    description: 'Removes the bookmark for the current authenticated user (idempotent).',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Post unsaved successfully',
    schema: {
      type: 'object',
      properties: {
        saved: { type: 'boolean', example: false },
        savedCount: { type: 'number', example: 4 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async unsavePost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ saved: boolean; savedCount: number }> {
    this.logger.log(`DELETE /posts/${id}/save called by user ${user.id}`);
    return this.postsService.unsavePost(user.id, id);
  }

  @Post(':id/toggle-save')
  @ApiOperation({
    summary: 'UC-PU-03: Toggle save/bookmark for a rental listing',
    description: 'Toggles the bookmark status for the current authenticated user.',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiResponse({
    status: 200,
    description: 'Bookmark status toggled',
    schema: {
      type: 'object',
      properties: {
        saved: { type: 'boolean', example: true },
        savedCount: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async toggleSavePost(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<{ saved: boolean; savedCount: number }> {
    this.logger.log(`POST /posts/${id}/toggle-save called by user ${user.id}`);
    return this.postsService.toggleSavePost(user.id, id);
  }
}
