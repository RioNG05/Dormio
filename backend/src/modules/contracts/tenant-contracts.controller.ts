import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Res,
  HttpStatus,
  HttpCode,
  Logger,
  ParseUUIDPipe,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiProduces,
  ApiBearerAuth,
} from '@nestjs/swagger'
import type { Response } from 'express'
import { ContractsService } from './contracts.service'
import { TenancyDetailsDto } from './dto/tenancy-details.dto'
import { ExportContractResponseDto } from './dto/export-contract-response.dto'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import type { JwtPayload } from '../auth/types/jwt-payload.type'

@ApiTags('Tenant Tenancy')
@ApiBearerAuth()
@Controller('tenant/tenancy')
export class TenantContractsController {
  private readonly logger = new Logger(TenantContractsController.name)

  constructor(private readonly contractsService: ContractsService) {}

  // ─── GET /api/v1/tenant/tenancy ─────────────────────────────────────────────

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'View Tenancy Details (UC-T-06)',
    description:
      'Returns the read-only aggregate of active contract, room, boarding house, fee structure, and broadcast announcements for the authenticated tenant.',
  })
  @ApiOkResponse({
    description: 'Tenancy details retrieved successfully (or null if no active tenancy)',
    type: TenancyDetailsDto,
  })
  async getMyTenancy(@CurrentUser() user: JwtPayload) {
    this.logger.log(`GET /api/v1/tenant/tenancy called by user: ${user?.id}`)
    const data = await this.contractsService.getMyTenancyDetails(user.id)
    return { success: true, data }
  }

  // ─── GET /api/v1/tenant/tenancy/print ───────────────────────────────────────

  @Get('print')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Print Active Contract Template HTML (Tenant)',
    description:
      'Direct-print trigger: renders the server-side contract template of the active contract formatted for A4 print. Supports ?autoPrint=true.',
  })
  @ApiProduces('text/html')
  @ApiOkResponse({
    description: 'Returns rendered HTML page ready for printing',
  })
  async printMyContract(
    @Query('autoPrint') autoPrint: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.log(
      `GET /api/v1/tenant/tenancy/print (autoPrint=${autoPrint}) called by user: ${user?.id}`,
    )
    const isAutoPrint = autoPrint === 'true' || autoPrint === '1'
    const html = await this.contractsService.printMyContract(user.id, isAutoPrint)
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    return res.send(html)
  }

  // ─── POST /api/v1/tenant/tenancy/export ──────────────────────────────────────

  @Post('export')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Export Active Contract (Tenant)',
    description:
      'Renders the contract template, persists a new ContractDocument entry, logs AuditLog, and returns document metadata and HTML.',
  })
  @ApiCreatedResponse({
    type: ExportContractResponseDto,
    description: 'Contract document exported and created successfully',
  })
  async exportMyContract(@CurrentUser() user: JwtPayload) {
    this.logger.log(`POST /api/v1/tenant/tenancy/export called by user: ${user?.id}`)
    const data = await this.contractsService.exportMyContract(user.id)
    return { success: true, data }
  }

  // ─── GET /api/v1/tenant/tenancy/documents/:documentId/download ───────────────

  @Get('documents/:documentId/download')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Download Contract Document (Tenant)',
    description: 'Streams the rendered contract document as a downloadable HTML file for the tenant.',
  })
  @ApiOkResponse({
    description: 'File download stream',
  })
  async downloadMyContractDocument(
    @Param('documentId', new ParseUUIDPipe({ version: '4' })) documentId: string,
    @CurrentUser() user: JwtPayload,
    @Res() res: Response,
  ) {
    this.logger.log(
      `GET /api/v1/tenant/tenancy/documents/${documentId}/download called by user: ${user?.id}`,
    )
    const { filename, html } = await this.contractsService.getMyContractDocumentDownload(
      user.id,
      documentId,
    )
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    return res.send(html)
  }
}
