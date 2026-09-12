import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { AssignmentStatus, AuditLogAction, UserRole } from '@prisma';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AssignRoleDto } from './dto/assign-role.dto';
import { CreatePositionDto } from './dto/create-position.dto';
import { OnboardStaffDto } from './dto/onboard-staff.dto';
import { QueryStaffDto } from './dto/query-staff.dto';
import {
  JobPositionDto,
  OnboardStaffResponseDto,
  SearchUserResponseDto,
  StaffItemDto,
  StaffListResponseDto,
  StaffSummaryDto,
} from './dto/staff-response.dto';
import { UpdatePositionDto } from './dto/update-position.dto';
import { UpdateStaffStatusDto } from './dto/update-staff-status.dto';

const BCRYPT_ROUNDS = 10;

/** Default seed positions for any boarding house that doesn't have positions yet */
const DEFAULT_POSITIONS = [
  {
    name: 'Quản lý tòa nhà',
    description: 'Quản lý vận hành tổng thể, tiếp đón khách và kiểm tra tòa nhà',
  },
  {
    name: 'Bảo vệ',
    description: 'Đảm bảo an ninh trật tự, giám sát camera và trông giữ phương tiện',
  },
  {
    name: 'Vệ sinh / Tạp vụ',
    description: 'Dọn dẹp khu vực sinh hoạt chung, hành lang, cầu thang và sân phơi',
  },
  {
    name: 'Kỹ thuật / Bảo trì',
    description: 'Sửa chữa và bảo dưỡng hệ thống điện nước, thiết bị phòng trọ',
  },
];

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Search user by phone number or username (UC-L-19 Step 1)
   */
  async searchUser(
    query: string,
    boardingHouseId: string,
  ): Promise<SearchUserResponseDto> {
    const trimmed = (query || '').trim();
    if (!trimmed) {
      return { success: true, found: false, user: null };
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { phoneNumber: trimmed },
          { username: { contains: trimmed, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        username: true,
        phoneNumber: true,
        email: true,
        avatarUrl: true,
        role: true,
        employee: {
          select: {
            id: true,
            employeeAssignments: {
              where: {
                boardingHouseId,
                status: AssignmentStatus.active,
              },
              select: { id: true },
            },
          },
        },
      },
    });

    if (!user) {
      return { success: true, found: false, user: null };
    }

    const isAlreadyStaffAtThisHouse =
      (user.employee?.employeeAssignments?.length ?? 0) > 0;

    return {
      success: true,
      found: true,
      user: {
        id: user.id,
        fullName: user.username || 'Chưa cập nhật tên',
        phoneNumber: user.phoneNumber,
        email: user.email,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isAlreadyStaffAtThisHouse,
      },
    };
  }

  /**
   * Retrieve all job positions for this boarding house. Auto-seeds defaults if empty.
   */
  async getJobPositions(boardingHouseId: string): Promise<JobPositionDto[]> {
    let positions = await this.prisma.jobPosition.findMany({
      where: { boardingHouseId },
      include: {
        _count: {
          select: {
            employeeAssignments: {
              where: { status: AssignmentStatus.active },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // Seed defaults if boarding house currently has no positions configured
    if (positions.length === 0) {
      await this.prisma.jobPosition.createMany({
        data: DEFAULT_POSITIONS.map((p) => ({
          boardingHouseId,
          name: p.name,
          description: p.description,
        })),
      });

      positions = await this.prisma.jobPosition.findMany({
        where: { boardingHouseId },
        include: {
          _count: {
            select: {
              employeeAssignments: {
                where: { status: AssignmentStatus.active },
              },
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    }

    return positions.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      staffCount: p._count.employeeAssignments,
      createdAt: p.createdAt,
    }));
  }

  /**
   * Create a new custom job position for the property
   */
  async createJobPosition(
    boardingHouseId: string,
    dto: CreatePositionDto,
  ): Promise<JobPositionDto> {
    const trimmedName = dto.name.trim();
    if (!trimmedName) {
      throw new BadRequestException('Tên vị trí công việc không được để trống');
    }

    const existing = await this.prisma.jobPosition.findFirst({
      where: {
        boardingHouseId,
        name: { equals: trimmedName, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException(
        `Vị trí công việc "${trimmedName}" đã tồn tại tại nhà trọ này`,
      );
    }

    const created = await this.prisma.jobPosition.create({
      data: {
        boardingHouseId,
        name: trimmedName,
        description: dto.description?.trim() || null,
      },
    });

    return {
      id: created.id,
      name: created.name,
      description: created.description,
      staffCount: 0,
      createdAt: created.createdAt,
    };
  }

  /**
   * List paginated staff assignments with summary counters
   */
  async getStaffList(
    boardingHouseId: string,
    query: QueryStaffDto,
  ): Promise<StaffListResponseDto> {
    const page = query.page && query.page > 0 ? query.page : 1;
    const limit = query.limit && query.limit > 0 ? query.limit : 10;
    const skip = (page - 1) * limit;

    const whereClause: any = {
      boardingHouseId,
    };

    if (query.status) {
      whereClause.status = query.status;
    }

    if (query.positionId) {
      whereClause.positionId = query.positionId;
    }

    if (query.search) {
      const search = query.search.trim();
      whereClause.OR = [
        {
          employee: {
            user: {
              username: { contains: search, mode: 'insensitive' },
            },
          },
        },
        {
          employee: {
            user: {
              phoneNumber: { contains: search },
            },
          },
        },
        {
          position: {
            name: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    // Determine sort order
    let orderBy: any = { joinedAt: query.sortOrder || 'desc' };
    if (query.sortBy === 'name') {
      orderBy = { employee: { user: { username: query.sortOrder || 'asc' } } };
    } else if (query.sortBy === 'status') {
      orderBy = { status: query.sortOrder || 'asc' };
    }

    const [assignments, total, allAssignmentsForHouse, positionsCount] =
      await Promise.all([
        this.prisma.employeeAssignment.findMany({
          where: whereClause,
          include: {
            position: true,
            employee: {
              include: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    phoneNumber: true,
                    email: true,
                    avatarUrl: true,
                    role: true,
                    mustChangePassword: true,
                  },
                },
              },
            },
          },
          skip,
          take: limit,
          orderBy,
        }),
        this.prisma.employeeAssignment.count({ where: whereClause }),
        this.prisma.employeeAssignment.findMany({
          where: { boardingHouseId },
          select: { status: true },
        }),
        this.prisma.jobPosition.count({
          where: { boardingHouseId },
        }),
      ]);

    const activeStaff = allAssignmentsForHouse.filter(
      (a) => a.status === AssignmentStatus.active,
    ).length;
    const inactiveStaff = allAssignmentsForHouse.filter(
      (a) => a.status === AssignmentStatus.inactive,
    ).length;

    const summary: StaffSummaryDto = {
      totalStaff: allAssignmentsForHouse.length,
      activeStaff,
      inactiveStaff,
      positionsCount,
    };

    const data: StaffItemDto[] = assignments.map((a) => ({
      assignmentId: a.id,
      employeeId: a.employeeId,
      userId: a.employee.user.id,
      fullName: a.employee.user.username || 'Chưa cập nhật tên',
      phoneNumber: a.employee.user.phoneNumber,
      email: a.employee.user.email,
      avatarUrl: a.employee.user.avatarUrl,
      positionId: a.positionId,
      positionName: a.position.name,
      positionDescription: a.position.description,
      status: a.status,
      joinedAt: a.joinedAt,
      leftAt: a.leftAt,
      createdAt: a.createdAt,
      userRole: a.employee.user.role,
      mustChangePassword: a.employee.user.mustChangePassword,
    }));

    return {
      success: true,
      data,
      summary,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * UC-L-19 & UC-AUTH-03: Onboard Staff Member
   */
  async onboardStaff(
    boardingHouseId: string,
    currentUserId: string,
    dto: OnboardStaffDto,
    ipAddress = '127.0.0.1',
  ): Promise<OnboardStaffResponseDto> {
    const normalizedPhone = dto.phoneNumber.trim();

    // 1. Resolve JobPosition
    let positionId = dto.positionId;
    if (!positionId && dto.newPositionName?.trim()) {
      const createdPos = await this.createJobPosition(boardingHouseId, {
        name: dto.newPositionName.trim(),
        description: dto.newPositionDescription?.trim(),
      });
      positionId = createdPos.id;
    } else if (!positionId) {
      // Fall back to first available position or default
      const positions = await this.getJobPositions(boardingHouseId);
      positionId = positions[0].id;
    }

    // Verify position belongs to boardingHouseId
    const targetPosition = await this.prisma.jobPosition.findFirst({
      where: { id: positionId, boardingHouseId },
    });
    if (!targetPosition) {
      throw new BadRequestException('Vị trí công việc không hợp lệ cho nhà trọ này');
    }

    // 2. Check if user already exists
    let user = await this.prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone },
      include: { employee: true },
    });

    let isNewUser = false;
    let generatedPassword: string | undefined = undefined;

    if (user) {
      // Check if user already has an active assignment for this boarding house
      if (user.employee) {
        const existingActiveAssignment =
          await this.prisma.employeeAssignment.findFirst({
            where: {
              employeeId: user.employee.id,
              boardingHouseId,
              status: AssignmentStatus.active,
            },
          });

        if (existingActiveAssignment) {
          throw new ConflictException(
            `Nhân viên có số điện thoại ${normalizedPhone} đã đang làm việc tại nhà trọ này.`,
          );
        }
      }
    } else {
      // User doesn't exist yet -> generate random password per UC-AUTH-03
      if (!dto.fullName?.trim()) {
        throw new BadRequestException('Vui lòng nhập họ và tên cho nhân viên mới');
      }

      isNewUser = true;
      // Generate 8-character random password
      generatedPassword = crypto.randomBytes(4).toString('hex').toUpperCase();
      const hashedPassword = await bcrypt.hash(generatedPassword, BCRYPT_ROUNDS);

      user = await this.prisma.user.create({
        data: {
          phoneNumber: normalizedPhone,
          username: dto.fullName.trim(),
          hashedPassword,
          mustChangePassword: true,
          role: UserRole.leasing_agent,
        },
        include: { employee: true },
      });
    }

    // 3. Ensure Employee profile exists
    let employeeId = user.employee?.id;
    if (!employeeId) {
      const createdEmployee = await this.prisma.employee.create({
        data: {
          userId: user.id,
        },
      });
      employeeId = createdEmployee.id;
    }

    // 4. Role bump per 07-auth_roles.md: if current role is leasing_agent, bump to employee
    if (user.role === UserRole.leasing_agent) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { role: UserRole.employee },
      });
    }

    // 5. Execute Assignment creation and AuditLog in same atomic transaction
    const joinedAt = dto.joinedAt ? new Date(dto.joinedAt) : new Date();

    const assignment = await this.prisma.$transaction(async (tx) => {
      const createdAssignment = await tx.employeeAssignment.create({
        data: {
          employeeId,
          positionId: targetPosition.id,
          boardingHouseId,
          status: AssignmentStatus.active,
          joinedAt,
        },
        include: {
          position: true,
          employee: {
            include: {
              user: true,
            },
          },
        },
      });

      // AuditLog (Rule 4)
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          boardingHouseId,
          action: AuditLogAction.create,
          entityType: 'EMPLOYEE_ASSIGNMENT',
          entityId: createdAssignment.id,
          newValue: {
            assignmentId: createdAssignment.id,
            employeeId,
            userId: user.id,
            positionId: targetPosition.id,
            positionName: targetPosition.name,
            boardingHouseId,
            status: AssignmentStatus.active,
            joinedAt,
            note: dto.note || null,
          },
          ipAddress,
        },
      });

      return createdAssignment;
    });

    this.logger.log(
      `Staff onboarded: assignment=${assignment.id} employee=${employeeId} house=${boardingHouseId} isNewUser=${isNewUser}`,
    );

    const staffItem: StaffItemDto = {
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      userId: assignment.employee.user.id,
      fullName: assignment.employee.user.username || 'Chưa cập nhật tên',
      phoneNumber: assignment.employee.user.phoneNumber,
      email: assignment.employee.user.email,
      avatarUrl: assignment.employee.user.avatarUrl,
      positionId: assignment.positionId,
      positionName: assignment.position.name,
      positionDescription: assignment.position.description,
      status: assignment.status,
      joinedAt: assignment.joinedAt,
      leftAt: assignment.leftAt,
      createdAt: assignment.createdAt,
      userRole: assignment.employee.user.role,
      mustChangePassword: assignment.employee.user.mustChangePassword,
    };

    return {
      success: true,
      data: staffItem,
      isNewUser,
      generatedPassword,
      message: isNewUser
        ? 'Tạo tài khoản và thêm nhân viên mới thành công'
        : 'Thêm nhân viên vào nhà trọ thành công',
    };
  }

  /**
   * UC-L-20: Update Staff Status (active ↔ inactive) or change position
   */
  async updateStaffStatus(
    boardingHouseId: string,
    assignmentId: string,
    currentUserId: string,
    dto: UpdateStaffStatusDto,
    ipAddress = '127.0.0.1',
  ): Promise<StaffItemDto> {
    const existing = await this.prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        boardingHouseId,
      },
      include: {
        position: true,
        employee: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông tin phân công nhân viên');
    }

    if (dto.positionId && dto.positionId !== existing.positionId) {
      const pos = await this.prisma.jobPosition.findFirst({
        where: { id: dto.positionId, boardingHouseId },
      });
      if (!pos) {
        throw new BadRequestException('Vị trí công việc không tồn tại tại nhà trọ này');
      }
    }

    const newStatus = dto.status;
    const leftAt = newStatus === AssignmentStatus.inactive ? new Date() : null;

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.employeeAssignment.update({
        where: { id: assignmentId },
        data: {
          status: newStatus,
          leftAt,
          positionId: dto.positionId || existing.positionId,
        },
        include: {
          position: true,
          employee: {
            include: {
              user: true,
            },
          },
        },
      });

      // If status becomes inactive, cancel future scheduled shifts per UC-L-20 Step 4
      if (newStatus === AssignmentStatus.inactive) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        await tx.workSchedule.updateMany({
          where: {
            employeeId: existing.employeeId,
            boardingHouseId,
            workDate: { gte: today },
            status: 'scheduled',
          },
          data: {
            status: 'canceled',
          },
        });
      }

      // AuditLog (Rule 4)
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          boardingHouseId,
          action: AuditLogAction.update,
          entityType: 'EMPLOYEE_ASSIGNMENT',
          entityId: assignmentId,
          oldValue: {
            status: existing.status,
            leftAt: existing.leftAt,
            positionId: existing.positionId,
          },
          newValue: {
            status: newStatus,
            leftAt,
            positionId: dto.positionId || existing.positionId,
          },
          ipAddress,
        },
      });

      return res;
    });

    this.logger.log(
      `Updated staff assignment ${assignmentId}: status=${newStatus} house=${boardingHouseId}`,
    );

    return {
      assignmentId: updated.id,
      employeeId: updated.employeeId,
      userId: updated.employee.user.id,
      fullName: updated.employee.user.username || 'Chưa cập nhật tên',
      phoneNumber: updated.employee.user.phoneNumber,
      email: updated.employee.user.email,
      avatarUrl: updated.employee.user.avatarUrl,
      positionId: updated.positionId,
      positionName: updated.position.name,
      positionDescription: updated.position.description,
      status: updated.status,
      joinedAt: updated.joinedAt,
      leftAt: updated.leftAt,
      createdAt: updated.createdAt,
      userRole: updated.employee.user.role,
      mustChangePassword: updated.employee.user.mustChangePassword,
    };
  }

  /**
   * UC-L-20: Get single staff assignment details
   */
  async getStaffDetail(
    boardingHouseId: string,
    assignmentId: string,
  ): Promise<StaffItemDto> {
    const assignment = await this.prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        boardingHouseId,
      },
      include: {
        position: true,
        employee: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
                email: true,
                avatarUrl: true,
                role: true,
                mustChangePassword: true,
              },
            },
          },
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Không tìm thấy thông tin phân công nhân viên');
    }

    return {
      assignmentId: assignment.id,
      employeeId: assignment.employeeId,
      userId: assignment.employee.user.id,
      fullName: assignment.employee.user.username || 'Chưa cập nhật tên',
      phoneNumber: assignment.employee.user.phoneNumber,
      email: assignment.employee.user.email,
      avatarUrl: assignment.employee.user.avatarUrl,
      positionId: assignment.positionId,
      positionName: assignment.position.name,
      positionDescription: assignment.position.description,
      status: assignment.status,
      joinedAt: assignment.joinedAt,
      leftAt: assignment.leftAt,
      createdAt: assignment.createdAt,
      userRole: assignment.employee.user.role,
      mustChangePassword: assignment.employee.user.mustChangePassword,
    };
  }

  /**
   * UC-L-20 Step 3: Assign/Re-assign role and static duties list to staff member
   */
  async assignRole(
    boardingHouseId: string,
    assignmentId: string,
    currentUserId: string,
    dto: AssignRoleDto,
    ipAddress = '127.0.0.1',
  ): Promise<StaffItemDto> {
    const existing = await this.prisma.employeeAssignment.findFirst({
      where: {
        id: assignmentId,
        boardingHouseId,
      },
      include: {
        position: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy thông tin phân công nhân viên');
    }

    let targetPositionId = dto.positionId;

    // Inline position creation if requested
    if (!targetPositionId && dto.newPositionName?.trim()) {
      const createdPos = await this.createJobPosition(boardingHouseId, {
        name: dto.newPositionName.trim(),
        description: dto.newPositionDescription?.trim(),
      });
      targetPositionId = createdPos.id;
    }

    if (!targetPositionId) {
      throw new BadRequestException('Vui lòng chọn hoặc nhập tên vị trí công việc mới');
    }

    const targetPosition = await this.prisma.jobPosition.findFirst({
      where: {
        id: targetPositionId,
        boardingHouseId,
      },
    });

    if (!targetPosition) {
      throw new BadRequestException('Vị trí công việc không hợp lệ cho nhà trọ này');
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const res = await tx.employeeAssignment.update({
        where: { id: assignmentId },
        data: {
          positionId: targetPosition.id,
        },
        include: {
          position: true,
          employee: {
            include: {
              user: true,
            },
          },
        },
      });

      // AuditLog (Rule 4)
      await tx.auditLog.create({
        data: {
          userId: currentUserId,
          boardingHouseId,
          action: AuditLogAction.update,
          entityType: 'EMPLOYEE_ASSIGNMENT',
          entityId: assignmentId,
          oldValue: {
            positionId: existing.positionId,
            positionName: existing.position.name,
          },
          newValue: {
            positionId: targetPosition.id,
            positionName: targetPosition.name,
          },
          ipAddress,
        },
      });

      return res;
    });

    this.logger.log(
      `Re-assigned role for staff assignment ${assignmentId}: newPosition=${targetPosition.name}`,
    );

    return {
      assignmentId: updated.id,
      employeeId: updated.employeeId,
      userId: updated.employee.user.id,
      fullName: updated.employee.user.username || 'Chưa cập nhật tên',
      phoneNumber: updated.employee.user.phoneNumber,
      email: updated.employee.user.email,
      avatarUrl: updated.employee.user.avatarUrl,
      positionId: updated.positionId,
      positionName: updated.position.name,
      positionDescription: updated.position.description,
      status: updated.status,
      joinedAt: updated.joinedAt,
      leftAt: updated.leftAt,
      createdAt: updated.createdAt,
      userRole: updated.employee.user.role,
      mustChangePassword: updated.employee.user.mustChangePassword,
    };
  }

  /**
   * UC-L-20: Update job position name and static duties description
   */
  async updateJobPosition(
    boardingHouseId: string,
    positionId: string,
    dto: UpdatePositionDto,
  ): Promise<JobPositionDto> {
    const existing = await this.prisma.jobPosition.findFirst({
      where: {
        id: positionId,
        boardingHouseId,
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy vị trí công việc này');
    }

    if (dto.name && dto.name.trim() !== existing.name) {
      const duplicate = await this.prisma.jobPosition.findFirst({
        where: {
          boardingHouseId,
          name: { equals: dto.name.trim(), mode: 'insensitive' },
          id: { not: positionId },
        },
      });
      if (duplicate) {
        throw new ConflictException(
          `Vị trí công việc "${dto.name.trim()}" đã tồn tại tại nhà trọ này`,
        );
      }
    }

    const updated = await this.prisma.jobPosition.update({
      where: { id: positionId },
      data: {
        name: dto.name?.trim() || existing.name,
        description:
          dto.description !== undefined
            ? dto.description?.trim() || null
            : existing.description,
      },
      include: {
        _count: {
          select: {
            employeeAssignments: {
              where: { status: AssignmentStatus.active },
            },
          },
        },
      },
    });

    this.logger.log(`Updated job position ${positionId} for house ${boardingHouseId}`);

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      staffCount: updated._count.employeeAssignments,
      createdAt: updated.createdAt,
    };
  }

  /**
   * UC-L-20: Delete job position (protected if active staff are assigned)
   */
  async deleteJobPosition(
    boardingHouseId: string,
    positionId: string,
  ): Promise<{ success: boolean; message: string }> {
    const existing = await this.prisma.jobPosition.findFirst({
      where: {
        id: positionId,
        boardingHouseId,
      },
      include: {
        _count: {
          select: {
            employeeAssignments: {
              where: { status: AssignmentStatus.active },
            },
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException('Không tìm thấy vị trí công việc này');
    }

    if (existing._count.employeeAssignments > 0) {
      throw new BadRequestException(
        `Không thể xóa vị trí "${existing.name}" vì đang có ${existing._count.employeeAssignments} nhân viên đảm nhận. Vui lòng chuyển vị trí của nhân viên trước.`,
      );
    }

    await this.prisma.jobPosition.delete({
      where: { id: positionId },
    });

    this.logger.log(`Deleted job position ${positionId} from house ${boardingHouseId}`);

    return {
      success: true,
      message: `Đã xóa vị trí công việc "${existing.name}" thành công`,
    };
  }
}

