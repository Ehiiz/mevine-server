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
          'https://api.quidax.com/api/v1', // Set baseURL here
        timeout: configService.get<number>('HTTP_TIMEOUT') || 5000, // Set timeout from .env or default to 5000ms
        maxRedirects: configService.get<number>('HTTP_MAX_REDIRECTS') || 5, // Set maxRedirects from .env or default to 5
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
