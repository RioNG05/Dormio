import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';

export class CreateContractDto {
  @IsNotEmpty({ message: 'House ID không được để trống' })
  @IsUUID()
  houseId: string;

  @IsNotEmpty({ message: 'Room ID không được để trống' })
  @IsUUID()
  roomId: string;

  @IsNotEmpty({ message: 'Landlord ID không được để trống' })
  @IsUUID()
  landlordId: string;

  @IsNotEmpty({ message: 'Tenant ID không được để trống' })
  @IsUUID()
  tenantId: string;

  @IsNotEmpty({ message: 'Ngày bắt đầu hợp đồng không được để trống' })
  @IsDateString()
  startDate: string;

  @IsNotEmpty({ message: 'Ngày kết thúc hợp đồng không được để trống' })
  @IsDateString()
  endDate: string;

  @IsNotEmpty({ message: 'Giá thuê hợp đồng không được để trống' })
  @IsNumber()
  @Min(0)
  rentalPrice: number;

  @IsNotEmpty({ message: 'Tiền cọc không được để trống' })
  @IsNumber()
  @Min(0)
  depositAmount: number;

  @IsOptional()
  @IsString()
  notes?: string;
}
