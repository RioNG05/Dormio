import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PostStatus } from '@prisma';

export class PostQueryDto {
  @ApiPropertyOptional({
    description: 'Filter posts by status',
    enum: PostStatus,
  })
  @IsOptional()
  @IsEnum(PostStatus)
  status?: PostStatus;

  @ApiPropertyOptional({
    description: 'Search keyword matching title or content',
    example: 'Quận 1',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by boarding house ID (via associated room)',
    example: '11111111-1111-1111-1111-111111111111',
  })
  @IsOptional()
  @IsString()
  boardingHouseId?: string;

  @ApiPropertyOptional({
    description: 'Page number (1-indexed)',
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 10;
}
