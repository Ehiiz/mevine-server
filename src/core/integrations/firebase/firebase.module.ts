// src/core/integrations/firebase/firebase.module.ts
import { Module, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Module({})
export class FirebaseModule implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    // Make sure your .env file has these variables
    const firebaseConfig = {
      projectId: this.configService.get<string>('FIREBASE_PROJECT_ID'),
      privateKey: this.configService
        .get<string>('FIREBASE_PRIVATE_KEY')!
        .replace(/\\n/g, '\n'),
      clientEmail: this.configService.get<string>('FIREBASE_CLIENT_EMAIL'),
    };

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(firebaseConfig),
      });
      console.log('Firebase Admin Initialized.');
    }
  }
}
