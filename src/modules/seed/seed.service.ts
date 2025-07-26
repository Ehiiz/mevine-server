import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Model } from 'mongoose';
import { faker } from '@faker-js/faker';
import * as mongoose from 'mongoose';
import { IKycDocument } from 'src/core/interfaces/kyc.interface';
import {
  IAuth,
  IAccountStatus,
  CryptoSettlementStatusEnum,
} from 'src/core/interfaces/shared.interface';
import {
  TransactionTypeEnum,
  TransactionStatusEnum,
  ServiceTypeEnum,
  TransactionEntityTypeEnum,
  TxInfoEnum,
  IMetaInfo,
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
import { CryptoFundTransactionDocument } from 'src/core/database/schemas/crypto-fund-transaction.schema';
import { NotificationDocument } from 'src/core/database/schemas/notification.schema';
import { UserNotificationDocument } from 'src/core/database/schemas/user-notification.schema';

import { BcryptService } from 'src/core/security/bcrypt.service';
import { generateRandomDigits } from 'src/core/utils/random-generator.util';
import { DatabaseService } from 'src/core/database/database.service';

@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);
  private readonly GIFTCARD_IMAGE_URL =
    'https://images.unsplash.com/photo-1753122584290-492f8035a73f?w=800&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxmZWF0dXJlZC1waG90b3MtZmVlZHw0fHx8ZW58MHx8fHx8';

  constructor(
    private readonly databaseService: DatabaseService,
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
    const userCount = await this.databaseService.users.estimatedDocumentCount();
    if (userCount > 0) {
      //  await this.seedTransactions();
      this.logger.log(
        'Database already contains data. Skipping seeding. To re-seed, call clearDatabase() first.',
      );
      return;
    }

    this.logger.log('Seeding new data...');

    // --- Create Admin Users ---
    this.logger.log('Creating admin users...');
    const adminPassword =
      await this.bcryptService.hashPassword('adminpassword123');
    const adminPin = await this.bcryptService.hashPassword('1234');

    const admin1: AdminDocument = await this.databaseService.admins.create({
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

      // Create crypto addresses Map according to the new schema
      const cryptoAddressesMap = new Map<string, ICryptoDetails>();
      Object.values(BlockchainEnum).forEach((blockchain) => {
        cryptoAddressesMap.set(blockchain, {
          address: i % 3 === 0 ? faker.finance.ethereumAddress() : '', // Some users have addresses, some don't
          set: i % 3 === 0, // Corresponding set flag
        });
      });

      const user: UserDocument = await this.databaseService.users.create({
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
        cryptoAddresses: cryptoAddressesMap,
        quidaxId: faker.string.uuid(),
        deleted: false,
        restricted: false,
        referralCode: generateRandomDigits(),
      });
      users.push(user);
      this.logger.log(`User created: ${user.email}`);

      const wallet: WalletDocument = await this.databaseService.wallets.create({
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

      const paidFromMeta: IMetaInfo = {
        entityId: randomUser._id.toHexString(),
        entityType: TransactionEntityTypeEnum.user,
        entityCode: faker.finance.routingNumber(),
        entityNumber: randomUser.phoneNumber || faker.finance.accountNumber(),
        entityName: `${randomUser.firstName} ${randomUser.lastName}`,
      };

      const paidToMeta: IMetaInfo = {
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
        entityName: randomRecipientUser
          ? `${randomRecipientUser.firstName} ${randomRecipientUser.lastName}`
          : faker.company.name(),
      };

      const transaction: TransactionDocument =
        await this.databaseService.transactions.create({
          amount: parseFloat(
            faker.finance.amount({ min: 100, max: 5000, dec: 2 }),
          ),
          user: randomUser._id as any,
          type: faker.helpers.arrayElement(Object.values(TransactionTypeEnum)),
          status: faker.helpers.arrayElement(
            Object.values(TransactionStatusEnum),
          ),
          service: faker.helpers.arrayElement(Object.values(ServiceTypeEnum)),
          meta: {
            paidFrom: paidFromMeta,
            paidTo: paidToMeta,
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

    // --- Create Crypto Fund Transactions ---
    this.logger.log('Creating crypto fund transactions...');
    const cryptoTransactions: CryptoFundTransactionDocument[] = [];
    for (let i = 0; i < 10; i++) {
      const randomUser = faker.helpers.arrayElement(users);
      const cryptoTransaction: CryptoFundTransactionDocument =
        await this.databaseService.cryptoFundTransactions.create({
          senderId: randomUser._id.toHexString(),
          senderWalletAddress: faker.finance.ethereumAddress(),
          destinationWalletAddress: faker.finance.ethereumAddress(),
          amount: faker.finance.amount({ min: 0.001, max: 10, dec: 6 }),
          currency: faker.helpers.arrayElement(['BTC', 'ETH', 'USDT', 'BNB']),
          reference: faker.string.uuid(),
          settlementStatus: faker.helpers.arrayElement(
            Object.values(CryptoSettlementStatusEnum),
          ),
        });
      cryptoTransactions.push(cryptoTransaction);
      this.logger.log(
        `Crypto transaction created for user ${randomUser.email}: ${cryptoTransaction._id}`,
      );
    }

    // --- Create Admin Logs ---
    this.logger.log('Creating admin logs...');
    for (let i = 0; i < 5; i++) {
      await this.databaseService.adminLogs.create({
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

    // --- Create Notifications and User Notifications ---
    this.logger.log(
      'Creating general notifications and user-specific entries...',
    );
    const createdNotifications: NotificationDocument[] = [];

    // 1. Create broadcast notifications
    for (let i = 0; i < 3; i++) {
      const notification = await this.databaseService.notifications.create({
        icon: faker.image.urlLoremFlickr({ category: 'abstract' }),
        title: faker.lorem.sentence(3),
        description: faker.lorem.paragraph(1),
        initiator: faker.helpers.arrayElement([admin1._id, admin2._id]),
        isBroadcast: true,
        targetUsers: [],
      });
      createdNotifications.push(notification);
      this.logger.log(`Broadcast Notification created: ${notification._id}`);

      // Create UserNotification entries for all users for this broadcast
      const userNotificationPromises = users.map((user) =>
        this.databaseService.userNotifications.create({
          user: user._id,
          notification: notification._id,
          read: faker.datatype.boolean(),
          archived: faker.datatype.boolean(),
        }),
      );
      await Promise.all(userNotificationPromises);
      this.logger.log(
        `Created ${userNotificationPromises.length} user notifications for broadcast ${notification._id}`,
      );
    }

    // 2. Create targeted notifications
    for (let i = 0; i < 2; i++) {
      const targetUser = faker.helpers.arrayElement(users);
      const notification = await this.databaseService.notifications.create({
        icon: faker.image.urlLoremFlickr({ category: 'abstract' }),
        title: faker.lorem.sentence(3),
        description: faker.lorem.paragraph(1),
        initiator: faker.helpers.arrayElement([admin1._id, admin2._id]),
        isBroadcast: false,
        targetUsers: [targetUser._id],
      });
      createdNotifications.push(notification);
      this.logger.log(
        `Targeted Notification created: ${notification._id} for user ${targetUser.email}`,
      );

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
        referee: user._id,
      });
      this.logger.log(`Referral record created for user: ${user.email}`);
    }

    this.logger.log('Seeding complete!');
  }

  /**
   * Seeds various transaction types for existing users
   * Can be run independently without full database seeding
   */
  async seedTransactions(numberOfTransactions: number = 50): Promise<void> {
    this.logger.log('Starting transaction seeding...');

    // Get existing users from database
    const users = await this.databaseService.users
      .find({ deleted: false })
      .exec();

    if (users.length === 0) {
      this.logger.error('No users found in database. Please seed users first.');
      return;
    }

    this.logger.log(
      `Found ${users.length} users. Creating ${numberOfTransactions} transactions...`,
    );

    const transactions: TransactionDocument[] = [];

    // Create transactions with different distributions
    const serviceDistribution =
      this.getServiceDistribution(numberOfTransactions);

    for (const [service, count] of serviceDistribution.entries()) {
      for (let i = 0; i < count; i++) {
        const transaction = await this.createTransactionByService(
          service,
          users,
        );
        if (transaction) {
          transactions.push(transaction);
        }
      }
    }

    this.logger.log(`Successfully created ${transactions.length} transactions`);
    this.logTransactionSummary(transactions);
  }

  /**
   * Creates a transaction based on service type
   */
  private async createTransactionByService(
    service: ServiceTypeEnum,
    users: UserDocument[],
  ): Promise<TransactionDocument | null> {
    try {
      const randomUser = faker.helpers.arrayElement(users);

      switch (service) {
        case ServiceTypeEnum.giftcard:
          return await this.createGiftcardTransaction(randomUser);
        case ServiceTypeEnum.transfer:
          return await this.createTransferTransaction(randomUser, users);
        case ServiceTypeEnum.electricity:
          return await this.createElectricityTransaction(randomUser);
        case ServiceTypeEnum.crypto:
          return await this.createCryptoTransaction(randomUser);
        case ServiceTypeEnum.airtime:
          return await this.createAirtimeTransaction(randomUser);
        case ServiceTypeEnum.data:
          return await this.createDataTransaction(randomUser);
        case ServiceTypeEnum.cable:
          return await this.createCableTransaction(randomUser);
        default:
          return await this.createGeneralTransaction(
            randomUser,
            users,
            service,
          );
      }
    } catch (error) {
      this.logger.error(`Error creating ${service} transaction:`, error);
      return null;
    }
  }

  /**
   * Creates a giftcard transaction with proper additional details
   */
  private async createGiftcardTransaction(
    user: UserDocument,
  ): Promise<TransactionDocument> {
    const giftcardTypes = [
      'Amazon',
      'Apple Store',
      'Google Play',
      'Steam',
      'Netflix',
      'Spotify',
      'iTunes',
    ];
    const giftcardType = faker.helpers.arrayElement(giftcardTypes);
    const giftcardCode = `GC-${generateRandomDigits()}-${faker.string.alphanumeric(4).toUpperCase()}`;
    const amount = parseFloat(
      faker.finance.amount({ min: 10, max: 500, dec: 2 }),
    );

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: `GIFT_${faker.string.alphanumeric(8).toUpperCase()}`,
      entityType: TransactionEntityTypeEnum.giftcard,
      entityCode: giftcardType.replace(/\s+/g, '_').toUpperCase(),
      entityNumber: giftcardCode,
      entityName: `${giftcardType} Gift Card - $${amount}`,
    };

    const transaction = await this.databaseService.transactions.create({
      amount: amount,
      user: user._id as any,
      type: faker.helpers.arrayElement([
        TransactionTypeEnum.transfer,
        TransactionTypeEnum.charges,
      ]),
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.giftcard,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.giftcard_code,
          info: giftcardCode,
        },
        {
          title: TxInfoEnum.giftcard_image,
          info: this.GIFTCARD_IMAGE_URL,
        },
        {
          title: TxInfoEnum.general,
          info: `${giftcardType} Gift Card Purchase - Value: $${amount}`,
        },
      ],
    });

    this.logger.log(
      `Giftcard transaction created: ${transaction._id} - ${giftcardType} - Code: ${giftcardCode}`,
    );
    return transaction;
  }

  /**
   * Creates a transfer transaction between users
   */
  private async createTransferTransaction(
    user: UserDocument,
    users: UserDocument[],
  ): Promise<TransactionDocument> {
    const recipient = faker.helpers.arrayElement(
      users.filter((u) => u._id.toString() !== user._id.toString()),
    );

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: recipient._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode:
        recipient.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        recipient.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName:
        recipient.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    return await this.databaseService.transactions.create({
      amount: parseFloat(
        faker.finance.amount({ min: 100, max: 10000, dec: 2 }),
      ),
      user: user._id as any,
      type: faker.helpers.arrayElement([
        TransactionTypeEnum.transfer,
        TransactionTypeEnum.funding,
      ]),
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.transfer,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: `Transfer to ${recipient.firstName} ${recipient.lastName}`,
        },
      ],
    });
  }

  /**
   * Creates an electricity bill payment transaction
   */
  private async createElectricityTransaction(
    user: UserDocument,
  ): Promise<TransactionDocument> {
    const providers = ['EKEDC', 'IKEDC', 'KEDC', 'PHED', 'AEDC'];
    const provider = faker.helpers.arrayElement(providers);
    const meterNumber = faker.finance.accountNumber(10);
    const amount = parseFloat(
      faker.finance.amount({ min: 1000, max: 20000, dec: 2 }),
    );

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: `ELEC_${faker.string.alphanumeric(8).toUpperCase()}`,
      entityType: TransactionEntityTypeEnum.electricity,
      entityCode: provider,
      entityNumber: meterNumber,
      entityName: `${provider} - ₦${amount} - ${meterNumber}`,
    };

    return await this.databaseService.transactions.create({
      amount: amount,
      user: user._id as any,
      type: TransactionTypeEnum.charges,
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.electricity,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: `Electricity bill payment - ${provider} - Meter: ${meterNumber}`,
        },
        {
          title: TxInfoEnum.token,
          info: faker.string.alphanumeric(20).toUpperCase(),
        },
      ],
    });
  }

  /**
   * Creates a crypto transaction
   */
  private async createCryptoTransaction(
    user: UserDocument,
  ): Promise<TransactionDocument> {
    const cryptos = ['BTC', 'ETH', 'USDT', 'BNB'];
    const crypto = faker.helpers.arrayElement(cryptos);
    const cryptoAddress = faker.finance.ethereumAddress();
    const providerAddress = faker.finance.ethereumAddress();

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: user._id.toHexString(), // User ID for crypto transactions
      entityType: TransactionEntityTypeEnum.crypto,
      entityCode: cryptoAddress,
      entityNumber: cryptoAddress,
      entityName: `${providerAddress} - ${user.firstName} ${user.lastName}`,
    };

    return await this.databaseService.transactions.create({
      amount: parseFloat(
        faker.finance.amount({ min: 5000, max: 500000, dec: 2 }),
      ),
      user: user._id as any,
      type: faker.helpers.arrayElement([
        TransactionTypeEnum.transfer,
        TransactionTypeEnum.withdrawal,
      ]),
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.crypto,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: `${crypto} transaction to ${cryptoAddress}`,
        },
      ],
    });
  }

  /**
   * Creates an airtime purchase transaction
   */
  private async createAirtimeTransaction(
    user: UserDocument,
  ): Promise<TransactionDocument> {
    const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
    const network = faker.helpers.arrayElement(networks);
    const phoneNumber = faker.phone.number();
    const amount = parseFloat(
      faker.finance.amount({ min: 100, max: 5000, dec: 0 }),
    );

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: `AIR_${faker.string.alphanumeric(8).toUpperCase()}`,
      entityType: TransactionEntityTypeEnum.airtime,
      entityCode: network,
      entityNumber: phoneNumber,
      entityName: `${network} Airtime`,
    };

    return await this.databaseService.transactions.create({
      amount: amount,
      user: user._id as any,
      type: TransactionTypeEnum.charges,
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.airtime,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: `${network} airtime purchase for ${phoneNumber}`,
        },
      ],
    });
  }

  /**
   * Creates a data purchase transaction
   */
  private async createDataTransaction(
    user: UserDocument,
  ): Promise<TransactionDocument> {
    const networks = ['MTN', 'Airtel', 'Glo', '9mobile'];
    const dataplans = [
      { name: '1GB Monthly', code: '1GB_MONTHLY' },
      { name: '2GB Monthly', code: '2GB_MONTHLY' },
      { name: '5GB Monthly', code: '5GB_MONTHLY' },
      { name: '10GB Monthly', code: '10GB_MONTHLY' },
      { name: '20GB Monthly', code: '20GB_MONTHLY' },
    ];

    const network = faker.helpers.arrayElement(networks);
    const dataplan = faker.helpers.arrayElement(dataplans);
    const phoneNumber = faker.phone.number();

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: `DATA_${faker.string.alphanumeric(8).toUpperCase()}`,
      entityType: TransactionEntityTypeEnum.data,
      entityCode: dataplan.code,
      entityNumber: phoneNumber,
      entityName: dataplan.name,
    };

    return await this.databaseService.transactions.create({
      amount: parseFloat(
        faker.finance.amount({ min: 500, max: 15000, dec: 0 }),
      ),
      user: user._id as any,
      type: TransactionTypeEnum.charges,
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.data,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: `${dataplan.name} data purchase for ${phoneNumber} on ${network}`,
        },
      ],
    });
  }

  /**
   * Creates a cable TV subscription transaction
   */
  private async createCableTransaction(
    user: UserDocument,
  ): Promise<TransactionDocument> {
    const providers = ['DSTV', 'GOTV', 'Startimes'];
    const packages = [
      { name: 'DSTV Premium', code: 'PREM' },
      { name: 'DSTV Compact Plus', code: 'COMPLUS' },
      { name: 'GOTV Supa', code: 'SUPA' },
      { name: 'Startimes Nova', code: 'NOVA' },
    ];

    const provider = faker.helpers.arrayElement(providers);
    const packageInfo = faker.helpers.arrayElement(packages);
    const decoderNumber = faker.finance.accountNumber(10);

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: `CABLE_${faker.string.alphanumeric(8).toUpperCase()}`,
      entityType: TransactionEntityTypeEnum.cable,
      entityCode: packageInfo.code,
      entityNumber: decoderNumber,
      entityName: packageInfo.name,
    };

    return await this.databaseService.transactions.create({
      amount: parseFloat(
        faker.finance.amount({ min: 2000, max: 25000, dec: 0 }),
      ),
      user: user._id as any,
      type: TransactionTypeEnum.charges,
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: ServiceTypeEnum.cable,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: `${packageInfo.name} subscription for decoder ${decoderNumber}`,
        },
      ],
    });
  }

  /**
   * Creates a general transaction for other service types
   */
  private async createGeneralTransaction(
    user: UserDocument,
    users: UserDocument[],
    service: ServiceTypeEnum,
  ): Promise<TransactionDocument> {
    const recipient = faker.helpers.arrayElement(
      users.filter((u) => u._id.toString() !== user._id.toString()),
    );

    const paidFromMeta: IMetaInfo = {
      entityId: user._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode: user.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        user.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName: user.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    const paidToMeta: IMetaInfo = {
      entityId: recipient._id.toHexString(),
      entityType: TransactionEntityTypeEnum.user,
      entityCode:
        recipient.bankDetails?.bankCode || faker.finance.routingNumber(),
      entityNumber:
        recipient.bankDetails?.accountNumber || faker.finance.accountNumber(),
      entityName:
        recipient.bankDetails?.bankName || `${faker.company.name()} Bank`,
    };

    return await this.databaseService.transactions.create({
      amount: parseFloat(faker.finance.amount({ min: 100, max: 5000, dec: 2 })),
      user: user._id as any,
      type: faker.helpers.arrayElement(Object.values(TransactionTypeEnum)),
      status: faker.helpers.arrayElement(Object.values(TransactionStatusEnum)),
      service: service,
      meta: {
        paidFrom: paidFromMeta,
        paidTo: paidToMeta,
      },
      additionalDetails: [
        {
          title: TxInfoEnum.general,
          info: faker.lorem.sentence(),
        },
      ],
    });
  }

  /**
   * Defines the distribution of different service types
   */
  private getServiceDistribution(total: number): Map<ServiceTypeEnum, number> {
    const distribution = new Map<ServiceTypeEnum, number>();

    // Define percentages for each service type
    distribution.set(ServiceTypeEnum.transfer, Math.floor(total * 0.2)); // 20%
    distribution.set(ServiceTypeEnum.giftcard, Math.floor(total * 0.2)); // 20%
    distribution.set(ServiceTypeEnum.electricity, Math.floor(total * 0.15)); // 15%
    distribution.set(ServiceTypeEnum.crypto, Math.floor(total * 0.15)); // 15%
    distribution.set(ServiceTypeEnum.airtime, Math.floor(total * 0.15)); // 15%
    distribution.set(ServiceTypeEnum.data, Math.floor(total * 0.1)); // 10%
    distribution.set(ServiceTypeEnum.cable, Math.floor(total * 0.05)); // 5%

    return distribution;
  }

  /**
   * Logs a summary of created transactions
   */
  private logTransactionSummary(transactions: TransactionDocument[]): void {
    const summary = new Map<ServiceTypeEnum, number>();
    const statusSummary = new Map<TransactionStatusEnum, number>();

    transactions.forEach((tx) => {
      const serviceCount = summary.get(tx.service) || 0;
      summary.set(tx.service, serviceCount + 1);

      const statusCount = statusSummary.get(tx.status) || 0;
      statusSummary.set(tx.status, statusCount + 1);
    });

    this.logger.log('Transaction Summary by Service:');
    summary.forEach((count, service) => {
      this.logger.log(`  ${service}: ${count} transactions`);
    });

    this.logger.log('Transaction Summary by Status:');
    statusSummary.forEach((count, status) => {
      this.logger.log(`  ${status}: ${count} transactions`);
    });
  }

  /**
   * Clears all existing transactions (use with caution)
   */
  async clearAllTransactions(): Promise<void> {
    this.logger.warn('Clearing all transactions...');
    await this.databaseService.transactions.deleteMany({});
    this.logger.warn('All transactions cleared.');
  }
  // --- Utility to clear all collections ---
  async clearDatabase() {
    this.logger.warn('Clearing all collections in the database...');
    await this.databaseService.adminLogs.deleteMany({});
    await this.databaseService.admins.deleteMany({});
    await this.databaseService.kyc.deleteMany({});
    await this.databaseService.notifications.deleteMany({});
    await this.databaseService.userNotifications.deleteMany({});
    await this.databaseService.referralRecords.deleteMany({});
    await this.databaseService.transactions.deleteMany({});
    await this.databaseService.cryptoFundTransactions.deleteMany({}); // NEW: Clear crypto transactions
    await this.databaseService.users.deleteMany({});
    await this.databaseService.wallets.deleteMany({});

    this.logger.warn('Database cleared.');
  }
}
