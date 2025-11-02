import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from 'src/app/app.module';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API')
    .setDescription('Documentación de la API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);
  app.enableCors({
    origin: true,
    credentials: true,
  });
  app.use((req: any, res, next) => {
    let data = '';
    req.on('data', (chunk: Buffer) => (data += chunk.toString()));
    req.on('end', () => {
      console.log('➡️', req.method, req.originalUrl || req.url);
      console.log('🧾 Headers:', req.headers);
      if (data) console.log('📦 RawBody:', data);
      next();
    });
  });
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  await app.listen(3000, '0.0.0.0');
}
bootstrap();
