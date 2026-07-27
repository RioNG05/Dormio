import { IsArray, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID } from 'class-validator';
import { ComplaintPriority, ComplaintStatus } from '@prisma/client';

export class CreateComplaintDto {
  @IsNotEmpty({ message: 'House ID không được để trống' })
  @IsUUID()
  houseId: string;

  @IsNotEmpty({ message: 'Room ID không được để trống' })
  @IsUUID()
  roomId: string;

  @IsNotEmpty({ message: 'Tenant ID không được để trống' })
  @IsUUID()
  tenantId: string;

  @IsNotEmpty({ message: 'Tiêu đề phản ánh không được để trống' })
  @IsString()
  title: string;

  @IsNotEmpty({ message: 'Nội dung chi tiết không được để trống' })
  @IsString()
  description: string;

  @IsOptional()
  @IsEnum(ComplaintPriority)
  priority?: ComplaintPriority;

  @IsOptional()
  @IsArray()
  images?: string[];
}

export class UpdateComplaintStatusDto {
  @IsNotEmpty()
  @IsEnum(ComplaintStatus)
  status: ComplaintStatus;
}
