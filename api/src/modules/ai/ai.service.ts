import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PrismaService } from '../../common/prisma/prisma.service'
import { AiChatDto, AiChatResponseDto } from './dto/ai-chat.dto'

const DORMIO_SYSTEM_INSTRUCTION = `Bạn là Mio — Trợ lý AI của nền tảng Dormio (nền tảng quản lý nhà trọ và kết nối thuê phòng thông minh).

Quy tắc xưng hô và phong cách giao tiếp (BẮT BUỘC):
1. Tên của bạn là Mio. Trong mọi lời chào, lời giới thiệu hoặc khi được hỏi tên, bạn luôn tự giới thiệu mình là Mio, trợ lý AI của nền tảng Dormio.
2. Luôn luôn gọi người dùng là "anh/chị" (hoặc "anh/chị [Tên]" khi đã biết tên) và xưng "em" trong mọi câu trả lời (ví dụ: "Dạ em chào anh/chị...", "Em có thể hỗ trợ gì cho anh/chị ạ?", "Dạ thưa anh/chị...").
3. Giữ thái độ thân thiện, lịch thiệp, chu đáo, nhiệt tình và chuyên nghiệp.

Nhiệm vụ và năng lực của bạn:
1. Hướng dẫn và giải đáp thắc mắc cho người dùng (Chủ trọ, Khách thuê, Nhân viên) về các tính năng của Dormio:
   - Dành cho Chủ trọ (Landlord): Quản lý nhà trọ & toà nhà, tạo phòng hàng loạt, quản lý tiện nghi (chung/riêng), thiết lập đơn vị dịch vụ (đo lường kWh/m³, phí cố định theo đầu người/phòng), lập hợp đồng điện tử, chốt chỉ số điện nước tự động bằng AI Vision OCR, lập và gửi hóa đơn tự động kèm mã thanh toán PayOS VietQR, quản lý nhân viên & phân ca chấm công, quản lý công nợ và tài sản, xem báo cáo tài chính doanh thu/chi phí, quản lý gói cước thuê bao.
   - Dành cho Khách thuê (Tenant): Xem hợp đồng thuê phòng, nhận thông báo hóa đơn hàng tháng và quét mã VietQR PayOS để thanh toán tự động, gửi ảnh chụp đồng hồ điện nước, gửi kiến nghị/khiếu nại trực tiếp đến chủ trọ.
2. Hướng dẫn chi tiết từng bước (step-by-step) và chỉ rõ vị trí thao tác trên giao diện người dùng.
3. Trình bày rõ ràng, sử dụng định dạng Markdown và gạch đầu dòng (bullet points), ngắn gọn, súc tích và dễ hiểu.
4. Khi được cung cấp dữ liệu ngữ cảnh (context), hãy phân tích dữ liệu để trả lời chính xác, cá nhân hóa cho anh/chị mà không hỏi lại các thông tin đã có.`

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name)
  private readonly apiKey: string
  private readonly baseUrl: string
  private readonly modelText: string

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.apiKey = this.configService.get<string>('ai.apiKey') || process.env.AI_API_KEY || ''
    this.baseUrl = (
      this.configService.get<string>('ai.baseUrl') ||
      process.env.AI_BASE_URL ||
      'https://gemini-proxy.ngquanghuy-work.workers.dev'
    ).replace(/\/+$/, '')
    this.modelText =
      this.configService.get<string>('ai.modelText') ||
      process.env.AI_MODEL_TEXT ||
      'gemini-3.5-flash-lite'
  }

  private async postWithRetry(endpoint: string, body: any, maxRetries = 2): Promise<any> {
    let lastError = ''
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        return response.json()
      }

      const errText = await response.text()
      lastError = errText

      const isLocationError =
        errText.includes('User location is not supported') ||
        errText.includes('FAILED_PRECONDITION')

      if (isLocationError && attempt < maxRetries) {
        this.logger.warn(
          `Gemini request attempt ${attempt} hit edge location restriction (${response.status}). Retrying...`,
        )
        await new Promise(resolve => setTimeout(resolve, 500))
        continue
      }

      this.logger.error(`Gemini request failed (${response.status}): ${errText}`)
      throw new Error(`AI Chat communication error: ${response.status}`)
    }

    throw new Error(`AI request failed: ${lastError}`)
  }

  /**
   * Generates text content using the configured Gemini model.
   */
  async generateText(prompt: string, systemInstruction?: string): Promise<string> {
    this.logger.log(`Generating text using model: ${this.modelText}`)

    const endpoint = `${this.baseUrl}/v1beta/models/${this.modelText}:generateContent?key=${this.apiKey}`

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
    }

    if (systemInstruction) {
      body.systemInstruction = {
        parts: [{ text: systemInstruction }],
      }
    }

    const data = await this.postWithRetry(endpoint, body)
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }

  /**
   * Handles multi-turn chat conversations, optionally persisting into AiConversation & AiMessage.
   */
  async chat(dto: AiChatDto, userId?: string): Promise<AiChatResponseDto> {
    this.logger.log(`Chat invoked with ${dto.messages.length} messages. User: ${userId || 'guest'}`)

    const endpoint = `${this.baseUrl}/v1beta/models/${this.modelText}:generateContent?key=${this.apiKey}`

    // Format messages for Gemini API
    const rawContents = dto.messages.map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

    // Merge consecutive identical roles to adhere to Gemini API constraints
    const contents: any[] = []
    for (const msg of rawContents) {
      if (contents.length > 0 && contents[contents.length - 1].role === msg.role) {
        contents[contents.length - 1].parts[0].text += `\n${msg.parts[0].text}`
      } else {
        contents.push(msg)
      }
    }

    // Ensure conversation starts with user
    if (contents.length > 0 && contents[0].role === 'model') {
      contents.shift()
    }

    let dynamicSystemInstruction = DORMIO_SYSTEM_INSTRUCTION

    if (userId) {
      try {
        const userContext = await this.prisma.user.findUnique({
          where: { id: userId },
          select: {
            id: true,
            username: true,
            phoneNumber: true,
            email: true,
            bio: true,
            status: true,
            mustChangePassword: true,
            role: true,
            createdAt: true,
            userIdentification: {
              select: {
                fullName: true,
              },
            },
            userSubscriptions: {
              where: { status: 'active' },
              include: {
                subscriptionPlan: true,
              },
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
            boardingHouses: {
              include: {
                rooms: {
                  include: {
                    contracts: {
                      where: { status: 'active' },
                      include: { tenantContracts: true },
                    },
                    invoices: {
                      where: { status: { in: ['unpaid', 'overdue'] } },
                    },
                  },
                },
                services: true,
                assets: true,
              },
            },
            roomOccupants: {
              where: { status: 'active' },
              include: {
                boardingHouse: { select: { name: true } },
                room: { select: { roomNumber: true } },
              },
            },
          },
        })

        if (userContext) {
          const fullName = userContext.userIdentification?.fullName?.trim()
          const username = userContext.username?.trim()
          const displayName = fullName || username || ''

          const roleDisplayMap: Record<string, string> = {
            landlord: 'Chủ trọ / Quản lý nhà trọ',
            tenant: 'Khách thuê phòng trọ',
            staff: 'Nhân viên quản lý toà nhà',
            admin: 'Quản trị viên hệ thống',
            leasing_agent: 'Môi giới / Đại lý cho thuê',
          }
          const roleName = roleDisplayMap[userContext.role] || userContext.role

          const statusDisplayMap: Record<string, string> = {
            active: 'Đang hoạt động (Active)',
            inactive: 'Chưa kích hoạt (Inactive)',
            suspended: 'Đang tạm khóa (Suspended)',
          }
          const statusName = statusDisplayMap[userContext.status] || userContext.status

          const joinedDate = userContext.createdAt
            ? new Date(userContext.createdAt).toLocaleDateString('vi-VN')
            : 'Mới tham gia'

          const activeSub = userContext.userSubscriptions?.[0]
          let subscriptionInfo = 'Gói miễn phí (Free)'
          if (activeSub) {
            const planName = activeSub.planName || activeSub.subscriptionPlan?.planName || 'Chưa rõ'
            const endDate = activeSub.endDate
              ? new Date(activeSub.endDate).toLocaleDateString('vi-VN')
              : 'Vô thời hạn'
            const maxRooms = activeSub.subscriptionPlan?.maxRoom
              ? `${activeSub.subscriptionPlan.maxRoom} phòng`
              : 'Không giới hạn'
            subscriptionInfo = `Gói ${planName} (Hạn đến: ${endDate}, Giới hạn tối đa: ${maxRooms})`
          }

          let contextText = `\n\n--- THÔNG TIN NGƯỜI DÙNG ĐANG TRÒ CHUYỆN ---`
          if (displayName) {
            contextText += `\n- Họ và tên / Tên hiển thị: ${displayName}${username && fullName ? ` (Username: ${username})` : ''}`
          }
          contextText += `\n- Vai trò tài khoản: ${roleName}`
          contextText += `\n- Trạng thái tài khoản: ${statusName}`
          contextText += `\n- Cần đổi mật khẩu (mustChangePassword): ${userContext.mustChangePassword ? 'Có (Chưa đổi mật khẩu mặc định)' : 'Không (Đã đổi)'}`
          if (userContext.bio) {
            contextText += `\n- Giới thiệu bản thân (Bio): ${userContext.bio}`
          }
          if (userContext.phoneNumber) {
            contextText += `\n- Số điện thoại liên hệ: ${userContext.phoneNumber}`
          }
          if (userContext.email) {
            contextText += `\n- Email liên kết: ${userContext.email}`
          }
          contextText += `\n- Gói thuê bao (User Subscription): ${subscriptionInfo}`
          contextText += `\n- Ngày tham gia Dormio: ${joinedDate}`

          // Boarding house details (if user is landlord or manages houses)
          if (userContext.boardingHouses && userContext.boardingHouses.length > 0) {
            const houseCount = userContext.boardingHouses.length
            contextText += `\n\n--- DANH SÁCH NHÀ TRỌ ĐANG QUẢN LÝ (${houseCount} toà nhà) ---`

            userContext.boardingHouses.forEach((bh, index) => {
              const floors = bh.totalFloor || 1
              const rooms = bh.rooms.length
              const servicesCount = bh.services.length
              const assetsCount = bh.assets.length
              const assetNames = bh.assets.map(a => a.name).join(', ') || 'Không có'

              let totalTenants = 0
              let totalDebt = 0

              bh.rooms.forEach(room => {
                room.contracts.forEach(c => {
                  totalTenants += c.tenantContracts.length
                })
                room.invoices.forEach(inv => {
                  totalDebt += Number(inv.totalAmount)
                })
              })

              contextText += `\n- Toà nhà ${index + 1} (${bh.name}): ${floors} tầng, ${rooms} phòng, ${totalTenants} khách thuê đang ở, ${servicesCount} dịch vụ, tổng công nợ chưa thu: ${totalDebt.toLocaleString('vi-VN')} VNĐ. Tài sản (${assetsCount} món): ${assetNames}.`
            })
          }

          // Active room tenancy details (if user is a tenant)
          if (userContext.roomOccupants && userContext.roomOccupants.length > 0) {
            contextText += `\n\n--- THÔNG TIN PHÒNG TRỌ ĐANG THUÊ ---`
            userContext.roomOccupants.forEach(occ => {
              const roomNum = occ.room?.roomNumber || 'Chưa rõ số phòng'
              const bhName = occ.boardingHouse?.name || 'Khu trọ'
              const joinDate = occ.joinedAt ? new Date(occ.joinedAt).toLocaleDateString('vi-VN') : ''
              contextText += `\n- Đang thuê Phòng ${roomNum} tại ${bhName}${joinDate ? ` (từ ngày ${joinDate})` : ''}.`
            })
          }

          contextText += `\n\nLƯU Ý GIAO TIẾP VỚI NGƯỜI DÙNG:
- Luôn gọi người dùng là "anh/chị"${displayName ? ` hoặc "anh/chị ${displayName}"` : ''} và xưng "em" trong mọi câu trả lời.
- Tuyệt đối không bao giờ hỏi hay đề cập đến các thông tin siêu nhạy cảm như mật khẩu, mã OTP, số tài khoản ngân hàng.
- Hãy dùng các thông tin trên một cách tự nhiên, lịch thiệp để giải đáp câu hỏi và cá nhân hóa tư vấn cho anh/chị.`

          dynamicSystemInstruction += contextText
        }
      } catch (err) {
        this.logger.error('Error fetching user context for AI: ' + err)
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
    }

    const data = await this.postWithRetry(endpoint, body)
    const replyText =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'Sorry, I cannot process this question right now. Please try again later.'

    let conversationId: string | undefined = undefined

    // If authenticated user and boardingHouseId is present, persist into DB
    if (userId && dto.boardingHouseId) {
      try {
        let conversation = await this.prisma.aiConversation.findFirst({
          where: { userId, boardingHouseId: dto.boardingHouseId },
          orderBy: { createdAt: 'desc' },
        })

        if (!conversation) {
          conversation = await this.prisma.aiConversation.create({
            data: {
              userId,
              boardingHouseId: dto.boardingHouseId,
            },
          })
        }

        conversationId = conversation.id

        const lastUserMsg = dto.messages[dto.messages.length - 1]
        if (lastUserMsg && lastUserMsg.role === 'user') {
          await this.prisma.aiMessage.create({
            data: {
              aiConversationId: conversation.id,
              role: 'user',
              content: lastUserMsg.content,
              model: this.modelText,
            },
          })
        }

        await this.prisma.aiMessage.create({
          data: {
            aiConversationId: conversation.id,
            role: 'assistant',
            content: replyText,
            model: this.modelText,
          },
        })
      } catch (dbErr) {
        this.logger.warn(`Failed to persist chat message in database: ${dbErr}`)
      }
    }

    return {
      reply: replyText,
      model: this.modelText,
      conversationId,
    }
  }
}
