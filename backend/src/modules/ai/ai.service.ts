import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AiChatDto, AiChatResponseDto } from './dto/ai-chat.dto';

const DORMIO_SYSTEM_INSTRUCTION = `Bạn là Dormio AI Assistant — Trợ lý thông minh dành riêng cho Chủ trọ trên hệ thống quản lý phòng trọ Dormio.
Nhiệm vụ của bạn:
1. Hướng dẫn Chủ trọ (Landlord) sử dụng các tính năng của hệ thống (Landlord Dashboard).
2. Nắm rõ toàn bộ tính năng: Quản lý nhà trọ, quản lý phòng, hợp đồng điện tử, chốt chỉ số điện nước tự động bằng AI OCR, quản lý nhân viên, chấm công, hóa đơn VietQR PayOS, xem báo cáo tài chính.
3. Khi giải đáp, cần hướng dẫn chi tiết các bước thực hiện tính năng và cách điều hướng (truy cập vào đâu trên giao diện).
4. Trình bày rõ ràng, sử dụng bullet point, ngắn gọn dễ hiểu.
5. Khi được cung cấp dữ liệu ngữ cảnh (context) về tài khoản của chủ trọ, hãy phân tích để tư vấn dựa trên số lượng nhà trọ, chi tiết từng nhà trọ (số tầng, phòng, khách thuê, công nợ, tài sản) để đưa ra câu trả lời cá nhân hóa.`;

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

    const endpoint = `https://gemini-proxy.ngquanghuy-work.workers.dev/v1beta/models/${this.modelText}:generateContent?key=${this.apiKey}`;

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

    const endpoint = `https://gemini-proxy.ngquanghuy-work.workers.dev/v1beta/models/${this.modelText}:generateContent?key=${this.apiKey}`;

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

    let dynamicSystemInstruction = DORMIO_SYSTEM_INSTRUCTION;

    if (userId) {
      try {
        const userContext = await this.prisma.user.findUnique({
          where: { id: userId },
          include: {
            boardingHouses: {
              include: { 
                rooms: {
                  include: {
                    contracts: {
                      where: { status: 'active' },
                      include: { tenantContracts: true }
                    },
                    invoices: {
                      where: { status: { in: ['unpaid', 'overdue'] } }
                    }
                  }
                },
                services: true,
                assets: true,
              },
            },
            userSubscriptions: {
              where: { status: 'active' },
              include: { subscriptionPlan: true },
            },
          },
        });

        if (userContext) {
          const houseCount = userContext.boardingHouses.length;
          const activePlan = userContext.userSubscriptions[0]?.subscriptionPlan?.planName || 'Free';
          
          let bhContextInfo = '';
          userContext.boardingHouses.forEach((bh, index) => {
             const floors = bh.totalFloor || 1;
             const rooms = bh.rooms.length;
             const servicesCount = bh.services.length;
             const assetsCount = bh.assets.length;
             const assetNames = bh.assets.map(a => a.name).join(', ') || 'Không có';
             
             let totalTenants = 0;
             let totalDebt = 0;

             bh.rooms.forEach(room => {
                room.contracts.forEach(c => {
                   totalTenants += c.tenantContracts.length;
                });
                room.invoices.forEach(inv => {
                   totalDebt += Number(inv.totalAmount);
                });
             });

             bhContextInfo += `\n- Nhà trọ ${index + 1} (${bh.name}): ${floors} tầng, ${rooms} phòng, ${totalTenants} người thuê, ${servicesCount} dịch vụ, tổng công nợ: ${totalDebt} VNĐ. Tài sản gồm (${assetsCount} món): ${assetNames}.`;
          });

          dynamicSystemInstruction += `\n\n--- THÔNG TIN NGỮ CẢNH CỦA CHỦ TRỌ ---
- Gói cước đang sử dụng: ${activePlan}
- Số lượng nhà trọ đang quản lý: ${houseCount}${bhContextInfo}
Hãy sử dụng thông tin này để trả lời chủ trọ (Tuyệt đối không nêu thông tin cá nhân khách thuê).`;
        }
      } catch (err) {
        this.logger.error('Lỗi khi lấy context user cho AI: ' + err);
      }
    }

    const body = {
      systemInstruction: {
        parts: [{ text: dynamicSystemInstruction }],
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
