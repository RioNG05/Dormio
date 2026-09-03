import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  tenantContract: {
    findFirst: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
  },
};

const mockNotificationsService = {
  createOnboardingNotification: jest.fn(),
};

describe('ContractsService', () => {
  let service: ContractsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContractsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  // ─── getMyTenancyDetails ───────────────────────────────────────────────────

  describe('getMyTenancyDetails', () => {
    const userId = 'tenant-user-uuid';

    it('should return null when no active contract exists for tenant', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      const result = await service.getMyTenancyDetails(userId);

      expect(mockPrisma.tenantContract.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            tenantId: userId,
            contract: { status: 'active' },
          },
        }),
      );
      expect(result).toBeNull();
    });

    it('should return full tenancy aggregate when active contract exists', async () => {
      const mockTenantContract = {
        id: 'tc-1',
        tenantId: userId,
        contract: {
          id: 'contract-1',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          rentPrice: 4500000,
          monthlyPaymentDate: 5,
          note: 'Deposit paid in full',
          deposit: {
            amount: 4500000,
          },
          contractDocuments: [
            { id: 'doc-1', url: 'https://example.com/contract.pdf', createdAt: new Date('2026-01-01') },
          ],
          room: {
            id: 'room-1',
            roomNumber: '101',
            floor: 1,
            area: 25,
            maxOccupants: 2,
            roomType: { name: 'Phòng đơn cao cấp' },
            boardingHouseId: 'bh-1',
            boardingHouse: {
              id: 'bh-1',
              name: 'Khu trọ An Bình',
              houseNumber: '123',
              street: 'Đường An Bình',
              ward: 'Phường 4',
              district: 'Quận 5',
              city: 'TP.HCM',
              owner: {
                id: 'owner-1',
                username: 'nguyenvanrio',
                phoneNumber: '0901234567',
                email: 'rio@example.com',
                userIdentification: {
                  fullName: 'Nguyễn Văn Rio',
                },
              },
            },
            roomServices: [
              {
                service: {
                  id: 'svc-1',
                  name: 'Điện',
                  price: 3500,
                  unit: 'kWh',
                  isMetered: true,
                },
              },
              {
                service: {
                  id: 'svc-2',
                  name: 'Nước',
                  price: 20000,
                  unit: 'm³',
                  isMetered: true,
                },
              },
            ],
          },
        },
      };

      const mockAnnouncements = [
        {
          id: 'notif-1',
          content: 'Điện lực Quận 5 thông báo cắt điện sáng mai.',
          createdAt: new Date(),
        },
      ];

      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.notification.findMany.mockResolvedValue(mockAnnouncements);

      const result = await service.getMyTenancyDetails(userId);

      expect(result).toBeDefined();
      expect(result?.contract.id).toBe('contract-1');
      expect(result?.contract.rentPrice).toBe(4500000);
      expect(result?.contract.depositAmount).toBe(4500000);
      expect(result?.contract.documents).toHaveLength(1);

      expect(result?.room.roomNumber).toBe('101');
      expect(result?.room.floor).toBe(1);

      expect(result?.boardingHouse.name).toBe('Khu trọ An Bình');
      expect(result?.boardingHouse.address).toBe('123 Đường An Bình, Phường 4, Quận 5, TP.HCM');
      expect(result?.boardingHouse.landlord.name).toBe('Nguyễn Văn Rio');
      expect(result?.boardingHouse.landlord.phoneNumber).toBe('0901234567');

      expect(result?.services).toHaveLength(2);
      expect(result?.services[0].name).toBe('Điện');
      expect(result?.services[0].price).toBe(3500);

      expect(result?.announcements).toHaveLength(1);
      expect(result?.announcements[0].content).toBe('Điện lực Quận 5 thông báo cắt điện sáng mai.');
      expect(result?.announcements[0].isNew).toBe(true);
    });

    it('should fallback to username or default label when fullName is absent', async () => {
      const mockTenantContract = {
        id: 'tc-2',
        tenantId: userId,
        contract: {
          id: 'contract-2',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2026-12-31'),
          rentPrice: 3000000,
          monthlyPaymentDate: 10,
          deposit: null,
          contractDocuments: [],
          room: {
            id: 'room-2',
            roomNumber: '202',
            floor: 2,
            area: null,
            maxOccupants: null,
            roomType: null,
            boardingHouseId: 'bh-2',
            boardingHouse: {
              id: 'bh-2',
              name: 'Nhà trọ Bình Dân',
              houseNumber: null,
              street: 'Nguyễn Trãi',
              ward: 'Phường 2',
              district: 'Quận 5',
              city: 'TP.HCM',
              owner: {
                id: 'owner-2',
                username: 'landlord_user',
                phoneNumber: '0987654321',
                email: null,
                userIdentification: null,
              },
            },
            roomServices: [],
          },
        },
      };

      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getMyTenancyDetails(userId);

      expect(result?.boardingHouse.landlord.name).toBe('landlord_user');
      expect(result?.boardingHouse.address).toBe('Nguyễn Trãi, Phường 2, Quận 5, TP.HCM');
      expect(result?.contract.depositAmount).toBe(3000000); // defaults to rentPrice
      expect(result?.services).toEqual([]);
      expect(result?.announcements).toEqual([]);
    });
  });

  // ─── notifyContractCreated ─────────────────────────────────────────────────

  describe('notifyContractCreated', () => {
    it('should delegate to notificationsService.createOnboardingNotification', async () => {
      const params = {
        senderId: 'landlord-1',
        receiverId: 'tenant-1',
        boardingHouseId: 'bh-1',
        contractId: 'c-1',
      };

      await service.notifyContractCreated(params);

      expect(mockNotificationsService.createOnboardingNotification).toHaveBeenCalledWith(params);
    });
  });
});
