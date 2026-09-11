import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpsertUserIdentificationDto } from './dto/upsert-user-identification.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly prisma: PrismaService) {}

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
        cardFrontUrl: dto.cardFrontUrl?.trim() || '',
        cardBackUrl: dto.cardBackUrl?.trim() || '',
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
        cardFrontUrl: dto.cardFrontUrl?.trim() || '',
        cardBackUrl: dto.cardBackUrl?.trim() || '',
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
}
