import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './core/exceptions/http-exception.filter';
import { LoggerInterceptor } from './core/interceptors/logger.interceptor';
import { TransfomerInterceptor } from './core/interceptors/transformer.interceptor';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

// Import Bull Board related modules
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Queue } from 'bullmq'; // Import Queue from bullmq

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // --- Swagger Setup ---
  const config = new DocumentBuilder()
    .setTitle('Mevine API')
    .setVersion('1.0')
    .addBearerAuth()
    .setDescription(
      'API for Mevine, a social media platform for sharing and discovering memes',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  // --- Winston Logger Setup ---
  // Use Winston as the main NestJS logger
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
  app.useLogger(winstonLogger);

  // --- Global Filters and Interceptors ---
  app.useGlobalFilters(new HttpExceptionFilter(winstonLogger));
  app.useGlobalInterceptors(
    new LoggerInterceptor(winstonLogger),
    new TransfomerInterceptor(),
  );

  // --- BullMQ UI Setup ---
  const serverAdapter = new ExpressAdapter();
  // Set the base path where the Bull Board UI will be accessible
  serverAdapter.setBasePath('/admin/queues');

  // Instantiate your BullMQ queue directly to pass to Bull Board.
  // Ensure the connection details here match what you've configured
  // in your BullModule.forRoot() in AppModule for the 'emails' queue.
  const emailQueue = new Queue('emails', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost', // Get from env or default
      port: parseInt(process.env.REDIS_PORT || '6379', 10), // Get from env or default
    },
  });

  const quidaxQueue = new Queue('quidax-process', {
    connection: {
      host: process.env.REDIS_HOST || 'localhost', // Get from env or default
      port: parseInt(process.env.REDIS_PORT || '6379', 10), // Get from env or default
    },
  });

  // Create the Bull Board instance and register your queue(s)
  createBullBoard({
    queues: [new BullMQAdapter(emailQueue), new BullMQAdapter(quidaxQueue)],
    serverAdapter,
  });

  // Apply the Bull Board router as NestJS middleware
  app.use('/admin/queues', serverAdapter.getRouter()); // <-- CORRECTED LINE

  // --- Application Listening ---
  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(`Swagger UI available at: ${await app.getUrl()}/api-docs`);
  console.log(`BullMQ UI available at: ${await app.getUrl()}/admin/queues`);
}
bootstrap();
