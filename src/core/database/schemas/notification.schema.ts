import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  _id: mongoose.Types.ObjectId;

  @Prop({ type: String })
  icon: string; // Optional icon for the notification

  @Prop({ type: String, required: true })
  title: string; // The main title of the notification

  @Prop({ type: String, required: true })
  description: string; // The detailed description/body of the notification

  @Prop({
    ref: 'Admin',
    type: mongoose.Types.ObjectId,
    required: true, // The admin who created this notification
  })
  initiator: mongoose.Types.ObjectId;

  @Prop({ type: Boolean, default: true })
  isBroadcast: boolean; // True if this notification is meant for all users, false if targeted

  @Prop({
    type: [
      {
        type: mongoose.Types.ObjectId,
        ref: 'User',
      },
    ],
    default: [],
  })
  targetUsers: mongoose.Types.ObjectId[]; // Array of User IDs if isBroadcast is false

  createdAt: Date;
  updatedAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);
