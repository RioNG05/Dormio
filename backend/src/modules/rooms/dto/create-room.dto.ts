import { IsArray, IsEnum, IsInt, IsNotEmpty, IsNumber, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { RoomStatus } from '@prisma/client';

export class CreateRoomDto {
  @IsNotEmpty({ message: 'House ID không được để trống' })
  @IsUUID()
  houseId: string;

  @IsNotEmpty({ message: 'Mã phòng không được để trống' })
  @IsString()
  code: string;

  @IsNotEmpty({ message: 'Tiêu đề phòng không được để trống' })
  @IsString()
  title: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  floor?: number;

  @IsNotEmpty({ message: 'Giá thuê không được để trống' })
  @IsNumber()
  @Min(0)
  price: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  depositAmount?: number;

  @IsNotEmpty({ message: 'Diện tích không được để trống' })
  @IsNumber()
  @Min(1)
  areaSqm: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccupants?: number;

  @IsOptional()
  @IsEnum(RoomStatus)
  status?: RoomStatus;

  @IsOptional()
  @IsArray()
  facilities?: string[];

  @IsOptional()
  @IsArray()
  images?: string[];
}
