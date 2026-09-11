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
  userIdentification: UserIdentification | null;
}

export const userService = {
  /**
   * UC-PU-04 Step 1: Check identity verification status of authenticated user
   */
  async getIdentification(): Promise<UserIdentificationResponse> {
    return api.get<UserIdentificationResponse>("/users/me/identification");
  },

  /**
   * UC-PU-04 Step 1: Complete identity verification (CCCD 12 digits, full name, dates)
   */
  async upsertIdentification(data: Partial<UserIdentification>): Promise<UserIdentification> {
    return api.put<UserIdentification>("/users/me/identification", data);
  },
};
