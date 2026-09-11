import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Logger,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateServiceDto } from './dto/create-service.dto';
import { QueryServicesDto } from './dto/query-services.dto';
import {
  ServiceItemDto,
  ServiceRoomsResponseDto,
  ServicesListResponseDto,
} from './dto/service-response.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { ServicesService } from './services.service';

@ApiTags('Landlord - Services')
@ApiBearerAuth()
@ApiHeader({
  name: 'X-Boarding-House-Id',
  description: 'Active boarding house ID context',
  required: true,
})
@UseGuards(JwtAuthGuard, PropertyOwnershipGuard)
@Controller('landlord/services')
export class ServicesController {
  private readonly logger = new Logger(ServicesController.name);

  constructor(private readonly servicesService: ServicesService) {}

  @Get()
  @ApiOperation({
    summary: 'UC-L-18: Get paginated list of services with summary stats',
    description:
      'Retrieves all services associated with the active boarding house, including summary counts (metered, fixed, active, etc.) and applied room counts.',
  })
  @ApiOkResponse({
    type: ServicesListResponseDto,
    description: 'Services list with summary counts and pagination meta',
  })
  async getServices(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryServicesDto,
  ): Promise<ServicesListResponseDto> {
    this.logger.log(`Invoking GET /landlord/services for house ${boardingHouseId}`);
    return this.servicesService.getServices(boardingHouseId, query);
  }

  @Post()
  @ApiOperation({
    summary: 'UC-L-18: Create a custom service',
    description:
      'Creates a new custom service for the active boarding house and optionally attaches it to specific rooms.',
  })
  @ApiBody({ type: CreateServiceDto })
  @ApiResponse({
    status: 201,
    type: ServiceItemDto,
    description: 'The created service record',
  })
  async createService(
    @CurrentUser('id') landlordId: string,
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateServiceDto,
  ): Promise<ServiceItemDto> {
    this.logger.log(`Invoking POST /landlord/services for house ${boardingHouseId} by landlord ${landlordId}`);
    return this.servicesService.createService(landlordId, boardingHouseId, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'UC-L-18: Get service details',
    description: 'Fetches details of a specific service by ID.',
  })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiOkResponse({ type: ServiceItemDto })
  async getServiceDetail(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ): Promise<ServiceItemDto> {
    this.logger.log(`Invoking GET /landlord/services/${serviceId} for house ${boardingHouseId}`);
    return this.servicesService.getServiceDetail(boardingHouseId, serviceId);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'UC-L-18: Update a service',
    description: 'Updates an existing service configuration and attached room assignments.',
  })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiBody({ type: UpdateServiceDto })
  @ApiOkResponse({ type: ServiceItemDto })
  async updateService(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateServiceDto,
  ): Promise<ServiceItemDto> {
    this.logger.log(`Invoking PATCH /landlord/services/${serviceId} for house ${boardingHouseId}`);
    return this.servicesService.updateService(boardingHouseId, serviceId, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'UC-L-18: Delete a service',
    description:
      'Deletes a service if not locked by invoice items or meter readings. Automatically removes associated room_service bindings.',
  })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Đã xóa dịch vụ thành công' },
      },
    },
  })
  async deleteService(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ): Promise<{ success: boolean; message: string }> {
    this.logger.log(`Invoking DELETE /landlord/services/${serviceId} for house ${boardingHouseId}`);
    return this.servicesService.deleteService(boardingHouseId, serviceId);
  }

  @Get(':id/rooms')
  @ApiOperation({
    summary: 'UC-L-18: Get rooms assigned to this service',
    description: 'Retrieves all rooms in the boarding house currently attached to this service.',
  })
  @ApiParam({ name: 'id', description: 'Service UUID' })
  @ApiOkResponse({ type: ServiceRoomsResponseDto })
  async getServiceRooms(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', ParseUUIDPipe) serviceId: string,
  ): Promise<ServiceRoomsResponseDto> {
    this.logger.log(`Invoking GET /landlord/services/${serviceId}/rooms for house ${boardingHouseId}`);
    return this.servicesService.getServiceRooms(boardingHouseId, serviceId);
  }
}
