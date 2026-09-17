import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceStatus } from '@prisma';
import { StaffAttendanceController } from './staff-attendance.controller';
import { AttendanceService } from './attendance.service';

describe('StaffAttendanceController', () => {
  let controller: StaffAttendanceController;
  let service: any;

  const mockUser = {
    id: 'user-123',
    role: 'employee' as any,
  };

  const mockOverviewResponse = {
    employeeId: 'emp-123',
    staffName: 'Phạm Văn Bảo',
    staffPhone: '0901122334',
    staffAvatar: null,
    schedule: {
      id: 'ws-123',
      workDate: '2026-09-17',
      boardingHouseId: 'house-123',
      boardingHouseName: 'Dormio Premier Quận 1',
      boardingHouseAddress: '123 Nguyễn Huệ, Quận 1',
      shift: {
        id: 'shift-1',
        name: 'Ca Sáng',
        startTime: '07:00',
        endTime: '15:00',
        durationHours: 8,
      },
      position: {
        id: 'pos-1',
        name: 'Bảo vệ',
        description: null,
      },
      status: 'scheduled',
      isRecurring: true,
      coWorkers: [],
      duties: [],
    },
    attendance: {
      id: 'att-123',
      workScheduleId: 'ws-123',
      workDate: '2026-09-17',
      boardingHouseName: 'Dormio Premier Quận 1',
      shiftName: 'Ca Sáng',
      shiftTime: '07:00 - 15:00',
      checkIn: null,
      checkOut: null,
      status: AttendanceStatus.not_yet,
      totalHours: 0,
      editedByLandlord: false,
    },
  };

  beforeEach(async () => {
    service = {
      getTodayStaffAttendance: jest.fn().mockResolvedValue(mockOverviewResponse),
      staffCheckIn: jest.fn().mockResolvedValue(mockOverviewResponse),
      staffCheckOut: jest.fn().mockResolvedValue(mockOverviewResponse),
      saveStaffDutyProof: jest.fn().mockResolvedValue(mockOverviewResponse),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffAttendanceController],
      providers: [
        {
          provide: AttendanceService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<StaffAttendanceController>(StaffAttendanceController);
  });

  it('should get today overview', async () => {
    const res = await controller.getTodayOverview(mockUser);
    expect(service.getTodayStaffAttendance).toHaveBeenCalledWith('user-123');
    expect(res).toEqual(mockOverviewResponse);
  });

  it('should delegate checkIn to service', async () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const dto = {
      workScheduleId: 'ws-123',
      capturedTime: '06:55',
    };

    const res = await controller.checkIn(mockUser, dto, req);
    expect(service.staffCheckIn).toHaveBeenCalledWith('user-123', dto, '127.0.0.1');
    expect(res).toEqual(mockOverviewResponse);
  });

  it('should delegate checkOut to service', async () => {
    const req = {
      headers: {},
      socket: { remoteAddress: '127.0.0.1' },
    } as any;

    const dto = {
      workScheduleId: 'ws-123',
      capturedTime: '15:05',
    };

    const res = await controller.checkOut(mockUser, dto, req);
    expect(service.staffCheckOut).toHaveBeenCalledWith('user-123', dto, '127.0.0.1');
    expect(res).toEqual(mockOverviewResponse);
  });

  it('should delegate saveDutyProof to service', async () => {
    const dto = {
      workScheduleId: 'ws-123',
      dutyId: 'duty-1',
      markCompleted: true,
    };

    const res = await controller.saveDutyProof(mockUser, dto);
    expect(service.saveStaffDutyProof).toHaveBeenCalledWith('user-123', dto);
    expect(res).toEqual(mockOverviewResponse);
  });
});

