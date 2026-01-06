import { ApiProperty } from '@nestjs/swagger';
import { Role } from '.prisma/client';

export class AdminUserResponseDto {
  @ApiProperty({ description: 'User ID' })
  id: string;

  @ApiProperty({ description: 'User email address' })
  email: string;

  @ApiProperty({ description: 'User display name', nullable: true })
  name: string | null;

  @ApiProperty({ enum: Role, description: 'User role' })
  role: Role;

  @ApiProperty({ description: 'Account creation date' })
  createdAt: Date;

  @ApiProperty({ description: 'Number of URLs created by this user' })
  urlCount: number;
}
