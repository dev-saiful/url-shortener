import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { UrlService } from './url.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UrlService', () => {
  let service: UrlService;
  let prismaService: jest.Mocked<PrismaService>;
  let cacheManager: jest.Mocked<{ get: jest.Mock; set: jest.Mock; del: jest.Mock }>;

  const mockUrl = {
    id: 'uuid-123',
    shortCode: 'abc123',
    originalUrl: 'https://github.com',
    clickCount: 5,
    expiresAt: null,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      url: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
        findMany: jest.fn(),
      },
      click: {
        create: jest.fn(),
      },
      $transaction: jest.fn(),
    };

    const mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string) => {
        if (key === 'baseUrl') return 'http://localhost:3000';
        return undefined;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UrlService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<UrlService>(UrlService);
    prismaService = module.get(PrismaService);
    cacheManager = module.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a short URL', async () => {
      (prismaService.url.create as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.create({ originalUrl: 'https://github.com' });

      expect(result).toHaveProperty('shortCode');
      expect(result).toHaveProperty('shortUrl');
      expect(result.originalUrl).toBe('https://github.com');
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw ConflictException for duplicate custom code', async () => {
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      await expect(
        service.create({ originalUrl: 'https://github.com', customCode: 'abc123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException for past expiration date', async () => {
      await expect(
        service.create({
          originalUrl: 'https://github.com',
          expiresAt: '2020-01-01T00:00:00Z',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByShortCode', () => {
    it('should return cached URL if available', async () => {
      cacheManager.get.mockResolvedValue('https://github.com');

      const result = await service.findByShortCode('abc123');

      expect(result).toBe('https://github.com');
      expect(prismaService.url.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from database if not cached', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);

      const result = await service.findByShortCode('abc123');

      expect(result).toBe('https://github.com');
      expect(cacheManager.set).toHaveBeenCalled();
    });

    it('should throw NotFoundException for non-existent URL', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.findByShortCode('notfound')).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException for expired URL', async () => {
      cacheManager.get.mockResolvedValue(null);
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue({
        ...mockUrl,
        expiresAt: new Date('2020-01-01'),
      });

      await expect(service.findByShortCode('abc123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('getStats', () => {
    it('should return URL with click statistics', async () => {
      const urlWithClicks = {
        ...mockUrl,
        clicks: [
          { clickedAt: new Date(), userAgent: 'Mozilla', referer: null },
        ],
      };
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(urlWithClicks);

      const result = await service.getStats('abc123');

      expect(result.clickCount).toBe(5);
      expect(result.recentClicks).toHaveLength(1);
    });
  });

  describe('delete', () => {
    it('should delete URL and invalidate cache', async () => {
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);
      (prismaService.url.delete as jest.Mock).mockResolvedValue(mockUrl);

      await service.delete('abc123');

      expect(prismaService.url.delete).toHaveBeenCalled();
      expect(cacheManager.del).toHaveBeenCalledWith('url:abc123');
    });

    it('should throw NotFoundException for non-existent URL', async () => {
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.delete('notfound')).rejects.toThrow(NotFoundException);
    });
  });

  describe('trackClick', () => {
    it('should increment click count and create click record', async () => {
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(mockUrl);
      (prismaService.url.update as jest.Mock).mockResolvedValue({
        ...mockUrl,
        clickCount: mockUrl.clickCount + 1,
      });
      (prismaService.click.create as jest.Mock).mockResolvedValue({
        id: 'click-123',
        urlId: mockUrl.id,
      });

      await service.trackClick('abc123', {
        userAgent: 'Mozilla',
        referer: 'google.com',
        ipAddress: '127.0.0.1',
      });

      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should silently fail if URL not found', async () => {
      (prismaService.url.findUnique as jest.Mock).mockResolvedValue(null);

      await service.trackClick('notfound', {});

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findByUser', () => {
    it('should return URLs for specific user', async () => {
      const userUrls = [mockUrl, { ...mockUrl, shortCode: 'xyz789' }];
      (prismaService.url.findMany as jest.Mock).mockResolvedValue(userUrls);

      const result = await service.findByUser('user-123');

      expect(result).toHaveLength(2);
      expect(result[0].shortCode).toBe('abc123');
      expect(prismaService.url.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: { userId: 'user-123' } }),
      );
    });
  });

  describe('findAll', () => {
    it('should return all URLs with user info', async () => {
      const allUrls = [
        { ...mockUrl, user: { id: 'u1', email: 'e1', name: 'n1' } },
        { ...mockUrl, shortCode: 'xyz', user: { id: 'u2', email: 'e2', name: 'n2' } },
      ];
      (prismaService.url.findMany as jest.Mock).mockResolvedValue(allUrls);

      const result = await service.findAll({});

      expect(result).toHaveLength(2);
      expect(result[0]).toHaveProperty('user');
      expect(prismaService.url.findMany).toHaveBeenCalled();
    });
  });
});
