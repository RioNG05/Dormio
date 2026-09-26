import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { PayOsService } from '../payments/payos.service';
import {
  CheckoutSubscriptionDto,
  CheckoutPlanTier,
  CheckoutBillingCycle,
} from './dto/checkout-subscription.dto';
import { TierStatusResponseDto } from './dto/tier-status-response.dto';
import { SubscriptionCheckoutResponseDto } from './dto/subscription-checkout-response.dto';
import { SubscriptionPlanItemDto } from './dto/subscription-plan-response.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly payOsService: PayOsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get all subscription plans with pricing and feature matrix
   */
  async getPlans(): Promise<SubscriptionPlanItemDto[]> {
    this.logger.log('Fetching all subscription plans');

    const plans = await this.prisma.subscriptionPlan.findMany({
      orderBy: { priceMonthly: 'asc' },
    });

    const defaultFeatures: Record<string, string[]> = {
      free: [
        'Quản lý tối đa 5 phòng',
        '1 lượt đăng tin / ngày',
        'Quản lý hợp đồng & hóa đơn cơ bản',
        'Hỗ trợ qua trung tâm trợ giúp',
      ],
      plus: [
        'Quản lý tối đa 30 phòng',
        '5 lượt đăng tin / ngày',
        'Báo cáo doanh thu & công nợ chuyên sâu',
        'Phân quyền nhân viên & lịch làm việc',
        'Tính toán tiền điện nước tự động',
      ],
      pro: [
        'Quản lý tối đa 100 phòng',
        '20 lượt đăng tin VIP / ngày',
        'Toàn bộ tính năng cao cấp không giới hạn',
        'Hỗ trợ ưu tiên 24/7 từ chuyên viên Dormio',
        'Tùy chỉnh biểu mẫu hợp đồng riêng biệt',
      ],
    };

    return plans.map((p) => ({
      planName: p.planName,
      priceMonthly: Number(p.priceMonthly),
      priceQuarterly: p.priceQuarterly ? Number(p.priceQuarterly) : undefined,
      priceYearly: Number(p.priceYearly),
      maxRoom: p.maxRoom,
      dailyPostQuote: p.dailyPostQuote,
      description: p.description || undefined,
      features: defaultFeatures[p.planName] || [],
    }));
  }

  /**
   * UC Edge Case: Check current active tier status for consecutive extension
   */
  async getTierStatus(
    userId: string,
    planName: string,
  ): Promise<TierStatusResponseDto> {
    this.logger.log(
      `Checking current active tier status for user ${userId}, plan ${planName}`,
    );

    const now = new Date();
    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        planName: planName as any,
        status: 'active',
        endDate: { gt: now },
      },
      orderBy: { endDate: 'desc' },
    });

    if (activeSub) {
      // Calculate effective start date right after current expiration
      const nextStart = new Date(activeSub.endDate);
      nextStart.setSeconds(nextStart.getSeconds() + 1);

      return {
        planName,
        hasActiveSameTier: true,
        currentEndDate: activeSub.endDate.toISOString(),
        effectiveStartDate: nextStart.toISOString(),
      };
    }

    return {
      planName,
      hasActiveSameTier: false,
      currentEndDate: null,
      effectiveStartDate: now.toISOString(),
    };
  }

  /**
   * Create or reuse idempotent PayOS checkout session for Landlord Subscription
   */
  async createCheckout(
    userId: string,
    dto: CheckoutSubscriptionDto,
  ): Promise<SubscriptionCheckoutResponseDto> {
    this.logger.log(
      `Initiating subscription checkout for user ${userId}: ${dto.planName} (${dto.billingCycle})`,
    );

    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { planName: dto.planName as any },
    });

    if (!plan) {
      throw new NotFoundException(`Gói ${dto.planName} không tồn tại.`);
    }

    // Calculate price based on cycle
    let amount = 0;
    if (dto.billingCycle === CheckoutBillingCycle.MONTHLY) {
      amount = Number(plan.priceMonthly);
    } else if (dto.billingCycle === CheckoutBillingCycle.QUARTERLY) {
      amount = plan.priceQuarterly
        ? Number(plan.priceQuarterly)
        : Math.round(Number(plan.priceMonthly) * 3 * 0.9); // 10% discount fallback
    } else if (dto.billingCycle === CheckoutBillingCycle.YEARLY) {
      amount = Number(plan.priceYearly);
    }

    if (amount <= 0) {
      throw new BadRequestException('Số tiền thanh toán gói không hợp lệ.');
    }

    const now = new Date();
    const fifteenMinsAgo = new Date(now.getTime() - 15 * 60 * 1000);

    // 1. Check for reusable pending payment session (< 15 mins)
    const existingPendingPayment = await this.prisma.payment.findFirst({
      where: {
        payerId: userId,
        status: 'pending',
        createdAt: { gte: fifteenMinsAgo },
        subscription: {
          planName: dto.planName as any,
          billingCycle: dto.billingCycle as any,
          status: 'pending',
        },
      },
      include: {
        subscription: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (
      existingPendingPayment &&
      existingPendingPayment.orderCode &&
      existingPendingPayment.qrCodeUrl &&
      existingPendingPayment.subscription
    ) {
      const elapsedMs = now.getTime() - existingPendingPayment.createdAt.getTime();
      const remainingSecs = Math.max(30, Math.floor((15 * 60 * 1000 - elapsedMs) / 1000));

      this.logger.log(
        `Reusing existing pending payment session (OrderCode: ${existingPendingPayment.orderCode}) for user ${userId}`,
      );

      let bin = '970422';
      let accountNumber = '0912345678';
      let accountName = 'DORMIO MANAGEMENT';
      let checkoutUrl = existingPendingPayment.qrCodeUrl.startsWith('http')
        ? existingPendingPayment.qrCodeUrl
        : '';

      try {
        const linkInfo = await this.payOsService.getPaymentLinkInformation(
          Number(existingPendingPayment.orderCode),
        );
        if (linkInfo) {
          bin = linkInfo.bin || bin;
          accountNumber = linkInfo.accountNumber || accountNumber;
          accountName = linkInfo.accountName || accountName;
          checkoutUrl = linkInfo.checkoutUrl || checkoutUrl;
        }
      } catch (err: any) {
        this.logger.warn(
          `Could not fetch PayOS link info for order ${existingPendingPayment.orderCode}: ${err.message}`,
        );
      }

      return {
        orderCode: Number(existingPendingPayment.orderCode),
        paymentLinkId: existingPendingPayment.paymentLinkId || `link-${existingPendingPayment.orderCode}`,
        checkoutUrl,
        qrCode: existingPendingPayment.qrCodeUrl,
        accountNumber,
        accountName,
        bin,
        amount: Number(existingPendingPayment.amount),
        description: `SUB ${dto.planName.toUpperCase()} ${Number(existingPendingPayment.orderCode) % 10000}`,
        expiresIn: remainingSecs,
        startDate: existingPendingPayment.subscription.startDate.toISOString(),
        endDate: existingPendingPayment.subscription.endDate.toISOString(),
        planName: dto.planName,
        billingCycle: dto.billingCycle,
        isReused: true,
      };
    }

    // 2. Calculate consecutive subscription dates
    const activeSub = await this.prisma.userSubscription.findFirst({
      where: {
        userId,
        planName: dto.planName as any,
        status: 'active',
        endDate: { gt: now },
      },
      orderBy: { endDate: 'desc' },
    });

    let startDate: Date;
    if (activeSub) {
      startDate = new Date(activeSub.endDate);
      startDate.setSeconds(startDate.getSeconds() + 1);
    } else {
      startDate = new Date(now);
    }

    const endDate = new Date(startDate);
    if (dto.billingCycle === CheckoutBillingCycle.MONTHLY) {
      endDate.setMonth(endDate.getMonth() + 1);
    } else if (dto.billingCycle === CheckoutBillingCycle.QUARTERLY) {
      endDate.setMonth(endDate.getMonth() + 3);
    } else if (dto.billingCycle === CheckoutBillingCycle.YEARLY) {
      endDate.setFullYear(endDate.getFullYear() + 1);
    }

    // 3. Generate unique numeric order code (e.g. 11 digits timestamp + random)
    const orderCode = Number(
      `${Date.now().toString().slice(-8)}${Math.floor(100 + Math.random() * 900)}`,
    );

    const appUrl =
      this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const description = `SUB ${dto.planName.toUpperCase()} ${orderCode % 10000}`;
    const cancelUrl = `${appUrl}/pricing/${dto.planName}?canceled=true`;
    const returnUrl = `${appUrl}/pricing/${dto.planName}?success=true&orderCode=${orderCode}`;

    // 4. Call PayOS to create payment link
    const linkResult = await this.payOsService.createPaymentLink({
      orderCode,
      amount,
      description,
      cancelUrl,
      returnUrl,
      items: [
        {
          name: `Dormio ${dto.planName.toUpperCase()} (${dto.billingCycle})`,
          quantity: 1,
          price: amount,
        },
      ],
      expiredAt: Math.floor(now.getTime() / 1000) + 15 * 60,
    });

    // 5. Store pending Subscription & Payment in DB
    await this.prisma.$transaction(async (tx) => {
      const newSub = await tx.userSubscription.create({
        data: {
          userId,
          planName: dto.planName as any,
          startDate,
          endDate,
          billingCycle: dto.billingCycle as any,
          price: amount,
          status: 'pending',
        },
      });

      await tx.payment.create({
        data: {
          payerId: userId,
          subscriptionId: newSub.id,
          type: 'charge',
          amount,
          method: 'banking',
          status: 'pending',
          orderCode: BigInt(orderCode),
          paymentLinkId: linkResult.paymentLinkId,
          qrCodeUrl: linkResult.qrCode,
        },
      });
    });

    return {
      orderCode,
      paymentLinkId: linkResult.paymentLinkId,
      checkoutUrl: linkResult.checkoutUrl,
      qrCode: linkResult.qrCode,
      accountNumber: linkResult.accountNumber,
      accountName: linkResult.accountName,
      bin: linkResult.bin,
      amount,
      description,
      expiresIn: 900,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      planName: dto.planName,
      billingCycle: dto.billingCycle,
      isReused: false,
    };
  }

  /**
   * Check order status for polling fallback
   */
  async getOrderStatus(
    userId: string,
    orderCode: number,
  ): Promise<{
    orderCode: number;
    status: string;
    isPaid: boolean;
    paidAt?: string;
  }> {
    const payment = await this.prisma.payment.findFirst({
      where: {
        orderCode: BigInt(orderCode),
        payerId: userId,
      },
    });

    if (!payment) {
      throw new NotFoundException('Không tìm thấy giao dịch thanh toán.');
    }

    return {
      orderCode,
      status: payment.status,
      isPaid: payment.status === 'success',
      paidAt: payment.paidAt ? payment.paidAt.toISOString() : undefined,
    };
  }
}
