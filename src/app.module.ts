import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-yet';
import configuration from './config/configuration.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { UrlModule } from './url/url.module.js';
import { HealthModule } from './health/health.module.js';
import { AuthModule } from './auth/auth.module.js';
import { UserModule } from './user/user.module.js';
import { AdminModule } from './admin/admin.module.js';

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

    // Redis caching
    CacheModule.registerAsync({
      isGlobal: true,
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const redisHost = config.get<string>('redis.host', 'localhost');
        const redisPort = config.get<number>('redis.port', 6379);
        
        try {
          const store = await redisStore({
            socket: {
              host: redisHost,
              port: redisPort,
            },
          });
          return { store };
        } catch {
          // Fallback to in-memory cache if Redis is unavailable
          console.warn('Redis unavailable, using in-memory cache');
          return { ttl: 3600000 };
        }
      },
    }),

    // Database
    PrismaModule,

    // Feature modules
    AuthModule,
    UserModule,
    UrlModule,
    HealthModule,
    AdminModule,
  ],
})
export class AppModule {}
