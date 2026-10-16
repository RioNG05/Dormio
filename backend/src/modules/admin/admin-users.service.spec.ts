import { Test, TestingModule } from '@nestjs/testing'
import { AdminUsersService } from './admin-users.service'
import { PrismaService } from '../../common/prisma/prisma.service'
import { UserRole, UserStatus, AuditLogAction, SubscriptionPackage } from '@prisma'
import { NotFoundException, ForbiddenException } from '@nestjs/common'

describe('AdminUsersService', () => {
  let service: AdminUsersService
  let prisma: any

  const sampleUsers = [
    {
      id: 'user-uuid-1',
      username: 'nguyen.tuan',
      phoneNumber: '0912345678',
      email: 'tuan@example.com',
      avatarUrl: null,
      role: UserRole.landlord,
      status: UserStatus.active,
      mustChangePassword: false,
      createdAt: new Date('2026-01-15T08:00:00.000Z'),
      updatedAt: new Date('2026-02-01T08:00:00.000Z'),
      userIdentification: {
        fullName: 'Nguyễn Văn Tuấn',
        identityNumber: '001200001234',
        dateOfBirth: new Date('1990-05-12'),
        gender: 'male',
        cardFrontUrl: 'https://example.com/front.jpg',
        cardBackUrl: 'https://example.com/back.jpg',
        placeOfResidence: 'Hà Nội',
        placeOfOrigin: 'Hà Nội',
        issueDate: new Date('2021-01-01'),
      },
      boardingHouses: [{ id: 'house-1', name: 'Nhà Trọ Tuấn Anh' }],
      tenantContracts: [],
      posts: [{ id: 'post-1' }],
      userSubscriptions: [{ planName: 'pro' }],
      auditLogs: [{ createdAt: new Date('2026-02-01T08:00:00.000Z') }],
    },
    {
      id: 'user-uuid-2',
      username: 'tran.hoa',
      phoneNumber: '0987654321',
      email: 'hoa@example.com',
      avatarUrl: null,
      role: UserRole.tenant,
      status: UserStatus.banned,
      mustChangePassword: true,
      createdAt: new Date('2026-02-10T09:30:00.000Z'),
      updatedAt: null,
      userIdentification: null,
      boardingHouses: [],
      tenantContracts: [{ id: 'contract-1' }],
      posts: [],
      userSubscriptions: [],
      auditLogs: [],
    },
  ]

  beforeEach(async () => {
    prisma = {
      user: {
        findMany: jest.fn().mockResolvedValue(sampleUsers),
        findUnique: jest.fn(),
        count: jest.fn().mockImplementation((args?: any) => {
          if (!args?.where) return Promise.resolve(2)
          if (args.where.status === UserStatus.active) return Promise.resolve(1)
          if (args.where.status === UserStatus.banned) return Promise.resolve(1)
          if (args.where.status === UserStatus.inactive) return Promise.resolve(0)
          if (args.where.role === UserRole.landlord) return Promise.resolve(1)
          if (args.where.role === UserRole.tenant) return Promise.resolve(1)
          if (args.where.role === UserRole.employee) return Promise.resolve(0)
          return Promise.resolve(1)
        }),
        update: jest.fn(),
      },
      userSubscription: {
        findFirst: jest.fn(),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        create: jest.fn().mockImplementation((args: any) => Promise.resolve({ id: 'sub-new', ...args.data })),
      },
      auditLog: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'audit-1',
            action: AuditLogAction.login,
            entityType: 'USER',
            entityId: 'user-uuid-1',
            oldValue: null,
            newValue: { ip: '127.0.0.1' },
            ipAddress: '127.0.0.1',
            createdAt: new Date('2026-02-01T08:00:00.000Z'),
          },
        ]),
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue({ id: 'audit-new' }),
      },
      $transaction: jest.fn((callback: any) => callback(prisma)),
    }

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminUsersService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile()

    service = module.get<AdminUsersService>(AdminUsersService)
  })

  it('should be defined', () => {
    expect(service).toBeDefined()
  })

  describe('getUsers', () => {
    it('should return paginated user items and summary metrics', async () => {
      const result = await service.getUsers({ page: 1, limit: 10 })

      expect(result.items).toHaveLength(2)
      expect(result.items[0].username).toBe('nguyen.tuan')
      expect(result.items[0].isIdentityVerified).toBe(true)
      expect(result.items[0].housesCount).toBe(1)
      expect(result.items[0].subscriptionPackage).toBe('pro')
      expect(result.summary.totalUsers).toBe(2)
      expect(result.summary.activeUsers).toBe(1)
      expect(result.summary.bannedUsers).toBe(1)
    })
  })

  describe('getUserDetail', () => {
    it('should return full user detail with identification and activities', async () => {
      prisma.user.findUnique.mockResolvedValue(sampleUsers[0])

      const result = await service.getUserDetail('user-uuid-1')

      expect(result.id).toBe('user-uuid-1')
      expect(result.identification?.fullName).toBe('Nguyễn Văn Tuấn')
      expect(result.houseNames).toContain('Nhà Trọ Tuấn Anh')
      expect(result.recentActivities).toHaveLength(1)
    })

    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(service.getUserDetail('non-existent')).rejects.toThrow(NotFoundException)
    })
  })

  describe('updateUserStatus', () => {
    it('should update user status and record audit log', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...sampleUsers[0], status: UserStatus.active })
      prisma.user.update.mockResolvedValue({ ...sampleUsers[0], status: UserStatus.banned })

      const res = await service.updateUserStatus(
        'user-uuid-1',
        { status: UserStatus.banned, reason: 'Violation' },
        'admin-id',
      )

      expect(res.success).toBe(true)
      expect(res.status).toBe(UserStatus.banned)
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('updateUserRole', () => {
    it('should update user role and record audit log', async () => {
      prisma.user.findUnique.mockResolvedValue({ ...sampleUsers[1], role: UserRole.tenant })
      prisma.user.update.mockResolvedValue({ ...sampleUsers[1], role: UserRole.landlord })

      const res = await service.updateUserRole(
        'user-uuid-2',
        { role: UserRole.landlord, reason: 'Promoted' },
        'admin-id',
      )

      expect(res.success).toBe(true)
      expect(res.role).toBe(UserRole.landlord)
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('resetUserPassword', () => {
    it('should reset user password and flag mustChangePassword', async () => {
      prisma.user.findUnique.mockResolvedValue(sampleUsers[0])
      prisma.user.update.mockResolvedValue(sampleUsers[0])

      const res = await service.resetUserPassword('user-uuid-1', { mustChangePassword: true }, 'admin-id')

      expect(res.success).toBe(true)
      expect(res.mustChangePassword).toBe(true)
      expect(prisma.user.update).toHaveBeenCalled()
      expect(prisma.auditLog.create).toHaveBeenCalled()
    })
  })

  describe('updateUserTier', () => {
    it('should upgrade user tier to pro, cancel active subscriptions, and record audit log', async () => {
      prisma.user.findUnique.mockResolvedValue(sampleUsers[0])
      prisma.userSubscription.findFirst.mockResolvedValue({ id: 'old-sub', planName: SubscriptionPackage.plus })

      const res = await service.updateUserTier(
        'user-uuid-1',
        { tier: SubscriptionPackage.pro, durationMonths: 3, reason: 'Promotional grant' },
        'admin-id',
      )

      expect(res.success).toBe(true)
      expect(res.tier).toBe(SubscriptionPackage.pro)
      expect(prisma.userSubscription.updateMany).toHaveBeenCalled()
      expect(prisma.userSubscription.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            userId: 'user-uuid-1',
            planName: SubscriptionPackage.pro,
            billingCycle: 'quarterly',
            status: 'active',
          }),
        }),
      )
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'USER_SUBSCRIPTION',
            action: AuditLogAction.update,
          }),
        }),
      )
    })

    it('should set user tier to free by canceling active subscriptions without creating a paid sub', async () => {
      prisma.user.findUnique.mockResolvedValue(sampleUsers[0])
      prisma.userSubscription.findFirst.mockResolvedValue({ id: 'old-sub', planName: SubscriptionPackage.pro })

      const res = await service.updateUserTier(
        'user-uuid-1',
        { tier: SubscriptionPackage.free, reason: 'Revert to free' },
        'admin-id',
      )

      expect(res.success).toBe(true)
      expect(res.tier).toBe(SubscriptionPackage.free)
      expect(prisma.userSubscription.updateMany).toHaveBeenCalled()
      expect(prisma.userSubscription.create).not.toHaveBeenCalled()
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            entityType: 'USER_SUBSCRIPTION',
            newValue: expect.objectContaining({
              tier: SubscriptionPackage.free,
            }),
          }),
        }),
      )
    })

    it('should throw NotFoundException if user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null)

      await expect(
        service.updateUserTier('non-existent', { tier: SubscriptionPackage.pro }),
      ).rejects.toThrow(NotFoundException)
    })
  })

  describe('Root System Admin Protection', () => {
    const rootAdminUser = {
      id: 'root-admin-id',
      username: 'Nguyễn Quang Huy',
      phoneNumber: '0344265925',
      email: 'ngquanghuy.work@gmail.com',
      role: UserRole.admin,
      status: UserStatus.active,
    }

    it('should prevent other admins from updating status of root admin', async () => {
      prisma.user.findUnique.mockResolvedValue(rootAdminUser)

      await expect(
        service.updateUserStatus('root-admin-id', { status: UserStatus.banned }, 'other-admin-id'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should prevent other admins from updating role of root admin', async () => {
      prisma.user.findUnique.mockResolvedValue(rootAdminUser)

      await expect(
        service.updateUserRole('root-admin-id', { role: UserRole.landlord }, 'other-admin-id'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should prevent other admins from resetting password of root admin', async () => {
      prisma.user.findUnique.mockResolvedValue(rootAdminUser)

      await expect(
        service.resetUserPassword('root-admin-id', {}, 'other-admin-id'),
      ).rejects.toThrow(ForbiddenException)
    })

    it('should prevent other admins from updating tier of root admin', async () => {
      prisma.user.findUnique.mockResolvedValue(rootAdminUser)

      await expect(
        service.updateUserTier('root-admin-id', { tier: SubscriptionPackage.free }, 'other-admin-id'),
      ).rejects.toThrow(ForbiddenException)
    })
  })
})



