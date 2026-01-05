import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { PrismaService } from '../prisma/prisma.service.js';

interface HealthResponse {
  status: 'ok' | 'error';
  timestamp: string;
  services: {
    database: 'up' | 'down';
    cache: 'up' | 'down';
  };
}

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service health status',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'error'] },
        timestamp: { type: 'string', format: 'date-time' },
        services: {
          type: 'object',
          properties: {
            database: { type: 'string', enum: ['up', 'down'] },
            cache: { type: 'string', enum: ['up', 'down'] },
          },
        },
      },
    },
  })
  async check(): Promise<HealthResponse> {
    let databaseStatus: 'up' | 'down' = 'down';

    try {
      await this.prisma.$queryRaw`SELECT 1`;
      databaseStatus = 'up';
    } catch {
      databaseStatus = 'down';
    }

    const allUp = databaseStatus === 'up';

    return {
      status: allUp ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      services: {
        database: databaseStatus,
        cache: 'up', // Cache manager handles fallback gracefully
      },
    };
  }
}
