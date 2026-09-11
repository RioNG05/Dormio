import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class DeletePostDto {
  @ApiPropertyOptional({
    description: 'Reason for deleting the post (required for administrator deletions)',
    example: 'Bài viết vi phạm tiêu chuẩn cộng đồng về thông tin giá thuê',
  })
  @IsOptional()
  @IsString({ message: 'Reason must be a string' })
  reason?: string;
}
