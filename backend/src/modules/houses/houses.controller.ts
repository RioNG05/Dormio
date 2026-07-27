import { Controller, Get, Post, Body, Param, Put, Delete, Query } from '@nestjs/common';
import { HousesService } from './houses.service';
import { CreateHouseDto } from './dto/create-house.dto';

@Controller('houses')
export class HousesController {
  constructor(private readonly housesService: HousesService) {}

  @Post()
  async create(@Query('landlordId') landlordId: string, @Body() dto: CreateHouseDto) {
    const targetLandlordId = landlordId || '22222222-2222-2222-2222-222222222222';
    return this.housesService.create(targetLandlordId, dto);
  }

  @Get()
  async findAll(@Query('landlordId') landlordId: string) {
    const targetLandlordId = landlordId || '22222222-2222-2222-2222-222222222222';
    return this.housesService.findAllByLandlord(targetLandlordId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.housesService.findOne(id);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: Partial<CreateHouseDto>) {
    return this.housesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.housesService.remove(id);
  }
}
