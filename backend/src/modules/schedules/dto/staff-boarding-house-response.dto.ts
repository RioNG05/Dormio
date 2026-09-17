import { ApiProperty } from '@nestjs/swagger';

export class StaffBoardingHouseResponseDto {
  @ApiProperty({
    description: 'Boarding house unique identifier',
    example: 'c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the boarding house',
    example: 'KTX HOLA (Khu A)',
  })
  name: string;

  @ApiProperty({
    description: 'Detailed street address of the property',
    example: 'Km29 Khu CNC Hoà Lạc, Thạch Thất, Hà Nội',
    nullable: true,
  })
  address?: string | null;
}

