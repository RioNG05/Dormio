import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsUrl } from 'class-validator'

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'Cloudinary HTTPS URL or Base64 data URI of the user profile avatar image',
    example: 'https://res.cloudinary.com/dormio/image/upload/v1234567890/dormio/avatars/user.jpg',
  })
  @IsString()
  @IsNotEmpty()
  avatarUrl: string
}

