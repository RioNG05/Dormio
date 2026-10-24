import { Test, TestingModule } from '@nestjs/testing'
import { TenantsController } from './tenants.controller'
import { TenantsService } from './tenants.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { PropertyOwnershipGuard } from '../../common/guards/property-ownership.guard'

describe('TenantsController', () => {
  let controller: TenantsController
  let service: jest.Mocked<Partial<TenantsService>>

  const mockUser: any = {
    id: 'user-uuid-1',
    role: 'leasing_agent', // Verifies landlord who owns property can have leasing_agent or landlord role
  }

  const mockBoardingHouseId = 'house-uuid-1'

  beforeEach(async () => {
    service = {
      searchUser: jest.fn(),
      quickAddTenant: jest.fn(),
      getRoomOccupants: jest.fn(),
      getLandlordTenants: jest.fn(),
      checkoutOccupant: jest.fn(),
    }

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TenantsController],
      providers: [
        {
          provide: PrismaService,
          useValue: {},
        },
        {
          provide: TenantsService,
          useValue: service,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PropertyOwnershipGuard)
      .useValue({ canActivate: () => true })
      .compile()

    controller = module.get<TenantsController>(TenantsController)
  })

  it('should be defined', () => {
    expect(controller).toBeDefined()
  })

  it('quickAddTenant delegates to service.quickAddTenant with user.id and boardingHouseId', async () => {
    const dto: any = {
      phoneNumber: '0912345678',
      fullName: 'Nguyen Van A',
      roomId: 'room-1',
    }
    const mockResult: any = { id: 'occ-1', fullName: 'Nguyen Van A' }
    ;(service.quickAddTenant as jest.Mock).mockResolvedValue(mockResult)

    const res = await controller.quickAddTenant(dto, mockUser, mockBoardingHouseId)
    expect(service.quickAddTenant).toHaveBeenCalledWith(dto, mockUser.id, mockBoardingHouseId)
    expect(res).toEqual(mockResult)
  })

  it('searchUser delegates to service.searchUser', async () => {
    const query = { phone: '0912345678' }
    const mockResult: any = { found: true, inBuilding: false }
    ;(service.searchUser as jest.Mock).mockResolvedValue(mockResult)

    const res = await controller.searchUser(query, mockBoardingHouseId)
    expect(service.searchUser).toHaveBeenCalledWith('0912345678', mockBoardingHouseId)
    expect(res).toEqual(mockResult)
  })

  it('getRoomOccupants delegates to service.getRoomOccupants', async () => {
    const mockOccupants: any = [{ id: 'occ-1' }]
    ;(service.getRoomOccupants as jest.Mock).mockResolvedValue(mockOccupants)

    const res = await controller.getRoomOccupants('room-1', mockBoardingHouseId)
    expect(service.getRoomOccupants).toHaveBeenCalledWith('room-1', mockBoardingHouseId)
    expect(res).toEqual(mockOccupants)
  })

  it('getLandlordTenants delegates to service.getLandlordTenants', async () => {
    const query = { page: 1, limit: 10 }
    const mockList: any = { items: [], total: 0 }
    ;(service.getLandlordTenants as jest.Mock).mockResolvedValue(mockList)

    const res = await controller.getLandlordTenants(query, mockBoardingHouseId)
    expect(service.getLandlordTenants).toHaveBeenCalledWith(mockBoardingHouseId, query)
    expect(res).toEqual(mockList)
  })

  it('checkoutOccupant delegates to service.checkoutOccupant', async () => {
    const mockResult: any = { success: true }
    ;(service.checkoutOccupant as jest.Mock).mockResolvedValue(mockResult)

    const res = await controller.checkoutOccupant('occ-1', mockUser, mockBoardingHouseId)
    expect(service.checkoutOccupant).toHaveBeenCalledWith('occ-1', mockUser.id, mockBoardingHouseId)
    expect(res).toEqual(mockResult)
  })
})

