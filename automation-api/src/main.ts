import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TestrailExceptionFilter } from './filters/testrail-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new TestrailExceptionFilter());

  const port = process.env.AUTOMATION_API_PORT || 3050;
  const version = process.env.APP_VERSION || 'dev';

  await app.listen(port);

  console.log(`
╔══════════════════════════════════════════╗
║     Automation API v${version.padEnd(20)}║
║   Running on http://localhost:${port}       ║
╚══════════════════════════════════════════╝
  `);
}

bootstrap();
