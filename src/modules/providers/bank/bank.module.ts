import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpModule, HttpService } from '@nestjs/axios';
import { VFDService } from './vfd/vfd.service';
import axios from 'axios';
import { VFDModule } from './vfd/vfd.module';

@Module({
  imports: [VFDModule],
  providers: [],
  exports: [],
})
export class BankModule {}
