import { Controller, Get, Logger } from '@nestjs/common'
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { MapsService } from './maps.service'
import { MapsConfigResponseDto } from './dto/maps-config-response.dto'

@ApiTags('Maps & Geolocation')
@Controller('maps')
export class MapsController {
  private readonly logger = new Logger(MapsController.name)

  constructor(private readonly mapsService: MapsService) {}

  @Public()
  @Get('config')
  @ApiOperation({
    summary: 'Get runtime map configuration and API key',
    description:
      'Returns the Google Maps API key and availability status configured on the backend server. ' +
      'Allows frontend map pickers to dynamically initialize Google Maps JS SDK or fall back to OpenStreetMap.',
  })
  @ApiOkResponse({
    type: MapsConfigResponseDto,
    description: 'Map configuration retrieved successfully',
  })
  getMapsConfig(): MapsConfigResponseDto {
    this.logger.log('GET /api/v1/maps/config invoked')
    return this.mapsService.getMapsConfig()
  }
}

