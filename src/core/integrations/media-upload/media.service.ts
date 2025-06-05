import { Global, Injectable } from '@nestjs/common';
import { CloudinaryService } from './cloudinary.service';
import { Request } from 'express';

@Global()
@Injectable()
export class MediaService {
  constructor(private readonly cloudinaryService: CloudinaryService) {}

  async uploadWithCloudinary(body: { image: Express.Multer.File }) {
    try {
      const image = await this.cloudinaryService.uploadImage(body.image);

      return image;
    } catch (error) {
      throw new Error(error);
    }
  }

  async signatureVerification(body: { request: Request }): Promise<boolean> {
    try {
      const verified = await this.cloudinaryService.verifyNotificationSignature(
        body.request,
      );

      return verified;
    } catch (error) {
      throw new Error(error);
    }
  }

  async uploadVideoWithCloudinary(body: { video: Express.Multer.File }) {
    try {
      const image = await this.cloudinaryService.uploadVideo(body.video);

      return image;
    } catch (error) {
      throw new Error(error);
    }
  }

  async deleteAssetWithCloudinary(body: { publicId: string }) {
    try {
      const image = await this.cloudinaryService.deleteAsset(body.publicId);

      return image;
    } catch (error) {
      throw new Error(error);
    }
  }
}
