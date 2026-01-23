import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { utilities as nestWinstonModuleUtilities } from 'nest-winston';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UrlModule } from './url/url.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { AdminModule } from './admin/admin.module.js';
import { SchedulerModule } from './scheduler/scheduler.module.js';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),

    // Rate limiting
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          ttl: config.get<number>('throttle.ttl', 60) * 1000,
          limit: config.get<number>('throttle.limit', 100),
        },
      ],
    }),

    // Winston Logging
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.ms(),
            nestWinstonModuleUtilities.format.nestLike('Shortener', {
              prettyPrint: true,
              colors: true,
            }),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/error.log',
          level: 'error',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
        new winston.transports.File({
          filename: 'logs/combined.log',
          format: winston.format.combine(
            winston.format.timestamp(),
            winston.format.json(),
          ),
        }),
      ],
    }),

    // Redis caching (Cloud Redis)
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get<string>('redis.host', 'localhost');
        const redisPort = config.get<number>('redis.port', 6379);
        const redisUsername = config.get<string>('redis.username');
        const redisPassword = config.get<string>('redis.password');

        try {
          const store = await redisStore({
            username: redisUsername,
            password: redisPassword,
            socket: {
              host: redisHost,
              port: redisPort,
            },
          });
          console.log('Connected to Redis successfully');
          return { store };
        } catch (error) {
          // Fallback to in-memory cache if Redis is unavailable
          console.warn('Redis unavailable, using in-memory cache:', error);
          return { ttl: 3600000 };
        }
      },
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UserModule,
    HealthModule,
    UrlModule,
    AdminModule,
    SchedulerModule,
  ],
})
export class AppModule {}
