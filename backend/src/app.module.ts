import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ScheduleModule } from '@nestjs/schedule';

import configuration from './config/configuration';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { ContractsModule } from './modules/contracts/contracts.module';
import { BillingCronModule } from './modules/billing-cron/billing-cron.module';
import { MeterReadingsModule } from './modules/meter-readings/meter-readings.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    // ─── Config (global, typed) ─────────────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      envFilePath: '.env',
    }),

    // ─── Rate Limiting ──────────────────────────────────────────────────────
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute window
        limit: 60,  // 60 requests per minute globally
      },
    ]),

    // ─── Database ──────────────────────────────────────────────────────────
    PrismaModule,

    // ─── BullMQ (global Redis connection) ───────────────────────────────────
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        connection: {
          host: config.get<string>('redis.host', 'localhost'),
          port: config.get<number>('redis.port', 6379),
          password: config.get<string | undefined>('redis.password'),
        },
      }),
    }),

    // ─── Scheduling (cron jobs) ─────────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ─── Feature Modules ───────────────────────────────────────────────────
    AuthModule,
    NotificationsModule,
    ContractsModule,
    BillingCronModule,
    MeterReadingsModule,
  ],

  controllers: [AppController],
  providers: [
    AppService,

    // ─── Global Guards ─────────────────────────────────────────────────────
    // JWT guard applied globally — use @Public() to opt out
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // Rate limiting guard applied globally
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },

    // ─── Global Filters ────────────────────────────────────────────────────
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },

    // ─── Global Interceptors ───────────────────────────────────────────────
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
