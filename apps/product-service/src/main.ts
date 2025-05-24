/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { RABBITMQ_CONFIG } from '@shopit/shared';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule, {
    transport: Transport.RMQ,
    options: {
      urls: [RABBITMQ_CONFIG.url],
      queue: RABBITMQ_CONFIG.queues.products,
      queueOptions: RABBITMQ_CONFIG.queueOptions,
      prefetchCount: RABBITMQ_CONFIG.prefetchCount,
    },
  });

  await app.listen();
  Logger.log(
    `🚀 Product service is listening to queue ${RABBITMQ_CONFIG.queues.products}`
  );
}

bootstrap();
