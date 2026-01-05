import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module.js';
import { PrismaService } from './../src/prisma/prisma.service.js';

describe('URL Shortener (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let createdShortCode: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    prisma = app.get(PrismaService);
    await app.init();
  });

  afterAll(async () => {
    // Cleanup test data
    if (createdShortCode) {
      await prisma.url.deleteMany({
        where: { shortCode: createdShortCode },
      });
    }
    await app.close();
  });

  describe('/urls (POST)', () => {
    it('should create a short URL', async () => {
      const response = await request(app.getHttpServer())
        .post('/urls')
        .send({ originalUrl: 'https://github.com/nestjs/nest' })
        .expect(201);

      expect(response.body).toHaveProperty('shortCode');
      expect(response.body).toHaveProperty('shortUrl');
      expect(response.body.originalUrl).toBe('https://github.com/nestjs/nest');
      expect(response.body.clickCount).toBe(0);

      createdShortCode = response.body.shortCode;
    });

    it('should reject invalid URL', async () => {
      await request(app.getHttpServer())
        .post('/urls')
        .send({ originalUrl: 'not-a-valid-url' })
        .expect(400);
    });

    it('should reject missing URL', async () => {
      await request(app.getHttpServer())
        .post('/urls')
        .send({})
        .expect(400);
    });
  });

  describe('/urls/:code (GET)', () => {
    it('should return URL info', async () => {
      const response = await request(app.getHttpServer())
        .get(`/urls/${createdShortCode}`)
        .expect(200);

      expect(response.body.shortCode).toBe(createdShortCode);
      expect(response.body.originalUrl).toBe('https://github.com/nestjs/nest');
    });

    it('should return 404 for non-existent code', async () => {
      await request(app.getHttpServer())
        .get('/urls/nonexistent')
        .expect(404);
    });
  });

  describe('/urls/:code/stats (GET)', () => {
    it('should return URL stats', async () => {
      const response = await request(app.getHttpServer())
        .get(`/urls/${createdShortCode}/stats`)
        .expect(200);

      expect(response.body).toHaveProperty('clickCount');
      expect(response.body).toHaveProperty('recentClicks');
    });
  });

  describe('/:code (GET) - Redirect', () => {
    it('should redirect to original URL', async () => {
      await request(app.getHttpServer())
        .get(`/${createdShortCode}`)
        .expect(302)
        .expect('Location', 'https://github.com/nestjs/nest');
    });

    it('should return 404 for non-existent code', async () => {
      await request(app.getHttpServer())
        .get('/nonexistent')
        .expect(404);
    });
  });

  describe('/urls/:code (DELETE)', () => {
    it('should delete the URL', async () => {
      await request(app.getHttpServer())
        .delete(`/urls/${createdShortCode}`)
        .expect(204);

      // Verify it's deleted
      await request(app.getHttpServer())
        .get(`/urls/${createdShortCode}`)
        .expect(404);

      createdShortCode = ''; // Clear so afterAll doesn't try to delete again
    });
  });

  describe('/health (GET)', () => {
    it('should return health status', async () => {
      const response = await request(app.getHttpServer())
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('services');
    });
  });
});
