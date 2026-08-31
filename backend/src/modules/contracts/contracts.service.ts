import { Injectable, NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

/**
 * ContractsService — stub for UC-L-04 (full implementation pending).
 *
 * UC-T-01 hook is wired here: after a contract is created, the caller must
 * invoke `notifyContractCreated` OUTSIDE the DB transaction, per the global
 * convention that no 3rd-party calls happen inside a transaction.
 *
 * Example usage in UC-L-04 (when fully implemented):
 *
 *   const contract = await this.prisma.$transaction(async (tx) => {
 *     // ... create CONTRACT, CONTRACT_TENANT, DEPOSIT, AuditLog rows ...
 *     return contract;
 *   });
 *
 *   // ← Outside the transaction ↓
 *   await this.contractsService.notifyContractCreated({
 *     senderId: landlordId,
 *     receiverId: tenantId,
 *     boardingHouseId,
 *     contractId: contract.id,
 *   });
 */
@Injectable()
export class ContractsService {
  private readonly contracts = [
    {
      id: 'HD-2026-001',
      roomNumber: '101',
      tenantName: 'Trần Thị B',
      startDate: '2026-01-01',
      endDate: '2026-12-31',
      rentPrice: 4500000,
      depositAmount: 4500000,
      status: 'active',
    },
  ];

  constructor(private readonly notificationsService: NotificationsService) {}

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

  /**
   * UC-T-01 call-site: triggers onboarding notification after contract creation.
   *
   * Must be called OUTSIDE any active $transaction — the notification write
   * and BullMQ enqueue are independent operations.
   *
   * @param params sender/receiver/boardingHouse/contract context
   */
  async notifyContractCreated(params: {
    senderId: string;
    receiverId: string;
    boardingHouseId: string;
    contractId: string;
  }): Promise<void> {
    await this.notificationsService.createOnboardingNotification(params);
  }
}
