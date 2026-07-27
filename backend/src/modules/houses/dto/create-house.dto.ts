import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

export class CreateHouseDto {
  @IsNotEmpty({ message: 'Tên nhà trọ không được để trống' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Địa chỉ không được để trống' })
  @IsString()
  address: string;

  @IsNotEmpty({ message: 'Thành phố/Tỉnh không được để trống' })
  @IsString()
  city: string;

  @IsNotEmpty({ message: 'Quận/Huyện không được để trống' })
  @IsString()
  district: string;

  @IsNotEmpty({ message: 'Phường/Xã không được để trống' })
  @IsString()
  ward: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  totalFloors?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  rules?: string;
}
