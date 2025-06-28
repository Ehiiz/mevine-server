import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IAuth, IAccountStatus } from '../../interfaces/shared.interface';
import {
  BlockchainEnum,
  IBankDetails,
  ICryptoDetails,
} from '../../interfaces/user.interface';
import { generateRandomDigits } from 'src/core/utils/random-generator.util';
import { Wallet, WalletSchema } from './wallet.schema';
import { UserMethods } from '../methods/user.methods';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User implements UserMethods {
  _id: mongoose.Types.ObjectId;

  @Prop({
    type: String,
    unique: true,
  })
  email: string;

  @Prop({
    type: String,
  })
  phoneNumber: string;

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
  location: string;

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
      completeSetup: {
        type: Boolean,
        default: false,
      },
    },
    default: {
      accountVerified: false,
      kycVerified: false,
      completeSetup: false,
    },
  })
  accountStatus: IAccountStatus;

  @Prop({
    type: String,
  })
  fcmToken: string;

  @Prop({
    type: {
      accountNumber: String,
      bankName: String,
      bankCode: String,
    },
  })
  bankDetails: IBankDetails;

  @Prop({
    type: [
      {
        blockchain: { type: String, enum: Object.values(BlockchainEnum) },
        address: String,
      },
    ],
  })
  cryptoAddresses: ICryptoDetails[];

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

  @Prop({
    type: String,
  })
  referralCode: string;

  activateUser: () => { walletId: string; code: string };
  createdAt: Date;
  updatedAt: Date;
  wallet: Wallet;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual for 'wallet' remains the same
UserSchema.virtual('wallet', {
  ref: 'Wallet',
  foreignField: 'entity',
  localField: '_id',
  justOne: true,
});

// Method for 'activateUser' remains the same
UserSchema.methods.activateUser = async function () {
  const walletModel = mongoose.model(Wallet.name, WalletSchema);

  const code = generateRandomDigits();
  this.referralCode = code;
  const wallet = await walletModel.create({
    entity: this._id,
    balance: 0,
  });

  return { walletId: wallet._id, code };
};

// --- Add this toJSON configuration ---
UserSchema.set('toJSON', {
  virtuals: true, // Ensure virtuals are included (like 'id' from '_id')
  transform: (doc, ret) => {
    // Convert _id to id string
    ret.id = ret._id.toHexString();
    delete ret._id; // Remove _id

    // Remove sensitive fields
    delete ret.auth; // Remove the entire auth object
    // You can also remove other sensitive fields if needed, e.g.:
    // delete ret.fcmToken;
    // delete ret.bankDetails; // If bank details are considered sensitive in the general profile view
    // delete ret.cryptoAddresses; // If crypto addresses are sensitive

    return ret;
  },
});
