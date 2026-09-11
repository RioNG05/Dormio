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
  ApiOkResponse,
} from '@nestjs/swagger';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import {
  CreatePlatformDepositDto,
  InitiatePlatformDepositDto,
  ConfirmPlatformDepositDto,
  PlatformDepositInstructionDto,
} from './dto/create-platform-deposit.dto';
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
import {
  CreateAiPostDraftDto,
  AiPostDraftResponseDto,
} from './dto/create-ai-post-draft.dto';
import { UnlistedRoomResponseDto } from './dto/unlisted-room-response.dto';
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

  // ─── UC-L-12: AI Rental Post Suggestions ──────────────────────────────────

  @Post('ai-draft')
  @ApiOperation({
    summary: 'Gợi ý bản nháp tin đăng cho thuê bằng AI (UC-L-12)',
    description:
      'Tạo bản nháp bài đăng cho thuê phòng dựa trên dữ liệu thực tế của phòng và nhà trọ. ' +
      'Ghi nhận phiên thảo luận và tin nhắn trong AiConversation & AiMessage. ' +
      'Lưu ý kiến trúc: Endpoint này CHỈ TẠO BẢN NHÁP và không tạo bản ghi Post.',
  })
  @ApiCreatedResponse({
    description: 'Bản nháp bài đăng cho thuê bằng AI được tạo thành công',
    type: AiPostDraftResponseDto,
  })
  @ApiResponse({ status: 400, description: 'ID phòng không hợp lệ' })
  @ApiResponse({ status: 403, description: 'Chủ nhà không sở hữu phòng được chỉ định' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phòng' })
  async generateAiPostDraft(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreateAiPostDraftDto,
  ): Promise<AiPostDraftResponseDto> {
    this.logger.log(`POST /posts/ai-draft called by user ${user.id} for room ${dto.roomId}`);
    return this.postsService.generateAiPostDraft(user.id, dto);
  }

  @Get('unlisted-rooms')
  @ApiOperation({
    summary: 'Danh sách phòng trống chưa có tin đăng công khai (Trigger UC-L-12)',
    description:
      'Truy xuất danh sách các phòng khả dụng (status=available) thuộc sở hữu của chủ nhà chưa có tin đăng công khai (status=posted) để kích hoạt gợi ý tạo tin đăng AI.',
  })
  @ApiOkResponse({
    description: 'Danh sách phòng trống chưa đăng tin',
    type: [UnlistedRoomResponseDto],
  })
  async getUnlistedVacantRooms(
    @CurrentUser() user: JwtPayload,
  ): Promise<UnlistedRoomResponseDto[]> {
    this.logger.log(`GET /posts/unlisted-rooms called by user ${user.id}`);
    return this.postsService.getUnlistedVacantRooms(user.id);
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

  @Post('browse/:id/deposit')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'UC-PU-04: Initiate direct online deposit on a rental listing',
    description:
      'Checks identity verification gate (UserIdentification CCCD). If missing, rejects with 403 IDENTITY_VERIFICATION_REQUIRED. ' +
      'Creates pending Deposit and Payment with VietQR instruction payload.',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiCreatedResponse({
    description: 'Platform deposit and VietQR payment instruction created successfully',
    type: PlatformDepositInstructionDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Post not available, room occupied, or active deposit already exists',
  })
  @ApiResponse({
    status: 403,
    description: 'Identity verification required before placing online deposit (IDENTITY_VERIFICATION_REQUIRED)',
  })
  @ApiResponse({ status: 404, description: 'Post not found' })
  async createPlatformDeposit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: InitiatePlatformDepositDto,
  ): Promise<PlatformDepositInstructionDto> {
    this.logger.log(
      `POST /posts/browse/${id}/deposit called by user ${user.id}`,
    );
    return this.postsService.createPlatformDeposit(user.id, id, dto);
  }

  @Post('browse/:id/deposit/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'UC-PU-04 Step 5: Confirm platform deposit payment',
    description:
      'Marks Payment as success, Deposit as paid, Room as deposited, logs AuditLog in one atomic transaction, ' +
      'and notifies the landlord to prepare the rental contract (UC-L-04 Flow A).',
  })
  @ApiParam({ name: 'id', description: 'Post listing UUID' })
  @ApiOkResponse({
    description: 'Deposit confirmed and room marked deposited',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        depositId: { type: 'string', example: 'uuid' },
        status: { type: 'string', example: 'paid' },
        message: { type: 'string', example: 'Đặt cọc thành công!' },
      },
    },
  })
  @ApiResponse({ status: 400, description: 'Invalid deposit status or missing payment info' })
  @ApiResponse({ status: 404, description: 'Deposit not found' })
  async confirmPlatformDeposit(
    @CurrentUser() user: JwtPayload,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConfirmPlatformDepositDto,
  ): Promise<{ success: boolean; depositId: string; status: string; message: string }> {
    this.logger.log(
      `POST /posts/browse/${id}/deposit/confirm called for deposit ${dto.depositId} by user ${user.id}`,
    );
    return this.postsService.confirmPlatformDeposit(user.id, id, dto);
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
