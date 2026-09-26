export interface MeterOcrResult {
  isValid: boolean;
  errorCode?: 'NOT_A_METER' | 'WRONG_METER_TYPE' | 'UNREADABLE_IMAGE' | 'UNKNOWN' | null;
  errorMessage?: string | null;
  readingValue: number | null;
  rawDigits: string;
  meterType: 'electricity' | 'water' | 'unknown';
  unit: 'kWh' | 'm3';
  confidence: number;
  isAnomalyWarning: boolean;
  notes?: string;
}
