import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { MapsConfigResponseDto } from './dto/maps-config-response.dto'

@Injectable()
export class MapsService {
  private readonly logger = new Logger(MapsService.name)

  constructor(private readonly configService: ConfigService) {}

  /**
   * Retrieves runtime map configuration and API key from server environment.
   */
  getMapsConfig(): MapsConfigResponseDto {
    const rawKey = this.configService.get<string>('maps.apiKey')
    const apiKey = typeof rawKey === 'string' && rawKey.trim() !== '' ? rawKey.trim() : null
    const isGoogleAvailable = apiKey !== null

    this.logger.log(`Resolving maps config: provider=${isGoogleAvailable ? 'google' : 'osm'}`)

    return {
      apiKey,
      isGoogleAvailable,
      provider: isGoogleAvailable ? 'google' : 'osm',
    }
  }
}
