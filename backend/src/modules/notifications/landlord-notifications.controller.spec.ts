import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { SubscriptionPackage } from '@prisma';
import { REQUIRE_TIER_KEY } from '../../common/decorators/require-tier.decorator';
import { LandlordNotificationsController } from './landlord-notifications.controller';
import { NotificationsService } from './notifications.service';
import { BroadcastAnnouncementDto } from './dto/broadcast-announcement.dto';
import { AnnouncementQueryDto } from './dto/announcement-query.dto';

describe('LandlordNotificationsController', () => {
  let controller: LandlordNotificationsController;
  let service: jest.Mocked<Partial<NotificationsService>>;
  let reflector: Reflector;

  beforeEach(async () => {
    reflector = new Reflector();
    service = {
      broadcastAnnouncement: jest.fn(),
      getBoardingHouseAnnouncements: jest.fn(),
      deleteAnnouncement: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandlordNotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<LandlordNotificationsController>(
      LandlordNotificationsController,
    );
  });

  describe('Tier Metadata Checks', () => {
    it('should have RequireTier(SubscriptionPackage.plus) on the controller class', () => {
      const classTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        LandlordNotificationsController,
      );
      expect(classTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on broadcast method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.broadcast,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on getAnnouncements method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.getAnnouncements,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on deleteAnnouncement method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.deleteAnnouncement,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });
  });

  describe('Endpoint Invocations', () => {
    const mockUser: any = { id: 'landlord-1', role: 'landlord' };
    const houseId = 'house-1';

    it('broadcast delegates to service.broadcastAnnouncement', async () => {
      const dto: BroadcastAnnouncementDto = {
        title: 'Bảo trì nước',
        content: 'Cắt nước 2 giờ chiều nay',
        category: 'Điện nước',
        targetScope: 'Toàn bộ tòa nhà',
        channel: 'Thông báo hệ thống',
      };
      const mockResult: any = { id: 'notif-1', ...dto };
      (service.broadcastAnnouncement as jest.Mock).mockResolvedValue(mockResult);

      const res = await controller.broadcast(houseId, mockUser, dto);

      expect(service.broadcastAnnouncement).toHaveBeenCalledWith(
        houseId,
        mockUser.id,
        dto,
      );
      expect(res).toEqual({ success: true, data: mockResult });
    });

    it('getAnnouncements delegates to service.getBoardingHouseAnnouncements', async () => {
      const query: AnnouncementQueryDto = { page: 1, limit: 10 };
      const mockResult: any = {
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 1 },
        summary: { totalAnnouncements: 0, totalTargetTenants: 0, emergencyCount: 0 },
      };
      (service.getBoardingHouseAnnouncements as jest.Mock).mockResolvedValue(mockResult);

      const res = await controller.getAnnouncements(houseId, mockUser, query);

      expect(service.getBoardingHouseAnnouncements).toHaveBeenCalledWith(
        houseId,
        query,
      );
      expect(res).toEqual(mockResult);
    });

    it('deleteAnnouncement delegates to service.deleteAnnouncement', async () => {
      (service.deleteAnnouncement as jest.Mock).mockResolvedValue(undefined);

      await controller.deleteAnnouncement(houseId, mockUser, 'notif-1');

      expect(service.deleteAnnouncement).toHaveBeenCalledWith(
        houseId,
        'notif-1',
      );
    });
  });
});
