import { api } from './api';

export interface VietQrInstruction {
  invoiceId: string;
  amount: number;
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  transferSyntax: string;
  qrCodeUrl: string;
  period: string;
  roomNumber: string;
  boardingHouseName: string;
  dueDate: string;
}

export interface ConfirmPaymentPayload {
  invoiceId: string;
  amount?: number;
  transactionRef?: string;
  method?: 'banking' | 'cash';
}

export interface PaymentExecutionResult {
  success: boolean;
  paymentId: string;
  invoiceId: string;
  receiptNumber: string;
  invoiceStatus: string;
  paidAt: string;
  message: string;
}

export interface InvoicePayOsCheckoutResponse {
  orderCode: number;
  paymentLinkId: string;
  checkoutUrl: string;
  qrCode: string;
  accountNumber: string;
  accountName: string;
  bin: string;
  amount: number;
  description: string;
  expiresIn: number;
  invoiceId: string;
  isReused?: boolean;
}

export interface InvoicePaymentStatusResponse {
  orderCode: number;
  status: string;
  isPaid: boolean;
  invoiceId?: string;
  paidAt?: string;
}

export const paymentService = {
  /**
   * Get VietQR instruction for invoice
   */
  async getVietQrInstruction(invoiceId: string): Promise<VietQrInstruction> {
    const res = await api.get<{ success: boolean; data: VietQrInstruction } | VietQrInstruction>(
      `/v1/tenant/payments/instruction/${invoiceId}`,
    );
    if ('data' in res && res.data) {
      return res.data;
    }
    return res as VietQrInstruction;
  },

  /**
   * Create or resume 15-minute PayOS checkout session for invoice
   */
  async createInvoicePayOsCheckout(
    invoiceId: string,
  ): Promise<InvoicePayOsCheckoutResponse> {
    const res = await api.post<{
      success: boolean;
      data: InvoicePayOsCheckoutResponse;
    } | InvoicePayOsCheckoutResponse>(
      `/v1/tenant/payments/payos-checkout/${invoiceId}`,
      {},
    );
    if ('data' in res && res.data) {
      return res.data;
    }
    return res as InvoicePayOsCheckoutResponse;
  },

  /**
   * Check payment status by PayOS orderCode (polling)
   */
  async getInvoicePaymentStatus(
    orderCode: number,
  ): Promise<InvoicePaymentStatusResponse> {
    const res = await api.get<{
      success: boolean;
      data: InvoicePaymentStatusResponse;
    } | InvoicePaymentStatusResponse>(
      `/v1/tenant/payments/order-status/${orderCode}`,
    );
    if ('data' in res && res.data) {
      return res.data;
    }
    return res as InvoicePaymentStatusResponse;
  },

  /**
   * Confirm / execute payment for invoice
   */
  async confirmPayment(
    payload: ConfirmPaymentPayload,
  ): Promise<PaymentExecutionResult> {
    const res = await api.post<{ success: boolean; data: PaymentExecutionResult } | PaymentExecutionResult>(
      '/v1/tenant/payments/confirm',
      payload,
    );
    if ('data' in res && res.data) {
      return res.data;
    }
    return res as PaymentExecutionResult;
  },
};
