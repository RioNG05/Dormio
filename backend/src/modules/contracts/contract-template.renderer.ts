/**
 * ContractTemplateRenderer
 *
 * Implements UC-L-15 server-side template renderer for Vietnamese residential lease contracts.
 * Produces unified, print-ready HTML conforming to Vietnamese legal conventions and A4 print layout.
 * Both direct-print triggers and downloadable-file exports use this exact template so they never drift apart.
 */

export interface ContractTemplateData {
  contract: {
    id: string;
    startDate: Date;
    endDate: Date;
    rentPrice: number;
    monthlyPaymentDate: number;
    rentPaymentCycle?: number | null;
    status: string;
    note?: string | null;
    createdAt: Date;
  };
  boardingHouse: {
    id: string;
    name: string;
    address: string;
    owner: {
      id: string;
      fullName: string;
      phoneNumber: string;
      email?: string | null;
    };
  };
  room: {
    id: string;
    roomNumber: string;
    floor: number;
    area?: number | null;
    maxOccupants?: number | null;
    roomTypeName?: string | null;
    services: Array<{
      name: string;
      price: number;
      unit: string;
      isMetered: boolean;
    }>;
  };
  primaryTenant: {
    id: string;
    fullName: string;
    phoneNumber: string;
    email?: string | null;
    identification?: {
      identityNumber: string;
      dateOfBirth?: string | Date | null;
      gender?: string | null;
      placeOfOrigin?: string | null;
      placeOfResidence?: string | null;
      issueDate?: string | Date | null;
      issuePlace?: string | null;
    } | null;
  };
  coTenants?: Array<{
    id: string;
    fullName: string;
    phoneNumber?: string | null;
  }>;
  deposit?: {
    amount: number;
    status: string;
    type: string;
    paidAt?: Date | null;
  } | null;
  options?: {
    autoPrint?: boolean;
    includeToolbar?: boolean;
  };
}

