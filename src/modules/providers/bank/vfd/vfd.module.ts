import { Module } from '@nestjs/common';
import { VFDHttpServiceFactory, VFDService } from './vfd.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import axios from 'axios';

export const WALLETS_HTTP_SERVICE = 'WalletsHttpService';
export const BILLS_HTTP_SERVICE = 'BillsHttpService';

@Module({
  imports: [HttpModule, ConfigModule],
  providers: [VFDHttpServiceFactory, VFDService],
  exports: [VFDService],
})
export class VFDModule {}
