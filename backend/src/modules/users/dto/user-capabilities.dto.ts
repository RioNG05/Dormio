import { ApiProperty } from '@nestjs/swagger';

export class UserCapabilitiesDto {
  @ApiProperty({
    description: 'True if the user owns at least one BoardingHouse',
    example: true,
  })
  isLandlord: boolean;

  @ApiProperty({
    description:
      'True if the user has at least one active TenantContract (i.e. is currently renting a room)',
    example: false,
  })
  isTenant: boolean;

  @ApiProperty({
    description:
      'True if the user has at least one active EmployeeAssignment (i.e. is currently employed at a property)',
    example: false,
  })
  isEmployee: boolean;

  @ApiProperty({
    description:
      'True if user.role === "admin". Admin is the only capability gated by the role field (per spec 07-auth_roles.md)',
    example: false,
  })
  isAdmin: boolean;
}

export class UserCapabilitiesResponseDto {
  @ApiProperty({
    description:
      'The highest-achieved display role (stored in User.role). Used for UI display purposes only, NOT for authorization.',
    example: 'landlord',
  })
  role: string;

  @ApiProperty({ type: UserCapabilitiesDto })
  capabilities: UserCapabilitiesDto;
}
