import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceStatus, AuditLogAction, ScheduleStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AttendanceService } from './attendance.service';

describe('Staff Attendance (UC-S-01 & UC-S-02)', () => {
  let service: AttendanceService;
  let prisma: any;

  const mockUserId = '11111111-1111-1111-1111-111111111111';
  const mockEmployeeId = '22222222-2222-2222-2222-222222222222';
  const mockBoardingHouseId = '33333333-3333-3333-3333-333333333333';
  const mockScheduleId = '44444444-4444-4444-4444-444444444444';
  const mockAttendanceId = '55555555-5555-5555-5555-555555555555';
  const mockShiftId = '66666666-6666-6666-6666-666666666666';

  const mockEmployee = {
    id: mockEmployeeId,
    userId: mockUserId,
    user: {
      username: 'baopham',
      phoneNumber: '0901122334',
      avatarUrl: 'https://example.com/avatar.jpg',
      userIdentification: { fullName: 'Phạm Văn Bảo' },
    },
    employeeAssignments: [
      {
        id: 'assign-1',
        boardingHouseId: mockBoardingHouseId,
        status: 'active',
        position: {
          id: 'pos-1',
          name: 'Bảo vệ & Vận hành',
          description: 'Trực an ninh cổng',
        },
        boardingHouse: {
          id: mockBoardingHouseId,
          name: 'Dormio Premier Quận 1',
          houseNumber: '123',
          street: 'Nguyễn Huệ',
          ward: 'Bến Nghé',
          district: 'Quận 1',
          city: 'TP.HCM',
        },
      },
    ],
  };

  const mockShift = {
    id: mockShiftId,
    name: 'Ca Sáng (07:00 - 15:00)',
    startTime: new Date('1970-01-01T07:00:00Z'),
    endTime: new Date('1970-01-01T15:00:00Z'),
  };

  const mockSchedule = {
    id: mockScheduleId,
    employeeId: mockEmployeeId,
    boardingHouseId: mockBoardingHouseId,
    shiftId: mockShiftId,
    workDate: new Date('2026-09-17T00:00:00Z'),
    status: ScheduleStatus.scheduled,
    shift: mockShift,
    boardingHouse: mockEmployee.employeeAssignments[0].boardingHouse,
    attendances: [
      {
        id: mockAttendanceId,
        workScheduleId: mockScheduleId,
        employeeId: mockEmployeeId,
        checkIn: null,
        checkOut: null,
        status: AttendanceStatus.not_yet,
        dutyTasks: null,
      },
    ],
  };

  beforeEach(async () => {
    prisma = {
      employee: {
        findUnique: jest.fn(),
      },
      employeeAssignment: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      workSchedule: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
      },
      shift: {
        findFirst: jest.fn(),
        create: jest.fn(),
      },
      attendance: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => {
        return cb(prisma);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('getTodayStaffAttendance', () => {
    it('should return overview with schedule, coworkers and default duties', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findFirst.mockResolvedValue(mockSchedule);
      prisma.employeeAssignment.findMany.mockResolvedValue([
        {
          employee: {
            id: 'cw-1',
            user: {
              username: 'mainguyen',
              phoneNumber: '0905566778',
              avatarUrl: null,
              userIdentification: { fullName: 'Nguyễn Thị Mai' },
            },
          },
          position: { name: 'Tạp vụ' },
        },
      ]);

      const result = await service.getTodayStaffAttendance(mockUserId);

      expect(result).toBeDefined();
      expect(result.employeeId).toBe(mockEmployeeId);
      expect(result.staffName).toBe('Phạm Văn Bảo');
      expect(result.schedule.boardingHouseName).toBe('Dormio Premier Quận 1');
      expect(result.schedule.coWorkers).toHaveLength(1);
      expect(result.schedule.coWorkers[0].name).toBe('Nguyễn Thị Mai');
      expect(result.schedule.duties.length).toBeGreaterThan(0);
      expect(result.attendance.status).toBe(AttendanceStatus.not_yet);
    });

    it('should throw NotFoundException if employee profile does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);

      await expect(service.getTodayStaffAttendance('unknown-user')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('staffCheckIn', () => {
    it('should record check-in, set on_time status and write AuditLog', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.attendance.findFirst.mockResolvedValue(mockSchedule.attendances[0]);
      prisma.attendance.update.mockResolvedValue({
        ...mockSchedule.attendances[0],
        status: AttendanceStatus.on_time,
        checkIn: new Date(),
      });
      // Mock for subsequent getTodayStaffAttendance
      prisma.workSchedule.findFirst.mockResolvedValue({
        ...mockSchedule,
        attendances: [
          {
            ...mockSchedule.attendances[0],
            status: AttendanceStatus.on_time,
            checkIn: new Date('2026-09-17T06:55:00Z'),
          },
        ],
      });
      prisma.employeeAssignment.findMany.mockResolvedValue([]);

      const result = await service.staffCheckIn(
        mockUserId,
        {
          workScheduleId: mockScheduleId,
          photo: 'data:image/jpeg;base64,photo...',
          watermark: {
            time: '2026-09-17 06:55:00',
            place: '123 Nguyễn Huệ, Quận 1',
            staffName: 'Phạm Văn Bảo',
          },
          capturedTime: '06:55',
        },
        '127.0.0.1',
      );

      expect(prisma.attendance.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: AuditLogAction.update,
            entityType: 'ATTENDANCE',
          }),
        }),
      );
      expect(result.attendance.status).toBe(AttendanceStatus.on_time);
    });

    it('should mark attendance as late when check-in is past shift start time', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.attendance.findFirst.mockResolvedValue(mockSchedule.attendances[0]);
      prisma.attendance.update.mockResolvedValue({
        ...mockSchedule.attendances[0],
        status: AttendanceStatus.late,
      });
      prisma.workSchedule.findFirst.mockResolvedValue({
        ...mockSchedule,
        attendances: [
          {
            ...mockSchedule.attendances[0],
            status: AttendanceStatus.late,
            checkIn: new Date('2026-09-17T07:15:00Z'),
          },
        ],
      });
      prisma.employeeAssignment.findMany.mockResolvedValue([]);

      const result = await service.staffCheckIn(
        mockUserId,
        {
          workScheduleId: mockScheduleId,
          capturedTime: '07:15',
          explanation: 'Kẹt xe ngã tư Hàng Xanh',
        },
        '127.0.0.1',
      );

      expect(result.attendance.status).toBe(AttendanceStatus.late);
    });

    it('should reject check-in if staff has already checked in', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.attendance.findFirst.mockResolvedValue({
        ...mockSchedule.attendances[0],
        checkIn: new Date(),
      });

      await expect(
        service.staffCheckIn(
          mockUserId,
          { workScheduleId: mockScheduleId },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('staffCheckOut', () => {
    it('should record check-out and calculate hours worked with audit log', async () => {
      const checkedInAttendance = {
        ...mockSchedule.attendances[0],
        checkIn: new Date('2026-09-17T07:00:00Z'),
        checkOut: null,
        status: AttendanceStatus.on_time,
      };

      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.attendance.findFirst.mockResolvedValue(checkedInAttendance);
      prisma.attendance.update.mockResolvedValue({
        ...checkedInAttendance,
        checkOut: new Date('2026-09-17T15:05:00Z'),
      });
      prisma.workSchedule.findFirst.mockResolvedValue({
        ...mockSchedule,
        attendances: [
          {
            ...checkedInAttendance,
            checkOut: new Date('2026-09-17T15:05:00Z'),
          },
        ],
      });
      prisma.employeeAssignment.findMany.mockResolvedValue([]);

      const result = await service.staffCheckOut(
        mockUserId,
        {
          workScheduleId: mockScheduleId,
          capturedTime: '15:05',
        },
        '127.0.0.1',
      );

      expect(prisma.attendance.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result.attendance.checkOut).toBe('15:05');
    });

    it('should throw BadRequestException if staff has not checked in yet', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.attendance.findFirst.mockResolvedValue(mockSchedule.attendances[0]); // checkIn is null

      await expect(
        service.staffCheckOut(
          mockUserId,
          { workScheduleId: mockScheduleId },
          '127.0.0.1',
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('saveStaffDutyProof', () => {
    it('should update duty proof and mark completed', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findUnique.mockResolvedValue(mockSchedule);
      prisma.attendance.findFirst.mockResolvedValue({
        ...mockSchedule.attendances[0],
        dutyTasks: [
          {
            id: 'duty-sec-1',
            title: 'Kiểm soát an ninh cổng chính',
            requiresPhoto: true,
            completed: false,
          },
        ],
      });
      prisma.workSchedule.findFirst.mockResolvedValue({
        ...mockSchedule,
        attendances: [
          {
            ...mockSchedule.attendances[0],
            dutyTasks: [
              {
                id: 'duty-sec-1',
                title: 'Kiểm soát an ninh cổng chính',
                requiresPhoto: true,
                completed: true,
                photoProof: 'data:image/jpeg;base64,...',
              },
            ],
          },
        ],
      });
      prisma.employeeAssignment.findMany.mockResolvedValue([]);

      const result = await service.saveStaffDutyProof(mockUserId, {
        workScheduleId: mockScheduleId,
        dutyId: 'duty-sec-1',
        photo: 'data:image/jpeg;base64,...',
        note: 'Đã kiểm tra xe đầy đủ',
        markCompleted: true,
      });

      expect(prisma.attendance.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalled();
      expect(result.schedule.duties[0].completed).toBe(true);
    });
  });

  describe('getStaffMonthlySummary', () => {
    it('should compute monthly attendance summary for staff', async () => {
      prisma.employee.findUnique.mockResolvedValue(mockEmployee);
      prisma.workSchedule.findMany.mockResolvedValue([
        {
          id: 'ws-1',
          workDate: new Date('2026-09-01'),
          shift: {
            id: 's-1',
            startTime: new Date('1970-01-01T07:00:00Z'),
            endTime: new Date('1970-01-01T15:00:00Z'),
          },
          attendances: [
            {
              id: 'att-1',
              status: AttendanceStatus.on_time,
              checkIn: new Date('2026-09-01T06:55:00Z'),
              checkOut: new Date('2026-09-01T15:00:00Z'),
            },
          ],
        },
        {
          id: 'ws-2',
          workDate: new Date('2026-09-02'),
          shift: {
            id: 's-1',
            startTime: new Date('1970-01-01T07:00:00Z'),
            endTime: new Date('1970-01-01T15:00:00Z'),
          },
          attendances: [
            {
              id: 'att-2',
              status: AttendanceStatus.late,
              checkIn: new Date('2026-09-02T07:15:00Z'),
              checkOut: new Date('2026-09-02T15:00:00Z'),
            },
          ],
        },
      ]);

      const summary = await service.getStaffMonthlySummary(mockUserId, '2026-09');
      expect(summary.month).toBe('2026-09');
      expect(summary.totalShifts).toBe(2);
      expect(summary.onTimeCount).toBe(1);
      expect(summary.lateCount).toBe(1);
      expect(summary.onTimeRate).toBe(50);
      expect(summary.totalHours).toBeGreaterThan(0);
    });

    it('should throw NotFoundException if employee profile does not exist', async () => {
      prisma.employee.findUnique.mockResolvedValue(null);
      await expect(
        service.getStaffMonthlySummary('unknown-user', '2026-09'),
      ).rejects.toThrow('Không tìm thấy hồ sơ nhân viên');
    });
  });
});

