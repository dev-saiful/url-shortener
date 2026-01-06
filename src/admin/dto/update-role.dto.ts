import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Role } from '.prisma/client';

export class UpdateRoleDto {
  @ApiProperty({ 
    enum: Role, 
    example: 'ADMIN',
    description: 'User role to assign'
  })
  @IsEnum(Role, { message: 'Role must be either USER or ADMIN' })
  role: Role;
}
