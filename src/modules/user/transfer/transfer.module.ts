import { Module } from '@nestjs/common';
import { UserTransferService } from './transfer.service';
import { UserTransferController } from './transfer.controller';

@Module({
  controllers: [UserTransferController],
  providers: [UserTransferService],
})
export class UserTransferModule {}
