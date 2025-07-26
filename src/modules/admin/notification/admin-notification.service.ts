import {
  Injectable,
  Logger,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service'; // Adjust path
import { AdminDocument } from 'src/core/database/schemas/admin.schema'; // Adjust path
import {
  Notification,
  NotificationDocument,
} from 'src/core/database/schemas/notification.schema'; // Adjust path
import { UserDocument } from 'src/core/database/schemas/user.schema'; // Adjust path (for targeting users)
import * as mongoose from 'mongoose';

@Injectable()
export class AdminNotificationsService {
  private readonly logger = new Logger(AdminNotificationsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async createNotification(body: {
    initiator: AdminDocument; // Admin who creates the notification
    icon?: string;
    title: string;
    description: string;
    isBroadcast?: boolean;
    targetUsers?: string[]; // Array of user IDs (strings)
  }): Promise<NotificationDocument> {
    try {
      const {
        initiator,
        icon,
        title,
        description,
        isBroadcast = true,
        targetUsers,
      } = body;

      // Validate targetUsers if not broadcast
      let actualTargetUsers: mongoose.Types.ObjectId[] = [];
      if (!isBroadcast && targetUsers && targetUsers.length > 0) {
        // Optional: Verify if targetUsers actually exist in your User collection
        const existingUsers = await this.databaseService.users
          .find({ _id: { $in: targetUsers } })
          .select('_id')
          .exec();
        if (existingUsers.length !== targetUsers.length) {
          throw new BadRequestException(
            'One or more target user IDs are invalid.',
          );
        }
        actualTargetUsers = existingUsers.map((u) => u._id);
      }

      const newNotification: NotificationDocument =
        await this.databaseService.notifications.create({
          icon,
          title,
          description,
          initiator: initiator._id,
          isBroadcast,
          targetUsers: actualTargetUsers, // Assign validated target users
        });

      // After creating the main notification, create user-specific instances in the background
      // This part can be offloaded to a queue (like BullMQ) for very large user bases
      this.logger.debug(
        `Creating user notifications for content: ${newNotification._id}`,
      );
      let usersToNotify: UserDocument[] = [];
      if (newNotification.isBroadcast) {
        usersToNotify = await this.databaseService.users
          .find()
          .select('_id')
          .exec();
      } else if (newNotification.targetUsers.length > 0) {
        usersToNotify = await this.databaseService.users
          .find({ _id: { $in: newNotification.targetUsers } })
          .select('_id')
          .exec();
      }

      const userNotificationPromises = usersToNotify.map((user) =>
        this.databaseService.userNotifications.create({
          user: user._id,
          notification: newNotification._id,
          read: false,
          archived: false,
        }),
      );
      await Promise.all(userNotificationPromises);
      this.logger.debug(
        `Created ${userNotificationPromises.length} user-specific notification instances.`,
      );

      this.logger.log(
        `Admin notification created: ${newNotification._id} by ${initiator.email}`,
      );
      return newNotification;
    } catch (error) {
      this.logger.error('Failed to create admin notification:', error);
      throw error; // Re-throw NestJS HTTP exceptions, wrap others
    }
  }

  async fetchAdminNotifications(body: {
    page: number;
    limit: number;
    search?: string;
    initiatorId?: string;
  }): Promise<{
    currentPage: number;
    totalPages: number;
    notifications: Notification[];
    count: number;
  }> {
    try {
      const { page, limit, search, initiatorId } = body;
      const skip = (page - 1) * limit;

      const query: any = {};
      if (search) {
        const searchRegex = { $regex: search, $options: 'i' };
        query.$or = [{ title: searchRegex }, { description: searchRegex }];
      }
      if (initiatorId) {
        query.initiator = new mongoose.Types.ObjectId(initiatorId);
      }

      const [notifications, count] = await Promise.all([
        this.databaseService.notifications
          .find(query)
          .populate('initiator', 'firstName lastName email') // Populate initiator details
          .populate('targetUsers', 'firstName lastName email')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.databaseService.notifications.countDocuments(),
      ]);
      return {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        notifications,
        count,
      };
    } catch (error) {
      this.logger.error('Failed to fetch admin notifications:', error);
      throw new InternalServerErrorException(
        'Failed to retrieve admin notifications.',
      );
    }
  }

  async updateNotification(body: {
    notificationId: string;
    initiator: AdminDocument; // Admin performing the update
    icon?: string;
    title?: string;
    description?: string;
    isBroadcast?: boolean;
    targetUsers?: string[];
  }): Promise<NotificationDocument> {
    try {
      const { notificationId, initiator, ...updateData } = body;

      const notification = await this.databaseService.notifications
        .findById(notificationId)
        .populate('initiator');

      if (!notification) {
        throw new NotFoundException('Notification not found.');
      }

      // Check if the current admin is the initiator or has broader permissions (if applicable)
      // if (notification.initiator.toString() !== initiator._id.toString()) {
      //   throw new UnauthorizedException(
      //     'You are not authorized to update this notification.',
      //   );
      // }

      // Handle `isBroadcast` and `targetUsers` updates
      let shouldRegenerateUserNotifications = false;
      if (
        typeof updateData.isBroadcast === 'boolean' &&
        updateData.isBroadcast !== notification.isBroadcast
      ) {
        notification.isBroadcast = updateData.isBroadcast;
        shouldRegenerateUserNotifications = true;
      }
      if (!notification.isBroadcast && updateData.targetUsers !== undefined) {
        // Only update targetUsers if it's not a broadcast and targetUsers were provided
        const newTargetUserIds = updateData.targetUsers.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
        const existingUsers = await this.databaseService.users
          .find({ _id: { $in: newTargetUserIds } })
          .select('_id')
          .exec();
        if (existingUsers.length !== newTargetUserIds.length) {
          throw new BadRequestException(
            'One or more target user IDs are invalid.',
          );
        }
        // Check if targetUsers array actually changed (deep comparison)
        if (
          JSON.stringify(notification.targetUsers.sort()) !==
          JSON.stringify(newTargetUserIds.sort())
        ) {
          notification.targetUsers = newTargetUserIds;
          shouldRegenerateUserNotifications = true;
        }
      } else if (
        notification.isBroadcast &&
        updateData.targetUsers !== undefined &&
        updateData.targetUsers.length > 0
      ) {
        // If it's a broadcast and now trying to set target users, implies change to targeted
        notification.isBroadcast = false;
        const newTargetUserIds = updateData.targetUsers.map(
          (id) => new mongoose.Types.ObjectId(id),
        );
        const existingUsers = await this.databaseService.users
          .find({ _id: { $in: newTargetUserIds } })
          .select('_id')
          .exec();
        if (existingUsers.length !== newTargetUserIds.length) {
          throw new BadRequestException(
            'One or more target user IDs are invalid.',
          );
        }
        notification.targetUsers = newTargetUserIds;
        shouldRegenerateUserNotifications = true;
      }

      // Apply other updates
      if (updateData.icon !== undefined) notification.icon = updateData.icon;
      if (updateData.title !== undefined) notification.title = updateData.title;
      if (updateData.description !== undefined)
        notification.description = updateData.description;

      await notification.save();
      this.logger.log(
        `Admin notification ${notificationId} updated by ${initiator.email}`,
      );

      // Re-evaluate and update user-specific notifications if broadcast/targetUsers changed
      // This is a complex area and requires careful consideration of what 'update' means for existing user notifications.
      // For a simple approach, you might delete existing UserNotifications for this Notification
      // and recreate them based on the new `isBroadcast` and `targetUsers` settings.
      // This part is crucial for consistency between Notification content and UserNotification instances.
      if (shouldRegenerateUserNotifications) {
        this.logger.debug(
          `Detected changes in broadcast/targetUsers for notification ${notificationId}. Regenerating user notifications.`,
        );
        // 1. Delete all existing userNotification instances for this notification content
        await this.databaseService.userNotifications
          .deleteMany({ notification: notification._id })
          .exec();

        // 2. Recreate userNotification instances based on the new settings
        let usersToNotify: UserDocument[] = [];
        if (notification.isBroadcast) {
          usersToNotify = await this.databaseService.users
            .find()
            .select('_id')
            .exec();
        } else if (notification.targetUsers.length > 0) {
          usersToNotify = await this.databaseService.users
            .find({ _id: { $in: notification.targetUsers } })
            .select('_id')
            .exec();
        }
        const userNotificationPromises = usersToNotify.map((user) =>
          this.databaseService.userNotifications.create({
            user: user._id,
            notification: notification._id,
            read: false, // Newly created are unread
            archived: false,
          }),
        );
        await Promise.all(userNotificationPromises);
        this.logger.debug(
          `Recreated ${userNotificationPromises.length} user-specific notification instances for ${notificationId}.`,
        );
      }

      return notification;
    } catch (error) {
      this.logger.error(
        `Failed to update admin notification ${body.notificationId}:`,
        error,
      );
      throw error;
    }
  }
}
