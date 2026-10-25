import { ApiProperty } from '@nestjs/swagger'
import { IsString, IsNotEmpty, IsUrl } from 'class-validator'

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'Cloudinary HTTPS URL of the user profile avatar image',
    example: 'https://res.cloudinary.com/dormio/image/upload/v1234567890/dormio/avatars/user.jpg',
  })
  @IsString()
  @IsNotEmpty()
  @IsUrl()
  avatarUrl: string
}

