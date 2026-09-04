import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class BoardingHouseServiceResponseDto {
  @ApiProperty({ example: 'service-uuid' })
  id: string;

  @ApiProperty({ example: 'Electricity' })
  name: string;

  @ApiProperty({ example: 'kWh' })
  unit: string;

  @ApiProperty({ example: '3500.00', description: 'Decimal value serialized as a string' })
  price: string;

  @ApiProperty({ example: true })
  isMetered: boolean;
}

export class BoardingHouseRoomTypeResponseDto {
  @ApiProperty({ example: 'room-type-uuid' })
  id: string;

  @ApiProperty({ example: 'Studio' })
  name: string;

  @ApiPropertyOptional({ example: 'Private kitchen and bathroom', nullable: true })
  description: string | null;
}

export class BoardingHouseResponseDto {
  @ApiProperty({ example: 'boarding-house-uuid' })
  id: string;

  @ApiProperty({ example: 'Sunrise Residence' })
  name: string;

  @ApiPropertyOptional({ example: 'Near the university campus', nullable: true })
  description: string | null;

  @ApiProperty({ example: 'Vietnam' })
  country: string;

  @ApiProperty({ example: 'Ho Chi Minh City' })
  province: string;

  @ApiProperty({ example: 'Thu Duc City' })
  city: string;

  @ApiProperty({ example: 'Linh Trung Ward' })
  ward: string;

  @ApiProperty({ example: 'Thu Duc District' })
  district: string;

  @ApiProperty({ example: 'Vo Van Ngan Street' })
  street: string;

  @ApiProperty({ example: '1' })
  houseNumber: string;

  @ApiPropertyOptional({ example: 5, nullable: true })
  totalFloor: number | null;

  @ApiProperty({ example: '2020-01-01T00:00:00.000Z' })
  builtAt: string;

  @ApiProperty({ enum: ['active', 'inactive', 'banned'], example: 'active' })
  status: string;

  @ApiProperty({ type: [BoardingHouseServiceResponseDto] })
  services: BoardingHouseServiceResponseDto[];

  @ApiProperty({ type: [BoardingHouseRoomTypeResponseDto] })
  roomTypes: BoardingHouseRoomTypeResponseDto[];
}

export class CreateBoardingHouseResponseDto {
  @ApiProperty({ example: true })
  success: boolean;

  @ApiProperty({ type: BoardingHouseResponseDto })
  data: BoardingHouseResponseDto;
}
