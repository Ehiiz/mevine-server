import { Module } from '@nestjs/common';

import { SeedService } from './seed.service';
import { BcryptService } from 'src/core/security/bcrypt.service';

@Module({
  imports: [],
  providers: [SeedService, BcryptService],
  exports: [SeedService], // Export SeedService if you want to call its methods manually
})
export class SeedModule {}
