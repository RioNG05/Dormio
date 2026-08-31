import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LandlordInfoDto {
  @ApiProperty({ description: 'Landlord name' })
  name: string;

  @ApiProperty({ description: 'Landlord phone number / hotline' })
  phoneNumber: string;

  @ApiPropertyOptional({ description: 'Landlord email' })
  email?: string;
}

export class BoardingHouseInfoDto {
  @ApiProperty({ description: 'Boarding house ID' })
  id: string;

  @ApiProperty({ description: 'Boarding house name' })
  name: string;

  @ApiProperty({ description: 'Full address of the boarding house' })
  address: string;

  @ApiProperty({ type: LandlordInfoDto, description: 'Landlord contact info' })
  landlord: LandlordInfoDto;
}

export class RoomInfoDto {
  @ApiProperty({ description: 'Room ID' })
  id: string;

  @ApiProperty({ description: 'Room number/code' })
  roomNumber: string;

  @ApiProperty({ description: 'Floor number' })
  floor: number;

  @ApiPropertyOptional({ description: 'Area in square meters' })
  area?: number;

  @ApiPropertyOptional({ description: 'Max occupants allowed' })
  maxOccupants?: number;

  @ApiPropertyOptional({ description: 'Room type name' })
  roomTypeName?: string;
}

export class ContractDocumentDto {
  @ApiProperty({ description: 'Document ID' })
  id: string;

  @ApiProperty({ description: 'File URL' })
  url: string;

  @ApiProperty({ description: 'Creation date' })
  createdAt: Date;
}

export class ContractInfoDto {
  @ApiProperty({ description: 'Contract ID' })
  id: string;

  @ApiProperty({ description: 'Start date of the contract' })
  startDate: Date;

  @ApiProperty({ description: 'End date of the contract' })
  endDate: Date;

  @ApiProperty({ description: 'Monthly rent price in VND' })
  rentPrice: number;

  @ApiProperty({ description: 'Day of month rent is due (1-31)' })
  monthlyPaymentDate: number;

  @ApiProperty({ description: 'Deposit amount in VND' })
  depositAmount: number;

  @ApiPropertyOptional({ description: 'Contract note' })
  note?: string;

  @ApiProperty({ type: [ContractDocumentDto], description: 'Contract documents/files' })
  documents: ContractDocumentDto[];
}

export class TenancyServiceDto {
  @ApiProperty({ description: 'Service ID' })
  id: string;

  @ApiProperty({ description: 'Service name (e.g. Điện, Nước, Rác, Wifi)' })
  name: string;

  @ApiProperty({ description: 'Service price' })
  price: number;

  @ApiProperty({ description: 'Service unit (e.g. kWh, m³, tháng)' })
  unit: string;

  @ApiProperty({ description: 'Whether this is a metered service' })
  isMetered: boolean;
}

export class TenancyAnnouncementDto {
  @ApiProperty({ description: 'Announcement notification ID' })
  id: string;

  @ApiProperty({ description: 'Announcement title or preview' })
  title: string;

  @ApiProperty({ description: 'Full announcement content' })
  content: string;

  @ApiProperty({ description: 'Announcement creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Whether this announcement is new (e.g. recent or unread)' })
  isNew: boolean;
}

export class TenancyDetailsDto {
  @ApiProperty({ type: ContractInfoDto })
  contract: ContractInfoDto;

  @ApiProperty({ type: RoomInfoDto })
  room: RoomInfoDto;

  @ApiProperty({ type: BoardingHouseInfoDto })
  boardingHouse: BoardingHouseInfoDto;

  @ApiProperty({ type: [TenancyServiceDto] })
  services: TenancyServiceDto[];

  @ApiProperty({ type: [TenancyAnnouncementDto] })
  announcements: TenancyAnnouncementDto[];
}
