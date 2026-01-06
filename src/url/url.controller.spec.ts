import { Test, TestingModule } from '@nestjs/testing';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';

describe('UrlController', () => {
  let controller: UrlController;
  let urlService: jest.Mocked<UrlService>;

  const mockUrlResponse = {
    shortCode: 'abc123',
    shortUrl: 'http://localhost:3000/abc123',
    originalUrl: 'https://github.com',
    clickCount: 0,
    expiresAt: null,
    createdAt: new Date('2025-01-01'),
  };

  beforeEach(async () => {
    const mockUrlService = {
      create: jest.fn(),
      findByShortCode: jest.fn(),
      getUrlInfo: jest.fn(),
      getStats: jest.fn(),
      trackClick: jest.fn(),
      delete: jest.fn(),
      findByUser: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UrlController],
      providers: [{ provide: UrlService, useValue: mockUrlService }],
    }).compile();

    controller = module.get<UrlController>(UrlController);
    urlService = module.get(UrlService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should create a short URL', async () => {
      urlService.create.mockResolvedValue(mockUrlResponse);

      const result = await controller.create({ originalUrl: 'https://github.com' });

      expect(result).toEqual(mockUrlResponse);
      expect(urlService.create).toHaveBeenCalledWith({ originalUrl: 'https://github.com' }, undefined);
    });
  });

  describe('getUrlInfo', () => {
    it('should return URL information', async () => {
      urlService.getUrlInfo.mockResolvedValue(mockUrlResponse);

      const result = await controller.getUrlInfo('abc123');

      expect(result).toEqual(mockUrlResponse);
    });
  });

  describe('getStats', () => {
    it('should return URL statistics', async () => {
      const statsResponse = { ...mockUrlResponse, recentClicks: [] };
      urlService.getStats.mockResolvedValue(statsResponse);

      const result = await controller.getStats('abc123');

      expect(result).toEqual(statsResponse);
    });
  });

  describe('delete', () => {
    it('should delete a URL', async () => {
      urlService.delete.mockResolvedValue(undefined);

      await controller.delete('abc123');

      expect(urlService.delete).toHaveBeenCalledWith('abc123', undefined, false);
    });
  });

  describe('getMyUrls', () => {
    it('should return current user\'s URLs', async () => {
      const userUrls = [mockUrlResponse];
      urlService.findByUser.mockResolvedValue(userUrls);

      const result = await controller.getMyUrls({ id: 'user-123' });

      expect(result).toEqual(userUrls);
      expect(urlService.findByUser).toHaveBeenCalledWith('user-123');
    });
  });

  describe('redirect', () => {
    it('should redirect to original URL and track click', async () => {
      const res = {
        redirect: jest.fn(),
      };
      const req = {
        get: jest.fn().mockImplementation((header) => {
          if (header === 'user-agent') return 'Mozilla';
          if (header === 'referer') return 'google.com';
        }),
        ip: '127.0.0.1',
      };
      urlService.findByShortCode.mockResolvedValue('https://github.com');

      await controller.redirect('abc123', req as any, res as any);

      expect(urlService.findByShortCode).toHaveBeenCalledWith('abc123');
      expect(urlService.trackClick).toHaveBeenCalled();
      expect(res.redirect).toHaveBeenCalledWith(302, 'https://github.com');
    });
  });
});
