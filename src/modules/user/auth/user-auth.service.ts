import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DatabaseService } from 'src/core/database/database.service';
import { User, UserDocument } from 'src/core/database/schemas/user.schema';
import { EmailQueueService } from 'src/core/integrations/emails/email-queue.service';
import {
  UserCompleteSetupEvent,
  UserConfirmEmailEvent,
  UserLoginAttemptEvent,
  UserRegisteredEvent,
} from 'src/core/integrations/emails/email.utils';
import { BcryptService } from 'src/core/security/bcrypt.service';
import { generateRandomDigits } from 'src/core/utils/random-generator.util';

@Injectable()
export class UserAuthService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly emailQueueService: EmailQueueService,
  ) {}

  async createAccount(body: {
    email: string;
    location: string;
  }): Promise<{ user: User; code: string }> {
    try {
      const existingUser = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (existingUser) {
        throw Error('User already exists');
      }

      const code = generateRandomDigits();
      const hashedCode = this.bcryptService.hashPassword(code);

      const now = new Date();
      now.setMinutes(now.getHours() + 7);

      const user = await this.databaseService.users.create({
        email: body.email,
        location: body.location,
        auth: {
          accountVerificationToken: hashedCode,
          verificationTokenExpiration: now,
        },
      });

      const event = new UserRegisteredEvent(body.email, code);

      await this.emailQueueService.handleEmailEvent(event);

      return { user, code };
    } catch (error) {
      throw error;
    }
  }

  async verifyEmail(body: {
    email: string;
    code: string;
  }): Promise<{ token: string }> {
    try {
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (!user) {
        throw new NotFoundException(
          'User not found in database, please signup',
        );
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: user.auth.accountVerificationToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (user.auth.verificationTokenExpiration! > new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      user.auth.verificationTokenExpiration = null;
      user.auth.accountVerificationToken = null;
      user.accountStatus.accountVerified = true;

      await user.save();
      const token = this.jwtService.sign({ id: user.id });

      return { token };
    } catch (error) {
      throw error;
    }
  }

  async completeAccount(body: {
    user: UserDocument;
    password: string;
    firstName: string;
    lastName: string;
    passcode: string;
    phoneNumber: string;
    avatar?: string;
  }): Promise<{ token: string; user: User }> {
    try {
      const hashedPassword = await this.bcryptService.hashPassword(
        body.password,
      );
      const hashedPin = await this.bcryptService.hashPassword(body.passcode);

      body.user.phoneNumber = body.phoneNumber;
      body.user.avatar = body.avatar!;
      body.user.auth.transactionPin = hashedPin;
      body.user.firstName = body.firstName;
      body.user.lastName = body.lastName;
      body.user.auth.password = hashedPassword;
      body.user.accountStatus.completeSetup = true;
      const token = this.jwtService.sign({ id: body.user.id });

      await body.user.save();

      const event = new UserCompleteSetupEvent(
        body.user.email,
        `${body.user.firstName} ${body.user.lastName}`,
      );

      await this.emailQueueService.handleEmailEvent(event);

      return { token, user: body.user };
    } catch (error) {
      throw error;
    }
  }

  async login(body: { email: string }): Promise<{ message: string }> {
    try {
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (!user) {
        throw new NotFoundException('User not found, Please signup');
      }

      const loginCode = generateRandomDigits();

      user.auth.loginVerificationToken =
        await this.bcryptService.hashPassword(loginCode);
      user.auth.loginTokenExpiration = new Date();
      user.auth.loginTokenExpiration.setMinutes(
        user.auth.loginTokenExpiration.getMinutes() + 10,
      );

      await user.save();

      const event = new UserLoginAttemptEvent(body.email, loginCode);

      await this.emailQueueService.handleEmailEvent(event);

      return { message: 'Email sent to account' };
    } catch (error) {
      throw error;
    }
  }

  async verifyLoginCode(body: {
    code: string;
    email: string;
  }): Promise<{ token: string }> {
    try {
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (!user) {
        throw new NotFoundException('User not found in database');
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: user.auth.loginVerificationToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (user.auth.loginTokenExpiration! > new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      user.auth.loginTokenExpiration = null;
      user.auth.loginVerificationToken = null;

      await user.save();

      const token = this.jwtService.sign({ id: user.id });

      return { token };
    } catch (error) {
      throw error;
    }
  }

  async forgotPassword(body: { email: string }): Promise<{ message: string }> {
    try {
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const code = generateRandomDigits();

      user.auth.passwordResetToken =
        await this.bcryptService.hashPassword(code);
      user.auth.tokenExpiration = new Date();
      user.auth.tokenExpiration.setMinutes(
        user.auth.tokenExpiration.getMinutes() + 30,
      );

      await user.save();

      const event = new UserConfirmEmailEvent(body.email, code);
      await this.emailQueueService.handleEmailEvent(event);

      return { message: 'Reset code sent to user email' };
    } catch (error) {
      throw error;
    }
  }

  async verifyPasswordOTP(body: {
    code: string;
    email: string;
  }): Promise<{ verified: boolean }> {
    try {
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (!user) {
        throw new NotFoundException('User not found in database');
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: user.auth.passwordResetToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (user.auth.tokenExpiration! > new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      await user.save();

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
      const user = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (!user) {
        throw new NotFoundException('User not found in database');
      }

      const validToken = await this.bcryptService.comparePassword({
        password: body.code,
        hashedPassword: user.auth.passwordResetToken!,
      });

      if (!validToken) {
        throw new UnauthorizedException('Invalid unauthorized token');
      }

      if (user.auth.tokenExpiration! > new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      user.auth.password = await this.bcryptService.hashPassword(body.password);

      user.auth.tokenExpiration = null;
      user.auth.passwordResetToken = null;

      await user.save();

      return { verified: true, message: 'Successfully reset password' };
    } catch (error) {
      throw error;
    }
  }

  async changePassword(body: {
    user: UserDocument;
    newPassword: string;
    oldPassword: string;
  }): Promise<{ verified: boolean }> {
    try {
      const match = await this.bcryptService.comparePassword({
        password: body.oldPassword,
        hashedPassword: body.user.auth.password!,
      });

      if (!match) {
        throw new UnauthorizedException('Old password is incorrect');
      }

      body.user.auth.password = await this.bcryptService.hashPassword(
        body.newPassword,
      );

      await body.user.save();

      return { verified: true };
    } catch (error) {
      throw error;
    }
  }

  async changeTransactionPin(body: {
    user: UserDocument;
    newPin: string;
    oldPin: string;
  }): Promise<{ verified: boolean }> {
    try {
      const match = await this.bcryptService.comparePassword({
        password: body.oldPin,
        hashedPassword: body.user.auth.transactionPin!,
      });

      if (!match) {
        throw new UnauthorizedException('Old transaction pin is incorrect');
      }

      body.user.auth.transactionPin = await this.bcryptService.hashPassword(
        body.newPin,
      );

      await body.user.save();

      return { verified: true };
    } catch (error) {
      throw error;
    }
  }
}
