import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Request } from 'express';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return health status with IP', () => {
      const mockRequest: any = { ip: '127.0.0.1' };

      const result = appController.getHello(mockRequest as Request);

      // 3. Assert the result
      expect(result).toBeDefined();
      expect(result.data).toContain('App is running and healthy as at');
      expect(result.data).toContain('Checked via 127.0.0.1');
      expect(result.message).toBe('Succesfully got app health status');
    });
  });
});
