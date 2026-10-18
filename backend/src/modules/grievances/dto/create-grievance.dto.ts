import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import {
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
  IsArray,
  ArrayMaxSize,
  MinLength,
  MaxLength,
} from 'class-validator'

export enum GrievancePriorityEnum {
  low = 'low',
  medium = 'medium',
  high = 'high',
}

export enum GrievanceTypeEnum {
  complaint = 'complaint',
  inquiry = 'inquiry',
  feedback = 'feedback',
}

export class CreateGrievanceDto {
  @ApiProperty({
    enum: GrievanceTypeEnum,
    default: GrievanceTypeEnum.complaint,
    example: GrievanceTypeEnum.complaint,
    description: 'Grievance type: complaint, inquiry, feedback',
  })
  @IsNotEmpty({ message: 'Grievance type cannot be empty' })
  @IsEnum(GrievanceTypeEnum, {
    message: 'Grievance type must be complaint, inquiry, or feedback',
  })
  type: GrievanceTypeEnum

  @ApiProperty({
    example: 'Landlord arbitrarily increased electricity rates contrary to lease agreement',
    description: 'Title of the grievance / inquiry / feedback',
  })
  @IsNotEmpty({ message: 'Title cannot be empty' })
  @IsString({ message: 'Title must be a string' })
  @MinLength(5, { message: 'Title must have at least 5 characters' })
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string

  @ApiProperty({
    example:
      'The landlord unilaterally announced an electricity price increase from 3,500 VND to 5,000 VND/kWh without tenant consent...',
    description: 'Detailed description of the grievance',
  })
  @IsNotEmpty({ message: 'Description cannot be empty' })
  @IsString({ message: 'Description must be a string' })
  @MinLength(10, { message: 'Description must have at least 10 characters' })
  description: string

  @ApiPropertyOptional({
    enum: GrievancePriorityEnum,
    default: GrievancePriorityEnum.medium,
    description: 'Priority level (low, medium, high)',
  })
  @IsOptional()
  @IsEnum(GrievancePriorityEnum, {
    message: 'Priority must be low, medium, or high',
  })
  priority?: GrievancePriorityEnum

  @ApiPropertyOptional({
    type: [String],
    example: [
      'https://res.cloudinary.com/dormio/image/upload/evidence1.jpg',
      'https://res.cloudinary.com/dormio/image/upload/evidence2.jpg',
    ],
    description: 'List of proof evidence image URLs (max 5 images)',
  })
  @IsOptional()
  @IsArray({ message: 'imageUrls must be an array of strings' })
  @ArrayMaxSize(5, { message: 'Maximum 5 evidence images allowed' })
  @IsString({ each: true, message: 'Each image URL must be a valid string' })
  imageUrls?: string[]
}
