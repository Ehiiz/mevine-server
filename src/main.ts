import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './core/exceptions/http-exception.filter';
import { LoggerInterceptor } from './core/interceptors/logger.interceptor';
import { TransfomerInterceptor } from './core/interceptors/transformer.interceptor';
import { WINSTON_MODULE_PROVIDER } from 'nest-winston';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

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

  // Use Winston as the main NestJS logger
  const winstonLogger = app.get(WINSTON_MODULE_PROVIDER);
  app.useLogger(winstonLogger);

  app.useGlobalFilters(new HttpExceptionFilter(winstonLogger));
  app.useGlobalInterceptors(
    new LoggerInterceptor(),
    new TransfomerInterceptor(),
  );

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
