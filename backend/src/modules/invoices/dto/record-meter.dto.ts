import { IsInt, IsNotEmpty, IsNumber, IsUUID, Max, Min } from 'class-validator';

export class RecordMeterDto {
  @IsNotEmpty({ message: 'Contract ID không được để trống' })
  @IsUUID()
  contractId: string;

  @IsNotEmpty({ message: 'Tháng không được để trống' })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @IsNotEmpty({ message: 'Năm không được để trống' })
  @IsInt()
  @Min(2020)
  year: number;

  @IsNotEmpty({ message: 'Chỉ số điện đầu không được để trống' })
  @IsNumber()
  @Min(0)
  electricityStart: number;

  @IsNotEmpty({ message: 'Chỉ số điện cuối không được để trống' })
  @IsNumber()
  @Min(0)
  electricityEnd: number;

  @IsNotEmpty({ message: 'Chỉ số nước đầu không được để trống' })
  @IsNumber()
  @Min(0)
  waterStart: number;

  @IsNotEmpty({ message: 'Chỉ số nước cuối không được để trống' })
  @IsNumber()
  @Min(0)
  waterEnd: number;
}
