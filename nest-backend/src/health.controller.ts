import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  check() {
    return {
      status: 'ok',
      service: 'nest-backend',
      timestamp: new Date().toISOString(),
    };
  }
}
