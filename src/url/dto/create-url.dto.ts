import {
  IsString,
  IsUrl,
  IsOptional,
  MaxLength,
  Matches,
  IsDateString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUrlDto {
  @ApiProperty({
    description: 'The original URL to shorten',
    example: 'https://github.com/nestjs/nest',
  })
  @IsUrl({ require_protocol: true }, { message: 'Please provide a valid URL with protocol (http/https)' })
  @MaxLength(2048, { message: 'URL must be at most 2048 characters' })
  originalUrl: string;

  @ApiPropertyOptional({
    description: 'Custom short code (optional, 3-10 alphanumeric characters)',
    example: 'my-link',
  })
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9_-]{3,10}$/, {
    message: 'Custom code must be 3-10 alphanumeric characters, underscores, or hyphens',
  })
  customCode?: string;

  @ApiPropertyOptional({
    description: 'Expiration date for the short URL (ISO 8601 format)',
    example: '2025-12-31T23:59:59Z',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Please provide a valid ISO 8601 date string' })
  expiresAt?: string;
}
