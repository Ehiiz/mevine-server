import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { DatabaseService } from './database.service';
import { User, UserSchema } from './schemas/user.schema';
import { Transaction, TransactionSchema } from './schemas/transaction.schema';
import { Wallet, WalletSchema } from './schemas/wallet.schema';
import { Admin, AdminSchema } from './schemas/admin.schema';
import { AdminLog, AdminLogSchema } from './schemas/admin-log.schema';
import {
  ReferralRecord,
  ReferralRecordSchema,
} from './schemas/referral-record.schema';
import { Kyc, KycSchema } from './schemas/kyc.schema';
import {
  UserNotification,
  UserNotificationSchema,
} from './schemas/user-notification.schema';
import {
  Notification,
  NotificationSchema,
} from './schemas/notification.schema';

@Global()
@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          uri:
            configService.get<string>('MONGODB_URI') ||
            'mongodb://localhost:27017/mevinve',
          //  options: { useNewUrlParser: true, useUnifiedTopology: true },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: Wallet.name,
        schema: WalletSchema,
      },
      {
        name: Transaction.name,
        schema: TransactionSchema,
      },
      {
        name: Admin.name,
        schema: AdminSchema,
      },
      {
        name: AdminLog.name,
        schema: AdminLogSchema,
      },
      {
        name: ReferralRecord.name,
        schema: ReferralRecordSchema,
      },
      {
        name: Kyc.name,
        schema: KycSchema,
      },
      {
        name: Notification.name,
        schema: NotificationSchema,
      },

      {
        name: UserNotification.name,
        schema: UserNotificationSchema,
      },
    ]),
  ],
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
