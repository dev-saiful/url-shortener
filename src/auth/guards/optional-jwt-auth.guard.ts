import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtAuthGuard extends AuthGuard('jwt') {
  // Override handleRequest to not throw error if no token
  handleRequest(err: any, user: any) {
    // Return user if authenticated, null if not
    return user || null;
  }
}
