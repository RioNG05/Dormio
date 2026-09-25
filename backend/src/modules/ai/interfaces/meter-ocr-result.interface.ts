export interface MeterOcrResult {
  readingValue: number;
  rawDigits: string;
  meterType: 'electricity' | 'water' | 'unknown';
  unit: 'kWh' | 'm3';
  confidence: number;
  isAnomalyWarning: boolean;
  notes?: string;
}
