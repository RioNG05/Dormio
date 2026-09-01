import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus, SourceType } from '@prisma';

export class PostImageDto {
  @ApiProperty({ description: 'Image ID' })
  id: string;

  @ApiProperty({ description: 'Image URL' })
  url: string;
}

export class PostRoomDto {
  @ApiProperty({ description: 'Room ID' })
  id: string;

  @ApiProperty({ description: 'Room Number' })
  roomNumber: string;

  @ApiProperty({ description: 'Floor number' })
  floor: number;

  @ApiPropertyOptional({ description: 'Area in square meters' })
  area?: number;

  @ApiPropertyOptional({ description: 'Room type name' })
  roomTypeName?: string;

  @ApiPropertyOptional({ description: 'Boarding house name' })
  boardingHouseName?: string;

  @ApiPropertyOptional({ description: 'Boarding house ID' })
  boardingHouseId?: string;
}

export class PostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'User ID of poster' })
  postedBy: string;

  @ApiPropertyOptional({ description: 'Associated room ID' })
  roomId?: string | null;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post content' })
  content: string;

  @ApiProperty({ description: 'Deposit amount in VND' })
  depositAmount: number;

  @ApiProperty({ enum: PostStatus, description: 'Current post status' })
  status: PostStatus;

  @ApiProperty({ enum: SourceType, description: 'Source type used for quota (free_quote or purchased)' })
  sourceType: SourceType;

  @ApiPropertyOptional({ description: 'Post purchase ID if purchased credit was used' })
  postPurchaseId?: string | null;

  @ApiPropertyOptional({ description: 'Resulted contract ID if tenant converted to contract' })
  resultedContractId?: string | null;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;

  @ApiPropertyOptional({ description: 'Last update date' })
  updatedAt?: Date | null;

  @ApiProperty({ type: [PostImageDto], description: 'List of post images' })
  images: PostImageDto[];

  @ApiPropertyOptional({ type: PostRoomDto, description: 'Linked room details' })
  room?: PostRoomDto | null;

  @ApiProperty({ description: 'Total reach/views count' })
  viewsCount: number;
}

export class PostQuotaDto {
  @ApiProperty({ description: 'Whether the user is a landlord owning boarding houses', example: true })
  isLandlord: boolean;

  @ApiProperty({ description: 'Plan name of the active subscription or leasing agent', example: 'free' })
  planName: string;

  @ApiProperty({ description: 'Base flat free quota for all posters', example: 3 })
  baseDailyQuota: number;

  @ApiProperty({ description: 'Bonus quota from active property management plan', example: 0 })
  bonusDailyQuota: number;

  @ApiProperty({ description: 'Total daily free posting quota (base + bonus)', example: 3 })
  dailyPostQuota: number;

  @ApiProperty({ description: 'Number of free posts used today', example: 0 })
  freePostsUsedToday: number;

  @ApiProperty({ description: 'Number of free posts remaining today', example: 3 })
  freePostsRemainingToday: number;

  @ApiProperty({ description: 'Total paid post credits currently available', example: 5 })
  purchasedCreditsAvailable: number;

  @ApiProperty({ description: 'Whether the user can currently publish a new listing', example: true })
  canPublish: boolean;
}

export class PaginatedPostsResponseDto {
  @ApiProperty({ type: [PostResponseDto], description: 'List of posts' })
  data: PostResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 15,
      page: 1,
      limit: 10,
      totalPages: 2,
    },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
