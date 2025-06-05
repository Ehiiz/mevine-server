import { BadRequestException, Global, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import {
  v2 as cloudinary,
  UploadApiOptions,
  UploadApiResponse,
} from 'cloudinary';
import { Readable } from 'stream';

@Global()
@Injectable()
export class CloudinaryService {
  constructor(private readonly configService: ConfigService) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  async uploadImage(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Create a readable stream from the buffer
      const stream = new Readable();
      stream.push(file.buffer);
      stream.push(null);

      // Upload the image
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: 'optolearn/images', overwrite: true },
        (error, result) => {
          if (error) {
            console.error('Error uploading image to Cloudinary:', error);
            return reject(error);
          }

          resolve(result!);
        },
      );

      // Pipe the stream to the upload stream
      stream.pipe(uploadStream);
    });
  }

  async uploadVideo(file: Express.Multer.File): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Validate file
      if (!file || !file.buffer) {
        return reject(new Error('Invalid file or empty buffer'));
      }

      // Ensure buffer is a Buffer
      const videoBuffer = Buffer.from(file.buffer as unknown as Uint8Array);

      // Configure upload options
      const uploadOptions: UploadApiOptions = {
        folder: 'optolearn/videos',
        resource_type: 'video',
        overwrite: true,
        chunk_size: 6_000_000,
        timeout: 180000,
      };

      // Create upload stream
      const uploadStream = cloudinary.uploader.upload_stream(
        uploadOptions,
        (error, result) => {
          if (error) {
            console.error('Cloudinary Upload Error:', error);
            return reject(error);
          }

          if (!result) {
            return reject(new Error('No result returned from Cloudinary'));
          }

          console.log('Successful Upload:', {
            publicId: result.public_id,
            url: result.url,
          });

          resolve(result);
        },
      );

      // Pipe the buffer to the upload stream
      uploadStream.end(videoBuffer);
    });
  }

  async deleteAsset(publicId: string): Promise<UploadApiResponse> {
    return new Promise((resolve, reject) => {
      // Validate the publicId
      if (!publicId) {
        reject(new Error('Public ID is required to delete an asset.'));
        return;
      }

      // Call Cloudinary's destroy method
      cloudinary.uploader.destroy(publicId, (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve(result);
        }
      });
    });
  }

  async verifyNotificationSignature(req: Request): Promise<boolean> {
    const { 'x-cld-timestamp': timestamp, 'x-cld-signature': signature } =
      req.headers;
    const payload = req.body;

    if (!timestamp || !signature) {
      throw new BadRequestException('Missing signature or timestamp headers.');
    }

    try {
      // Verify the signature using Cloudinary's utility
      const isValidSignature = cloudinary.utils.verifyNotificationSignature(
        JSON.stringify(payload), // Raw payload
        parseInt(timestamp.toString()), // Timestamp as a string
        String(signature), // Signature to compare against
        //secret: process.env.CLOUDINARY_API_SECRET, // Cloudinary secret
      );

      if (!isValidSignature) {
        throw new BadRequestException('Invalid webhook signature.');
      }

      return true;
    } catch (error) {
      throw new BadRequestException(
        `Webhook verification failed: ${error.message}`,
      );
    }
  }
}
