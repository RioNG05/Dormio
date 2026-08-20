import { NestFactory, Reflector } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // Winston structured logging is wired via nest-winston in AppModule
    bufferLogs: true,
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port', 3001);
  const nodeEnv = configService.get<string>('nodeEnv', 'development');

  // ─── Security ──────────────────────────────────────────────────────────────
  app.use(helmet());
  app.use(compression());

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: nodeEnv === 'production'
      ? [process.env.FRONTEND_URL ?? '']
      : '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Boarding-House-Id',
    ],
  });

  // ─── Global Prefix + Versioning ────────────────────────────────────────────
  app.setGlobalPrefix('api');
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
  });

  // ─── Global Validation Pipe ────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,            // Strip unknown properties
      forbidNonWhitelisted: true, // Throw on unknown properties
      transform: true,            // Auto-transform payloads to DTO types
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // ─── Swagger ───────────────────────────────────────────────────────────────
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Dormio API')
      .setDescription(
        'Boarding House Management System (BHMS) + Rental Platform (BHRP) API',
      )
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT access token',
        },
        'JWT',
      )
      .addServer(`http://localhost:${port}`, 'Local Development')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true, // Remember token between page refreshes
      },
    });

    console.log(`📚 Swagger UI: http://localhost:${port}/api/docs`);
  }

  // ─── Start ─────────────────────────────────────────────────────────────────
  await app.listen(port);
  console.log(`🚀 Dormio API running on http://localhost:${port}/api/v1`);
}

bootstrap();
