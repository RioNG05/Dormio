import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  HttpStatus,
} from '@nestjs/common'
import {
  BusinessNotFoundException,
  BusinessBadRequestException,
  BusinessConflictException,
} from '../../common/exceptions/business.exception'
import { BusinessErrorCode } from '../../common/enums/business-error-code.enum'
import { PrismaService } from '../../common/prisma/prisma.service'
import { NotificationsService } from '../notifications/notifications.service'
import { AuthService } from '../auth/auth.service'
import { UploadService } from '../upload/upload.service'
import { TenancyDetailsDto } from './dto/tenancy-details.dto'
import { CreateContractPlatformDto } from './dto/create-contract-platform.dto'
import { CreateContractDirectDto } from './dto/create-contract-direct.dto'
import { QueryContractsDto } from './dto/query-contracts.dto'
import { ExportContractResponseDto } from './dto/export-contract-response.dto'
import { UpdateContractDto } from './dto/update-contract.dto'
import { ContractTemplateRenderer, ContractTemplateData } from './contract-template.renderer'
import { Prisma } from '@prisma'
import { randomUUID } from 'crypto'

/**
 * ContractsService
 *
 * Handles contract operations, including:
 * - UC-L-04: Generate Rental Contract (Flow A Platform Deposit & Flow B Direct)
 * - UC-T-01: Onboarding notification hook
 * - UC-T-06: Tenant tenancy details retrieval (read-only aggregate)
 */
