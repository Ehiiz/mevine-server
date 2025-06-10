import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { User } from './user.schema';
import {
  IMetaInfo,
  TransactionEntityTypeEnum,
  TxInfoEnum,
  ServiceTypeEnum,
  TransactionTypeEnum,
  TranscationStatusEnum,
} from '../interfaces/transaction.interface';

export type TransactionDocument = Transaction & Document;

@Schema({ timestamps: true })
export class Transaction {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  amount: number;

  @Prop({
    type: mongoose.Types.ObjectId,
    ref: 'User',
  })
  user: User;

  @Prop({
    type: String,
    enum: Object.values(TransactionTypeEnum),
    default: TransactionTypeEnum.transfer,
  })
  type: TransactionTypeEnum;

  @Prop({
    type: String,
    enum: Object.values(TranscationStatusEnum),
    default: TranscationStatusEnum.initiated,
  })
  status: TranscationStatusEnum;

  @Prop({
    type: String,
    enum: Object.values(ServiceTypeEnum),
    default: ServiceTypeEnum.transfer,
  })
  service: ServiceTypeEnum;

  @Prop({
    type: {
      paidFrom: {
        entityId: String,

        entityType: {
          type: String,
          enum: Object.values(TransactionEntityTypeEnum),
        },

        entityCode: String,

        entityNumber: String,

        entityName: String,
      },
      paidTo: {
        entityId: String,

        entityType: {
          type: String,
          enum: Object.values(TransactionEntityTypeEnum),
        },

        entityCode: String,

        entityNumber: String,

        entityName: String,
      },
    },
  })
  meta: {
    paidFrom: IMetaInfo;
    paidTo: IMetaInfo;
  };

  @Prop({
    type: [
      {
        title: {
          type: String,
          enum: Object.values(TxInfoEnum),
        },
        info: String,
      },
    ],
  })
  additionalDetails: { title: TxInfoEnum; info: string }[];

  createdAt: Date;
  updatedAt: Date;
}

export const TransactionSchema = SchemaFactory.createForClass(Transaction);
