import { Controller, Get, Post, Body, Param, Query } from '@nestjs/common';
import { InvoicesService } from './invoices.service';
import { RecordMeterDto } from './dto/record-meter.dto';

@Controller('invoices')
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  @Post('record-meter')
  async recordMeterAndGenerateInvoice(@Body() dto: RecordMeterDto) {
    return this.invoicesService.generateInvoice(dto);
  }

  @Get()
  async findAll(@Query('houseId') houseId?: string, @Query('tenantId') tenantId?: string) {
    if (houseId) {
      return this.invoicesService.findAllByHouse(houseId);
    }
    if (tenantId) {
      return this.invoicesService.findAllByTenant(tenantId);
    }
    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id);
  }
}
