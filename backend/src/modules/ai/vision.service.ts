import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MeterOcrResult } from './interfaces/meter-ocr-result.interface';
import { IdCardOcrResult } from './interfaces/id-card-ocr-result.interface';

@Injectable()
export class VisionService {
  private readonly logger = new Logger(VisionService.name);
  private readonly apiKey: string;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey =
      this.configService.get<string>('ai.apiKey') ||
      process.env.AI_API_KEY ||
      '';
    this.model =
      this.configService.get<string>('ai.modelImage') ||
      process.env.AI_MODEL_IMAGE ||
      'gemini-3.5-flash-lite';

    if (!this.apiKey) {
      this.logger.warn('AI_API_KEY is not defined in environment or configuration!');
    }
  }

  /**
   * Resolves an image input (Data URI, HTTP/HTTPS URL, or Base64) into raw base64 data and mimeType.
   */
  async resolveImageSource(imageInput: string): Promise<{ base64Data: string; mimeType: string }> {
    if (!imageInput || typeof imageInput !== 'string') {
      throw new Error('Image source must be a non-empty string');
    }

    const trimmed = imageInput.trim();

    // 1. Data URI format (data:image/jpeg;base64,....)
    if (trimmed.startsWith('data:')) {
      const match = trimmed.match(/^data:([^;]+);base64,(.+)$/s);
      if (match) {
        return {
          mimeType: match[1] || 'image/jpeg',
          base64Data: match[2],
        };
      }
    }

    // 2. HTTP / HTTPS URL (Cloudinary, S3, or public URL)
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const response = await fetch(trimmed, {
          headers: {
            'User-Agent': 'Dormio-AI-Vision/1.0',
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch image from URL: ${response.status} ${response.statusText}`);
        }

        const contentType = response.headers.get('content-type') || 'image/jpeg';
        const mimeType = contentType.split(';')[0].trim();
        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return {
          mimeType: mimeType || 'image/jpeg',
          base64Data: buffer.toString('base64'),
        };
      } catch (err: any) {
        this.logger.error(`Error downloading image from ${trimmed.slice(0, 80)}: ${err.message}`);
        throw err;
      }
    }

    // 3. Assume raw base64 string
    return {
      mimeType: 'image/jpeg',
      base64Data: trimmed,
    };
  }

  /**
   * UC-T-03 / UC-L-09: Extracts utility meter reading (Electricity or Water) from an image.
   * Leverages gemini-3.5-flash-lite multimodal vision with strict JSON schema.
   */
  async extractMeterReading(
    imageInput: string,
    serviceType: string = 'general',
  ): Promise<MeterOcrResult> {
    this.logger.log(`Extracting meter reading using ${this.model} for serviceType: ${serviceType}`);

    const { base64Data, mimeType } = await this.resolveImageSource(imageInput);

    const isElectricity =
      serviceType.toLowerCase().includes('điện') ||
      serviceType.toLowerCase().includes('elec');
    const isWater =
      serviceType.toLowerCase().includes('nước') ||
      serviceType.toLowerCase().includes('water');

    const prompt = `Bạn là trợ lý thị giác AI chuyên nhận diện số đồng hồ điện và đồng hồ nước tại Việt Nam (UC-T-03).
Dịch vụ cần đọc: "${serviceType}".

HƯỚNG DẪN ĐỌC CHỈ SỐ:
1. Đồng hồ điện cơ (Emic, Gelex, Vinakip...):
   - Đọc các ô số từ trái sang phải.
   - Chú ý ô số cuối cùng bên phải: Nếu ô số này có màu đỏ, viền đỏ hoặc có dấu phẩy ngăn cách, đó là hàng thập phân (0.1 kWh).
   - Hãy tính chính xác giá trị số (ví dụ: các ô đen là 1250, ô đỏ là 5 -> giá trị là 1250.5 hoặc 1250 tùy chuẩn, thông thường là 1250.5).
2. Đồng hồ điện tử (LCD hiển thị):
   - Đọc dãy số lớn nhất hiển thị kèm đơn vị kWh. Bỏ qua các chỉ số phụ như điện áp V hay dòng điện A.
3. Đồng hồ nước:
   - Các dãy số màu đen biểu thị mét khối (m³). Các kim tròn màu đỏ biểu thị lít (hàng thập phân 0.1, 0.01 m³).
   - Đọc số mét khối làm giá trị chính.
4. Trường hợp hình ảnh bị mờ, lóa đèn flash, bị che khuất một phần hoặc không rõ ràng:
   - Hãy đưa ra con số ước tính tốt nhất có thể, nhưng gán "confidence" < 0.6 và "isAnomalyWarning": true kèm giải thích trong "notes".

BẮT BUỘC TRẢ VỀ JSON theo đúng định dạng sau (không chứa markdown khác ngoài JSON):
{
  "readingValue": <number: số thực hoặc số nguyên của chỉ số, ví dụ 1250 hoặc 1250.5>,
  "rawDigits": "<string: chuỗi số thô nhìn thấy trên mặt đồng hồ, ví dụ '012505'>",
  "meterType": "${isElectricity ? 'electricity' : isWater ? 'water' : 'electricity'}",
  "unit": "${isWater ? 'm3' : 'kWh'}",
  "confidence": <number: từ 0.0 đến 1.0 biểu thị độ tin cậy>,
  "isAnomalyWarning": <boolean: true nếu ảnh mờ/lóa/nghi ngờ sai lệch, false nếu rõ ràng>,
  "notes": "<string: ghi chú ngắn gọn về đặc điểm công tơ, ví dụ: 'Công tơ cơ 1 pha, ô số đỏ hàng thập phân là 5'>"
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Gemini Vision API error (${response.status}): ${errText}`);
      throw new Error(`Gemini Vision request failed with status ${response.status}`);
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!rawJson) {
      throw new Error('Gemini Vision did not return candidate text content');
    }

    try {
      const parsed = JSON.parse(rawJson);
      return {
        readingValue: typeof parsed.readingValue === 'number' ? parsed.readingValue : parseFloat(parsed.readingValue) || 0,
        rawDigits: String(parsed.rawDigits || ''),
        meterType: parsed.meterType || (isWater ? 'water' : 'electricity'),
        unit: parsed.unit || (isWater ? 'm3' : 'kWh'),
        confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.85,
        isAnomalyWarning: Boolean(parsed.isAnomalyWarning),
        notes: parsed.notes || '',
      };
    } catch (parseErr) {
      this.logger.error(`Failed to parse Gemini JSON output: ${rawJson}`);
      throw new Error('Invalid JSON format returned from AI model');
    }
  }

  /**
   * UC-T-06 / UserIdentification: Extracts Citizen Identity Card (CCCD) information.
   */
  async extractIdCard(
    imageInput: string,
    side: 'front' | 'back' = 'front',
  ): Promise<IdCardOcrResult> {
    this.logger.log(`Extracting CCCD information (${side}) using ${this.model}`);

    const { base64Data, mimeType } = await this.resolveImageSource(imageInput);

    const prompt = `Bạn là trợ lý AI chuyên bóc tách thông tin Căn Cước Công Dân (CCCD gắn chip / mã vạch) Việt Nam.
Mặt ảnh: ${side === 'front' ? 'MẶT TRƯỚC' : 'MẶT SAU'}.

HƯỚNG DẪN BÓC TÁCH:
1. Số CCCD: dãy đúng 12 chữ số (ví dụ: 001202012345).
2. Họ và tên: viết in hoa có dấu hoặc không dấu (ví dụ: NGUYỄN VĂN A).
3. Ngày tháng năm sinh: dạng DD/MM/YYYY.
4. Giới tính: Nam hoặc Nữ.
5. Quê quán (nơi sinh): địa chỉ quê quán ghi trên thẻ.
6. Nơi thường trú: địa chỉ thường trú ghi trên thẻ.
7. Ngày cấp và ngày hết hạn: dạng DD/MM/YYYY nếu đọc được.

BẮT BUỘC TRẢ VỀ JSON:
{
  "identityNumber": "<string: 12 chữ số>",
  "fullName": "<string: Họ tên in hoa>",
  "dateOfBirth": "<string: DD/MM/YYYY>",
  "gender": "<string: Nam | Nữ>",
  "hometown": "<string>",
  "permanentAddress": "<string>",
  "issueDate": "<string>",
  "expiryDate": "<string>",
  "confidence": <number: từ 0.0 đến 1.0>,
  "notes": "<string: ghi chú nếu ảnh mờ/lóa góc>"
}`;

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const payload = {
      contents: [
        {
          role: 'user',
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Data,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        responseMimeType: 'application/json',
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Gemini ID Card Vision error (${response.status}): ${errText}`);
      throw new Error(`Gemini ID Card Vision request failed: ${response.status}`);
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return JSON.parse(rawJson) as IdCardOcrResult;
  }

  /**
   * UC-L-12: Analyzes room photos to identify visible amenities and furniture.
   */
  async analyzeRoomPhotos(
    imageUrls: string[],
  ): Promise<{ features: string[]; description: string }> {
    if (!imageUrls || imageUrls.length === 0) {
      return { features: [], description: '' };
    }

    this.logger.log(`Analyzing ${imageUrls.length} room photos using ${this.model}`);

    const parts: any[] = [
      {
        text: `Phân tích các bức ảnh phòng trọ/căn hộ sau đây.
Nhiệm vụ:
1. Nhận diện các tiện ích, nội thất đang có sẵn trong ảnh (ví dụ: Máy lạnh Inverter, Giường nệm, Tủ quần áo, Gác lửng, Cửa sổ lớn, Ban công thoáng mát, Bếp nấu ăn, Nhà vệ sinh khép kín, Nóng lạnh, Máy giặt).
2. Tạo 1 đoạn văn ngắn (2-3 câu) mô tả không gian thực tế và mức độ thoáng sáng của căn phòng để đưa vào bài đăng cho thuê.

Trả về JSON:
{
  "features": ["<tiện ích 1>", "<tiện ích 2>", ...],
  "description": "<đoạn mô tả ngắn về không gian>"
}`,
      },
    ];

    for (const url of imageUrls.slice(0, 3)) {
      try {
        const { base64Data, mimeType } = await this.resolveImageSource(url);
        parts.push({
          inlineData: {
            mimeType,
            data: base64Data,
          },
        });
      } catch (err) {
        this.logger.warn(`Could not load image ${url} for room analysis: ${err}`);
      }
    }

    // If no images could be resolved, return empty
    if (parts.length === 1) {
      return { features: [], description: '' };
    }

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent?key=${this.apiKey}`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ role: 'user', parts }],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      this.logger.warn(`Room photo analysis failed: ${response.status}`);
      return { features: [], description: '' };
    }

    const data = await response.json();
    const rawJson = data.candidates?.[0]?.content?.parts?.[0]?.text;
    try {
      return JSON.parse(rawJson);
    } catch {
      return { features: [], description: '' };
    }
  }
}
