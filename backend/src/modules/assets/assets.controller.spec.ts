import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { SubscriptionPackage, AssetCondition } from '@prisma';
import { AssetsController } from './assets.controller';
import { AssetsService } from './assets.service';
import { REQUIRE_TIER_KEY } from '../../common/decorators/require-tier.decorator';

describe('AssetsController Tier Guard & Endpoints', () => {
  let controller: AssetsController;
  let service: jest.Mocked<Partial<AssetsService>>;
  const reflector = new Reflector();

  const mockUser: any = {
    id: 'user-landlord-1',
    role: 'landlord',
  };

  const mockBoardingHouseId = 'house-uuid-1';

  beforeEach(async () => {
    service = {
      createAsset: jest.fn(),
      getAssets: jest.fn(),
      getAssetDetail: jest.fn(),
      updateAsset: jest.fn(),
      deleteAsset: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AssetsController],
      providers: [
        {
          provide: AssetsService,
          useValue: service,
        },
      ],
    }).compile();

    controller = module.get<AssetsController>(AssetsController);
  });

  describe('Tier Metadata Checks', () => {
    it('should have RequireTier(SubscriptionPackage.plus) on the controller class', () => {
      const classTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        AssetsController,
      );
      expect(classTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on createAsset method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.createAsset,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on getAssets method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.getAssets,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on getAssetDetail method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.getAssetDetail,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on updateAsset method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.updateAsset,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });

    it('should have RequireTier(SubscriptionPackage.plus) on deleteAsset method', () => {
      const methodTier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.deleteAsset,
      );
      expect(methodTier).toBe(SubscriptionPackage.plus);
    });
  });

  describe('Endpoint Invocations', () => {
    it('createAsset delegates to service.createAsset', async () => {
      const dto: any = {
        name: 'Máy giặt Panasonic',
        location: 'Khu giặt tầng 1',
        condition: AssetCondition.good,
        quantity: 1,
      };
      const mockResult: any = { id: 'asset-1', ...dto };
      (service.createAsset as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.createAsset(mockBoardingHouseId, dto, mockUser);
      expect(service.createAsset).toHaveBeenCalledWith(
        mockUser.id,
        mockBoardingHouseId,
        dto,
      );
      expect(result).toEqual({ success: true, data: mockResult });
    });

    it('getAssets delegates to service.getAssets', async () => {
      const query: any = { page: 1, limit: 10 };
      const mockResult: any = { data: [], summary: {} };
      (service.getAssets as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getAssets(mockBoardingHouseId, query, mockUser);
      expect(service.getAssets).toHaveBeenCalledWith(mockBoardingHouseId, query);
      expect(result).toEqual(mockResult);
    });

    it('getAssetDetail delegates to service.getAssetDetail', async () => {
      const mockResult: any = { id: 'asset-1', name: 'Tủ lạnh' };
      (service.getAssetDetail as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.getAssetDetail(mockBoardingHouseId, 'asset-1', mockUser);
      expect(service.getAssetDetail).toHaveBeenCalledWith(mockBoardingHouseId, 'asset-1');
      expect(result).toEqual({ success: true, data: mockResult });
    });

    it('updateAsset delegates to service.updateAsset', async () => {
      const dto: any = { name: 'Tủ lạnh Toshiba 180L' };
      const mockResult: any = { id: 'asset-1', ...dto };
      (service.updateAsset as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.updateAsset(mockBoardingHouseId, 'asset-1', dto, mockUser);
      expect(service.updateAsset).toHaveBeenCalledWith(
        mockBoardingHouseId,
        'asset-1',
        dto,
        mockUser.id,
      );
      expect(result).toEqual({ success: true, data: mockResult });
    });

    it('deleteAsset delegates to service.deleteAsset', async () => {
      const mockResult = { success: true, message: 'Đã xóa tài sản thành công.' };
      (service.deleteAsset as jest.Mock).mockResolvedValue(mockResult);

      const result = await controller.deleteAsset(mockBoardingHouseId, 'asset-1', mockUser);
      expect(service.deleteAsset).toHaveBeenCalledWith(
        mockBoardingHouseId,
        'asset-1',
        mockUser.id,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
