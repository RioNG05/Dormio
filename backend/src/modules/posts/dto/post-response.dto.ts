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

/**
 * Poster subset for the public browse listing endpoint (UC-PU-02 rule: never expose phone/email here).
 */
export class PublicPosterDto {
  @ApiProperty({ description: 'User ID of the poster' })
  id: string;

  @ApiPropertyOptional({ description: 'Poster username' })
  username?: string | null;

  @ApiPropertyOptional({ description: 'Poster avatar URL' })
  avatarUrl?: string | null;
}

/**
 * Address subset derived from BoardingHouse for public listing display.
 */
export class PublicAddressDto {
  @ApiPropertyOptional({ description: 'Province / city' })
  province?: string | null;

  @ApiPropertyOptional({ description: 'District' })
  district?: string | null;

  @ApiPropertyOptional({ description: 'Ward' })
  ward?: string | null;

  @ApiPropertyOptional({ description: 'Street' })
  street?: string | null;

  @ApiPropertyOptional({ description: 'House number' })
  houseNumber?: string | null;
}

/**
 * UC-PU-01: Public listing response DTO. Strips internal/poster-only fields.
 */
export class PublicPostResponseDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ description: 'Post content / description' })
  content: string;

  @ApiProperty({ description: 'Deposit amount configured by landlord (VND)' })
  depositAmount: number;

  @ApiProperty({ enum: ['posted'], description: 'Post status (always posted for browse)' })
  status: string;

  @ApiProperty({ description: 'Post creation date' })
  createdAt: Date;

  @ApiProperty({ type: [PostImageDto], description: 'Post images' })
  images: PostImageDto[];

  @ApiPropertyOptional({ type: PostRoomDto, description: 'Linked room details' })
  room?: PostRoomDto | null;

  @ApiPropertyOptional({ type: PublicAddressDto, description: 'Structured boarding house address' })
  address?: PublicAddressDto | null;

  @ApiPropertyOptional({ type: PublicPosterDto, description: 'Poster public profile (no phone/email)' })
  poster?: PublicPosterDto | null;

  @ApiProperty({ description: 'Total view count' })
  viewsCount: number;

  @ApiProperty({ description: 'Total saved/bookmarked count' })
  savedCount: number;
}

export class PaginatedPublicPostsResponseDto {
  @ApiProperty({ type: [PublicPostResponseDto], description: 'Public listing results' })
  data: PublicPostResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: { total: 100, page: 1, limit: 12, totalPages: 9 },
  })
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export { PosterProfileResponseDto } from './poster-profile-response.dto';

