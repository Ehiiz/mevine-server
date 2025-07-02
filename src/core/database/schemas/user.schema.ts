import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';
import { IAuth, IAccountStatus } from '../../interfaces/shared.interface';
import {
  BlockchainEnum,
  IBankDetails,
  ICryptoDetails,
} from '../../interfaces/user.interface';
import { generateRandomDigits } from 'src/core/utils/random-generator.util';
import { Wallet, WalletDocument, WalletSchema } from './wallet.schema';
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

  activateUser: () => Promise<{ walletId: string; code: string }>;
  createdAt: Date;
  updatedAt: Date;
  wallet: WalletDocument | null;
}

export const UserSchema = SchemaFactory.createForClass(User);

// Virtual for 'wallet'
UserSchema.virtual('wallet', {
  ref: 'Wallet',
  foreignField: 'entity',
  localField: '_id',
  justOne: true,
});

// Fixed activateUser method
UserSchema.methods.activateUser = async function (): Promise<{
  walletId: string;
  code: string;
}> {
  try {
    // Check if user already has a referral code
    if (!this.referralCode) {
      const code = generateRandomDigits();
      this.referralCode = code;
      // Save the user with the new referral code
      await this.save();
    }

    // Use the connection from this document's model
    const WalletModel = this.db.model('Wallet', WalletSchema);

    // Check if wallet already exists to prevent duplicates
    const existingWallet = await WalletModel.findOne({ entity: this._id });

    if (existingWallet) {
      return {
        walletId: existingWallet._id.toString(),
        code: this.referralCode,
      };
    }

    // Create new wallet
    const wallet = await WalletModel.create({
      entity: this._id,
      balance: 0,
    });

    return {
      walletId: wallet._id.toString(),
      code: this.referralCode,
    };
  } catch (error) {
    console.error('Error in activateUser method:', error);
    throw new Error(`Failed to activate user: ${error.message}`);
  }
};

// toJSON configuration
UserSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toHexString();
    delete ret._id;
    delete ret.auth; // Remove sensitive auth data
    return ret;
  },
});
