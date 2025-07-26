// src/admin/admin-notifications/admin-notifications.service.ts (Augmented)
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
import { FcmProducerService } from 'src/core/integrations/fcm/fcm-producer.service';
import { GeneralNotificationFcmEvent } from 'src/core/integrations/fcm/fcm.utils'; // Import the new event class
import { WinstonNestJSLogger } from 'src/core/logger/winston/winston-nestjs-logger.service';

@Injectable()
export class AdminNotificationsService {
  constructor(
    private readonly databaseService: DatabaseService,
    private readonly fcmProducerService: FcmProducerService,
    private readonly logger: WinstonNestJSLogger,
  ) {
    this.logger.setContext(AdminNotificationsService.name);
  }

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
        // Fetch users to verify existence and get their FCM tokens
        const existingUsers = await this.databaseService.users
          .find({ _id: { $in: targetUsers } })
          .select('_id fcmToken') // Select fcmToken as well
          .exec();

        if (existingUsers.length !== targetUsers.length) {
          throw new BadRequestException(
            'One or more target user IDs are invalid or not found.',
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
      this.logger.debug(
        `Creating user notifications for content: ${newNotification._id}`,
      );

      let usersToNotify: UserDocument[] = [];
      if (newNotification.isBroadcast) {
        usersToNotify = await this.databaseService.users
          .find({ fcmToken: { $ne: null, $exists: true } }) // Only users with FCM tokens
          .select('_id fcmToken') // Select fcmToken
          .exec();
      } else if (newNotification.targetUsers.length > 0) {
        usersToNotify = await this.databaseService.users
          .find({
            _id: { $in: newNotification.targetUsers },
            fcmToken: { $ne: null, $exists: true },
          }) // Filter by targetUsers and existing FCM tokens
          .select('_id fcmToken') // Select fcmToken
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

      // --- Send FCM Notifications via Queue (NEW) ---
      const fcmJobPromises = usersToNotify
        .filter((user) => user.fcmToken) // Ensure user has an FCM token
        .map(async (user) => {
          const fcmEvent = new GeneralNotificationFcmEvent(
            user.fcmToken,
            newNotification.title,
            newNotification.description,
            newNotification._id.toString(), // Pass the notification ID
          );
          // Add the job to the BullMQ queue
          await this.fcmProducerService.handleFcmEvent(fcmEvent);
          this.logger.debug(
            `Queued FCM for user ${user._id} with token ${user.fcmToken}`,
          );
        });
      await Promise.all(fcmJobPromises);
      this.logger.log(`Queued ${fcmJobPromises.length} FCM messages.`);
      // --- End FCM Notification Sending ---

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
          .populate('targetUsers', 'firstName lastName email') // Populate targetUsers details
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.databaseService.notifications.countDocuments(query), // Count documents based on the query
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
            .find({ fcmToken: { $ne: null, $exists: true } }) // Only users with FCM tokens
            .select('_id fcmToken')
            .exec();
        } else if (notification.targetUsers.length > 0) {
          usersToNotify = await this.databaseService.users
            .find({
              _id: { $in: notification.targetUsers },
              fcmToken: { $ne: null, $exists: true },
            })
            .select('_id fcmToken')
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

        // Re-send FCM notifications for updated targets
        const fcmJobPromises = usersToNotify
          .filter((user) => user.fcmToken)
          .map(async (user) => {
            const fcmEvent = new GeneralNotificationFcmEvent(
              user.fcmToken,
              notification.title,
              notification.description,
              notification._id.toString(),
            );
            await this.fcmProducerService.handleFcmEvent(fcmEvent);
            this.logger.debug(
              `Re-queued FCM for user ${user._id} after update.`,
            );
          });
        await Promise.all(fcmJobPromises);
        this.logger.log(
          `Re-queued ${fcmJobPromises.length} FCM messages after update.`,
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
