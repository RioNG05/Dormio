import { Test, TestingModule } from '@nestjs/testing';
import { StaffSchedulesController } from './staff-schedules.controller';
import { SchedulesService } from './schedules.service';

describe('StaffSchedulesController', () => {
  let controller: StaffSchedulesController;
  let service: any;

  const mockUser = {
    id: 'user-staff-123',
    role: 'employee' as any,
  };

  const mockBoardingHouses = [
    {
      id: 'house-1',
      name: 'KTX HOLA (Khu A)',
      address: 'Thạch Thất, Hà Nội',
    },
    {
      id: 'house-2',
      name: 'Dormio Campus Cầu Giấy',
      address: 'Cầu Giấy, Hà Nội',
    },
  ];

  const mockSchedules = [
    {
      id: 'sched-1',
      workDate: '2026-09-17',
      boardingHouseId: 'house-1',
      boardingHouseName: 'KTX HOLA (Khu A)',
      shift: {
        id: 'shift-1',
        name: 'Ca Sáng (07:00 - 15:00)',
        startTime: '07:00',
        endTime: '15:00',
      },
      position: {
        id: 'pos-1',
        name: 'Bảo vệ & Vận hành sảnh',
        description: 'Kiểm tra an ninh và kiểm soát xe ra vào.',
      },
      isRecurring: true,
      status: 'scheduled',
      coWorkers: [
        {
          id: 'emp-2',
          name: 'Trần Văn Cảnh',
          phone: '0987654321',
          positionName: 'Bảo vệ ca sáng',
          avatar: null,
        },
      ],
      duties: [
        {
          id: 'duty-1',
          title: 'Kiểm tra chốt an ninh cổng chính',
          requiresPhoto: true,
          completed: false,
          completedAt: null,
          photoProof: null,
          photoProofTime: null,
          note: null,
        },
      ],
      additionalTasks: [],
    },
  ];

  beforeEach(async () => {
    service = {
      getStaffBoardingHouses: jest.fn().mockResolvedValue(mockBoardingHouses),
      getStaffSchedules: jest.fn().mockResolvedValue(mockSchedules),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [StaffSchedulesController],
      providers: [
        {
          provide: SchedulesService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<StaffSchedulesController>(StaffSchedulesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getBoardingHouses', () => {
    it('should return list of active assigned boarding houses for staff', async () => {
      const result = await controller.getBoardingHouses(mockUser);
      expect(result).toEqual(mockBoardingHouses);
      expect(service.getStaffBoardingHouses).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getBoardingHousesAlias', () => {
    it('should return boarding houses via alias route', async () => {
      const result = await controller.getBoardingHousesAlias(mockUser);
      expect(result).toEqual(mockBoardingHouses);
      expect(service.getStaffBoardingHouses).toHaveBeenCalledWith(mockUser.id);
    });
  });

  describe('getSchedules', () => {
    it('should return list of schedules for staff within requested range', async () => {
      const query = {
        startDate: '2026-09-14',
        endDate: '2026-09-20',
        boardingHouseId: 'house-1',
      };
      const result = await controller.getSchedules(mockUser, query);
      expect(result).toEqual(mockSchedules);
      expect(service.getStaffSchedules).toHaveBeenCalledWith(mockUser.id, query);
    });
  });
});

