import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Model } from 'mongoose'; // Still need Model type for type hints
import { faker } from '@faker-js/faker';
import * as mongoose from 'mongoose';
import { IKycDocument } from 'src/core/interfaces/kyc.interface';
import { IAuth, IAccountStatus } from 'src/core/interfaces/shared.interface';
import {
  TransactionTypeEnum,
  TransactionStatusEnum,
  ServiceTypeEnum,
  TransactionEntityTypeEnum,
  TxInfoEnum,
} from 'src/core/interfaces/transaction.interface';
import {
  BlockchainEnum,
  IBankDetails,
  ICryptoDetails,
} from 'src/core/interfaces/user.interface';
import { AdminDocument } from 'src/core/database/schemas/admin.schema';
import { KycDocument } from 'src/core/database/schemas/kyc.schema';
import { TransactionDocument } from 'src/core/database/schemas/transaction.schema';
import { UserDocument } from 'src/core/database/schemas/user.schema';
import { WalletDocument } from 'src/core/database/schemas/wallet.schema';
// Import the new NotificationDocument and UserNotificationDocument types
import { NotificationDocument } from 'src/core/database/schemas/notification.schema';
import { UserNotificationDocument } from 'src/core/database/schemas/user-notification.schema';

import { BcryptService } from 'src/core/security/bcrypt.service';
import { generateRandomDigits } from 'src/core/utils/random-generator.util';
import { DatabaseService } from 'src/core/database/database.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly databaseService: DatabaseService, // Inject DatabaseService
    private readonly bcryptService: BcryptService,
  ) {}

  async onModuleInit() {
    if (process.env.NODE_ENV === 'development') {
      this.logger.log('Starting database seeding...');
      await this.seed();
      this.logger.log('Database seeding completed.');
    } else {
      this.logger.log(
        'Skipping database seeding in non-development environment.',
      );
    }
  }

  async seed() {
    // Use databaseService.users to check count
    const userCount = await this.databaseService.users.estimatedDocumentCount();
    if (userCount > 0) {
      this.logger.log(
        'Database already contains data. Skipping seeding. To re-seed, call clearDatabase() first.',
      );
      return;
    }

    this.logger.log('Seeding new data...');

    // Clear existing data (optional, useful for fresh starts)
    // await this.clearDatabase(); // Note: clearDatabase method also needs to use DatabaseService

    // --- Create Admin Users ---
    this.logger.log('Creating admin users...');
    const adminPassword =
      await this.bcryptService.hashPassword('adminpassword123');
    const adminPin = await this.bcryptService.hashPassword('1234');

    const admin1: AdminDocument = await this.databaseService.admins.create({
      // Use databaseService.admins
      email: 'admin@mevine.com',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatar: faker.image.avatar(),
      auth: {
        password: adminPassword,
        transactionPin: adminPin,
        accountVerificationToken: null,
        passwordResetToken: null,
        verificationTokenExpiration: null,
        tokenExpiration: null,
        loginVerificationToken: null,
        loginTokenExpiration: null,
      },
      accountStatus: {
        accountVerified: true,
        kycVerified: true,
      },
      deleted: false,
      restricted: false,
    });
    this.logger.log(`Admin 1 created: ${admin1.email}`);

    const admin2: AdminDocument = await this.databaseService.admins.create({
      // Use databaseService.admins
      email: 'moderator@mevine.com',
      firstName: faker.person.firstName(),
      lastName: faker.person.lastName(),
      avatar: faker.image.avatar(),
      auth: {
        password: adminPassword,
        transactionPin: adminPin,
        accountVerificationToken: null,
        passwordResetToken: null,
        verificationTokenExpiration: null,
        tokenExpiration: null,
        loginVerificationToken: null,
        loginTokenExpiration: null,
      },
      accountStatus: {
        accountVerified: true,
        kycVerified: false,
      },
      deleted: false,
      restricted: false,
    });
    this.logger.log(`Admin 2 created: ${admin2.email}`);

    // --- Create Regular Users and Wallets ---
    this.logger.log('Creating regular users and their wallets...');
    const users: UserDocument[] = [];
    const wallets: WalletDocument[] = [];
    const numUsers = 5;

    for (let i = 0; i < numUsers; i++) {
      const userPassword =
        await this.bcryptService.hashPassword('userpassword123');
      const userPin = await this.bcryptService.hashPassword('5678');
      const verificationCode = generateRandomDigits();
      const hashedVerificationCode =
        await this.bcryptService.hashPassword(verificationCode);

      const userAuth: IAuth = {
        password: userPassword,
        transactionPin: userPin,
        accountVerificationToken: hashedVerificationCode,
        verificationTokenExpiration: faker.date.future({ years: 1 }),
        passwordResetToken: null,
        tokenExpiration: null,
        loginVerificationToken: null,
        loginTokenExpiration: null,
      };

      const userAccountStatus: IAccountStatus = {
        accountVerified: i % 2 === 0,
        kycVerified: false,
        completeSetup: i % 2 === 0,
      };

      const userBankDetails: IBankDetails = {
        accountNumber: faker.finance.accountNumber(10),
        bankName: faker.company.name() + ' Bank',
        bankCode: faker.finance.routingNumber(),
        accountName: faker.person.fullName(),
        bvn: faker.finance.accountNumber(11),
      };

      // const userCryptoDetails: ICryptoDetails[] = [
      //   {
      //     blockchain: BlockchainEnum.bitcoin,
      //     address: faker.finance.ethereumAddress(),
      //   },
      //   {
      //     blockchain: BlockchainEnum.ethereum,
      //     address: faker.finance.ethereumAddress(),
      //   },
      // ];

      const user: UserDocument = await this.databaseService.users.create({
        // Use databaseService.users
        email: faker.internet.email(),
        phoneNumber: faker.phone.number({ style: 'international' }),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        location: faker.location.city(),
        avatar: faker.image.avatar(),
        auth: userAuth,
        accountStatus: userAccountStatus,
        fcmToken: faker.string.alphanumeric(20),
        bankDetails: userBankDetails,
        //  cryptoAddresses: userCryptoDetails,
        deleted: false,
        restricted: false,
        referralCode: generateRandomDigits(),
      });
      users.push(user);
      this.logger.log(`User created: ${user.email}`);

      const wallet: WalletDocument = await this.databaseService.wallets.create({
        // Use databaseService.wallets
        entity: user._id,
        balance: faker.finance.amount({
          min: 100,
          max: 10000,
          dec: 2,
        }),
        restricted: false,
        active: true,
      });
      wallets.push(wallet);
      this.logger.log(`Wallet created for user ${user.email}: ${wallet._id}`);
    }

    // --- Create KYC Records ---
    this.logger.log('Creating KYC records...');
    const kycRecords: KycDocument[] = [];
    for (const user of users) {
      if (user.accountStatus.kycVerified) {
        const kycDocument: IKycDocument[] = [
          {
            documentType: faker.helpers.arrayElement([
              "Driver's License",
              'National ID',
              'Passport',
            ]),
            documentNumber: faker.finance.accountNumber(10),
            documentImage: faker.image.urlLoremFlickr({ category: 'abstract' }),
            verificationStatus: true,
          },
        ];
        const kyc = await this.databaseService.kyc.create({
          // Use databaseService.kyc
          document: kycDocument,
        });
        kycRecords.push(kyc);
        this.logger.log(`KYC record created: ${kyc._id}`);
      }
    }

    // --- Create Transactions ---
    this.logger.log('Creating transactions...');
    const transactions: TransactionDocument[] = [];
    for (let i = 0; i < 20; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const randomRecipientUser = faker.helpers.arrayElement(
        users.filter((u) => u._id.toString() !== randomUser._id.toString()),
      );

      const transaction: TransactionDocument =
        await this.databaseService.transactions.create({
          // Use databaseService.transactions
          amount: faker.finance.amount({
            min: 100,
            max: 5000,
            dec: 2,
          }),
          user: randomUser._id as any,
          type: faker.helpers.arrayElement(Object.values(TransactionTypeEnum)),
          status: faker.helpers.arrayElement(
            Object.values(TransactionStatusEnum),
          ),
          service: faker.helpers.arrayElement(Object.values(ServiceTypeEnum)),
          meta: {
            paidFrom: {
              entityId: randomUser._id.toHexString(),
              entityType: TransactionEntityTypeEnum.user,
              entityCode: faker.finance.routingNumber(),
              entityNumber:
                randomUser.phoneNumber || faker.finance.accountNumber(),
              entityName: `${randomUser.firstName} ${randomUser.lastName}`,
            },
            paidTo: {
              entityId: randomRecipientUser
                ? randomRecipientUser._id.toHexString()
                : faker.string.uuid(),
              entityType: randomRecipientUser
                ? TransactionEntityTypeEnum.user
                : faker.helpers.arrayElement(
                    Object.values(TransactionEntityTypeEnum),
                  ),
              entityCode: faker.finance.routingNumber(),
              entityNumber: faker.finance.accountNumber(),
              entityName: faker.company.name(),
            },
          },
          additionalDetails: [
            { title: TxInfoEnum.general, info: faker.lorem.sentence() },
          ],
        });
      transactions.push(transaction);
      this.logger.log(
        `Transaction created for user ${randomUser.email}: ${transaction._id}`,
      );
    }

    // --- Create Admin Logs ---
    this.logger.log('Creating admin logs...');
    for (let i = 0; i < 5; i++) {
      await this.databaseService.adminLogs.create({
        // Use databaseService.adminLogs
        action: faker.helpers.arrayElement([
          'User blocked',
          'User unblocked',
          'Transaction reviewed',
          'KYC approved',
          'KYC rejected',
        ]),
        initiator: faker.helpers.arrayElement([admin1._id, admin2._id]),
      });
    }

    // --- Create Notifications (Content) and User Notifications (User-specific status) ---
    this.logger.log(
      'Creating general notifications and user-specific entries...',
    );
    const createdNotifications: NotificationDocument[] = [];

    // 1. Create some broadcast notifications
    for (let i = 0; i < 3; i++) {
      const notification = await this.databaseService.notifications.create({
        icon: faker.image.urlLoremFlickr({ category: 'abstract' }),
        title: faker.lorem.sentence(3),
        description: faker.lorem.paragraph(1),
        initiator: faker.helpers.arrayElement([admin1._id, admin2._id]),
        isBroadcast: true, // This is a broadcast notification
        targetUsers: [],
      });
      createdNotifications.push(notification);
      this.logger.log(`Broadcast Notification created: ${notification._id}`);

      // Create UserNotification entries for all users for this broadcast
      const userNotificationPromises = users.map((user) =>
        this.databaseService.userNotifications.create({
          user: user._id,
          notification: notification._id,
          read: faker.datatype.boolean(), // Randomly mark some as read
          archived: faker.datatype.boolean(), // Randomly mark some as archived
        }),
      );
      await Promise.all(userNotificationPromises);
      this.logger.log(
        `Created ${userNotificationPromises.length} user notifications for broadcast ${notification._id}`,
      );
    }

    // 2. Create some targeted notifications
    for (let i = 0; i < 2; i++) {
      const targetUser = faker.helpers.arrayElement(users); // Pick a specific user to target
      const notification = await this.databaseService.notifications.create({
        icon: faker.image.urlLoremFlickr({ category: 'abstract' }),
        title: faker.lorem.sentence(3),
        description: faker.lorem.paragraph(1),
        initiator: faker.helpers.arrayElement([admin1._id, admin2._id]),
        isBroadcast: false, // This is a targeted notification
        targetUsers: [targetUser._id], // Target only this user
      });
      createdNotifications.push(notification);
      this.logger.log(
        `Targeted Notification created: ${notification._id} for user ${targetUser.email}`,
      );

      // Create a single UserNotification entry for the targeted user
      await this.databaseService.userNotifications.create({
        user: targetUser._id,
        notification: notification._id,
        read: faker.datatype.boolean(),
        archived: faker.datatype.boolean(),
      });
      this.logger.log(
        `Created 1 user notification for targeted notification ${notification._id}`,
      );
    }

    // --- Create Referral Records ---
    this.logger.log('Creating referral records...');
    for (const user of users) {
      await this.databaseService.referralRecords.create({
        // Use databaseService.referralRecords
        referee: user._id,
      });
      this.logger.log(`Referral record created for user: ${user.email}`);
    }

    this.logger.log('Seeding complete!');
  }

  // --- Utility to clear all collections (use with caution!) ---
  async clearDatabase() {
    this.logger.warn('Clearing all collections in the database...');
    // Access models directly through databaseService for clearing
    await this.databaseService.adminLogs.deleteMany({});
    await this.databaseService.admins.deleteMany({});
    await this.databaseService.kyc.deleteMany({});
    await this.databaseService.notifications.deleteMany({});
    await this.databaseService.userNotifications.deleteMany({}); // NEW: Clear UserNotifications
    await this.databaseService.referralRecords.deleteMany({});
    await this.databaseService.transactions.deleteMany({});
    await this.databaseService.users.deleteMany({});
    await this.databaseService.wallets.deleteMany({});

    this.logger.warn('Database cleared.');
  }
}