export class ContractTemplateRenderer {
  /**
   * Formats currency in VND
   */
  private static formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  }

  /**
   * Formats Date to dd/mm/yyyy
   */
  private static formatDate(date: Date | string | null | undefined): string {
    if (!date) return '—';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '—';
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  /**
   * Converts amount into Vietnamese spoken words
   */
  private static numberToVietnameseWords(num: number): string {
    if (num === 0) return 'Không đồng';
    const units = ['', 'nghìn', 'triệu', 'tỷ', 'nghìn tỷ'];
    const digits = ['không', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];

    const readThreeDigits = (n: number, showZeroHundred: boolean): string => {
      let str = '';
      const hundreds = Math.floor(n / 100);
      const tens = Math.floor((n % 100) / 10);
      const ones = n % 10;

      if (hundreds > 0 || showZeroHundred) {
        str += digits[hundreds] + ' trăm ';
      }
      if (tens > 1) {
        str += digits[tens] + ' mươi ';
        if (ones === 1) str += 'mốt ';
        else if (ones === 5) str += 'lăm ';
        else if (ones > 0) str += digits[ones] + ' ';
      } else if (tens === 1) {
        str += 'mười ';
        if (ones === 5) str += 'lăm ';
        else if (ones > 0) str += digits[ones] + ' ';
      } else if (tens === 0 && ones > 0) {
        if (hundreds > 0 || showZeroHundred) str += 'lẻ ';
        str += digits[ones] + ' ';
      }
      return str.trim();
    };

    let n = Math.floor(Math.abs(num));
    const groups: number[] = [];
    while (n > 0) {
      groups.push(n % 1000);
      n = Math.floor(n / 1000);
    }

    let result = '';
    for (let i = groups.length - 1; i >= 0; i--) {
      const g = groups[i];
      if (g > 0) {
        const showZero = i < groups.length - 1 && groups.length > 1;
        result += readThreeDigits(g, showZero) + ' ' + units[i] + ' ';
      }
    }
    const clean = result.trim() + ' đồng';
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }

  /**
   * Renders the complete HTML document for the contract
   */
  public static render(data: ContractTemplateData): string {
    const {
      contract,
      boardingHouse,
      room,
      primaryTenant,
      coTenants = [],
      deposit,
      options = {},
    } = data;

    const autoPrint = options.autoPrint ?? false;
    const includeToolbar = options.includeToolbar ?? true;

    const today = new Date();
    const createdDate = contract.createdAt ? new Date(contract.createdAt) : today;
    const day = createdDate.getDate();
    const month = createdDate.getMonth() + 1;
    const year = createdDate.getFullYear();

    const rentPriceVnd = this.formatCurrency(contract.rentPrice);
    const rentPriceWords = this.numberToVietnameseWords(contract.rentPrice);

    const depositAmount = deposit ? deposit.amount : contract.rentPrice;
    const depositVnd = this.formatCurrency(depositAmount);
    const depositWords = this.numberToVietnameseWords(depositAmount);

    const iden = primaryTenant.identification;
    const idNumber = iden?.identityNumber || 'Chưa cung cấp';
    const idIssueDate = iden?.issueDate ? this.formatDate(iden.issueDate) : 'Chưa cập nhật';
    const idIssuePlace = iden?.issuePlace || iden?.placeOfResidence || 'Cục CS QLHC về TTXH';
    const placeOfOrigin = iden?.placeOfOrigin || 'Chưa cập nhật';
    const placeOfResidence = iden?.placeOfResidence || 'Chưa cập nhật';

    const servicesHtml =
      room.services.length > 0
        ? room.services
            .map(
              (s, index) => `
              <tr>
                <td style="text-align: center; width: 40px;">${index + 1}</td>
                <td><strong>${s.name}</strong></td>
                <td style="text-align: right; width: 120px;">${this.formatCurrency(s.price)}</td>
                <td style="text-align: center; width: 100px;">/${s.unit}</td>
                <td style="width: 140px;">${s.isMetered ? 'Tính theo chỉ số đồng hồ' : 'Cố định hàng tháng'}</td>
              </tr>
            `,
            )
            .join('')
        : `
          <tr>
            <td colspan="5" style="text-align: center; color: #666; font-style: italic; padding: 8px;">
              Không có dịch vụ phụ thu riêng (đã bao gồm trong giá phòng hoặc thỏa thuận riêng).
            </td>
          </tr>
        `;

    const coTenantsHtml =
      coTenants.length > 0
        ? `
          <div style="margin-top: 6px; padding-left: 15px; font-size: 13px;">
            <p style="margin: 3px 0; font-style: italic;"><strong>Các thành viên cùng lưu trú:</strong></p>
            <ul style="margin: 4px 0 6px 18px; padding: 0;">
              ${coTenants
                .map(
                  (m) =>
                    `<li>${m.fullName}${m.phoneNumber ? ` - SĐT: ${m.phoneNumber}` : ''}</li>`,
                )
                .join('')}
            </ul>
          </div>
        `
        : '';

    return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hợp Đồng Thuê Phòng ${room.roomNumber} - ${boardingHouse.name}</title>
  <style>
    @page {
      size: A4;
      margin: 15mm 18mm 15mm 18mm;
    }

    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    body {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 14pt;
      line-height: 1.45;
      color: #111;
      background-color: #f3f4f6;
      margin: 0;
      padding: 20px 0;
    }

    .contract-page {
      max-width: 210mm;
      min-height: 297mm;
      margin: 0 auto;
      background: #ffffff;
      padding: 20mm 20mm;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    }

    .header-national {
      text-align: center;
      margin-bottom: 25px;
    }

    .header-national .country {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0;
    }

    .header-national .motto {
      font-size: 12pt;
      font-weight: bold;
      margin: 4px 0;
    }

    .header-national .divider {
      margin: 6px auto 14px auto;
      width: 140px;
      border-bottom: 1.5px solid #111;
    }

    .header-title {
      text-align: center;
      margin-bottom: 20px;
    }

    .header-title h1 {
      font-size: 18pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 5px 0;
      color: #0f172a;
    }

    .header-title .contract-code {
      font-size: 11pt;
      font-style: italic;
      color: #475569;
      margin: 0;
    }

    .preamble {
      font-style: italic;
      margin-bottom: 16px;
      text-align: justify;
      text-indent: 25px;
    }

    .section-title {
      font-size: 13pt;
      font-weight: bold;
      text-transform: uppercase;
      margin: 16px 0 8px 0;
      color: #0f172a;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3px;
    }

    .party-block {
      margin-bottom: 14px;
      padding-left: 10px;
    }

    .party-block p {
      margin: 4px 0;
      text-align: justify;
    }

    .party-block strong {
      display: inline-block;
      min-width: 150px;
    }

    .article {
      margin-bottom: 14px;
      text-align: justify;
    }

    .article-title {
      font-weight: bold;
      margin: 10px 0 4px 0;
    }

    .article p {
      margin: 4px 0;
      text-indent: 20px;
    }

    .article p.no-indent {
      text-indent: 0;
    }

    table.services-table {
      width: 100%;
      border-collapse: collapse;
      margin: 8px 0 12px 0;
      font-size: 11pt;
    }

    table.services-table th,
    table.services-table td {
      border: 1px solid #333;
      padding: 6px 8px;
    }

    table.services-table th {
      background-color: #f1f5f9;
      text-align: center;
      font-weight: bold;
    }

    .signatures-block {
      margin-top: 30px;
      display: table;
      width: 100%;
      page-break-inside: avoid;
    }

    .signature-column {
      display: table-cell;
      width: 50%;
      text-align: center;
      vertical-align: top;
      padding: 0 15px;
    }

    .signature-column .title {
      font-weight: bold;
      text-transform: uppercase;
      font-size: 12pt;
      margin-bottom: 3px;
    }

    .signature-column .note {
      font-style: italic;
      font-size: 10pt;
      color: #475569;
      margin-bottom: 70px;
    }

    .signature-column .sign-name {
      font-weight: bold;
      font-size: 13pt;
    }

    /* Screen Toolbar */
    .screen-toolbar {
      position: sticky;
      top: 0;
      z-index: 999;
      background: #1e293b;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
      font-family: system-ui, -apple-system, sans-serif;
      margin-bottom: 20px;
    }

    .screen-toolbar .actions {
      display: flex;
      gap: 12px;
    }

    .screen-toolbar button {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px;
      font-size: 13px;
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
    }

    .btn-print {
      background-color: #2AC1BC;
      color: #fff;
    }
    .btn-print:hover {
      background-color: #23a9a5;
    }

    .btn-download {
      background-color: #475569;
      color: #fff;
    }
    .btn-download:hover {
      background-color: #334155;
    }

    .btn-close {
      background-color: transparent;
      color: #cbd5e1;
      border: 1px solid #475569 !important;
    }
    .btn-close:hover {
      background-color: #334155;
      color: #fff;
    }

    @media print {
      body {
        background-color: #fff;
        padding: 0;
      }
      .contract-page {
        padding: 0;
        box-shadow: none;
        max-width: 100%;
      }
      .screen-toolbar, .no-print {
        display: none !important;
      }
    }
  </style>
</head>
<body>

  ${
    includeToolbar
      ? `
  <div class="screen-toolbar no-print">
    <div style="font-weight: 700; font-size: 14px;">
      DORMIO — Văn bản Hợp đồng thuê phòng (${room.roomNumber})
    </div>
    <div class="actions">
      <button class="btn-print" onclick="window.print()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>
        In hợp đồng
      </button>
      <button class="btn-download" onclick="triggerDownload()">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Lưu văn bản HTML
      </button>
      <button class="btn-close" onclick="window.close()">Đóng</button>
    </div>
  </div>
  `
      : ''
  }

  <div class="contract-page">
    <!-- Quốc hiệu & Tiêu ngữ -->
    <div class="header-national">
      <p class="country">CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM</p>
      <p class="motto">Độc lập - Tự do - Hạnh phúc</p>
      <div class="divider"></div>
      <p style="font-style: italic; font-size: 11pt; margin: 0;">
        ${boardingHouse.address ? boardingHouse.address.split(',').pop()?.trim() || 'Hà Nội' : 'Hà Nội'}, ngày ${day} tháng ${month} năm ${year}
      </p>
    </div>

    <!-- Tiêu đề hợp đồng -->
    <div class="header-title">
      <h1>HỢP ĐỒNG THUÊ PHÒNG TRỌ</h1>
      <p class="contract-code">Mã số HĐ: <strong>${contract.id}</strong></p>
    </div>

    <p class="preamble">
      Hôm nay, ngày ${day} tháng ${month} năm ${year}, tại địa chỉ ${boardingHouse.address || 'khu trọ'}, căn cứ theo Bộ luật Dân sự nước Cộng hòa xã hội chủ nghĩa Việt Nam và thỏa thuận tự nguyện giữa các bên, chúng tôi gồm có:
    </p>

    <!-- BÊN CHO THUÊ (BÊN A) -->
    <div class="section-title">I. BÊN CHO THUÊ (BÊN A)</div>
    <div class="party-block">
      <p><strong>Họ và tên:</strong> ${boardingHouse.owner.fullName || 'Chủ nhà trọ'}</p>
      <p><strong>Số điện thoại:</strong> ${boardingHouse.owner.phoneNumber || '—'}</p>
      ${boardingHouse.owner.email ? `<p><strong>Email:</strong> ${boardingHouse.owner.email}</p>` : ''}
      <p><strong>Đại diện cơ sở:</strong> ${boardingHouse.name}</p>
      <p><strong>Địa chỉ cơ sở:</strong> ${boardingHouse.address || '—'}</p>
    </div>

    <!-- BÊN THUÊ (BÊN B) -->
    <div class="section-title">II. BÊN THUÊ (BÊN B)</div>
    <div class="party-block">
      <p><strong>Họ và tên người thuê:</strong> ${primaryTenant.fullName}</p>
      <p><strong>Số điện thoại:</strong> ${primaryTenant.phoneNumber}</p>
      ${primaryTenant.email ? `<p><strong>Email:</strong> ${primaryTenant.email}</p>` : ''}
      <p><strong>Số CCCD/CMND:</strong> ${idNumber}</p>
      <p><strong>Ngày cấp:</strong> ${idIssueDate} &nbsp;&nbsp;&nbsp;&nbsp; <strong>Nơi cấp:</strong> ${idIssuePlace}</p>
      <p><strong>Nơi thường trú:</strong> ${placeOfResidence}</p>
      <p><strong>Quê quán:</strong> ${placeOfOrigin}</p>
      ${coTenantsHtml}
    </div>

    <p style="margin: 12px 0 8px 0; text-align: justify; font-style: italic;">
      Hai bên cùng thống nhất ký kết Hợp đồng thuê phòng trọ với các điều khoản chi tiết như sau:
    </p>

    <!-- ĐIỀU KHOẢN -->
    <div class="article">
      <div class="article-title">ĐIỀU 1: ĐỐI TƯỢNG HỢP ĐỒNG & THÔNG TIN PHÒNG</div>
      <p>1.1. Bên A đồng ý cho Bên B thuê và Bên B đồng ý thuê phòng số <strong>${room.roomNumber}</strong>, tầng <strong>${room.floor}</strong> thuộc cơ sở nhà trọ <strong>${boardingHouse.name}</strong> tọa lạc tại địa chỉ: ${boardingHouse.address}.</p>
      <p>1.2. Loại phòng: ${room.roomTypeName || 'Tiêu chuẩn'} | Diện tích: ${room.area ? `${room.area} m²` : 'Theo hiện trạng thực tế'} | Số người ở tối đa: ${room.maxOccupants ? `${room.maxOccupants} người` : 'Theo thỏa thuận'}.</p>
      <p>1.3. Mục đích thuê: Dùng để ở và sinh hoạt hợp pháp; nghiêm cấm sử dụng phòng trọ vào các mục đích trái quy định của pháp luật.</p>
    </div>

    <div class="article">
      <div class="article-title">ĐIỀU 2: THỜI HẠN THUÊ</div>
      <p>2.1. Thời hạn thuê là tính từ ngày <strong>${this.formatDate(contract.startDate)}</strong> đến hết ngày <strong>${this.formatDate(contract.endDate)}</strong>.</p>
      <p>2.2. Trước khi hết hạn hợp đồng ít nhất 15 (mười lăm) ngày, nếu Bên B có nguyện vọng tiếp tục thuê thì phải thông báo cho Bên A để hai bên cùng thỏa thuận ký gia hạn hợp đồng hoặc ký hợp đồng mới.</p>
    </div>

    <div class="article">
      <div class="article-title">ĐIỀU 3: GIÁ THUÊ, CHI PHÍ DỊCH VỤ & PHƯƠNG THỨC THANH TOÁN</div>
      <p>3.1. Giá thuê phòng được ấn định là: <strong>${rentPriceVnd} / tháng</strong> (Bằng chữ: <em>${rentPriceWords}</em>).</p>
      <p>3.2. Kỳ thanh toán: Định kỳ hàng tháng, Bên B có trách nhiệm thanh toán tiền thuê phòng và các chi phí dịch vụ cho Bên A vào ngày <strong>${contract.monthlyPaymentDate}</strong> hàng tháng.</p>
      <p class="no-indent" style="margin-top: 6px;">3.3. Các chi phí tiện ích và dịch vụ đi kèm được tính theo bảng dưới đây:</p>
      <table class="services-table">
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên Dịch Vụ</th>
            <th>Đơn Giá</th>
            <th>Đơn Vị</th>
            <th>Hình Thức Thu</th>
          </tr>
        </thead>
        <tbody>
          ${servicesHtml}
        </tbody>
      </table>
    </div>

    <div class="article">
      <div class="article-title">ĐIỀU 4: TIỀN ĐẶT CỌC (TIỀN BẢO ĐẢM)</div>
      <p>4.1. Để bảo đảm việc thực hiện nghiêm túc hợp đồng, Bên B giao cho Bên A một khoản tiền cọc là: <strong>${depositVnd}</strong> (Bằng chữ: <em>${depositWords}</em>).</p>
      <p>4.2. Tiền đặt cọc không được dùng để cấn trừ vào tiền thuê phòng hàng tháng trong thời gian hợp đồng còn hiệu lực, trừ khi có sự đồng ý bằng văn bản của Bên A.</p>
      <p>4.3. Khi hợp đồng chấm dứt đúng thời hạn và Bên B đã thanh toán đầy đủ các khoản tiền phòng, tiền dịch vụ, đồng thời bàn giao lại phòng và trang thiết bị nguyên vẹn, Bên A sẽ hoàn trả lại toàn bộ số tiền cọc cho Bên B trong vòng 03 ngày làm việc.</p>
    </div>

    <div class="article">
      <div class="article-title">ĐIỀU 5: QUYỀN VÀ NGHĨA VỤ CỦA BÊN A</div>
      <p>5.1. Bàn giao phòng trọ và các trang thiết bị kèm theo cho Bên B đúng ngày quy định trong tình trạng sử dụng tốt.</p>
      <p>5.2. Đảm bảo quyền sử dụng phòng trọ trọn vẹn, riêng biệt và an toàn cho Bên B trong suốt thời hạn thuê.</p>
      <p>5.3. Kịp thời sửa chữa những hư hỏng kết cấu lớn của căn nhà không do lỗi của Bên B gây ra.</p>
      <p>5.4. Có quyền đơn phương chấm dứt hợp đồng nếu Bên B chậm trả tiền nhà quá 10 ngày mà không có lý do chính đáng hoặc vi phạm nghiêm trọng nội quy an ninh, trật tự, PCCC.</p>
    </div>

    <div class="article">
      <div class="article-title">ĐIỀU 6: QUYỀN VÀ NGHĨA VỤ CỦA BÊN B</div>
      <p>6.1. Thanh toán tiền thuê phòng và các khoản dịch vụ đúng thời hạn quy định.</p>
      <p>6.2. Cung cấp thông tin nhân thân chính xác, phối hợp cùng Bên A tiến hành đăng ký tạm trú theo đúng quy định pháp luật.</p>
      <p>6.3. Giữ gìn an ninh trật tự chung, tuân thủ nghiêm ngặt các quy định về phòng cháy chữa cháy (PCCC), bảo quản tài sản chung và tài sản trong phòng.</p>
      <p>6.4. Không được tự ý đục phá, thay đổi kết cấu phòng trọ; không được tự ý sang nhượng hoặc cho người khác thuê lại khi chưa có sự đồng ý của Bên A.</p>
      <p>6.5. Bồi thường thiệt hại nếu làm hư hỏng, mất mát trang thiết bị trong phòng trọ do lỗi của mình gây ra.</p>
    </div>

    <div class="article">
      <div class="article-title">ĐIỀU 7: ĐIỀU KHOẢN CHUNG & CAM KẾT</div>
      <p>7.1. Hai bên cam kết thực hiện đúng và đầy đủ các điều khoản đã thỏa thuận trong hợp đồng này. Mọi tranh chấp phát sinh (nếu có) trước hết sẽ được giải quyết trên tinh thần thương lượng, hòa giải.</p>
      <p>7.2. Hợp đồng này gồm có hiệu lực kể từ ngày ký, được lập thành 02 (hai) bản có giá trị pháp lý như nhau, mỗi bên giữ 01 bản để thực hiện.</p>
    </div>

    <!-- KHỐI CHỮ KÝ -->
    <div class="signatures-block">
      <div class="signature-column">
        <div class="title">ĐẠI DIỆN BÊN A</div>
        <div class="note">(Ký và ghi rõ họ tên)</div>
        <div class="sign-name">${boardingHouse.owner.fullName || 'Chủ nhà trọ'}</div>
      </div>
      <div class="signature-column">
        <div class="title">ĐẠI DIỆN BÊN B</div>
        <div class="note">(Ký và ghi rõ họ tên)</div>
        <div class="sign-name">${primaryTenant.fullName}</div>
      </div>
    </div>
  </div>

  <script class="no-print">
    function triggerDownload() {
      const htmlContent = document.documentElement.outerHTML;
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'Hop-dong-thue-phong-${room.roomNumber}-${contract.id.substring(0, 8)}.html';
      link.click();
      URL.revokeObjectURL(link.href);
    }

    ${
      autoPrint
        ? `
    window.addEventListener('DOMContentLoaded', () => {
      setTimeout(() => {
        window.print();
      }, 500);
    });
    `
        : ''
    }
  </script>
</body>
</html>`;
  }
}
