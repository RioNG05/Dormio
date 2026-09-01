import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PostStatus } from '@prisma';

export class DailyReachPointDto {
  @ApiProperty({ description: 'Date in YYYY-MM-DD format', example: '2026-08-30' })
  date: string;

  @ApiProperty({ description: 'Total views on this date', example: 15 })
  views: number;

  @ApiProperty({ description: 'Number of unique users who viewed on this date', example: 12 })
  uniqueViewers: number;
}

export class TopPostAnalyticsDto {
  @ApiProperty({ description: 'Post ID' })
  id: string;

  @ApiProperty({ description: 'Post title' })
  title: string;

  @ApiProperty({ enum: PostStatus, description: 'Post status' })
  status: PostStatus;

  @ApiProperty({ description: 'Deposit amount in VND' })
  depositAmount: number;

  @ApiPropertyOptional({ description: 'Room number if linked' })
  roomNumber?: string | null;

  @ApiPropertyOptional({ description: 'Boarding house name' })
  boardingHouseName?: string | null;

  @ApiPropertyOptional({ description: 'First image URL as thumbnail' })
  thumbnailUrl?: string | null;

  @ApiProperty({ description: 'Total reach/views count' })
  viewsCount: number;

  @ApiProperty({ description: 'Total bookmarks/saved count' })
  savedCount: number;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class PosterAnalyticsOverviewDto {
  @ApiProperty({ description: 'Total posts ever created by the poster' })
  totalPosts: number;

  @ApiProperty({ description: 'Currently active published posts' })
  activePosts: number;

  @ApiProperty({ description: 'Total views across all listings' })
  totalViews: number;

  @ApiProperty({ description: 'Total bookmarks across all listings' })
  totalSaved: number;

  @ApiProperty({ description: 'Average views per active post' })
  averageViewsPerPost: number;

  @ApiProperty({
    type: [DailyReachPointDto],
    description: 'Day-by-day views trend aggregate for the selected time window',
  })
  dailyTrends: DailyReachPointDto[];

  @ApiProperty({
    type: [TopPostAnalyticsDto],
    description: 'Listings sorted by views count',
  })
  topPosts: TopPostAnalyticsDto[];
}

export class SinglePostAnalyticsDto {
  @ApiProperty({ description: 'Post details' })
  post: TopPostAnalyticsDto;

  @ApiProperty({ description: 'Total views for this post' })
  totalViews: number;

  @ApiProperty({ description: 'Total unique viewers for this post' })
  totalUniqueViewers: number;

  @ApiProperty({
    type: [DailyReachPointDto],
    description: 'Day-by-day views trend for this specific post',
  })
  dailyTrends: DailyReachPointDto[];
}
