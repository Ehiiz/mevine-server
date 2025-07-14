import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { User } from './schemas/user.schema';
import mongoose, { Model } from 'mongoose';
import { Wallet } from './schemas/wallet.schema';
import { Transaction } from './schemas/transaction.schema';
import { Admin } from './schemas/admin.schema';
import { Kyc } from './schemas/kyc.schema';
import { AdminLog } from './schemas/admin-log.schema';
import { ReferralRecord } from './schemas/referral-record.schema';
import { Notification } from './schemas/notification.schema';
import { Global } from '@nestjs/common';
import { UserNotification } from './schemas/user-notification.schema';

@Global()
@Injectable()
export class DatabaseService {
  constructor(
    // Inject the Mongoose Connection here
    @InjectConnection() private readonly connection: mongoose.Connection,

    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Wallet.name) private readonly walletModel: Model<Wallet>,
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<Notification>,
    @InjectModel(Transaction.name)
    private readonly transactionModel: Model<Transaction>,
    @InjectModel(Admin.name) private readonly adminModel: Model<Admin>,
    @InjectModel(Kyc.name) private readonly kycModel: Model<Kyc>,
    @InjectModel(AdminLog.name) private readonly adminLogModel: Model<AdminLog>,
    @InjectModel(ReferralRecord.name)
    private readonly referralRecordModel: Model<ReferralRecord>,
    @InjectModel(UserNotification.name)
    private readonly userNotificationModel: Model<UserNotification>,
  ) {}
  // Add a getter for the connection
  get connectionInstance(): mongoose.Connection {
    return this.connection;
  }
  get users(): Model<User> {
    return this.userModel;
  }

  get wallets(): Model<Wallet> {
    return this.walletModel;
  }

  get notifications(): Model<Notification> {
    return this.notificationModel;
  }

  get transactions(): Model<Transaction> {
    return this.transactionModel;
  }

  get admins(): Model<Admin> {
    return this.adminModel;
  }

  get adminLogs(): Model<AdminLog> {
    return this.adminLogModel;
  }

  get kyc(): Model<Kyc> {
    return this.kycModel;
  }

  get referralRecords(): Model<ReferralRecord> {
    return this.referralRecordModel;
  }

  get userNotifications(): Model<UserNotification> {
    return this.userNotificationModel;
  }
}
