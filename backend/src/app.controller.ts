import { Controller, Get, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiOkResponse } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './common/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
  private readonly logger = new Logger(AppController.name);

  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Application health check / root greeting' })
  @ApiOkResponse({ description: 'Greeting message string', type: String })
  getHello(): string {
    this.logger.log('GET / called (health check)');
    return this.appService.getHello();
  }
}
