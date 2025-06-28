import {
  Controller,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Get,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
// Ensure User and UserDocument are correctly imported (they are in your example)
import { UserDocument, User } from 'src/core/database/schemas/user.schema';
import { AuthGuard } from 'src/core/guards/auth.guard';
import { UserProfileService } from './user-profile.service';
import { UpdateProfileDto } from './user-profile.validator';
import { ErrorResponseDto } from 'src/core/interfaces/shared.interface';

@ApiTags('User Profile')
@Controller('') // Assuming base path from RouterModule is 'user/profile'
@UseGuards(AuthGuard) // All routes in this controller require JWT authentication
@ApiBearerAuth() // Indicates that these endpoints require a bearer token
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

  @Get() // NEW: Get User Profile Endpoint
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch authenticated user profile information' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User profile fetched successfully.',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  type: 'object',
                  description: 'The user object (without sensitive auth data)',
                  // For Swagger, you might want a dedicated UserProfileResponseDto
                  // that omits sensitive fields for clearer API docs.
                  // For now, listing common properties.
                  properties: {
                    _id: {
                      type: 'string',
                      example: '60c72b2f9b1d8e001c8a1b2d',
                    },
                    email: { type: 'string', example: 'user@example.com' },
                    firstName: { type: 'string', example: 'John' },
                    lastName: { type: 'string', example: 'Doe' },
                    avatar: {
                      type: 'string',
                      example: 'https://example.com/avatar.jpg',
                      nullable: true,
                    },
                    location: { type: 'string', example: 'New York' },
                    phoneNumber: { type: 'string', example: '+1234567890' },
                    accountStatus: {
                      type: 'object',
                      properties: {
                        accountVerified: { type: 'boolean', example: true },
                        kycVerified: { type: 'boolean', example: false },
                        completeSetup: { type: 'boolean', example: true },
                      },
                    },
                    referralCode: { type: 'string', example: 'ABC1234' },
                    createdAt: { type: 'string', format: 'date-time' },
                    updatedAt: { type: 'string', format: 'date-time' },
                    // Sensitive fields like 'auth' are excluded by toJSON virtual
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
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User not found.',
    type: ErrorResponseDto,
  })
  async getProfile(
    @Req() request: Request,
  ): Promise<{ message: string; data: { user: User } }> {
    try {
      const user: any = request.user.toJSON(); // User is attached by AuthGuard
      // No need to call a service method for simple retrieval, as the user is already on the request.
      // If you needed to populate relations or do complex logic, you would call a service method.
      return {
        message: 'User profile fetched successfully.',
        data: { user: user }, // The toJSON virtual will clean this on response
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch('update')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update authenticated user profile information' })
  @ApiBody({ type: UpdateProfileDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User profile updated successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Profile updated successfully.',
            },
            data: {
              type: 'object',
              properties: {
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
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Validation failed for profile data.',
    type: ErrorResponseDto,
  })
  async updateProfile(
    @Body() body: UpdateProfileDto,
    @Req() request: Request,
  ): Promise<{ message: string; data: { user: User } }> {
    try {
      const user: UserDocument = request.user;
      const { user: updatedUser } = await this.userProfileService.updateProfile(
        { user, ...body },
      );
      return {
        message: 'Profile updated successfully.',
        data: { user: updatedUser },
      };
    } catch (error) {
      throw error;
    }
  }

  @Get('balance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch the balance of the authenticated user wallet',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User wallet balance fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User balance fetched successfully.',
            },
            data: {
              type: 'object',
              properties: {
                balance: { type: 'number', example: 1234.56, format: 'float' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User or wallet not found.',
    type: ErrorResponseDto,
  })
  async fetchBalance(
    @Req() request: Request,
  ): Promise<{ message: string; data: { balance: number } }> {
    try {
      const user: UserDocument = request.user;
      const { balance } = await this.userProfileService.fetchBalance({ user });
      return {
        message: 'User balance fetched successfully.',
        data: { balance },
      };
    } catch (error) {
      throw error;
    }
  }
}
