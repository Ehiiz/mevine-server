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
import { UserDocument, User } from 'src/core/database/schemas/user.schema'; // Adjust path as necessary
import { AuthGuard } from 'src/core/guards/auth.guard';
import { UserProfileService } from './user -profile.service';
import { UpdateProfileDto } from './user-profile.validator';
import { ErrorResponseDto } from 'src/core/database/interfaces/shared.interface';

@ApiTags('User Profile')
@Controller('profile')
@UseGuards(AuthGuard) // All routes in this controller require JWT authentication
@ApiBearerAuth() // Indicates that these endpoints require a bearer token
export class UserProfileController {
  constructor(private readonly userProfileService: UserProfileService) {}

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
                  // You might want to define a specific UserResponseDto for cleaner Swagger.
                  // For now, listing common properties as an example.
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
    description: 'User or wallet not found.', // Potentially from service if wallet doesn't exist for user
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
