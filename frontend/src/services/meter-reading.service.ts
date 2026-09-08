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

  // ─── Landlord Utility Logging (UC-L-09) ───────────────────────────────────

  /**
   * UC-L-09: Get active metered services and latest readings for room
   */
  async getLandlordRoomMeteredServices(
    boardingHouseId: string,
    roomId: string,
  ): Promise<LandlordRoomMeteredServicesResponse> {
    const response = await api.get<{
      success: boolean;
      data: LandlordRoomMeteredServicesResponse;
    }>(`/v1/landlord/meter-readings/room/${roomId}/services`, {
      headers: {
        "X-Boarding-House-Id": boardingHouseId,
      },
    });
    return response.data;
  },

  /**
   * UC-L-09: Get chronological meter reading history for a room
   */
  async getLandlordRoomMeterHistory(
    boardingHouseId: string,
    roomId: string,
  ): Promise<LandlordRoomMeterHistoryResponse> {
    const response = await api.get<{
      success: boolean;
      data: LandlordRoomMeterHistoryResponse;
    }>(`/v1/landlord/meter-readings/room/${roomId}/history`, {
      headers: {
        "X-Boarding-House-Id": boardingHouseId,
      },
    });
    return response.data;
  },

  /**
   * UC-L-09: Manually record utility meter readings for room
   */
  async recordLandlordMeterReading(
    boardingHouseId: string,
    payload: RecordLandlordMeterReadingPayload,
  ): Promise<{ success: boolean; message: string; count: number; data: any[] }> {
    const response = await api.post<{
      success: boolean;
      message: string;
      count: number;
      data: any[];
    }>("/v1/landlord/meter-readings", payload, {
      headers: {
        "X-Boarding-House-Id": boardingHouseId,
      },
    });
    return response;
  },

  /**
   * UC-L-09: Update / correct a recorded meter reading with reason
   */
  async updateLandlordMeterReading(
    boardingHouseId: string,
    readingId: string,
    payload: UpdateLandlordMeterReadingPayload,
  ): Promise<{ success: boolean; message: string; data: any }> {
    const response = await api.patch<{
      success: boolean;
      message: string;
      data: any;
    }>(`/v1/landlord/meter-readings/${readingId}`, payload, {
      headers: {
        "X-Boarding-House-Id": boardingHouseId,
      },
    });
    return response;
  },
};

export interface LandlordActiveMeteredService {
  serviceId: string;
  serviceName: string;
  unitPrice: number;
  unit: string;
  lastReading: {
    id: string;
    readingValue: number;
    imageUrl: string | null;
    createdAt: string;
  } | null;
  unbilledReading: {
    id: string;
    readingValue: number;
    imageUrl: string | null;
    createdAt: string;
  } | null;
}

export interface LandlordRoomMeteredServicesResponse {
  roomId: string;
  roomNumber: string;
  services: LandlordActiveMeteredService[];
}

export interface LandlordMeterServiceItem {
  id: string;
  serviceId: string;
  serviceName: string;
  unit: string;
  unitPrice: number;
  oldReading: number;
  newReading: number;
  consumption: number;
  cost: number;
  imageUrl: string | null;
  createdAt: string;
}

export interface LandlordMeterPeriodHistory {
  period: string;
  date: string;
  createdAt: string;
  services: LandlordMeterServiceItem[];
  totalMeterCost: number;
  invoiceId: string | null;
  invoiceStatus: string;
  isPaid: boolean;
  canEdit: boolean;
  editReason?: string;
  editedAt?: string;
}

export interface LandlordRoomMeterHistoryResponse {
  roomId: string;
  roomNumber: string;
  history: LandlordMeterPeriodHistory[];
}

export interface RecordLandlordMeterReadingPayload {
  roomId: string;
  readings: Array<{
    serviceId: string;
    readingValue: number;
    imageUrl?: string;
  }>;
  recordedAt?: string;
  note?: string;
}

export interface UpdateLandlordMeterReadingPayload {
  readingValue: number;
  imageUrl?: string;
  reason: string;
}

