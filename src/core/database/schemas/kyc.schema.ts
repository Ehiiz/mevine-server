import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IKycDocument } from '../../interfaces/kyc.interface';

export type KycDocument = Kyc & Document;

@Schema({ timestamps: true })
export class Kyc {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: [
      {
        documentType: String,
        documentNumber: String,
        documentImage: String,
        verificationStatus: Boolean,
      },
    ],
    default: [],
  })
  document: IKycDocument[];

  createdAt: Date;
  updatedAt: Date;
}

export const KycSchema = SchemaFactory.createForClass(Kyc);
