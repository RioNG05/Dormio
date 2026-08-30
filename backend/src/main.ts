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
        `## Dormio — Vietnamese Boarding House Management Platform\n\n` +
        `API documentation for two main modules:\n` +
        `- **BHMS** — Boarding House Management System (landlords managing properties, rooms, contracts, staff)\n` +
        `- **BHRP** — Boarding House Rental Platform (public listing/search for prospective tenants)\n\n` +
        `### Authentication\n` +
        `Most endpoints require a JWT Bearer token. Obtain a token via \`POST /api/v1/auth/login\`, ` +
        `then click **Authorize** in the top-right corner.\n\n` +
        `### BHMS Header\n` +
        `All BHMS landlord endpoints require the \`X-Boarding-House-Id\` header — the UUID of the boarding house ` +
        `being operated on. This header is validated server-side by \`PropertyOwnershipGuard\`.\n\n` +
        `### Response Format\n` +
        `All successful responses are wrapped in \`{ success: true, data: ... }\`. ` +
        `Errors return \`{ success: false, statusCode, error, path, timestamp }\`.`,
      )
      .setVersion('1.0')
      .setContact('Dormio Team', '', 'support@dormio.vn')
      .setLicense('Private', '')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'JWT',
          description:
            'Enter the JWT access token obtained from POST /api/v1/auth/login.\n\nExample: `eyJhbGci...`',
          in: 'header',
        },
        'JWT',
      )
      .addApiKey(
        {
          type: 'apiKey',
          in: 'header',
          name: 'X-Boarding-House-Id',
          description:
            'UUID of the boarding house to scope the operation to (required for all BHMS landlord endpoints). ' +
            'Validated server-side by PropertyOwnershipGuard.',
        },
        'X-Boarding-House-Id',
      )
      .addServer(`http://localhost:${port}`, 'Local Development')
      .addServer('https://api.dormio.vn', 'Production')
      .addTag('Auth', 'Register, login, change password')
      .addTag('Boarding Houses', 'Boarding house CRUD and multi-property management (UC-L-01 → UC-L-03)')
      .addTag('Rooms', 'Room management, bulk generation, and room services (UC-L-05 → UC-L-10)')
      .addTag('Contracts', 'Tenancy contracts — external and platform flows (UC-L-11 → UC-L-14)')
      .addTag('Invoices', 'Invoice generation, details, and metered/flat billing (UC-L-15 → UC-L-17)')
      .addTag('Meter Readings', 'Utility meter readings with OCR support (UC-T-03)')
      .addTag('Payments', 'VietQR webhook processing and refunds (UC-L-18)')
      .addTag('Deposits', 'Security deposit management — manual, contract, and platform (UC-L-20 → UC-L-22)')
      .addTag('Employees', 'Employee onboarding and assignment management (UC-L-19)')
      .addTag('Schedules', 'Shift scheduling and recurrence for employees (UC-S-01)')
      .addTag('Attendance', 'Check-in/out and manual override (UC-S-02)')
      .addTag('Services', 'Service catalog — electricity, water, WiFi, etc.')
      .addTag('Expenses', 'Operational expense tracking')
      .addTag('Notifications', 'Push and in-app notifications for tenants (UC-L-23, UC-T-01)')
      .addTag('Messages', 'Real-time chat for both BHMS and BHRP')
      .addTag('Posts', 'Rental listing posts — BHRP (UC-P-01)')
      .addTag('Grievances', 'Tenant complaints and admin resolution (UC-T-07, UC-A-04)')
      .addTag('Admin', 'System administration and analytics (UC-A-01 → UC-A-05)')
      .addTag('Health', 'Health check endpoint')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);

    SwaggerModule.setup('api/docs', app, document, {
      customSiteTitle: 'Dormio API Docs',
      customfavIcon: 'https://nestjs.com/img/logo_text.svg',
      swaggerOptions: {
        persistAuthorization: true,   // Persist token across page refreshes
        displayRequestDuration: true, // Show request duration in the UI
        filter: true,                 // Enable filtering by tag
        tryItOutEnabled: true,        // Enable "Try it out" by default
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
        docExpansion: 'none',         // Collapse all sections on load
      },
    });

    console.log(`📚 Swagger UI:   http://localhost:${port}/api/docs`);
    console.log(`📄 OpenAPI JSON: http://localhost:${port}/api/docs-json`);
  }

  // ─── Start ─────────────────────────────────────────────────────────────────
  await app.listen(port);
  console.log(`🚀 Dormio API running on http://localhost:${port}/api/v1`);
}

bootstrap();
