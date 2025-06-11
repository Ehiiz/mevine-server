import { Module } from '@nestjs/common';
import { VFDHttpServiceFactory, VFDService } from './vfd.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import axios from 'axios';

export const WALLETS_HTTP_SERVICE = 'WalletsHttpService';
export const BILLS_HTTP_SERVICE = 'BillsHttpService';

// @Module({
//   imports: [HttpModule],
//   providers: [
//     {
//       provide: WALLETS_HTTP_SERVICE,
//       useFactory: (configService: ConfigService) => {
//         return new HttpService(
//           axios.create({
//             baseURL: configService.get<string>('VFD_WALLETS_BASE_URL') ?? '',
//             headers: {
//               'Content-Type': 'application/json',
//               AccessToken:
//                 configService.get<string>('WALLET_ACCESS_TOKEN') ?? '',
//             },
//             timeout: 30000,
//             maxRedirects: 5,
//           }),
//         );
//       },
//       inject: [ConfigService],
//     },

//     {
//       provide: BILLS_HTTP_SERVICE,
//       useFactory: (configService: ConfigService) => {
//         return new HttpService(
//           axios.create({
//             baseURL:
//               configService.get<string>('VFD_BILLSPAYMENT_BASE_URL') ?? '',
//             headers: {
//               'Content-Type': 'application/json',
//               AccessToken:
//                 configService.get<string>('BILLS_ACCESS_TOKEN') ?? '',
//             },
//             timeout: 30000,
//             maxRedirects: 5,
//           }),
//         );
//       },
//       inject: [ConfigService],
//     },
//     VFDService,
//   ],
//   exports: [VFDService],
// })
// export class VFDModule {}

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [VFDHttpServiceFactory, VFDService],
  exports: [VFDService],
})
export class VFDModule {}
