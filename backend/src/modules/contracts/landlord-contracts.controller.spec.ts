import { Test, TestingModule } from '@nestjs/testing'
import { Reflector } from '@nestjs/core'
import { SubscriptionPackage } from '@prisma'
import { REQUIRE_TIER_KEY } from '../../common/decorators/require-tier.decorator'
import { LandlordContractsController } from './landlord-contracts.controller'
import { ContractsService } from './contracts.service'
import { PrismaService } from '../../common/prisma/prisma.service'

describe('LandlordContractsController - Tier Guards', () => {
  let controller: LandlordContractsController
  let reflector: Reflector

  beforeEach(async () => {
    reflector = new Reflector()
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LandlordContractsController],
      providers: [
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: ContractsService,
          useValue: {
            getPendingPlatformDeposit: jest.fn(),
            createContractPlatform: jest.fn(),
            createContractDirect: jest.fn(),
            getContracts: jest.fn(),
            getContractById: jest.fn(),
            exportContract: jest.fn(),
            getContractPrintHtml: jest.fn(),
            getContractDocuments: jest.fn(),
            getContractDocumentDownload: jest.fn(),
            updateContract: jest.fn(),
          },
        },
      ],
    }).compile()

    controller = module.get<LandlordContractsController>(LandlordContractsController)
  })

  describe('Tier Metadata Checks (UC-L-15: Export Contracts)', () => {
    it('should have RequireTier(SubscriptionPackage.plus) on exportContract method', () => {
      const tier = reflector.get<SubscriptionPackage>(REQUIRE_TIER_KEY, controller.exportContract)
      expect(tier).toBe(SubscriptionPackage.plus)
    })

    it('should have RequireTier(SubscriptionPackage.plus) on printContract method', () => {
      const tier = reflector.get<SubscriptionPackage>(REQUIRE_TIER_KEY, controller.printContract)
      expect(tier).toBe(SubscriptionPackage.plus)
    })

    it('should have RequireTier(SubscriptionPackage.plus) on getContractDocuments method', () => {
      const tier = reflector.get<SubscriptionPackage>(REQUIRE_TIER_KEY, controller.getContractDocuments)
      expect(tier).toBe(SubscriptionPackage.plus)
    })

    it('should have RequireTier(SubscriptionPackage.plus) on downloadContractDocument method', () => {
      const tier = reflector.get<SubscriptionPackage>(
        REQUIRE_TIER_KEY,
        controller.downloadContractDocument,
      )
      expect(tier).toBe(SubscriptionPackage.plus)
    })
  })

  describe('updateContract', () => {
    it('should delegate to contractsService.updateContract', async () => {
      const mockResult = { id: 'c-1', rentPrice: 4000000 }
      const contractsService = (controller as any).contractsService
      contractsService.updateContract.mockResolvedValue(mockResult)

      const result = await controller.updateContract(
        'bh-1',
        'c-1',
        { rentPrice: 4000000, reason: 'Tăng giá thuê' },
        { id: 'landlord-1', role: 'landlord' } as any,
        '127.0.0.1',
      )

      expect(contractsService.updateContract).toHaveBeenCalledWith(
        'landlord-1',
        'bh-1',
        'c-1',
        { rentPrice: 4000000, reason: 'Tăng giá thuê' },
        '127.0.0.1',
      )
      expect(result).toEqual({ success: true, data: mockResult })
    })
  })
})
