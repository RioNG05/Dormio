import { api } from './api';

export interface SubscriptionPlanItem {
  planName: 'free' | 'plus' | 'pro';
  priceMonthly: number;
  priceQuarterly?: number;
  priceYearly: number;
  maxRoom: number;
  dailyPostQuote: number;
  description?: string;
  features: string[];
}

export interface TierStatusResponse {
  planName: string;
  hasActiveSameTier: boolean;
  currentEndDate: string | null;
  effectiveStartDate: string;
}

export interface SubscriptionCheckoutResponse {
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
  startDate: string;
  endDate: string;
  planName: string;
  billingCycle: string;
  isReused?: boolean;
}

export interface OrderStatusResponse {
  orderCode: number;
  status: string;
  isPaid: boolean;
  paidAt?: string;
}

export const subscriptionService = {
  async getPlans(): Promise<SubscriptionPlanItem[]> {
    const res = await api.get<any>('/v1/landlord/subscriptions/plans');
    return res?.data || res || [];
  },

  async getTierStatus(planName: string): Promise<TierStatusResponse> {
    const res = await api.get<any>(`/v1/landlord/subscriptions/tier-status/${planName}`);
    return res?.data || res;
  },

  async createCheckout(
    planName: string,
    billingCycle: 'monthly' | 'quarterly' | 'yearly',
  ): Promise<SubscriptionCheckoutResponse> {
    const res = await api.post<any>('/v1/landlord/subscriptions/checkout', {
      planName,
      billingCycle,
    });
    return res?.data || res;
  },

  async getOrderStatus(orderCode: number): Promise<OrderStatusResponse> {
    const res = await api.get<any>(`/v1/landlord/subscriptions/order-status/${orderCode}`);
    return res?.data || res;
  },
};
