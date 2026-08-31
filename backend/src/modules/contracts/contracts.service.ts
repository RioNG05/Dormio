import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { TenancyDetailsDto } from './dto/tenancy-details.dto';

/**
 * ContractsService
 *
 * Handles contract operations, including:
 * - UC-T-01 onboarding notification hook
 * - UC-T-06 tenant tenancy details retrieval (read-only aggregate)
 */
@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // ─── UC-T-06: View Tenancy Details ──────────────────────────────────────────

  /**
   * Retrieves the full tenancy aggregate for the authenticated tenant:
   * active Contract + Room + BoardingHouse (basic info only, never financials)
   * + active RoomServices (fee structure) + BoardingHouse broadcast Announcements.
   *
   * @param userId Authenticated tenant's User ID
   * @returns TenancyDetailsDto or null if no active contract found
   */
  async getMyTenancyDetails(userId: string): Promise<TenancyDetailsDto | null> {
    const tenantContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId: userId,
        contract: {
          status: 'active',
        },
      },
      include: {
        contract: {
          include: {
            deposit: true,
            contractDocuments: true,
            room: {
              include: {
                roomType: true,
                boardingHouse: {
                  include: {
                    owner: {
                      select: {
                        id: true,
                        username: true,
                        phoneNumber: true,
                        email: true,
                        userIdentification: {
                          select: {
                            fullName: true,
                          },
                        },
                      },
                    },
                  },
                },
                roomServices: {
                  where: {
                    service: {
                      status: 'active',
                    },
                  },
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!tenantContract || !tenantContract.contract) {
      return null;
    }

    const { contract } = tenantContract;
    const { room } = contract;
    const { boardingHouse } = room;

    // Fetch broadcast announcements for this boarding house (receiverId IS NULL)
    const announcements = await this.prisma.notification.findMany({
      where: {
        boardingHouseId: boardingHouse.id,
        receiverId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    });

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const formattedAddress = this.formatAddress(boardingHouse);
    const landlordName =
      boardingHouse.owner.userIdentification?.fullName ||
      boardingHouse.owner.username ||
      'Chủ nhà';

    return {
      contract: {
        id: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentPrice: Number(contract.rentPrice),
        monthlyPaymentDate: contract.monthlyPaymentDate,
        depositAmount: contract.deposit
          ? Number(contract.deposit.amount)
          : Number(contract.rentPrice),
        note: contract.note || undefined,
        documents: contract.contractDocuments.map((doc) => ({
          id: doc.id,
          url: doc.url,
          createdAt: doc.createdAt,
        })),
      },
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        area: room.area ? Number(room.area) : undefined,
        maxOccupants: room.maxOccupants ?? undefined,
        roomTypeName: room.roomType?.name,
      },
      boardingHouse: {
        id: boardingHouse.id,
        name: boardingHouse.name,
        address: formattedAddress,
        landlord: {
          name: landlordName,
          phoneNumber: boardingHouse.owner.phoneNumber || '',
          email: boardingHouse.owner.email || undefined,
        },
      },
      services: room.roomServices.map((rs) => ({
        id: rs.service.id,
        name: rs.service.name,
        price: Number(rs.service.price),
        unit: rs.service.unit,
        isMetered: rs.service.isMetered,
      })),
      announcements: announcements.map((item) => ({
        id: item.id,
        title: item.content.length > 40 ? `${item.content.slice(0, 40)}...` : item.content,
        content: item.content,
        createdAt: item.createdAt,
        isNew: item.createdAt >= threeDaysAgo,
      })),
    };
  }

  // ─── UC-T-01 Call-site ───────────────────────────────────────────────────────

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

  // ─── Helper methods ─────────────────────────────────────────────────────────

  private formatAddress(bh: {
    houseNumber?: string | null;
    street?: string | null;
    ward?: string | null;
    district?: string | null;
    city?: string | null;
    province?: string | null;
  }): string {
    const parts = [
      bh.houseNumber ? `${bh.houseNumber} ${bh.street || ''}`.trim() : bh.street,
      bh.ward,
      bh.district,
      bh.city || bh.province,
    ].filter(Boolean);

    return parts.join(', ');
  }
}
