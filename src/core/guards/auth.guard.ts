import {
  CanActivate,
  ExecutionContext,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService, TokenExpiredError } from '@nestjs/jwt';
import { DatabaseService } from '../database/database.service';
import { Request } from 'express';
import { UserDocument } from '../database/schemas/user.schema';
import { Reflector } from '@nestjs/core';
import { SERVICE_KEY } from '../decorators/auth.decorator';
import { WebServiceTypeEnum } from '../interfaces/shared.interface';
import { AdminDocument } from '../database/schemas/admin.schema';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly databaseService: DatabaseService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const req: Request = context.switchToHttp().getRequest();

      const token = req.headers.authorization as string;

      const extToken = this.extractToken(token);
      console.log(`Extracted Token: ${extToken}`); // Log the extracted token for debugging

      if (!extToken) {
        throw new UnauthorizedException('Bearer token missing in request');
      }

      const decodedPayload = await this.jwtService.verify(extToken);

      if (decodedPayload.exp * 1000 <= Date.now()) {
        throw new TokenExpiredError('Token expired', new Date());
      }

      // FIX 1: Get metadata from the class AND the handler
      const classType = this.reflector.get<WebServiceTypeEnum | undefined>(
        SERVICE_KEY,
        context.getClass(), // <-- Check the class (where ServiceDecorator is applied)
      );

      const handlerType = this.reflector.get<WebServiceTypeEnum | undefined>(
        SERVICE_KEY,
        context.getHandler(), // Check the handler (if decorator was on method)
      );

      // Prioritize handler-level decorator, then class-level, otherwise default to USER
      const serviceType = handlerType || classType || WebServiceTypeEnum.USER;

      console.log(`Resolved Service Type: ${serviceType}`); // Now this should correctly show ADMIN or USER

      if (!serviceType || serviceType === WebServiceTypeEnum.USER) {
        console.log('User access detected');
        const user: UserDocument | null = await this.databaseService.users
          .findById(decodedPayload.id)
          .populate('wallet');

        if (!user) {
          throw new NotFoundException('User not found in database');
        }

        if (user.deleted) {
          throw new UnauthorizedException(
            'User has been deleted from database',
          );
        }

        if (user.restricted) {
          throw new UnauthorizedException(
            'User not permitted to access this resource',
          );
        }

        req.user = user;
        return true;
      } else {
        console.log('Admin access detected');

        const admin: AdminDocument | null =
          await this.databaseService.admins.findById(decodedPayload.id);

        if (!admin) {
          throw new NotFoundException('Admin not found in database');
        }

        if (admin.deleted) {
          throw new UnauthorizedException(
            'Admin has been deleted from database',
          );
        }

        if (admin.restricted) {
          throw new UnauthorizedException(
            'Admin not permitted to access this resource',
          );
        }

        req.admin = admin;
        return true;
      }
    } catch (error) {
      throw error;
    }
  }

  private extractToken(token: string): string | undefined {
    const [bearer, auth] = token.split(' ');
    return auth;
  }
}
