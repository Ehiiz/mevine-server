import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type NotificationDocument = Notification & Document;

@Schema({ timestamps: true })
export class Notification {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: String,
  })
  icon: string;

  @Prop({
    type: String,
  })
  title: string;

  @Prop({
    type: String,
  })
  description: string;

  @Prop({
    ref: 'Admin',
    type: mongoose.Types.ObjectId,
  })
  initiator: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const NoficationSchema = SchemaFactory.createForClass(Notification);
