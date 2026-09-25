import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AiChatDto, AiChatResponseDto } from './dto/ai-chat.dto';

const DORMIO_SYSTEM_INSTRUCTION = `Bạn là Dormio AI Assistant — Trợ lý thông minh của hệ thống quản lý & cho thuê phòng trọ Dormio (Việt Nam).
Nhiệm vụ của bạn là hỗ trợ:
1. Người tìm trọ & Khách thuê: Tìm phòng phù hợp, giải đáp quy trình đặt cọc giữ chỗ online an toàn (tiền cọc giữ qua cổng sàn Dormio, chỉ chuyển sang hợp đồng khi nhận phòng), hướng dẫn thanh toán hóa đơn điện nước qua mã VietQR PayOS tự động, gửi yêu cầu phản ánh khiếu nại (Grievance).
2. Chủ trọ & Quản lý: Hướng dẫn quản lý danh sách phòng, hợp đồng điện tử, chốt chỉ số điện nước tự động bằng AI OCR từ ảnh chụp đồng hồ, lên lịch làm việc và chấm công cho nhân viên, xem báo cáo doanh thu tài chính.
3. Nguyên tắc trả lời: Thân thiện, lịch sự, chính xác, ngắn gọn, có cấu trúc bullet point rõ ràng, chuẩn tiếng Việt (hoặc tiếng Anh nếu người dùng hỏi bằng tiếng Anh).`;

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly modelText: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey =
      this.configService.get<string>('ai.apiKey') ||
      process.env.AI_API_KEY ||
      '';
    this.modelText =
      this.configService.get<string>('ai.modelText') ||
      process.env.AI_MODEL_TEXT ||
      'gemini-3.5-flash-lite';
  }

  /**
   * Generates text content using the configured Gemini model.
   */
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    this.logger.log(`Generating text using model: ${this.modelText}`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelText}:generateContent?key=${this.apiKey}`;

    const body: any = {
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.7,
      },
    };

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      };
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Gemini text generation failed (${response.status}): ${err}`);
      throw new Error(`AI generation error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  /**
   * Handles multi-turn chat conversations, optionally persisting into AiConversation & AiMessage.
   */
  async chat(dto: AiChatDto, userId?: string): Promise<AiChatResponseDto> {
    this.logger.log(`Chat invoked with ${dto.messages.length} messages. User: ${userId || 'guest'}`);

    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${this.modelText}:generateContent?key=${this.apiKey}`;

    // Format messages for Gemini API
    const rawContents = dto.messages.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    // Merge consecutive identical roles to adhere to Gemini API constraints
    const contents: any[] = [];
    for (const msg of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
        contents[contents.length - 1].parts[0].text += `\n${msg.parts[0].text}`;
      } else {
        contents.push(msg);
      }
    }

    // Ensure conversation starts with user
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift();
    }

    const body = {
      systemInstruction: {
        parts: [{ text: DORMIO_SYSTEM_INSTRUCTION }],
      },
      contents,
      generationConfig: {
        temperature: 0.6,
      },
    };

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const err = await response.text();
      this.logger.error(`Gemini chat failed (${response.status}): ${err}`);
      throw new Error(`AI Chat communication error: ${response.status}`);
    }

    const data = await response.json();
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Xin lỗi, tôi không thể xử lý câu hỏi này lúc này. Vui lòng thử lại sau.';

    let conversationId: string | undefined = undefined;

    // If authenticated user and boardingHouseId is present, persist into DB
    if (userId && dto.boardingHouseId) {
      try {
        let conversation = await this.prisma.aiConversation.findFirst({
          where: { userId, boardingHouseId: dto.boardingHouseId },
          orderBy: { createdAt: 'desc' },
        });

        if (!conversation) {
          conversation = await this.prisma.aiConversation.create({
            data: {
              userId,
              boardingHouseId: dto.boardingHouseId,
            },
          });
        }

        conversationId = conversation.id;

        const lastUserMsg = dto.messages[dto.messages.length - 1];
        if (lastUserMsg && lastUserMsg.role === 'user') {
          await this.prisma.aiMessage.create({
            data: {
              aiConversationId: conversation.id,
              role: 'user',
              content: lastUserMsg.content,
              model: this.modelText,
            },
          });
        }

        await this.prisma.aiMessage.create({
          data: {
            aiConversationId: conversation.id,
            role: 'assistant',
            content: replyText,
            model: this.modelText,
          },
        });
      } catch (dbErr) {
        this.logger.warn(`Failed to persist chat message in database: ${dbErr}`);
      }
    }

    return {
      reply: replyText,
      model: this.modelText,
      conversationId,
    };
  }
}
