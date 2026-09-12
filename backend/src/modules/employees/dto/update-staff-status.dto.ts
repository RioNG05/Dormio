import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AssignmentStatus } from '@prisma';

export class UpdateStaffStatusDto {
  @ApiProperty({
    description: 'Updated employment status: active or inactive (UC-L-20)',
    enum: AssignmentStatus,
    example: AssignmentStatus.inactive,
  })
  @IsEnum(AssignmentStatus)
  @IsNotEmpty()
  status: AssignmentStatus;

  @ApiPropertyOptional({
    description: 'Optional update to job position ID',
    example: 'c6f9e8a0-2f3b-4e1a-9f5e-7a8b9c0d1e2f',
  })
  @IsOptional()
  @IsString()
  positionId?: string;
}
