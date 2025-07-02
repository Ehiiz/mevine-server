import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserAuthService } from './user-auth.service';
import {
  CreateAccountDto,
  VerifyEmailDto,
  CompleteAccountDto,
  LoginDto,
  VerifyLoginCodeDto,
  ForgotPasswordDto,
  VerifyPasswordOtpDto,
  PasswordResetDto,
  ChangePasswordDto,
  ChangeTransactionPinDto,
} from './user-auth.validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express'; // Import Request from express
import { User, UserDocument } from 'src/core/database/schemas/user.schema'; // Adjust path as necessary
import { AuthGuard } from 'src/core/guards/auth.guard';
import { ErrorResponseDto } from 'src/core/interfaces/shared.interface';

@ApiTags('User Authentication')
@Controller('')
export class UserAuthController {
  constructor(private readonly userAuthService: UserAuthService) {}

  @Post('create-account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new user account' })
  @ApiBody({ type: CreateAccountDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'User account created successfully. Verification code sent.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example:
                'Account created successfully. Verification code sent to email.',
            },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' },
                email: { type: 'string', example: 'user@example.com' },
                location: { type: 'string', example: 'Lagos, Nigeria' },
                // verificationCode: { type: 'string', example: '1234', description: 'Hidden in production' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User already exists or validation error.',
    type: ErrorResponseDto,
  })
  async createAccount(
    @Body() body: CreateAccountDto,
  ): Promise<{ message: string; data: any }> {
    try {
      const { user, code } = await this.userAuthService.createAccount(body);
      // Actual runtime response
      return {
        message:
          'Account created successfully. Verification code sent to email.',
        data: {
          id: user._id,
          email: user.email,
          location: user.location,
          // verificationCode: code, // Consider removing this line in production for actual API responses
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify user email with the provided code' })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email successfully verified. JWT token returned.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Email verified successfully.',
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired verification code.',
    type: ErrorResponseDto,
  })
  async verifyEmail(
    @Body() body: VerifyEmailDto,
  ): Promise<{ message: string; data: { token: string } }> {
    try {
      const { token } = await this.userAuthService.verifyEmail(body);
      // Actual runtime response
      return {
        message: 'Email verified successfully.',
        data: { token },
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('complete-account-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete user account setup with personal details and passwords',
  })
  @ApiBody({ type: CompleteAccountDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account setup completed successfully. JWT token returned.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Account setup completed successfully.',
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  type: 'object',
                  properties: {
                    id: { type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' },
                    email: { type: 'string', example: 'user@example.com' },
                    firstName: { type: 'string', example: 'John' },
                    lastName: { type: 'string', example: 'Doe' },
                    phoneNumber: { type: 'string', example: '+2348012345678' },
                    avatar: {
                      type: 'string',
                      example: 'https://example.com/avatar.jpg',
                      nullable: true,
                    },
                    accountStatus: {
                      type: 'object',
                      properties: {
                        accountVerified: { type: 'boolean', example: true },
                        kycVerified: { type: 'boolean', example: false },
                        completeSetup: { type: 'boolean', example: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed or other error during setup.',
    type: ErrorResponseDto,
  })
  async completeAccount(
    @Body() body: Omit<CompleteAccountDto, 'user'>,
    @Req() request: Request,
  ): Promise<{ message: string; data: { token: string; user: any } }> {
    try {
      const user: UserDocument = request.user;
      const { token, user: updatedUser } =
        await this.userAuthService.completeAccount({ user, ...body });
      // Actual runtime response
      return {
        message: 'Account setup completed successfully.',
        data: {
          token,
          user: {
            id: updatedUser._id,
            email: updatedUser.email,
            firstName: updatedUser.firstName,
            lastName: updatedUser.lastName,
            phoneNumber: updatedUser.phoneNumber,
            avatar: updatedUser.avatar,
            accountStatus: updatedUser.accountStatus,
            wallet: updatedUser.wallet, // Include wallet if needed
          },
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate user login process by sending a login code to email',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login code sent to user email.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Email sent to account' },
            data: { type: 'object', nullable: true, example: null }, // Data is null for this endpoint
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found, please signup.',
    type: ErrorResponseDto,
  })
  async login(
    @Body() body: LoginDto,
  ): Promise<{ message: string; data: null }> {
    try {
      const { message } = await this.userAuthService.login(body);
      // Actual runtime response
      return {
        message: message,
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-login-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify the login code received via email to complete login',
  })
  @ApiBody({ type: VerifyLoginCodeDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Login successful. JWT token returned.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Login successful.' },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                user: {
                  type: 'object',
                  description: 'The updated user object',
                  properties: {
                    _id: {
                      type: 'string',
                      example: '60c72b2f9b1d8e001c8a1b2d',
                    },
                    email: { type: 'string', example: 'user@example.com' },
                    firstName: { type: 'string', example: 'Jane' },
                    lastName: { type: 'string', example: 'Doe' },
                    avatar: {
                      type: 'string',
                      example: 'https://example.com/new-avatar.jpg',
                      nullable: true,
                    },
                    location: { type: 'string', example: 'Lagos, Nigeria' },
                    phoneNumber: { type: 'string', example: '+2348012345678' },
                    // Add other relevant user properties here
                  },
                },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired login code.',
    type: ErrorResponseDto,
  })
  async verifyLoginCode(
    @Body() body: VerifyLoginCodeDto,
  ): Promise<{ message: string; data: { token: string; user: User } }> {
    try {
      const { token, user } = await this.userAuthService.verifyLoginCode(body);
      // Actual runtime response
      return {
        message: 'Login successful.',
        data: { token, user: { ...user, wallet: user.wallet } },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate password reset process by sending an OTP to email',
  })
  @ApiBody({ type: ForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset OTP sent to user email.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Reset code sent to user email',
            },
            data: { type: 'object', nullable: true, example: null }, // Data is null for this endpoint
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  async forgotPassword(
    @Body() body: ForgotPasswordDto,
  ): Promise<{ message: string; data: null }> {
    try {
      const { message } = await this.userAuthService.forgotPassword(body);
      // Actual runtime response
      return {
        message: message,
        data: null,
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-password-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify the password reset OTP received via email' })
  @ApiBody({ type: VerifyPasswordOtpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset OTP successfully verified.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'OTP verified successfully.' },
            data: {
              type: 'object',
              properties: {
                verified: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired OTP.',
    type: ErrorResponseDto,
  })
  async verifyPasswordOTP(
    @Body() body: VerifyPasswordOtpDto,
  ): Promise<{ message: string; data: { verified: boolean } }> {
    try {
      const { verified } = await this.userAuthService.verifyPasswordOTP(body);
      // Actual runtime response
      return {
        message: 'OTP verified successfully.',
        data: { verified },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password after OTP verification' })
  @ApiBody({ type: PasswordResetDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password successfully reset.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Successfully reset password' },
            data: {
              type: 'object',
              properties: {
                verified: { type: 'boolean', example: true },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired OTP.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'New password validation failed.',
    type: ErrorResponseDto,
  })
  async passwordReset(
    @Body() body: PasswordResetDto,
  ): Promise<{ message: string; data: { verified: boolean } }> {
    try {
      const { verified, message } =
        await this.userAuthService.passwordReset(body);
      // Actual runtime response
      return {
        message: message,
        data: { verified },
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current authenticated user password' })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password changed successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Successfully changed password.',
            },
            data: { type: 'string', example: 'Password updated successfully' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Incorrect current password or new password invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @Req() request: Request,
  ): Promise<{ message: string; data: string }> {
    try {
      const user: UserDocument = request.user;
      await this.userAuthService.changePassword({ user: user, ...body });
      // Actual runtime response, matching your example
      return {
        data: 'Password updated successfully',
        message: 'Successfully changed password.',
      };
    } catch (error) {
      throw error;
    }
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('change-transaction-pin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Change current authenticated user transaction PIN',
  })
  @ApiBody({ type: ChangeTransactionPinDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Transaction PIN changed successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Successfully changed transaction PIN.',
            },
            data: {
              type: 'string',
              example: 'Transaction PIN updated successfully',
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Incorrect current PIN or new PIN invalid.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  async changeTransactionPin(
    @Body() body: ChangeTransactionPinDto,
    @Req() request: Request,
  ): Promise<{ message: string; data: string }> {
    try {
      const user: UserDocument = request.user;
      await this.userAuthService.changeTransactionPin({ user: user, ...body });
      // Actual runtime response
      return {
        data: 'Transaction PIN updated successfully',
        message: 'Successfully changed transaction PIN.',
      };
    } catch (error) {
      throw error;
    }
  }
}
