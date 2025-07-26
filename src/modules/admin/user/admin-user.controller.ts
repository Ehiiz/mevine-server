import {
  Controller,
  Get,
  Query,
  Param,
  Patch, // For ban and delete
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { AdminUserService } from './admin-user.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiExtraModels,
} from '@nestjs/swagger';
import { User } from 'src/core/database/schemas/user.schema'; // Import User schema for typing
import mongoose from 'mongoose'; // For mongoose.Types.ObjectId
import { AuthGuard } from 'src/core/guards/auth.guard';
import {
  ErrorResponseDto,
  WebServiceTypeEnum,
} from 'src/core/interfaces/shared.interface';
import {
  FetchUsersQueryDto,
  FormattedUserSchema,
  UserIdParamDto,
  UserResponseSchema,
} from './admin-user.validator';
import { ServiceDecorator } from 'src/core/decorators/auth.decorator';
import { Transform } from 'class-transformer';

@ApiTags('Admin User Management')
@Controller('')
@ServiceDecorator(WebServiceTypeEnum.ADMIN) // Custom decorator to indicate this is an admin service
@UseGuards(AuthGuard) // All routes in this controller require JWT authentication for admins
@ApiBearerAuth() // Indicates that these endpoints require a bearer token
@ApiExtraModels(UserResponseSchema)
export class AdminUserController {
  constructor(private readonly adminUserService: AdminUserService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Fetch all users with pagination and filters (Admin access)',
  })
  @ApiQuery({ name: 'page', required: true, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: true, type: Number, example: 10 })
  @ApiQuery({
    name: 'from',
    required: false,
    type: String,
    format: 'date',
    example: '2023-01-01',
  })
  @ApiQuery({
    name: 'to',
    required: false,
    type: String,
    format: 'date',
    example: '2023-12-31',
  })
  @ApiQuery({ name: 'search', required: false, type: String, example: 'john' })
  @ApiQuery({
    name: 'restricted',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiQuery({
    name: 'completeAccount',
    required: false,
    type: Boolean,
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'List of users fetched successfully for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'Users fetched successfully.' },
            data: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                count: { type: 'number', example: 45 },
                users: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/UserResponseSchema' },
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
    description:
      'Validation failed for query parameters or invalid date format.',
    type: ErrorResponseDto,
  })
  async fetchUsersWithQuery(@Query() query: FetchUsersQueryDto): Promise<{
    message: string;
    data: {
      currentPage: number;
      totalPages: number;
      users: User[];
      count: number;
    };
  }> {
    try {
      const data = await this.adminUserService.fetchUsersWithQuery(query);
      return {
        message: 'Users fetched successfully.',
        data: data,
      };
    } catch (error) {
      throw error;
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch a single user by ID (Admin access)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to fetch',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User fetched successfully for admin.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'User fetched successfully.' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/UserResponseSchema' },
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
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format.',
    type: ErrorResponseDto,
  })
  async fetchAUser(
    @Param() params: UserIdParamDto,
  ): Promise<{ message: string; data: { user: User } }> {
    try {
      const user = await this.adminUserService.fetchAUser({
        id: new mongoose.Types.ObjectId(params.id),
      });
      return {
        message: 'User fetched successfully.',
        data: { user },
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/ban')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Ban (restrict) a user by ID (Admin access)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to ban',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User banned successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: { type: 'string', example: 'User banned successfully.' },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/UserResponseSchema' },
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
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format.',
    type: ErrorResponseDto,
  })
  async banAUser(
    @Param() params: UserIdParamDto,
  ): Promise<{ message: string; data: { user: User } }> {
    try {
      const user = await this.adminUserService.banAUser({
        id: new mongoose.Types.ObjectId(params.id),
      });
      return {
        message: 'User banned successfully.',
        data: { user },
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Soft delete a user by ID (Admin access)' })
  @ApiParam({
    name: 'id',
    description: 'ID of the user to delete',
    example: '60c72b2f9b1d8e001c8a1b2d',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'User soft-deleted successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'User soft-deleted successfully.',
            },
            data: {
              type: 'object',
              properties: {
                user: { $ref: '#/components/schemas/UserResponseSchema' },
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
    description: 'Unauthorized.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid user ID format.',
    type: ErrorResponseDto,
  })
  async deleteAUser(
    @Param() params: UserIdParamDto,
  ): Promise<{ message: string; data: { user: User } }> {
    try {
      const user = await this.adminUserService.deleteAUser({
        id: new mongoose.Types.ObjectId(params.id),
      });
      return {
        message: 'User soft-deleted successfully.',
        data: { user },
      };
    } catch (error) {
      throw error;
    }
  }
}
