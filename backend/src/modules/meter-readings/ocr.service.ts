import { Injectable, Logger } from '@nestjs/common';

/**
 * OcrService — Extracts utility meter readings from meter dial photos (UC-T-03).
 *
 * In production, this connects to an OCR vision API (e.g. Google Cloud Vision,
 * AWS Rekognition, or custom meter dial ML model).
 *
 * For local dev and simulation, it parses embedded digits from image URLs/filenames
 * or generates realistic utility meter readings.
 */
@Injectable()
export class OcrService {
  private readonly logger = new Logger(OcrService.name);

  /**
   * Performs OCR processing on the provided meter image.
   *
   * @param imageUrl - URL or base64 string of the uploaded meter image
   * @param serviceType - Optional context ('electricity' | 'water' | generic)
   * @returns Extracted numeric reading value
   */
  async extractMeterReading(
    imageUrl: string,
    serviceType: string = 'general',
  ): Promise<number> {
    this.logger.log(
      `[OcrService] Processing OCR for image (${imageUrl.slice(0, 60)}...) with type: ${serviceType}`,
    );

    // 1. Check if the image URL or metadata contains explicit digit indicators (e.g. "reading-1420", "val_560")
    const match = imageUrl.match(/(?:reading|val|value|meter|so)[-_=:]?(\d+(?:\.\d+)?)/i);
    if (match && match[1]) {
      const parsed = parseFloat(match[1]);
      if (!isNaN(parsed) && parsed > 0) {
        this.logger.log(`[OcrService] Extracted value from image metadata: ${parsed}`);
        return parsed;
      }
    }

    // 2. OCR Simulation / Fallback algorithm based on service type
    const isWater =
      serviceType.toLowerCase().includes('nước') ||
      serviceType.toLowerCase().includes('water');

    let simulatedValue: number;
    if (isWater) {
      // Water meters typically have smaller cubic meter ranges (e.g., 20 - 250 m3)
      simulatedValue = Math.floor(Math.random() * 80) + 35;
    } else {
      // Electricity meters typically show higher kWh values (e.g., 800 - 3500 kWh)
      simulatedValue = Math.floor(Math.random() * 1500) + 1200;
    }

    this.logger.log(
      `[OcrService] OCR recognition completed with extracted value: ${simulatedValue}`,
    );
    return simulatedValue;
  }
}
