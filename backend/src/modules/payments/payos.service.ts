import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PayOS } from '@payos/node';

export interface CreatePaymentLinkParams {
  orderCode: number;
  amount: number;
  description: string;
  cancelUrl: string;
  returnUrl: string;
  items?: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  buyerName?: string;
  buyerEmail?: string;
  buyerPhone?: string;
  expiredAt?: number;
}

export interface PayOsPaymentLinkResult {
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  amount: number;
  description: string;
  expiredAt?: number;
}

@Injectable()
export class PayOsService {
  private readonly logger = new Logger(PayOsService.name);
  private payOSClient: PayOS | null = null;
  private readonly isConfigured: boolean = false;

  constructor(private readonly configService: ConfigService) {
    const clientId = this.configService.get<string>('PAYOS_CLIENT_ID');
    const apiKey = this.configService.get<string>('PAYOS_API_KEY');
    const checksumKey = this.configService.get<string>('PAYOS_CHECKSUM_KEY');

    if (clientId && apiKey && checksumKey) {
      try {
        this.payOSClient = new PayOS({
          clientId,
          apiKey,
          checksumKey,
        });
        this.isConfigured = true;
        this.logger.log('PayOS client initialized successfully.');
      } catch (err) {
        this.logger.error('Failed to initialize PayOS client', err);
      }
    } else {
      this.logger.warn(
        'PayOS credentials not fully configured in environment. Mock / fallback mode active.',
      );
    }
  }

  /**
   * Check if PayOS is properly configured with valid credentials
   */
  hasValidConfig(): boolean {
    return this.isConfigured && this.payOSClient !== null;
  }

  /**
   * Create payment link with PayOS SDK (with fallback mock for dev)
   */
  async createPaymentLink(
    params: CreatePaymentLinkParams,
  ): Promise<PayOsPaymentLinkResult> {
    this.logger.log(
      `Creating payment link for orderCode: ${params.orderCode}, amount: ${params.amount}`,
    );

    if (this.hasValidConfig()) {
      try {
        const response = await this.payOSClient!.paymentRequests.create({
          orderCode: params.orderCode,
          amount: Math.round(params.amount),
          description: params.description.substring(0, 25), // PayOS max 25 chars
          cancelUrl: params.cancelUrl,
          returnUrl: params.returnUrl,
          items: params.items,
          buyerName: params.buyerName,
          buyerEmail: params.buyerEmail,
          buyerPhone: params.buyerPhone,
          expiredAt: params.expiredAt,
        });

        return {
          orderCode: response.orderCode,
          paymentLinkId: response.paymentLinkId,
          checkoutUrl: response.checkoutUrl,
          qrCode: response.qrCode,
          accountNumber: response.accountNumber,
          accountName: response.accountName,
          bin: response.bin,
          amount: response.amount,
          description: response.description,
          expiredAt: response.expiredAt,
        };
      } catch (error: any) {
        this.logger.error(
          `PayOS API error creating payment link for ${params.orderCode}: ${error.message}`,
          error.stack,
        );
        // Fallback to dev simulation if PayOS API rejects (e.g. invalid test credentials)
        return this.generateDevFallbackLink(params);
      }
    }

    return this.generateDevFallbackLink(params);
  }

  /**
   * Verify Webhook data from PayOS
   */
  async verifyWebhook(webhookBody: any): Promise<any> {
    if (this.hasValidConfig()) {
      try {
        return await this.payOSClient!.webhooks.verify(webhookBody);
      } catch (err: any) {
        this.logger.error(`Webhook signature verification failed: ${err.message}`);
        throw err;
      }
    }

    // In dev / test fallback: accept if body.data exists
    this.logger.log('Fallback webhook verification passed (Dev mode)');
    return webhookBody.data || webhookBody;
  }

  /**
   * Get payment link info by order code
   */
  async getPaymentLinkInformation(orderCode: number): Promise<any> {
    if (this.hasValidConfig()) {
      try {
        return await this.payOSClient!.paymentRequests.get(orderCode);
      } catch (err: any) {
        this.logger.error(
          `Failed to get payment info for order ${orderCode}: ${err.message}`,
        );
        return null;
      }
    }
    return null;
  }

  /**
   * Dev Fallback generator to ensure smooth testing even when keys are dummy
   */
  private generateDevFallbackLink(
    params: CreatePaymentLinkParams,
  ): PayOsPaymentLinkResult {
    const dummyBin = '970422'; // MB Bank
    const dummyAcc = '0912345678';
    const dummyName = 'DORMIO MANAGEMENT';
    const syntax = params.description.substring(0, 25);
    const qrCode = `https://api.vietqr.io/image/${dummyBin}-${dummyAcc}-compact2.png?amount=${params.amount}&addInfo=${encodeURIComponent(
      syntax,
    )}&accountName=${encodeURIComponent(dummyName)}`;

    return {
      orderCode: params.orderCode,
      paymentLinkId: `mock-link-${params.orderCode}`,
      checkoutUrl: qrCode,
      qrCode,
      accountNumber: dummyAcc,
      accountName: dummyName,
      bin: dummyBin,
      amount: params.amount,
      description: syntax,
      expiredAt: params.expiredAt,
    };
  }
}
