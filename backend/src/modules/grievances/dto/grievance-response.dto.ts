import { ApiProperty } from '@nestjs/swagger'

export class GrievanceImageDto {
  @ApiProperty({ example: 'img-uuid-1', description: 'Image UUID' })
  id: string

  @ApiProperty({
    example: 'https://res.cloudinary.com/dormio/image/upload/evidence1.jpg',
    description: 'Evidence image URL',
  })
  url: string

  @ApiProperty({
    example: '2026-08-31T16:00:00.000Z',
    description: 'Upload timestamp',
  })
  createdAt: string
}

export class GrievanceDto {
  @ApiProperty({ example: 'grievance-uuid-1', description: 'Grievance UUID' })
  id: string

  @ApiProperty({
    enum: ['complaint', 'inquiry', 'feedback'],
    example: 'complaint',
    description: 'Grievance type: complaint, inquiry, feedback',
  })
  type: 'complaint' | 'inquiry' | 'feedback'

  @ApiProperty({
    example: 'Landlord arbitrarily increased electricity rates contrary to lease agreement',
    description: 'Grievance title',
  })
  title: string

  @ApiProperty({
    example: 'Detailed description of the incident...',
    description: 'Detailed description',
  })
  description: string

  @ApiProperty({
    enum: ['low', 'medium', 'high'],
    example: 'medium',
    description: 'Priority level',
  })
  priority: 'low' | 'medium' | 'high'

  @ApiProperty({
    enum: ['pending', 'in_progress', 'resolved', 'rejected'],
    example: 'pending',
    description: 'Resolution status by Admin',
  })
  status: 'pending' | 'in_progress' | 'resolved' | 'rejected'

  @ApiProperty({
    example: 'Dormio Tan Binh Boarding House',
    nullable: true,
    description: 'Boarding house name',
  })
  boardingHouseName: string | null

  @ApiProperty({ example: '101', nullable: true, description: 'Room number' })
  roomNumber: string | null

  @ApiProperty({
    example: 'Warned the landlord and required refunding the overcharged difference.',
    nullable: true,
    description: 'Admin response / resolution notes',
  })
  resolutionNote: string | null

  @ApiProperty({
    example: '2026-09-01T10:00:00.000Z',
    nullable: true,
    description: 'Resolution timestamp',
  })
  resolvedAt: string | null

  @ApiProperty({
    example: 'Nguyen Quang Huy (Admin)',
    nullable: true,
    description: 'Resolved by Admin',
  })
  resolvedByName: string | null

  @ApiProperty({
    type: [GrievanceImageDto],
    description: 'List of attached proof images',
  })
  images: GrievanceImageDto[]

  @ApiProperty({
    example: '2026-08-31T15:30:00.000Z',
    description: 'Submission date',
  })
  createdAt: string

  @ApiProperty({
    example: '2026-08-31T15:30:00.000Z',
    description: 'Last updated date',
  })
  updatedAt: string
}

export class GrievanceListResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: [GrievanceDto] })
  data: GrievanceDto[]
}

export class GrievanceDetailResponseDto {
  @ApiProperty({ example: true })
  success: boolean

  @ApiProperty({ type: GrievanceDto })
  data: GrievanceDto
}
