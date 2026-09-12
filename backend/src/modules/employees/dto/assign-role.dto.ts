import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class AssignRoleDto {
  @ApiPropertyOptional({
    description: 'Target existing JobPosition ID to assign to this staff member',
    example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f',
  })
  @IsOptional()
  @IsString()
  positionId?: string;

  @ApiPropertyOptional({
    description: 'Inline creation of a new job position name if positionId is not supplied',
    example: 'Kế toán kiêm Thủ quỹ',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  newPositionName?: string;

  @ApiPropertyOptional({
    description: 'Duty description / task list for inline position creation',
    example: 'Thu tiền phòng, lập hóa đơn, theo dõi công nợ hàng tháng',
  })
  @IsOptional()
  @IsString()
  newPositionDescription?: string;
}
