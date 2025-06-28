import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from 'src/core/database/database.service'; // Adjust path
import { FlattenedUserNotification } from 'src/core/interfaces/user.interface';
import {
  Notification,
  NotificationDocument,
} from 'src/core/database/schemas/notification.schema'; // Adjust path
import { UserNotificationDocument } from 'src/core/database/schemas/user-notification.schema';
import { UserDocument } from 'src/core/database/schemas/user.schema'; // Adjust path

@Injectable()
export class UserNotificationsService {
  private readonly logger = new Logger(UserNotificationsService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async fetchNotifications(body: {
    user: UserDocument;
    page: number;
    limit: number;
    read?: boolean;
  }): Promise<{
    currentPage: number;
    totalPages: number;
    notifications: FlattenedUserNotification[]; // Use the new flattened type here
    count: number;
    unreadCount: number;
  }> {
    try {
      const { user, page, limit, read } = body;
      const skip = (page - 1) * limit;

      const query: any = { user: user._id };
      if (typeof read === 'boolean') {
        query.read = read;
      }

      const [userNotifications, count, unreadCount] = await Promise.all([
        this.databaseService.userNotifications
          .find(query)
          .populate('notification')
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
        this.databaseService.userNotifications.countDocuments(query),
        this.databaseService.userNotifications.countDocuments({
          user: user._id,
          read: false,
        }),
      ]);

      const notifications: FlattenedUserNotification[] = userNotifications.map(
        (un) => {
          const contentNotification =
            un.notification as unknown as NotificationDocument; // Cast for easier access

          return {
            _id: contentNotification._id.toHexString(), // Convert ObjectId to string
            icon: contentNotification.icon,
            title: contentNotification.title,
            description: contentNotification.description,
            initiator: contentNotification.initiator.toHexString(), // Convert ObjectId to string
            isBroadcast: contentNotification.isBroadcast,
            targetUsers: contentNotification.targetUsers.map((id) =>
              id.toHexString(),
            ), // Map ObjectIds to strings
            createdAt: contentNotification.createdAt,
            updatedAt: contentNotification.updatedAt,
            read: un.read,
            archived: un.archived,
            userNotificationId: un._id.toHexString(),
          };
        },
      );

      return {
        currentPage: page,
        totalPages: Math.ceil(count / limit),
        notifications,
        count,
        unreadCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch notifications for user ${body.user._id}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve notifications.',
      );
    }
  }

  async updateReadStatus(body: {
    user: UserDocument;
    userNotificationId: string;
    read: boolean;
  }): Promise<{
    readStatus: boolean;
    userNotification: UserNotificationDocument;
  }> {
    try {
      const { user, userNotificationId, read } = body;

      const userNotification =
        await this.databaseService.userNotifications.findOne({
          _id: userNotificationId,
          user: user._id,
        });

      if (!userNotification) {
        throw new NotFoundException(
          'User notification not found or does not belong to you.',
        );
      }

      userNotification.read = read;
      await userNotification.save();

      return {
        readStatus: userNotification.read,
        userNotification: userNotification,
      };
    } catch (error) {
      this.logger.error(
        `Failed to update notification status for user ${body.user._id}, notification ${body.userNotificationId}:`,
        error,
      );
      throw error;
    }
  }

  async markAllAsRead(user: UserDocument): Promise<number> {
    try {
      const result = await this.databaseService.userNotifications
        .updateMany({ user: user._id, read: false }, { $set: { read: true } })
        .exec();
      return result.modifiedCount;
    } catch (error) {
      this.logger.error(
        `Failed to mark all notifications as read for user ${user._id}:`,
        error,
      );
      throw new InternalServerErrorException(
        'Failed to mark all notifications as read.',
      );
    }
  }
}
