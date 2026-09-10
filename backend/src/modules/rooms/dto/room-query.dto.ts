import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { RoomStatus } from '@prisma';

export class RoomQueryDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({ example: '101', description: 'Search room number' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ enum: RoomStatus, description: 'Filter by room status' })
  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @ApiPropertyOptional({ example: 1, description: 'Filter by floor' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  floor?: number;
}
