import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UrlResponseDto } from '../../url/dto/index.js';

export class AdminUrlResponseDto extends UrlResponseDto {
  @ApiPropertyOptional({
    description: 'URL owner information',
    type: 'object',
    nullable: true,
    properties: {
      id: { type: 'string' },
      email: { type: 'string' },
      name: { type: 'string', nullable: true },
    },
  })
  user?: {
    id: string;
    email: string;
    name: string | null;
  } | null;
}
