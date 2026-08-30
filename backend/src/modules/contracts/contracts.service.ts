import { Injectable, NotFoundException } from "@nestjs/common";

@Injectable()
export class ContractsService {
  private readonly contracts = [
    {
      id: "HD-2026-001",
      roomNumber: "101",
      tenantName: "Trần Thị B",
      startDate: "2026-01-01",
      endDate: "2026-12-31",
      rentPrice: 4500000,
      depositAmount: 4500000,
      status: "active",
    },
  ];

  async findAll() {
    return this.contracts;
  }

  async findOne(id: string) {
    const contract = this.contracts.find((c) => c.id === id);
    if (!contract) {
      throw new NotFoundException(`Contract with ID ${id} not found`);
    }
    return contract;
  }
}
