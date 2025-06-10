import { Prop, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type ReferralRecordDocument = ReferralRecord & Document;

export class ReferralRecord {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
    unique: true,
  })
  referee: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

export const ReferralRecordSchema =
  SchemaFactory.createForClass(ReferralRecord);
