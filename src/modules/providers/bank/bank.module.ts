import { Module } from '@nestjs/common';
import { VFDModule } from './vfd/vfd.module';
import { VFDHttpServiceFactory, VFDService } from './vfd/vfd.service';

@Module({
  imports: [VFDModule],
  providers: [VFDService, VFDHttpServiceFactory],
  exports: [VFDService],
})
export class BankModule {}
