import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
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
        const secret = configService.get<string>('JWT_SECRET')!;
        return {
          secret: secret,
          global: true,
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRATION') || '1h',
          },
        };
      },
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
    // FirebaseModule,
    EmailQueueModule,
    FcmModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
