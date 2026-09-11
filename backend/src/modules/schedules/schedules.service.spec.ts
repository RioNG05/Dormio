import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SchedulesService } from './schedules.service';

describe('SchedulesService (UC-L-21)', () => {
  let service: SchedulesService;
  let prisma: any;

  const mockBoardingHouseId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockEmployeeId = '33333333-3333-3333-3333-333333333333';
  const mockShiftId = '44444444-4444-4444-4444-444444444444';
  const mockScheduleId = '55555555-5555-5555-5555-555555555555';
  const mockPatternId = '66666666-6666-6666-6666-666666666666';

  beforeEach(async () => {
    prisma = {
      shift: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      workSchedule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
        count: jest.fn(),
      },
      recurrencePattern: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      employeeAssignment: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      $transaction: jest.fn(async (cbOrArr) => {
        if (typeof cbOrArr === 'function') {
          return cbOrArr(prisma);
        }
        return Promise.all(cbOrArr);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SchedulesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<SchedulesService>(SchedulesService);
  });

  describe('getShifts', () => {
    it('should return existing shifts if already present', async () => {
      prisma.shift.findMany.mockResolvedValueOnce([
        {
          id: mockShiftId,
          boardingHouseId: mockBoardingHouseId,
          name: 'Ca sáng',
          startTime: new Date('1970-01-01T06:00:00Z'),
          endTime: new Date('1970-01-01T14:00:00Z'),
          createdAt: new Date(),
        },
      ]);

      const result = await service.getShifts(mockBoardingHouseId);

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Ca sáng');
      expect(result[0].startTime).toBe('06:00');
      expect(result[0].endTime).toBe('14:00');
    });

    it('should seed default shifts if none exist yet', async () => {
      prisma.shift.findMany
        .mockResolvedValueOnce([]) // First check returns empty
        .mockResolvedValueOnce([
          {
            id: mockShiftId,
            boardingHouseId: mockBoardingHouseId,
            name: 'Ca sáng',
            startTime: new Date('1970-01-01T06:00:00Z'),
            endTime: new Date('1970-01-01T14:00:00Z'),
            createdAt: new Date(),
          },
        ]);

      const result = await service.getShifts(mockBoardingHouseId);

      expect(prisma.$transaction).toHaveBeenCalled();
      expect(result).toHaveLength(1);
    });
  });

  describe('createShift', () => {
    it('should throw ConflictException if shift name already exists', async () => {
      prisma.shift.findFirst.mockResolvedValueOnce({ id: mockShiftId, name: 'Ca sáng' });

      await expect(
        service.createShift(mockBoardingHouseId, {
          name: 'Ca sáng',
          startTime: '06:00',
          endTime: '14:00',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create new shift successfully', async () => {
      prisma.shift.findFirst.mockResolvedValueOnce(null);
      prisma.shift.create.mockResolvedValueOnce({
        id: mockShiftId,
        boardingHouseId: mockBoardingHouseId,
        name: 'Ca tối muộn',
        startTime: new Date('1970-01-01T20:00:00Z'),
        endTime: new Date('1970-01-01T04:00:00Z'),
        createdAt: new Date(),
      });

      const result = await service.createShift(mockBoardingHouseId, {
        name: 'Ca tối muộn',
        startTime: '20:00',
        endTime: '04:00',
      });

      expect(result.id).toBe(mockShiftId);
      expect(result.startTime).toBe('20:00');
      expect(result.endTime).toBe('04:00');
    });
  });

  describe('createRecurringSchedule (Materialization)', () => {
    it('should throw NotFoundException if shift not found', async () => {
      prisma.shift.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.createRecurringSchedule(mockBoardingHouseId, mockUserId, {
          employeeIds: [mockEmployeeId],
          shiftId: mockShiftId,
          daysOfWeek: '2,4,6',
          startDate: '2026-09-14',
          endDate: '2026-09-20',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if employee is not assigned to property', async () => {
      prisma.shift.findFirst.mockResolvedValueOnce({
        id: mockShiftId,
        boardingHouseId: mockBoardingHouseId,
        startTime: new Date('1970-01-01T06:00:00Z'),
        endTime: new Date('1970-01-01T14:00:00Z'),
      });
      prisma.employeeAssignment.findMany.mockResolvedValueOnce([]); // No active assignment

      await expect(
        service.createRecurringSchedule(mockBoardingHouseId, mockUserId, {
          employeeIds: [mockEmployeeId],
          shiftId: mockShiftId,
          daysOfWeek: '2,4,6',
          startDate: '2026-09-14',
          endDate: '2026-09-20',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should materialize individual WorkSchedule rows for matching days of week', async () => {
      prisma.shift.findFirst.mockResolvedValueOnce({
        id: mockShiftId,
        boardingHouseId: mockBoardingHouseId,
        startTime: new Date('1970-01-01T06:00:00Z'),
        endTime: new Date('1970-01-01T14:00:00Z'),
      });
      prisma.employeeAssignment.findMany.mockResolvedValueOnce([
        { employeeId: mockEmployeeId, status: 'active' },
      ]);
      prisma.recurrencePattern.create.mockResolvedValueOnce({
        id: mockPatternId,
        employeeId: mockEmployeeId,
      });
      prisma.workSchedule.findFirst.mockResolvedValue(null);
      prisma.workSchedule.create.mockResolvedValue({ id: mockScheduleId });

      // 2026-09-14 is Monday (Thứ 2 = 1)
      // 2026-09-16 is Wednesday (Thứ 4 = 3)
      // 2026-09-18 is Friday (Thứ 6 = 5)
      // 2026-09-20 is Sunday (Chủ Nhật = 0)
      // DaysOfWeek "2,4,6" will match Mon (14), Wed (16), Fri (18) -> 3 rows
      const result = await service.createRecurringSchedule(
        mockBoardingHouseId,
        mockUserId,
        {
          employeeIds: [mockEmployeeId],
          shiftId: mockShiftId,
          daysOfWeek: '2,4,6',
          startDate: '2026-09-14',
          endDate: '2026-09-20',
        },
      );

      expect(result.success).toBe(true);
      expect(result.patternsCreated).toBe(1);
      expect(result.schedulesMaterialized).toBe(3);
      expect(prisma.workSchedule.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('createAdhocSchedule', () => {
    it('should create single WorkSchedule with recurrenceId = null', async () => {
      prisma.shift.findFirst.mockResolvedValueOnce({
        id: mockShiftId,
        name: 'Ca sáng',
        startTime: new Date('1970-01-01T06:00:00Z'),
        endTime: new Date('1970-01-01T14:00:00Z'),
      });
      prisma.employeeAssignment.findFirst.mockResolvedValueOnce({
        employeeId: mockEmployeeId,
        position: { name: 'Bảo vệ' },
      });
      prisma.workSchedule.create.mockResolvedValueOnce({
        id: mockScheduleId,
        boardingHouseId: mockBoardingHouseId,
        employeeId: mockEmployeeId,
        shiftId: mockShiftId,
        workDate: new Date('2026-09-16T00:00:00Z'),
        recurrenceId: null,
        status: 'scheduled',
        createdAt: new Date(),
        shift: {
          name: 'Ca sáng',
          startTime: new Date('1970-01-01T06:00:00Z'),
          endTime: new Date('1970-01-01T14:00:00Z'),
        },
        employee: {
          user: { fullName: 'Nguyễn Văn A', phoneNumber: '0912345678', avatarUrl: null },
        },
      });

      const result = await service.createAdhocSchedule(mockBoardingHouseId, {
        employeeId: mockEmployeeId,
        shiftId: mockShiftId,
        workDate: '2026-09-16',
        note: 'Đột xuất',
      });

      expect(result.id).toBe(mockScheduleId);
      expect(result.recurrenceId).toBeNull();
      expect(result.isRecurring).toBe(false);
      expect(result.workDate).toBe('2026-09-16');
    });
  });

  describe('updateSchedule (Single occurrence)', () => {
    it('should update single occurrence and retain recurrenceId', async () => {
      prisma.workSchedule.findFirst.mockResolvedValueOnce({
        id: mockScheduleId,
        boardingHouseId: mockBoardingHouseId,
        shiftId: mockShiftId,
        workDate: new Date('2026-09-16T00:00:00Z'),
        recurrenceId: mockPatternId,
        status: 'scheduled',
        shift: { name: 'Ca sáng', startTime: new Date(), endTime: new Date() },
        employee: {
          user: { fullName: 'Nguyễn Văn A', phoneNumber: '0912345678' },
          employeeAssignments: [{ position: { name: 'Bảo vệ' } }],
        },
        attendances: [],
      });

      prisma.workSchedule.update.mockResolvedValueOnce({
        id: mockScheduleId,
        boardingHouseId: mockBoardingHouseId,
        employeeId: mockEmployeeId,
        shiftId: mockShiftId,
        workDate: new Date('2026-09-17T00:00:00Z'),
        recurrenceId: mockPatternId,
        status: 'scheduled',
        createdAt: new Date(),
        shift: {
          name: 'Ca sáng',
          startTime: new Date('1970-01-01T06:00:00Z'),
          endTime: new Date('1970-01-01T14:00:00Z'),
        },
        employee: {
          user: { fullName: 'Nguyễn Văn A', phoneNumber: '0912345678', avatarUrl: null },
          employeeAssignments: [{ position: { name: 'Bảo vệ' } }],
        },
        attendances: [],
      });

      const result = await service.updateSchedule(mockBoardingHouseId, mockScheduleId, {
        workDate: '2026-09-17',
      });

      expect(result.recurrenceId).toBe(mockPatternId);
      expect(result.isRecurring).toBe(true);
      expect(result.workDate).toBe('2026-09-17');
    });
  });

  describe('updateRecurrence (Forward pattern)', () => {
    it('should update all future WorkSchedule occurrences forward', async () => {
      prisma.recurrencePattern.findFirst.mockResolvedValueOnce({
        id: mockPatternId,
        boardingHouseId: mockBoardingHouseId,
        shiftId: mockShiftId,
      });
      prisma.workSchedule.updateMany.mockResolvedValueOnce({ count: 8 });

      const result = await service.updateRecurrence(mockBoardingHouseId, mockPatternId, {
        status: 'canceled',
      });

      expect(result.updatedCount).toBe(8);
      expect(prisma.workSchedule.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            recurrenceId: mockPatternId,
            boardingHouseId: mockBoardingHouseId,
          }),
        }),
      );
    });
  });
});
