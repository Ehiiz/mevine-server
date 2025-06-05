import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { BullModule } from '@nestjs/bullmq';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: `.env${process.env.NODE_ENV ? `.${process.env.NODE_ENV}` : ''}`,
    }),
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
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
