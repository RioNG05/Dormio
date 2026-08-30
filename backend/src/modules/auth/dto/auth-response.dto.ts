import { ApiProperty } from '@nestjs/swagger';

/** Sanitized user object returned to clients (hashedPassword is excluded). */
export class UserDto {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6', format: 'uuid' })
  id: string;

  @ApiProperty({ example: '0901234567', description: 'Vietnamese phone number (10 digits)' })
  phoneNumber: string;

  @ApiProperty({ example: 'Nguyen Van A', nullable: true, description: 'Display name' })
  username: string | null;

  @ApiProperty({
    enum: ['landlord', 'tenant', 'staff', 'admin'],
    example: 'landlord',
    description: 'User role in the system',
  })
  role: string;

  @ApiProperty({
    example: false,
    description: 'When true, the user must change their password before accessing the dashboard',
  })
  mustChangePassword: boolean;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-01T00:00:00.000Z' })
  updatedAt: Date;
}

/** Response body for POST /auth/register */
export class RegisterResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  token: string;

  @ApiProperty({ type: () => UserDto })
  user: UserDto;
}

/** Response body for POST /auth/login */
export class LoginResponseDto {
  @ApiProperty({ description: 'JWT access token' })
  token: string;

  @ApiProperty({ type: () => UserDto })
  user: UserDto;

  @ApiProperty({
    example: false,
    description:
      'When true, redirect the user to /change-password before allowing dashboard access',
  })
  mustChangePassword: boolean;
}

/** Response body for PATCH /auth/change-password */
export class ChangePasswordResponseDto {
  @ApiProperty({ example: 'Password changed successfully' })
  message: string;
}
