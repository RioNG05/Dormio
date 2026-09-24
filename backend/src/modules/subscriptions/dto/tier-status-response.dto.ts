import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TierStatusResponseDto {
  @ApiProperty({
    example: 'plus',
    description: 'The plan name evaluated',
  })
  planName: string;

  @ApiProperty({
    example: true,
    description: 'Whether the user currently has an active subscription for this exact tier',
  })
  hasActiveSameTier: boolean;

  @ApiPropertyOptional({
    example: '2026-09-30T23:59:59.000Z',
    description: 'The expiration date of the current active tier if any',
  })
  currentEndDate: string | null;

  @ApiProperty({
    example: '2026-10-01T00:00:00.000Z',
    description:
      'The calculated start date for a new subscription. If user already has an active subscription for this tier, it starts right after currentEndDate.',
  })
  effectiveStartDate: string;
}
