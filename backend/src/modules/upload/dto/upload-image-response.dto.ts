import { ApiProperty } from '@nestjs/swagger';

export class UploadImageResponseDto {
  @ApiProperty({
    description: 'Secure HTTPS URL of the uploaded image',
    example: 'https://res.cloudinary.com/dbdol9ny5/image/upload/v1234567/dormio/identifications/abc.jpg',
  })
  url!: string;

  @ApiProperty({
    description: 'Cloudinary public ID of the uploaded resource',
    example: 'dormio/identifications/abc',
  })
  publicId!: string;

  @ApiProperty({
    description: 'Image format (jpeg, png, webp, etc.)',
    example: 'jpeg',
  })
  format!: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 104230,
  })
  bytes!: number;
}
