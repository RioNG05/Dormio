import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class OnboardStaffDto {
  @ApiProperty({
    description: 'Staff phone number used for lookup or account creation',
    example: '0901234567',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^(0|\+84)[3|5|7|8|9][0-9]{8}$|^[0-9]{9,15}$/, {
    message: 'Số điện thoại không hợp lệ',
  })
  phoneNumber: string;

  @ApiPropertyOptional({
    description: 'Full name of staff member (required if creating a new user)',
    example: 'Nguyễn Văn Bảo',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  fullName?: string;

  @ApiPropertyOptional({
    description: 'ID of an existing job position for this property',
    example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f',
  })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional({
    description: 'Inline creation of a new job position name if positionId is not supplied',
    example: 'Kỹ thuật điện nước',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  newPositionName?: string;

  @ApiPropertyOptional({
    description: 'Duties and responsibilities description for inline position creation',
    example: 'Bảo trì hệ thống máy bơm, sửa chữa điện nước các phòng',
  })
  @IsOptional()
  @IsString()
  newPositionDescription?: string;

  @ApiPropertyOptional({
    description: 'Employment start date in ISO format (defaults to current timestamp)',
    example: '2026-09-11T00:00:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  joinedAt?: string;

  @ApiPropertyOptional({
    description: 'Optional note or assignment details',
    example: 'Thử việc 1 tháng',
  })
  @IsOptional()
  @IsString()
  note?: string;
}
