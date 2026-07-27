import { Controller, Get, Post, Body, Param, Query, Patch } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { CreateContractDto } from './dto/create-contract.dto';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Post()
  async create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto);
  }

  @Get()
  async findAll(@Query('houseId') houseId?: string) {
    if (houseId) {
      return this.contractsService.findAllByHouse(houseId);
    }
    return [];
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Patch(':id/terminate')
  async terminate(@Param('id') id: string) {
    return this.contractsService.terminate(id);
  }
}
