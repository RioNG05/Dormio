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

export const userService = {
  /**
   * UC-PU-04 Step 1: Check identity verification status of authenticated user
   */
  async getIdentification(): Promise<UserIdentificationResponse> {
    const res = await api.get<UserIdentificationResponse>("/v1/users/identification");
    const idData = res?.userIdentification ?? res?.identification ?? null;
    return {
      hasIdentification: res?.hasIdentification ?? !!idData,
      userIdentification: idData,
      identification: idData,
    };
  },

  /**
   * UC-PU-04 Step 1: Complete identity verification (CCCD 12 digits, full name, dates)
   */
  async upsertIdentification(data: Partial<UserIdentification>): Promise<UserIdentification> {
    const res = await api.post<any>("/v1/users/identification", data);
    return res?.identification ?? res?.userIdentification ?? res;
  },
};
