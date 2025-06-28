import {
  Controller,
  Get,
  Post,
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
  ApiBody,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { Request } from 'express';
import { AdminDocument } from 'src/core/database/schemas/admin.schema'; // Adjust path
// Assuming you have an AdminAuthGuard or your existing AuthGuard checks for admin roles
import { AuthGuard } from 'src/core/guards/auth.guard'; // Adjust path
import {
  ErrorResponseDto,
  WebServiceTypeEnum,
} from 'src/core/interfaces/shared.interface'; // Adjust path

import { Notification } from 'src/core/database/schemas/notification.schema'; // For response typing
import { AdminNotificationsService } from './admin-notification.service';
import {
  CreateAdminNotificationDto,
  AdminNotificationPaginationDto,
  UpdateAdminNotificationDto,
} from './admin-notification.validator';
import { ServiceDecorator } from 'src/core/decorators/auth.decorator';

@ApiTags('Admin Notifications')
@Controller('admin/notifications') // Admin-specific route prefix
@ServiceDecorator(WebServiceTypeEnum.ADMIN) // Custom decorator to indicate this is an admin service
@UseGuards(AuthGuard) // Assuming this guard checks for admin roles/permissions
@ApiBearerAuth()
export class AdminNotificationsController {
  constructor(
    private readonly adminNotificationsService: AdminNotificationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new notification (by admin)' })
  @ApiBody({ type: CreateAdminNotificationDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Notification created successfully.',
    // FIX: Update response schema to match new return structure
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Notification created successfully.',
            },
            data: {
              type: 'object',
              properties: {
                notification: {
                  $ref: '#/components/schemas/Notification', // Reference the Notification schema
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
    description: 'Invalid input data.',
    type: ErrorResponseDto,
  })
  async createNotification(
    @Body() body: CreateAdminNotificationDto,
    @Req() request: Request,
  ): Promise<{ message: string; data: { notification: Notification } }> {
    // FIX: Updated return type
    try {
      const initiator: AdminDocument = request.admin; // Assuming AuthGuard attaches admin user to request
      const notification =
        await this.adminNotificationsService.createNotification({
          initiator,
          ...body,
        });
      return {
        message: 'Notification created successfully.', // FIX: Added message
        data: { notification }, // FIX: Wrapped notification in data object
      };
    } catch (error) {
      throw error;
    }
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch all notifications created by admins' })
  @ApiQuery({ type: AdminNotificationPaginationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Admin notifications fetched successfully.',
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            notifications: {
              type: 'array',
              items: { $ref: '#/components/schemas/Notification' }, // Reference the Notification schema
            },
            currentPage: { type: 'number', example: 1 },
            totalPages: { type: 'number', example: 5 },
            count: { type: 'number', example: 42 },
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
  async fetchAdminNotifications(
    @Query() queryDto: AdminNotificationPaginationDto,
  ): Promise<{
    data: {
      notifications: Notification[];
      currentPage: number;
      totalPages: number;
      count: number;
    };
    message: string;
  }> {
    try {
      const page = parseInt(queryDto.page || '1', 10);
      const limit = parseInt(queryDto.limit || '10', 10);

      const { notifications, currentPage, totalPages, count } =
        await this.adminNotificationsService.fetchAdminNotifications({
          page,
          limit,
          search: queryDto.search,
          initiatorId: queryDto.initiatorId,
        });

      return {
        data: { notifications, currentPage, totalPages, count },
        message: 'Successfully fetched admin notification',
      };
    } catch (error) {
      throw error;
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing notification (by admin)' })
  @ApiParam({ name: 'id', description: 'ID of the notification to update' })
  @ApiBody({ type: UpdateAdminNotificationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification updated successfully.',
    // FIX: Update response schema to match new return structure
    content: {
      'application/json': {
        schema: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              example: 'Notification updated successfully.',
            },
            data: {
              type: 'object',
              properties: {
                notification: {
                  $ref: '#/components/schemas/Notification', // Reference the Notification schema
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
    description: 'Notification not found or admin does not have permission.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized access.',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid update data.',
    type: ErrorResponseDto,
  })
  async updateNotification(
    @Param('id') notificationId: string,
    @Body() body: UpdateAdminNotificationDto,
    @Req() request: Request,
  ): Promise<{ message: string; data: { notification: Notification } }> {
    // FIX: Updated return type
    try {
      const initiator: AdminDocument = request.admin; // Assuming AuthGuard attaches admin user to request
      const updatedNotification =
        await this.adminNotificationsService.updateNotification({
          notificationId,
          initiator,
          ...body,
        });
      return {
        message: 'Notification updated successfully.', // FIX: Added message
        data: { notification: updatedNotification }, // FIX: Wrapped notification in data object
      };
    } catch (error) {
      throw error;
    }
  }
}
