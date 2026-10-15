import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AdminUsersFilterDto } from './dto/admin-users-filter.dto'
import {
  AdminUserItemDto,
  AdminUserDetailDto,
  AdminUsersListResponseDto,
  AdminUserActivitiesResponseDto,
  AdminUserActivityDto,
} from './dto/admin-users-response.dto'
import {
  UpdateUserStatusDto,
  UpdateUserRoleDto,
  ResetUserPasswordDto,
} from './dto/admin-user-action.dto'
import { AuditLogAction, Prisma, UserRole, UserStatus } from '@prisma'
import * as bcrypt from 'bcrypt'

const BCRYPT_ROUNDS = 10
const DEFAULT_TEMP_PASS = 'Dormio@2026'

@Injectable()
export class AdminUsersService {
  private readonly logger = new Logger(AdminUsersService.name)

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Fetch paginated list of users for administration with multi-value filtering.
   */
  async getUsers(filter: AdminUsersFilterDto): Promise<AdminUsersListResponseDto> {
    this.logger.log(
      `getUsers called with filters: query="${filter.query || ''}", role="${filter.role || ''}", status="${filter.status || ''}", joinedFrom="${filter.joinedFrom || ''}", joinedTo="${filter.joinedTo || ''}", page=${filter.page || 1}, limit=${filter.limit || 10}`,
    )

    const page = Math.max(1, Number(filter.page) || 1)
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 10))
    const skip = (page - 1) * limit

    const where: Prisma.UserWhereInput = {}

    // Query across username, phone, email, full legal name
    if (filter.query && filter.query.trim().length > 0) {
      const q = filter.query.trim()
      where.OR = [
        { username: { contains: q, mode: 'insensitive' } },
        { phoneNumber: { contains: q } },
        { email: { contains: q, mode: 'insensitive' } },
        {
          userIdentification: {
            fullName: { contains: q, mode: 'insensitive' },
          },
        },
        {
          userIdentification: {
            identityNumber: { contains: q },
          },
        },
      ]
    }

    if (filter.role) {
      where.role = filter.role
    }

    if (filter.status) {
      where.status = filter.status
    }

    if (filter.joinedFrom || filter.joinedTo) {
      where.createdAt = {}
      if (filter.joinedFrom) {
        where.createdAt.gte = new Date(filter.joinedFrom)
      }
      if (filter.joinedTo) {
        where.createdAt.lte = new Date(filter.joinedTo)
      }
    }

    // Determine sort field and order
    const sortBy = filter.sortBy || 'createdAt'
    const sortOrder = filter.sortOrder || 'desc'
    const orderBy: Prisma.UserOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    }

    // Concurrent fetch: data + filtered count + global summary
    const [users, total, totalUsers, activeUsers, bannedUsers, inactiveUsers, landlordsCount, tenantsCount, employeesCount] =
      await Promise.all([
        this.prisma.user.findMany({
          where,
          skip,
          take: limit,
          orderBy,
          include: {
            userIdentification: {
              select: {
                fullName: true,
                identityNumber: true,
              },
            },
            boardingHouses: {
              select: { id: true },
            },
            tenantContracts: {
              select: { id: true },
            },
            posts: {
              select: { id: true },
            },
            userSubscriptions: {
              where: { status: 'active' },
              select: { planName: true },
              take: 1,
            },
            auditLogs: {
              take: 1,
              orderBy: { createdAt: 'desc' },
              select: { createdAt: true },
            },
          },
        }),
        this.prisma.user.count({ where }),
        this.prisma.user.count(),
        this.prisma.user.count({ where: { status: UserStatus.active } }),
        this.prisma.user.count({ where: { status: UserStatus.banned } }),
        this.prisma.user.count({ where: { status: UserStatus.inactive } }),
        this.prisma.user.count({ where: { role: UserRole.landlord } }),
        this.prisma.user.count({ where: { role: UserRole.tenant } }),
        this.prisma.user.count({ where: { role: UserRole.employee } }),
      ])

    const items: AdminUserItemDto[] = users.map(u => ({
      id: u.id,
      username: u.username,
      phoneNumber: u.phoneNumber,
      email: u.email,
      avatarUrl: u.avatarUrl,
      role: u.role,
      status: u.status,
      mustChangePassword: u.mustChangePassword,
      createdAt: u.createdAt.toISOString(),
      updatedAt: u.updatedAt ? u.updatedAt.toISOString() : null,
      fullName: u.userIdentification?.fullName || null,
      identityNumber: u.userIdentification?.identityNumber || null,
      isIdentityVerified: Boolean(u.userIdentification),
      housesCount: u.boardingHouses.length,
      contractsCount: u.tenantContracts.length,
      postsCount: u.posts.length,
      subscriptionPackage: u.userSubscriptions[0]?.planName || null,
      lastActiveAt: u.auditLogs[0]?.createdAt ? u.auditLogs[0].createdAt.toISOString() : null,
    }))

    const totalPages = Math.ceil(total / limit) || 1

    return {
      items,
      total,
      page,
      limit,
      totalPages,
      summary: {
        totalUsers,
        activeUsers,
        bannedUsers,
        inactiveUsers,
        landlordsCount,
        tenantsCount,
        employeesCount,
      },
    }
  }

  /**
   * Fetch comprehensive user details including profile, eKYC identification, bank account, and recent system audit logs.
   */
  async getUserDetail(id: string): Promise<AdminUserDetailDto> {
    this.logger.log(`getUserDetail called for userId=${id}`)

    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        userIdentification: true,
        bankAccount: true,
        boardingHouses: {
          select: { id: true, name: true },
        },
        tenantContracts: {
          select: { id: true },
        },
        posts: {
          select: { id: true },
        },
        userSubscriptions: {
          where: { status: 'active' },
          select: { planName: true },
          take: 1,
        },
      },
    })

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    // Fetch recent activity / audit logs for this user
    const auditLogs = await this.prisma.auditLog.findMany({
      where: {
        OR: [{ userId: id }, { entityId: id }],
      },
      orderBy: { createdAt: 'desc' },
      take: 15,
    })

    const recentActivities: AdminUserActivityDto[] = auditLogs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }))

    return {
      id: user.id,
      username: user.username,
      phoneNumber: user.phoneNumber,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      role: user.role,
      status: user.status,
      mustChangePassword: user.mustChangePassword,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt ? user.updatedAt.toISOString() : null,
      fullName: user.userIdentification?.fullName || null,
      identityNumber: user.userIdentification?.identityNumber || null,
      isIdentityVerified: Boolean(user.userIdentification),
      housesCount: user.boardingHouses.length,
      houseNames: user.boardingHouses.map(h => h.name),
      contractsCount: user.tenantContracts.length,
      postsCount: user.posts.length,
      subscriptionPackage: user.userSubscriptions[0]?.planName || null,
      lastActiveAt: auditLogs[0]?.createdAt ? auditLogs[0].createdAt.toISOString() : null,
      identification: user.userIdentification
        ? {
            identityNumber: user.userIdentification.identityNumber,
            fullName: user.userIdentification.fullName,
            dateOfBirth: user.userIdentification.dateOfBirth.toISOString(),
            gender: user.userIdentification.gender,
            cardFrontUrl: user.userIdentification.cardFrontUrl,
            cardBackUrl: user.userIdentification.cardBackUrl,
            placeOfResidence: user.userIdentification.placeOfResidence,
            placeOfOrigin: user.userIdentification.placeOfOrigin,
            issueDate: user.userIdentification.issueDate.toISOString(),
          }
        : null,
      bankAccount: user.bankAccount
        ? {
            bankName: user.bankAccount.bankName,
            accountNumber: user.bankAccount.accountNumber,
            accountName: user.bankAccount.accountName,
          }
        : null,
      recentActivities,
    }
  }

  /**
   * Fetch paginated system activity logs for a specific user.
   */
  async getUserActivities(
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<AdminUserActivitiesResponseDto> {
    this.logger.log(`getUserActivities called for userId=${userId}, page=${page}, limit=${limit}`)

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true } })
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`)
    }

    const p = Math.max(1, Number(page) || 1)
    const l = Math.min(100, Math.max(1, Number(limit) || 20))
    const skip = (p - 1) * l

    const where: Prisma.AuditLogWhereInput = {
      OR: [{ userId }, { entityId: userId }],
    }

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        skip,
        take: l,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.auditLog.count({ where }),
    ])

    const items: AdminUserActivityDto[] = logs.map(log => ({
      id: log.id,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      oldValue: log.oldValue,
      newValue: log.newValue,
      ipAddress: log.ipAddress,
      createdAt: log.createdAt.toISOString(),
    }))

    return {
      items,
      total,
      page: p,
      limit: l,
    }
  }

  /**
   * Update user status (active, inactive, banned) with an audit log.
   */
  async updateUserStatus(
    id: string,
    dto: UpdateUserStatusDto,
    adminId?: string,
    ipAddress = '127.0.0.1',
  ) {
    this.logger.log(
      `updateUserStatus called for userId=${id}, targetStatus=${dto.status}, reason="${dto.reason || ''}", adminId=${adminId || 'unknown'}`,
    )

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    if (user.status === dto.status) {
      return {
        success: true,
        message: `User is already in ${dto.status} status`,
        id,
        status: user.status,
      }
    }

    const updated = await this.prisma.$transaction(async tx => {
      const res = await tx.user.update({
        where: { id },
        data: { status: dto.status },
      })

      await tx.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'USER',
          entityId: id,
          userId: adminId || null,
          ipAddress,
          oldValue: { status: user.status },
          newValue: {
            status: dto.status,
            reason: dto.reason || 'Status updated by administrator',
            updatedByAdminId: adminId || 'admin',
          },
        },
      })

      return res
    })

    return {
      success: true,
      message: `User status updated to ${dto.status} successfully`,
      id: updated.id,
      status: updated.status,
      reason: dto.reason,
    }
  }

  /**
   * Update user role (e.g. promote to landlord, change to employee or tenant) with an audit log.
   */
  async updateUserRole(
    id: string,
    dto: UpdateUserRoleDto,
    adminId?: string,
    ipAddress = '127.0.0.1',
  ) {
    this.logger.log(
      `updateUserRole called for userId=${id}, targetRole=${dto.role}, reason="${dto.reason || ''}", adminId=${adminId || 'unknown'}`,
    )

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    const updated = await this.prisma.$transaction(async tx => {
      const res = await tx.user.update({
        where: { id },
        data: { role: dto.role },
      })

      await tx.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'USER',
          entityId: id,
          userId: adminId || null,
          ipAddress,
          oldValue: { role: user.role },
          newValue: {
            role: dto.role,
            reason: dto.reason || 'Role updated by administrator',
            updatedByAdminId: adminId || 'admin',
          },
        },
      })

      return res
    })

    return {
      success: true,
      message: `User role updated to ${dto.role} successfully`,
      id: updated.id,
      role: updated.role,
      reason: dto.reason,
    }
  }

  /**
   * Reset user password and optionally flag mustChangePassword = true.
   */
  async resetUserPassword(
    id: string,
    dto: ResetUserPasswordDto,
    adminId?: string,
    ipAddress = '127.0.0.1',
  ) {
    this.logger.log(
      `resetUserPassword called for userId=${id}, mustChangePassword=${dto.mustChangePassword}, adminId=${adminId || 'unknown'}`,
    )

    const user = await this.prisma.user.findUnique({ where: { id } })
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`)
    }

    const tempPassword = dto.temporaryPassword || DEFAULT_TEMP_PASS
    const hashedPassword = await bcrypt.hash(tempPassword, BCRYPT_ROUNDS)

    await this.prisma.$transaction(async tx => {
      await tx.user.update({
        where: { id },
        data: {
          hashedPassword,
          mustChangePassword: dto.mustChangePassword ?? true,
        },
      })

      await tx.auditLog.create({
        data: {
          action: AuditLogAction.update,
          entityType: 'USER',
          entityId: id,
          userId: adminId || null,
          ipAddress,
          newValue: {
            action: 'admin_reset_password',
            mustChangePassword: dto.mustChangePassword ?? true,
            resetByAdminId: adminId || 'admin',
          },
        },
      })
    })

    return {
      success: true,
      message: 'User password reset successfully',
      id,
      temporaryPassword: tempPassword,
      mustChangePassword: dto.mustChangePassword ?? true,
    }
  }
}
