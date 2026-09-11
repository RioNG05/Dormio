import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentStatus, AuditLogAction, UserRole } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { EmployeesService } from './employees.service';

describe('EmployeesService', () => {
  let service: EmployeesService;
  let mockPrisma: any;

  const mockBoardingHouseId = 'house-uuid-1111';
  const mockUserId = 'user-uuid-2222';
  const mockLandlordId = 'landlord-uuid-3333';
  const mockPositionId = 'pos-uuid-4444';
  const mockAssignmentId = 'assign-uuid-5555';
  const mockEmployeeId = 'emp-uuid-6666';

  beforeEach(async () => {
    mockPrisma = {
      user: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employee: {
        findUnique: jest.fn(),
        create: jest.fn(),
      },
      employeeAssignment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      jobPosition: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        create: jest.fn(),
        createMany: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      workSchedule: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(mockPrisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmployeesService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<EmployeesService>(EmployeesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('searchUser', () => {
    it('should return found: false when query is empty', async () => {
      const res = await service.searchUser('', mockBoardingHouseId);
      expect(res.found).toBe(false);
      expect(res.user).toBeNull();
    });

    it('should return user info and isAlreadyStaffAtThisHouse: false when user exists', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: mockUserId,
        username: 'Nguyễn Văn Bảo',
        phoneNumber: '0901234567',
        email: 'bao@dormio.vn',
        avatarUrl: null,
        role: UserRole.leasing_agent,
        employee: {
          id: mockEmployeeId,
          employeeAssignments: [],
        },
      });

      const res = await service.searchUser('0901234567', mockBoardingHouseId);
      expect(res.found).toBe(true);
      expect(res.user?.fullName).toBe('Nguyễn Văn Bảo');
      expect(res.user?.isAlreadyStaffAtThisHouse).toBe(false);
    });

    it('should mark isAlreadyStaffAtThisHouse: true if user has active assignment here', async () => {
      mockPrisma.user.findFirst.mockResolvedValue({
        id: mockUserId,
        username: 'Nguyễn Văn Bảo',
        phoneNumber: '0901234567',
        email: 'bao@dormio.vn',
        avatarUrl: null,
        role: UserRole.employee,
        employee: {
          id: mockEmployeeId,
          employeeAssignments: [{ id: mockAssignmentId }],
        },
      });

      const res = await service.searchUser('0901234567', mockBoardingHouseId);
      expect(res.found).toBe(true);
      expect(res.user?.isAlreadyStaffAtThisHouse).toBe(true);
    });
  });

  describe('getJobPositions', () => {
    it('should seed default positions when none exist', async () => {
      mockPrisma.jobPosition.findMany
        .mockResolvedValueOnce([]) // First check empty
        .mockResolvedValueOnce([
          {
            id: mockPositionId,
            name: 'Quản lý tòa nhà',
            description: 'Vận hành',
            createdAt: new Date(),
            _count: { employeeAssignments: 1 },
          },
        ]);

      mockPrisma.jobPosition.createMany.mockResolvedValue({ count: 4 });

      const positions = await service.getJobPositions(mockBoardingHouseId);
      expect(mockPrisma.jobPosition.createMany).toHaveBeenCalled();
      expect(positions).toHaveLength(1);
      expect(positions[0].name).toBe('Quản lý tòa nhà');
    });

    it('should return existing positions without seeding if already present', async () => {
      mockPrisma.jobPosition.findMany.mockResolvedValue([
        {
          id: mockPositionId,
          name: 'Bảo vệ',
          description: 'An ninh',
          createdAt: new Date(),
          _count: { employeeAssignments: 2 },
        },
      ]);

      const positions = await service.getJobPositions(mockBoardingHouseId);
      expect(mockPrisma.jobPosition.createMany).not.toHaveBeenCalled();
      expect(positions).toHaveLength(1);
      expect(positions[0].name).toBe('Bảo vệ');
    });
  });

  describe('createJobPosition', () => {
    it('should throw ConflictException if position name already exists', async () => {
      mockPrisma.jobPosition.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createJobPosition(mockBoardingHouseId, { name: 'Bảo vệ' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create position successfully', async () => {
      mockPrisma.jobPosition.findFirst.mockResolvedValue(null);
      mockPrisma.jobPosition.create.mockResolvedValue({
        id: 'new-id',
        name: 'Kỹ thuật viên',
        description: 'Bảo trì',
        createdAt: new Date(),
      });

      const res = await service.createJobPosition(mockBoardingHouseId, {
        name: 'Kỹ thuật viên',
        description: 'Bảo trì',
      });

      expect(res.name).toBe('Kỹ thuật viên');
      expect(mockPrisma.jobPosition.create).toHaveBeenCalled();
    });
  });

  describe('onboardStaff (UC-L-19)', () => {
    beforeEach(() => {
      mockPrisma.jobPosition.findFirst.mockResolvedValue({
        id: mockPositionId,
        name: 'Bảo vệ',
      });
    });

    it('should throw ConflictException if user already has an active assignment', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        phoneNumber: '0901234567',
        role: UserRole.employee,
        employee: { id: mockEmployeeId },
      });

      mockPrisma.employeeAssignment.findFirst.mockResolvedValue({
        id: 'existing-assignment',
        status: AssignmentStatus.active,
      });

      await expect(
        service.onboardStaff(mockBoardingHouseId, mockLandlordId, {
          phoneNumber: '0901234567',
          positionId: mockPositionId,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new User with random password, Employee, Assignment, and AuditLog when user is not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({
        id: mockUserId,
        phoneNumber: '0988776655',
        username: 'Trần Văn Cường',
        role: UserRole.leasing_agent,
        mustChangePassword: true,
        employee: null,
      });
      mockPrisma.employee.create.mockResolvedValue({
        id: mockEmployeeId,
        userId: mockUserId,
      });
      mockPrisma.employeeAssignment.create.mockResolvedValue({
        id: mockAssignmentId,
        employeeId: mockEmployeeId,
        positionId: mockPositionId,
        boardingHouseId: mockBoardingHouseId,
        status: AssignmentStatus.active,
        joinedAt: new Date(),
        leftAt: null,
        createdAt: new Date(),
        position: { name: 'Bảo vệ', description: null },
        employee: {
          user: {
            id: mockUserId,
            username: 'Trần Văn Cường',
            phoneNumber: '0988776655',
            email: null,
            avatarUrl: null,
            role: UserRole.employee,
            mustChangePassword: true,
          },
        },
      });

      const res = await service.onboardStaff(
        mockBoardingHouseId,
        mockLandlordId,
        {
          phoneNumber: '0988776655',
          fullName: 'Trần Văn Cường',
          positionId: mockPositionId,
        },
      );

      expect(res.success).toBe(true);
      expect(res.isNewUser).toBe(true);
      expect(res.generatedPassword).toBeDefined();
      expect(typeof res.generatedPassword).toBe('string');
      expect(mockPrisma.user.create).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditLogAction.create,
          entityType: 'EMPLOYEE_ASSIGNMENT',
          userId: mockLandlordId,
        }),
      });
    });

    it('should onboard existing user, bump role to employee, and write AuditLog', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: mockUserId,
        phoneNumber: '0901234567',
        username: 'Nguyễn Văn Bảo',
        role: UserRole.leasing_agent,
        employee: { id: mockEmployeeId },
      });
      mockPrisma.employeeAssignment.findFirst.mockResolvedValue(null);
      mockPrisma.employeeAssignment.create.mockResolvedValue({
        id: mockAssignmentId,
        employeeId: mockEmployeeId,
        positionId: mockPositionId,
        boardingHouseId: mockBoardingHouseId,
        status: AssignmentStatus.active,
        joinedAt: new Date(),
        leftAt: null,
        createdAt: new Date(),
        position: { name: 'Bảo vệ', description: null },
        employee: {
          user: {
            id: mockUserId,
            username: 'Nguyễn Văn Bảo',
            phoneNumber: '0901234567',
            email: null,
            avatarUrl: null,
            role: UserRole.employee,
            mustChangePassword: false,
          },
        },
      });

      const res = await service.onboardStaff(
        mockBoardingHouseId,
        mockLandlordId,
        {
          phoneNumber: '0901234567',
          positionId: mockPositionId,
        },
      );

      expect(res.success).toBe(true);
      expect(res.isNewUser).toBe(false);
      expect(res.generatedPassword).toBeUndefined();
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: mockUserId },
        data: { role: UserRole.employee },
      });
      expect(mockPrisma.auditLog.create).toHaveBeenCalled();
    });
  });

  describe('updateStaffStatus (UC-L-20)', () => {
    it('should throw NotFoundException when assignment not found', async () => {
      mockPrisma.employeeAssignment.findFirst.mockResolvedValue(null);

      await expect(
        service.updateStaffStatus(
          mockBoardingHouseId,
          'non-existent',
          mockLandlordId,
          { status: AssignmentStatus.inactive },
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should set leftAt and cancel future schedules when status is changed to inactive', async () => {
      mockPrisma.employeeAssignment.findFirst.mockResolvedValue({
        id: mockAssignmentId,
        employeeId: mockEmployeeId,
        positionId: mockPositionId,
        boardingHouseId: mockBoardingHouseId,
        status: AssignmentStatus.active,
      });

      mockPrisma.employeeAssignment.update.mockResolvedValue({
        id: mockAssignmentId,
        employeeId: mockEmployeeId,
        positionId: mockPositionId,
        boardingHouseId: mockBoardingHouseId,
        status: AssignmentStatus.inactive,
        joinedAt: new Date(),
        leftAt: new Date(),
        createdAt: new Date(),
        position: { name: 'Bảo vệ', description: null },
        employee: {
          user: {
            id: mockUserId,
            username: 'Nguyễn Văn Bảo',
            phoneNumber: '0901234567',
            email: null,
            avatarUrl: null,
            role: UserRole.employee,
            mustChangePassword: false,
          },
        },
      });

      const res = await service.updateStaffStatus(
        mockBoardingHouseId,
        mockAssignmentId,
        mockLandlordId,
        { status: AssignmentStatus.inactive },
      );

      expect(res.status).toBe(AssignmentStatus.inactive);
      expect(mockPrisma.workSchedule.updateMany).toHaveBeenCalled();
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          action: AuditLogAction.update,
          entityType: 'EMPLOYEE_ASSIGNMENT',
        }),
      });
    });
  });
});