@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly authService: AuthService,
    private readonly uploadService: UploadService,
  ) {}

  // ─── UC-L-04: Flow A Check — Get Pending Platform Deposit ──────────────────

  /**
   * Checks whether a room has an unconverted paid platform deposit.
   *
   * @param boardingHouseId Boarding house ID (ownership validated by guard)
   * @param roomId Target room ID
   * @returns Deposit details or null if no pending deposit
   */
  async getPendingPlatformDeposit(boardingHouseId: string, roomId: string) {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, boardingHouseId },
      include: { roomType: true },
    })

    if (!room) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ROOM_NOT_FOUND,
        'Room does not exist or does not belong to this boarding house.',
      )
    }

    const deposit = await this.prisma.deposit.findFirst({
      where: {
        roomId,
        boardingHouseId,
        type: 'platform',
        contractId: null,
        status: 'paid',
      },
      include: {
        post: {
          include: {
            postedByUser: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
                email: true,
                userIdentification: true,
              },
            },
          },
        },
        payment: {
          include: {
            payer: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
                email: true,
                userIdentification: true,
              },
            },
          },
        },
        recordedByUser: {
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            email: true,
          },
        },
      },
    })

    if (!deposit) {
      return null
    }

    const tenant = deposit.payment?.payer || deposit.post?.postedByUser || deposit.recordedByUser

    return {
      depositId: deposit.id,
      amount: Number(deposit.amount),
      status: deposit.status,
      type: deposit.type,
      createdAt: deposit.createdAt,
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        roomTypeName: room.roomType?.name,
      },
      post: deposit.post
        ? {
            id: deposit.post.id,
            title: deposit.post.title,
            depositAmount: Number(deposit.post.depositAmount),
          }
        : null,
      tenant: tenant
        ? {
            id: tenant.id,
            fullName: tenant.username || 'Deposit Tenant',
            phoneNumber: tenant.phoneNumber,
            email: tenant.email,
            userIdentification: (tenant as any).userIdentification || null,
          }
        : null,
    }
  }

  // ─── UC-L-04: Flow B Helper — Search Tenant By Phone ────────────────────────

  /**
   * Searches for an existing user by phone number.
   * Returns user info and identification status.
   */
  async searchTenantByPhone(phoneNumber: string) {
    const user = await this.prisma.user.findUnique({
      where: { phoneNumber },
      include: {
        userIdentification: true,
      },
    })

    if (!user) {
      return { exists: false, user: null }
    }

    return {
      exists: true,
      user: {
        id: user.id,
        phoneNumber: user.phoneNumber,
        fullName: user.userIdentification?.fullName || user.username,
        email: user.email,
        hasIdentification: !!user.userIdentification,
        identification: user.userIdentification,
      },
    }
  }

  // ─── UC-L-04: Flow A — Create Contract From Platform Deposit ────────────────

  /**
   * Flow A: Generates contract from an existing paid platform deposit.
   *
   * 1. Validates room and checks unconverted platform deposit exists with status 'paid'.
   * 2. Sets Contract status to 'draft' (tenant must confirm per UC-AUTH-04).
   * 3. Creates TenantContract join record.
   * 4. Updates existing Deposit: SET contractId = contract.id (never inserts new deposit).
   * 5. Updates Post: resultedContractId = contract.id, status = 'hidden'.
   * 6. Sets Room.status = 'deposited'.
   * 7. Writes AuditLogs inside the same transaction.
   * 8. Dispatches tenant notification awaiting confirmation outside transaction.
   */
  async createPlatformContract(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateContractPlatformDto,
  ) {
    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, boardingHouseId },
    })

    if (!room) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ROOM_NOT_FOUND,
        'Room does not exist or does not belong to this property.',
      )
    }

    // Guard: deposit must exist, type=platform, contractId=null, status=paid
    const deposit = await this.prisma.deposit.findFirst({
      where: {
        roomId: dto.roomId,
        boardingHouseId,
        type: 'platform',
        contractId: null,
      },
      include: {
        payment: true,
        post: true,
      },
    })

    if (!deposit) {
      throw new BusinessBadRequestException(
        BusinessErrorCode.CONTRACT_INVALID_STATUS,
        'The room does not have any pending platform reservation deposit for contract creation.',
      )
    }

    if (deposit.status !== 'paid') {
      throw new BusinessBadRequestException(
        BusinessErrorCode.CONTRACT_INVALID_STATUS,
        `Cannot create contract from deposit with status: ${deposit.status}. Deposit status must be 'paid'.`,
      )
    }

    // Resolve tenant ID from payment payer or post
    const tenantId = deposit.payment?.payerId || deposit.post?.postedBy || deposit.recordedBy

    if (!tenantId) {
      throw new BusinessBadRequestException(
        BusinessErrorCode.CONTRACT_MISSING_TENANT,
        'Cannot identify the prospective tenant who placed the deposit.',
      )
    }

    // Execute in atomic transaction
    const contract = await this.prisma.$transaction(async tx => {
      // 1. Create Contract in draft status
      const newContract = await tx.contract.create({
        data: {
          roomId: dto.roomId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          rentPrice: new Prisma.Decimal(dto.rentPrice),
          monthlyPaymentDate: dto.monthlyPaymentDate,
          note: dto.note || '',
          status: 'draft',
        },
      })

      // 2. Create TenantContract
      await tx.tenantContract.create({
        data: {
          contractId: newContract.id,
          tenantId,
          isPrimary: true,
        },
      })

      // 3. Update existing Deposit (Rule 8: never insert a new one)
      await tx.deposit.update({
        where: { id: deposit.id },
        data: {
          contractId: newContract.id,
        },
      })

      // 4. Update Post if linked: resultedContractId and status='hidden'
      if (deposit.postId) {
        await tx.post.update({
          where: { id: deposit.postId },
          data: {
            resultedContractId: newContract.id,
            status: 'hidden',
          },
        })
      }

      // 5. Update Room status = 'deposited'
      await tx.room.update({
        where: { id: dto.roomId },
        data: {
          status: 'deposited',
        },
      })

      // 6. AuditLog inside same transaction (Rule 4)
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'CONTRACT',
          entityId: newContract.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            roomId: newContract.roomId,
            status: newContract.status,
            rentPrice: Number(newContract.rentPrice),
            startDate: newContract.startDate,
            endDate: newContract.endDate,
            flow: 'platform',
          },
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'DEPOSIT',
          entityId: deposit.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          oldValue: { contractId: null },
          newValue: { contractId: newContract.id },
        },
      })

      return newContract
    })

    // Outside transaction: notify tenant awaiting confirmation (UC-AUTH-04)
    try {
      await this.notificationsService.createOnboardingNotification({
        senderId: landlordId,
        receiverId: tenantId,
        boardingHouseId,
        contractId: contract.id,
      })
    } catch {
      // Async dispatch failures do not block contract draft creation
    }

    return contract
  }

  // ─── UC-L-04: Flow B — Create Direct Contract ───────────────────────────────

  /**
   * Flow B: Generates direct contract (landlord adds tenant directly).
   *
   * 1. Validates room and verifies no unconverted platform deposit exists.
   * 2. Resolves tenant user via shared AuthService.findOrCreateByPhone().
   * 3. Creates/checks UserIdentification if not already present.
   * 4. Creates Contract with status 'active' (immediately active).
   * 5. Creates TenantContract join record.
   * 6. Creates manual Deposit row (type: 'contract', recordedManually: true).
   * 7. Sets Room.status = 'occupied'.
   * 8. Generates printable ContractDocument.
   * 9. Writes AuditLogs inside the same transaction.
   * 10. Triggers UC-T-01 onboarding notification outside transaction.
   */
  async createDirectContract(
    landlordId: string,
    boardingHouseId: string,
    dto: CreateContractDirectDto,
  ) {
    const room = await this.prisma.room.findFirst({
      where: { id: dto.roomId, boardingHouseId },
    })

    if (!room) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.ROOM_NOT_FOUND,
        'Room does not exist or does not belong to this property.',
      )
    }

    // Routing check: if room has unconverted platform deposit, landlord should use Flow A
    const pendingPlatformDeposit = await this.prisma.deposit.findFirst({
      where: {
        roomId: dto.roomId,
        type: 'platform',
        contractId: null,
        status: 'paid',
      },
    })

    if (pendingPlatformDeposit) {
      throw new BusinessConflictException(
        BusinessErrorCode.ROOM_HAS_ACTIVE_CONTRACT,
        'This room currently has an unassigned platform deposit. Please create the contract from the platform deposit (Flow A).',
      )
    }

    // 1. Resolve or create tenant user via shared findOrCreateByPhone
    const tenantUser = await this.authService.findOrCreateByPhone(
      dto.tenantPhoneNumber,
      dto.tenantFullName,
    )

    // If tenant provided an email and user currently lacks one, update it
    if (dto.tenantEmail && !tenantUser.email) {
      await this.prisma.user.update({
        where: { id: tenantUser.id },
        data: { email: dto.tenantEmail },
      })
    }

    // 2. Identity verification: check or create UserIdentification
    const existingId = await this.prisma.userIdentification.findUnique({
      where: { userId: tenantUser.id },
    })

    if (!existingId && dto.identification) {
      const cardFrontUrl = await this.uploadService.ensureCloudinaryUrl(
        dto.identification.cardFrontUrl,
        'dormio/identifications',
      )
      const cardBackUrl = await this.uploadService.ensureCloudinaryUrl(
        dto.identification.cardBackUrl,
        'dormio/identifications',
      )

      await this.prisma.userIdentification.create({
        data: {
          userId: tenantUser.id,
          identityNumber: dto.identification.identityNumber,
          fullName: dto.identification.fullName || dto.tenantFullName,
          dateOfBirth: new Date(dto.identification.dateOfBirth),
          gender: dto.identification.gender,
          nationnality: dto.identification.nationality || 'Vietnam',
          placeOfOrigin: dto.identification.placeOfOrigin || {},
          placeOfResidence: dto.identification.placeOfResidence || {},
          issueDate: dto.identification.issueDate
            ? new Date(dto.identification.issueDate)
            : new Date(),
          expiryDate: dto.identification.expiryDate
            ? new Date(dto.identification.expiryDate)
            : new Date(Date.now() + 15 * 365 * 24 * 3600 * 1000),
          personalIdentification: randomUUID(),
          note: dto.identification.note || '',
          cardFrontUrl: cardFrontUrl || '',
          cardBackUrl: cardBackUrl || '',
        },
      })
    }

    // 3. Execute in atomic transaction
    const contract = await this.prisma.$transaction(async tx => {
      // Create Contract in active status
      const newContract = await tx.contract.create({
        data: {
          roomId: dto.roomId,
          startDate: new Date(dto.startDate),
          endDate: new Date(dto.endDate),
          rentPrice: new Prisma.Decimal(dto.rentPrice),
          monthlyPaymentDate: dto.monthlyPaymentDate,
          note: dto.note || '',
          status: 'active',
        },
      })

      // Create TenantContract
      await tx.tenantContract.create({
        data: {
          contractId: newContract.id,
          tenantId: tenantUser.id,
          isPrimary: true,
        },
      })

      // Create manual Deposit record (type: 'contract')
      const deposit = await tx.deposit.create({
        data: {
          roomId: dto.roomId,
          boardingHouseId,
          contractId: newContract.id,
          type: 'contract',
          amount: new Prisma.Decimal(dto.depositAmount),
          status: 'paid',
          recordedManually: true,
          recordedBy: landlordId,
          note: dto.note || null,
        },
      })

      // Update Room status = 'occupied'
      await tx.room.update({
        where: { id: dto.roomId },
        data: {
          status: 'occupied',
        },
      })

      // Generate printable ContractDocument entry
      await tx.contractDocument.create({
        data: {
          contractId: newContract.id,
          url: `contracts/${newContract.id}/contract_${newContract.id}.pdf`,
        },
      })

      // AuditLog inside same transaction (Rule 4)
      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'CONTRACT',
          entityId: newContract.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            roomId: newContract.roomId,
            status: newContract.status,
            rentPrice: Number(newContract.rentPrice),
            startDate: newContract.startDate,
            endDate: newContract.endDate,
            flow: 'direct',
          },
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'DEPOSIT',
          entityId: deposit.id,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            amount: Number(deposit.amount),
            type: deposit.type,
            status: deposit.status,
            recordedManually: true,
          },
        },
      })

      return newContract
    })

    // 4. Outside transaction: trigger UC-T-01 onboarding notification
    try {
      await this.notifyContractCreated({
        senderId: landlordId,
        receiverId: tenantUser.id,
        boardingHouseId,
        contractId: contract.id,
      })
    } catch {
      // Async dispatch failures do not roll back the created contract
    }

    return contract
  }

  // ─── Landlord: List Contracts with Pagination and Search ────────────────────

  /**
   * Retrieves paginated contracts for a boarding house.
   */
  async getLandlordContracts(boardingHouseId: string, query: QueryContractsDto) {
    const page = query.page || 1
    const limit = query.limit || 10
    const skip = (page - 1) * limit

    const where: any = {
      room: {
        boardingHouseId,
      },
    }

    if (query.status) {
      where.status = query.status
    }

    if (query.search) {
      const search = query.search.trim()
      where.OR = [
        { room: { roomNumber: { contains: search, mode: 'insensitive' } } },
        {
          tenantContracts: {
            some: {
              tenant: {
                OR: [
                  { username: { contains: search, mode: 'insensitive' } },
                  { phoneNumber: { contains: search, mode: 'insensitive' } },
                ],
              },
            },
          },
        },
      ]
    }

    const [total, contracts] = await Promise.all([
      this.prisma.contract.count({ where }),
      this.prisma.contract.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          room: {
            include: {
              roomType: true,
            },
          },
          tenantContracts: {
            include: {
              tenant: {
                select: {
                  id: true,
                  username: true,
                  phoneNumber: true,
                  email: true,
                  userIdentification: true,
                },
              },
            },
          },
          deposit: true,
          contractDocuments: true,
        },
      }),
    ])

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: contracts.map(c => {
        const primaryTenant =
          c.tenantContracts.find(tc => tc.isPrimary)?.tenant || c.tenantContracts[0]?.tenant

        return {
          id: c.id,
          status: c.status,
          startDate: c.startDate,
          endDate: c.endDate,
          rentPrice: Number(c.rentPrice),
          monthlyPaymentDate: c.monthlyPaymentDate,
          note: c.note,
          depositAmount: c.deposit ? Number(c.deposit.amount) : 0,
          room: {
            id: c.room.id,
            roomNumber: c.room.roomNumber,
            floor: c.room.floor,
            roomTypeName: c.room.roomType?.name,
          },
          tenant: primaryTenant
            ? {
                id: primaryTenant.id,
                fullName:
                  primaryTenant.userIdentification?.fullName ||
                  primaryTenant.username ||
                  'Tenant',
                phoneNumber: primaryTenant.phoneNumber,
                email: primaryTenant.email,
                userIdentification: primaryTenant.userIdentification,
              }
            : null,
          tenantContracts: c.tenantContracts.map(tc => ({
            id: tc.id,
            isPrimary: tc.isPrimary,
            tenant: {
              id: tc.tenant.id,
              fullName:
                tc.tenant.userIdentification?.fullName || tc.tenant.username || 'Tenant',
              phoneNumber: tc.tenant.phoneNumber,
              email: tc.tenant.email,
              userIdentification: tc.tenant.userIdentification,
            },
          })),
          documentsCount: c.contractDocuments.length,
          createdAt: c.createdAt,
        }
      }),
    }
  }

  // ─── Landlord: Get Contract Detail By ID ────────────────────────────────────

  /**
   * Retrieves single contract aggregate by ID.
   */
  async getContractById(boardingHouseId: string, contractId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        room: { boardingHouseId },
      },
      include: {
        room: {
          include: {
            roomType: true,
            roomServices: {
              include: { service: true },
            },
          },
        },
        tenantContracts: {
          include: {
            tenant: {
              select: {
                id: true,
                username: true,
                phoneNumber: true,
                email: true,
                userIdentification: true,
              },
            },
          },
        },
        deposit: {
          include: {
            payment: true,
          },
        },
        contractDocuments: true,
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 5,
        },
      },
    })

    if (!contract) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.CONTRACT_NOT_FOUND,
        'Contract does not exist or does not belong to this property.',
      )
    }

    const primaryTenant =
      contract.tenantContracts.find(tc => tc.isPrimary)?.tenant ||
      contract.tenantContracts[0]?.tenant

    return {
      id: contract.id,
      status: contract.status,
      startDate: contract.startDate,
      endDate: contract.endDate,
      rentPrice: Number(contract.rentPrice),
      monthlyPaymentDate: contract.monthlyPaymentDate,
      note: contract.note,
      room: {
        id: contract.room.id,
        roomNumber: contract.room.roomNumber,
        floor: contract.room.floor,
        area: contract.room.area ? Number(contract.room.area) : null,
        roomTypeName: contract.room.roomType?.name,
        services: contract.room.roomServices.map(rs => ({
          name: rs.service.name,
          price: Number(rs.service.price),
          unit: rs.service.unit,
        })),
      },
      tenant: primaryTenant
        ? {
            id: primaryTenant.id,
            fullName:
              primaryTenant.userIdentification?.fullName || primaryTenant.username || 'Tenant',
            phoneNumber: primaryTenant.phoneNumber,
            email: primaryTenant.email,
            userIdentification: primaryTenant.userIdentification,
          }
        : null,
      tenantContracts: contract.tenantContracts.map(tc => ({
        id: tc.id,
        isPrimary: tc.isPrimary,
        tenant: {
          id: tc.tenant.id,
          fullName: tc.tenant.userIdentification?.fullName || tc.tenant.username || 'Tenant',
          phoneNumber: tc.tenant.phoneNumber,
          email: tc.tenant.email,
          userIdentification: tc.tenant.userIdentification,
        },
      })),
      deposit: contract.deposit
        ? {
            id: contract.deposit.id,
            amount: Number(contract.deposit.amount),
            type: contract.deposit.type,
            status: contract.deposit.status,
            recordedManually: contract.deposit.recordedManually,
          }
        : null,
      documents: contract.contractDocuments.map(d => ({
        id: d.id,
        url: d.url,
        createdAt: d.createdAt,
      })),
      recentInvoices: contract.invoices.map(inv => ({
        id: inv.id,
        totalAmount: Number(inv.totalAmount),
        status: inv.status,
        dueDate: inv.dueDate,
      })),
      createdAt: contract.createdAt,
    }
  }

  /**
   * Updates contract details (rent price, deposit, payment date, end date, note/reason).
   * Validates contract exists and belongs to the specified boarding house.
   * Updates contract and linked deposit within a single transaction.
   * Records AuditLog mutations in the same transaction (Rule 4).
   *
   * @param landlordId Authenticated landlord ID
   * @param boardingHouseId Active Boarding House context
   * @param contractId Contract UUID
   * @param dto UpdateContractDto payload
   * @param ipAddress Client IP address for audit logging
   * @returns Updated contract aggregate
   */
  async updateContract(
    landlordId: string,
    boardingHouseId: string,
    contractId: string,
    dto: UpdateContractDto,
    ipAddress?: string,
  ) {
    const existingContract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        room: { boardingHouseId },
      },
      include: {
        deposit: true,
      },
    })

    if (!existingContract) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.CONTRACT_NOT_FOUND,
        'Contract does not exist or does not belong to this property.',
      )
    }

    if (existingContract.status === 'canceled') {
      throw new BusinessBadRequestException(
        BusinessErrorCode.CONTRACT_INVALID_STATUS,
        'Cannot modify a canceled contract.',
      )
    }

    await this.prisma.$transaction(async tx => {
      // 1. Prepare contract update payload
      const contractUpdateData: Prisma.ContractUpdateInput = {}
      if (dto.rentPrice !== undefined) {
        contractUpdateData.rentPrice = new Prisma.Decimal(dto.rentPrice)
      }
      if (dto.monthlyPaymentDate !== undefined) {
        contractUpdateData.monthlyPaymentDate = dto.monthlyPaymentDate
      }
      if (dto.endDate !== undefined) {
        contractUpdateData.endDate = new Date(dto.endDate)
      }
      if (dto.note !== undefined) {
        contractUpdateData.note = dto.note
      }

      await tx.contract.update({
        where: { id: contractId },
        data: contractUpdateData,
      })

      // 2. AuditLog for Contract update (Rule 4)
      await tx.auditLog.create({
        data: {
          action: 'update',
          entityType: 'CONTRACT',
          entityId: contractId,
          boardingHouseId,
          userId: landlordId,
          ipAddress: ipAddress || '127.0.0.1',
          oldValue: {
            rentPrice: Number(existingContract.rentPrice),
            monthlyPaymentDate: existingContract.monthlyPaymentDate,
            endDate: existingContract.endDate,
            note: existingContract.note,
          },
          newValue: {
            rentPrice: dto.rentPrice !== undefined ? dto.rentPrice : Number(existingContract.rentPrice),
            monthlyPaymentDate:
              dto.monthlyPaymentDate !== undefined
                ? dto.monthlyPaymentDate
                : existingContract.monthlyPaymentDate,
            endDate: dto.endDate !== undefined ? dto.endDate : existingContract.endDate,
            note: dto.note !== undefined ? dto.note : existingContract.note,
            reason: dto.reason,
          },
        },
      })

      // 3. Deposit update / creation if depositAmount is provided
      if (dto.depositAmount !== undefined) {
        if (existingContract.deposit) {
          if (Number(existingContract.deposit.amount) !== dto.depositAmount) {
            await tx.deposit.update({
              where: { id: existingContract.deposit.id },
              data: {
                amount: new Prisma.Decimal(dto.depositAmount),
              },
            })

            await tx.auditLog.create({
              data: {
                action: 'update',
                entityType: 'DEPOSIT',
                entityId: existingContract.deposit.id,
                boardingHouseId,
                userId: landlordId,
                ipAddress: ipAddress || '127.0.0.1',
                oldValue: {
                  amount: Number(existingContract.deposit.amount),
                },
                newValue: {
                  amount: dto.depositAmount,
                  reason: dto.reason,
                },
              },
            })
          }
        } else if (dto.depositAmount > 0) {
          const newDeposit = await tx.deposit.create({
            data: {
              contractId: existingContract.id,
              roomId: existingContract.roomId,
              boardingHouseId,
              type: 'contract',
              amount: new Prisma.Decimal(dto.depositAmount),
              status: 'paid',
              recordedManually: true,
              recordedBy: landlordId,
              note: `Deposit created during contract update: ${dto.reason}`,
            },
          })

          await tx.auditLog.create({
            data: {
              action: 'create',
              entityType: 'DEPOSIT',
              entityId: newDeposit.id,
              boardingHouseId,
              userId: landlordId,
              ipAddress: ipAddress || '127.0.0.1',
              newValue: {
                amount: Number(newDeposit.amount),
                type: newDeposit.type,
                status: newDeposit.status,
                reason: dto.reason,
              },
            },
          })
        }
      }
    })

    return this.getContractById(boardingHouseId, contractId)
  }

  // ─── UC-T-06: View Tenancy Details ──────────────────────────────────────────

  /**
   * Retrieves the full tenancy aggregate for the authenticated tenant:
   * active Contract + Room + BoardingHouse (basic info only, never financials)
   * + active RoomServices (fee structure) + BoardingHouse broadcast Announcements.
   *
   * @param userId Authenticated tenant's User ID
   * @returns TenancyDetailsDto or null if no active contract found
   */
  async getMyTenancyDetails(userId: string): Promise<TenancyDetailsDto | null> {
    const tenantContract = await this.prisma.tenantContract.findFirst({
      where: {
        tenantId: userId,
        contract: {
          status: 'active',
        },
      },
      include: {
        contract: {
          include: {
            deposit: true,
            contractDocuments: true,
            room: {
              include: {
                roomType: true,
                boardingHouse: {
                  include: {
                    owner: {
                      select: {
                        id: true,
                        username: true,
                        phoneNumber: true,
                        email: true,
                        userIdentification: {
                          select: {
                            fullName: true,
                          },
                        },
                      },
                    },
                  },
                },
                roomServices: {
                  where: {
                    service: {
                      status: 'active',
                    },
                  },
                  include: {
                    service: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    if (!tenantContract || !tenantContract.contract) {
      return null
    }

    const { contract } = tenantContract
    const { room } = contract
    const { boardingHouse } = room

    // Fetch broadcast announcements for this boarding house (receiverId IS NULL)
    const announcements = await this.prisma.notification.findMany({
      where: {
        boardingHouseId: boardingHouse.id,
        receiverId: null,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50,
    })

    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)

    const formattedAddress = this.formatAddress(boardingHouse)
    const landlordName =
      boardingHouse.owner.userIdentification?.fullName || boardingHouse.owner.username || 'Landlord'

    return {
      contract: {
        id: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentPrice: Number(contract.rentPrice),
        monthlyPaymentDate: contract.monthlyPaymentDate,
        depositAmount: contract.deposit
          ? Number(contract.deposit.amount)
          : Number(contract.rentPrice),
        note: contract.note || undefined,
        documents: contract.contractDocuments.map(doc => ({
          id: doc.id,
          url: doc.url,
          createdAt: doc.createdAt,
        })),
      },
      room: {
        id: room.id,
        roomNumber: room.roomNumber,
        floor: room.floor,
        area: room.area ? Number(room.area) : undefined,
        maxOccupants: room.maxOccupants ?? undefined,
        roomTypeName: room.roomType?.name,
      },
      boardingHouse: {
        id: boardingHouse.id,
        name: boardingHouse.name,
        address: formattedAddress,
        landlord: {
          name: landlordName,
          phoneNumber: boardingHouse.owner.phoneNumber || '',
          email: boardingHouse.owner.email || undefined,
        },
      },
      services: room.roomServices.map(rs => ({
        id: rs.service.id,
        name: rs.service.name,
        price: Number(rs.service.price),
        unit: rs.service.unit,
        isMetered: rs.service.isMetered,
      })),
      announcements: announcements.map(item => {
        let title = item.content.length > 40 ? `${item.content.slice(0, 40)}...` : item.content
        let content = item.content

        try {
          if (item.content.trim().startsWith('{')) {
            const parsed = JSON.parse(item.content)
            if (parsed.title) title = parsed.title
            if (parsed.content) content = parsed.content
          } else if (item.content.includes('\n')) {
            const lines = item.content.split('\n')
            title = lines[0]?.trim() || title
            content = lines.slice(1).join('\n').trim() || content
          }
        } catch {
          // Fallback to raw content
        }

        return {
          id: item.id,
          title,
          content,
          createdAt: item.createdAt,
          isNew: item.createdAt >= threeDaysAgo,
        }
      }),
    }
  }

  // ─── UC-T-01 Call-site ───────────────────────────────────────────────────────

  /**
   * UC-T-01 call-site: triggers onboarding notification after contract creation.
   *
   * Must be called OUTSIDE any active $transaction — the notification write
   * and BullMQ enqueue are independent operations.
   *
   * @param params sender/receiver/boardingHouse/contract context
   */
  async notifyContractCreated(params: {
    senderId: string
    receiverId: string
    boardingHouseId: string
    contractId: string
  }): Promise<void> {
    await this.notificationsService.createOnboardingNotification(params)
  }

  // ─── UC-L-15: Export Contracts ─────────────────────────────────────────────

  /**
   * Loads full aggregate data required to render the contract template.
   *
   * @param boardingHouseId Active Boarding House context
   * @param contractId Contract UUID
   * @returns Formatted ContractTemplateData
   */
  async getContractTemplateData(
    boardingHouseId: string,
    contractId: string,
  ): Promise<ContractTemplateData> {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        room: {
          boardingHouseId,
        },
      },
      include: {
        room: {
          include: {
            roomType: true,
            roomServices: {
              include: {
                service: true,
              },
            },
            boardingHouse: {
              include: {
                owner: true,
              },
            },
          },
        },
        tenantContracts: {
          include: {
            tenant: {
              include: {
                userIdentification: true,
              },
            },
          },
        },
        deposit: true,
        contractDocuments: true,
      },
    })

    if (!contract) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.CONTRACT_NOT_FOUND,
        'Contract does not exist or does not belong to this property.',
      )
    }

    const primaryTenantContract =
      contract.tenantContracts.find(tc => tc.isPrimary) || contract.tenantContracts[0]

    if (!primaryTenantContract) {
      throw new BadRequestException('Contract lacks primary tenant representation information.')
    }

    const primaryTenant = primaryTenantContract.tenant
    const coTenants = contract.tenantContracts
      .filter(tc => tc.id !== primaryTenantContract.id)
      .map(tc => ({
        id: tc.tenant.id,
        fullName: tc.tenant.userIdentification?.fullName || tc.tenant.username || 'Co-tenant',
        phoneNumber: tc.tenant.phoneNumber,
      }))

    const bh = contract.room.boardingHouse
    const formattedAddress = this.formatAddress(bh)

    return {
      contract: {
        id: contract.id,
        startDate: contract.startDate,
        endDate: contract.endDate,
        rentPrice: Number(contract.rentPrice),
        monthlyPaymentDate: contract.monthlyPaymentDate,
        rentPaymentCycle: 1,
        status: contract.status,
        note: contract.note,
        createdAt: contract.createdAt,
      },
      boardingHouse: {
        id: bh.id,
        name: bh.name,
        address: formattedAddress,
        owner: {
          id: bh.owner.id,
          fullName: bh.owner.username || 'Landlord',
          phoneNumber: bh.owner.phoneNumber || '',
          email: bh.owner.email,
        },
      },
      room: {
        id: contract.room.id,
        roomNumber: contract.room.roomNumber,
        floor: contract.room.floor,
        area: contract.room.area ? Number(contract.room.area) : null,
        maxOccupants: contract.room.maxOccupants,
        roomTypeName: contract.room.roomType?.name,
        services: contract.room.roomServices.map(rs => ({
          name: rs.service.name,
          price: Number(rs.service.price),
          unit: rs.service.unit,
          isMetered: rs.service.isMetered,
        })),
      },
      primaryTenant: {
        id: primaryTenant.id,
        fullName:
          primaryTenant.userIdentification?.fullName || primaryTenant.username || 'Tenant',
        phoneNumber: primaryTenant.phoneNumber,
        email: primaryTenant.email,
        identification: primaryTenant.userIdentification
          ? {
              identityNumber: primaryTenant.userIdentification.identityNumber,
              dateOfBirth: primaryTenant.userIdentification.dateOfBirth,
              gender: primaryTenant.userIdentification.gender,
              placeOfOrigin:
                typeof primaryTenant.userIdentification.placeOfOrigin === 'string'
                  ? primaryTenant.userIdentification.placeOfOrigin
                  : primaryTenant.userIdentification.placeOfOrigin
                    ? primaryTenant.userIdentification.placeOfOrigin
                    : null,
              placeOfResidence:
                typeof primaryTenant.userIdentification.placeOfResidence === 'string'
                  ? primaryTenant.userIdentification.placeOfResidence
                  : primaryTenant.userIdentification.placeOfResidence
                    ? primaryTenant.userIdentification.placeOfResidence
                    : null,
              issueDate: primaryTenant.userIdentification.issueDate,
            }
          : null,
      },
      coTenants,
      deposit: contract.deposit
        ? {
            amount: Number(contract.deposit.amount),
            status: contract.deposit.status,
            type: contract.deposit.type,
            paidAt: contract.deposit.createdAt,
          }
        : null,
    }
  }

  /**
   * Generates the rendered HTML string for direct print or browser display.
   *
   * @param boardingHouseId Active Boarding House context
   * @param contractId Contract UUID
   * @param autoPrint If true, includes auto-print JavaScript hook
   * @param includeToolbar If true, includes interactive print/save toolbar
   * @returns Complete HTML markup
   */
  async getContractPrintHtml(
    boardingHouseId: string,
    contractId: string,
    autoPrint: boolean = false,
    includeToolbar: boolean = true,
  ): Promise<string> {
    const templateData = await this.getContractTemplateData(boardingHouseId, contractId)
    return ContractTemplateRenderer.render({
      ...templateData,
      options: {
        autoPrint,
        includeToolbar,
      },
    })
  }

  /**
   * Exports contract: renders the contract template, creates a ContractDocument entry,
   * writes an AuditLog, and returns document access metadata.
   *
   * @param boardingHouseId Active Boarding House context
   * @param contractId Target contract ID
   * @param landlordId Landlord performing export
   * @returns Exported document response metadata
   */
  async exportContract(
    boardingHouseId: string,
    contractId: string,
    landlordId: string,
  ): Promise<ExportContractResponseDto> {
    const templateData = await this.getContractTemplateData(boardingHouseId, contractId)

    const renderedHtml = ContractTemplateRenderer.render({
      ...templateData,
      options: {
        autoPrint: false,
        includeToolbar: true,
      },
    })

    const docStoragePath = `contracts/${contractId}/export_${Date.now()}.html`

    const [document] = await this.prisma.$transaction(async tx => {
      const doc = await tx.contractDocument.create({
        data: {
          contractId,
          url: docStoragePath,
        },
      })

      await tx.auditLog.create({
        data: {
          action: 'create',
          entityType: 'CONTRACT',
          entityId: contractId,
          boardingHouseId,
          userId: landlordId,
          ipAddress: '127.0.0.1',
          newValue: {
            documentId: doc.id,
            url: doc.url,
            exportedAt: doc.createdAt,
          },
        },
      })

      return [doc]
    })

    return {
      documentId: document.id,
      contractId,
      url: document.url,
      downloadUrl: `/api/v1/landlord/contracts/${contractId}/documents/${document.id}/download`,
      printUrl: `/api/v1/landlord/contracts/${contractId}/print?autoPrint=true`,
      createdAt: document.createdAt,
      html: renderedHtml,
    }
  }

  /**
   * Retrieves list of all ContractDocuments generated for a contract.
   *
   * @param boardingHouseId Active Boarding House context
   * @param contractId Contract UUID
   */
  async getContractDocuments(boardingHouseId: string, contractId: string) {
    const contract = await this.prisma.contract.findFirst({
      where: {
        id: contractId,
        room: {
          boardingHouseId,
        },
      },
      select: {
        id: true,
      },
    })

    if (!contract) {
      throw new BusinessNotFoundException(
        BusinessErrorCode.CONTRACT_NOT_FOUND,
        'Contract does not exist or does not belong to this property.',
      )
    }

    const docs = await this.prisma.contractDocument.findMany({
      where: { contractId },
      orderBy: { createdAt: 'desc' },
    })

    return docs.map(d => ({
      id: d.id,
      contractId: d.contractId,
      url: d.url,
      downloadUrl: `/api/v1/landlord/contracts/${contractId}/documents/${d.id}/download`,
      printUrl: `/api/v1/landlord/contracts/${contractId}/print?autoPrint=true`,
      createdAt: d.createdAt,
    }))
  }

  /**
   * Provides the download payload for a specific contract document.
   *
   * @param boardingHouseId Active Boarding House context
   * @param contractId Contract UUID
   * @param documentId Contract document UUID
   */
  async getContractDocumentDownload(
    boardingHouseId: string,
    contractId: string,
    documentId: string,
  ): Promise<{ filename: string; html: string }> {
    const templateData = await this.getContractTemplateData(boardingHouseId, contractId)

    const doc = await this.prisma.contractDocument.findFirst({
      where: {
        id: documentId,
        contractId,
      },
    })

    if (!doc) {
      throw new NotFoundException('Contract document does not exist.')
    }

    const renderedHtml = ContractTemplateRenderer.render({
      ...templateData,
      options: {
        autoPrint: false,
        includeToolbar: false,
      },
    })

    const roomNumber = templateData.room.roomNumber.replace(/[^a-zA-Z0-9_-]/g, '_')
    const filename = `Hop-dong-phong-${roomNumber}-${contractId.substring(0, 8)}.html`

    return {
      filename,
      html: renderedHtml,
    }
  }

  // ─── Helper methods ─────────────────────────────────────────────────────────

  private formatAddress(bh: {
    houseNumber?: string | null
    street?: string | null
    ward?: string | null
    district?: string | null
    city?: string | null
    province?: string | null
  }): string {
    const parts = [
      bh.houseNumber ? `${bh.houseNumber} ${bh.street || ''}`.trim() : bh.street,
      bh.ward,
      bh.district,
      bh.city || bh.province,
    ].filter(Boolean)

    return parts.join(', ')
  }
}
