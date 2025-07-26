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
import { EmailProducerService } from 'src/core/integrations/emails/email-producer.service';
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
    private readonly emailProducerService: EmailProducerService,
    private readonly configService: ConfigService,
  ) {}

  async createAccount(body: {
    email: string;
    password: string;
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
      const hashedPassword = await this.bcryptService.hashPassword(
        body.password,
      );

      const now = new Date();
      now.setMinutes(now.getMinutes() + 30);

      const admin = await this.databaseService.admins.create({
        email: body.email,
        password: body.password,
        auth: {
          accountVerificationToken: hashedCode,
          verificationTokenExpiration: now,
          password: hashedPassword,
        },
      });

      const event = new UserRegisteredEvent(body.email, code);

      await this.emailProducerService.handleEmailEvent(event);

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
    firstName: string;
    lastName: string;
    passcode: string;
  }): Promise<{ token: string; admin: Admin }> {
    try {
      const hashedPin = await this.bcryptService.hashPassword(body.passcode);

      body.admin.auth.transactionPin = hashedPin;
      body.admin.firstName = body.firstName;
      body.admin.lastName = body.lastName;
      body.admin.accountStatus.completeSetup = true;

      await body.admin.save();
      const token = this.jwtService.sign({ id: body.admin.id });

      const event = new UserCompleteSetupEvent(
        body.admin.email,
        `${body.admin.firstName} ${body.admin.lastName}`,
      );

      await this.emailProducerService.handleEmailEvent(event);

      return { token, admin: body.admin.toJSON() as Admin };
    } catch (error) {
      throw error;
    }
  }

  async login(body: { email: string; password: string }): Promise<{
    token?: string;
    admin?: Admin;
    completed: boolean;
    verified: boolean;
  }> {
    try {
      const admin = await this.databaseService.admins.findOne({
        email: body.email,
      });

      // eslint-disable-next-line prefer-const
      let loginToken: string | undefined;

      if (!admin) {
        throw new NotFoundException('Admin not found, Please signup');
      }

      if (!admin.accountStatus.accountVerified) {
        const code = generateRandomDigits();
        const hashedCode = await this.bcryptService.hashPassword(code);

        const now = new Date();
        now.setMinutes(now.getMinutes() + 30);

        admin.auth.accountVerificationToken = hashedCode;
        admin.auth.verificationTokenExpiration = now;
        await admin.save();

        const event = new UserRegisteredEvent(body.email, code);

        await this.emailProducerService.handleEmailEvent(event);
      }

      if (!admin.accountStatus.accountVerified) {
        return {
          token: loginToken,
          admin: admin.toJSON(),
          completed: admin.accountStatus.completeSetup,
          verified: admin.accountStatus.accountVerified,
        };
      }

      const { token: tok } = await this.verifyLoginCode({
        code: body.password,
        email: body.email,
      });
      loginToken = tok;

      console.log('Login token:', loginToken);

      return {
        token: loginToken,
        admin: admin.toJSON(),
        completed: admin.accountStatus.completeSetup,
        verified: admin.accountStatus.accountVerified,
      };
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

      console.log(admin.auth.password);

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: admin.auth.password!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

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
      await this.emailProducerService.handleEmailEvent(event);

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
      const password = await this.bcryptService.hashPassword(body.password);
      console.log(password);

      admin.auth.password = password;

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
