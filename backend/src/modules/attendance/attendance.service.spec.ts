import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceStatus, AuditLogAction, ScheduleStatus } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AttendanceService } from './attendance.service';

describe('AttendanceService (UC-L-22)', () => {
  let service: AttendanceService;
  let prisma: any;

  const mockBoardingHouseId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '22222222-2222-2222-2222-222222222222';
  const mockEmployeeId = '33333333-3333-3333-3333-333333333333';
  const mockScheduleId = '44444444-4444-4444-4444-444444444444';
  const mockAttendanceId = '55555555-5555-5555-5555-555555555555';
  const mockShiftId = '66666666-6666-6666-6666-666666666666';

  beforeEach(async () => {
    prisma = {
      workSchedule: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
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

  describe('getAttendance', () => {
    it('should query work schedules left-joined with attendances and compute metrics', async () => {
      const mockScheduleRange = [
        {
          id: 's-1',
          attendances: [{ status: AttendanceStatus.on_time }],
        },
        {
          id: 's-2',
          attendances: [{ status: AttendanceStatus.late }],
        },
        {
          id: 's-3',
          attendances: [{ status: AttendanceStatus.absent }],
        },
        {
          id: 's-4',
          attendances: [], // not_yet
        },
      ];

      prisma.workSchedule.findMany
        .mockResolvedValueOnce(mockScheduleRange) // all in range for summary
        .mockResolvedValueOnce([
          {
            id: 's-1',
            boardingHouseId: mockBoardingHouseId,
            employeeId: mockEmployeeId,
            shiftId: mockShiftId,
            workDate: new Date('2026-09-12T00:00:00Z'),
            status: ScheduleStatus.scheduled,
            shift: {
              name: 'Ca sáng',
              startTime: new Date('1970-01-01T06:00:00Z'),
              endTime: new Date('1970-01-01T14:00:00Z'),
            },
            employee: {
              user: {
                username: 'staff1',
                phoneNumber: '0901234567',
                avatarUrl: null,
                userIdentification: { fullName: 'Nguyễn Văn Bảo' },
              },
              employeeAssignments: [{ position: { name: 'Bảo vệ' } }],
            },
            attendances: [
              {
                id: mockAttendanceId,
                status: AttendanceStatus.on_time,
                checkIn: new Date('2026-09-12T05:55:00Z'),
                checkOut: new Date('2026-09-12T14:02:00Z'),
                editedBy: null,
                editedByUser: null,
                updatedAt: new Date(),
              },
            ],
          },
        ]);
      prisma.workSchedule.count.mockResolvedValueOnce(1);

      const result = await service.getAttendance(mockBoardingHouseId, {
        startDate: '2026-09-01',
        endDate: '2026-09-30',
      });

      expect(result.summary.totalShifts).toBe(4);
      expect(result.summary.onTimeCount).toBe(1);
      expect(result.summary.lateCount).toBe(1);
      expect(result.summary.absentCount).toBe(1);
      expect(result.summary.notYetCount).toBe(1);
      // Evaluated count = 3 (1 on_time + 1 late / 3 = 66.7%)
      expect(result.summary.attendanceRate).toBe(66.7);
      expect(result.data).toHaveLength(1);
      expect(result.data[0].employeeName).toBe('Nguyễn Văn Bảo');
      expect(result.data[0].attendanceStatus).toBe(AttendanceStatus.on_time);
    });
  });

  describe('overrideAttendance', () => {
    it('should throw NotFoundException if work schedule is not found', async () => {
      prisma.workSchedule.findFirst.mockResolvedValueOnce(null);

      await expect(
        service.overrideAttendance(mockBoardingHouseId, mockUserId, {
          workScheduleId: mockScheduleId,
          status: AttendanceStatus.on_time,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create a new Attendance row and an AuditLog if attendance does not exist yet', async () => {
      prisma.workSchedule.findFirst.mockResolvedValueOnce({
        id: mockScheduleId,
        boardingHouseId: mockBoardingHouseId,
        employeeId: mockEmployeeId,
        shiftId: mockShiftId,
        workDate: new Date('2026-09-12T00:00:00Z'),
        status: ScheduleStatus.scheduled,
        shift: {
          name: 'Ca sáng',
          startTime: new Date('1970-01-01T06:00:00Z'),
          endTime: new Date('1970-01-01T14:00:00Z'),
        },
        employee: {
          user: {
            username: 'staff1',
            phoneNumber: '0901234567',
            avatarUrl: null,
            userIdentification: { fullName: 'Nguyễn Văn Bảo' },
          },
          employeeAssignments: [{ position: { name: 'Bảo vệ' } }],
        },
      });

      prisma.attendance.findFirst.mockResolvedValueOnce(null); // No existing attendance

      prisma.attendance.create.mockResolvedValueOnce({
        id: mockAttendanceId,
        workScheduleId: mockScheduleId,
        employeeId: mockEmployeeId,
        status: AttendanceStatus.on_time,
        checkIn: new Date('2026-09-12T06:00:00Z'),
        checkOut: new Date('2026-09-12T14:00:00Z'),
        editedBy: mockUserId,
        updatedAt: new Date(),
        editedByUser: {
          username: 'landlord_user',
          userIdentification: { fullName: 'Chủ nhà trọ' },
        },
      });

      const result = await service.overrideAttendance(
        mockBoardingHouseId,
        mockUserId,
        {
          workScheduleId: mockScheduleId,
          status: AttendanceStatus.on_time,
          checkIn: '2026-09-12T06:00:00.000Z',
          checkOut: '2026-09-12T14:00:00.000Z',
          note: 'Xác nhận đi đúng giờ qua camera',
        },
      );

      expect(prisma.attendance.create).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          boardingHouseId: mockBoardingHouseId,
          action: AuditLogAction.create,
          entityType: 'ATTENDANCE',
          entityId: mockAttendanceId,
        }),
      });
      expect(result.attendanceStatus).toBe(AttendanceStatus.on_time);
      expect(result.editedByName).toBe('Chủ nhà trọ');
    });

    it('should update existing Attendance row and create AuditLog if attendance already exists', async () => {
      prisma.workSchedule.findFirst.mockResolvedValueOnce({
        id: mockScheduleId,
        boardingHouseId: mockBoardingHouseId,
        employeeId: mockEmployeeId,
        shiftId: mockShiftId,
        workDate: new Date('2026-09-12T00:00:00Z'),
        status: ScheduleStatus.scheduled,
        shift: {
          name: 'Ca sáng',
          startTime: new Date('1970-01-01T06:00:00Z'),
          endTime: new Date('1970-01-01T14:00:00Z'),
        },
        employee: {
          user: {
            username: 'staff1',
            phoneNumber: '0901234567',
            avatarUrl: null,
            userIdentification: { fullName: 'Nguyễn Văn Bảo' },
          },
          employeeAssignments: [{ position: { name: 'Bảo vệ' } }],
        },
      });

      prisma.attendance.findFirst.mockResolvedValueOnce({
        id: mockAttendanceId,
        workScheduleId: mockScheduleId,
        status: AttendanceStatus.late,
        checkIn: new Date('2026-09-12T06:20:00Z'),
        checkOut: null,
        editedBy: null,
      });

      prisma.attendance.update.mockResolvedValueOnce({
        id: mockAttendanceId,
        workScheduleId: mockScheduleId,
        employeeId: mockEmployeeId,
        status: AttendanceStatus.on_time,
        checkIn: new Date('2026-09-12T06:00:00Z'),
        checkOut: new Date('2026-09-12T14:00:00Z'),
        editedBy: mockUserId,
        updatedAt: new Date(),
        editedByUser: {
          username: 'landlord_user',
          userIdentification: { fullName: 'Chủ nhà trọ' },
        },
      });

      const result = await service.overrideAttendance(
        mockBoardingHouseId,
        mockUserId,
        {
          workScheduleId: mockScheduleId,
          status: AttendanceStatus.on_time,
          note: 'Đính chính do máy chấm công lỗi 20 phút',
        },
      );

      expect(prisma.attendance.update).toHaveBeenCalled();
      expect(prisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: mockUserId,
          boardingHouseId: mockBoardingHouseId,
          action: AuditLogAction.update,
          entityType: 'ATTENDANCE',
          entityId: mockAttendanceId,
          oldValue: expect.objectContaining({
            status: AttendanceStatus.late,
          }),
          newValue: expect.objectContaining({
            status: AttendanceStatus.on_time,
          }),
        }),
      });
      expect(result.attendanceStatus).toBe(AttendanceStatus.on_time);
    });
  });
});
