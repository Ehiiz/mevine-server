import {
  Controller,
  Get,
  Post, // Added for mark-all-read (if using POST)
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Req,
  Query,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
  ApiProperty, // Added for PATCH body
} from '@nestjs/swagger';
import { Request } from 'express';
import { UserDocument } from 'src/core/database/schemas/user.schema'; // Adjust path
import { Notification } from 'src/core/database/schemas/notification.schema'; // Adjust path (for response typing)
import { AuthGuard } from 'src/core/guards/auth.guard'; // Adjust path
import { ErrorResponseDto } from 'src/core/interfaces/shared.interface'; // Adjust path
import { IsBoolean } from 'class-validator'; // For DTO
import { UserNotificationsService } from './user-notification.service';
import { PaginationDto } from './user-notification.validator';
import { FlattenedUserNotification } from 'src/core/interfaces/user.interface';

// DTO for updating read status of a single notification
class UpdateReadStatusDto {
  @ApiProperty({
    description: 'New read status (true for read, false for unread)',
  })
  @IsBoolean()
  read: boolean;
}

@ApiTags('User Notifications')
@Controller('')
@UseGuards(AuthGuard) // Protect this controller with JWT authentication
@ApiBearerAuth() // Indicate that a Bearer token is required
export class UserNotificationsController {
  constructor(
    private readonly userNotificationsService: UserNotificationsService,
  ) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch notifications for the authenticated user' })
  @ApiQuery({ type: PaginationDto }) // Document query parameters
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notifications fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Notifications fetched successfully.',
            },
            data: {
              type: 'object',
              properties: {
                currentPage: { type: 'number', example: 1 },
                totalPages: { type: 'number', example: 5 },
                count: { type: 'number', example: 42 },
                unreadCount: {
                  type: 'number',
                  example: 10,
                  description: 'Total unread notifications for the user',
                }, // NEW
                notifications: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      _id: {
                        type: 'string',
                        example: '60c72b2f9b1d8e001c8a1b2d',
                        description: 'ID of the notification content',
                      },
                      icon: { type: 'string', example: 'bell' },
                      title: { type: 'string', example: 'New Feature Alert!' },
                      description: {
                        type: 'string',
                        example: 'Check out our new amazing feature.',
                      },
                      initiator: {
                        type: 'string',
                        example: '60c72b2f9b1d8e001c8a1b2e',
                        description:
                          'ID of the admin who initiated this notification',
                      },
                      isBroadcast: { type: 'boolean', example: true },
                      targetUsers: { type: 'array', items: { type: 'string' } },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                      read: {
                        type: 'boolean',
                        example: false,
                        description: 'User-specific read status',
                      }, // NEW
                      archived: {
                        type: 'boolean',
                        example: false,
                        description: 'User-specific archived status',
                      }, // NEW
                      userNotificationId: {
                        type: 'string',
                        example: '60c72b2f9b1d8e001c8a1b3f',
                        description:
                          'ID of this user-specific notification instance (for updates)',
                      }, // NEW
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
    status: HttpStatus.INTERNAL_SERVER_ERROR,
    description: 'Internal server error.',
    type: ErrorResponseDto,
  })
  async fetchNotifications(
    @Req() request: Request,
    @Query() paginationDto: PaginationDto,
  ): Promise<{
    message: string;
    data: {
      notifications: FlattenedUserNotification[];
      currentPage: number;
      totalPages: number;
      count: number;
      unreadCount: number;
    };
  }> {
    try {
      const user: UserDocument = request.user;
      const page = parseInt(paginationDto.page || '1', 10);
      const limit = parseInt(paginationDto.limit || '10', 10);
      const read =
        paginationDto.read !== undefined
          ? paginationDto.read === 'true'
          : undefined;

      const { notifications, currentPage, totalPages, count, unreadCount } =
        await this.userNotificationsService.fetchNotifications({
          user,
          page,
          limit,
          read,
        });

      return {
        message: 'Notifications fetched successfully.',
        data: { notifications, currentPage, totalPages, count, unreadCount },
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id/read-status') // Route to update read status of a specific user notification
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark a user notification as read or unread' })
  @ApiParam({
    name: 'id',
    description:
      'ID of the user-specific notification instance (UserNotification._id)',
  })
  @ApiBody({ type: UpdateReadStatusDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification read status updated successfully.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Notification status updated successfully.',
        },
        data: {
          type: 'object',
          properties: {
            userNotificationId: {
              type: 'string',
              example: '60c72b2f9b1d8e001c8a1b3f',
            },
            readStatus: { type: 'boolean', example: true },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'User notification not found or does not belong to the user.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
    type: ErrorResponseDto,
  })
  async updateNotificationStatus(
    @Req() request: Request,
    @Param('id') userNotificationId: string, // The _id of the UserNotification document
    @Body() body: UpdateReadStatusDto,
  ): Promise<{
    message: string;
    data: { userNotificationId: string; readStatus: boolean };
  }> {
    try {
      const user: UserDocument = request.user;
      const { readStatus, userNotification } =
        await this.userNotificationsService.updateReadStatus({
          user: user,
          userNotificationId: userNotificationId,
          read: body.read,
        });

      return {
        message: 'Notification status updated successfully.',
        data: {
          userNotificationId: userNotification._id.toHexString(), // Return the ID of the UserNotification instance
          readStatus: readStatus,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  @Post('mark-all-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all unread notifications for the user as read',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All unread notifications marked as read.',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'All unread notifications marked as read.',
        },
        data: {
          type: 'object',
          properties: {
            modifiedCount: {
              type: 'number',
              example: 5,
              description: 'Number of notifications marked as read',
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
  async markAllNotificationsAsRead(
    @Req() request: Request,
  ): Promise<{ message: string; data: { modifiedCount: number } }> {
    try {
      const user: UserDocument = request.user;
      const modifiedCount =
        await this.userNotificationsService.markAllAsRead(user);
      return {
        message: 'All unread notifications marked as read.',
        data: { modifiedCount },
      };
    } catch (error) {
      throw error;
    }
  }
}
