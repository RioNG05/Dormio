import { ApiProperty } from '@nestjs/swagger';

export class UnlistedRoomResponseDto {
  @ApiProperty({ example: 'a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d' })
  roomId: string;

  @ApiProperty({ example: '102' })
  roomNumber: string;

  @ApiProperty({ example: 1 })
  floor: number;

  @ApiProperty({ example: 25.5, nullable: true })
  area: number | null;

  @ApiProperty({ example: 'Studio' })
  roomTypeName: string;

  @ApiProperty({ example: 'b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e' })
  boardingHouseId: string;

  @ApiProperty({ example: 'Nhà trọ Cầu Giấy' })
  boardingHouseName: string;

  @ApiProperty({ example: '123 Cầu Giấy, Dịch Vọng, Cầu Giấy, Hà Nội' })
  boardingHouseAddress: string;

  @ApiProperty({ example: 'available' })
  status: string;

  @ApiProperty({ example: 3500000 })
  basePrice: number;

  @ApiProperty({ example: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af', nullable: true })
  thumbnail: string | null;

  @ApiProperty({ example: 12, description: 'Days this room has been vacant without an active post' })
  vacantDays: number;
}
