import { Module } from '@nestjs/common';
import { VFDHttpServiceFactory, VFDService } from './vfd.service';
import { ConfigModule } from '@nestjs/config';
import { HttpModule } from '@nestjs/axios';

export const WALLETS_HTTP_SERVICE = 'WalletsHttpService';
export const BILLS_HTTP_SERVICE = 'BillsHttpService';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [VFDHttpServiceFactory, VFDService],
  exports: [VFDService],
})
export class VFDModule {}
