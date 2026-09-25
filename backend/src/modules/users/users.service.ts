import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpsertUserIdentificationDto } from './dto/upsert-user-identification.dto';
import { UpsertBankAccountDto } from './dto/upsert-bank-account.dto';
import { UserCapabilitiesResponseDto } from './dto/user-capabilities.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly uploadService: UploadService,
  ) {}

  /**
   * Returns the live multi-role capabilities of a user.
   *
   * Per spec (07-auth_roles.md): `User.role` is only a "highest-achieved display
   * marker" — NOT the source of truth for authorization. Actual capability is
   * determined by querying the relevant relationship tables:
   *   - isLandlord  → owns ≥1 BoardingHouse
   *   - isTenant    → has ≥1 active TenantContract (via Contract.status)
   *   - isEmployee  → has ≥1 active EmployeeAssignment
   *   - isAdmin     → user.role === 'admin' (the one case the flat field IS authoritative)
   */
  async getCapabilities(userId: string): Promise<UserCapabilitiesResponseDto> {
    this.logger.log(`Fetching capabilities for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Run all three relationship count queries in parallel for efficiency
    const [boardingHouseCount, activeTenantContractCount, activeEmployeeAssignmentCount] =
      await Promise.all([
        // isLandlord: owns at least one boarding house
        this.prisma.boardingHouse.count({
          where: { ownerId: userId },
        }),

        // isTenant: has at least one active tenant contract
        this.prisma.tenantContract.count({
          where: {
            tenantId: userId,
            contract: { status: 'active' },
          },
        }),

        // isEmployee: has at least one active employee assignment
        this.prisma.employeeAssignment.count({
          where: {
            employee: { userId },
            status: 'active',
          },
        }),
      ]);

    return {
      role: user.role,
      capabilities: {
        isLandlord: boardingHouseCount > 0,
        isTenant: activeTenantContractCount > 0,
        isEmployee: activeEmployeeAssignmentCount > 0,
        isAdmin: user.role === 'admin',
      },
    };
  }

  /**
   * Retrieves identity verification details for the given user.
   */
  async getIdentification(userId: string) {
    this.logger.log(`Fetching identification for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userIdentification: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    return {
      hasIdentification: !!user.userIdentification,
      identification: user.userIdentification || null,
    };
  }

  /**
   * Creates or updates UserIdentification (identity verification gate).
   * Ensures identityNumber (CCCD) is not registered by another user.
   */
  async upsertIdentification(userId: string, dto: UpsertUserIdentificationDto) {
    this.logger.log(
      `Upserting identification for user ${userId} (identityNumber: ${dto.identityNumber})`,
    );

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { userIdentification: true },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    // Check if another user already registered this identityNumber
    const existingWithNumber = await this.prisma.userIdentification.findUnique({
      where: { identityNumber: dto.identityNumber },
    });

    if (existingWithNumber && existingWithNumber.userId !== userId) {
      throw new ConflictException(
        'Số căn cước công dân (CCCD) này đã được đăng ký bởi tài khoản khác.',
      );
    }

    const placeOfOrigin =
      typeof dto.placeOfOrigin === 'string'
        ? { address: dto.placeOfOrigin }
        : dto.placeOfOrigin || {};

    const placeOfResidence =
      typeof dto.placeOfResidence === 'string'
        ? { address: dto.placeOfResidence }
        : dto.placeOfResidence || {};

    const issueDate = dto.issueDate ? new Date(dto.issueDate) : new Date();
    const expiryDate = dto.expiryDate
      ? new Date(dto.expiryDate)
      : new Date(Date.now() + 10 * 365 * 24 * 3600 * 1000);

    const frontUrl = await this.uploadService.ensureCloudinaryUrl(
      dto.cardFrontUrl,
      'dormio/identifications',
    );
    const backUrl = await this.uploadService.ensureCloudinaryUrl(
      dto.cardBackUrl,
      'dormio/identifications',
    );

    const saved = await this.prisma.userIdentification.upsert({
      where: { userId },
      create: {
        userId,
        identityNumber: dto.identityNumber,
        fullName: dto.fullName.trim(),
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        nationnality: dto.nationality?.trim() || 'Việt Nam',
        placeOfOrigin,
        placeOfResidence,
        issueDate,
        expiryDate,
        personalIdentification: randomUUID(),
        note: dto.note?.trim() || '',
        cardFrontUrl: frontUrl?.trim() || '',
        cardBackUrl: backUrl?.trim() || '',
      },
      update: {
        identityNumber: dto.identityNumber,
        fullName: dto.fullName.trim(),
        dateOfBirth: new Date(dto.dateOfBirth),
        gender: dto.gender,
        nationnality: dto.nationality?.trim() || 'Việt Nam',
        placeOfOrigin,
        placeOfResidence,
        issueDate,
        expiryDate,
        note: dto.note?.trim() || '',
        cardFrontUrl: frontUrl?.trim() || '',
        cardBackUrl: backUrl?.trim() || '',
      },
    });

    this.logger.log(
      `Successfully saved identification ${saved.id} for user ${userId}`,
    );

    return {
      hasIdentification: true,
      identification: saved,
    };
  }

  /**
   * Retrieves bank account information for the given user.
   */
  async getBankAccount(userId: string) {
    this.logger.log(`Fetching bank account for user ${userId}`);

    const bankAccount = await this.prisma.bankAccount.findUnique({
      where: { userId },
    });

    return {
      hasBankAccount: !!bankAccount,
      bankAccount: bankAccount || null,
    };
  }

  /**
   * Creates or updates BankAccount for the given user.
   */
  async upsertBankAccount(userId: string, dto: UpsertBankAccountDto) {
    this.logger.log(`Upserting bank account for user ${userId}`);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const saved = await this.prisma.bankAccount.upsert({
      where: { userId },
      create: {
        userId,
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim().toUpperCase(),
      },
      update: {
        bankName: dto.bankName.trim(),
        accountNumber: dto.accountNumber.trim(),
        accountName: dto.accountName.trim().toUpperCase(),
      },
    });

    this.logger.log(
      `Successfully saved bank account ${saved.id} for user ${userId}`,
    );

    return {
      hasBankAccount: true,
      bankAccount: saved,
    };
  }
}
