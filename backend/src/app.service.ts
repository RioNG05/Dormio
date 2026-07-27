import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'Dormio NestJS API Backend',
      timestamp: new Date().toISOString(),
    };
  }
}
