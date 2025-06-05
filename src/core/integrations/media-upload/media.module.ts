import { Global, Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { CloudinaryService } from './cloudinary.service';

@Global()
@Module({
  providers: [CloudinaryService, MediaService],
  exports: [MediaService, CloudinaryService],
})
export class MediaModule {}
