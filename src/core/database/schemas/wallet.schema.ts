import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

export type WalletDocument = Wallet & Document;

@Schema({ timestamps: true })
export class Wallet {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  entity: mongoose.Types.ObjectId;

  @Prop({
    type: Number,
    default: 0,
  })
  balance: number;

  @Prop({
    type: Boolean,
    default: false,
  })
  restricted: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  active: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const WalletSchema = SchemaFactory.createForClass(Wallet);
