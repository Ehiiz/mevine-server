import {
  CanActivate,
  ExecutionContext,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import { DatabaseService } from '../database/database.service';
import { Request } from 'express';

export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req: Request = context.switchToHttp().getRequest();

      const token = req.headers.authorization as string;

      const extToken = this.extractToken(token);
      if (!extToken) {
        throw new UnauthorizedException('Bearer token missing in request');
      }

      const decodedPayload = this.jwtService.decode(extToken);

      if (decodedPayload.exp < new Date()) {
        throw new TokenExpiredError('Token expired', new Date());
      }

      const user = await this.databaseService.users.findById(decodedPayload.id);

      if (!user) {
        throw new NotFoundException('User not found in database');
      }

      if (user.deleted) {
        throw new UnauthorizedException('User has been deleted from database');
      }

      if (user.restricted) {
        throw new UnauthorizedException(
          'User not permitted to access this resource',
        );
      }

      req.user = user;
      return true;
    } catch (error) {
      throw error;
    }
  }

  private extractToken(token: string): string | undefined {
    const [bearer, auth] = token.split(' ');
    return auth;
  }
}
