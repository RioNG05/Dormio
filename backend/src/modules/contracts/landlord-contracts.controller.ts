import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Headers,
  UseGuards,
  HttpStatus,
  HttpCode,
  Logger,
  ParseUUIDPipe,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBearerAuth,
  ApiHeader,
  ApiResponse,
  ApiProduces,
} from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import { CreateContractPlatformDto } from './dto/create-contract-platform.dto';
import { CreateContractDirectDto } from './dto/create-contract-direct.dto';
import { QueryContractsDto } from './dto/query-contracts.dto';
import { ExportContractResponseDto } from './dto/export-contract-response.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { JwtPayload } from '../auth/types/jwt-payload.type';

@ApiTags('Landlord Contracts')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('landlord/contracts')
export class LandlordContractsController {
  private readonly logger = new Logger(LandlordContractsController.name);

  constructor(private readonly contractsService: ContractsService) {}

  // ─── GET /api/v1/landlord/contracts/rooms/:roomId/pending-deposit ──────────

  @Get('rooms/:roomId/pending-deposit')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check Pending Platform Deposit for Room (UC-L-04 Flow A pre-check)',
    description:
      'Checks whether the target room has an unconverted paid platform deposit. Returns deposit info or null.',
  })
  @ApiOkResponse({
    description: 'Pending deposit info returned (or null if none found)',
  })
  async getPendingPlatformDeposit(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('roomId', new ParseUUIDPipe({ version: '4' })) roomId: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `GET /landlord/contracts/rooms/${roomId}/pending-deposit called by landlord ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.contractsService.getPendingPlatformDeposit(
      boardingHouseId,
      roomId,
    );
    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/contracts/tenants/search ──────────────────────────

  @Get('tenants/search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Tenant By Phone Number (UC-L-04 Flow B helper)',
    description:
      'Checks if a user already exists with the given phone number, and whether they have citizen identification on file.',
  })
  @ApiOkResponse({
    description: 'Tenant search result with identification status',
  })
  async searchTenantByPhone(
    @Query('phoneNumber') phoneNumber: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `GET /landlord/contracts/tenants/search?phoneNumber=${phoneNumber} called by landlord ${user?.id}`,
    );
    const data = await this.contractsService.searchTenantByPhone(phoneNumber);
    return { success: true, data };
  }

  // ─── POST /api/v1/landlord/contracts/platform ───────────────────────────────

  @Post('platform')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate Contract From Platform Deposit (UC-L-04 Flow A)',
    description:
      'Creates a draft contract linked to an existing paid platform deposit. Sets Post status to hidden, Room status to deposited, records AuditLogs, and notifies tenant awaiting confirmation (UC-AUTH-04).',
  })
  @ApiCreatedResponse({
    description: 'Draft contract successfully created',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Room does not have a paid unconverted platform deposit',
  })
  async createPlatformContract(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateContractPlatformDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `POST /landlord/contracts/platform called by landlord ${user?.id} for room ${dto.roomId} in house ${boardingHouseId}`,
    );
    const data = await this.contractsService.createPlatformContract(
      user.id,
      boardingHouseId,
      dto,
    );
    return { success: true, data };
  }

  // ─── POST /api/v1/landlord/contracts/direct ─────────────────────────────────

  @Post('direct')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate Direct Rental Contract (UC-L-04 Flow B)',
    description:
      'Creates an active contract directly. Resolves or creates tenant via findOrCreateByPhone(), creates manual Deposit record, sets Room to occupied, generates ContractDocument, writes AuditLogs, and triggers UC-T-01.',
  })
  @ApiCreatedResponse({
    description: 'Active contract successfully created',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Room has a pending platform deposit (must use Flow A instead)',
  })
  async createDirectContract(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Body() dto: CreateContractDirectDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `POST /landlord/contracts/direct called by landlord ${user?.id} for room ${dto.roomId} in house ${boardingHouseId}`,
    );
    const data = await this.contractsService.createDirectContract(
      user.id,
      boardingHouseId,
      dto,
    );
    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/contracts ─────────────────────────────────────────

  @Get()
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Landlord Contracts (with pagination, search, status filter)',
    description:
      'Retrieves contracts belonging to the active boarding house context, matching Rule 9 pagination and search specifications.',
  })
  @ApiOkResponse({
    description: 'Paginated list of contracts retrieved successfully',
  })
  async getContracts(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Query() query: QueryContractsDto,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `GET /landlord/contracts called by landlord ${user?.id} for house ${boardingHouseId} (page=${query.page}, search=${query.search || ''})`,
    );
    const result = await this.contractsService.getLandlordContracts(
      boardingHouseId,
      query,
    );
    return { success: true, ...result };
  }

  // ─── GET /api/v1/landlord/contracts/:id ─────────────────────────────────────

  @Get(':id')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get Contract Detail by ID',
    description:
      'Returns complete contract aggregate including room, services, tenant, citizen identification, deposit, and documents.',
  })
  @ApiOkResponse({
    description: 'Contract detail retrieved successfully',
  })
  async getContractById(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `GET /landlord/contracts/${id} called by landlord ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.contractsService.getContractById(
      boardingHouseId,
      id,
    );
    return { success: true, data };
  }

  // ─── POST /api/v1/landlord/contracts/:id/export ────────────────────────────

  @Post(':id/export')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Export Contract (UC-L-15)',
    description:
      'Renders the unified contract template, persists a new ContractDocument entry, logs AuditLog, and returns document download and print URLs.',
  })
  @ApiCreatedResponse({
    type: ExportContractResponseDto,
    description: 'Contract document exported and created successfully',
  })
  async exportContract(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `POST /landlord/contracts/${id}/export called by landlord ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.contractsService.exportContract(
      boardingHouseId,
      id,
      user.id,
    );
    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/contracts/:id/print ──────────────────────────────

  @Get(':id/print')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Print Contract Template HTML (UC-L-15)',
    description:
      'Direct-print trigger: renders the identical server-side contract template formatted for A4 print. Supports ?autoPrint=true to trigger print dialog on load.',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'Returns rendered HTML page ready for printing',
  })
  async printContract(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Query('autoPrint') autoPrint: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.log(
      `GET /landlord/contracts/${id}/print (autoPrint=${autoPrint}) called by landlord ${user?.id} for house ${boardingHouseId}`,
    );
    const isAutoPrint = autoPrint === 'true' || autoPrint === '1';
    const html = await this.contractsService.getContractPrintHtml(
      boardingHouseId,
      id,
      isAutoPrint,
      true,
    );
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }

  // ─── GET /api/v1/landlord/contracts/:id/documents ──────────────────────────

  @Get(':id/documents')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'List Contract Documents (UC-L-15)',
    description: 'Retrieves all generated ContractDocument records for this contract.',
  })
  @ApiOkResponse({
    description: 'List of contract documents retrieved successfully',
  })
  async getContractDocuments(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    this.logger.log(
      `GET /landlord/contracts/${id}/documents called by landlord ${user?.id} for house ${boardingHouseId}`,
    );
    const data = await this.contractsService.getContractDocuments(
      boardingHouseId,
      id,
    );
    return { success: true, data };
  }

  // ─── GET /api/v1/landlord/contracts/:id/documents/:documentId/download ─────

  @Get(':id/documents/:documentId/download')
  @UseGuards(PropertyOwnershipGuard)
  @ApiHeader({
    name: 'X-Boarding-House-Id',
    required: true,
    description: 'Active Boarding House UUID context',
  })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download Contract Document (UC-L-15)',
    description:
      'Downloadable-file trigger: streams the rendered contract document as a downloadable HTML file.',
  })
  @ApiOkResponse({
    description: 'File download stream',
  })
  async downloadContractDocument(
    @Headers('x-boarding-house-id') boardingHouseId: string,
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string,
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.log(
      `GET /landlord/contracts/${id}/documents/${documentId}/download called by landlord ${user?.id} for house ${boardingHouseId}`,
    );
    const { filename, html } =
      await this.contractsService.getContractDocumentDownload(
        boardingHouseId,
        id,
        documentId,
      );

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(html);
  }
}
