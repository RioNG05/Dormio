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

export const paymentService = {
  /**
   * Get VietQR instruction for invoice (UC-T-04)
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
   * Confirm / execute payment for invoice (UC-T-04)
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
