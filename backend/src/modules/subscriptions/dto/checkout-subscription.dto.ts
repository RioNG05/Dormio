import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty } from 'class-validator';

export enum CheckoutPlanTier {
  PLUS = 'plus',
  PRO = 'pro',
}

export enum CheckoutBillingCycle {
  MONTHLY = 'monthly',
  QUARTERLY = 'quarterly',
  YEARLY = 'yearly',
}

export class CheckoutSubscriptionDto {
  @ApiProperty({
    enum: CheckoutPlanTier,
    example: 'plus',
    description: 'The subscription package to purchase (plus or pro)',
  })
  @IsNotEmpty({ message: 'planName cannot be empty' })
  @IsEnum(CheckoutPlanTier, { message: 'planName must be plus or pro' })
  planName: CheckoutPlanTier;

  @ApiProperty({
    enum: CheckoutBillingCycle,
    example: 'monthly',
    description: 'The billing cycle (monthly, quarterly, yearly)',
  })
  @IsNotEmpty({ message: 'billingCycle cannot be empty' })
  @IsEnum(CheckoutBillingCycle, { message: 'billingCycle must be monthly, quarterly, or yearly' })
  billingCycle: CheckoutBillingCycle;
}
