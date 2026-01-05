import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateUrlDto, UrlResponseDto, UrlStatsDto } from './dto/index.js';
import { nanoid } from 'nanoid';

@Injectable()
export class UrlService {
  private readonly baseUrl: string;
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {
    this.baseUrl = this.configService.get<string>('baseUrl') || 'http://localhost:3000';
  }

  async create(dto: CreateUrlDto): Promise<UrlResponseDto> {
    const shortCode = dto.customCode || nanoid(7);

    // Check if custom code already exists
    if (dto.customCode) {
      const existing = await this.prisma.url.findUnique({
        where: { shortCode: dto.customCode },
      });
      if (existing) {
        throw new ConflictException(`Short code "${dto.customCode}" is already taken`);
      }
    }

    // Validate expiration date if provided
    let expiresAt: Date | null = null;
    if (dto.expiresAt) {
      expiresAt = new Date(dto.expiresAt);
      if (expiresAt <= new Date()) {
        throw new BadRequestException('Expiration date must be in the future');
      }
    }

    const url = await this.prisma.url.create({
      data: {
        shortCode,
        originalUrl: dto.originalUrl,
        expiresAt,
      },
    });

    // Cache the URL mapping
    await this.cacheManager.set(
      `url:${shortCode}`,
      url.originalUrl,
      this.CACHE_TTL,
    );

    return this.toResponseDto(url);
  }

  async findByShortCode(shortCode: string): Promise<string> {
    // Try cache first
    const cached = await this.cacheManager.get<string>(`url:${shortCode}`);
    if (cached) {
      return cached;
    }

    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new NotFoundException(`Short URL "${shortCode}" not found`);
    }

    // Check if expired
    if (url.expiresAt && url.expiresAt < new Date()) {
      throw new NotFoundException(`Short URL "${shortCode}" has expired`);
    }

    // Update cache
    await this.cacheManager.set(
      `url:${shortCode}`,
      url.originalUrl,
      this.CACHE_TTL,
    );

    return url.originalUrl;
  }

  async getUrlInfo(shortCode: string): Promise<UrlResponseDto> {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new NotFoundException(`Short URL "${shortCode}" not found`);
    }

    return this.toResponseDto(url);
  }

  async getStats(shortCode: string): Promise<UrlStatsDto> {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
      include: {
        clicks: {
          orderBy: { clickedAt: 'desc' },
          take: 10,
          select: {
            clickedAt: true,
            userAgent: true,
            referer: true,
          },
        },
      },
    });

    if (!url) {
      throw new NotFoundException(`Short URL "${shortCode}" not found`);
    }

    return {
      ...this.toResponseDto(url),
      recentClicks: url.clicks,
    };
  }

  async trackClick(
    shortCode: string,
    metadata: { userAgent?: string; referer?: string; ipAddress?: string },
  ): Promise<void> {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) return; // Silently fail if URL not found

    // Update click count and create click record in a transaction
    await this.prisma.$transaction([
      this.prisma.url.update({
        where: { shortCode },
        data: { clickCount: { increment: 1 } },
      }),
      this.prisma.click.create({
        data: {
          urlId: url.id,
          userAgent: metadata.userAgent || null,
          referer: metadata.referer || null,
          ipAddress: metadata.ipAddress || null,
        },
      }),
    ]);
  }

  async delete(shortCode: string): Promise<void> {
    const url = await this.prisma.url.findUnique({
      where: { shortCode },
    });

    if (!url) {
      throw new NotFoundException(`Short URL "${shortCode}" not found`);
    }

    await this.prisma.url.delete({
      where: { shortCode },
    });

    // Invalidate cache
    await this.cacheManager.del(`url:${shortCode}`);
  }

  private toResponseDto(url: {
    shortCode: string;
    originalUrl: string;
    clickCount: number;
    expiresAt: Date | null;
    createdAt: Date;
  }): UrlResponseDto {
    return {
      shortCode: url.shortCode,
      shortUrl: `${this.baseUrl}/${url.shortCode}`,
      originalUrl: url.originalUrl,
      clickCount: url.clickCount,
      expiresAt: url.expiresAt,
      createdAt: url.createdAt,
    };
  }
}
