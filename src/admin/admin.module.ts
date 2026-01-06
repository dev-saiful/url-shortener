import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller.js';
import { UserModule } from '../user/user.module.js';
import { UrlModule } from '../url/url.module.js';

@Module({
  imports: [UserModule, UrlModule],
  controllers: [AdminController],
})
export class AdminModule {}
