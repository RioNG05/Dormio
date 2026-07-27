import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { PaymentsService, WebhookPayload } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(@Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(dto);
  }

  @Get('vietqr/:invoiceId')
  async getVietQR(@Param('invoiceId') invoiceId: string) {
    return this.paymentsService.getVietQR(invoiceId);
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: WebhookPayload) {
    return this.paymentsService.handleWebhook(payload);
  }
}

