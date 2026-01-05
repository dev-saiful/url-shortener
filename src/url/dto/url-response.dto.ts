import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UrlResponseDto {
  @ApiProperty({ example: 'abc123' })
  shortCode: string;

  @ApiProperty({ example: 'http://localhost:3000/abc123' })
  shortUrl: string;

  @ApiProperty({ example: 'https://github.com/nestjs/nest' })
  originalUrl: string;

  @ApiProperty({ example: 0 })
  clickCount: number;

  @ApiPropertyOptional({ example: '2025-12-31T23:59:59.000Z' })
  expiresAt?: Date | null;

  @ApiProperty({ example: '2025-01-05T12:00:00.000Z' })
  createdAt: Date;
}

export class UrlStatsDto extends UrlResponseDto {
  @ApiProperty({
    description: 'Recent click analytics',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        clickedAt: { type: 'string', format: 'date-time' },
        userAgent: { type: 'string', nullable: true },
        referer: { type: 'string', nullable: true },
      },
    },
  })
  recentClicks: {
    clickedAt: Date;
    userAgent: string | null;
    referer: string | null;
  }[];
}
