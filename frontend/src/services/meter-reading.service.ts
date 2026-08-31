import { api } from "./api";

export interface CurrentDraftReading {
  id: string;
  readingValue: number | null;
  imageUrl: string | null;
  createdAt: string;
}

export interface PreviousReading {
  readingValue: number;
  recordedAt: string;
  imageUrl: string | null;
}

export interface MeteredServiceItem {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  unit: string;
  currentReading: CurrentDraftReading | null;
  previousReading: PreviousReading | null;
  isCompleted: boolean;
}

export interface ActiveMeteredServicesResponse {
  roomId: string;
  roomNumber: string;
  contractId: string;
  monthlyPaymentDate: number;
  meteredServices: MeteredServiceItem[];
  totalMeteredServices: number;
  completedMeteredServices: number;
  isAllCompleted: boolean;
}

export interface UploadMeterReadingPayload {
  serviceId: string;
  imageUrl: string;
  readingValue?: number;
}

export interface UploadMeterReadingResponse {
  id: string;
  serviceId: string;
  serviceName: string;
  readingValue: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface InvoiceItemDetail {
  id: string;
  title: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface ConfirmReadingsResponse {
  invoiceId: string;
  status: string;
  totalAmount: number;
  dueDate: string;
  roomId: string;
  contractId: string;
  items: InvoiceItemDetail[];
  vietQrPayload: string;
}

export const meterReadingService = {
  /**
   * UC-T-03 Step 1: Get active metered services and draft readings
   */
  async getActiveMeteredServices(): Promise<ActiveMeteredServicesResponse> {
    const response = await api.get<{
      success: boolean;
      data: ActiveMeteredServicesResponse;
    }>("/v1/tenant/meter-readings/active-services");
    return response.data;
  },

  /**
   * UC-T-03 Step 2 & 3: Upload meter photo and run OCR / in-place upsert
   */
  async uploadMeterReading(
    payload: UploadMeterReadingPayload,
  ): Promise<UploadMeterReadingResponse> {
    const response = await api.post<{
      success: boolean;
      data: UploadMeterReadingResponse;
      message?: string;
    }>("/v1/tenant/meter-readings/upload", payload);
    return response.data;
  },

  /**
   * UC-T-03 Step 4: Manually correct unbilled reading value
   */
  async updateMeterReading(
    readingId: string,
    readingValue: number,
  ): Promise<UploadMeterReadingResponse> {
    const response = await api.patch<{
      success: boolean;
      data: UploadMeterReadingResponse;
      message?: string;
    }>(`/v1/tenant/meter-readings/${readingId}`, { readingValue });
    return response.data;
  },

  /**
   * UC-T-03 Step 5 & UC-L-06 Part 3: Confirm all readings and generate invoice
   */
  async confirmAndGenerateInvoice(): Promise<ConfirmReadingsResponse> {
    const response = await api.post<{
      success: boolean;
      data: ConfirmReadingsResponse;
      message?: string;
    }>("/v1/tenant/meter-readings/confirm");
    return response.data;
  },
};
