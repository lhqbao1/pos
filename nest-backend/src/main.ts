import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { existsSync } from 'node:fs';
import { loadEnvFile } from 'node:process';
import { resolve } from 'node:path';
import { AppModule } from './app.module';

async function bootstrap() {
  const envPath = resolve(__dirname, '..', '.env');
  if (existsSync(envPath)) {
    loadEnvFile(envPath);
  }

  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: false,
    }),
  );

  const port = Number(process.env.PORT || 3002);
  await app.listen(port);
  console.log(`Nest backend is running on http://localhost:${port}`);
}

bootstrap();
