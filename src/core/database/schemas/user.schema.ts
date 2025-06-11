import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IAuth, IAccountStatus } from '../interfaces/shared.interface';
import {
  BlockchainEnum,
  IBankDetails,
  ICryptoDetails,
} from '../interfaces/user.interface';
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
    unique: true,
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

UserSchema.virtual('wallet', {
  ref: 'Wallet',
  foreignField: 'entity',
  localField: '_id',
  justOne: true,
});

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
