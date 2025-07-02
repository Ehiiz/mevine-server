import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
  // private secret: string;
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly jwtService: JwtService,
    private readonly bcryptService: BcryptService,
    private readonly emailQueueService: EmailQueueService,
    private readonly configService: ConfigService,
  ) {
    // this.secret = this.configService.get<string>('JWT_SECRET')!;
  }

  async createAccount(body: {
    email: string;
    location: string;
  }): Promise<{ user: User; code: string }> {
    try {
      const existingUser = await this.databaseService.users.findOne({
        email: body.email,
      });

      if (existingUser) {
        // Check if the existing user is already verified
        if (existingUser.accountStatus?.accountVerified) {
          throw new ConflictException(
            'User with this email already exists and is already verified.',
          );
        } else {
          // User exists but is NOT verified (or verification status is missing/false).
          // Re-send a new verification token.
          console.log(
            `Existing unverified user found: ${existingUser.email}. Generating new verification token.`,
          );

          const newCode = generateRandomDigits();
          const newHashedCode = await this.bcryptService.hashPassword(newCode);

          const now = new Date();
          now.setMinutes(now.getMinutes() + 30); // Set new expiration to 30 minutes from now

          // Ensure user.auth object exists
          if (!existingUser.auth) {
            existingUser.auth = {} as any;
          }
          existingUser.auth.accountVerificationToken = newHashedCode;
          existingUser.auth.verificationTokenExpiration = now;

          // Ensure user.accountStatus exists and explicitly set accountVerified to false
          // if it's not already true. This handles cases where accountStatus or accountVerified
          // might be undefined.
          if (!existingUser.accountStatus) {
            existingUser.accountStatus = { accountVerified: false } as any;
          } else {
            existingUser.accountStatus.accountVerified = false; // Ensure it's false for re-verification
          }
          // If you were using markModified: existingUser.markModified('auth');
          // If you were using markModified: existingUser.markModified('accountStatus');

          await existingUser.save(); // Save the updated existing user with new token

          const event = new UserRegisteredEvent(existingUser.email, newCode);
          await this.emailQueueService.handleEmailEvent(event);

          // Return the updated existing user and the new plain-text code
          return { user: existingUser, code: newCode };
        }
      }

      // --- Original logic for creating a brand new user (if no existingUser found) ---
      const code = generateRandomDigits();
      const hashedCode = await this.bcryptService.hashPassword(code);

      const now = new Date();
      now.setMinutes(now.getMinutes() + 30); // 30 minutes expiration for new users

      const user = await this.databaseService.users.create({
        email: body.email,
        location: body.location,
        auth: {
          accountVerificationToken: hashedCode,
          verificationTokenExpiration: now,
        },
        // Initialize accountStatus for a new user, ensuring it's never undefined
        accountStatus: {
          accountVerified: false,
          completeSetup: false, // Assuming default for new accounts
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

      if (user.auth.verificationTokenExpiration! <= new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      if (!user.accountStatus) {
        user.accountStatus = {} as any;
      }

      user.auth.verificationTokenExpiration = null;
      user.auth.accountVerificationToken = null;
      user.accountStatus.accountVerified = true;
      const token = this.jwtService.sign({ id: user.id });

      await user.save();

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

      // Update user fields
      body.user.phoneNumber = body.phoneNumber;
      body.user.avatar = body.avatar || body.user.avatar; // Handle optional avatar
      body.user.firstName = body.firstName;
      body.user.lastName = body.lastName;

      // Update nested auth fields and mark as modified
      body.user.auth.transactionPin = hashedPin;
      body.user.auth.password = hashedPassword;

      // Update nested accountStatus and mark as modified
      body.user.accountStatus.completeSetup = true;

      await body.user.save();

      await body.user.activateUser();

      // Generate token after successful save
      const token = this.jwtService.sign({ id: body.user.id });

      // Send email notification
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

      if (!user.accountStatus || user.accountStatus?.completeSetup !== true) {
        throw new NotFoundException(
          'User has not completed account setup, Return to sign up ',
        );
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
  }): Promise<{ token: string; user: User }> {
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

      if (user.auth.loginTokenExpiration! <= new Date()) {
        throw new UnauthorizedException('Token has expired');
      }

      user.auth.loginTokenExpiration = null;
      user.auth.loginVerificationToken = null;
      user.wallet = user.wallet || null; // Ensure wallet is not undefined

      await user.save();

      const token = this.jwtService.sign({ id: user.id });

      return { token, user: user.toJSON() as User };
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

      if (user.auth.tokenExpiration! <= new Date()) {
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

      if (user.auth.tokenExpiration! <= new Date()) {
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
