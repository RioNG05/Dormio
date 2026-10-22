import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class TenantTenancyItemDto {
  @ApiProperty({ description: 'Contract UUID' })
  contractId: string

  @ApiProperty({ description: 'Room UUID' })
  roomId: string

  @ApiProperty({ description: 'Room number or identifier', example: '101' })
  roomNumber: string

  @ApiProperty({ description: 'Floor number', example: 1 })
  floor: number

  @ApiPropertyOptional({ description: 'Room type category', example: 'Studio có gác lửng' })
  roomTypeName?: string

  @ApiProperty({ description: 'Boarding House UUID' })
  boardingHouseId: string

  @ApiProperty({ description: 'Boarding House Name', example: 'Nhà Trọ Xanh Cơ Sở 1' })
  boardingHouseName: string

  @ApiProperty({ description: 'Boarding House Address', example: 'Số 123 Đường Cầu Giấy, Hà Nội' })
  boardingHouseAddress: string

  @ApiProperty({ description: 'Monthly rent price in VND', example: 3500000 })
  rentPrice: number

  @ApiProperty({ description: 'Whether this user is the primary tenant on the contract', example: true })
  isPrimary: boolean

  @ApiProperty({ description: 'Contract start date ISO' })
  startDate: string

  @ApiProperty({ description: 'Contract end date ISO' })
  endDate: string

  @ApiPropertyOptional({ description: 'Cover photo URL of the boarding house' })
  coverPhotoUrl?: string
}
