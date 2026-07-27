import { Controller, Get, Post, Body, Param, Patch, Query } from '@nestjs/common';
import { ComplaintsService } from './complaints.service';
import { CreateComplaintDto, UpdateComplaintStatusDto } from './dto/create-complaint.dto';

@Controller('complaints')
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Post()
  async create(@Body() dto: CreateComplaintDto) {
    return this.complaintsService.create(dto);
  }

  @Get()
  async findAll(@Query('houseId') houseId?: string, @Query('tenantId') tenantId?: string) {
    if (houseId) {
      return this.complaintsService.findAllByHouse(houseId);
    }
    if (tenantId) {
      return this.complaintsService.findAllByTenant(tenantId);
    }
    return [];
  }

  @Patch(':id/status')
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateComplaintStatusDto) {
    return this.complaintsService.updateStatus(id, dto);
  }
}
