import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { MulterModule } from '@nestjs/platform-express';
import { EmailQueueModule } from './core/integrations/emails/email-queue.module';
import { FirebaseModule } from './core/integrations/firebase/firebase.module';
import { FcmModule } from './core/integrations/fcm/fcm.module';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { LoggerModule } from './core/logger/logger.module';
import { FatalErrorMailTransport } from './core/logger/fatal-error-mail.transport';
import { format, transports } from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';
import { BankModule } from './modules/providers/bank/bank.module';
import { VFDModule } from './modules/providers/bank/vfd/vfd.module';
import { RouterModule } from '@nestjs/core';
import { AdminUserModule } from './modules/admin/user/admin-user.module';
import { AdminTransactionModule } from './modules/admin/transaction/admin-transaction.module';
import { AdminAuthModule } from './modules/admin/auth/admin-auth.module';
import { UserAuthModule } from './modules/user/auth/user-auth.module';
import { UserProfileModule } from './modules/user/profile/user-profile.module';
import { UserTransactionModule } from './modules/user/transaction/user-transaction.module';
import { UserTransferModule } from './modules/user/transfer/transfer.module';
import { DatabaseModule } from './core/database/database.module';
import { SeedModule } from './modules/seed/seed.module';
import { UserNotificationsModule } from './modules/user/notification/user-notification.module';
import { AdminNotificationModule } from './modules/admin/notification/admin-notification.module';
import { QuidaxModule } from './modules/providers/crypto/quidax/quidax.module';
import { WebhookModule } from './modules/webhook/webhook.module';
import { QuidaxQueueModule } from './modules/providers/crypto/quidax/processor/quidax-queue.module';
import { VFDQueueModule } from './modules/providers/bank/vfd/processor/vfd-queue.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`,
    }),
    ScheduleModule.forRoot(),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
          console.error('JWT_SECRET is not defined in environment variables!');
          throw new Error('JWT_SECRET environment variable is required.');
        }
        return {
          secret: secret,
          global: true,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION') || '365d',
          },
        };
      },
      global: true,
      inject: [ConfigService],
    }),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        return {
          connection: {
            url:
              configService.get<string>('REDIS_URL') ||
              'redis://localhost:6379',
          },
          defaultJobOptions: {
            removeOnComplete: true,
            removeOnFail: false,
            attempts: 3,
          },
        };
      },
      inject: [ConfigService],
    }),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        try {
          return {
            dest: './uploads',
            filename: (req, file, cb) => {
              console.log(file);
              const filename = `${Date.now()}-${file.originalname}`;
              console.log(filename);
              cb(null, filename);
            },
            limits: {
              fileSize: configService.get<number>('MAX_FILE_SIZE')!,
              files: configService.get<number>('MAX_FILES')!,
            },
          };
        } catch (error) {
          console.error(error);
          return {
            dest: './uploads',
            filename: (req, file, cb) => {
              console.log(file);
              const filename = `${Date.now()}-${file.originalname}`;
              console.log(filename);
              cb(null, filename);
            },
            limits: {
              fileSize: configService.get<number>('MAX_FILE_SIZE')!,
              files: configService.get<number>('MAX_FILES')!,
            },
          };
        }
      },
      inject: [ConfigService],
    }),
    WinstonModule.forRootAsync({
      imports: [LoggerModule],
      inject: [FatalErrorMailTransport],
      useFactory: (fatalErrorTransport: FatalErrorMailTransport) => ({
        level: 'info',
        format: format.combine(
          format.timestamp(),
          format.errors({ stack: true }),
          format.splat(),
          format.json(),
        ),
        transports: [
          new transports.Console({
            format: format.combine(format.colorize(), format.simple()),
          }),
          new DailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
          }),
          // Daily rotating file for error logs
          new DailyRotateFile({
            level: 'error',
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
          }),
          fatalErrorTransport,
        ],
      }),
    }),
    RouterModule.register([
      {
        path: 'user',
        children: [
          {
            path: 'auth',
            module: UserAuthModule,
          },
          {
            path: 'profile',
            module: UserProfileModule,
          },
          {
            path: 'transaction',
            module: UserTransactionModule,
          },
          {
            path: 'transfer',
            module: UserTransferModule,
          },
          {
            path: 'notification',
            module: UserNotificationsModule,
          },
        ],
      },
    ]),
    RouterModule.register([
      {
        path: 'admin',
        children: [
          {
            path: 'user',
            module: AdminUserModule,
          },
          {
            path: 'transaction',
            module: AdminTransactionModule,
          },
          {
            path: 'auth',
            module: AdminAuthModule,
          },
          {
            path: 'notification',
            module: AdminNotificationModule,
          },
        ],
      },
    ]),
    // FirebaseModule,

    DatabaseModule,
    EmailQueueModule,
    FcmModule,
    VFDModule,
    BankModule,
    VFDQueueModule,
    UserAuthModule,
    UserProfileModule,
    UserTransactionModule,
    UserTransferModule,
    UserNotificationsModule,
    AdminAuthModule,
    AdminTransactionModule,
    AdminUserModule,
    AdminNotificationModule,
    QuidaxModule,
    WebhookModule,
    QuidaxQueueModule,
    ...(process.env.NODE_ENV === 'development' ? [SeedModule] : []),
  ],
  controllers: [AppController],
  providers: [AppService, JwtService],
})
export class AppModule {}
