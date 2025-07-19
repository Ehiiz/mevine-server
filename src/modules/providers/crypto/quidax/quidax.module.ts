import { Module } from '@nestjs/common';
import { QuidaxService } from './quidax.service';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    HttpModule.registerAsync({
      imports: [ConfigModule], // Import ConfigModule to inject ConfigService
      useFactory: async (configService: ConfigService) => ({
        baseURL:
          configService.get<string>('QUIDAX_BASE_URL') ||
          'https://app.quidax.io/api/v1', // Set baseURL here
        headers: {
          // Set Authorization and Content-Type headers globally for this HttpService instance
          Authorization: `Bearer ${configService.get<string>('QUIDAX_API_SECRET_KEY')}`,
          'Content-Type': 'application/json',
        },
      }),
      inject: [ConfigService], // Inject ConfigService into the useFactory
    }),
  ],
  providers: [QuidaxService],
  exports: [QuidaxService],
})
export class QuidaxModule {}
