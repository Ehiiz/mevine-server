import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { UserDocument } from './user.schema'; // Assuming User schema path
import { NotificationDocument } from './notification.schema'; // Assuming Notification schema path

export type UserNotificationDocument = UserNotification & Document;

@Schema({ timestamps: true })
export class UserNotification {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true, // Index for efficient lookup by user
  })
  user: mongoose.Types.ObjectId; // The recipient user

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'Notification',
    required: true,
  })
  notification: mongoose.Types.ObjectId; // References the notification content

  @Prop({ type: Boolean, default: false })
  read: boolean; // Has the user read this notification?

  @Prop({ type: Boolean, default: false })
  archived: boolean; // Has the user archived this notification?

  createdAt: Date;
  updatedAt: Date;
}

export const UserNotificationSchema =
  SchemaFactory.createForClass(UserNotification);
