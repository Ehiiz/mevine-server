import { an } from '@faker-js/faker/dist/airline-BUL6NtOJ';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/core/database/database.service';
import { Admin, AdminDocument } from 'src/core/database/schemas/admin.schema';
import { EmailQueueService } from 'src/core/integrations/emails/email-queue.service';
import {
  AdminLoginAttemptEvent,
  UserCompleteSetupEvent,
  UserConfirmEmailEvent,
  UserLoginAttemptEvent,
  UserRegisteredEvent,
} from 'src/core/integrations/emails/email.utils';
import { BcryptService } from 'src/core/security/bcrypt.service';
import { generateRandomDigits } from 'src/core/utils/random-generator.util';

@Injectable()
export class AdminAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly emailQueueService: EmailQueueService,
    private readonly configService: ConfigService,
  ) {}

  async createAccount(body: {
    email: string;
  }): Promise<{ admin: Admin; code: string }> {
    try {
      const existingAdmin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      if (existingAdmin) {
        throw Error('Admin already exists');
      }

      const code = generateRandomDigits();
      const hashedCode = await this.bcryptService.hashPassword(code);

      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);

      const admin = await this.databaseService.admins.create({
        email: body.email,
        auth: {
          accountVerificationToken: hashedCode,
          verificationTokenExpiration: now,
        },
      });

      const event = new UserRegisteredEvent(body.email, code);

      await this.emailQueueService.handleEmailEvent(event);

      return { admin, code };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(body: {
    email: string;
    code: string;
  }): Promise<{ token: string }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      if (!admin) {
        throw new NotFoundException(
          'Admin not found in database, please signup',
        );
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: admin.auth.accountVerificationToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (admin.auth.verificationTokenExpiration! <= new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      if (!admin.accountStatus) {
        admin.accountStatus = {} as any;
      }

      admin.auth.verificationTokenExpiration = null;
      admin.auth.accountVerificationToken = null;
      admin.accountStatus.accountVerified = true;
      const token = this.jwtService.sign({ id: admin.id });

      await admin.save();

      return { token };
    } catch (error) {
      throw error;
    }
  }

  async completeAccount(body: {
    admin: AdminDocument;
    password: string;
    firstName: string;
    lastName: string;
    passcode: string;
    avatar?: string;
  }): Promise<{ token: string; admin: Admin }> {
    try {
      const hashedPassword = await this.bcryptService.hashPassword(
        body.password,
      );
      const hashedPin = await this.bcryptService.hashPassword(body.passcode);

      body.admin.avatar = body.avatar!;
      body.admin.auth.transactionPin = hashedPin;
      body.admin.firstName = body.firstName;
      body.admin.lastName = body.lastName;
      body.admin.auth.password = hashedPassword;
      body.admin.accountStatus.completeSetup = true;

      await body.admin.save();
      const token = this.jwtService.sign({ id: body.admin.id });

      const event = new UserCompleteSetupEvent(
        body.admin.email,
        `${body.admin.firstName} ${body.admin.lastName}`,
      );

      await this.emailQueueService.handleEmailEvent(event);

      return { token, admin: body.admin };
    } catch (error) {
      throw error;
    }
  }

  async login(body: { email: string }): Promise<{ token: string }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      if (!admin) {
        throw new NotFoundException('Admin not found, Please signup');
      }

      const loginCode = generateRandomDigits();

      if (!admin.auth) {
        admin.auth = {} as any;
      }

      admin.auth.loginVerificationToken =
        await this.bcryptService.hashPassword(loginCode);
      admin.auth.loginTokenExpiration = new Date();
      admin.auth.loginTokenExpiration.setMinutes(
        admin.auth.loginTokenExpiration.getMinutes() + 10,
      );

      await admin.save();

      const event = new AdminLoginAttemptEvent(
        this.configService,
        loginCode,
        body.email,
      );

      await this.emailQueueService.handleEmailEvent(event);

      const { token } = await this.verifyLoginCode({
        code: loginCode,
        email: body.email,
      });

      return { token };
    } catch (error) {
      throw error;
    }
  }

  private async verifyLoginCode(body: {
    code: string;
    email: string;
  }): Promise<{ token: string }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      if (!admin) {
        throw new NotFoundException('Admin not found in database');
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: admin.auth.loginVerificationToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (admin.auth.loginTokenExpiration! <= new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      admin.auth.loginTokenExpiration = null;
      admin.auth.loginVerificationToken = null;

      await admin.save();

      const token = this.jwtService.sign({ id: admin.id });

      return { token };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(body: { email: string }): Promise<{ message: string }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });
      if (!admin) {
        throw new NotFoundException('User not found');
      }

      const code = generateRandomDigits();

      admin.auth.passwordResetToken =
        await this.bcryptService.hashPassword(code);
      admin.auth.tokenExpiration = new Date();
      admin.auth.tokenExpiration.setMinutes(
        admin.auth.tokenExpiration.getMinutes() + 30,
      );

      await admin.save();

      const event = new UserConfirmEmailEvent(body.email, code);
      await this.emailQueueService.handleEmailEvent(event);

      return { message: 'Reset code sent to admin email' };
    } catch (error) {
      throw error;
    }
  }

  async verifyPasswordOTP(body: {
    code: string;
    email: string;
  }): Promise<{ verified: boolean }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      if (!admin) {
        throw new NotFoundException('User not found in database');
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: admin.auth.passwordResetToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (admin.auth.tokenExpiration! <= new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      await admin.save();

      return { verified: true };
    } catch (error) {
      throw error;
    }
  }

  async passwordReset(body: {
    code: string;
    password: string;
    email: string;
  }): Promise<{ verified: boolean; message: string }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      if (!admin) {
        throw new NotFoundException('User not found in database');
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: admin.auth.passwordResetToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (admin.auth.tokenExpiration! <= new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      admin.auth.password = await this.bcryptService.hashPassword(
        body.password,
      );

      admin.auth.tokenExpiration = null;
      admin.auth.passwordResetToken = null;

      await admin.save();

      return { verified: true, message: 'Successfully reset password' };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(body: {
    admin: AdminDocument;
    newPassword: string;
    oldPassword: string;
  }): Promise<{ verified: boolean }> {
    try {
      console.log('Changing password for admin:', body.admin.email);
      const match = await this.bcryptService.comparePassword({
        password: body.oldPassword,
        hashedPassword: body.admin.auth.password!,
      });

      if (!match) {
        throw new UnauthorizedException('Old password is incorrect');
      }

      body.admin.auth.password = await this.bcryptService.hashPassword(
        body.newPassword,
      );

      await body.admin.save();

      return { verified: true };
    } catch (error) {
      throw error;
    }
  }
}
