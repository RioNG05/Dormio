import { ApiProperty } from '@nestjs/swagger'

export class MapsConfigResponseDto {
  @ApiProperty({
    description: 'Google Maps JavaScript API key configured on backend, or null if not available',
    nullable: true,
    example: 'AIzaSy...',
  })
  apiKey: string | null

  @ApiProperty({
    description: 'Indicates whether Google Maps API is configured and available',
    example: true,
  })
  isGoogleAvailable: boolean

  @ApiProperty({
    description: 'Recommended map provider for frontend map pickers',
    enum: ['google', 'osm'],
    example: 'google',
  })
  provider: 'google' | 'osm'
}

