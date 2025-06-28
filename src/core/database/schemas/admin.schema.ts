import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IAccountStatus, IAuth } from '../../interfaces/shared.interface';

export type AdminDocument = Admin & Document;

@Schema({ timestamps: true })
export class Admin {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    unique: true,
    required: true,
  })
  email: string;

  @Prop({
    type: String,
  })
  firstName: string;

  @Prop({
    type: String,
  })
  lastName: string;

  @Prop({
    type: String,
  })
  avatar: string;

  @Prop({
    type: {
      password: String,
      transactionPin: String,
      accountVerificationToken: String,
      loginVerificationToken: String,
      passwordResetToken: String,
      verificationTokenExpiration: Date,
      tokenExpiration: Date,
      loginTokenExpiration: Date,
    },
  })
  auth: IAuth;

  @Prop({
    type: {
      accountVerified: {
        type: Boolean,
        default: false,
      },
      kycVerified: {
        type: Boolean,
        default: false,
      },
    },
    default: {
      accountVerified: false,
      kycVerified: false,
    },
  })
  accountStatus: Omit<IAccountStatus, 'kycVerified'>;

  @Prop({
    type: Boolean,
    default: false,
  })
  deleted: boolean;

  @Prop({
    type: Boolean,
    default: false,
  })
  restricted: boolean;

  createdAt: Date;
  updatedAt: Date;
}

export const AdminSchema = SchemaFactory.createForClass(Admin);
