import { ApiProperty } from '@nestjs/swagger';

export class GrievanceImageDto {
  @ApiProperty({ example: 'img-uuid-1', description: 'Mã định danh ảnh' })
  id: string;

  @ApiProperty({
    example: 'https://res.cloudinary.com/dormio/image/upload/evidence1.jpg',
    description: 'Đường dẫn ảnh bằng chứng',
  })
  url: string;

  @ApiProperty({
    example: '2026-08-31T16:00:00.000Z',
    description: 'Thời điểm tải lên',
  })
  createdAt: string;
}

export class GrievanceDto {
  @ApiProperty({ example: 'grievance-uuid-1', description: 'Mã khiếu nại' })
  id: string;

  @ApiProperty({
    example: 'Chủ trọ tự ý tăng tiền điện sai thỏa thuận hợp đồng',
    description: 'Tiêu đề khiếu nại',
  })
  title: string;

  @ApiProperty({
    example: 'Mô tả chi tiết nội dung sự việc...',
    description: 'Nội dung chi tiết',
  })
  description: string;

  @ApiProperty({
    enum: ['low', 'medium', 'high'],
    example: 'medium',
    description: 'Mức độ ưu tiên',
  })
  priority: 'low' | 'medium' | 'high';

  @ApiProperty({
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    example: 'pending',
    description: 'Trạng thái xử lý của Ban Quản Trị',
  })
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected';

  @ApiProperty({
    example: 'Nhà trọ Dormio Tân Bình',
    description: 'Tên nhà trọ xảy ra sự việc',
  })
  boardingHouseName: string;

  @ApiProperty({ example: '101', description: 'Số phòng' })
  roomNumber: string;

  @ApiProperty({
    example: 'Đã cảnh cáo chủ trọ và yêu cầu hoàn trả số tiền chênh lệch.',
    nullable: true,
    description: 'Ghi chú phản hồi / kết quả giải quyết của BQT',
  })
  resolutionNote: string | null;

  @ApiProperty({
    example: '2026-09-01T10:00:00.000Z',
    nullable: true,
    description: 'Thời điểm giải quyết',
  })
  resolvedAt: string | null;

  @ApiProperty({
    example: 'Nguyễn Quang Huy (Admin)',
    nullable: true,
    description: 'Người xử lý khiếu nại',
  })
  resolvedByName: string | null;

  @ApiProperty({
    type: [GrievanceImageDto],
    description: 'Danh sách ảnh bằng chứng đính kèm',
  })
  images: GrievanceImageDto[];

  @ApiProperty({
    example: '2026-08-31T15:30:00.000Z',
    description: 'Ngày gửi khiếu nại',
  })
  createdAt: string;

  @ApiProperty({
    example: '2026-08-31T15:30:00.000Z',
    description: 'Ngày cập nhật gần nhất',
  })
  updatedAt: string;
}

export class GrievanceListResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: [GrievanceDto] })
  data: GrievanceDto[];
}

export class GrievanceDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: GrievanceDto })
  data: GrievanceDto;
}
