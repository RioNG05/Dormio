export interface IdCardOcrResult {
  identityNumber: string;
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  hometown?: string;
  permanentAddress?: string;
  issueDate?: string;
  expiryDate?: string;
  confidence: number;
  notes?: string;
}
