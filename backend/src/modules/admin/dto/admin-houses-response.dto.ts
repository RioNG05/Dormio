import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AdminHouseItemDto {
  @ApiProperty({ description: 'Unique identifier of the boarding house' })
  id: string;

  @ApiProperty({ description: 'Display name of the boarding house' })
  name: string;

  @ApiProperty({ description: 'Full name or username of the landlord' })
  landlordName: string;

  @ApiProperty({ description: 'Phone number of the landlord' })
  landlordPhone: string;

  @ApiProperty({ description: 'Email address of the landlord' })
  landlordEmail: string;

  @ApiProperty({ description: 'Full formatted physical address' })
  address: string;

  @ApiProperty({ description: 'Total number of rooms' })
  totalRooms: number;

  @ApiProperty({ description: 'Number of currently occupied rooms' })
  occupiedRooms: number;

  @ApiProperty({ description: 'Calculated occupancy rate percentage' })
  occupancyRate: number;

  @ApiProperty({
    description: 'Moderation status',
    enum: ['active', 'locked', 'reported'],
  })
  status: 'active' | 'locked' | 'reported';

  @ApiProperty({ description: 'Number of active/pending grievances reported for this house' })
  reportsCount: number;

  @ApiProperty({ description: 'Summary list of report reasons', type: [String] })
  reportReasons: string[];

  @ApiPropertyOptional({ description: 'Reason why the property was locked' })
  lockReason?: string;

  @ApiPropertyOptional({ description: 'ISO date string when the property was locked' })
  lockedAt?: string;

  @ApiProperty({ description: 'ISO date string when the property was created' })
  createdAt: string;

  @ApiProperty({ description: 'Cover image URL of the property' })
  coverImage: string;
}

export class AdminHousesPaginationDto {
  @ApiProperty({ description: 'Total number of records matching filter criteria' })
  total: number;

  @ApiProperty({ description: 'Current page number' })
  page: number;

  @ApiProperty({ description: 'Number of records per page' })
  limit: number;

  @ApiProperty({ description: 'Total number of pages' })
  totalPages: number;
}

export class AdminHousesListResponseDto {
  @ApiProperty({ description: 'Whether the operation was successful' })
  success: boolean;

  @ApiProperty({ description: 'List of boarding house moderation items', type: [AdminHouseItemDto] })
  data: AdminHouseItemDto[];

  @ApiProperty({ description: 'Pagination details', type: AdminHousesPaginationDto })
  pagination: AdminHousesPaginationDto;
}
