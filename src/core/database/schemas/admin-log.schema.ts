import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type AdminLogDocument = AdminLog & Document;

export class AdminLog {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  action: string;

  @Prop({
    ref: 'Admin',
    type: mongoose.Types.ObjectId,
  })
  initiator: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const AdminLogSchema = SchemaFactory.createForClass(AdminLog);
