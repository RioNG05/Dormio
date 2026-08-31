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
