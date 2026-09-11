import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma';
import { PublicPostResponseDto } from './post-response.dto';

/**
 * UC-PU-02: Public poster profile response DTO.
 *
 * SPEC RULE:
 * Public subset of User: avatarUrl, username, status, createdAt, COUNT(Post WHERE postedBy=user.id).
 * Never expose phoneNumber/email here unless the viewer is authenticated and has an active Conversation
 * with this poster — enforced explicitly in the query/DTO.
 */
export class PosterProfileResponseDto {
  @ApiProperty({ description: 'User ID of the poster', example: 'd0e8832a-5bf8-46d2-a725-b8296eb4c022' })
  id: string;

  @ApiPropertyOptional({ description: 'Username / display name of the poster', example: 'Nguyen Van Landlord' })
  username?: string | null;

  @ApiPropertyOptional({ description: 'Avatar image URL of the poster', example: 'https://res.cloudinary.com/.../avatar.jpg' })
  avatarUrl?: string | null;

  @ApiPropertyOptional({ description: 'Biography or introduction of the poster', example: 'Chủ nhà trọ uy tín tại Cầu Giấy, Hà Nội.' })
  bio?: string | null;

  @ApiProperty({ description: 'User status', enum: UserStatus, example: 'active' })
  status: UserStatus;

  @ApiProperty({ description: 'Date when the poster joined Dormio', example: '2026-01-15T08:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Total number of active rental listings posted by this user', example: 4 })
  postCount: number;

  @ApiPropertyOptional({
    description:
      'Poster phone number — strictly withheld unless viewer is authenticated AND has an active Conversation with this poster (or is self)',
    example: '0901234567',
  })
  phoneNumber?: string | null;

  @ApiPropertyOptional({
    description:
      'Poster email address — strictly withheld unless viewer is authenticated AND has an active Conversation with this poster (or is self)',
    example: 'landlord@example.com',
  })
  email?: string | null;

  @ApiProperty({
    description: 'Whether the viewing user currently has an active conversation with this poster',
    example: false,
  })
  hasActiveConversation: boolean;

  @ApiProperty({
    description: 'List of publicly active rental listings posted by this user',
    type: [PublicPostResponseDto],
  })
  activeListings: PublicPostResponseDto[];
}
