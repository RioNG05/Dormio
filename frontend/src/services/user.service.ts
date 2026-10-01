import { api } from "./api";

export interface UserIdentification {
  id?: string;
  identityNumber: string;
  fullName: string;
  dateOfBirth: string;
  gender: "male" | "female";
  nationality?: string;
  placeOfOrigin?: string | any;
  placeOfResidence?: string | any;
  issueDate?: string;
  expiryDate?: string;
  cardFrontUrl?: string;
  cardBackUrl?: string;
  note?: string;
  isVerified?: boolean;
}

export interface UserIdentificationResponse {
  hasIdentification: boolean;
  userIdentification?: UserIdentification | null;
  identification?: UserIdentification | null;
}

export interface BankAccount {
  id?: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
}

export interface BankAccountResponse {
  hasBankAccount: boolean;
  bankAccount?: BankAccount | null;
}

export const userService = {
  /**
   * Check identity verification status of authenticated user
   */
  async getIdentification(): Promise<UserIdentificationResponse> {
    const res = await api.get<any>("/v1/users/identification");
    const data = res?.data ?? res;
    const idData = data?.userIdentification ?? data?.identification ?? null;
    return {
      hasIdentification: data?.hasIdentification ?? !!idData,
      userIdentification: idData,
      identification: idData,
    };
  },

  /**
   * Complete identity verification (CCCD 12 digits, full name, dates)
   */
  async upsertIdentification(data: Partial<UserIdentification>): Promise<UserIdentification> {
    const res = await api.post<any>("/v1/users/identification", data);
    const resData = res?.data ?? res;
    return resData?.identification ?? resData?.userIdentification ?? resData;
  },

  /**
   * Get bank account info for authenticated user
   */
  async getBankAccount(): Promise<BankAccountResponse> {
    const res = await api.get<any>("/v1/users/bank-account");
    const data = res?.data ?? res;
    return {
      hasBankAccount: data?.hasBankAccount ?? !!data?.bankAccount,
      bankAccount: data?.bankAccount ?? null,
    };
  },

  /**
   * Save or update bank account info for authenticated user
   */
  async upsertBankAccount(data: BankAccount): Promise<BankAccountResponse> {
    const res = await api.post<any>("/v1/users/bank-account", data);
    const resData = res?.data ?? res;
    return {
      hasBankAccount: resData?.hasBankAccount ?? !!resData?.bankAccount,
      bankAccount: resData?.bankAccount ?? null,
    };
  },
};
