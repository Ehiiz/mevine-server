import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IAccountStatus, IAuth } from '../../interfaces/shared.interface';
import { fa } from '@faker-js/faker/.';

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
    default:
      'https://images.unsplash.com/vector-1745610393550-7a2877ee86d4?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mjh8fGF2YXRhcnxlbnwwfHwwfHx8MA%3D%3D',
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
      completeSetup: {
        type: Boolean,
        default: false,
      },
    },
    default: {
      accountVerified: false,
      completeSetup: false,
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

AdminSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toHexString();
    delete ret._id;
    delete ret.auth; // Remove sensitive auth data
    return ret;
  },
});

AdminSchema.set('toObject', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toHexString();
    delete ret._id;
    delete ret.auth; // Remove sensitive auth data
    return ret;
  },
});
