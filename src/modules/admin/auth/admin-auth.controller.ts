import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AdminAuthService } from './admin-auth.service';
import {
  CreateAdminAccountDto,
  VerifyAdminEmailDto,
  CompleteAdminAccountDto,
  AdminLoginDto,
  AdminForgotPasswordDto,
  VerifyAdminPasswordOtpDto,
  AdminPasswordResetDto,
  ChangeAdminPasswordDto,
  AdminResponseSchema, // For Swagger documentation
} from './admin-auth.validator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AdminDocument, Admin } from 'src/core/database/schemas/admin.schema'; // Adjust path as necessary
import {
  ErrorResponseDto,
  WebServiceTypeEnum,
} from 'src/core/interfaces/shared.interface';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { ServiceDecorator } from 'src/core/decorators/auth.decorator';

@ApiTags('Admin Authentication')
@Controller('')
export class AdminAuthController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Post('create-account')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new admin account' })
  @ApiBody({ type: CreateAdminAccountDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Admin account created successfully. Verification code sent.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example:
                'Admin account created successfully. Verification code sent to email.',
            },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string', example: '60c72b2f9b1d8e001c8a1b2d' },
                email: { type: 'string', example: 'admin@example.com' },
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
    description: 'Admin already exists or validation error.',
    type: ErrorResponseDto,
  })
  async createAccount(
    @Body() body: CreateAdminAccountDto,
  ): Promise<{ message: string; data: any }> {
    try {
      const { admin, code } = await this.adminAuthService.createAccount(body);
      // In a production environment, you should avoid returning the code directly.
      return {
        message:
          'Admin account created successfully. Verification code sent to email.',
        data: {
          id: admin._id,
          email: admin.email,
          // verificationCode: code, // Consider removing this line in production
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify admin email with the provided code' })
  @ApiBody({ type: VerifyAdminEmailDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin email successfully verified. JWT token returned.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Admin email verified successfully.',
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
    description: 'Admin not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired verification code.',
    type: ErrorResponseDto,
  })
  async verifyEmail(
    @Body() body: VerifyAdminEmailDto,
  ): Promise<{ message: string; data: { token: string } }> {
    try {
      const { token } = await this.adminAuthService.verifyEmail(body);
      return {
        message: 'Admin email verified successfully.',
        data: { token },
      };
    } catch (error) {
      throw error;
    }
  }

  @ServiceDecorator(WebServiceTypeEnum.ADMIN)
  @UseGuards(AuthGuard) // Assuming 'jwt' strategy is configured for admins
  @ApiBearerAuth()
  @Post('complete-account-setup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Complete admin account setup with personal details and password',
  })
  @ApiBody({ type: CompleteAdminAccountDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Admin account setup completed successfully. JWT token returned.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Admin account setup completed successfully.',
            },
            data: {
              type: 'object',
              properties: {
                token: {
                  type: 'string',
                  example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                },
                admin: { $ref: '#/components/schemas/AdminResponseSchema' }, // Reference the DTO schema
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
    @Body() body: Omit<CompleteAdminAccountDto, 'admin'>,
    @Req() request: Request,
  ): Promise<{
    message: string;
    data: { token: string; admin: Omit<Admin, 'auth'> };
  }> {
    try {
      const admin: AdminDocument = request.admin; // AdminDocument populated by AuthGuard
      const { token, admin: updatedAdmin } =
        await this.adminAuthService.completeAccount({ admin, ...body });
      return {
        message: 'Admin account setup completed successfully.',
        data: {
          token,
          admin: {
            _id: updatedAdmin._id,
            email: updatedAdmin.email,
            firstName: updatedAdmin.firstName,
            lastName: updatedAdmin.lastName,
            avatar: updatedAdmin.avatar,
            accountStatus: updatedAdmin.accountStatus,
            createdAt: updatedAdmin.createdAt,
            updatedAt: updatedAdmin.updatedAt,
            deleted: updatedAdmin.deleted,
            restricted: updatedAdmin.restricted,
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
    summary:
      'Admin login: sends login code (OTP) and then immediately verifies it, returning JWT token.',
    description:
      'This endpoint simulates an internal OTP verification. In a real scenario, there might be two separate steps: one to send OTP and another to verify OTP.',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin login successful. JWT token returned.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Admin login successful.' },
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
    description: 'Admin not found, please signup.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description:
      'Invalid or expired login code (internal verification failed).',
    type: ErrorResponseDto,
  })
  async login(
    @Body() body: AdminLoginDto,
  ): Promise<{ message: string; data: { token: string } }> {
    try {
      // The service's login method itself handles sending email AND verifying, returning the token directly.
      const { token } = await this.adminAuthService.login(body);
      return {
        message: 'Admin login successful.',
        data: { token },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Initiate admin password reset process by sending an OTP to email',
  })
  @ApiBody({ type: AdminForgotPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset OTP sent to admin email.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Reset code sent to admin email',
            },
            data: { type: 'object', nullable: true, example: null },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Admin not found.',
    type: ErrorResponseDto,
  })
  async forgotPassword(
    @Body() body: AdminForgotPasswordDto,
  ): Promise<{ message: string; data: null }> {
    try {
      const { message } = await this.adminAuthService.forgotPassword(body);
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
  @ApiOperation({
    summary: 'Verify the password reset OTP received via email for admin',
  })
  @ApiBody({ type: VerifyAdminPasswordOtpDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password reset OTP successfully verified for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'OTP verified successfully for admin.',
            },
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
    description: 'Admin not found.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Invalid or expired OTP.',
    type: ErrorResponseDto,
  })
  async verifyPasswordOTP(
    @Body() body: VerifyAdminPasswordOtpDto,
  ): Promise<{ message: string; data: { verified: boolean } }> {
    try {
      const { verified } = await this.adminAuthService.verifyPasswordOTP(body);
      return {
        message: 'OTP verified successfully for admin.',
        data: { verified },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('password-reset')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset admin password after OTP verification' })
  @ApiBody({ type: AdminPasswordResetDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin password successfully reset.',
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
    description: 'Admin not found.',
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
    @Body() body: AdminPasswordResetDto,
  ): Promise<{ message: string; data: { verified: boolean } }> {
    try {
      const { verified, message } =
        await this.adminAuthService.passwordReset(body);
      return {
        message: message,
        data: { verified },
      };
    } catch (error) {
      throw error;
    }
  }

  @ServiceDecorator(WebServiceTypeEnum.ADMIN)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Change current authenticated admin password' })
  @ApiBody({ type: ChangeAdminPasswordDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin password changed successfully.',
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
    @Body() body: ChangeAdminPasswordDto,
    @Req() request: Request,
  ): Promise<{ message: string; data: string }> {
    try {
      const admin: AdminDocument = request.admin;
      await this.adminAuthService.changePassword({ admin: admin, ...body });
      return {
        data: 'Password updated successfully',
        message: 'Successfully changed password.',
      };
    } catch (error) {
      throw error;
    }
  }
}
