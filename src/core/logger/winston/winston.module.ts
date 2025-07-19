import { Global, Module } from '@nestjs/common';
import { WinstonNestJSLogger } from './winston-nestjs-logger.service';

@Global()
@Module({
  providers: [WinstonNestJSLogger],
  exports: [WinstonNestJSLogger],
})
export class WinstonModule {}
