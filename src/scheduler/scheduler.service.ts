import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as http from 'http';
import * as https from 'https';

@Injectable()
export class SchedulerService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(SchedulerService.name);
  private intervals: NodeJS.Timeout[] = [];

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const enabled = this.configService.get<boolean>('scheduler.enabled', true);
    
    if (!enabled) {
      this.logger.log('Scheduler is disabled');
      return;
    }

    this.logger.log('Initializing scheduler...');
    this.startHealthCheckScheduler();
  }

  onModuleDestroy() {
    this.logger.log('Stopping all scheduled tasks...');
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals = [];
  }

  private startHealthCheckScheduler() {
    const url = this.configService.get<string>(
      'scheduler.healthCheckUrl',
      'http://localhost:3000/health',
    );
    const intervalMinutes = this.configService.get<number>(
      'scheduler.healthCheckIntervalMinutes',
      14,
    );
    const intervalMs = intervalMinutes * 60 * 1000;

    this.logger.log(
      `Starting health check scheduler: calling ${url} every ${intervalMinutes} minutes`,
    );

    // Run immediately once
    this.callURL(url);

    // Then run at specified interval
    const interval = setInterval(() => {
      this.callURL(url);
    }, intervalMs);

    this.intervals.push(interval);
  }

  private callURL(url: string) {
    const client = url.startsWith('https') ? https : http;

    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        this.logger.log(
          `Called ${url} → Status: ${res.statusCode}`,
        );
      });
    });

    req.on('error', (err) => {
      this.logger.error(
        `Error calling ${url}: ${err.message}`,
        err.stack,
      );
    });

    req.end();
  }

  // Public method to add custom scheduled tasks
  public addScheduledTask(
    name: string,
    callback: () => void,
    intervalMs: number,
  ): void {
    this.logger.log(
      `Adding scheduled task: ${name} (interval: ${intervalMs}ms)`,
    );

    // Run immediately
    try {
      callback();
    } catch (error) {
      this.logger.error(
        `Error executing scheduled task ${name}:`,
        error,
      );
    }

    // Then run at interval
    const interval = setInterval(() => {
      try {
        callback();
      } catch (error) {
        this.logger.error(
          `Error executing scheduled task ${name}:`,
          error,
        );
      }
    }, intervalMs);

    this.intervals.push(interval);
  }
}
