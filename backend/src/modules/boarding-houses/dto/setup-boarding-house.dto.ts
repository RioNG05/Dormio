import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const MONEY_PATTERN = /^(?:0|[1-9]\d{0,9})(?:\.\d{1,2})?$/;

// ─── Step 2a: Services ────────────────────────────────────────────────────────

export class SetupServiceDto {
  @ApiProperty({ example: 'Electricity', description: 'Service name, e.g. Điện, Nước, WiFi' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: '3500.00', description: 'Unit price as a non-negative decimal with up to 2 decimal places' })
  @IsString()
  @Matches(MONEY_PATTERN, { message: 'price must be a non-negative decimal with up to two decimal places' })
  price: string;

  @ApiProperty({ example: 'kWh', description: 'Billing unit, e.g. kWh, m³, tháng' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'unit must not be blank' })
  @MaxLength(255)
  unit: string;

  @ApiProperty({ example: true, description: 'Whether usage is measured by a meter' })
  @IsBoolean()
  @Type(() => Boolean)
  isMetered: boolean;

  @ApiProperty({ example: true, description: 'Whether this service is automatically applied to new contracts' })
  @IsBoolean()
  @Type(() => Boolean)
  autoApplied: boolean;
}

// ─── Step 2b: Room Types ─────────────────────────────────────────────────────

export class SetupRoomTypeDto {
  @ApiProperty({ example: 'Studio', description: 'Room type name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Private kitchen and bathroom', description: 'Optional room type description' })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}

// ─── Step 3: Rooms ───────────────────────────────────────────────────────────

export class SetupRoomsDto {
  @ApiProperty({ example: 3, minimum: 1, description: 'Number of floors to generate rooms for (≤ totalFloor)' })
  @IsInt()
  @Min(1)
  @Max(100)
  floorCount: number;

  @ApiProperty({ example: 5, minimum: 1, description: 'Number of rooms per floor' })
  @IsInt()
  @Min(1)
  @Max(100)
  roomsPerFloor: number;

  @ApiProperty({
    example: 'P{floor}0{index}',
    description: 'Room number template. {floor} is replaced by floor number, {index} by room index within the floor.',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nameFormat: string;

  @ApiPropertyOptional({ example: '25.50', description: 'Room area in m² (applied to all generated rooms)' })
  @IsOptional()
  @IsString()
  @Matches(/^(?:0|[1-9]\d{0,6})(?:\.\d{1,2})?$/, { message: 'area must be a positive decimal with up to two decimal places' })
  area?: string;

  @ApiPropertyOptional({ example: 2, minimum: 1, description: 'Maximum occupants per room' })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxOccupants?: number;

  @ApiProperty({
    example: 0,
    description: '0-based index into the roomTypes array provided in step 2 (resolves to a real RoomType UUID in the service)',
  })
  @IsInt()
  @Min(0)
  roomTypeIndex: number;

  @ApiPropertyOptional({
    example: [0, 1],
    description: '0-based indices into the services array provided in step 2 (each resolves to a real Service UUID). Empty = no services attached.',
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  @Min(0, { each: true })
  serviceIndices?: number[];
}

// ─── Full Setup Payload ───────────────────────────────────────────────────────

export class SetupBoardingHouseDto {
  // ── Step 1: General Info ──────────────────────────────────────────────────

  @ApiProperty({ example: 'Sunrise Residence', description: 'Property name (shown in the building selector)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'name must not be blank' })
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({ example: 'Near the university campus', description: 'Free-text description of the property' })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @ApiProperty({ example: '12/4', description: 'House number' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'houseNumber must not be blank' })
  @MaxLength(255)
  houseNumber: string;

  @ApiProperty({ example: 'Vo Van Ngan', description: 'Street name' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'street must not be blank' })
  @MaxLength(255)
  street: string;

  @ApiProperty({ example: 'Linh Trung Ward', description: 'Ward (Phường/Xã)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'ward must not be blank' })
  @MaxLength(255)
  ward: string;

  @ApiProperty({ example: 'Thu Duc District', description: 'District (Quận/Huyện)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'district must not be blank' })
  @MaxLength(255)
  district: string;

  @ApiProperty({ example: 'Ho Chi Minh City', description: 'Province or municipality (Tỉnh/Thành phố)' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'province must not be blank' })
  @MaxLength(255)
  province: string;

  @ApiPropertyOptional({ example: 'Thu Duc City', description: 'City/Town (Thành phố/Thị xã)' })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  city?: string;

  @ApiProperty({ example: 'Vietnam', description: 'Country — defaults to "Việt Nam"' })
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/, { message: 'country must not be blank' })
  @MaxLength(255)
  country: string;

  @ApiPropertyOptional({ example: 5, minimum: 1, description: 'Total number of floors in the building' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  totalFloor?: number;

  @ApiProperty({ example: '2020-01-01', format: 'date', description: 'Construction/built date (ISO 8601)' })
  @IsDateString()
  builtAt: string;

  @ApiPropertyOptional({ example: 'https://res.cloudinary.com/...', description: 'Cloudinary URL for the property thumbnail' })
  @IsOptional()
  @IsString()
  @IsUrl({}, { message: 'thumbnail must be a valid URL' })
  thumbnail?: string;

  // ── Step 2: Services + Room Types ────────────────────────────────────────

  @ApiPropertyOptional({
    type: [SetupServiceDto],
    description: 'Initial services for this property. At least one is recommended (Điện, Nước, WiFi).',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => SetupServiceDto)
  services?: SetupServiceDto[];

  @ApiProperty({
    type: [SetupRoomTypeDto],
    description: 'Room types for this property. At least one is required to generate rooms in step 3.',
    minItems: 1,
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one room type is required' })
  @ArrayMaxSize(50)
  @ValidateNested({ each: true })
  @Type(() => SetupRoomTypeDto)
  roomTypes: SetupRoomTypeDto[];

  // ── Step 3: Bulk Room Generation ─────────────────────────────────────────

  @ApiProperty({ type: SetupRoomsDto, description: 'Bulk room generation parameters from Step 3' })
  @ValidateNested()
  @Type(() => SetupRoomsDto)
  rooms: SetupRoomsDto;
}
