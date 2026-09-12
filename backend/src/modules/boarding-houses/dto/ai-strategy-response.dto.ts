import { ApiProperty } from '@nestjs/swagger';

export class StrategyActionStepDto {
  @ApiProperty({ example: 1 })
  dayRange: string; // e.g., "Ngày 1 - 7"

  @ApiProperty({ example: 'Khảo sát và điều chỉnh giá' })
  title: string;

  @ApiProperty({
    example: 'Giảm 5% giá thuê cho các phòng trống trên 30 ngày tại cơ sở Cầu Giấy.',
  })
  description: string;
}

export class AiStrategyResponseDto {
  @ApiProperty({ example: 'Chiến lược tối ưu hóa lợi nhuận và lấp đầy phòng Q3/2026' })
  title: string;

  @ApiProperty({
    example:
      'Hệ thống đang vận hành 3 cơ sở với tỷ lệ lấp đầy 84.4%. Điểm nghẽn lớn nhất nằm ở cơ sở Nam Từ Liêm với 4 phòng trống kéo dài.',
  })
  executiveSummary: string;

  @ApiProperty({
    example: [
      'Áp dụng chiến lược giá linh hoạt theo tầng tại cơ sở Cầu Giấy để tăng 8% doanh thu.',
      'Đưa ra gói ưu đãi cọc 0.5 tháng cho khách ký hợp đồng 12 tháng tại các phòng trống.',
    ],
  })
  pricingRecommendations: string[];

  @ApiProperty({
    example: [
      'Đăng tin nổi bật trên nền tảng Dormio kèm huy hiệu "Phòng sạch mới nâng cấp".',
      'Liên kết với hội sinh viên các trường ĐH Quốc Gia và ĐH Sư Phạm trong bán kính 2km.',
    ],
  })
  marketingCampaigns: string[];

  @ApiProperty({
    example: [
      'Kiểm tra định mức tiêu thụ điện nước khu vực chung để giảm 15% chi phí vận hành.',
      'Áp dụng quy trình thu nợ tự động qua tin nhắn Zalo trước hạn 3 ngày.',
    ],
  })
  operationalOptimizations: string[];

  @ApiProperty({ type: [StrategyActionStepDto] })
  actionPlan30Days: StrategyActionStepDto[];

  @ApiProperty({ example: '2026-09-12T01:45:00.000Z' })
  createdAt: string;
}
