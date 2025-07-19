import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, mongo } from 'mongoose';
import { CryptoSettlementStatusEnum } from 'src/core/interfaces/shared.interface';

export type CryptoFundTransactionDocument =
  HydratedDocument<CryptoFundTransaction>;

@Schema({ timestamps: true })
export class CryptoFundTransaction {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    required: true,
  })
  senderId: string;

  @Prop({
    type: String,
    required: true,
  })
  senderWalletAddress: string;

  @Prop({
    type: String,
    required: true,
  })
  destinationWalletAddress: string;

  @Prop({
    type: String,
    required: true,
  })
  amount: string;

  @Prop({
    type: String,
    required: true,
  })
  currency: string;

  @Prop({
    type: String,
    required: true,
  })
  reference: string;

  @Prop({
    type: String,
    enum: Object.values(CryptoSettlementStatusEnum),
    default: CryptoSettlementStatusEnum.PENDING,
  })
  settlementStatus: CryptoSettlementStatusEnum;

  createdAt: Date;
  updatedAt: Date;
}

export const CryptoFundTransactionSchema = SchemaFactory.createForClass(
  CryptoFundTransaction,
);
