import { Test, TestingModule } from '@nestjs/testing';
import { ContractsService } from './contracts.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { AuthService } from '../auth/auth.service';
import { NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockPrisma = {
  room: {
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  deposit: {
    findFirst: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  post: {
    update: jest.fn(),
  },
  user: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  userIdentification: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  contract: {
    create: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
  },
  tenantContract: {
    create: jest.fn(),
    findFirst: jest.fn(),
  },
  contractDocument: {
    create: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  notification: {
    findMany: jest.fn(),
  },
  $transaction: jest.fn((callback) => callback(mockPrisma)),
};

const mockNotificationsService = {
  createOnboardingNotification: jest.fn(),
};

const mockAuthService = {
  findOrCreateByPhone: jest.fn(),
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
        { provide: AuthService, useValue: mockAuthService },
      ],
    }).compile();

    service = module.get<ContractsService>(ContractsService);
  });

  // ─── getPendingPlatformDeposit ─────────────────────────────────────────────

  describe('getPendingPlatformDeposit', () => {
    const boardingHouseId = 'bh-1';
    const roomId = 'room-1';

    it('should throw NotFoundException when room does not exist', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.getPendingPlatformDeposit(boardingHouseId, roomId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return null when no pending platform deposit exists', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: roomId, roomNumber: '101' });
      mockPrisma.deposit.findFirst.mockResolvedValue(null);

      const result = await service.getPendingPlatformDeposit(boardingHouseId, roomId);
      expect(result).toBeNull();
    });

    it('should return deposit details when unconverted paid platform deposit exists', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({
        id: roomId,
        roomNumber: '101',
        floor: 1,
        roomType: { name: 'Studio' },
      });

      mockPrisma.deposit.findFirst.mockResolvedValue({
        id: 'deposit-1',
        amount: new Prisma.Decimal(2000000),
        status: 'paid',
        type: 'platform',
        createdAt: new Date('2026-09-01'),
        post: {
          id: 'post-1',
          title: 'Phòng trọ ban công thoáng mát',
          depositAmount: new Prisma.Decimal(2000000),
          postedByUser: null,
        },
        payment: {
          payer: {
            id: 'tenant-user-1',
            username: 'Nguyễn Văn A',
            phoneNumber: '0901234567',
            email: 'a@example.com',
            userIdentification: { fullName: 'Nguyễn Văn A' },
          },
        },
        recordedByUser: null,
      });

      const result = await service.getPendingPlatformDeposit(boardingHouseId, roomId);

      expect(result).toBeDefined();
      expect(result?.depositId).toBe('deposit-1');
      expect(result?.amount).toBe(2000000);
      expect(result?.tenant?.phoneNumber).toBe('0901234567');
      expect(result?.room.roomNumber).toBe('101');
    });
  });

  // ─── searchTenantByPhone ───────────────────────────────────────────────────

  describe('searchTenantByPhone', () => {
    it('should return exists: false when user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      const result = await service.searchTenantByPhone('0909999999');
      expect(result.exists).toBe(false);
      expect(result.user).toBeNull();
    });

    it('should return user info and identification status when user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        phoneNumber: '0901234567',
        username: 'Trần Văn B',
        email: 'b@example.com',
        userIdentification: { id: 'id-1', fullName: 'Trần Văn B' },
      });

      const result = await service.searchTenantByPhone('0901234567');
      expect(result.exists).toBe(true);
      expect(result.user?.hasIdentification).toBe(true);
      expect(result.user?.fullName).toBe('Trần Văn B');
    });
  });

  // ─── createPlatformContract (Flow A) ───────────────────────────────────────

  describe('createPlatformContract', () => {
    const landlordId = 'landlord-1';
    const boardingHouseId = 'bh-1';
    const dto = {
      roomId: 'room-1',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2027-10-01T00:00:00.000Z',
      rentPrice: 3500000,
      monthlyPaymentDate: 5,
      note: 'Hợp đồng chuyển đổi từ cọc phòng',
    };

    it('should throw NotFoundException if room does not exist', async () => {
      mockPrisma.room.findFirst.mockResolvedValue(null);

      await expect(
        service.createPlatformContract(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if no platform deposit exists', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: 'room-1' });
      mockPrisma.deposit.findFirst.mockResolvedValue(null);

      await expect(
        service.createPlatformContract(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if deposit status is not paid', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: 'room-1' });
      mockPrisma.deposit.findFirst.mockResolvedValue({
        id: 'deposit-1',
        status: 'refund',
        payment: { payerId: 'tenant-1' },
      });

      await expect(
        service.createPlatformContract(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should successfully create draft contract, link existing deposit, and hide post (Flow A)', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: 'room-1' });
      mockPrisma.deposit.findFirst.mockResolvedValue({
        id: 'deposit-1',
        status: 'paid',
        postId: 'post-1',
        payment: { payerId: 'tenant-1' },
      });

      const mockCreatedContract = {
        id: 'contract-new-1',
        roomId: dto.roomId,
        status: 'draft',
        rentPrice: new Prisma.Decimal(dto.rentPrice),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      };
      mockPrisma.contract.create.mockResolvedValue(mockCreatedContract);
      mockPrisma.deposit.update.mockResolvedValue({});
      mockPrisma.post.update.mockResolvedValue({});
      mockPrisma.room.update.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.createPlatformContract(landlordId, boardingHouseId, dto);

      expect(result.status).toBe('draft');
      // Verify TenantContract was created
      expect(mockPrisma.tenantContract.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractId: 'contract-new-1',
          tenantId: 'tenant-1',
          isPrimary: true,
        }),
      });
      // Verify deposit was UPDATED with contractId (Rule 8)
      expect(mockPrisma.deposit.update).toHaveBeenCalledWith({
        where: { id: 'deposit-1' },
        data: { contractId: 'contract-new-1' },
      });
      // Verify post was hidden
      expect(mockPrisma.post.update).toHaveBeenCalledWith({
        where: { id: 'post-1' },
        data: { resultedContractId: 'contract-new-1', status: 'hidden' },
      });
      // Verify room status was set to deposited
      expect(mockPrisma.room.update).toHaveBeenCalledWith({
        where: { id: dto.roomId },
        data: { status: 'deposited' },
      });
      // Verify AuditLog for CONTRACT and DEPOSIT inside transaction (Rule 4)
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'create',
            entityType: 'CONTRACT',
            entityId: 'contract-new-1',
          }),
        }),
      );
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'update',
            entityType: 'DEPOSIT',
            entityId: 'deposit-1',
          }),
        }),
      );
    });
  });

  // ─── createDirectContract (Flow B) ─────────────────────────────────────────

  describe('createDirectContract', () => {
    const landlordId = 'landlord-1';
    const boardingHouseId = 'bh-1';
    const dto = {
      roomId: 'room-1',
      startDate: '2026-10-01T00:00:00.000Z',
      endDate: '2027-10-01T00:00:00.000Z',
      rentPrice: 4000000,
      depositAmount: 4000000,
      monthlyPaymentDate: 5,
      tenantPhoneNumber: '0987654321',
      tenantFullName: 'Lê Hoàng Cường',
      tenantEmail: 'cuong@example.com',
      note: 'Hợp đồng tạo trực tiếp',
    };

    it('should throw ConflictException if an unconverted platform deposit exists on the room', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: 'room-1' });
      mockPrisma.deposit.findFirst.mockResolvedValue({
        id: 'deposit-plat-1',
        type: 'platform',
        status: 'paid',
      });

      await expect(
        service.createDirectContract(landlordId, boardingHouseId, dto),
      ).rejects.toThrow(ConflictException);
    });

    it('should create active contract, manual deposit, contract doc, and audit logs (Flow B)', async () => {
      mockPrisma.room.findFirst.mockResolvedValue({ id: 'room-1' });
      mockPrisma.deposit.findFirst.mockResolvedValue(null);

      mockAuthService.findOrCreateByPhone.mockResolvedValue({
        id: 'tenant-user-2',
        phoneNumber: dto.tenantPhoneNumber,
        username: dto.tenantFullName,
        email: null,
      });
      mockPrisma.user.update.mockResolvedValue({});
      mockPrisma.userIdentification.findUnique.mockResolvedValue({ id: 'id-existing' });

      const mockCreatedContract = {
        id: 'contract-direct-1',
        roomId: dto.roomId,
        status: 'active',
        rentPrice: new Prisma.Decimal(dto.rentPrice),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
      };
      mockPrisma.contract.create.mockResolvedValue(mockCreatedContract);
      mockPrisma.tenantContract.create.mockResolvedValue({});
      mockPrisma.deposit.create.mockResolvedValue({
        id: 'deposit-manual-1',
        amount: new Prisma.Decimal(dto.depositAmount),
        type: 'contract',
        status: 'paid',
      });
      mockPrisma.room.update.mockResolvedValue({});
      mockPrisma.contractDocument.create.mockResolvedValue({});
      mockPrisma.auditLog.create.mockResolvedValue({});

      const result = await service.createDirectContract(landlordId, boardingHouseId, dto);

      expect(result.status).toBe('active');
      expect(mockAuthService.findOrCreateByPhone).toHaveBeenCalledWith(
        dto.tenantPhoneNumber,
        dto.tenantFullName,
      );
      // Verify manual deposit creation
      expect(mockPrisma.deposit.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'contract',
          status: 'paid',
          recordedManually: true,
          recordedBy: landlordId,
          contractId: 'contract-direct-1',
        }),
      });
      // Verify room status = occupied
      expect(mockPrisma.room.update).toHaveBeenCalledWith({
        where: { id: dto.roomId },
        data: { status: 'occupied' },
      });
      // Verify ContractDocument created
      expect(mockPrisma.contractDocument.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          contractId: 'contract-direct-1',
        }),
      });
      // Verify UC-T-01 onboarding notification triggered
      expect(mockNotificationsService.createOnboardingNotification).toHaveBeenCalledWith({
        senderId: landlordId,
        receiverId: 'tenant-user-2',
        boardingHouseId,
        contractId: 'contract-direct-1',
      });
      // Verify AuditLogs created
      expect(mockPrisma.auditLog.create).toHaveBeenCalledTimes(2);
    });
  });

  // ─── getLandlordContracts ──────────────────────────────────────────────────

  describe('getLandlordContracts', () => {
    it('should return paginated contracts list', async () => {
      mockPrisma.contract.count.mockResolvedValue(1);
      mockPrisma.contract.findMany.mockResolvedValue([
        {
          id: 'c-1',
          status: 'active',
          startDate: new Date('2026-01-01'),
          endDate: new Date('2027-01-01'),
          rentPrice: new Prisma.Decimal(3000000),
          monthlyPaymentDate: 5,
          note: 'Hợp đồng 1',
          createdAt: new Date('2026-01-01'),
          room: { id: 'r-1', roomNumber: '101', floor: 1, roomType: { name: 'Studio' } },
          tenantContracts: [
            {
              isPrimary: true,
              tenant: {
                id: 'u-1',
                username: 'Khách A',
                phoneNumber: '0901234567',
                email: 'a@example.com',
                userIdentification: null,
              },
            },
          ],
          deposit: { amount: new Prisma.Decimal(3000000) },
          contractDocuments: [],
        },
      ]);

      const result = await service.getLandlordContracts('bh-1', { page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.data.length).toBe(1);
      expect(result.data[0].room.roomNumber).toBe('101');
      expect(result.data[0].tenant?.fullName).toBe('Khách A');
    });
  });

  // ─── getContractById ───────────────────────────────────────────────────────

  describe('getContractById', () => {
    it('should throw NotFoundException if contract not found', async () => {
      mockPrisma.contract.findFirst.mockResolvedValue(null);

      await expect(service.getContractById('bh-1', 'non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return contract details if found', async () => {
      mockPrisma.contract.findFirst.mockResolvedValue({
        id: 'c-1',
        status: 'active',
        startDate: new Date('2026-01-01'),
        endDate: new Date('2027-01-01'),
        rentPrice: new Prisma.Decimal(3500000),
        monthlyPaymentDate: 5,
        note: 'Note',
        createdAt: new Date('2026-01-01'),
        room: {
          id: 'r-1',
          roomNumber: '202',
          floor: 2,
          area: new Prisma.Decimal(28),
          roomType: { name: '1PN' },
          roomServices: [],
        },
        tenantContracts: [],
        deposit: null,
        contractDocuments: [],
        invoices: [],
      });

      const result = await service.getContractById('bh-1', 'c-1');
      expect(result.id).toBe('c-1');
      expect(result.room.roomNumber).toBe('202');
    });
  });

  // ─── getMyTenancyDetails ───────────────────────────────────────────────────

  describe('getMyTenancyDetails', () => {
    const userId = 'tenant-user-uuid';

    it('should return null when no active contract exists for tenant', async () => {
      mockPrisma.tenantContract.findFirst.mockResolvedValue(null);

      const result = await service.getMyTenancyDetails(userId);
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
            roomServices: [],
          },
        },
      };

      mockPrisma.tenantContract.findFirst.mockResolvedValue(mockTenantContract);
      mockPrisma.notification.findMany.mockResolvedValue([]);

      const result = await service.getMyTenancyDetails(userId);

      expect(result?.contract.id).toBe('contract-1');
      expect(result?.boardingHouse.name).toBe('Khu trọ An Bình');
      expect(result?.boardingHouse.landlord.name).toBe('Nguyễn Văn Rio');
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
