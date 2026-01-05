import { Module } from '@nestjs/common';
import { UrlController } from './url.controller.js';
import { UrlService } from './url.service.js';

@Module({
  controllers: [UrlController],
  providers: [UrlService],
  exports: [UrlService],
})
export class UrlModule {}
