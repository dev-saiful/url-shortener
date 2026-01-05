import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Res,
  Req,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import type { Response, Request } from 'express';
import { UrlService } from './url.service.js';
import { CreateUrlDto, UrlResponseDto, UrlStatsDto } from './dto/index.js';

@ApiTags('urls')
@Controller()
export class UrlController {
  constructor(private readonly urlService: UrlService) {}

  @Post('urls')
  @ApiOperation({ summary: 'Create a shortened URL' })
  @ApiResponse({
    status: 201,
    description: 'URL shortened successfully',
    type: UrlResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid URL or request' })
  @ApiResponse({ status: 409, description: 'Custom code already taken' })
  async create(@Body() dto: CreateUrlDto): Promise<UrlResponseDto> {
    return this.urlService.create(dto);
  }

  @Get('urls/:code')
  @ApiOperation({ summary: 'Get URL information' })
  @ApiParam({ name: 'code', description: 'Short code' })
  @ApiResponse({
    status: 200,
    description: 'URL information',
    type: UrlResponseDto,
  })
  @ApiResponse({ status: 404, description: 'URL not found' })
  async getUrlInfo(@Param('code') code: string): Promise<UrlResponseDto> {
    return this.urlService.getUrlInfo(code);
  }

  @Get('urls/:code/stats')
  @ApiOperation({ summary: 'Get URL statistics and recent clicks' })
  @ApiParam({ name: 'code', description: 'Short code' })
  @ApiResponse({
    status: 200,
    description: 'URL statistics',
    type: UrlStatsDto,
  })
  @ApiResponse({ status: 404, description: 'URL not found' })
  async getStats(@Param('code') code: string): Promise<UrlStatsDto> {
    return this.urlService.getStats(code);
  }

  @Delete('urls/:code')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a shortened URL' })
  @ApiParam({ name: 'code', description: 'Short code' })
  @ApiResponse({ status: 204, description: 'URL deleted successfully' })
  @ApiResponse({ status: 404, description: 'URL not found' })
  async delete(@Param('code') code: string): Promise<void> {
    return this.urlService.delete(code);
  }

  @Get(':code')
  @ApiOperation({ summary: 'Redirect to original URL' })
  @ApiParam({ name: 'code', description: 'Short code' })
  @ApiResponse({ status: 302, description: 'Redirect to original URL' })
  @ApiResponse({ status: 404, description: 'URL not found or expired' })
  async redirect(
    @Param('code') code: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const originalUrl = await this.urlService.findByShortCode(code);

    // Track click asynchronously (don't await)
    this.urlService.trackClick(code, {
      userAgent: req.get('user-agent'),
      referer: req.get('referer'),
      ipAddress: req.ip || req.socket.remoteAddress,
    });

    res.redirect(HttpStatus.FOUND, originalUrl);
  }
}
